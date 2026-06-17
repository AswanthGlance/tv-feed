import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { LEFT_PAD, RENDERER_TOP, FOCUS_BORDER, FOCUS_SHADOW, IDLE_BORDER, FOCUS_TRANSITION, ScreenPhase } from '../l1Constants';
import { SectionLabel } from '../l1SharedComponents';
import type { RendererProps } from '../l1Constants';

const FACTS = [
  {
    title: 'Nutrition Summary',
    rows: [
      { label: 'Calories', value: '640 kcal', prominent: true },
      { label: 'Protein',  value: '31g',      prominent: true },
      { label: 'Carbs',    value: '78g',      prominent: false },
      { label: 'Fat',      value: '22g',      prominent: false },
      { label: 'Sodium',   value: 'High',     prominent: true },
    ],
  },
  {
    title: 'Main Ingredients',
    rows: [
      { label: 'Ramen noodles',   value: '', prominent: false },
      { label: 'Chicken broth',   value: '', prominent: false },
      { label: 'Chili oil',       value: '', prominent: true },
      { label: 'Soft-boiled egg', value: '', prominent: false },
      { label: 'Scallions',       value: '', prominent: false },
    ],
  },
  {
    title: 'Allergen Check',
    rows: [
      { label: 'Contains',    value: 'wheat, egg, soy', prominent: true },
      { label: 'May contain', value: 'sesame',          prominent: false },
      { label: 'Spice level', value: 'medium-high',     prominent: true },
    ],
  },
  {
    title: 'Health Note',
    rows: [
      { label: 'Good protein',       value: '31g',    prominent: true },
      { label: 'High sodium',        value: 'watch',  prominent: false },
      { label: 'Add vegetables',     value: 'better', prominent: false },
    ],
  },
];

const CARD_W = 400;
const CARD_H = 380;

export default function FactsRenderer({ focusIdx, phase }: RendererProps) {
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
      tl.fromTo(el, { opacity:0, x:32 }, { opacity:1, x:0, duration:0.44, ease:'power3.out' }, 0.1 + i * 0.12);
    });
  }, [phase === ScreenPhase.PRIMARY_CONTENT]);

  return (
    <div style={{
      position: 'absolute',
      top: RENDERER_TOP, left: LEFT_PAD, right: LEFT_PAD, bottom: 148,
      zIndex: 5,
    }}>
      <div ref={labelRef} style={{ opacity: 0, marginBottom: 22 }}>
        <SectionLabel>SPICY RAMEN · BREAKDOWN</SectionLabel>
      </div>

      <div style={{ display: 'flex', gap: 18 }}>
        {FACTS.map((card, i) => {
          const focused = focusIdx === i;
          return (
            <div
              key={i}
              ref={el => { cardRefs.current[i] = el; }}
              style={{
                width: CARD_W, height: CARD_H,
                background: 'rgba(20,12,40,0.8)',
                backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
                borderRadius: 18, overflow: 'hidden', position: 'relative',
                border: focused ? FOCUS_BORDER : IDLE_BORDER('0.08'),
                boxShadow: focused ? FOCUS_SHADOW : '0 8px 32px rgba(0,0,0,0.5)',
                transform: focused ? 'scale(1.04) translateY(-8px)' : 'scale(1)',
                transition: FOCUS_TRANSITION,
                cursor: 'pointer', opacity: 0,
                display: 'flex', flexDirection: 'column',
              }}
            >
              {/* Card header */}
              <div style={{
                padding: '18px 20px 14px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{
                  fontSize: 13, fontWeight: 700, letterSpacing: '0.12em',
                  color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase',
                }}>
                  {card.title}
                </div>
              </div>

              {/* Rows */}
              <div style={{ flex: 1, padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                {card.rows.map((row, j) => (
                  <div key={j} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: j < card.rows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  }}>
                    <span style={{
                      fontSize: 16,
                      fontWeight: row.prominent ? 600 : 400,
                      color: row.prominent ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.45)',
                    }}>
                      {row.label}
                    </span>
                    {row.value && (
                      <span style={{
                        fontSize: 16, fontWeight: 700,
                        color: row.prominent ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.38)',
                      }}>
                        {row.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
