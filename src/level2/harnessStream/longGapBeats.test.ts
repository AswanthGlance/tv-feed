import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildScenarioFromHarnessStream } from './buildScenarioFromHarnessStream';
import { scheduleActualPasses } from '../runtime/schedule';
import type { HarnessStreamEvent, HarnessTurnEventSource } from './types';

/* Real-data regression coverage for the "never a 30-second static hold"
   fix (see passBuilder.ts's sub-beat splitting + synthesisBeat.ts). Uses the
   real q02 capture (Thavala Dosai recipe) — a genuinely long (33.5s),
   originally single-pass generic-archetype trace — never synthetic data,
   matching this repo's own convention for harness-stream tests. */

const FIXTURE_DIR = join(__dirname, '../../../scripts/fixtures/harness-stream');

function loadTurn(id: string): HarnessTurnEventSource {
  const manifest: Record<string, string> = JSON.parse(readFileSync(join(FIXTURE_DIR, 'manifest.json'), 'utf-8'));
  const events: HarnessStreamEvent[] = JSON.parse(readFileSync(join(FIXTURE_DIR, `${id}_events.json`), 'utf-8'));
  return { turnId: id, prompt: manifest[id], events };
}

describe('q02 (33.5s real recipe research) — long pass no longer a static hold', () => {
  const { scenario } = buildScenarioFromHarnessStream(loadTurn('q02'));

  it('resolves into multiple meaningful beats, not one pass + one narration + a 30s hold', () => {
    expect(scenario!.thinkingPasses.length).toBeGreaterThan(1);
    const narrations = new Set(scenario!.thinkingPasses.map((p) => p.narration));
    // Every beat says something different — no beat is just a repeat of the
    // previous one's line under a new id.
    expect(narrations.size).toBe(scenario!.thinkingPasses.length);
  });

  it('ends on a real SYNTHESIS beat that previews real section labels, not final content', () => {
    const last = scenario!.thinkingPasses[scenario!.thinkingPasses.length - 1];
    expect(last.id).toBe('pass-synthesis');
    expect(last.narration.toLowerCase()).toMatch(/recipe/);
    const lines = (last.payload as { sections: string[] } | undefined)?.sections ?? [];
    expect(lines.length).toBeGreaterThan(0);
    // Real section titles from the actual parsed recipe, never invented.
    expect(lines).toContain('Base Batter');
  });

  it('no single scheduled window covers more than ~40% of the real trace duration', () => {
    const traceDurationMs = scenario!.metadata?.traceDurationMs as number;
    const { scheduled } = scheduleActualPasses(scenario!.thinkingPasses, traceDurationMs, 0);
    const longest = Math.max(...scheduled.map((s) => s.end - s.start));
    // Before this fix, one pass covered the ENTIRE 33.5s trace. A generous
    // 40% ceiling still catches a full regression back to one giant pass
    // without being brittle about the exact real split.
    expect(longest).toBeLessThan(traceDurationMs * 0.4);
  });
});

describe('q03 (hybrid, real GetRoute calls) — synthesis beat appended without disturbing the existing route arc', () => {
  const { scenario } = buildScenarioFromHarnessStream(loadTurn('q03'));

  it('keeps the existing route beats untouched and adds a contextual synthesis beat at the end', () => {
    const passes = scenario!.thinkingPasses;
    expect(passes.some((p) => p.valueType === 'route')).toBe(true);
    const last = passes[passes.length - 1];
    expect(last.id).toBe('pass-synthesis');
    // "stay" is the real domain for this capture (Rawla Narlai stay plan).
    expect(last.narration.toLowerCase()).toMatch(/plan/);
  });
});

describe('candidate_ranking / list are untouched by the synthesis beat', () => {
  it('q05 (candidate_ranking) never gets a pass-synthesis appended', () => {
    const { scenario } = buildScenarioFromHarnessStream(loadTurn('q05'));
    expect(scenario!.thinkingPasses.some((p) => p.id === 'pass-synthesis')).toBe(false);
  });

  it('q01 (list) never gets a pass-synthesis appended', () => {
    const { scenario } = buildScenarioFromHarnessStream(loadTurn('q01'));
    expect(scenario!.thinkingPasses.some((p) => p.id === 'pass-synthesis')).toBe(false);
  });
});
