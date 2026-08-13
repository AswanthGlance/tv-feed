import type { ScenarioArchetype, ScenarioClassification } from './archetype';
import type { FinalResponseModel } from './finalResponse';
import type { ThinkingPass } from './pass';
import type { QueryRequirements } from './query';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Scenario.

   A scenario is DATA. It contains no React, no styling, no component
   references — see types/renderer.ts for how presentation is resolved from
   `archetype` + a pass's `valueType`. This separation is what lets the same
   scenario be rendered by a leadership-facing treatment today and a different
   one tomorrow without touching any extraction logic.
   ───────────────────────────────────────────────────────────────────────────── */

export type ScenarioSource = 'phoenix' | 'cached_phoenix' | 'fixture';

export interface Level2Scenario {
  id: string;
  archetype: ScenarioArchetype;

  /** The user's request, verbatim where a real trace supplied one. */
  prompt: string;
  /** Coarse subject area ('travel', 'food', 'shopping', ...) — used ONLY for
   *  labelling and variety when picking a refresh target. Never used to
   *  classify the archetype. */
  domain: string;

  source: ScenarioSource;
  traceId?: string;

  thinkingPasses: ThinkingPass[];
  finalResponse: FinalResponseModel;

  /** Present for Phoenix-derived scenarios; absent on fixtures. */
  classification?: ScenarioClassification;
  requirements?: QueryRequirements;

  metadata?: Record<string, unknown>;
}

/** Scenarios grouped by archetype. A pool may legitimately be empty (no real
 *  trace of that shape exists in the corpus and no fixture was authored) —
 *  callers must handle that rather than assume a scenario is always
 *  available. */
export type ScenarioPools = Record<ScenarioArchetype, Level2Scenario[]>;

export function emptyPools(): ScenarioPools {
  return {
    text_only: [],
    candidate_ranking: [],
    single_entity: [],
    comparison: [],
    route_map: [],
    structured_no_image: [],
    list: [],
    summary: [],
    hybrid: [],
  };
}
