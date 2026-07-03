/**
 * Option 2 v2 — "Opening the Card"
 *
 * Three interaction stages, readable without any instructional text:
 *   L1 — Collapsed   : dim, compact, low emphasis
 *   L2 — Browsing    : outlined + expanded card, CTA footer visible but INACTIVE
 *   L3 — Open (ENTER): card grows ~9%, surface brightens, extra info fades in,
 *                      footer activates, focused CTA morphs outlined → filled
 *
 * The CTA row is a full-width FOOTER attached to the card's bottom edge —
 * not a floating toolbar. It reads as the card's own footer section.
 *
 * Navigation graph:
 *   thumbs (vertical ↑↓) ←RIGHT→ cards ←→ action(footer)
 *                                     ↓            ↓
 *                                  prompts ←→ inputs
 */
import { useEffect, useRef, useState } from 'react';

type Zone = 'thumbs' | 'cards' | 'action' | 'prompts' | 'inputs';

/* Buy Now is index 0 — default focus when the card opens */
const BUY_NOW_IDX = 0;

const CARDS = [
  {
    brand: 'ZARA', tag: 'My first pick', title: 'Long Sleeveless Jumpsuit', price: '$128.00',
    desc: 'Same easy fall, lighter for everyday wear. Pairs with both sneakers and sandals.',
    details: [
      { label: 'Fabric',   value: 'Viscose blend' },
      { label: 'Fit',      value: 'Relaxed'       },
      { label: 'Occasion', value: 'Casual, daily' },
      { label: 'Closure',  value: 'Hidden zip'    },
    ],
    extra: [
      { label: 'Material', value: 'Woven'        },
      { label: 'Care',     value: 'Machine wash' },
      { label: 'Length',   value: 'Full'         },
      { label: 'Lining',   value: 'None'         },
    ],
    ai: 'Great everyday pick — easy to dress up or down.',
  },
  {
    brand: 'CHANEL', tag: 'Party version', title: 'Satin Bow Velvet Jumpsuit', price: '$99.90',
    desc: 'A more formal take — deep velvet with a dramatic bow at the neckline.',
    details: [
      { label: 'Fabric',   value: 'Velvet + satin' },
      { label: 'Fit',      value: 'Tailored'       },
      { label: 'Occasion', value: 'Evening'        },
      { label: 'Care',     value: 'Dry clean'      },
    ],
    extra: [
      { label: 'Material', value: 'Velvet' },
      { label: 'Neckline', value: 'Bow'    },
      { label: 'Length',   value: 'Full'   },
      { label: 'Stretch',  value: 'Low'    },
    ],
    ai: 'Best for formal evenings and parties.',
  },
  {
    brand: 'CHANEL', tag: 'Wrap fit', title: 'Wrap Front Jumpsuit', price: '$99.90',
    desc: 'Relaxed silhouette with adjustable belt. Easy all-day wear.',
    details: [
      { label: 'Fabric',   value: 'Crepe'       },
      { label: 'Fit',      value: 'Wrap'        },
      { label: 'Occasion', value: 'Work, casual'},
      { label: 'Feature',  value: 'Belt'        },
    ],
    extra: [
      { label: 'Material', value: 'Crepe'    },
      { label: 'Closure',  value: 'Wrap tie' },
      { label: 'Length',   value: 'Full'     },
      { label: 'Stretch',  value: 'Medium'   },
    ],
    ai: 'Flexible fit that works from desk to dinner.',
  },
  {
    brand: 'CHANEL', tag: 'Green alternative', title: 'Linen Blend Jumpsuit', price: '$79.90',
    desc: 'Earthy olive tone in breathable linen. Great for warm weather.',
    details: [
      { label: 'Fabric',   value: '55% linen' },
      { label: 'Fit',      value: 'Loose'     },
      { label: 'Season',   value: 'Summer'    },
      { label: 'Feature',  value: 'Light'     },
    ],
    extra: [
      { label: 'Material',     value: 'Linen blend' },
      { label: 'Care',         value: 'Hand wash'   },
      { label: 'Breathable',   value: 'High'        },
      { label: 'Length',       value: 'Full'        },
    ],
    ai: 'Ideal for warm-weather outings.',
  },
  {
    brand: 'ZARA', tag: 'Budget pick', title: 'Basic Straight Jumpsuit', price: '$49.90',
    desc: 'Clean minimal cut, versatile — works with sneakers or heels.',
    details: [
      { label: 'Fabric',   value: 'Cotton'   },
      { label: 'Fit',      value: 'Straight' },
      { label: 'Occasion', value: 'Everyday' },
      { label: 'Feature',  value: 'Pockets'  },
    ],
    extra: [
      { label: 'Material', value: 'Cotton blend' },
      { label: 'Care',     value: 'Machine wash' },
      { label: 'Length',   value: 'Full'         },
      { label: 'Stretch',  value: 'Low'          },
    ],
    ai: 'Budget-friendly staple for daily wear.',
  },
];

