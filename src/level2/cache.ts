/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Versioned cache.

   Caches the expensive things: fetched span payloads and the scenarios built
   from them. Everything is namespaced by SCHEMA_VERSION, so changing an
   extraction rule and bumping the version invalidates every stale entry at
   once — a cached scenario built by yesterday's classifier must never be
   replayed as if today's rules produced it.

   Never throws. Storage being full, disabled or absent degrades performance,
   never correctness.
   ───────────────────────────────────────────────────────────────────────────── */

/** Bump whenever anything that changes the SHAPE OR MEANING of a cached
 *  scenario changes: classification rules, entity-role rules, pass building,
 *  final response construction. */
export const LEVEL2_CACHE_VERSION = 1;

const PREFIX = 'level2.cache.';
const NAMESPACE = `${PREFIX}v${LEVEL2_CACHE_VERSION}.`;

interface CacheEnvelope<T> {
  storedAt: string;
  value: T;
}

function storage(): Storage | undefined {
  try {
    return typeof window !== 'undefined' ? window.localStorage : undefined;
  } catch {
    return undefined;
  }
}

export function cacheGet<T>(key: string): T | undefined {
  const store = storage();
  if (!store) return undefined;
  try {
    const raw = store.getItem(NAMESPACE + key);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    return parsed?.value;
  } catch {
    return undefined;
  }
}

export function cacheSet<T>(key: string, value: T): void {
  const store = storage();
  if (!store) return;
  try {
    const envelope: CacheEnvelope<T> = { storedAt: new Date().toISOString(), value };
    store.setItem(NAMESPACE + key, JSON.stringify(envelope));
  } catch {
    // Quota exceeded is the common case. Drop this entry rather than the
    // whole cache — the next successful write will keep things moving.
  }
}

/** Removes every Level 2 cache entry from OTHER schema versions. Called once
 *  at startup so a version bump self-cleans instead of accumulating dead keys. */
export function purgeStaleCacheVersions(): number {
  const store = storage();
  if (!store) return 0;
  const doomed: string[] = [];
  try {
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      if (key && key.startsWith(PREFIX) && !key.startsWith(NAMESPACE)) doomed.push(key);
    }
    for (const key of doomed) store.removeItem(key);
  } catch {
    return 0;
  }
  return doomed.length;
}

/** Full manual invalidation — wired to the dev panel. */
export function invalidateLevel2Cache(): number {
  const store = storage();
  if (!store) return 0;
  const doomed: string[] = [];
  try {
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      if (key && key.startsWith(PREFIX)) doomed.push(key);
    }
    for (const key of doomed) store.removeItem(key);
  } catch {
    return 0;
  }
  return doomed.length;
}

export const cacheKeys = {
  spans: (traceId: string) => `spans.${traceId}`,
  scenario: (traceId: string) => `scenario.${traceId}`,
};
