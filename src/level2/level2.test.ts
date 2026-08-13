import { describe, it, expect } from 'vitest';

import { deepParseJsonStrings, extractImage, extractRating, extractReviewCount, extractUrl, safeJsonParse } from './normalization/normalize';
import { parseResponseEnvelope } from './normalization/responseEnvelope';
import { classifyCardRole, partitionEnvelope } from './classification/entityRole';
import { extractQueryRequirements } from './classification/queryRequirements';
import { classifyTraceScenario, type TraceSummary } from './classification/scenarioClassifier';
import { classifyEventVisibility } from './userValue/visibility';
import { semanticEventsToThinkingPasses } from './userValue/passBuilder';
import { buildFinalResponse, deriveWinner } from './finalResponse/buildFinalResponse';
import { FIXTURE_SCENARIOS } from './scenarios/fixtures';
import { SCENARIO_ARCHETYPES } from './types/archetype';
import type { SemanticAgentEvent } from '../types/semanticEvent';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — unit tests.

   The fixtures below are shaped after REAL payloads observed in the
   aitv-mewtwo-harness corpus (the `<place_card>` envelope, the 'Before You Go'
   non-entity card, the `<bullets><point>` dimension card, the truncated
   tool.output) rather than invented conveniently-parseable ones. Tests that
   only exercise clean data would not have caught any of the bugs these rules
   exist to prevent.
   ───────────────────────────────────────────────────────────────────────────── */

const summary = (over: Partial<TraceSummary> = {}): TraceSummary => ({
  traceId: 't1',
  prompt: '',
  output: '',
  toolSequence: [],
  skills: [],
  toolCallCount: 0,
  ...over,
});

describe('safe JSON parsing / normalization', () => {
  it('returns undefined instead of throwing on malformed input', () => {
    expect(safeJsonParse('{ not json')).toBeUndefined();
    expect(safeJsonParse(undefined)).toBeUndefined();
    expect(safeJsonParse('plain text')).toBeUndefined();
  });

  it('tolerates raw control characters inside string values', () => {
    // Real tool.output payloads embed literal newlines inside review text.
    const parsed = safeJsonParse<{ text: string }>('{"text": "line one\nline two"}');
    expect(parsed?.text).toContain('line one');
  });

  it('parses JSON strings nested inside already-parsed objects', () => {
    const result = deepParseJsonStrings({ wrapper: '{"inner": {"value": 7}}' }) as { wrapper: { inner: { value: number } } };
    expect(result.wrapper.inner.value).toBe(7);
  });

  it('unwraps a markdown link body, which is how <cta> is written', () => {
    expect(extractUrl('[🎟️ Book Tickets](https://district.in/e/123)')).toBe('https://district.in/e/123');
  });

  it('never returns an image it cannot find, and never invents one', () => {
    expect(extractImage({ name: 'A place', rating: 4.5 })).toBeUndefined();
    expect(extractImage({ photo_url: 'https://cdn.example.com/a.jpg' })).toBe('https://cdn.example.com/a.jpg');
  });

  it('rejects a review count masquerading as a rating', () => {
    expect(extractRating('4.6★ · 120 reviews')).toBe(4.6);
    expect(extractRating(1566)).toBeUndefined();
    expect(extractReviewCount('4.8★ (3.5k+ Reviews)')).toBe(3500);
  });
});

