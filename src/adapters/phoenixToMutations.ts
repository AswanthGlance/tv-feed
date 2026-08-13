import type { PhoenixSpan } from '../types/phoenix';
import type { AgentMutation, MutationConfidence, ProgressiveItem } from '../types/progressiveValue';
import type { PassStage } from '../types/experiencePass';
import type { ExtractedEntity, SemanticAgentEvent } from '../types/semanticEvent';
import { buildSpanTree, findPrimaryRoot, flattenSpans } from './spanTree';
import { extractSemanticEvents, type SemanticEventDiagnostics } from './semanticEvents';
import { isVenueLikeEntity } from './entityExtraction';
import { safeSpanStart } from '../utils/timing';

/* ─────────────────────────────────────────────────────────────────────────────
   PHOENIX -> LEVEL 2 MUTATIONS.

   PhoenixSpan[] -> buildSpanTree -> extractSemanticEvents -> (this file's
   walk) -> AgentMutation[] tagged with a target pass stage + real timing.

   This is the seam Level2Experience.tsx and useProgressiveExperience.ts
   never need to know about — they only ever see the same AgentMutation
   vocabulary the hand-authored fixture (src/data/level2TravelFixture.ts)
   already produces. See mutationsToPasses.ts for the next stage (grouping
   these into ExperiencePassDef[]).

   Grounding: real span/attribute shapes below were confirmed by inspecting
   live traces from aitv-mewtwo-harness directly (not assumed) — see
   LEVEL2_INSTRUMENTATION_GAPS.md for the inspection notes and exactly which
   real trace IDs each shape was confirmed against.

   ANTI-HALLUCINATION RULE (see LEVEL2_INSTRUMENTATION_GAPS.md): a mutation
   is only emitted when real trace data grounds it. Where the signal is
   genuinely ambiguous (no distinguishing badge/rating for a would-be
   PROMOTE, no comparative reason for a would-be NEGATE), the mutation is
   skipped and recorded in `diagnostics.skipped` instead of guessed.
   ───────────────────────────────────────────────────────────────────────────── */

export interface TimedMutation {
  /** ms, relative to trace start — real event time, never fabricated. */
  at: number;
  stage: PassStage;
  mutation: AgentMutation;
  /** Pass-level narration to use if this mutation is the first one to land
   *  in its stage bucket (see mutationsToPasses.ts). */
  narration?: string;
}

export interface MappingDiagnostics {
  recognizedTools: string[];
  unrecognizedTools: string[];
  unusableToolOutputs: string[];
  /** Human-readable notes on mutations that were considered but NOT
   *  generated, and why — the developer-facing "instrumentation gap" trail
   *  for this specific trace (see the FIRST TASK / anti-hallucination
   *  requirements). */
  skipped: string[];
  extractedEntityCount: number;
  finalCardCount: number;
  /** Real final-response `<card>` titles excluded as non-venue supporting
   *  info (e.g. "Booking Tips") — see semanticEvents.ts/entityExtraction.ts.
   *  Never silently dropped; surfaced for GAPS-tab visibility. */
  excludedNonVenueCards: string[];
}

interface KnownItem {
  item: ProgressiveItem;
  entity: ExtractedEntity;
}

function normTitle(s: string | undefined): string | undefined {
  return s?.toLowerCase().trim().replace(/\s+/g, ' ') || undefined;
}

/** Real Google Places `formatted_address` values are full postal addresses
 *  ("Shop No. 7, Ground Floor, The Platina, Gachibowli - Miyapur Rd,
 *  Banjara Basthi, Jayabheri Enclave, Gachibowli, Hyderabad, Telangana
 *  500032, India") — far too long for a TV card. Reduces to "neighborhood,
 *  city" by dropping the country and any segment that's clearly a state+PIN
 *  code (a run of digits 5+ long), then taking the last two remaining
 *  comma-separated segments. Never fabricates a location that isn't in the
 *  real address string — just a shorter slice of it. */
function shortenAddress(address: string | undefined): string | undefined {
  if (!address) return undefined;
  const segments = address
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && !/^india$/i.test(s) && !/\d{5,}/.test(s));
  if (!segments.length) return undefined;
  return segments.slice(-2).join(', ');
}

function matchConfidence(matchedBy: 'id' | 'title' | 'title-fuzzy' | undefined): MutationConfidence {
  if (matchedBy === 'id') return 'high';
  if (matchedBy === 'title') return 'medium';
  return 'low';
}

