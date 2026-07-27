/**
 * ExploreFirstPanel — Option 5: exploration-first Agent Hub.
 *
 * Concept: Agent → Explore → Browse — presented as L0 UNFOLDING into Explore,
 * never as a page switch.
 *
 * ONE navigation system, two states (see ExploreNav):
 *   collapsed — the three-icon rail on L0: context (compass) · mic · settings
 *   expanded  — the same icons at the same anchor, grown into the full nav:
 *               CONTINUE (current L0 context) → Ask Glance (the mic) →
 *               agents → AI Gallery/Wishlist/Recent → Settings (the gear)
 *
 * The current L0 card (title · journey · image) becomes the first expanded
 * entry, so the user always knows why they arrived. The matching agent is
 * pre-selected and its Explore grid is already showing. The pinned dock stays
 * fixed at the extreme right in both states.
 *
 * Visual language: inherited from Option 4 (HybridHubPanel) — same icons,
 * focus chrome, glass, gradients, typography, adaptive cards.
 */

import { useState, useEffect, useRef } from 'react';
import {
  FONT, RADIUS, chrome, Icon, SectionLabel, PinSquare, KEYFRAMES, HOLD_MS,
  PRIMARY, MAX_PINS, pinnableById, registerPinnable,
  type PinMeta,
} from './HybridHubPanel';

// ─── Current-L0 context — the reason the user pressed ← ─────────────────────

export type ExploreContext = {
  /** current L0 card title, e.g. "Om Beach at Sunrise" */
  title: string;
  /** the journey / CTA it belongs to, e.g. "Weekend Escape" */
  journey: string;
  image?: string;
};

// ─── Explore collections — imagery-led, per agent ────────────────────────────

type CenterItem = { id: string; title: string; desc?: string; image?: string };

const COLLECTIONS: Record<string, CenterItem[]> = {
  travel: [
    { id: 'weekend-escapes', title: 'Weekend Escapes', desc: 'Close-by getaways',    image: '/images/warm-start/coorg.jpg' },
    { id: 'road-trips',      title: 'Road Trips',      desc: 'Scenic drives',        image: '/images/feed/feed_29-travel-goa-coastal-road.jpg' },
    { id: 'hidden-gems',     title: 'Hidden Gems',     desc: 'Off the beaten path',  image: '/images/feed/feed_40-travel-wildlife-dawn-grassland.jpg' },
    { id: 'beach',           title: 'Beach',           desc: 'Sand & sea',           image: '/images/warm-start/om-beach.webp' },
    { id: 'mountains',       title: 'Mountains',       desc: 'Higher altitudes',     image: '/images/warm-start/nandi-hills.jpg' },
    { id: 'international',   title: 'International',   desc: 'Further away',         image: '/images/warm-start/amalfi-coast.jpg' },
  ],
  recipes: [
    { id: 'dinner-tonight', title: 'Dinner Tonight', desc: 'Ready in 30',     image: '/images/feed/feed_04-food-dinner-party-table.jpg' },
    { id: 'quick-meals',    title: 'Quick Meals',    desc: 'Fast & easy',     image: '/images/feed/feed_42-food-japanese-ramen-counter.jpg' },
    { id: 'healthy',        title: 'Healthy',        desc: 'Light & fresh',   image: '/images/feed/feed_59-food-healthy-bowl-kitchen.jpg' },
    { id: 'street-food',    title: 'Street Food',    desc: 'Chai & chaat',    image: '/images/feed/feed_47-food-monsoon-chai-stall.jpg' },
    { id: 'from-the-garden', title: 'From the Garden', desc: 'Grow & cook',   image: '/images/feed/feed_64-hobbies-kitchen-garden.jpg' },
    { id: 'morning-table',  title: 'Morning Table',  desc: 'Breakfast ideas', image: '/images/feed/feed_09-home-kitchen-morning.jpg' },
  ],
  shopping: [
    { id: 'price-drops', title: 'Price Drops', desc: 'Tracked for you',   image: '/images/feed/feed_46-fashion-luxury-flatlay.jpg' },
    { id: 'electronics', title: 'Electronics', desc: 'Smart living',      image: '/images/feed/feed_49-career-creator-desk-night.jpg' },
    { id: 'fashion',     title: 'Fashion',     desc: 'Wardrobe picks',    image: '/images/feed/feed_31-fashion-streetwear-editorial.jpg' },
    { id: 'beauty',      title: 'Beauty',      desc: 'Vanity & care',     image: '/images/feed/feed_36-beauty-vanity-glow.jpg' },
    { id: 'kitchen',     title: 'Kitchen',     desc: 'Cook better',       image: '/images/feed/feed_09-home-kitchen-morning.jpg' },
    { id: 'audio',       title: 'Audio',       desc: 'Headphones & hifi', image: '/images/feed/feed_60-entertainment-vinyl-music-room.jpg' },
  ],
  entertainment: [
    { id: 'continue-watching', title: 'Continue Watching', desc: 'Pick up the thread', image: '/images/feed/feed_60-entertainment-vinyl-music-room.jpg' },
    { id: 'live-now',          title: 'Live Now',          desc: 'On right now',       image: '/images/feed/feed_25-sports-cricket-stadium-floodlights.jpg' },
    { id: 'music-nights',      title: 'Music Nights',      desc: 'Vinyl & sessions',   image: '/images/warm-start/vinyl-ritual.webp' },
    { id: 'city-nights',       title: 'City Nights',       desc: 'Out after dark',     image: '/images/feed/feed_58-travel-mumbai-marine-drive-night.jpg' },
    { id: 'classical-arts',    title: 'Classical Arts',    desc: 'Dance & drama',      image: '/images/feed/feed_13-entertainment-classical-dance.jpg' },
    { id: 'wind-down',         title: 'Wind Down',         desc: 'Calm evenings',      image: '/images/warm-start/sleep-wind-down.jpg' },
  ],
  fashion: [
    { id: 'new-looks',     title: 'New Looks',     desc: 'Fresh this week', image: '/images/feed/feed_31-fashion-streetwear-editorial.jpg' },
    { id: 'luxury-edit',   title: 'Luxury Edit',   desc: 'Premium picks',   image: '/images/feed/feed_46-fashion-luxury-flatlay.jpg' },
    { id: 'grooming',      title: 'Grooming',      desc: 'Look sharp',      image: '/images/feed/feed_50-beauty-barbershop-grooming.jpg' },
    { id: 'occasion-wear', title: 'Occasion Wear', desc: 'Festive fits',    image: '/images/feed/feed_18-beauty-haldi-ritual.jpg' },
    { id: 'wedding-edit',  title: 'Wedding Edit',  desc: 'Big-day looks',   image: '/images/feed/feed_33-culture-wedding-mandap-decor.jpg' },
    { id: 'everyday',      title: 'Everyday',      desc: 'Easy staples',    image: '/images/feed/feed_36-beauty-vanity-glow.jpg' },
  ],
  'home-decor': [
    { id: 'cozy-corners',    title: 'Cozy Corners',    desc: 'Warm & layered',    image: '/images/feed/feed_24-home-cozy-monsoon-living-room.jpg' },
    { id: 'japandi',         title: 'Japandi',         desc: 'Calm minimalism',   image: '/images/feed/feed_28-home-japandi-minimal-living.jpg' },
    { id: 'balcony-gardens', title: 'Balcony Gardens', desc: 'Green nooks',       image: '/images/feed/feed_44-home-modern-balcony-garden.jpg' },
    { id: 'kitchen-refresh', title: 'Kitchen Refresh', desc: 'Heart of the home', image: '/images/feed/feed_09-home-kitchen-morning.jpg' },
    { id: 'warm-lighting',   title: 'Warm Lighting',   desc: 'Set the mood',      image: '/images/feed/eatly-dawn.jpg' },
    { id: 'everyday-luxury', title: 'Everyday Luxury', desc: 'Spa-like touches',  image: '/images/feed/feed_16-luxury-spa-ritual.jpg' },
  ],
};

