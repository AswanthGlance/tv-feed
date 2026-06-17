import type { QuestionOption, AttributeBoosts } from './types';

// Q1 — Aspirational Scenario (Which Sunday feels like yours?)
export const Q1_SCENARIO_OPTIONS: QuestionOption[] = [
  {
    id: 'slow-morning',
    label: 'A beautiful place',
    sublabel: 'Trips, views, and quiet escapes',
    image: '/images/q1/q1-03-travel.jpg',
    confirmationText: 'More scenic escapes coming up.',
    mappedAttributes: {
      categories: ['travel', 'wellness'],
      subCategories: ['nature-travel', 'outdoor-wellness', 'scenic', 'ambient-travel'],
      vibes: ['cinematic', 'calm', 'open-sky', 'fresh'],
      pace: ['slow'],
      format: ['ambient-scenic', 'travel-card'],
    },
  },
  {
    id: 'forest-trail',
    label: 'A good meal',
    sublabel: 'Local finds, comfort food, and ideas to try',
    image: '/images/q1/q1-02-food-and-dining.jpg',
    confirmationText: 'More food ideas coming up.',
    mappedAttributes: {
      categories: ['food', 'home'],
      subCategories: ['food-culture', 'food-story', 'social-dining', 'local-eats'],
      vibes: ['warm', 'social', 'comfort', 'cozy'],
      pace: ['medium'],
      format: ['food-story', 'lifestyle-editorial'],
    },
  },
  {
    id: 'social-brunch',
    label: 'A fresh look',
    sublabel: 'Outfits, styling, and things to wear',
    image: '/images/q1/q1-01-fashion-and-style.jpg',
    confirmationText: 'More style ideas coming up.',
    mappedAttributes: {
      categories: ['fashion'],
      subCategories: ['street-style', 'editorial', 'fashion-inspiration', 'outfits'],
      vibes: ['urban', 'bold', 'editorial', 'fresh'],
      pace: ['medium'],
      format: ['lifestyle-editorial'],
    },
  },
  {
    id: 'city-lights',
    label: 'A calmer home',
    sublabel: 'Spaces, corners, and little upgrades',
    image: '/images/q1/q1-05-home-and-interiors.jpg',
    confirmationText: 'More home ideas coming up.',
    mappedAttributes: {
      categories: ['home', 'wellness'],
      subCategories: ['cozy-interiors', 'slow-living', 'home-garden', 'interiors'],
      vibes: ['cozy', 'calm', 'warm', 'slow'],
      pace: ['slow'],
      format: ['home-inspiration', 'ambient-scenic'],
    },
  },
];

// ── Q2 World Options ─────────────────────────────────────────────────────
// Vibe/world-led question — user picks worlds, system infers categories.
// User never sees category names. Each world maps to category + sub + vibe + region.

export type WorldOption = {
  id: string;
  label: string;
  sublabel: string;
  image: string;
  confirmationText: string;
  mappedAttributes: AttributeBoosts;
};

export const Q2_WORLD_OPTIONS: WorldOption[] = [
  {
    id: 'local-markets',
    label: 'Food finds',
    sublabel: 'Local spots, street food, and ideas to try',
    image: '/images/q2/q2-food-finds.jpg',
    confirmationText: 'More food finds coming up.',
    mappedAttributes: {
      categories: ['food'],
      subCategories: ['street-food', 'local-eats', 'food-finds', 'local-markets'],
      vibes: ['warm', 'social', 'comfort', 'local'],
      regionOrCulture: ['india'],
    },
  },
  {
    id: 'game-day',
    label: 'Style ideas',
    sublabel: 'Outfits, looks, and things to wear',
    image: '/images/q2/q2-style-ideas.jpg',
    confirmationText: 'More style ideas coming up.',
    mappedAttributes: {
      categories: ['fashion'],
      subCategories: ['street-style', 'editorial', 'fashion-inspiration', 'outfits'],
      vibes: ['urban', 'bold', 'editorial', 'fresh'],
    },
  },
  {
    id: 'beautiful-homes',
    label: 'Weekend escapes',
    sublabel: 'Short trips, views, and places to discover',
    image: '/images/q2/q2-weekend-escapes.jpg',
    confirmationText: 'More weekend escapes coming up.',
    mappedAttributes: {
      categories: ['travel', 'wellness'],
      subCategories: ['weekend-escape', 'short-trip', 'scenic', 'nature-travel'],
      vibes: ['cinematic', 'calm', 'fresh', 'open-sky'],
      regionOrCulture: ['india', 'global'],
    },
  },
  {
    id: 'style-culture',
    label: 'Calm routines',
    sublabel: 'Wellness, morning habits, and ways to unwind',
    image: '/images/q2/q2-calm-routines.jpg',
    confirmationText: 'More calm routines coming up.',
    mappedAttributes: {
      categories: ['wellness', 'home'],
      subCategories: ['morning-ritual', 'self-care', 'mindfulness', 'slow-living'],
      vibes: ['calm', 'slow', 'warm', 'cozy'],
    },
  },
  {
    id: 'nature-escapes',
    label: 'Home upgrades',
    sublabel: 'Spaces, corners, and small improvements',
    image: '/images/q2/q2-home-upgrades.jpg',
    confirmationText: 'More home upgrades coming up.',
    mappedAttributes: {
      categories: ['home'],
      subCategories: ['home-upgrades', 'interiors', 'cozy-interiors', 'diy-home'],
      vibes: ['cozy', 'warm', 'calm', 'minimal'],
    },
  },
  {
    id: 'food-stories',
    label: 'Local discoveries',
    sublabel: 'Culture, places, and things happening around you',
    image: '/images/q2/q2-local-discoveries.jpg',
    confirmationText: 'More local discoveries coming up.',
    mappedAttributes: {
      categories: ['entertainment', 'travel', 'food'],
      subCategories: ['local-culture', 'street-life', 'community', 'local-events'],
      vibes: ['warm', 'social', 'comfort', 'cozy'],
      regionOrCulture: ['india'],
    },
  },
];

