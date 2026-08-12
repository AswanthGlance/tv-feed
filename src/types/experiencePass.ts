import type { AgentMutation } from './progressiveValue';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Experience Pass timeline.

   Level 2's story is not "eight slides" — it's ONE continuously evolving
   canvas moving through seven meaningful, individually-readable states
   (a "pass"). Each pass is explicit about its own pacing so timing lives in
   one place (this data), not scattered setTimeouts across components:

     ENTER  — the mutation(s) for this pass animate onto the canvas
     HOLD   — nothing new happens; the viewer has time to read and understand
     EXIT   — a brief settle beat before the next pass's enter begins

   A pass's `mutations` are scheduled relative to the pass's OWN start (not
   the whole timeline) — see src/utils/experiencePassSchedule.ts, which
   flattens an ExperiencePassDef[] into the absolute-time mutation list
   useProgressiveExperience actually replays, plus the pass boundaries used
   to answer "which pass are we in, and are we entering/holding/exiting it."
   ───────────────────────────────────────────────────────────────────────────── */

export type PassStage =
  | 'discover'
  | 'enrich'
  | 'compare'
  | 'negate'
  | 'shortlist'
  | 'promote'
  | 'resolve';

export type PassPhase = 'enter' | 'hold' | 'exit';

/** Consumer-facing category for whatever the agent is doing right now —
 *  loosely mirrors the eventual Phoenix tool/span mapping (see
 *  src/adapters/phoenixToMutations.ts) without ever surfacing raw Phoenix
 *  terminology in the UI. Drives which small icon sits next to the
 *  narration line — a subtle "the agent switched capabilities" cue, not a
 *  developer trace visualization. */
export type AgentActionType =
  | 'search'
  | 'maps'
  | 'retrieve'
  | 'compare'
  | 'filter'
  | 'rank'
  | 'synthesize'
  | 'resolve';

/** The ONE narration line for a pass — what the agent is doing, in plain
 *  language. This is the single primary text describing the current
 *  operation; there is deliberately no second "explanatory subtitle" line
 *  anymore (see AgentNarrationLine.tsx). */
export interface AgentNarration {
  type: AgentActionType;
  text: string;
}

/** A short, DISCOVERED-not-explanatory insight — appears partway through a
 *  pass's hold (once the visual mutation has already settled and the
 *  viewer has had a moment with the raw evidence), not from the pass's very
 *  start. Only declared on passes where the agent has actually reached a
 *  new conclusion; most passes have none. */
export interface PassInsight {
  /** ms offset from the START of this pass at which the insight appears. */
  at: number;
  text: string;
}

export interface PassMutation {
  /** ms offset from the START of this pass (not the whole timeline).
   *  Should land within `enterDuration` — that's the window meant for new
   *  information to visibly arrive; everything after is HOLD. */
  at: number;
  mutation: AgentMutation;
}

export interface ExperiencePassDef {
  id: string;
  stage: PassStage;
  narration: AgentNarration;
  enterDuration: number;
  holdDuration: number;
  exitDuration: number;
  mutations: PassMutation[];
  insight?: PassInsight;
}

/** A pass placed on the absolute timeline, with its enter/hold/exit
 *  boundaries resolved to real elapsed-time offsets — what the engine and
 *  dev panel actually compare `elapsedTime` against. */
export interface ScheduledPass {
  id: string;
  stage: PassStage;
  narration: AgentNarration;
  index: number;
  start: number;
  enterEnd: number;
  holdEnd: number;
  end: number;
  insight?: PassInsight;
}

export interface ProgressiveJourney {
  /** Present once this is driven by a real Phoenix trace; undefined for a
   *  hand-authored pass timeline. */
  traceId?: string;
  query: string;
  passes: ExperiencePassDef[];
}
