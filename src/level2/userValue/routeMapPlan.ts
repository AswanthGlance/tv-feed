import type { ExtractedRoute } from '../../adapters/entityExtraction';
import { phrase, STABLE_RNG, type Rng } from './narrationVariety';
import type { QueryRequirements } from '../types/query';
import type { GeoPoint, RouteGeography, RoutePayload, ThinkingPass } from '../types/pass';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Route / map: the spatial thinking arc.

   Spatial reasoning is a MODE, not a card. When the agent needs to work out
   where something is and how you get there, the user should read it instantly
   as different from searching, discovering, comparing or ranking — and the way
   to say that is to let the agent BUILD the answer over three narrated beats
   instead of dropping a finished map on screen:

     locate    "Checking how far this is from you"   surface + both markers
     route     "Mapping the drive from Kochi"        the connector draws
     summary   "That puts it about 4 hours away"     duration comes forward

   Each beat is a real pass with a real hold, so the narration always explains
   why the map just changed.

   WHAT IS TRUE HERE, AND WHAT IS NOT

   Real `tool.GetRoute` output (confirmed on live traces — see
   entityExtraction.ts's RawRouteOutput) carries origin and destination names,
   a leg's start/end coordinates, distance_meters/text and
   duration_seconds/text. It is ~600 chars, so unlike PlaceSearch it survives
   the 2000-char cap intact.

   It carries NO POLYLINE. The shape of the road is not in the trace. So:

     - the two markers sit at REAL coordinates
     - the distance and duration are the agent's OWN figures, shown verbatim
     - the line between them is drawn as an openly abstract connector, and
       `geometry: 'endpoints'` is what tells the renderer to do that

   Nothing here interpolates a path, snaps to roads, or estimates a midpoint.

   A pass is OMITTED rather than faked when its evidence is missing: no
   coordinates means no map beats at all (the route still reports its distance
   and duration as text), and no duration means no summary beat.
   ───────────────────────────────────────────────────────────────────────────── */

/* Timings. The route beat is the longest because the draw animation is the
   moment the arc exists for, and its hold has to outlast the draw. */
const T = {
  locate: { enterDuration: 900, holdDuration: 1500, exitDuration: 250 },
  route: { enterDuration: 1400, holdDuration: 1600, exitDuration: 250 },
  summary: { enterDuration: 600, holdDuration: 1900, exitDuration: 300 },
} as const;

/** Trims a geocoded string to something a map label can carry.
 *  'Kaziranga National Park, Assam' -> 'Kaziranga National Park'.
 *  Only ever SHORTENS the agent's own words; never rewrites or invents them. */
export function shortPlaceLabel(raw: string | undefined, fallback: string): string {
  const text = (raw ?? '').trim();
  if (!text) return fallback;
  // A trailing administrative region ('…, Assam', '…, Australia') is context
  // the map itself already provides.
  const head = text.split(',')[0].trim();
  const chosen = head.length >= 3 ? head : text;
  return chosen.length > 28 ? `${chosen.slice(0, 27).trimEnd()}…` : chosen;
}

/** Is the origin the user's own position, rather than a named place? The
 *  narration reads very differently for the two ('from you' vs 'from Kochi'),
 *  and guessing wrong is the kind of small lie that breaks trust. */
function isPersonalOrigin(originText: string | undefined): boolean {
  return !originText || /\b(my location|current location|here|near me|you)\b/i.test(originText);
}

/** The agent's sentence for the locate beat, in the query's own terms.
 *
 *  Generic map copy on every scenario is what makes a feature feel canned, so
 *  this reads the actual situation: who the origin is, how far it turned out
 *  to be, and what kind of thing was asked for. Every branch is backed by data
 *  the route already carries. */
function locateNarration(route: ExtractedRoute, requirements: QueryRequirements, rng: Rng): string {
  const origin = shortPlaceLabel(route.originText, '');
  const longHaul = (route.distanceMeters ?? 0) > 80_000;

  if (isPersonalOrigin(route.originText)) {
    return longHaul
      ? phrase(['Working out how far this is', 'Getting a sense of the distance'], rng)
      : phrase(['Checking how far this is from you', 'Seeing how far this is from you'], rng);
  }
  // A trip-planning question is asking about the journey; a venue question is
  // asking whether the place is reachable.
  if (longHaul) return phrase([`Placing this relative to ${origin}`, `Working out where this sits from ${origin}`], rng);
  const noun = requirements.entityType;
  return noun
    ? phrase([`Seeing how easy this ${noun} is to reach`, `Checking how reachable this ${noun} is`], rng)
    : phrase([`Seeing how easy this is to reach from ${origin}`, `Checking how far this is from ${origin}`], rng);
}

function routeNarration(route: ExtractedRoute, rng: Rng): string {
  const origin = shortPlaceLabel(route.originText, '');
  const driving = /drive|driv/i.test(route.travelMode ?? '');

  if (isPersonalOrigin(route.originText)) {
    return phrase(['Mapping the quickest way there', 'Tracing the way there'], rng);
  }
  return driving
    ? phrase([`Mapping the drive from ${origin}`, `Tracing the drive from ${origin}`], rng)
    : phrase([`Mapping the way from ${origin}`, `Tracing the route from ${origin}`], rng);
}

/** The conclusion. Uses the agent's OWN duration string verbatim — '4 hours
 *  8 mins' is not rounded to '4 hours', because the number on screen and the
 *  number in the sentence must be the same number. */
function summaryNarration(route: ExtractedRoute, rng: Rng): string {
  const time = route.travelTime!;
  return isPersonalOrigin(route.originText)
    ? phrase([`That puts it about ${time} away`, `So it is roughly ${time} away`], rng)
    : phrase([`That is about ${time} on the road`, `That works out at about ${time} on the road`], rng);
}

export interface RouteMapPlanInput {
  route: ExtractedRoute;
  requirements: QueryRequirements;
  /** Prefix for pass ids so a route arc embedded in a longer hybrid arc keeps
   *  unique, stable ids. */
  idPrefix: string;
  sourceEventIds?: string[];
  sourceSpanIds?: string[];
  /** Wording variety, opted into once per built scenario. Defaults to the
   *  canonical phrasing — see narrationVariety.ts. */
  rng?: Rng;
}

/** The spatial payload, or undefined when the trace gave no coordinates. */
export function routeGeography(route: ExtractedRoute): RouteGeography | undefined {
  if (!route.from || !route.to) return undefined;

  const origin: GeoPoint = {
    ...route.from,
    label: isPersonalOrigin(route.originText) ? 'You' : shortPlaceLabel(route.originText, 'Start'),
  };
  const destination: GeoPoint = {
    ...route.to,
    label: shortPlaceLabel(route.destinationText, 'Destination'),
  };
  // 'endpoints' is the honest answer for every real trace inspected: GetRoute
  // gives two points and no polyline.
  return { origin, destination, geometry: 'endpoints' };
}

export function buildRouteMapPasses(input: RouteMapPlanInput): ThinkingPass[] {
  const { route, requirements, idPrefix } = input;
  const rng = input.rng ?? STABLE_RNG;
  const geo = routeGeography(route);
  const provenance = {
    sourceEventIds: input.sourceEventIds,
    sourceSpanIds: input.sourceSpanIds,
  };

  const base: Omit<RoutePayload, 'stage'> = {
    origin: route.originText,
    destination: route.destinationText,
    stops: [],
    eta: route.travelTime,
    distance: route.distance,
    ...(geo ? { geo } : {}),
  };

  // NO COORDINATES -> NO MAP. The distance and duration are still true, so the
  // arc keeps one honest text beat rather than drawing a map of two points it
  // does not have.
  if (!geo) {
    if (!route.travelTime && !route.distance) return [];
    return [
      {
        id: `${idPrefix}-route-text`,
        visibility: 'canvas_value',
        narration: route.travelTime ? summaryNarration(route, rng) : 'Checking how far this is',
        valueType: 'route',
        payload: { ...base, stage: 'summary' },
        confidence: 'high',
        ...provenance,
        ...T.summary,
      },
    ];
  }

  const passes: ThinkingPass[] = [
    // ── 1. LOCATE ───────────────────────────────────────────────────────
    // The map surface and both real markers. No connector yet — the agent has
    // established WHERE, not yet HOW FAR.
    {
      id: `${idPrefix}-route-locate`,
      visibility: 'canvas_value',
      narration: locateNarration(route, requirements, rng),
      valueType: 'route',
      payload: { ...base, stage: 'locate' },
      confidence: 'high',
      ...provenance,
      ...T.locate,
    },
    // ── 2. ROUTE ────────────────────────────────────────────────────────
    // The connector draws. This is the beat the arc exists for.
    {
      id: `${idPrefix}-route-draw`,
      visibility: 'canvas_value',
      narration: routeNarration(route, rng),
      valueType: 'route',
      payload: { ...base, stage: 'route' },
      confidence: 'high',
      ...provenance,
      ...T.route,
    },
  ];

  // ── 3. SUMMARY ────────────────────────────────────────────────────────
  // Only with a real duration to conclude with.
  if (route.travelTime) {
    passes.push({
      id: `${idPrefix}-route-summary`,
      visibility: 'canvas_value',
      narration: summaryNarration(route, rng),
      valueType: 'route',
      payload: { ...base, stage: 'summary' },
      confidence: 'high',
      ...provenance,
      ...T.summary,
    });
  }

  return passes;
}

/** A place the agent located WITHOUT calculating a route — the map shows one
 *  pin and a locality, and no connector is drawn because none was computed. */
export function buildLocationOnlyPass(input: {
  point: GeoPoint;
  narration: string;
  idPrefix: string;
  sourceSpanIds?: string[];
}): ThinkingPass {
  return {
    id: `${input.idPrefix}-locate-only`,
    visibility: 'canvas_value',
    narration: input.narration,
    valueType: 'route',
    payload: {
      stops: [],
      // Origin and destination are the SAME point: there is one place and no
      // journey. The renderer reads that and draws a single pin.
      geo: { origin: input.point, destination: input.point, geometry: 'endpoints' },
      stage: 'locate',
    },
    confidence: 'high',
    sourceSpanIds: input.sourceSpanIds,
    ...T.locate,
  };
}
