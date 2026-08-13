/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Scenario archetypes.

   An archetype is the SHAPE OF THE ANSWER, not the domain. Travel can be a
   candidate ranking, a route, a single entity, or a hybrid; sports can be
   text, structured, or summary. Classification therefore reads interaction
   and output shape (how many peer entities, is there a winner signal, is
   there a route, is the output structured/numeric, ...), never the skill or
   subject matter — see classification/scenarioClassifier.ts.
   ───────────────────────────────────────────────────────────────────────────── */

export type ScenarioArchetype =
  | 'text_only'
  | 'candidate_ranking'
  | 'single_entity'
  | 'comparison'
  | 'route_map'
  | 'structured_no_image'
  | 'list'
  | 'summary'
  | 'hybrid';

/** Internal-only classification outcome. Never a selectable archetype in the
 *  scenario selector — a trace that lands here has no scenario pool and is
 *  reported in diagnostics instead of being forced into a bucket. */
export type ClassifiedArchetype = ScenarioArchetype | 'unknown';

export const SCENARIO_ARCHETYPES: ScenarioArchetype[] = [
  'text_only',
  'candidate_ranking',
  'single_entity',
  'comparison',
  'route_map',
  'structured_no_image',
  'list',
  'summary',
  'hybrid',
];

/** Consumer-facing labels for the demo selector. Deliberately describes the
 *  ANSWER the viewer gets, not the internal mechanism. */
export const ARCHETYPE_LABEL: Record<ScenarioArchetype, string> = {
  text_only: 'Text-only answer',
  candidate_ranking: 'Candidate ranking',
  single_entity: 'Single entity enrichment',
  comparison: 'Comparison',
  route_map: 'Route / map',
  structured_no_image: 'Structured / no-image',
  list: 'List without winner',
  summary: 'Summary / synthesis',
  hybrid: 'Parallel-tool / hybrid',
};

export type ClassificationConfidence = 'high' | 'medium' | 'low';

export interface ScenarioClassification {
  archetype: ClassifiedArchetype;
  confidence: ClassificationConfidence;
  /** The user's actual request, when the trace carries one. */
  prompt?: string;
  /** Human-readable reasons the classifier landed here — the audit trail for
   *  PHOENIX_SCENARIO_ARCHETYPES.md and the dev panel. Never shown to a
   *  leadership viewer. */
  signals: string[];
  /** Count of COMPARABLE PEER entities only — attributes and supporting
   *  information are excluded (see classification/entityRole.ts). */
  entityCount?: number;
  hasImages: boolean;
  hasMapSignals: boolean;
  hasStructuredData: boolean;
  /** Short tag for the response envelope actually observed, e.g.
   *  'place_card', 'card_template', 'product_ids', 'prose', 'empty'. */
  outputShape?: string;
  /** Set when the trace is real but structurally unusable for Level 2 (e.g.
   *  an empty response, or a batch content-generation run whose N outputs
   *  are unrelated deliverables rather than competing candidates). */
  excludedReason?: string;
}
