import { describe, it, expect } from 'vitest';
import { buildCandidateRankingPasses } from './candidateRankingPlan';
import { extractQueryRequirements } from '../classification/queryRequirements';
import { readableSourceLabel, registrableDomain } from '../phoenix/sources';
import type { NormalizedEntity } from '../types/entity';
import type { EntityPreviewPayload, SourcesPayload, ThinkingPass } from '../types/pass';

/* The candidate-ranking arc's product guarantees, as assertions. The failure
   this iteration fixed — the agent claiming "Found 5 promising venues" over an
   empty canvas — is a test now, so it cannot come back silently. */

const PROMPT = 'Find the best cocktail bars near me tonight. Include ratings, price for two and timings.';
const reqs = extractQueryRequirements(PROMPT);

const entity = (id: string, over: Partial<NormalizedEntity> = {}): NormalizedEntity => ({
  id,
  type: 'generic',
  title: `Venue ${id}`,
  rating: 4.5,
  price: '₹1,200 for two',
  availability: 'Open till 12am',
  ...over,
});

const build = (n: number, over: Partial<Parameters<typeof buildCandidateRankingPasses>[0]> = {}) =>
  buildCandidateRankingPasses({
    events: [],
    entities: Array.from({ length: n }, (_, i) => entity(`e${i}`)),
    requirements: reqs,
    sourceEvidence: { sources: [{ label: 'Zomato', kind: 'web' }, { label: 'Google Maps', kind: 'maps' }], sourceCount: 9, searchCount: 4 },
    ...over,
  });

const canvasOf = (pass: ThinkingPass) => (pass.payload as EntityPreviewPayload | undefined)?.canvas ?? [];
const addedCount = (passes: ThinkingPass[]) =>
  passes.flatMap(canvasOf).filter((m) => m.type === 'ADD_ITEMS').flatMap((m) => (m.type === 'ADD_ITEMS' ? m.items : [])).length;

describe('candidate ranking — every claim has visual evidence', () => {
  it('shows exactly as many tiles as the "found" sentence claims', () => {
    for (const n of [3, 5]) {
      const passes = build(n);
      const found = passes.find((p) => p.narration.startsWith('Found'))!;
      expect(found.narration).toContain(String(n));
      expect(addedCount(passes)).toBe(n);
    }
  });

  it('never makes a countable claim with no payload behind it', () => {
    for (const pass of build(5)) {
      if (/\d/.test(pass.narration) && pass.id !== 'cr-1-acknowledge') {
        expect(pass.visibility, `"${pass.narration}" states a number`).toBe('canvas_value');
        expect(pass.payload).toBeDefined();
      }
    }
  });

  it('matches the "N stand out" sentence to the shortlist it renders', () => {
    const passes = build(5);
    const narrow = passes.find((p) => p.id === 'cr-6-narrow')!;
    const shortlist = canvasOf(narrow).find((m) => m.type === 'SHORTLIST_ITEMS');
    expect(shortlist?.type === 'SHORTLIST_ITEMS' && shortlist.ids.length).toBe(3);
    expect(narrow.narration).toBe('3 stand out');
  });

  it('runs the arc in order, with one compare beat per supported dimension', () => {
    expect(build(5).map((p) => p.id)).toEqual([
      'cr-1-acknowledge',
      'cr-2-sources',
      'cr-3-found',
      'cr-4-enrich',
      'cr-5-compare-price',
      'cr-5-compare-availability',
      'cr-5-compare-rating',
      'cr-6-narrow',
      'cr-7-complete',
    ]);
  });
});

/* ── COMPARISON MODE ──────────────────────────────────────────────────────
   The guarantees that make "the agent is comparing" readable rather than
   merely animated. */
const comparisonsOf = (passes: ThinkingPass[]) =>
  passes
    .map((p) => (p.payload as EntityPreviewPayload | undefined)?.comparison)
    .filter((c): c is NonNullable<typeof c> => !!c);

