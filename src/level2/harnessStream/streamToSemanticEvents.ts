import type { ExtractedEntity, SemanticAgentEvent, SemanticEventType } from '../../types/semanticEvent';
import { normalizeNumber, normalizeString, safeParseJson } from '../normalization/normalize';
import type {
  HarnessParallelBatchEvent,
  HarnessStreamEvent,
  HarnessTextInterimEvent,
  HarnessToolResultEvent,
  HarnessToolUseEvent,
} from './types';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Harness stream -> semantic agent events.

   The harness-stream analogue of src/level2/phoenix/semanticEvents.ts. Same
   contract, same output type (SemanticAgentEvent), same consumer-visibility
   convention (real work with no consumer meaning becomes 'internal', never
   dropped, never narrated) — everything downstream (visibility.ts,
   passBuilder.ts, candidateResolution.ts) works unchanged.

   PER YOUR SPEC, the mapping is decided here, once:

     text_interim        -> PRIMARY narration (replaces synthesized text)
     tool_use/tool_result -> drives the canvas (real entities, untruncated)
     parallel_batch       -> tags simultaneous tool events, does not serialize
     reasoning            -> 'internal' — raw chain-of-thought never reaches
                             the consumer, same ALWAYS_INVISIBLE rule Phoenix's
                             llm.call spans already get
     insight/system        -> 'internal' — timing/diagnostic signal only;
                             tool_selected/tool_done specifically are consumed
                             for REAL TIMING (see computeTimeline below), never
                             surfaced as their own narration
     turn_started/[DONE]/
     stream_request_start -> discarded before event construction; not even
                             worth an 'internal' event

   TIMING: real per-event timestamps exist only on `insight` events (and
   nowhere on tool_use/tool_result/reasoning/text_interim themselves) — a
   tool_selected/tool_done PAIR brackets each tool call with real epoch ms.
   Events with no timestamp of their own get one by linear interpolation
   between the nearest bounding timestamped events, by array position — the
   same tolerance for partial/interpolated timing runtime/schedule.ts already
   accepts for Phoenix's "un-anchored" passes, applied one step earlier.
   Never invented outright: every interpolation is bounded by two REAL
   timestamps from this exact turn.
   ───────────────────────────────────────────────────────────────────────────── */

export interface StreamExtractionDiagnostics {
  recognizedTools: string[];
  unrecognizedTools: string[];
  unusableToolOutputs: string[];
  internalEventCount: number;
  /** True if the stream carried no `insight.ts` at all, so every timestamp is
   *  a flat 0 rather than a real interpolation. Surfaced so a scenario built
   *  this way is honest that `traceTiming` should not be trusted. */
  noRealTimingFound: boolean;
}

export interface StreamExtractionResult {
  events: SemanticAgentEvent[];
  diagnostics: StreamExtractionDiagnostics;
}

/** Same tool-name -> SemanticEventType mapping as
 *  src/level2/phoenix/semanticEvents.ts's private classifyToolName — kept as
 *  a small local copy rather than exporting a helper out of an unrelated,
 *  already-shipping Phoenix file for one caller. If the two ever drift,
 *  that's a real signal the mapping itself needs to move somewhere shared. */
function classifyToolName(name: string): SemanticEventType {
  const n = name.toLowerCase();
  // Any *Events tool (CricketEvents, SportsEvents, …) is a real search
  // operation over a result set, same shape as PlaceSearch/EventSearch —
  // recognizing it means a genuine "found 0" moment gets its own honest
  // pass instead of being silently dropped as an unrecognized tool.
  if (n.includes('placesearch') || n.includes('nearbyplaces') || n.includes('productsearch') || n.includes('eventsearch') || n.includes('attractionsearch') || n.includes('venuesearch') || n.endsWith('events')) return 'search';
  if (n.includes('websearch') || n.includes('webfetch')) return 'retrieve';
  if (n.includes('placedetails') || n.includes('placereviews') || n.includes('eventdetails') || n.includes('productdetails') || n.includes('productfetch')) return 'enrichment';
  if (n.includes('getroute') || n.includes('distance') || n.includes('direction')) return 'maps';
  if (n.includes('getweather')) return 'availability';
  if (n.includes('rank') || n.includes('rerank')) return 'rank';
  if (n.includes('filter')) return 'filter';
  return 'unknown';
}

