/**
 * ExploreFirstPanel — Option 5: exploration-first Agent Hub.
 *
 * Concept: Current Context → Agent → Explore — presented as L0 UNFOLDING into
 * Explore, never as a page switch. This pass refines navigation flow,
 * hierarchy and visual utilization; the concept itself is unchanged.
 *
 * ONE navigation system, two states (see ExploreNav):
 *   collapsed — the three-icon rail on L0: context (compass) · mic · settings
 *   expanded  — the same icons at the same anchor, grown into the full nav,
 *               now with clearer grouping (CONTINUE → Ask Glance → AGENTS →
 *               YOUR SPACE → Settings) via generous spacing and quiet group
 *               labels rather than a denser stack.
 *
 * Selecting an agent always opens with that agent already selected — the
 * agent matching the L0 card the user pressed ← from (see
 * agentIdForCategory). The center column is Explore, and only Explore: no
 * Capabilities or Saved sub-sections. Explore itself is six-to-twelve rich,
 * intelligent prompts (not generic categories), grouped into three stacked
 * rows. One row is fully in focus at a time; the next peeks ~25% from below
 * (magazine-row style) so there's always a visible reason to keep going.
 * Down from the last row of the last section continues straight into the
 * next agent's Explore — up from the first row does the same in reverse —
 * so browsing never dead-ends. AI Gallery / Wishlist / Recent / Settings
 * keep their original single-section layout.
 *
 * The pinned dock stays fixed at the extreme right in every state.
 * Visual language: inherited from Option 4 (HybridHubPanel) — same icons,
 * focus chrome, glass, gradients, typography, adaptive cards.
 */

