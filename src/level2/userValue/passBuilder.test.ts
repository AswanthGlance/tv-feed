import { describe, it, expect } from 'vitest';
import { semanticEventsToThinkingPasses } from './passBuilder';
import { extractQueryRequirements } from '../classification/queryRequirements';
import type { ScenarioClassification } from '../types/archetype';
import type { SemanticAgentEvent } from '../../types/semanticEvent';
import type { SourcesPayload, CountPayload } from '../types/pass';

/* text_only (and every other non-candidate_ranking archetype) shares this
   generic pass builder. Before this fix, "reading sources" always collapsed
   to a bare status line ("Looking it up") or a naked number ("8 sources
   read") with nothing on screen — see the ThinkingValueRenderers.tsx
   SourcesValue component, which existed but only candidate_ranking's
   dedicated arc (candidateRankingPlan.ts) ever fed it. */

const reqs = extractQueryRequirements('What are the best ramen spots nearby, and what do reviews say?');

const classification: ScenarioClassification = {
  archetype: 'text_only',
  confidence: 'high',
  signals: [],
  hasImages: false,
  hasMapSignals: false,
  hasStructuredData: false,
};

const retrieveEvent = (id: string, sources: Array<{ label: string; url: string }>): SemanticAgentEvent => ({
  id,
  type: 'retrieve',
  sourceSpanIds: [],
  startTime: 0,
  endTime: 0,
  narration: 'Reading web results',
  metadata: { tool: 'WebSearch', sources, facts: sources.map((s) => s.label) },
});

describe('generic pass builder — research phase shows real sources visually', () => {
  it('emits a sources payload (not a bare count) once 2+ distinct web sources resolve', () => {
    const events = [
      retrieveEvent('e1', [
        { label: 'Zomato', url: 'https://www.zomato.com/some-ramen-place' },
        { label: 'TripAdvisor', url: 'https://www.tripadvisor.in/Restaurant_Review-ramen' },
      ]),
    ];

    const { passes } = semanticEventsToThinkingPasses(events, classification, reqs);
    const research = passes.find((p) => p.id === 'pass-1-research')!;

    expect(research.visibility).toBe('canvas_value');
    expect(research.valueType).toBe('sources');
    const payload = research.payload as SourcesPayload;
    expect(payload.sources.map((s) => s.label)).toEqual(['Zomato', 'TripAdvisor']);
    expect(payload.sourceCount).toBe(2);
  });

  it('falls back to a status line when no per-source identity is resolvable', () => {
    const events: SemanticAgentEvent[] = [
      {
        id: 'e1',
        type: 'retrieve',
        sourceSpanIds: [],
        startTime: 0,
        endTime: 0,
        narration: 'Reading web results',
        metadata: { tool: 'WebSearch', resultCount: 1 },
      },
    ];

    const { passes } = semanticEventsToThinkingPasses(events, classification, reqs);
    const research = passes.find((p) => p.id === 'pass-1-research')!;

    expect(research.visibility).toBe('status');
    expect(research.narration).toBe('Looking it up');
  });

  it('still falls back to a count when only a resultCount tally exists (no parseable URLs)', () => {
    const events: SemanticAgentEvent[] = [
      { id: 'e1', type: 'retrieve', sourceSpanIds: [], startTime: 0, endTime: 0, narration: '', metadata: { tool: 'WebSearch', resultCount: 4 } },
    ];

    const { passes } = semanticEventsToThinkingPasses(events, classification, reqs);
    const research = passes.find((p) => p.id === 'pass-1-research')!;

    expect(research.visibility).toBe('canvas_value');
    expect(research.valueType).toBe('count');
    expect((research.payload as CountPayload).value).toBe(4);
  });
});

describe('generic pass builder — narration wording variety (opt-in via rng)', () => {
  it('with no rng, is byte-identical to the canonical copy (every other test in this repo relies on this)', () => {
    const events: SemanticAgentEvent[] = [
      { id: 'e1', type: 'retrieve', sourceSpanIds: [], startTime: 0, endTime: 0, narration: '', metadata: { tool: 'WebSearch' } },
    ];
    const { passes } = semanticEventsToThinkingPasses(events, classification, reqs);
    expect(passes.find((p) => p.id === 'pass-1-research')!.narration).toBe('Looking it up');
  });

  it('with an rng supplied, picks a different (still honest) wording for the same claim', () => {
    const events: SemanticAgentEvent[] = [
      { id: 'e1', type: 'retrieve', sourceSpanIds: [], startTime: 0, endTime: 0, narration: '', metadata: { tool: 'WebSearch' } },
    ];
    // Mid-range rng deterministically lands on the second of 3 variants.
    const { passes } = semanticEventsToThinkingPasses(events, classification, reqs, { rng: () => 0.5 });
    const narration = passes.find((p) => p.id === 'pass-1-research')!.narration;
    expect(narration).not.toBe('Looking it up');
    expect(narration).toBe('Checking on that');
  });
});

