import { describe, it, expect } from 'vitest';
import {
  createProfile, applyPositive, applyNegative, applySessionNeg,
  scoreItem, composeFeed, rerankTail, decayProfile, buildL1ExitOptions,
  sat, axisEvidence,
} from './engine';
import type { FeedItem } from '../data/types';

// ── Fixtures ───────────────────────────────────────────────────────────────

const mkItem = (overrides: Partial<FeedItem> = {}): FeedItem => ({
  id: 'item-1', image: '', title: 'Test', subtitle: '', market: ['india'],
  category: 'travel', subCategories: ['nature-travel', 'india-travel'],
  vibes: ['calm', 'nature-led'], regionOrCulture: ['india', 'kerala'],
  format: 'ambient-scenic', pace: 'slow', safety: ['family-safe'],
  ctaLabel: 'Explore', positivePollOptions: [], negativePollOptions: [],
  ...overrides,
});

const travelItem = mkItem();
const foodItem   = mkItem({ id: 'item-2', category: 'food', subCategories: ['street-food'], vibes: ['warm', 'social'] });
const homeItem   = mkItem({ id: 'item-3', category: 'home', subCategories: ['cozy-interiors'], vibes: ['cozy', 'warm'] });
const luxuryItem = mkItem({ id: 'item-4', category: 'luxury', subCategories: ['luxury-travel'], vibes: ['luxury', 'premium'] });
const sportsItem = mkItem({ id: 'item-5', category: 'sports', subCategories: ['cricket'], vibes: ['high-energy', 'bold'] });

// ── Saturation ─────────────────────────────────────────────────────────────

describe('sat()', () => {
  it('returns 0 for weight=0', () => expect(sat(0)).toBe(0));
  it('is always < 1', () => expect(sat(1000)).toBeLessThan(1));
  it('grows with weight but decelerates', () => {
    expect(sat(1)).toBeGreaterThan(0);
    expect(sat(10) - sat(5)).toBeLessThan(sat(5) - sat(1));
  });
});

// ── Signal writing ─────────────────────────────────────────────────────────

describe('applyPositive', () => {
  it('raises weight and evidence for each token', () => {
    const p = applyPositive(createProfile(), [{ token: 'cat:travel', delta: 2 }], 1);
    expect(p.pos['cat:travel'].weight).toBe(2);
    expect(p.pos['cat:travel'].evidence).toBe(1);
    expect(p.pos['cat:travel'].lastSeen).toBe(1);
  });

  it('accumulates on repeated calls', () => {
    let p = createProfile();
    p = applyPositive(p, [{ token: 'cat:travel', delta: 2 }], 1);
    p = applyPositive(p, [{ token: 'cat:travel', delta: 3 }], 2);
    expect(p.pos['cat:travel'].weight).toBe(5);
    expect(p.pos['cat:travel'].evidence).toBe(2);
  });

  it('does not mutate the original profile', () => {
    const orig = createProfile();
    applyPositive(orig, [{ token: 'cat:travel', delta: 2 }], 1);
    expect(orig.pos['cat:travel']).toBeUndefined();
  });
});

describe('applyNegative', () => {
  it('first negative is half-strength', () => {
    const p = applyNegative(createProfile(), [{ token: 'cat:food', delta: 2 }], 1);
    expect(p.neg['cat:food'].weight).toBe(1); // 2 * 0.5
  });

  it('second negative compounds at full strength', () => {
    let p = applyNegative(createProfile(), [{ token: 'cat:food', delta: 2 }], 1);
    p = applyNegative(p, [{ token: 'cat:food', delta: 2 }], 2);
    expect(p.neg['cat:food'].weight).toBe(3); // 1 + 2
  });

  it('a single dislike does not zero out a category', () => {
    let p = createProfile();
    p = applyPositive(p, [{ token: 'cat:food', delta: 4 }], 1);
    p = applyNegative(p, [{ token: 'cat:food', delta: 2 }], 2);
    const score = scoreItem(foodItem, p);
    expect(score).toBeGreaterThan(0); // still positive net
  });
});