import { useState, useEffect, useRef } from 'react';
import {
  FONT, RADIUS, chrome, Icon, PinSquare, KEYFRAMES, HOLD_MS,
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

// ─── Explore — recognizable prompt cards, grouped into sections ────────────
// Each card has a short, scannable title (the primary visual element) and a
// smaller supporting prompt beneath it — pressing OK fires the prompt at Ask
// Glance, the same way tapping a suggestion starts a chat. Every agent is
// currently a single unlabeled section (their 3×3 grid, introduced by the
// page heading), shown in full with no cropping — but an agent can carry
// additional labeled sections that peek from below and scroll into view
// (see ExploreSection.label / AgentExploreColumn) if that's ever needed.

type CenterItem = { id: string; title: string; desc?: string; image?: string };
type ExploreSection = { label?: string; items: CenterItem[] };

const EXPLORE_SECTIONS: Record<string, ExploreSection[]> = {
  travel: [{ items: [
    { id: 'weekend-escapes',   title: 'Weekend Trip',        desc: 'Suggest me a weekend trip',        image: '/images/warm-start/coorg.jpg' },
    { id: 'hidden-beaches',    title: 'Hidden Beaches',      desc: 'Find me hidden beaches',            image: '/images/warm-start/om-beach.webp' },
    { id: 'road-trips',        title: 'Road Trip',           desc: 'Plan me a road trip',                image: '/images/feed/feed_29-travel-goa-coastal-road.jpg' },
    { id: 'wellness-retreats', title: 'Wellness Retreat',    desc: 'Suggest me a wellness retreat',     image: '/images/feed/feed_32-wellness-sunrise-yoga-lake.jpg' },
    { id: 'international',    title: 'International Trip',  desc: 'Suggest me an international trip',  image: '/images/warm-start/amalfi-coast.jpg' },
    { id: 'food-trails',      title: 'Food Trails',          desc: 'Find me food trails nearby',        image: '/images/feed/feed_47-food-monsoon-chai-stall.jpg' },
    { id: 'adventure',        title: 'Adventure Trip',       desc: 'Plan me an adventure trip',          image: '/images/feed/feed_40-travel-wildlife-dawn-grassland.jpg' },
    { id: 'luxury',           title: 'Luxury Getaway',       desc: 'Suggest me a luxury getaway',        image: '/images/feed/feed_15-luxury-private-train.jpg' },
    { id: 'budget',           title: 'Budget Trip',          desc: 'Find me a budget trip',              image: '/images/feed/feed_22-travel-seoul-cafe-street.jpg' },
  ] }],
  recipes: [{ items: [
    { id: 'dinner-tonight',  title: 'Dinner Tonight',    desc: 'Suggest something comforting for tonight', image: '/images/feed/eatly-dawn.jpg' },
    { id: 'quick-meals',     title: 'Quick Meal',        desc: 'Find a meal ready in under 20 minutes',     image: '/images/feed/feed_42-food-japanese-ramen-counter.jpg' },
    { id: 'one-pot',         title: 'One-Pot Recipe',    desc: 'Cook with minimal preparation and cleanup', image: '/images/feed/feed_09-home-kitchen-morning.jpg' },
    { id: 'healthy-recipes', title: 'Healthy Everyday',  desc: 'Suggest a lighter, balanced recipe',        image: '/images/cold-start/sunnys-lavelle-road.jpg' },
    { id: 'high-protein',    title: 'High Protein',      desc: 'Build a protein-rich meal',                 image: '/images/feed/feed_59-food-healthy-bowl-kitchen.jpg' },
    { id: 'vegetarian',      title: 'Vegetarian',        desc: 'Find a satisfying meat-free recipe',        image: '/images/feed/feed_64-hobbies-kitchen-garden.jpg' },
    { id: 'indian',          title: 'Indian Favourites', desc: 'Explore regional Indian recipes',           image: '/images/setup/setup_q3_food.jpg' },
    { id: 'italian',         title: 'Italian Night',     desc: 'Suggest a classic Italian meal',            image: '/images/l1/photo_atmosphere6.png' },
    { id: 'street-food',     title: 'Street Food',       desc: 'Discover popular street-food recipes',      image: '/images/cold-start/mysore-bonda.webp' },
  ] }],
  shopping: [{ items: [
    { id: 'price-drops',     title: 'Price Drops',    desc: 'Show me price drops',      image: '/images/feed/feed_46-fashion-luxury-flatlay.jpg' },
    { id: 'deals-for-you',   title: 'Deals For You',  desc: 'Show me deals for me',      image: '/images/feed/feed_60-entertainment-vinyl-music-room.jpg' },
    { id: 'gifts',           title: 'Find a Gift',    desc: 'Help me find a gift',       image: '/images/feed/feed_36-beauty-vanity-glow.jpg' },
    { id: 'electronics',     title: 'Electronics',    desc: 'Show me new electronics',   image: '/images/feed/feed_49-career-creator-desk-night.jpg' },
    { id: 'kitchen',         title: 'Kitchen Picks',  desc: 'Show me kitchen picks',     image: '/images/feed/feed_09-home-kitchen-morning.jpg' },
    { id: 'home-essentials', title: 'Home Essentials', desc: 'Show me home essentials',  image: '/images/feed/feed_24-home-cozy-monsoon-living-room.jpg' },
    { id: 'beauty',          title: 'Beauty Picks',   desc: 'Show me beauty picks',      image: '/images/feed/feed_50-beauty-barbershop-grooming.jpg' },
    { id: 'fashion',         title: 'Fashion Picks',  desc: 'Show me fashion picks',     image: '/images/feed/feed_31-fashion-streetwear-editorial.jpg' },
    { id: 'audio',           title: 'Audio Gear',     desc: 'Show me audio gear',        image: '/images/feed/feed_60-entertainment-vinyl-music-room.jpg' },
  ] }],
  entertainment: [{ items: [
    { id: 'live-now',          title: 'Live Now',          desc: "Show me what's live now",       image: '/images/feed/feed_25-sports-cricket-stadium-floodlights.jpg' },
    { id: 'new-releases',      title: 'New Releases',      desc: 'Show me new releases',           image: '/images/feed/feed_45-sports-basketball-sunset-court.jpg' },
    { id: 'music-nights',      title: 'Music Night',       desc: 'Play me music for tonight',      image: '/images/warm-start/vinyl-ritual.webp' },
    { id: 'city-nights',       title: 'Night Out',         desc: 'Suggest me a night out',         image: '/images/feed/feed_58-travel-mumbai-marine-drive-night.jpg' },
    { id: 'wind-down',         title: 'Wind Down',         desc: 'Play something to wind down',    image: '/images/warm-start/sleep-wind-down.jpg' },
    { id: 'classical-arts',    title: 'Classical Arts',    desc: 'Show me classical arts',          image: '/images/feed/feed_13-entertainment-classical-dance.jpg' },
    { id: 'documentaries',     title: 'Documentary',       desc: 'Suggest me a documentary',        image: '/images/feed/feed_40-travel-wildlife-dawn-grassland.jpg' },
    { id: 'weekend-watchlist', title: 'Weekend Watchlist', desc: 'Build me a weekend watchlist',    image: '/images/feed/feed_60-entertainment-vinyl-music-room.jpg' },
  ] }],
  fashion: [{ items: [
    { id: 'weekend-looks', title: 'Weekend Look',   desc: 'Style me a weekend look',       image: '/images/feed/feed_31-fashion-streetwear-editorial.jpg' },
    { id: 'office-wear',   title: 'Office Wear',    desc: 'Style me for the office',       image: '/images/feed/feed_46-fashion-luxury-flatlay.jpg' },
    { id: 'minimal',       title: 'Minimal Outfit', desc: 'Style me a minimal outfit',     image: '/images/feed/feed_28-home-japandi-minimal-living.jpg' },
    { id: 'rain-ready',    title: 'Rain Ready',     desc: 'Style me for the rain',         image: '/images/feed/feed_24-home-cozy-monsoon-living-room.jpg' },
    { id: 'occasion-wear', title: 'Occasion Wear',  desc: 'Style me for an occasion',      image: '/images/feed/feed_18-beauty-haldi-ritual.jpg' },
    { id: 'travel-looks',  title: 'Travel Looks',   desc: 'Style me for travel',           image: '/images/feed/feed_29-travel-goa-coastal-road.jpg' },
    { id: 'accessories',   title: 'Accessories',    desc: 'Suggest me accessories',        image: '/images/feed/feed_46-fashion-luxury-flatlay.jpg' },
    { id: 'footwear',      title: 'Footwear',       desc: 'Suggest me footwear',           image: '/images/feed/feed_31-fashion-streetwear-editorial.jpg' },
    { id: 'grooming',      title: 'Grooming',       desc: 'Suggest me a grooming routine', image: '/images/feed/feed_50-beauty-barbershop-grooming.jpg' },
  ] }],
  'home-decor': [{ items: [
    { id: 'cozy-corners',    title: 'Cozy Corner',    desc: 'Design me a cozy corner',    image: '/images/feed/feed_24-home-cozy-monsoon-living-room.jpg' },
    { id: 'japandi',         title: 'Japandi Look',   desc: 'Suggest me a Japandi look',  image: '/images/feed/feed_28-home-japandi-minimal-living.jpg' },
    { id: 'wall-art',        title: 'Wall Art',       desc: 'Suggest me wall art',        image: '/images/feed/feed_63-culture-holi-color-abstract.jpg' },
    { id: 'kitchen-refresh', title: 'Kitchen Refresh', desc: 'Refresh my kitchen',        image: '/images/feed/feed_09-home-kitchen-morning.jpg' },
    { id: 'balcony-gardens', title: 'Balcony Garden', desc: 'Design my balcony garden',   image: '/images/feed/feed_44-home-modern-balcony-garden.jpg' },
    { id: 'bedroom-refresh', title: 'Bedroom Refresh', desc: 'Refresh my bedroom',        image: '/images/feed/feed_24-home-cozy-monsoon-living-room.jpg' },
    { id: 'warm-lighting',   title: 'Warm Lighting',  desc: 'Suggest me warm lighting',   image: '/images/warm-start/gehra-hua.jpg' },
    { id: 'everyday-luxury', title: 'Luxury Touches', desc: 'Suggest me luxury touches',  image: '/images/feed/feed_16-luxury-spa-ritual.jpg' },
    { id: 'festive-decor',   title: 'Festive Decor',  desc: 'Suggest me festive decor',   image: '/images/feed/feed_33-culture-wedding-mandap-decor.jpg' },
  ] }],
};

/** The question under each agent's "Explore {Agent}" heading. */
const EXPLORE_SUBTITLE: Record<string, string> = {
  travel: 'Where would you like to go?',
  recipes: 'What would you like to cook?',
  shopping: 'What are you looking for?',
  entertainment: 'What would you like to watch?',
  fashion: 'What would you like to wear?',
  'home-decor': 'What would you like to style?',
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
  | { kind: 'agent'; label: string; tone: string; heading: string; subheading: string; sections: ExploreSection[] }
  | { kind: 'visual'; label: string; tone: string; items: CenterItem[]; footer?: string }
  | { kind: 'rows'; label: string; items: { id: string; title: string; sub?: string; icon?: string; tint?: string }[]; footer: string };

function contentFor(selectedNav: string): CenterContent {
  const agent = PRIMARY.find(a => a.id === selectedNav);
  if (agent) {
    return {
      kind: 'agent', label: `Explore · ${agent.label}`, tone: agent.tone,
      heading: `Explore ${agent.label}`,
      subheading: EXPLORE_SUBTITLE[agent.id] ?? 'What would you like to explore?',
      sections: EXPLORE_SECTIONS[agent.id] ?? [],
    };
  }
  switch (selectedNav) {
    case 'ai-gallery': return { kind: 'visual', label: 'AI Gallery', tone: '#B9A6F0', items: GALLERY_ITEMS, footer: 'View Gallery →' };
    case 'wishlist':   return { kind: 'visual', label: 'Wishlist',   tone: '#F79BC3', items: WISHLIST_ITEMS, footer: 'View Wishlist →' };
    case 'recent':     return { kind: 'rows', label: 'Recent', items: RECENT_THREADS, footer: 'Continue →' };
    case 'settings':   return { kind: 'rows', label: 'Settings', items: SETTINGS_ROWS, footer: 'Open Settings →' };
    default:           return contentFor('travel');
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

// ─── Geometry ─────────────────────────────────────────────────────────────────
// The nav anchors at the collapsed rail's spot (left 20, vertically centered);
// the dock anchors to the screen's right edge (right: 24, PIN_SQ wide — see
// HybridHubPanel). Explore is a fixed-size 3×2 grid — it does not stretch to
// fill the gap to the dock — so the gutter below is real, not incidental.
const NAV_X = 20;
const NAV_W = 292;
const CONTENT_X = NAV_X + NAV_W + 76;
const PIN_SQ = 112;
const DOCK_LEFT_EDGE = 1920 - 24 - PIN_SQ; // 1784 — right:24 dock, PIN_SQ wide

// Explore geometry — a fixed 3-column grid, not a stretchy one. Small,
// compact prompt cards. A section with no label is shown in full, always
// (most agents). A section with a label — currently just Recipes' second
// section — peeks from below and scrolls fully into view on request.
const EXPLORE_COLS = 3;
const CARD_W = 300;
const CARD_H = 150;
const GRID_GAP = 24;
const GRID_W = EXPLORE_COLS * CARD_W + (EXPLORE_COLS - 1) * GRID_GAP; // 948
const PANEL_W = CONTENT_X + GRID_W + 40; // just wide enough to hold the grid
// DOCK_LEFT_EDGE (1784) − (CONTENT_X + GRID_W) leaves a wide, comfortable
// gutter before the dock — smaller cards, same fixed CONTENT_X.

const THREAD_ROW_H = 58;
const ROW_GAP = GRID_GAP;              // same rhythm on both axes — one plain grid
const SECTION_GAP = 44;                // breathing room between sections
const SECTION_LABEL_BLOCK = 48;        // a labeled section's own heading + margin
const PEEK_CARD_H = 46;                // ~30% of a card row peeking above/below
// The scroll/peek container clips with overflow:hidden — this pads its inside
// edge so a focused card's scale(1.04) + glow never gets cut off against the
// clip boundary on any of the 4 sides of the grid.
const FOCUS_PAD = 18;

// Navigation zones (integer slots):
const CTX = -2;            // CONTINUE — the current L0 context entry
const ASK = -1;            // Ask Glance (mic)
const A_BASE = 0;          // 0..5   agents
const S_BASE = 10;         // 10..12 AI Gallery · Wishlist · Recent
const SETTINGS_SLOT = 15;  // settings — bottom, isolated
const G_BASE = 20;         // 20..∞  Explore grid (agent, 3×2 visible) or single content (other kinds)
const P_BASE = 100;        // 100..103 pinned dock

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
  const isAgent = content.kind === 'agent';
  // A flat view of Explore's 3×4 sections — used for pinning and "Opening X…" copy.
  const flatExploreItems: CenterItem[] = isAgent ? content.sections.flatMap(s => s.items) : [];
  const exploreLen = isAgent ? flatExploreItems.length : content.kind === 'visual' ? content.items.length : content.kind === 'rows' ? content.items.length : 0;
  const cols = isAgent ? EXPLORE_COLS : (content.kind === 'visual' ? 3 : 1);
  const footerSlot = !isAgent && content.footer ? G_BASE + exploreLen : -99;
  const tone = isAgent ? content.tone : content.kind === 'visual' ? content.tone : '#9AA3B2';

  // Browse-as-you-move: focusing a destination row makes it own the center
  // panel. CTX and ASK are actions — they never change the selection, so the
  // matching agent stays visibly selected while they're focused.
  useEffect(() => {
    if (slot >= A_BASE && slot < A_BASE + PRIMARY.length) setSelectedNav(PRIMARY[slot - A_BASE].id);
    else if (slot >= S_BASE && slot < S_BASE + YOUR_SPACE_ROWS.length) setSelectedNav(YOUR_SPACE_ROWS[slot - S_BASE].id);
    else if (slot === SETTINGS_SLOT) setSelectedNav('settings');
  }, [slot]);

  // Clamp center focus when the selection (and section length) changes.
  useEffect(() => {
    const max = footerSlot > 0 ? exploreLen : exploreLen - 1;
    if (slot >= G_BASE && slot < P_BASE && slot - G_BASE > max) setSlot(G_BASE + Math.max(0, max));
  }, [exploreLen, footerSlot, slot]);

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
    tone,
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
    const zones = () => {
      const inCtx = slot === CTX;
      const inAsk = slot === ASK;
      const inAgents = slot >= A_BASE && slot < A_BASE + PRIMARY.length;
      const inSpace = slot >= S_BASE && slot < S_BASE + YOUR_SPACE_ROWS.length;
      const inSettings = slot === SETTINGS_SLOT;
      const inGrid = slot >= G_BASE && slot < P_BASE; // Explore (agent, 3×4) or single content
      const inPins = slot >= P_BASE;
      return { inCtx, inAsk, inAgents, inSpace, inSettings, inGrid, inPins };
    };

    // Explore is one flat grid whether it's an agent's 3×4 sections or a
    // single-section surface (Gallery/Wishlist/Recent/Settings) — the only
    // thing that differs is what happens at the top/bottom edge: agents
    // continue straight into the next/previous agent's Explore.
    const down = (e: KeyboardEvent) => {
      const k = e.key;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter',' ','Escape','Backspace'].includes(k)) e.preventDefault();
      if (k === 'Escape' || k === 'Backspace') { onBack(); return; }

      const z = zones();
      const inNav = z.inCtx || z.inAsk || z.inAgents || z.inSpace || z.inSettings;

      const gIdx = z.inGrid ? slot - G_BASE : 0;
      const onFooter = z.inGrid && slot === footerSlot;
      const gRow = Math.floor(gIdx / cols);
      const gCol = gIdx % cols;
      const lastRow = Math.floor((exploreLen - 1) / cols);

      if (k === 'Enter' || k === ' ') {
        if (e.repeat) return;
        holdRef.current.fired = false;
        holdRef.current.t = setTimeout(() => {
          holdRef.current.fired = true; holdRef.current.t = null;
          if (z.inGrid && !onFooter) {
            const item = isAgent ? flatExploreItems[gIdx] : content.kind === 'visual' ? content.items[gIdx] : undefined;
            if (item) { pinWithConfirm(itemPinMeta(item)); return; }
          }
          if (z.inAgents) { pinWithConfirm(PRIMARY[slot - A_BASE] as PinMeta); return; }
          if (z.inPins) {
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
        if (z.inGrid) { if (!onFooter && gCol > 0) setSlot(s => s - 1); else setSlot(navSlotForSelected()); return; }
        if (z.inPins) {
          // Mirror of grid→pins on Right: land on the last card of the row
          // this pin connects to, not always the first card of the grid.
          const targetRow = Math.min(slot - P_BASE, lastRow);
          const targetIdx = Math.min(targetRow * cols + cols - 1, exploreLen - 1);
          setSlot(G_BASE + targetIdx);
          return;
        }
        return;
      }
      if (k === 'ArrowRight') {
        if (inNav) { setSlot(G_BASE); return; }
        if (z.inGrid) {
          if (!onFooter && gCol < cols - 1 && gIdx + 1 < exploreLen) setSlot(s => s + 1);
          else if (pinCount > 0) setSlot(P_BASE + Math.min(onFooter ? pinCount - 1 : gRow, pinCount - 1));
          return;
        }
        return;
      }
      if (k === 'ArrowDown') {
        if (z.inCtx) { setSlot(ASK); return; }
        if (z.inAsk) { setSlot(A_BASE); return; }
        if (z.inAgents) { slot < A_BASE + PRIMARY.length - 1 ? setSlot(s => s + 1) : setSlot(S_BASE); return; }
        if (z.inSpace) { slot < S_BASE + YOUR_SPACE_ROWS.length - 1 ? setSlot(s => s + 1) : setSlot(SETTINGS_SLOT); return; }
        if (z.inGrid) {
          if (onFooter) return;
          if (gIdx + cols < exploreLen) { setSlot(s => s + cols); return; }
          if (gRow < lastRow) { setSlot(G_BASE + exploreLen - 1); return; }
          // Last row: agents keep going — straight into the next agent's Explore.
          if (isAgent) {
            const i = PRIMARY.findIndex(a => a.id === selectedNav);
            setSelectedNav(PRIMARY[(i + 1) % PRIMARY.length].id);
            setSlot(G_BASE + gCol);
            return;
          }
          if (footerSlot > 0) setSlot(footerSlot);
          return;
        }
        if (z.inPins) { if (slot - P_BASE < pinCount - 1) setSlot(s => s + 1); return; }
        return;
      }
      if (k === 'ArrowUp') {
        if (z.inAsk) { if (context) setSlot(CTX); return; }
        if (z.inAgents) { slot > A_BASE ? setSlot(s => s - 1) : setSlot(ASK); return; }
        if (z.inSpace) { slot > S_BASE ? setSlot(s => s - 1) : setSlot(A_BASE + PRIMARY.length - 1); return; }
        if (z.inSettings) { setSlot(S_BASE + YOUR_SPACE_ROWS.length - 1); return; }
        if (z.inGrid) {
          if (onFooter) { setSlot(G_BASE + exploreLen - 1); return; }
          if (gRow > 0) { setSlot(s => s - cols); return; }
          // First row: agents keep going — back into the previous agent's Explore.
          if (isAgent) {
            const i = PRIMARY.findIndex(a => a.id === selectedNav);
            const prev = PRIMARY[(i - 1 + PRIMARY.length) % PRIMARY.length];
            const prevLen = (EXPLORE_SECTIONS[prev.id] ?? []).reduce((n, s) => n + s.items.length, 0);
            const prevLastRow = Math.floor((prevLen - 1) / cols);
            setSelectedNav(prev.id);
            setSlot(G_BASE + prevLastRow * cols + gCol);
          }
          return;
        }
        if (z.inPins) { if (slot > P_BASE) setSlot(s => s - 1); return; }
        return;
      }
    };

    const up = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (holdRef.current.t) { clearTimeout(holdRef.current.t); holdRef.current.t = null; }
      if (holdRef.current.fired) { holdRef.current.fired = false; return; }
      const z = zones();
      if (z.inCtx) { onToast?.(`Continuing ${context?.journey ?? 'your journey'}…`); return; }
      if (z.inAsk) { onToast?.('Opening Ask Glance…'); return; }
      if (z.inAgents || z.inSpace || z.inSettings) { setSlot(G_BASE); return; }
      if (z.inGrid) {
        if (slot === footerSlot && !isAgent && 'footer' in content && content.footer) { onToast?.(`${content.footer.replace(' →', '')}…`); return; }
        const idx = slot - G_BASE;
        if (isAgent) {
          const it = flatExploreItems[idx];
          onToast?.(`Asking Glance: "${it?.desc ?? it?.title}"…`);
          return;
        }
        onToast?.(`Opening ${content.items[idx]?.title}…`);
        return;
      }
      if (z.inPins) { onToast?.(`Opening ${pinnableById(pinnedIds[slot - P_BASE])?.label}…`); return; }
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      if (holdRef.current.t) clearTimeout(holdRef.current.t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot, selectedNav, content, isAgent, flatExploreItems, exploreLen, cols, footerSlot, pinCount, pinnedIds, context, onBack, onToast]);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'auto', animation: 'hh-in 0.25s ease forwards' }}>
      {/* Soft vignette — quiet depth cue across the whole frame, not a darker
          overlay: edges recede a touch so the Explore layer reads as nearer. */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(120% 100% at 50% 50%, transparent 55%, rgba(4,4,10,0.28) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Left gradient — soft and gradual: L0 stays recognizable behind */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: PANEL_W + 320,
        background: 'linear-gradient(to right, rgba(5,5,12,0.86) 0%, rgba(5,5,12,0.7) 45%, rgba(5,5,12,0.3) 75%, transparent 100%)',
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
        padding: `56px 48px 32px ${CONTENT_X}px`,
        animation: 'hh-in 0.35s 0.1s both',
      }}>
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/glance-logo.png" alt="Glance" style={{ height: 22, opacity: 0.88 }} />
          <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
            Explore
          </span>
        </div>

        <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center' }}>
          {isAgent ? (
            <AgentExploreColumn
              key={selectedNav}
              content={content as Extract<CenterContent, { kind: 'agent' }>}
              slot={slot}
              pinnedIds={pinnedIds}
              onFocusSlot={setSlot}
            />
          ) : (
            <div key={selectedNav} style={{ width: '100%', animation: 'hh-in 0.3s ease both' }}>
              <SubLabel text={content.label} />
              {content.kind === 'visual' ? (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(3, ${CARD_W}px)`, gap: GRID_GAP, width: GRID_W }}>
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
              {'footer' in content && content.footer && (
                <FooterLink
                  text={content.footer}
                  focused={slot === footerSlot}
                  onClick={() => setSlot(footerSlot)}
                />
              )}
            </div>
          )}
        </div>

        <div style={{ flexShrink: 0, display: 'flex', gap: 12, paddingTop: 16 }}>
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
        showOnboarding
        onSelect={i => setSlot(P_BASE + i)}
      />

      <style>{KEYFRAMES + EF_KF}</style>
    </div>
  );
}

// ─── AgentExploreColumn — Explore, in three stacked magazine rows ───────────
// Only Explore lives here — no Capabilities, no Saved. A fixed-height
// viewport shows the focused row's section fully, plus roughly a quarter of
// the next section peeking from below, so there's always a visible reason to
// keep going. Reaching the last row and pressing down continues straight
// into the next agent (handled one level up, in the keydown effect).

/** Stacks sections top to bottom and returns each one's pixel [start, end). */
function layoutSections(sections: ExploreSection[]) {
  let y = 0;
  const layout = sections.map((s, i) => {
    if (i > 0) y += SECTION_GAP;
    const labelH = s.label ? SECTION_LABEL_BLOCK : 0;
    const rows = Math.ceil(s.items.length / EXPLORE_COLS);
    const start = y;
    y += labelH + rows * CARD_H + Math.max(0, rows - 1) * ROW_GAP;
    return { start, end: y, labelH, rows };
  });
  return { layout, totalH: y };
}

function AgentExploreColumn({ content, slot, pinnedIds, onFocusSlot }: {
  content: Extract<CenterContent, { kind: 'agent' }>;
  slot: number;
  pinnedIds: string[];
  onFocusSlot: (n: number) => void;
}) {
  const { sections, tone, label, heading, subheading } = content;
  const { layout } = layoutSections(sections);

  // Which section is the focused row in? A single unlabeled section (every
  // agent today) always shows in full, no peeking. If an agent ever carries
  // a second labeled section, it peeks from below and scrolls fully into
  // view once focus reaches it, with the primary grid peeking back above.
  const focusedRow = Math.floor(Math.max(0, slot - G_BASE) / EXPLORE_COLS);
  let cum = 0, si = 0;
  for (let i = 0; i < sections.length; i++) {
    if (focusedRow < cum + layout[i].rows) { si = i; break; }
    cum += layout[i].rows;
  }

  const hasPrev = si > 0;
  const hasNext = si < sections.length - 1;
  const windowStart = hasPrev ? layout[si - 1].end - PEEK_CARD_H : 0;
  const windowEnd = hasNext ? layout[si].end + SECTION_GAP + layout[si + 1].labelH + PEEK_CARD_H : layout[si].end;
  const containerH = windowEnd - windowStart;
  const scrollY = windowStart;

  let flatIdx = 0;
  return (
    <div style={{ width: '100%', animation: 'hh-in 0.3s ease both' }}>
      <ExploreHeading title={heading} subtitle={subheading} />
      <div style={{
        width: GRID_W + FOCUS_PAD * 2, height: containerH + FOCUS_PAD * 2,
        margin: -FOCUS_PAD, padding: FOCUS_PAD, boxSizing: 'border-box',
        position: 'relative', overflow: 'hidden',
        transition: 'height 0.45s cubic-bezier(0.25, 0.8, 0.25, 1)',
      }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 0,
          transform: `translateY(-${scrollY}px)`,
          transition: 'transform 0.45s cubic-bezier(0.25, 0.8, 0.25, 1)',
        }}>
          {sections.map((section, sIdx) => {
            const startIdx = flatIdx;
            flatIdx += section.items.length;
            return (
              <div key={section.label ?? `section-${sIdx}`} style={{ marginBottom: sIdx < sections.length - 1 ? SECTION_GAP : 0 }}>
                {section.label && <SubLabel text={section.label} />}
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${EXPLORE_COLS}, ${CARD_W}px)`, gridAutoRows: CARD_H, gap: ROW_GAP }}>
                  {section.items.map((c, i) => {
                    const gi = startIdx + i;
                    return (
                      <CollectionCard
                        key={c.id}
                        item={c}
                        tone={tone}
                        focused={slot === G_BASE + gi}
                        pinned={pinnedIds.includes(`col-${label}-${c.id}`)}
                        animDelay={sIdx === si ? (i % EXPLORE_COLS) * 0.02 + 0.1 : 0}
                        onClick={() => onFocusSlot(G_BASE + gi)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {hasPrev && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 40, pointerEvents: 'none',
            background: 'linear-gradient(to bottom, rgba(5,5,12,0.45), transparent)',
          }} />
        )}
        {hasNext && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 56, pointerEvents: 'none',
            background: 'linear-gradient(to top, rgba(5,5,12,0.55) 0%, transparent 100%)',
          }} />
        )}
      </div>
    </div>
  );
}

/** The anchoring page heading — replaces the old small "EXPLORE · X" eyebrow. */
function ExploreHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontFamily: FONT, fontSize: 34, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontFamily: FONT, fontSize: 17, fontWeight: 500, color: 'rgba(255,255,255,0.55)' }}>
        {subtitle}
      </div>
    </div>
  );
}

