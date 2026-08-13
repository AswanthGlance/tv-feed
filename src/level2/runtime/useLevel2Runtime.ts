import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AgentMutation, ProgressiveItem } from '../../types/progressiveValue';
import type { ScenarioArchetype } from '../types/archetype';
import type { EntityPreviewPayload, ThinkingPass } from '../types/pass';
import type { Level2Scenario } from '../types/scenario';
import type { Level2RuntimePhase, Level2RuntimeState, ScheduledThinkingPass } from '../types/runtime';
import { passDuration } from '../types/pass';

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

function schedulePasses(passes: ThinkingPass[]): { scheduled: ScheduledThinkingPass[]; total: number } {
  const scheduled: ScheduledThinkingPass[] = [];
  let cursor = 0;
  passes.forEach((pass, index) => {
    const start = cursor;
    const enterEnd = start + pass.enterDuration;
    const holdEnd = enterEnd + pass.holdDuration;
    const end = holdEnd + pass.exitDuration;
    scheduled.push({ pass, index, start, enterEnd, holdEnd, end });
    cursor = end;
  });
  return { scheduled, total: cursor };
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
  selectedArchetype: ScenarioArchetype,
  isLoading: boolean
): Level2RuntimeState {
  const [elapsed, setElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeedState] = useState(1);
  /** Set by jumpToFinal so the phase machine can be driven past the clock. */
  const [forcedFinal, setForcedFinal] = useState(false);

  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);

  const { scheduled, total } = useMemo(() => schedulePasses(scenario?.thinkingPasses ?? []), [scenario]);

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
    return scheduled.find((s) => elapsed >= s.start && elapsed < s.end) ?? scheduled[scheduled.length - 1];
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
