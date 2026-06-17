// Signals write RAW evidence into weights. Axis multipliers live ONLY in ranking.ts.
// This invariant prevents double-compounding. See tuning.ts for all constants.

import type { PreferenceProfile, AttributeBoosts, SignalEvent } from '../data/types';
import { TUNING } from './tuning';

function nsKey(axis: 'cat' | 'sub' | 'vibe' | 'region' | 'format' | 'pace', key: string): string {
  return `${axis}:${key}`;
}

function boostKeys(profile: PreferenceProfile, keys: string[], amount: number) {
  for (const k of keys) {
    profile.weights[k] = (profile.weights[k] || 0) + amount;
    profile.evidenceCounts[k] = (profile.evidenceCounts[k] || 0) + 1;
  }
}

function decayKeys(profile: PreferenceProfile, keys: string[], amount: number) {
  for (const k of keys) {
    const existing = profile.negativeWeights[k] || 0;
    const actual = TUNING.negativeFirstSoft && existing === 0 ? amount * 0.5 : amount;
    profile.negativeWeights[k] = existing + actual;
  }
}

function applyBoosts(profile: PreferenceProfile, boosts: AttributeBoosts, strength: number) {
  if (boosts.categories)     boostKeys(profile, boosts.categories.map(k => nsKey('cat', k)), strength);
  if (boosts.subCategories)  boostKeys(profile, boosts.subCategories.map(k => nsKey('sub', k)), strength);
  if (boosts.vibes)          boostKeys(profile, boosts.vibes.map(k => nsKey('vibe', k)), strength);
  if (boosts.regionOrCulture) boostKeys(profile, boosts.regionOrCulture.map(k => nsKey('region', k)), strength);
  if (boosts.format)         boostKeys(profile, boosts.format.map(k => nsKey('format', k)), strength);
  if (boosts.pace)           boostKeys(profile, boosts.pace.map(k => nsKey('pace', k)), strength);
}

function applyDecays(profile: PreferenceProfile, decays: AttributeBoosts, strength: number) {
  if (decays.categories)     decayKeys(profile, decays.categories.map(k => nsKey('cat', k)), strength);
  if (decays.subCategories)  decayKeys(profile, decays.subCategories.map(k => nsKey('sub', k)), strength);
  if (decays.vibes)          decayKeys(profile, decays.vibes.map(k => nsKey('vibe', k)), strength);
  if (decays.regionOrCulture) decayKeys(profile, decays.regionOrCulture.map(k => nsKey('region', k)), strength);
}

function makeSignal(source: SignalEvent['source'], label: string, boosts: AttributeBoosts, strength: SignalEvent['strength'], shelfLife: SignalEvent['shelfLife']): SignalEvent {
  return { source, label, attributes: Object.values(boosts).flat().map(String), strength, shelfLife, timestamp: Date.now() };
}

// ── Public signal functions ──────────────────────────────────────────────

export function applyOnboardingSignal(profile: PreferenceProfile, boosts: AttributeBoosts, label: string) {
  applyBoosts(profile, boosts, TUNING.onboardingStrength);
  profile.lastSignal = makeSignal('onboarding', label, boosts, 'medium', 'long');
}

export function applyThumbsUpSignal(profile: PreferenceProfile, boosts: AttributeBoosts, label: string) {
  applyBoosts(profile, boosts, TUNING.thumbsUpStrength);
  profile.lastSignal = makeSignal('thumbs-up', label, boosts, 'strong', 'long');
}

export function applyThumbsDownSignal(profile: PreferenceProfile, decays: AttributeBoosts, label: string, sessionOnly = false) {
  if (!sessionOnly) applyDecays(profile, decays, TUNING.thumbsUpStrength);
  profile.lastSignal = makeSignal('thumbs-down', label, decays, sessionOnly ? 'weak' : 'strong', sessionOnly ? 'session' : 'long');
}

export function applyContextualYes(profile: PreferenceProfile, boosts: AttributeBoosts, label: string) {
  applyBoosts(profile, boosts, TUNING.contextualYesStrength);
  profile.lastSignal = makeSignal('contextual-prompt', label, boosts, 'strong', 'long');
}