// ─── ExploreNav — ONE navigation system, two states ─────────────────────────
// collapsed: the three-icon rail on L0 (context · mic · settings)
// expanded:  the same icons, same anchor, grown into the labeled nav — with
// generous spacing and quiet group labels (AGENTS / YOUR SPACE) instead of a
// denser stack, so grouping reads at a glance.

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
      padding: '24px 18px', borderRadius: 30, overflow: 'hidden',
      background: 'rgba(14,14,22,0.72)',
      backdropFilter: 'blur(36px)', WebkitBackdropFilter: 'blur(36px)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 0 0 1px rgba(255,255,255,0.07), 0 12px 36px rgba(0,0,0,0.4)',
      animation: 'ef-nav-grow 0.42s cubic-bezier(0.25, 0.8, 0.25, 1) both',
    }}>
      {/* 1 · CONTINUE — the current L0 context, the reason ← was pressed */}
      {context && (
        <>
          <ContinueEntry context={context} focused={slot === CTX} onClick={() => setSlot?.(CTX)} />
          <Divider />
        </>
      )}

      {/* 2 · Ask Glance — the same mic as the collapsed rail */}
      <NavRow
        icon="mic" tint="#C9A6F5" label="Ask Glance" sub="Start a conversation"
        focused={slot === ASK}
        onClick={() => setSlot?.(ASK)}
      />

      <Divider />

      {/* 3 · Agents */}
      <NavGroupLabel text="Agents" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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

      <Divider />

      {/* 4 · Your Space */}
      <NavGroupLabel text="Your Space" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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

      <Divider />

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
// Floating adaptive surfaces, not a stacked menu: generous gaps, unfocused
// cards sit slightly recessed so the dock reads as ambient, not dominant.

