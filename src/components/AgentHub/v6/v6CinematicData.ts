/**
 * v6CinematicData — data model for the CINEMATIC variant of the V6 hub
 * (/agent_hub_final_v2).
 *
 * The variant's core idea: the focused Explore experience drives a large
 * contextual MASTHEAD at the top of the hub. The masthead answers "why might
 * I want to do this?"; the Explore card answers "what can I do?". Everything
 * the masthead renders comes from this data — changing focus updates the
 * masthead from the item, never from hard-coded layouts.
 *
 * Masthead imagery lives in /public/images/agent-hub/masthead/ (curated from
 * Pexels at build time — no runtime API calls).
 */

import { V6_EXPLORE_CARDS } from './v6Data';

// ─── Explore — cinematic bento cards with masthead content ───────────────────

export type V6BentoRect = { c: number; r: number; w: number; h: number };

export type V6CinematicCard = {
  id: string;
  /** card face */
  title: string;
  subtitle: string;
  cardImage: string;
  accent: string;
  pinStatus: string;
  /** cell on the strict underlying bento grid */
  rect: V6BentoRect;
  /** masthead — why might I want to do this? */
  mastheadImage: string;
  mastheadLabel: string;
  mastheadHeadline: string;
  mastheadDescription: string;
  /**
   * Optional contextual overrides — Ambient can inject situational copy
   * later ("A long weekend is coming up.") without touching the layout.
   * When present these win over the evergreen headline/description.
   */
  contextualHeadline?: string;
  contextualDescription?: string;
};

const card = (id: string) => {
  const c = V6_EXPLORE_CARDS.find(x => x.id === id)!;
  return { cardImage: c.image, accent: c.tone, pinStatus: c.pinStatus };
};

/**
 * The strict underlying grid: 9 columns × 2 rows. Spans differ by importance
 * (Plan a Trip and Relive Memories anchor the corners with 3-wide cells) but
 * every edge aligns — packed and intentional, no masonry, no overlap.
 */
export const V6_CIN_COLS = 9;
export const V6_CIN_ROW_H = [148, 148] as const;

export const V6_CINEMATIC_CARDS: V6CinematicCard[] = [
  {
    id: 'exp-trip', title: 'Plan a Trip', subtitle: 'Destinations, stays & experiences',
    ...card('exp-trip'), rect: { c: 0, r: 0, w: 3, h: 1 },
    mastheadImage: '/images/agent-hub/masthead/trip.jpg',
    mastheadLabel: 'Plan a Trip',
    mastheadHeadline: 'Where should we go next?',
    mastheadDescription: 'Discover destinations, compare stays and build the trip together.',
  },
  {
    id: 'exp-movie', title: 'Movie Night', subtitle: 'Something everyone will enjoy',
    ...card('exp-movie'), rect: { c: 3, r: 0, w: 2, h: 1 },
    mastheadImage: '/images/agent-hub/masthead/movie.jpg',
    mastheadLabel: 'Movie Night',
    mastheadHeadline: 'What are we watching tonight?',
    mastheadDescription: 'Find something everyone will enjoy and build the perfect movie night.',
  },
  {
    id: 'exp-room', title: 'Redesign a Room', subtitle: 'Imagine, generate & shop',
    ...card('exp-room'), rect: { c: 5, r: 0, w: 2, h: 1 },
    mastheadImage: '/images/agent-hub/masthead/room.jpg',
    mastheadLabel: 'Redesign a Room',
    mastheadHeadline: 'See the room before you change it.',
    mastheadDescription: 'Explore styles, generate new looks and shop what works.',
  },
  {
    id: 'exp-gift', title: 'Find a Gift', subtitle: 'Thoughtful ideas together',
    ...card('exp-gift'), rect: { c: 7, r: 0, w: 2, h: 1 },
    mastheadImage: '/images/agent-hub/masthead/gift.jpg',
    mastheadLabel: 'Find a Gift',
    mastheadHeadline: 'Find something that feels right.',
    mastheadDescription: 'Tell Glance who it is for and discover thoughtful ideas together.',
  },
  {
    id: 'exp-celebration', title: 'Plan a Celebration', subtitle: 'Ideas, decor & gifts',
    ...card('exp-celebration'), rect: { c: 0, r: 1, w: 2, h: 1 },
    mastheadImage: '/images/agent-hub/masthead/celebration.jpg',
    mastheadLabel: 'Plan a Celebration',
    mastheadHeadline: 'Make the occasion unforgettable.',
    mastheadDescription: 'Explore themes, decor, outfits and gifts for the moment.',
  },
  {
    id: 'exp-cook', title: 'Cook Together', subtitle: 'Choose, cook & shop',
    ...card('exp-cook'), rect: { c: 2, r: 1, w: 2, h: 1 },
    mastheadImage: '/images/agent-hub/masthead/cook.jpg',
    mastheadLabel: 'Cook Together',
    mastheadHeadline: 'What should we make tonight?',
    mastheadDescription: 'Choose a dish, adapt it to what you have and shop what is missing.',
  },
  {
    id: 'exp-style', title: 'Style an Occasion', subtitle: 'Build looks together',
    ...card('exp-style'), rect: { c: 4, r: 1, w: 2, h: 1 },
    mastheadImage: '/images/agent-hub/masthead/style.jpg',
    mastheadLabel: 'Style an Occasion',
    mastheadHeadline: 'What should we wear?',
    mastheadDescription: 'Build looks together for the moments that matter.',
  },
  {
    id: 'exp-memories', title: 'Relive Memories', subtitle: 'Photos, stories & collages',
    ...card('exp-memories'), rect: { c: 6, r: 1, w: 3, h: 1 },
    mastheadImage: '/images/agent-hub/masthead/memories.jpg',
    mastheadLabel: 'Relive Memories',
    mastheadHeadline: 'Turn moments into something worth keeping.',
    mastheadDescription: 'Rediscover photos, create stories and generate family collages.',
  },
];

