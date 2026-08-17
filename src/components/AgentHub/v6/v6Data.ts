/**
 * v6Data — data model + geometry for V6 "Connected Hub".
 *
 * V6's product idea: L0 → Persistent Strip → Agent Hub as ONE spatial
 * composition. The strip is not a screen or a nav mode — it is the landing
 * focus and the spine between Ambient Home and the Agent Hub.
 *
 * Everything the hub renders is data-driven from this file so the demo
 * content can be swapped without touching layout or navigation code.
 */

// ─── Geometry — shared between V6Experience and the host app ─────────────────
// The stage is a fixed 1920×1080.
//
//   closed:  L0 full-bleed edge-to-edge; the strip OVERLAYS its left edge
//            behind a soft scrim (Ambient stays the whole experience).
//   open:    three separate spatial zones that never overlap — the strip is
//            a full-height spine BETWEEN hub and L0:
//            [───────── HUB 1400 ─────────][ STRIP 200 ][─ L0 320 ─]
//
// Open proportions: hub ~73% · strip ~10.4% · L0 ~16.7%.

export const V6_STAGE_W = 1920;
/** the strip's full-height zone — identical width closed and open */
export const V6_STRIP_ZONE_W = 200;
export const V6_HUB_W = 1400;
export const V6_STRIP_X_CLOSED = 0;
export const V6_STRIP_X_OPEN = V6_HUB_W;                                 // 1400..1600
/** where the (full-height) L0 surface starts when the hub is open */
export const V6_L0_OPEN_X = V6_HUB_W + V6_STRIP_ZONE_W;                  // 1600
/**
 * Closed, the L0 BACKGROUND stays full-bleed edge-to-edge — the Smart Tiles
 * panel floats over it. Only L0's left-anchored CONTENT (logo, tag, title,
 * content column) shifts right by this much; the clock/weather stay
 * right-anchored and never move. The value leaves ~40px of open breathing
 * space between the floating panel's right edge (x=180) and the content
 * (base left ~86px + 134 = ~220) — deliberate air, never filled.
 */
export const V6_L0_CLOSED_LEFT = 134;
/** one spatial ease for the whole composition — L0, strip and hub move together */
export const V6_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';
export const V6_OPEN_MS = 680;

// ─── Strip items ──────────────────────────────────────────────────────────────
// Every item must answer "why should I care right now?" in one glance:
//   STATUS → HERO VALUE / TITLE → USEFUL CONTEXT

/** Where a strip item lands when the user presses ← from it (intent-preserving). */
export type V6HubTarget =
  | { zone: 'ask'; idx: number }
  | { zone: 'explore'; idx: number }
  | { zone: 'space'; idx: number };

/**
 * What kind of information leads inside a tile. Tiles share dimensions,
 * radii and focus behaviour — but the information design adapts:
 *   sports → score-first · shopping → price-first · generation → image-first
 *   trip → destination-first · thread → title-first
 */
export type V6StripContentType = 'trip' | 'shopping' | 'sports' | 'generation' | 'thread';

export type V6StripItem = {
  id: string;
  kind: 'pinned' | 'active';
  contentType: V6StripContentType;
  /** why now — 'LIVE' / 'READY' / 'CONTINUE' for active; a quiet descriptor for pinned */
  status: string;
  tone: string;
  /** the one dominant line — a value ('IND 241/4') or the thing's name */
  hero: string;
  /** one short supporting line */
  context: string;
  image: string;
  live?: boolean;
  /** scores/prices dim their image hard so the value stays first */
  overlay?: 'heavy' | 'soft';
  target: V6HubTarget;
};

