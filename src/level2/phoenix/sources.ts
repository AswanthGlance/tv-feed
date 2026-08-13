import type { SemanticAgentEvent } from '../../types/semanticEvent';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Source evidence extraction.

   "Reading up on this from a few angles" is a claim. This module produces the
   evidence for it, from REAL trace data only.

   Two real source families exist in the corpus, confirmed by inspection:

     web       tool.WebSearch / tool.WebFetch output is plain text —
               "Search results for '<query>': 1. <title> <url> ### <snippet>"
               — so both the result titles and their domains are recoverable.
               Observed: tripadvisor.in, zomato.com, swiggy.com, viator.com,
               eazydiner.com, district.in, plus venues' own sites.

     maps      tool.PlaceSearch / NearbyPlaces / PlaceDetails / PlaceReviews
               are Google Places calls. They carry no per-result URL, but the
               PROVIDER is known and real, so "Google Maps" is honest.

   NOTHING here is invented. A trace with no web search yields maps-only
   evidence; a trace with neither yields nothing at all and the caller must
   not claim the agent read anything.

   No raw URLs ever leave this module — see `readableSourceLabel`.
   ───────────────────────────────────────────────────────────────────────────── */

export interface SourceRefLite {
  /** Readable identity — 'TripAdvisor', 'Zomato', 'Venue site'. Never a URL. */
  label: string;
  /** Registrable domain, for dedupe and diagnostics. Never rendered raw. */
  domain?: string;
  kind: 'web' | 'maps';
}

export interface SourceEvidence {
  sources: SourceRefLite[];
  /** Distinct sources actually observed. */
  sourceCount: number;
  /** How many separate searches produced them. */
  searchCount: number;
}

/** Brands worth naming. Everything else is prettified from its domain or
 *  recognised as a venue's own site — no guessing at identity. */
const KNOWN_BRANDS: Record<string, string> = {
  'tripadvisor.com': 'TripAdvisor',
  'tripadvisor.in': 'TripAdvisor',
  'zomato.com': 'Zomato',
  'swiggy.com': 'Swiggy',
  'eazydiner.com': 'EazyDiner',
  'dineout.co.in': 'Dineout',
  'viator.com': 'Viator',
  'district.in': 'District',
  'bookmyshow.com': 'BookMyShow',
  'insider.in': 'Insider',
  'magicpin.in': 'magicpin',
  'thrillophilia.com': 'Thrillophilia',
  'makemytrip.com': 'MakeMyTrip',
  'goibibo.com': 'Goibibo',
  'booking.com': 'Booking.com',
  'agoda.com': 'Agoda',
  'airbnb.com': 'Airbnb',
  'yelp.com': 'Yelp',
  'timeout.com': 'Time Out',
  'lonelyplanet.com': 'Lonely Planet',
  'cntraveller.in': 'Condé Nast Traveller',
  'google.com': 'Google Maps',
  'maps.google.com': 'Google Maps',
  'reddit.com': 'Reddit',
  'youtube.com': 'YouTube',
  'instagram.com': 'Instagram',
  'wikipedia.org': 'Wikipedia',
};

/** Multi-part public suffixes that need three labels to reach the registrable
 *  domain (co.in, co.uk, com.au, ...). */
const MULTI_PART_TLDS = new Set(['co.in', 'co.uk', 'com.au', 'co.nz', 'org.in', 'net.in', 'gov.in', 'ac.in', 'com.sg']);

/** The registrable domain — 'localoria.com' from
 *  'venus-rooftop-restro-cafe--best-rooftop-cafe-in-ahmedabad.localoria.com'.
 *  Real corpus subdomains are that long, and rendering one would be unreadable
 *  as well as ugly. */
export function registrableDomain(hostname: string): string {
  const host = hostname.replace(/^www\./i, '').toLowerCase();
  const parts = host.split('.');
  if (parts.length <= 2) return host;
  const lastTwo = parts.slice(-2).join('.');
  return MULTI_PART_TLDS.has(lastTwo) ? parts.slice(-3).join('.') : lastTwo;
}

function titleCaseDomainLabel(domain: string): string {
  const name = domain.split('.')[0].replace(/[-_]+/g, ' ').trim();
  if (!name) return 'Source';
  // A long run-together venue domain reads worse title-cased than it does as
  // a generic label; the caller's venue check usually catches those first.
  return name
    .split(' ')
    .map((w) => (w.length <= 3 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(' ');
}

function normalizeTitle(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Readable identity for one domain.
 *
 *  `entityTitles` are the candidate names already known from the trace. A
 *  domain that matches one of them is the VENUE'S OWN site — labelling that
 *  'Tentrooftoprestrocafe' would be noise, so it becomes 'Venue site', which
 *  is both readable and true. */
export function readableSourceLabel(domain: string, entityTitles: string[] = []): string {
  const known = KNOWN_BRANDS[domain];
  if (known) return known;

  const domainKey = normalizeTitle(domain.split('.')[0]);
  if (domainKey.length >= 6) {
    for (const title of entityTitles) {
      const titleKey = normalizeTitle(title);
      if (!titleKey || titleKey.length < 6) continue;
      if (domainKey.includes(titleKey) || titleKey.includes(domainKey)) return 'Venue site';
    }
  }

  return titleCaseDomainLabel(domain);
}

const MAPS_TOOL_RE = /(placesearch|placedetails|placereviews|nearbyplaces)/i;

/** Builds source evidence from an already-extracted semantic event stream.
 *
 *  `entityTitles` lets venue-owned domains resolve to 'Venue site'. Order is
 *  preserved (first observed first) so the strip reads in the order the agent
 *  actually consulted them. */
export function extractSourceEvidence(
  events: SemanticAgentEvent[],
  entityTitles: string[] = []
): SourceEvidence {
  const byDomain = new Map<string, SourceRefLite>();
  let searchCount = 0;
  let mapsCalls = 0;

  for (const event of events) {
    const meta = (event.metadata ?? {}) as Record<string, unknown>;
    const tool = typeof meta.tool === 'string' ? meta.tool : '';

    if (MAPS_TOOL_RE.test(tool)) {
      mapsCalls += 1;
      continue;
    }

    if (event.type !== 'retrieve') continue;
    searchCount += 1;

    const refs = Array.isArray(meta.sources) ? (meta.sources as Array<{ label?: string; url?: string }>) : [];
    for (const ref of refs) {
      if (!ref?.url) continue;
      let domain: string;
      try {
        domain = registrableDomain(new URL(ref.url).hostname);
      } catch {
        continue; // unparseable URL — skip rather than render something broken
      }
      if (byDomain.has(domain)) continue;
      byDomain.set(domain, { label: readableSourceLabel(domain, entityTitles), domain, kind: 'web' });
    }
  }

  const sources = [...byDomain.values()];

  // Google Places is a real, named provider — including it is honest, and for
  // maps-only traces it is the only source identity that exists. Placed first:
  // it is where the candidates themselves came from.
  if (mapsCalls > 0) {
    sources.unshift({ label: 'Google Maps', kind: 'maps' });
    searchCount += 1;
  }

  return { sources, sourceCount: sources.length, searchCount };
}