export function PinnedDockRight({ pinnedIds, focusedIdx = null, showLabel = false, showOnboarding = false, onSelect }: {
  pinnedIds: string[];
  focusedIdx?: number | null;
  showLabel?: boolean;
  /** Only inside the expanded Explore nav — never on the collapsed L0 dock. */
  showOnboarding?: boolean;
  onSelect?: (idx: number) => void;
}) {
  return (
    <div style={{
      position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)',
      display: 'flex', flexDirection: 'column', gap: 28, zIndex: 57,
      animation: 'hh-in 0.4s ease both',
    }}>
      <div style={{
        position: 'absolute', top: -44, bottom: -44, left: -64, right: -24,
        background: 'linear-gradient(to left, rgba(5,5,12,0.5), rgba(5,5,12,0.22) 60%, transparent)',
        pointerEvents: 'none',
      }} />
      {showLabel && (
        <div style={{
          position: 'absolute', bottom: '100%', left: 2, marginBottom: 12,
          fontFamily: FONT, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.16em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap',
        }}>
          Pinned
        </div>
      )}
      {pinnedIds.slice(0, MAX_PINS).map((id, i) => {
        const m = pinnableById(id);
        if (!m) return null;
        const focused = focusedIdx === i;
        return (
          <div key={id} style={{
            position: 'relative',
            opacity: focusedIdx === null || focused ? 1 : 0.82,
            transition: 'opacity 0.25s ease',
          }}>
            <PinSquare meta={m} focused={focused} onClick={() => onSelect?.(i)} />
          </div>
        );
      })}
      {showOnboarding && pinnedIds.length < MAX_PINS && <PinOnboardingSlot />}
      <style>{KEYFRAMES}</style>
    </div>
  );
}

