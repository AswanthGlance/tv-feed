import { describe, it, expect } from 'vitest';
import { buildRouteMapPasses, buildLocationOnlyPass, routeGeography, shortPlaceLabel } from './routeMapPlan';
import { extractQueryRequirements } from '../classification/queryRequirements';
import type { ExtractedRoute } from '../../adapters/entityExtraction';
import type { RoutePayload, ThinkingPass } from '../types/pass';

/* The spatial arc's product guarantees, as assertions.

   The values below are REAL — copied from live aitv-mewtwo-harness spans
   (trace 3acd968b…, Kochi -> Munnar) so the tests fail if the shape of the
   thing we actually parse ever drifts. */

const reqs = extractQueryRequirements('Create a complete weekend trip plan for Munnar with travel times from Kochi.');

const KOCHI_TO_MUNNAR: ExtractedRoute = {
  originText: 'Kochi',
  destinationText: 'Munnar',
  travelMode: 'DRIVE',
  travelTime: '4 hours 8 mins',
  distance: '126 km',
  durationSeconds: 14892,
  distanceMeters: 126293,
  from: { lat: 9.9312901, lng: 76.2673242 },
  to: { lat: 10.0889097, lng: 77.0596123 },
};

const build = (over: Partial<ExtractedRoute> = {}) =>
  buildRouteMapPasses({ route: { ...KOCHI_TO_MUNNAR, ...over }, requirements: reqs, idPrefix: 'p1' });

const payloadOf = (pass: ThinkingPass) => pass.payload as RoutePayload;

describe('route map — the agent builds the spatial answer over narrated beats', () => {
  it('runs locate -> route -> summary, never one finished map', () => {
    expect(build().map((p) => payloadOf(p).stage)).toEqual(['locate', 'route', 'summary']);
  });

  it('narrates why the map changed at every beat', () => {
    for (const pass of build()) {
      expect(pass.narration.length).toBeGreaterThan(0);
      expect(pass.visibility).toBe('canvas_value');
    }
  });

  it('holds each beat long enough to read', () => {
    for (const pass of build()) {
      const total = pass.enterDuration + pass.holdDuration + pass.exitDuration;
      expect(total).toBeGreaterThanOrEqual(1500);
      expect(total).toBeLessThanOrEqual(4000);
    }
  });

  it('gives the draw beat enough enter time to finish drawing before the hold', () => {
    // The connector animation runs 250ms delay + 1250ms draw = 1500ms.
    const draw = build().find((p) => payloadOf(p).stage === 'route')!;
    expect(draw.enterDuration).toBeGreaterThanOrEqual(1400);
  });
});

describe('route map — contextual narration, not generic map copy', () => {
  it('names the real origin when the journey starts from a place', () => {
    const passes = build();
    expect(passes[1].narration).toBe('Mapping the drive from Kochi');
    expect(passes[2].narration).toBe('That is about 4 hours 8 mins on the road');
  });

  it('speaks personally when the origin is the user', () => {
    const passes = build({ originText: 'my location', distanceMeters: 8600, travelTime: '24 mins' });
    expect(passes[0].narration).toBe('Checking how far this is from you');
    expect(passes[1].narration).toBe('Mapping the quickest way there');
    expect(passes[2].narration).toBe('That puts it about 24 mins away');
  });

  it('distinguishes a long haul from a nearby venue', () => {
    expect(build().find((p) => payloadOf(p).stage === 'locate')!.narration).toContain('Kochi');
    const near = buildRouteMapPasses({
      route: { ...KOCHI_TO_MUNNAR, distanceMeters: 9000 },
      requirements: extractQueryRequirements('Find a restaurant near me'),
      idPrefix: 'p2',
    });
    expect(near[0].narration).toMatch(/reach/i);
  });

  it('quotes the agent\'s own duration string verbatim, never rounded', () => {
    const summary = build().find((p) => payloadOf(p).stage === 'summary')!;
    // The sentence and the on-screen figure must be the same number.
    expect(summary.narration).toContain('4 hours 8 mins');
    expect(payloadOf(summary).eta).toBe('4 hours 8 mins');
  });
});

describe('route map — never draws more than the trace knows', () => {
  it('reports geometry as endpoints, because GetRoute carries no polyline', () => {
    const geo = payloadOf(build()[0]).geo!;
    expect(geo.geometry).toBe('endpoints');
    expect(geo.path).toBeUndefined();
  });

  it('plots the real coordinates, unmodified', () => {
    const geo = payloadOf(build()[0]).geo!;
    expect(geo.origin.lat).toBe(9.9312901);
    expect(geo.origin.lng).toBe(76.2673242);
    expect(geo.destination.lat).toBe(10.0889097);
    expect(geo.destination.lng).toBe(77.0596123);
  });

  it('drops the map entirely when the trace carried no coordinates', () => {
    const passes = build({ from: undefined, to: undefined });
    expect(passes).toHaveLength(1);
    expect(payloadOf(passes[0]).geo).toBeUndefined();
    // The distance and duration are still true, so they are still stated.
    expect(payloadOf(passes[0]).eta).toBe('4 hours 8 mins');
  });

  it('refuses a half-plotted map when only one end has coordinates', () => {
    expect(routeGeography({ ...KOCHI_TO_MUNNAR, to: undefined })).toBeUndefined();
    expect(routeGeography({ ...KOCHI_TO_MUNNAR, from: undefined })).toBeUndefined();
  });

  it('omits the summary beat when there is no duration to conclude with', () => {
    const passes = build({ travelTime: undefined });
    expect(passes.map((p) => payloadOf(p).stage)).toEqual(['locate', 'route']);
  });

  it('produces nothing at all when there is neither geography nor figures', () => {
    expect(build({ from: undefined, to: undefined, travelTime: undefined, distance: undefined })).toHaveLength(0);
  });
});

describe('route map — labels are shortened, never rewritten', () => {
  it('trims a trailing administrative region', () => {
    expect(shortPlaceLabel('Kaziranga National Park, Assam', 'x')).toBe('Kaziranga National Park');
    expect(shortPlaceLabel('Twelve Apostles, Great Ocean Road', 'x')).toBe('Twelve Apostles');
  });

  it('keeps a plain name as-is and falls back rather than inventing one', () => {
    expect(shortPlaceLabel('Munnar', 'x')).toBe('Munnar');
    expect(shortPlaceLabel(undefined, 'Destination')).toBe('Destination');
  });

  it('labels a personal origin "You" and a named one by its name', () => {
    expect(routeGeography({ ...KOCHI_TO_MUNNAR, originText: 'my location' })!.origin.label).toBe('You');
    expect(routeGeography(KOCHI_TO_MUNNAR)!.origin.label).toBe('Kochi');
  });
});

describe('route map — location only', () => {
  it('carries one point and no journey, so no connector can be drawn', () => {
    const pass = buildLocationOnlyPass({
      point: { lat: 12.9784, lng: 77.6408, label: 'Indiranagar' },
      narration: 'Found it in Indiranagar',
      idPrefix: 'p3',
    });
    const geo = payloadOf(pass).geo!;
    expect(payloadOf(pass).stage).toBe('locate');
    // Identical endpoints is how the renderer recognises "one place, no route".
    expect(geo.origin).toEqual(geo.destination);
    expect(payloadOf(pass).eta).toBeUndefined();
    expect(payloadOf(pass).distance).toBeUndefined();
  });
});
