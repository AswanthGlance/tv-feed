import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Level2ScenarioRegistry } from './registry';
import { SCENARIO_ARCHETYPES } from '../types/archetype';

/* Registry behaviour that the demo depends on, exercised against the FIXTURE
   path only (`preferSource: 'fixture'`) so these tests never touch the
   network and never depend on Phoenix being reachable — the Phoenix path is
   covered by the pipeline tests in level2.test.ts.

   localStorage does not exist in the node test environment; the cache is
   built to degrade silently in exactly that case, so no stub is needed. Its
   absence is itself part of what these tests confirm. */

describe('scenario registry', () => {
  let registry: Level2ScenarioRegistry;

  beforeEach(() => {
    registry = new Level2ScenarioRegistry();
  });

  it('constructs without storage available', () => {
    expect(() => new Level2ScenarioRegistry()).not.toThrow();
  });

  it('returns a scenario of the requested archetype, for every archetype', async () => {
    for (const archetype of SCENARIO_ARCHETYPES) {
      const selection = await registry.select(archetype, { preferSource: 'fixture' });
      expect(selection, `${archetype} must resolve to something`).toBeDefined();
      expect(selection!.scenario.archetype).toBe(archetype);
    }
  });

  it('keeps Refresh inside the selected archetype', async () => {
    for (const archetype of SCENARIO_ARCHETYPES) {
      for (let i = 0; i < 5; i++) {
        const selection = await registry.select(archetype, { preferSource: 'fixture' });
        expect(selection!.scenario.archetype, `refresh ${i} of ${archetype}`).toBe(archetype);
      }
    }
  });

  it('avoids immediate repetition across consecutive refreshes', async () => {
    const first = await registry.select('candidate_ranking', { preferSource: 'fixture' });
    const second = await registry.select('candidate_ranking', { preferSource: 'fixture' });
    expect(second!.scenario.id).not.toBe(first!.scenario.id);
  });

  it('cycles back round rather than running out', async () => {
    const seen = new Set<string>();
    for (let i = 0; i < 8; i++) {
      const selection = await registry.select('comparison', { preferSource: 'fixture' });
      seen.add(selection!.scenario.id);
    }
    // Three fixtures per archetype: it must reuse them, not return undefined.
    expect(seen.size).toBeGreaterThanOrEqual(2);
  });

  it('reports real-trace availability per archetype honestly', () => {
    const availability = registry.availability();
    expect(availability).toHaveLength(SCENARIO_ARCHETYPES.length);
    for (const row of availability) {
      expect(row.fixtureCount).toBeGreaterThanOrEqual(3);
      expect(row.realTraceCount).toBeGreaterThanOrEqual(0);
    }
  });

  it('falls back instead of throwing when Phoenix fails', async () => {
    const client = await import('../../api/phoenixClient');
    const spy = vi.spyOn(client, 'fetchSpansForTrace').mockRejectedValue(new Error('network down'));

    const selection = await registry.select('candidate_ranking');
    expect(selection).toBeDefined();
    // candidate_ranking has real harness_stream captures, which sit ahead of
    // hand-authored fixtures in the priority chain (phoenix -> cached_phoenix
    // -> harness_stream -> fixture) — so the fallback lands there, not on a
    // fixture, but must never be 'phoenix'/'cached_phoenix' once fetching fails.
    expect(['harness_stream', 'fixture']).toContain(selection!.scenario.source);
    expect(selection!.usedFallback).toBe(true);
    // The failure is recorded, not swallowed — the dev panel shows this trail.
    expect(selection!.fallbackNotes.join(' ')).toContain('network down');

    spy.mockRestore();
  });
});
