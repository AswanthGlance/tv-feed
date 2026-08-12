/** ISO timestamp -> epoch ms. Returns NaN (never throws) on bad input, so
 *  callers must guard with Number.isFinite before using the result. */
export function toMillis(iso: string | undefined | null): number {
  if (!iso) return NaN;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : NaN;
}

export function safeSpanStart(span: { start_time: string }, fallback = 0): number {
  const t = toMillis(span.start_time);
  return Number.isFinite(t) ? t : fallback;
}

export function safeSpanEnd(span: { end_time: string; start_time: string }, fallback = 0): number {
  const t = toMillis(span.end_time);
  if (Number.isFinite(t)) return t;
  // Missing/invalid end_time: fall back to start_time so duration reads as ~0
  // instead of NaN propagating through the rest of the pipeline.
  const start = toMillis(span.start_time);
  return Number.isFinite(start) ? start : fallback;
}

export type PlaybackMode = 'real' | 'demo';

const DEMO_MIN_VISIBLE_MS = 600;
const DEMO_MAX_STEP_MS = 4500;

/** Compresses an interval for watchable "demo normalized" playback without
 *  touching underlying trace data — only presentation timing. */
export function normalizeDuration(durationMs: number, mode: PlaybackMode): number {
  if (mode === 'real') return Math.max(durationMs, 0);
  if (durationMs <= 0) return DEMO_MIN_VISIBLE_MS;
  if (durationMs < DEMO_MIN_VISIBLE_MS) return DEMO_MIN_VISIBLE_MS;
  if (durationMs > DEMO_MAX_STEP_MS) return DEMO_MAX_STEP_MS;
  return durationMs;
}

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const rem = Math.round(s % 60);
  return `${m}m ${rem}s`;
}
