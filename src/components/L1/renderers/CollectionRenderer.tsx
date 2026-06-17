import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { LEFT_PAD, RENDERER_TOP, FOCUS_BORDER, FOCUS_SHADOW, IDLE_BORDER, FOCUS_TRANSITION, ScreenPhase } from '../l1Constants';
import { SectionLabel } from '../l1SharedComponents';
import type { RendererProps } from '../l1Constants';

const ITEMS = [
  {
    brand: 'Loro Piana',
    title: 'Blue white striped linen shirt',
    price: '$849',
    badge: 'Exact match',
  },
  {
    brand: 'Brioni',
    title: 'Beige chino pants',
    price: '$1,100',
    badge: '98% similar',
  },
  {
    brand: 'Prada',
    title: 'Black wayfarers',
    price: '$299',
    badge: '25% off',
  },
  {
    brand: 'Loro Piana',
    title: 'Brown suede loafers',
    price: '$988',
    badge: null,
  },
];

const CARD_W = 380;
const CARD_H = 400;

export default function CollectionRenderer({ focusIdx, phase }: RendererProps) {
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
      tl.fromTo(el, { opacity:0, x:36 }, { opacity:1, x:0, duration:0.44, ease:'power3.out' }, 0.1 + i * 0.11);
    });
  }, [phase === ScreenPhase.PRIMARY_CONTENT]);

  return (
    <div style={{
      position: 'absolute',
      top: RENDERER_TOP, left: LEFT_PAD, right: LEFT_PAD, bottom: 148,
      zIndex: 5,
    }}>
      <div ref={labelRef} style={{ opacity: 0, marginBottom: 22 }}>
        <SectionLabel>YOUR ITALY EDIT</SectionLabel>
      </div>

      <div style={{ display: 'flex', gap: 18 }}>
        {ITEMS.map((item, i) => {
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
              {/* Image area — neutral dark gradient */}
              <div style={{
                flex: 1,
                background: 'linear-gradient(155deg, rgba(28,18,52,0.95) 0%, rgba(14,8,28,0.98) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}>
                <FashionIllustration index={i} />

                {item.badge && (
                  <div style={{
                    position: 'absolute', top: 14, left: 14,
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 8, padding: '4px 12px',
                    fontSize: 12, fontWeight: 700,
                    color: 'rgba(255,255,255,0.72)',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}>
                    {item.badge}
                  </div>
                )}

                {/* Brand — top right */}
                <div style={{
                  position: 'absolute', top: 14, right: 14,
                  background: 'rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: 6, padding: '3px 10px',
                  fontSize: 11, fontWeight: 700,
                  color: 'rgba(255,255,255,0.42)',
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}>
                  {item.brand}
                </div>
              </div>

              {/* Info bar */}
              <div style={{
                background: 'rgba(8,4,20,0.9)', backdropFilter: 'blur(10px)',
                padding: '14px 18px',
              }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.82)', marginBottom: 4, lineHeight: 1.3 }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                  {item.price}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Minimal wireframe illustrations — neutral white ──────────────────────── */
function FashionIllustration({ index }: { index: number }) {
  const s  = 'rgba(255,255,255,0.12)';
  const sl = 'rgba(255,255,255,0.07)';

  if (index === 0) return (
    /* Linen shirt */
    <svg viewBox="0 0 160 200" width="130" height="160" fill="none">
      <path d="M50 40 Q80 20 110 40 L118 60 Q80 48 42 60 Z" stroke={s} strokeWidth="1" fill={sl}/>
      <path d="M34 60 L50 60 L46 160 L24 168 Z" stroke={s} strokeWidth="1" fill={sl}/>
      <path d="M110 60 L126 60 L136 168 L114 160 Z" stroke={s} strokeWidth="1" fill={sl}/>
      <path d="M50 60 L110 60 L114 160 L46 160 Z" stroke={s} strokeWidth="1" fill={sl}/>
      {[80,95,110,125,140].map(y => (
        <line key={y} x1="47" y1={y} x2="113" y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1.5"/>
      ))}
      <line x1="80" y1="40" x2="80" y2="158" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
    </svg>
  );

  if (index === 1) return (
    /* Trousers */
    <svg viewBox="0 0 160 200" width="130" height="160" fill="none">
      <path d="M44 50 L116 50 L120 130 L88 135 L80 165 L72 135 L40 130 Z" stroke={s} strokeWidth="1" fill={sl}/>
      <line x1="80" y1="130" x2="80" y2="165" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5"/>
      <rect x="84" y="58" width="24" height="14" rx="3" stroke="rgba(255,255,255,0.08)" strokeWidth="1" fill="none"/>
      <rect x="44" y="46" width="72" height="8" rx="4" stroke={s} strokeWidth="1" fill={sl}/>
    </svg>
  );

  if (index === 2) return (
    /* Sunglasses */
    <svg viewBox="0 0 180 80" width="160" height="72" fill="none">
      <rect x="14" y="20" width="56" height="36" rx="12" stroke={s} strokeWidth="1.5" fill={sl}/>
      <rect x="110" y="20" width="56" height="36" rx="12" stroke={s} strokeWidth="1.5" fill={sl}/>
      <line x1="70" y1="38" x2="110" y2="38" stroke={s} strokeWidth="2"/>
      <line x1="2"  y1="30" x2="14"  y2="30" stroke={s} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="166" y1="30" x2="178" y2="30" stroke={s} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M24 28 Q42 22 58 30" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" fill="none"/>
      <path d="M120 28 Q138 22 154 30" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" fill="none"/>
    </svg>
  );

  return (
    /* Loafer */
    <svg viewBox="0 0 180 120" width="150" height="100" fill="none">
      <path d="M18 75 Q18 48 52 38 L136 38 Q162 40 162 62 Q162 78 136 82 L58 86 Q28 90 18 75 Z"
        stroke={s} strokeWidth="1.5" fill={sl}/>
      <path d="M80 38 L80 60 Q92 62 98 54 L104 38" stroke={s} strokeWidth="1" fill="none"/>
      <ellipse cx="88" cy="50" rx="9" ry="7" stroke="rgba(255,255,255,0.08)" strokeWidth="1" fill="none"/>
      <path d="M18 75 Q18 86 34 90 L136 86 Q162 82 162 72" stroke="rgba(255,255,255,0.08)" strokeWidth="2" fill="none"/>
    </svg>
  );
}
