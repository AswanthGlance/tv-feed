export type Market = 'india' | 'us' | 'global';
export type Pace = 'slow' | 'medium' | 'fast';
export type DiscoveryMode = 'familiar' | 'related' | 'surprise' | 'new';
export type SignalSource = 'onboarding' | 'thumbs-up' | 'thumbs-down' | 'follow-up-poll' | 'contextual-prompt' | 'passive-dwell' | 'settings' | 'reset';
export type ShelfLife = 'session' | 'medium' | 'long';

export type AttributeBoosts = {
  categories?: string[];
  subCategories?: string[];
  vibes?: string[];
  regionOrCulture?: string[];
  format?: string[];
  pace?: Pace[];
};

export type FollowUpOption = {
  label: string;
  sessionOnly?: boolean;
  boosts?: AttributeBoosts;
  decays?: AttributeBoosts;
};

export type FeedItem = {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  locationLabel?: string;
  market: Market[];
  category: string;
  subCategories: string[];
  vibes: string[];
  regionOrCulture: string[];
  format: string;
  pace: Pace;
  safety: string[];
  ctaLabel: string;
  contextualQuestion?: string;
  contextualTopic?: string;
  positivePollOptions: FollowUpOption[];
  negativePollOptions: FollowUpOption[];
};

export type SignalEvent = {
  source: SignalSource;
  label: string;
  attributes: string[];
  strength: 'weak' | 'medium' | 'strong';
  shelfLife: ShelfLife;
  timestamp: number;
};

export type PreferenceProfile = {
  weights: Record<string, number>;
  negativeWeights: Record<string, number>;
  evidenceCounts: Record<string, number>;
  fatigue: Record<string, number>;
  selectedQ1Scenario?: string;
  selectedQ2Worlds: string[];      // world labels selected in Q2 (e.g. ["Local Markets & Street Life"])
  selectedQ2View?: string;         // legacy — kept for debug/export; no longer a setup question
  selectedQ3Categories: string[];
  selectedQ4Vibes: string[];
  discoveryMode: DiscoveryMode;
  market: Market;
  language: string;
  familyFriendly: boolean;
  seenItemIds: string[];
  lastSignal?: SignalEvent;
  badges: string[];
};

export type QuestionOption = {
  id: string;
  label: string;
  sublabel?: string;
  image?: string;
  mappedAttributes: AttributeBoosts;
  confirmationText: string;
};

// ── Spec-compliant engine types ──────────────────────────────────────────

// Per-token stat: weight + evidence count + last-seen card index
export type AttrStat = { weight: number; evidence: number; lastSeen: number };

// Canonical profile held in the reducer
export type Profile = {
  pos: Record<string, AttrStat>;   // namespaced token -> positive stat
  neg: Record<string, AttrStat>;   // soft, decaying negatives
  sessionNeg: string[];            // "Not now" tokens — cleared each session
  discovery: 'low' | 'mix' | 'high';
  cardsViewed: number;
  seed: number;
  // Settings
  market: Market;
  language: string;
  familyFriendly: boolean;
  seenItemIds: string[];
  badges: string[];
};

// Structured signal event (emitted for every signal from day one)
export type StructuredSignal = {
  sessionId: string;
  ts: number;
  surface: 'setup' | 'interstitial' | 'L0' | 'L1';
  type: 'setup_answer' | 'interstitial_answer' | 'like' | 'save'
      | 'dislike_reason' | 'dislike_alt' | 'cta_click' | 'l1_exit'
      | 'l1_question_answer' | 'dwell' | 'skip';
  itemId?: string;
  questionId?: string;
  optionId?: string;
  attributes: { token: string; delta: number }[];
  strength: number;
  dwellMs?: number;
};
