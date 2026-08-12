import type { AgentMutation } from '../types/progressiveValue';
import type { ExperiencePassDef, ScheduledPass } from '../types/experiencePass';

export interface ScheduledMutation {
  at: number;
  mutation: AgentMutation;
}

export interface PassSchedule {
  scheduledPasses: ScheduledPass[];
  mutations: ScheduledMutation[];
  totalDuration: number;
}

/** Pure function: lays a list of ExperiencePassDefs end-to-end on an
 *  absolute timeline and resolves every pass-relative PassMutation `at` into
 *  an absolute one. This is the ONLY place pass timing turns into a flat
 *  schedule — useProgressiveExperience just replays `mutations` by elapsed
 *  time and looks up the current pass from `scheduledPasses`, exactly like
 *  it did with a flat fixture before passes existed. */
export function buildPassSchedule(passes: ExperiencePassDef[]): PassSchedule {
  const scheduledPasses: ScheduledPass[] = [];
  const mutations: ScheduledMutation[] = [];
  let cursor = 0;

  passes.forEach((pass, index) => {
    const start = cursor;
    const enterEnd = start + pass.enterDuration;
    const holdEnd = enterEnd + pass.holdDuration;
    const end = holdEnd + pass.exitDuration;

    scheduledPasses.push({
      id: pass.id,
      stage: pass.stage,
      narration: pass.narration,
      index,
      start,
      enterEnd,
      holdEnd,
      end,
      insight: pass.insight,
    });

    pass.mutations.forEach((pm) => {
      mutations.push({ at: start + pm.at, mutation: pm.mutation });
    });

    cursor = end;
  });

  return { scheduledPasses, mutations, totalDuration: cursor };
}

/** Which pass elapsedTime currently falls in, and where within it (before
 *  the first pass or after the last, clamps to the nearest end). Returns
 *  undefined only when there are no passes at all. */
export function findCurrentPass(scheduledPasses: ScheduledPass[], elapsedTime: number): ScheduledPass | undefined {
  if (!scheduledPasses.length) return undefined;
  for (const pass of scheduledPasses) {
    if (elapsedTime < pass.end) return pass;
  }
  return scheduledPasses[scheduledPasses.length - 1];
}

export function passPhaseAt(pass: ScheduledPass, elapsedTime: number): 'enter' | 'hold' | 'exit' {
  if (elapsedTime < pass.enterEnd) return 'enter';
  if (elapsedTime < pass.holdEnd) return 'hold';
  return 'exit';
}
