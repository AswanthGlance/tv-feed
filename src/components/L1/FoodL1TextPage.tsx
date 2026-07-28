/**
 * Food L1 — Option A: Text-First Cards  (/food-l1-text)
 *
 * Same interaction model as FoodL1Scenarios but cards carry no photography.
 * Typography is the hero: collapsed cards show an ordinal + name; expanded
 * cards reveal a large editorial left panel with the restaurant name as the
 * hero element. Everything else (rail, CTA, QR, prompt row, keyboard nav)
 * is unchanged.
 */
import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  PLACES, CTA_ORDER, PRIMARY_IDX, FLYOUT_ITEMS, FOLLOW_UPS,
} from './FoodL1Scenarios';
import type { Place, Zone, NavDir, CtaId } from './FoodL1Scenarios';

/* ─── per-card accent colours (one per restaurant) ───────── */
const ACCENTS = ['#e8c07a', '#7ec8c8', '#c8a0e8', '#f0a0a0', '#a0e8b0'];
const TAGS: Record<string, string[]> = {
  lova:       ['Fine Dining', 'Intimate', 'Wine Bar'],
  atmosphere6:['Rooftop', 'City Views', 'Landmark'],
  bohoboho:   ['Boho Chic', 'Coffee', 'Instagram'],
  skye:       ['Rooftop', 'Lively', 'Casual'],
  twogood:    ['Art Studio', 'Creative', 'Low-key'],
};

/* ─── layout constants (same as FoodL1Scenarios) ─────────── */
const W        = 1920;
const H        = 1080;
const L_PAD    = 184;
const CARD_TOP = 248;
const EXP_H    = 504;
const EXP_W    = 880;
const COL_H    = 420;
const COL_W    = 336;
const CARD_G   = 24;

/* ─── icons ──────────────────────────────────────────────── */
function DotsIcon({ color }: { color: string }) {
  return (
    <svg width={32} height={32} viewBox="0 0 32 32" fill="none">
      <circle cx="5"  cy="15.5" r="2.5" fill={color} />
      <circle cx="16" cy="15.5" r="2.5" fill={color} />
      <circle cx="27" cy="15.5" r="2.5" fill={color} />
    </svg>
  );
}

