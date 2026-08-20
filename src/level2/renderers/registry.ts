import type { ComponentType } from 'react';
import type { ThinkingValueType } from '../types/pass';
import type { ScenarioArchetype } from '../types/archetype';
import type { ThinkingRendererProps } from '../types/renderer';

import {
  AvailabilityValue,
  ClusterValue,
  ComparisonSignalValue,
  CountValue,
  EntityPreviewValue,
  GenericValue,
  IntentSummaryValue,
  MemorySignalsValue,
  RouteValue,
  SourcesValue,
  SynthesisStructureValue,
  TextValue,
  TimelineValue,
} from '../../components/AgentThinkingTrace/level2/ThinkingValueRenderers';
import { CandidateCanvasThinking } from '../../components/AgentThinkingTrace/level2/CandidateCanvasThinking';
import { ListCanvasThinking } from '../../components/AgentThinkingTrace/level2/ListCanvasThinking';
import MapThinkingStage from '../../components/AgentThinkingTrace/level2/MapThinkingStage';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Renderer resolution.

   Thinking-renderer resolution only. Adding or replacing a thinking visual
   treatment means editing an entry here — never growing a conditional inside
   an experience component, which is exactly how the old single-scenario
   Level 2 would have turned into an unmaintainable if/else as archetypes
   were added.

   Thinking renderers resolve on `archetype:valueType` first, then fall back to
   `valueType`. That override slot is what lets candidate_ranking render an
   entity preview as its continuous evolving canvas while `list` and `hybrid`
   render the same payload as a plain set.

   There is no final-renderer registry here by design: the final response is
   not a Level 2 visual treatment at all — it is one of the four existing
   /l1-scenarios templates, resolved and mounted by Level2FinalResponse /
   adaptToL1.ts, not dispatched through this file.
   ───────────────────────────────────────────────────────────────────────────── */

type AnyThinkingRenderer = ComponentType<ThinkingRendererProps<never>>;

/** Value-type defaults — what every archetype gets unless it overrides. */
const THINKING_BY_VALUE_TYPE: Record<ThinkingValueType, AnyThinkingRenderer> = {
  count: CountValue as AnyThinkingRenderer,
  sources: SourcesValue as AnyThinkingRenderer,
  text: TextValue as AnyThinkingRenderer,
  entity_preview: EntityPreviewValue as AnyThinkingRenderer,
  comparison_signal: ComparisonSignalValue as AnyThinkingRenderer,
  // Spatial reasoning gets the contained map stage for EVERY archetype, not
  // just route_map — a hybrid trip plan that calls GetRoute is doing exactly
  // the same spatial thinking and deserves the same treatment. RouteValue (the
  // text-only stop list) stays exported for multi-stop payloads, which the map
  // does not handle yet.
  route: MapThinkingStage as AnyThinkingRenderer,
  availability: AvailabilityValue as AnyThinkingRenderer,
  timeline: TimelineValue as AnyThinkingRenderer,
  cluster: ClusterValue as AnyThinkingRenderer,
  generic: GenericValue as AnyThinkingRenderer,
  memory_signals: MemorySignalsValue as AnyThinkingRenderer,
  intent: IntentSummaryValue as AnyThinkingRenderer,
  synthesis_structure: SynthesisStructureValue as AnyThinkingRenderer,
};

/** Archetype overrides, keyed `archetype:valueType`. */
const THINKING_OVERRIDES: Partial<Record<`${ScenarioArchetype}:${ThinkingValueType}`, AnyThinkingRenderer>> = {
  // The evolving candidate canvas — the existing Level 2 interaction work,
  // preserved intact and now reachable through the same contract as
  // everything else.
  'candidate_ranking:entity_preview': CandidateCanvasThinking as AnyThinkingRenderer,
  // The accumulating balanced grid — list is a SET to explore, so its canvas
  // fills out and stays equal (no shortlist hierarchy), and can regroup into
  // themes. See ListCanvasThinking.tsx / listPlan.ts.
  'list:entity_preview': ListCanvasThinking as AnyThinkingRenderer,
};

export function resolveThinkingRenderer(
  archetype: ScenarioArchetype,
  valueType: ThinkingValueType
): AnyThinkingRenderer {
  return THINKING_OVERRIDES[`${archetype}:${valueType}`] ?? THINKING_BY_VALUE_TYPE[valueType] ?? GenericValue as AnyThinkingRenderer;
}
