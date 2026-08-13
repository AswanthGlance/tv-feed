import { describe, it, expect } from 'vitest';
import { buildMemoryContextPass } from './memoryContextPlan';
import { NO_MEMORY_CONTEXT } from '../types/memory';
import type { MemoryContext } from '../types/memory';
import type { MemorySignalsPayload } from '../types/pass';

const available = (signals = [{ type: 'location', label: 'Bengaluru, Karnataka' }]): MemoryContext => ({
  available: true,
  sourceSpanIds: ['mem-span'],
  relevantSignals: signals,
  diagnostics: { spanFound: true, hit: true, totalSignalsFound: signals.length, relevantSignalCount: signals.length, rendered: true },
});

describe('buildMemoryContextPass — optional, never a placeholder', () => {
  it('returns undefined when memory is unavailable (no span, no hit, or nothing relevant)', () => {
    expect(buildMemoryContextPass(NO_MEMORY_CONTEXT, 'travel')).toBeUndefined();
  });

  it('never says "retrieving memory" / "reading profile" / other backend terms — with no rng, uses the canonical phrase', () => {
    const pass = buildMemoryContextPass(available(), 'travel')!;
    expect(pass).toBeDefined();
    expect(pass.narration.toLowerCase()).not.toMatch(/retriev|profile|fetch|backend|memory\.retrieval/);
    expect(pass.narration).toBe('Keeping your usual travel preferences in mind');
  });

  it('carries the (already-filtered) signals as the payload, unchanged', () => {
    const ctx = available([{ type: 'location', label: 'Bengaluru, Karnataka' }, { type: 'preference', label: 'vegetarian food' }]);
    const pass = buildMemoryContextPass(ctx, 'food')!;
    expect(pass.valueType).toBe('memory_signals');
    expect((pass.payload as MemorySignalsPayload).signals).toEqual(ctx.relevantSignals);
  });

  it('is domain-contextual: dining, shopping and entertainment prompts get different canonical copy than travel', () => {
    expect(buildMemoryContextPass(available(), 'food')!.narration).toBe('Keeping your usual dining preferences in mind');
    expect(buildMemoryContextPass(available(), 'shopping')!.narration).toBe('Starting with the things you usually care about');
    expect(buildMemoryContextPass(available(), 'entertainment')!.narration).toBe("Using what you've enjoyed before");
    expect(buildMemoryContextPass(available(), undefined)!.narration).toBe('Keeping your preferences in mind');
  });

  it('holds for 1.5-2.5s per the brief, and stays a canvas_value pass (payload present)', () => {
    const pass = buildMemoryContextPass(available(), 'travel')!;
    expect(pass.holdDuration).toBeGreaterThanOrEqual(1500);
    expect(pass.holdDuration).toBeLessThanOrEqual(2500);
    expect(pass.visibility).toBe('canvas_value');
  });

  it('with an rng supplied, can pick a different (still honest) wording for the same claim', () => {
    const pass = buildMemoryContextPass(available(), 'travel', () => 0.99)!;
    expect(pass.narration).not.toBe('Keeping your usual travel preferences in mind');
    expect(pass.narration).toBe('Starting with what you usually look for when traveling');
  });
});