// ─── Your Space destinations ────────────────────────────────────────────────

const YOUR_SPACE_ROWS = [
  { id: 'ai-gallery', label: 'AI Gallery', icon: 'gallery',  tint: '#B9A6F0' },
  { id: 'wishlist',   label: 'Wishlist',   icon: 'wishlist', tint: '#F79BC3' },
  { id: 'recent',     label: 'Recent',     icon: 'recent',   tint: '#9AA3B2' },
];

/** AI Gallery — the actual creations upfront, newest first. No category buckets. */
const GALLERY_ITEMS: CenterItem[] = [
  { id: 'forest-cabin',   title: 'Forest Cabin',   desc: 'Generated 10 min ago', image: '/images/feed/feed_34-travel-nordic-winter-cabin.jpg' },
  { id: 'holi-burst',     title: 'Holi Burst',     desc: 'Yesterday',            image: '/images/feed/feed_63-culture-holi-color-abstract.jpg' },
  { id: 'neon-alley',     title: 'Neon Alley',     desc: '2 days ago',           image: '/images/feed/feed_31-fashion-streetwear-editorial.jpg' },
  { id: 'amalfi-dream',   title: 'Amalfi Dream',   desc: 'Last week',            image: '/images/warm-start/amalfi-coast.jpg' },
  { id: 'quiet-living',   title: 'Quiet Living',   desc: 'Last week',            image: '/images/feed/feed_28-home-japandi-minimal-living.jpg' },
  { id: 'marine-drive',   title: 'Marine Drive',   desc: '2 weeks ago',          image: '/images/feed/feed_58-travel-mumbai-marine-drive-night.jpg' },
];

/** Wishlist — the actual saved items upfront. No category buckets. */
const WISHLIST_ITEMS: CenterItem[] = [
  { id: 'sony-xm5',       title: 'Sony WH-1000XM5', desc: '↓ ₹2,000 today',       image: '/images/feed/feed_46-fashion-luxury-flatlay.jpg' },
  { id: 'coorg-homestay', title: 'Coorg Homestay',  desc: 'Saved from Travel',    image: '/images/warm-start/coorg.jpg' },
  { id: 'naan-pizza',     title: 'Naan Pizza',      desc: 'Saved recipe',         image: '/images/feed/feed_04-food-dinner-party-table.jpg' },
  { id: 'denim-layers',   title: 'Denim Layers',    desc: 'Saved look',           image: '/images/feed/feed_31-fashion-streetwear-editorial.jpg' },
  { id: 'warm-floor-lamp', title: 'Warm Floor Lamp', desc: 'Saved from Home Decor', image: '/images/feed/feed_24-home-cozy-monsoon-living-room.jpg' },
];

