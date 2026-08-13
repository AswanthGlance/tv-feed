import type { FinalResponseModel } from '../types/finalResponse';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Final response integrity.

   A scenario can classify correctly and still be unusable: a route with one
   stop, a table with no rows, a comparison with no dimensions. Those render as
   empty frames, which is worse for a demo than falling back to a scenario that
   has something in it.

   This check is shared by the runtime path (scenarios/fromTrace.ts, which
   rejects hollow traces so the registry moves on) and the corpus sweep
   (scripts/classify-phoenix-corpus.ts, which reports CLASSIFIED and USABLE as
   separate numbers). One implementation, so the report can never claim a pool
   is bigger than what the app would actually accept from it.
   ───────────────────────────────────────────────────────────────────────────── */

/** A reason string when the response has the right shape but nothing to put in
 *  it; undefined when it is renderable.
 *
 *  Text and summary render the headline as a spoken agent line ABOVE the
 *  reading surface (see adaptToL1.ts's `agentLine`), with body/takeaways/
 *  supporting content as the actual surface underneath. A headline with
 *  nothing beneath it is exactly the "agent says it found something, screen
 *  stays empty" failure — usually because the trace's `<place_card>` /
 *  `<card_template>` wrapper was cut mid-tag by an output-truncation limit
 *  and only the leading prose sentence survived parsing. That is worse for a
 *  demo than falling back to a scenario that has something in it, so it is
 *  rejected here rather than shown as a bare quote. */
export function describeHollowResponse(response: FinalResponseModel): string | undefined {
  switch (response.kind) {
    case 'route':
      return response.route.stops.length < 2 ? 'the response carries no route stops to show.' : undefined;
    case 'structured':
      return response.rows.length === 0 ? 'the response carries no structured rows to tabulate.' : undefined;
    case 'comparison':
      return response.comparison.dimensions.length === 0
        ? 'the response carries no comparable dimensions.'
        : response.comparison.subjects.length < 2
          ? 'the response names fewer than two subjects to compare.'
          : undefined;
    case 'entity_rail':
      return response.entities.length < 2 ? 'the response names fewer than two comparable entities.' : undefined;
    case 'list':
      return response.items.length < 2 ? 'the response names fewer than two items.' : undefined;
    case 'hybrid':
      return response.sections.length < 2 ? 'the response has fewer than two output forms.' : undefined;
    case 'text':
      if (response.headline.trim().length === 0) return 'the response has no text at all.';
      return response.body.length === 0 && !response.supporting?.length
        ? 'the headline has no body text or supporting content beneath it.'
        : undefined;
    case 'summary':
      if (response.headline.trim().length === 0) return 'the response has no text at all.';
      return response.takeaways.length === 0 && !response.themes?.length && !response.supporting?.length
        ? 'the headline has no takeaways, themes or supporting content beneath it.'
        : undefined;
    default:
      return undefined;
  }
}
