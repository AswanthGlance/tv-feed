import type { PreferenceProfile, FeedItem, SignalEvent } from '../data/types';
import { TUNING } from './tuning';

export type SignalRecord = {
  source: string;
  label: string;
  attributes: string[];
  strength: 'weak' | 'medium' | 'strong';
  shelf_life: string;
  timestamp_ms: number;
  timestamp_iso: string;
};

export type FeedInteraction = {
  item_id: string;
  title: string;
  category: string;
  sub_categories: string[];
  vibes: string[];
  region_or_culture: string[];
  action: 'thumbs_up' | 'thumbs_down' | 'save' | 'dwell_passive' | 'dwell_repeat' | 'contextual_yes' | 'contextual_no' | 'skipped';
  follow_up_label?: string;
  boosted_attributes?: string[];
  decayed_attributes?: string[];
  session_only?: boolean;
  timestamp_ms: number;
};

export type OnboardingAnswers = {
  q1_sunday_scenario: string | null;
  q1_mapped_attributes: Record<string, string[]>;
  q2_view_scenario: string | null;
  q2_mapped_attributes: Record<string, string[]>;
  q3_categories: string[];
  q4_vibes: string[];
  q5_discovery_mode: string;
  onboarding_skipped: boolean;
  onboarding_completed_at_ms: number | null;
};

export type MLSessionPayload = {
  schema_version: '1.0';
  session_id: string;
  rng_seed: number;
  exported_at_iso: string;
  exported_at_ms: number;
  market: string;
  language: string;
  family_friendly: boolean;

  onboarding: OnboardingAnswers;

  preference_profile: {
    positive_weights: Record<string, number>;
    negative_weights: Record<string, number>;
    evidence_counts: Record<string, number>;
    top_categories: string[];
    top_vibes: string[];
    top_regions: string[];
    discovery_mode: string;
    badges_earned: string[];
  };

  feed_interactions: FeedInteraction[];
  signal_history: SignalRecord[];

  feed_state: {
    total_items: number;
    current_index: number;
    items_seen: string[];
    upcoming_ids: string[];
  };

  derived_taste_summary: {
    dominant_category: string | null;
    dominant_vibe: string | null;
    exploration_appetite: string;
    content_pace: string;
    cultural_affinity: string[];
    explicit_dislikes: string[];
    interaction_depth: 'passive' | 'light' | 'active' | 'highly_active';
  };
};

// Accumulated feed interactions for the session (module-level singleton)
const _feedInteractions: FeedInteraction[] = [];
const _signalHistory: SignalRecord[] = [];
let _sessionId = generateSessionId();
let _onboardingCompletedAt: number | null = null;

function generateSessionId(): string {
  return 'sess_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now().toString(36);
}

export function getSessionId() { return _sessionId; }

export function recordFeedInteraction(interaction: FeedInteraction) {
  _feedInteractions.push(interaction);
}

export function recordSignal(signal: SignalEvent) {
  _signalHistory.push({
    source: signal.source,
    label: signal.label,
    attributes: signal.attributes,
    strength: signal.strength,
    shelf_life: signal.shelfLife,
    timestamp_ms: signal.timestamp,
    timestamp_iso: new Date(signal.timestamp).toISOString(),
  });
}

export function markOnboardingComplete() {
  _onboardingCompletedAt = Date.now();
}

export function resetSession() {
  _feedInteractions.length = 0;
  _signalHistory.length = 0;
  _sessionId = generateSessionId();
  _onboardingCompletedAt = null;
}

