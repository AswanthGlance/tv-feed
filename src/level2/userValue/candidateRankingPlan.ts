import type { SemanticAgentEvent } from '../../types/semanticEvent';
import type { AgentMutation } from '../../types/progressiveValue';
import { toProgressiveItem } from '../normalization/entityBridge';
import { extractSourceEvidence, type SourceEvidence } from '../phoenix/sources';
import { deriveComparisonDimensions } from './comparisonDimensions';
import { phrase, STABLE_RNG, type Rng } from './narrationVariety';
import type { NormalizedEntity } from '../types/entity';
import type { QueryRequirements } from '../types/query';
import type { ThinkingPass } from '../types/pass';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Candidate ranking: the thinking arc.

   THE RULE THIS FILE EXISTS TO ENFORCE:

       THE AGENT SAYS SOMETHING  ->  THE CANVAS IMMEDIATELY PROVES IT

   The generic pass builder (passBuilder.ts) derives passes from whatever the
   event stream happened to contain. For candidate ranking that produced the
   exact failure this iteration is fixing: the agent said "Found 5 promising
   venues" while the canvas stayed empty, because the deployment truncates
   `tool.output` at 2000 chars and the discovery-time entities were lost. A
   claim with no evidence behind it is worse than saying nothing.

   So candidate ranking gets a DELIBERATE arc instead of an emergent one:

       acknowledge   "Got it — looking for the strongest options."
       sources       "Reading up on this from a few angles"      + real sources
       found         "Found 5 promising venues"                  + 5 tiles
       enrich        "Checking prices and timings"               + metadata
       compare×N     "Comparing prices" / "Checking availability"
                     / "Looking at ratings"                      + comparison mode
       narrow        "3 stand out"                               + hierarchy
       complete      "I've got the strongest options."           + settled

   The compare step is ONE BEAT PER DIMENSION, and each dimension exists only
   because the candidates carry it (see comparisonDimensions.ts). Three
   dimensions on a rich set, one on a thin one, and a generic "Comparing what
   fits best" when the data supports none — the arc's length reports the
   evidence rather than a fixed script.

   Every pass that makes a COUNTABLE claim carries the objects that prove it,
   and every count in the copy is derived from the same array the canvas
   renders — they cannot drift.

   A pass is OMITTED rather than faked when its evidence does not exist: no
   real sources means no sources pass; no price/timing data means no enrich
   pass; fewer than four candidates means no narrowing pass. The arc shortens
   honestly instead of narrating something that did not happen.

   This changes PRESENTATION composition only. Ranking, winner derivation and
   entity extraction are untouched — the strongest candidate still comes from
   the trace's own badge/rating signal via the final response model.
   ───────────────────────────────────────────────────────────────────────────── */

/* Timings follow the brief's readability budget. Enter durations are the
   window in which evidence arrives; hold is reading time. */
const T = {
  acknowledge: { enterDuration: 400, holdDuration: 1350, exitDuration: 250 },
  sources: { enterDuration: 800, holdDuration: 2200, exitDuration: 300 },
  found: { enterDuration: 950, holdDuration: 2500, exitDuration: 300 },
  enrich: { enterDuration: 750, holdDuration: 2650, exitDuration: 300 },
  compare: { enterDuration: 750, holdDuration: 2650, exitDuration: 300 },
  /* One dimension's beat. `enter` covers the staggered turn (≈460ms of
     animation plus ≈95ms per tile), so the last card has finished turning
     before the hold — the reading window — begins. Shorter than the generic
     compare beat because there are up to three of these in a row. */
  compareDimension: { enterDuration: 900, holdDuration: 1550, exitDuration: 250 },
  narrow: { enterDuration: 850, holdDuration: 2550, exitDuration: 300 },
  complete: { enterDuration: 400, holdDuration: 1400, exitDuration: 300 },
} as const;

/** How many candidates the canvas shows at the "found" milestone. Beyond this
 *  the composition stops reading as a scannable set on a TV. */
const MAX_VISIBLE_CANDIDATES = 6;

