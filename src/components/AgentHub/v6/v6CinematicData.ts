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

// ─── Explore — equal cinematic cards with masthead content ───────────────────
// A stable 4×2 grid of IDENTICAL cards — the masthead above carries all the
// hierarchy; the grid stays calm and even. (No Continue row in this variant:
// ongoing threads live on the persistent strip.)

export type V6CinematicCard = {
  id: string;
  /** card face */
  title: string;
  subtitle: string;
  cardImage: string;
  accent: string;
  pinStatus: string;
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

export const V6_CIN_COLS = 4;

export const V6_CINEMATIC_CARDS: V6CinematicCard[] = [
  {
    id: 'exp-trip', title: 'Plan a Trip', subtitle: 'Destinations, stays & experiences',
    ...card('exp-trip'),
    mastheadImage: '/images/agent-hub/masthead/trip.jpg',
    mastheadLabel: 'Plan a Trip',
    mastheadHeadline: 'Where should we go next?',
    mastheadDescription: 'Discover destinations, compare stays and build the trip together.',
  },
  {
    id: 'exp-movie', title: 'Movie Night', subtitle: 'Something everyone will enjoy',
    ...card('exp-movie'),
    mastheadImage: '/images/agent-hub/masthead/movie.jpg',
    mastheadLabel: 'Movie Night',
    mastheadHeadline: 'What are we watching tonight?',
    mastheadDescription: 'Find something everyone will enjoy and build the perfect movie night.',
  },
  {
    id: 'exp-room', title: 'Redesign a Room', subtitle: 'Imagine, generate & shop',
    ...card('exp-room'),
    mastheadImage: '/images/agent-hub/masthead/room.jpg',
    mastheadLabel: 'Redesign a Room',
    mastheadHeadline: 'See the room before you change it.',
    mastheadDescription: 'Explore styles, generate new looks and shop what works.',
  },
  {
    id: 'exp-gift', title: 'Find a Gift', subtitle: 'Thoughtful ideas together',
    ...card('exp-gift'),
    mastheadImage: '/images/agent-hub/masthead/gift.jpg',
    mastheadLabel: 'Find a Gift',
    mastheadHeadline: 'Find something that feels right.',
    mastheadDescription: 'Tell Glance who it is for and discover thoughtful ideas together.',
  },
  {
    id: 'exp-celebration', title: 'Plan a Celebration', subtitle: 'Ideas, decor & gifts',
    ...card('exp-celebration'),
    mastheadImage: '/images/agent-hub/masthead/celebration.jpg',
    mastheadLabel: 'Plan a Celebration',
    mastheadHeadline: 'Make the occasion unforgettable.',
    mastheadDescription: 'Explore themes, decor, outfits and gifts for the moment.',
  },
  {
    id: 'exp-cook', title: 'Cook Together', subtitle: 'Choose, cook & shop',
    ...card('exp-cook'),
    mastheadImage: '/images/agent-hub/masthead/cook.jpg',
    mastheadLabel: 'Cook Together',
    mastheadHeadline: 'What should we make tonight?',
    mastheadDescription: 'Choose a dish, adapt it to what you have and shop what is missing.',
  },
  {
    id: 'exp-style', title: 'Style an Occasion', subtitle: 'Build looks together',
    ...card('exp-style'),
    mastheadImage: '/images/agent-hub/masthead/style.jpg',
    mastheadLabel: 'Style an Occasion',
    mastheadHeadline: 'What should we wear?',
    mastheadDescription: 'Build looks together for the moments that matter.',
  },
  {
    id: 'exp-memories', title: 'Relive Memories', subtitle: 'Photos, stories & collages',
    ...card('exp-memories'),
    mastheadImage: '/images/agent-hub/masthead/memories.jpg',
    mastheadLabel: 'Relive Memories',
    mastheadHeadline: 'Turn moments into something worth keeping.',
    mastheadDescription: 'Rediscover photos, create stories and generate family collages.',
  },
];

/** masthead crossfade — fast enough to never slow navigation */
export const V6_MASTHEAD_FADE_MS = 380;