describe('candidate ranking — comparison inspects one dimension at a time', () => {
  it('emits a separate beat per dimension, never one combined table', () => {
    const comparisons = comparisonsOf(build(5));
    expect(comparisons.map((c) => c.key)).toEqual(['price', 'availability', 'rating']);
    for (const c of comparisons) expect(c.stepCount).toBe(3);
    expect(comparisons.map((c) => c.step)).toEqual([0, 1, 2]);
  });

  it('names the dimension in the narration and on the card face, consistently', () => {
    const passes = build(5);
    const price = passes.find((p) => p.id === 'cr-5-compare-price')!;
    expect(price.narration).toBe('Comparing prices');
    expect((price.payload as EntityPreviewPayload).comparison!.label).toBe('Price');
    expect(passes.find((p) => p.id === 'cr-5-compare-rating')!.narration).toBe('Looking at ratings');
    expect(passes.find((p) => p.id === 'cr-5-compare-availability')!.narration).toBe('Checking availability');
  });

  it('never emphasises a candidate during comparison — the dimension is the subject', () => {
    for (const pass of build(5).filter((p) => p.id.startsWith('cr-5-compare-'))) {
      expect((pass.payload as EntityPreviewPayload).emphasisIds).toBeUndefined();
    }
  });

  it('carries no canvas mutation, so the same tiles persist untouched', () => {
    for (const pass of build(5).filter((p) => p.id.startsWith('cr-5-compare-'))) {
      expect(canvasOf(pass)).toHaveLength(0);
    }
  });

  it('holds every comparison beat inside the readable budget', () => {
    for (const pass of build(5).filter((p) => p.id.startsWith('cr-5-compare-'))) {
      const total = pass.enterDuration + pass.holdDuration + pass.exitDuration;
      expect(total).toBeGreaterThanOrEqual(1500);
      expect(total).toBeLessThanOrEqual(4000);
    }
  });

  it('scans identically at 3, 5 and 8 candidates', () => {
    for (const n of [3, 5, 8]) {
      const comparisons = comparisonsOf(build(n));
      expect(comparisons.map((c) => c.key)).toEqual(['price', 'availability', 'rating']);
    }
  });
});

describe('candidate ranking — comparison never invents a value', () => {
  const mixed = [
    entity('m1', { price: '₹800 for two' }),
    entity('m2', { price: undefined }),
    entity('m3', { availability: undefined }),
    entity('m4'),
  ];

  it('omits the id rather than filling a gap, and keeps the candidate in the set', () => {
    const price = comparisonsOf(build(0, { entities: mixed })).find((c) => c.key === 'price')!;
    expect(price.values.m2).toBeUndefined();
    expect(Object.keys(price.values).sort()).toEqual(['m1', 'm3', 'm4']);
    // m2 is still a candidate — the canvas renders it with an em dash.
    expect(addedCount(build(0, { entities: mixed }))).toBe(4);
  });

  it('still compares availability when one candidate lacks it', () => {
    const availability = comparisonsOf(build(0, { entities: mixed })).find((c) => c.key === 'availability')!;
    expect(availability.values.m3).toBeUndefined();
    expect(availability.values.m1).toEqual({ display: 'Open till 12am' });
  });

  it('leads with the figure and keeps its qualifier, without editing either', () => {
    const price = comparisonsOf(build(0, { entities: mixed })).find((c) => c.key === 'price')!;
    // '₹800 for two' -> the number leads, the unit follows quietly. Both halves
    // come from the source string; nothing is dropped and nothing is added.
    expect(price.values.m1).toEqual({ display: '₹800', note: 'for two' });
    expect(price.scale).toBe('numeric');
    expect(comparisonsOf(build(5)).find((c) => c.key === 'availability')!.scale).toBe('text');
  });

  it('drops a dimension only one candidate carries — that is a lookup, not a comparison', () => {
    const only = [entity('o1', { price: '₹500' }), entity('o2', { price: undefined }), entity('o3', { price: undefined })];
    expect(comparisonsOf(build(0, { entities: only })).some((c) => c.key === 'price')).toBe(false);
  });

  it('falls back to a generic compare beat when no dimension is supported', () => {
    const bare = Array.from({ length: 5 }, (_, i) =>
      entity(`b${i}`, { price: undefined, availability: undefined, rating: undefined })
    );
    const passes = build(0, { entities: bare });
    expect(comparisonsOf(passes)).toHaveLength(0);
    const compare = passes.find((p) => p.id === 'cr-5-compare')!;
    expect(compare.narration).toBe('Comparing what fits best');
  });
});