describe('response envelope parsing', () => {
  const placeCard = `
    <place_card>
      <summary>Two top storytelling experiences.</summary>
      <panel><section title="Tonight">
        <card title="Ghar Open Mic">
          <badge>Top Pick</badge><price>₹300 onwards</price>
          <why>A warm, chit-based open mic.</why>
          <rating>4.6★ · 120 reviews</rating>
          <visual query="open mic" title="Ghar" place_id="ChIJabc"/>
          <cta>[🎟️ Book](https://district.in/x)</cta>
        </card>
        <card title="Before You Go">
          <why>Both events require advance booking.</why>
        </card>
      </section></panel>
    </place_card>
    <suggestions><chip>Get directions</chip></suggestions>`;

  it('parses cards, summary and chips out of a real place_card envelope', () => {
    const envelope = parseResponseEnvelope(placeCard);
    expect(envelope.shape).toBe('place_card');
    expect(envelope.summary).toContain('storytelling');
    expect(envelope.cards).toHaveLength(2);
    expect(envelope.chips).toEqual(['Get directions']);
    expect(envelope.cards[0].placeId).toBe('ChIJabc');
  });

  it('keeps prose that precedes a structured block', () => {
    const envelope = parseResponseEnvelope(`I found some great options for you! ${placeCard}`);
    expect(envelope.prose.join(' ')).toContain('I found some great options');
  });

  it('parses product_ids lines', () => {
    const envelope = parseResponseEnvelope('<product_ids>\nabc-1: Red Tape classic | Timeless red style\n</product_ids>');
    expect(envelope.shape).toBe('product_ids');
    expect(envelope.products[0]).toMatchObject({ id: 'abc-1', title: 'Red Tape classic', note: 'Timeless red style' });
  });
});

describe('entity vs attribute vs supporting', () => {
  it('never lets a supporting card become a peer candidate', () => {
    const envelope = parseResponseEnvelope(
      '<place_card><panel><section><card title="Booking Tips"><why>Book ahead.</why></card></section></panel></place_card>'
    );
    expect(classifyCardRole(envelope.cards[0])).toBe('supporting');
    expect(partitionEnvelope(envelope).entities).toHaveLength(0);
    expect(partitionEnvelope(envelope).supporting).toHaveLength(1);
  });

  it('treats a bullets breakdown as a dimension, not a candidate', () => {
    const envelope = parseResponseEnvelope(
      '<place_card><panel><section><card title="Altitude &amp; Flight Time"><bullets><point>Bir Billing: 2,400m</point></bullets></card></section></panel></place_card>'
    );
    expect(classifyCardRole(envelope.cards[0])).toBe('attribute');
  });

  it('admits a card that carries a real entity signal', () => {
    const envelope = parseResponseEnvelope(
      '<place_card><panel><section><card title="Toit"><rating>4.5★ · 100 reviews</rating></card></section></panel></place_card>'
    );
    expect(classifyCardRole(envelope.cards[0])).toBe('entity');
  });

  it('keeps supporting content rather than discarding it', () => {
    const envelope = parseResponseEnvelope(
      '<place_card><panel><section><card title="Toit"><price>₹1600</price></card><card title="Before You Go"><why>Arrive early.</why></card></section></panel></place_card>'
    );
    const { entities, supporting } = partitionEnvelope(envelope);
    expect(entities).toHaveLength(1);
    expect(supporting[0].lines).toContain('Arrive early.');
  });
});

describe('query requirements', () => {
  it('extracts requested attributes and ranking intent from a real harness prompt', () => {
    const reqs = extractQueryRequirements(
      'Find top-rated storytelling nights near me showing tonight or this weekend. Include venue name, locality, show timings, ratings, price per person, and what each venue is known for. Return a concise shortlist.'
    );
    expect(reqs.entityType).toBe('venue');
    expect(reqs.requestedAttributes).toEqual(expect.arrayContaining(['rating', 'price', 'location', 'availability', 'rationale']));
    expect(reqs.rankingIntent).toBe(true);
    // 'find the best X' is a ranking request that happens to contain a list verb.
    expect(reqs.listIntent).toBe(false);
  });

  it('separates comparison from ranking', () => {
    const reqs = extractQueryRequirements('Compare the Ganga and the Cauvery for a first-timer.');
    expect(reqs.comparisonIntent).toBe(true);
    expect(reqs.rankingIntent).toBe(false);
  });

  it('detects an explanation request with no entity intent', () => {
    const reqs = extractQueryRequirements('Explain the offside rule in football.');
    expect(reqs.explanationIntent).toBe(true);
    expect(reqs.requestedAttributes).not.toContain('price');
  });
});

