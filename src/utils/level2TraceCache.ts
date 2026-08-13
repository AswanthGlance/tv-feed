import type { PhoenixSpan } from '../types/phoenix';
import type { ProgressiveJourney } from '../types/experiencePass';
import type { MappingDiagnostics } from '../adapters/phoenixToMutations';

const KEY = 'agentThinkingTrace.level2.lastGoodJourney.v1';

interface CachedLevel2Trace {
  traceId: string;
  rootSpan: PhoenixSpan;
  spans: PhoenixSpan[];
  journey: ProgressiveJourney;
  diagnostics: MappingDiagnostics;
  cachedAt: string;
}

/** Mirrors src/utils/traceCache.ts's "last good real trace" pattern, but for
 *  Level 2's derived journey (not just raw spans) — so a cache hit doesn't
 *  need to re-run the mapping pipeline, and the dev panel can show exactly
 *  which real trace + diagnostics produced the journey currently on screen.
 *  Only ever overwritten by a trace that scored HIGH or MEDIUM Level 2
 *  compatibility (see useLevel2TraceSource) — a low-quality real trace is
 *  never allowed to evict a previously-good cached one. */
export function saveLastGoodLevel2Trace(
  traceId: string,
  rootSpan: PhoenixSpan,
  spans: PhoenixSpan[],
  journey: ProgressiveJourney,
  diagnostics: MappingDiagnostics
): void {
  try {
    const payload: CachedLevel2Trace = { traceId, rootSpan, spans, journey, diagnostics, cachedAt: new Date().toISOString() };
    window.localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    // Storage full/unavailable — caching is a nice-to-have, never fatal.
  }
}

export function loadLastGoodLevel2Trace(): CachedLevel2Trace | undefined {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as CachedLevel2Trace;
    if (!parsed?.journey || !Array.isArray(parsed.spans)) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}
