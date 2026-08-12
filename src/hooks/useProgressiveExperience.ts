import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AgentMutation, ProgressiveItem } from '../types/progressiveValue';
import type { AgentNarration, ProgressiveJourney, ScheduledPass, PassPhase } from '../types/experiencePass';
import { buildPassSchedule, findCurrentPass, passPhaseAt } from '../utils/experiencePassSchedule';

function applyMutation(items: ProgressiveItem[], m: AgentMutation): ProgressiveItem[] {
  switch (m.type) {
    case 'ADD_ITEMS':
      return [...items, ...m.items];

    case 'ENRICH_ITEMS': {
      const patchMap = new Map(m.patches.map((p) => [p.id, p.data]));
      return items.map((it) => {
        const patch = patchMap.get(it.id);
        if (!patch) return it;
        // A bare-card enrichment (travel time, etc.) just fills in what was
        // missing. State only ever advances via an explicit mutation
        // (SHORTLIST_ITEMS / PROMOTE_ITEM / NEGATE_ITEMS) — enrichment
        // itself never silently promotes a card's tier.
        const nextState = it.state === 'discovered' ? 'enriched' : it.state;
        return { ...it, metadata: { ...it.metadata, ...patch }, state: nextState };
      });
    }

    case 'ADD_EVIDENCE': {
      const evidenceMap = new Map(m.patches.map((p) => [p.id, p.evidence]));
      return items.map((it) => {
        const evidence = evidenceMap.get(it.id);
        if (!evidence) return it;
        return { ...it, metadata: { ...it.metadata, evidence } };
      });
    }

    case 'UPDATE_JUDGMENT': {
      const judgmentMap = new Map(m.patches.map((p) => [p.id, p.judgment]));
      return items.map((it) => {
        const judgment = judgmentMap.get(it.id);
        if (!judgment) return it;
        return { ...it, metadata: { ...it.metadata, judgment } };
      });
    }

    case 'REORDER_ITEMS': {
      const order = new Map(m.orderedIds.map((id, i) => [id, i]));
      return [...items].sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
    }

    case 'NEGATE_ITEMS': {
      const reasonMap = new Map(m.items.map((i) => [i.id, i.reason]));
      return items.map((it) => {
        const reason = reasonMap.get(it.id);
        if (!reason) return it;
        return { ...it, state: 'negated', metadata: { ...it.metadata, negationReason: reason } };
      });
    }

    case 'SHORTLIST_ITEMS':
      return items.map((it) => (m.ids.includes(it.id) ? { ...it, state: 'shortlisted' } : it));

    case 'REMOVE_ITEMS':
      return items.map((it) => (m.ids.includes(it.id) ? { ...it, state: 'removed' } : it));

    case 'PROMOTE_ITEM':
      return items.map((it) => (it.id === m.id ? { ...it, state: 'promoted' } : it));

    case 'RESOLVE_RESULT':
      return items;
  }
}

export interface ProgressiveExperienceState {
  elapsedTime: number;
  totalDuration: number;
  isPlaying: boolean;
  isComplete: boolean;
  speed: number;
  items: ProgressiveItem[];
  /** The current pass's single narration line — WHAT the agent is doing
   *  right now. Undefined only before the first pass has started. */
  narration?: AgentNarration;
  /** A short, DISCOVERED insight — only present once the current pass's
   *  insight offset has actually been reached, so it appears partway
   *  through a hold, not from the pass's very start. */
  insightText?: string;
  promotedId?: string;
  removedIds: string[];
  appliedMutationCount: number;
  lastMutation?: AgentMutation;
  // ── pass debugging / dev-panel state ──────────────────────────────────
  currentPass?: ScheduledPass;
  passPhase?: PassPhase;
  passElapsed: number;
  passRemaining: number;
  passCount: number;
  play: () => void;
  pause: () => void;
  restart: () => void;
  setSpeed: (speed: number) => void;
  goToPass: (index: number) => void;
  nextPass: () => void;
  prevPass: () => void;
}

