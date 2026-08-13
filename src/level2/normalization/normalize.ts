import {
  asString,
  deepFind,
  extractCandidateObjects,
  extractFieldsByRegex,
  normalizeNumber,
  normalizeString,
  safeParseJson,
} from '../../utils/safeJson';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Trace normalization.

   Phoenix payloads are not one shape. A single `tool.output` may be an
   object, a JSON string, a JSON string nested inside another JSON string, an
   array, a wrapper around the real payload, or a truncated fragment of any of
   those (the deployment caps tool.output at 2000 chars, which routinely cuts
   an array mid-object).

   NOTHING in this file throws. A malformed span degrades what Level 2 can
   show; it never takes the demo down.

   The primitives in src/utils/safeJson.ts are re-exported here so callers
   have one import site for normalization rather than reaching into two
   modules — no duplicate implementations.
   ───────────────────────────────────────────────────────────────────────────── */

export {
  asString,
  deepFind,
  extractCandidateObjects,
  extractFieldsByRegex,
  normalizeNumber,
  normalizeString,
  safeParseJson,
};

/** Alias matching the architecture's naming. */
export const safeJsonParse = safeParseJson;

const MAX_DEPTH = 8;

/** Walks a parsed value and parses any STRING that is itself JSON, recursively.
 *  Real harness payloads nest a JSON string inside a field of an already-parsed
 *  object more often than not (tool wrappers re-encode their inner result), and
 *  every downstream extractor would otherwise need its own inner-parse step. */
export function deepParseJsonStrings(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH || value == null) return value;

  if (typeof value === 'string') {
    const parsed = safeParseJson(value);
    return parsed === undefined ? value : deepParseJsonStrings(parsed, depth + 1);
  }

  if (Array.isArray(value)) {
    return value.map((v) => deepParseJsonStrings(v, depth + 1));
  }

  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = deepParseJsonStrings(v, depth + 1);
    }
    return out;
  }

  return value;
}

/** Every node matching `predicate`, not just the first — deepFind's plural
 *  sibling. Used to sweep a payload of unknown shape for every object that
 *  looks like a result (e.g. "has a name and a rating") regardless of which
 *  wrapper key it happens to sit under. */
export function deepCollect<T = unknown>(
  value: unknown,
  predicate: (node: unknown) => boolean,
  depth = 0,
  out: T[] = []
): T[] {
  if (depth > MAX_DEPTH || value == null) return out;
  if (predicate(value)) out.push(value as T);
  if (Array.isArray(value)) {
    for (const item of value) deepCollect(item, predicate, depth + 1, out);
    return out;
  }
  if (typeof value === 'object') {
    for (const v of Object.values(value as Record<string, unknown>)) deepCollect(v, predicate, depth + 1, out);
  }
  return out;
}

const URL_RE = /https?:\/\/[^\s"'<>)\]]+/i;
const IMAGE_EXT_RE = /\.(png|jpe?g|webp|gif|avif)(\?|#|$)/i;
const IMAGE_KEY_RE = /(photo|image|thumb|img|picture|media)/i;

/** First http(s) URL in a string, or undefined. Also unwraps a markdown link
 *  body, which real `<cta>` values use: `[Book Tickets](https://...)`. */
export function extractUrl(value: unknown): string | undefined {
  const s = asString(value);
  if (!s) return undefined;
  const md = s.match(/\]\((https?:\/\/[^)]+)\)/i);
  if (md) return md[1];
  const m = s.match(URL_RE);
  return m ? m[0] : undefined;
}

/** Best-effort image URL from an arbitrary payload node.
 *
 *  Returns undefined far more often than not, and that is the correct
 *  outcome — most real corpus entities have no usable image (see
 *  PHOENIX_SCENARIO_ARCHETYPES.md). Never returns a placeholder or a guessed
 *  URL; the renderer owns the no-image fallback. */
export function extractImage(value: unknown): string | undefined {
  if (value == null) return undefined;

  const direct = asString(value);
  if (direct) {
    const url = extractUrl(direct);
    if (url && IMAGE_EXT_RE.test(url)) return url;
    return undefined;
  }

  if (typeof value !== 'object') return undefined;

  // Prefer an image-named key over a generic URL that merely ends in .jpg.
  const found = deepFind<Record<string, unknown>>(value, (node) => {
    if (node == null || typeof node !== 'object' || Array.isArray(node)) return false;
    return Object.entries(node as Record<string, unknown>).some(([k, v]) => {
      if (!IMAGE_KEY_RE.test(k)) return false;
      const s = asString(v);
      return !!s && !!extractUrl(s);
    });
  });
  if (found) {
    for (const [k, v] of Object.entries(found)) {
      if (!IMAGE_KEY_RE.test(k)) continue;
      const url = extractUrl(asString(v));
      if (url) return url;
    }
  }
  return undefined;
}

/** Numeric rating from a value that may be a number, a '4.6' string, or a
 *  '4.6★ · 120 reviews' display string. Rejects anything outside a plausible
 *  0-5 rating band rather than passing a review COUNT through as a rating —
 *  a real and easy confusion in these payloads. */
export function extractRating(value: unknown): number | undefined {
  const n = normalizeNumber(value);
  if (n == null) return undefined;
  if (n < 0 || n > 5) return undefined;
  return n;
}

/** Review count from '4.6★ · 120 reviews' / '(2.1k+ Reviews)' style text.
 *  Understands the 'k' suffix the harness uses; returns undefined rather than
 *  guessing when no count is present. */
export function extractReviewCount(value: unknown): number | undefined {
  const s = asString(value);
  if (!s) return undefined;
  const m = s.match(/([\d,.]+)\s*(k\+?)?\s*(?:\+)?\s*reviews?/i);
  if (!m) return undefined;
  const base = Number(m[1].replace(/,/g, ''));
  if (!Number.isFinite(base)) return undefined;
  return m[2] ? Math.round(base * 1000) : Math.round(base);
}

/** Reduces a full postal address to 'neighbourhood, city'. Never fabricates a
 *  location that isn't in the source string — just a shorter slice of it. */
export function shortenLocation(address: string | undefined): string | undefined {
  if (!address) return undefined;
  const segments = address
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && !/^india$/i.test(s) && !/\d{5,}/.test(s));
  if (!segments.length) return undefined;
  return segments.slice(-2).join(', ');
}

/** Collapses whitespace and strips the XML-ish tags the harness emits, so a
 *  response envelope can be read as prose when that's all it is. Also strips
 *  the Markdown the harness mixes in freely (`# heading`, `**bold**`,
 *  `[label](url)`) — a TV surface renders text, not Markdown, and a headline
 *  reading "# Complete Guide to…" is a real thing this corpus produces. */
export function stripMarkup(value: unknown): string | undefined {
  const s = asString(value);
  if (!s) return undefined;
  const cleaned = s
    .replace(/<[^>]*>/g, ' ')
    .replace(/^\s*#{1,6}\s*/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '');
  return normalizeString(cleaned);
}

/** First sentence of a paragraph, for use as a headline when the response is
 *  a single block of prose. Returns undefined rather than a truncated
 *  fragment when no sentence boundary is found within a readable length. */
export function firstSentence(text: string | undefined, maxLength = 160): string | undefined {
  if (!text) return undefined;
  const match = text.match(/^(.{20,}?[.!?])(\s|$)/);
  if (match && match[1].length <= maxLength) return match[1].trim();
  return text.length <= maxLength ? text : undefined;
}
