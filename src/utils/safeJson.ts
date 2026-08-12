/* Defensive parsing for Phoenix attribute values, which may be objects,
   JSON-encoded strings, plain strings, or missing entirely. Never throws. */

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
    return undefined;
  }
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
