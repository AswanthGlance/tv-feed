import { describe, expect, it } from 'vitest';
import { dedupeCandidates, isSameCandidate, isValidCandidate, resolveCandidateSet } from './candidateResolution';
import { checkDiscoveryInvariants } from './discoveryInvariants';
import { extractCandidateObjects } from '../../utils/safeJson';
import type { NormalizedEntity } from '../types/entity';
import type { ThinkingPass } from '../types/pass';

/* Real-trace shapes throughout — the ids in comments are live Phoenix traces
   the discovery-sync failures were reproduced against. */

const e = (id: string, title: string, extra: Partial<NormalizedEntity> = {}): NormalizedEntity => ({
  id,
  type: 'place',
  title,
  ...extra,
});

describe('candidate validity', () => {
  it('requires only a stable id and a meaningful title — never image or coordinates', () => {
    expect(isValidCandidate(e('a', 'River A'))).toBe(true);
    expect(isValidCandidate(e('a', '  '))).toBe(false);
    expect(isValidCandidate({ id: 'a', type: 'place' })).toBe(false);
  });
});

describe('candidate identity', () => {
  it('matches by place_id first', () => {
    expect(isSameCandidate(e('a', 'Completely Different', { externalId: 'X' }), e('b', 'Names', { externalId: 'X' }))).toBe(true);
    expect(isSameCandidate(e('a', 'Same Name', { externalId: 'X' }), e('b', 'Same Name', { externalId: 'Y' }))).toBe(false);
  });

  it('matches title containment for long keys — the real PlaceDetails vs final-card pair', () => {
    // trace 793f9a2f…: enrichment "Himalayan Tiger Adventure Rishikesh" vs
    // final card "Himalayan Tiger Adventure".
    expect(isSameCandidate(e('a', 'Himalayan Tiger Adventure Rishikesh'), e('b', 'Himalayan Tiger Adventure'))).toBe(true);
    expect(isSameCandidate(e('a', 'Goa'), e('b', 'Goa Beach Shack Crawl'))).toBe(false);
  });

  it('dedupes on identity, not object equality', () => {
    const out = dedupeCandidates([e('a', 'Kanha Tiger Reserve', { externalId: 'P1' }), e('b', 'Kanha Tiger Reserve', { externalId: 'P1' })]);
    expect(out).toHaveLength(1);
  });
});

describe('resolveCandidateSet', () => {
  const finals = [e('f1', 'Ganga, Rishikesh'), e('f2', 'Beas, Kullu-Manali'), e('f3', 'Barapole, Coorg'), e('f4', 'Cauvery, Dubare'), e('f5', 'Sharavati, Jog Falls')];

  it('backfills from the final response when discovery extraction lost everything (trace 54e92fc9…)', () => {
    const r = resolveCandidateSet({ observed: [], finalEntities: finals });
    expect(r.visible.map((v) => v.title)).toEqual(finals.map((f) => f.title));
    expect(r.entitySource).toBe('final_response_backfill');
    expect(r.diagnostics.finalResponseExtracted).toBe(5);
  });

  it('prefers the final set and order for comparisons, merging observed data in (trace b5463ca8…)', () => {
    const observed = [
      e('o1', 'Periyar National Park', { rating: 4.6 }), // explored, then dropped by the agent
      e('o2', 'Kanha Tiger Reserve', { rating: 4.7, image: 'https://x/kanha.jpg' }),
      e('o3', 'Ranthambore National Park', { rating: 4.5 }),
    ];
    const sanctuaryFinals = [e('f1', 'Ranthambore National Park'), e('f2', 'Kanha Tiger Reserve'), e('f3', 'Bandipur National Park'), e('f4', 'Sariska Tiger Reserve')];
    const r = resolveCandidateSet({ observed, finalEntities: sanctuaryFinals, preferFinalIdentity: true });

    expect(r.visible).toHaveLength(4); // narration will therefore say 4 — never 5 or 6
    expect(r.visible[0].title).toBe('Ranthambore National Park');
    expect(r.visible[0].rating).toBe(4.5); // learned during the run, kept
    expect(r.visible[1].image).toBe('https://x/kanha.jpg');
    expect(r.entitySource).toBe('merged');
    expect(r.subsetSource).toBe('inferred_from_final_order');
    expect(r.diagnostics.droppedTitles).toContain('Periyar National Park');
  });

  it('keeps discovery order when observation succeeded and the final set is an unrelated vocabulary', () => {
    const observed = [e('o1', 'Blue Sneaker Pro'), e('o2', 'Red Runner X')];
    const r = resolveCandidateSet({ observed, finalEntities: [e('f1', 'Sizing Guide Alpha'), e('f2', 'Style Tips Beta')] });
    expect(r.visible.map((v) => v.title)).toEqual(['Blue Sneaker Pro', 'Red Runner X']);
    expect(r.entitySource).toBe('discovery');
  });

  it('never requires image or coordinates for visibility, but reports their availability', () => {
    const r = resolveCandidateSet({ observed: [], finalEntities: finals });
    expect(r.visible).toHaveLength(5);
    expect(r.diagnostics.imagesAvailable).toBe(0);
    expect(r.diagnostics.coordinatesAvailable).toBe(0);
  });

  it('caps the visible set and records the overflow as dropped', () => {
    const many = Array.from({ length: 9 }, (_, i) => e(`f${i}`, `Option ${i + 1}`));
    const r = resolveCandidateSet({ observed: [], finalEntities: many });
    expect(r.visible).toHaveLength(6);
    expect(r.canonical).toHaveLength(9);
    expect(r.diagnostics.droppedTitles).toHaveLength(3);
  });
});

