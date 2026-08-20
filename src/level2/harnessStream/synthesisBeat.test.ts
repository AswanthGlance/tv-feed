import { describe, it, expect } from 'vitest';
import { buildSynthesisBeat } from './synthesisBeat';
import type { SemanticAgentEvent } from '../../types/semanticEvent';
import type { QueryRequirements } from '../types/query';
import type { ScenarioClassification } from '../types/archetype';
import type { FinalResponseModel } from '../types/finalResponse';

/* The SYNTHESIS beat represents the real gap between the last useful tool
   result and the model finishing the answer — see the header of
   synthesisBeat.ts. These tests pin down: it never fires for a small real
   gap (nothing to narrate), its payload never leaks final content early
   (labels only), and its narration is genuinely contextual, not one fixed
   "putting it together" line for every domain. */

const baseRequirements: QueryRequirements = {
  requestedAttributes: [],
  comparisonIntent: false,
  rankingIntent: false,
  routeIntent: false,
  listIntent: false,
  explanationIntent: false,
  matchedPhrases: [],
};

const classification: ScenarioClassification = {
  archetype: 'structured_no_image',
  confidence: 'low',
  signals: [],
  hasImages: false,
  hasMapSignals: false,
  hasStructuredData: true,
};

function events(lastMeaningfulEnd: number, traceEnd: number): SemanticAgentEvent[] {
  return [
    { id: 'e1', type: 'retrieve', sourceSpanIds: [], startTime: 0, endTime: lastMeaningfulEnd, narration: 'Reading up on it', metadata: {} },
    { id: 'e2', type: 'internal', sourceSpanIds: [], startTime: lastMeaningfulEnd, endTime: traceEnd, narration: 'system', metadata: {} },
  ];
}

const textFinal: FinalResponseModel = { kind: 'text', headline: 'Done', body: ['Some prose.'] };

describe('buildSynthesisBeat — gap threshold', () => {
  it('adds nothing when the real gap is small (nothing genuinely worth narrating)', () => {
    const beats = buildSynthesisBeat({
      events: events(20000, 21500),
      requirements: baseRequirements,
      classification,
      finalResponse: textFinal,
    });
    expect(beats).toHaveLength(0);
  });

  it('adds one beat when the real gap is meaningfully long', () => {
    const beats = buildSynthesisBeat({
      events: events(20000, 33000),
      requirements: baseRequirements,
      classification,
      finalResponse: textFinal,
    });
    expect(beats).toHaveLength(1);
    // No sourceEventIds — deliberately unanchored so schedule.ts's existing
    // "unanchored passes fill the tail window" places it in the real gap.
    expect(beats[0].sourceEventIds).toBeUndefined();
  });
});

describe('buildSynthesisBeat — contextual narration', () => {
  const longGapEvents = events(20000, 33000);

  it('uses recipe-shaped language for a recipe entityType', () => {
    const beats = buildSynthesisBeat({
      events: longGapEvents,
      requirements: { ...baseRequirements, entityType: 'recipe' },
      classification,
      finalResponse: textFinal,
    });
    expect(beats[0].narration.toLowerCase()).toMatch(/recipe/);
  });

  it('falls back to scanning the real prompt when entityType extraction found nothing', () => {
    const beats = buildSynthesisBeat({
      events: longGapEvents,
      requirements: baseRequirements,
      classification,
      finalResponse: textFinal,
      prompt: 'How do I make Thavala Dosai? Give me the full recipe.',
    });
    expect(beats[0].narration.toLowerCase()).toMatch(/recipe/);
  });

  it('uses stay-plan language for a travel entityType', () => {
    const beats = buildSynthesisBeat({
      events: longGapEvents,
      requirements: { ...baseRequirements, entityType: 'stay' },
      classification,
      finalResponse: textFinal,
    });
    expect(beats[0].narration.toLowerCase()).toMatch(/plan/);
  });

  it('falls back to a generic-but-still-contextual line when nothing matches', () => {
    const beats = buildSynthesisBeat({
      events: longGapEvents,
      requirements: baseRequirements,
      classification,
      finalResponse: textFinal,
    });
    expect(beats[0].narration.length).toBeGreaterThan(0);
    expect(beats[0].visibility).toBe('status'); // text final response has no label-like structure to preview
  });
});

describe('buildSynthesisBeat — payload never reveals final content early', () => {
  const longGapEvents = events(20000, 33000);

  it('shows real SECTION LABELS for a structured response, never row content', () => {
    const structured: FinalResponseModel = {
      kind: 'structured',
      headline: 'Recipe',
      columns: ['Group', 'Item', 'Detail'],
      rows: [
        ['Base Batter', 'Rice', '1 cup'],
        ['Base Batter', 'Urad dal', '1/4 cup'],
        ['Preparation Steps', 'Soak', '3-4 hours'],
      ],
    };
    const beats = buildSynthesisBeat({ events: longGapEvents, requirements: baseRequirements, classification, finalResponse: structured });
    expect(beats[0].visibility).toBe('canvas_value');
    const lines = (beats[0].payload as { sections: string[] }).sections;
    expect(lines).toEqual(['Base Batter', 'Preparation Steps']);
    // Never the row content (ingredient quantities) — labels only.
    expect(lines.join(' ')).not.toMatch(/1 cup|Rice|3-4 hours/);
  });

  it('shows real comparison dimension labels, never the values', () => {
    const comparison: FinalResponseModel = {
      kind: 'comparison',
      headline: 'Comparing',
      comparison: {
        subjects: [{ id: 'a', label: 'A' }],
        dimensions: [
          { key: 'price', label: 'Price', values: { a: '₹500' } },
          { key: 'rating', label: 'Rating', values: { a: '4.5' } },
        ],
      },
    };
    const beats = buildSynthesisBeat({ events: longGapEvents, requirements: baseRequirements, classification, finalResponse: comparison });
    const lines = (beats[0].payload as { sections: string[] }).sections;
    expect(lines).toEqual(['Price', 'Rating']);
    expect(lines.join(' ')).not.toMatch(/₹500|4\.5/);
  });

  it('stays narration-only (status) when the archetype has nothing label-like to preview', () => {
    const beats = buildSynthesisBeat({ events: longGapEvents, requirements: baseRequirements, classification, finalResponse: textFinal });
    expect(beats[0].payload).toBeUndefined();
    expect(beats[0].valueType).toBeUndefined();
  });
});
