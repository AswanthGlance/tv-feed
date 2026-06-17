// Configurable question schema for all 3 preference surfaces:
// setup (onboarding), interstitial (mid-feed), interaction (post-action).
//
// This is the single source of truth for question content.
// Question copy, options, images, triggers, and ML signal mappings
// can all be changed here without touching product logic.

import type { AttributeBoosts } from './types';

export type QuestionSurface = 'setup' | 'interstitial' | 'interaction';
export type QuestionTemplate = 'scenario' | 'single-select' | 'multi-select' | 'follow-up';
export type SkipBehavior = 'no-signal' | 'session-only';

export type QuestionOptionConfig = {
  id: string;
  label: string;
  sublabel?: string;
  image?: string;
  emoji?: string;             // emoji/icon shown in the new card design
  boosts: AttributeBoosts;
  confirmationText: string;   // payoff copy shown after selection
};

export type QuestionConfig = {
  id: string;
  surface: QuestionSurface;
  template: QuestionTemplate;
  question: string;
  /** Phrases within `question` that should receive the premium highlight treatment */
  highlightPhrases?: string[];
  subtext?: string;
  bgImage?: string;           // full-bleed cinematic background for this question
  options: QuestionOptionConfig[];
  autoDismissMs: number;      // 0 = no auto-dismiss
  skipBehavior: SkipBehavior;
  gapAxis?: string;           // interstitial: namespaced axis token to fill (e.g. 'cat:food')
  triggerAfterCards?: number; // interstitial only: min cards before this fires
  cooldownKey?: string;       // prevents re-asking same topic
  expectedSignalGain: number; // 1–5 estimate, used by scheduler
};

// ── INTERSTITIAL QUESTIONS ───────────────────────────────────────────────
// Visual, scenario-style, auto-dismissible.
// These replace the old GENQ abstract toggle questions.