function narrationFor(type: SemanticEventType, name: string, textInterim: string | undefined): string {
  // text_interim IS the real narration — always preferred when present.
  if (textInterim) return textInterim;
  switch (type) {
    case 'search':
      return 'Searching for options';
    case 'retrieve':
      return 'Reading up on it';
    case 'enrichment':
      return 'Looking at ratings, reviews and details';
    case 'maps':
      return 'Checking travel times';
    case 'availability':
      return 'Checking conditions';
    default:
      return `Running ${name}`;
  }
}

/* ── Timing ──────────────────────────────────────────────────────────────── */

function eventTs(e: HarnessStreamEvent): number | undefined {
  return e.type === 'insight' && typeof (e as { ts?: unknown }).ts === 'number' ? (e as { ts: number }).ts : undefined;
}

/** One timestamp per event index, ms relative to the first real timestamp in
 *  the stream. Known points come straight from `insight.ts`; everything else
 *  is linearly interpolated between the nearest known neighbours by array
 *  position (flat-extrapolated before the first / after the last known
 *  point). Real captures always have insight events throughout the stream,
 *  so gaps are short in practice — this is never asked to bridge more than a
 *  handful of events. */
function computeTimeline(events: HarnessStreamEvent[]): { ts: number[]; noRealTimingFound: boolean } {
  const raw = events.map(eventTs);
  const knownIdx = raw.reduce<number[]>((acc, v, i) => (v !== undefined ? [...acc, i] : acc), []);
  if (!knownIdx.length) return { ts: events.map(() => 0), noRealTimingFound: true };

  const t0 = raw[knownIdx[0]]!;
  const known = knownIdx.map((i) => ({ i, t: raw[i]! - t0 }));

  const out = new Array<number>(events.length);
  for (let i = 0; i < events.length; i++) {
    if (raw[i] !== undefined) {
      out[i] = raw[i]! - t0;
      continue;
    }
    const before = [...known].reverse().find((k) => k.i < i);
    const after = known.find((k) => k.i > i);
    if (before && after) {
      const span = after.i - before.i;
      const frac = span > 0 ? (i - before.i) / span : 0;
      out[i] = before.t + (after.t - before.t) * frac;
    } else if (before) {
      out[i] = before.t;
    } else if (after) {
      out[i] = after.t;
    } else {
      out[i] = 0;
    }
  }
  return { ts: out, noRealTimingFound: false };
}

/* ── Entity extraction — reads the SAME real API response shapes
   src/adapters/entityExtraction.ts documents for Phoenix, direct from
   already-parsed JSON. The truncation-recovery fallback that file needs
   (Phoenix caps tool.output at 2000 chars) has no equivalent need here —
   these captures carry the full, untruncated tool_result.text — so a plain
   safeParseJson is sufficient and the regex/brace-scanning fallback path
   would simply never trigger even if reused. ─────────────────────────────── */

interface RawPlace {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  rating?: number;
  user_rating_count?: number;
  price_display?: string;
  photo_url?: string;
  travel_time_text?: string;
  travel_distance_text?: string;
  opening_hours?: string[];
}

