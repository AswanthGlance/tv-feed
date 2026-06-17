import { useEffect, useState } from 'react';
import gsap from 'gsap';
import AgentMascot from '../Shared/AgentMascot';
import type { AgentMode } from '../Shared/AgentMascot';
import { BorderBeam } from 'border-beam';

function getCtx() {
  return typeof window !== 'undefined' ? (window as any).GLANCE_CTX ?? {} : {};
}

type Segment = { text: string; hl: boolean };

const HIGHLIGHT: React.CSSProperties = {
  fontWeight: 700,
  color: 'rgba(255,255,255,0.98)',
  textShadow: '0 0 12px rgba(192,132,252,0.9), 0 0 28px rgba(112,71,226,0.6)',
};

function lineLen(segs: Segment[]) {
  return segs.reduce((n, s) => n + s.text.length, 0);
}

function CharReveal({ segs, revealed }: { segs: Segment[]; revealed: number }) {
  let idx = 0;
  return (
    <>
      {segs.map((seg, si) => (
        <span key={si} style={seg.hl ? HIGHLIGHT : undefined}>
          {Array.from(seg.text).map((char, ci) => {
            const vis = idx++ < revealed;
            return (
              <span key={ci} style={{
                display: 'inline',
                opacity: vis ? 1 : 0,
                filter: vis ? 'blur(0px)' : 'blur(4px)',
                transition: vis ? 'opacity 0.13s ease, filter 0.13s ease' : 'none',
              }}>
                {char}
              </span>
            );
          })}
        </span>
      ))}
    </>
  );
}

type State = {
  agentVisible:   boolean;
  agentMode:      AgentMode;
  narLines:       number[];   // revealed char count per narration line
  questionActive: boolean;
  qRevealed:      number;
  ctaVisible:     boolean;
  focusedCTA:     0 | 1;
};

function NarLine({ segs, revealed, fontSize, weight, color, italic, extraTopGap }: {
  segs: Segment[];
  revealed: number;
  fontSize: string;
  weight: number;
  color: string;
  italic?: boolean;
  extraTopGap?: boolean;
}) {
  const active = revealed > 0;
  return (
    <div style={{
      fontSize, fontWeight: weight, color,
      lineHeight: 1.4, textAlign: 'center', letterSpacing: '0.005em',
      fontStyle: italic ? 'italic' : 'normal',
      marginTop: extraTopGap ? 8 : 0,
      opacity: active ? 1 : 0,
      transform: active ? 'translateY(0)' : 'translateY(14px)',
      transition: active
        ? 'opacity 0.45s cubic-bezier(0.22,1,0.36,1), transform 0.45s cubic-bezier(0.22,1,0.36,1)'
        : 'none',
    }}>
      <CharReveal segs={segs} revealed={revealed} />
    </div>
  );
}

function ContextBlock({ label, detail }: { label: string; detail: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{
        fontSize: 'clamp(14px, 1.3vw, 20px)', fontWeight: 600,
        color: 'rgba(255,255,255,0.75)', letterSpacing: '-0.01em',
        fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
        lineHeight: 1.2,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 'clamp(11px, 0.9vw, 14px)', fontWeight: 400,
        color: 'rgba(255,255,255,0.32)', letterSpacing: '0.03em',
        fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
        lineHeight: 1.4,
      }}>
        {detail}
      </div>
    </div>
  );
}

