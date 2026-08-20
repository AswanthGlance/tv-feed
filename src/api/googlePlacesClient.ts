/* Client for Google Places API (New), routed through the Vite dev-server
 * proxy (/api/places -> https://places.googleapis.com, see vite.config.ts)
 * which injects the real API key server-side. The browser never sees the
 * key and never talks to Google directly. */
const API_ROOT = '/api/places/v1';
const DETAILS_FIELD_MASK = 'id,displayName,photos,priceLevel,regularOpeningHours.openNow,websiteUri';

export class GooglePlacesApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'GooglePlacesApiError';
    this.status = status;
  }
}

export interface GooglePlacePhoto {
  name: string; // "places/{place_id}/photos/{photo_id}"
  widthPx?: number;
  heightPx?: number;
}

export interface GooglePlaceDetails {
  id: string;
  displayName?: string;
  photos: GooglePlacePhoto[];
  priceLevel?: string;
  openNow?: boolean;
  websiteUri?: string;
}

interface RawDetailsResponse {
  id: string;
  displayName?: { text?: string };
  photos?: { name: string; widthPx?: number; heightPx?: number }[];
  priceLevel?: string;
  regularOpeningHours?: { openNow?: boolean };
  websiteUri?: string;
}

// In-memory only — good enough to avoid refetching the same place_id
// repeatedly within one browser session; not persisted, not shared with SSR.
const detailsCache = new Map<string, Promise<GooglePlaceDetails | undefined>>();

async function fetchPlaceDetailsUncached(placeId: string): Promise<GooglePlaceDetails> {
  const res = await fetch(`${API_ROOT}/places/${encodeURIComponent(placeId)}`, {
    headers: { 'X-Goog-FieldMask': DETAILS_FIELD_MASK },
  });
  if (!res.ok) {
    let body = '';
    try { body = await res.text(); } catch { /* ignore */ }
    throw new GooglePlacesApiError(`Places Details ${res.status}${body ? `: ${body.slice(0, 200)}` : ''}`, res.status);
  }
  const raw = (await res.json()) as RawDetailsResponse;
  return {
    id: raw.id,
    displayName: raw.displayName?.text,
    photos: raw.photos ?? [],
    priceLevel: raw.priceLevel,
    openNow: raw.regularOpeningHours?.openNow,
    websiteUri: raw.websiteUri,
  };
}

/** Never throws — resolves `undefined` on any failure (missing key, rate
 *  limit, invalid place_id, network error) so callers can fall straight
 *  through to their existing fallback without special-casing errors. */
export function fetchPlaceDetails(placeId: string): Promise<GooglePlaceDetails | undefined> {
  let entry = detailsCache.get(placeId);
  if (!entry) {
    entry = fetchPlaceDetailsUncached(placeId).catch(() => undefined);
    detailsCache.set(placeId, entry);
  }
  return entry;
}

/** Proxied Place Photo (New) media URL — the browser can use this directly
 *  as an <img src>; Google 302-redirects it to the actual (public, unsigned
 *  beyond that point) image URL, which the <img> tag follows natively. */
export function placePhotoUrl(photoName: string, maxWidthPx = 480): string {
  return `${API_ROOT}/${photoName}/media?maxWidthPx=${maxWidthPx}`;
}

export function priceLevelLabel(priceLevel: string | undefined): string | undefined {
  switch (priceLevel) {
    case 'PRICE_LEVEL_FREE': return 'Free';
    case 'PRICE_LEVEL_INEXPENSIVE': return '$';
    case 'PRICE_LEVEL_MODERATE': return '$$';
    case 'PRICE_LEVEL_EXPENSIVE': return '$$$';
    case 'PRICE_LEVEL_VERY_EXPENSIVE': return '$$$$';
    default: return undefined;
  }
}

const SEARCH_FIELD_MASK = 'places.id,places.displayName,places.photos,places.formattedAddress';

interface RawSearchResponse {
  places?: RawDetailsResponse[];
}

/** Text Search (New) — POST places:searchText, routed through the same
 *  /api/places proxy (key injected server-side, never sent by the client).
 *  Added for the Progressive L1 prototype: fetchPlaceDetails (above) needs a
 *  place_id already in hand, which a real Level 2 trace has (place_id
 *  carried on the `<visual>` tag — LEVEL2_INSTRUMENTATION_GAPS.md §3) but an
 *  L0 feed card does not. This is the real, live lookup the Instant/Retrieval
 *  lane uses to go from a card's own `locationLabel` text to a real place
 *  (and, if one exists, a real photo) — never invented, never guessed.
 *  Resolves `undefined` on any failure so callers fall straight through to
 *  the existing generic fallback (src/adapters/localImageFallback.ts). */
export async function searchPlaceText(query: string): Promise<GooglePlaceDetails | undefined> {
  try {
    const res = await fetch(`${API_ROOT}/places:searchText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-FieldMask': SEARCH_FIELD_MASK },
      body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
    });
    if (!res.ok) return undefined;
    const raw = (await res.json()) as RawSearchResponse;
    const first = raw.places?.[0];
    if (!first) return undefined;
    return {
      id: first.id,
      displayName: first.displayName?.text,
      photos: first.photos ?? [],
      priceLevel: first.priceLevel,
      openNow: first.regularOpeningHours?.openNow,
      websiteUri: first.websiteUri,
    };
  } catch {
    return undefined;
  }
}

/** Lightweight on-demand connectivity check for the dev panel — a
 *  deliberately invalid place_id still tells us whether the key/proxy is
 *  configured (401/403 = not configured; 404 for the bogus id = configured
 *  and reachable). */
export async function checkGooglePlacesConfigured(): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_ROOT}/places/__status_check__`, {
      headers: { 'X-Goog-FieldMask': 'id' },
    });
    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: 'Not configured (no/invalid GOOGLE_PLACES_API_KEY)' };
    }
    // 404 for a bogus place id means the request reached Google and was
    // authenticated — that's success for a status check.
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
