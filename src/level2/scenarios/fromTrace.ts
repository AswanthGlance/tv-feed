import type { PhoenixSpan } from '../../types/phoenix';
import { buildSpanTree, findPrimaryRoot, flattenSpans } from '../../adapters/spanTree';
import { classifyTraceScenario, summarizeRootSpan } from '../classification/scenarioClassifier';
import { extractQueryRequirements } from '../classification/queryRequirements';
import { partitionEnvelope } from '../classification/entityRole';
import { parseResponseEnvelope } from '../normalization/responseEnvelope';
import { extractLevel2SemanticEvents } from '../phoenix/semanticEvents';
import { extractMemoryContext } from '../phoenix/memoryRetrieval';
import { semanticEventsToThinkingPasses } from '../userValue/passBuilder';
import { checkDiscoveryInvariants } from '../userValue/discoveryInvariants';
import { buildCandidateRankingPasses } from '../userValue/candidateRankingPlan';
import { buildListPasses, type ListPlanMeta } from '../userValue/listPlan';
import { buildMemoryContextPass } from '../userValue/memoryContextPlan';
import { buildFinalResponse } from '../finalResponse/buildFinalResponse';
import type { Level2Scenario, ScenarioSource } from '../types/scenario';
import type { MemoryContext } from '../types/memory';
import type { ThinkingPass } from '../types/pass';
import { describeHollowResponse } from '../finalResponse/integrity';

/* ─────────────────────────────────────────────────────────────────────────────
   PhoenixSpan[] -> Level2Scenario.

   The whole pipeline in one place, in the order the architecture defines:

     spans -> span tree -> classification -> query requirements
           -> semantic events -> user-value filter -> thinking passes
           -> final response model -> scenario

   Returns undefined when the trace does not classify into a usable archetype
   (empty response, batch generation run, unrecognised shape). The caller falls
   back rather than being handed a scenario that pretends to be something.
   ───────────────────────────────────────────────────────────────────────────── */

export interface TraceScenarioResult {
  scenario?: Level2Scenario;
  /** Why no scenario was produced, when that happened. */
  rejectedReason?: string;
  diagnostics: {
    spanCount: number;
    eventCount: number;
    internalSpanCount: number;
    unrecognizedTools: string[];
    unusableToolOutputs: string[];
    /** Events the user-value classifier hid, with reasons. */
    filteredEvents: Array<{ eventId: string; type: string; reason: string }>;
    /** Present once the trace has been far enough through the pipeline to
     *  attempt memory extraction — see types/memory.ts. Dev panel only. */
    memory?: MemoryContext['diagnostics'];
  };
}

/** A trace with real work but no consumable intermediate result still needs
 *  SOMETHING on screen while it runs. One honest status pass beats a blank
 *  canvas, and beats inventing findings. */
function fallbackPass(): ThinkingPass {
  return {
    id: 'pass-fallback',
    visibility: 'status',
    narration: 'Working on your request',
    confidence: 'high',
    enterDuration: 500,
    holdDuration: 1600,
    exitDuration: 250,
  };
}

