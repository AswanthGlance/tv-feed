import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { level2Registry } from '../scenarios/registry';
import type { ScenarioArchetype } from '../types/archetype';
import type { Level2Scenario } from '../types/scenario';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Scenario selection state.

   Owns the two things the demo actually needs:

     selectArchetype(a)  switch archetype -> load a scenario of that shape
     refresh()           same archetype -> a DIFFERENT scenario of that shape

   Refresh never leaves the selected archetype and never reloads the app. A
   stale in-flight load is discarded by run id, so switching archetypes twice
   quickly can't land the first result on top of the second.
   ───────────────────────────────────────────────────────────────────────────── */

const DEFAULT_ARCHETYPE: ScenarioArchetype = 'candidate_ranking';

export interface Level2ScenarioState {
  selectedArchetype: ScenarioArchetype;
  scenario?: Level2Scenario;
  status: 'loading' | 'ready' | 'error';
  error?: string;
  /** What was tried and failed before landing here — dev panel only. */
  fallbackNotes: string[];
  usedFallback: boolean;
  selectArchetype: (archetype: ScenarioArchetype) => void;
  refresh: () => void;
  availability: ReturnType<typeof level2Registry.availability>;
  corpusMeta: ReturnType<typeof level2Registry.corpusMeta>;
}

export function useLevel2Scenario(): Level2ScenarioState {
  const [selectedArchetype, setSelectedArchetype] = useState<ScenarioArchetype>(DEFAULT_ARCHETYPE);
  const [scenario, setScenario] = useState<Level2Scenario | undefined>();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | undefined>();
  const [fallbackNotes, setFallbackNotes] = useState<string[]>([]);
  const [usedFallback, setUsedFallback] = useState(false);
  const runIdRef = useRef(0);

  const load = useCallback((archetype: ScenarioArchetype) => {
    const runId = ++runIdRef.current;
    setStatus('loading');
    setError(undefined);

    level2Registry
      .select(archetype)
      .then((selection) => {
        if (runIdRef.current !== runId) return; // superseded by a newer selection
        if (!selection) {
          setStatus('error');
          setError(`No scenario available for ${archetype} — no real trace and no fixture.`);
          return;
        }
        setScenario(selection.scenario);
        setFallbackNotes(selection.fallbackNotes);
        setUsedFallback(selection.usedFallback);
        setStatus('ready');
      })
      .catch((e: Error) => {
        if (runIdRef.current !== runId) return;
        setStatus('error');
        setError(e.message);
      });
  }, []);

  useEffect(() => {
    load(DEFAULT_ARCHETYPE);
  }, [load]);

  const selectArchetype = useCallback(
    (archetype: ScenarioArchetype) => {
      if (archetype === selectedArchetype) return;
      setSelectedArchetype(archetype);
      // Clearing the scenario first puts the runtime into 'loading', which
      // stops playback — switching archetypes must never leave the previous
      // scenario's clock running underneath the new one.
      setScenario(undefined);
      load(archetype);
    },
    [load, selectedArchetype]
  );

  const refresh = useCallback(() => {
    setScenario(undefined);
    load(selectedArchetype);
  }, [load, selectedArchetype]);

  // Both are derived from the generated corpus index and the fixture list,
  // neither of which changes at runtime — computing them per render would
  // hand the selector a new array on every frame of playback.
  const availability = useMemo(() => level2Registry.availability(), []);
  const corpusMeta = useMemo(() => level2Registry.corpusMeta(), []);

  return {
    selectedArchetype,
    scenario,
    status,
    error,
    fallbackNotes,
    usedFallback,
    selectArchetype,
    refresh,
    availability,
    corpusMeta,
  };
}
