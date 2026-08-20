import { ARCHETYPE_LABEL, SCENARIO_ARCHETYPES, type ScenarioArchetype } from './archetype';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Dev Mode scenario selection.

   `ScenarioArchetype` (archetype.ts) is deliberately the SHAPE OF THE ANSWER
   and nothing else — see that file's header. "Memory Retrieval" is not a
   shape of answer (its final response is still whatever the underlying
   trace/fixture actually is: a candidate rail, a list, ...); it is a Dev Mode
   DEMONSTRATION of the shared memory step (memoryContextPlan.ts /
   phoenix/memoryRetrieval.ts) that already runs, optionally, inside every
   real archetype. So it gets its own selection type rather than polluting
   ScenarioArchetype — the classifier, the closing-line map, and the renderer
   registry all key off the real archetype and stay untouched.

   `DevScenarioKind` is ONLY used at the UI selection layer (the scenario
   selector, the two hooks that own "what's currently picked"). Every scenario
   actually built, memory-pool or not, still carries a real `ScenarioArchetype`
   on `Level2Scenario.archetype`.
   ───────────────────────────────────────────────────────────────────────────── */

export const MEMORY_RETRIEVAL_KIND = 'memory_retrieval' as const;

export type DevScenarioKind = ScenarioArchetype | typeof MEMORY_RETRIEVAL_KIND;

/** Selector order: the nine answer-shape archetypes, then Memory Retrieval —
 *  it demonstrates a step that can precede any of them, so it reads as an
 *  addition to the list, not a peer shape. */
export const DEV_SCENARIO_KINDS: DevScenarioKind[] = [...SCENARIO_ARCHETYPES, MEMORY_RETRIEVAL_KIND];

export const DEV_SCENARIO_LABEL: Record<DevScenarioKind, string> = {
  ...ARCHETYPE_LABEL,
  [MEMORY_RETRIEVAL_KIND]: 'Memory Retrieval',
};

export function isMemoryRetrievalKind(kind: DevScenarioKind): kind is typeof MEMORY_RETRIEVAL_KIND {
  return kind === MEMORY_RETRIEVAL_KIND;
}