let seq = 0;
function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}-${seq}`;
}

function extractPlaceEntities(text: string): ExtractedEntity[] {
  const parsed = safeParseJson<{ places?: RawPlace[] }>(text);
  const places = parsed?.places;
  if (!Array.isArray(places)) return [];
  return places
    .filter((p) => p?.name)
    .map((p) => ({
      id: nextId('place'),
      type: 'place' as const,
      externalId: p.place_id,
      title: p.name,
      subtitle: normalizeString(p.formatted_address),
      image: p.photo_url,
      rating: normalizeNumber(p.rating),
      reviewCount: normalizeNumber(p.user_rating_count),
      price: normalizeString(p.price_display),
      travelTime: normalizeString(p.travel_time_text),
      distance: normalizeString(p.travel_distance_text),
      raw: p,
    }));
}

function extractPlaceDetailsEntity(text: string): ExtractedEntity | undefined {
  const parsed = safeParseJson<RawPlace>(text);
  if (!parsed?.name) return undefined;
  return {
    id: nextId('place-detail'),
    type: 'place',
    externalId: parsed.place_id,
    title: parsed.name,
    image: parsed.photo_url,
    rating: normalizeNumber(parsed.rating),
    reviewCount: normalizeNumber(parsed.user_rating_count),
    price: normalizeString(parsed.price_display),
    availability: Array.isArray(parsed.opening_hours) && parsed.opening_hours.length
      ? parsed.opening_hours.slice(0, 2).join(' · ')
      : undefined,
    raw: parsed,
  };
}

interface RawProduct {
  product_id?: string;
  title?: string;
  brand?: string;
  price?: number;
  currency?: string;
  image_url?: string;
  in_stock?: boolean;
}

function extractProductEntities(text: string): ExtractedEntity[] {
  const parsed = safeParseJson<{ products?: RawProduct[] }>(text);
  const products = parsed?.products;
  if (!Array.isArray(products)) return [];
  return products
    .filter((p) => p?.title)
    .map((p) => ({
      id: nextId('product'),
      type: 'product' as const,
      externalId: p.product_id,
      title: p.title,
      subtitle: normalizeString(p.brand),
      image: p.image_url,
      price: p.price != null ? `${p.currency === 'USD' ? '$' : '₹'}${p.price}` : undefined,
      raw: p,
    }));
}

interface RawRoute {
  origin?: string;
  destination?: string;
  travel_mode?: string;
  distance_text?: string;
  duration_text?: string;
  distance_meters?: number;
  duration_seconds?: number;
  routes?: Array<{ legs?: Array<{ start_lat?: number; start_lng?: number; end_lat?: number; end_lng?: number }>; duration_in_traffic_text?: string }>;
}

function coordinate(lat: unknown, lng: unknown): { lat: number; lng: number } | undefined {
  if (typeof lat !== 'number' || typeof lng !== 'number') return undefined;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  return { lat, lng };
}

function extractRouteMetadata(text: string): Record<string, unknown> | undefined {
  const parsed = safeParseJson<RawRoute>(text);
  if (!parsed?.duration_text) return undefined;
  const leg = parsed.routes?.[0]?.legs?.[0];
  const from = coordinate(leg?.start_lat, leg?.start_lng);
  const to = coordinate(leg?.end_lat, leg?.end_lng);
  return {
    travelTime: parsed.duration_text,
    distance: parsed.distance_text,
    destinationText: parsed.destination,
    originText: parsed.origin,
    travelMode: parsed.travel_mode,
    durationSeconds: parsed.duration_seconds,
    distanceMeters: parsed.distance_meters,
    trafficTime: parsed.routes?.[0]?.duration_in_traffic_text,
    ...(from && to ? { from, to } : {}),
  };
}

/** tool.WebSearch output is plain text: "Search results for 'query':\n\n1.
 *  Title\n   https://url\n   snippet…\n\n2. …" — a real source, not an
 *  entity, matching Phoenix's own documented treatment (a web result is
 *  never fabricated into a selectable thing). */
function extractWebSearchMetadata(text: string): { resultCount?: number; sources: Array<{ label: string; url?: string }> } {
  const sources: Array<{ label: string; url?: string }> = [];
  const entryRe = /(?:^|\n)\s*(\d{1,2})\.\s+([^\n]{4,160})\n\s*(https?:\/\/\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = entryRe.exec(text)) !== null) {
    sources.push({ label: normalizeString(m[2]) ?? m[2], url: m[3] });
    if (sources.length >= 8) break;
  }
  return { resultCount: sources.length || undefined, sources };
}

function extractEntitiesAndMetadata(
  toolName: string,
  type: SemanticEventType,
  resultText: string
): { entities: ExtractedEntity[]; metadata: Record<string, unknown> } {
  const n = toolName.toLowerCase();
  if (type === 'search') {
    const entities = n.includes('product') ? extractProductEntities(resultText) : extractPlaceEntities(resultText);
    return { entities, metadata: { tool: toolName, resultCount: entities.length || undefined } };
  }
  if (type === 'enrichment') {
    const entity = extractPlaceDetailsEntity(resultText);
    return { entities: entity ? [entity] : [], metadata: { tool: toolName } };
  }
  if (type === 'retrieve') {
    const web = extractWebSearchMetadata(resultText);
    return { entities: [], metadata: { tool: toolName, resultCount: web.resultCount, sources: web.sources, facts: web.sources.map((s) => s.label) } };
  }
  if (type === 'maps') {
    const route = extractRouteMetadata(resultText);
    return { entities: [], metadata: { tool: toolName, ...(route ?? {}) } };
  }
  return { entities: [], metadata: { tool: toolName } };
}

/* ── Main extraction ─────────────────────────────────────────────────────── */

export function streamToSemanticEvents(events: HarnessStreamEvent[]): StreamExtractionResult {
  const diagnostics: StreamExtractionDiagnostics = {
    recognizedTools: [],
    unrecognizedTools: [],
    unusableToolOutputs: [],
    internalEventCount: 0,
    noRealTimingFound: false,
  };

  const { ts: timeline, noRealTimingFound } = computeTimeline(events);
  diagnostics.noRealTimingFound = noRealTimingFound;

  const out: SemanticAgentEvent[] = [];
  let semSeq = 0;
  // Most recent parallel_batch seen, applied to the next N tool events —
  // tags them as a simultaneous group rather than serializing the narration.
  let parallelGroup: { id: number; remaining: number } | undefined;
  let parallelGroupSeq = 0;

  // Contiguous 'reasoning' runs collapse into ONE internal event — raw chain
  // of thought never reaches the consumer, but the run's span is still real
  // (first..last reasoning event in the run), for developer diagnostics only.
  let reasoningRunStart: number | undefined;
  let reasoningRunEndIdx: number | undefined;

  const flushReasoningRun = () => {
    if (reasoningRunStart === undefined || reasoningRunEndIdx === undefined) return;
    semSeq += 1;
    diagnostics.internalEventCount += 1;
    out.push({
      id: `hs-${semSeq}`,
      type: 'internal',
      sourceSpanIds: [],
      startTime: reasoningRunStart,
      endTime: timeline[reasoningRunEndIdx],
      narration: 'Model reasoning (developer diagnostics only)',
      metadata: { kind: 'reasoning' },
    });
    reasoningRunStart = undefined;
    reasoningRunEndIdx = undefined;
  };

  const pendingToolUse = new Map<string, { event: HarnessToolUseEvent; index: number }>();

  for (let i = 0; i < events.length; i++) {
    const event = events[i];

    if (event.type === 'reasoning') {
      if (reasoningRunStart === undefined) reasoningRunStart = timeline[i];
      reasoningRunEndIdx = i;
      continue;
    }
    flushReasoningRun();

    if (event.type === 'turn_started' || event.type === 'stream_request_start' || event.type === '[DONE]' || event.type === 'text_final' || event.type === 'text_replace' || event.type === 'turn_complete') {
      // Structural / final-response events — not thinking. Final response is
      // built separately from text_final/text_replace (see
      // serializeFinalEnvelope.ts); turn_complete feeds trace-level metadata
      // in the orchestrator, not a semantic event.
      continue;
    }

    if (event.type === 'insight' || event.type === 'system') {
      semSeq += 1;
      diagnostics.internalEventCount += 1;
      out.push({
        id: `hs-${semSeq}`,
        type: 'internal',
        sourceSpanIds: [],
        startTime: timeline[i],
        endTime: timeline[i],
        narration: (event as { label?: string }).label ?? event.type,
        metadata: { subtype: (event as { subtype?: string }).subtype },
      });
      continue;
    }

    if (event.type === 'parallel_batch') {
      // HarnessUnknownEvent's deliberately loose `type: string` (the
      // catch-all fallback, see types.ts) keeps TypeScript from narrowing
      // HarnessStreamEvent purely by `event.type === '…'` equality — the
      // runtime check above already proves the real shape, so the cast is
      // safe. Same pattern the insight/system branches above already use.
      const e = event as HarnessParallelBatchEvent;
      parallelGroupSeq += 1;
      parallelGroup = { id: parallelGroupSeq, remaining: e.count };
      continue;
    }

    if (event.type === 'tool_use') {
      const e = event as HarnessToolUseEvent;
      pendingToolUse.set(e.tool_use_id, { event: e, index: i });
      continue;
    }

    if (event.type === 'tool_result') {
      const e = event as HarnessToolResultEvent;
      const pending = pendingToolUse.get(e.tool_use_id);
      pendingToolUse.delete(e.tool_use_id);
      const toolName = e.name;
      const type = classifyToolName(toolName);

      if (type === 'unknown') {
        if (!diagnostics.unrecognizedTools.includes(toolName)) diagnostics.unrecognizedTools.push(toolName);
      } else if (!diagnostics.recognizedTools.includes(toolName)) {
        diagnostics.recognizedTools.push(toolName);
      }

      const startIdx = pending?.index ?? i;
      const { entities, metadata } = extractEntitiesAndMetadata(toolName, type, e.text);
      if (type !== 'unknown' && !entities.length && type === 'search') diagnostics.unusableToolOutputs.push(toolName);
      if (parallelGroup) {
        metadata.parallelGroup = parallelGroup.id;
        parallelGroup.remaining -= 1;
        if (parallelGroup.remaining <= 0) parallelGroup = undefined;
      }

      // Real narration source: the text_interim immediately preceding this
      // tool call, if the stream carried one — otherwise a generic fallback.
      const precedingInterim = findPrecedingTextInterim(events, startIdx);

      semSeq += 1;
      out.push({
        id: `hs-${semSeq}`,
        type,
        sourceSpanIds: [e.tool_use_id],
        startTime: timeline[startIdx],
        endTime: timeline[i],
        narration: narrationFor(type, toolName, precedingInterim),
        input: pending?.event.input,
        output: e.text,
        entities,
        metadata,
      });
      continue;
    }

    if (event.type === 'text_interim') {
      const e = event as HarnessTextInterimEvent;
      // Narration is consumed at the point of the tool call it precedes
      // (see findPrecedingTextInterim above) — a standalone text_interim with
      // no following tool call is rare in practice but kept as a 'synthesis'
      // event so it is never silently dropped.
      const hasFollowingTool = events.slice(i + 1).some((ev) => ev.type === 'tool_use');
      if (!hasFollowingTool) {
        semSeq += 1;
        out.push({
          id: `hs-${semSeq}`,
          type: 'synthesis',
          sourceSpanIds: [],
          startTime: timeline[i],
          endTime: timeline[i],
          narration: e.text,
          metadata: {},
        });
      }
      continue;
    }

    // Any other/unrecognised event type — real work, no consumer meaning,
    // never a guess.
    semSeq += 1;
    diagnostics.internalEventCount += 1;
    out.push({
      id: `hs-${semSeq}`,
      type: 'internal',
      sourceSpanIds: [],
      startTime: timeline[i],
      endTime: timeline[i],
      narration: event.type,
      metadata: {},
    });
  }
  flushReasoningRun();

  out.sort((a, b) => a.startTime - b.startTime);
  return { events: out, diagnostics };
}

/** The most recent `text_interim` before index `beforeIdx` that has no
 *  `tool_use`/`tool_result` between it and `beforeIdx` — i.e. the narration
 *  the model gave immediately before making this specific call. */
function findPrecedingTextInterim(events: HarnessStreamEvent[], beforeIdx: number): string | undefined {
  for (let j = beforeIdx - 1; j >= 0; j--) {
    const e = events[j];
    if (e.type === 'text_interim') return (e as HarnessTextInterimEvent).text;
    if (e.type === 'tool_use' || e.type === 'tool_result') return undefined;
  }
  return undefined;
}
