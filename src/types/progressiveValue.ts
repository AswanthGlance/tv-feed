/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Progressive Value domain model.

   This is deliberately NOT the raw Phoenix span shape (see src/types/phoenix.ts)
   and not the Level 1 ThinkingScenario/ThinkingStep shape (see
   src/types/thinking.ts). Level 2 renders an evolving *canvas* of candidate
   items, not a step timeline — so its model is a small state machine driven
   by an ordered list of mutations, each carrying a `state` transition for the
   items it touches.

   Phoenix operation -> AgentMutation -> Experience Pass -> UI mutation
   (not: Phoenix span -> text row)

   Mutations here carry no timing of their own — see src/types/experiencePass.ts
   for the ExperiencePass timeline that schedules them (one pass = one
   meaningful, individually-readable state of the canvas, with explicit
   enter/hold/exit durations). src/adapters/phoenixToMutations.ts is the
   (currently stub) place that will turn real trace spans into these
   mutations. Until then, Level 2 is driven by a hand-authored pass timeline
   (see src/data/level2TravelFixture.ts) — clearly labelled wherever it's
   consumed as a presentation fixture, not real output.
   ───────────────────────────────────────────────────────────────────────────── */

export type ProgressiveItemType =
  | 'place'
  | 'product'
  | 'recipe'
  | 'event'
  | 'media'
  | 'generic';

export type ProgressiveItemState =
  | 'discovered'
  | 'enriched'
  | 'negated'
  | 'shortlisted'
  | 'promoted'
  | 'removed';

/** Content-density tier a card renders at — separate from `ProgressiveItemState`
 *  (which drives the emphasis styling: border/glow/scale) and from `focused`
 *  (keyboard-nav ring). Controls which optional rows show, not how the card
 *  looks otherwise. See src/logic/cardImportance.ts. */
export type CardImportance = 'compact' | 'standard' | 'shortlisted' | 'promoted' | 'resolved';

/** Free-form enrichment bag, with a few named fields typed for convenience
 *  since the travel fixture (and the eventual real place/product data) uses
 *  them repeatedly. Anything else can still ride along untyped. */
export interface ProgressiveItemMetadata {
  travelTime?: string;
  distance?: string;
  rating?: number;
  reviewCount?: number;
  stayOption?: string;
  reason?: string;
  priceLevel?: string;
  /** Real opening-hours/time-slot text, when the trace's own data had it
   *  (a `<hours>` tag or PlaceDetails' `opening_hours`) — absent, not
   *  guessed, when the source data didn't carry it. */
  availability?: string;
  /** Google Places `place_id`, when the source entity had one — the real
   *  image-lookup key (see Level2CandidateCard's EnrichedImage), never
   *  fabricated. Absent for fixture items and any real entity that never
   *  resolved to a Places record. */
  placeId?: string;
  /** Short factual bullets ("Coffee estates", "Cool weather") — evidence the
   *  comparison is built on. Rendered with a visibly different, quieter
   *  typographic treatment than `judgment` so a viewer can tell "this came
   *  from data" apart from "this is what the agent concluded." */
  evidence?: string[];
  /** The agent's own short concluding read of the evidence above (e.g.
   *  "GOOD BALANCE", "LONGEST DRIVE") — an opinion, not a fact. */
  judgment?: string;
  /** Why this candidate is being set aside — shown while state is
   *  'negated', before it actually recedes to 'removed'. Negation should be
   *  legible, not a silent disappearance. */
  negationReason?: string;
  /** A lighter-touch signal than 'negated': the candidate wasn't ruled out
   *  for a specific reason, it was just outweighed by stronger options
   *  (e.g. Coorg at the SHORTLIST pass). Deliberately a metadata flag, not
   *  its own state — the state machine stays small; this just asks the
   *  card to visually recede a notch without claiming a rejection reason
   *  that doesn't exist. */
  deprioritized?: boolean;
  [key: string]: unknown;
}

export interface ProgressiveItem {
  id: string;
  type: ProgressiveItemType;
  title: string;
  subtitle?: string;
  image?: string;
  metadata?: ProgressiveItemMetadata;
  state: ProgressiveItemState;
}

/** How confident the Phoenix->mutation adapter is that a given real mutation
 *  is actually supported by trace evidence, rather than inferred from a thin
 *  or ambiguous signal. Dev-panel-only — never surfaced in the leadership
 *  UI. Absent entirely on hand-authored fixture mutations (they're
 *  definitionally "real" for demo purposes, not a confidence-scored guess). */
export type MutationConfidence = 'high' | 'medium' | 'low';

/** Fields every real (Phoenix-derived) mutation carries so the dev panel can
 *  show "why did this happen" — which spans produced it and how sure the
 *  adapter is. Optional so the hand-authored fixture (src/data/
 *  level2TravelFixture.ts) keeps type-checking unchanged; it simply never
 *  sets them. */
interface MutationProvenance {
  sourceSpanIds?: string[];
  confidence?: MutationConfidence;
}

/** The vocabulary of things an agent operation can do to the canvas.
 *  No `at`/timing lives here — see PassMutation in experiencePass.ts for how
 *  a mutation is placed on the timeline. Mirrors (loosely) the eventual
 *  Phoenix mapping: DISCOVER->ADD_ITEMS, ENRICH->ENRICH_ITEMS,
 *  COMPARE->ADD_EVIDENCE/UPDATE_JUDGMENT, NEGATE->NEGATE_ITEMS,
 *  SHORTLIST->SHORTLIST_ITEMS, PROMOTE->PROMOTE_ITEM, RESOLVE->RESOLVE_RESULT.
 *
 *  What the agent is DOING/LEARNING (narration/insight) is no longer part of
 *  this vocabulary — it lives directly on the pass (see AgentNarration /
 *  PassInsight in experiencePass.ts) rather than being folded from mutations,
 *  since it's pass-level content, not an item-level state change. */
export type AgentMutation = MutationProvenance &
  (
    | { type: 'ADD_ITEMS'; items: ProgressiveItem[] }
    | { type: 'ENRICH_ITEMS'; patches: Array<{ id: string; data: Record<string, unknown> }> }
    | { type: 'ADD_EVIDENCE'; patches: Array<{ id: string; evidence: string[] }> }
    | { type: 'UPDATE_JUDGMENT'; patches: Array<{ id: string; judgment: string }> }
    | { type: 'REORDER_ITEMS'; orderedIds: string[] }
    /** Flags candidates for removal WITHOUT hiding them yet — they stay on
     *  screen, dimmed, showing `reason`, so the viewer sees the agent's
     *  negative signal instead of a candidate silently vanishing. A later
     *  REMOVE_ITEMS is what actually recedes them. */
    | { type: 'NEGATE_ITEMS'; items: Array<{ id: string; reason: string }> }
    | { type: 'SHORTLIST_ITEMS'; ids: string[] }
    | { type: 'REMOVE_ITEMS'; ids: string[] }
    | { type: 'PROMOTE_ITEM'; id: string }
    /** No item-level effect — a marker so the dev panel / mutation log can
     *  show the moment the agent's work turns into a resolved answer, even
     *  though the visual crystallization is driven by the RESOLVE pass's
     *  phase transition (see Level2Experience.tsx), not by an item mutation. */
    | { type: 'RESOLVE_RESULT' }
  );
