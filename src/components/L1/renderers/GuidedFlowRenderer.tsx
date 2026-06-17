import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { LEFT_PAD, RENDERER_TOP, FOCUS_BORDER, FOCUS_SHADOW, IDLE_BORDER, FOCUS_TRANSITION, ScreenPhase } from '../l1Constants';
import { SectionLabel } from '../l1SharedComponents';
import type { RendererProps } from '../l1Constants';

const STEPS = [
  {
    step: 1,
    title: 'Simmer the broth with soy, miso, and ginger',
    body: 'Combine 4 cups of dashi or chicken stock with white miso, soy sauce, and fresh ginger. Let it simmer on low for 15 minutes.',
    time: '15 min',
  },
  {
    step: 2,
    title: 'Cook the ramen noodles until just tender',
    body: 'Boil noodles in a separate pot for 2–3 minutes. Drain and rinse with cold water to stop cooking and keep them springy.',
    time: '5 min',
  },
  {
    step: 3,
    title: 'Soft-boil the eggs and prep your toppings',
    body: 'Boil eggs for exactly 6 minutes, then transfer to ice water. Slice chashu pork, bamboo shoots, and nori while they cool.',
    time: '10 min',
  },
  {
    step: 4,
    title: 'Assemble the bowl and finish with toppings',
    body: 'Ladle hot broth over noodles. Add halved eggs, pork slices, nori, scallions, and a drizzle of sesame oil.',
    time: '3 min',
  },
];

const CARD_W = 400;
const CARD_H = 390;

export default function GuidedFlowRenderer({ focusIdx, phase }: RendererProps) {
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
      tl.fromTo(el, { opacity:0, x:36 }, { opacity:1, x:0, duration:0.44, ease:'power3.out' }, 0.1 + i * 0.12);
    });
  }, [phase === ScreenPhase.PRIMARY_CONTENT]);

  return (
    <div style={{
      position: 'absolute',
      top: RENDERER_TOP, left: LEFT_PAD, right: LEFT_PAD, bottom: 148,
      zIndex: 5,
    }}>
      <div ref={labelRef} style={{ opacity: 0, marginBottom: 22 }}>
        <SectionLabel>RAMEN BOWL · STEP BY STEP</SectionLabel>
      </div>

      <div style={{ display: 'flex', gap: 18 }}>
        {STEPS.map((step, i) => {
          const focused = focusIdx === i;
          const done    = i < focusIdx;
          return (
            <div
              key={i}
              ref={el => { cardRefs.current[i] = el; }}
              style={{
                width: CARD_W, height: CARD_H,
                background: done
                  ? 'rgba(255,255,255,0.035)'
                  : 'rgba(20,12,40,0.8)',
                backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
                borderRadius: 18, overflow: 'hidden', position: 'relative',
                border: focused ? FOCUS_BORDER : done ? IDLE_BORDER('0.1') : IDLE_BORDER('0.08'),
                boxShadow: focused ? FOCUS_SHADOW : '0 8px 32px rgba(0,0,0,0.5)',
                transform: focused ? 'scale(1.04) translateY(-8px)' : 'scale(1)',
                transition: FOCUS_TRANSITION,
                cursor: 'pointer', opacity: 0,
                display: 'flex', flexDirection: 'column',
              }}
            >
              {/* Step number header */}
              <div style={{
                padding: '18px 20px 14px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 12, flexShrink: 0,
                  background: done
                    ? 'rgba(255,255,255,0.1)'
                    : focused
                      ? 'rgba(180,145,255,0.18)'
                      : 'rgba(255,255,255,0.06)',
                  border: done
                    ? '1.5px solid rgba(255,255,255,0.2)'
                    : focused
                      ? '1.5px solid rgba(200,170,255,0.5)'
                      : '1.5px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: FOCUS_TRANSITION,
                }}>
                  {done ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M4 12l5 5L20 7" stroke="rgba(255,255,255,0.6)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <span style={{
                      fontSize: 14, fontWeight: 800,
                      color: focused ? 'rgba(200,170,255,0.9)' : 'rgba(255,255,255,0.4)',
                    }}>
                      {step.step}
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: 12, fontWeight: 700, letterSpacing: '0.1em',
                  color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase',
                }}>
                  Step {step.step}
                </div>
              </div>

              {/* Body */}
              <div style={{ flex: 1, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{
                  fontSize: 18, fontWeight: 700,
                  color: done ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.92)',
                  lineHeight: 1.35, letterSpacing: '-0.01em',
                  transition: 'color 0.4s ease',
                }}>
                  {step.title}
                </div>
                <div style={{
                  fontSize: 15, fontWeight: 400,
                  color: done ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.55)',
                  lineHeight: 1.6,
                  transition: 'color 0.4s ease',
                }}>
                  {step.body}
                </div>
              </div>

              {/* Time footer */}
              <div style={{
                padding: '12px 20px 16px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5"/>
                  <path d="M12 7v5l3 3" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.38)' }}>
                  {step.time}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