describe('scenario classification', () => {
  const card = (title: string, body: string) => `<card title="${title}">${body}</card>`;

  it('classifies a badged multi-entity response as candidate_ranking', () => {
    const output = `<place_card><panel><section>
      ${card('A', '<badge>Top Pick</badge><rating>4.8★ · 100 reviews</rating>')}
      ${card('B', '<rating>4.4★ · 90 reviews</rating>')}
    </section></panel></place_card>`;
    const result = classifyTraceScenario(summary({ output, prompt: 'Find the best bars' }));
    expect(result.archetype).toBe('candidate_ranking');
    expect(result.confidence).toBe('high');
  });

  it('classifies multiple peers with no winner signal as list, not ranking', () => {
    const output = `<place_card><panel><section>
      ${card('A', '<price>₹100</price>')}
      ${card('B', '<price>₹200</price>')}
    </section></panel></place_card>`;
    const result = classifyTraceScenario(summary({ output, prompt: 'Show me bookshops' }));
    expect(result.archetype).toBe('list');
  });

  it('classifies repeated per-dimension breakdowns as comparison', () => {
    const output = `<place_card><panel><section>
      ${card('Ganga', '<rating>4.5★ · 10 reviews</rating>')}
      ${card('Cauvery', '<rating>4.6★ · 10 reviews</rating>')}
      ${card('Best Season', '<bullets><point>Ganga: Oct-Mar</point></bullets>')}
      ${card('Difficulty Level', '<bullets><point>Cauvery: Grade II</point></bullets>')}
    </section></panel></place_card>`;
    const result = classifyTraceScenario(summary({ output, prompt: 'Compare rafting rivers' }));
    expect(result.archetype).toBe('comparison');
  });

  it('classifies a prose answer as text_only', () => {
    const result = classifyTraceScenario(
      summary({ output: 'Offside is about where you are the moment the ball is played, not where you end up.', prompt: 'Explain the offside rule' })
    );
    expect(result.archetype).toBe('text_only');
  });

  it('excludes an empty response rather than bucketing it', () => {
    const result = classifyTraceScenario(summary({ output: '' }));
    expect(result.archetype).toBe('unknown');
    expect(result.excludedReason).toBe('empty_response');
  });

  it('excludes batch content-generation runs structurally', () => {
    const result = classifyTraceScenario(summary({ output: 'Published 3 experience cards for night owls', skills: ['aigc_experiences'] }));
    expect(result.archetype).toBe('unknown');
    expect(result.excludedReason).toBe('batch_generation');
  });

  it('does not classify by domain — the same skill yields different archetypes', () => {
    const prose = classifyTraceScenario(summary({ skills: ['travel'], output: 'The monsoon peaks in June and July across the Ghats.', prompt: 'What is the monsoon like' }));
    const ranked = classifyTraceScenario(
      summary({
        skills: ['travel'],
        prompt: 'Find the best treks',
        output: `<place_card><panel><section>${card('Kuari', '<badge>Top Pick</badge><rating>4.8★ · 10 reviews</rating>')}${card('Hampta', '<rating>4.7★ · 10 reviews</rating>')}</section></panel></place_card>`,
      })
    );
    expect(prose.archetype).toBe('text_only');
    expect(ranked.archetype).toBe('candidate_ranking');
  });

  it('reports no-image traces honestly', () => {
    const result = classifyTraceScenario(summary({ output: '<place_card><panel><section><card title="A"><price>₹1</price></card><card title="B"><price>₹2</price></card></section></panel></place_card>' }));
    expect(result.hasImages).toBe(false);
  });
});