/** PINNED — things the user explicitly chose to keep close. Stable. */
export const V6_INITIAL_PINNED: V6StripItem[] = [
  {
    id: 'pin-coorg', kind: 'pinned', contentType: 'trip',
    status: 'Trip planning', tone: '#4DD0C4',
    hero: 'Coorg Family Trip', context: '3 places shortlisted',
    image: '/images/warm-start/coorg.jpg',
    target: { zone: 'explore', idx: 0 }, // Plan a Trip — continue planning there
  },
  {
    id: 'pin-sony', kind: 'pinned', contentType: 'shopping',
    status: 'Tracking price', tone: '#6BD98A',
    hero: 'Sony XM5', context: '↓ ₹2,000',
    image: '/images/feed/feed_46-fashion-luxury-flatlay.jpg',
    overlay: 'heavy',
    target: { zone: 'space', idx: 1 }, // Wishlist — where price tracking lives
  },
  {
    id: 'pin-living', kind: 'pinned', contentType: 'thread',
    status: 'Home design', tone: '#E8CE8A',
    hero: 'Living Room', context: '3 new concepts',
    image: '/images/feed/feed_24-home-cozy-monsoon-living-room.jpg',
    target: { zone: 'explore', idx: 2 }, // Redesign a Room — where the concepts live
  },
];

/** ACTIVE — dynamic surfaces Ambient selected because they matter right now. */
export const V6_ACTIVE_ITEMS: V6StripItem[] = [
  {
    id: 'act-cricket', kind: 'active', contentType: 'sports',
    status: 'LIVE', tone: '#FF5A5A', live: true, overlay: 'heavy',
    hero: 'IND 241/4', context: 'vs AUS · 47.3 ov',
    image: '/images/feed/feed_25-sports-cricket-stadium-floodlights.jpg',
    target: { zone: 'ask', idx: 0 }, // no sports surface in the hub — land on Ask
  },
  {
    id: 'act-cabin', kind: 'active', contentType: 'generation',
    status: 'READY', tone: '#C9A6F5',
    hero: 'Forest Cabin', context: 'New variation',
    image: '/images/feed/feed_34-travel-nordic-winter-cabin.jpg',
    target: { zone: 'space', idx: 0 }, // AI Gallery — where the generation lives
  },
  {
    id: 'act-birthday', kind: 'active', contentType: 'thread',
    status: 'CONTINUE', tone: '#8FD6FF',
    hero: "Dad's Birthday", context: 'Gift shortlist ready',
    image: '/images/feed/feed_04-food-dinner-party-table.jpg',
    target: { zone: 'explore', idx: 3 }, // Find a Gift — the shortlist's home
  },
];

export const V6_MAX_PINS = 3;

// ─── Ask Glance hero — contextual suggestions ─────────────────────────────────
// Two-three "try asking" prompts inside the hero module. Visual invitations,
// not focus targets — OK on the hero starts listening either way.

export const V6_ASK_SUGGESTIONS: string[] = [
  '“Plan a weekend getaway from Bangalore”',
  '“What should I get Dad for his birthday?”',
  '“Find a movie for tonight”',
];

// ─── Continue lives on the persistent strip ──────────────────────────────────
// The hub deliberately has NO Continue row: ongoing threads are exactly what
// the strip's vertical stack shows (pinned intent + active surfaces), so the
// hub stays a calm three-section canvas — ASK · EXPLORE · YOUR SPACE.

// ─── Explore — evergreen outcomes, not agent names ────────────────────────────
// Underlying agents orchestrate these invisibly. Commerce emerges from
// intent (Discover → Decide → Plan → Shop), never leads. Exactly eight cards —
// a stable 4×2 grid the viewer reads in one glance, no browsing required.

export type V6ExploreCard = {
  id: string;
  title: string;
  desc: string;
  image: string;
  tone: string;
  pinStatus: string;
};

export const V6_EXPLORE_COLS = 4;

