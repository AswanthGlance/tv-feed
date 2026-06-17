import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { LEFT_PAD, RENDERER_TOP, FOCUS_BORDER, FOCUS_SHADOW, IDLE_BORDER, FOCUS_TRANSITION, ScreenPhase } from '../l1Constants';
import { SectionLabel } from '../l1SharedComponents';
import type { RendererProps } from '../l1Constants';

const PRODUCTS = [
  {
    brand: 'Sony', name: 'WH-1000XM6', price: '$399',
    noise: 9.5, comfort: 9.0, battery: '30h', rating: '4.8★',
    bestFor: 'Frequent travelers', badge: 'Best overall',
  },
  {
    brand: 'Bose', name: 'QC Ultra', price: '$429',
    noise: 10, comfort: 9.5, battery: '24h', rating: '4.8★',
    bestFor: 'Maximum comfort', badge: 'Best comfort',
  },
  {
    brand: 'Apple', name: 'AirPods Max', price: '$549',
    noise: 9.0, comfort: 8.5, battery: '20h', rating: '4.7★',
    bestFor: 'Apple ecosystem', badge: 'Best for Apple users',
  },
];

const SUMMARIES = [
  'Best balance of price, battery life, sound quality, and travel performance.',
  'Unmatched comfort and the highest noise cancellation rating available today.',
  'Premium build and seamless Apple integration, best within the ecosystem.',
];

const CARD_W = 480;
const CARD_H = 390;

