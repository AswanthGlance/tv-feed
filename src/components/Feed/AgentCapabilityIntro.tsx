/**
 * AgentCapabilityIntro
 *
 * Phase machine:
 *   ENTER      → bg dims; mascot + CTA pill slide up from bottom together
 *   STATUS     → "I'm processing this…" text fades in below the row
 *   TOOLS      → capability pills pop around the mascot head in random order
 *   SELECTING  → non-search pills fade out; "Searching…" highlights + moves closer
 *   THINKING   → mascot switches to thinking mode
 *   COMPLETE   → onComplete() fires
 */

import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import AgentMascot from '../Shared/AgentMascot';

const W = 1920;
const H = 1080;

const MASCOT_SIZE = 88;

/* Where the mascot+CTA row lands (stage-center coords) */
const LAND_X = -560;   // left of center
const LAND_Y = +260;   // lower third

/* CTA sits to the right of the mascot */
const CTA_GAP = 20;
const CTA_H   = 56;

/* Timing (ms) */
const T_ENTER     = 700;
const T_STATUS    = 380;
const T_BEAT      = 220;
const T_POP       = 280;
const T_STAGGER   =  90;
const T_HOLD      = 460;
const T_SELECT    = 380;
const T_THINKING  = 900;

/* ── Tool definitions (index 0 = the one agent picks) ─────────────── */
const TOOLS = [
  { id: 'search',      label: 'Searching...',     icon: 'search'      }, // SELECTED
  { id: 'products',    label: 'Finding Products', icon: 'products'    },
  { id: 'places',      label: 'Finding Places',   icon: 'places'      },
  { id: 'weather',     label: 'Checking Weather', icon: 'weather'     },
  { id: 'route',       label: 'Mapping Route',    icon: 'route'       },
  { id: 'events',      label: 'Finding Events',   icon: 'events'      },
  { id: 'scores',      label: 'Checking Scores',  icon: 'scores'      },
  { id: 'personalize', label: 'Personalizing...', icon: 'personalize' },
];

const SELECTED_IDX = 0;

/* Pill positions relative to mascot center — tight orbit around the head.
   Head sits in the top ~55% of the mascot component, so offset y by -10.     */
const HEAD_DY = -10;
const PILL_OFFSETS = [
  { x:  +10, y: -148 },  // 0: directly above          ← SELECTED
  { x: +148, y:  -90 },  // 1: upper right
  { x: -148, y:  -90 },  // 2: upper left
  { x: +172, y:  +18 },  // 3: right
  { x: -172, y:  +18 },  // 4: left
  { x: +130, y: +110 },  // 5: lower right
  { x:  -50, y: +158 },  // 6: lower center-left
  { x: -135, y: +108 },  // 7: lower left
];

