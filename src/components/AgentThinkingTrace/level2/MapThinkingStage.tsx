import { useMemo } from 'react';
import { fitView, scaleBar, tilesForView, TILE_ATTRIBUTION, TILE_SIZE } from './mapTiles';
import type { RoutePayload } from '../../../level2/types/pass';
import type { ThinkingRendererProps } from '../../../level2/types/renderer';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — MapThinkingStage.

   The spatial thinking mode. A CONTAINED, CENTRED canvas the agent temporarily
   opens to show where something is and how the journey looks — never a
   navigation app, never full-screen, never a side panel. The agent and its
   narration stay the primary object above it; the map is the evidence.

   ── A REAL BASEMAP, DRAWN BY HAND ────────────────────────────────────────

   The visual references show a genuine street network under a luminous route.
   That network is REAL GEOGRAPHY — public, verifiable, and not a claim about
   what the agent did — so rendering it is honest in a way the decorative grid
   this file used to draw was not.

   It comes from CARTO's `dark_nolabels` XYZ raster tiles (OpenStreetMap data)
   composited directly as positioned <img> elements. No map SDK: the stage is
   static presentation with no pan, zoom or interaction, so a library would add
   a large dependency to do arithmetic that fits in mapTiles.ts. The label-free
   basemap also keeps the references' sparseness — this stage draws only the
   two labels the trace actually names.

   ── THE CONNECTOR IS OPENLY ABSTRACT ─────────────────────────────────────

   With `geometry: 'endpoints'` the trace knows the two ends and nothing
   between. The connector is drawn as a soft dashed arc: it reads as "these
   two are connected, this far apart", and it deliberately does NOT read as
   "this is the road you will drive". A solid road-shaped polyline here would
   be a fabrication. When a trace one day carries `geometry: 'path'`, the same
   component draws it solid — the visual difference IS the honesty signal.
   ───────────────────────────────────────────────────────────────────────────── */

/* Stage geometry, in the 1920×1080 canvas's own units.
   1180 wide = 61% of the stage. 360 tall is what actually FITS: the thinking
   canvas runs y=512..948, so the reserved readout (46) plus the gap (22) plus
   the map has to stay inside 436px. A 470-tall stage ran off the bottom of the
   canvas and was clipped.
   The resulting letterbox suits the references' cinematic framing. */
const STAGE_W = 1180;
const STAGE_H = 360;
/** Route bounds are inset this far from the stage edge, so neither marker, its
   glow, nor its label ever touches the boundary. */
const PAD_X = 190;
const PAD_Y = 74;

/** Zoom ceiling. Two venues 400 m apart would otherwise frame at building
 *  level, implying the agent knows a precise address it does not — a wider
 *  frame keeps the useful geographic context the brief asks for. */
const MAX_ZOOM = 14;

/** A gentle arc between two points, bowed perpendicular to the line.
 *
 *  The bow is what stops the connector reading as a road: a real road is not a
 *  smooth curve, and a straight line would imply a direct path that also is
 *  not real. A shallow arc reads as "a connection between these two", which is
 *  precisely what the data supports. */
function connectorPath(a: { x: number; y: number }, b: { x: number; y: number }): string {
  const midX = (a.x + b.x) / 2;
  const midY = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy) || 1;
  // Perpendicular offset, capped so a long route does not balloon.
  const bow = Math.min(length * 0.16, 74);
  return `M ${a.x} ${a.y} Q ${midX + (-dy / length) * bow} ${midY + (dx / length) * bow} ${b.x} ${b.y}`;
}

