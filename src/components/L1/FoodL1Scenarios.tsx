/**
 * Food L1 Scenarios — /food-l1 (Mirrored CTA Navigation experiment)
 * UI per Figma "Akira v4 GTV Ambient" node 4641-14719.
 *
 * Focus model:
 *   'cta'     — navigating through the CTA row (card always highlighted)
 *   'inputs'  — bottom prompt chips
 *   'intro'   — agent intro text
 *   'qrModal' — QR overlay
 *   'flyout'  — 3-dot flyout menu
 *
 * CTA order mirrors based on last navigation direction:
 *   dir='right': [More (0)]  [Wishlist (1)]  [Check out (2)]
 *   dir='left':  [Check out (0)]  [Wishlist (1)]  [More (2)]
 *
 * On card entry: focus always lands on Check out (primary CTA)
 *   dir='right' → ctaIdx=2   dir='left' → ctaIdx=0
 *
 * D-pad in cta zone:
 *   RIGHT: ctaIdx++ or (at rightmost) next card, dir='right', ctaIdx=2
 *   LEFT:  ctaIdx-- or (at leftmost)  prev card, dir='left',  ctaIdx=0
 *   UP → intro | DOWN → inputs | ENTER → activate focused CTA
 */
import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

/* ─── types ──────────────────────────────────────────────── */
// Exported alongside the data/constants below so other internal-only pages
// (e.g. the L1 Scenarios leadership demo) can replay the exact same content
// and interaction model instead of re-declaring mock data. Purely additive —
// no behavior change to this page.
export interface Place {
  id: string;
  name: string;
  area: string;
  rating: number;
  ratingCount: string;
  price: string;
  agentLabel: string;
  agentNote: string;
  mapsUrl: string;
  photo: string;
}

export type Zone       = 'intro' | 'cta' | 'inputs' | 'qrModal' | 'flyout';
export type NavDir     = 'right' | 'left';
export type CtaId      = 'checkout' | 'wishlist' | 'more';
export type FlyoutItem = 'like' | 'dislike' | 'copyLink' | 'report';

/* ─── data ───────────────────────────────────────────────── */
export const PLACES: Place[] = [
  {
    id: 'lova',
    name: 'LOVA – By Escada (Viman Nagar)',
    area: 'Viman Nagar, Pune',
    rating: 4.4, ratingCount: '1.4K',
    price: 'From ₹299 – ₹1500',
    agentLabel: 'My first pick',
    agentNote: 'The rating is solid, the ambiance is consistently praised for being intimate.',
    mapsUrl: 'https://maps.google.com/?cid=11822058977777278817',
    photo: '/images/l1/photo_lova.png',
  },
  {
    id: 'atmosphere6',
    name: 'Atmosphere 6 (Viman Nagar)',
    area: 'Viman Nagar, Pune',
    rating: 4.1, ratingCount: '890',
    price: 'From ₹200 – ₹1000',
    agentLabel: 'Rooftop views',
    agentNote: 'Panoramic city views from the 6th floor. The classic date spot for special occasions.',
    mapsUrl: 'https://maps.google.com/?cid=11008147915036029934',
    photo: '/images/l1/photo_atmosphere6.png',
  },
  {
    id: 'bohoboho',
    name: 'Boho Boho (Koregaon Park)',
    area: 'Koregaon Park, Pune',
    rating: 4.3, ratingCount: '3.4K',
    price: 'From ₹499 – ₹2000',
    agentLabel: 'Casual date',
    agentNote: 'Relaxed yet stylish. Great for a coffee date or light dinner — very Instagram-worthy.',
    mapsUrl: 'https://maps.google.com/?cid=13732839102082775385',
    photo: '/images/l1/photo_bohoboho.png',
  },
  {
    id: 'skye',
    name: 'SKYE Rooftop by Eternia (Shivajinagar)',
    area: 'Shivajinagar, Pune',
    rating: 3.9, ratingCount: '1.2K',
    price: 'From ₹499.00',
    agentLabel: 'Evening out',
    agentNote: 'Great rooftop views with a lively yet intimate setting. Perfect for a casual evening out.',
    mapsUrl: 'https://maps.google.com/?cid=12701367637525960296',
    photo: '/images/l1/photo_skye.png',
  },
  {
    id: 'twogood',
    name: 'Two Good (Koregaon Park)',
    area: 'Koregaon Park, Pune',
    rating: 4.4, ratingCount: '780',
    price: 'From ₹500',
    agentLabel: 'Creative date',
    agentNote: 'Food, art, and studio space. A unique low-key date where you explore art over coffee.',
    mapsUrl: 'https://maps.google.com/?cid=17376652949021736686',
    photo: '/images/l1/bg.png',
  },
];

