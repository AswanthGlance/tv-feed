import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { LEFT_PAD, RENDERER_TOP, FOCUS_BORDER, FOCUS_SHADOW, IDLE_BORDER, FOCUS_TRANSITION, ScreenPhase } from '../l1Constants';
import { SectionLabel } from '../l1SharedComponents';
import type { RendererProps } from '../l1Constants';

const METRICS = [
  {
    title: 'Active Calories',
    value: '14,250',
    unit: 'kcal',
    delta: '+12% from last week',
    deltaUp: true,
    insight: 'Best week this month',
    insightPositive: true,
    sparkData: [60, 70, 55, 80, 90, 85, 100],
  },
  {
    title: 'Workouts',
    value: '5',
    unit: 'sessions',
    delta: '3 cardio · 2 strength',
    deltaUp: true,
    insight: 'Balanced routine',
    insightPositive: true,
    sparkData: [2, 4, 3, 5, 4, 4, 5],
  },
  {
    title: 'Active Time',
    value: '8.4',
    unit: 'hours',
    delta: '+1.2 hours vs last week',
    deltaUp: true,
    insight: 'Consistent movement',
    insightPositive: true,
    sparkData: [50, 65, 70, 60, 80, 90, 85],
  },
  {
    title: 'Recovery',
    value: 'Moderate',
    unit: '',
    delta: 'Sleep avg: 6h 20m',
    deltaUp: false,
    insight: 'Add one lighter day',
    insightPositive: false,
    sparkData: [80, 72, 70, 68, 64, 60, 62],
  },
];

const CARD_W = 390;
const CARD_H = 390;

export default function InsightsRenderer({ focusIdx, phase }: RendererProps) {
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
      tl.fromTo(el, { opacity:0, y:32 }, { opacity:1, y:0, duration:0.44, ease:'power3.out' }, 0.1 + i * 0.12);
    });
  }, [phase === ScreenPhase.PRIMARY_CONTENT]);

  return (
    <div style={{
      position: 'absolute',
      top: RENDERER_TOP, left: LEFT_PAD, right: LEFT_PAD, bottom: 148,
      zIndex: 5,
    }}>
      <div ref={labelRef} style={{ opacity: 0, marginBottom: 22 }}>
        <SectionLabel>THIS WEEK · FITNESS OVERVIEW</SectionLabel>
      </div>

      <div style={{ display: 'flex', gap: 18 }}>
        {METRICS.map((m, i) => {
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
              {/* Spark chart */}
              <div style={{ padding: '16px 20px 0', height: 80 }}>
                <SparkLine data={m.sparkData} />
              </div>

              {/* Value */}
              <div style={{ padding: '10px 20px 0' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{
                    fontSize: m.value.length > 5 ? 32 : 44,
                    fontWeight: 800, color: '#fff',
                    letterSpacing: '-0.04em', lineHeight: 1,
                  }}>
                    {m.value}
                  </span>
                  {m.unit && (
                    <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.38)', fontWeight: 500 }}>
                      {m.unit}
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: 14, fontWeight: 700, letterSpacing: '0.06em',
                  color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase',
                  marginTop: 6,
                }}>
                  {m.title}
                </div>
              </div>

              {/* Delta */}
              <div style={{ padding: '10px 20px' }}>
                <span style={{
                  fontSize: 14, fontWeight: 600,
                  color: m.deltaUp ? 'rgba(190,230,190,0.7)' : 'rgba(230,190,190,0.7)',
                }}>
                  {m.deltaUp ? '↑ ' : ''}{m.delta}
                </span>
              </div>

              {/* Insight */}
              <div style={{ margin: '0 20px 18px', marginTop: 'auto' }}>
                <div style={{
                  padding: '10px 14px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    {m.insightPositive ? (
                      <path d="M4 12l5 5L20 7" stroke="rgba(190,230,190,0.65)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    ) : (
                      <path d="M12 8v5M12 16v1" stroke="rgba(230,190,190,0.65)" strokeWidth="2.2" strokeLinecap="round"/>
                    )}
                  </svg>
                  <span style={{
                    fontSize: 14, fontWeight: 500,
                    color: m.insightPositive ? 'rgba(190,230,190,0.65)' : 'rgba(230,190,190,0.65)',
                  }}>
                    {m.insight}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Sparkline — neutral white ─────────────────────────────────────────────── */
function SparkLine({ data }: { data: number[] }) {
  const max  = Math.max(...data);
  const min  = Math.min(...data);
  const H    = 52;
  const W    = 340;
  const pts  = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / (max - min + 1)) * H;
    return `${x},${y}`;
  });
  const line = 'M' + pts.join(' L');
  const area = line + ` L${W},${H} L0,${H} Z`;
  const last = pts[pts.length - 1].split(',');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" preserveAspectRatio="none">
      <path d={area} fill="rgba(255,255,255,0.04)"/>
      <path d={line} stroke="rgba(255,255,255,0.3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={last[0]} cy={last[1]} r="4" fill="rgba(255,255,255,0.6)"/>
    </svg>
  );
}
