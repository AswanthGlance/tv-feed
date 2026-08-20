import { classifyTraceScenario } from '../classification/scenarioClassifier';
import { extractQueryRequirements } from '../classification/queryRequirements';
import { partitionEnvelope } from '../classification/entityRole';
import { parseResponseEnvelope } from '../normalization/responseEnvelope';
import { toNormalizedEntity } from '../normalization/entityBridge';
import { semanticEventsToThinkingPasses } from '../userValue/passBuilder';
import { checkDiscoveryInvariants } from '../userValue/discoveryInvariants';
import { resolveCandidateSet } from '../userValue/candidateResolution';
import { buildCandidateRankingPasses } from '../userValue/candidateRankingPlan';
import { buildListPasses, type ListPlanMeta } from '../userValue/listPlan';
import { buildFinalResponse } from '../finalResponse/buildFinalResponse';
import { describeHollowResponse } from '../finalResponse/integrity';
import type { Level2Scenario, ScenarioSource } from '../types/scenario';
import type { ThinkingPass } from '../types/pass';
import { streamToSemanticEvents } from './streamToSemanticEvents';
import { buildTraceSummary } from './traceSummary';
import { buildSynthesisBeat } from './synthesisBeat';
import { extractIntentChips } from '../userValue/intentChips';
import type { HarnessTurnEventSource } from './types';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — HarnessTurnEventSource -> Level2Scenario.

   Mirrors scenarios/fromTrace.ts's buildScenarioFromTrace step for step, from
   `extractQueryRequirements` onward: same classifier, same envelope parser,
   same entity partition/backfill, same buildFinalResponse, same archetype
   pass builders, same integrity check, same real-timing annotation. The
   Phoenix orchestrator's PREFIX (buildSpanTree -> summarizeRootSpan ->
   extractLevel2SemanticEvents) is the only part with a different shape here
   (buildTraceSummary + streamToSemanticEvents instead) — that prefix is the
   intended difference; everything after it is the same shared pipeline by
   direct function reuse, not by convention.

   One deliberate omission: no memory-context wiring. Phoenix's
   extractMemoryContext reads a `memory.retrieval` CHILD SPAN this source has
   no equivalent of — skipped rather than faked. If the harness ever emits an
   explicit memory-recall event, this is the one place to add it back.
   ───────────────────────────────────────────────────────────────────────────── */

export interface HarnessStreamScenarioResult {
  scenario?: Level2Scenario;
  rejectedReason?: string;
  diagnostics: {
    eventCount: number;
    internalEventCount: number;
    unrecognizedTools: string[];
    unusableToolOutputs: string[];
    filteredEvents: Array<{ eventId: string; type: string; reason: string }>;
    noRealTimingFound: boolean;
  };
}

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

