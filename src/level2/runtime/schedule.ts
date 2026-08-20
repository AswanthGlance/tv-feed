import type { ThinkingPass } from '../types/pass';
import type { ScheduledThinkingPass } from '../types/runtime';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Pass scheduling, in both timing modes.

   DEMO TIMING (default, and the only mode consumers ever see): the curated
   presentation cadence — each pass plays for its authored enter/hold/exit,
   back to back. This is byte-for-byte the scheduling the runtime has always
   done; nothing here changes it.

   ACTUAL TRACE TIMING (dev-mode only): the SAME passes — same narration,
   same payloads, same canvas mutations, same order — scheduled on the real
   Phoenix clock instead. A pass that maps to real events starts when its
   earliest mapped event started and its work ends when the latest mapped
   event completed (`pass.traceTiming`, annotated in scenarios/fromTrace.ts).
   Raw spans are never replayed and technical events are never re-exposed —
   this reschedules the consumer passes, nothing else.

   Three realities of real traces this scheduler must respect:

   · GAPS ARE THE POINT. A real 4-second wait between tool completions is
     exactly what this mode exists to show, so a pass HOLDS on screen until
     the next pass actually begins — the agent stays visibly present through
     the wait, and nothing is compressed by default. An optional Max Idle Gap
     cap (dev safety control, default Off) shifts everything after an
     oversized gap earlier, uniformly, preserving every other interval.

   · SOME PASSES HAVE NO REAL ANCHOR. Synthetic beats (acknowledge, found,
     compare, narrow, complete) have no tool span of their own — in reality
     that work happens inside the closing llm.call that writes the answer.
     They are laid into the un-anchored windows between anchored passes (and
     the tail window before the real final-response time), scaled down to fit
     when the window is shorter than their demo durations. Their timing is
     openly interpolated placement WITHIN real boundaries — real timestamps
     are never invented for them.

   · THE FINAL RESPONSE ARRIVES WHEN IT ARRIVED. The timeline runs to the
     real end of the turn (`traceDurationMs`, the root span's completion), so
     the final response is never revealed early — "time to first value" and
     "time to final response" read true.
   ───────────────────────────────────────────────────────────────────────────── */

export type TimingMode = 'demo' | 'actual';

/** Floor for an interpolated pass squeezed into a too-small window — below
 *  this a beat is an unreadable flash rather than a scheduling decision. */
const MIN_INTERPOLATED_MS = 300;

/** A tool_result often arrives as one atomic JSON blob, so a `canvas_value`
 *  pass's real window (e.g. list-found revealing 10 product cards) can be a
 *  few milliseconds wide — real, but not a scheduling decision a viewer can
 *  perceive. Rather than invent a second magic number, the floor for these
 *  passes IS the pass's own authored demo duration: the real clock still
 *  governs everything around it (when this reveal starts, how long the gap
 *  before/after it was), only the reveal itself is guaranteed enough time to
 *  actually register. Never applied to narration-only beats, which already
 *  have MIN_INTERPOLATED_MS. */
function canvasRevealFloorMs(pass: ThinkingPass): number {
  if (pass.visibility !== 'canvas_value') return MIN_INTERPOLATED_MS;
  return Math.max(MIN_INTERPOLATED_MS, pass.enterDuration + pass.holdDuration + pass.exitDuration);
}

export interface ScheduleResult {
  scheduled: ScheduledThinkingPass[];
  total: number;
}

/** The curated demo cadence — unchanged from the runtime's original
 *  scheduling: authored durations, back to back. */
export function scheduleDemoPasses(passes: ThinkingPass[]): ScheduleResult {
  const scheduled: ScheduledThinkingPass[] = [];
  let cursor = 0;
  passes.forEach((pass, index) => {
    const start = cursor;
    const enterEnd = start + pass.enterDuration;
    const holdEnd = enterEnd + pass.holdDuration;
    const end = holdEnd + pass.exitDuration;
    scheduled.push({ pass, index, start, enterEnd, holdEnd, end });
    cursor = end;
  });
  return { scheduled, total: cursor };
}

/** Uniformly shifts every anchored time after an oversized idle gap so the
 *  gap shrinks to `maxGapMs`, preserving all other intervals. Returns a
 *  monotonic time-remap function. Identity when the cap is off (0). */
function buildGapCompressor(
  intervals: Array<{ start: number; end: number }>,
  traceEnd: number,
  maxGapMs: number
): (t: number) => number {
  if (!maxGapMs) return (t) => t;

  // Cut points measured on the raw clock: after `at`, subtract `by`.
  const cuts: Array<{ at: number; by: number }> = [];
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  let coveredEnd = 0;
  for (const { start, end } of sorted) {
    const gap = start - coveredEnd;
    if (gap > maxGapMs) cuts.push({ at: coveredEnd, by: gap - maxGapMs });
    coveredEnd = Math.max(coveredEnd, end);
  }
  const tailGap = traceEnd - coveredEnd;
  if (tailGap > maxGapMs) cuts.push({ at: coveredEnd, by: tailGap - maxGapMs });

  return (t) => {
    let out = t;
    for (const cut of cuts) {
      if (t > cut.at) out -= Math.min(cut.by, t - cut.at);
    }
    return out;
  };
}

/** Schedules the SAME passes on the real trace clock. `traceDurationMs` is
 *  the real end of the turn; passes without `traceTiming` are interpolated
 *  into the windows between anchored ones (see file header). */
export function scheduleActualPasses(
  passes: ThinkingPass[],
  traceDurationMs: number,
  maxIdleGapMs = 0
): ScheduleResult {
  if (!passes.length) return { scheduled: [], total: 0 };

  const anchored = passes.filter((p) => p.traceTiming);
  const remap = buildGapCompressor(
    anchored.map((p) => p.traceTiming!),
    traceDurationMs,
    maxIdleGapMs
  );
  const traceEnd = remap(traceDurationMs);

  // ── Place every pass on the real clock ────────────────────────────────
  // Anchored passes take their (possibly gap-compressed) real interval.
  // Runs of un-anchored passes are laid into the window between the previous
  // anchor's end (or 0) and the next anchor's start (or the real final-
  // response time), scaled to fit when the window is tight.
  const placed: Array<{ pass: ThinkingPass; start: number; end: number }> = [];
  let i = 0;
  let cursor = 0;

  while (i < passes.length) {
    const pass = passes[i];

    if (pass.traceTiming) {
      const start = remap(pass.traceTiming.start);
      const end = Math.max(remap(pass.traceTiming.end), start + canvasRevealFloorMs(pass));
      placed.push({ pass, start, end });
      cursor = Math.max(cursor, end);
      i += 1;
      continue;
    }

    // A run of consecutive un-anchored passes.
    const run: ThinkingPass[] = [];
    while (i < passes.length && !passes[i].traceTiming) {
      run.push(passes[i]);
      i += 1;
    }
    const nextAnchor = passes[i]?.traceTiming ? remap(passes[i].traceTiming!.start) : traceEnd;
    const windowStart = cursor;
    const runFloor = run.reduce((sum, p) => sum + canvasRevealFloorMs(p), 0);
    const windowEnd = Math.max(nextAnchor, windowStart + runFloor);
    const demoTotal = run.reduce((sum, p) => sum + p.enterDuration + p.holdDuration + p.exitDuration, 0);
    const scale = demoTotal > 0 ? Math.min(1, (windowEnd - windowStart) / demoTotal) : 1;

    let runCursor = windowStart;
    for (const p of run) {
      const duration = Math.max(canvasRevealFloorMs(p), (p.enterDuration + p.holdDuration + p.exitDuration) * scale);
      placed.push({ pass: p, start: runCursor, end: runCursor + duration });
      runCursor += duration;
    }
    cursor = Math.max(cursor, runCursor);
  }

  // ── Chronological replay order ─────────────────────────────────────────
  // On the real clock passes play in the order they actually STARTED — a
  // memory retrieval that ran first appears first, and a research call that
  // really ran after discovery plays after it, even where the curated demo
  // order differs. Stable sort: simultaneous starts keep presentation order.
  placed.sort((a, b) => a.start - b.start);

  // ── Fill the waits ─────────────────────────────────────────────────────
  // A real idle gap keeps the CURRENT pass on screen — narration holds until
  // the next pass genuinely begins, never a blank stage. So each pass's
  // display window extends to the next pass's start (parallel/overlapping
  // real intervals are left overlapping; the runtime shows the latest-started
  // as current while earlier canvas value stays applied).
  const scheduled: ScheduledThinkingPass[] = placed.map(({ pass, start, end }, index) => {
    const nextStart = placed[index + 1]?.start;
    const displayEnd = Math.max(end, nextStart ?? Math.max(end, traceEnd));
    const span = displayEnd - start;
    const enterEnd = start + Math.min(pass.enterDuration, span / 2);
    const holdEnd = displayEnd - Math.min(pass.exitDuration, span / 4);
    return { pass, index, start, enterEnd, holdEnd, end: displayEnd };
  });

  const total = Math.max(traceEnd, ...scheduled.map((s) => s.end));
  return { scheduled, total };
}

export function schedulePassesForMode(
  passes: ThinkingPass[],
  mode: TimingMode,
  traceDurationMs: number | undefined,
  maxIdleGapMs: number
): ScheduleResult {
  if (mode === 'actual' && traceDurationMs != null) {
    return scheduleActualPasses(passes, traceDurationMs, maxIdleGapMs);
  }
  return scheduleDemoPasses(passes);
}

/** Whether real timing exists for this pass set: only a real Phoenix trace
 *  (live or cached) whose passes carry mapped event intervals qualifies.
 *  Fixtures without recorded timing never do — timing is never fabricated. */
export function actualTimingAvailable(passes: ThinkingPass[], traceDurationMs: number | undefined): boolean {
  return traceDurationMs != null && traceDurationMs > 0 && passes.some((p) => p.traceTiming);
}