/**
 * Directional focus on the bento: from card `fromIdx`, the nearest card in
 * `dir` that overlaps it on the cross axis. Returns null past the grid's
 * edge — the caller decides which zone comes next. Strict grid = predictable
 * D-pad, whatever the spans.
 */
export function cinBentoMove(fromIdx: number, dir: 'left' | 'right' | 'up' | 'down'): number | null {
  const f = V6_CINEMATIC_CARDS[fromIdx]?.rect;
  if (!f) return null;
  const overRows = (a: V6BentoRect, b: V6BentoRect) => a.r < b.r + b.h && b.r < a.r + a.h;
  const overCols = (a: V6BentoRect, b: V6BentoRect) => a.c < b.c + b.w && b.c < a.c + a.w;

  let best: number | null = null;
  let bestDist = Infinity;
  V6_CINEMATIC_CARDS.forEach((cardDef, i) => {
    if (i === fromIdx) return;
    const rc = cardDef.rect;
    let ok = false; let dist = 0;
    if (dir === 'left')  { ok = rc.c + rc.w <= f.c && overRows(f, rc); dist = (f.c - (rc.c + rc.w)) * 10 + Math.abs(rc.r - f.r); }
    if (dir === 'right') { ok = rc.c >= f.c + f.w && overRows(f, rc); dist = (rc.c - (f.c + f.w)) * 10 + Math.abs(rc.r - f.r); }
    if (dir === 'up')    { ok = rc.r + rc.h <= f.r && overCols(f, rc); dist = (f.r - (rc.r + rc.h)) * 10 + Math.abs(rc.c - f.c); }
    if (dir === 'down')  { ok = rc.r >= f.r + f.h && overCols(f, rc); dist = (rc.r - (f.r + f.h)) * 10 + Math.abs(rc.c - f.c); }
    if (ok && dist < bestDist) { best = i; bestDist = dist; }
  });
  return best;
}

// ─── Continue — things waiting for me (deliberately quieter than Explore) ────

export type V6CinContinueItem = {
  id: string;
  title: string;
  sub: string;
  image: string;
  tone: string;
};

export const V6_CIN_CONTINUE: V6CinContinueItem[] = [
  {
    id: 'cont-coorg', title: 'Coorg Family Trip', sub: '3 places shortlisted',
    image: '/images/warm-start/coorg.jpg', tone: '#4DD0C4',
  },
  {
    id: 'cont-birthday', title: "Dad's Birthday Surprise", sub: 'Gift shortlist ready',
    image: '/images/feed/feed_04-food-dinner-party-table.jpg', tone: '#8FD6FF',
  },
  {
    id: 'cont-living', title: 'Living Room Makeover', sub: '3 new concepts',
    image: '/images/feed/feed_24-home-cozy-monsoon-living-room.jpg', tone: '#E8CE8A',
  },
  {
    id: 'cont-movie', title: 'Movie Night', sub: '4 movies shortlisted',
    image: '/images/feed/feed_60-entertainment-vinyl-music-room.jpg', tone: '#B48CFF',
  },
];

/** masthead crossfade — fast enough to never slow navigation */
export const V6_MASTHEAD_FADE_MS = 380;