// CTA order by direction — primary (Check out) always nearest to navigation direction
export const CTA_ORDER: Record<NavDir, CtaId[]> = {
  right: ['more', 'wishlist', 'checkout'],
  left:  ['checkout', 'wishlist', 'more'],
};
export const PRIMARY_IDX: Record<NavDir, number> = { right: 2, left: 0 };

export const FLYOUT_ITEMS: { id: FlyoutItem; label: string; icon: string }[] = [
  { id: 'like',     label: 'Like this',      icon: '👍' },
  { id: 'dislike',  label: 'Not interested', icon: '👎' },
  { id: 'copyLink', label: 'Copy link',       icon: '🔗' },
  { id: 'report',   label: 'Report',          icon: '🚩' },
];

export const FOLLOW_UPS = [
  'Show me the menu',
  'Find vegan options',
  "What's the dress code?",
  'Suggest a place with live music',
  'Budget-friendly picks',
];

/* ─── layout — matches Figma exactly ─────────────────────── */
const W        = 1920;
const H        = 1080;
const L_PAD    = 184;   // Figma left edge of cards / agent text
const CARD_TOP = 248;
const EXP_H    = 504;   // expanded card height
const EXP_W    = 880;   // expanded card width
const COL_H    = 420;   // collapsed card height
const COL_W    = 336;   // collapsed card width
const CARD_G   = 24;    // gap between cards

/* ─── inline icons (recolorable for focus states) ────────── */
function DotsIcon({ color }: { color: string }) {
  return (
    <svg width={32} height={32} viewBox="0 0 32 32" fill="none">
      <circle cx="5"  cy="15.5" r="2.5" fill={color} stroke={color} />
      <circle cx="16" cy="15.5" r="2.5" fill={color} stroke={color} />
      <circle cx="27" cy="15.5" r="2.5" fill={color} stroke={color} />
    </svg>
  );
}

