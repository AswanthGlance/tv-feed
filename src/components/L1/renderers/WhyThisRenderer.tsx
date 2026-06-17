import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { LEFT_PAD, RENDERER_TOP, FOCUS_BORDER, FOCUS_SHADOW, IDLE_BORDER, FOCUS_TRANSITION, ScreenPhase } from '../l1Constants';
import { SectionLabel } from '../l1SharedComponents';
import type { RendererProps } from '../l1Constants';

const REASONS = [
  {
    category: 'Weather Match',
    icon: 'weather',
    details: [
      { label: 'Forecast',   value: '18°F' },
      { label: 'Wind',       value: '14 mph' },
    ],
    rationale: 'Insulated and wind-resistant construction directly matched to today\'s conditions.',
    score: 96,
  },
  {
    category: 'Activity Match',
    icon: 'walk',
    details: [
      { label: 'Use case', value: 'Morning walks' },
      { label: 'Needs',    value: 'Warmth, no bulk' },
    ],
    rationale: 'Lightweight padding keeps you warm without restricting movement on longer walks.',
    score: 91,
  },
  {
    category: 'Style Match',
    icon: 'style',
    details: [
      { label: 'Preference', value: 'Minimal dark' },
      { label: 'Fit',        value: 'Relaxed cropped' },
    ],
    rationale: 'Matches your last 4 saved items — minimal dark outerwear with relaxed silhouette.',
    score: 88,
  },
  {
    category: 'Budget Match',
    icon: 'budget',
    details: [
      { label: 'Price',      value: '$179' },
      { label: 'Your range', value: '$100–$250' },
    ],
    rationale: 'Within your usual spend. Good value before stepping up to premium brands.',
    score: 100,
  },
];

const CARD_W = 390;
const CARD_H = 395;

export default function WhyThisRenderer({ focusIdx, phase }: RendererProps) {
  const labelRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (phase !== ScreenPhase.PRIMARY_CONTENT) return;
    const all = [labelRef.current, ...cardRefs.current].filter(Boolean) as HTMLElement[];
    gsap.set(all, { opacity: 0 });
    const tl = gsap.timeline();
    tl.fromTo(labelRef.current, { opacity:0, y:8 }, { opacity:1, y:0, duration:0.36, ease:'power2.out' }, 0);
    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      tl.fromTo(el, { opacity:0, y:32, scale:0.97 }, { opacity:1, y:0, scale:1, duration:0.48, ease:'power3.out' }, 0.1 + i * 0.12);
    });
  }, [phase === ScreenPhase.PRIMARY_CONTENT]);

  return (
    <div style={{
      position: 'absolute',
      top: RENDERER_TOP, left: LEFT_PAD, right: LEFT_PAD, bottom: 148,
      zIndex: 5,
    }}>
      <div ref={labelRef} style={{ opacity: 0, marginBottom: 22 }}>
        <SectionLabel>AI REASONING · TRUST LAYER</SectionLabel>
      </div>

      <div style={{ display: 'flex', gap: 18 }}>
        {REASONS.map((r, i) => {
          const focused = focusIdx === i;
          return (
            <div
              key={i}
              ref={el => { cardRefs.current[i] = el; }}
              style={{
                width: CARD_W, height: CARD_H,
                background: 'rgba(20,12,40,0.8)',
                backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
                borderRadius: 18, overflow: 'hidden',
                border: focused ? FOCUS_BORDER : IDLE_BORDER('0.08'),
                boxShadow: focused ? FOCUS_SHADOW : '0 8px 32px rgba(0,0,0,0.5)',
                transform: focused ? 'scale(1.04) translateY(-8px)' : 'scale(1)',
                transition: FOCUS_TRANSITION,
                cursor: 'pointer', opacity: 0,
                display: 'flex', flexDirection: 'column',
              }}
            >
              {/* Header */}
              <div style={{
                padding: '18px 20px 14px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1.5px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ReasonIcon type={r.icon} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: 'rgba(255,255,255,0.88)' }}>
                    {r.category}
                  </div>
                </div>
                {/* Match score */}
                <div style={{
                  fontSize: 13, fontWeight: 700,
                  color: 'rgba(255,255,255,0.4)',
                  letterSpacing: '0.02em',
                }}>
                  {r.score}%
                </div>
              </div>

              {/* Detail rows */}
              <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                {r.details.map((d, j) => (
                  <div key={j} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '9px 0',
                    borderBottom: j < r.details.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  }}>
                    <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.38)' }}>{d.label}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.82)' }}>{d.value}</span>
                  </div>
                ))}
              </div>

              {/* Score bar */}
              <div style={{ padding: '4px 20px 14px' }}>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${r.score}%`, borderRadius: 2,
                    background: 'linear-gradient(to right, rgba(180,145,255,0.45), rgba(200,170,255,0.75))',
                  }} />
                </div>
              </div>

              {/* Rationale */}
              <div style={{ flex: 1, padding: '0 20px 18px', display: 'flex', alignItems: 'flex-end' }}>
                <div style={{
                  fontSize: 15, color: 'rgba(255,255,255,0.48)', lineHeight: 1.55,
                  padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  {r.rationale}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReasonIcon({ type }: { type: string }) {
  const c = 'rgba(255,255,255,0.5)';
  if (type === 'weather') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4" stroke={c} strokeWidth="1.8"/>
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
  if (type === 'walk') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="4" r="2" stroke={c} strokeWidth="1.8"/>
      <path d="M9 22l1-6 2 3 2-3 1 6" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 9l4-3 4 3-1 5H9L8 9Z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  );
  if (type === 'style') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7Z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  );
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="6" width="20" height="12" rx="3" stroke={c} strokeWidth="1.8"/>
      <path d="M6 10h6M6 14h4" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}