export function buildScenarioFromTrace(
  spans: PhoenixSpan[],
  source: ScenarioSource = 'phoenix'
): TraceScenarioResult {
  const emptyDiagnostics = {
    spanCount: spans.length,
    eventCount: 0,
    internalSpanCount: 0,
    unrecognizedTools: [] as string[],
    unusableToolOutputs: [] as string[],
    filteredEvents: [] as Array<{ eventId: string; type: string; reason: string }>,
  };

  if (!spans.length) return { rejectedReason: 'Trace has no spans.', diagnostics: emptyDiagnostics };

  const roots = buildSpanTree(spans);
  const rootNode = findPrimaryRoot(roots);
  const rootSpan = rootNode?.span;
  if (!rootSpan) return { rejectedReason: 'Trace has no resolvable root span.', diagnostics: emptyDiagnostics };

  const orderedSpans = rootNode ? flattenSpans([rootNode]) : spans;
  const summary = summarizeRootSpan(rootSpan);
  const classification = classifyTraceScenario(summary, orderedSpans);

  const { events, diagnostics: semDiag } = extractLevel2SemanticEvents(orderedSpans, rootSpan);
  const diagnostics: TraceScenarioResult['diagnostics'] = {
    spanCount: orderedSpans.length,
    eventCount: events.length,
    internalSpanCount: semDiag.internalSpanCount,
    unrecognizedTools: semDiag.unrecognizedTools,
    unusableToolOutputs: semDiag.unusableToolOutputs,
    filteredEvents: [] as Array<{ eventId: string; type: string; reason: string }>,
  };

  if (classification.archetype === 'unknown') {
    return {
      rejectedReason: classification.excludedReason ?? 'Trace does not classify into a Level 2 archetype.',
      diagnostics,
    };
  }

  const requirements = extractQueryRequirements(summary.prompt);
  const envelope = parseResponseEnvelope(summary.output);
  const { entities, supporting } = partitionEnvelope(envelope);
  const finalResponse = buildFinalResponse({ envelope, classification, requirements, entities, supporting });

  // ── Archetype integrity ───────────────────────────────────────────────
  // Classification runs on root-span metadata and is deliberately generous:
  // route INTENT plus route words is enough to call something route_map. But
  // a scenario is only usable if the final response can actually CARRY that
  // archetype — a route with no stops, a table with no rows, or a comparison
  // with no dimensions renders as an empty frame, which is worse than falling
  // back. Rejecting here (rather than loosening the classifier) keeps the
  // corpus report honest about what the corpus contains while keeping the demo
  // free of hollow scenarios: the registry simply tries the next trace, then a
  // fixture.
  const hollow = describeHollowResponse(finalResponse);
  if (hollow) {
    return { rejectedReason: `Classified ${classification.archetype} but ${hollow}`, diagnostics };
  }

  // Candidate ranking is the reference archetype and gets a DELIBERATE arc
  // rather than an emergent one, so every countable claim has the objects
  // that prove it on screen at the same moment (see candidateRankingPlan.ts).
  // Every other archetype still derives its passes from the event stream.
  //
  // `rng: Math.random` opts into narration wording variety (see
  // narrationVariety.ts) — picked ONCE here, when the scenario is built, not
  // per render, so the wording is fixed for as long as this scenario stays on
  // screen or cached (see registry.ts's `built` cache).
  // The list archetype gets its own deliberate arc too (see listPlan.ts):
  // a SET to explore, so items accumulate and stay equal — no shortlist, no
  // "3 stand out", no winner — and the narration count is derived from the
  // same visible array the canvas renders. `listMeta` carries the count
  // invariants (raw vs resolved vs visible, item provenance) to the dev panel.
  let listMeta: ListPlanMeta | undefined;
  const { passes, filtered } =
    classification.archetype === 'candidate_ranking'
      ? {
          passes: buildCandidateRankingPasses({
            events,
            entities,
            requirements,
            winnerId: finalResponse.kind === 'entity_rail' ? finalResponse.winnerId : undefined,
            rng: Math.random,
          }),
          filtered: semanticEventsToThinkingPasses(events, classification, requirements).filtered,
        }
      : classification.archetype === 'list'
        ? (() => {
            const plan = buildListPasses({
              events,
              entities: finalResponse.kind === 'list' ? finalResponse.items : entities,
              requirements,
              prompt: summary.prompt,
              rng: Math.random,
            });
            listMeta = plan.meta;
            return {
              passes: plan.passes,
              filtered: semanticEventsToThinkingPasses(events, classification, requirements).filtered,
            };
          })()
        : semanticEventsToThinkingPasses(events, classification, requirements, {
          finalEntityCount: entities.length,
          // The full final-response entity set, not just its count — the
          // candidate resolver (candidateResolution.ts) uses it as the
          // last-priority identity source when tool-output truncation lost
          // the discovery-time entities, so "Found 5 rivers" gets five real
          // tiles from the same trace instead of an empty canvas.
          finalEntities: entities,
          rng: Math.random,
        });
  diagnostics.filteredEvents = filtered;

  // ── Memory / personal context — optional, and FIRST when present ───────
  // A shared Level 2 primitive, not archetype-specific (see
  // MEMORY_RETRIEVAL_TRACE_FINDINGS.md — the real memory.retrieval span was
  // observed across every archetype sampled), so it is resolved once here
  // rather than threaded into every per-archetype pass builder above. Reads
  // straight off `orderedSpans` — memory.retrieval is a direct child of the
  // root turn span, already included by flattenSpans. Silently contributes
  // nothing when the trace has no memory span, no hit, or nothing relevant
  // to THIS request — diagnostics.memory records which, for the dev panel.
  const memoryContext = extractMemoryContext(orderedSpans, summary.prompt, requirements);
  diagnostics.memory = memoryContext.diagnostics;
  const memoryPass = buildMemoryContextPass(memoryContext, summary.skills[0], Math.random);
  const allPasses = memoryPass ? [memoryPass, ...passes] : passes;

  // ── Discovery invariants (dev-mode) ────────────────────────────────────
  // "Found N things" must put exactly N tiles on the canvas. Violations never
  // alter playback — they are made LOUD for developers instead of shipping
  // silently as narration over an empty or over-full canvas.
  const invariantWarnings = checkDiscoveryInvariants(allPasses);
  if (invariantWarnings.length && typeof console !== 'undefined' && import.meta.env?.DEV) {
    for (const w of invariantWarnings) {
      console.warn(`[level2] ${w.message} (trace ${summary.traceId})`);
    }
  }

  const scenario: Level2Scenario = {
    id: `trace-${summary.traceId}`,
    archetype: classification.archetype,
    prompt: summary.prompt ?? 'Agent request',
    domain: summary.skills[0] ?? 'general',
    source,
    traceId: summary.traceId,
    thinkingPasses: allPasses.length ? allPasses : [fallbackPass()],
    finalResponse,
    classification,
    requirements,
    metadata: {
      toolSequence: summary.toolSequence,
      skills: summary.skills,
      latencyMs: summary.latencyMs,
      entityCount: entities.length,
      supportingCount: supporting.length,
      // Carried on the scenario so the diagnostics panel can answer "what did
      // you hide from me" without re-running the pipeline.
      filteredEvents: filtered,
      unrecognizedTools: semDiag.unrecognizedTools,
      internalSpanCount: semDiag.internalSpanCount,
      // Narration-vs-canvas discovery violations, for the dev panel. Empty on
      // a healthy trace; never read by consumer UI.
      invariantWarnings,
      // List count invariants (raw result scale vs resolved vs visible, item
      // provenance) — present only on list scenarios. Dev panel only.
      ...(listMeta ? { list: listMeta } : {}),
      // Dev panel only — never read by consumer UI. See types/memory.ts.
      memory: memoryContext.diagnostics,
    },
  };

  return { scenario, diagnostics };
}