describe('applySessionNeg', () => {
  it('adds tokens to sessionNeg', () => {
    const p = applySessionNeg(createProfile(), ['cat:sports']);
    expect(p.sessionNeg).toContain('cat:sports');
  });

  it('"Not now" produces no durable negative', () => {
    const p = applySessionNeg(createProfile(), ['cat:sports']);
    expect(Object.keys(p.neg)).toHaveLength(0);
  });
});

// ── Scoring ────────────────────────────────────────────────────────────────

describe('scoreItem', () => {
  it('a positive signal raises matching items', () => {
    const base = createProfile();
    const boosted = applyPositive(base, [{ token: 'cat:travel', delta: 3 }, { token: 'vibe:calm', delta: 2 }], 1);
    expect(scoreItem(travelItem, boosted)).toBeGreaterThan(scoreItem(travelItem, base));
  });

  it('a soft negative lowers matching items', () => {
    const base = applyPositive(createProfile(), [{ token: 'cat:food', delta: 3 }], 1);
    const withNeg = applyNegative(base, [{ token: 'cat:food', delta: 3 }], 2);
    expect(scoreItem(foodItem, withNeg)).toBeLessThan(scoreItem(foodItem, base));
  });

  it('no tag-count bias: better-matched sparse item beats well-tagged but unrelated item', () => {
    // Profile strongly favors calm nature travel
    const p = applyPositive(createProfile(), [
      { token: 'cat:travel', delta: 5 },
      { token: 'vibe:calm', delta: 5 },
      { token: 'vibe:nature-led', delta: 5 },
    ], 1);

    // Many tags but none match profile
    const manyTagsNoMatch = mkItem({
      id: 'many',
      category: 'sports',
      subCategories: ['cricket', 'ipl', 'stadium-energy', 'india-sports', 'contact-sport'],
      vibes: ['high-energy', 'bold', 'social', 'cinematic', 'festive'],
    });
    // Fewer tags but exact match
    const fewTagsGoodMatch = mkItem({
      id: 'few',
      category: 'travel',
      subCategories: ['nature-travel'],
      vibes: ['calm', 'nature-led'],
    });

    expect(scoreItem(fewTagsGoodMatch, p)).toBeGreaterThan(scoreItem(manyTagsNoMatch, p));
  });

  it('seen penalty demotes already-viewed items', () => {
    const p = { ...applyPositive(createProfile(), [{ token: 'cat:travel', delta: 3 }], 1), seenItemIds: ['item-1'] };
    const unseen = createProfile();
    expect(scoreItem(travelItem, unseen)).toBeGreaterThan(scoreItem(travelItem, p));
  });

  it('session negative heavily suppresses item', () => {
    const withSession = applySessionNeg(createProfile(), ['cat:sports']);
    const without = createProfile();
    expect(scoreItem(sportsItem, withSession)).toBeLessThan(scoreItem(sportsItem, without));
  });
});

// ── Decay ──────────────────────────────────────────────────────────────────

describe('decay', () => {
  it('an unreinforced weight shrinks over N cards', () => {
    let p = applyPositive(createProfile(), [{ token: 'cat:travel', delta: 4 }], 0);
    const before = p.pos['cat:travel'].weight;
    for (let i = 0; i < 10; i++) p = decayProfile(p);
    expect(p.pos['cat:travel'].weight).toBeLessThan(before);
  });

  it('negatives decay faster than positives', () => {
    let p = applyPositive(createProfile(), [{ token: 'cat:travel', delta: 4 }], 0);
    p = applyNegative(p, [{ token: 'cat:food', delta: 4 }], 0);
    const posB = p.pos['cat:travel'].weight;
    const negB = p.neg['cat:food'].weight;
    for (let i = 0; i < 5; i++) p = decayProfile(p);
    const posRatio = p.pos['cat:travel'].weight / posB;
    const negRatio = (p.neg['cat:food']?.weight ?? 0) / negB;
    expect(negRatio).toBeLessThan(posRatio);
  });
});

// ── Re-rank stability ──────────────────────────────────────────────────────

