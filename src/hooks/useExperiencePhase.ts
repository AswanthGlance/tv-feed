import { useCallback, useEffect, useRef, useState } from 'react';

export type ExperiencePhase = 'loading' | 'thinking' | 'resolving' | 'result';

const RESOLVING_MS = 850;

/** Owns the overall loading -> thinking -> resolving -> result state machine.
 *  All timing lives here (not scattered setTimeouts inside visual
 *  components) — components just read `phase`. `resetKey` (the scenario id)
 *  forces back to 'loading' whenever the scenario changes ("N"), even if
 *  we'd already reached 'result' for the previous one. */
export function useExperiencePhase(isLoading: boolean, isPlaybackComplete: boolean, resetKey: string) {
  const [phase, setPhase] = useState<ExperiencePhase>('loading');
  const resolvingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevResetKey = useRef(resetKey);

  useEffect(() => {
    if (resetKey !== prevResetKey.current) {
      prevResetKey.current = resetKey;
      setPhase('loading');
    }
  }, [resetKey]);

  useEffect(() => {
    if (!isLoading && phase === 'loading') setPhase('thinking');
  }, [isLoading, phase]);

  useEffect(() => {
    if (phase !== 'thinking' || !isPlaybackComplete) return;
    resolvingTimer.current = setTimeout(() => setPhase('resolving'), 300);
    return () => {
      if (resolvingTimer.current) clearTimeout(resolvingTimer.current);
    };
  }, [phase, isPlaybackComplete]);

  useEffect(() => {
    if (phase !== 'resolving') return;
    const t = setTimeout(() => setPhase('result'), RESOLVING_MS);
    return () => clearTimeout(t);
  }, [phase]);

  const backToThinking = useCallback(() => setPhase('thinking'), []);
  const jumpToResult = useCallback(() => setPhase('result'), []);

  return { phase, backToThinking, jumpToResult };
}
