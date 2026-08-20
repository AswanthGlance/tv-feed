import { describe, expect, it } from 'vitest';
import { actualTimingAvailable, scheduleActualPasses, scheduleDemoPasses, schedulePassesForMode } from './schedule';
import type { ThinkingPass } from '../types/pass';

const pass = (id: string, over: Partial<ThinkingPass> = {}): ThinkingPass => ({
  id,
  visibility: 'status',
  narration: id,
  enterDuration: 500,
  holdDuration: 1500,
  exitDuration: 250,
  ...over,
});

describe('scheduleDemoPasses', () => {
  it('is the original back-to-back curated cadence', () => {
    const { scheduled, total } = scheduleDemoPasses([pass('a'), pass('b')]);
    expect(scheduled[0]).toMatchObject({ start: 0, enterEnd: 500, holdEnd: 2000, end: 2250 });
    expect(scheduled[1]).toMatchObject({ start: 2250, end: 4500 });
    expect(total).toBe(4500);
  });

  it('never reads trace timing', () => {
    const p = pass('a', { traceTiming: { start: 9000, end: 12000 } });
    const { scheduled } = schedulePassesForMode([p], 'demo', 18000, 0);
    expect(scheduled[0].start).toBe(0);
  });
});

describe('scheduleActualPasses', () => {
  it('anchors passes at their real event intervals and runs to the real final-response time', () => {
    const passes = [
      pass('memory', { traceTiming: { start: 0, end: 800 } }),
      pass('discover', { traceTiming: { start: 1200, end: 4700 } }),
    ];
    const { scheduled, total } = scheduleActualPasses(passes, 18400);
    expect(scheduled[0].start).toBe(0);
    expect(scheduled[1].start).toBe(1200);
    // Final response is never revealed before the real turn end.
    expect(total).toBe(18400);
  });

  it('keeps the current pass visible through a real wait — no dead air between passes', () => {
    const passes = [
      pass('a', { traceTiming: { start: 0, end: 1000 } }),
      pass('b', { traceTiming: { start: 5000, end: 6000 } }), // real 4s gap
    ];
    const { scheduled } = scheduleActualPasses(passes, 8000);
    // Pass a holds until pass b genuinely begins.
    expect(scheduled[0].end).toBe(5000);
    expect(scheduled[1].start).toBe(5000);
  });

  it('preserves long gaps by default — that is the point of the mode', () => {
    const passes = [
      pass('a', { traceTiming: { start: 0, end: 1000 } }),
      pass('b', { traceTiming: { start: 31000, end: 32000 } }),
    ];
    const { total } = scheduleActualPasses(passes, 40000);
    expect(total).toBe(40000);
  });

  it('compresses only oversized gaps when Max Idle Gap is set, preserving other intervals', () => {
    const passes = [
      pass('a', { traceTiming: { start: 0, end: 1000 } }),
      pass('b', { traceTiming: { start: 31000, end: 32000 } }), // 30s idle
    ];
    const { scheduled, total } = scheduleActualPasses(passes, 33000, 5000);
    expect(scheduled[1].start).toBe(6000); // 1s work + 5s capped gap
    // b's own 1s duration and the 1s tail to the final response survive intact.
    expect(scheduled[1].end).toBeGreaterThanOrEqual(7000);
    expect(total).toBe(8000);
  });

  it('lays un-anchored passes into the window between real anchors, scaled to fit', () => {
    const passes = [
      pass('acknowledge'), // no real anchor
      pass('discover', { traceTiming: { start: 1000, end: 3000 } }),
      pass('compare'), // no real anchor — lands in the tail window
      pass('complete'),
    ];
    const { scheduled, total } = scheduleActualPasses(passes, 20000);
    expect(scheduled[0].start).toBe(0);
    expect(scheduled[0].end).toBeLessThanOrEqual(1000 + 1); // squeezed before the real anchor
    expect(scheduled[1].start).toBe(1000);
    // Tail passes fill toward the real final-response time, never past it
    // when the window fits their demo durations.
    expect(scheduled[2].start).toBe(3000);
    expect(total).toBe(20000);
  });

  it('preserves real overlap between parallel operations', () => {
    const passes = [
      pass('research', { traceTiming: { start: 0, end: 4000 } }),
      pass('maps', { traceTiming: { start: 1000, end: 2500 } }), // overlaps research
    ];
    const { scheduled } = scheduleActualPasses(passes, 6000);
    expect(scheduled[0].start).toBe(0);
    expect(scheduled[1].start).toBe(1000); // not serialized after research
  });
});

describe('actualTimingAvailable', () => {
  it('requires a real duration and at least one anchored pass — never fabricated for fixtures', () => {
    expect(actualTimingAvailable([pass('a')], 18000)).toBe(false);
    expect(actualTimingAvailable([pass('a', { traceTiming: { start: 0, end: 1 } })], undefined)).toBe(false);
    expect(actualTimingAvailable([pass('a', { traceTiming: { start: 0, end: 1 } })], 18000)).toBe(true);
  });
});
