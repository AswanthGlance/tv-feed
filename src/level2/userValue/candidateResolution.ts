import type { NormalizedEntity } from '../types/entity';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Canonical candidate resolution.

   THE INVARIANT THIS FILE EXISTS TO ENFORCE:

       "Found N <things>"  ->  exactly N tiles, and every later beat
       (enrich, compare, narrow) operates on those SAME N identities.

   The real failures this replaces (reproduced offline against live Phoenix
   traces — see the debug table in the task notes):

     · trace 54e92fc9… "Found 5 promising rivers"       -> EMPTY canvas
       (all four PlaceSearch outputs truncated at 2000 chars; discovery
       extracted 0; the final response named all 5 rivers)
     · trace b5463ca8… "Found 4 promising sanctuaries"  -> 5 tiles
       (discovery empty so the count came from the final response's 4,
       then the enrich pass ADDed the 5 PlaceDetails entities under
       different ids — narration and canvas were built from UNRELATED
       arrays)

   So narration and canvas stop being computed independently. ONE resolved
   candidate set is produced here, the narration count is derived from
   `visible.length`, and the canvas renders `visible` — the same array.

   RESOLUTION PRIORITY (nothing is ever invented):
     1. entities extracted from the discovery (search) spans themselves
     2. entities extracted from sibling spans of the same operation
        (PlaceDetails enrichment — same run, same subjects)
     3. entities the FINAL RESPONSE of the same trace names — a visual
        BACKFILL, reconstruction from the same agent run, never fabrication.
        Developer mode labels it `final_response_backfill`.

   When both an observed set and a final set exist, identity is reconciled
   (place_id first, then normalized title) and the FINAL response's order is
   the deterministic subset/ordering rule — it is the agent's own ranking,
   never a random pick.

   Candidate validity is deliberately independent of rich media: an entity
   with a stable identity and a meaningful title is renderable. Missing
   image / coordinates / rating / price never remove a candidate — they only
   make its tile lighter. (Availability of both is still REPORTED, per tile
   set, for the dev panel.)
   ───────────────────────────────────────────────────────────────────────────── */

/** Where the visible candidate identities came from. Shown in dev mode. */
export type CandidateEntitySource =
  | 'discovery'
  | 'merged'
  | 'final_response_backfill'
  | 'none';

/** How the visible subset/order was chosen when a choice had to be made. */
export type CandidateSubsetSource = 'trace_order' | 'inferred_from_final_order';

export interface CandidateResolutionDiagnostics {
  discoveryExtracted: number;
  finalResponseExtracted: number;
  matchedAcrossBoth: number;
  /** Observed-but-not-shown titles (explored and dropped by the agent, or
   *  beyond the visible cap). Dev panel only — never rendered to consumers. */
  droppedTitles: string[];
  imagesAvailable: number;
  coordinatesAvailable: number;
}

export interface ResolvedCandidateSet {
  /** EXACTLY what the discovery milestone shows; narration count MUST be
   *  `visible.length` and the canvas MUST render this same array. */
  visible: NormalizedEntity[];
  /** The full canonical pool (visible plus anything beyond the cap). Later
   *  beats (enrich/narrow) resolve identities against this. */
  canonical: NormalizedEntity[];
  entitySource: CandidateEntitySource;
  subsetSource?: CandidateSubsetSource;
  diagnostics: CandidateResolutionDiagnostics;
}

/** Beyond this the composition stops reading as a scannable set on a TV —
 *  same budget as candidate ranking's MAX_VISIBLE_CANDIDATES. */
const DEFAULT_MAX_VISIBLE = 6;

/** A candidate is renderable with a stable identity and a meaningful title.
 *  Image, coordinates, rating and price are explicitly NOT required. */
export function isValidCandidate(e: NormalizedEntity): boolean {
  return !!e.id && !!e.title?.trim();
}

function titleKey(title: string | undefined): string | undefined {
  const k = title
    ?.toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
  return k || undefined;
}

/** Same real-world thing? place_id when both sides carry one; otherwise
 *  normalized-title equality or containment ("Himalayan Tiger Adventure" ⊂
 *  "Himalayan Tiger Adventure Rishikesh" — a real pair from trace
 *  793f9a2f…). Containment requires a reasonably long key so "Goa" never
 *  swallows "Goa Beach Shack Crawl". */
export function isSameCandidate(a: NormalizedEntity, b: NormalizedEntity): boolean {
  if (a.externalId && b.externalId) return a.externalId === b.externalId;
  const ka = titleKey(a.title);
  const kb = titleKey(b.title);
  if (!ka || !kb) return false;
  if (ka === kb) return true;
  const [short, long] = ka.length <= kb.length ? [ka, kb] : [kb, ka];
  return short.length >= 8 && long.includes(short);
}