export function buildScenarioFromHarnessStream(
  turn: HarnessTurnEventSource,
  source: ScenarioSource = 'harness_stream'
): HarnessStreamScenarioResult {
  const summary = buildTraceSummary(turn);
  // spans=[] is deliberate: classifyTraceScenario's image detection also
  // scans `summary.output` directly (see detectImages), which already
  // carries every real image URL this source has via serializeFinalEnvelope
  // — no synthetic PhoenixSpan[] is needed just to satisfy that signature.
  const classification = classifyTraceScenario(summary, []);

  const { events, diagnostics: streamDiag } = streamToSemanticEvents(turn.events);
  const diagnostics: HarnessStreamScenarioResult['diagnostics'] = {
    eventCount: events.length,
    internalEventCount: streamDiag.internalEventCount,
    unrecognizedTools: streamDiag.unrecognizedTools,
    unusableToolOutputs: streamDiag.unusableToolOutputs,
    filteredEvents: [],
    noRealTimingFound: streamDiag.noRealTimingFound,
  };

  if (classification.archetype === 'unknown') {
    return {
      rejectedReason: classification.excludedReason ?? 'Turn does not classify into a Level 2 archetype.',
      diagnostics,
    };
  }

  const requirements = extractQueryRequirements(summary.prompt);
  const envelope = parseResponseEnvelope(summary.output);
  const { entities: parsedEntities, supporting } = partitionEnvelope(envelope);

  // Same backfill fromTrace.ts performs for Phoenix: the final-response
  // parser carries no image; discovery-time tool_result entities do. Here
  // the reason is different (envelopeCardToEntity simply doesn't read the
  // `url` attribute yet, not that Phoenix's output never had one — see
  // serializeFinalEnvelope.ts's header) but the fix is the identical,
  // already-tested pattern.
  const discoveryEntities = events.flatMap((ev) => (ev.entities ?? []).map(toNormalizedEntity));
  const entities = parsedEntities.length
    ? resolveCandidateSet({ observed: discoveryEntities, finalEntities: parsedEntities, preferFinalIdentity: true }).canonical
    : parsedEntities;

  const finalResponse = buildFinalResponse({ envelope, classification, requirements, entities, supporting });

  const hollow = describeHollowResponse(finalResponse);
  if (hollow) {
    return { rejectedReason: `Classified ${classification.archetype} but ${hollow}`, diagnostics };
  }

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
            return { passes: plan.passes, filtered: semanticEventsToThinkingPasses(events, classification, requirements).filtered };
          })()
        : semanticEventsToThinkingPasses(events, classification, requirements, {
            finalEntityCount: entities.length,
            finalEntities: entities,
            rng: Math.random,
            harnessSubBeats: true,
          });
  diagnostics.filteredEvents = filtered;

  // ── ACKNOWLEDGEMENT VISUAL ────────────────────────────────────────────
  // The very first thing on screen must never be narration ("Got it —
  // let's see what's around") over an empty canvas. 2-5 real chips
  // extracted from the actual prompt (see userValue/intentChips.ts) — never
  // a repeat of the prompt, never fabricated.
  //
  // candidate_ranking/list already open on their own dedicated acknowledge
  // beat (candidateRankingPlan.ts / listPlan.ts) — that beat gets the chips
  // ATTACHED, reusing its real narration. The generic path has no such beat
  // when the trace goes straight into research/discover (no `clarify`
  // event), so a genuine acknowledge pass is PREPENDED instead — the same
  // pattern list/candidate_ranking already establish, just applied here too.
  // Silently a no-op when the prompt yields nothing real to show (e.g.
  // "Start something new") — narration + the existing ambient pulse carry
  // that case honestly, never an invented chip.
  const isAcknowledgeShaped = (p: ThinkingPass) => p.id.includes('acknowledge') || p.id.includes('orient');
  const chips = extractIntentChips(summary.prompt, requirements);
  if (chips.length) {
    if (passes[0] && isAcknowledgeShaped(passes[0]) && !passes[0].payload) {
      passes[0] = { ...passes[0], visibility: 'canvas_value', valueType: 'intent', payload: { chips } };
    } else if (!passes[0] || !isAcknowledgeShaped(passes[0])) {
      passes.unshift({
        id: 'pass-acknowledge',
        visibility: 'canvas_value',
        narration: "Got it — let's see what's around.",
        valueType: 'intent',
        payload: { chips },
        confidence: 'high',
        enterDuration: 400,
        holdDuration: 1300,
        exitDuration: 250,
      });
    }
  }

  // ── SYNTHESIS beat (generic archetypes only — list/candidate_ranking
  // already close on their own curated 'complete' beat) ──────────────────
  // The real gap between the last useful tool result and the final response
  // (the model composing the answer) currently has no representation at all
  // — in Real Timing mode it is dead air. Appended with NO sourceEventIds,
  // so the generic traceTiming-assignment loop below leaves it unanchored
  // and schedule.ts's existing "unanchored passes fill the window up to
  // traceEnd" behavior places it exactly in that real tail gap — no new
  // scheduling logic needed. Never added for a gap too small to be worth
  // narrating (see MIN_SYNTHESIS_GAP_MS).
  const isGenericArchetype = classification.archetype !== 'candidate_ranking' && classification.archetype !== 'list';
  const allPasses = isGenericArchetype
    ? [...passes, ...buildSynthesisBeat({ events, requirements, classification, finalResponse, prompt: summary.prompt })]
    : passes;

  const eventById = new Map(events.map((ev) => [ev.id, ev]));
  for (const pass of allPasses) {
    const mapped = (pass.sourceEventIds ?? []).map((id) => eventById.get(id)).filter((ev): ev is NonNullable<typeof ev> => !!ev);
    if (!mapped.length) continue;
    const start = Math.min(...mapped.map((ev) => ev.startTime));
    const end = Math.max(...mapped.map((ev) => ev.endTime));
    if (Number.isFinite(start) && Number.isFinite(end) && end >= start) pass.traceTiming = { start, end };
  }
  const traceDurationMs = events.length ? Math.max(...events.map((ev) => ev.endTime)) : undefined;

  const invariantWarnings = checkDiscoveryInvariants(allPasses);

  const scenario: Level2Scenario = {
    id: `harness-${turn.turnId}`,
    archetype: classification.archetype,
    prompt: summary.prompt ?? 'Agent request',
    domain: summary.skills[0] ?? 'general',
    source,
    traceId: turn.turnId,
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
      filteredEvents: filtered,
      unrecognizedTools: streamDiag.unrecognizedTools,
      internalEventCount: streamDiag.internalEventCount,
      invariantWarnings,
      noRealTimingFound: streamDiag.noRealTimingFound,
      ...(traceDurationMs != null ? { traceDurationMs } : {}),
      ...(listMeta ? { list: listMeta } : {}),
    },
  };

  return { scenario, diagnostics };
}
