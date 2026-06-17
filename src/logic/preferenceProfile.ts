import type { PreferenceProfile, DiscoveryMode, Market } from '../data/types';

export function createDefaultProfile(): PreferenceProfile {
  return {
    weights: {},
    negativeWeights: {},
    evidenceCounts: {},
    fatigue: {},
    selectedQ1Scenario: undefined,
    selectedQ2Worlds: [],
    selectedQ2View: undefined,
    selectedQ3Categories: [],
    selectedQ4Vibes: [],
    discoveryMode: 'related',
    market: 'india',
    language: 'English',
    familyFriendly: false,
    seenItemIds: [],
    badges: [],
  };
}

export function boostAttribute(profile: PreferenceProfile, key: string, amount: number) {
  profile.weights[key] = (profile.weights[key] || 0) + amount;
}

export function decayAttribute(profile: PreferenceProfile, key: string, amount: number) {
  profile.negativeWeights[key] = (profile.negativeWeights[key] || 0) + amount;
}

export function boostAttributes(profile: PreferenceProfile, keys: string[], amount: number) {
  keys.forEach(k => boostAttribute(profile, k, amount));
}

export function decayAttributes(profile: PreferenceProfile, keys: string[], amount: number) {
  keys.forEach(k => decayAttribute(profile, k, amount));
}

export function resetProfile(profile: PreferenceProfile): PreferenceProfile {
  return {
    ...createDefaultProfile(),
    market: profile.market,
    language: profile.language,
    familyFriendly: profile.familyFriendly,
  };
}

export function setDiscoveryMode(profile: PreferenceProfile, mode: DiscoveryMode): PreferenceProfile {
  return { ...profile, discoveryMode: mode };
}

export function setMarket(profile: PreferenceProfile, market: Market): PreferenceProfile {
  return { ...profile, market };
}

export function setLanguage(profile: PreferenceProfile, language: string): PreferenceProfile {
  return { ...profile, language };
}

export function setFamilyFriendly(profile: PreferenceProfile, val: boolean): PreferenceProfile {
  return { ...profile, familyFriendly: val };
}