const RECENT_THREADS = [
  { id: 'thread-coorg',      title: '“Can you plan a 3-day Coorg trip?”',      sub: 'Travel · yesterday',   icon: 'travel',   tint: '#4DD0C4' },
  { id: 'thread-jacket',     title: '“What jacket goes with this dress?”',      sub: 'Fashion · 2 days ago', icon: 'fashion',  tint: '#F79BC3' },
  { id: 'thread-headphones', title: '“Find me headphones under ₹25,000”',       sub: 'Shopping · last week', icon: 'shopping', tint: '#6BD98A' },
];

const SETTINGS_ROWS = [
  { id: 'profile',       title: 'Profile',            sub: 'Aswanth · Bengaluru' },
  { id: 'services',      title: 'Connected Services', sub: '3 linked' },
  { id: 'notifications', title: 'Notifications',      sub: 'Smart summaries on' },
  { id: 'privacy',       title: 'Privacy',            sub: 'Data & permissions' },
  { id: 'preferences',   title: 'Preferences',        sub: 'Interests & tuning' },
];

// Center content is fully owned by the current left-nav selection.
type CenterContent =
  | { kind: 'visual'; label: string; tone: string; items: CenterItem[]; footer?: string }
  | { kind: 'rows'; label: string; items: { id: string; title: string; sub?: string; icon?: string; tint?: string }[]; footer: string };

function contentFor(selectedNav: string): CenterContent {
  const agent = PRIMARY.find(a => a.id === selectedNav);
  if (agent) return { kind: 'visual', label: `Explore · ${agent.label}`, tone: agent.tone, items: COLLECTIONS[agent.id] ?? [] };
  switch (selectedNav) {
    case 'ai-gallery': return { kind: 'visual', label: 'AI Gallery', tone: '#B9A6F0', items: GALLERY_ITEMS, footer: 'View Gallery →' };
    case 'wishlist':   return { kind: 'visual', label: 'Wishlist',   tone: '#F79BC3', items: WISHLIST_ITEMS, footer: 'View Wishlist →' };
    case 'recent':     return { kind: 'rows', label: 'Recent', items: RECENT_THREADS, footer: 'Continue →' };
    case 'settings':   return { kind: 'rows', label: 'Settings', items: SETTINGS_ROWS, footer: 'Open Settings →' };
    default:           return { kind: 'visual', label: 'Explore', tone: '#4DD0C4', items: COLLECTIONS.travel };
  }
}

const agentIdForCategory = (category?: string): string => {
  const map: Record<string, string> = {
    travel: 'travel', food: 'recipes', shopping: 'shopping',
    entertainment: 'entertainment', sports: 'entertainment', music: 'entertainment',
    fashion: 'fashion', beauty: 'fashion', home: 'home-decor',
  };
  return map[category ?? ''] ?? 'travel';
};

// Geometry — the nav anchors at the same spot as the collapsed rail (left 20,
// vertically centered); the dock anchors to the screen's right edge.
const NAV_X = 20;
const NAV_W = 276;
const PANEL_W = 1080;
const CONTENT_X = NAV_X + NAV_W + 30;
const CARD_H = 100;
const PIN_SQ = 112;

// Navigation zones (integer slots):
const CTX = -2;            // CONTINUE — the current L0 context entry
const ASK = -1;            // Ask Glance (mic)
const A_BASE = 0;          // 0..5   agents
const S_BASE = 10;         // 10..12 AI Gallery · Wishlist · Recent
const SETTINGS_SLOT = 15;  // settings — bottom, isolated
const G_BASE = 20;         // 20..∞  center content (incl. trailing footer row)
const P_BASE = 60;         // 60..63 pinned dock

export type ExploreFirstPanelProps = {
  onBack: () => void;
  onToast?: (msg: string) => void;
  /** category of the current L0 card — used to preselect the matching agent */
  currentCategory?: string;
  /** the current L0 card, shown as the CONTINUE entry on top of the nav */
  context?: ExploreContext;
  /** where focus lands on entry: the nav (←) or the pinned dock (→) */
  initialFocus?: 'nav' | 'pins';
  pinnedIds: string[];
  onTogglePin: (id: string) => void;
};

