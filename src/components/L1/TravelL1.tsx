/**
 * Travel L1 Template — /travel-l1
 * Same ambient TV design as FoodL1Scenarios (Figma "Akira v4 Ambient"),
 * with a tab bar driving per-section card sets (Coorg trip context).
 *
 * Zones: intro → tabs → cta → inputs (D-pad UP/DOWN moves between zones).
 * Tabs zone: LEFT/RIGHT switches the active tab (focus follows activation).
 * Card rail: Netflix-style — focus slot pinned at L_PAD, rail slides into it.
 * CTA order mirrors on navigation direction, same as the food template.
 */
import { Fragment, useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

/* ─── types ──────────────────────────────────────────────── */
// Exported alongside the data/constants below so other internal-only pages
// (e.g. the L1 Scenarios leadership demo) can reuse the exact same content
// and interaction model instead of re-declaring mock data. Purely additive —
// no behavior change to this page.
export interface TravelItem {
  id: string;
  name: string;
  area: string;
  rating?: number;
  ratingCount?: string;
  price?: string;
  agentLabel: string;
  agentNote: string;
  mapsUrl: string;
  photo: string;
  // primary CTA copy — varies by section (Book Now / Explore / Check out / …)
  ctaLabel: string;
  ctaModalTitle: string;
  ctaModalSubtitle: string;
}

export type Zone       = 'intro' | 'tabs' | 'cta' | 'inputs' | 'qrModal' | 'flyout';
export type NavDir     = 'right' | 'left';
export type CtaId      = 'maps' | 'wishlist' | 'more';
export type FlyoutItem = 'like' | 'dislike' | 'copyLink' | 'report';

/* ─── data ───────────────────────────────────────────────── */
export const TABS = [
  { id: 'getting-there', label: 'Getting There' },
  { id: 'stay',          label: 'Where to Stay' },
  { id: 'do',            label: 'What to Do' },
  { id: 'eat',           label: 'Where to Eat' },
  { id: 'before',        label: 'Before You Go' },
] as const;

export type TabId = typeof TABS[number]['id'];

export const TAB_ITEMS: Record<TabId, TravelItem[]> = {
  'getting-there': [
    {
      id: 'road',
      name: 'By Road from Bengaluru',
      area: '265 km · ~6 hrs via Mysuru',
      price: 'Fuel ≈ ₹2,400 round trip',
      agentLabel: 'Fastest route',
      agentNote: 'Scenic drive with coffee-stop breaks. Leave before 6 AM to beat city traffic.',
      mapsUrl: 'https://maps.google.com/?q=Bengaluru+to+Coorg+route',
      photo: '/images/feed/feed_29-travel-goa-coastal-road.jpg',
      ctaLabel: 'Get Directions',
      ctaModalTitle: 'Scan for Directions',
      ctaModalSubtitle: 'Continue on your phone with Google Maps',
    },
    {
      id: 'train',
      name: 'Train to Mysuru + Cab',
      area: '3 hrs rail + 2.5 hrs cab',
      price: 'From ₹450 + ₹2,000 cab',
      agentLabel: 'Relaxed option',
      agentNote: 'Shatabdi to Mysuru, then a pre-booked cab through Periyapatna into the hills.',
      mapsUrl: 'https://maps.google.com/?q=Mysuru+Junction',
      photo: '/images/feed/feed_15-luxury-private-train.jpg',
      ctaLabel: 'Book Tickets',
      ctaModalTitle: 'Scan to Book Tickets',
      ctaModalSubtitle: 'Continue on your phone to book this route',
    },
    {
      id: 'fly',
      name: 'Fly to Mangaluru + Drive',
      area: '1 hr flight + 4 hr drive',
      price: 'From ₹3,800 one-way',
      agentLabel: 'Quickest hop',
      agentNote: 'Best from Mumbai or Delhi. The ghat-road drive up from the coast is a bonus.',
      mapsUrl: 'https://maps.google.com/?q=Mangaluru+International+Airport',
      photo: '/images/feed/feed_58-travel-mumbai-marine-drive-night.jpg',
      ctaLabel: 'Book Flight',
      ctaModalTitle: 'Scan to Book Flight',
      ctaModalSubtitle: 'Continue on your phone to compare flights',
    },
  ],
  'stay': [
    {
      id: 'tamara',
      name: 'The Tamara Coorg',
      area: 'Yavakapadi, Kabbinakad',
      rating: 4.6, ratingCount: '2.1K',
      price: 'From ₹18,000/night',
      agentLabel: 'Top pick',
      agentNote: 'Plantation-view cottages wrapped in mist — the definitive luxury Coorg stay.',
      mapsUrl: 'https://maps.google.com/?q=The+Tamara+Coorg',
      photo: '/images/feed/feed_34-travel-nordic-winter-cabin.jpg',
      ctaLabel: 'Book Now',
      ctaModalTitle: 'Scan to Book Now',
      ctaModalSubtitle: 'You will be redirected to the property’s booking page',
    },
    {
      id: 'evolveback',
      name: 'Evolve Back Coorg',
      area: 'Chikkana Halli Estate',
      rating: 4.8, ratingCount: '1.3K',
      price: 'From ₹32,000/night',
      agentLabel: 'Splurge stay',
      agentNote: 'Private pool villas modelled on Kodava village homes. Book the plantation walk.',
      mapsUrl: 'https://maps.google.com/?q=Evolve+Back+Coorg',
      photo: '/images/feed/feed_16-luxury-spa-ritual.jpg',
      ctaLabel: 'Book Now',
      ctaModalTitle: 'Scan to Book Now',
      ctaModalSubtitle: 'You will be redirected to the property’s booking page',
    },
    {
      id: 'kofi',
      name: 'Kofi Kottage Homestay',
      area: 'Madikeri outskirts',
      rating: 4.5, ratingCount: '480',
      price: 'From ₹3,500/night',
      agentLabel: 'Budget homestay',
      agentNote: 'Family-run estate stay with home-cooked Kodava food and bonfire evenings.',
      mapsUrl: 'https://maps.google.com/?q=homestay+Madikeri',
      photo: '/images/feed/feed_24-home-cozy-monsoon-living-room.jpg',
      ctaLabel: 'Book Now',
      ctaModalTitle: 'Scan to Book Now',
      ctaModalSubtitle: 'You will be redirected to the property’s booking page',
    },
  ],
  'do': [
    {
      id: 'dubare',
      name: 'Dubare Elephant Camp',
      area: 'Kushalnagar',
      rating: 4.3, ratingCount: '8.2K',
      price: '₹100–1,200 entry',
      agentLabel: 'Top pick',
      agentNote: 'Bathe and feed elephants by the Cauvery at dawn — reach before 9 AM.',
      mapsUrl: 'https://maps.google.com/?q=Dubare+Elephant+Camp',
      photo: '/images/feed/feed_40-travel-wildlife-dawn-grassland.jpg',
      ctaLabel: 'Explore',
      ctaModalTitle: 'Scan to Explore',
      ctaModalSubtitle: 'You will be redirected to the experience page',
    },
    {
      id: 'rajaseat',
      name: "Raja's Seat Gardens",
      area: 'Madikeri',
      rating: 4.5, ratingCount: '12K',
      price: '₹50 entry',
      agentLabel: 'Sunset point',
      agentNote: 'The classic Coorg sunset over layered valleys. Go 45 minutes before sundown.',
      mapsUrl: 'https://maps.google.com/?q=Raja%27s+Seat+Madikeri',
      photo: '/images/feed/feed_32-wellness-sunrise-yoga-lake.jpg',
      ctaLabel: 'Explore',
      ctaModalTitle: 'Scan to Explore',
      ctaModalSubtitle: 'You will be redirected to the experience page',
    },
    {
      id: 'abbey',
      name: 'Abbey Falls Trail',
      area: '8 km from Madikeri',
      rating: 4.2, ratingCount: '9K',
      price: '₹15 entry',
      agentLabel: 'Nature walk',
      agentNote: 'A short walk through coffee and cardamom to a roaring monsoon-fed waterfall.',
      mapsUrl: 'https://maps.google.com/?q=Abbey+Falls+Coorg',
      photo: '/images/feed/feed_54-travel-kerala-backwaters-houseboat.jpg',
      ctaLabel: 'Explore',
      ctaModalTitle: 'Scan to Explore',
      ctaModalSubtitle: 'You will be redirected to the experience page',
    },
  ],
  'eat': [
    {
      id: 'kimberly',
      name: 'Kimberly Coorg',
      area: 'Near Raja Seat, Madikeri',
      rating: 4.7, ratingCount: '950',
      price: '₹800–1,500 per person',
      agentLabel: 'Top pick',
      agentNote: 'Local wines, coffee roastery, and cozy café vibes near Raja Seat.',
      mapsUrl: 'https://maps.google.com/?q=Kimberly+Coorg',
      photo: '/images/feed/feed_22-travel-seoul-cafe-street.jpg',
      ctaLabel: 'Check out',
      ctaModalTitle: 'Scan to Check Out',
      ctaModalSubtitle: 'You will be redirected to the brand’s official page',
    },
    {
      id: 'silveroaks',
      name: 'Silver Oaks Multi Cuisine',
      area: 'Madikeri town',
      rating: 4.6, ratingCount: '720',
      price: '₹600–1,200 per person',
      agentLabel: 'Family dining',
      agentNote: 'Relaxed ambience with fresh, balanced multi-cuisine dishes.',
      mapsUrl: 'https://maps.google.com/?q=Silver+Oaks+Restaurant+Madikeri',
      photo: '/images/feed/feed_04-food-dinner-party-table.jpg',
      ctaLabel: 'Check out',
      ctaModalTitle: 'Scan to Check Out',
      ctaModalSubtitle: 'You will be redirected to the brand’s official page',
    },
    {
      id: 'bellis',
      name: "BELLI'S Restaurant",
      area: 'Near bus stand, Madikeri',
      rating: 4.3, ratingCount: '580',
      price: '₹700–1,300 per person',
      agentLabel: 'Fine dining',
      agentNote: 'Fine dining with local and continental options near the bus stand.',
      mapsUrl: 'https://maps.google.com/?q=BELLI%27S+restaurant+Madikeri',
      photo: '/images/feed/feed_59-food-healthy-bowl-kitchen.jpg',
      ctaLabel: 'Check out',
      ctaModalTitle: 'Scan to Check Out',
      ctaModalSubtitle: 'You will be redirected to the brand’s official page',
    },
  ],
  'before': [
    {
      id: 'weather',
      name: 'Misty & Drizzly All Week',
      area: '18–24°C in Madikeri',
      agentLabel: 'Weather check',
      agentNote: 'Carry a light rain jacket and grippy shoes — trails stay slippery after rain.',
      mapsUrl: 'https://www.google.com/search?q=Coorg+weather',
      photo: '/images/feed/feed_24-home-cozy-monsoon-living-room.jpg',
      ctaLabel: 'Learn More',
      ctaModalTitle: 'Scan to Learn More',
      ctaModalSubtitle: 'Continue on your phone for full details',
    },
    {
      id: 'packing',
      name: 'Pack Light, Pack Warm',
      area: 'Layers for cool evenings',
      agentLabel: 'Packing list',
      agentNote: 'Layers, a power bank, and offline maps — network drops inside plantations.',
      mapsUrl: 'https://www.google.com/search?q=Coorg+packing+list',
      photo: '/images/feed/feed_46-fashion-luxury-flatlay.jpg',
      ctaLabel: 'Learn More',
      ctaModalTitle: 'Scan to Learn More',
      ctaModalSubtitle: 'Continue on your phone for full details',
    },
    {
      id: 'cash',
      name: 'Carry Cash for Homestays',
      area: 'ATMs only in Madikeri town',
      agentLabel: 'Local tip',
      agentNote: 'Cards work in town, but plantation stays and waterfall entries are cash-only.',
      mapsUrl: 'https://www.google.com/search?q=ATMs+in+Madikeri',
      photo: '/images/feed/feed_47-food-monsoon-chai-stall.jpg',
      ctaLabel: 'Learn More',
      ctaModalTitle: 'Scan to Learn More',
      ctaModalSubtitle: 'Continue on your phone for full details',
    },
  ],
};

// CTA order by direction — primary CTA (label varies per item, e.g. "Book Now") always nearest to navigation direction
export const CTA_ORDER: Record<NavDir, CtaId[]> = {
  right: ['more', 'wishlist', 'maps'],
  left:  ['maps', 'wishlist', 'more'],
};
export const PRIMARY_IDX: Record<NavDir, number> = { right: 2, left: 0 };

export const FLYOUT_ITEMS: { id: FlyoutItem; label: string; icon: string }[] = [
  { id: 'like',     label: 'Like this',      icon: '👍' },
  { id: 'dislike',  label: 'Not interested', icon: '👎' },
  { id: 'copyLink', label: 'Copy link',       icon: '🔗' },
  { id: 'report',   label: 'Report',          icon: '🚩' },
];

export const FOLLOW_UPS = [
  'Plan a 3-day Coorg itinerary',
  'Find coffee plantation tours',
  'Check weather for next weekend',
  'Book a resort in Coorg',
  'Estimate trip budget',
];

/* ─── layout ─────────────────────────────────────────────── */
export const W        = 1920;
export const H        = 1080;
export const L_PAD    = 184;
export const TABS_TOP = 244;   // tab bar row
export const CARD_TOP = 316;   // rail sits below the tabs
export const EXP_H    = 504;
export const EXP_W    = 880;
export const COL_H    = 420;
export const COL_W    = 336;
export const CARD_G   = 24;
export const PROMPT_TOP = 944; // bottom input row — matches FoodL1Scenarios' vertical rhythm
// Gap between sections in the sliding rail. Kept comfortably larger than the
// visible width to the right of the expanded card (W − L_PAD − EXP_W) so the
// rail itself never lets the next section peek through — the next-section
// nudge is instead a separate fixed overlay (see the "next section nudge"
// block below) so its screen position never depends on where the rail
// happens to be, and can be shown from the second-to-last card onward.
export const SECTION_GAP = 900;

/* ─── inline icons ───────────────────────────────────────── */
export function DotsIcon({ color }: { color: string }) {
  return (
    <svg width={32} height={32} viewBox="0 0 32 32" fill="none">
      <circle cx="5"  cy="15.5" r="2.5" fill={color} stroke={color} />
      <circle cx="16" cy="15.5" r="2.5" fill={color} stroke={color} />
      <circle cx="27" cy="15.5" r="2.5" fill={color} stroke={color} />
    </svg>
  );
}

export function HeartIcon({ stroke, fill = 'none' }: { stroke: string; fill?: string }) {
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
export default function TravelL1() {
  // start on Where to Eat like the reference; ?tab= and ?card= override for demos
  const [tabIdx,     setTabIdx]     = useState(() => {
    const t = new URLSearchParams(window.location.search).get('tab');
    const i = TABS.findIndex(x => x.id === t);
    return i >= 0 ? i : 3;
  });
  const [cardIdx,    setCardIdx]    = useState(() => {
    const c = Number(new URLSearchParams(window.location.search).get('card'));
    return Number.isInteger(c) && c > 0 ? c : 0;
  });
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

  const tab   = TABS[tabIdx];
  const items = TAB_ITEMS[tab.id];
  const place = items[cardIdx];

  /* Netflix-style rail: focus slot pinned at L_PAD, rail slides into it.
     Offsets accumulate across all sections (cards before focus are collapsed). */
  const offsetBefore = TABS.slice(0, tabIdx).reduce((acc, tb) => {
    const n = TAB_ITEMS[tb.id].length;
    return acc + n * COL_W + (n - 1) * CARD_G + SECTION_GAP;
  }, 0);
  const railShift = L_PAD - (offsetBefore + cardIdx * (COL_W + CARD_G));

  /* Next-section nudge: a small fixed-position preview of the next section's
     first card. It only appears from the second-to-last card of a section
     onward, and — unlike the rail — its screen position never changes, so it
     doesn't shift when focus moves from the 2nd-to-last to the last card. */
  const hasNextSectionNudge = tabIdx < TABS.length - 1 && cardIdx >= items.length - 2;
  const nextSectionFirstItem = hasNextSectionNudge ? TAB_ITEMS[TABS[tabIdx + 1].id][0] : null;

  const showToast = (msg: string) => {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast(msg);
    toastRef.current = setTimeout(() => setToast(null), 2200);
  };
  useEffect(() => () => { if (toastRef.current) clearTimeout(toastRef.current); }, []);

  const switchTab = (next: number) => {
    setTabIdx(next);
    setCardIdx(0);
    setNavDir('right');
    setCtaIdx(PRIMARY_IDX.right);
  };

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
        if (k === 'ArrowDown') setZone('tabs');
        return;
      }

      if (zone === 'tabs') {
        e.preventDefault();
        if (k === 'ArrowLeft'  && tabIdx > 0)               switchTab(tabIdx - 1);
        if (k === 'ArrowRight' && tabIdx < TABS.length - 1) switchTab(tabIdx + 1);
        if (k === 'ArrowUp')   setZone('intro');
        if (k === 'ArrowDown' || k === 'Enter') { setZone('cta'); setCtaIdx(PRIMARY_IDX[navDir]); }
        return;
      }

      if (zone === 'cta') {
        if (k === 'ArrowRight') {
          e.preventDefault();
          if (ctaIdx < 2) {
            setCtaIdx(i => i + 1);
          } else if (cardIdx < items.length - 1) {
            setNavDir('right');
            setCardIdx(i => i + 1);
            setCtaIdx(PRIMARY_IDX.right);
          } else if (tabIdx < TABS.length - 1) {
            // Xbox-style: keep going right past the last card → next section
            setTabIdx(tabIdx + 1);
            setCardIdx(0);
            setNavDir('right');
            setCtaIdx(PRIMARY_IDX.right);
          }
        }
        if (k === 'ArrowLeft') {
          e.preventDefault();
          if (ctaIdx > 0) {
            setCtaIdx(i => i - 1);
          } else if (cardIdx > 0) {
            setNavDir('left');
            setCardIdx(i => i - 1);
            setCtaIdx(PRIMARY_IDX.left);
          } else if (tabIdx > 0) {
            // …and left past the first card → last card of the previous section
            const prevItems = TAB_ITEMS[TABS[tabIdx - 1].id];
            setTabIdx(tabIdx - 1);
            setCardIdx(prevItems.length - 1);
            setNavDir('left');
            setCtaIdx(PRIMARY_IDX.left);
          }
        }
        if (k === 'ArrowUp')   { e.preventDefault(); setZone('tabs'); }
        if (k === 'ArrowDown') { e.preventDefault(); setZone('inputs'); setPromptIdx(0); }
        if (k === 'Enter') {
          e.preventDefault();
          const focusedCta = CTA_ORDER[navDir][ctaIdx];
          if (focusedCta === 'maps')     { setQrOpen(true); setZone('qrModal'); }
          if (focusedCta === 'wishlist') {
            setWishlisted(s => { const n = new Set(s); n.has(place.id) ? n.delete(place.id) : n.add(place.id); return n; });
            showToast(wishlisted.has(place.id) ? 'Removed from trip plan' : 'Saved to trip plan ♥');
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
  }, [zone, tabIdx, cardIdx, navDir, ctaIdx, flyoutIdx, flyoutOpen, qrOpen, promptIdx, place.id, wishlisted, items.length]);

  /* ── derived ──────────────────────────────────────────── */
  const ctaOrder     = CTA_ORDER[navDir];
  const focusedCtaId = zone === 'cta' ? ctaOrder[ctaIdx] : null;
  const ctaFocused   = (id: CtaId) => focusedCtaId === id;

  /* ── expanded-card content (photo + text + CTA row) ──────
     Shared by the current (interactive) item and the previous
     (interactive=false) item during the crossfade inside the
     fixed focus frame. `dir` picks which CTA mirror order to use. */
  const renderCardBody = (p: TravelItem, dir: NavDir, interactive: boolean) => {
    const order = CTA_ORDER[dir];
    return (
      <>
        {/* photo left */}
        <div style={{
          position: 'absolute', top: 16, left: 15, width: 370, height: EXP_H - 40,
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
              {p.rating != null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#ffba71', fontSize: 20, lineHeight: '24px', fontWeight: 600, fontFamily: 'Inter,sans-serif', textTransform: 'uppercase' }}>{p.rating}</span>
                  <img src="/images/l1/star.svg" alt="" style={{ width: 24, height: 24 }} />
                  {p.ratingCount && (
                    <span style={{ color: '#ffba71', fontSize: 20, lineHeight: '24px', fontWeight: 600, fontFamily: 'Inter,sans-serif', textTransform: 'uppercase' }}>({p.ratingCount} reviews)</span>
                  )}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ fontSize: 32, fontWeight: 600, lineHeight: '44px', margin: 0, overflow: 'hidden' }}>{p.name}</p>
                <p style={{ fontSize: 24, fontWeight: 600, lineHeight: '32px', margin: 0, opacity: p.price ? 1 : 0.7 }}>{p.price ?? p.area}</p>
              </div>
            </div>

            {/* CTA row — bottom of right column */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, height: 64, pointerEvents: interactive ? 'auto' : 'none' }}>
              {order.map((id) => {
                const focused = interactive && ctaFocused(id);

                if (id === 'more') return (
                  <div key="more" onClick={interactive ? () => { setFlyoutOpen(true); setFlyoutIdx(0); setZone('flyout'); } : undefined}
                    style={{
                      width: 64, height: 64, borderRadius: 32, flexShrink: 0,
                      background: focused ? '#fff' : 'rgba(255,255,255,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: focused ? '0 0 0 2.5px rgba(255,255,255,0.8)' : 'none',
                      transition: 'all 0.15s ease', cursor: interactive ? 'pointer' : 'default', position: 'relative',
                    }}>
                    <DotsIcon color={focused ? '#111' : '#fff'} />
                    {interactive && flyoutOpen && (
                      <div style={{
                        position: 'absolute', bottom: 74,
                        ...(dir === 'right' ? { left: 0 } : { right: 0 }),
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
                  <div key="wishlist" onClick={interactive ? () => {
                    setWishlisted(s => { const n = new Set(s); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n; });
                    showToast(wishlisted.has(p.id) ? 'Removed from trip plan' : 'Saved to trip plan ♥');
                  } : undefined} style={{
                    width: 64, height: 64, borderRadius: 32, flexShrink: 0,
                    background: focused ? '#fff' : 'rgba(255,255,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: focused ? '0 0 0 2.5px rgba(255,255,255,0.8)' : 'none',
                    transition: 'all 0.15s ease', cursor: interactive ? 'pointer' : 'default',
                  }}>
                    <HeartIcon
                      stroke={wishlisted.has(p.id) ? (focused ? '#e63' : '#f87') : (focused ? '#111' : '#fff')}
                      fill={wishlisted.has(p.id) ? (focused ? '#e63' : '#f87') : 'none'}
                    />
                  </div>
                );

                /* maps — primary when focused, secondary otherwise */
                return (
                  <div key="maps" onClick={interactive ? () => { setQrOpen(true); setZone('qrModal'); } : undefined}
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
                      transition: 'all 0.15s ease', cursor: interactive ? 'pointer' : 'default',
                    }}>
                    {p.ctaLabel}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </>
    );
  };

  /* ── collapsed portrait card — used both in the sliding rail and in the
     fixed next-section nudge overlay (identical look, different position) ── */
  const renderCollapsedCard = (p: TravelItem, opts: { dim?: boolean; onClick?: () => void } = {}) => (
    <div key={p.id} style={{
      width: COL_W, height: COL_H, flexShrink: 0,
      borderRadius: 32, overflow: 'hidden',
      position: 'relative', background: '#141414',
      boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
      opacity: opts.dim ? 0.5 : 1,
      transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.45s ease',
      cursor: opts.onClick ? 'pointer' : 'default',
    }} onClick={opts.onClick}>
      <img src={p.photo} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.1)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 104, background: 'linear-gradient(to bottom, rgba(20,20,20,0.5), transparent)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 242, background: 'linear-gradient(to bottom, rgba(20,20,20,0), #141414)', pointerEvents: 'none' }} />

      {/* top label */}
      <div style={{ position: 'absolute', top: 20, left: 20, right: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <img src="/images/l1/pin.svg" alt="" style={{ width: 32, height: 32 }} />
        <span style={{ fontSize: 22, lineHeight: '28px', fontWeight: 500, fontFamily: 'Inter,sans-serif' }}>{p.agentLabel}</span>
      </div>

      {/* bottom text */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {p.rating != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#ffba71', fontSize: 22, lineHeight: '24px', fontWeight: 600, fontFamily: 'Inter,sans-serif' }}>{p.rating}</span>
            <img src="/images/l1/star.svg" alt="" style={{ width: 24, height: 24 }} />
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 32, fontWeight: 500, lineHeight: '44px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
          <p style={{ fontSize: 24, fontWeight: 600, lineHeight: '32px', margin: 0, opacity: 0.7 }}>{p.price ?? p.area}</p>
        </div>
      </div>

      <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 20px rgba(255,255,255,0.3)', borderRadius: 30, pointerEvents: 'none' }} />
    </div>
  );

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

        {/* ── BG ──────────────────────────────────────── */}
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
          Plan a trip to Coorg
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
            Here&rsquo;s your Coorg weekend escape — a lush, misty retreat for nature and coffee lovers alike.
          </p>
        </div>

        {/* ── Tab bar — active tab is a raised glass panel merged into the
               divider line beneath it; inactive tabs are plain text ── */}
        <div style={{
          position: 'absolute', top: TABS_TOP, left: L_PAD - 28, right: 120, zIndex: 6,
        }}>
          {/* divider — runs the full width, hidden behind the active tab's panel */}
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, background: 'rgba(255,255,255,0.14)' }} />
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, position: 'relative' }}>
            {TABS.map((t, i) => {
              const active  = tabIdx === i;
              const focused = zone === 'tabs' && active;
              return (
                <span key={t.id} onClick={() => { switchTab(i); setZone('tabs'); }} style={{
                  position: 'relative',
                  padding: '16px 28px',
                  borderRadius: active ? '18px 18px 0 0' : 0,
                  background: active ? 'rgba(255,255,255,0.14)' : 'transparent',
                  backdropFilter: active ? 'blur(20px)' : 'none',
                  boxShadow: focused ? 'inset 0 0 0 1.5px rgba(255,255,255,0.5)' : 'none',
                  fontSize: 26, lineHeight: '32px',
                  fontWeight: active ? 600 : 400,
                  fontFamily: 'Inter,sans-serif',
                  color: active ? '#fff' : 'rgba(255,255,255,0.45)',
                  whiteSpace: 'nowrap', cursor: 'pointer',
                  transition: 'all 0.25s ease',
                }}>{t.label}</span>
              );
            })}
          </div>
        </div>

        {/* ── Card rail — one continuous strip; the focused card expands in
               place (grows from its collapsed footprint to the full card) and
               is carried along by the rail's slide, same as the rest of the
               row — nothing is pinned to a fixed screen position. ── */}
        <div style={{
          position: 'absolute', top: CARD_TOP, left: 0,
          height: EXP_H,
          display: 'flex', alignItems: 'center',
          transform: `translateX(${railShift}px)`,
          transition: 'transform 0.65s cubic-bezier(0.16,1,0.3,1)',
          willChange: 'transform',
          zIndex: 4,
        }}>
          {TABS.map((t, ti) => (
            <Fragment key={t.id}>
              {ti > 0 && <div style={{ width: SECTION_GAP, flexShrink: 0 }} />}
              <div style={{ display: 'flex', alignItems: 'center', gap: CARD_G }}>
              {TAB_ITEMS[t.id].map((p, i) => {
            // Only expand while focus is actually on the card row (cta/flyout/
            // qrModal). When focus moves up to the tabs or down to the prompt
            // row, this card collapses back to its plain, non-focused look.
            const isFocused = tabIdx === ti && cardIdx === i
              && (zone === 'cta' || zone === 'flyout' || zone === 'qrModal');

            if (isFocused) {
              /* ── expanded card — grows out of the collapsed slot ── */
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
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.1)', pointerEvents: 'none', zIndex: 1 }} />
                  {/* inset glow */}
                  <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 20px rgba(255,255,255,0.3)', pointerEvents: 'none', zIndex: 2 }} />
                  {renderCardBody(p, navDir, true)}
                </div>
              );
            }

            /* ── collapsed portrait card ─────────────── */
            return renderCollapsedCard(p, {
              dim: tabIdx !== ti,
              onClick: () => { setTabIdx(ti); setCardIdx(i); setZone('cta'); },
            });
          })}
              </div>
            </Fragment>
          ))}
        </div>

        {/* ── Next-section nudge — fixed position, does not slide with the
               rail. Visible from the second-to-last card of a section through
               the last card, always at the same spot, so it never appears to
               jump when focus moves between those two cards. ── */}
        {nextSectionFirstItem && (
          <div style={{
            position: 'absolute',
            top: CARD_TOP + (EXP_H - COL_H) / 2,
            left: W - COL_W / 2,
            zIndex: 4,
          }}>
            {renderCollapsedCard(nextSectionFirstItem, {
              dim: true,
              onClick: () => { setTabIdx(tabIdx + 1); setCardIdx(0); setZone('cta'); },
            })}
          </div>
        )}

        {/* ── Prompt row ──────────────────────────────── */}
        <div style={{
          position: 'absolute', top: PROMPT_TOP, left: L_PAD, right: 0, height: 72,
          display: 'flex', alignItems: 'center', gap: 32,
          zIndex: 13, overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <div className="fl1-gborder" style={{
              width: 72, height: 72, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <img src="/images/l1/keyboard.svg" alt="" style={{ width: 40, height: 40 }} />
            </div>
            <div className="fl1-gborder" style={{
              width: 72, height: 72, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <img src="/images/l1/mic.svg" alt="" style={{ width: 40, height: 40 }} />
            </div>
          </div>
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

        {/* ── QR overlay — right panel ────────────────── */}
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

            <div style={{
              position: 'absolute', left: 1095, top: 130, width: 623, zIndex: 62,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center',
            }}>
              <p style={{ fontSize: 48, lineHeight: '64px', fontWeight: 600, color: '#fff', margin: 0 }}>{place.ctaModalTitle}</p>
              <p style={{ fontSize: 24, fontWeight: 500, color: 'rgba(255,255,255,0.8)', letterSpacing: '-0.24px', margin: 0, fontFamily: 'Inter,sans-serif' }}>
                {place.ctaModalSubtitle}
              </p>
            </div>

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
                {place.rating != null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <img src="/images/l1/star.svg" alt="" style={{ width: 20, height: 20 }} />
                    <span style={{ color: '#ffba71', fontSize: 18, lineHeight: '20px', fontWeight: 600, fontFamily: 'Inter,sans-serif', textTransform: 'uppercase' }}>
                      {place.rating}{place.ratingCount ? ` (${place.ratingCount} reviews)` : ''}
                    </span>
                  </div>
                )}
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
          {' '}· tab:{tab.id}
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
      // 2 physical px regardless of stage scale
      document.documentElement.style.setProperty('--food-l1-hairline', `${2 / s}px`);
    };
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, []);
  return null;
}
