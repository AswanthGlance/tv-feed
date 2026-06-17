// Single source of truth for all preference model constants.
// Change here; nowhere else. These are surfaced in debug panel sliders.

export const TUNING = {
  // ── Signal write strengths (raw evidence units) ────────────────────────
  // Signals write raw values; the score function applies axis multipliers.
  // No multiplier should live in both places.
  onboardingStrength: 2.0,       // per mapped attribute from Q1-Q5
  thumbsUpStrength: 3.0,         // per attribute from thumbs-up follow-up
  contextualYesStrength: 3.0,    // contextual prompt "yes"
  genQuestionStrength: 2.0,      // general question boost per token
  dwellSoftStrength: 0.5,        // passive dwell, first time on a route
  dwellRepeatStrength: 1.0,      // passive dwell, repeated route
  skipFastStrength: 0.3,         // fast skip (<2s) weak negative
  deepDiveStrength: 2.0,         // opening deep-dive = strong positive interest
  saveStrength: 2.5,             // save to wishlist

  // ── Score axis multipliers (applied once, in ranking.ts only) ──────────
  axisCategory: 2.0,
  axisSubCategory: 1.5,
  axisVibe: 1.2,
  axisRegion: 1.0,
  axisFormat: 0.8,
  axisPace: 0.5,

  // ── Saturation / decay ──────────────────────────────────────────────────
  // Weight contribution uses log(1 + evidence) so repeated signals saturate.
  // Raw weights are still stored; log is applied at score time.
  useSaturation: true,

  // Decay: multiply all positive weights by this factor every N cards
  decayFactor: 0.97,
  decayEveryNCards: 5,

  // Fatigue: per-attribute view count above which score contribution halves
  fatigueThreshold: 4,
  fatiguePenalty: 0.5,

  // ── Negative signal decay ───────────────────────────────────────────────
  negativeDecayFactor: 0.90,   // negatives decay faster than positives
  negativeFirstSoft: true,     // first negative on an attribute is halved

  // ── Exploration ─────────────────────────────────────────────────────────
  // Exploration candidates: items whose primary axis has evidence < this
  explorationMaxEvidence: 1,

  // ── Diversity caps ──────────────────────────────────────────────────────
  maxSameCategoryIn5: 2,
  maxSameVibeStreak: 3,

  // ── Re-rank stability ───────────────────────────────────────────────────
  // How many cards from current idx to keep stable during re-rank
  pinAhead: 2,

  // ── Saturation (spec §5.2: sat(w) = w / (w + SAT_K)) ──────────────────
  SAT_K: 3.0,   // higher = slower saturation; lower = faster cap

  // ── Market boost ────────────────────────────────────────────────────────
  marketMatchBoost: 1.0,
  globalBoost: 0.3,
  priorityCategoryBoost: 0.5,
  seenPenalty: 2.0,

  // ── Prompt scheduler ───────────────────────────────────────────────────
  minCardsBeforeFirstPrompt: 6,
  minCardsBetweenPrompts: 8,   // INTERSTITIAL_N default
  maxCardsBetweenPrompts: 10,
  PROMPT_TIMEOUT: 10000,       // ms before auto-dismiss

  // ── L1 exit ─────────────────────────────────────────────────────────────
  L1_BOUNCE_MS: 4000,          // dwell < this = bounce, no follow-up question
  COLDSTART_N: 8,              // cardsViewed < this = cold-start distinctiveness ordering

  // ── Distinctiveness (for L1-exit option ordering) ───────────────────────
  W_NOVEL: 0.6,   // weight of recency-novelty in distinctiveness score
  W_GAP: 0.4,     // weight of evidence-gap in distinctiveness score

  // ── Passive dwell timing ────────────────────────────────────────────────
  dwellMs: 7000,
  skipFastMs: 2000,

  // ── Interaction follow-up governance ────────────────────────────────────
  interactionCapDefault: 1,    // max per session (debug slider: 1 to Infinity)
  interstitialNDefault: 9,     // default card gap between interstitials (slider)

  // ── Adjacency map (for adjacent-category composition) ───────────────────
  // Each category maps to its conceptually adjacent categories.
  ADJACENCY: {
    travel:        ['food', 'culture', 'luxury', 'wellness'],
    food:          ['travel', 'home', 'culture', 'wellness'],
    home:          ['wellness', 'food', 'hobbies', 'fashion'],
    wellness:      ['beauty', 'home', 'sports', 'travel'],
    beauty:        ['fashion', 'wellness', 'home'],
    fashion:       ['beauty', 'luxury', 'entertainment'],
    luxury:        ['travel', 'fashion', 'food', 'home'],
    sports:        ['wellness', 'entertainment', 'travel'],
    entertainment: ['sports', 'culture', 'fashion'],
    hobbies:       ['home', 'wellness', 'food'],
    culture:       ['travel', 'entertainment', 'food'],
  } as Record<string, string[]>,

  // ── Vibe-to-category derivation (categories are inferred from vibe, never asked) ─
  // Q1 scenario options → weighted cat: token boosts written at setup.
  // Strength is relative; at profile creation these are multiplied by vibeSetupStrength.
  VIBE_TO_CATEGORY: {
    'slow-morning':  { 'cat:wellness': 0.8, 'cat:food': 0.6, 'cat:home': 0.5 },
    'forest-trail':  { 'cat:travel': 0.8, 'cat:wellness': 0.6 },
    'social-brunch': { 'cat:food': 0.9, 'cat:entertainment': 0.5, 'cat:travel': 0.3 },
    'city-lights':   { 'cat:entertainment': 0.7, 'cat:food': 0.6, 'cat:travel': 0.4 },
  } as Record<string, Record<string, number>>,

  // Q2 world options → weighted cat: token boosts (world = vibe, not category)
  WORLD_TO_CATEGORY: {
    'local-markets':   { 'cat:food': 0.8, 'cat:travel': 0.6, 'cat:entertainment': 0.4 },
    'game-day':        { 'cat:sports': 0.9, 'cat:entertainment': 0.5 },
    'beautiful-homes': { 'cat:home': 0.9, 'cat:wellness': 0.5 },
    'style-culture':   { 'cat:fashion': 0.8, 'cat:entertainment': 0.5 },
    'nature-escapes':  { 'cat:travel': 0.8, 'cat:wellness': 0.6 },
    'food-stories':    { 'cat:food': 0.9, 'cat:home': 0.4 },
  } as Record<string, Record<string, number>>,

  // Strength multiplier for vibe-derived category seeds
  vibeSetupStrength: 1.2,

  // ── Badge thresholds (normalized share of total positive weight) ────────
  badgeShareThreshold: 0.18,   // attribute must be ≥18% of total weight
  badgeFeedbackCount: 3,

  // ── Seeded RNG ──────────────────────────────────────────────────────────
  // Seed stored in session export for reproducibility
  rngSeed: Math.floor(Math.random() * 0xFFFFFFFF),
};

// Seeded pseudo-random number generator (mulberry32)
export function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export let rng = makeRng(TUNING.rngSeed);

export function resetRng() {
  rng = makeRng(TUNING.rngSeed);
}