export function dedupeCandidates(entities: NormalizedEntity[]): NormalizedEntity[] {
  const out: NormalizedEntity[] = [];
  for (const e of entities) {
    if (!isValidCandidate(e)) continue;
    if (out.some((seen) => isSameCandidate(seen, e))) continue;
    out.push(e);
  }
  return out;
}

/** Fills gaps in `base` from `extra` WITHOUT changing identity — the id,
 *  title and judgment stay the base's. Used to give a final-response card the
 *  image/rating/address its discovery-time sibling carried. */
export function mergeCandidate(base: NormalizedEntity, extra: NormalizedEntity | undefined): NormalizedEntity {
  if (!extra) return base;
  return {
    ...base,
    subtitle: base.subtitle ?? extra.subtitle,
    location: base.location ?? extra.location,
    image: base.image ?? extra.image,
    rating: base.rating ?? extra.rating,
    reviewCount: base.reviewCount ?? extra.reviewCount,
    price: base.price ?? extra.price,
    availability: base.availability ?? extra.availability,
    externalId: base.externalId ?? extra.externalId,
    evidence: base.evidence ?? extra.evidence,
  };
}

function hasCoordinates(e: NormalizedEntity): boolean {
  const raw = e.raw as { latitude?: unknown; longitude?: unknown; lat?: unknown; lng?: unknown } | undefined;
  if (!raw || typeof raw !== 'object') return false;
  const lat = raw.latitude ?? raw.lat;
  const lng = raw.longitude ?? raw.lng;
  return typeof lat === 'number' && typeof lng === 'number';
}

export interface ResolveCandidateSetInput {
  /** Entities extracted from the discovery/search spans (priority 1) and
   *  their sibling enrichment spans (priority 2), in trace order. */
  observed: NormalizedEntity[];
  /** Entities the trace's own final response names (priority 3 backfill). */
  finalEntities: NormalizedEntity[];
  /** Prefer the final response's identities/order even when observation
   *  succeeded — comparison archetypes must show the same identities that
   *  later enter comparison mode, never a superset that silently shrinks. */
  preferFinalIdentity?: boolean;
  maxVisible?: number;
}

export function resolveCandidateSet(input: ResolveCandidateSetInput): ResolvedCandidateSet {
  const maxVisible = input.maxVisible ?? DEFAULT_MAX_VISIBLE;
  const observed = dedupeCandidates(input.observed);
  const finals = dedupeCandidates(input.finalEntities);

  const finish = (
    canonical: NormalizedEntity[],
    entitySource: CandidateEntitySource,
    subsetSource: CandidateSubsetSource | undefined,
    matched: number,
    droppedTitles: string[]
  ): ResolvedCandidateSet => {
    const visible = canonical.slice(0, maxVisible);
    const overflow = canonical.slice(maxVisible).map((e) => e.title ?? '(untitled)');
    return {
      visible,
      canonical,
      entitySource,
      subsetSource,
      diagnostics: {
        discoveryExtracted: observed.length,
        finalResponseExtracted: finals.length,
        matchedAcrossBoth: matched,
        droppedTitles: [...droppedTitles, ...overflow],
        imagesAvailable: visible.filter((e) => !!e.image).length,
        coordinatesAvailable: visible.filter(hasCoordinates).length,
      },
    };
  };

  if (!observed.length && !finals.length) return finish([], 'none', undefined, 0, []);

  // Only observation exists — the trace's own discovery order stands.
  if (!finals.length) return finish(observed, 'discovery', 'trace_order', 0, []);

  const matches = new Map<NormalizedEntity, NormalizedEntity>();
  for (const f of finals) {
    const twin = observed.find((o) => isSameCandidate(o, f));
    if (twin) matches.set(f, twin);
  }

  // Only the final response names candidates (the real truncation case) —
  // backfill the SAME entities the same run answered with. Reconstruction,
  // not fabrication.
  if (!observed.length) {
    return finish(finals, 'final_response_backfill', 'inferred_from_final_order', 0, []);
  }

  // Both exist. Final-identity mode (comparison): the answer's own set and
  // order win, enriched with what observation learned about each; observed
  // extras were explored and dropped by the agent itself, so they are not
  // shown — but they are named in the dev panel, never silently.
  if (input.preferFinalIdentity || matches.size >= 2) {
    const canonical = finals.map((f) => mergeCandidate(f, matches.get(f)));
    const matchedObserved = new Set(matches.values());
    const dropped = observed.filter((o) => !matchedObserved.has(o)).map((o) => o.title ?? '(untitled)');
    return finish(
      canonical,
      matches.size ? 'merged' : 'final_response_backfill',
      'inferred_from_final_order',
      matches.size,
      dropped
    );
  }

  // Observation succeeded and the final set is an unrelated vocabulary
  // (e.g. product search chunks vs a curated list) — trust what discovery
  // actually saw, in trace order.
  return finish(observed, 'discovery', 'trace_order', matches.size, []);
}