describe('discovery invariants', () => {
  const pass = (over: Partial<ThinkingPass>): ThinkingPass => ({
    id: 'p',
    visibility: 'canvas_value',
    narration: '',
    enterDuration: 0,
    holdDuration: 0,
    exitDuration: 0,
    ...over,
  });

  it('flags a countable claim with no rendered entities', () => {
    const w = checkDiscoveryInvariants([pass({ narration: 'Found 5 promising rivers', valueType: 'entity_preview', payload: { entities: [] } })]);
    expect(w).toHaveLength(1);
    expect(w[0].kind).toBe('DISCOVERY_VISUAL_MISSING');
  });

  it('flags a claim whose count disagrees with the rendered set', () => {
    const w = checkDiscoveryInvariants([
      pass({ narration: 'Found 4 promising sanctuaries', valueType: 'entity_preview', payload: { entities: [e('a', 'A'), e('b', 'B'), e('c', 'C'), e('d', 'D'), e('x', 'E'), e('y', 'F')] } }),
    ]);
    expect(w).toHaveLength(1);
    expect(w[0].kind).toBe('DISCOVERY_COUNT_MISMATCH');
    expect(w[0].narrationCount).toBe(4);
    expect(w[0].renderedCount).toBe(6);
  });

  it('flags a later pass that grows the canvas past the last claimed count — the historical enrich bug', () => {
    const four = [e('a', 'A'), e('b', 'B'), e('c', 'C'), e('d', 'D')];
    const item = (id: string) => ({ id, type: 'place' as const, title: id, state: 'discovered' as const, metadata: {} });
    const w = checkDiscoveryInvariants([
      pass({
        narration: 'Found 4 promising sanctuaries',
        valueType: 'entity_preview',
        payload: { entities: four, canvas: [{ type: 'ADD_ITEMS', items: four.map((x) => item(x.id)) }] },
      }),
      pass({
        id: 'p2',
        narration: 'Checking the details',
        valueType: 'entity_preview',
        payload: { entities: four, canvas: [{ type: 'ADD_ITEMS', items: [item('extra-1'), item('extra-2')] }] },
      }),
    ]);
    expect(w.map((x) => x.kind)).toEqual(['DISCOVERY_CANVAS_DRIFT']);
  });

  it('stays silent when narration and canvas agree', () => {
    const five = Array.from({ length: 5 }, (_, i) => e(`e${i}`, `E${i}`));
    const w = checkDiscoveryInvariants([pass({ narration: 'Spotted 5 promising operators', valueType: 'entity_preview', payload: { entities: five } })]);
    expect(w).toHaveLength(0);
  });
});

describe('extractCandidateObjects on truncated wrappers', () => {
  it('recovers completed inner objects when the wrapper never closes — the 2000-char PlaceSearch cut', () => {
    const raw = '{"query": "rafting", "total_results": 10, "places": [{"place_id": "A", "name": "Alpha"}, {"place_id": "B", "name": "Beta"}, {"place_id": "C", "name": "Gam';
    const objects = extractCandidateObjects(raw);
    expect(objects).toHaveLength(2);
    expect(objects[0]).toContain('Alpha');
    expect(objects[1]).toContain('Beta');
  });

  it('still returns results, not their sub-objects, for a bare array with nested fields', () => {
    const raw = '[{"name": "One", "geo": {"lat": 1, "lng": 2}}, {"name": "Two", "geo": {"lat": 3, "lng": 4}}]';
    const objects = extractCandidateObjects(raw);
    expect(objects).toHaveLength(2);
    expect(objects[0]).toContain('"name": "One"');
  });

  it('returns the inner results of a complete wrapper', () => {
    const raw = '{"places": [{"name": "One"}, {"name": "Two"}]}';
    expect(extractCandidateObjects(raw)).toHaveLength(2);
  });
});