export default function ComparisonRenderer({ focusIdx, phase }: RendererProps) {
  const labelRef   = useRef<HTMLDivElement>(null);
  const cardRefs   = useRef<(HTMLDivElement | null)[]>([]);
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase !== ScreenPhase.PRIMARY_CONTENT) return;
    const all = [labelRef.current, ...cardRefs.current].filter(Boolean) as HTMLElement[];
    gsap.set(all, { opacity: 0 });
    const tl = gsap.timeline();
    tl.fromTo(labelRef.current, { opacity:0, y:10 }, { opacity:1, y:0, duration:0.36, ease:'power2.out' }, 0);
    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      tl.fromTo(el, { opacity:0, y:24 }, { opacity:1, y:0, duration:0.44, ease:'power3.out' }, 0.08 + i * 0.12);
    });
  }, [phase === ScreenPhase.PRIMARY_CONTENT]);

  useEffect(() => {
    if (phase !== ScreenPhase.SECONDARY_CONTENT) return;
    if (!summaryRef.current) return;
    gsap.set(summaryRef.current, { opacity: 0, y: 8 });
    gsap.to(summaryRef.current, { opacity: 1, y: 0, duration: 0.36, ease: 'power2.out' });
  }, [phase === ScreenPhase.SECONDARY_CONTENT]);

  const focused = Math.max(0, Math.min(focusIdx >= 0 ? focusIdx : 0, PRODUCTS.length - 1));

  return (
    <div style={{
      position: 'absolute',
      top: RENDERER_TOP, left: LEFT_PAD, right: LEFT_PAD, bottom: 148,
      zIndex: 5,
    }}>
      <div ref={labelRef} style={{ opacity: 0, marginBottom: 22 }}>
        <SectionLabel>PRODUCT COMPARISON · HEADPHONES</SectionLabel>
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {PRODUCTS.map((p, i) => {
          const isFocused = focusIdx === i;
          return (
            <div key={p.name} ref={el => { cardRefs.current[i] = el; }}
              style={{
                width: CARD_W,
                background: 'rgba(20,12,40,0.8)',
                backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
                borderRadius: 18, overflow: 'hidden', position: 'relative',
                border: isFocused ? FOCUS_BORDER : IDLE_BORDER('0.08'),
                boxShadow: isFocused ? FOCUS_SHADOW : '0 8px 32px rgba(0,0,0,0.5)',
                transform: isFocused ? 'scale(1.04) translateY(-8px)' : 'scale(1)',
                transition: FOCUS_TRANSITION,
                cursor: 'pointer', opacity: 0,
                display: 'flex', flexDirection: 'column',
              }}
            >
              <div style={{
                position: 'absolute', top: 14, right: 14, zIndex: 2,
                background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
                borderRadius: 8, padding: '4px 12px',
                fontSize: 12, fontWeight: 700,
                color: isFocused ? '#fff' : 'rgba(255,255,255,0.48)',
                border: isFocused ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.07)',
                transition: FOCUS_TRANSITION,
              }}>
                {p.badge}
              </div>

              <div style={{
                height: 178,
                background: 'linear-gradient(155deg, rgba(28,18,54,0.92) 0%, rgba(16,8,32,0.96) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <HeadphoneIllustration index={i} focused={isFocused} />
              </div>

              <div style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.32)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                    {p.brand}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.015em' }}>{p.name}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>{p.price}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <MetricRow label="Noise Cancellation" value={p.noise} max={10} unit="/10" />
                  <MetricRow label="Comfort" value={p.comfort} max={10} unit="/10" />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.38)' }}>Battery</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.72)' }}>{p.battery}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.38)' }}>Reviews</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.72)' }}>{p.rating}</span>
                  </div>
                </div>
                <div style={{
                  marginTop: 'auto', padding: '8px 12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                  fontSize: 13, color: 'rgba(255,255,255,0.44)',
                }}>
                  Best for: {p.bestFor}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div ref={summaryRef} style={{ opacity: 0, marginTop: 20 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'flex-start', gap: 14,
          background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(14px)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14,
          padding: '14px 20px', maxWidth: CARD_W * 2,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginTop: 3, flexShrink: 0 }}>
            <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7Z" fill="rgba(190,160,255,0.55)"/>
          </svg>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.48)', marginBottom: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Recommended: {PRODUCTS[focused].brand} {PRODUCTS[focused].name}
            </div>
            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.68)', lineHeight: 1.5 }}>
              {SUMMARIES[focused]}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, value, max, unit }: { label: string; value: number; max: number; unit: string }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.38)' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.62)' }}>{value}{unit}</span>
      </div>
      <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(value / max) * 100}%`, borderRadius: 2, background: 'linear-gradient(to right, rgba(180,145,255,0.5), rgba(200,170,255,0.82))' }} />
      </div>
    </div>
  );
}

function HeadphoneIllustration({ index, focused }: { index: number; focused: boolean }) {
  const sa = focused ? '0.18' : '0.10';
  const ca = focused ? '0.55' : '0.28';
  const c = `rgba(255,255,255,${ca})`;
  const f = `rgba(255,255,255,${sa})`;
  if (index === 0) return (
    <svg viewBox="0 0 120 120" width="96" height="96" fill="none">
      <path d="M20 60 Q20 20 60 18 Q100 20 100 60" stroke={c} strokeWidth="3" fill="none" strokeLinecap="round"/>
      <rect x="10" y="52" width="20" height="32" rx="8" fill={f} stroke={c} strokeWidth="1.8"/>
      <rect x="90" y="52" width="20" height="32" rx="8" fill={f} stroke={c} strokeWidth="1.8"/>
    </svg>
  );
  if (index === 1) return (
    <svg viewBox="0 0 120 120" width="96" height="96" fill="none">
      <path d="M18 62 Q16 22 60 18 Q104 22 102 62" stroke={c} strokeWidth="3" fill="none" strokeLinecap="round"/>
      <rect x="8" y="54" width="22" height="34" rx="6" fill={f} stroke={c} strokeWidth="1.8"/>
      <rect x="90" y="54" width="22" height="34" rx="6" fill={f} stroke={c} strokeWidth="1.8"/>
    </svg>
  );
  return (
    <svg viewBox="0 0 120 120" width="96" height="96" fill="none">
      <path d="M22 62 Q20 18 60 16 Q100 18 98 62" stroke={c} strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="4 3"/>
      <circle cx="16" cy="64" r="16" fill={f} stroke={c} strokeWidth="1.8"/>
      <circle cx="104" cy="64" r="16" fill={f} stroke={c} strokeWidth="1.8"/>
      <circle cx="16" cy="64" r="8" fill={`rgba(255,255,255,${focused ? '0.08':'0.04'})`}/>
      <circle cx="104" cy="64" r="8" fill={`rgba(255,255,255,${focused ? '0.08':'0.04'})`}/>
    </svg>
  );
}
