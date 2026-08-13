/* Defensive parsing for Phoenix attribute values, which may be objects,
   JSON-encoded strings, plain strings, or missing entirely. Never throws. */

/** Real `tool.output` payloads (confirmed live, e.g. tool.PlaceDetails on
 *  trace 02d085b8...) sometimes embed raw, unescaped control characters
 *  (literal newlines/tabs inside review text) — invalid per strict JSON
 *  grammar, but `JSON.parse` rejects it outright rather than tolerating it.
 *  This escapes the common ones and drops the rest before a retry, so a
 *  free-text field with a literal newline doesn't take down the whole
 *  parse. */
function escapeRawControlChars(s: string): string {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code === 10) { out += '\\n'; continue; }
    if (code === 13) { out += '\\r'; continue; }
    if (code === 9) { out += '\\t'; continue; }
    if (code < 32) continue;
    out += s[i];
  }
  return out;
}

export function safeParseJson<T = unknown>(value: unknown): T | undefined {
  if (value == null) return undefined;
  if (typeof value === 'object') return value as T;
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed[0] !== '{' && trimmed[0] !== '[') return undefined;

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    try {
      return JSON.parse(escapeRawControlChars(trimmed)) as T;
    } catch {
      return undefined;
    }
  }
}

/** Last-resort field extraction for a `tool.output` string that fails
 *  `safeParseJson` even after control-char sanitization — real payloads
 *  have been observed with an unescaped `"` deep inside a free-text field
 *  (e.g. a review quoting someone), which truncates the JSON string and no
 *  amount of control-char fixing repairs. Rather than losing the whole
 *  object, regex out just the specific fields callers actually need (short,
 *  early, low-risk values like place_id/name/rating are essentially never
 *  the field that broke the parse). Returns string values raw (uninterpreted
 *  JSON escaping) — callers needing numbers should run the result through
 *  `normalizeNumber`. */
export function extractFieldsByRegex(raw: string, fields: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const field of fields) {
    const escaped = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const stringMatch = raw.match(new RegExp(`"${escaped}"\\s*:\\s*"([^"]*)"`));
    if (stringMatch) { out[field] = stringMatch[1]; continue; }
    const numMatch = raw.match(new RegExp(`"${escaped}"\\s*:\\s*(-?[\\d.]+)`));
    if (numMatch) { out[field] = numMatch[1]; continue; }
  }
  return out;
}

/** Splits a raw `[ {...}, {...} ]` array-ish string into individual object
 *  substrings via brace-depth counting (tracking quote state so braces
 *  inside string values don't desync the count). Best-effort: a genuinely
 *  malformed object may still throw off the count for everything after it,
 *  but this recovers every object *before* the first unbalanced one instead
 *  of losing the whole array to one bad entry. Used as a fallback when
 *  `safeParseJson` on the whole array fails. */
export function extractCandidateObjects(raw: string): string[] {
  /* CONFIRMED REAL FAILURE this must survive (traces 54e92fc9…, 5f2b5027…,
     b0769ada…): Phoenix caps `tool.output` at 2000 chars, cutting a
     PlaceSearch payload mid-string. The payload is ONE wrapper object —
     `{"query": …, "places": [{…}, {…}, …` — whose closing brace never
     arrives, so a scanner that only collects objects closing at depth 0
     returns NOTHING even though several inner place objects completed
     intact before the cut. So balanced objects are collected at depth 0
     AND depth 1, then one level is chosen:

       ≥2 top-level objects  -> top-level (a bare array of results; any
                                depth-1 objects are fields OF a result)
       0 top-level objects   -> depth-1  (truncated wrapper — the wrapper
                                never closed, its results did)
       1 top-level object    -> depth-1 only when it holds ≥2 of them (a
                                complete wrapper AROUND the results);
                                otherwise that single object IS the result

     Deeper nesting is never collected — a sub-sub-object is a field of a
     field, not a result. */
  const topLevel: string[] = [];
  const nested: string[] = [];
  const starts: number[] = []; // brace start index per open depth
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (escapeNext) { escapeNext = false; continue; }
    if (ch === '\\' && inString) { escapeNext = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (ch === '{') {
      starts.push(i);
    } else if (ch === '}') {
      const start = starts.pop();
      if (start == null) continue;
      const depthAtStart = starts.length;
      if (depthAtStart === 0) topLevel.push(raw.slice(start, i + 1));
      else if (depthAtStart === 1) nested.push(raw.slice(start, i + 1));
    }
  }
  if (topLevel.length >= 2) return topLevel;
  if (topLevel.length === 0) return nested;
  return nested.length >= 2 ? nested : topLevel;
}

/** Recursively searches a parsed JSON value (object/array) for the first
 *  node matching `predicate` — depth-first. Used when a payload's shape is
 *  known to carry a value somewhere but not at a fixed, reliable path (e.g.
 *  some tool outputs nest results under a varying wrapper key). */
export function deepFind<T = unknown>(
  value: unknown,
  predicate: (node: unknown) => boolean,
  depth = 0
): T | undefined {
  if (depth > 8 || value == null) return undefined;
  if (predicate(value)) return value as T;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = deepFind<T>(item, predicate, depth + 1);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  if (typeof value === 'object') {
    for (const v of Object.values(value as Record<string, unknown>)) {
      const found = deepFind<T>(v, predicate, depth + 1);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

/** Trims and collapses internal whitespace; undefined for empty/non-string
 *  input rather than an empty string, so callers can use `??` naturally. */
export function normalizeString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const cleaned = value.replace(/\s+/g, ' ').trim();
  return cleaned || undefined;
}

/** Like `asNumber`, but also tolerates a value with trailing/leading junk a
 *  real payload might carry (e.g. a rating string with a stray "★" or unit
 *  suffix) by extracting the first numeric run rather than requiring the
 *  whole string to be numeric. */
export function normalizeNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return undefined;
  const m = value.match(/-?\d+(\.\d+)?/);
  if (!m) return undefined;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : undefined;
}

export function asString(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return undefined;
}

export function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return undefined;
}

export function attr(attributes: Record<string, unknown> | undefined, key: string): unknown {
  if (!attributes) return undefined;
  return attributes[key];
}

/** First non-empty string attribute across several candidate keys. */
export function firstStringAttr(
  attributes: Record<string, unknown> | undefined,
  keys: string[]
): string | undefined {
  for (const key of keys) {
    const s = asString(attr(attributes, key));
    if (s && s.trim()) return s;
  }
  return undefined;
}