export default function ExploreFirstPanel({ onBack, onToast, currentCategory, context, initialFocus = 'nav', pinnedIds, onTogglePin }: ExploreFirstPanelProps) {
  const initialAgent = agentIdForCategory(currentCategory);
  const [selectedNav, setSelectedNav] = useState(initialAgent);
  // ← lands on the CONTINUE entry (the reason the user pressed ←);
  // → lands on the pinned dock.
  const [slot, setSlot] = useState(
    initialFocus === 'pins' && pinnedIds.length > 0 ? P_BASE : (context ? CTX : ASK)
  );
  const pinCount = pinnedIds.length;
  const holdRef = useRef<{ t: ReturnType<typeof setTimeout> | null; fired: boolean }>({ t: null, fired: false });
  const pendingReplace = useRef<{ id: string; t: ReturnType<typeof setTimeout> } | null>(null);

  const content = contentFor(selectedNav);
  const cols = content.kind === 'visual' ? 3 : 1;
  const itemCount = content.items.length;
  const footerSlot = content.footer ? G_BASE + itemCount : -99;

  // Browse-as-you-move: focusing a destination row makes it own the center
  // panel. CTX and ASK are actions — they never change the selection, so the
  // matching agent stays visibly selected while they're focused.
  useEffect(() => {
    if (slot >= A_BASE && slot < A_BASE + PRIMARY.length) setSelectedNav(PRIMARY[slot - A_BASE].id);
    else if (slot >= S_BASE && slot < S_BASE + YOUR_SPACE_ROWS.length) setSelectedNav(YOUR_SPACE_ROWS[slot - S_BASE].id);
    else if (slot === SETTINGS_SLOT) setSelectedNav('settings');
  }, [slot]);

  // Clamp center focus when the selection (and item count) changes.
  useEffect(() => {
    const max = content.footer ? itemCount : itemCount - 1;
    if (slot >= G_BASE && slot < P_BASE && slot - G_BASE > max) setSlot(G_BASE + max);
  }, [itemCount, content.footer, slot]);

  // Clamp dock focus if pins shrink.
  useEffect(() => {
    if (slot >= P_BASE && slot - P_BASE >= pinCount) {
      setSlot(pinCount > 0 ? P_BASE + pinCount - 1 : G_BASE);
    }
  }, [pinCount, slot]);

  const navSlotForSelected = () => {
    const a = PRIMARY.findIndex(x => x.id === selectedNav);
    if (a >= 0) return A_BASE + a;
    if (selectedNav === 'settings') return SETTINGS_SLOT;
    const s = YOUR_SPACE_ROWS.findIndex(x => x.id === selectedNav);
    return s >= 0 ? S_BASE + s : A_BASE;
  };

  const itemPinMeta = (it: CenterItem): PinMeta => ({
    id: `col-${selectedNav}-${it.id}`,
    label: it.title,
    status: 'SAVED',
    tone: content.kind === 'visual' ? content.tone : '#9AA3B2',
    hero: it.title,
    context: it.desc,
    image: it.image,
  });

  const pinWithConfirm = (meta: PinMeta) => {
    registerPinnable(meta);
    if (pinnedIds.includes(meta.id)) {
      onTogglePin(meta.id);
      onToast?.(`Unpinned ${meta.label}`);
      return;
    }
    if (pinCount < MAX_PINS) {
      onTogglePin(meta.id);
      onToast?.(`📌 Pinned ${meta.label}`);
      return;
    }
    if (pendingReplace.current?.id === meta.id) {
      clearTimeout(pendingReplace.current.t);
      pendingReplace.current = null;
      const oldest = pinnedIds[0];
      onTogglePin(oldest);
      onTogglePin(meta.id);
      onToast?.(`↺ Replaced ${pinnableById(oldest)?.label ?? 'oldest pin'} with ${meta.label}`);
    } else {
      if (pendingReplace.current) clearTimeout(pendingReplace.current.t);
      const t = setTimeout(() => { pendingReplace.current = null; }, 4000);
      pendingReplace.current = { id: meta.id, t };
      onToast?.('Pins full — hold OK again to replace the oldest');
    }
  };

  useEffect(() => {
    const zones = () => ({
      inCtx: slot === CTX,
      inAsk: slot === ASK,
      inAgents: slot >= A_BASE && slot < A_BASE + PRIMARY.length,
      inSpace: slot >= S_BASE && slot < S_BASE + YOUR_SPACE_ROWS.length,
      inSettings: slot === SETTINGS_SLOT,
      inGrid: slot >= G_BASE && slot < P_BASE,
      inPins: slot >= P_BASE,
    });

    const down = (e: KeyboardEvent) => {
      const k = e.key;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter',' ','Escape','Backspace'].includes(k)) e.preventDefault();
      if (k === 'Escape' || k === 'Backspace') { onBack(); return; }

      const { inCtx, inAsk, inAgents, inSpace, inSettings, inGrid, inPins } = zones();
      const inNav = inCtx || inAsk || inAgents || inSpace || inSettings;
      const gIdx = inGrid ? slot - G_BASE : 0;
      const onFooter = inGrid && slot === footerSlot;
      const gRow = Math.floor(gIdx / cols);
      const gCol = gIdx % cols;
      const lastRow = Math.floor((itemCount - 1) / cols);

      if (k === 'Enter' || k === ' ') {
        if (e.repeat) return;
        holdRef.current.fired = false;
        holdRef.current.t = setTimeout(() => {
          holdRef.current.fired = true;
          holdRef.current.t = null;
          if (inGrid && !onFooter && content.kind === 'visual') { pinWithConfirm(itemPinMeta(content.items[gIdx])); return; }
          if (inAgents) { pinWithConfirm(PRIMARY[slot - A_BASE] as PinMeta); return; }
          if (inPins) {
            const id = pinnedIds[slot - P_BASE];
            onTogglePin(id);
            onToast?.(`Unpinned ${pinnableById(id)?.label ?? 'item'}`);
            return;
          }
          onToast?.("This can't be pinned");
        }, HOLD_MS);
        return;
      }

      if (k === 'ArrowLeft') {
        if (inNav) { onBack(); return; }
        if (inGrid) {
          if (!onFooter && gCol > 0) setSlot(s => s - 1);
          else setSlot(navSlotForSelected());
          return;
        }
        if (inPins) { setSlot(G_BASE); return; }
        return;
      }
      if (k === 'ArrowRight') {
        if (inNav) { setSlot(G_BASE); return; }
        if (inGrid) {
          if (!onFooter && gCol < cols - 1 && gIdx + 1 < itemCount) setSlot(s => s + 1);
          else if (pinCount > 0) setSlot(P_BASE + Math.min(onFooter ? pinCount - 1 : gRow, pinCount - 1));
          return;
        }
        return;
      }
      if (k === 'ArrowDown') {
        if (inCtx) { setSlot(ASK); return; }
        if (inAsk) { setSlot(A_BASE); return; }
        if (inAgents) { slot < A_BASE + PRIMARY.length - 1 ? setSlot(s => s + 1) : setSlot(S_BASE); return; }
        if (inSpace) { slot < S_BASE + YOUR_SPACE_ROWS.length - 1 ? setSlot(s => s + 1) : setSlot(SETTINGS_SLOT); return; }
        if (inGrid) {
          if (onFooter) return;
          if (gIdx + cols < itemCount) setSlot(s => s + cols);
          else if (gRow < lastRow) setSlot(G_BASE + itemCount - 1);
          else if (content.footer) setSlot(footerSlot);
          return;
        }
        if (inPins) { if (slot - P_BASE < pinCount - 1) setSlot(s => s + 1); return; }
        return;
      }
      if (k === 'ArrowUp') {
        if (inAsk) { if (context) setSlot(CTX); return; }
        if (inAgents) { slot > A_BASE ? setSlot(s => s - 1) : setSlot(ASK); return; }
        if (inSpace) { slot > S_BASE ? setSlot(s => s - 1) : setSlot(A_BASE + PRIMARY.length - 1); return; }
        if (inSettings) { setSlot(S_BASE + YOUR_SPACE_ROWS.length - 1); return; }
        if (inGrid) {
          if (onFooter) setSlot(G_BASE + itemCount - 1);
          else if (gRow > 0) setSlot(s => s - cols);
          return;
        }
        if (inPins) { if (slot > P_BASE) setSlot(s => s - 1); return; }
        return;
      }
    };

    const up = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (holdRef.current.t) { clearTimeout(holdRef.current.t); holdRef.current.t = null; }
      if (holdRef.current.fired) { holdRef.current.fired = false; return; }
      const { inCtx, inAsk, inAgents, inSpace, inSettings, inGrid, inPins } = zones();
      if (inCtx) { onToast?.(`Continuing ${context?.journey ?? 'your journey'}…`); return; }
      if (inAsk) { onToast?.('Opening Ask Glance…'); return; }
      if (inAgents || inSpace || inSettings) { setSlot(G_BASE); return; } // enter the context panel
      if (inGrid) {
        if (slot === footerSlot && content.footer) { onToast?.(`${content.footer.replace(' →', '')}…`); return; }
        onToast?.(`Opening ${content.items[slot - G_BASE].title}…`);
        return;
      }
      if (inPins) { onToast?.(`Opening ${pinnableById(pinnedIds[slot - P_BASE])?.label}…`); return; }
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      if (holdRef.current.t) clearTimeout(holdRef.current.t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot, selectedNav, content, cols, itemCount, footerSlot, pinCount, pinnedIds, context, onBack, onToast]);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'auto', animation: 'hh-in 0.25s ease forwards' }}>
      {/* Left gradient — lighter than before: L0 stays recognizable behind */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: PANEL_W + 320,
        background: 'linear-gradient(to right, rgba(5,5,12,0.94) 0%, rgba(5,5,12,0.88) 55%, rgba(5,5,12,0.5) 80%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* The navigation — the collapsed L0 rail, expanded in place */}
      <ExploreNav
        state="expanded"
        context={context}
        slot={slot}
        setSlot={setSlot}
        selectedNav={selectedNav}
        pinnedIds={pinnedIds}
      />

      {/* Center content + logo + hints */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: PANEL_W,
        boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
        padding: `36px 44px 28px ${CONTENT_X}px`,
        animation: 'hh-in 0.35s 0.1s both',
      }}>
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/glance-logo.png" alt="Glance" style={{ height: 22, opacity: 0.88 }} />
          <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
            Explore
          </span>
        </div>

        <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center' }}>
          {/* Contextual — keyed by selection so content crossfades, never lingers */}
          <div key={selectedNav} style={{ width: '100%', animation: 'hh-in 0.3s ease both' }}>
            <SectionLabel text={content.label} />
            {content.kind === 'visual' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {content.items.map((c, i) => (
                  <CollectionCard
                    key={c.id}
                    item={c}
                    tone={content.tone}
                    focused={slot === G_BASE + i}
                    pinned={pinnedIds.includes(`col-${selectedNav}-${c.id}`)}
                    animDelay={i * 0.02 + 0.12}
                    onClick={() => setSlot(G_BASE + i)}
                  />
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {content.items.map((r, i) => (
                  <ThreadRow
                    key={r.id}
                    title={r.title} sub={r.sub} icon={r.icon} tint={r.tint}
                    focused={slot === G_BASE + i}
                    animDelay={i * 0.03 + 0.12}
                    onClick={() => setSlot(G_BASE + i)}
                  />
                ))}
              </div>
            )}
            {content.footer && (
              <FooterLink
                text={content.footer}
                focused={slot === footerSlot}
                onClick={() => setSlot(footerSlot)}
              />
            )}
          </div>
        </div>

        <div style={{ flexShrink: 0, display: 'flex', gap: 12, paddingTop: 12 }}>
          {[['↑↓←→','Navigate'],['OK','Open'],['Hold OK','Pin / Unpin'],['←','Back to L0']].map(([k,l]) => (
            <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: FONT, fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
              <kbd style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.28)', fontFamily: FONT }}>{k}</kbd>
              {l}
            </span>
          ))}
        </div>
      </div>

      {/* Pinned dock — fixed to the screen's right edge, identical to L0 */}
      <PinnedDockRight
        pinnedIds={pinnedIds}
        focusedIdx={slot >= P_BASE ? slot - P_BASE : null}
        showLabel
        onSelect={i => setSlot(P_BASE + i)}
      />

      <style>{KEYFRAMES + EF_KF}</style>
    </div>
  );
}

