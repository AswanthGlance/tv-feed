import { describe, it, expect } from 'vitest';
import { buildScenarioFromTrace } from './fromTrace';
import type { PhoenixSpan } from '../../types/phoenix';

/* End-to-end: real spans -> Level2Scenario, focused on the memory step's
   "optional, and first when present" contract. Root-span shape mirrors a
   real harness.turn (see MEMORY_RETRIEVAL_TRACE_FINDINGS.md); the
   memory.retrieval attributes mirror the real span shape confirmed live. */

function traceSpans(opts: { memory?: Record<string, unknown>; prompt?: string; output?: string; skills?: string }): PhoenixSpan[] {
  const prompt = opts.prompt ?? 'Find rooftop bars near me with live music tonight.';
  const output =
    opts.output ??
    'Rooftop bars with live music are trending across the city this week. Sky Lounge and Terrace 9 both have sets starting at 8pm.';
  const root: PhoenixSpan = {
    name: 'harness.turn',
    span_kind: 'CHAIN',
    context: { trace_id: 't1', span_id: 'root' },
    parent_id: null,
    start_time: '2026-08-13T17:28:43.000Z',
    end_time: '2026-08-13T17:28:54.000Z',
    status_code: 'OK',
    attributes: {
      'input.value': prompt,
      'output.value': output,
      'turn.tool_sequence': '[]',
      'turn.tool_call_count': 0,
      'turn.skills_selected': opts.skills ?? 'local_experiences',
    },
  };
  const spans = [root];
  if (opts.memory) {
    spans.push({
      name: 'memory.retrieval',
      span_kind: 'RETRIEVER',
      context: { trace_id: 't1', span_id: 'mem' },
      parent_id: 'root',
      start_time: '2026-08-13T17:28:43.001Z',
      end_time: '2026-08-13T17:28:43.300Z',
      status_code: 'OK',
      attributes: opts.memory,
    });
  }
  return spans;
}

const REAL_HIT = {
  'memory.hit': true,
  'memory.retrieved_total': 1,
  'retrieval.documents.0.document.content': 'User is located in Bengaluru, Karnataka.',
  'retrieval.documents.0.document.metadata.category': 'fact',
};

describe('buildScenarioFromTrace — memory as an optional first pass', () => {
  it('prepends a memory_signals pass first when the trace has a relevant hit', () => {
    const { scenario, diagnostics } = buildScenarioFromTrace(traceSpans({ memory: REAL_HIT }));
    expect(scenario).toBeDefined();
    expect(scenario!.thinkingPasses[0].valueType).toBe('memory_signals');
    expect(diagnostics.memory).toMatchObject({ spanFound: true, hit: true, rendered: true });
  });

  it('does not add a memory pass when the span reports no hit (the common real case)', () => {
    const { scenario, diagnostics } = buildScenarioFromTrace(traceSpans({ memory: { 'memory.hit': false, 'memory.retrieved_total': 0 } }));
    expect(scenario).toBeDefined();
    expect(scenario!.thinkingPasses.some((p) => p.valueType === 'memory_signals')).toBe(false);
    expect(diagnostics.memory).toMatchObject({ spanFound: true, hit: false, rendered: false });
  });

  it('does not add a memory pass when the trace has no memory.retrieval span at all', () => {
    const { scenario, diagnostics } = buildScenarioFromTrace(traceSpans({}));
    expect(scenario).toBeDefined();
    expect(scenario!.thinkingPasses.some((p) => p.valueType === 'memory_signals')).toBe(false);
    expect(diagnostics.memory).toMatchObject({ spanFound: false });
  });

  it('does not add a memory pass when the hit exists but is irrelevant to this request', () => {
    const { scenario, diagnostics } = buildScenarioFromTrace(
      traceSpans({
        memory: {
          'memory.hit': true,
          'memory.retrieved_total': 1,
          'retrieval.documents.0.document.content': 'User dislikes horror movies.',
          'retrieval.documents.0.document.metadata.category': 'fact',
        },
      })
    );
    expect(scenario).toBeDefined();
    expect(scenario!.thinkingPasses.some((p) => p.valueType === 'memory_signals')).toBe(false);
    expect(diagnostics.memory).toMatchObject({ hit: true, rendered: false });
  });

  it('leaves the rest of the scenario (archetype, final response) unaffected by the memory step', () => {
    const withMemory = buildScenarioFromTrace(traceSpans({ memory: REAL_HIT }));
    const withoutMemory = buildScenarioFromTrace(traceSpans({}));
    expect(withMemory.scenario!.archetype).toBe(withoutMemory.scenario!.archetype);
    expect(withMemory.scenario!.finalResponse).toEqual(withoutMemory.scenario!.finalResponse);
  });
});
