// Axis multipliers live HERE ONLY — signals.ts writes raw evidence.
// This file scores, composes, and re-ranks the feed.

import type { FeedItem, PreferenceProfile } from '../data/types';
import { MARKET_CONFIGS, FEED_MIX } from '../data/marketConfig';
import { TUNING, rng } from './tuning';
import { nsKey } from './signals';

// ── Saturation: log(1 + evidence) caps contribution of repeated signals ──
function saturate(raw: number): number {
  if (!TUNING.useSaturation || raw <= 0) return Math.max(0, raw);
  return Math.log1p(raw);
}

// ── Axis score: mean over item's tokens (fixes tag-count bias) ──────────
function axisScore(
  weights: Record<string, number>,
  negWeights: Record<string, number>,
  tokens: string[],
  axis: 'cat' | 'sub' | 'vibe' | 'region' | 'format' | 'pace',
  multiplier: number,
): number {
  if (!tokens.length) return 0;
  let pos = 0, neg = 0;
  for (const t of tokens) {
    const k = nsKey(axis, t);
    pos += saturate(weights[k] || 0);
    neg += saturate(negWeights[k] || 0);
  }
  // Mean, not sum — eliminates tag-count bias
  return ((pos - neg) / tokens.length) * multiplier;
}

// ── Fatigue penalty ──────────────────────────────────────────────────────
function fatigueFactor(evidenceCounts: Record<string, number>, tokens: string[], axis: 'cat' | 'sub' | 'vibe' | 'region'): number {
  if (!tokens.length) return 1;
  const maxCount = Math.max(...tokens.map(t => evidenceCounts[nsKey(axis, t)] || 0));
  return maxCount >= TUNING.fatigueThreshold ? TUNING.fatiguePenalty : 1;
}

// ── Main score function ──────────────────────────────────────────────────
export function scoreItem(item: FeedItem, profile: PreferenceProfile): number {
  const { weights, negativeWeights, evidenceCounts, fatigue: _fatigue } = profile;
  const config = MARKET_CONFIGS[profile.market];

  let score = 0;

  score += axisScore(weights, negativeWeights, [item.category], 'cat', TUNING.axisCategory)
    * fatigueFactor(evidenceCounts, [item.category], 'cat');

  score += axisScore(weights, negativeWeights, item.subCategories, 'sub', TUNING.axisSubCategory)
    * fatigueFactor(evidenceCounts, item.subCategories, 'sub');

  score += axisScore(weights, negativeWeights, item.vibes, 'vibe', TUNING.axisVibe)
    * fatigueFactor(evidenceCounts, item.vibes, 'vibe');

  score += axisScore(weights, negativeWeights, item.regionOrCulture, 'region', TUNING.axisRegion);
  score += axisScore(weights, negativeWeights, [item.format], 'format', TUNING.axisFormat);
  score += axisScore(weights, negativeWeights, [item.pace], 'pace', TUNING.axisPace);

  // Market boost
  if (item.market.includes(profile.market)) score += TUNING.marketMatchBoost;
  else if (item.market.includes('global')) score += TUNING.globalBoost;

  // Priority category boost
  if (config.priorityCategories.includes(item.category)) score += TUNING.priorityCategoryBoost;

  // Already seen penalty
  if (profile.seenItemIds.includes(item.id)) score -= TUNING.seenPenalty;

  return score;
}

// ── Explain why a card scored as it did (for "Why this?" affordance) ────
export function explainScore(item: FeedItem, profile: PreferenceProfile): Array<{ label: string; contribution: number }> {
  const { weights, negativeWeights } = profile;
  const parts: Array<{ label: string; contribution: number }> = [];

  const catK = nsKey('cat', item.category);
  const catContrib = (saturate(weights[catK] || 0) - saturate(negativeWeights[catK] || 0)) * TUNING.axisCategory;
  if (Math.abs(catContrib) > 0.05) parts.push({ label: item.category, contribution: catContrib });

  for (const s of item.subCategories.slice(0, 2)) {
    const k = nsKey('sub', s);
    const c = (saturate(weights[k] || 0) - saturate(negativeWeights[k] || 0)) * TUNING.axisSubCategory / item.subCategories.length;
    if (Math.abs(c) > 0.05) parts.push({ label: s.replace(/-/g, ' '), contribution: c });
  }

  for (const v of item.vibes.slice(0, 2)) {
    const k = nsKey('vibe', v);
    const c = (saturate(weights[k] || 0) - saturate(negativeWeights[k] || 0)) * TUNING.axisVibe / item.vibes.length;
    if (Math.abs(c) > 0.05) parts.push({ label: v.replace(/-/g, ' '), contribution: c });
  }

  return parts.sort((a, b) => b.contribution - a.contribution).slice(0, 3);
}