/* Sub-beat splitting (subBeats.ts) is an OPT-IN capability — only
   buildScenarioFromHarnessStream.ts ever sets `harnessSubBeats: true`.
   fromTrace.ts (every real Phoenix trace) never sets it, so these tests
   pin down the safety contract explicitly: same multi-event bucket, same
   generic pass builder, and the flag alone decides whether it splits. */
describe('generic pass builder — research sub-beats (harnessSubBeats opt-in)', () => {
  const distinctQueryEvent = (id: string, query: string): SemanticAgentEvent => ({
    id,
    type: 'retrieve',
    sourceSpanIds: [],
    startTime: 0,
    endTime: 0,
    narration: 'Reading up on it', // the generic fallback — forces derivation from `input`
    input: { query },
    metadata: { tool: 'WebSearch', sources: [{ label: 'Source', url: 'https://example.com/a' }], facts: ['Source'] },
  });

  it('does NOT split a multi-call bucket when harnessSubBeats is unset (Phoenix/default safety)', () => {
    const events = [
      distinctQueryEvent('e1', 'Rooftop bar rice lentil fermentation ratio'),
      distinctQueryEvent('e2', 'Rooftop bar cooking technique bronze pot'),
    ];
    const { passes } = semanticEventsToThinkingPasses(events, classification, reqs);
    expect(passes.filter((p) => p.id.startsWith('pass-1-research'))).toHaveLength(1);
    expect(passes.find((p) => p.id === 'pass-1-research')).toBeDefined();
  });

  it('splits into real sub-beats when harnessSubBeats is true and the queries genuinely differ', () => {
    const events = [
      distinctQueryEvent('e1', 'Ramen broth rice lentil fermentation ratio'),
      distinctQueryEvent('e2', 'Ramen broth cooking technique bronze pot'),
    ];
    const { passes } = semanticEventsToThinkingPasses(events, classification, reqs, { harnessSubBeats: true });
    const researchPasses = passes.filter((p) => p.id.startsWith('pass-1-research'));
    expect(researchPasses.length).toBe(2);
    expect(researchPasses[0].narration).not.toBe(researchPasses[1].narration);
    // Cumulative: the second beat's evidence includes the first's too.
    const firstCount = (researchPasses[0].payload as SourcesPayload).sourceCount;
    const secondCount = (researchPasses[1].payload as SourcesPayload).sourceCount;
    expect(secondCount).toBeGreaterThanOrEqual(firstCount);
    // Each beat carries only its OWN event id — this is what lets
    // buildScenarioFromHarnessStream.ts's generic traceTiming-assignment
    // loop give each beat its own real window.
    expect(researchPasses[0].sourceEventIds).toEqual(['e1']);
    expect(researchPasses[1].sourceEventIds).toEqual(['e2']);
  });

  it('never forces a split when harnessSubBeats is true but there is nothing real to distinguish (no input, identical narration)', () => {
    const events: SemanticAgentEvent[] = [
      { id: 'e1', type: 'retrieve', sourceSpanIds: [], startTime: 0, endTime: 0, narration: 'Reading up on it', metadata: { tool: 'WebSearch', sources: [{ label: 'A', url: 'https://a.com' }], facts: ['A'] } },
      { id: 'e2', type: 'retrieve', sourceSpanIds: [], startTime: 0, endTime: 0, narration: 'Reading up on it', metadata: { tool: 'WebSearch', sources: [{ label: 'B', url: 'https://b.com' }], facts: ['B'] } },
    ];
    const { passes } = semanticEventsToThinkingPasses(events, classification, reqs, { harnessSubBeats: true });
    expect(passes.filter((p) => p.id.startsWith('pass-1-research'))).toHaveLength(1);
  });

  it('merges genuinely parallel calls into ONE beat rather than serializing them', () => {
    const events: SemanticAgentEvent[] = [
      { id: 'e1', type: 'retrieve', sourceSpanIds: [], startTime: 0, endTime: 0, narration: 'Reading up on it', input: { query: 'trail conditions weather' }, metadata: { tool: 'WebSearch', parallelGroup: 1, sources: [{ label: 'A', url: 'https://a.com' }], facts: ['A'] } },
      { id: 'e2', type: 'retrieve', sourceSpanIds: [], startTime: 0, endTime: 0, narration: 'Reading up on it', input: { query: 'trail conditions weather' }, metadata: { tool: 'WebSearch', parallelGroup: 1, sources: [{ label: 'B', url: 'https://b.com' }], facts: ['B'] } },
      { id: 'e3', type: 'retrieve', sourceSpanIds: [], startTime: 0, endTime: 0, narration: 'Reading up on it', input: { query: 'permit requirements trailhead' }, metadata: { tool: 'WebSearch', sources: [{ label: 'C', url: 'https://c.com' }], facts: ['C'] } },
    ];
    const { passes } = semanticEventsToThinkingPasses(events, classification, reqs, { harnessSubBeats: true });
    const researchPasses = passes.filter((p) => p.id.startsWith('pass-1-research'));
    expect(researchPasses).toHaveLength(2);
    expect(researchPasses[0].sourceEventIds).toEqual(['e1', 'e2']);
    expect(researchPasses[0].narration.toLowerCase()).toMatch(/angles|parallel/);
  });
});