export const V6_EXPLORE_CARDS: V6ExploreCard[] = [
  {
    id: 'exp-trip', title: 'Plan a Trip', desc: 'Destinations, stays & experiences',
    image: '/images/warm-start/amalfi-coast.jpg', tone: '#4DD0C4', pinStatus: 'Plan together',
  },
  {
    id: 'exp-movie', title: 'Movie Night', desc: 'Find something everyone will enjoy',
    image: '/images/feed/feed_60-entertainment-vinyl-music-room.jpg', tone: '#B48CFF', pinStatus: 'Watch together',
  },
  {
    id: 'exp-room', title: 'Redesign a Room', desc: 'Imagine, generate & shop',
    image: '/images/feed/feed_28-home-japandi-minimal-living.jpg', tone: '#E8CE8A', pinStatus: 'Home design',
  },
  {
    id: 'exp-gift', title: 'Find a Gift', desc: 'Discover something together',
    image: '/images/feed/feed_46-fashion-luxury-flatlay.jpg', tone: '#6BD98A', pinStatus: 'Gifting',
  },
  {
    id: 'exp-celebration', title: 'Plan a Celebration', desc: 'Ideas, decor & gifts',
    image: '/images/feed/feed_33-culture-wedding-mandap-decor.jpg', tone: '#F79BC3', pinStatus: 'Celebration',
  },
  {
    id: 'exp-cook', title: 'Cook Together', desc: 'Choose, cook & shop',
    image: '/images/feed/feed_09-home-kitchen-morning.jpg', tone: '#FFB86B', pinStatus: 'Cooking',
  },
  {
    id: 'exp-style', title: 'Style an Occasion', desc: 'Build looks together',
    image: '/images/feed/feed_31-fashion-streetwear-editorial.jpg', tone: '#F79BC3', pinStatus: 'Styling',
  },
  {
    id: 'exp-memories', title: 'Relive Memories', desc: 'Photos, stories & collages',
    image: '/images/feed/feed_18-beauty-haldi-ritual.jpg', tone: '#C9A6F5', pinStatus: 'Memories',
  },
];

// ─── Your Space — utility layer, quieter than Explore ────────────────────────

export type V6SpaceTile = {
  id: string;
  label: string;
  sub?: string;
  icon: 'gallery' | 'wishlist' | 'recent' | 'weather' | 'settings';
  tint: string;
  variant: 'collage' | 'threads' | 'weather' | 'settings';
  thumbs?: string[];
  value?: string;
};

export const V6_SPACE_TILES: V6SpaceTile[] = [
  {
    id: 'space-gallery', label: 'AI Gallery', sub: '24 creations',
    icon: 'gallery', tint: '#B9A6F0', variant: 'collage',
    thumbs: [
      '/images/feed/feed_34-travel-nordic-winter-cabin.jpg',
      '/images/feed/feed_63-culture-holi-color-abstract.jpg',
      '/images/warm-start/amalfi-coast.jpg',
    ],
  },
  {
    id: 'space-wishlist', label: 'Wishlist', sub: '12 saved · 2 price updates',
    icon: 'wishlist', tint: '#F79BC3', variant: 'collage',
    thumbs: [
      '/images/feed/feed_46-fashion-luxury-flatlay.jpg',
      '/images/feed/feed_24-home-cozy-monsoon-living-room.jpg',
    ],
  },
  {
    id: 'space-threads', label: 'Threads', sub: '18 conversations',
    icon: 'recent', tint: '#8FD6FF', variant: 'threads',
  },
  {
    id: 'space-weather', label: 'Weather', sub: 'Rain later',
    icon: 'weather', tint: '#6FB9FF', variant: 'weather', value: '31°',
  },
  {
    id: 'space-settings', label: 'Settings',
    icon: 'settings', tint: '#9AA3B2', variant: 'settings',
  },
];

// ─── Threads — the complete conversation history across experiences ──────────

export type V6Thread = { id: string; title: string; domain: string; when: string; tint: string };

export const V6_THREADS: V6Thread[] = [
  { id: 'th-goa',    title: '“Plan our Goa family trip”',                 domain: 'Travel',        when: 'Yesterday',   tint: '#4DD0C4' },
  { id: 'th-dad',    title: '“What should I buy dad for his birthday?”',  domain: 'Celebration',   when: '2 hours ago', tint: '#8FD6FF' },
  { id: 'th-living', title: '“Make our living room warmer”',              domain: 'Home design',   when: '3 days ago',  tint: '#E8CE8A' },
  { id: 'th-movie',  title: '“Find a movie everyone will like”',          domain: 'Entertainment', when: 'Last week',   tint: '#B48CFF' },
  { id: 'th-cook',   title: '“Can we cook this with what we have?”',      domain: 'Cooking',       when: 'Last week',   tint: '#FFB86B' },
];

// ─── Entry focus — where focus lands on the strip when the hub opens ─────────
// The strip item most related to the L0 context the user pressed ← from.

export function v6EntryStripId(l0Category?: string): string {
  switch (l0Category) {
    case 'travel':   return 'pin-coorg';
    case 'sports':   return 'act-cricket';
    case 'shopping': return 'pin-sony';
    default:         return 'pin-coorg';
  }
}
