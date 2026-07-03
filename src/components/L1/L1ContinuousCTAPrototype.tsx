/**
 * Option 3 — Continuous Primary CTA Navigation
 *
 * Key idea: Buy Now is the navigation anchor.
 *   - No ENTER required — CTAs are always the active zone alongside the card.
 *   - RIGHT from Buy Now (rightmost CTA, card moving right) → next card, Buy Now focused.
 *   - LEFT  from More  (leftmost CTA, card moving left)    → prev card, Buy Now focused
 *     but CTA order FLIPS so Buy Now is now leftmost (mirrored layout).
 *   - Direction flag tracks which way the user last arrived at this card.
 *
 * Navigation graph:
 *   thumbs ←→ [cta+card zone] ←→ thumbs (right edge wraps)
 *   [cta+card zone]:
 *     RIGHT from BuyNow → next card (BuyNow focused, normal order)
 *     LEFT  from More   → prev card (BuyNow focused, mirrored order)
 *     LEFT/RIGHT inside CTAs cycles through them
 *   DOWN → prompts
 *   UP   ← prompts (restores last CTA)
 *   LEFT at card 0 + leftmost CTA → thumbs
 *   LEFT of ⌨️/🎤 ← prompts at index 0
 */
import { useEffect, useRef, useState } from 'react';

type Zone = 'thumbs' | 'cta' | 'prompts' | 'inputs';
type Dir  = 'right' | 'left'; // direction of last card arrival

const CARDS = [
  { brand: 'ZARA',   tag: 'My first pick',     title: 'Long Sleeveless Jumpsuit',  price: '$128.00' },
  { brand: 'CHANEL', tag: 'Party version',      title: 'Satin Bow Velvet Jumpsuit', price: '$99.90'  },
  { brand: 'CHANEL', tag: 'Wrap fit',            title: 'Wrap Front Jumpsuit',       price: '$99.90'  },
  { brand: 'CHANEL', tag: 'Green alternative',   title: 'Linen Blend Jumpsuit',      price: '$79.90'  },
  { brand: 'ZARA',   tag: 'Budget pick',         title: 'Basic Straight Jumpsuit',   price: '$49.90'  },
];

/* Normal order (arrived from left / initial): More Favorite Try On [Buy Now] */
const CTAS_NORMAL = [
  { label: 'More',     id: 'more'    },
  { label: 'Favorite', id: 'fav'     },
  { label: 'Try On',   id: 'try-on'  },
  { label: 'Buy Now',  id: 'buy-now' },
];
/* Mirrored order (arrived from right): [Buy Now] Try On Favorite More */
const CTAS_MIRROR = [
  { label: 'Buy Now',  id: 'buy-now' },
  { label: 'Try On',   id: 'try-on'  },
  { label: 'Favorite', id: 'fav'     },
  { label: 'More',     id: 'more'    },
];

const PROMPTS = [
  'Show me the ingredient list',
  'Make this vegetarian',
  'What toppings work best?',
  'Suggest how to make chashu pork',
  'Suggest a quick version',
];

const W        = 1920;
const H        = 1080;
const LEFT_PAD = 120;
const PRIMARY_W  = 460;
const SECONDARY_W = 220;
const CARD_H     = 280;
const CARD_GAP   = 16;
const CTA_H      = 60;
const CTA_GAP    = 12;
const BOTTOM_H   = 110;