/** Level 2's state engine — a raf-driven elapsed-time clock (same shape as
 *  useTracePlayback) that replays a ProgressiveJourney's passes. Each pass's
 *  mutations are pre-flattened onto an absolute timeline by
 *  buildPassSchedule() once per journey; the engine just folds whichever
 *  mutations have `at <= elapsedTime` into a running item list, and looks up
 *  which pass (and enter/hold/exit phase within it) elapsedTime falls in.
 *  Narration and insight are read directly off that current pass — they're
 *  pass-level content, not something folded from a mutation stream.
 *  Components never own their own timers or pass-advance logic. */
export function useProgressiveExperience(journey: ProgressiveJourney | undefined): ProgressiveExperienceState {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeedState] = useState(1);

  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);

  const schedule = useMemo(() => buildPassSchedule(journey?.passes ?? []), [journey]);
  const { mutations, scheduledPasses, totalDuration: total } = schedule;

  const identityKey = journey?.traceId ?? journey?.query;
  const prevIdentityRef = useRef(identityKey);
  useEffect(() => {
    if (identityKey !== prevIdentityRef.current) {
      prevIdentityRef.current = identityKey;
      setElapsedTime(0);
      setIsPlaying(true);
    }
  }, [identityKey]);

  useEffect(() => {
    if (!isPlaying || total <= 0) {
      lastTickRef.current = null;
      return;
    }

    const tick = (now: number) => {
      if (lastTickRef.current == null) lastTickRef.current = now;
      const delta = (now - lastTickRef.current) * speed;
      lastTickRef.current = now;

      setElapsedTime((prev) => Math.min(prev + delta, total));
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      lastTickRef.current = null;
    };
  }, [isPlaying, total, speed]);

  const isComplete = total > 0 && elapsedTime >= total;
  useEffect(() => {
    if (isComplete) setIsPlaying(false);
  }, [isComplete]);

  const applied = useMemo(() => mutations.filter((m) => m.at <= elapsedTime), [mutations, elapsedTime]);

  const derived = useMemo(() => {
    let items: ProgressiveItem[] = [];
    let lastMutation: AgentMutation | undefined;
    for (const { mutation } of applied) {
      items = applyMutation(items, mutation);
      lastMutation = mutation;
    }
    const promoted = items.find((it) => it.state === 'promoted');
    const removedIds = items.filter((it) => it.state === 'removed').map((it) => it.id);
    return { items, promotedId: promoted?.id, removedIds, lastMutation };
  }, [applied]);

  const currentPass = useMemo(() => findCurrentPass(scheduledPasses, elapsedTime), [scheduledPasses, elapsedTime]);
  const passPhase = currentPass ? passPhaseAt(currentPass, elapsedTime - currentPass.start) : undefined;
  const passElapsed = currentPass ? elapsedTime - currentPass.start : 0;
  const passRemaining = currentPass ? Math.max(currentPass.end - elapsedTime, 0) : 0;
  const insightText =
    currentPass?.insight && passElapsed >= currentPass.insight.at ? currentPass.insight.text : undefined;

  const play = useCallback(() => {
    if (isComplete) setElapsedTime(0);
    setIsPlaying(true);
  }, [isComplete]);
  const pause = useCallback(() => setIsPlaying(false), []);
  const restart = useCallback(() => {
    setElapsedTime(0);
    setIsPlaying(true);
  }, []);
  const setSpeed = useCallback((s: number) => setSpeedState(s), []);
  const goToPass = useCallback(
    (index: number) => {
      const target = scheduledPasses[Math.max(0, Math.min(index, scheduledPasses.length - 1))];
      if (target) setElapsedTime(target.start);
    },
    [scheduledPasses]
  );
  const nextPass = useCallback(() => {
    if (currentPass) goToPass(currentPass.index + 1);
  }, [currentPass, goToPass]);
  const prevPass = useCallback(() => {
    if (currentPass) goToPass(currentPass.index - 1);
  }, [currentPass, goToPass]);

  return {
    elapsedTime,
    totalDuration: total,
    isPlaying,
    isComplete,
    speed,
    appliedMutationCount: applied.length,
    narration: currentPass?.narration,
    insightText,
    currentPass,
    passPhase,
    passElapsed,
    passRemaining,
    passCount: scheduledPasses.length,
    play,
    pause,
    restart,
    setSpeed,
    goToPass,
    nextPass,
    prevPass,
    ...derived,
  };
}