// ─── ExploreNav — ONE navigation system, two states ─────────────────────────
// collapsed: the three-icon rail on L0 (context · mic · settings)
// expanded:  the same icons, same anchor, grown into the labeled nav.

export function ExploreNav(props: {
  state: 'collapsed' | 'expanded';
  onOpen?: () => void;
  context?: ExploreContext;
  slot?: number;
  setSlot?: (n: number) => void;
  selectedNav?: string;
  pinnedIds?: string[];
}) {
  const { state, onOpen, context, slot = -99, setSlot, selectedNav, pinnedIds = [] } = props;

  if (state === 'collapsed') {
    // The rail: compass = current context / Explore (highlighted: it's what ←
    // continues into), mic = Ask Glance, gear = Settings. Same order expanded.
    const items = ['explore', 'mic', 'settings'];
    return (
      <div
        onClick={onOpen}
        style={{
          position: 'absolute', left: NAV_X, top: '50%', transform: 'translateY(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
          padding: '16px 12px', borderRadius: 999, zIndex: 56, cursor: 'pointer',
          background: 'rgba(16,16,24,0.55)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 0 0 1px rgba(255,255,255,0.07), 0 8px 24px rgba(0,0,0,0.35)',
          animation: 'hh-in 0.4s ease both',
        }}
      >
        {items.map((name, i) => (
          <div key={name} style={{
            width: 38, height: 38, borderRadius: '50%',
            display: 'grid', placeItems: 'center',
            background: i === 0 ? 'rgba(255,255,255,0.14)' : 'transparent',
            boxShadow: i === 0 ? 'inset 0 0 0 1.5px rgba(255,255,255,0.75)' : 'none',
          }}>
            <Icon name={name} tint={i === 0 ? '#fff' : 'rgba(255,255,255,0.55)'} size={19} />
          </div>
        ))}
        <style>{KEYFRAMES}</style>
      </div>
    );
  }

  // Expanded — grows from the rail's anchor. The container widens from the
  // capsule; labels and extra rows fade in around the persistent icons.
  return (
    <div style={{
      position: 'absolute', left: NAV_X, top: '50%', transform: 'translateY(-50%)',
      width: NAV_W, boxSizing: 'border-box', zIndex: 56,
      padding: '16px 14px', borderRadius: 28, overflow: 'hidden',
      background: 'rgba(14,14,22,0.72)',
      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 0 0 1px rgba(255,255,255,0.07), 0 12px 36px rgba(0,0,0,0.4)',
      animation: 'ef-nav-grow 0.42s cubic-bezier(0.25, 0.8, 0.25, 1) both',
    }}>
      {/* 1 · CONTINUE — the current L0 context, the reason ← was pressed */}
      {context && (
        <>
          <ContinueEntry context={context} focused={slot === CTX} onClick={() => setSlot?.(CTX)} />
          <div style={{ height: 14 }} />
        </>
      )}

      {/* 2 · Ask Glance — the same mic as the collapsed rail */}
      <NavRow
        icon="mic" tint="#C9A6F5" label="Ask Glance" sub="Start a conversation"
        focused={slot === ASK}
        onClick={() => setSlot?.(ASK)}
      />

      <div style={{ height: 14 }} />

      {/* 3 · Agents */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {PRIMARY.map((a, i) => (
          <NavRow
            key={a.id}
            icon={a.icon} tint={a.tone} label={a.label}
            focused={slot === A_BASE + i}
            selected={selectedNav === a.id}
            pinned={pinnedIds.includes(a.id)}
            animDelay={0.12 + i * 0.02}
            onClick={() => setSlot?.(A_BASE + i)}
          />
        ))}
      </div>

      <div style={{ height: 14 }} />

      {/* 4 · Your Space */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {YOUR_SPACE_ROWS.map((r, i) => (
          <NavRow
            key={r.id}
            icon={r.icon} tint={r.tint} label={r.label}
            focused={slot === S_BASE + i}
            selected={selectedNav === r.id}
            animDelay={0.24 + i * 0.02}
            onClick={() => setSlot?.(S_BASE + i)}
          />
        ))}
      </div>

      <div style={{ height: 16 }} />

      {/* 5 · Settings — the same gear as the collapsed rail, still last */}
      <NavRow
        icon="settings" tint="#9AA3B2" label="Settings"
        focused={slot === SETTINGS_SLOT}
        selected={selectedNav === 'settings'}
        quiet
        animDelay={0.3}
        onClick={() => setSlot?.(SETTINGS_SLOT)}
      />
      <style>{KEYFRAMES + EF_KF}</style>
    </div>
  );
}

/** Back-compat alias — the L0 rail is the collapsed state of ExploreNav. */
export function ExploreMiniMenu({ onOpen }: { onOpen: () => void }) {
  return <ExploreNav state="collapsed" onOpen={onOpen} />;
}

// ─── PinnedDockRight — the persistent adaptive dock (L0 + overlay) ───────────

export function PinnedDockRight({ pinnedIds, focusedIdx = null, showLabel = false, onSelect }: {
  pinnedIds: string[];
  focusedIdx?: number | null;
  showLabel?: boolean;
  onSelect?: (idx: number) => void;
}) {
  return (
    <div style={{
      position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
      display: 'flex', flexDirection: 'column', gap: 16, zIndex: 57,
      animation: 'hh-in 0.4s ease both',
    }}>
      <div style={{
        position: 'absolute', top: -40, bottom: -40, left: -60, right: -20,
        background: 'linear-gradient(to left, rgba(5,5,12,0.72), rgba(5,5,12,0.4) 60%, transparent)',
        pointerEvents: 'none',
      }} />
      {showLabel && (
        <div style={{
          position: 'absolute', bottom: '100%', left: 2, marginBottom: 10,
          fontFamily: FONT, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.16em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap',
        }}>
          Pinned
        </div>
      )}
      {pinnedIds.slice(0, MAX_PINS).map((id, i) => {
        const m = pinnableById(id);
        if (!m) return null;
        return (
          <div key={id} style={{ position: 'relative' }}>
            <PinSquare meta={m} focused={focusedIdx === i} onClick={() => onSelect?.(i)} />
          </div>
        );
      })}
      <style>{KEYFRAMES}</style>
    </div>
  );
}

// ─── Pieces ───────────────────────────────────────────────────────────────────

/** The CONTINUE entry — a continuation, deliberately not styled as an agent. */
function ContinueEntry({ context, focused, onClick }: {
  context: ExploreContext; focused: boolean; onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, boxSizing: 'border-box',
        padding: '11px 12px', borderRadius: 18, cursor: 'pointer',
        background: focused
          ? 'linear-gradient(180deg, rgba(255,255,255,0.11) 0%, rgba(255,255,255,0.05) 100%)'
          : 'rgba(255,255,255,0.04)',
        animation: 'ef-label-in 0.3s 0.08s both',
        ...chrome(focused, 'inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 0 1px rgba(255,255,255,0.05)', 1.02),
      }}
    >
      {context.image && (
        <img src={context.image} alt="" style={{
          width: 46, height: 46, borderRadius: 12, objectFit: 'cover', flexShrink: 0,
          filter: focused ? 'brightness(0.95)' : 'brightness(0.78)',
          transition: 'filter 0.25s ease',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12), 0 2px 8px rgba(0,0,0,0.4)',
        }} />
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
          <span style={{ width: 4.5, height: 4.5, borderRadius: '50%', background: '#8FD6FF', animation: 'hh-status-pulse 3.2s ease-in-out infinite' }} />
          <span style={{ fontFamily: FONT, fontSize: 8.5, fontWeight: 800, letterSpacing: '0.09em', color: '#8FD6FF' }}>CONTINUE</span>
        </div>
        <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 800, color: focused ? '#fff' : 'rgba(255,255,255,0.92)', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', transition: 'color 0.2s ease' }}>
          {context.title}
        </div>
        <div style={{ fontFamily: FONT, fontSize: 10.5, fontWeight: 500, color: 'rgba(255,255,255,0.55)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {context.journey}
        </div>
      </div>
    </div>
  );
}

/** Nav row — quiet icon+text; focused = glass pill (Figma L1 nav language). */
function NavRow({ icon, tint, label, sub, focused, selected, pinned, quiet, animDelay = 0.1, onClick }: {
  icon: string; tint: string; label: string; sub?: string;
  focused: boolean; selected?: boolean; pinned?: boolean; quiet?: boolean;
  animDelay?: number;
  onClick: () => void;
}) {
  const lit = focused || selected;
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, boxSizing: 'border-box',
        padding: sub ? '9px 13px' : '9px 13px', borderRadius: 999, cursor: 'pointer', position: 'relative',
        background: focused
          ? 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
          : selected ? 'rgba(255,255,255,0.035)' : 'transparent',
        ...chrome(focused, 'none', 1.02),
      }}
    >
      <Icon name={icon} tint={lit && !quiet ? tint : 'rgba(255,255,255,0.45)'} size={19} />
      <div style={{ minWidth: 0, flex: 1, animation: `ef-label-in 0.3s ${animDelay.toFixed(2)}s both` }}>
        <div style={{
          fontFamily: FONT, fontSize: 14, fontWeight: lit ? 700 : 500,
          color: quiet
            ? (lit ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.42)')
            : (lit ? '#fff' : 'rgba(255,255,255,0.58)'),
          transition: 'color 0.2s ease', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {label}
        </div>
        {sub && (
          <div style={{ fontFamily: FONT, fontSize: 9.5, fontWeight: 500, color: 'rgba(255,255,255,0.4)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {sub}
          </div>
        )}
      </div>
      {pinned && (
        <span style={{
          width: 7, height: 7, borderRadius: '50%', background: '#fff', flexShrink: 0,
          boxShadow: '0 0 0 2.5px rgba(255,255,255,0.16)',
        }} />
      )}
    </div>
  );
}

function CollectionCard({ item, tone, focused, pinned, animDelay, onClick }: {
  item: CenterItem; tone: string;
  focused: boolean; pinned: boolean; animDelay: number;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative', height: CARD_H, boxSizing: 'border-box',
        borderRadius: RADIUS.card, overflow: 'hidden', cursor: 'pointer',
        background: '#0b0b12',
        animation: `hh-item-in 0.36s ${animDelay.toFixed(2)}s both`,
        zIndex: focused ? 1 : 0,
        boxShadow: focused
          ? '0 0 0 1.5px rgba(255,255,255,0.75), 0 0 36px rgba(255,255,255,0.12), inset 0 1px 0 rgba(255,255,255,0.16), 0 26px 60px rgba(0,0,0,0.62)'
          : 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1px rgba(255,255,255,0.03), 0 6px 18px rgba(0,0,0,0.28)',
        transform: `scale(${focused ? 1.05 : 1})`,
        transition: 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.3s ease',
      }}
    >
      {item.image && (
        <img src={item.image} alt="" style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
          opacity: focused ? 0.92 : 0.6,
          filter: 'brightness(0.62) saturate(0.92)',
          transform: `scale(${focused ? 1.07 : 1})`,
          transition: 'opacity 0.35s ease, transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)',
        }} />
      )}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(120% 90% at 18% 0%, ${tone}10, transparent 55%),
          linear-gradient(180deg, rgba(9,9,15,0.24) 0%, rgba(9,9,15,0.85) 100%)`,
      }} />

      {pinned && (
        <div style={{
          position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: '50%',
          background: '#fff', boxShadow: '0 0 0 3px rgba(255,255,255,0.16), 0 2px 6px rgba(0,0,0,0.4)',
        }} />
      )}

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '11px 13px', boxSizing: 'border-box' }}>
        <div style={{
          fontFamily: FONT, fontSize: 13.5, fontWeight: 800, letterSpacing: '-0.015em',
          color: focused ? '#fff' : 'rgba(255,255,255,0.94)', transition: 'color 0.25s ease',
          textShadow: '0 1px 5px rgba(0,0,0,0.55)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {item.title}
        </div>
        {item.desc && (
          <div style={{ fontFamily: FONT, fontSize: 10.5, fontWeight: 500, color: focused ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.5)', transition: 'color 0.25s ease', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
            {item.desc}
          </div>
        )}
      </div>
    </div>
  );
}

function ThreadRow({ title, sub, icon, tint, focused, animDelay, onClick }: {
  title: string; sub?: string; icon?: string; tint?: string;
  focused: boolean; animDelay: number;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 13, boxSizing: 'border-box',
        padding: '14px 17px', borderRadius: RADIUS.card, cursor: 'pointer',
        background: focused
          ? 'linear-gradient(180deg, rgba(255,255,255,0.085) 0%, rgba(255,255,255,0.045) 100%)'
          : 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.018) 100%)',
        animation: `hh-item-in 0.36s ${animDelay.toFixed(2)}s both`,
        ...chrome(focused, 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1px rgba(255,255,255,0.03)', 1.015),
      }}
    >
      {icon && <Icon name={icon} tint={focused ? (tint ?? '#fff') : 'rgba(255,255,255,0.4)'} size={18} />}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 700, color: focused ? '#fff' : 'rgba(255,255,255,0.85)', transition: 'color 0.2s ease', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {title}
        </div>
        {sub && (
          <div style={{ fontFamily: FONT, fontSize: 10.5, fontWeight: 500, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

function FooterLink({ text, focused, onClick }: { text: string; focused: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '11px 18px', borderRadius: 999, cursor: 'pointer', width: 'fit-content',
        background: focused ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
        animation: 'hh-item-in 0.36s 0.2s both',
        ...chrome(focused, 'inset 0 0 0 1px rgba(255,255,255,0.06)', 1.03),
      }}
    >
      <span style={{ fontFamily: FONT, fontSize: 12.5, fontWeight: 700, color: focused ? '#fff' : 'rgba(255,255,255,0.65)', transition: 'color 0.2s ease' }}>
        {text}
      </span>
    </div>
  );
}

// ─── Local keyframes — the unfold ────────────────────────────────────────────

const EF_KF = `
@keyframes ef-nav-grow {
  from { width: 62px; max-height: 240px; opacity: 0.85; }
  to   { width: ${NAV_W}px; max-height: 940px; opacity: 1; }
}
@keyframes ef-label-in {
  from { opacity: 0; transform: translateX(-8px); }
  to   { opacity: 1; transform: translateX(0); }
}
`;