export default function T3ConversationStarter({ onYes, onNo }: {
  onYes?: () => void;
  onNo?: () => void;
}) {
  const [ctx] = useState(() => getCtx());
  const city         = ctx.city         || 'Bangalore';
  const weekendDates = ctx.weekendDates  || 'Aug 15–17';
  const holidayDate  = weekendDates.split('–')[0].trim(); // "Aug 15"

  // Narration lines — index 4 is the bridge
  const NLINES: Segment[][] = [
    [{ text: holidayDate, hl: true }, { text: ' is a national holiday.', hl: false }],
    [{ text: 'That gives you ', hl: false }, { text: '3 days in a row', hl: true }, { text: '.', hl: false }],
    [{ text: "Weather's looking clear — good driving weather.", hl: false }],
    [{ text: `There are good spots within `, hl: false }, { text: '3 hours', hl: true }, { text: ` of ${city}.`, hl: false }],
    [{ text: 'Which got me thinking...', hl: false }],
  ];

  const Q_LINE1: Segment[] = [
    { text: 'Thinking about a ', hl: false },
    { text: 'short escape',       hl: true  },
  ];
  const Q_LINE2: Segment[] = [
    { text: 'around ',      hl: false },
    { text: weekendDates,   hl: true  },
    { text: '?',            hl: false },
  ];
  const Q1_LEN    = lineLen(Q_LINE1);
  const Q_TOTAL   = Q1_LEN + lineLen(Q_LINE2);

  const [s, setS] = useState<State>({
    agentVisible:   false,
    agentMode:      'thinking',
    narLines:       [0, 0, 0, 0, 0],
    questionActive: false,
    qRevealed:      0,
    ctaVisible:     false,
    focusedCTA:     0,
  });

  // Schedule a char-by-char reveal for one narration line.
  // Returns the interval so the caller can cancel on unmount.
  function revealNarLine(lineIdx: number, startDelay: number, msPerChar: number): ReturnType<typeof setInterval> | null {
    let iv: ReturnType<typeof setInterval> | null = null;
    const timer = setTimeout(() => {
      const total = lineLen(NLINES[lineIdx]);
      let i = 0;
      iv = setInterval(() => {
        i++;
        setS(p => {
          const nl = [...p.narLines];
          nl[lineIdx] = i;
          return { ...p, narLines: nl };
        });
        if (i >= total && iv) clearInterval(iv);
      }, msPerChar);
    }, startDelay * 1000);
    // Return a fake interval ref — we handle cleanup via the closure
    return timer as unknown as ReturnType<typeof setInterval>;
  }

  useEffect(() => {
    const handles: ReturnType<typeof setTimeout>[] = [];

    const tl = gsap.timeline();

    // Agent appears
    tl.add(() => setS(p => ({ ...p, agentVisible: true, agentMode: 'thinking' })), 0.3);

    // ms per character — slower so text is readable
    const MS = 0.048;
    // reading dwell after each line finishes before next starts
    const DWELL = 1.1;

    const l0Start = 1.0;
    const l0Dur   = lineLen(NLINES[0]) * MS;
    const l1Start = l0Start + l0Dur + DWELL;
    const l1Dur   = lineLen(NLINES[1]) * MS;
    const l2Start = l1Start + l1Dur + DWELL;
    const l2Dur   = lineLen(NLINES[2]) * MS;
    const l3Start = l2Start + l2Dur + DWELL;
    const l3Dur   = lineLen(NLINES[3]) * MS;
    const lbStart = l3Start + l3Dur + DWELL * 1.2;
    const lbDur   = lineLen(NLINES[4]) * MS;
    const qStart  = lbStart + lbDur + 1.0;
    const ctaStart = qStart + Q_TOTAL * 0.045 + 0.8;

    tl.add(() => setS(p => ({ ...p, agentMode: 'looking' })), l2Start - 0.1);
    tl.add(() => setS(p => ({ ...p, agentMode: 'idle', questionActive: true })), qStart);
    tl.add(() => setS(p => ({ ...p, ctaVisible: true })),                         ctaStart);

    // Narration char reveals (setTimeout-based so we can cleanly cancel)
    const h0 = setTimeout(() => {
      let i = 0; const total = lineLen(NLINES[0]);
      const iv = setInterval(() => { i++; setS(p => { const nl=[...p.narLines]; nl[0]=i; return {...p,narLines:nl}; }); if(i>=total) clearInterval(iv); }, 48);
    }, l0Start * 1000);
    const h1 = setTimeout(() => {
      let i = 0; const total = lineLen(NLINES[1]);
      const iv = setInterval(() => { i++; setS(p => { const nl=[...p.narLines]; nl[1]=i; return {...p,narLines:nl}; }); if(i>=total) clearInterval(iv); }, 48);
    }, l1Start * 1000);
    const h2 = setTimeout(() => {
      let i = 0; const total = lineLen(NLINES[2]);
      const iv = setInterval(() => { i++; setS(p => { const nl=[...p.narLines]; nl[2]=i; return {...p,narLines:nl}; }); if(i>=total) clearInterval(iv); }, 48);
    }, l2Start * 1000);
    const h3 = setTimeout(() => {
      let i = 0; const total = lineLen(NLINES[3]);
      const iv = setInterval(() => { i++; setS(p => { const nl=[...p.narLines]; nl[3]=i; return {...p,narLines:nl}; }); if(i>=total) clearInterval(iv); }, 48);
    }, l3Start * 1000);
    const hb = setTimeout(() => {
      let i = 0; const total = lineLen(NLINES[4]);
      const iv = setInterval(() => { i++; setS(p => { const nl=[...p.narLines]; nl[4]=i; return {...p,narLines:nl}; }); if(i>=total) clearInterval(iv); }, 48);
    }, lbStart * 1000);
    const hq = setTimeout(() => {
      let i = 0;
      const iv = setInterval(() => { i++; setS(p => ({ ...p, qRevealed: i })); if(i>=Q_TOTAL) clearInterval(iv); }, 45);
    }, qStart * 1000);

    handles.push(h0, h1, h2, h3, hb, hq);
    return () => { tl.kill(); handles.forEach(clearTimeout); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!s.ctaVisible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        setS(p => ({ ...p, focusedCTA: p.focusedCTA === 0 ? 1 : 0 }));
      }
      if (e.key === 'Enter' || e.key === ' ') {
        if (s.focusedCTA === 0) onYes?.(); else onNo?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [s.ctaVisible, s.focusedCTA, onYes, onNo]);

  const now     = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    .replace(' AM', 'am').replace(' PM', 'pm');

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      background: 'radial-gradient(ellipse 1800px 1200px at 50% 40%, rgba(40,10,100,0.75) 0%, rgba(5,2,16,0.98) 65%)',
      overflow: 'hidden', fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 900px 600px at 50% 55%, rgba(112,71,226,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 88,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(24px, 4.5vw, 88px)', zIndex: 10,
      }}>
        <img src="/glance-logo.png" alt="Glance" style={{ height: 32, objectFit: 'contain', opacity: 0.9 }} />
        <div style={{
          display: 'flex', alignItems: 'center', gap: 20,
          fontSize: 'clamp(12px, 1.1vw, 18px)', color: 'rgba(255,255,255,0.50)',
          fontVariantNumeric: 'tabular-nums', letterSpacing: '0.01em',
        }}>
          <span>☁ {city}</span>
          <span style={{ opacity: 0.35 }}>·</span>
          <span>{dateStr}</span>
          <span style={{ opacity: 0.35 }}>·</span>
          <span>{timeStr}</span>
        </div>
      </div>

      {/* Top-left corner info */}
      <div style={{
        position: 'absolute', top: 108, left: 'clamp(24px, 4.5vw, 88px)', zIndex: 6,
        opacity: s.questionActive ? 1 : 0,
        transform: s.questionActive ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.6s cubic-bezier(0.22,1,0.36,1) 0.1s, transform 0.6s cubic-bezier(0.22,1,0.36,1) 0.1s',
        pointerEvents: 'none',
      }}>
        <ContextBlock label={weekendDates} detail="Long weekend · 3 days" />
      </div>

      {/* Bottom-left corner info */}
      <div style={{
        position: 'absolute', bottom: 80, left: 'clamp(24px, 4.5vw, 88px)', zIndex: 6,
        opacity: s.questionActive ? 1 : 0,
        transform: s.questionActive ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.6s cubic-bezier(0.22,1,0.36,1) 0.2s, transform 0.6s cubic-bezier(0.22,1,0.36,1) 0.2s',
        pointerEvents: 'none',
      }}>
        <ContextBlock label={`From ${city}`} detail="Within 3 hours · Good weather" />
      </div>

      {/* Center column */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        zIndex: 5,
      }}>
        {/* Agent */}
        <div style={{
          opacity: s.agentVisible ? 1 : 0,
          transform: s.agentVisible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.88)',
          transition: 'opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1)',
          marginBottom: 36,
          flexShrink: 0,
        }}>
          <AgentMascot agentMode={s.agentMode} size={96} />
        </div>

        {/* Text area — narration and question crossfade in fixed space */}
        <div style={{ position: 'relative', width: '1100px', maxWidth: '92vw', minHeight: 300 }}>

          {/* Narration block */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
            opacity: s.questionActive ? 0 : 1,
            transition: 'opacity 0.5s cubic-bezier(0.22,1,0.36,1)',
            pointerEvents: 'none',
          }}>
            {/* Line 0 — biggest, most important signal */}
            <NarLine
              segs={NLINES[0]} revealed={s.narLines[0]}
              fontSize="clamp(26px, 2.8vw, 44px)" weight={600} color="rgba(255,255,255,0.90)"
            />
            {/* Line 1 — consequence, punchy */}
            <NarLine
              segs={NLINES[1]} revealed={s.narLines[1]}
              fontSize="clamp(22px, 2.2vw, 34px)" weight={500} color="rgba(255,255,255,0.75)"
            />
            {/* Line 2 — supporting detail, smaller */}
            <NarLine
              segs={NLINES[2]} revealed={s.narLines[2]}
              fontSize="clamp(16px, 1.55vw, 24px)" weight={400} color="rgba(255,255,255,0.50)"
            />
            {/* Line 3 — supporting detail, same small */}
            <NarLine
              segs={NLINES[3]} revealed={s.narLines[3]}
              fontSize="clamp(16px, 1.55vw, 24px)" weight={400} color="rgba(255,255,255,0.50)"
            />
            {/* Bridge — italic, very muted */}
            <NarLine
              segs={NLINES[4]} revealed={s.narLines[4]}
              fontSize="clamp(15px, 1.4vw, 22px)" weight={300} color="rgba(255,255,255,0.30)"
              italic extraTopGap
            />
          </div>

          {/* Question hero — always 2 lines, no wrap */}
          <div style={{
            position: 'absolute', top: '50%', left: 0, right: 0,
            transform: s.questionActive ? 'translateY(-50%)' : 'translateY(calc(-50% + 20px))',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            opacity: s.questionActive ? 1 : 0,
            transition: 'opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1)',
          }}>
            <div style={{
              fontSize: 'clamp(42px, 4.8vw, 76px)', fontWeight: 600, lineHeight: 1.15,
              color: 'rgba(255,255,255,0.88)', textAlign: 'center', letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
            }}>
              <CharReveal segs={Q_LINE1} revealed={s.qRevealed} />
            </div>
            <div style={{
              fontSize: 'clamp(42px, 4.8vw, 76px)', fontWeight: 600, lineHeight: 1.15,
              color: 'rgba(255,255,255,0.88)', textAlign: 'center', letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
            }}>
              <CharReveal segs={Q_LINE2} revealed={Math.max(0, s.qRevealed - Q1_LEN)} />
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div style={{
          display: 'flex', gap: 20, marginTop: 52,
          opacity: s.ctaVisible ? 1 : 0,
          transform: s.ctaVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.6s cubic-bezier(0.34,1.56,0.64,1), transform 0.6s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <T3CTA label="Yes, find something nearby" focused={s.focusedCTA === 0} onClick={() => onYes?.()} onHover={() => setS(p => ({ ...p, focusedCTA: 0 }))} primary />
          <T3CTA label="Not this time"               focused={s.focusedCTA === 1} onClick={() => onNo?.()}  onHover={() => setS(p => ({ ...p, focusedCTA: 1 }))} primary={false} />
        </div>
      </div>

      {/* Bottom ambient glow */}
      <div style={{
        position: 'absolute', bottom: -120, left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 300, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(112,71,226,0.12) 0%, transparent 70%)',
        pointerEvents: 'none', animation: 't3-glow-pulse 4s ease-in-out infinite',
      }} />

      <style>{`
        @keyframes t3-glow-pulse {
          0%, 100% { opacity: 0.6; transform: translateX(-50%) scale(0.95); }
          50%       { opacity: 1;   transform: translateX(-50%) scale(1.05); }
        }
      `}</style>
    </div>
  );
}