export const INTERSTITIAL_QUESTIONS: QuestionConfig[] = [
  {
    id: 'food-picks',
    surface: 'interstitial',
    template: 'multi-select',
    question: 'Let me sharpen your food feed — what are you into?',
    highlightPhrases: ['food feed'],
    bgImage: '/images/feed/feed_47-food-monsoon-chai-stall.jpg',
    autoDismissMs: 0,
    skipBehavior: 'no-signal',
    triggerAfterCards: 4,
    cooldownKey: 'food-taste',
    expectedSignalGain: 5,
    options: [
      {
        id: 'south-indian',
        label: 'South Indian',
        sublabel: 'Filter coffee, dosa, thalis',
        emoji: '🍚',
        image: '/images/feed/eatly-dawn.jpg',
        boosts: { categories: ['food'], subCategories: ['south-indian', 'dosa', 'filter-coffee'], regionOrCulture: ['south-india', 'india'] },
        confirmationText: 'More South Indian food coming up.',
      },
      {
        id: 'asian',
        label: 'Asian',
        sublabel: 'Ramen, bao, dumplings',
        emoji: '🍜',
        image: '/images/feed/feed_42-food-japanese-ramen-counter.jpg',
        boosts: { categories: ['food'], subCategories: ['asian', 'ramen', 'dumplings'], regionOrCulture: ['asia'] },
        confirmationText: 'More Asian cuisine coming up.',
      },
      {
        id: 'cafes-bakes',
        label: 'Cafés & bakes',
        sublabel: 'Coffee, brunch, pastries',
        emoji: '☕',
        image: '/images/feed/feed_47-food-monsoon-chai-stall.jpg',
        boosts: { categories: ['food'], subCategories: ['cafe-culture', 'brunch', 'bakery'], vibes: ['calm', 'cozy', 'premium'] },
        confirmationText: 'More café and bake content coming up.',
      },
      {
        id: 'street-food',
        label: 'Street food',
        sublabel: 'Chaat, stalls, local favourites',
        emoji: '🫕',
        image: '/images/feed/feed_59-food-healthy-bowl-kitchen.jpg',
        boosts: { categories: ['food'], subCategories: ['street-food', 'chai', 'local-food'], vibes: ['social', 'warm', 'urban'], regionOrCulture: ['india'] },
        confirmationText: 'More street food and local flavours coming up.',
      },
    ],
  },
  {
    id: 'dinner-table',
    surface: 'interstitial',
    template: 'scenario',
    question: 'Which dinner table is yours tonight?',
    highlightPhrases: ['dinner table'],
    bgImage: '/images/feed/feed_04-food-dinner-party-table.jpg',
    autoDismissMs: 10000,
    skipBehavior: 'no-signal',
    triggerAfterCards: 6,
    cooldownKey: 'food-occasion',
    expectedSignalGain: 4,
    options: [
      {
        id: 'home-table',
        label: 'A home-cooked spread',
        sublabel: 'Warm, slow, just the people you love',
        emoji: '🍲',
        image: '/images/feed/feed_04-food-dinner-party-table.jpg',
        boosts: { categories: ['food', 'home'], subCategories: ['social-dining', 'slow-living'], vibes: ['warm', 'cozy', 'comfort'] },
        confirmationText: 'More warm home moments coming up.',
      },
      {
        id: 'street-stall',
        label: 'Street food at a local stall',
        sublabel: 'Chai, chaat, and the buzz of a local stall',
        emoji: '🫕',
        image: '/images/feed/feed_47-food-monsoon-chai-stall.jpg',
        boosts: { categories: ['food'], subCategories: ['street-food', 'chai'], vibes: ['social', 'warm', 'urban'], regionOrCulture: ['india'] },
        confirmationText: 'More street food and local flavours coming up.',
      },
      {
        id: 'restaurant-counter',
        label: 'A restaurant night',
        sublabel: 'Reservations, good lighting, the full experience',
        emoji: '🍷',
        image: '/images/feed/feed_59-food-healthy-bowl-kitchen.jpg',
        boosts: { categories: ['food', 'luxury'], subCategories: ['fine-dining', 'chef'], vibes: ['premium', 'luxury', 'calm'] },
        confirmationText: 'More premium dining moments coming up.',
      },
      {
        id: 'quick-healthy',
        label: 'Quick and healthy',
        sublabel: 'Fresh bowls, clean plates, real ingredients',
        emoji: '🥗',
        image: '/images/feed/feed_59-food-healthy-bowl-kitchen.jpg',
        boosts: { categories: ['food'], subCategories: ['healthy', 'plant-based', 'fresh'], vibes: ['fresh', 'calm', 'minimal'] },
        confirmationText: 'More fresh and healthy food coming up.',
      },
    ],
  },
  {
    id: 'which-trip',
    surface: 'interstitial',
    template: 'scenario',
    question: 'Which trip are you taking?',
    highlightPhrases: ['trip'],
    bgImage: '/images/feed/feed_29-travel-goa-coastal-road.jpg',
    autoDismissMs: 10000,
    skipBehavior: 'no-signal',
    triggerAfterCards: 8,
    cooldownKey: 'travel-direction',
    expectedSignalGain: 5,
    options: [
      {
        id: 'heritage-escape',
        label: 'Into heritage and history',
        sublabel: 'Old cities, temples, stories in stone',
        emoji: '🏛️',
        image: '/images/feed/feed_54-travel-kerala-backwaters-houseboat.jpg',
        boosts: { categories: ['travel', 'entertainment'], subCategories: ['heritage-travel', 'india-travel', 'cultural-exploration'], vibes: ['spiritual', 'timeless', 'cultural'], regionOrCulture: ['india', 'rajasthan'] },
        confirmationText: 'More heritage escapes coming up.',
      },
      {
        id: 'nature-slow',
        label: 'Into nature, slowly',
        sublabel: 'Mountains, backwaters, forest trails',
        emoji: '🌿',
        image: '/images/feed/feed_40-travel-wildlife-dawn-grassland.jpg',
        boosts: { categories: ['travel', 'wellness'], subCategories: ['nature-travel', 'kerala', 'himalayan'], vibes: ['calm', 'nature-led', 'slow', 'fresh'], regionOrCulture: ['india', 'kerala'] },
        confirmationText: 'More calm nature escapes coming up.',
      },
      {
        id: 'city-energy',
        label: 'Into a city full of energy',
        sublabel: 'New places, street life, the buzz of somewhere new',
        emoji: '🌆',
        image: '/images/feed/feed_22-travel-seoul-cafe-street.jpg',
        boosts: { categories: ['travel', 'food'], subCategories: ['urban-travel', 'cafe-culture', 'street-food'], vibes: ['urban', 'social', 'neon'], regionOrCulture: ['korea', 'asia'] },
        confirmationText: 'More city energy and urban travel coming up.',
      },
      {
        id: 'coastal-escape',
        label: 'A coastal escape',
        sublabel: 'Sea air, open roads, and no real schedule',
        emoji: '🌊',
        image: '/images/feed/feed_29-travel-goa-coastal-road.jpg',
        boosts: { categories: ['travel', 'wellness'], subCategories: ['coast', 'goa', 'india-travel'], vibes: ['open-sky', 'calm', 'warm'], regionOrCulture: ['india', 'goa'] },
        confirmationText: 'More coastal escapes coming up.',
      },
    ],
  },
  {
    id: 'evening-feel',
    surface: 'interstitial',
    template: 'scenario',
    question: 'What kind of evening should Glance bring you?',
    highlightPhrases: ['evening'],
    bgImage: '/images/feed/feed_25-sports-cricket-stadium-floodlights.jpg',
    autoDismissMs: 10000,
    skipBehavior: 'no-signal',
    triggerAfterCards: 12,
    cooldownKey: 'evening-mood',
    expectedSignalGain: 4,
    options: [
      {
        id: 'calm-evening',
        label: 'Calm and winding down',
        sublabel: 'Soft light, slow content, nowhere to be',
        emoji: '🕯️',
        image: '/images/feed/feed_24-home-cozy-monsoon-living-room.jpg',
        boosts: { categories: ['home', 'wellness'], subCategories: ['slow-living', 'reading-nook', 'self-care'], vibes: ['calm', 'cozy', 'slow', 'warm'] },
        confirmationText: 'More calm, slow moments coming up.',
      },
      {
        id: 'social-evening',
        label: 'Out and social',
        sublabel: 'Good company, something happening, the night alive',
        emoji: '🎶',
        image: '/images/feed/feed_25-sports-cricket-stadium-floodlights.jpg',
        boosts: { categories: ['entertainment', 'food'], subCategories: ['concert', 'live', 'social-dining'], vibes: ['social', 'high-energy', 'festive'] },
        confirmationText: 'More social and lively energy coming up.',
      },
      {
        id: 'discovery-evening',
        label: 'Something I haven\'t seen before',
        sublabel: 'Curious, a little unexpected, different from usual',
        emoji: '🌏',
        image: '/images/feed/feed_63-culture-holi-color-abstract.jpg',
        boosts: { categories: ['travel', 'entertainment', 'food'], subCategories: ['market', 'street-food', 'cultural-story'], vibes: ['social', 'warm', 'urban'] },
        confirmationText: 'Mixing in something new and unexpected.',
      },
      {
        id: 'sports-live',
        label: 'Watching live sport',
        sublabel: 'The match, the crowd, the atmosphere',
        emoji: '🏟️',
        image: '/images/feed/feed_25-sports-cricket-stadium-floodlights.jpg',
        boosts: { categories: ['sports', 'entertainment'], subCategories: ['cricket', 'football', 'stadium-energy'], vibes: ['high-energy', 'social', 'bold'] },
        confirmationText: 'More live sport moments coming up.',
      },
    ],
  },
  {
    id: 'home-moment',
    surface: 'interstitial',
    template: 'scenario',
    question: 'What kind of space are you drawn to right now?',
    highlightPhrases: ['space'],
    bgImage: '/images/feed/feed_09-home-kitchen-morning.jpg',
    autoDismissMs: 10000,
    skipBehavior: 'no-signal',
    triggerAfterCards: 15,
    cooldownKey: 'home-aesthetic',
    expectedSignalGain: 3,
    options: [
      {
        id: 'cozy-home',
        label: 'Warm and cosy',
        sublabel: 'Textures, candles, the lived-in feeling',
        emoji: '🪔',
        image: '/images/feed/feed_09-home-kitchen-morning.jpg',
        boosts: { categories: ['home'], subCategories: ['cozy-interiors', 'warm-interiors', 'slow-living'], vibes: ['cozy', 'warm', 'slow'] },
        confirmationText: 'More cosy home inspiration coming up.',
      },
      {
        id: 'minimal-home',
        label: 'Minimal and clean',
        sublabel: 'Less clutter, more calm, beautifully edited',
        emoji: '🪟',
        image: '/images/feed/feed_28-home-japandi-minimal-living.jpg',
        boosts: { categories: ['home'], subCategories: ['japandi', 'minimal'], vibes: ['minimal', 'calm', 'premium'] },
        confirmationText: 'More minimal and clean spaces coming up.',
      },
      {
        id: 'outdoor-home',
        label: 'Outside — a balcony or garden',
        sublabel: 'Green, open, the outdoors brought in',
        emoji: '🌱',
        image: '/images/feed/feed_44-home-modern-balcony-garden.jpg',
        boosts: { categories: ['home', 'wellness'], subCategories: ['home-garden', 'plants', 'outdoor-wellness'], vibes: ['fresh', 'calm', 'warm'] },
        confirmationText: 'More outdoor and garden spaces coming up.',
      },
      {
        id: 'curated-premium',
        label: 'Curated and premium',
        sublabel: 'Considered, deliberate, a little elevated',
        emoji: '✦',
        image: '/images/feed/feed_46-fashion-luxury-flatlay.jpg',
        boosts: { categories: ['home', 'luxury'], subCategories: ['luxury-fashion', 'premium', 'minimal'], vibes: ['luxury', 'premium', 'minimal'] },
        confirmationText: 'More curated, premium spaces coming up.',
      },
    ],
  },
  // ── Former Q2 View question — moved to interstitial pool ──────────────
  // Shown as a travel/aesthetic refinement question after feed exposure.
  // Trigger: after user has engaged with travel content.
  {
    id: 'which-view',
    surface: 'interstitial',
    template: 'scenario',
    question: 'Which view would you wake up to?',
    highlightPhrases: ['view'],
    subtext: "We'll tune travel and scenic content to match your style.",
    bgImage: '/images/feed/feed_29-travel-goa-coastal-road.jpg',
    autoDismissMs: 10000,
    skipBehavior: 'no-signal',
    gapAxis: 'cat:travel',
    triggerAfterCards: 20,
    expectedSignalGain: 4,
    options: [
      {
        id: 'heritage-route',
        label: 'Ancient Temple Route',
        sublabel: 'Stone corridors, incense, and centuries of stories',
        image: '/images/feed/feed_54-travel-kerala-backwaters-houseboat.jpg',
        emoji: '🏛️',
        confirmationText: 'More heritage escapes coming up.',
        boosts: { categories: ['travel', 'entertainment'], subCategories: ['heritage-travel', 'india-travel', 'cultural-exploration'], vibes: ['spiritual', 'timeless', 'cultural'], regionOrCulture: ['india', 'rajasthan'] },
      },
      {
        id: 'nordic-cabin',
        label: 'Nordic Winter Cabin',
        sublabel: 'Snow outside, firelight inside, quiet all around',
        image: '/images/feed/feed_34-travel-nordic-winter-cabin.jpg',
        emoji: '🏔️',
        confirmationText: 'More cosy winter retreats coming up.',
        boosts: { categories: ['travel', 'home'], subCategories: ['winter-travel', 'cabin-escape', 'nordic-living'], vibes: ['cozy', 'minimal', 'calm'], regionOrCulture: ['nordic', 'europe'] },
      },
      {
        id: 'mountain-road',
        label: 'Mountain Road',
        sublabel: 'High altitude, open sky, and nothing but the horizon',
        image: '/images/feed/feed_29-travel-goa-coastal-road.jpg',
        emoji: '🛣️',
        confirmationText: 'More open-road mountain adventures coming up.',
        boosts: { categories: ['travel'], subCategories: ['road-trip', 'himalayan', 'india-travel'], vibes: ['open-sky', 'cinematic', 'fresh'], regionOrCulture: ['india', 'himalayas'] },
      },
      {
        id: 'backwaters-coast',
        label: 'Backwaters & coast',
        sublabel: 'Kerala, Goa, the slow water edge of the country',
        image: '/images/feed/feed_54-travel-kerala-backwaters-houseboat.jpg',
        emoji: '🚣',
        confirmationText: 'More backwater and coastal escapes coming up.',
        boosts: { categories: ['travel', 'wellness'], subCategories: ['kerala', 'coast', 'india-travel'], vibes: ['calm', 'slow', 'warm', 'nature-led'], regionOrCulture: ['india', 'kerala', 'goa'] },
      },
    ],
  },
];

// ── INTERACTION FOLLOW-UP TEMPLATES ──────────────────────────────────────
// These are templates; actual options are built dynamically from card metadata.

export const THUMBS_DOWN_REASONS: Array<{ id: string; label: string; type: 'topic' | 'vibe' | 'format' | 'session' }> = [
  { id: 'not-topic',    label: 'Not this topic',        type: 'topic' },
  { id: 'wrong-vibe',   label: 'Wrong mood',            type: 'vibe' },
  { id: 'too-busy',     label: 'Too busy',              type: 'vibe' },
  { id: 'repetitive',   label: 'Seen too much of this', type: 'format' },
  { id: 'not-now',      label: 'Not now',               type: 'session' },
];

// L1 exit follow-up question text
export const L1_EXIT_QUESTION = "What pulled you into this?";
export const L1_EXIT_SUBTEXT = "We'll show more of what you were interested in.";

// Thumbs-down step 1 question
export const DISLIKE_STEP1_QUESTION = "What didn't work for you?";

// Thumbs-down step 2 question (shown after named reason, not "Not now")
export const DISLIKE_STEP2_QUESTION = "What should Glance show instead?";
export const DISLIKE_STEP2_SUBTEXT = "We'll reduce what didn't work and try a better direction.";
