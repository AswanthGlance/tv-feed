import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { LEFT_PAD, RENDERER_TOP, FOCUS_BORDER, FOCUS_SHADOW, IDLE_BORDER, FOCUS_TRANSITION, ScreenPhase } from '../l1Constants';
import { SectionLabel } from '../l1SharedComponents';
import type { RendererProps } from '../l1Constants';

const STOPS = [
  {
    time: '4:00 PM',
    label: 'Leave home',
    detail: 'Estimated drive: 35 min',
    note: 'Avoid peak stadium traffic',
    icon: 'car',
  },
  {
    time: '5:00 PM',
    label: 'Arrive at SoFi',
    detail: 'Walk to entrance: 12 min',
    note: 'Parking opens nearby',
    icon: 'stadium',
  },
  {
    time: '5:30 PM',
    label: 'Fan zone',
    detail: 'Food, merch, photos',
    note: 'Best time to enter before lines grow',
    icon: 'star',
  },
  {
    time: '6:00 PM',
    label: 'Kickoff',
    detail: 'USA vs Paraguay',
    note: 'Seats: Premium Lower',
    icon: 'ball',
  },
  {
    time: '9:00 PM',
    label: 'Return',
    detail: 'Suggested exit: Gate 8',
    note: 'Avoid post-match congestion',
    icon: 'home',
  },
];

const CARD_W = 300;
const CARD_H = 380;

export default function JourneyRenderer({ focusIdx, phase }: RendererProps) {
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
      tl.fromTo(el, { opacity:0, y:28 }, { opacity:1, y:0, duration:0.44, ease:'power3.out' }, 0.1 + i * 0.1);
    });
  }, [phase === ScreenPhase.PRIMARY_CONTENT]);

  return (
    <div style={{
      position: 'absolute',
      top: RENDERER_TOP, left: LEFT_PAD, right: LEFT_PAD, bottom: 148,
      zIndex: 5,
    }}>
      <div ref={labelRef} style={{ opacity: 0, marginBottom: 22 }}>
        <SectionLabel>MATCH DAY TIMELINE</SectionLabel>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        {STOPS.map((stop, i) => {
          const focused = focusIdx === i;
          const past    = i < focusIdx;

          return (
            <div
              key={i}
              ref={el => { cardRefs.current[i] = el; }}
              style={{
                width: CARD_W, height: CARD_H,
                background: past
                  ? 'rgba(255,255,255,0.03)'
                  : 'rgba(20,12,40,0.8)',
                backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
                borderRadius: 18, overflow: 'hidden',
                border: focused ? FOCUS_BORDER : IDLE_BORDER(past ? '0.06' : '0.08'),
                boxShadow: focused ? FOCUS_SHADOW : '0 8px 32px rgba(0,0,0,0.5)',
                transform: focused ? 'scale(1.05) translateY(-10px)' : 'scale(1)',
                transition: FOCUS_TRANSITION,
                cursor: 'pointer', opacity: 0,
                display: 'flex', flexDirection: 'column',
              }}
            >
              {/* Time */}
              <div style={{
                padding: '16px 18px 12px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{
                  fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em',
                  color: focused ? '#fff' : past ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.72)',
                  transition: 'color 0.3s ease',
                }}>
                  {stop.time}
                </span>
                <div style={{
                  width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                  background: focused ? 'rgba(180,145,255,0.18)' : 'rgba(255,255,255,0.06)',
                  border: focused ? '1.5px solid rgba(200,170,255,0.4)' : '1.5px solid rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: FOCUS_TRANSITION,
                }}>
                  <JourneyIcon type={stop.icon} focused={focused} />
                </div>
              </div>

              {/* Content */}
              <div style={{ flex: 1, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{
                  fontSize: 18, fontWeight: 700, lineHeight: 1.25,
                  color: past ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.9)',
                  transition: 'color 0.4s ease',
                }}>
                  {stop.label}
                </div>
                <div style={{
                  fontSize: 14, lineHeight: 1.5,
                  color: past ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.52)',
                  transition: 'color 0.4s ease',
                }}>
                  {stop.detail}
                </div>
                <div style={{
                  marginTop: 'auto',
                  padding: '8px 12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  fontSize: 13,
                  color: past ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.42)',
                  lineHeight: 1.45,
                }}>
                  {stop.note}
                </div>
              </div>

              {/* Progress dot — connector anchor */}
              <div style={{
                position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)',
                width: focused ? 12 : 6, height: focused ? 12 : 6,
                borderRadius: '50%',
                background: focused ? 'rgba(200,170,255,0.9)' : past ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.15)',
                boxShadow: focused ? '0 0 10px rgba(180,145,255,0.7)' : 'none',
                transition: 'all 0.3s ease',
              }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function JourneyIcon({ type, focused }: { type: string; focused: boolean }) {
  const c = focused ? 'rgba(200,170,255,0.9)' : 'rgba(255,255,255,0.38)';
  if (type === 'car') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M5 17H3v-5l2-5h14l2 5v5h-2" stroke={c} strokeWidth="1.8"/>
      <circle cx="7.5" cy="17" r="1.5" stroke={c} strokeWidth="1.8"/>
      <circle cx="16.5" cy="17" r="1.5" stroke={c} strokeWidth="1.8"/>
    </svg>
  );
  if (type === 'stadium') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M3 20V8l9-4 9 4v12H3Z" stroke={c} strokeWidth="1.8"/>
      <rect x="9" y="14" width="6" height="6" stroke={c} strokeWidth="1.5"/>
    </svg>
  );
  if (type === 'star') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6Z" stroke={c} strokeWidth="1.8"/>
    </svg>
  );
  if (type === 'ball') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.8"/>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke={c} strokeWidth="1.8"/>
      <polyline points="9,22 9,12 15,12 15,22" stroke={c} strokeWidth="1.8"/>
    </svg>
  );
}
