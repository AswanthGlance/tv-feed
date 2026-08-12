import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ThinkingEvidence, ThinkingScenario, ThinkingStepStatus } from '../types/thinking';
import { normalizeDuration, type PlaybackMode } from '../utils/timing';

const DEMO_MAX_GAP_MS = 900;
const DEMO_OUTRO_MS = 900;

interface Segment {
  stepIndex: number;
  playStart: number;
  playEnd: number; // exclusive upper bound at which the NEXT step takes over
}

function buildSegments(scenario: ThinkingScenario, mode: PlaybackMode): { segments: Segment[]; total: number } {
  const segments: Segment[] = [];
  let cursor = 0;

  scenario.steps.forEach((step, i) => {
    const realDuration = Math.max(step.endTime - step.startTime, 0);
    const duration = normalizeDuration(realDuration, mode);
    const playStart = cursor;
    const stepEndsAt = playStart + duration;

    const next = scenario.steps[i + 1];
    const realGap = next ? Math.max(next.startTime - step.endTime, 0) : 0;
    const gap = mode === 'real' ? realGap : Math.min(realGap, DEMO_MAX_GAP_MS);

    const playEnd = i === scenario.steps.length - 1 ? stepEndsAt : stepEndsAt + gap;
    segments.push({ stepIndex: i, playStart, playEnd });
    cursor = playEnd;
  });

  const outro = mode === 'demo' && segments.length ? DEMO_OUTRO_MS : 0;
  return { segments, total: cursor + outro };
}

export interface TracePlaybackState {
  elapsedTime: number;
  totalDuration: number;
  activeStepIndex: number;
  stepStatuses: ThinkingStepStatus[];
  visibleEvidence: ThinkingEvidence[];
  isPlaying: boolean;
  isComplete: boolean;
  mode: PlaybackMode;
  speed: number;
  play: () => void;
  pause: () => void;
  restart: () => void;
  seek: (fraction: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setSpeed: (speed: number) => void;
  toggleMode: () => void;
}

export function useTracePlayback(scenario: ThinkingScenario | undefined): TracePlaybackState {
  const [mode, setMode] = useState<PlaybackMode>('demo');
  const [speed, setSpeedState] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);

  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);

  const { segments, total } = useMemo(
    () => (scenario ? buildSegments(scenario, mode) : { segments: [], total: 0 }),
    [scenario, mode]
  );

  // A genuinely new trace (different traceId — new scenario, new matched
  // trace) hard-resets to 0. Same trace, different mode/speed re-maps
  // elapsed proportionally so scrubbing position stays roughly stable
  // instead of snapping to 0 on every toggle.
  const prevTotalRef = useRef(total);
  const prevTraceIdRef = useRef(scenario?.traceId);
  useEffect(() => {
    const isNewTrace = scenario?.traceId !== prevTraceIdRef.current;
    prevTraceIdRef.current = scenario?.traceId;

    setElapsedTime((prev) => {
      const prevTotal = prevTotalRef.current;
      prevTotalRef.current = total;
      if (isNewTrace || prevTotal <= 0 || total <= 0) return 0;
      const fraction = prev / prevTotal;
      return Math.min(fraction * total, total);
    });

    if (isNewTrace) setIsPlaying(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, scenario?.traceId]);

  useEffect(() => {
    if (!isPlaying || total <= 0) {
      lastTickRef.current = null;
      return;
    }

    const tick = (now: number) => {
      if (lastTickRef.current == null) lastTickRef.current = now;
      const delta = (now - lastTickRef.current) * speed;
      lastTickRef.current = now;

      setElapsedTime((prev) => {
        const next = prev + delta;
        if (next >= total) return total;
        return next;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      lastTickRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, speed, total]);

  const isComplete = total > 0 && elapsedTime >= total;

  useEffect(() => {
    if (isComplete) setIsPlaying(false);
  }, [isComplete]);

  const activeStepIndex = useMemo(() => {
    if (!segments.length) return -1;
    for (let i = 0; i < segments.length; i++) {
      if (elapsedTime < segments[i].playEnd || i === segments.length - 1) return i;
    }
    return segments.length - 1;
  }, [segments, elapsedTime]);

  const stepStatuses = useMemo<ThinkingStepStatus[]>(() => {
    if (!scenario) return [];
    return scenario.steps.map((_, i) => {
      if (i < activeStepIndex) return 'complete';
      if (i === activeStepIndex) return 'active';
      return 'pending';
    });
  }, [scenario, activeStepIndex]);

  const visibleEvidence = useMemo(() => {
    if (!scenario) return [];
    const out: ThinkingEvidence[] = [];
    scenario.steps.forEach((step, i) => {
      if (i <= activeStepIndex) out.push(...step.evidence);
    });
    return out;
  }, [scenario, activeStepIndex]);

  const play = useCallback(() => {
    if (isComplete) setElapsedTime(0);
    setIsPlaying(true);
  }, [isComplete]);
  const pause = useCallback(() => setIsPlaying(false), []);
  const restart = useCallback(() => {
    setElapsedTime(0);
    setIsPlaying(true);
  }, []);
  const seek = useCallback(
    (fraction: number) => {
      setElapsedTime(Math.max(0, Math.min(1, fraction)) * total);
    },
    [total]
  );
  const nextStep = useCallback(() => {
    const target = segments[activeStepIndex + 1];
    if (target) setElapsedTime(target.playStart);
    else setElapsedTime(total);
  }, [segments, activeStepIndex, total]);
  const prevStep = useCallback(() => {
    const target = segments[Math.max(activeStepIndex - 1, 0)];
    setElapsedTime(target ? target.playStart : 0);
  }, [segments, activeStepIndex]);
  const setSpeed = useCallback((s: number) => setSpeedState(s), []);
  const toggleMode = useCallback(() => setMode((m) => (m === 'real' ? 'demo' : 'real')), []);

  return {
    elapsedTime,
    totalDuration: total,
    activeStepIndex,
    stepStatuses,
    visibleEvidence,
    isPlaying,
    isComplete,
    mode,
    speed,
    play,
    pause,
    restart,
    seek,
    nextStep,
    prevStep,
    setSpeed,
    toggleMode,
  };
}