function pluralNoun(requirements: QueryRequirements, count: number): string {
  const noun = requirements.entityType ?? 'option';
  return count === 1 ? noun : `${noun}s`;
}

/** Which enrichment attributes are BOTH present on the candidates AND asked
 *  for. Drives the enrich narration so it never claims to check something the
 *  data does not have. */
function enrichableAttributes(entities: NormalizedEntity[], requirements: QueryRequirements): string[] {
  const asked = new Set(requirements.requestedAttributes);
  const out: string[] = [];
  const has = (predicate: (e: NormalizedEntity) => boolean) => entities.some(predicate);

  if (has((e) => !!e.price) && (asked.has('price') || !asked.size)) out.push('prices');
  if (has((e) => typeof e.availability === 'string' && !!e.availability) && (asked.has('availability') || !asked.size)) out.push('timings');
  if (has((e) => e.rating != null) && (asked.has('rating') || !asked.size)) out.push('ratings');
  return out;
}

function listWords(words: string[]): string {
  if (words.length <= 1) return words[0] ?? '';
  if (words.length === 2) return `${words[0]} and ${words[1]}`;
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

/** The candidates that "stand out", on real signal only.
 *
 *  Preference order: the trace's own winner first (badge/rating derived
 *  upstream — never recomputed here), then the highest-rated remaining, then
 *  the agent's own response order. Never random, never decorative. */
function selectStandouts(entities: NormalizedEntity[], winnerId: string | undefined, size: number): string[] {
  const winner = entities.find((e) => e.id === winnerId);
  const rest = entities.filter((e) => e.id !== winner?.id);
  const allRated = rest.every((e) => e.rating != null);
  const ordered = allRated ? [...rest].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)) : rest;
  return [...(winner ? [winner] : []), ...ordered].slice(0, size).map((e) => e.id);
}

export interface CandidateRankingPlanInput {
  events: SemanticAgentEvent[];
  /** The comparable entities the answer actually names — the set the canvas
   *  renders and every count in the copy is derived from. */
  entities: NormalizedEntity[];
  requirements: QueryRequirements;
  /** The trace's own strongest candidate, when it distinguished one. Used for
   *  emphasis ordering only; never to promote a card during thinking. */
  winnerId?: string;
  /** Pre-resolved source evidence. Traces leave this undefined and the
   *  evidence is extracted from `events`; FIXTURES supply it directly, since
   *  they have no event stream. Fixtures own their content by definition and
   *  are labelled as fixtures everywhere they appear — but they still go
   *  through THIS function, so the arc has exactly one definition and the
   *  fixture path cannot drift from the real one. */
  sourceEvidence?: SourceEvidence;
  /** Wording variety — see narrationVariety.ts. Omit for today's exact
   *  canonical copy (every existing caller/test does); real playback passes
   *  `Math.random` once, when the scenario is built (see scenarios/fromTrace.ts,
   *  scenarios/fixtures.ts) — never on every render. */
  rng?: Rng;
}

