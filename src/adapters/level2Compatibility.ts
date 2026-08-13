import type { PhoenixSpan } from '../types/phoenix';
import type { PassStage } from '../types/experiencePass';
import { phoenixSpansToMutations } from './phoenixToMutations';

export type Level2CompatibilityScore = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNSUPPORTED';

export interface Level2CompatibilityResult {
  score: Level2CompatibilityScore;
  reasons: string[];
  stagesPresent: PassStage[];
  candidateCount: number;
}

/** Runs the real mapping pipeline (not a cheap heuristic guess) and scores
 *  how much of the DISCOVER->ENRICH->COMPARE->NEGATE->SHORTLIST->PROMOTE->
 *  RESOLVE arc it actually produced from this trace's real data. Used to
 *  pick a good trace to auto-select and to show a compatibility score in
 *  the developer trace selector — never to fabricate stages that scored
 *  low. */
export function analyzeLevel2Compatibility(spans: PhoenixSpan[]): Level2CompatibilityResult {
  const { mutations, diagnostics } = phoenixSpansToMutations(spans);
  const stagesPresent = [...new Set(mutations.map((m) => m.stage))];
  const hasDiscover = stagesPresent.includes('discover');
  const hasEnrichOrCompare = stagesPresent.includes('enrich') || stagesPresent.includes('compare');
  const hasPromoteOrShortlist = stagesPresent.includes('promote') || stagesPresent.includes('shortlist');
  const hasResolve = stagesPresent.includes('resolve');
  // extractedEntityCount is already the deduplicated total (it counts every
  // registry entry, including ones only discovered via matching a final
  // card) — adding finalCardCount on top would double-count any candidate
  // that was both discovered earlier AND present in the final response.
  const candidateCount = diagnostics.extractedEntityCount;

  const reasons: string[] = [];
  let score: Level2CompatibilityScore;

  if (!hasDiscover || candidateCount < 2) {
    score = 'UNSUPPORTED';
    reasons.push(
      candidateCount < 2
        ? `Only ${candidateCount} real candidate(s) could be extracted — progressive narrowing needs at least 2.`
        : 'No DISCOVER-stage candidates could be extracted from this trace.'
    );
  } else if (hasDiscover && hasEnrichOrCompare && hasPromoteOrShortlist && hasResolve) {
    score = 'HIGH';
    reasons.push(`Full arc: ${stagesPresent.join(' -> ')}, ${candidateCount} real candidates.`);
  } else if (hasDiscover && (hasEnrichOrCompare || hasPromoteOrShortlist)) {
    score = 'MEDIUM';
    reasons.push(`Partial arc: ${stagesPresent.join(' -> ')} — some stages have no real supporting data.`);
  } else {
    score = 'LOW';
    reasons.push('Only bare candidate discovery — little to no enrichment, comparison, or resolution signal.');
  }

  if (diagnostics.skipped.length) {
    reasons.push(`${diagnostics.skipped.length} would-be mutation(s) skipped — insufficient real evidence.`);
  }

  return { score, reasons, stagesPresent, candidateCount };
}
