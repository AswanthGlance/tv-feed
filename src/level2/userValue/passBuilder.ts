import type { SemanticAgentEvent } from '../../types/semanticEvent';
import type { AgentMutation } from '../../types/progressiveValue';
import { toNormalizedEntity, toProgressiveItem } from '../normalization/entityBridge';
import { extractSourceEvidence } from '../phoenix/sources';
import type { NormalizedEntity } from '../types/entity';
import type { QueryRequirements } from '../types/query';
import type { ScenarioClassification } from '../types/archetype';
import type { ThinkingPass, ThinkingPayload, ThinkingValueType } from '../types/pass';
import { classifyEventVisibility } from './visibility';
import { isSameCandidate, mergeCandidate, resolveCandidateSet, type ResolvedCandidateSet } from './candidateResolution';
import { buildRouteMapPasses } from './routeMapPlan';
import { phrase, STABLE_RNG, type Rng } from './narrationVariety';
import type { ExtractedRoute } from '../../adapters/entityExtraction';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Semantic events -> thinking passes.

   ONE PASS PER EVENT IS THE WRONG ANSWER. Real traces run 3 web searches, 5
   place-detail lookups and a ranking step; narrating each of those produces
   exactly the "raw agent thinking" the stakeholder feedback rejects:

     Searching / Searching / Retrieving / Calling maps / Ranking

   What the user should get instead is the shape of the work and what it
   yielded:

     Finding nearby options      -> 8 promising places
     Checking what works tonight -> 5 available
     Comparing ratings and fit   -> 3 stand out

   So events are grouped into CONSUMER PHASES first, then each phase emits at
   most one pass. A phase that produced nothing consumable emits a status pass
   (narration only); a phase that produced something emits a value pass.

   Timing here is PRESENTATION timing, deliberately decoupled from the trace's
   real inter-event gaps (which are wildly irregular and unreadable). Real
   timestamps stay on the semantic events for anyone who wants them.
   ───────────────────────────────────────────────────────────────────────────── */

const STATUS_TIMING = { enterDuration: 500, holdDuration: 1500, exitDuration: 250 };
const VALUE_TIMING = { enterDuration: 750, holdDuration: 2700, exitDuration: 300 };

type PhaseKey = 'orient' | 'research' | 'discover' | 'enrich' | 'constrain' | 'narrow' | 'synthesize';

/** Which consumer phase an operation belongs to. Several unrelated tool kinds
 *  legitimately share a phase — that collapsing is the point. */
const PHASE_BY_EVENT: Record<string, PhaseKey> = {
  search: 'discover',
  // Web research is its own consumer phase, not a variant of discovery.
  // Collapsing them (as an earlier version did) meant a WebSearch-heavy trace
  // — the single most common shape in this corpus — produced exactly ONE
  // status pass for the whole run. Reading sources and finding candidates are
  // different things to the user, and each is worth its own beat.
  retrieve: 'research',
  enrichment: 'enrich',
  compare: 'narrow',
  rank: 'narrow',
  filter: 'narrow',
  maps: 'constrain',
  availability: 'constrain',
  schedule: 'constrain',
  synthesis: 'synthesize',
  clarify: 'orient',
};

const PHASE_ORDER: PhaseKey[] = ['orient', 'research', 'discover', 'enrich', 'constrain', 'narrow', 'synthesize'];

interface PhaseBucket {
  key: PhaseKey;
  events: SemanticAgentEvent[];
  entities: NormalizedEntity[];
  /** True once ANY event in this phase was judged canvas_value. */
  hasValue: boolean;
}

function dedupeEntities(entities: NormalizedEntity[]): NormalizedEntity[] {
  const seen = new Set<string>();
  const out: NormalizedEntity[] = [];
  for (const e of entities) {
    const key = e.externalId ?? e.title?.toLowerCase().trim() ?? e.id;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
  }
  return out;
}