// Q2 — View Scenario (Pick the view you'd wake up to) — MOVED TO INTERSTITIALS
// Kept here for import compatibility; no longer used in onboarding flow.
export const Q2_VIEW_OPTIONS: QuestionOption[] = [
  {
    id: 'heritage-route',
    label: 'Ancient Temple Route',
    sublabel: 'Stone corridors, incense, and centuries of stories',
    image: '/images/q1/q1-03-travel.jpg',
    confirmationText: 'More heritage escapes coming up.',
    mappedAttributes: {
      categories: ['travel', 'entertainment'],
      subCategories: ['heritage-travel', 'cultural-exploration', 'india-travel'],
      vibes: ['spiritual', 'timeless', 'cultural', 'cinematic'],
      regionOrCulture: ['india', 'heritage'],
      pace: ['slow'],
      format: ['travel-card', 'cultural-story'],
    },
  },
  {
    id: 'nordic-cabin',
    label: 'Nordic Winter Cabin',
    sublabel: 'Snow outside, firelight inside, quiet all around',
    image: '/images/q3/q3-04-let-it-change-with-my-mood.jpg',
    confirmationText: 'More cosy winter retreats coming up.',
    mappedAttributes: {
      categories: ['travel', 'home'],
      subCategories: ['winter-travel', 'cabin-escape', 'nordic-living', 'cozy-interiors'],
      vibes: ['cozy', 'minimal', 'calm', 'luxury'],
      regionOrCulture: ['nordic', 'europe'],
      pace: ['slow'],
      format: ['ambient-scenic', 'home-inspiration'],
    },
  },
  {
    id: 'open-road',
    label: 'Mountain Road',
    sublabel: 'High altitude, open sky, and nothing but the horizon',
    image: '/images/feed/feed_43-travel-ladakh-mountain-road.jpg',
    confirmationText: 'More open-road mountain adventures coming up.',
    mappedAttributes: {
      categories: ['travel'],
      subCategories: ['road-trip', 'nature-travel', 'himalayan', 'india-travel'],
      vibes: ['open-sky', 'cinematic', 'fresh', 'calm'],
      regionOrCulture: ['india', 'himalayas'],
      pace: ['medium'],
      format: ['travel-card', 'ambient-scenic'],
    },
  },
];

// Q3 — Category checklist (What excites you? up to 5)
export interface CategoryOption {
  id: string;
  label: string;
  micro: string;
  image: string;
  mappedAttributes: { categories: string[]; subCategories: string[]; vibes: string[] };
}

