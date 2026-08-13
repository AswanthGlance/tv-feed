import type { ThinkingStep } from '../types/thinking';

/* ─────────────────────────────────────────────────────────────────────────────
   Level 1's right panel must show a visual that matches what the active
   step is actually doing (not the same evidence grid for every step — see
   AGENT.md-level product spec). This resolver is driven by the real span/
   tool names that built the step (step.technical.spanNames, populated in
   activityMapper.ts from actual Phoenix data), not by the display label
   text, so it stays correct even as per-skill label copy changes.
   ───────────────────────────────────────────────────────────────────────────── */

export type Level1VisualMode =
  | 'preferences'
  | 'search'
  | 'maps'
  | 'retrieval'
  | 'comparison'
  | 'synthesis'
  | 'generation'
  | 'generic';

function hasSpan(step: ThinkingStep, ...needles: string[]): boolean {
  const names = step.technical?.spanNames ?? [];
  return names.some((n) => needles.some((needle) => n.includes(needle)));
}

export function resolveLevel1VisualMode(step: ThinkingStep): Level1VisualMode {
  switch (step.type) {
    case 'retrieving':
      // Only the 'recalling' group (memory.retrieval) maps to 'retrieving'
      // — see activityMapper.ts's GROUP_TO_STEP_TYPE.
      return 'preferences';
    case 'comparing':
      return 'comparison';
    case 'checking':
      if (hasSpan(step, 'GetRoute')) return 'maps';
      if (hasSpan(step, 'PlaceDetails', 'PlaceReviews')) return 'retrieval';
      return 'generic';
    case 'searching':
      if (hasSpan(step, 'WebSearch', 'WebFetch')) return 'search';
      if (hasSpan(step, 'PlaceSearch', 'NearbyPlaces')) return 'maps';
      return 'search';
    case 'generating':
      if (hasSpan(step, 'VTONGenerate')) return 'generation';
      return 'synthesis';
    case 'understanding':
    case 'guardrail':
    case 'tool':
    default:
      return 'generic';
  }
}
