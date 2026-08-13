import { describe, it, expect } from 'vitest';
import { phrase, STABLE_RNG } from './narrationVariety';

describe('phrase — narration wording variety', () => {
  const variants = ['a', 'b', 'c'] as const;

  it('with no rng (and with the default STABLE_RNG), always returns variant [0]', () => {
    expect(phrase(variants)).toBe('a');
    expect(phrase(variants, STABLE_RNG)).toBe('a');
  });

  it('maps the full [0, 1) rng range to every variant, never overrunning the array', () => {
    expect(phrase(variants, () => 0)).toBe('a');
    expect(phrase(variants, () => 0.34)).toBe('b');
    expect(phrase(variants, () => 0.99999)).toBe('c');
  });

  it('a single-variant tuple always returns that variant regardless of rng', () => {
    expect(phrase(['only'] as const, () => 0.9)).toBe('only');
  });
});