export default function MapThinkingStage({ pass }: ThinkingRendererProps<RoutePayload>) {
  const payload = pass.payload as RoutePayload | undefined;
  const geo = payload?.geo;
  const stage = payload?.stage ?? 'locate';

  const model = useMemo(() => {
    if (!geo) return undefined;
    const points = [geo.origin, geo.destination, ...(geo.path ?? [])];
    const view = fitView(points, STAGE_W, STAGE_H, { x: PAD_X, y: PAD_Y }, { maxZoom: MAX_ZOOM });
    const origin = view.toXY(geo.origin);
    const destination = view.toXY(geo.destination);
    // Same coordinates on both ends = a located place, not a journey.
    const singlePoint = Math.hypot(destination.x - origin.x, destination.y - origin.y) < 1;
    return {
      view,
      origin,
      destination,
      singlePoint,
      tiles: tilesForView(view, STAGE_W, STAGE_H),
      bar: scaleBar(view.metresPerPixel),
      path:
        geo.geometry === 'path' && geo.path?.length
          ? `M ${[geo.origin, ...geo.path, geo.destination].map((p) => { const q = view.toXY(p); return `${q.x} ${q.y}`; }).join(' L ')}`
          : connectorPath(origin, destination),
    };
  }, [geo]);

  /* NO COORDINATES -> NO MAP. The distance and duration are still real, so
     they are stated plainly rather than drawn over a map of nothing. */
  if (!geo || !model) {
    return (
      <div className="att-l2m-textonly">
        <div className="att-l2m-figure">{[payload?.eta, payload?.distance].filter(Boolean).join(' · ')}</div>
        {(payload?.origin || payload?.destination) && (
          <div className="att-l2m-ends">
            {payload?.origin ?? 'Here'} <span aria-hidden>→</span> {payload?.destination ?? 'there'}
          </div>
        )}
      </div>
    );
  }

  const { view, origin, destination, singlePoint, path, tiles, bar } = model;
  const showRoute = !singlePoint && (stage === 'route' || stage === 'summary');

  const figure = [payload?.eta, payload?.distance].filter(Boolean).join(' · ');

  return (
    <div className={`att-l2m att-l2m--${stage}`}>
      {/* Duration and distance sit ABOVE the map and centred on it — part of
          the same centred composition, never a left-hand information panel.
          They only carry weight once the summary beat has been narrated. */}
      {!!figure && (
        <div className={`att-l2m-readout${stage === 'summary' ? ' att-l2m-readout--lead' : ''}`}>{figure}</div>
      )}

      <div className="att-l2m-stage">
        {/* THE BASEMAP. Real OpenStreetMap streets via CARTO's label-free dark
            style, composited as positioned tiles. Static: no pan, no zoom, no
            controls — this is the agent reasoning, not navigation. */}
        <div className="att-l2m-tiles" aria-hidden>
          {tiles.map((t) => (
            <img
              key={t.key}
              className="att-l2m-tile"
              src={t.url}
              alt=""
              width={TILE_SIZE}
              height={TILE_SIZE}
              loading="eager"
              decoding="async"
              style={{ left: `${(t.left / STAGE_W) * 100}%`, top: `${(t.top / STAGE_H) * 100}%`, width: `${(TILE_SIZE / STAGE_W) * 100}%`, height: `${(TILE_SIZE / STAGE_H) * 100}%` }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
            />
          ))}
        </div>

        <svg
          className="att-l2m-svg"
          viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          <defs>
            {/* The route's luminosity comes from a blurred copy of itself
                underneath, not from a filter on everything — cheap, and it
                keeps the markers crisp. */}
            <filter id="l2m-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="7" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id="l2m-vignette" cx="50%" cy="50%" r="72%">
              <stop offset="55%" stopColor="#0b0714" stopOpacity="0" />
              <stop offset="100%" stopColor="#0b0714" stopOpacity="0.92" />
            </radialGradient>
            <linearGradient id="l2m-route" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8f7bd6" />
              <stop offset="55%" stopColor="#cda5ff" />
              <stop offset="100%" stopColor="#8fe3d0" />
            </linearGradient>
          </defs>

          {/* Vignette above the basemap, below the route — the streets fade
              toward the edges so the stage dissolves into the ambient
              background instead of ending at a hard rectangle. */}
          <rect width={STAGE_W} height={STAGE_H} fill="url(#l2m-vignette)" />

          {showRoute && (
            <g className="att-l2m-routegroup" key={`route-${geo.geometry}`}>
              <path className="att-l2m-route-halo" d={path} filter="url(#l2m-glow)" />
              <path
                className={`att-l2m-route att-l2m-route--${geo.geometry}`}
                d={path}
                stroke="url(#l2m-route)"
              />
              {/* ONE pass of light along the journey, then it stops. A looping
                  pulse would read as a loading state rather than as the agent
                  tracing the route once. */}
              <circle className="att-l2m-tracer" r="6">
                <animateMotion dur="1.5s" begin="1.05s" fill="freeze" path={path} />
              </circle>
            </g>
          )}

          {/* ORIGIN — quiet: a small dot with one expanding ring. */}
          {!singlePoint && (
            <g className="att-l2m-marker att-l2m-marker--origin" transform={`translate(${origin.x} ${origin.y})`}>
              <circle className="att-l2m-ring" r="19" />
              <circle className="att-l2m-dot" r="7.5" />
            </g>
          )}

          {/* DESTINATION — the stronger of the two, as the thing being reached. */}
          <g className="att-l2m-marker att-l2m-marker--dest" transform={`translate(${destination.x} ${destination.y})`}>
            <circle className="att-l2m-ring att-l2m-ring--dest" r="28" />
            <circle className="att-l2m-halo" r="17" filter="url(#l2m-glow)" />
            <circle className="att-l2m-dot att-l2m-dot--dest" r="9.5" />
          </g>
        </svg>

        {/* Labels are HTML over the SVG so they use the interface's own type
            rather than SVG text metrics, and stay crisp at any stage scale.
            Two labels total — the references' sparseness is the point. */}
        {!singlePoint && (
          <span
            className="att-l2m-label att-l2m-label--origin"
            style={{ left: `${(origin.x / STAGE_W) * 100}%`, top: `${(origin.y / STAGE_H) * 100}%` }}
          >
            {geo.origin.label}
          </span>
        )}
        <span
          className="att-l2m-label att-l2m-label--dest"
          style={{ left: `${(destination.x / STAGE_W) * 100}%`, top: `${(destination.y / STAGE_H) * 100}%` }}
        >
          {geo.destination.label}
        </span>

        {/* Scale, and the attribution CARTO and OSM require. Both are the only
            chrome on the stage and both sit at the quietest contrast on it. */}
        <div className="att-l2m-scale" aria-hidden>
          <span className="att-l2m-scale-bar" style={{ width: `${(bar.px / STAGE_W) * 100}%` }} />
          <span className="att-l2m-scale-label">{bar.label}</span>
        </div>
        <div className="att-l2m-attrib" aria-hidden>{TILE_ATTRIBUTION}</div>
      </div>
    </div>
  );
}