export function applyPassiveDwell(profile: PreferenceProfile, boosts: AttributeBoosts, label: string, isRepeat: boolean) {
  applyBoosts(profile, boosts, isRepeat ? TUNING.dwellRepeatStrength : TUNING.dwellSoftStrength);
  profile.lastSignal = makeSignal('passive-dwell', label, boosts, isRepeat ? 'medium' : 'weak', isRepeat ? 'medium' : 'session');
}

export function applySkipFast(profile: PreferenceProfile, decays: AttributeBoosts, label: string) {
  applyDecays(profile, decays, TUNING.skipFastStrength);
  profile.lastSignal = makeSignal('thumbs-down', `fast-skip: ${label}`, decays, 'weak', 'session');
}

export function applyDeepDive(profile: PreferenceProfile, boosts: AttributeBoosts, label: string) {
  applyBoosts(profile, boosts, TUNING.deepDiveStrength);
  profile.lastSignal = makeSignal('thumbs-up', `deep-dive: ${label}`, boosts, 'strong', 'long');
}

export function applyGenQuestion(profile: PreferenceProfile, tokens: string[], label: string) {
  boostKeys(profile, tokens.map(k => nsKey('vibe', k)), TUNING.genQuestionStrength);
  profile.lastSignal = { source: 'contextual-prompt', label, attributes: tokens, strength: 'medium', shelfLife: 'long', timestamp: Date.now() };
}

export function applyGenDecay(profile: PreferenceProfile, tokens: string[], label: string) {
  decayKeys(profile, tokens.map(k => nsKey('vibe', k)), TUNING.genQuestionStrength);
  profile.lastSignal = { source: 'settings', label, attributes: tokens, strength: 'medium', shelfLife: 'long', timestamp: Date.now() };
}

export function decayAllWeights(profile: PreferenceProfile) {
  for (const k of Object.keys(profile.weights)) {
    profile.weights[k] *= TUNING.decayFactor;
    if (profile.weights[k] < 0.01) delete profile.weights[k];
  }
  for (const k of Object.keys(profile.negativeWeights)) {
    profile.negativeWeights[k] *= TUNING.negativeDecayFactor;
    if (profile.negativeWeights[k] < 0.01) delete profile.negativeWeights[k];
  }
}

// Helper: convert legacy non-namespaced keys (for boosts passed as plain strings from App.tsx)
export function nsBoosts(boosts: Record<string, string[]>): AttributeBoosts {
  return {
    categories: boosts.categories,
    subCategories: boosts.subCategories,
    vibes: boosts.vibes,
    regionOrCulture: boosts.regionOrCulture,
  };
}

// Seed cat: weights derived from the user's vibe/world selections at setup.
// Categories are NEVER directly asked — they are inferred here from the scenario/world mapping.
// Each derived token emits a surface:"setup" source:"vibe-derived" event for the export.
// No write-time axis multiplier (invariant preserved).
export function seedVibeCategories(
  profile: PreferenceProfile,
  scenarioId: string | undefined,
  worldIds: string[],
): { profile: PreferenceProfile; derivedTokens: string[] } {
  const p = { ...profile, weights: { ...profile.weights }, evidenceCounts: { ...profile.evidenceCounts } };
  const strength = TUNING.vibeSetupStrength;
  const derived: string[] = [];

  const applyMap = (map: Record<string, number>) => {
    for (const [token, weight] of Object.entries(map)) {
      p.weights[token] = (p.weights[token] || 0) + weight * strength;
      p.evidenceCounts[token] = (p.evidenceCounts[token] || 0) + 1;
      if (!derived.includes(token)) derived.push(token);
    }
  };

  if (scenarioId) {
    const vibeMap = TUNING.VIBE_TO_CATEGORY[scenarioId];
    if (vibeMap) applyMap(vibeMap);
  }

  for (const worldId of worldIds) {
    const worldMap = TUNING.WORLD_TO_CATEGORY[worldId];
    if (worldMap) applyMap(worldMap);
  }

  return { profile: p, derivedTokens: derived };
}

export function getLastSignalSummary(signal?: SignalEvent): string {
  if (!signal) return '—';
  return `[${signal.source}] ${signal.label} (${signal.strength}, ${signal.shelfLife})`;
}

// Export nsKey for use in ranking.ts
export { nsKey };