describe('thinking visibility', () => {
  const event = (over: Partial<SemanticAgentEvent>): SemanticAgentEvent => ({
    id: 'e1',
    type: 'search',
    sourceSpanIds: [],
    startTime: 0,
    endTime: 1,
    narration: '',
    ...over,
  });
  const reqs = extractQueryRequirements('Find the best bars. Include ratings and price per person.');

  it('hides internal plumbing entirely', () => {
    expect(classifyEventVisibility(event({ type: 'internal' }), reqs).visibility).toBe('invisible');
  });

  it('keeps the final response out of thinking', () => {
    expect(classifyEventVisibility(event({ type: 'final' }), reqs).visibility).toBe('invisible');
  });

  it('narrates an operation that produced nothing consumable', () => {
    expect(classifyEventVisibility(event({ type: 'search', entities: [] }), reqs).visibility).toBe('status');
  });

  it('promotes an operation that produced consumable results to canvas value', () => {
    const decision = classifyEventVisibility(event({ type: 'search', entities: [{ id: 'a', type: 'place', title: 'A' }] }), reqs);
    expect(decision.visibility).toBe('canvas_value');
  });

  it('downgrades a technically-successful but irrelevant operation', () => {
    const noRouteAsked = extractQueryRequirements('Explain the offside rule');
    const decision = classifyEventVisibility(event({ type: 'maps', metadata: { travelTime: '20 min' } }), noRouteAsked);
    expect(decision.visibility).toBe('status');
  });
});

describe('thinking pass generation', () => {
  const reqs = extractQueryRequirements('Find the best bars near me. Include ratings and price per person.');
  const classification = classifyTraceScenario(summary({ prompt: 'Find the best bars' }));

  const stream: SemanticAgentEvent[] = [
    { id: 'e1', type: 'internal', sourceSpanIds: [], startTime: 0, endTime: 1, narration: 'llm.call' },
    { id: 'e2', type: 'search', sourceSpanIds: ['s2'], startTime: 1, endTime: 2, narration: '', entities: [
      { id: 'a', type: 'place', title: 'A' },
      { id: 'b', type: 'place', title: 'B' },
    ] },
    { id: 'e3', type: 'search', sourceSpanIds: ['s3'], startTime: 2, endTime: 3, narration: '', entities: [{ id: 'c', type: 'place', title: 'C' }] },
    { id: 'e4', type: 'enrichment', sourceSpanIds: ['s4'], startTime: 3, endTime: 4, narration: '', entities: [{ id: 'a', type: 'place', title: 'A', rating: 4.6 }] },
    { id: 'e5', type: 'enrichment', sourceSpanIds: ['s5'], startTime: 4, endTime: 5, narration: '', entities: [{ id: 'b', type: 'place', title: 'B', rating: 4.4 }] },
    { id: 'e6', type: 'rank', sourceSpanIds: ['s6'], startTime: 5, endTime: 6, narration: '' },
  ];

  it('collapses many low-level events into a few consumer passes', () => {
    const { passes } = semanticEventsToThinkingPasses(stream, classification, reqs);
    // Six events, three consumer phases — never one pass per event.
    expect(passes.length).toBeLessThan(stream.length);
    expect(passes.length).toBeGreaterThan(0);
  });

  it('reports what it filtered, with reasons', () => {
    const { filtered } = semanticEventsToThinkingPasses(stream, classification, reqs);
    expect(filtered.some((f) => f.type === 'internal')).toBe(true);
    expect(filtered[0].reason.length).toBeGreaterThan(0);
  });

  it('never emits a raw tool name to the viewer', () => {
    const { passes } = semanticEventsToThinkingPasses(stream, classification, reqs);
    for (const pass of passes) {
      expect(pass.narration).not.toMatch(/PlaceSearch|WebSearch|tool\.|span/i);
    }
  });

  it('never promotes during thinking — narrowing is not deciding', () => {
    const { passes } = semanticEventsToThinkingPasses(stream, classification, reqs);
    const mutations = passes.flatMap((p) => (p.payload as { canvas?: Array<{ type: string }> } | undefined)?.canvas ?? []);
    expect(mutations.some((m) => m.type === 'PROMOTE_ITEM')).toBe(false);
  });

  it('gives every pass real presentation timing', () => {
    const { passes } = semanticEventsToThinkingPasses(stream, classification, reqs);
    for (const pass of passes) {
      expect(pass.enterDuration + pass.holdDuration + pass.exitDuration).toBeGreaterThan(0);
    }
  });

  it('status passes carry no payload, by contract', () => {
    const { passes } = semanticEventsToThinkingPasses(stream, classification, reqs);
    for (const pass of passes) {
      if (pass.visibility === 'status') expect(pass.payload).toBeUndefined();
    }
  });
});

