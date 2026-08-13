import type { PhoenixSpan } from '../types/phoenix';
import type { ExtractedEntity } from '../types/semanticEvent';
import { extractCandidateObjects, extractFieldsByRegex, normalizeNumber, normalizeString, safeParseJson } from '../utils/safeJson';

/* ─────────────────────────────────────────────────────────────────────────────
   Real tool.output shapes below are transcribed from live aitv-mewtwo-harness
   traces inspected directly (curl against the real Phoenix deployment, not
   the OpenAPI spec or docs) — see LEVEL2_INSTRUMENTATION_GAPS.md for the full
   inspection notes, including the confirmed traces this was verified against.
   Degrades to an empty/undefined result rather than throwing on anything
   that doesn't match — a shape drift should shrink what Level 2 can show,
   never crash it.
   ───────────────────────────────────────────────────────────────────────────── */

interface RawPlace {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  rating?: number;
  user_rating_count?: number;
  price_display?: string;
  open_now?: boolean | null;
  photo_url?: string;
}

interface RawPlaceSearchOutput {
  query?: string;
  total_results?: number;
  places?: RawPlace[];
}

interface RawPlaceDetails extends RawPlace {
  opening_hours?: string[];
  reviews?: Array<{ author?: string; rating?: number; text?: string }>;
}

/* The CONFIRMED real shape of `tool.GetRoute`'s output, read off live spans on
   aitv-mewtwo-harness (traces 3acd968b…, 4c696d3c…, aa4b489c…, 767730f1…):

     { origin, destination, travel_mode, waypoints: [], total_routes,
       distance_meters, distance_text, duration_seconds, duration_text,
       routes: [{ …, legs: [{ start_lat, start_lng, end_lat, end_lng }] }],
       source: 'google_routes_api_v2' }

   Two things matter for the map:

   1. These payloads are ~600 chars — comfortably under the 2000-char
      `tool.output` cap (LEVEL2_INSTRUMENTATION_GAPS.md §1), so unlike
      PlaceSearch they arrive COMPLETE. The coordinates are trustworthy.

   2. There is NO POLYLINE. A leg carries its start and end point and nothing
      between them, so the real shape of the road is simply not in the trace.
      The renderer must therefore draw an openly abstract connector — see
      CANDIDATE_RANKING_MAP_DATA_GAP.md and the MapThinkingStage header. */
interface RawRouteOutput {
  origin?: string;
  destination?: string;
  travel_mode?: string;
  distance_text?: string;
  duration_text?: string;
  distance_meters?: number;
  duration_seconds?: number;
  routes?: Array<{
    duration_in_traffic_text?: string;
    legs?: Array<{ start_lat?: number; start_lng?: number; end_lat?: number; end_lng?: number }>;
  }>;
}

/** A real, complete coordinate pair. Both halves must be finite numbers in
 *  range — a partially-parsed leg is discarded rather than half-plotted. */
function coordinate(lat: unknown, lng: unknown): { lat: number; lng: number } | undefined {
  if (typeof lat !== 'number' || typeof lng !== 'number') return undefined;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return undefined;
  return { lat, lng };
}

function toolAttr(span: PhoenixSpan, key: 'tool.input' | 'tool.output' | 'tool.name'): unknown {
  return span.attributes?.[key];
}