function pluralise(n: number, singular: string, plural = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

/** The noun the user themselves used, when the prompt named one. Falls back
 *  to a neutral word rather than guessing a domain. */
function entityNoun(requirements: QueryRequirements): string {
  return requirements.entityType ?? 'option';
}

function metaNumber(event: SemanticAgentEvent, key: string): number | undefined {
  const v = (event.metadata as Record<string, unknown> | undefined)?.[key];
  return typeof v === 'number' ? v : undefined;
}

function metaString(event: SemanticAgentEvent, key: string): string | undefined {
  const v = (event.metadata as Record<string, unknown> | undefined)?.[key];
  return typeof v === 'string' && v.trim() ? v : undefined;
}

function metaArray<T>(event: SemanticAgentEvent, key: string): T[] | undefined {
  const v = (event.metadata as Record<string, unknown> | undefined)?.[key];
  return Array.isArray(v) ? (v as T[]) : undefined;
}

/* ── Per-phase pass construction ─────────────────────────────────────────── */

/** Web research. The consumable thing here is BREADTH — how widely the agent
 *  looked — never the raw result list, which is a pile of page titles the user
 *  did not ask for. Real per-source identity (see extractSourceEvidence) is
 *  preferred whenever the trace carries it, so this phase gets the same
 *  visible source strip as candidate_ranking's dedicated arc — a claim of
 *  "checked N sources" earns a canvas the same way "found N places" does.
 *  Only falls back to a bare count/status line when no resolvable per-source
 *  identity exists (e.g. resultCount metadata with no parseable URLs). */
function buildResearchPass(bucket: PhaseBucket, index: number, entityTitles: string[], rng: Rng): ThinkingPass | undefined {
  if (!bucket.events.length) return undefined;

  const evidence = extractSourceEvidence(bucket.events, entityTitles);

  if (evidence.sources.length >= 2) {
    return {
      id: `pass-${index}-research`,
      visibility: 'canvas_value',
      narration:
        evidence.sourceCount >= 4
          ? phrase(['Reading up on it from a few angles', 'Digging into a handful of sources', 'Pulling together views from a few places'], rng)
          : phrase(['Cross-checking a couple of sources', 'Comparing notes across a couple of sources', 'Double-checking against another source'], rng),
      valueType: 'sources',
      payload: {
        sources: evidence.sources.map((s) => ({ label: s.label, kind: s.kind, domain: s.domain })),
        sourceCount: evidence.sourceCount,
        searchCount: evidence.searchCount,
      },
      sourceEventIds: bucket.events.map((e) => e.id),
      sourceSpanIds: bucket.events.flatMap((e) => e.sourceSpanIds),
      confidence: 'high',
      ...VALUE_TIMING,
    };
  }

  if (evidence.sources.length === 1 && evidence.sources[0].kind === 'maps') {
    return {
      id: `pass-${index}-research`,
      visibility: 'status',
      narration: phrase(['Checking places nearby on the map', "Scanning what's nearby on the map", 'Looking at what maps has nearby'], rng),
      sourceEventIds: bucket.events.map((e) => e.id),
      sourceSpanIds: bucket.events.flatMap((e) => e.sourceSpanIds),
      confidence: 'high',
      ...STATUS_TIMING,
    };
  }

  const sourceCount = bucket.events.reduce((sum, e) => sum + (metaNumber(e, 'resultCount') ?? 0), 0);
  const queries = bucket.events.map((e) => metaString(e, 'query')).filter((q): q is string => !!q);

  if (sourceCount >= 3) {
    return {
      id: `pass-${index}-research`,
      visibility: 'canvas_value',
      narration:
        queries.length > 1
          ? phrase(['Reading up on it from a few angles', 'Digging into a handful of sources', 'Pulling together views from a few places'], rng)
          : phrase(['Reading up on it', 'Doing some reading', 'Taking a look through it'], rng),
      valueType: 'count',
      payload: { value: sourceCount, label: 'sources read', qualifier: queries.length > 1 ? `across ${queries.length} searches` : undefined },
      sourceEventIds: bucket.events.map((e) => e.id),
      sourceSpanIds: bucket.events.flatMap((e) => e.sourceSpanIds),
      confidence: 'high',
      ...VALUE_TIMING,
    };
  }

  const lookingAcross = phrase(
    [(n: number) => `Looking across ${n} sources`, (n: number) => `Checking ${n} different sources`, (n: number) => `Scanning ${n} sources`] as const,
    rng
  );
  return {
    id: `pass-${index}-research`,
    visibility: 'status',
    narration: bucket.events.length > 1 ? lookingAcross(bucket.events.length) : phrase(['Looking it up', 'Checking on that', 'Taking a look'], rng),
    sourceEventIds: bucket.events.map((e) => e.id),
    sourceSpanIds: bucket.events.flatMap((e) => e.sourceSpanIds),
    confidence: 'high',
    ...STATUS_TIMING,
  };
}

const FOUND_LEAD = ['Found', 'Turned up', 'Spotted'] as const;

function buildDiscoverPass(
  bucket: PhaseBucket,
  requirements: QueryRequirements,
  index: number,
  context: PassBuildContext,
  rng: Rng,
  resolved: ResolvedCandidateSet
): ThinkingPass | undefined {
  const sourceCount = bucket.events.length;
  const noun = entityNoun(requirements);

  // THE RULE: the visible candidate set is resolved FIRST (see
  // candidateResolution.ts — discovery extraction, then sibling enrichment
  // spans, then final-response backfill from the SAME trace), and the count in
  // the narration IS `visible.length` — the sentence and the canvas are
  // derived from the same array and cannot disagree. An entity with no image
  // and no coordinates still renders; the tile just carries less.
  if (resolved.visible.length) {
    const entities = resolved.visible;
    return {
      id: `pass-${index}-discover`,
      visibility: 'canvas_value',
      narration: `${phrase(FOUND_LEAD, rng)} ${pluralise(entities.length, `promising ${noun}`, `promising ${noun}s`)}`,
      valueType: 'entity_preview',
      payload: {
        entities,
        canvas: [{ type: 'ADD_ITEMS', items: entities.map((e) => toProgressiveItem(e)) } as AgentMutation],
      },
      sourceEventIds: bucket.events.map((e) => e.id),
      sourceSpanIds: bucket.events.flatMap((e) => e.sourceSpanIds),
      // Backfilled identities are recovered from the answer, not observed
      // during discovery — and the pass says so.
      confidence: resolved.entitySource === 'final_response_backfill' ? 'medium' : 'high',
      debug: {
        narrationCount: entities.length,
        visibleCandidateCount: entities.length,
        canonicalCandidateCount: resolved.canonical.length,
        discoveryExtracted: resolved.diagnostics.discoveryExtracted,
        finalResponseExtracted: resolved.diagnostics.finalResponseExtracted,
        entitySource: resolved.entitySource,
        subsetSource: resolved.subsetSource,
        droppedTitles: resolved.diagnostics.droppedTitles.length ? resolved.diagnostics.droppedTitles : undefined,
        imagesAvailable: resolved.diagnostics.imagesAvailable,
        coordinatesAvailable: resolved.diagnostics.coordinatesAvailable,
      },
      ...VALUE_TIMING,
    };
  }

  if ((context.finalEntityCount ?? 0) >= 2) {
    // Legacy caller shape: only a COUNT is known (no identities were passed
    // in). Reporting it is honest — the agent really did find that many —
    // but real trace playback now supplies `finalEntities`, so the tiles
    // themselves take this branch's place.
    return {
      id: `pass-${index}-discover`,
      visibility: 'canvas_value',
      narration: `${phrase(FOUND_LEAD, rng)} ${pluralise(context.finalEntityCount!, `promising ${noun}`, `promising ${noun}s`)}`,
      valueType: 'count',
      payload: { value: context.finalEntityCount!, label: `${noun}s worth checking` },
      sourceEventIds: bucket.events.map((e) => e.id),
      sourceSpanIds: bucket.events.flatMap((e) => e.sourceSpanIds),
      confidence: 'medium',
      ...VALUE_TIMING,
    };
  }

  // The agent searched, the tool output carried nothing usable, and the
  // answer named nothing either. Narrate the work; claim no findings.
  const lookingAcross = phrase(
    [(n: number) => `Looking across ${n} sources`, (n: number) => `Checking ${n} different sources`, (n: number) => `Scanning ${n} sources`] as const,
    rng
  );
  return {
    id: `pass-${index}-discover`,
    visibility: 'status',
    narration: sourceCount > 1 ? lookingAcross(sourceCount) : phrase(['Looking for options', 'Searching around', 'Casting a wide net'], rng),
    sourceEventIds: bucket.events.map((e) => e.id),
    sourceSpanIds: bucket.events.flatMap((e) => e.sourceSpanIds),
    confidence: 'high',
    ...STATUS_TIMING,
  };
}

function buildEnrichPass(
  bucket: PhaseBucket,
  requirements: QueryRequirements,
  index: number,
  rng: Rng,
  resolved: ResolvedCandidateSet
): ThinkingPass | undefined {
  if (!bucket.events.length) return undefined;

  // When a visible candidate set exists, enrichment PATCHES those same
  // identities — it never introduces new tiles. This is the exact bug behind
  // "Found 4 sanctuaries" with 5 tiles on screen (trace b5463ca8…): discovery
  // claimed the final response's 4 while enrichment ADDed its own 5 under
  // unrelated ids. Enrichment data is matched back by place_id/title;
  // anything that matches nothing visible was explored-and-dropped by the
  // agent and stays off the canvas (the dev panel names it instead).
  const enrichedEntities = resolved.visible.length
    ? resolved.visible.map((v) => mergeCandidate(v, bucket.entities.find((e) => isSameCandidate(v, e))))
    : bucket.entities;
  const attrs = requirements.requestedAttributes;
  // Narrate in terms of what the USER asked to know, not what the tool is called.
  const wanted = [
    attrs.includes('rating') ? 'ratings' : undefined,
    attrs.includes('price') ? 'prices' : undefined,
    attrs.includes('availability') ? 'timings' : undefined,
  ].filter((w): w is string => !!w);
  const narration = wanted.length
    ? `${phrase(['Checking', 'Looking into', 'Confirming'] as const, rng)} ${wanted.join(', ')}`
    : phrase(['Looking at the details', 'Digging into specifics', 'Getting into the details'], rng);

  if (!enrichedEntities.length) {
    return {
      id: `pass-${index}-enrich`,
      visibility: 'status',
      narration,
      sourceEventIds: bucket.events.map((e) => e.id),
      sourceSpanIds: bucket.events.flatMap((e) => e.sourceSpanIds),
      confidence: 'high',
      ...STATUS_TIMING,
    };
  }

  // ADD before ENRICH. Enrichment routinely finds entities that discovery
  // never surfaced — the deployment truncates `tool.output` at 2000 chars, so
  // a PlaceSearch array is often unparseable while the per-place PlaceDetails
  // calls that follow parse cleanly. Patching an item that was never added
  // leaves the canvas empty, so the entities are added here too; the runtime's
  // ADD_ITEMS dedupes by id, making this a no-op when discovery already had
  // them.
  const canvas: AgentMutation[] = [
    { type: 'ADD_ITEMS', items: enrichedEntities.map((e) => toProgressiveItem(e)) } as AgentMutation,
    ...enrichedEntities
      .map((e) => {
        const data: Record<string, unknown> = {};
        if (e.rating != null) data.rating = e.rating;
        if (e.reviewCount != null) data.reviewCount = e.reviewCount;
        if (e.price) data.priceLevel = e.price;
        if (typeof e.availability === 'string') data.availability = e.availability;
        return Object.keys(data).length ? ({ type: 'ENRICH_ITEMS', patches: [{ id: e.id, data }] } as AgentMutation) : undefined;
      })
      .filter((m): m is AgentMutation => !!m),
  ];

  const rated = enrichedEntities.filter((e) => e.rating != null).length;
  // When the enrichment actually changed what's on the canvas, the canvas
  // itself is the payload; otherwise a count is the honest summary of it.
  const valueType: ThinkingValueType = canvas.length ? 'entity_preview' : 'count';
  const payload: ThinkingPayload = canvas.length
    ? { entities: enrichedEntities, canvas }
    : { value: rated || enrichedEntities.length, label: rated ? 'rated and reviewed' : 'checked in detail' };

  return {
    id: `pass-${index}-enrich`,
    visibility: 'canvas_value',
    narration,
    valueType,
    payload,
    sourceEventIds: bucket.events.map((e) => e.id),
    sourceSpanIds: bucket.events.flatMap((e) => e.sourceSpanIds),
    confidence: 'high',
    ...VALUE_TIMING,
  };
}

/** Rebuilds the route the maps extractor put on the event's metadata. Kept
 *  narrow and defensive: a coordinate only survives if BOTH halves are real
 *  numbers, so a half-parsed leg can never reach the map. */
function routeFromEvent(event: SemanticAgentEvent): ExtractedRoute | undefined {
  const travelTime = metaString(event, 'travelTime');
  if (!travelTime) return undefined;
  const meta = event.metadata ?? {};
  const point = (value: unknown): { lat: number; lng: number } | undefined => {
    const p = value as { lat?: unknown; lng?: unknown } | undefined;
    return typeof p?.lat === 'number' && typeof p?.lng === 'number' ? { lat: p.lat, lng: p.lng } : undefined;
  };
  return {
    travelTime,
    distance: metaString(event, 'distance'),
    destinationText: metaString(event, 'destinationText'),
    originText: metaString(event, 'originText'),
    travelMode: metaString(event, 'travelMode'),
    durationSeconds: typeof meta.durationSeconds === 'number' ? meta.durationSeconds : undefined,
    distanceMeters: typeof meta.distanceMeters === 'number' ? meta.distanceMeters : undefined,
    from: point(meta.from),
    to: point(meta.to),
  };
}

function buildConstrainPass(
  bucket: PhaseBucket,
  requirements: QueryRequirements,
  index: number,
  rng: Rng
): ThinkingPass | ThinkingPass[] | undefined {
  if (!bucket.events.length) return undefined;

  // Route/travel-time work: the useful thing is the saving or the ETA, never
  // "called the maps tool".
  const routeEvent = bucket.events.find((e) => metaString(e, 'travelTime') || metaString(e, 'savings'));
  if (routeEvent) {
    const savings = metaString(routeEvent, 'savings');

    /* SPATIAL THINKING. When the route carries real coordinates this becomes a
       three-beat map arc rather than one line of text — the agent opens a
       contained spatial view, places both ends, draws the connection, then
       concludes. See routeMapPlan.ts for what is and is not truthful there.
       A comparison of two routes (`savings`) is not this shape and keeps the
       existing text treatment. */
    if (!savings) {
      const route = routeFromEvent(routeEvent);
      if (route) {
        const mapPasses = buildRouteMapPasses({
          route,
          requirements,
          idPrefix: `pass-${index}`,
          sourceEventIds: bucket.events.map((e) => e.id),
          sourceSpanIds: bucket.events.flatMap((e) => e.sourceSpanIds),
          rng,
        });
        if (mapPasses.length) return mapPasses;
      }
    }

    const travelTime = metaString(routeEvent, 'travelTime');
    const distance = metaString(routeEvent, 'distance');
    return {
      id: `pass-${index}-constrain`,
      visibility: 'canvas_value',
      narration: savings
        ? phrase(['Comparing ways to get there', 'Weighing up the routes', 'Checking which way is quicker'], rng)
        : phrase(['Checking how far each one is', 'Seeing how far away each one is', 'Checking the distance to each'], rng),
      valueType: 'route',
      payload: {
        origin: metaString(routeEvent, 'origin'),
        destination: metaString(routeEvent, 'destinationText'),
        stops: [],
        eta: travelTime,
        distance,
        savings,
      },
      sourceEventIds: bucket.events.map((e) => e.id),
      sourceSpanIds: bucket.events.flatMap((e) => e.sourceSpanIds),
      confidence: 'medium',
      ...VALUE_TIMING,
    };
  }

  const slots = bucket.events.flatMap((e) => metaArray<{ label: string; state: string }>(e, 'slots') ?? []);
  if (slots.length) {
    const open = slots.filter((s) => s.state === 'open').length;
    return {
      id: `pass-${index}-constrain`,
      visibility: 'canvas_value',
      narration: phrase(['Checking what actually works tonight', "Seeing what's actually open tonight", 'Checking what fits tonight'], rng),
      valueType: 'availability',
      payload: {
        summary: `${open} of ${slots.length} available`,
        slots: slots.map((s) => ({ label: s.label, state: (s.state as 'open' | 'limited' | 'full' | 'unknown') ?? 'unknown' })),
      },
      sourceEventIds: bucket.events.map((e) => e.id),
      sourceSpanIds: bucket.events.flatMap((e) => e.sourceSpanIds),
      confidence: 'medium',
      ...VALUE_TIMING,
    };
  }

  return {
    id: `pass-${index}-constrain`,
    visibility: 'status',
    narration: phrase(['Checking timings and conditions', 'Checking the timings', 'Looking at timings and conditions'], rng),
    sourceEventIds: bucket.events.map((e) => e.id),
    sourceSpanIds: bucket.events.flatMap((e) => e.sourceSpanIds),
    confidence: 'medium',
    ...STATUS_TIMING,
  };
}

function buildNarrowPass(
  bucket: PhaseBucket,
  classification: ScenarioClassification,
  index: number,
  rng: Rng
): ThinkingPass | undefined {
  if (!bucket.events.length && !bucket.entities.length) return undefined;

  const shortlist = bucket.entities.slice(0, 3);
  if (!shortlist.length) {
    return {
      id: `pass-${index}-narrow`,
      visibility: 'status',
      narration: phrase(['Weighing them against each other', 'Weighing up the options', 'Sizing them up against each other'], rng),
      sourceEventIds: bucket.events.map((e) => e.id),
      sourceSpanIds: bucket.events.flatMap((e) => e.sourceSpanIds),
      confidence: 'medium',
      ...STATUS_TIMING,
    };
  }

  // NEVER promote here. Narrowing is not deciding — a winner only exists if
  // the trace itself distinguished one, and that belongs to the final
  // response. `list` traces in particular must reach the end with nothing
  // promoted.
  const canvas: AgentMutation[] = [{ type: 'SHORTLIST_ITEMS', ids: shortlist.map((e) => e.id) } as AgentMutation];

  const worthALook = phrase(
    [(n: number) => `${n} worth a look`, (n: number) => `${n} worth a closer look`, (n: number) => `${n} that are worth a look`] as const,
    rng
  );
  const standOut = phrase(
    [(n: number) => `${n} stand out`, (n: number) => `${n} really stand out`, (n: number) => `${n} pull ahead of the rest`] as const,
    rng
  );

  return {
    id: `pass-${index}-narrow`,
    visibility: 'canvas_value',
    narration:
      classification.archetype === 'list'
        ? worthALook(shortlist.length)
        : shortlist.length === 2
          ? phrase(['Two options stand out', 'A couple of options stand out', 'Two really stand out'], rng)
          : standOut(shortlist.length),
    valueType: 'entity_preview',
    payload: { entities: shortlist, emphasisIds: shortlist.map((e) => e.id), canvas },
    sourceEventIds: bucket.events.map((e) => e.id),
    sourceSpanIds: bucket.events.flatMap((e) => e.sourceSpanIds),
    confidence: 'medium',
    ...VALUE_TIMING,
  };
}

function buildSynthesizePass(bucket: PhaseBucket, index: number, rng: Rng): ThinkingPass | undefined {
  if (!bucket.events.length) return undefined;
  const facts = bucket.events.flatMap((e) => metaArray<string>(e, 'facts') ?? []);
  const themes = bucket.events.flatMap((e) => metaArray<{ label: string; count: number }>(e, 'themes') ?? []);

  if (themes.length) {
    return {
      id: `pass-${index}-synthesize`,
      visibility: 'canvas_value',
      narration: phrase(['Pulling the common threads together', 'Pulling together what keeps coming up', 'Bringing the common threads together'], rng),
      valueType: 'cluster',
      payload: { clusters: themes.map((t) => ({ label: t.label, count: t.count })) },
      sourceEventIds: bucket.events.map((e) => e.id),
      confidence: 'medium',
      ...VALUE_TIMING,
    };
  }

  if (facts.length) {
    return {
      id: `pass-${index}-synthesize`,
      visibility: 'canvas_value',
      narration: phrase(['Here is what keeps coming up', "Here's the recurring theme", 'This is what keeps coming up'], rng),
      valueType: 'text',
      payload: { lines: facts.slice(0, 4) },
      sourceEventIds: bucket.events.map((e) => e.id),
      confidence: 'medium',
      ...VALUE_TIMING,
    };
  }

  return {
    id: `pass-${index}-synthesize`,
    visibility: 'status',
    narration: phrase(['Putting it together', 'Pulling it all together', 'Bringing it together'], rng),
    sourceEventIds: bucket.events.map((e) => e.id),
    confidence: 'high',
    ...STATUS_TIMING,
  };
}

/** Facts about the trace as a whole that individual events do not carry, but
 *  which change what is worth showing mid-flight. */
export interface PassBuildContext {
  /** How many comparable entities the FINAL response ended up naming. Used
   *  only to recover an honest count when tool-output truncation lost the
   *  discovery-time entities — never to preview the answer itself. */
  finalEntityCount?: number;
  /** The comparable entities the FINAL response actually names, from the SAME
   *  trace. Used as the last-priority identity source when tool-output
   *  truncation lost the discovery-time entities (see candidateResolution.ts)
   *  — reconstruction from the run's own answer, never fabrication. */
  finalEntities?: NormalizedEntity[];
  /** Wording variety — see narrationVariety.ts. Omit for today's exact
   *  canonical copy (every existing caller/test does); real playback passes
   *  `Math.random` once, when the scenario is built (see scenarios/fromTrace.ts,
   *  scenarios/fixtures.ts) — never on every render. */
  rng?: Rng;
}

export interface PassBuildResult {
  passes: ThinkingPass[];
  /** Every event the user-value classifier hid, with its reason. Developer
   *  diagnostics only — this is how "what did you filter out" gets answered. */
  filtered: Array<{ eventId: string; type: string; reason: string }>;
}

/** Groups a semantic event stream into consumer phases and emits at most one
 *  pass per phase. Never emits a pass per event, and never emits a pass for an
 *  operation the user-value classifier marked invisible. */
export function semanticEventsToThinkingPasses(
  events: SemanticAgentEvent[],
  classification: ScenarioClassification,
  requirements: QueryRequirements,
  context: PassBuildContext = {}
): PassBuildResult {
  const rng = context.rng ?? STABLE_RNG;
  const filtered: Array<{ eventId: string; type: string; reason: string }> = [];
  const buckets = new Map<PhaseKey, PhaseBucket>();

  for (const event of events) {
    const decision = classifyEventVisibility(event, requirements);
    if (decision.visibility === 'invisible') {
      filtered.push({ eventId: event.id, type: event.type, reason: decision.reason });
      continue;
    }
    const key = PHASE_BY_EVENT[event.type];
    if (!key) {
      filtered.push({ eventId: event.id, type: event.type, reason: 'No consumer phase defined for this operation.' });
      continue;
    }
    if (!buckets.has(key)) buckets.set(key, { key, events: [], entities: [], hasValue: false });
    const bucket = buckets.get(key)!;
    bucket.events.push(event);
    bucket.hasValue = bucket.hasValue || decision.visibility === 'canvas_value';
    for (const entity of event.entities ?? []) bucket.entities.push(toNormalizedEntity(entity));
  }

  for (const bucket of buckets.values()) bucket.entities = dedupeEntities(bucket.entities);

  // ── ONE canonical candidate set for the whole stream ────────────────────
  // Resolved BEFORE any pass is built, so the discover narration's count, the
  // discover canvas, the enrich patches and the narrow shortlist all reference
  // the same identities. Priority: discovery extraction, then sibling
  // enrichment spans, then the final response of the same trace (backfill).
  // A comparison must show the same identities that later enter comparison
  // mode, so it prefers the final response's own set and order.
  const resolved = resolveCandidateSet({
    observed: dedupeEntities([
      ...(buckets.get('discover')?.entities ?? []),
      ...(buckets.get('enrich')?.entities ?? []),
      ...(buckets.get('research')?.entities ?? []),
    ]),
    finalEntities: context.finalEntities ?? [],
    preferFinalIdentity: classification.archetype === 'comparison',
  });

  // Narrowing rarely has entities of its own — it operates on what discovery
  // and enrichment already found. Seed it from the SAME canonical set the
  // canvas renders, so "N stand out" points at tiles that exist.
  const narrow = buckets.get('narrow');
  if (narrow && !narrow.entities.length) {
    narrow.entities = resolved.visible.slice(0, 3);
  }

  // For "Venue site" domain resolution (see readableSourceLabel) — every
  // entity name discovered anywhere in the trace, not just this phase's own
  // bucket, since research commonly runs before discover names anything.
  const allEntityTitles = [...buckets.values()]
    .flatMap((b) => b.entities.map((e) => e.title))
    .filter((t): t is string => !!t);

  const passes: ThinkingPass[] = [];
  let index = 0;

  for (const key of PHASE_ORDER) {
    const bucket = buckets.get(key);
    if (!bucket) continue;
    index += 1;
    // Most phases yield one pass; a spatial (route) phase yields the whole
    // three-beat map arc, so this accepts either.
    let pass: ThinkingPass | ThinkingPass[] | undefined;
    switch (key) {
      case 'research':
        pass = buildResearchPass(bucket, index, allEntityTitles, rng);
        break;
      case 'discover':
        pass = buildDiscoverPass(bucket, requirements, index, context, rng, resolved);
        break;
      case 'enrich':
        pass = buildEnrichPass(bucket, requirements, index, rng, resolved);
        break;
      case 'constrain':
        pass = buildConstrainPass(bucket, requirements, index, rng);
        break;
      case 'narrow':
        pass = buildNarrowPass(bucket, classification, index, rng);
        break;
      case 'synthesize':
        pass = buildSynthesizePass(bucket, index, rng);
        break;
      case 'orient':
        pass = {
          id: `pass-${index}-orient`,
          visibility: 'status',
          narration: phrase(['Working out what you need', "Figuring out what you're after", 'Getting a handle on what you need'], rng),
          sourceEventIds: bucket.events.map((e) => e.id),
          confidence: 'high',
          ...STATUS_TIMING,
        };
        break;
    }
    if (pass) passes.push(...(Array.isArray(pass) ? pass : [pass]));
  }

  return { passes, filtered };
}

/** Convenience for renderers/tests: the payload of a pass, typed to what its
 *  valueType promises. Returns undefined for status passes, which carry none. */
export function passPayload<T extends ThinkingPayload>(pass: ThinkingPass): T | undefined {
  return pass.payload as T | undefined;
}
