/* Client for the Pexels Photo Search API, routed through the Vite dev-server
 * proxy (/api/pexels -> https://api.pexels.com, see vite.config.ts) which
 * injects the real API key server-side. The browser never sees the key.
 *
 * This is a RELEVANT-STOCK-PHOTO fallback, not a real-entity-photo source —
 * used only when neither Google Places (the real place's actual photo) nor
 * the harness's own photo_url resolve. Never presented as "this is a photo
 * of the real place." See Level2CandidateCard's EnrichedCardImage for the
 * full fallback chain and ordering. */
const API_ROOT = '/api/pexels/v1';

export class PexelsApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'PexelsApiError';
    this.status = status;
  }
}

interface RawPexelsPhoto {
  src: { medium: string; large: string; small: string };
}

interface RawPexelsSearchResponse {
  photos: RawPexelsPhoto[];
}

// In-memory only, per browser session — same spirit as googlePlacesClient's
// detailsCache: avoid refetching the same query repeatedly.
const photoCache = new Map<string, Promise<string | undefined>>();

async function searchPhotoUncached(query: string): Promise<string | undefined> {
  const res = await fetch(`${API_ROOT}/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`);
  if (!res.ok) {
    throw new PexelsApiError(`Pexels search ${res.status}`, res.status);
  }
  const data = (await res.json()) as RawPexelsSearchResponse;
  return data.photos?.[0]?.src?.medium;
}

/** Never throws — resolves `undefined` on any failure (missing key, rate
 *  limit, no results, network error) so callers fall straight through to
 *  their next fallback tier without special-casing errors. */
export function searchStockPhoto(query: string): Promise<string | undefined> {
  let entry = photoCache.get(query);
  if (!entry) {
    entry = searchPhotoUncached(query).catch(() => undefined);
    photoCache.set(query, entry);
  }
  return entry;
}

/** Lightweight on-demand connectivity check for the dev panel, matching
 *  checkGooglePlacesConfigured's shape/spirit. An empty-string query still
 *  tells us whether the key/proxy itself is reachable and authenticated. */
export async function checkPexelsConfigured(): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_ROOT}/search?query=test&per_page=1`);
    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: 'Not configured (no/invalid PEXELS_API_KEY)' };
    }
    return { ok: res.ok, error: res.ok ? undefined : `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
