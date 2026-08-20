import type { AgentMutation } from '../../types/progressiveValue';
import type { NormalizedEntity } from './entity';
import type { MemorySignal } from './memory';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Thinking passes.

   THE CORE RULE OF THIS FILE: a raw agent operation does not earn a place on
   screen just because it happened. Every operation is first classified by
   USER VALUE (see userValue/visibility.ts):

     invisible     — guardrails, routing, schema/format transforms, internal
                     LLM plumbing. Never produces a consumer-facing pass. Still
                     visible in developer diagnostics.
     status        — worth telling the user about ("Checking weekend
                     availability") but hasn't produced consumable information
                     yet. Narration only, no payload.
     canvas_value  — produced information worth consuming ("8 options found",
                     "3 under ₹1,000", "18 minutes saved"). Narration AND a
                     typed value payload.

   Only `status` and `canvas_value` reach a ThinkingPass. Several low-level
   events routinely collapse into ONE consumer pass — five spans
   (places.search, web.search, retriever, distance_matrix, ranking) should
   read as "Finding nearby options -> 8 promising places", not as five rows.

   Thinking is deliberately LIGHTER than the final response: partial, selective,
   contextual. It is not the final result cards loading in slowly. The final
   response (see finalResponse.ts) is the complete, stable, actionable one.
   ───────────────────────────────────────────────────────────────────────────── */

export type ThinkingVisibility = 'invisible' | 'status' | 'canvas_value';

export type ThinkingValueType =
  | 'count'
  | 'sources'
  | 'text'
  | 'entity_preview'
  | 'comparison_signal'
  | 'route'
  | 'availability'
  | 'timeline'
  | 'cluster'
  | 'generic'
  | 'memory_signals'
  | 'intent'
  | 'synthesis_structure';

/* ── Value payloads — presentation-neutral data only. No JSX, no class names,
   no colors, no pixel sizes. A renderer decides how any of this looks. ──── */

export interface CountPayload {
  value: number;
  /** What is being counted, in the user's language: 'options found',
   *  'available tonight', 'under ₹1,000'. */
  label: string;
  /** Optional secondary framing, e.g. 'out of 14 checked'. */
  qualifier?: string;
}

/** Evidence for "I read around this" — real, named sources, never invented.
 *  See phoenix/sources.ts. Counts must stay credible against what is shown:
 *  `sources` may be a subset of `sourceCount`, and the renderer is responsible
 *  for a "+N" overflow marker rather than implying the visible chips are all
 *  of them. */
export interface SourcesPayload {
  sources: Array<{ label: string; kind: 'web' | 'maps'; domain?: string }>;
  sourceCount: number;
  searchCount: number;
}

export interface TextPayload {
  /** Short, discovered statements — facts, themes, milestones. Never
   *  fabricated entities dressed up as prose. */
  lines: string[];
}

/** ONE dimension the agent is inspecting across the WHOLE candidate set at a
 *  single moment — the data behind a comparison beat.
 *
 *  Deliberately one dimension at a time. Showing price, rating and availability
 *  together produces a spec table, which is a finished answer; showing them in
 *  sequence produces the act of comparing, which is what the thinking phase is
 *  actually depicting.
 *
 *  `values` is SPARSE on purpose: an id absent from it means that candidate
 *  genuinely has no value for this dimension. The renderer shows an em dash.
 *  A missing value is never filled in, and never removes the candidate from
 *  the comparison. */
/** One subject's value on one dimension, split into the part that is actually
 *  being compared and the part that only qualifies it.
 *
 *  '₹2,750 per person' compares on '₹2,750'; 'per person' is the same on every
 *  card and repeating it at full size four times buries the number the viewer
 *  is trying to read. Both halves come from the SAME source string and both are
 *  shown — this is a typographic split, never an edit. */
export interface ComparisonValue {
  /** The comparable part, rendered as the headline. */
  display: string;
  /** The trailing qualifier from the same source string, rendered smaller.
   *  Absent when the value has no qualifier. */
  note?: string;
}

export interface ComparisonFocus {
  /** Stable dimension id: 'price' | 'rating' | 'availability' | … */
  key: string;
  /** Short uppercase face label: 'PRICE'. */
  label: string;
  /** Whether the values are magnitudes the eye scans as a column of figures,
   *  or free text. Presentation-neutral: the renderer decides that a numeric
   *  column earns a larger, tabular treatment than a column of opening hours. */
  scale: 'numeric' | 'text';
  /** Subject id -> value. Sparse; see above. */
  values: Record<string, ComparisonValue>;
  /** Ids that genuinely lead on this dimension. Empty/absent means the data
   *  does not distinguish one — never guessed, never decorative. */
  leaderIds?: string[];
  /** The claim being made about the leader: 'LOWEST', 'HIGHEST RATED'. Only
   *  ever present alongside a non-empty `leaderIds`. */
  leaderLabel?: string;
  /** Position in the comparison sequence (0-based) and its length. The
   *  renderer alternates its turn animation on this so each dimension replays
   *  without remounting anything. */
  step: number;
  stepCount: number;
}

export interface EntityPreviewPayload {
  /** A PARTIAL view — thinking shows what is known so far, not the finished
   *  set. May carry fewer fields than the same entity has in the final
   *  response. */
  entities: NormalizedEntity[];
  /** Ids to emphasise at this moment (e.g. the two that are pulling ahead). */
  emphasisIds?: string[];
  /** When present, the canvas is in COMPARISON MODE for this pass: the same
   *  persistent tiles turn their fact plane over to show this one dimension.
   *  Never accompanied by `emphasisIds` — during comparison the dimension is
   *  the subject, not any individual candidate. */
  comparison?: ComparisonFocus;
  /** When present, the SAME persistent tiles regroup under these labels — the
   *  list archetype's clustering beat. Grouping is presentation of this one
   *  pass; item state never changes and nothing recedes. Labels come from the
   *  items' own theme/category data, never invented (see listPlan.ts). */
  groups?: Array<{ label: string; ids: string[] }>;
  /** Canvas state transitions for the evolving-candidate renderer, which
   *  renders ONE continuous canvas rather than re-mounting per pass. Data,
   *  not presentation: the vocabulary is ADD/ENRICH/NEGATE/SHORTLIST/PROMOTE
   *  (see src/types/progressiveValue.ts), and the renderer decides entirely
   *  what each transition looks like. */
  canvas?: AgentMutation[];
}

export interface ComparisonDimension {
  key: string;
  label: string;
  /** Per-subject value, keyed by subject id. Strings so a renderer never has
   *  to guess a unit or format. */
  values: Record<string, string>;
  /** Subject id that leads on this dimension, when the data genuinely
   *  distinguishes one. Absent means "too close to call" — never guessed. */
  leaderId?: string;
}

export interface ComparisonSignalPayload {
  subjects: Array<{ id: string; label: string }>;
  dimensions: ComparisonDimension[];
}

export interface RouteStop {
  id: string;
  label: string;
  /** Cumulative or leg-relative time text as the source gave it. */
  eta?: string;
  detail?: string;
}

/** A real point on the earth, with the name the agent used for it. Only ever
 *  constructed from coordinates the trace actually carried. */
export interface GeoPoint {
  lat: number;
  lng: number;
  /** Short display name: 'Kochi', 'Munnar'. Never a full address, never raw
   *  coordinates — the viewer is being told where, not given a data dump. */
  label: string;
}

/** The spatial half of a route pass: what can honestly be drawn.
 *
 *  `geometry` is the load-bearing field. Real `tool.GetRoute` output carries a
 *  leg's START and END coordinates and NOTHING BETWEEN THEM — there is no
 *  polyline in the trace. So a map drawn from this data knows exactly two true
 *  points and must not imply it knows the road. 'endpoints' says that
 *  explicitly, and the renderer answers it with an openly abstract connector
 *  rather than a road-shaped line.
 *
 *  'path' exists for the day the harness emits geometry. Nothing produces it
 *  today, and nothing should synthesise it. */
export interface RouteGeography {
  origin: GeoPoint;
  destination: GeoPoint;
  geometry: 'endpoints' | 'path';
  /** Ordered intermediate points. Only ever present with geometry: 'path'. */
  path?: Array<{ lat: number; lng: number }>;
}

export interface RoutePayload {
  origin?: string;
  destination?: string;
  stops: RouteStop[];
  distance?: string;
  eta?: string;
  /** e.g. '18 minutes saved' — only when the source data actually compared
   *  two routes. */
  savings?: string;
  alternates?: Array<{ label: string; eta?: string; distance?: string; note?: string }>;

  /** Present only when the trace carried real coordinates. Without it the
   *  route pass still renders — as text — because a distance and a duration
   *  are true and useful even with nowhere to put them on a map. */
  geo?: RouteGeography;

  /** Which beat of the map sequence this pass is. The map is built up over
   *  three narrated moments rather than appearing finished, so the viewer sees
   *  the agent constructing the spatial answer:
   *    'locate'   surface + both markers
   *    'route'    the connector draws
   *    'summary'  duration/distance come forward
   *  A location-only pass (no route was calculated) uses 'locate' alone. */
  stage?: 'locate' | 'route' | 'summary';
}

export interface AvailabilitySlot {
  label: string;
  state: 'open' | 'limited' | 'full' | 'unknown';
  detail?: string;
}

export interface AvailabilityPayload {
  summary?: string;
  slots: AvailabilitySlot[];
}

export interface TimelinePayload {
  items: Array<{ label: string; time?: string; detail?: string }>;
}

export interface ClusterPayload {
  clusters: Array<{ label: string; count: number; examples?: string[] }>;
}

export interface GenericPayload {
  label: string;
  detail?: string;
}

/** The acknowledgement beat's visual — 2-5 short chips extracted from the
 *  real prompt (see userValue/intentChips.ts), never a paraphrase of the
 *  whole request. "I understood what you're asking," not a result. */
export interface IntentPayload {
  chips: string[];
}

/** The SYNTHESIS beat's visual (see harnessStream/synthesisBeat.ts) — real
 *  section/dimension LABELS from the classified final response, revealed
 *  progressively while the model is genuinely composing the answer. Never
 *  the section's actual content — labels only, so nothing is revealed
 *  early. */
export interface SynthesisStructurePayload {
  sections: string[];
}

/** Recalled personal context — see types/memory.ts. Never the raw memory
 *  payload: `signals` is already filtered for relevance and capped for TV
 *  display by the time it reaches a renderer. */
export interface MemorySignalsPayload {
  signals: MemorySignal[];
}

export type ThinkingPayload =
  | CountPayload
  | SourcesPayload
  | TextPayload
  | EntityPreviewPayload
  | ComparisonSignalPayload
  | RoutePayload
  | AvailabilityPayload
  | TimelinePayload
  | ClusterPayload
  | GenericPayload
  | MemorySignalsPayload
  | IntentPayload
  | SynthesisStructurePayload;

/** Maps a valueType to the payload a pass of that type carries. Used by the
 *  renderer contract so a renderer registered for 'route' receives a
 *  RoutePayload without casting at every call site. */
export interface ThinkingPayloadMap {
  count: CountPayload;
  sources: SourcesPayload;
  text: TextPayload;
  entity_preview: EntityPreviewPayload;
  comparison_signal: ComparisonSignalPayload;
  route: RoutePayload;
  availability: AvailabilityPayload;
  timeline: TimelinePayload;
  cluster: ClusterPayload;
  generic: GenericPayload;
  memory_signals: MemorySignalsPayload;
  intent: IntentPayload;
  synthesis_structure: SynthesisStructurePayload;
}

/** Developer-mode provenance for a discovery/candidate pass: how the visible
 *  candidate set was resolved and whether the narration's countable claim is
 *  backed by the same array the canvas renders. NEVER read by consumer UI —
 *  the dev panel and the discovery invariants check are the only readers. */
export interface PassCandidateDebug {
  /** The number the narration claims, when it makes a countable claim. */
  narrationCount?: number;
  visibleCandidateCount: number;
  canonicalCandidateCount: number;
  discoveryExtracted: number;
  finalResponseExtracted: number;
  /** Where the visible identities came from — see candidateResolution.ts. */
  entitySource: 'discovery' | 'merged' | 'final_response_backfill' | 'none';
  subsetSource?: 'trace_order' | 'inferred_from_final_order';
  /** Observed-but-not-shown titles (agent explored them, answer dropped them). */
  droppedTitles?: string[];
  imagesAvailable: number;
  coordinatesAvailable: number;
}

export interface ThinkingPass {
  id: string;

  /** Only ever 'status' or 'canvas_value' — an 'invisible' operation never
   *  becomes a pass in the first place. */
  visibility: Exclude<ThinkingVisibility, 'invisible'>;

  /** The single plain-language line for this pass. Never a raw tool or span
   *  name; never Phoenix terminology. */
  narration: string;

  valueType?: ThinkingValueType;
  payload?: ThinkingPayload;

  /** Provenance for the dev panel only. */
  sourceEventIds?: string[];
  sourceSpanIds?: string[];
  confidence?: 'high' | 'medium' | 'low';
  /** Dev-mode candidate-set provenance. See PassCandidateDebug. */
  debug?: PassCandidateDebug;

  /** PRESENTATION timing, in ms — normalized for readability, deliberately
   *  separate from real trace timing (which stays on the semantic events).
   *  All Level 2 timing lives on pass data like this; no component owns a
   *  setTimeout of its own. */
  enterDuration: number;
  holdDuration: number;
  exitDuration: number;

  /** REAL trace timing for this pass, in ms relative to trace start — the
   *  interval spanned by the pass's mapped semantic events (earliest mapped
   *  event start → latest mapped event completion). Present only when the
   *  scenario came from a real Phoenix trace and the pass maps to at least
   *  one timed event; NEVER fabricated for fixtures or synthetic passes.
   *  Demo playback ignores it entirely — it exists for the dev-mode
   *  "Actual Trace Timing" scheduler (see runtime/schedule.ts). */
  traceTiming?: { start: number; end: number };
}

export function passDuration(pass: ThinkingPass): number {
  return pass.enterDuration + pass.holdDuration + pass.exitDuration;
}