function HeartIcon({ stroke }: { stroke: string }) {
  return (
    <svg width={32} height={32} viewBox="0 0 32 32" fill="none">
      <path
        d="M16 28C16 28 3 21 3 12.75C3 10.9598 3.71116 9.2429 4.97703 7.97703C6.2429 6.71116 7.95979 6 9.75 6C12.5738 6 14.9925 7.53875 16 10C17.0075 7.53875 19.4262 6 22.25 6C24.0402 6 25.7571 6.71116 27.023 7.97703C28.2888 9.2429 29 10.9598 29 12.75C29 21 16 28 16 28Z"
        stroke={stroke} fill="none" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

export default function FoodL1TextPage() {
  const [cardIdx,    setCardIdx]    = useState(0);
  const [zone,       setZone]       = useState<Zone>('cta');
  const [navDir,     setNavDir]     = useState<NavDir>('right');
  const [ctaIdx,     setCtaIdx]     = useState(PRIMARY_IDX.right);
  const [flyoutIdx,  setFlyoutIdx]  = useState(0);
  const [promptIdx,  setPromptIdx]  = useState(0);
  const [wishlisted, setWishlisted] = useState<Set<string>>(new Set());
  const [qrOpen,     setQrOpen]     = useState(() => new URLSearchParams(window.location.search).get('qr') === '1');
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [toast,      setToast]      = useState<string | null>(null);

  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const place    = PLACES[cardIdx];

  const railShift = L_PAD - cardIdx * (COL_W + CARD_G);

  const showToast = (msg: string) => {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast(msg);
    toastRef.current = setTimeout(() => setToast(null), 2200);
  };
  useEffect(() => () => { if (toastRef.current) clearTimeout(toastRef.current); }, []);

  /* ── keyboard ──────────────────────────────────────────── */
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const k = e.key;
      if (qrOpen) { e.preventDefault(); setQrOpen(false); setZone('cta'); return; }
      if (flyoutOpen) {
        e.preventDefault();
        if (k === 'ArrowLeft')  setFlyoutIdx(i => Math.max(0, i - 1));
        if (k === 'ArrowRight') setFlyoutIdx(i => Math.min(FLYOUT_ITEMS.length - 1, i + 1));
        if (k === 'Enter') {
          setFlyoutOpen(false); setZone('cta');
          showToast(FLYOUT_ITEMS[flyoutIdx].label + ' ✓');
        }
        if (k === 'Escape' || k === 'Backspace' || k === 'ArrowDown') {
          setFlyoutOpen(false); setZone('cta');
        }
        return;
      }
      if (zone === 'intro') {
        e.preventDefault();
        if (k === 'ArrowDown') setZone('cta');
        return;
      }
      if (zone === 'cta') {
        if (k === 'ArrowRight') {
          e.preventDefault();
          if (ctaIdx < 2) { setCtaIdx(i => i + 1); }
          else if (cardIdx < PLACES.length - 1) {
            setNavDir('right'); setCardIdx(i => i + 1); setCtaIdx(PRIMARY_IDX.right);
          }
        }
        if (k === 'ArrowLeft') {
          e.preventDefault();
          if (ctaIdx > 0) { setCtaIdx(i => i - 1); }
          else if (cardIdx > 0) {
            setNavDir('left'); setCardIdx(i => i - 1); setCtaIdx(PRIMARY_IDX.left);
          }
        }
        if (k === 'ArrowUp')   { e.preventDefault(); setZone('intro'); }
        if (k === 'ArrowDown') { e.preventDefault(); setZone('inputs'); setPromptIdx(0); }
        if (k === 'Enter') {
          e.preventDefault();
          const id = CTA_ORDER[navDir][ctaIdx];
          if (id === 'checkout') { setQrOpen(true); setZone('qrModal'); }
          if (id === 'wishlist') {
            setWishlisted(s => { const n = new Set(s); n.has(place.id) ? n.delete(place.id) : n.add(place.id); return n; });
            showToast(wishlisted.has(place.id) ? 'Removed from wishlist' : 'Added to wishlist ♥');
          }
          if (id === 'more') { setFlyoutOpen(true); setFlyoutIdx(0); setZone('flyout'); }
        }
        return;
      }
      if (zone === 'inputs') {
        if (k === 'ArrowLeft')  { e.preventDefault(); setPromptIdx(i => Math.max(0, i - 1)); }
        if (k === 'ArrowRight') { e.preventDefault(); setPromptIdx(i => Math.min(FOLLOW_UPS.length - 1, i + 1)); }
        if (k === 'ArrowUp')    { e.preventDefault(); setZone('cta'); }
        return;
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [zone, cardIdx, navDir, ctaIdx, flyoutIdx, flyoutOpen, qrOpen, promptIdx, place.id, wishlisted]);

  const ctaOrder     = CTA_ORDER[navDir];
  const focusedCtaId = zone === 'cta' ? ctaOrder[ctaIdx] : null;
  const ctaFocused   = (id: CtaId) => focusedCtaId === id;

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', overflow: 'hidden', position: 'relative' }}>
      <TextScaleSync />
      <style>{`
        @keyframes fadeUp   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes toastIn  { from{opacity:0;transform:translateX(-50%) translateY(10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes slideInRight{ from{opacity:0;transform:translateX(480px)} to{opacity:1;transform:translateX(0)} }
        .txt-gborder { position: relative; }
        .txt-gborder::before {
          content: ''; position: absolute; inset: 0; border-radius: inherit;
          padding: var(--txt-l1-hairline, 2px);
          background: linear-gradient(180deg, #ffffff, rgba(255,255,255,0.2));
          opacity: 0.15;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          pointer-events: none;
        }
      `}</style>

      <div style={{
        width: W, height: H,
        transformOrigin: 'top left',
        transform: 'scale(var(--txt-l1-scale,1)) translate(var(--txt-l1-tx,0px), var(--txt-l1-ty,0px))',
        position: 'absolute', top: 0, left: 0,
        color: '#fff',
        fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
        overflow: 'hidden',
      }}>

        {/* ── BG ─────────────────────────────────────── */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0a0812 0%, #080d10 60%, #0c0a08 100%)' }} />
        {/* subtle grid texture */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.02) 0%, transparent 60%), radial-gradient(circle at 0% 100%, rgba(100,80,200,0.04) 0%, transparent 50%)' }} />

        {/* ── Header ─────────────────────────────────── */}
        <img src="/images/l1/glance-logo-white.svg" alt="glance" style={{ position: 'absolute', top: 56, left: 72, width: 120, height: 34, zIndex: 10 }} />
        <div style={{
          position: 'absolute', top: 56, right: 120, height: 80,
          background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)',
          borderRadius: '40px 40px 0 40px', padding: '22px 32px',
          display: 'flex', alignItems: 'center',
          fontSize: 28, lineHeight: '36px', fontFamily: 'Inter,sans-serif', fontWeight: 400,
          opacity: 0.5, whiteSpace: 'nowrap', zIndex: 10,
        }}>
          Suggest places for a date night
        </div>

        {/* ── Mascot ─────────────────────────────────── */}
        <div style={{ position: 'absolute', top: 156, left: 72, width: 80, height: 80, zIndex: 5 }}>
          <img src="/images/l1/mascot.png" alt="" style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 161, height: 163, maxWidth: 'none' }} />
        </div>

        {/* ── Agent intro text ────────────────────────── */}
        <div style={{
          position: 'absolute', top: 156, left: L_PAD, height: 80, right: 120,
          display: 'flex', alignItems: 'center', zIndex: 5,
          borderRadius: 14, padding: '0 18px', marginLeft: -18,
          background: zone === 'intro' ? 'rgba(255,255,255,0.05)' : 'transparent',
          boxShadow: zone === 'intro' ? '0 0 0 1.5px rgba(255,255,255,0.2)' : 'none',
          transition: 'all 0.2s ease',
        }}>
          <p style={{ fontSize: 28, lineHeight: '40px', fontWeight: 500, color: '#fff', margin: 0 }}>
            Here are my top picks for a date in Pune, curated for that premium, intimate vibe.
          </p>
        </div>

        {/* ── Card rail ───────────────────────────────── */}
        <div style={{
          position: 'absolute', top: CARD_TOP, left: 0,
          height: EXP_H + 60,
          display: 'flex', alignItems: 'flex-start', gap: CARD_G,
          transform: `translateX(${railShift}px)`,
          transition: 'transform 0.65s cubic-bezier(0.16,1,0.3,1)',
          willChange: 'transform',
          zIndex: 5,
        }}>
          {PLACES.map((p: Place, i: number) => {
            const isFocused = cardIdx === i && (zone === 'cta' || zone === 'flyout' || zone === 'qrModal');
            const accent    = ACCENTS[i % ACCENTS.length];
            const tags      = TAGS[p.id] || [];
            const ordinal   = String(i + 1).padStart(2, '0');

            if (isFocused) {
              return (
                <div key={p.id} style={{
                  width: EXP_W, height: EXP_H, flexShrink: 0,
                  borderRadius: 32, overflow: 'hidden', position: 'relative',
                  background: '#111',
                  border: '4px solid #fff',
                  boxShadow: '0 30px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
                  transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                }}>
                  {/* white overlay tint */}
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.04)', pointerEvents: 'none', zIndex: 1 }} />

                  {/* ── LEFT: editorial typography panel ── */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, width: 384, bottom: 0,
                    background: `linear-gradient(160deg, ${accent}18 0%, #0a0a0a 100%)`,
                    padding: '40px 32px',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                    boxSizing: 'border-box',
                  }}>
                    {/* ordinal */}
                    <div style={{
                      fontSize: 120, fontWeight: 800, lineHeight: 1,
                      color: accent, opacity: 0.18, fontFamily: 'Inter,sans-serif',
                      position: 'absolute', top: 24, right: 28, pointerEvents: 'none',
                      letterSpacing: '-4px', userSelect: 'none',
                    }}>{ordinal}</div>

                    {/* top: agent label */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, zIndex: 1 }}>
                      <img src="/images/l1/pin.svg" alt="" style={{ width: 28, height: 28 }} />
                      <span style={{ fontSize: 20, fontWeight: 500, fontFamily: 'Inter,sans-serif', color: 'rgba(255,255,255,0.7)' }}>{p.agentLabel}</span>
                    </div>

                    {/* center: restaurant name — hero text */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', zIndex: 1 }}>
                      <p style={{
                        fontSize: 44, fontWeight: 700, lineHeight: '54px', margin: 0,
                        color: '#fff', letterSpacing: '-0.5px',
                        fontFamily: "'Plus Jakarta Sans',sans-serif",
                        textShadow: `0 0 60px ${accent}40`,
                      }}>{p.name}</p>
                    </div>

                    {/* bottom: area + tags */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, zIndex: 1 }}>
                      <span style={{ fontSize: 18, fontWeight: 400, color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter,sans-serif' }}>{p.area}</span>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {tags.map(tag => (
                          <span key={tag} style={{
                            padding: '4px 14px', borderRadius: 999,
                            fontSize: 14, fontWeight: 600, letterSpacing: '0.3px',
                            color: accent, background: `${accent}18`,
                            border: `1px solid ${accent}40`,
                            fontFamily: 'Inter,sans-serif',
                          }}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ── RIGHT: agent notes + rating + CTAs ── */}
                  <div style={{
                    position: 'absolute', top: 0, bottom: 0, left: 384, width: 492,
                    boxSizing: 'border-box', padding: '32px 24px',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    animation: 'fadeUp 0.4s ease both',
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img src="/images/l1/pin.svg" alt="" style={{ width: 32, height: 32 }} />
                        <span style={{ fontSize: 22, lineHeight: '28px', fontWeight: 500, fontFamily: 'Inter,sans-serif' }}>{p.agentLabel}</span>
                      </div>
                      <p style={{ fontSize: 24, lineHeight: '36px', fontWeight: 500, color: 'rgba(255,255,255,0.8)', margin: 0, fontFamily: 'Inter,sans-serif' }}>
                        {p.agentNote}
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: '#ffba71', fontSize: 20, fontWeight: 600, fontFamily: 'Inter,sans-serif' }}>{p.rating}</span>
                          <img src="/images/l1/star.svg" alt="" style={{ width: 24, height: 24 }} />
                          <span style={{ color: '#ffba71', fontSize: 20, fontWeight: 600, fontFamily: 'Inter,sans-serif' }}>({p.ratingCount} reviews)</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <p style={{ fontSize: 32, fontWeight: 600, lineHeight: '44px', margin: 0, overflow: 'hidden' }}>{p.name}</p>
                          <p style={{ fontSize: 24, fontWeight: 600, lineHeight: '32px', margin: 0 }}>{p.price}</p>
                        </div>
                      </div>

                      {/* CTA row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11, height: 64 }}>
                        {ctaOrder.map((id) => {
                          const focused = ctaFocused(id);
                          if (id === 'more') return (
                            <div key="more" onClick={() => { setFlyoutOpen(true); setFlyoutIdx(0); setZone('flyout'); }}
                              style={{
                                width: 64, height: 64, borderRadius: 32, flexShrink: 0,
                                background: focused ? '#fff' : 'rgba(255,255,255,0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: focused ? '0 0 0 2.5px rgba(255,255,255,0.8)' : 'none',
                                transition: 'all 0.15s ease', cursor: 'pointer', position: 'relative',
                              }}>
                              <DotsIcon color={focused ? '#111' : '#fff'} />
                              {flyoutOpen && (
                                <div style={{
                                  position: 'absolute', bottom: 74,
                                  ...(navDir === 'right' ? { left: 0 } : { right: 0 }),
                                  background: 'rgba(16,16,16,0.97)', backdropFilter: 'blur(20px)',
                                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20,
                                  padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 4,
                                  boxShadow: '0 -12px 40px rgba(0,0,0,0.8)',
                                  animation: 'fadeDown 0.18s ease',
                                  minWidth: 210, zIndex: 20, pointerEvents: 'none',
                                }}>
                                  {FLYOUT_ITEMS.map((item, fi) => (
                                    <div key={item.id} style={{
                                      padding: '12px 20px', borderRadius: 16,
                                      display: 'flex', alignItems: 'center', gap: 12,
                                      fontSize: 17, fontWeight: 600,
                                      background: flyoutIdx === fi ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.06)',
                                      color: flyoutIdx === fi ? '#111' : '#ccc',
                                      transition: 'all 0.12s ease',
                                    }}>
                                      <span style={{ fontSize: 18 }}>{item.icon}</span>
                                      <span>{item.label}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                          if (id === 'wishlist') return (
                            <div key="wishlist" onClick={() => {
                              setWishlisted(s => { const n = new Set(s); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n; });
                              showToast(wishlisted.has(p.id) ? 'Removed from wishlist' : 'Added to wishlist ♥');
                            }} style={{
                              width: 64, height: 64, borderRadius: 32, flexShrink: 0,
                              background: focused ? '#fff' : 'rgba(255,255,255,0.15)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              boxShadow: focused ? '0 0 0 2.5px rgba(255,255,255,0.8)' : 'none',
                              transition: 'all 0.15s ease', cursor: 'pointer',
                            }}>
                              <HeartIcon stroke={wishlisted.has(p.id) ? '#f87' : (focused ? '#111' : '#fff')} />
                            </div>
                          );
                          return (
                            <div key="checkout" onClick={() => { setQrOpen(true); setZone('qrModal'); }}
                              style={{
                                flex: 1, height: 64, borderRadius: 32,
                                background: focused ? '#ffffff' : 'rgba(255,255,255,0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 22, fontWeight: focused ? 700 : 500, fontFamily: 'Inter,sans-serif',
                                color: focused ? '#000' : '#fff', letterSpacing: '0.22px',
                                boxShadow: focused ? '0 8px 20px rgba(0,0,0,0.12), 0 0 0 3px rgba(255,255,255,0.5)' : '0 8px 40px rgba(0,0,0,0.12)',
                                transition: 'all 0.15s ease', cursor: 'pointer',
                              }}>
                              Check out
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            /* ── collapsed text card ─────────────────── */
            return (
              <div key={p.id} style={{
                width: COL_W, height: COL_H, flexShrink: 0,
                borderRadius: 32, overflow: 'hidden', position: 'relative',
                background: `linear-gradient(160deg, ${accent}14 0%, #101010 100%)`,
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                cursor: 'pointer',
              }} onClick={() => { setCardIdx(i); setZone('cta'); }}>

                {/* large faded ordinal */}
                <div style={{
                  position: 'absolute', bottom: -20, right: 12,
                  fontSize: 160, fontWeight: 800, lineHeight: 1,
                  color: accent, opacity: 0.08, fontFamily: 'Inter,sans-serif',
                  letterSpacing: '-6px', pointerEvents: 'none', userSelect: 'none',
                }}>{ordinal}</div>

                {/* top: agent label */}
                <div style={{ position: 'absolute', top: 20, left: 20, right: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img src="/images/l1/pin.svg" alt="" style={{ width: 28, height: 28, opacity: 0.7 }} />
                  <span style={{ fontSize: 20, fontWeight: 500, fontFamily: 'Inter,sans-serif', color: 'rgba(255,255,255,0.6)' }}>{p.agentLabel}</span>
                </div>

                {/* center: accent line + name */}
                <div style={{
                  position: 'absolute', top: '50%', left: 20, right: 20,
                  transform: 'translateY(-50%)',
                }}>
                  <div style={{ width: 32, height: 3, borderRadius: 2, background: accent, marginBottom: 16, opacity: 0.7 }} />
                  <p style={{
                    fontSize: 28, fontWeight: 700, lineHeight: '38px', margin: 0,
                    color: 'rgba(255,255,255,0.9)',
                    fontFamily: "'Plus Jakarta Sans',sans-serif",
                    overflow: 'hidden',
                    display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                  }}>{p.name}</p>
                </div>

                {/* bottom: rating + price */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: '#ffba71', fontSize: 18, fontWeight: 600, fontFamily: 'Inter,sans-serif' }}>{p.rating}</span>
                    <img src="/images/l1/star.svg" alt="" style={{ width: 18, height: 18 }} />
                  </div>
                  <p style={{ fontSize: 18, fontWeight: 500, lineHeight: '24px', margin: 0, color: 'rgba(255,255,255,0.45)', fontFamily: 'Inter,sans-serif' }}>{p.price}</p>
                </div>

                {/* inset glow */}
                <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 20px rgba(255,255,255,0.03)', borderRadius: 30, pointerEvents: 'none' }} />
              </div>
            );
          })}
          <div style={{ width: 80, flexShrink: 0 }} />
        </div>

        {/* ── Prompt row ──────────────────────────────── */}
        <div style={{
          position: 'absolute', top: 944, left: L_PAD, right: 0, height: 72,
          display: 'flex', alignItems: 'center', gap: 32,
          zIndex: 13, overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <div className="txt-gborder" style={{ width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <img src="/images/l1/keyboard.svg" alt="" style={{ width: 40, height: 40 }} />
            </div>
            <div className="txt-gborder" style={{ width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <img src="/images/l1/mic.svg" alt="" style={{ width: 40, height: 40 }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {FOLLOW_UPS.map((fp, i) => {
              const on = zone === 'inputs' && promptIdx === i;
              return (
                <div key={i} className={on ? undefined : 'txt-gborder'} style={{
                  height: 72, padding: '0 32px', borderRadius: 999, boxSizing: 'border-box',
                  display: 'flex', alignItems: 'center',
                  fontSize: 22, lineHeight: '32px', fontWeight: 500, letterSpacing: '0.22px',
                  color: on ? '#111' : 'rgba(255,255,255,0.6)',
                  background: on ? 'rgba(255,255,255,0.95)' : 'transparent',
                  boxShadow: on ? '0 6px 20px rgba(255,255,255,0.12)' : 'none',
                  transform: on ? 'scale(1.03)' : 'scale(1)',
                  transition: 'all 0.15s ease', whiteSpace: 'nowrap', flexShrink: 0,
                }}>{fp}</div>
              );
            })}
          </div>
        </div>

        {/* ── QR overlay ──────────────────────────────── */}
        {qrOpen && (
          <>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', zIndex: 60, animation: 'fadeIn 0.3s ease both' }} />
            <div style={{ position: 'absolute', inset: 0, zIndex: 61, animation: 'slideInRight 0.45s cubic-bezier(0.22,1,0.36,1) both', pointerEvents: 'none' }}>
              <div style={{ position: 'absolute', top: -102, right: -92, width: 1232, height: 1284, zIndex: 61 }}>
                <img src="/images/l1/qr-panel.svg" alt="" style={{ width: '100%', height: '100%', display: 'block' }} />
              </div>
              <div onClick={() => { setQrOpen(false); setZone('cta'); }} style={{
                position: 'absolute', left: 772, top: '50%', transform: 'translateY(-50%)',
                width: 80, height: 80, borderRadius: '50%', boxSizing: 'border-box',
                background: '#fff', border: '2px solid rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 63, cursor: 'pointer', pointerEvents: 'auto',
              }}>
                <img src="/images/l1/close-x.svg" alt="close" style={{ width: 40, height: 40 }} />
              </div>
              <div style={{ position: 'absolute', left: 1095, top: 130, width: 623, zIndex: 62, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
                <p style={{ fontSize: 48, lineHeight: '64px', fontWeight: 600, color: '#fff', margin: 0 }}>Scan to Check Out</p>
                <p style={{ fontSize: 24, fontWeight: 500, color: 'rgba(255,255,255,0.8)', letterSpacing: '-0.24px', margin: 0, fontFamily: 'Inter,sans-serif' }}>
                  You will be redirected to the brand&rsquo;s official page
                </p>
              </div>
              <div style={{ position: 'absolute', left: 1176, top: '50%', transform: 'translateY(-50%)', width: 460, height: 460, zIndex: 62 }}>
                <img src="/images/l1/qr-blob.svg" alt="" style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 557, height: 557, maxWidth: 'none' }} />
                <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>
                  <QRCodeSVG value={place.mapsUrl} size={330} bgColor="transparent" fgColor="#111" level="H" imageSettings={{ src: '/images/l1/cp-logo.svg', width: 88, height: 88, excavate: true }} />
                </div>
              </div>
              <div style={{ position: 'absolute', left: 1211, top: 834, width: 390, zIndex: 62, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 120, height: 140, borderRadius: 16, flexShrink: 0, overflow: 'hidden', border: '1.4px solid rgba(255,255,255,0.2)', background: '#111', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 48, fontWeight: 800, color: ACCENTS[cardIdx % ACCENTS.length], opacity: 0.6, fontFamily: 'Inter,sans-serif' }}>{String(cardIdx + 1).padStart(2, '0')}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <img src="/images/l1/star.svg" alt="" style={{ width: 20, height: 20 }} />
                    <span style={{ color: '#ffba71', fontSize: 18, fontWeight: 600, fontFamily: 'Inter,sans-serif' }}>{place.rating} ({place.ratingCount} reviews)</span>
                  </div>
                  <p style={{ fontSize: 22, fontWeight: 500, color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.22px', margin: 0, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{place.name}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Toast ───────────────────────────────────── */}
        {toast && (
          <div style={{
            position: 'absolute', bottom: 160, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(18,18,18,0.96)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999,
            padding: '12px 28px', fontSize: 16, fontWeight: 600, color: '#e8e8e8',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            animation: 'toastIn 0.18s ease', zIndex: 70, whiteSpace: 'nowrap',
          }}>{toast}</div>
        )}

        {/* ── Debug badge ─────────────────────────────── */}
        <div style={{ position: 'absolute', top: 56, left: '50%', transform: 'translateX(-50%)', fontSize: 12, color: '#555', background: 'rgba(8,8,8,0.85)', border: '1px solid #1e1e1e', padding: '5px 14px', borderRadius: 4, zIndex: 10, whiteSpace: 'nowrap' }}>
          Text-First · zone: <b style={{ color: '#888' }}>{zone}</b>
          {zone === 'cta' && <> · {focusedCtaId} · dir:{navDir}</>}
        </div>

      </div>
    </div>
  );
}

function TextScaleSync() {
  useEffect(() => {
    const apply = () => {
      const s  = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
      const tx = (window.innerWidth  - 1920 * s) / 2 / s;
      const ty = (window.innerHeight - 1080 * s) / 2 / s;
      document.documentElement.style.setProperty('--txt-l1-scale', String(s));
      document.documentElement.style.setProperty('--txt-l1-tx', `${tx}px`);
      document.documentElement.style.setProperty('--txt-l1-ty', `${ty}px`);
      document.documentElement.style.setProperty('--txt-l1-hairline', `${2 / s}px`);
    };
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, []);
  return null;
}
