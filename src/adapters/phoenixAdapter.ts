import type { PhoenixSpan, PhoenixTrace } from '../types/phoenix';
import type { ThinkingScenario } from '../types/thinking';
import { buildSpanTree, findPrimaryRoot, flattenSpans } from './spanTree';
import { buildActiveHeadline, buildThinkingSteps } from './activityMapper';
import { asNumber, asString, firstStringAttr } from '../utils/safeJson';
import { safeSpanEnd, safeSpanStart } from '../utils/timing';

/* Candidate attribute keys observed (or plausible per the same instrumentation
   family) for the user's original request. Checked in order; first hit wins.
   Confirmed present on real spans: input.value, input.message, user.intent. */
const REQUEST_KEYS = ['input.value', 'input.message', 'user.intent', 'input.query', 'query'];
const RESPONSE_KEYS = ['output.value', 'output.text', 'response.value', 'final_response'];
const SKILL_KEYS = ['turn.skills_selected', 'skill_selector.selected', 'skill'];

export function extractUserRequest(rootAttrs: Record<string, unknown> | undefined): string | undefined {
  return firstStringAttr(rootAttrs, REQUEST_KEYS);
}

export function extractFinalResponse(rootAttrs: Record<string, unknown> | undefined): string | undefined {
  return firstStringAttr(rootAttrs, RESPONSE_KEYS);
}

/** turn.skills_selected is frequently multi-valued in real data (e.g.
 *  "fashion, travel", "travel, food") — returns the raw string as-is. */
export function extractSkillRaw(rootAttrs: Record<string, unknown> | undefined): string | undefined {
  return firstStringAttr(rootAttrs, SKILL_KEYS);
}

/** First/primary skill from a possibly comma-separated turn.skills_selected. */
export function extractSkill(rootAttrs: Record<string, unknown> | undefined): string | undefined {
  const raw = extractSkillRaw(rootAttrs);
  return raw?.split(',')[0]?.trim();
}

export interface BuildScenarioResult {
  scenario: ThinkingScenario;
  rootSpan?: PhoenixSpan;
  allSpans: PhoenixSpan[];
  warnings: string[];
  /** The raw request Phoenix's own span attributes gave us, before any
   *  scenario-level display override (dev panel transparency only). */
  detectedRequest?: string;
}

/** Full Phoenix spans -> ThinkingScenario pipeline. Never throws — a
 *  malformed or sparse trace degrades to a scenario with zero/partial steps
 *  plus a warning, rather than crashing the leadership UI. */
export function buildThinkingScenario(trace: PhoenixTrace, spans: PhoenixSpan[]): BuildScenarioResult {
  const warnings: string[] = [];

  if (!spans.length) {
    warnings.push('Trace has zero spans.');
    return {
      scenario: {
        traceId: trace.trace_id,
        startTime: 0,
        endTime: 0,
        steps: [],
        spanCount: 0,
      },
      allSpans: [],
      warnings,
    };
  }

  const roots = buildSpanTree(spans);
  const rootNode = findPrimaryRoot(roots);
  if (!rootNode) {
    warnings.push('Could not resolve a root span (all spans orphaned).');
  }

  const rootSpan = rootNode?.span;
  const rootAttrs = rootSpan?.attributes;
  const request = extractUserRequest(rootAttrs);
  const response = extractFinalResponse(rootAttrs);
  const skill = extractSkill(rootAttrs);

  if (!request) warnings.push('No recognizable user-request attribute found on root span.');
  if (!response) warnings.push('No recognizable final-response attribute found on root span.');

  const allSpans = rootNode ? flattenSpans([rootNode]) : spans;
  const allToolSpans = allSpans.filter((s) => s.span_kind === 'TOOL');

  const traceStart = Math.min(...allSpans.map((s) => safeSpanStart(s)));
  const traceEnd = Math.max(...allSpans.map((s) => safeSpanEnd(s)));

  const headline = buildActiveHeadline(skill, request);

  const children = rootNode ? rootNode.children.map((c) => c.span) : [];
  const steps = children.length
    ? buildThinkingSteps(children, allToolSpans, { skill, finalOutputValue: response, headline })
    : [];

  if (!steps.length) warnings.push('No child spans under the root — nothing to show in the timeline.');

  const toolCallCount = asNumber(rootAttrs?.['turn.tool_call_count']) ?? allToolSpans.length;

  return {
    scenario: {
      traceId: trace.trace_id,
      request,
      response,
      skill,
      startTime: traceStart,
      endTime: traceEnd,
      steps,
      spanCount: spans.length,
      toolCallCount,
    },
    rootSpan,
    allSpans,
    warnings,
    detectedRequest: request,
  };
}

export function inferTraceSummaryRequest(spans: PhoenixSpan[]): string | undefined {
  const root = spans.find((s) => !s.parent_id) ?? spans[0];
  return asString(root?.attributes?.['input.value']) ?? asString(root?.attributes?.['user.intent']);
}

/** There is no GET /v1/traces/{id} endpoint on this Phoenix deployment (only
 *  DELETE) — the batched root-span discovery (listRootTurnSpans) never
 *  fetches a separate Trace object, so this reconstructs the PhoenixTrace
 *  shape buildThinkingScenario expects directly from the root span's own
 *  fields, which carry the same start/end times and token counts. */
export function spanToPseudoTrace(rootSpan: PhoenixSpan): PhoenixTrace {
  return {
    id: rootSpan.id ?? rootSpan.context.span_id,
    trace_id: rootSpan.context.trace_id,
    project_id: '',
    start_time: rootSpan.start_time,
    end_time: rootSpan.end_time,
    token_count_prompt: asNumber(rootSpan.attributes?.['llm.token_count.prompt']),
    token_count_completion: asNumber(rootSpan.attributes?.['llm.token_count.completion']),
    token_count_total: asNumber(rootSpan.attributes?.['llm.token_count.total']),
  };
}