export const Q3_CATEGORY_OPTIONS: CategoryOption[] = [
  {
    id: 'fashion',
    label: 'Fashion & Style',
    micro: 'Looks, trends, style inspiration',
    image: '/images/q1/q1-01-fashion-and-style.jpg',
    mappedAttributes: { categories: ['fashion'], subCategories: ['street-style', 'editorial'], vibes: ['urban', 'bold'] },
  },
  {
    id: 'food',
    label: 'Food & Dining',
    micro: 'Recipes, restaurants, food stories',
    image: '/images/q1/q1-02-food-and-dining.jpg',
    mappedAttributes: { categories: ['food'], subCategories: ['food-culture', 'food-story'], vibes: ['warm', 'social'] },
  },
  {
    id: 'travel',
    label: 'Travel',
    micro: 'Destinations, escapes, adventures',
    image: '/images/q1/q1-03-travel.jpg',
    mappedAttributes: { categories: ['travel'], subCategories: ['travel-card', 'nature-travel'], vibes: ['cinematic', 'open-sky'] },
  },
  {
    id: 'wellness',
    label: 'Wellness & Fitness',
    micro: 'Routines, mindfulness, fitness',
    image: '/images/q1/q1-04-wellness-and-fitness.jpg',
    mappedAttributes: { categories: ['wellness'], subCategories: ['self-care', 'fitness'], vibes: ['calm', 'fresh'] },
  },
  {
    id: 'home',
    label: 'Home & Interiors',
    micro: 'Spaces, design, slow living',
    image: '/images/q1/q1-05-home-and-interiors.jpg',
    mappedAttributes: { categories: ['home'], subCategories: ['cozy-interiors', 'slow-living'], vibes: ['cozy', 'warm'] },
  },
  {
    id: 'sports',
    label: 'Sports',
    micro: 'Games, athletes, live moments',
    image: '/images/q1/q1-06-sports.jpg',
    mappedAttributes: { categories: ['sports'], subCategories: ['stadium-energy'], vibes: ['high-energy', 'bold'] },
  },
  {
    id: 'entertainment',
    label: 'Entertainment',
    micro: 'Culture, music, performance',
    image: '/images/q1/q1-07-entertainment.jpg',
    mappedAttributes: { categories: ['entertainment'], subCategories: ['culture'], vibes: ['social', 'cinematic'] },
  },
  {
    id: 'luxury',
    label: 'Luxury & Aspiration',
    micro: 'Premium, elevated, beautiful',
    image: '/images/q1/q1-08-luxury-and-aspiration.jpg',
    mappedAttributes: { categories: ['luxury'], subCategories: ['aspirational', 'luxury-travel'], vibes: ['luxury', 'premium'] },
  },
  {
    id: 'beauty',
    label: 'Beauty & Grooming',
    micro: 'Skincare, style, rituals',
    image: '/images/q1/q1-09-beauty-and-grooming.jpg',
    mappedAttributes: { categories: ['beauty'], subCategories: ['skincare', 'beauty-routine'], vibes: ['calm', 'minimal'] },
  },
  {
    id: 'hobbies',
    label: 'Hobbies & Passions',
    micro: 'Craft, gardening, creative pursuits',
    image: '/images/q1/q1-10-hobbies-and-passion.jpg',
    mappedAttributes: { categories: ['hobbies'], subCategories: ['craft', 'gardening'], vibes: ['slow', 'creative'] },
  },
];

// Q4 — Vibe selection (Pick the worlds that feel like you)
export interface VibeOption {
  id: string;
  label: string;
  image: string;
  mappedAttributes: { vibes: string[]; subCategories?: string[] };
}

export const Q4_VIBE_OPTIONS: VibeOption[] = [
  { id: 'neon-city', label: 'Neon City Nights', image: '/images/q2/q2-01-neon-city-nights.jpg', mappedAttributes: { vibes: ['neon', 'high-energy', 'urban'], subCategories: ['city-nights', 'night-market'] } },
  { id: 'cozy-calm', label: 'Cozy & Calm', image: '/images/q2/q2-02-cozy-and-calm.jpg', mappedAttributes: { vibes: ['cozy', 'calm', 'slow'], subCategories: ['slow-living'] } },
  { id: 'luxe-elevated', label: 'Luxe & Elevated', image: '/images/q2/q2-03-luxe-and-elevated.jpg', mappedAttributes: { vibes: ['luxury', 'premium', 'minimal'] } },
  { id: 'sun-open-sky', label: 'Sun & Open Sky', image: '/images/q2/q2-04-sun-and-open-sky.jpg', mappedAttributes: { vibes: ['open-sky', 'fresh', 'cinematic'], subCategories: ['nature-travel'] } },
  { id: 'festival-energy', label: 'Festival Energy', image: '/images/q2/q2-05-festival-energy.jpg', mappedAttributes: { vibes: ['festive', 'social', 'bold'], subCategories: ['festival'] } },
  { id: 'minimal-clean', label: 'Minimal & Clean', image: '/images/q2/q2-06-minimal-and-clean.jpg', mappedAttributes: { vibes: ['minimal', 'calm', 'premium'] } },
  { id: 'warm-festive', label: 'Warm & Festive', image: '/images/q2/q2-07-warm-and-festive.jpg', mappedAttributes: { vibes: ['warm', 'festive', 'comfort'], subCategories: ['social-dining'] } },
  { id: 'nature-escape', label: 'Nature & Escape', image: '/images/q2/q2-08-nature-and-escape.jpg', mappedAttributes: { vibes: ['nature-led', 'calm', 'fresh'], subCategories: ['nature-travel'] } },
];

// Q5 — Discovery appetite
export interface DiscoveryOption {
  id: 'familiar' | 'related' | 'surprise' | 'new';
  label: string;
  description: string;
  image: string;
}

export const Q5_DISCOVERY_OPTIONS: DiscoveryOption[] = [
  { id: 'familiar', label: 'Keep it close', description: 'More of what already feels right', image: '/images/q3/q3-01-keep-it-close-to-what-i-love.jpg' },
  { id: 'related', label: 'Mix in surprises', description: 'A few new ideas along the way', image: '/images/q3/q3-02-mix-in-some-fresh-ideas.jpg' },
  { id: 'surprise', label: 'Surprise me sometimes', description: 'Bring in new worlds regularly.', image: '/images/q3/q3-03-surprise-me-sometimes.jpg' },
  { id: 'new', label: 'Take me somewhere new', description: 'A bolder feed with more fresh discoveries.', image: '/images/q3/q3-04-let-it-change-with-my-mood.jpg' },
];