function HeartIcon({ stroke, fill = 'none' }: { stroke: string; fill?: string }) {
  return (
    <svg width={32} height={32} viewBox="0 0 32 32" fill="none">
      <path
        d="M16 28C16 28 3 21 3 12.75C3 10.9598 3.71116 9.2429 4.97703 7.97703C6.2429 6.71116 7.95979 6 9.75 6C12.5738 6 14.9925 7.53875 16 10C17.0075 7.53875 19.4262 6 22.25 6C24.0402 6 25.7571 6.71116 27.023 7.97703C28.2888 9.2429 29 10.9598 29 12.75C29 21 16 28 16 28Z"
        stroke={stroke} fill={fill} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

/* ─── component ──────────────────────────────────────────── */
export default function FoodL1Scenarios() {
  const [cardIdx,    setCardIdx]    = useState(0);
  const [zone,       setZone]       = useState<Zone>('cta');
  const [navDir,     setNavDir]     = useState<NavDir>('right');
  const [ctaIdx,     setCtaIdx]     = useState(PRIMARY_IDX.right);
  const [flyoutIdx,  setFlyoutIdx]  = useState(0);
  const [promptIdx,  setPromptIdx]  = useState(0);
  const [liked,      setLiked]      = useState<Set<string>>(new Set());
  const [wishlisted, setWishlisted] = useState<Set<string>>(new Set());
  const [qrOpen,     setQrOpen]     = useState(() => new URLSearchParams(window.location.search).get('qr') === '1');
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [toast,      setToast]      = useState<string | null>(null);

  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const place    = PLACES[cardIdx];

  /* Netflix-style rail: the focus slot is pinned at L_PAD and the rail slides
     so the focused card always lands in it */
  const railShift = L_PAD - cardIdx * (COL_W + CARD_G);

  const showToast = (msg: string) => {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast(msg);
    toastRef.current = setTimeout(() => setToast(null), 2200);
  };
  useEffect(() => () => { if (toastRef.current) clearTimeout(toastRef.current); }, []);

  /* ── keyboard ─────────────────────────────────────────── */
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const k = e.key;

      if (qrOpen) { e.preventDefault(); setQrOpen(false); setZone('cta'); return; }

      if (flyoutOpen) {
        e.preventDefault();
        if (k === 'ArrowLeft')  setFlyoutIdx(i => Math.max(0, i - 1));
        if (k === 'ArrowRight') setFlyoutIdx(i => Math.min(FLYOUT_ITEMS.length - 1, i + 1));
        if (k === 'Enter') {
          const item = FLYOUT_ITEMS[flyoutIdx];
          if (item.id === 'like')     { setLiked(s => { const n = new Set(s); n.add(place.id); return n; }); showToast('Liked ✓'); }
          if (item.id === 'dislike')  showToast('Got it — won\'t show similar');
          if (item.id === 'copyLink') showToast('Link copied ✓');
          if (item.id === 'report')   showToast('Reported — thanks');
          setFlyoutOpen(false); setZone('cta');
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
          if (ctaIdx < 2) {
            setCtaIdx(i => i + 1);
          } else {
            if (cardIdx < PLACES.length - 1) {
              setNavDir('right');
              setCardIdx(i => i + 1);
              setCtaIdx(PRIMARY_IDX.right);
            }
          }
        }
        if (k === 'ArrowLeft') {
          e.preventDefault();
          if (ctaIdx > 0) {
            setCtaIdx(i => i - 1);
          } else {
            if (cardIdx > 0) {
              setNavDir('left');
              setCardIdx(i => i - 1);
              setCtaIdx(PRIMARY_IDX.left);
            }
          }
        }
        if (k === 'ArrowUp')   { e.preventDefault(); setZone('intro'); }
        if (k === 'ArrowDown') { e.preventDefault(); setZone('inputs'); setPromptIdx(0); }
        if (k === 'Enter') {
          e.preventDefault();
          const focusedCta = CTA_ORDER[navDir][ctaIdx];
          if (focusedCta === 'checkout')  { setQrOpen(true); setZone('qrModal'); }
          if (focusedCta === 'wishlist')  {
            setWishlisted(s => { const n = new Set(s); n.has(place.id) ? n.delete(place.id) : n.add(place.id); return n; });
            showToast(wishlisted.has(place.id) ? 'Removed from wishlist' : 'Added to wishlist ♥');
          }
          if (focusedCta === 'more') { setFlyoutOpen(true); setFlyoutIdx(0); setZone('flyout'); }
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

  /* ── derived ──────────────────────────────────────────── */
  const ctaOrder     = CTA_ORDER[navDir];
  const focusedCtaId = zone === 'cta' ? ctaOrder[ctaIdx] : null;
  const ctaFocused   = (id: CtaId) => focusedCtaId === id;

  /* ── render ───────────────────────────────────────────── */
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', overflow: 'hidden', position: 'relative' }}>
      <ScaleSync />
      <style>{`
        @keyframes fadeUp   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes toastIn  { from{opacity:0;transform:translateX(-50%) translateY(10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes fadeIn      { from{opacity:0} to{opacity:1} }
        @keyframes slideInRight{ from{opacity:0;transform:translateX(480px)} to{opacity:1;transform:translateX(0)} }
        /* Figma spec: 2px stroke, linear gradient #FFF -> #FFF 20%, layer opacity 15% */
        .fl1-gborder { position: relative; }
        .fl1-gborder::before {
          content: ''; position: absolute; inset: 0; border-radius: inherit;
          padding: var(--food-l1-hairline, 2px);
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
        transform: 'scale(var(--food-l1-scale,1)) translate(var(--food-l1-tx,0px), var(--food-l1-ty,0px))',
        position: 'absolute', top: 0, left: 0,
        color: '#fff',
        fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
        overflow: 'hidden',
      }}>

        {/* ── BG — ambient photo under a dark blur wash ── */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <img src="/images/l1/bg.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.27)' }} />
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#000 0%,rgba(0,0,0,0.8) 50%,rgba(0,0,0,0.5) 100%)', backdropFilter: 'blur(150px)' }} />

        {/* ── Header ──────────────────────────────────── */}
        <img src="/images/l1/glance-logo-white.svg" alt="glance" style={{ position: 'absolute', top: 56, left: 72, width: 120, height: 34, zIndex: 10 }} />
        <div style={{
          position: 'absolute', top: 56, right: 120, height: 80,
          background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(20px)',
          borderRadius: '40px 40px 0 40px', padding: '22px 32px',
          display: 'flex', alignItems: 'center',
          fontSize: 28, lineHeight: '36px', fontFamily: 'Inter,sans-serif', fontWeight: 400,
          opacity: 0.5, whiteSpace: 'nowrap', zIndex: 10,
        }}>
          Suggest places for a date night
        </div>

        {/* ── Mascot ──────────────────────────────────── */}
        <div style={{ position: 'absolute', top: 156, left: 72, width: 80, height: 80, zIndex: 5 }}>
          <img src="/images/l1/mascot.png" alt="" style={{
            position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
            width: 161, height: 163, maxWidth: 'none',
          }} />
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
          {PLACES.map((p, i) => {
            // card expands only while focus is on the card row itself
            const isFocused = cardIdx === i && (zone === 'cta' || zone === 'flyout' || zone === 'qrModal');

            if (isFocused) {
              return (
                <div key={p.id} style={{
                  width: EXP_W, height: EXP_H, flexShrink: 0,
                  borderRadius: 32, overflow: 'hidden',
                  position: 'relative', background: '#1a1a1a',
                  border: zone === 'cta' || zone === 'flyout' ? '4px solid #fff' : '4px solid rgba(255,255,255,0.5)',
                  boxShadow: '0 30px 40px rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.3)',
                  transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                }}>
                  {/* white overlay tint */}
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.1)', borderRadius: 28, pointerEvents: 'none', zIndex: 1 }} />
                  {/* inset glow */}
                  <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 20px rgba(255,255,255,0.3)', borderRadius: 28, pointerEvents: 'none', zIndex: 2 }} />

                  {/* photo left */}
                  <div style={{
                    position: 'absolute', top: 16, left: 15, width: 370, height: 463,
                    borderRadius: 20, border: '1px solid rgba(255,255,255,0.2)', overflow: 'hidden',
                    background: '#111',
                  }}>
                    <img src={p.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>

                  {/* right content */}
                  <div style={{
                    position: 'absolute', top: 0, bottom: 0, left: 384, width: 492,
                    boxSizing: 'border-box', padding: '32px 24px',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    animation: 'fadeUp 0.4s ease both',
                  }}>
                    {/* top: agent label + note */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img src="/images/l1/pin.svg" alt="" style={{ width: 32, height: 32 }} />
                        <span style={{ fontSize: 22, lineHeight: '28px', fontWeight: 500, fontFamily: 'Inter,sans-serif' }}>{p.agentLabel}</span>
                      </div>
                      <p style={{ fontSize: 24, lineHeight: '36px', fontWeight: 500, color: 'rgba(255,255,255,0.8)', margin: 0, fontFamily: 'Inter,sans-serif' }}>
                        {p.agentNote}
                      </p>
                    </div>

                    {/* bottom: rating + name + price + CTA */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: '#ffba71', fontSize: 20, lineHeight: '24px', fontWeight: 600, fontFamily: 'Inter,sans-serif', textTransform: 'uppercase' }}>{p.rating}</span>
                          <img src="/images/l1/star.svg" alt="" style={{ width: 24, height: 24 }} />
                          <span style={{ color: '#ffba71', fontSize: 20, lineHeight: '24px', fontWeight: 600, fontFamily: 'Inter,sans-serif', textTransform: 'uppercase' }}>({p.ratingCount} reviews)</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <p style={{ fontSize: 32, fontWeight: 600, lineHeight: '44px', margin: 0, overflow: 'hidden' }}>{p.name}</p>
                          <p style={{ fontSize: 24, fontWeight: 600, lineHeight: '32px', margin: 0 }}>{p.price}</p>
                        </div>
                      </div>

                      {/* CTA row — bottom of right column (Figma) */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 11, height: 64,
                      }}>
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
                          <HeartIcon
                            stroke={wishlisted.has(p.id) ? '#f87' : (focused ? '#111' : '#fff')}
                            fill="none"
                          />
                        </div>
                      );

                      /* checkout — primary when focused, secondary otherwise */
                      return (
                        <div key="checkout" onClick={() => { setQrOpen(true); setZone('qrModal'); }}
                          style={{
                            flex: 1, height: 64, borderRadius: 32,
                            background: focused ? '#ffffff' : 'rgba(255,255,255,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 22, lineHeight: '32px',
                            fontWeight: focused ? 700 : 500, fontFamily: 'Inter,sans-serif',
                            color: focused ? '#000' : '#fff', letterSpacing: '0.22px',
                            boxShadow: focused
                              ? '0 8px 20px rgba(0,0,0,0.12), 0 0 0 3px rgba(255,255,255,0.5)'
                              : '0 8px 40px rgba(0,0,0,0.12)',
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

            /* ── collapsed portrait card ─────────────── */
            return (
              <div key={p.id} style={{
                width: COL_W, height: COL_H, flexShrink: 0,
                borderRadius: 32, overflow: 'hidden',
                position: 'relative', background: '#141414',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                cursor: 'pointer',
              }} onClick={() => { setCardIdx(i); setZone('cta'); }}>
                {/* photo */}
                <img src={p.photo} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                {/* white tint */}
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.1)', pointerEvents: 'none' }} />
                {/* dark overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', pointerEvents: 'none' }} />
                {/* top fade */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 104, background: 'linear-gradient(to bottom, rgba(20,20,20,0.5), transparent)', pointerEvents: 'none' }} />
                {/* bottom fade */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 242, background: 'linear-gradient(to bottom, rgba(20,20,20,0), #141414)', pointerEvents: 'none' }} />

                {/* top label */}
                <div style={{ position: 'absolute', top: 20, left: 20, right: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img src="/images/l1/pin.svg" alt="" style={{ width: 32, height: 32 }} />
                  <span style={{ fontSize: 22, lineHeight: '28px', fontWeight: 500, fontFamily: 'Inter,sans-serif' }}>{p.agentLabel}</span>
                </div>

                {/* bottom text */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: '#ffba71', fontSize: 22, lineHeight: '24px', fontWeight: 600, fontFamily: 'Inter,sans-serif' }}>{p.rating}</span>
                    <img src="/images/l1/star.svg" alt="" style={{ width: 24, height: 24 }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <p style={{ fontSize: 32, fontWeight: 500, lineHeight: '44px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                    <p style={{ fontSize: 24, fontWeight: 600, lineHeight: '32px', margin: 0, opacity: 0.7 }}>{p.price}</p>
                  </div>
                </div>

                {/* inset glow */}
                <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 20px rgba(255,255,255,0.3)', borderRadius: 30, pointerEvents: 'none' }} />
              </div>
            );
          })}
          <div style={{ width: 80, flexShrink: 0 }} />
        </div>

        {/* ── Prompt row — floating, no bar (Figma) ───── */}
        <div style={{
          position: 'absolute', top: 944, left: L_PAD, right: 0, height: 72,
          display: 'flex', alignItems: 'center', gap: 32,
          zIndex: 13, overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            {/* keyboard icon */}
            <div className="fl1-gborder" style={{
              width: 72, height: 72, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <img src="/images/l1/keyboard.svg" alt="" style={{ width: 40, height: 40 }} />
            </div>
            {/* mic icon */}
            <div className="fl1-gborder" style={{
              width: 72, height: 72, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <img src="/images/l1/mic.svg" alt="" style={{ width: 40, height: 40 }} />
            </div>
          </div>
          {/* prompt chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {FOLLOW_UPS.map((p, i) => {
              const on = zone === 'inputs' && promptIdx === i;
              return (
                <div key={i} className={on ? undefined : 'fl1-gborder'} style={{
                  height: 72, padding: '0 32px', borderRadius: 999, boxSizing: 'border-box',
                  display: 'flex', alignItems: 'center',
                  fontSize: 22, lineHeight: '32px', fontWeight: 500, letterSpacing: '0.22px',
                  color: on ? '#111' : 'rgba(255,255,255,0.6)',
                  background: on ? 'rgba(255,255,255,0.95)' : 'transparent',
                  boxShadow: on ? '0 6px 20px rgba(255,255,255,0.12)' : 'none',
                  transform: on ? 'scale(1.03)' : 'scale(1)',
                  transition: 'all 0.15s ease', whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}>{p}</div>
              );
            })}
          </div>
        </div>

        {/* ── QR overlay — right panel (Figma 4641-4779) ── */}
        {qrOpen && (
          <>
            {/* dark blur backdrop */}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', zIndex: 60, animation: 'fadeIn 0.3s ease both' }} />

            {/* panel + contents slide in from the right */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 61, animation: 'slideInRight 0.45s cubic-bezier(0.22,1,0.36,1) both', pointerEvents: 'none' }}>
            {/* curved right panel (shadow baked into SVG) */}
            <div style={{ position: 'absolute', top: -102, right: -92, width: 1232, height: 1284, zIndex: 61 }}>
              <img src="/images/l1/qr-panel.svg" alt="" style={{ width: '100%', height: '100%', display: 'block' }} />
            </div>

            {/* close button on the panel edge */}
            <div onClick={() => { setQrOpen(false); setZone('cta'); }} style={{
              position: 'absolute', left: 772, top: '50%', transform: 'translateY(-50%)',
              width: 80, height: 80, borderRadius: '50%', boxSizing: 'border-box',
              background: '#fff', border: '2px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 63, cursor: 'pointer', pointerEvents: 'auto',
            }}>
              <img src="/images/l1/close-x.svg" alt="close" style={{ width: 40, height: 40 }} />
            </div>

            {/* title + subtitle */}
            <div style={{
              position: 'absolute', left: 1095, top: 130, width: 623, zIndex: 62,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center',
            }}>
              <p style={{ fontSize: 48, lineHeight: '64px', fontWeight: 600, color: '#fff', margin: 0 }}>Scan to Check Out</p>
              <p style={{ fontSize: 24, fontWeight: 500, color: 'rgba(255,255,255,0.8)', letterSpacing: '-0.24px', margin: 0, fontFamily: 'Inter,sans-serif' }}>
                You will be redirected to the brand&rsquo;s official page
              </p>
            </div>

            {/* QR on wavy blob */}
            <div style={{ position: 'absolute', left: 1176, top: '50%', transform: 'translateY(-50%)', width: 460, height: 460, zIndex: 62 }}>
              <img src="/images/l1/qr-blob.svg" alt="" style={{
                position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
                width: 557, height: 557, maxWidth: 'none',
              }} />
              <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>
                <QRCodeSVG
                  value={place.mapsUrl} size={330} bgColor="transparent" fgColor="#111" level="H"
                  imageSettings={{ src: '/images/l1/cp-logo.svg', width: 88, height: 88, excavate: true }}
                />
              </div>
            </div>

            {/* place info row */}
            <div style={{
              position: 'absolute', left: 1211, top: 834, width: 390, zIndex: 62,
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{
                width: 120, height: 140, borderRadius: 16, flexShrink: 0, overflow: 'hidden',
                border: '1.4px solid rgba(255,255,255,0.2)', boxSizing: 'border-box',
              }}>
                <img src={place.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <img src="/images/l1/star.svg" alt="" style={{ width: 20, height: 20 }} />
                  <span style={{ color: '#ffba71', fontSize: 18, lineHeight: '20px', fontWeight: 600, fontFamily: 'Inter,sans-serif', textTransform: 'uppercase' }}>
                    {place.rating} ({place.ratingCount} reviews)
                  </span>
                </div>
                <p style={{ fontSize: 22, fontWeight: 500, color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.22px', margin: 0, fontFamily: "'Manrope','Plus Jakarta Sans',sans-serif" }}>
                  {place.name}
                </p>
              </div>
            </div>
            </div>
          </>
        )}

        {/* ── Toast ───────────────────────────────────── */}
        {toast && (
          <div style={{
            position: 'absolute', bottom: 160, left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(18,18,18,0.96)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999,
            padding: '12px 28px', fontSize: 16, fontWeight: 600, color: '#e8e8e8',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            animation: 'toastIn 0.18s ease', zIndex: 70, whiteSpace: 'nowrap',
          }}>{toast}</div>
        )}

        {/* ── Debug badge ─────────────────────────────── */}
        <div style={{ position: 'absolute', top: 56, left: '50%', transform: 'translateX(-50%)', fontSize: 12, color: '#555', background: 'rgba(8,8,8,0.85)', border: '1px solid #1e1e1e', padding: '5px 14px', borderRadius: 4, zIndex: 10, whiteSpace: 'nowrap' }}>
          zone: <b style={{ color: '#888' }}>{zone}</b>
          {zone === 'cta' && <> · {focusedCtaId} · dir:{navDir}</>}
          {zone === 'inputs' && <> · prompt {promptIdx + 1}</>}
        </div>

      </div>
    </div>
  );
}

function ScaleSync() {
  useEffect(() => {
    const apply = () => {
      const s  = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
      const tx = (window.innerWidth  - 1920 * s) / 2 / s;
      const ty = (window.innerHeight - 1080 * s) / 2 / s;
      document.documentElement.style.setProperty('--food-l1-scale', String(s));
      document.documentElement.style.setProperty('--food-l1-tx', `${tx}px`);
      document.documentElement.style.setProperty('--food-l1-ty', `${ty}px`);
      // 2 physical px regardless of stage scale — thin scaled borders otherwise
      // anti-alias into dim gray lines
      document.documentElement.style.setProperty('--food-l1-hairline', `${2 / s}px`);
    };
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, []);
  return null;
}
