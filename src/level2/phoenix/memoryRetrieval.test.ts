import { describe, it, expect } from 'vitest';
import { extractMemoryContext } from './memoryRetrieval';
import { extractQueryRequirements } from '../classification/queryRequirements';
import type { PhoenixSpan } from '../../types/phoenix';

/* Fixture shapes here are modeled directly on the REAL `memory.retrieval`
   span attributes confirmed live against aitv-mewtwo-harness (see
   MEMORY_RETRIEVAL_TRACE_FINDINGS.md) — same attribute keys, same
   `memory.hit`/`retrieval.documents.N.document.*` shape. Only the specific
   fact text in the "irrelevant"/"multiple" cases is invented for test
   coverage; the real corpus has only ever produced the one location fact
   used in the "relevant" case below. */

function span(name: string, attributes: Record<string, unknown>, parentId: string | null = null): PhoenixSpan {
  return {
    name,
    span_kind: name === 'memory.retrieval' ? 'RETRIEVER' : 'CHAIN',
    context: { trace_id: 't1', span_id: name === 'memory.retrieval' ? 'mem-span' : 'root-span' },
    parent_id: parentId,
    start_time: '2026-08-13T17:28:43.000Z',
    end_time: '2026-08-13T17:28:43.300Z',
    status_code: 'OK',
    attributes,
  };
}

const travelReqs = extractQueryRequirements('Find the best-rated rooftop bars near me with live music tonight.');
const vegReqs = extractQueryRequirements('Find a vegetarian-friendly Punjabi restaurant for dinner tonight.');

describe('extractMemoryContext — no span / no hit', () => {
  it('is unavailable when no memory.retrieval span exists on the trace', () => {
    const ctx = extractMemoryContext([span('harness.turn', {})], 'a prompt', travelReqs);
    expect(ctx.available).toBe(false);
    expect(ctx.diagnostics.spanFound).toBe(false);
  });

  it('is unavailable when the span exists but reports no hit (the common real case)', () => {
    const spans = [
      span('harness.turn', {}),
      span('memory.retrieval', { 'memory.hit': false, 'memory.user_id': '600fedad', 'memory.retrieved_total': 0 }, 'root-span'),
    ];
    const ctx = extractMemoryContext(spans, 'a prompt', travelReqs);
    expect(ctx.available).toBe(false);
    expect(ctx.diagnostics.spanFound).toBe(true);
    expect(ctx.diagnostics.hit).toBe(false);
  });
});

describe('extractMemoryContext — real location-fact shape', () => {
  const spans = [
    span('harness.turn', {}),
    span(
      'memory.retrieval',
      {
        'memory.hit': true,
        'memory.user_id': '82d2c86c',
        'memory.retrieved_facts': 1,
        'memory.retrieved_total': 1,
        'output.value': "# User Memory (remembered across all sessions)\n\nUse MemoryWrite(action='update', fact_id=...) if this changes.\n\n## Fact\n- [b1fb0bbf] User is located in Bengaluru, Karnataka.",
        'retrieval.documents.0.document.id': 'b1fb0bbf-d68c-4692-94f3-6e737d5fb13c',
        'retrieval.documents.0.document.content': 'User is located in Bengaluru, Karnataka.',
        'retrieval.documents.0.document.metadata.category': 'fact',
      },
      'root-span'
    ),
  ];

  it('surfaces the location fact as a short, safe signal — never the raw sentence, id, or MemoryWrite instructions', () => {
    const ctx = extractMemoryContext(spans, 'rooftop bars with live music', travelReqs);
    expect(ctx.available).toBe(true);
    expect(ctx.relevantSignals).toEqual([{ type: 'location', label: 'Bengaluru, Karnataka' }]);
    // Never leaks the document id or the MemoryWrite tool-instruction text.
    const dump = JSON.stringify(ctx);
    expect(dump).not.toContain('b1fb0bbf');
    expect(dump).not.toContain('MemoryWrite');
  });

  it('records span/hit and source span id for dev diagnostics', () => {
    const ctx = extractMemoryContext(spans, 'rooftop bars with live music', travelReqs);
    expect(ctx.diagnostics).toMatchObject({ spanFound: true, hit: true, totalSignalsFound: 1, relevantSignalCount: 1, rendered: true });
    expect(ctx.sourceSpanIds).toEqual(['mem-span']);
  });
});

describe('extractMemoryContext — relevance filter', () => {
  function spansWithFact(content: string, category = 'fact') {
    return [
      span('harness.turn', {}),
      span(
        'memory.retrieval',
        {
          'memory.hit': true,
          'memory.retrieved_total': 1,
          'retrieval.documents.0.document.content': content,
          'retrieval.documents.0.document.metadata.category': category,
        },
        'root-span'
      ),
    ];
  }

  it('keeps a non-location fact that shares real words with the request', () => {
    const ctx = extractMemoryContext(spansWithFact('User prefers vegetarian food.'), 'vegetarian Punjabi restaurant', vegReqs);
    expect(ctx.available).toBe(true);
    expect(ctx.relevantSignals[0]?.label).toBe('vegetarian food');
  });

  it('drops a fact with no relevance to the current request rather than showing it anyway', () => {
    const ctx = extractMemoryContext(spansWithFact('User dislikes horror movies.'), 'vegetarian Punjabi restaurant', vegReqs);
    expect(ctx.available).toBe(false);
    expect(ctx.diagnostics).toMatchObject({ spanFound: true, hit: true, totalSignalsFound: 1, relevantSignalCount: 0, rendered: false });
    expect(ctx.diagnostics.reason).toMatch(/relevant/);
  });

  it('caps visible signals at 3 even when more relevant documents exist', () => {
    const spans = [
      span('harness.turn', {}),
      span(
        'memory.retrieval',
        {
          'memory.hit': true,
          'memory.retrieved_total': 5,
          'retrieval.documents.0.document.content': 'User prefers vegetarian food.',
          'retrieval.documents.0.document.metadata.category': 'fact',
          'retrieval.documents.1.document.content': 'User prefers Punjabi restaurants.',
          'retrieval.documents.1.document.metadata.category': 'fact',
          'retrieval.documents.2.document.content': 'User prefers dinner reservations.',
          'retrieval.documents.2.document.metadata.category': 'fact',
          'retrieval.documents.3.document.content': 'User prefers vegetarian tonight dinner spots.',
          'retrieval.documents.3.document.metadata.category': 'fact',
        },
        'root-span'
      ),
    ];
    const ctx = extractMemoryContext(spans, 'vegetarian Punjabi restaurant for dinner tonight', vegReqs);
    expect(ctx.relevantSignals.length).toBeLessThanOrEqual(3);
    expect(ctx.diagnostics.totalSignalsFound).toBe(4);
  });
});