function T3CTA({ label, focused, onClick, onHover, primary }: {
  label: string;
  focused: boolean;
  onClick: () => void;
  onHover: () => void;
  primary: boolean;
}) {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', height: 64, padding: '0 32px',
    borderRadius: 72, cursor: 'pointer', outline: 'none',
    fontSize: 'clamp(15px, 1.4vw, 22px)',
    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
    whiteSpace: 'nowrap',
    transform: focused ? 'scale(1.04)' : 'scale(1)',
    transition: 'box-shadow 0.2s, transform 0.2s, background 0.2s, border-color 0.2s',
  };

  if (primary) {
    return (
      <BorderBeam size="sm" colorVariant="colorful" duration={2.0} brightness={1.7} saturation={3.0} strength={1.5}>
        <button tabIndex={-1} onClick={onClick} onMouseEnter={onHover} style={{
          ...base,
          background: focused ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.92)',
          border: 'none',
          boxShadow: focused ? '0 8px 40px rgba(0,0,0,0.22), 0 0 0 3px rgba(255,255,255,0.35)' : '0 8px 40px rgba(0,0,0,0.14)',
          fontWeight: 600, color: '#111',
        }}>
          {label}
        </button>
      </BorderBeam>
    );
  }

  return (
    <button tabIndex={-1} onClick={onClick} onMouseEnter={onHover} style={{
      ...base,
      background: focused ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.05)',
      border: focused ? '1px solid rgba(255,255,255,0.30)' : '1px solid rgba(255,255,255,0.14)',
      boxShadow: focused ? '0 0 0 2px rgba(255,255,255,0.18)' : 'none',
      fontWeight: 500, color: focused ? 'rgba(255,255,255,0.80)' : 'rgba(255,255,255,0.45)',
    }}>
      {label}
    </button>
  );
}
