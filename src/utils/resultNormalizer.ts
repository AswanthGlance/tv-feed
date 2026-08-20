import type { NormalizedEvidence } from '../types/evidence';
import { asString, safeParseJson } from './safeJson';

/* ─────────────────────────────────────────────────────────────────────────────
   Defensive parsing/extraction for tool-result payloads whose exact shape
   isn't confirmed (unlike PlaceSearch/GetRoute, documented in
   evidenceExtractor.ts). Handles: already-parsed objects, JSON-encoded
   strings, doubly-encoded strings (a JSON string containing another JSON
   string), bare arrays, `{results:[...]}`-style wrappers under several
   possible key names, and plain prose. Never throws, never lets a raw/
   unparsed JSON string reach a card component.
   ───────────────────────────────────────────────────────────────────────────── */

/** Repeatedly JSON-parses a value while it keeps turning into another
 *  string that itself looks like JSON — handles harness output that
 *  double-encodes (a string field whose value is itself `"{...}"`). */
export function deepSafeParse(value: unknown, depth = 0): unknown {
  if (depth > 3 || value == null) return value;
  if (typeof value !== 'string') return value;
  const parsed = safeParseJson<unknown>(value);
  if (parsed === undefined) return value;
  return deepSafeParse(parsed, depth + 1);
}

const RESULT_LIST_KEYS = ['results', 'items', 'data', 'places', 'candidates', 'entries', 'documents', 'reviews'];

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Pulls an array of result-like records out of an arbitrarily-shaped
 *  parsed payload: a bare array, a `{results: [...]}` wrapper (or items/
 *  data/places/..., checked in order), or — if nothing list-shaped exists —
 *  a single object treated as one result. Bare string array entries become
 *  `{ description: <string> }` rather than being dropped. */
export function deepExtractResults(parsed: unknown): Record<string, unknown>[] {
  const normalizeArray = (arr: unknown[]): Record<string, unknown>[] =>
    arr
      .map((v) => {
        if (isPlainObject(v)) return v;
        if (typeof v === 'string' && v.trim()) return { description: v };
        return null;
      })
      .filter((v): v is Record<string, unknown> => v !== null);

  if (Array.isArray(parsed)) return normalizeArray(parsed);
  if (!isPlainObject(parsed)) return [];

  for (const key of RESULT_LIST_KEYS) {
    const val = parsed[key];
    if (Array.isArray(val)) return normalizeArray(val);
  }

  // No list found — if this object itself looks like a single result
  // (has identifying fields), treat it as one rather than an empty set.
  if (parsed.title || parsed.name || parsed.url || parsed.link) return [parsed];
  return [];
}

function firstString(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const v = asString(obj[key]);
    if (v && v.trim()) return v.trim();
  }
  return undefined;
}

const IMAGE_KEYS = ['image', 'image_url', 'thumbnail_url', 'photo_url', 'og_image', 'cdn_url'];

/** Checks several plausible field names/shapes rather than assuming a
 *  single key — real search-result payloads vary (image vs image_url vs
 *  thumbnail vs images[] vs a nested thumbnail object). */
export function extractImageUrl(obj: Record<string, unknown>): string | undefined {
  const direct = firstString(obj, IMAGE_KEYS);
  if (direct) return direct;

  const media = obj.media;
  if (typeof media === 'string' && media.trim()) return media;
  if (isPlainObject(media)) {
    const nested = firstString(media, [...IMAGE_KEYS, 'src', 'url']);
    if (nested) return nested;
  }

  const images = obj.images;
  if (Array.isArray(images) && images.length) {
    const first = images[0];
    if (typeof first === 'string' && first.trim()) return first;
    if (isPlainObject(first)) {
      const nested = firstString(first, [...IMAGE_KEYS, 'src', 'url']);
      if (nested) return nested;
    }
  }

  const thumbnail = obj.thumbnail;
  if (isPlainObject(thumbnail)) {
    const nested = firstString(thumbnail, ['src', 'url', ...IMAGE_KEYS]);
    if (nested) return nested;
  }

  return undefined;
}

export function extractTitle(obj: Record<string, unknown>): string | undefined {
  return firstString(obj, ['title', 'name', 'headline', 'author_name', 'reviewer']);
}

