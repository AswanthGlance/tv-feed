import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AgentMutation, ProgressiveItem } from '../../types/progressiveValue';
import type { DevScenarioKind } from '../types/devScenario';
import type { EntityPreviewPayload, ThinkingPass } from '../types/pass';
import type { Level2Scenario } from '../types/scenario';
import type { Level2RuntimePhase, Level2RuntimeState } from '../types/runtime';
import { actualTimingAvailable, schedulePassesForMode, type TimingMode } from './schedule';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Scenario runtime.

   ONE clock, ONE state machine, for every archetype. There is no setTimeout
   anywhere in a Level 2 component: a renderer reads `phase`, `currentPass` and
   `items`, and decides what that looks like.

     thinking       passes are playing
     consolidating  passes are done; the working view gathers itself
     resolving      the final response is being handed over
     final          the complete answer is on screen

   The winner deserves special mention. It is NEVER folded out of thinking —
   no pass emits PROMOTE_ITEM, because narrowing is not deciding. `promotedId`
   only becomes non-undefined once the runtime reaches resolving/final, and
   only if the scenario's FINAL RESPONSE actually names a winner. A `list`
   scenario therefore reaches the end with nothing promoted, which is the
   honest outcome, enforced structurally rather than by convention.
   ───────────────────────────────────────────────────────────────────────────── */

/* Consolidation carries TWO beats in sequence, so it is budgeted for both:
     ~560ms  the evidence compresses (receding tiles leave, survivors shrink,
             metadata and source chips drop away, narration fades)
     ~780ms  the agent travels centre -> top-left, landing exactly on the L1
             template's mascot coordinates (see level2Scenario.css)
   Cutting this short would strand the agent mid-flight when the L1 template
   mounts, which is the one moment the handoff must be seamless. */
const CONSOLIDATING_MS = 1450;
/* The L1 template runs its own intro (mascot -> typing -> structure), so this
   is just the handover beat before it takes the stage. */
const RESOLVING_MS = 450;

/* Pass scheduling lives in schedule.ts so both timing modes are pure,
   testable functions: demo (the curated cadence, unchanged) and the
   dev-mode actual-trace clock. */

/** Dev-only preference; survives refresh/scenario switches so a selected
 *  timing mode keeps applying to whatever trace loads next. */
const TIMING_MODE_KEY = 'level2.timingMode';
const MAX_IDLE_GAP_KEY = 'level2.maxIdleGapMs';

function readStored<T>(key: string, parse: (raw: string) => T | undefined): T | undefined {
  try {
    const raw = window.localStorage.getItem(key);
    return raw == null ? undefined : parse(raw);
  } catch {
    return undefined;
  }
}

function writeStored(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* private mode etc. — preference just doesn't persist */
  }
}

function applyMutation(items: ProgressiveItem[], m: AgentMutation): ProgressiveItem[] {
  switch (m.type) {
    case 'ADD_ITEMS': {
      const known = new Set(items.map((i) => i.id));
      return [...items, ...m.items.filter((i) => !known.has(i.id))];
    }
    case 'ENRICH_ITEMS': {
      const patches = new Map(m.patches.map((p) => [p.id, p.data]));
      return items.map((it) => {
        const patch = patches.get(it.id);
        if (!patch) return it;
        // Enrichment fills in what was missing. It never advances a card's
        // tier on its own — state only changes via an explicit mutation.
        return { ...it, metadata: { ...it.metadata, ...patch }, state: it.state === 'discovered' ? 'enriched' : it.state };
      });
    }
    case 'ADD_EVIDENCE': {
      const patches = new Map(m.patches.map((p) => [p.id, p.evidence]));
      return items.map((it) => (patches.has(it.id) ? { ...it, metadata: { ...it.metadata, evidence: patches.get(it.id) } } : it));
    }
    case 'UPDATE_JUDGMENT': {
      const patches = new Map(m.patches.map((p) => [p.id, p.judgment]));
      return items.map((it) => (patches.has(it.id) ? { ...it, metadata: { ...it.metadata, judgment: patches.get(it.id) } } : it));
    }
    case 'REORDER_ITEMS': {
      const order = new Map(m.orderedIds.map((id, i) => [id, i]));
      return [...items].sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
    }
    case 'NEGATE_ITEMS': {
      const reasons = new Map(m.items.map((i) => [i.id, i.reason]));
      return items.map((it) =>
        reasons.has(it.id) ? { ...it, state: 'negated' as const, metadata: { ...it.metadata, negationReason: reasons.get(it.id) } } : it
      );
    }
    case 'SHORTLIST_ITEMS':
      return items.map((it) => (m.ids.includes(it.id) ? { ...it, state: 'shortlisted' as const } : it));
    case 'REMOVE_ITEMS':
      return items.map((it) => (m.ids.includes(it.id) ? { ...it, state: 'removed' as const } : it));
    case 'PROMOTE_ITEM':
      return items.map((it) => (it.id === m.id ? { ...it, state: 'promoted' as const } : it));
    case 'RESOLVE_RESULT':
      return items;
  }
}