describe('candidate ranking — a leader is a claim that needs proof', () => {
  it('names the lowest price only when every candidate is comparable in the same unit', () => {
    const priced = ['₹900 for two', '₹700 for two', '₹1,300 for two'].map((price, i) => entity(`p${i}`, { price }));
    const price = comparisonsOf(build(0, { entities: priced })).find((c) => c.key === 'price')!;
    expect(price.leaderIds).toEqual(['p1']);
    expect(price.leaderLabel).toBe('Lowest');
  });

  it('withholds the claim when the prices are quoted in different units', () => {
    const mixedUnits = [
      entity('u0', { price: '₹900 for two' }),
      entity('u1', { price: '₹700 per person' }),
      entity('u2', { price: '₹1,300 for two' }),
    ];
    expect(comparisonsOf(build(0, { entities: mixedUnits })).find((c) => c.key === 'price')!.leaderIds).toBeUndefined();
  });

  it('withholds the claim when a candidate has no value — the missing one could be the leader', () => {
    const gap = [entity('g0', { price: '₹900' }), entity('g1', { price: '₹700' }), entity('g2', { price: undefined })];
    expect(comparisonsOf(build(0, { entities: gap })).find((c) => c.key === 'price')!.leaderIds).toBeUndefined();
  });

  it('withholds the claim on a tie', () => {
    const tied = [4.8, 4.8, 4.2].map((rating, i) => entity(`t${i}`, { rating }));
    const rating = comparisonsOf(build(0, { entities: tied })).find((c) => c.key === 'rating')!;
    expect(rating.leaderIds).toBeUndefined();
  });

  it('names the field the way the prompt did — a trekking window is a season, not availability', () => {
    const seasonReqs = extractQueryRequirements('Find the best beginner Himalayan treks. Include ratings, price and the best season.');
    const treks = ['Dec–Mar', 'Jun–Sep', 'Dec–Feb'].map((availability, i) => entity(`s${i}`, { availability }));
    const passes = buildCandidateRankingPasses({
      events: [],
      entities: treks,
      requirements: seasonReqs,
      sourceEvidence: { sources: [{ label: 'Indiahikes', kind: 'web' }, { label: 'Google Maps', kind: 'maps' }], sourceCount: 9, searchCount: 3 },
    });
    const season = comparisonsOf(passes).find((c) => c.key === 'availability')!;
    expect(season.label).toBe('Season');
    expect(passes.find((p) => p.id === 'cr-5-compare-availability')!.narration).toBe('Checking the season');
  });

  it('never claims a leader on availability — the values share no scale', () => {
    const availability = comparisonsOf(build(5)).find((c) => c.key === 'availability')!;
    expect(availability.leaderIds).toBeUndefined();
    expect(availability.leaderLabel).toBeUndefined();
  });
});

describe('candidate ranking — honest omission', () => {
  it('drops the narrowing pass when there is nothing to narrow from', () => {
    // Three candidates: "3 stand out" would be a claim about all of them.
    expect(build(3).some((p) => p.id === 'cr-6-narrow')).toBe(false);
  });

  it('drops the sources pass entirely rather than claim breadth from one web source', () => {
    const passes = build(5, { sourceEvidence: { sources: [{ label: 'Zomato', kind: 'web' }], sourceCount: 1, searchCount: 1 } });
    expect(passes.some((p) => p.id === 'cr-2-sources')).toBe(false);
  });

  it('says what it actually did when only the map provider was used', () => {
    const passes = build(5, { sourceEvidence: { sources: [{ label: 'Google Maps', kind: 'maps' }], sourceCount: 1, searchCount: 1 } });
    const sources = passes.find((p) => p.id === 'cr-2-sources')!;
    expect(sources.narration).toBe('Checking places nearby on the map');
    expect(sources.narration).not.toContain('few angles');
  });

  it('scales the breadth claim to the evidence', () => {
    const few = build(5, { sourceEvidence: { sources: [{ label: 'A', kind: 'web' }, { label: 'B', kind: 'web' }], sourceCount: 2, searchCount: 1 } });
    expect(few.find((p) => p.id === 'cr-2-sources')!.narration).toBe('Cross-checking a couple of sources');
  });

  it('only names attributes the candidates actually carry', () => {
    const passes = build(5, { entities: [entity('a', { price: undefined, availability: undefined }), entity('b', { price: undefined, availability: undefined })] });
    const enrich = passes.find((p) => p.id === 'cr-4-enrich');
    expect(enrich?.narration).toBe('Checking ratings');
  });
});