export default function L1ContinuousCTAPrototype() {
  const [zone,      setZone]      = useState<Zone>('cta');
  const [cardIdx,   setCardIdx]   = useState(0);
  const [ctaIdx,    setCtaIdx]    = useState(3);   // 3 = Buy Now in normal order
  const [dir,       setDir]       = useState<Dir>('right');
  const [promptIdx, setPromptIdx] = useState(0);
  const [thumbIdx,  setThumbIdx]  = useState(0);   // 0=👍 1=👎
  const [inputIdx,  setInputIdx]  = useState(0);   // 0=⌨️ 1=🎤
  const [activated, setActivated] = useState<string | null>(null);

  // save ctaIdx when going to prompts so UP restores it
  const savedCtaRef = useRef(3);
  const savedDirRef = useRef<Dir>('right');

  const CTAS = dir === 'right' ? CTAS_NORMAL : CTAS_MIRROR;

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const k = e.key;

      /* ── RIGHT ────────────────────────────────────────────────────────── */
      if (k === 'ArrowRight') {
        e.preventDefault();

        if (zone === 'thumbs') {
          if (thumbIdx === 1) setThumbIdx(0);                        // 👎 → 👍
          else { setZone('cta'); setDir('right'); setCtaIdx(3); }    // 👍 → card 0 Buy Now
        }

        if (zone === 'cta') {
          const buyNowIdx = dir === 'right' ? 3 : 0;
          if (ctaIdx === buyNowIdx) {
            // at Buy Now + rightmost → move to next card (normal order, Buy Now)
            if (cardIdx < CARDS.length - 1) {
              setCardIdx(i => i + 1);
              setDir('right');
              setCtaIdx(3); // Buy Now in CTAS_NORMAL
            }
          } else {
            setCtaIdx(i => Math.min(CTAS.length - 1, i + 1));
          }
        }

        if (zone === 'prompts') setPromptIdx(i => Math.min(PROMPTS.length - 1, i + 1));

        if (zone === 'inputs') {
          if (inputIdx === 0) setInputIdx(1);
          else { setZone('prompts'); setPromptIdx(0); }
        }
      }

      /* ── LEFT ─────────────────────────────────────────────────────────── */
      if (k === 'ArrowLeft') {
        e.preventDefault();

        if (zone === 'thumbs') {
          if (thumbIdx === 0) setThumbIdx(1);
          // at 👎: no-op
        }

        if (zone === 'cta') {
          const moreIdx = dir === 'right' ? 0 : 3;
          if (ctaIdx === moreIdx) {
            // at More + leftmost → move to prev card (mirrored, Buy Now)
            if (cardIdx > 0) {
              setCardIdx(i => i - 1);
              setDir('left');
              setCtaIdx(0); // Buy Now in CTAS_MIRROR
            } else {
              // card 0, leftmost CTA → go to thumbs
              setZone('thumbs'); setThumbIdx(0);
            }
          } else {
            setCtaIdx(i => Math.max(0, i - 1));
          }
        }

        if (zone === 'prompts') {
          if (promptIdx === 0) { setZone('inputs'); setInputIdx(1); }
          else setPromptIdx(i => i - 1);
        }

        if (zone === 'inputs') {
          if (inputIdx === 1) setInputIdx(0);
          // at ⌨️: no-op
        }
      }

      /* ── DOWN ─────────────────────────────────────────────────────────── */
      if (k === 'ArrowDown') {
        e.preventDefault();
        if (zone === 'cta' || zone === 'thumbs') {
          savedCtaRef.current = ctaIdx;
          savedDirRef.current = dir;
          setZone('prompts'); setPromptIdx(0);
        }
      }

      /* ── UP ───────────────────────────────────────────────────────────── */
      if (k === 'ArrowUp') {
        e.preventDefault();
        if (zone === 'prompts' || zone === 'inputs') {
          setZone('cta');
          setCtaIdx(savedCtaRef.current);
          setDir(savedDirRef.current);
        }
      }

      /* ── ENTER ────────────────────────────────────────────────────────── */
      if (k === 'Enter') {
        e.preventDefault();
        if (zone === 'cta') {
          const msg = `${CTAS[ctaIdx].label} · ${CARDS[cardIdx].title}`;
          setActivated(msg);
          setTimeout(() => setActivated(null), 1800);
        }
      }
    };

    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zone, cardIdx, ctaIdx, dir, promptIdx, thumbIdx, inputIdx]);

  const thumbFocused = (i: number) => zone === 'thumbs' && thumbIdx === i;
  const inputFocused = (i: number) => zone === 'inputs' && inputIdx === i;

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', overflow: 'hidden' }}>
      <div style={{ width: W, height: H, transformOrigin: 'top left', transform: 'scale(var(--tv-scale3,1))', position: 'relative', background: '#111', color: '#fff', fontFamily: 'monospace', overflow: 'hidden' }}>
        <ScaleSync cssVar="--tv-scale3" />

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: `44px ${LEFT_PAD}px 0`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <WireBox>glance +</WireBox>
          <WireBox style={{ padding: '14px 32px', fontSize: 22 }}>Check the Recipe of Miso Ramen</WireBox>
        </div>

        {/* ── Agent ──────────────────────────────────────────────────────── */}
        <div style={{ position: 'absolute', top: 140, left: LEFT_PAD, display: 'flex', alignItems: 'flex-start', gap: 20, maxWidth: 900 }}>
          <WireBox style={{ width: 52, height: 52, borderRadius: 26, flexShrink: 0, fontSize: 11, color: '#777' }}>mascot</WireBox>
          <div style={{ fontSize: 26, lineHeight: '36px', color: 'rgba(255,255,255,0.85)', paddingTop: 8, fontWeight: 500 }}>
            I'll walk you through it step by step, keeping it easy to follow.
          </div>
        </div>

        {/* ── Thumbs ─────────────────────────────────────────────────────── */}
        <div style={{ position: 'absolute', top: 258, left: 46, display: 'flex', flexDirection: 'column', gap: 14, zIndex: 5 }}>
          {['👍', '👎'].map((icon, i) => (
            <div key={i} style={{
              width: 56, height: 56, borderRadius: 28,
              border: thumbFocused(i) ? '2px solid #fff' : '1px solid #3a3a3a',
              background: thumbFocused(i) ? 'rgba(255,255,255,0.12)' : '#1a1a1a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, transition: 'all 0.14s ease',
              boxShadow: thumbFocused(i) ? '0 0 0 3px rgba(255,255,255,0.15)' : 'none',
            }}>
              {icon}
            </div>
          ))}
        </div>

        {/* ── Card row ───────────────────────────────────────────────────── */}
        <div style={{ position: 'absolute', top: 248, left: LEFT_PAD, display: 'flex', gap: CARD_GAP, alignItems: 'flex-start', overflow: 'visible' }}>
          {CARDS.map((card, i) => {
            const focused  = zone === 'cta' && cardIdx === i;
            const isPrimary = i === 0 && focused;
            const w = isPrimary ? PRIMARY_W : SECONDARY_W;

            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', width: w, flexShrink: 0, transition: 'width 0.18s ease' }}>

                {/* Card */}
                <div style={{
                  width: w, height: CARD_H,
                  border: focused ? '2px solid #fff' : '1px solid #3a3a3a',
                  borderRadius: 12, overflow: 'hidden',
                  display: 'flex', flexDirection: isPrimary ? 'row' : 'column',
                  background: '#1a1a1a', transition: 'all 0.18s ease', flexShrink: 0,
                }}>
                  {isPrimary ? (
                    <>
                      <div style={{ width: 200, flexShrink: 0, background: '#252525', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#484848', fontSize: 13, borderRight: '1px dashed #2e2e2e' }}>
                        [ image ]
                      </div>
                      <div style={{ flex: 1, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 6, overflow: 'hidden' }}>
                        <div style={{ fontSize: 13, color: '#666', letterSpacing: '0.1em' }}>✦ {card.tag}</div>
                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ fontSize: 13, color: '#666', letterSpacing: '0.12em' }}>{card.brand}</div>
                          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#fff' }}>{card.title}</div>
                          <div style={{ fontSize: 16, color: '#ddd' }}>{card.price}</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ flex: 1, background: '#252525', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#484848', fontSize: 13, position: 'relative' }}>
                        [ image ]
                        <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, color: '#888' }}>✦ {card.tag}</div>
                      </div>
                      <div style={{ padding: '10px 12px', background: '#1a1a1a', borderTop: '1px solid #2e2e2e' }}>
                        <div style={{ fontSize: 11, color: '#555', letterSpacing: '0.1em', marginBottom: 2 }}>{card.brand}</div>
                        <div style={{ fontSize: 13, color: '#ccc', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{card.title}</div>
                        <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{card.price}</div>
                      </div>
                    </>
                  )}
                </div>

                {/* CTA strip — always shown for focused card */}
                {focused && (
                  <div style={{ marginTop: CTA_GAP, height: CTA_H, display: 'flex', alignItems: 'center', gap: 10 }}>
                    {CTAS.map((cta, ci) => {
                      const isBuyNow  = cta.id === 'buy-now';
                      const ctaFocused = ctaIdx === ci;
                      return (
                        <div key={cta.id} style={{
                          height: 48,
                          minWidth: isBuyNow ? 150 : (cta.label === 'Try On' ? 130 : (cta.label === 'Favorite' ? 120 : 80)),
                          padding: '0 20px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: ctaFocused ? '2px solid #fff' : '1px solid #444',
                          borderRadius: 999, fontSize: 16,
                          background: ctaFocused
                            ? (isBuyNow ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.12)')
                            : '#1e1e1e',
                          color: ctaFocused ? '#fff' : '#777',
                          transition: 'all 0.12s ease', flexShrink: 0,
                          fontWeight: isBuyNow ? 'bold' : 'normal',
                        }}>
                          {cta.label}
                          {/* directional hint on the navigation-exit CTA */}
                          {cta.id === 'buy-now' && dir === 'right' && ctaFocused && (
                            <span style={{ marginLeft: 8, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>→ next</span>
                          )}
                          {cta.id === 'more' && dir === 'right' && ctaFocused && (
                            <span style={{ marginLeft: 8, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>← prev</span>
                          )}
                          {cta.id === 'buy-now' && dir === 'left' && ctaFocused && (
                            <span style={{ marginRight: 8, fontSize: 12, color: 'rgba(255,255,255,0.5)', order: -1 }}>← prev</span>
                          )}
                          {cta.id === 'more' && dir === 'left' && ctaFocused && (
                            <span style={{ marginLeft: 8, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>→ next</span>
                          )}
                        </div>
                      );
                    })}
                    <div style={{ fontSize: 12, color: '#3a3a3a', marginLeft: 6, whiteSpace: 'nowrap' }}>
                      ENTER · ↓prompts
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Direction indicator ────────────────────────────────────────── */}
        <div style={{ position: 'absolute', top: 258 + CARD_H + CTA_GAP + CTA_H + 12, left: LEFT_PAD, fontSize: 13, color: '#444' }}>
          CTA order: {dir === 'right' ? 'normal (arrived from left →)' : 'mirrored (arrived from right ←)'}
          &nbsp;·&nbsp;
          card {cardIdx + 1}/{CARDS.length}
        </div>

        {/* ── Prompt row ─────────────────────────────────────────────────── */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: BOTTOM_H, borderTop: '1px solid #242424', display: 'flex', alignItems: 'center', gap: 14, padding: `0 ${LEFT_PAD}px` }}>
          <div style={{
            width: 56, height: 56, borderRadius: 28, flexShrink: 0,
            border: inputFocused(0) ? '2px solid #fff' : '1px solid #3a3a3a',
            background: inputFocused(0) ? 'rgba(255,255,255,0.12)' : '#1a1a1a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, transition: 'all 0.14s ease',
          }}>⌨️</div>
          <div style={{
            width: 56, height: 56, borderRadius: 28, flexShrink: 0,
            border: inputFocused(1) ? '2px solid #fff' : '1px solid #3a3a3a',
            background: inputFocused(1) ? 'rgba(255,255,255,0.12)' : '#1a1a1a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, transition: 'all 0.14s ease',
          }}>🎤</div>
          {PROMPTS.map((p, i) => {
            const focused = zone === 'prompts' && promptIdx === i;
            return (
              <div key={i} style={{
                padding: '18px 28px',
                border: focused ? '2px solid #fff' : '1px solid #383838',
                borderRadius: 999, fontSize: 17,
                color: focused ? '#fff' : '#777',
                background: focused ? 'rgba(255,255,255,0.1)' : 'transparent',
                transition: 'all 0.12s ease', whiteSpace: 'nowrap',
              }}>
                {p}
              </div>
            );
          })}
        </div>

        {/* ── State badge ────────────────────────────────────────────────── */}
        <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', fontSize: 13, color: '#666', background: '#181818', border: '1px solid #2e2e2e', padding: '8px 18px', borderRadius: 4, whiteSpace: 'nowrap' }}>
          zone: <b style={{ color: '#bbb' }}>{zone}</b>
          {zone === 'cta'     && <>  ·  card {cardIdx + 1}  ·  {CTAS[ctaIdx]?.label}  ·  order: {dir}</>}
          {zone === 'prompts' && <>  ·  prompt {promptIdx + 1}/{PROMPTS.length}</>}
          {zone === 'thumbs'  && <>  ·  {thumbIdx === 0 ? '👍' : '👎'}</>}
          {zone === 'inputs'  && <>  ·  {inputIdx === 0 ? '⌨️' : '🎤'}</>}
        </div>

        {/* ── Key legend ─────────────────────────────────────────────────── */}
        <div style={{ position: 'absolute', bottom: 120, right: 20, fontSize: 14, color: '#555', background: '#161616', border: '1px solid #2a2a2a', padding: '14px 20px', borderRadius: 6, lineHeight: '26px' }}>
          ← →    browse CTAs · edge exits → next/prev card<br />
          ↓       CTA → prompts<br />
          ↑       prompts → restore CTA<br />
          ENTER   activate selected CTA<br />
          left edge of card 0 → 👍/👎
        </div>

        {/* ── Toast ──────────────────────────────────────────────────────── */}
        {activated && (
          <div style={{ position: 'absolute', top: '42%', left: '50%', transform: 'translate(-50%,-50%)', background: '#222', border: '2px solid #fff', padding: '22px 44px', borderRadius: 10, fontSize: 22, zIndex: 100 }}>
            ✓ {activated}
          </div>
        )}
      </div>
    </div>
  );
}

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

function WireBox({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ border: '1px solid #444', borderRadius: 6, padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#999', ...style }}>
      {children}
    </div>
  );
}