describe('winner derivation', () => {
  const ranking = extractQueryRequirements('Find the best bars');

  it('uses an explicit badge', () => {
    const { winner, via } = deriveWinner(
      [{ id: 'a', type: 'generic', title: 'A' }, { id: 'b', type: 'generic', title: 'B', judgment: 'Top Pick' }],
      ranking
    );
    expect(winner?.id).toBe('b');
    expect(via).toBe('badge');
  });

  it('refuses to pick a winner when nothing distinguishes one', () => {
    const { winner } = deriveWinner(
      [{ id: 'a', type: 'generic', title: 'A', rating: 4.5 }, { id: 'b', type: 'generic', title: 'B', rating: 4.5 }],
      ranking
    );
    expect(winner).toBeUndefined();
  });

  it('refuses to pick a winner when the user never asked for a ranking', () => {
    const listing = extractQueryRequirements('Show me bookshops');
    const { winner } = deriveWinner(
      [{ id: 'a', type: 'generic', title: 'A', rating: 4.8 }, { id: 'b', type: 'generic', title: 'B', rating: 4.1 }],
      listing
    );
    expect(winner).toBeUndefined();
  });
});

describe('final response construction', () => {
  it('builds a list response with no winner field at all', () => {
    const envelope = parseResponseEnvelope(
      '<place_card><panel><section><card title="A"><price>₹1</price></card><card title="B"><price>₹2</price></card></section></panel></place_card>'
    );
    const classification = classifyTraceScenario(summary({ output: '<place_card/>', prompt: 'Show me shops' }));
    const response = buildFinalResponse({
      envelope,
      classification: { ...classification, archetype: 'list' },
      requirements: extractQueryRequirements('Show me shops'),
    });
    expect(response.kind).toBe('list');
    expect(response).not.toHaveProperty('winnerId');
  });

  it('carries supporting blocks into the final response rather than dropping them', () => {
    const envelope = parseResponseEnvelope(
      '<place_card><panel><section><card title="A"><price>₹1</price></card><card title="Before You Go"><why>Book ahead.</why></card></section></panel></place_card>'
    );
    const classification = classifyTraceScenario(summary({ output: '<place_card/>' }));
    const response = buildFinalResponse({ envelope, classification: { ...classification, archetype: 'single_entity' }, requirements: extractQueryRequirements('') });
    expect(response.supporting?.[0].title).toBe('Before You Go');
  });

  it('survives a response with no entities at all', () => {
    const envelope = parseResponseEnvelope('Just some prose.');
    const classification = classifyTraceScenario(summary({ output: 'Just some prose.' }));
    expect(() => buildFinalResponse({ envelope, classification, requirements: extractQueryRequirements('') })).not.toThrow();
  });
});