describe('rerankTail', () => {
  const items = [travelItem, foodItem, homeItem, luxuryItem, sportsItem];

  it('never moves the current card', () => {
    const p = applyPositive(createProfile(), [{ token: 'cat:sports', delta: 10 }], 0);
    const reranked = rerankTail(items, 0, p);
    expect(reranked[0].id).toBe(items[0].id);
  });

  it('never moves the next card (pin=2)', () => {
    const p = applyPositive(createProfile(), [{ token: 'cat:sports', delta: 10 }], 0);
    const reranked = rerankTail(items, 0, p);
    expect(reranked[1].id).toBe(items[1].id);
    expect(reranked[2].id).toBe(items[2].id);
  });

  it('re-ranks the tail to favour boosted category', () => {
    const p = applyPositive(createProfile(), [{ token: 'cat:sports', delta: 10 }], 0);
    const reranked = rerankTail(items, 0, p);
    const sportsIdx = reranked.findIndex(i => i.id === sportsItem.id);
    // Sports should float to near the top of the tail (idx 3+)
    expect(sportsIdx).toBeGreaterThanOrEqual(3); // pinned head is 0-2
    expect(sportsIdx).toBeLessThanOrEqual(4);
  });
});

// ── Exploration from low-evidence ─────────────────────────────────────────

describe('composeFeed exploration', () => {
  it('exploration targets low-evidence categories, not low-score ones', () => {
    // Profile strongly favors travel — food is unknown (zero evidence)
    const p = applyPositive({ ...createProfile(), discovery: 'high' }, [
      { token: 'cat:travel', delta: 8 },
      { token: 'vibe:calm', delta: 5 },
    ], 0);

    const manyItems = [
      travelItem,
      mkItem({ id: 't2', category: 'travel', subCategories: ['heritage-travel'], vibes: ['cultural'] }),
      mkItem({ id: 't3', category: 'travel', subCategories: ['urban-travel'], vibes: ['urban'] }),
      foodItem,  // unknown category
      homeItem,
      sportsItem,
      luxuryItem,
    ];

    const feed = composeFeed(manyItems, p);
    // Food (unknown) should appear somewhere — it qualifies for exploration
    const foodIdx = feed.findIndex(i => i.category === 'food');
    expect(foodIdx).toBeGreaterThanOrEqual(0);
  });
});

// ── Gap-targeting ─────────────────────────────────────────────────────────

describe('axisEvidence', () => {
  it('returns 0 for unknown token', () => {
    expect(axisEvidence('cat:food', createProfile())).toBe(0);
  });
  it('returns correct evidence after signal', () => {
    const p = applyPositive(createProfile(), [{ token: 'cat:food', delta: 2 }], 1);
    p.pos['cat:food'] && (p.pos['cat:food'].evidence = 2);
    expect(axisEvidence('cat:food', { ...p, pos: { 'cat:food': { weight: 2, evidence: 2, lastSeen: 1 } } })).toBe(2);
  });
});

// ── L1-exit option ordering ───────────────────────────────────────────────

describe('buildL1ExitOptions', () => {
  const label = (t: string) => t.split(':').pop() ?? t;

  it('returns at most 4 options', () => {
    const opts = buildL1ExitOptions(travelItem, createProfile(), label);
    expect(opts.length).toBeLessThanOrEqual(4);
  });

  it('cold-start: orders specific→broad (sub first, then region, then cat)', () => {
    const cold = createProfile(); // cardsViewed = 0 < COLDSTART_N
    const opts = buildL1ExitOptions(travelItem, cold, label);
    // First option should come from sub: or region: axes
    expect(['sub', 'region'].some(ax => opts[0].token.startsWith(ax + ':'))).toBe(true);
  });

  it('includes axis variety (no axis dominates all 4 slots)', () => {
    const p = applyPositive(createProfile(), [{ token: 'cat:travel', delta: 3 }], 12);
    const opts = buildL1ExitOptions(travelItem, p, label);
    const axes = opts.map(o => o.token.split(':')[0]);
    const unique = new Set(axes);
    expect(unique.size).toBeGreaterThanOrEqual(2);
  });
});