let seq = 0;
function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}-${seq}`;
}

/** tool.PlaceSearch / tool.NearbyPlaces -> one ExtractedEntity per result.
 *  `externalId` (place_id) is what later stages (PlaceDetails enrichment,
 *  final-response matching) correlate back to — this is the DISCOVER-stage
 *  source of truth for "what candidates exist", real total_results and all.
 *
 *  Confirmed real gap (see LEVEL2_INSTRUMENTATION_GAPS.md): Phoenix caps
 *  `tool.output` at exactly 2000 characters, which truncates a `places`
 *  array mid-object for any search returning more than ~2 results with
 *  photo URLs — the whole array then fails strict JSON parsing. Falls back
 *  to brace-depth object splitting + regex field extraction, which recovers
 *  every place object that happened to complete before the truncation
 *  point instead of losing the whole search result. */
export function extractPlaceSearchEntities(span: PhoenixSpan): ExtractedEntity[] {
  const raw = toolAttr(span, 'tool.output');
  const parsed = safeParseJson<RawPlaceSearchOutput>(raw);
  const places = parsed?.places;
  if (Array.isArray(places) && places.length) {
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
        raw: p,
      }));
  }
  if (typeof raw === 'string' && raw.includes('"places"')) return extractPlaceSearchEntitiesFallback(raw);
  return [];
}

function placeDetailsToEntity(obj: RawPlaceDetails): ExtractedEntity {
  const bullets: string[] = [];
  if (obj.price_display) bullets.push(obj.price_display);
  if (obj.open_now === true) bullets.push('Open now');
  if (Array.isArray(obj.reviews) && obj.reviews.length) bullets.push(`${obj.reviews.length} reviews scanned`);

  return {
    id: nextId('place-detail'),
    type: 'place',
    externalId: obj.place_id,
    title: obj.name,
    rating: normalizeNumber(obj.rating),
    reviewCount: normalizeNumber(obj.user_rating_count),
    price: normalizeString(obj.price_display),
    // Real PlaceDetails `opening_hours` text, when present — take the first
    // couple of entries so a full 7-day list doesn't overrun a card row.
    availability: Array.isArray(obj.opening_hours) && obj.opening_hours.length
      ? obj.opening_hours.slice(0, 2).join(' · ')
      : undefined,
    attributes: bullets.length ? { bullets } : undefined,
    raw: obj,
  };
}

/** tool.PlaceDetails -> a single enrichment entity, keyed by the same
 *  place_id the DISCOVER-stage PlaceSearch entity carries. Tries strict JSON
 *  first, then a control-char-tolerant retry (safeParseJson does both); if
 *  that still fails — confirmed to happen on real traces when a review's
 *  free text contains an unescaped quote — falls back to regex field
 *  extraction for just the handful of fields Level 2 actually needs, so one
 *  malformed review doesn't lose the whole card's rating/name. */
export function extractPlaceDetailsEntity(span: PhoenixSpan): ExtractedEntity | undefined {
  const raw = toolAttr(span, 'tool.output');
  const parsed = safeParseJson<RawPlaceDetails>(raw);
  if (parsed?.name) return placeDetailsToEntity(parsed);

  if (typeof raw !== 'string') return undefined;
  const fields = extractFieldsByRegex(raw, ['place_id', 'name', 'rating', 'user_rating_count', 'price_display']);
  if (!fields.name) return undefined;
  return placeDetailsToEntity({
    place_id: fields.place_id,
    name: fields.name,
    rating: normalizeNumber(fields.rating),
    user_rating_count: normalizeNumber(fields.user_rating_count),
    price_display: fields.price_display,
  });
}

/** tool.GetRoute -> raw travel-time/distance text. Deliberately does NOT
 *  return an ExtractedEntity — real GetRoute output carries no place_id
 *  (confirmed on every real trace inspected with a route call), only a full
 *  address in `destination`, so there is no reliable id-based link back to a
 *  discovered candidate. Callers must fuzzy-match `destinationText` against
 *  known candidate titles/subtitles themselves, and should treat that match
 *  as lower-confidence than anything place_id-keyed. */
export function extractRouteInfo(span: PhoenixSpan): ExtractedRoute | undefined {
  const parsed = safeParseJson<RawRouteOutput>(toolAttr(span, 'tool.output'));
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
    // Both ends or neither. One plotted point and one guessed one would be a
    // map that looks precise and is half invented.
    ...(from && to ? { from, to } : {}),
  };
}

export interface ExtractedRoute {
  travelTime?: string;
  distance?: string;
  destinationText?: string;
  /** The origin as the AGENT phrased it ('Kochi', 'Mumbai') — a place name,
   *  not a resolved address, which is exactly what a map label wants. */
  originText?: string;
  travelMode?: string;
  durationSeconds?: number;
  distanceMeters?: number;
  /** Google's own 'with current traffic' figure, when the route carried one. */
  trafficTime?: string;
  /** Real leg endpoints. Absent when the span carried no usable pair. */
  from?: { lat: number; lng: number };
  to?: { lat: number; lng: number };
}

/* ─────────────────────────────────────────────────────────────────────────────
   Final response (`harness.turn`'s output.value) — confirmed real shape:
   <place_card><summary/><panel><section title=...><card title="...">
     <badge/> <rating/> <price/> <why/> <hours/>
     <visual query=... title=... place_id="..."/>
     <cta/> <phone/>
   </card>...</section></panel></place_card><suggestions>...</suggestions>

   `place_id` lives on the nested <visual> tag, not <card> itself — confirmed
   on multiple real traces (e.g. ce8d2cac..., 02d085b8...). extractTagAttr
   below searches the whole card block for the attribute rather than a
   specific tag, so it finds it regardless of which child tag carries it.
   ───────────────────────────────────────────────────────────────────────────── */

function extractTagAttr(block: string, attrName: string): string | undefined {
  const m = block.match(new RegExp(`${attrName}="([^"]*)"`, 'i'));
  return m ? m[1] : undefined;
}

function extractTagContent(block: string, tag: string): string | undefined {
  const m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return m ? m[1].trim() : undefined;
}

function parseRatingText(ratingText: string | undefined): { rating?: number; reviewCount?: number } {
  if (!ratingText) return {};
  const m = ratingText.match(/([\d.]+)\s*★[^\d]*([\d,]+)?/);
  if (!m) return {};
  return { rating: normalizeNumber(m[1]), reviewCount: m[2] ? normalizeNumber(m[2].replace(/,/g, '')) : undefined };
}