function hostnameOf(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

export function extractUrl(obj: Record<string, unknown>): string | undefined {
  return firstString(obj, ['url', 'link', 'href', 'website', 'google_maps_uri']);
}

export function extractSource(obj: Record<string, unknown>): string | undefined {
  const direct = firstString(obj, ['source', 'site_name', 'domain', 'publisher', 'author']);
  if (direct) return direct;
  return hostnameOf(extractUrl(obj));
}

/** A string that (after best-effort parsing) still looks like serialized
 *  JSON rather than prose — the exact shape of the reported bug (raw
 *  `{"type":"web_search_results",...}` rendered verbatim). Used as a guard
 *  so a malformed/truncated JSON string is dropped rather than shown. */
export function looksLikeSerializedJson(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if ((trimmed[0] === '{' || trimmed[0] === '[') && safeParseJson(trimmed) !== undefined) return true;
  return /"type"\s*:\s*"[a-z_]+"/i.test(trimmed) && /[{}[\]]/.test(trimmed);
}

export function extractDescription(obj: Record<string, unknown>, maxLen = 200): string | undefined {
  const raw = firstString(obj, ['description', 'snippet', 'summary', 'content', 'text', 'excerpt', 'comment']);
  if (!raw || looksLikeSerializedJson(raw)) return undefined;
  const clean = raw.replace(/\s+/g, ' ').trim();
  return clean.length > maxLen ? `${clean.slice(0, maxLen - 1)}…` : clean;
}

let seq = 0;
function nextEvidenceId(prefix: string): string {
  seq += 1;
  return `${prefix}-${seq}`;
}

export interface NormalizeDiagnostics {
  resultCount: number;
  imagesFound: number;
  imagesMissing: number;
  usedFallbackSummary: boolean;
}

export interface NormalizeWebSearchResult {
  evidence: NormalizedEvidence[];
  diagnostics: NormalizeDiagnostics;
}

/** tool.WebSearch / tool.WebFetch -> NormalizedEvidence[]. This is the fix
 *  for the reported bug: raw tool.output used to be sliced-and-dumped as a
 *  description string (see evidenceExtractor.ts history). Now: safe-parse
 *  (handling double-encoding) -> find a result list under any plausible
 *  key -> extract title/image/source/description per item. If nothing
 *  structured exists, falls back to a single honest 'summary' entry built
 *  from plain prose — never from an unparsed JSON string. */
export function normalizeWebSearchOutput(
  rawOutput: unknown,
  rawInput: { query?: string; url?: string; prompt?: string } | undefined
): NormalizeWebSearchResult {
  const parsed = deepSafeParse(rawOutput);
  const records = deepExtractResults(parsed);

  if (records.length > 0) {
    const evidence: NormalizedEvidence[] = records.map((r) => ({
      id: nextEvidenceId('web'),
      type: 'web_result',
      title: extractTitle(r) || rawInput?.query || 'Search result',
      subtitle: extractSource(r),
      description: extractDescription(r),
      image: extractImageUrl(r),
      source: extractSource(r),
      url: extractUrl(r),
      raw: r,
    }));
    return {
      evidence,
      diagnostics: {
        resultCount: evidence.length,
        imagesFound: evidence.filter((e) => e.image).length,
        imagesMissing: evidence.filter((e) => !e.image).length,
        usedFallbackSummary: false,
      },
    };
  }

  // Nothing list-shaped — plain prose (e.g. a WebFetch page summary) is
  // still safe to show as a single summary card, provided it isn't itself
  // an unparsed/malformed JSON blob.
  const asText = asString(parsed) ?? asString(rawOutput);
  if (asText && !looksLikeSerializedJson(asText)) {
    const clean = asText.replace(/\s+/g, ' ').trim();
    return {
      evidence: [
        {
          id: nextEvidenceId('web-summary'),
          type: 'summary',
          title: rawInput?.query || rawInput?.url || 'Search result',
          description: clean.length > 220 ? `${clean.slice(0, 219)}…` : clean,
          url: rawInput?.url,
          raw: rawOutput,
        },
      ],
      diagnostics: { resultCount: 1, imagesFound: 0, imagesMissing: 1, usedFallbackSummary: true },
    };
  }

  return {
    evidence: [],
    diagnostics: { resultCount: 0, imagesFound: 0, imagesMissing: 0, usedFallbackSummary: false },
  };
}