describe('candidate ranking — thinking never decides', () => {
  it('never promotes a candidate during thinking', () => {
    expect(build(5).flatMap(canvasOf).some((m) => m.type === 'PROMOTE_ITEM')).toBe(false);
  });

  it('never negates a candidate without a stated reason', () => {
    expect(build(5).flatMap(canvasOf).some((m) => m.type === 'NEGATE_ITEMS')).toBe(false);
  });

  it('puts the trace-derived winner first among the standouts, never invents one', () => {
    const passes = build(5, { winnerId: 'e4' });
    const narrow = passes.find((p) => p.id === 'cr-6-narrow')!;
    expect((narrow.payload as EntityPreviewPayload).emphasisIds?.[0]).toBe('e4');
  });
});

describe('candidate ranking — scale and robustness', () => {
  it('caps the canvas at a scannable count when the trace returns more', () => {
    const passes = build(9);
    expect(addedCount(passes)).toBeLessThanOrEqual(6);
    // The sentence must match what is shown, never the raw candidate count.
    expect(passes.find((p) => p.id === 'cr-3-found')!.narration).toContain(String(addedCount(passes)));
  });

  it('works with no images at all', () => {
    const passes = build(5, { entities: Array.from({ length: 5 }, (_, i) => entity(`n${i}`, { image: undefined })) });
    const items = passes.flatMap(canvasOf).filter((m) => m.type === 'ADD_ITEMS').flatMap((m) => (m.type === 'ADD_ITEMS' ? m.items : []));
    expect(items).toHaveLength(5);
    expect(items.every((it) => !it.image && !!it.title)).toBe(true);
  });

  it('keeps every pass inside a readable time budget', () => {
    for (const pass of build(5)) {
      const total = pass.enterDuration + pass.holdDuration + pass.exitDuration;
      expect(total).toBeGreaterThanOrEqual(1500);
      expect(total).toBeLessThanOrEqual(4000);
    }
  });

  it('states a source count the chips can back up', () => {
    const sources = build(5).find((p) => p.id === 'cr-2-sources')!.payload as SourcesPayload;
    expect(sources.sourceCount).toBeGreaterThanOrEqual(sources.sources.length);
  });
});

describe('source identity', () => {
  it('reduces a long real subdomain to its registrable domain', () => {
    expect(registrableDomain('venus-rooftop-restro-cafe--best-rooftop-cafe-in-ahmedabad.localoria.com')).toBe('localoria.com');
    expect(registrableDomain('www.tripadvisor.in')).toBe('tripadvisor.in');
    expect(registrableDomain('shop.example.co.in')).toBe('example.co.in');
  });

  it('never emits a raw URL, and names known brands properly', () => {
    expect(readableSourceLabel('tripadvisor.in')).toBe('TripAdvisor');
    expect(readableSourceLabel('eazydiner.com')).toBe('EazyDiner');
    expect(readableSourceLabel('somewhereelse.com')).not.toMatch(/https?:|\.com/);
  });

  it("recognises a venue's own site instead of title-casing its domain", () => {
    expect(readableSourceLabel('tentrooftoprestrocafe.com', ['Tent Rooftop Restro & Cafe'])).toBe('Venue site');
  });
});
