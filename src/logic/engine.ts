// Pure preference engine — spec-compliant implementation.
// Profile = { pos, neg, sessionNeg, discovery, cardsViewed, seed, ... }
// All functions are pure (return new profile) — safe for useReducer.

import type { Profile, AttrStat, FeedItem } from '../data/types';
import type { TokenDelta } from '../config/questionLoader';
import { TUNING } from './tuning';
import { makeRng } from './tuning';

// ── Profile factory ──────────────────────────────────────────────────────

export function createProfile(seed?: number): Profile {
  return {
    pos: {}, neg: {}, sessionNeg: [],
    discovery: 'mix',
    cardsViewed: 0,
    seed: seed ?? TUNING.rngSeed,
    market: 'india', language: 'English',
    familyFriendly: false,
    seenItemIds: [], badges: [],
  };
}

// ── Saturation (spec §5.2) ────────────────────────────────────────────────
export function sat(w: number): number {
  if (w <= 0) return 0;
  return w / (w + TUNING.SAT_K);
}

// ── Signal writers ───────────────────────────────────────────────────────

export function applyPositive(profile: Profile, tokens: TokenDelta[], cardIdx: number): Profile {
  const pos = { ...profile.pos };
  for (const { token, delta } of tokens) {
    const existing = pos[token] ?? { weight: 0, evidence: 0, lastSeen: 0 };
    pos[token] = { weight: existing.weight + delta, evidence: existing.evidence + 1, lastSeen: cardIdx };
  }
  return { ...profile, pos };
}

export function applyNegative(profile: Profile, tokens: TokenDelta[], cardIdx: number): Profile {
  const neg = { ...profile.neg };
  for (const { token, delta } of tokens) {
    const existing = neg[token] ?? { weight: 0, evidence: 0, lastSeen: 0 };
    // First negative is half-strength
    const actual = existing.evidence === 0 ? delta * 0.5 : delta;
    neg[token] = { weight: existing.weight + actual, evidence: existing.evidence + 1, lastSeen: cardIdx };
  }
  return { ...profile, neg };
}

export function applySessionNeg(profile: Profile, tokens: string[]): Profile {
  const next = [...new Set([...profile.sessionNeg, ...tokens])];
  return { ...profile, sessionNeg: next };
}

export function applyMappings(profile: Profile, mappings: TokenDelta[], cardIdx: number): Profile {
  // Separate discovery tokens from attribute tokens
  const attrTokens = mappings.filter(m => !m.token.startsWith('discovery:'));
  const discoveryTokens = mappings.filter(m => m.token.startsWith('discovery:'));

  let p = applyPositive(profile, attrTokens, cardIdx);

  // Discovery token sets profile.discovery
  if (discoveryTokens.length > 0) {
    // Take the strongest delta
    const sorted = discoveryTokens.sort((a, b) => b.delta - a.delta);
    const top = sorted[0].token;
    const mode = top === 'discovery:low' ? 'low' : top === 'discovery:high' ? 'high' : 'mix';
    p = { ...p, discovery: mode };
  }

  return p;
}

// ── Decay ─────────────────────────────────────────────────────────────────

export function decayProfile(profile: Profile): Profile {
  const pos: Record<string, AttrStat> = {};
  for (const [k, v] of Object.entries(profile.pos)) {
    const w = v.weight * TUNING.decayFactor;
    if (w > 0.005) pos[k] = { ...v, weight: w };
  }
  const neg: Record<string, AttrStat> = {};
  for (const [k, v] of Object.entries(profile.neg)) {
    const w = v.weight * TUNING.negativeDecayFactor;
    if (w > 0.005) neg[k] = { ...v, weight: w };
  }
  return { ...profile, pos, neg };
}

export function onCardViewed(profile: Profile): Profile {
  const next = { ...profile, cardsViewed: profile.cardsViewed + 1 };
  if (next.cardsViewed % TUNING.decayEveryNCards === 0) return decayProfile(next);
  return next;
}

// ── Scoring ──────────────────────────────────────────────────────────────

// All tags a FeedItem carries, as namespaced tokens
export function itemTokens(item: FeedItem): Record<string, string[]> {
  return {
    cat:    [`cat:${item.category}`],
    sub:    item.subCategories.map(s => `sub:${s}`),
    vibe:   item.vibes.map(v => `vibe:${v}`),
    region: item.regionOrCulture.map(r => `region:${r}`),
    format: [`format:${item.format}`],
    pace:   [`pace:${item.pace}`],
  };
}

const AXIS_KEYS = ['cat', 'sub', 'vibe', 'region', 'format', 'pace'] as const;
type Axis = typeof AXIS_KEYS[number];

const AXIS_IMPORTANCE: Record<Axis, number> = {
  cat:    TUNING.axisCategory,
  sub:    TUNING.axisSubCategory,
  vibe:   TUNING.axisVibe,
  region: TUNING.axisRegion,
  format: TUNING.axisFormat,
  pace:   TUNING.axisPace,
};