/** The winner a scenario's FINAL RESPONSE names, if any. Reading it from the
 *  final response rather than from the pass stream is what makes "never invent
 *  a winner" structural. */
function finalWinnerId(scenario: Level2Scenario | undefined): string | undefined {
  const response = scenario?.finalResponse;
  if (!response) return undefined;
  if (response.kind === 'entity_rail') return response.winnerId;
  if (response.kind === 'entity') return response.entity.id;
  if (response.kind === 'comparison') return response.verdictSubjectId;
  if (response.kind === 'hybrid') {
    for (const section of response.sections) {
      if (section.response.kind === 'entity_rail' && section.response.winnerId) return section.response.winnerId;
    }
  }
  return undefined;
}

export function useLevel2Runtime(
  scenario: Level2Scenario | undefined,
  selectedArchetype: DevScenarioKind,
  isLoading: boolean
): Level2RuntimeState {
  const [elapsed, setElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeedState] = useState(1);
  /** Set by jumpToFinal so the phase machine can be driven past the clock. */
  const [forcedFinal, setForcedFinal] = useState(false);

  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);

  /* ── Timing mode (dev-mode control) ────────────────────────────────────
     'demo' is the curated leadership cadence and the default. 'actual'
     reschedules the SAME passes on the real Phoenix clock — nothing about
     what is shown changes, only when. The preference persists across
     refresh/scenario switches. */
  const [timingMode, setTimingModeState] = useState<TimingMode>(
    () => readStored(TIMING_MODE_KEY, (raw) => (raw === 'actual' ? 'actual' : 'demo')) ?? 'demo'
  );
  const [maxIdleGapMs, setMaxIdleGapState] = useState<number>(
    () => readStored(MAX_IDLE_GAP_KEY, (raw) => (Number.isFinite(Number(raw)) ? Number(raw) : undefined)) ?? 0
  );

  const traceDurationMs = scenario?.metadata?.traceDurationMs as number | undefined;
  // Real timing exists for real Phoenix traces (live or cached) and for
  // Harness Stream captures — never for fixtures, never fabricated. Demo
  // stays the default for every source, including Harness Stream; Real
  // Timing is a dev-mode choice the user makes explicitly, and it persists
  // (via TIMING_MODE_KEY) across scenario switches and R replays exactly
  // like it always has for Phoenix.
  const timingAvailable =
    !!scenario && scenario.source !== 'fixture' && actualTimingAvailable(scenario.thinkingPasses, traceDurationMs);
  const effectiveTimingMode: TimingMode = timingMode === 'actual' && timingAvailable ? 'actual' : 'demo';

  const { scheduled, total } = useMemo(
    () => schedulePassesForMode(scenario?.thinkingPasses ?? [], effectiveTimingMode, traceDurationMs, maxIdleGapMs),
    [scenario, effectiveTimingMode, traceDurationMs, maxIdleGapMs]
  );

  // A new scenario restarts the clock. Keyed on scenario id so re-selecting
  // the same scenario object doesn't reset mid-playback.
  const scenarioId = scenario?.id;
  const prevScenarioId = useRef(scenarioId);
  useEffect(() => {
    if (scenarioId === prevScenarioId.current) return;
    prevScenarioId.current = scenarioId;
    setElapsed(0);
    setIsPlaying(true);
    setForcedFinal(false);
  }, [scenarioId]);

  // Switching timing mode (or the idle-gap cap) rebuilds the schedule, so
  // the clock restarts — the same scenario replays under the new timing.
  const setTimingMode = useCallback((mode: TimingMode) => {
    setTimingModeState(mode);
    writeStored(TIMING_MODE_KEY, mode);
    setElapsed(0);
    setForcedFinal(false);
    setIsPlaying(true);
  }, []);

  const setMaxIdleGapMs = useCallback((ms: number) => {
    setMaxIdleGapState(ms);
    writeStored(MAX_IDLE_GAP_KEY, String(ms));
    setElapsed(0);
    setForcedFinal(false);
    setIsPlaying(true);
  }, []);

  useEffect(() => {
    if (!isPlaying || total <= 0) {
      lastTickRef.current = null;
      return;
    }
    const tick = (now: number) => {
      if (lastTickRef.current == null) lastTickRef.current = now;
      const delta = (now - lastTickRef.current) * speed;
      lastTickRef.current = now;
      setElapsed((prev) => Math.min(prev + delta, total));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      lastTickRef.current = null;
    };
  }, [isPlaying, total, speed]);

  const passesComplete = total > 0 && elapsed >= total;
  useEffect(() => {
    if (passesComplete) setIsPlaying(false);
  }, [passesComplete]);

  /* ── Phase machine ─────────────────────────────────────────────────────
     thinking -> consolidating -> resolving -> final. Timed here, in one
     place, so no component owns a timer of its own. */
  const [settlePhase, setSettlePhase] = useState<'none' | 'consolidating' | 'resolving' | 'final'>('none');

  useEffect(() => {
    if (!passesComplete) {
      setSettlePhase('none');
      return;
    }
    setSettlePhase('consolidating');
    const toResolving = setTimeout(() => setSettlePhase('resolving'), CONSOLIDATING_MS / speed);
    const toFinal = setTimeout(() => setSettlePhase('final'), (CONSOLIDATING_MS + RESOLVING_MS) / speed);
    return () => {
      clearTimeout(toResolving);
      clearTimeout(toFinal);
    };
    // `speed` intentionally scales the settle beats too, so 2x speeds up the
    // whole journey rather than just the thinking half.
  }, [passesComplete, speed, scenarioId]);

  const phase: Level2RuntimePhase = isLoading || !scenario
    ? 'loading'
    : forcedFinal
      ? 'final'
      : settlePhase === 'none'
        ? 'thinking'
        : settlePhase;

  /* ── Derived pass state ────────────────────────────────────────────── */
  const currentScheduled = useMemo(() => {
    if (!scheduled.length) return undefined;
    if (phase !== 'thinking') return scheduled[scheduled.length - 1];
    // Latest pass that has started. Equivalent to the old window lookup on
    // the contiguous demo schedule, and on the actual-trace schedule it keeps
    // the current pass on screen through real idle gaps (and picks the
    // latest-started of genuinely overlapping parallel passes) rather than
    // skipping to the last pass.
    let current = scheduled[0];
    for (const s of scheduled) {
      if (elapsed >= s.start) current = s;
      else break;
    }
    return current;
  }, [scheduled, elapsed, phase]);

  const revealedPasses = useMemo(() => {
    if (phase !== 'thinking') return scheduled.map((s) => s.pass);
    return scheduled.filter((s) => elapsed >= s.start).map((s) => s.pass);
  }, [scheduled, elapsed, phase]);

  const passPhase = useMemo<'enter' | 'hold' | 'exit' | undefined>(() => {
    if (!currentScheduled || phase !== 'thinking') return undefined;
    if (elapsed < currentScheduled.enterEnd) return 'enter';
    if (elapsed < currentScheduled.holdEnd) return 'hold';
    return 'exit';
  }, [currentScheduled, elapsed, phase]);

  /* ── Candidate canvas fold ─────────────────────────────────────────── */
  const items = useMemo(() => {
    let out: ProgressiveItem[] = [];
    for (const pass of revealedPasses) {
      const payload = pass.payload as EntityPreviewPayload | undefined;
      if (!payload?.canvas) continue;
      for (const mutation of payload.canvas) out = applyMutation(out, mutation);
    }
    return out;
  }, [revealedPasses]);

  // Only once the answer has actually resolved, and only if the final
  // response names one. See the file header.
  const promotedId = phase === 'resolving' || phase === 'final' ? finalWinnerId(scenario) : undefined;

  /* ── Controls ──────────────────────────────────────────────────────── */
  const play = useCallback(() => {
    if (passesComplete) {
      setElapsed(0);
      setForcedFinal(false);
    }
    setIsPlaying(true);
  }, [passesComplete]);

  const pause = useCallback(() => setIsPlaying(false), []);

  const replay = useCallback(() => {
    setElapsed(0);
    setForcedFinal(false);
    setSettlePhase('none');
    setIsPlaying(true);
  }, []);

  const goToPass = useCallback(
    (index: number) => {
      if (!scheduled.length) return;
      const target = scheduled[Math.max(0, Math.min(index, scheduled.length - 1))];
      setForcedFinal(false);
      setElapsed(target.start);
    },
    [scheduled]
  );

  const nextPass = useCallback(() => {
    if (!currentScheduled) return;
    if (currentScheduled.index === scheduled.length - 1) setElapsed(total);
    else goToPass(currentScheduled.index + 1);
  }, [currentScheduled, goToPass, scheduled.length, total]);

  const prevPass = useCallback(() => {
    if (!currentScheduled) return;
    goToPass(currentScheduled.index - 1);
  }, [currentScheduled, goToPass]);

  const setSpeed = useCallback((s: number) => setSpeedState(s), []);

  const jumpToFinal = useCallback(() => {
    setElapsed(total);
    setIsPlaying(false);
    setForcedFinal(true);
  }, [total]);

  return {
    scenario,
    selectedArchetype,
    phase,
    revealedPasses,
    currentPass: currentScheduled?.pass,
    currentPassIndex: currentScheduled?.index ?? -1,
    passCount: scheduled.length,
    passPhase,
    items,
    promotedId,
    finalResponse: scenario?.finalResponse,
    elapsed,
    totalDuration: total,
    isPlaying,
    speed,
    timingMode: effectiveTimingMode,
    requestedTimingMode: timingMode,
    actualTimingAvailable: timingAvailable,
    traceDurationMs,
    maxIdleGapMs,
    schedule: scheduled,
    setTimingMode,
    setMaxIdleGapMs,
    play,
    pause,
    replay,
    nextPass,
    prevPass,
    goToPass,
    setSpeed,
    jumpToFinal,
  };
}
