/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Slippy-map tile maths for the spatial thinking stage.

   Standard Web Mercator / XYZ tile geometry, small enough to keep in the repo
   rather than pulling in a map SDK for it. The stage needs exactly three
   things: put a coordinate at a pixel, choose a zoom that frames the subject,
   and list the tiles that cover the visible box.

   WHY REAL TILES AT ALL: the visual references show a genuine street network
   under a luminous route. There is no street data in a Phoenix trace and there
   never will be — but streets are not a claim ABOUT the agent's work, they are
   public geography. Rendering the real ones is therefore honest in a way a
   decorative fake grid would not be, and it is what makes the two real
   coordinates legible as places rather than dots.

   The basemap is CARTO's `dark_nolabels` (OpenStreetMap data). Labels are
   omitted deliberately: the reference language is sparse, and this stage draws
   only the two labels the trace actually names.
   ───────────────────────────────────────────────────────────────────────────── */

export const TILE_SIZE = 256;

/** CARTO basemaps, OSM data. Attribution is required by both and is rendered
 *  on the stage — see MapThinkingStage. Subdomains a/b/c are round-robined so
 *  a full grid loads in parallel. */
const TILE_HOSTS = ['a', 'b', 'c'];
export const TILE_ATTRIBUTION = '© OpenStreetMap · © CARTO';

export function tileUrl(x: number, y: number, z: number): string {
  const host = TILE_HOSTS[Math.abs(x + y) % TILE_HOSTS.length];
  // @2x keeps the street network crisp on a 1920 stage.
  return `https://${host}.basemaps.cartocdn.com/dark_nolabels/${z}/${x}/${y}@2x.png`;
}

export interface LatLng {
  lat: number;
  lng: number;
}

/** World pixel coordinate at a given zoom. The whole world is
 *  256·2^z pixels square. */
export function project(p: LatLng, zoom: number): { x: number; y: number } {
  const scale = TILE_SIZE * 2 ** zoom;
  const lat = Math.max(-85.05112878, Math.min(85.05112878, p.lat));
  const sin = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((p.lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

export interface MapView {
  zoom: number;
  /** World-pixel offset of the stage's top-left corner. Subtracting this from
   *  a projected point gives its position inside the stage. */
  originX: number;
  originY: number;
  toXY: (p: LatLng) => { x: number; y: number };
  /** Metres per screen pixel at the view's centre — drives the scale bar. */
  metresPerPixel: number;
}

/** Chooses the zoom that frames `points` inside `width`×`height` with `pad`
 *  `pad.x`/`pad.y` px of margin, then centres them.
 *
 *  ZOOM IS CLAMPED AT BOTH ENDS and both ends matter:
 *
 *    max 15 — two venues 400 m apart would otherwise zoom to building level,
 *      implying the agent knows a precise street address it does not. A wider
 *      frame keeps the useful geographic context the brief asks for.
 *
 *    min 3  — a very long route stays legible as a journey rather than
 *      dissolving into a continent.
 *
 *  Integer zoom only: fractional zoom would resample the tile raster and lose
 *  the crisp hairline street network the reference language depends on. */
export function fitView(
  points: LatLng[],
  width: number,
  height: number,
  pad: { x: number; y: number },
  opts: { minZoom?: number; maxZoom?: number } = {}
): MapView {
  const minZoom = opts.minZoom ?? 3;
  const maxZoom = opts.maxZoom ?? 15;
  // Separate axes matter on a letterboxed stage: collapsing them to one value
  // meant the wide horizontal inset was also applied vertically, leaving a
  // ~32px usable height and forcing the fit several zoom levels too far out.
  const innerW = Math.max(width - pad.x * 2, 32);
  const innerH = Math.max(height - pad.y * 2, 32);

  let zoom = minZoom;
  for (let z = maxZoom; z >= minZoom; z--) {
    const projected = points.map((p) => project(p, z));
    const spanX = Math.max(...projected.map((q) => q.x)) - Math.min(...projected.map((q) => q.x));
    const spanY = Math.max(...projected.map((q) => q.y)) - Math.min(...projected.map((q) => q.y));
    if (spanX <= innerW && spanY <= innerH) {
      zoom = z;
      break;
    }
  }

  const projected = points.map((p) => project(p, zoom));
  const centreX = (Math.max(...projected.map((q) => q.x)) + Math.min(...projected.map((q) => q.x))) / 2;
  const centreY = (Math.max(...projected.map((q) => q.y)) + Math.min(...projected.map((q) => q.y))) / 2;
  const originX = centreX - width / 2;
  const originY = centreY - height / 2;

  const centreLat =
    points.reduce((sum, p) => sum + p.lat, 0) / Math.max(points.length, 1);
  const metresPerPixel =
    (156543.03392 * Math.cos((centreLat * Math.PI) / 180)) / 2 ** zoom;

  return {
    zoom,
    originX,
    originY,
    metresPerPixel,
    toXY: (p: LatLng) => {
      const q = project(p, zoom);
      return { x: q.x - originX, y: q.y - originY };
    },
  };
}

export interface TileRef {
  key: string;
  url: string;
  left: number;
  top: number;
}

/** Every tile needed to cover the stage, with its pixel position. Tiles
 *  outside the valid y range at this zoom are skipped rather than requested —
 *  they would 404 and flash. */
export function tilesForView(view: MapView, width: number, height: number): TileRef[] {
  const max = 2 ** view.zoom;
  const first = { x: Math.floor(view.originX / TILE_SIZE), y: Math.floor(view.originY / TILE_SIZE) };
  const last = {
    x: Math.floor((view.originX + width) / TILE_SIZE),
    y: Math.floor((view.originY + height) / TILE_SIZE),
  };

  const out: TileRef[] = [];
  for (let x = first.x; x <= last.x; x++) {
    for (let y = first.y; y <= last.y; y++) {
      if (y < 0 || y >= max) continue;
      // Longitude wraps; latitude does not.
      const wrapped = ((x % max) + max) % max;
      out.push({
        key: `${view.zoom}/${x}/${y}`,
        url: tileUrl(wrapped, y, view.zoom),
        left: x * TILE_SIZE - view.originX,
        top: y * TILE_SIZE - view.originY,
      });
    }
  }
  return out;
}

/** A round distance for the scale bar, and how many pixels it spans. Gives the
 *  viewer the scale the graticule used to carry, without any chrome. */
export function scaleBar(metresPerPixel: number, maxPx = 150): { label: string; px: number } {
  const NICE = [10, 25, 50, 100, 250, 500, 1000, 2000, 5000, 10_000, 25_000, 50_000, 100_000, 200_000];
  const maxMetres = metresPerPixel * maxPx;
  const chosen = [...NICE].reverse().find((m) => m <= maxMetres) ?? NICE[0];
  return {
    label: chosen >= 1000 ? `${chosen / 1000} km` : `${chosen} m`,
    px: Math.round(chosen / metresPerPixel),
  };
}