export interface FinalResponseCard {
  entity: ExtractedEntity;
  /** 0-based position among the final cards, in response order — the
   *  closest real proxy for "the agent's own ranking" that exists in current
   *  instrumentation (no explicit rank/score field is emitted). */
  order: number;
}

export interface FinalResponseExtraction {
  cards: FinalResponseCard[];
  /** Titles of `<card>` blocks the classifier excluded as non-venue
   *  supporting info (e.g. "Booking Tips") — for GAPS-tab visibility, never
   *  silently dropped. See LEVEL2_INSTRUMENTATION_GAPS.md-style transparency:
   *  a real card the harness emitted, just not a comparable candidate. */
  excludedTitles: string[];
}

/** Real, confirmed shape: the harness sometimes puts a non-venue
 *  informational `<card>` (booking logistics, group-size notes, etc.)
 *  inside the same `<place_card><section>` alongside real venue cards, with
 *  no structural marker distinguishing it. Title match is checked first and
 *  wins even over a decoy numeric field; otherwise a card must carry at
 *  least one real venue-shaped signal (a place_id, a rating, or a price) —
 *  a card with a normal-looking title but none of those is just as likely
 *  to be junk as a real venue, so title alone never qualifies a card in. */
const NON_VENUE_TITLE_RE = /^(booking\s*tips?|before\s+you\s+book|group\s+size(\s*&\s*pricing)?|available\s+time\s+slots?|price\s+range|good\s+to\s+know)$/i;

export function isVenueLikeEntity(entity: Pick<ExtractedEntity, 'title' | 'externalId' | 'rating' | 'price'>): boolean {
  if (entity.title && NON_VENUE_TITLE_RE.test(entity.title.trim())) return false;
  return !!entity.externalId || entity.rating != null || !!entity.price;
}

/** Parses every `<card>` in a `<place_card>` final response into an
 *  ExtractedEntity + its position, filtered to venue-like candidates only
 *  (see isVenueLikeEntity) — returns `{ cards: [], excludedTitles: [] }`
 *  for any other response shape (`<card_template>`, `<product_ids>`, plain
 *  text) — those don't carry the structured badge/rating/why signal
 *  PROMOTE/SHORTLIST need, so real trace playback simply won't offer those
 *  mutations rather than inventing them from unstructured text. */
export function extractFinalPlaceCards(outputValue: string | undefined): FinalResponseExtraction {
  if (!outputValue) return { cards: [], excludedTitles: [] };
  const blockMatch = outputValue.match(/<place_card>([\s\S]*?)<\/place_card>/i);
  if (!blockMatch) return { cards: [], excludedTitles: [] };
  const cardBlocks = blockMatch[1].match(/<card[^>]*>[\s\S]*?<\/card>/gi) ?? [];

  const allEntities: ExtractedEntity[] = cardBlocks.map((block) => {
    const title = extractTagAttr(block, 'title');
    const { rating, reviewCount } = parseRatingText(extractTagContent(block, 'rating'));
    return {
      id: nextId('final-card'),
      type: 'place',
      externalId: extractTagAttr(block, 'place_id'),
      title,
      judgment: extractTagContent(block, 'badge'),
      reasoning: extractTagContent(block, 'why'),
      rating,
      reviewCount,
      price: normalizeString(extractTagContent(block, 'price')),
      availability: normalizeString(extractTagContent(block, 'hours')),
      raw: block,
    };
  });

  const excludedTitles = allEntities.filter((e) => !isVenueLikeEntity(e)).map((e) => e.title ?? '(untitled)');
  const cards = allEntities.filter(isVenueLikeEntity).map((entity, order) => ({ order, entity }));
  return { cards, excludedTitles };
}

/** Fallback splitter for a PlaceSearch `places` array that fails whole-object
 *  JSON parsing — brace-depth-scans out individual `{...}` chunks and
 *  regex-extracts just the fields Level 2 needs from each. Not currently
 *  needed by any inspected real trace (only tool.PlaceDetails single-object
 *  payloads have been observed to break strict JSON parsing so far) but kept
 *  as the documented fallback path per the anti-crash requirement — an
 *  array-shaped failure should degrade the same way a single-object one
 *  does, not differently. */
export function extractPlaceSearchEntitiesFallback(raw: string): ExtractedEntity[] {
  const objects = extractCandidateObjects(raw);
  return objects
    .map((obj) => extractFieldsByRegex(obj, ['place_id', 'name', 'formatted_address', 'rating', 'user_rating_count', 'price_display']))
    .filter((f) => f.name)
    .map((f) => ({
      id: nextId('place'),
      type: 'place' as const,
      externalId: f.place_id,
      title: f.name,
      subtitle: normalizeString(f.formatted_address),
      rating: normalizeNumber(f.rating),
      reviewCount: normalizeNumber(f.user_rating_count),
      price: normalizeString(f.price_display),
    }));
}
