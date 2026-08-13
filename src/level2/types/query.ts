/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — What the user actually asked for.

   Real harness prompts are explicit about the fields they want back, e.g.

     "Find interactive mystery nights near me. Include venue name, locality,
      weekend slots, rating, and price per person. Return a concise shortlist
      that makes choosing one easy."

   That sentence carries three separable things: the ENTITY TYPE wanted
   (venue), the ATTRIBUTES requested (locality, slots, rating, price), and the
   INTENT (shortlist => ranking). All three are used to prioritize which
   intermediate results are worth showing while the agent is still working —
   a price signal is high-value for that prompt and near-worthless for
   "explain the offside rule".
   ───────────────────────────────────────────────────────────────────────────── */

export interface QueryRequirements {
  /** Singular noun the user is asking for ('venue', 'trek', 'jacket'), when
   *  the prompt names one. */
  entityType?: string;
  /** Normalized attribute keys the prompt explicitly asked to be included —
   *  e.g. ['rating', 'price', 'location', 'availability', 'duration']. */
  requestedAttributes: string[];
  comparisonIntent: boolean;
  rankingIntent: boolean;
  routeIntent: boolean;
  listIntent: boolean;
  /** The user wants prose/explanation rather than a set of objects. */
  explanationIntent: boolean;
  /** Raw phrases matched, for dev diagnostics. */
  matchedPhrases: string[];
}

export const EMPTY_QUERY_REQUIREMENTS: QueryRequirements = {
  requestedAttributes: [],
  comparisonIntent: false,
  rankingIntent: false,
  routeIntent: false,
  listIntent: false,
  explanationIntent: false,
  matchedPhrases: [],
};
