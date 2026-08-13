import type { EntityPreviewPayload, ThinkingPass } from '../types/pass';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Discovery invariants (developer-mode only).

   THE HARD RULE: whenever a pass narrates a countable discovery claim —
   "Found 4 sanctuaries", "Turned up 5 promising rivers" — the canvas must
   show exactly that many corresponding entities at that moment.

   These checks never alter playback and never reach the consumer surface.
   They exist so the NEXT extraction gap is loud in the dev panel / console
   instead of shipping as "the agent said five things over an empty screen".
   ───────────────────────────────────────────────────────────────────────────── */

export interface DiscoveryInvariantWarning {
  passId: string;
  kind: 'DISCOVERY_COUNT_MISMATCH' | 'DISCOVERY_VISUAL_MISSING' | 'DISCOVERY_CANVAS_DRIFT';
  message: string;
  narrationCount: number;
  renderedCount: number;
}

/** Matches the discovery-claim leads used by the pass builders
 *  (FOUND_LEAD in passBuilder.ts / candidateRankingPlan.ts). */
const COUNT_CLAIM_RE = /\b(?:found|turned up|spotted)\s+(\d+)\b/i;

export function checkDiscoveryInvariants(passes: ThinkingPass[]): DiscoveryInvariantWarning[] {
  const warnings: DiscoveryInvariantWarning[] = [];

  // The canvas accumulates ADD_ITEMS across passes (see useLevel2Runtime's
  // fold), so drift is checked against the CUMULATIVE tile set, not just each
  // pass's own payload — "Found 4" followed by an enrich pass that ADDs two
  // more tiles is exactly the historical bug this exists to catch.
  const canvasIds = new Set<string>();
  let lastClaim: { passId: string; count: number } | undefined;

  for (const pass of passes) {
    const payload = pass.payload as EntityPreviewPayload | undefined;
    for (const mutation of payload?.canvas ?? []) {
      if (mutation.type === 'ADD_ITEMS') for (const item of mutation.items) canvasIds.add(item.id);
    }

    const claim = pass.narration.match(COUNT_CLAIM_RE);
    if (claim) {
      const narrationCount = Number(claim[1]);
      lastClaim = { passId: pass.id, count: narrationCount };

      // A `count` payload renders the claimed number itself — the claim and
      // the visual are the same value by construction, so only the tile-less
      // state is worth flagging (the empty-canvas consumer experience).
      const renderedCount = pass.valueType === 'count' ? narrationCount : (payload?.entities?.length ?? 0);

      if (pass.valueType !== 'count' && renderedCount === 0) {
        warnings.push({
          passId: pass.id,
          kind: 'DISCOVERY_VISUAL_MISSING',
          message: `DISCOVERY VISUAL MISSING — pass "${pass.id}" narrates "${pass.narration}" but renders no candidate entities.`,
          narrationCount,
          renderedCount,
        });
      } else if (renderedCount !== narrationCount) {
        warnings.push({
          passId: pass.id,
          kind: 'DISCOVERY_COUNT_MISMATCH',
          message: `DISCOVERY COUNT MISMATCH — pass "${pass.id}" narrates ${narrationCount} but renders ${renderedCount} candidates.`,
          narrationCount,
          renderedCount,
        });
      }
    } else if (lastClaim && canvasIds.size > lastClaim.count) {
      warnings.push({
        passId: pass.id,
        kind: 'DISCOVERY_CANVAS_DRIFT',
        message: `DISCOVERY CANVAS DRIFT — pass "${pass.id}" grew the canvas to ${canvasIds.size} tiles after pass "${lastClaim.passId}" claimed ${lastClaim.count}.`,
        narrationCount: lastClaim.count,
        renderedCount: canvasIds.size,
      });
      lastClaim = undefined; // one warning per drift, not one per subsequent pass
    }
  }

  return warnings;
}
