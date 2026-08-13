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