const CTAS = [
  { label: 'Buy Now' },
  { label: 'Try On'  },
  { label: '♡'       },
  { label: '···'     },
];

const PROMPTS = [
  'Show me similar styles',
  'Is this available in black?',
  'What shoes pair well?',
  'Show size guide',
  'Similar but cheaper',
];

/* ── Canvas ─────────────────────────────────────────────────────────── */
const W        = 1920;
const H        = 1080;
const LEFT_PAD = 120;
const BOTTOM_H = 110;
const CARD_GAP = 20;

/* ── Sizes — L3 opens ~9% larger than L2 ──────────────────────────────── */
const L1_W = 196; const L1_H = 270;   // collapsed
const L2_W = 500; const L2_H = 380;   // browsing
const L3_W = 545; const L3_H = 414;   // open (≈ +9%)

/* ── Surfaces ─────────────────────────────────────────────────────────
   collapsed: dim  ·  browsing: outlined dark  ·  open: brighter elevated */
const SURF_COLLAPSED = '#181818';
const SURF_BROWSING  = '#1f1f1f';
const SURF_OPENED    = '#2e2e2e';

const BORDER_COLLAPSED = '1px solid #2e2e2e';
const BORDER_BROWSING  = '2px solid rgba(255,255,255,0.72)';
const BORDER_OPENED    = '2px solid rgba(255,255,255,0.95)';

const GLOW_BROWSING = '0 4px 24px rgba(0,0,0,0.6)';
const GLOW_OPENED   = '0 10px 46px rgba(0,0,0,0.72), 0 0 52px 8px rgba(255,255,255,0.08)';

