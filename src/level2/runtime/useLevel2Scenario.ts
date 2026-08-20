import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { level2Registry, HARNESS_STREAM_CAPTURES } from '../scenarios/registry';
import { isMemoryRetrievalKind, type DevScenarioKind } from '../types/devScenario';
import type { Level2Scenario } from '../types/scenario';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Scenario selection state.

   Owns what the demo actually needs:

     selectArchetype(k)  switch selection -> load a scenario for it
     refresh()           REPLAY the current selection — same scenario,
                          same capture, from the start. This is what the R
                          key calls; it must never change WHICH scenario is
                          showing (see nextExample() for that).
     nextExample()       deliberately move to a DIFFERENT scenario — the
                          next Harness Stream capture, or another pool pick
                          in Existing mode.

   Neither ever leaves the selected archetype/capture and never reloads the
   app. A stale in-flight load is discarded by run id, so switching
   selections twice quickly can't land the first result on top of the second.

   `selectedArchetype` is a `DevScenarioKind` — every real `ScenarioArchetype`
   PLUS the dedicated 'memory_retrieval' Dev Mode demo (see
   types/devScenario.ts for why that one isn't a real archetype). Loading
   branches on it: real archetypes go through `level2Registry.select()`
   exactly as before; 'memory_retrieval' goes through the registry's separate
   `selectMemoryRetrieval()`, which cycles the curated memory-pool fixtures
   instead of trying Phoenix. Everything else here — the run-id guard, the
   clear-before-load ordering, Refresh — is identical for both.

   `sourceMode` is a SEPARATE axis, not a third DevScenarioKind: 'existing'
   is everything above; 'harness_stream' bypasses archetype selection
   entirely and picks ONE of the 10 named real captures directly via
   `selectHarnessStreamExample(id)` — this is a data-SOURCE choice, not an
   answer-shape choice, matching the harness_stream ScenarioSource being
   orthogonal to ScenarioArchetype everywhere else in Level 2. Switching
   sourceMode never disturbs the other mode's own selection state, so
   flipping back to Existing returns to whatever archetype was last picked. */

const DEFAULT_ARCHETYPE: DevScenarioKind = 'candidate_ranking';
const DEFAULT_HARNESS_CAPTURE = HARNESS_STREAM_CAPTURES[0]?.id;

/** Deep-link support: `?source=harness_stream&scenario=q03` opens directly
 *  on that capture instead of the default — used by the docs site's "View
 *  in Prototype" links (see THINKING_STATES_HANDOFF.md). Only ever used at
 *  mount; never re-read after, so it can't fight the user's own selections.
 *  A scenario id that doesn't match a real capture is silently ignored —
 *  falls through to the normal default rather than erroring. */
function readHarnessDeepLinkScenario(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const params = new URLSearchParams(window.location.search);
  if (params.get('source') !== 'harness_stream') return undefined;
  const scenario = params.get('scenario');
  return scenario && HARNESS_STREAM_CAPTURES.some((c) => c.id === scenario) ? scenario : undefined;
}

export type Level2SourceMode = 'existing' | 'harness_stream';

export interface Level2ScenarioState {
  selectedArchetype: DevScenarioKind;
  sourceMode: Level2SourceMode;
  selectedHarnessCaptureId: string | undefined;
  harnessStreamCaptures: typeof HARNESS_STREAM_CAPTURES;
  scenario?: Level2Scenario;
  status: 'loading' | 'ready' | 'error';
  error?: string;
  /** What was tried and failed before landing here — dev panel only. */
  fallbackNotes: string[];
  usedFallback: boolean;
  selectArchetype: (kind: DevScenarioKind) => void;
  selectSourceMode: (mode: Level2SourceMode) => void;
  selectHarnessCapture: (id: string) => void;
  /** REPLAY the current selection from the beginning — same archetype pick
   *  (Existing) or the exact same capture (Harness Stream), never a
   *  different one. This is what the R key calls; see nextExample() for
   *  deliberately moving to a different scenario. */
  refresh: () => void;
  /** Deliberately moves to a DIFFERENT scenario — the next harness capture
   *  in Harness Stream mode (wrapping around), or another scenario within
   *  the selected archetype in Existing mode (today identical to refresh()
   *  there, since an archetype is a pool, not one fixed scenario). Kept
   *  separate from refresh() so R always means "replay this one." */
  nextExample: () => void;
  availability: ReturnType<typeof level2Registry.availability>;
  corpusMeta: ReturnType<typeof level2Registry.corpusMeta>;
}

export function useLevel2Scenario(): Level2ScenarioState {
  const [selectedArchetype, setSelectedArchetype] = useState<DevScenarioKind>(DEFAULT_ARCHETYPE);
  // Harness Stream is the default source — this prototype is primarily
  // validated against real captures now. 'existing' (Phoenix/fixture/memory)
  // stays one toggle away, never removed.
  const [sourceMode, setSourceMode] = useState<Level2SourceMode>('harness_stream');
  const [selectedHarnessCaptureId, setSelectedHarnessCaptureId] = useState<string | undefined>(
    () => readHarnessDeepLinkScenario() ?? DEFAULT_HARNESS_CAPTURE
  );
  const [scenario, setScenario] = useState<Level2Scenario | undefined>();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | undefined>();
  const [fallbackNotes, setFallbackNotes] = useState<string[]>([]);
  const [usedFallback, setUsedFallback] = useState(false);
  const runIdRef = useRef(0);

  const load = useCallback((kind: DevScenarioKind) => {
    const runId = ++runIdRef.current;
    setStatus('loading');
    setError(undefined);

    const selection = isMemoryRetrievalKind(kind)
      ? level2Registry.selectMemoryRetrieval()
      : level2Registry.select(kind);

    Promise.resolve(selection)
      .then((selection) => {
        if (runIdRef.current !== runId) return; // superseded by a newer selection
        if (!selection) {
          setStatus('error');
          setError(`No scenario available for ${kind} — no real trace and no fixture.`);
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

  const loadHarnessCapture = useCallback((id: string | undefined) => {
    const runId = ++runIdRef.current;
    setStatus('loading');
    setError(undefined);

    if (!id) {
      setStatus('error');
      setError('No harness-stream captures are available.');
      return;
    }

    // Deliberately deferred a microtask, even though selectHarnessStreamExample
    // is synchronous: refresh()/nextExample() call setScenario(undefined) and
    // then this in the SAME synchronous stack. Harness Stream scenarios are
    // memoized (HARNESS_STREAM_SCENARIOS is a fixed array), so replaying the
    // SAME capture sets state back to the exact same object reference —
    // without this boundary, React 18 batches both calls into one update
    // whose net effect is "no change" by Object.is, so useLevel2Runtime's
    // scenario-id reset effect never fires and Replay does nothing visible.
    // load() (the 'existing' path) already gets this boundary for free from
    // its real Promise chain; this restores the same guarantee here.
    Promise.resolve().then(() => {
      if (runIdRef.current !== runId) return;
      const selection = level2Registry.selectHarnessStreamExample(id);
      if (!selection) {
        setStatus('error');
        setError(`No harness-stream capture found for "${id}".`);
        return;
      }
      setScenario(selection.scenario);
      setFallbackNotes(selection.fallbackNotes);
      setUsedFallback(selection.usedFallback);
      setStatus('ready');
    });
  }, []);

  useEffect(() => {
    // selectedHarnessCaptureId's initializer already resolved the deep link
    // (?source=harness_stream&scenario=q03) or fell back to the default —
    // read it here rather than DEFAULT_HARNESS_CAPTURE directly, or a deep
    // link would be silently ignored on first load.
    loadHarnessCapture(selectedHarnessCaptureId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectArchetype = useCallback(
    (kind: DevScenarioKind) => {
      if (sourceMode === 'existing' && kind === selectedArchetype) return;
      setSourceMode('existing');
      setSelectedArchetype(kind);
      // Clearing the scenario first puts the runtime into 'loading', which
      // stops playback — switching selections must never leave the previous
      // scenario's clock running underneath the new one.
      setScenario(undefined);
      load(kind);
    },
    [load, selectedArchetype, sourceMode]
  );

  const selectHarnessCapture = useCallback(
    (id: string) => {
      if (sourceMode === 'harness_stream' && id === selectedHarnessCaptureId) return;
      setSourceMode('harness_stream');
      setSelectedHarnessCaptureId(id);
      setScenario(undefined);
      loadHarnessCapture(id);
    },
    [loadHarnessCapture, selectedHarnessCaptureId, sourceMode]
  );

  const selectSourceMode = useCallback(
    (mode: Level2SourceMode) => {
      if (mode === sourceMode) return;
      setSourceMode(mode);
      setScenario(undefined);
      if (mode === 'harness_stream') {
        loadHarnessCapture(selectedHarnessCaptureId);
      } else {
        load(selectedArchetype);
      }
    },
    [load, loadHarnessCapture, selectedArchetype, selectedHarnessCaptureId, sourceMode]
  );

  const refresh = useCallback(() => {
    setScenario(undefined);
    if (sourceMode === 'harness_stream') {
      loadHarnessCapture(selectedHarnessCaptureId);
    } else {
      load(selectedArchetype);
    }
  }, [load, loadHarnessCapture, selectedArchetype, selectedHarnessCaptureId, sourceMode]);

  const nextExample = useCallback(() => {
    if (sourceMode === 'harness_stream') {
      const ids = HARNESS_STREAM_CAPTURES.map((c) => c.id);
      const currentIndex = ids.indexOf(selectedHarnessCaptureId ?? '');
      const next = ids[(currentIndex + 1) % ids.length];
      setSelectedHarnessCaptureId(next);
      setScenario(undefined);
      loadHarnessCapture(next);
      return;
    }
    // Existing mode: an archetype is a pool, not one fixed scenario, so
    // "another one" is already what refresh() does there.
    setScenario(undefined);
    load(selectedArchetype);
  }, [load, loadHarnessCapture, selectedArchetype, selectedHarnessCaptureId, sourceMode]);

  // Both are derived from the generated corpus index and the fixture list,
  // neither of which changes at runtime — computing them per render would
  // hand the selector a new array on every frame of playback.
  const availability = useMemo(() => level2Registry.availability(), []);
  const corpusMeta = useMemo(() => level2Registry.corpusMeta(), []);

  return {
    selectedArchetype,
    sourceMode,
    selectedHarnessCaptureId,
    harnessStreamCaptures: HARNESS_STREAM_CAPTURES,
    scenario,
    status,
    error,
    fallbackNotes,
    usedFallback,
    selectArchetype,
    selectSourceMode,
    selectHarnessCapture,
    refresh,
    nextExample,
    availability,
    corpusMeta,
  };
}
