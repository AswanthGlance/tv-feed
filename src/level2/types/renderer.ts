import type { ComponentType } from 'react';
import type { ScenarioArchetype } from './archetype';
import type { ThinkingPass, ThinkingValueType } from './pass';
import type { Level2Scenario } from './scenario';
import type { Level2RuntimeState } from './runtime';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Renderer contracts.

   This is the entire surface the UI layer needs. A renderer receives typed
   DATA and nothing else: no Phoenix types, no span ids in its props path, no
   knowledge of where the scenario came from. Registering a new visual
   treatment means adding an entry to a map (see renderers/registry.ts), never
   growing a conditional inside an experience component.
   ───────────────────────────────────────────────────────────────────────────── */

export interface ThinkingRendererProps<T = unknown> {
  pass: ThinkingPass;
  scenario: Level2Scenario;
  payload: T;
  /** Full runtime state, for renderers that need continuity across passes
   *  (the evolving candidate canvas is the main one). */
  runtime: Level2RuntimeState;
}

export type ThinkingRenderer = ComponentType<ThinkingRendererProps<never>>;

/** Resolution key. An archetype may override a value type's default renderer
 *  (candidate_ranking renders 'entity_preview' as a continuous evolving
 *  canvas; list renders the same payload as a plain set), which is why the
 *  key is the PAIR, with a value-type-only fallback. */
export interface ThinkingRendererKey {
  archetype: ScenarioArchetype;
  valueType: ThinkingValueType;
}

export type ThinkingRendererRegistry = Partial<
  Record<`${ScenarioArchetype}:${ThinkingValueType}` | ThinkingValueType, ThinkingRenderer>
>;
