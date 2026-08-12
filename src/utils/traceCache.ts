import type { PhoenixSpan, PhoenixTrace } from '../types/phoenix';

const KEY = 'agentThinkingTrace.lastGoodTrace.v3';

interface CachedTrace {
  trace: PhoenixTrace;
  spans: PhoenixSpan[];
  cachedAt: string;
}

/** A single "last good real trace" — used only when Phoenix is genuinely
 *  unreachable (VPN down, server error), so the leadership demo still shows
 *  a real, previously-captured harness response rather than a blank screen
 *  or invented content. */
export function saveLastGoodTrace(trace: PhoenixTrace, spans: PhoenixSpan[]): void {
  try {
    const payload: CachedTrace = { trace, spans, cachedAt: new Date().toISOString() };
    window.localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    // Storage full/unavailable — caching is a nice-to-have, never fatal.
  }
}

export function loadLastGoodTrace(): CachedTrace | undefined {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as CachedTrace;
    if (!parsed?.trace || !Array.isArray(parsed.spans)) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}
