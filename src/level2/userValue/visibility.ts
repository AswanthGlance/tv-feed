import type { SemanticAgentEvent, SemanticEventType } from '../../types/semanticEvent';
import type { QueryRequirements } from '../types/query';
import type { ThinkingVisibility } from '../types/pass';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — User-value classification.

   This is the module that answers the stakeholder note directly: thinking must
   not expose technical backend states just because they exist.

   An operation earns a place on screen by what it gives the USER, never by
   having happened:

     invisible     Routing, guardrails, schema/format transforms, memory reads,
                   internal LLM plumbing. The user learns nothing from these and
                   understanding them requires understanding the agent's
                   internals. They never become a pass. They stay in developer
                   diagnostics, which is where they belong.

     status        The operation is worth narrating — it tells the user what is
                   being taken care of on their behalf ("Checking weekend
                   availability") — but it has not produced anything consumable
                   yet. Narration only.

     canvas_value  The operation produced information the user can actually use
                   right now ("8 options found", "5 available tonight",
                   "3 under ₹1,000", "18 minutes saved"). Narration AND payload.

   The query requirements matter here: a price signal is canvas_value for
   "what's the cheapest option" and closer to noise for "explain the offside
   rule". Value is relative to what was asked.
   ───────────────────────────────────────────────────────────────────────────── */

/** Operation kinds that never carry consumer value on their own. */
const ALWAYS_INVISIBLE: SemanticEventType[] = ['internal', 'unknown'];

/** Whether an event actually produced something the user could consume. */
function producedConsumableResult(event: SemanticAgentEvent): boolean {
  if (event.entities && event.entities.length > 0) return true;
  const meta = event.metadata as Record<string, unknown> | undefined;
  if (!meta) return false;
  return (
    typeof meta.resultCount === 'number' ||
    typeof meta.travelTime === 'string' ||
    typeof meta.distance === 'string' ||
    typeof meta.savings === 'string' ||
    Array.isArray(meta.facts) ||
    Array.isArray(meta.slots) ||
    Array.isArray(meta.themes)
  );
}

/** Whether the user asked for anything this event speaks to. Keeps a
 *  technically-successful-but-irrelevant operation from claiming canvas space. */
function relevantToRequest(event: SemanticAgentEvent, requirements: QueryRequirements): boolean {
  const attrs = requirements.requestedAttributes;
  switch (event.type) {
    case 'maps':
      return requirements.routeIntent || attrs.includes('distance') || attrs.includes('location');
    case 'availability':
    case 'schedule':
      return attrs.includes('availability') || attrs.includes('duration') || attrs.includes('season');
    case 'compare':
      return requirements.comparisonIntent || requirements.rankingIntent || attrs.includes('rating') || attrs.includes('price');
    default:
      // Discovery, retrieval, enrichment, ranking and synthesis are relevant
      // to essentially any request that produced them.
      return true;
  }
}

export interface VisibilityDecision {
  visibility: ThinkingVisibility;
  /** Why — developer diagnostics only, never shown to a viewer. */
  reason: string;
}

export function classifyEventVisibility(
  event: SemanticAgentEvent,
  requirements: QueryRequirements
): VisibilityDecision {
  if (ALWAYS_INVISIBLE.includes(event.type)) {
    return { visibility: 'invisible', reason: `${event.type} operation carries no consumer meaning.` };
  }

  // A 'final' event is not thinking at all — it is the answer, and it belongs
  // to the final response model, not to a pass.
  if (event.type === 'final') {
    return { visibility: 'invisible', reason: 'Final response belongs to the final renderer, not to thinking.' };
  }

  if (!relevantToRequest(event, requirements)) {
    return { visibility: 'status', reason: 'Ran, but speaks to nothing the user asked for — narrate, do not show.' };
  }

  if (producedConsumableResult(event)) {
    return { visibility: 'canvas_value', reason: 'Produced information the user can consume now.' };
  }

  return { visibility: 'status', reason: 'Worth telling the user about, but produced nothing consumable yet.' };
}

/** Splits a whole event stream by visibility in one pass. The `invisible`
 *  bucket is returned rather than dropped so the dev panel can show exactly
 *  what was filtered and why — "what did you hide from me" is a question the
 *  diagnostics must be able to answer. */
export function partitionByVisibility(events: SemanticAgentEvent[], requirements: QueryRequirements) {
  const invisible: Array<{ event: SemanticAgentEvent; reason: string }> = [];
  const status: SemanticAgentEvent[] = [];
  const canvasValue: SemanticAgentEvent[] = [];

  for (const event of events) {
    const decision = classifyEventVisibility(event, requirements);
    if (decision.visibility === 'invisible') invisible.push({ event, reason: decision.reason });
    else if (decision.visibility === 'status') status.push(event);
    else canvasValue.push(event);
  }

  return { invisible, status, canvasValue };
}
