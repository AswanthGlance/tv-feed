/* ─────────────────────────────────────────────────────────────────────────────
   Last-resort image fallback — zero network dependency, always renders
   *something* even if the real/trace-provided image is unavailable.

   Picks from the app's existing categorized feed image library
   (public/images/feed/, already used by src/data/feedItems.ts) by matching
   keywords in the candidate's own real title against each rule — a sweet
   shop gets a food image, an escape room gets an entertainment image, a
   temple gets a travel/culture image, etc. This is still a GENERIC stock
   image, never a claim that it's the real place — just a more relevant one
   than a single repeated photo. Falls back to a small rotation across
   distinct generic images (not random — hashed off the item id, so it's
   stable across re-renders) when no keyword matches.
   ───────────────────────────────────────────────────────────────────────────── */

interface Rule {
  keywords: string[];
  image: string;
}

const RULES: Rule[] = [
  {
    keywords: [
      'sweet', 'mithai', 'modak', 'dessert', 'bakery', 'cake', 'chai', 'kulcha', 'dhaba', 'thali',
      'restaurant', 'cafe', 'kitchen', 'food', 'dining', 'biryani', 'ramen', 'pide',
      // South/North Indian dish + eatery terms — the dominant real domain
      // observed in aitv-mewtwo-harness traces (see
      // LEVEL2_INSTRUMENTATION_GAPS.md); "dosa" specifically was a
      // confirmed real miss (an entire real trace about Benne Dosa fell
      // through to the generic rotation, landing on a classical-dance
      // photo for the winning card).
      'dosa', 'idli', 'vada', 'paratha', 'samosa', 'chaat', 'momos', 'pizza', 'burger', 'roll',
      'bhandar', 'sweets', 'caterer', 'caters', 'eatery', 'dine',
    ],
    image: '/images/feed/feed_42-food-japanese-ramen-counter.jpg',
  },
  {
    keywords: ['sweet', 'mithai'], // second, lighter-touch food variant so sweets don't all look identical to restaurants
    image: '/images/feed/feed_04-food-dinner-party-table.jpg',
  },
  {
    keywords: ['escape', 'mystery', 'vr', 'laser', 'arcade', 'bowling', 'gaming', 'game room', 'quiz'],
    image: '/images/feed/feed_60-entertainment-vinyl-music-room.jpg',
  },
  {
    keywords: ['temple', 'heritage', 'fort', 'palace', 'museum', 'monument', 'shrine', 'ancient'],
    image: '/images/feed/feed_54-travel-kerala-backwaters-houseboat.jpg',
  },
  {
    keywords: ['spa', 'salon', 'wellness', 'yoga', 'massage', 'grooming'],
    image: '/images/feed/feed_16-luxury-spa-ritual.jpg',
  },
  {
    keywords: ['stadium', 'gym', 'fitness', 'sports', 'cricket', 'football', 'basketball', 'kabaddi'],
    image: '/images/feed/feed_25-sports-cricket-stadium-floodlights.jpg',
  },
  {
    keywords: ['boutique', 'store', 'shop', 'fashion', 'apparel'],
    image: '/images/feed/feed_31-fashion-streetwear-editorial.jpg',
  },
  {
    keywords: ['trek', 'hike', 'hiking', 'trail', 'summit', 'peak', 'basecamp', 'base camp', 'expedition', 'wildlife', 'safari', 'conservation', 'national park', 'backpack', 'himalaya', 'campsite'],
    image: '/images/feed/feed_40-travel-wildlife-dawn-grassland.jpg',
  },
  {
    keywords: ['beach', 'island', 'resort', 'waterfall', 'lake', 'valley', 'houseboat', 'backwater', 'coast', 'hill station'],
    image: '/images/feed/feed_54-travel-kerala-backwaters-houseboat.jpg',
  },
];

/** Distinct from RULES' images so "no keyword matched" still varies across a
 *  pool instead of collapsing onto one repeated photo. */
const GENERIC_ROTATION = [
  '/images/feed/feed_29-travel-goa-coastal-road.jpg',
  '/images/feed/feed_04-food-dinner-party-table.jpg',
  '/images/feed/feed_60-entertainment-vinyl-music-room.jpg',
  '/images/feed/feed_58-travel-mumbai-marine-drive-night.jpg',
  '/images/feed/feed_13-entertainment-classical-dance.jpg',
];

function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return hash;
}

export function pickLocalFallbackImage(title: string, id: string): string {
  const t = title.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((k) => t.includes(k))) return rule.image;
  }
  return GENERIC_ROTATION[hashString(id) % GENERIC_ROTATION.length];
}
