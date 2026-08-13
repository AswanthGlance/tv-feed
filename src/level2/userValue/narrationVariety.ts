/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Narration variety.

   One canonical FACT (a phase's real outcome — "found 5 places", "checking
   ratings") can be SAID several honest ways without changing what it claims.
   `phrase()` picks one wording at pass-build time so the same shape of trace
   does not read identically on every viewing.

   Pure and deterministic by default: with no `rng` argument every caller gets
   variant [0] — today's exact copy. That is what every existing test does
   (none of them pass an `rng`), so this file adds variety without touching a
   single existing assertion. Real playback opts in by passing `Math.random`
   at the one place a scenario is actually built for the screen (see
   scenarios/fromTrace.ts, scenarios/fixtures.ts) — never inside a component
   render, so the wording is picked ONCE per built scenario and stays fixed
   for as long as that scenario is on screen or cached.
   ───────────────────────────────────────────────────────────────────────────── */

export type Rng = () => number;

/** Always variant [0]. The default — see file header. */
export const STABLE_RNG: Rng = () => 0;

/** Picks one variant. `variants[0]` is always the canonical/current string,
 *  so `phrase(variants)` with no rng is identical to just writing that string
 *  inline. */
export function phrase<T>(variants: readonly [T, ...T[]], rng: Rng = STABLE_RNG): T {
  const i = Math.min(variants.length - 1, Math.max(0, Math.floor(rng() * variants.length)));
  return variants[i];
}