// ── Compose the full feed on entry ──────────────────────────────────────
export function composeFeed(items: FeedItem[], profile: PreferenceProfile): FeedItem[] {
  const mix = FEED_MIX[profile.discoveryMode];
  const total = items.length;

  const scored = items.map(item => ({ item, score: scoreItem(item, profile) }));
  scored.sort((a, b) => b.score - a.score);

  const dominantN = Math.floor(total * mix.dominant);
  const adjacentN = Math.floor(total * mix.adjacent);
  const explorationN = Math.floor(total * mix.exploration);

  const result: FeedItem[] = [];
  const usedIds = new Set<string>();

  function add(fi: FeedItem) {
    if (!usedIds.has(fi.id)) { usedIds.add(fi.id); result.push(fi); }
  }

  // Dominant: highest scorers
  scored.slice(0, dominantN).forEach(s => add(s.item));

  // Adjacent: mid-range
  scored.slice(dominantN, dominantN + adjacentN).forEach(s => add(s.item));

  // Exploration: sample from LOW-EVIDENCE items (unknown territory, not worst-scored)
  // Items where the primary axis has evidence count < threshold
  const explorationPool = items.filter(item => {
    const catEvidence = profile.evidenceCounts[nsKey('cat', item.category)] || 0;
    return catEvidence <= TUNING.explorationMaxEvidence && !usedIds.has(item.id);
  });
  // Shuffle using seeded RNG
  const shuffled = [...explorationPool].sort(() => rng() - 0.5);
  shuffled.slice(0, explorationN).forEach(item => add(item));

  // Fill remaining in score order
  scored.forEach(s => add(s.item));

  return applyDiversityCaps(result);
}

// ── Diversity caps ───────────────────────────────────────────────────────
function applyDiversityCaps(items: FeedItem[]): FeedItem[] {
  const result: FeedItem[] = [];
  const recentCategories: string[] = [];
  const vibeStreak: Record<string, number> = {};
  const deferred: FeedItem[] = [];

  for (const item of items) {
    const last5Cats = recentCategories.slice(-5);
    const catCount = last5Cats.filter(c => c === item.category).length;
    const dominantVibe = item.vibes[0];
    const streak = vibeStreak[dominantVibe] || 0;

    if (catCount >= TUNING.maxSameCategoryIn5 || streak >= TUNING.maxSameVibeStreak) {
      deferred.push(item);
    } else {
      result.push(item);
      recentCategories.push(item.category);
      item.vibes.forEach(v => { vibeStreak[v] = (vibeStreak[v] || 0) + 1; });
      Object.keys(vibeStreak).forEach(v => { if (!item.vibes.includes(v)) vibeStreak[v] = 0; });
    }
  }
  return [...result, ...deferred];
}

// ── Re-rank tail after a feedback signal ─────────────────────────────────
// Pins current + next TUNING.pinAhead cards so the feed doesn't visibly reshuffle.
export function rerankTail(feed: FeedItem[], currentIdx: number, profile: PreferenceProfile): FeedItem[] {
  const pinEnd = currentIdx + 1 + TUNING.pinAhead;
  const head = feed.slice(0, pinEnd);
  const tail = feed.slice(pinEnd);
  const scoredTail = tail.map(item => ({ item, score: scoreItem(item, profile) }));
  scoredTail.sort((a, b) => b.score - a.score);
  return [...head, ...applyDiversityCaps(scoredTail.map(s => s.item))];
}

// ── Periodic weight decay (called every TUNING.decayEveryNCards) ─────────
export { decayAllWeights } from './signals';