/** Best-effort identity resolution: prefer the real external id (Google
 *  Places place_id), fall back to a normalized-title match. Title matching
 *  is inherently lower-confidence (two different real places can share a
 *  chain name) — callers downgrade confidence when this path is used. */
class CandidateRegistry {
  private byExternalId = new Map<string, KnownItem>();
  private byTitle = new Map<string, KnownItem>();
  private byItemId = new Map<string, KnownItem>();
  private seq = 0;
  items: ProgressiveItem[] = [];

  find(entity: ExtractedEntity): { known: KnownItem; matchedBy: 'id' | 'title' | 'title-fuzzy' } | undefined {
    if (entity.externalId) {
      const byId = this.byExternalId.get(entity.externalId);
      if (byId) return { known: byId, matchedBy: 'id' };
    }
    const t = normTitle(entity.title);
    if (t) {
      const byT = this.byTitle.get(t);
      if (byT) return { known: byT, matchedBy: 'title' };
      // Real final-response titles sometimes append a location suffix that
      // the earlier search-time title didn't have (e.g. "Escape Time -
      // Mystery Games" vs "Escape Time - Mystery Games | Begumpet",
      // confirmed on a real trace with no place_id on the final card) — a
      // conservative substring check catches those without over-matching
      // short/generic names.
      if (t.length >= 6) {
        for (const [knownTitle, known] of this.byTitle) {
          if (knownTitle.length >= 6 && (t.includes(knownTitle) || knownTitle.includes(t))) {
            return { known, matchedBy: 'title-fuzzy' };
          }
        }
      }
    }
    return undefined;
  }

  getById(itemId: string): KnownItem | undefined {
    return this.byItemId.get(itemId);
  }

  /** Folds newly-observed fields (rating, review count, etc.) into the
   *  entity snapshot kept for this item, so later lookups (e.g. NEGATE's
   *  rating comparison) see the most recent real data, not just whatever
   *  the item's first DISCOVER-stage entity happened to carry. */
  updateEntity(itemId: string, patch: Partial<ExtractedEntity>) {
    const known = this.byItemId.get(itemId);
    if (!known) return;
    known.entity = { ...known.entity, ...patch };
  }

  register(entity: ExtractedEntity, state: ProgressiveItem['state'] = 'discovered'): ProgressiveItem {
    this.seq += 1;
    const item: ProgressiveItem = {
      id: `real-${this.seq}`,
      type: entity.type === 'restaurant' || entity.type === 'hotel' ? 'place' : (entity.type as ProgressiveItem['type']) ?? 'place',
      title: entity.title ?? 'Untitled',
      subtitle: shortenAddress(entity.subtitle) ?? entity.subtitle,
      image: entity.image,
      state,
      metadata: entity.externalId ? { placeId: entity.externalId } : undefined,
    };
    const known: KnownItem = { item, entity };
    if (entity.externalId) this.byExternalId.set(entity.externalId, known);
    const t = normTitle(entity.title);
    if (t) this.byTitle.set(t, known);
    this.byItemId.set(item.id, known);
    this.items.push(item);
    return item;
  }

  all(): ProgressiveItem[] {
    return this.items;
  }
}

function pushSkip(diag: MappingDiagnostics, note: string) {
  diag.skipped.push(note);
}

/** Fuzzy-matches a GetRoute `destination` address against known candidates
 *  by title substring — the only linkage available since real GetRoute
 *  output carries no place_id (confirmed gap, see
 *  LEVEL2_INSTRUMENTATION_GAPS.md). Deliberately conservative: requires the
 *  candidate's title to appear as a whole word/phrase in the destination
 *  text, not just a loose fuzzy score, so a wrong match never silently
 *  attaches a travel time to the wrong card. */
function matchByDestination(destinationText: string | undefined, registry: CandidateRegistry): ProgressiveItem | undefined {
  if (!destinationText) return undefined;
  const dest = destinationText.toLowerCase();
  for (const item of registry.items) {
    const title = item.title.toLowerCase();
    if (title.length >= 3 && dest.includes(title)) return item;
  }
  return undefined;
}