/**
 * Onboarding affordance, not a content slot — teaches pinning, then gets out
 * of the way. Sits below the real pins when there's room (< MAX_PINS filled);
 * purely visual, never part of keyboard focus/navigation.
 */
function PinOnboardingSlot() {
  return (
    <div style={{
      width: PIN_SQ, height: PIN_SQ, boxSizing: 'border-box', borderRadius: RADIUS.pin,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
      border: '1.5px dashed rgba(255,255,255,0.2)',
      background: 'rgba(255,255,255,0.03)',
      backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      opacity: 0.72,
      animation: 'hh-in 0.4s 0.1s both',
    }}>
      <span style={{ fontFamily: FONT, fontSize: 20, fontWeight: 300, color: 'rgba(255,255,255,0.4)', lineHeight: 1 }}>+</span>
      <span style={{
        fontFamily: FONT, fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.4)',
        textAlign: 'center', lineHeight: 1.3, padding: '0 10px',
      }}>
        Pin something here
      </span>
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
        padding: '12px 13px', borderRadius: 18, cursor: 'pointer',
        background: focused
          ? 'linear-gradient(180deg, rgba(255,255,255,0.11) 0%, rgba(255,255,255,0.05) 100%)'
          : 'rgba(255,255,255,0.04)',
        animation: 'ef-label-in 0.3s 0.08s both',
        ...chrome(focused, 'inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 0 1px rgba(255,255,255,0.05)', 1.02),
      }}
    >
      {context.image && (
        <img src={context.image} alt="" style={{
          width: 48, height: 48, borderRadius: 12, objectFit: 'cover', flexShrink: 0,
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

/** Quiet horizontal rule — separates nav groups without a heavy border. */
function Divider() {
  return <div style={{ height: 1, margin: '20px 4px', background: 'rgba(255,255,255,0.07)' }} />;
}

/** Tiny group label — "AGENTS" / "YOUR SPACE". Quieter than content section labels. */
function NavGroupLabel({ text }: { text: string }) {
  return (
    <div style={{
      fontFamily: FONT, fontSize: 8.5, fontWeight: 800, letterSpacing: '0.14em',
      textTransform: 'uppercase', color: 'rgba(255,255,255,0.26)', margin: '0 13px 8px',
    }}>
      {text}
    </div>
  );
}

/** Content section label — bigger sibling of NavGroupLabel, used in the center column. */
function SubLabel({ text }: { text: string }) {
  return (
    <div style={{
      height: 26, boxSizing: 'border-box',
      fontFamily: FONT, fontSize: 18, fontWeight: 800, letterSpacing: '0.08em',
      textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', margin: '0 2px 22px',
    }}>
      {text}
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
        padding: '10px 13px', borderRadius: 999, cursor: 'pointer', position: 'relative',
        background: focused
          ? 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
          : selected ? 'rgba(255,255,255,0.035)' : 'transparent',
        ...chrome(focused, 'none', 1.02),
      }}
    >
      <Icon name={icon} tint={lit && !quiet ? tint : 'rgba(255,255,255,0.45)'} size={19} />
      <div style={{ minWidth: 0, flex: 1, animation: `ef-label-in 0.3s ${animDelay.toFixed(2)}s both` }}>
        <div style={{
          fontFamily: FONT, fontSize: 15, fontWeight: lit ? 700 : 500,
          color: quiet
            ? (lit ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.42)')
            : (lit ? '#fff' : 'rgba(255,255,255,0.58)'),
          transition: 'color 0.2s ease', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {label}
        </div>
        {sub && (
          <div style={{ fontFamily: FONT, fontSize: 10.5, fontWeight: 500, color: 'rgba(255,255,255,0.4)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
          ? '0 0 0 1.5px rgba(255,255,255,0.85), 0 0 16px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.18), 0 14px 28px rgba(0,0,0,0.45)'
          : 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1px rgba(255,255,255,0.03), 0 6px 18px rgba(0,0,0,0.28)',
        transform: `scale(${focused ? 1.04 : 1})`,
        transition: 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.3s ease',
      }}
    >
      {item.image && (
        <img src={item.image} alt="" style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
          opacity: focused ? 0.98 : 0.82,
          filter: focused ? 'brightness(1) saturate(1.02)' : 'brightness(0.82) saturate(0.92)',
          transform: `scale(${focused ? 1.04 : 1})`,
          transition: 'opacity 0.35s ease, filter 0.35s ease, transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)',
        }} />
      )}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(120% 90% at 18% 0%, ${tone}08, transparent 55%),
          linear-gradient(180deg, transparent 45%, rgba(9,9,15,0.6) 100%)`,
      }} />

      {pinned && (
        <div style={{
          position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: '50%',
          background: '#fff', boxShadow: '0 0 0 3px rgba(255,255,255,0.16), 0 2px 6px rgba(0,0,0,0.4)',
        }} />
      )}

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '20px 22px', boxSizing: 'border-box' }}>
        <div style={{
          fontFamily: FONT, fontSize: 21, fontWeight: 800, letterSpacing: '-0.015em', lineHeight: 1.15,
          color: focused ? '#fff' : 'rgba(255,255,255,0.95)', transition: 'color 0.25s ease',
          textShadow: '0 1px 6px rgba(0,0,0,0.65)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {item.title}
        </div>
        {item.desc && (
          <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 500, color: focused ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.5)', transition: 'color 0.25s ease', marginTop: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
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
        height: THREAD_ROW_H, padding: '0 17px', borderRadius: RADIUS.card, cursor: 'pointer',
        background: focused
          ? 'linear-gradient(180deg, rgba(255,255,255,0.085) 0%, rgba(255,255,255,0.045) 100%)'
          : 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.018) 100%)',
        animation: animDelay > 0 ? `hh-item-in 0.36s ${animDelay.toFixed(2)}s both` : undefined,
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
  to   { width: ${NAV_W}px; max-height: 1080px; opacity: 1; }
}
@keyframes ef-label-in {
  from { opacity: 0; transform: translateX(-8px); }
  to   { opacity: 1; transform: translateX(0); }
}
`;
