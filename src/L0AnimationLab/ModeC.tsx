/* Mode C — Agent Reveals Thought
   The traveling mascot sweeps line by line, revealing chars blur→sharp as it passes.
   Lines unlock one at a time — next line's chars are invisible until mascot arrives.
   Between lines: smooth GSAP arc (no teleport).
   After all lines: mascot fades out, unified CTA sequence fires.

   Layout: mascot travels over the text block. A separate static mascot is NOT
   shown beside the text — the traveling mascot IS the agent presence. */

import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import LabColumn, { REASONING_TEXT } from './LabColumn';
import type { ColumnState } from './LabColumn';
import AgentMascot from '../components/Shared/AgentMascot';
import type { AgentMode } from '../components/Shared/AgentMascot';
import { triggerCTA } from './useCTASequence';

const CHAR_SPEED_MS = 42;   // ms per character
const REVEAL_RADIUS = 40;   // px: blur-to-sharp band half-width
const LINE_MERGE_PX = 8;    // px: y-tolerance for grouping chars onto same line

type CharPos   = { cx: number; cy: number };
type LineGroup = number[];

function groupIntoLines(positions: (CharPos | null)[]): LineGroup[] {
  const rows = new Map<number, number[]>();
  positions.forEach((pos, i) => {
    if (!pos) return;
    const bucket = Math.round(pos.cy / LINE_MERGE_PX) * LINE_MERGE_PX;
    if (!rows.has(bucket)) rows.set(bucket, []);
    rows.get(bucket)!.push(i);
  });
  return Array.from(rows.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, idxs]) => idxs);
}