export function buildMLPayload(
  profile: PreferenceProfile,
  feed: FeedItem[],
  feedIdx: number,
  feedbackCount: number,
  onboardingDone: boolean,
): MLSessionPayload {
  const now = Date.now();

  // Derive top attributes — keys are namespaced (cat:travel, vibe:calm, etc.)
  const posWeights = Object.entries(profile.weights).sort((a, b) => b[1] - a[1]);
  const negWeights = Object.entries(profile.negativeWeights).sort((a, b) => b[1] - a[1]);

  const stripNs = (k: string) => k.includes(':') ? k.split(':').slice(1).join(':') : k;
  const topCategories = posWeights.filter(([k]) => k.startsWith('cat:')).slice(0, 3).map(([k]) => k.slice(4));
  const topVibes = posWeights.filter(([k]) => k.startsWith('vibe:')).slice(0, 3).map(([k]) => k.slice(5));
  const topRegions = posWeights.filter(([k]) => k.startsWith('region:')).slice(0, 3).map(([k]) => k.slice(7));

  const dominantCategory = topCategories[0] ?? null;
  const dominantVibe = topVibes[0] ?? null;
  const explicitDislikes = negWeights.filter(([, v]) => v >= 2).map(([k]) => stripNs(k));

  // Interaction depth
  let interactionDepth: 'passive' | 'light' | 'active' | 'highly_active' = 'passive';
  if (feedbackCount >= 10) interactionDepth = 'highly_active';
  else if (feedbackCount >= 5) interactionDepth = 'active';
  else if (feedbackCount >= 1) interactionDepth = 'light';

  // Content pace from weights (namespaced keys)
  const slowScore = (profile.weights['vibe:slow'] || 0) + (profile.weights['vibe:cozy'] || 0) + (profile.weights['vibe:calm'] || 0);
  const fastScore = (profile.weights['vibe:high-energy'] || 0) + (profile.weights['vibe:neon'] || 0) + (profile.weights['vibe:bold'] || 0);
  const contentPace = slowScore > fastScore ? 'slow' : fastScore > slowScore ? 'fast' : 'balanced';

  // Onboarding mapped attributes reconstruction
  const q1MappedAttrs: Record<string, string[]> = {};
  const q2MappedAttrs: Record<string, string[]> = {};
  if (profile.selectedQ1Scenario) {
    // These are representative; full mapping is in onboardingQuestions
    q1MappedAttrs[profile.selectedQ1Scenario] = [];
  }

  return {
    schema_version: '1.0',
    session_id: _sessionId,
    rng_seed: TUNING.rngSeed,
    exported_at_iso: new Date(now).toISOString(),
    exported_at_ms: now,
    market: profile.market,
    language: profile.language,
    family_friendly: profile.familyFriendly,

    onboarding: {
      q1_sunday_scenario: profile.selectedQ1Scenario ?? null,
      q1_mapped_attributes: q1MappedAttrs,
      q2_view_scenario: profile.selectedQ2View ?? null,
      q2_mapped_attributes: q2MappedAttrs,
      q3_categories: profile.selectedQ3Categories,
      q4_vibes: profile.selectedQ4Vibes,
      q5_discovery_mode: profile.discoveryMode,
      onboarding_skipped: !onboardingDone,
      onboarding_completed_at_ms: _onboardingCompletedAt,
    },

    preference_profile: {
      positive_weights: Object.fromEntries(posWeights.map(([k, v]) => [stripNs(k), v])),
      negative_weights: Object.fromEntries(negWeights.map(([k, v]) => [stripNs(k), v])),
      evidence_counts: Object.fromEntries(Object.entries(profile.evidenceCounts).map(([k, v]) => [stripNs(k), v])),
      top_categories: topCategories,
      top_vibes: topVibes,
      top_regions: topRegions,
      discovery_mode: profile.discoveryMode,
      badges_earned: profile.badges,
    },

    feed_interactions: [..._feedInteractions],
    signal_history: [..._signalHistory],

    feed_state: {
      total_items: feed.length,
      current_index: feedIdx,
      items_seen: profile.seenItemIds,
      upcoming_ids: feed.slice(feedIdx + 1, feedIdx + 5).map(i => i.id),
    },

    derived_taste_summary: {
      dominant_category: dominantCategory,
      dominant_vibe: dominantVibe,
      exploration_appetite: profile.discoveryMode,
      content_pace: contentPace,
      cultural_affinity: topRegions,
      explicit_dislikes: explicitDislikes,
      interaction_depth: interactionDepth,
    },
  };
}