export function phoenixSpansToMutations(
  spans: PhoenixSpan[]
): { mutations: TimedMutation[]; diagnostics: MappingDiagnostics; query?: string } {
  const diagnostics: MappingDiagnostics = {
    recognizedTools: [],
    unrecognizedTools: [],
    unusableToolOutputs: [],
    skipped: [],
    extractedEntityCount: 0,
    finalCardCount: 0,
    excludedNonVenueCards: [],
  };

  if (!spans.length) {
    pushSkip(diagnostics, 'Trace has zero spans — nothing to map.');
    return { mutations: [], diagnostics };
  }

  const roots = buildSpanTree(spans);
  const rootNode = findPrimaryRoot(roots);
  const rootSpan = rootNode?.span;
  const allSpans = rootNode ? flattenSpans([rootNode]) : spans;
  const traceStart = Math.min(...allSpans.map((s) => safeSpanStart(s)));
  const query = rootSpan ? (rootSpan.attributes?.['input.value'] as string | undefined) : undefined;

  const { events, diagnostics: semDiag } = extractSemanticEvents(allSpans, rootSpan, traceStart);
  diagnostics.recognizedTools = semDiag.recognizedTools;
  diagnostics.unrecognizedTools = semDiag.unrecognizedTools;
  diagnostics.unusableToolOutputs = semDiag.unusableToolOutputs;
  diagnostics.excludedNonVenueCards = semDiag.excludedNonVenueCards;

  const registry = new CandidateRegistry();
  const out: TimedMutation[] = [];
  const mut = (stage: PassStage, at: number, mutation: AgentMutation, narration?: string) => {
    out.push({ stage, at, narration, mutation });
  };

  let finalEvent: SemanticAgentEvent | undefined;

  for (const event of events) {
    if (event.type === 'final') { finalEvent = event; continue; }

    if (event.type === 'search') {
      const fresh: ProgressiveItem[] = [];
      for (const entity of event.entities ?? []) {
        if (registry.find(entity)) continue; // already discovered via an earlier search call
        fresh.push(registry.register(entity));
      }
      if (fresh.length) {
        mut(
          'discover',
          event.endTime,
          { type: 'ADD_ITEMS', items: fresh, sourceSpanIds: event.sourceSpanIds, confidence: 'high' },
          event.narration
        );
      } else if ((event.entities ?? []).length === 0) {
        pushSkip(diagnostics, `${event.narration}: tool output produced no usable candidates.`);
      }
      continue;
    }

    if (event.type === 'enrichment') {
      const entity = event.entities?.[0];
      if (!entity) { pushSkip(diagnostics, 'PlaceDetails/PlaceReviews output could not be parsed into any usable fields.'); continue; }
      let match = registry.find(entity);
      let confidence: MutationConfidence = matchConfidence(match?.matchedBy);
      if (!match) {
        // A per-place PlaceDetails call is itself real, place_id-specific
        // data — the only reason it wouldn't already be known is that the
        // earlier PlaceSearch output got truncated before this place's
        // object closed (confirmed real gap: Phoenix caps tool.output at
        // 2000 chars — see LEVEL2_INSTRUMENTATION_GAPS.md). Rather than
        // discard real data because an unrelated span got cut off, this
        // registers it as a DISCOVER-stage candidate now, sourced from
        // PlaceDetails instead of PlaceSearch.
        const item = registry.register(entity);
        mut(
          'discover',
          event.endTime,
          { type: 'ADD_ITEMS', items: [item], sourceSpanIds: event.sourceSpanIds, confidence: 'medium' },
          event.narration
        );
        match = { known: { item, entity }, matchedBy: 'id' };
        confidence = 'medium';
      }
      const patchData: Record<string, unknown> = {};
      if (entity.rating != null) patchData.rating = entity.rating;
      if (entity.reviewCount != null) patchData.reviewCount = entity.reviewCount;
      if (entity.price) patchData.priceLevel = entity.price;
      if (entity.availability) patchData.availability = entity.availability;
      registry.updateEntity(match.known.item.id, {
        rating: entity.rating ?? match.known.entity.rating,
        reviewCount: entity.reviewCount ?? match.known.entity.reviewCount,
        price: entity.price ?? match.known.entity.price,
        availability: entity.availability ?? match.known.entity.availability,
      });
      if (Object.keys(patchData).length) {
        mut(
          'compare',
          event.endTime,
          { type: 'ENRICH_ITEMS', patches: [{ id: match.known.item.id, data: patchData }], sourceSpanIds: event.sourceSpanIds, confidence },
          event.narration
        );
      }
      const bullets = (entity.attributes?.bullets as string[] | undefined) ?? [];
      if (bullets.length) {
        mut(
          'compare',
          event.endTime,
          { type: 'ADD_EVIDENCE', patches: [{ id: match.known.item.id, evidence: bullets }], sourceSpanIds: event.sourceSpanIds, confidence },
          event.narration
        );
      }
      continue;
    }

    if (event.type === 'maps') {
      const meta = event.metadata as { travelTime?: string; distance?: string; destinationText?: string } | undefined;
      if (!meta?.travelTime) continue;
      const matched = matchByDestination(meta.destinationText, registry);
      if (!matched) {
        pushSkip(
          diagnostics,
          `GetRoute returned "${meta.travelTime}" to "${meta.destinationText ?? 'unknown destination'}" but no place_id linkage exists in this tool's output — could not confidently attribute it to a candidate card.`
        );
        continue;
      }
      mut(
        'enrich',
        event.endTime,
        {
          type: 'ENRICH_ITEMS',
          patches: [{ id: matched.id, data: { travelTime: meta.travelTime, distance: meta.distance } }],
          sourceSpanIds: event.sourceSpanIds,
          confidence: 'medium',
        },
        event.narration
      );
      continue;
    }

    // 'retrieve' / 'availability' — real tool calls happened (web search,
    // weather) but their unstructured text output has no defined Level 2
    // mutation mapping yet; recorded, not silently dropped.
    pushSkip(diagnostics, `${event.narration}: recognized tool call with no structured Level 2 mapping yet (unstructured text output).`);
  }

  if (finalEvent) {
    // Defense-in-depth: entityExtraction.ts already filters non-venue cards
    // (e.g. "Booking Tips") out of finalEvent.entities, but this re-checks
    // in case a future extraction path feeds entities without going through
    // that gate — a non-venue card must never reach SHORTLIST/PROMOTE.
    const rawCards = finalEvent.entities ?? [];
    const cards = rawCards.filter((entity) => {
      if (isVenueLikeEntity(entity)) return true;
      pushSkip(diagnostics, `Excluded "${entity.title ?? '(untitled)'}" from candidates — reads as supporting info, not a comparable venue.`);
      if (!diagnostics.excludedNonVenueCards.includes(entity.title ?? '(untitled)')) {
        diagnostics.excludedNonVenueCards.push(entity.title ?? '(untitled)');
      }
      return false;
    });
    diagnostics.finalCardCount = cards.length;

    const finalized: Array<{ item: ProgressiveItem; entity: ExtractedEntity; order: number }> = [];
    cards.forEach((entity, order) => {
      const match = registry.find(entity);
      if (match) {
        finalized.push({ item: match.known.item, entity, order });
        return;
      }
      // Never seen this candidate before (e.g. the final answer was
      // synthesized from unstructured web research, not a PlaceSearch call)
      // — still real content, just discovered late. Register it now rather
      // than dropping it.
      const item = registry.register(entity, 'discovered');
      mut(
        'discover',
        finalEvent!.endTime,
        { type: 'ADD_ITEMS', items: [item], sourceSpanIds: finalEvent!.sourceSpanIds, confidence: 'medium' },
        'A recommendation is coming together'
      );
      finalized.push({ item, entity, order });
    });

    // Judgment + evidence for every finalist — grounded directly in the
    // agent's own <badge>/<why> text, never invented.
    for (const { item, entity } of finalized) {
      if (entity.judgment) {
        mut(
          'compare',
          finalEvent.endTime,
          { type: 'UPDATE_JUDGMENT', patches: [{ id: item.id, judgment: entity.judgment }], sourceSpanIds: finalEvent.sourceSpanIds, confidence: 'high' },
          finalEvent.narration
        );
      }
      if (entity.reasoning) {
        mut(
          'compare',
          finalEvent.endTime,
          { type: 'ADD_EVIDENCE', patches: [{ id: item.id, evidence: [entity.reasoning] }], sourceSpanIds: finalEvent.sourceSpanIds, confidence: 'high' }
        );
      }
      if (entity.rating != null || entity.price || entity.availability) {
        const data: Record<string, unknown> = {};
        if (entity.rating != null) data.rating = entity.rating;
        if (entity.reviewCount != null) data.reviewCount = entity.reviewCount;
        if (entity.price) data.priceLevel = entity.price;
        if (entity.availability) data.availability = entity.availability;
        mut('compare', finalEvent.endTime, { type: 'ENRICH_ITEMS', patches: [{ id: item.id, data }], sourceSpanIds: finalEvent.sourceSpanIds, confidence: 'medium' });
      }
    }

    if (finalized.length >= 2) {
      mut(
        'shortlist',
        finalEvent.endTime,
        { type: 'SHORTLIST_ITEMS', ids: finalized.map((f) => f.item.id), sourceSpanIds: finalEvent.sourceSpanIds, confidence: 'medium' },
        `Narrowing to the ${finalized.length} strongest options`
      );
    }

    // PROMOTE: only when the trace itself distinguishes a winner. Tracks
    // WHICH signal decided it (badge text vs. rating comparison) explicitly
    // — confidence reflects that decision path, not just "did it happen to
    // land on the first card".
    const winnerBadgeRe = /top|best|#1|highest|winner|favou?rite/i;
    let promoted: { item: ProgressiveItem; entity: ExtractedEntity } | undefined;
    let promotedVia: 'badge' | 'rating' | undefined;
    const first = finalized[0];
    if (first && first.entity.judgment && winnerBadgeRe.test(first.entity.judgment)) {
      promoted = first;
      promotedVia = 'badge';
    } else {
      const withRatings = finalized.filter((f) => f.entity.rating != null);
      if (withRatings.length === finalized.length && finalized.length > 1) {
        const best = withRatings.reduce((a, b) => ((b.entity.rating ?? 0) > (a.entity.rating ?? 0) ? b : a));
        const secondBest = Math.max(...withRatings.filter((f) => f !== best).map((f) => f.entity.rating ?? 0));
        if ((best.entity.rating ?? 0) > secondBest) {
          promoted = best;
          promotedVia = 'rating';
        }
      }
    }

    if (promoted) {
      mut(
        'promote',
        finalEvent.endTime,
        { type: 'PROMOTE_ITEM', id: promoted.item.id, sourceSpanIds: finalEvent.sourceSpanIds, confidence: promotedVia === 'badge' ? 'high' : 'medium' },
        `${promoted.item.title} is emerging as the strongest fit`
      );
    } else if (finalized.length > 1) {
      pushSkip(diagnostics, 'Cannot derive PROMOTE_ITEM: no distinguishing badge or rating signal among the finalists — leaving all finalists at shortlist level.');
    }

    // NEGATE / REMOVE: candidates discovered earlier but absent from the
    // final response.
    const finalizedIds = new Set(finalized.map((f) => f.item.id));
    const finalistRatings = finalized.map((f) => f.entity.rating).filter((r): r is number => r != null);
    const minFinalistRating = finalistRatings.length ? Math.min(...finalistRatings) : undefined;

    for (const item of registry.all()) {
      if (finalizedIds.has(item.id)) continue;
      const discoveredRating = registry.getById(item.id)?.entity.rating;
      if (discoveredRating != null && minFinalistRating != null && discoveredRating < minFinalistRating) {
        mut(
          'negate',
          finalEvent.endTime,
          {
            type: 'NEGATE_ITEMS',
            items: [{ id: item.id, reason: 'Lower rated than the options that made the final recommendation' }],
            sourceSpanIds: finalEvent.sourceSpanIds,
            confidence: 'medium',
          },
          `Setting aside options that fit less well`
        );
        mut('promote', finalEvent.endTime, { type: 'REMOVE_ITEMS', ids: [item.id], sourceSpanIds: finalEvent.sourceSpanIds, confidence: 'medium' });
      } else {
        pushSkip(diagnostics, `Cannot derive a NEGATE_ITEM reason for "${item.title}" — no comparative rating/evidence available; removing without a stated reason.`);
        mut('promote', finalEvent.endTime, { type: 'REMOVE_ITEMS', ids: [item.id], sourceSpanIds: finalEvent.sourceSpanIds, confidence: 'low' });
      }
    }

    mut(
      'resolve',
      finalEvent.endTime,
      { type: 'RESOLVE_RESULT', sourceSpanIds: finalEvent.sourceSpanIds, confidence: 'high' },
      promoted ? `Building your recommendation around ${promoted.item.title}` : 'Here is what I found'
    );
  } else {
    pushSkip(diagnostics, 'No structured <place_card> final response found — trace stops at whatever DISCOVER/ENRICH/COMPARE data was gathered, no RESOLVE.');
  }

  diagnostics.extractedEntityCount = registry.all().length;
  out.sort((a, b) => a.at - b.at);
  return { mutations: out, diagnostics, query };
}
