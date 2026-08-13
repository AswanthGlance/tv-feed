import type { ProgressiveItem } from '../../types/progressiveValue';
import type { ScenarioArchetype } from './archetype';
import type { FinalResponseModel } from './finalResponse';
import type { Level2Scenario } from './scenario';
import type { ThinkingPass } from './pass';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Runtime contract.

   THINKING -> CONSOLIDATING -> RESOLVING -> FINAL is an explicit state
   machine owned here, not an animation detail owned by a component. The UI
   gets a phase and decides what it looks like; it never has to infer "are we
   done yet" from timers of its own.

     thinking       passes are playing; partial, evolving context on screen
     consolidating  passes are done; the working view gathers itself
     resolving      the final response model is being handed over
     final          the complete, stable, actionable answer is on screen

   There is no route/page change anywhere in that sequence.
   ───────────────────────────────────────────────────────────────────────────── */

export type Level2RuntimePhase = 'loading' | 'thinking' | 'consolidating' | 'resolving' | 'final';

export const PLAYBACK_SPEEDS = [0.5, 1, 1.5, 2] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

/** A pass placed on the absolute presentation timeline. */
export interface ScheduledThinkingPass {
  pass: ThinkingPass;
  index: number;
  start: number;
  enterEnd: number;
  holdEnd: number;
  end: number;
}

export interface Level2RuntimeState {
  scenario?: Level2Scenario;
  selectedArchetype: ScenarioArchetype;

  phase: Level2RuntimePhase;

  /** Every pass up to and including the current one — a renderer that wants
   *  to keep earlier context on screen has it, one that wants only the
   *  current pass reads `currentPass`. */
  revealedPasses: ThinkingPass[];
  currentPass?: ThinkingPass;
  currentPassIndex: number;
  passCount: number;
  passPhase?: 'enter' | 'hold' | 'exit';

  /** Folded candidate-canvas state for archetypes whose passes carry canvas
   *  mutations (candidate_ranking, and any hybrid section that uses them).
   *  Empty for archetypes that don't. */
  items: ProgressiveItem[];
  promotedId?: string;

  finalResponse?: FinalResponseModel;

  elapsed: number;
  totalDuration: number;
  isPlaying: boolean;
  speed: number;

  // ── playback controls ─────────────────────────────────────────────────
  play: () => void;
  pause: () => void;
  replay: () => void;
  nextPass: () => void;
  prevPass: () => void;
  goToPass: (index: number) => void;
  setSpeed: (speed: number) => void;
  jumpToFinal: () => void;
}