// Per-axis mean of sat(weight), spec §5.2
function perAxis(tokens: string[], stats: Record<string, AttrStat>): number {
  if (!tokens.length) return 0;
  const total = tokens.reduce((acc, t) => acc + sat(stats[t]?.weight ?? 0), 0);
  return total / tokens.length;
}

function perAxisNeg(tokens: string[], stats: Record<string, AttrStat>): number {
  if (!tokens.length) return 0;
  const total = tokens.reduce((acc, t) => acc + sat(stats[t]?.weight ?? 0), 0);
  return total / tokens.length;
}

// Check session negative
function hasSessionNeg(tokens: string[], sessionNeg: string[]): boolean {
  return tokens.some(t => sessionNeg.includes(t));
}

export function scoreItem(item: FeedItem, profile: Profile): number {
  const axes = itemTokens(item);
  let score = 0;

  for (const axis of AXIS_KEYS) {
    const tokens = axes[axis] || [];
    score += AXIS_IMPORTANCE[axis] * perAxis(tokens, profile.pos);
    score -= AXIS_IMPORTANCE[axis] * perAxisNeg(tokens, profile.neg) * 0.8;
  }

  // Session negative = hard suppress
  const allTokens = Object.values(axes).flat();
  if (hasSessionNeg(allTokens, profile.sessionNeg)) score -= 5;

  // Market match bonus
  if (item.market.includes(profile.market)) score += TUNING.marketMatchBoost;
  else if (item.market.includes('global')) score += TUNING.globalBoost;

  // Seen penalty (single source of truth)
  if (profile.seenItemIds.includes(item.id)) score -= TUNING.seenPenalty;

  return score;
}

// ── Feed composition ──────────────────────────────────────────────────────

const COMPOSITION = {
  low:  { dominant: 0.80, adjacent: 0.15, exploration: 0.05 },
  mix:  { dominant: 0.60, adjacent: 0.25, exploration: 0.15 },
  high: { dominant: 0.45, adjacent: 0.25, exploration: 0.30 },
};

function topCategories(profile: Profile, n = 3): string[] {
  const catEntries = Object.entries(profile.pos)
    .filter(([k]) => k.startsWith('cat:'))
    .sort((a, b) => b[1].weight - a[1].weight);
  return catEntries.slice(0, n).map(([k]) => k.slice(4));
}

function adjacentCategories(profile: Profile): Set<string> {
  const top = topCategories(profile);
  const adj = new Set<string>();
  for (const cat of top) {
    (TUNING.ADJACENCY[cat] || []).forEach(a => adj.add(a));
  }
  // Remove dominant cats
  top.forEach(c => adj.delete(c));
  return adj;
}

// Exploration: lowest total evidence for the item's category token
function evidenceFor(item: FeedItem, profile: Profile): number {
  return profile.pos[`cat:${item.category}`]?.evidence ?? 0;
}

export function composeFeed(items: FeedItem[], profile: Profile): FeedItem[] {
  const ratios = COMPOSITION[profile.discovery];
  const total = items.length;
  const rng = makeRng(profile.seed);

  const scored = items.map(item => ({ item, score: scoreItem(item, profile) }));
  scored.sort((a, b) => b.score - a.score);

  const dominant: FeedItem[] = [];
  const adjacent: FeedItem[] = [];
  const exploration: FeedItem[] = [];
  const usedIds = new Set<string>();

  const topCats = new Set(topCategories(profile));
  const adjCats = adjacentCategories(profile);

  for (const { item } of scored) {
    if (usedIds.has(item.id)) continue;
    if (topCats.has(item.category) && dominant.length < Math.floor(total * ratios.dominant)) {
      dominant.push(item); usedIds.add(item.id);
    } else if (adjCats.has(item.category) && adjacent.length < Math.floor(total * ratios.adjacent)) {
      adjacent.push(item); usedIds.add(item.id);
    }
  }

  // Exploration: lowest-evidence items not already picked
  const explPool = items
    .filter(i => !usedIds.has(i.id))
    .sort((a, b) => evidenceFor(a, profile) - evidenceFor(b, profile));
  // Shuffle top candidates to add variety
  const explTop = explPool.slice(0, Math.floor(total * ratios.exploration) * 3);
  explTop.sort(() => rng() - 0.5);
  for (const item of explTop) {
    if (exploration.length >= Math.floor(total * ratios.exploration)) break;
    exploration.push(item); usedIds.add(item.id);
  }

  // Fill remainder in score order
  const remainder = scored.map(s => s.item).filter(i => !usedIds.has(i.id));

  return applyDiversityCaps([...dominant, ...adjacent, ...exploration, ...remainder]);
}