/* Fisher-Yates shuffle — deterministic per session start */
function shuffleIndices(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ── Inline SVG icons ──────────────────────────────────────────────── */
function ToolIcon({ type, size = 20 }: { type: string; size?: number }) {
  const base = {
    width: size, height: size,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: 'currentColor' as const,
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    flexShrink: 0 as const,
  };
  switch (type) {
    case 'search':
      return <svg {...base}><circle cx="10.5" cy="10.5" r="6.5"/><line x1="15.5" y1="15.5" x2="21" y2="21"/><path d="M4.5 3l.4 1.6L6.5 5l-1.6.4L4.5 7 4.1 5.4 2.5 5l1.6-.4Z" fill="white" stroke="none"/></svg>;
    case 'products':
      return <svg {...base}><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>;
    case 'places':
      return <svg {...base}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>;
    case 'weather':
      return <svg {...base}><path d="M12 3v1.5M17.6 5.4l-1.1 1.1M20 11h-1.5"/><path d="M9 9.5a3.5 3.5 0 013.5-3.5 3.5 3.5 0 012 6.5H6.5A3 3 0 016.5 6a3 3 0 012.5 1.5z"/></svg>;
    case 'route':
      return <svg {...base}><path d="M3 7l6-4 6 4 6-4v14l-6 4-6-4-6 4V7z"/><line x1="9" y1="3" x2="9" y2="17" strokeDasharray="2 2.5"/><line x1="15" y1="7" x2="15" y2="21" strokeDasharray="2 2.5"/></svg>;
    case 'events':
      return <svg {...base}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
    case 'scores':
      return <svg {...base}><path d="M8 21h8M12 17v4M7 4h10v8a5 5 0 01-10 0V4z"/><path d="M7 4H4a3 3 0 003 3M17 4h3a3 3 0 01-3 3"/></svg>;
    case 'personalize':
    default:
      return <svg {...base}><path d="M12 2l2.1 7.9L22 12l-7.9 2.1L12 22l-2.1-7.9L2 12l7.9-2.1Z" fill="white" stroke="none"/><path d="M5.5 5.5l.35 1.3 1.3.35-1.3.35-.35 1.3-.35-1.3-1.3-.35 1.3-.35Z" fill="white" stroke="none" opacity="0.7"/></svg>;
  }
}

/* ── Component ─────────────────────────────────────────────────────── */
type Props = {
  ctaLabel:   string;
  onComplete: () => void;
};

export default function AgentCapabilityIntro({ ctaLabel, onComplete }: Props) {
  const [phase, setPhase] = useState<'ENTER'|'STATUS'|'TOOLS'|'SELECTING'|'THINKING'|'COMPLETE'>('ENTER');

  const dimRef      = useRef<HTMLDivElement>(null);
  const mascotRef   = useRef<HTMLDivElement>(null);
  const ctaPillRef  = useRef<HTMLDivElement>(null);
  const statusRef   = useRef<HTMLDivElement>(null);
  const toolRefs    = useRef<(HTMLDivElement | null)[]>([]);
  const overlayRef  = useRef<HTMLDivElement>(null);

  /* Stable shuffled pop order — computed once on mount */
  const popOrder = useRef<number[]>(shuffleIndices(TOOLS.length));

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const delay = (ms: number) =>
      new Promise<void>(res => { const t = setTimeout(res, ms); timers.push(t); });

    async function run() {
      if (!mascotRef.current || !ctaPillRef.current || !statusRef.current) return;

      /* CTA pill measured width — approximate; pill renders off-screen first */
      const ctaW = ctaPillRef.current.offsetWidth || 220;
      const ctaX = LAND_X + MASCOT_SIZE / 2 + CTA_GAP + ctaW / 2;
      const ctaY = LAND_Y;
      const statusY = LAND_Y + MASCOT_SIZE / 2 + 28;

      /* Off-screen bottom start position (below stage) */
      const offY = H / 2 + 160;

      /* ── Init ────────────────────────────────────────────────── */
      gsap.set(mascotRef.current,  { x: LAND_X, y: offY, xPercent: -50, yPercent: -50, opacity: 1 });
      gsap.set(ctaPillRef.current, { x: ctaX,   y: offY, xPercent: -50, yPercent: -50, opacity: 1 });
      gsap.set(statusRef.current,  { x: LAND_X + (ctaX - LAND_X) / 2, y: statusY, xPercent: -50, yPercent: -50, opacity: 0 });

      toolRefs.current.forEach((el, i) => {
        if (!el) return;
        const ox = LAND_X + PILL_OFFSETS[i].x;
        const oy = LAND_Y + HEAD_DY + PILL_OFFSETS[i].y;
        gsap.set(el, { x: ox, y: oy, xPercent: -50, yPercent: -50, scale: 0, opacity: 0 });
      });

      /* ── ENTER: dim + mascot + CTA slide up from bottom ─────── */
      gsap.to(dimRef.current, { opacity: 1, duration: T_ENTER / 1000, ease: 'power2.out' });

      gsap.to(mascotRef.current, {
        y: LAND_Y,
        duration: T_ENTER / 1000,
        ease: 'power3.out',
      });
      gsap.to(ctaPillRef.current, {
        y: ctaY,
        duration: T_ENTER / 1000,
        ease: 'power3.out',
        delay: 0.04,  // tiny stagger so mascot leads slightly
      });

      await delay(T_ENTER + T_BEAT);
      if (cancelled) return;

      /* ── STATUS: "I'm processing this…" ─────────────────────── */
      setPhase('STATUS');
      gsap.to(statusRef.current, { opacity: 1, duration: T_STATUS / 1000, ease: 'power2.out' });

      await delay(T_STATUS + T_BEAT);
      if (cancelled) return;

      /* ── TOOLS: pills pop in random order around the head ───── */
      setPhase('TOOLS');

      popOrder.current.forEach((toolIdx, popStep) => {
        const el = toolRefs.current[toolIdx];
        if (!el) return;
        gsap.to(el, {
          opacity: 1,
          scale: 1,
          duration: T_POP / 1000,
          ease: 'back.out(2.2)',
          delay: (popStep * T_STAGGER) / 1000,
        });
      });

      const totalPopMs = T_POP + (TOOLS.length - 1) * T_STAGGER;
      await delay(totalPopMs + T_HOLD);
      if (cancelled) return;

      /* ── SELECTING: dismiss others, agent picks "Searching…" ── */
      setPhase('SELECTING');

      toolRefs.current.forEach((el, i) => {
        if (!el || i === SELECTED_IDX) return;
        gsap.to(el, {
          opacity: 0, scale: 0.5,
          duration: T_SELECT / 1000,
          ease: 'power2.in',
          delay: Math.random() * 0.08,
        });
      });

      const searchEl = toolRefs.current[SELECTED_IDX];
      if (searchEl) {
        /* Nudge the selected pill 12px closer toward the mascot (downward) */
        gsap.to(searchEl, {
          y: LAND_Y + HEAD_DY + PILL_OFFSETS[SELECTED_IDX].y + 14,
          scale: 1.12,
          filter: 'drop-shadow(0 0 18px rgba(167,134,229,1)) drop-shadow(0 0 36px rgba(112,71,226,0.55))',
          duration: 0.38,
          ease: 'power2.out',
        });
      }

      await delay(T_SELECT + 200);
      if (cancelled) return;

      /* ── THINKING ─────────────────────────────────────────────── */
      setPhase('THINKING');

      if (searchEl) {
        gsap.to(searchEl, {
          scale: 1.06, duration: 0.55,
          ease: 'sine.inOut', yoyo: true, repeat: -1,
        });
      }

      await delay(T_THINKING);
      if (cancelled) return;

      setPhase('COMPLETE');
      onComplete();
    }

    run();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      gsap.killTweensOf([
        dimRef.current, mascotRef.current, ctaPillRef.current,
        statusRef.current, overlayRef.current,
        ...toolRefs.current,
      ]);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const agentMode = phase === 'THINKING' ? 'thinking' : 'looking';

  return (
    <div
      ref={overlayRef}
      style={{ position: 'absolute', inset: 0, zIndex: 200, overflow: 'hidden', pointerEvents: 'all' }}
    >
      {/* Dim overlay */}
      <div ref={dimRef} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.68)',
        opacity: 0, pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Capability pills — orbit around the mascot head */}
      {TOOLS.map((tool, i) => (
        <div
          key={tool.id}
          ref={el => { toolRefs.current[i] = el; }}
          style={{
            position: 'absolute', top: '50%', left: '50%',
            zIndex: 8,
            display: 'inline-flex', alignItems: 'center', gap: 9,
            height: 46,
            paddingLeft: 13, paddingRight: 18,
            borderRadius: 999,
            background: i === SELECTED_IDX
              ? 'rgba(167,134,229,0.22)'
              : 'rgba(40,40,48,0.72)',
            border: `1.5px solid ${i === SELECTED_IDX
              ? 'rgba(167,134,229,0.65)'
              : 'rgba(255,255,255,0.14)'}`,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            color: '#fff',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            willChange: 'transform, opacity, filter',
          }}
        >
          <ToolIcon type={tool.icon} size={18} />
          <span style={{
            fontSize: 15, fontWeight: 600,
            fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
            color: i === SELECTED_IDX ? 'rgba(220,200,255,0.95)' : 'rgba(255,255,255,0.82)',
            letterSpacing: '0.01em',
          }}>
            {tool.label}
          </span>
        </div>
      ))}

      {/* Mascot */}
      <div ref={mascotRef} style={{
        position: 'absolute', top: '50%', left: '50%',
        zIndex: 12, willChange: 'transform',
      }}>
        <AgentMascot agentMode={agentMode} size={MASCOT_SIZE} />
      </div>

      {/* CTA pill — slides up alongside the mascot */}
      <div ref={ctaPillRef} style={{
        position: 'absolute', top: '50%', left: '50%',
        zIndex: 12,
        display: 'inline-flex', alignItems: 'center',
        height: CTA_H,
        paddingLeft: 8, paddingRight: 24,
        borderRadius: 999,
        background: 'rgba(255,255,255,0.96)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.20), 0 0 28px 6px rgba(112,71,226,0.32)',
        whiteSpace: 'nowrap', pointerEvents: 'none',
        willChange: 'transform',
        gap: 0,
      }}>
        {/* Mini mascot inside CTA */}
        <div style={{ width: 44, height: 44, flexShrink: 0, marginRight: 10 }}>
          <AgentMascot agentMode="looking" size={44} />
        </div>
        <span style={{
          fontSize: 17, fontWeight: 600, color: '#111',
          fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
          whiteSpace: 'nowrap',
        }}>
          {ctaLabel}
        </span>
      </div>

      {/* Status text — "I'm processing this…" */}
      <div ref={statusRef} style={{
        position: 'absolute', top: '50%', left: '50%',
        zIndex: 12,
        opacity: 0,
        fontSize: 17, fontStyle: 'italic', fontWeight: 400,
        color: 'rgba(255,255,255,0.58)',
        fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        willChange: 'opacity',
      }}>
        I'm processing this…
      </div>
    </div>
  );
}
