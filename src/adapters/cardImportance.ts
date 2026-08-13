import type { CardImportance, ProgressiveItemState } from '../types/progressiveValue';

/* ─────────────────────────────────────────────────────────────────────────────
   CARD IMPORTANCE — one derived tier instead of the 4 independent booleans
   (compact/resolved/crystallized/topPick) Level2CandidateCard used to take.
   Controls CONTENT DENSITY (which optional rows render) — separate from
   `ProgressiveItemState`, which still drives the emphasis styling
   (border/glow/scale) via its own `.att-l2-card--${state}` CSS, and from
   `focused`, which is TV remote-nav only. Two cards can share an importance
   tier while differing in state (e.g. a 'shortlisted' vs 'promoted' card both
   render at the 'shortlisted' content tier). ───────────────────────────────── */

export function deriveCardImportance(params: {
  isResolvedPhase: boolean;
  isPromotedItem: boolean;
  itemState: ProgressiveItemState;
  isCompactLayout: boolean;
}): CardImportance {
  const { isResolvedPhase, isPromotedItem, itemState, isCompactLayout } = params;
  if (isResolvedPhase) return isPromotedItem ? 'resolved' : 'standard';
  if (isCompactLayout) return 'compact';
  if (itemState === 'shortlisted' || itemState === 'promoted') return 'shortlisted';
  return 'standard';
}

/* ─────────────────────────────────────────────────────────────────────────────
   QUERY-DRIVEN ATTRIBUTE PRIORITY — a small keyword table, not an LLM call.
   Used only to decide which optional rows win a scarce content slot at the
   compact/standard tiers when a card can't show everything real it knows;
   shortlisted/promoted/resolved tiers already show every populated field
   regardless of this ordering. ───────────────────────────────────────────── */

export type RequestedAttribute = 'rating' | 'price' | 'availability' | 'travelTime';

const KEYWORD_RULES: Array<{ attr: RequestedAttribute; pattern: RegExp }> = [
  { attr: 'rating', pattern: /\b(highest[- ]?rated|top[- ]?rated|best rated|rating)\b/i },
  { attr: 'price', pattern: /\b(price|per person|per head|₹|cost|budget|cheap|expensive)\b/i },
  { attr: 'availability', pattern: /\b(time slot|slots?|available|availability|this weekend|open now|hours)\b/i },
  { attr: 'travelTime', pattern: /\b(near me|nearby|distance|drive|driving|travel time|walk(?:ing)? distance)\b/i },
];

/** Returns the attribute types the query itself asked for, in the order they
 *  appear in the query text — empty if the query doesn't name any explicitly
 *  (compact/standard tiers then fall back to their existing default row
 *  order). Pure, deterministic, no network/LLM call. */
export function extractRequestedFields(query: string): RequestedAttribute[] {
  if (!query) return [];
  const found: Array<{ attr: RequestedAttribute; index: number }> = [];
  for (const { attr, pattern } of KEYWORD_RULES) {
    const match = query.match(pattern);
    if (match?.index != null && !found.some((f) => f.attr === attr)) {
      found.push({ attr, index: match.index });
    }
  }
  return found.sort((a, b) => a.index - b.index).map((f) => f.attr);
}