export default function ModeC() {
  const [state, setState]             = useState<ColumnState>('idle');
  const [agentMode, setAgentMode]     = useState<AgentMode>('thinking');
  const [ctaVisible, setCtaVisible]   = useState(false);
  const [mascotInCTA, setMascotInCTA] = useState(false);
  const [mascotVisible, setMascotVisible] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const charRefs     = useRef<(HTMLSpanElement | null)[]>([]);
  const mascotRef    = useRef<HTMLDivElement | null>(null);
  const tweenRef     = useRef<gsap.core.Tween | gsap.core.Timeline | null>(null);

  const chars = Array.from(REASONING_TEXT);

  const cleanup = useCallback(() => {
    tweenRef.current?.kill();
    tweenRef.current = null;
  }, []);

  const resetAllChars = useCallback(() => {
    charRefs.current.forEach(el => {
      if (el) gsap.set(el, { opacity: 0, filter: 'blur(10px)' });
    });
  }, []);

  // Sweep mascot across one line; calls onComplete when done
  const sweepLine = useCallback((
    lineChars: LineGroup,
    positions: (CharPos | null)[],
    onComplete: () => void,
  ) => {
    const linePosArr = lineChars.map(i => positions[i]);
    const duration   = lineChars.length * (CHAR_SPEED_MS / 1000);
    const proxy      = { t: 0 };

    tweenRef.current = gsap.to(proxy, {
      t: 1,
      duration,
      ease: 'none',
      onUpdate() {
        const charIdx = proxy.t * lineChars.length;
        const lo   = Math.max(0, Math.floor(charIdx));
        const hi   = Math.min(lineChars.length - 1, lo + 1);
        const frac = charIdx - lo;

        const pLo = linePosArr[lo];
        const pHi = linePosArr[hi] ?? pLo;
        if (!pLo || !pHi) return;

        const mx = pLo.cx + (pHi.cx - pLo.cx) * frac;
        const my = pLo.cy + (pHi.cy - pLo.cy) * frac;

        if (mascotRef.current) gsap.set(mascotRef.current, { x: mx, y: my });

        lineChars.forEach((globalIdx, j) => {
          const pos = linePosArr[j];
          const el  = charRefs.current[globalIdx];
          if (!pos || !el) return;

          const dx = pos.cx - mx;
          if (dx >= REVEAL_RADIUS) return;

          const ratio = Math.min(1, Math.max(0, (REVEAL_RADIUS - dx) / (2 * REVEAL_RADIUS)));
          gsap.set(el, {
            filter:  `blur(${(1 - ratio) * 10}px)`,
            opacity: 0.15 + 0.57 * ratio,
          });
        });
      },
      onComplete() {
        lineChars.forEach(i => {
          const el = charRefs.current[i];
          if (el) gsap.set(el, { filter: 'blur(0px)', opacity: 0.72 });
        });
        onComplete();
      },
    });
  }, []);

  // Curved arc between lines — no snapping
  const arcTo = useCallback((tx: number, ty: number, onArrived: () => void) => {
    if (!mascotRef.current) { onArrived(); return; }
    const sx = Number(gsap.getProperty(mascotRef.current, 'x')) || 0;
    const sy = Number(gsap.getProperty(mascotRef.current, 'y')) || 0;

    const midX = sx + (tx - sx) * 0.25;
    const midY = sy + (ty - sy) * 0.5 - Math.abs(ty - sy) * 0.3;

    tweenRef.current = gsap.timeline({ onComplete: onArrived })
      .to(mascotRef.current, {
        keyframes: [
          { x: midX, y: midY, duration: 0.22, ease: 'power1.in'  },
          { x: tx,   y: ty,   duration: 0.22, ease: 'power2.out' },
        ],
      });
  }, []);

  const run = useCallback(() => {
    cleanup();
    resetAllChars();
    setMascotVisible(false);
    setCtaVisible(false);
    setMascotInCTA(false);
    setAgentMode('thinking');
    setState('idle');

    setTimeout(() => {
      setState('running');

      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (!containerRef.current) return;
        const cRect = containerRef.current.getBoundingClientRect();

        const positions: (CharPos | null)[] = charRefs.current.map(el => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return {
            cx: r.left + r.width  / 2 - cRect.left,
            cy: r.top  + r.height / 2 - cRect.top,
          };
        });

        const lines = groupIntoLines(positions);
        if (!lines.length) return;

        const startLine = (lineIdx: number) => {
          const lineChars = lines[lineIdx];
          const firstPos  = lineChars.map(i => positions[i]).find(p => p !== null);
          if (!firstPos) return;

          const beginReveal = () => {
            // Unlock only this line as blurred — ahead lines remain opacity 0
            lineChars.forEach(i => {
              const el = charRefs.current[i];
              if (el) gsap.set(el, { opacity: 0.15, filter: 'blur(10px)' });
            });

            sweepLine(lineChars, positions, () => {
              if (lineIdx + 1 < lines.length) {
                const nextFirstPos = lines[lineIdx + 1].map(i => positions[i]).find(p => p !== null);
                if (!nextFirstPos) { startLine(lineIdx + 1); return; }
                setTimeout(() => {
                  arcTo(nextFirstPos.cx, nextFirstPos.cy, () => startLine(lineIdx + 1));
                }, 260);
              } else {
                // All lines done — fade mascot, then unified CTA
                if (mascotRef.current) {
                  gsap.to(mascotRef.current, {
                    opacity: 0, scale: 0.7, duration: 0.35, ease: 'power2.in',
                    onComplete: () => setMascotVisible(false),
                  });
                }
                triggerCTA({ setAgentMode, setCtaVisible, setMascotInCTA, setState });
              }
            });
          };

          if (lineIdx === 0) {
            // Place and fade-in mascot at line start before sweeping
            if (mascotRef.current) {
              gsap.set(mascotRef.current, { x: firstPos.cx, y: firstPos.cy, opacity: 0, scale: 0.7 });
            }
            setMascotVisible(true);
            requestAnimationFrame(() => {
              if (mascotRef.current) {
                gsap.to(mascotRef.current, {
                  opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out',
                  onComplete: beginReveal,
                });
              } else {
                beginReveal();
              }
            });
          } else {
            beginReveal();
          }
        };

        startLine(0);
      }));
    }, 400);
  }, [cleanup, resetAllChars, sweepLine, arcTo]);

  useEffect(() => { run(); return cleanup; }, []);

  return (
    <LabColumn
      label="Agent Reveals Thought"
      modeTag="Mode C"
      state={state}
      agentMode={agentMode}
      ctaVisible={ctaVisible}
      mascotInCTA={mascotInCTA}
      onReplay={run}
      renderReasoning={() => (
        <div ref={containerRef} style={{ position: 'relative' }}>
          <p style={{
            margin:     0,
            fontSize:   19,
            lineHeight: 1.6,
            color:      'rgba(255,255,255,0.72)',
            fontFamily: '"SF Pro Text", "Inter", system-ui, sans-serif',
            fontWeight: 400,
            letterSpacing: 0.1,
            position:   'relative',
            zIndex:     1,
          }}>
            {chars.map((ch, i) => (
              <span
                key={i}
                ref={el => { charRefs.current[i] = el; }}
                style={{
                  display:    'inline',
                  whiteSpace: ch === ' ' ? 'pre' : 'normal',
                  opacity:    0,
                  filter:     'blur(10px)',
                  willChange: 'filter, opacity',
                }}
              >{ch}</span>
            ))}
          </p>

          {/* Traveling mascot — GSAP drives x/y; container anchored top-left */}
          {mascotVisible && (
            <div
              ref={mascotRef}
              style={{
                position:      'absolute',
                top:           0,
                left:          0,
                transform:     'translate(-50%, -50%)',
                pointerEvents: 'none',
                zIndex:        10,
              }}
            >
              <div style={{
                position:      'absolute',
                inset:         -22,
                borderRadius:  '50%',
                background:    'radial-gradient(circle, rgba(168,120,255,0.32) 0%, transparent 68%)',
                animation:     'modeC-glow 1.4s ease-in-out infinite',
                pointerEvents: 'none',
              }} />
              <AgentMascot agentMode={agentMode} size={32} />
            </div>
          )}

          <style>{`
            @keyframes modeC-glow {
              0%, 100% { opacity: 0.65; transform: scale(0.88); }
              50%       { opacity: 1;   transform: scale(1.18); }
            }
          `}</style>
        </div>
      )}
    />
  );
}