function applyDiversityCaps(items: FeedItem[]): FeedItem[] {
  const result: FeedItem[] = [];
  const recentCats: string[] = [];
  const vibeStreak: Record<string, number> = {};
  const deferred: FeedItem[] = [];

  for (const item of items) {
    const last5 = recentCats.slice(-5);
    const catCount = last5.filter(c => c === item.category).length;
    const streak = vibeStreak[item.vibes[0]] || 0;

    if (catCount >= TUNING.maxSameCategoryIn5 || streak >= TUNING.maxSameVibeStreak) {
      deferred.push(item);
    } else {
      result.push(item);
      recentCats.push(item.category);
      item.vibes.forEach(v => { vibeStreak[v] = (vibeStreak[v] || 0) + 1; });
      Object.keys(vibeStreak).forEach(v => { if (!item.vibes.includes(v)) vibeStreak[v] = 0; });
    }
  }
  return [...result, ...deferred];
}

export function rerankTail(feed: FeedItem[], currentIdx: number, profile: Profile): FeedItem[] {
  const pinEnd = currentIdx + 1 + TUNING.pinAhead;
  const head = feed.slice(0, pinEnd);
  const tail = feed.slice(pinEnd);
  const scored = tail.map(i => ({ item: i, score: scoreItem(i, profile) }));
  scored.sort((a, b) => b.score - a.score);
  return [...head, ...applyDiversityCaps(scored.map(s => s.item))];
}

// ── Distinctiveness (for L1-exit option ordering, spec §5.4) ─────────────

export function distinctScore(token: string, profile: Profile): number {
  const evidence = profile.pos[token]?.evidence ?? 0;
  const lastSeen = profile.pos[token]?.lastSeen ?? 0;
  const recencyExposure = profile.cardsViewed > 0 ? lastSeen / profile.cardsViewed : 0;
  return TUNING.W_NOVEL * (1 - recencyExposure) + TUNING.W_GAP * (1 - Math.min(1, evidence / 5));
}

// Build L1-exit options from item tags: most-distinctive-first, axis variety, top 4
export function buildL1ExitOptions(
  item: FeedItem,
  profile: Profile,
  tagLabel: (t: string) => string,
): Array<{ token: string; label: string; score: number }> {
  const axes = itemTokens(item);
  const allTokens: Array<{ token: string; axis: string }> = [];

  for (const [axis, tokens] of Object.entries(axes)) {
    if (axis === 'format' || axis === 'pace') continue; // not useful as options
    for (const t of tokens) {
      // Skip the primary category token (too broad) — keep sub/vibe/region
      if (axis === 'cat' && tokens.length === 1) continue;
      allTokens.push({ token: t, axis });
    }
  }

  const isColdStart = profile.cardsViewed < TUNING.COLDSTART_N;

  const scored = allTokens.map(({ token, axis }) => ({
    token, axis, label: `More ${tagLabel(token)}`,
    score: isColdStart
      ? (axis === 'sub' ? 3 : axis === 'region' ? 2 : 1)  // specific→broad
      : distinctScore(token, profile),
  }));
  scored.sort((a, b) => b.score - a.score);

  // Pick top 4 with axis variety (no more than 2 from same axis)
  const axisCount: Record<string, number> = {};
  const picked: typeof scored = [];
  for (const s of scored) {
    if (picked.length >= 4) break;
    const count = axisCount[s.axis] ?? 0;
    if (count < 2) { picked.push(s); axisCount[s.axis] = count + 1; }
  }

  // Always add the primary category as a broad fallback
  const catToken = `cat:${item.category}`;
  if (!picked.some(p => p.token === catToken)) {
    picked.push({ token: catToken, axis: 'cat', label: `More ${tagLabel(catToken)}`, score: 0 });
  }

  return picked.slice(0, 4);
}

// ── Gap-targeting (for interstitials, spec §6.B) ──────────────────────────
// Returns the total evidence for an axis token (e.g. "cat:food")
export function axisEvidence(axisToken: string, profile: Profile): number {
  return profile.pos[axisToken]?.evidence ?? 0;
}

// ── Explain score (for "Why this?" affordance) ────────────────────────────
export function explainScore(item: FeedItem, profile: Profile, tagLabel: (t: string) => string): Array<{ label: string; contribution: number }> {
  const axes = itemTokens(item);
  const parts: Array<{ label: string; contribution: number }> = [];

  for (const [axis, tokens] of Object.entries(axes)) {
    if (!tokens.length) continue;
    const axisKey = axis as Axis;
    const imp = AXIS_IMPORTANCE[axisKey] ?? 1;
    const posC = perAxis(tokens, profile.pos) * imp;
    const negC = perAxisNeg(tokens, profile.neg) * imp * 0.8;
    const net = posC - negC;
    if (Math.abs(net) > 0.02) {
      const repr = tokens[0];
      parts.push({ label: tagLabel(repr), contribution: parseFloat(net.toFixed(2)) });
    }
  }

  return parts.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)).slice(0, 3);
}