export function buildCandidateRankingPasses(input: CandidateRankingPlanInput): ThinkingPass[] {
  const { events, requirements, winnerId } = input;
  const rng = input.rng ?? STABLE_RNG;
  const entities = input.entities.slice(0, MAX_VISIBLE_CANDIDATES);
  const passes: ThinkingPass[] = [];

  // ── 1. ACKNOWLEDGE ────────────────────────────────────────────────────
  // Task acknowledgement only. No cards yet — there is nothing true to show.
  passes.push({
    id: 'cr-1-acknowledge',
    visibility: 'status',
    narration: phrase(
      ['Got it — looking for the strongest options.', "Got it — let's see what's out there.", "On it — finding the strongest options."],
      rng
    ),
    confidence: 'high',
    ...T.acknowledge,
  });

  // ── 2. SOURCES ────────────────────────────────────────────────────────
  const evidence = input.sourceEvidence ?? extractSourceEvidence(events, entities.map((e) => e.title ?? ''));

  // The copy has to stay credible against the evidence behind it. "From a few
  // angles" is a claim about BREADTH — saying it over a single chip would be
  // the same failure as saying "found 5" over an empty canvas, just quieter.
  // A maps-only trace really did only consult one provider, so it says so.
  if (evidence.sources.length === 1 && evidence.sources[0].kind === 'maps') {
    passes.push({
      id: 'cr-2-sources',
      visibility: 'status',
      narration: phrase(['Checking places nearby on the map', "Scanning what's nearby on the map", 'Looking at what maps has nearby'], rng),
      confidence: 'high',
      ...T.sources,
    });
  } else if (evidence.sources.length >= 2) {
    passes.push({
      id: 'cr-2-sources',
      visibility: 'canvas_value',
      narration:
        evidence.sourceCount >= 4
          ? phrase(['Reading up on this from a few angles', 'Digging into a handful of sources', 'Pulling together views from a few places'], rng)
          : phrase(['Cross-checking a couple of sources', 'Comparing notes across a couple of sources', 'Double-checking against another source'], rng),
      valueType: 'sources',
      payload: {
        sources: evidence.sources.map((s) => ({ label: s.label, kind: s.kind, domain: s.domain })),
        sourceCount: evidence.sourceCount,
        searchCount: evidence.searchCount,
      },
      sourceEventIds: events.filter((e) => e.type === 'retrieve').map((e) => e.id),
      confidence: 'high',
      ...T.sources,
    });
  }
  // Exactly one WEB source is neither breadth nor a provider worth naming as
  // a beat — the arc simply skips it rather than padding.

  if (!entities.length) return passes;

  // ── 3. FOUND ──────────────────────────────────────────────────────────
  // The count in the copy IS entities.length — the sentence and the canvas
  // are derived from the same array and cannot disagree.
  const items = entities.map((e) => toProgressiveItem(e));
  const foundLead = phrase(['Found', 'Turned up', 'Spotted'] as const, rng);
  passes.push({
    id: 'cr-3-found',
    visibility: 'canvas_value',
    narration: `${foundLead} ${entities.length} promising ${pluralNoun(requirements, entities.length)}`,
    valueType: 'entity_preview',
    payload: {
      entities,
      // Tiles carry title + image + ONE fact at this point. Metadata arrives
      // at the enrich pass, so the viewer sees information being learned
      // rather than a finished answer fading in.
      canvas: [{ type: 'ADD_ITEMS', items: items.map((it) => ({ ...it, metadata: {} })) } as AgentMutation],
    },
    // Provenance: the discovery work this milestone reports — the search and
    // research calls that ran. Also what anchors this pass on the real trace
    // clock in dev-mode Actual Trace Timing.
    sourceEventIds: events.filter((e) => e.type === 'search' || e.type === 'retrieve').map((e) => e.id),
    confidence: 'high',
    debug: {
      narrationCount: entities.length,
      visibleCandidateCount: entities.length,
      canonicalCandidateCount: input.entities.length,
      discoveryExtracted: events.reduce((sum, e) => sum + (e.entities?.length ?? 0), 0),
      finalResponseExtracted: input.entities.length,
      entitySource: 'final_response_backfill',
      subsetSource: 'inferred_from_final_order',
      imagesAvailable: entities.filter((e) => !!e.image).length,
      coordinatesAvailable: 0,
    },
    ...T.found,
  });

  // ── 4. ENRICH ─────────────────────────────────────────────────────────
  const attributes = enrichableAttributes(entities, requirements);
  if (attributes.length) {
    const patches = entities
      .map((e) => {
        const data: Record<string, unknown> = {};
        if (e.rating != null) data.rating = e.rating;
        if (e.reviewCount != null) data.reviewCount = e.reviewCount;
        if (e.price) data.priceLevel = e.price;
        if (typeof e.availability === 'string') data.availability = e.availability;
        return Object.keys(data).length ? { id: e.id, data } : undefined;
      })
      .filter((p): p is { id: string; data: Record<string, unknown> } => !!p);

    if (patches.length) {
      const enrichLead = phrase(['Checking', 'Looking into', 'Confirming'] as const, rng);
      passes.push({
        id: 'cr-4-enrich',
        visibility: 'canvas_value',
        narration: `${enrichLead} ${listWords(attributes)}`,
        valueType: 'entity_preview',
        payload: { entities, canvas: [{ type: 'ENRICH_ITEMS', patches } as AgentMutation] },
        sourceEventIds: events.filter((e) => e.type === 'enrichment').map((e) => e.id),
        confidence: 'high',
        ...T.enrich,
      });
    }
  }

  // ── 5. COMPARE ────────────────────────────────────────────────────────
  // COMPARISON MODE: the same persistent tiles turn over to show ONE
  // dimension at a time, so the viewer can scan a column of prices, then a
  // column of timings, then a column of ratings. This is the difference
  // between "the agent is busy" and "the agent is comparing these" — the
  // former is a border animation, the latter is legible information.
  //
  // Nothing is promoted and nothing recedes here: this is weighing, not
  // deciding. Emphasis is on the DIMENSION, never on a candidate, which is
  // why these passes carry no `emphasisIds`.
  if (entities.length >= 3) {
    const dimensions = deriveComparisonDimensions({ entities, requirements, rng });

    if (dimensions.length) {
      for (const dimension of dimensions) {
        passes.push({
          id: `cr-5-compare-${dimension.focus.key}`,
          visibility: 'canvas_value',
          narration: dimension.narration,
          valueType: 'entity_preview',
          payload: { entities, comparison: dimension.focus },
          confidence: 'high',
          ...T.compareDimension,
        });
      }
    } else {
      // No dimension the data can back. Rather than turn five cards over to
      // show five em dashes, the arc falls back to the softer "these are
      // pulling ahead" beat, which claims nothing about any attribute.
      const considering = selectStandouts(entities, winnerId, Math.min(3, entities.length - 1));
      passes.push({
        id: 'cr-5-compare',
        visibility: 'canvas_value',
        narration: phrase(['Comparing what fits best', 'Weighing them up', 'Seeing how they stack up'], rng),
        valueType: 'entity_preview',
        payload: { entities, emphasisIds: considering },
        confidence: 'medium',
        ...T.compare,
      });
    }
  }

  // ── 6. NARROW ─────────────────────────────────────────────────────────
  // Only when there is something to narrow FROM. With three candidates,
  // "3 stand out" would be a claim about all of them, which says nothing.
  if (entities.length >= 4) {
    const standoutCount = Math.min(3, entities.length - 1);
    const standoutIds = selectStandouts(entities, winnerId, standoutCount);
    const narrowNarration = phrase(
      [
        (n: number) => `${n} stand out`,
        (n: number) => `${n} really stand out`,
        (n: number) => `${n} pull ahead of the rest`,
      ] as const,
      rng
    )(standoutCount);
    passes.push({
      id: 'cr-6-narrow',
      visibility: 'canvas_value',
      narration: narrowNarration,
      valueType: 'entity_preview',
      payload: {
        entities,
        emphasisIds: standoutIds,
        // SHORTLIST only. The candidates left off are NOT negated: negation
        // claims a reason, and "it was outweighed" is not a reason the trace
        // states. The canvas recedes them on the shortlist's existence alone,
        // which is honest and still legible.
        canvas: [{ type: 'SHORTLIST_ITEMS', ids: standoutIds } as AgentMutation],
      },
      confidence: 'medium',
      ...T.narrow,
    });
  }

  // ── 7. COMPLETE ───────────────────────────────────────────────────────
  // The last centred statement. The evidence stays exactly as the narrowing
  // left it — this pass adds no new mutation, it is the settle beat before
  // consolidation.
  passes.push({
    id: 'cr-7-complete',
    visibility: 'status',
    narration: phrase(["I've got the strongest options.", "Here's what stood out.", "That's the strongest set."], rng),
    confidence: 'high',
    ...T.complete,
  });

  return passes;
}