describe('fixture coverage', () => {
  it('has at least three scenarios for every archetype', () => {
    for (const archetype of SCENARIO_ARCHETYPES) {
      const pool = FIXTURE_SCENARIOS.filter((s) => s.archetype === archetype);
      expect(pool.length, `${archetype} needs >= 3 fixtures`).toBeGreaterThanOrEqual(3);
    }
  });

  it('marks every fixture as a fixture — never as Phoenix output', () => {
    for (const scenario of FIXTURE_SCENARIOS) {
      expect(scenario.source).toBe('fixture');
      expect(scenario.traceId).toBeUndefined();
    }
  });

  it('gives every fixture passes and a final response', () => {
    for (const scenario of FIXTURE_SCENARIOS) {
      expect(scenario.thinkingPasses.length, scenario.id).toBeGreaterThan(0);
      expect(scenario.finalResponse, scenario.id).toBeTruthy();
    }
  });

  it('never promotes anything in a list fixture', () => {
    for (const scenario of FIXTURE_SCENARIOS.filter((s) => s.archetype === 'list')) {
      expect(scenario.finalResponse.kind).toBe('list');
      expect(scenario.finalResponse).not.toHaveProperty('winnerId');
    }
  });

  it('stays renderable with no images — no fixture entity depends on one', () => {
    for (const scenario of FIXTURE_SCENARIOS) {
      const response = scenario.finalResponse;
      const entities =
        response.kind === 'entity_rail' ? response.entities : response.kind === 'list' ? response.items : [];
      for (const entity of entities) {
        expect(entity.title, `${scenario.id} entity must be identifiable without an image`).toBeTruthy();
      }
    }
  });

  it('stores no JSX or component reference in scenario data', () => {
    for (const scenario of FIXTURE_SCENARIOS) {
      const serialized = JSON.stringify(scenario);
      expect(serialized).not.toContain('$$typeof');
      expect(() => JSON.parse(serialized)).not.toThrow();
    }
  });

  it('keeps thinking lighter than the final response', () => {
    for (const scenario of FIXTURE_SCENARIOS) {
      const thinkingText = scenario.thinkingPasses.map((p) => p.narration).join(' ');
      expect(thinkingText, scenario.id).not.toContain(scenario.finalResponse.headline);
    }
  });
});

describe('candidate canvas continuity', () => {
  const reqs = extractQueryRequirements('Find the best bars. Include ratings and price per person.');
  const classification = classifyTraceScenario(summary({ prompt: 'Find the best bars' }));

  it('adds entities that only enrichment surfaced, so the canvas is never empty', () => {
    // The real shape this guards: tool.output truncation loses the PlaceSearch
    // array, so discovery yields nothing while PlaceDetails parses cleanly.
    const stream: SemanticAgentEvent[] = [
      { id: 'e1', type: 'search', sourceSpanIds: [], startTime: 0, endTime: 1, narration: '', entities: [] },
      { id: 'e2', type: 'enrichment', sourceSpanIds: [], startTime: 1, endTime: 2, narration: '', entities: [{ id: 'a', type: 'place', title: 'A', rating: 4.6 }] },
      { id: 'e3', type: 'enrichment', sourceSpanIds: [], startTime: 2, endTime: 3, narration: '', entities: [{ id: 'b', type: 'place', title: 'B', rating: 4.4 }] },
    ];
    const { passes } = semanticEventsToThinkingPasses(stream, classification, reqs);
    const canvas = passes.flatMap((p) => (p.payload as { canvas?: Array<{ type: string; items?: unknown[] }> } | undefined)?.canvas ?? []);
    const added = canvas.filter((m) => m.type === 'ADD_ITEMS').flatMap((m) => m.items ?? []);
    expect(added.length).toBeGreaterThanOrEqual(2);
  });

  it('recovers an honest count when truncation lost the discovery entities', () => {
    const stream: SemanticAgentEvent[] = [
      { id: 'e1', type: 'search', sourceSpanIds: [], startTime: 0, endTime: 1, narration: '', entities: [] },
    ];
    const { passes } = semanticEventsToThinkingPasses(stream, classification, reqs, { finalEntityCount: 5 });
    const discover = passes.find((p) => p.id.includes('discover'));
    expect(discover?.visibility).toBe('canvas_value');
    expect((discover?.payload as { value: number }).value).toBe(5);
    // Recovered from the answer, not observed — and it must say so.
    expect(discover?.confidence).toBe('medium');
    // It reports HOW MANY, never which — the names belong to the final response.
    expect(discover?.valueType).toBe('count');
  });
});