export default function L1ExpandedCardPrototype() {
  const [zone,      setZone]      = useState<Zone>('cards');
  const [cardIdx,   setCardIdx]   = useState(0);
  const [ctaIdx,    setCtaIdx]    = useState(BUY_NOW_IDX);
  const [promptIdx, setPromptIdx] = useState(0);
  const [thumbIdx,  setThumbIdx]  = useState(0);
  const [inputIdx,  setInputIdx]  = useState(0);
  const [activated, setActivated] = useState<string | null>(null);

  const prevZoneRef = useRef<Zone>('cards');
  const prevCtaRef  = useRef(BUY_NOW_IDX);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const k = e.key;

      /* ── RIGHT ──────────────────────────────────────────────────── */
      if (k === 'ArrowRight') {
        e.preventDefault();
        if (zone === 'thumbs') { setZone('cards'); setCardIdx(0); }
        if (zone === 'cards')   setCardIdx(i   => Math.min(CARDS.length - 1, i + 1));
        if (zone === 'action')  setCtaIdx(i    => Math.min(CTAS.length - 1, i + 1));
        if (zone === 'prompts') setPromptIdx(i => Math.min(PROMPTS.length - 1, i + 1));
        if (zone === 'inputs') {
          if (inputIdx === 0) setInputIdx(1);
          else { setZone('prompts'); setPromptIdx(0); }
        }
      }

      /* ── LEFT ───────────────────────────────────────────────────── */
      if (k === 'ArrowLeft') {
        e.preventDefault();
        if (zone === 'thumbs') { /* left edge — no-op */ }
        if (zone === 'cards') {
          if (cardIdx === 0) { setZone('thumbs'); setThumbIdx(0); }
          else setCardIdx(i => i - 1);
        }
        if (zone === 'action') setCtaIdx(i => Math.max(0, i - 1));
        if (zone === 'prompts') {
          if (promptIdx === 0) { setZone('inputs'); setInputIdx(1); }
          else setPromptIdx(i => i - 1);
        }
        if (zone === 'inputs') {
          if (inputIdx === 1) setInputIdx(0);
        }
      }

      /* ── DOWN ───────────────────────────────────────────────────── */
      if (k === 'ArrowDown') {
        e.preventDefault();
        if (zone === 'thumbs') {
          if (thumbIdx === 0) setThumbIdx(1);  // stay inside the thumbs group
        }
        if (zone === 'cards') {
          prevZoneRef.current = 'cards'; prevCtaRef.current = ctaIdx;
          setZone('prompts'); setPromptIdx(0);
        }
        if (zone === 'action') {
          prevZoneRef.current = 'action'; prevCtaRef.current = ctaIdx;
          setZone('prompts'); setPromptIdx(0);
        }
      }

      /* ── UP ─────────────────────────────────────────────────────── */
      if (k === 'ArrowUp') {
        e.preventDefault();
        if (zone === 'thumbs') {
          if (thumbIdx === 1) setThumbIdx(0);
        }
        if (zone === 'prompts' || zone === 'inputs') {
          const ret = prevZoneRef.current;
          setZone(ret === 'action' ? 'action' : 'cards');
          if (ret === 'action') setCtaIdx(prevCtaRef.current);
        }
        if (zone === 'action') {
          /* Close the card — back to browsing. Card stays selected. */
          setZone('cards');
        }
      }

      /* ── ENTER ──────────────────────────────────────────────────── */
      if (k === 'Enter') {
        e.preventDefault();
        if (zone === 'cards') {
          /* Open the card — default focus on Buy Now */
          setZone('action');
          setCtaIdx(BUY_NOW_IDX);
        }
        if (zone === 'action') {
          setActivated(`${CTAS[ctaIdx].label} · ${CARDS[cardIdx].title}`);
          setTimeout(() => setActivated(null), 1800);
        }
      }

      /* ── ESC ────────────────────────────────────────────────────── */
      if (k === 'Escape' || k === 'Backspace') {
        e.preventDefault();
        if (zone === 'action') setZone('cards');
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [zone, cardIdx, ctaIdx, promptIdx, thumbIdx, inputIdx]);

  const inAction     = zone === 'action';
  const thumbFocused = (i: number) => zone === 'thumbs' && thumbIdx === i;
  const inputFocused = (i: number) => zone === 'inputs' && inputIdx === i;

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0c0c0c', overflow: 'hidden' }}>
      <div style={{ width: W, height: H, transformOrigin: 'top left', transform: 'scale(var(--tv-scale2,1))', position: 'relative', background: '#111', color: '#fff', fontFamily: "'Inter', 'Plus Jakarta Sans', monospace", overflow: 'hidden' }}>
        <ScaleSync cssVar="--tv-scale2" />

        <style>{`
          @keyframes openInfo {
            from { opacity: 0; transform: translateY(6px); }
            to   { opacity: 1; transform: none; }
          }
        `}</style>

        {/* ── Header ───────────────────────────────────────────────── */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, padding: `44px ${LEFT_PAD}px 0`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <WireBox>glance +</WireBox>
          <WireBox style={{ padding: '14px 32px', fontSize: 20 }}>Recommend me a jumpsuit for a casual outing</WireBox>
        </div>

        {/* ── Agent ────────────────────────────────────────────────── */}
        <div style={{ position: 'absolute', top: 138, left: LEFT_PAD, zIndex: 10, display: 'flex', alignItems: 'flex-start', gap: 18, maxWidth: 860 }}>
          <WireBox style={{ width: 48, height: 48, borderRadius: 24, flexShrink: 0, fontSize: 11, color: '#666' }}>mascot</WireBox>
          <div style={{ fontSize: 24, lineHeight: '34px', color: 'rgba(255,255,255,0.8)', paddingTop: 6, fontWeight: 500 }}>
            Here are five jumpsuits I'd pick for a casual outing — scroll to explore.
          </div>
        </div>

        {/* ── Thumbs ───────────────────────────────────────────────── */}
        <div style={{ position: 'absolute', top: 256, left: 44, display: 'flex', flexDirection: 'column', gap: 14, zIndex: 10 }}>
          {['👍', '👎'].map((icon, i) => (
            <div key={i} style={{
              width: 54, height: 54, borderRadius: 27,
              border: thumbFocused(i) ? '2px solid rgba(255,255,255,0.8)' : '1px solid #333',
              background: thumbFocused(i) ? 'rgba(255,255,255,0.14)' : '#1c1c1c',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, transition: 'all 0.16s ease',
              boxShadow: thumbFocused(i) ? '0 0 0 3px rgba(255,255,255,0.1), 0 4px 16px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.4)',
              transform: thumbFocused(i) ? 'scale(1.08)' : 'scale(1)',
            }}>
              {icon}
            </div>
          ))}
        </div>

        {/* ── Card row ─────────────────────────────────────────────── */}
        <div style={{ position: 'absolute', top: 248, left: LEFT_PAD, display: 'flex', gap: CARD_GAP, alignItems: 'flex-start', overflow: 'visible', zIndex: 2 }}>
          {CARDS.map((card, i) => {
            const isActive   = cardIdx === i && zone !== 'thumbs';
            const isExpanded = isActive;
            const isOpen     = isActive && inAction;   // L3
            const level      = !isActive ? 1 : isOpen ? 3 : 2;

            const w = level === 1 ? L1_W : level === 3 ? L3_W : L2_W;
            const h = level === 1 ? L1_H : level === 3 ? L3_H : L2_H;

            const cardBg     = level === 1 ? SURF_COLLAPSED : level === 3 ? SURF_OPENED   : SURF_BROWSING;
            const cardBorder = level === 1 ? BORDER_COLLAPSED : level === 3 ? BORDER_OPENED : BORDER_BROWSING;
            const cardShadow = level === 1 ? '0 2px 8px rgba(0,0,0,0.5)' : level === 3 ? GLOW_OPENED : GLOW_BROWSING;
            const cardOpacity   = level === 1 ? 0.5 : 1;
            const cardTranslate = level === 3 ? 'translateY(-6px)' : isExpanded ? 'translateY(-2px)' : 'translateY(0)';

            return (
              <div key={i} style={{
                width: w, flexShrink: 0,
                transition: 'width 0.26s cubic-bezier(0.4,0,0.2,1)',
                zIndex: isActive ? 3 : 1,
              }}>
                <div style={{
                  width: w, height: h,
                  border: cardBorder,
                  borderRadius: 14,
                  overflow: 'hidden',
                  background: cardBg,
                  display: 'flex', flexDirection: 'column',
                  boxShadow: cardShadow,
                  opacity: cardOpacity,
                  transform: cardTranslate,
                  transition: 'all 0.26s cubic-bezier(0.4,0,0.2,1)',
                  flexShrink: 0,
                  position: 'relative',
                }}>

                  {isExpanded ? (
                    <>
                      {/* ── BODY (image + content) ────────────────── */}
                      <div style={{ display: 'flex', flexDirection: 'row', flex: 1, minHeight: 0 }}>
                        {/* image */}
                        <div style={{
                          width: isOpen ? 200 : 186, flexShrink: 0, height: '100%',
                          background: isOpen ? '#272727' : '#1b1b1b',
                          borderRight: `1px solid ${isOpen ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.05)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#3a3a3a', fontSize: 13, flexDirection: 'column', gap: 8,
                          position: 'relative',
                          transition: 'all 0.24s ease',
                        }}>
                          <div style={{ fontSize: 28, opacity: 0.22 }}>▭</div>
                          <span style={{ fontSize: 11, color: '#404040' }}>image</span>
                          <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, fontSize: 10, color: '#555', letterSpacing: '0.08em' }}>
                            ✦ {card.tag}
                          </div>
                        </div>

                        {/* content */}
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', padding: isOpen ? '16px 18px' : '18px 18px', overflow: 'hidden' }}>
                          {/* brand + price */}
                          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 10, color: '#666', letterSpacing: '0.14em', textTransform: 'uppercase' }}>{card.brand}</span>
                            <span style={{ fontSize: 17, fontWeight: 700, color: isOpen ? '#fff' : '#ddd', transition: 'color 0.2s ease' }}>{card.price}</span>
                          </div>

                          {/* title */}
                          <div style={{ fontSize: 17, fontWeight: 700, color: isOpen ? '#fff' : '#d0d0d0', lineHeight: '23px', marginBottom: 7, transition: 'color 0.2s ease' }}>
                            {card.title}
                          </div>

                          {/* desc */}
                          <div style={{ fontSize: 12, color: isOpen ? '#a8a8a8' : '#777', lineHeight: '18px', marginBottom: 9, transition: 'color 0.2s ease' }}>
                            {card.desc}
                          </div>

                          {/* base detail pills */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: isOpen ? 8 : 0 }}>
                            {card.details.map((d, di) => (
                              <DetailPill key={di} label={d.label} value={d.value} bright={isOpen} />
                            ))}
                          </div>

                          {/* extra info — fades in only when open */}
                          {isOpen && (
                            <div style={{ animation: 'openInfo 0.28s ease forwards' }}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                                {card.extra.map((d, di) => (
                                  <DetailPill key={di} label={d.label} value={d.value} bright />
                                ))}
                              </div>
                              <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start', fontSize: 11, color: '#9a9a9a', lineHeight: '16px' }}>
                                <span style={{ color: '#6a6a6a', flexShrink: 0 }}>✦ AI pick</span>
                                <span>{card.ai}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ── FOOTER (attached to card bottom edge) ─── */}
                      <div style={{
                        flexShrink: 0,
                        borderTop: isOpen ? '1px solid rgba(255,255,255,0.16)' : '1px solid rgba(255,255,255,0.08)',
                        background: isOpen ? 'rgba(255,255,255,0.055)' : 'rgba(255,255,255,0.02)',
                        padding: '11px 16px',
                        display: 'flex', gap: 8, alignItems: 'center',
                        transition: 'background 0.22s ease, border-color 0.22s ease',
                      }}>
                        {CTAS.map((cta, ci) => {
                          const focused  = isOpen && ctaIdx === ci;
                          const isNarrow = cta.label === '♡' || cta.label === '···';
                          return (
                            <div key={ci} style={{
                              height: 40,
                              minWidth: isNarrow ? 44 : (cta.label === 'Buy Now' ? 108 : 88),
                              padding: isNarrow ? '0' : '0 16px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              borderRadius: 999,
                              fontSize: isNarrow ? 16 : 13,
                              fontWeight: focused ? 600 : 400,
                              flexShrink: 0,
                              transition: 'all 0.16s ease',
                              ...(focused ? {
                                /* filled — the chosen action */
                                background: 'rgba(255,255,255,0.95)',
                                color: '#111',
                                border: '2px solid rgba(255,255,255,0.98)',
                                boxShadow: '0 2px 16px rgba(255,255,255,0.22), 0 0 0 3px rgba(255,255,255,0.08)',
                                transform: 'scale(1.05)',
                              } : isOpen ? {
                                /* open, unfocused — outlined, clearly available */
                                background: 'transparent',
                                color: '#c4c4c4',
                                border: '1px solid rgba(255,255,255,0.30)',
                                transform: 'scale(1)',
                              } : {
                                /* browsing — inactive/disabled footer look */
                                background: 'transparent',
                                color: '#5a5a5a',
                                border: '1px solid rgba(255,255,255,0.12)',
                                transform: 'scale(1)',
                              }),
                            }}>
                              {cta.label}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    /* ── Collapsed content ─────────────────────────── */
                    <>
                      <div style={{ height: 175, flexShrink: 0, background: '#1c1c1c', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', flexDirection: 'column', gap: 6 }}>
                        <div style={{ fontSize: 18, opacity: 0.25 }}>▭</div>
                      </div>
                      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <div style={{ fontSize: 10, color: '#444', letterSpacing: '0.1em' }}>{card.brand}</div>
                        <div style={{ fontSize: 12, color: '#777', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{card.title}</div>
                        <div style={{ fontSize: 11, color: '#555' }}>{card.price}</div>
                      </div>
                    </>
                  )}
                </div>

                {/* Dev-aid stage label */}
                {isActive && (
                  <div style={{ marginTop: 7, fontSize: 10, color: '#383838', paddingLeft: 2 }}>
                    {isOpen ? 'L3 · open' : 'L2 · browsing'}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Prompt row ───────────────────────────────────────────── */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: BOTTOM_H, borderTop: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', gap: 14, padding: `0 ${LEFT_PAD}px`, zIndex: 10, background: '#111' }}>
          {[{ icon: '⌨️', idx: 0 }, { icon: '🎤', idx: 1 }].map(({ icon, idx }) => (
            <div key={idx} style={{
              width: 54, height: 54, borderRadius: 27, flexShrink: 0,
              border: inputFocused(idx) ? '2px solid rgba(255,255,255,0.8)' : '1px solid #2e2e2e',
              background: inputFocused(idx) ? 'rgba(255,255,255,0.12)' : '#1a1a1a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, transition: 'all 0.15s ease',
              boxShadow: inputFocused(idx) ? '0 0 0 3px rgba(255,255,255,0.07)' : 'none',
              transform: inputFocused(idx) ? 'scale(1.08)' : 'scale(1)',
            }}>
              {icon}
            </div>
          ))}
          {PROMPTS.map((p, i) => {
            const focused = zone === 'prompts' && promptIdx === i;
            return (
              <div key={i} style={{
                padding: '16px 24px',
                border: focused ? '2px solid rgba(255,255,255,0.8)' : '1px solid #2a2a2a',
                borderRadius: 999, fontSize: 15,
                color: focused ? '#fff' : '#666',
                background: focused ? 'rgba(255,255,255,0.1)' : 'transparent',
                boxShadow: focused ? '0 0 0 3px rgba(255,255,255,0.05)' : 'none',
                transform: focused ? 'scale(1.02) translateY(-2px)' : 'scale(1)',
                transition: 'all 0.15s ease', whiteSpace: 'nowrap',
              }}>
                {p}
              </div>
            );
          })}
        </div>

        {/* ── State badge ──────────────────────────────────────────── */}
        <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', fontSize: 11, color: '#505050', background: '#161616', border: '1px solid #242424', padding: '6px 16px', borderRadius: 4, whiteSpace: 'nowrap', zIndex: 20 }}>
          <b style={{ color: '#888' }}>{zone}</b>
          {zone === 'cards'   && <>  ·  card {cardIdx + 1}/{CARDS.length}  ·  L2 browsing</>}
          {zone === 'action'  && <>  ·  {CTAS[ctaIdx].label}  ·  L3 open</>}
          {zone === 'prompts' && <>  ·  prompt {promptIdx + 1}  ·  ↑→{prevZoneRef.current}</>}
          {zone === 'thumbs'  && <>  ·  {thumbIdx === 0 ? '👍' : '👎'}  ·  ↑↓ within group</>}
          {zone === 'inputs'  && <>  ·  {inputIdx === 0 ? '⌨️' : '🎤'}</>}
        </div>

        {/* ── Key legend ───────────────────────────────────────────── */}
        <div style={{ position: 'absolute', bottom: 120, right: 20, fontSize: 12, color: '#444', background: '#141414', border: '1px solid #222', padding: '14px 18px', borderRadius: 6, lineHeight: '24px', zIndex: 20 }}>
          ← →      browse cards · left edge → 👍/👎<br />
          ↑ ↓      within 👍/👎 · cards → prompts<br />
          ENTER    open card (footer activates → Buy Now)<br />
          ← →      browse CTAs in open card<br />
          ↑        close card → back to browsing<br />
          ↓        open card → prompts · ESC = close
        </div>

        {/* ── Activation toast ─────────────────────────────────────── */}
        {activated && (
          <div style={{ position: 'absolute', top: '42%', left: '50%', transform: 'translate(-50%,-50%)', background: '#1e1e1e', border: '2px solid rgba(255,255,255,0.7)', padding: '22px 44px', borderRadius: 12, fontSize: 20, zIndex: 100, boxShadow: '0 8px 40px rgba(0,0,0,0.8)' }}>
            ✓ {activated}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Detail pill ──────────────────────────────────────────────────────── */
function DetailPill({ label, value, bright }: { label: string; value: string; bright?: boolean }) {
  return (
    <div style={{
      fontSize: 11,
      padding: '3px 10px',
      borderRadius: 999,
      border: `1px solid ${bright ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.08)'}`,
      color: bright ? '#9a9a9a' : '#666',
      background: bright ? 'rgba(255,255,255,0.05)' : 'transparent',
      transition: 'all 0.2s ease',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ color: bright ? '#666' : '#4a4a4a' }}>{label}: </span>
      {value}
    </div>
  );
}

/* ── Scale 1920×1080 to viewport ─────────────────────────────────────── */
function ScaleSync({ cssVar }: { cssVar: string }) {
  useEffect(() => {
    const apply = () => {
      const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
      document.documentElement.style.setProperty(cssVar, String(s));
    };
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, [cssVar]);
  return null;
}

/* ── WireBox ──────────────────────────────────────────────────────────── */
function WireBox({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ border: '1px solid #333', borderRadius: 6, padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#888', ...style }}>
      {children}
    </div>
  );
}
