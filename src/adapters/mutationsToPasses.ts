import type { AgentNarration, ExperiencePassDef, ProgressiveJourney } from '../types/experiencePass';
import type { PassStage } from '../types/experiencePass';
import type { TimedMutation } from './phoenixToMutations';

/* ─────────────────────────────────────────────────────────────────────────────
   AgentMutation[] (real event order + real timestamps) -> ExperiencePassDef[]
   (the same pass-timeline shape Level2Experience/useProgressiveExperience
   already consume from the hand-authored fixture).

   PRESENTATION TIMING NORMALIZATION: real Phoenix tool calls can be
   milliseconds or many seconds apart — far too irregular to replay 1:1 and
   still read as a paced experience. This is "DEMO NORMALIZED TIMING" (see
   the task brief): real ORDER and real CONTENT are preserved exactly (which
   stage a mutation lands in, and in what sequence within it), but the
   enter/hold/exit durations are fixed, readable constants — the same
   magnitudes the hand-authored fixture already uses — rather than the raw
   inter-event gaps. "REAL TRACE TIMING" (replaying the actual gaps) is not
   wired to a UI toggle yet; each mutation still carries its real trace-
   relative `at` (see TimedMutation) for that mode to be added later without
   re-deriving anything.
   ───────────────────────────────────────────────────────────────────────────── */

const STAGE_ORDER: PassStage[] = ['discover', 'enrich', 'compare', 'negate', 'shortlist', 'promote', 'resolve'];

const STAGE_TIMING: Record<PassStage, { enter: number; hold: number; exit: number }> = {
  discover: { enter: 1000, hold: 3000, exit: 250 },
  enrich: { enter: 700, hold: 3200, exit: 250 },
  compare: { enter: 800, hold: 3600, exit: 250 },
  negate: { enter: 600, hold: 2400, exit: 250 },
  shortlist: { enter: 700, hold: 3200, exit: 250 },
  promote: { enter: 800, hold: 3200, exit: 350 },
  resolve: { enter: 700, hold: 2200, exit: 400 },
};

const STAGE_ACTION_TYPE: Record<PassStage, AgentNarration['type']> = {
  discover: 'search',
  enrich: 'maps',
  compare: 'compare',
  negate: 'filter',
  shortlist: 'rank',
  promote: 'synthesize',
  resolve: 'resolve',
};

const STAGE_FALLBACK_NARRATION: Record<PassStage, string> = {
  discover: 'Searching for options',
  enrich: 'Gathering more detail',
  compare: 'Comparing what it found',
  negate: 'Setting aside weaker options',
  shortlist: 'Narrowing to the strongest options',
  promote: 'One option is emerging as the strongest fit',
  resolve: 'Wrapping up a recommendation',
};

/** Groups a real, chronologically-ordered mutation list into one
 *  ExperiencePassDef per stage that actually has mutations — stages with no
 *  real evidence are simply absent, and useProgressiveExperience/
 *  Level2Experience already handle a shorter-than-fixture pass list (they
 *  iterate whatever passes exist). */
export function mutationsToPasses(
  timedMutations: TimedMutation[],
  query: string,
  traceId?: string
): ProgressiveJourney {
  const byStage = new Map<PassStage, TimedMutation[]>();
  for (const tm of timedMutations) {
    if (!byStage.has(tm.stage)) byStage.set(tm.stage, []);
    byStage.get(tm.stage)!.push(tm);
  }

  // Grounded insight for the COMPARE pass: the real <why> text behind
  // whichever candidate ends up promoted, if the trace has one — appears
  // partway through the hold, same "discovered mid-read" placement the
  // fixture uses, never fabricated.
  const promoteMutation = byStage.get('promote')?.find((tm) => tm.mutation.type === 'PROMOTE_ITEM');
  const promotedId = promoteMutation && promoteMutation.mutation.type === 'PROMOTE_ITEM' ? promoteMutation.mutation.id : undefined;
  const compareInsightText = promotedId
    ? byStage
        .get('compare')
        ?.find((tm) => tm.mutation.type === 'ADD_EVIDENCE' && tm.mutation.patches.some((p) => p.id === promotedId))
        ?.mutation
    : undefined;
  const compareInsight =
    compareInsightText?.type === 'ADD_EVIDENCE' ? compareInsightText.patches.find((p) => p.id === promotedId)?.evidence[0] : undefined;

  const passes: ExperiencePassDef[] = [];

  for (const stage of STAGE_ORDER) {
    const items = byStage.get(stage);
    if (!items || !items.length) continue;

    const timing = STAGE_TIMING[stage];
    const narrationText = items.find((tm) => tm.narration)?.narration ?? STAGE_FALLBACK_NARRATION[stage];

    passes.push({
      id: stage,
      stage,
      narration: { type: STAGE_ACTION_TYPE[stage], text: narrationText },
      enterDuration: timing.enter,
      holdDuration: timing.hold,
      exitDuration: timing.exit,
      mutations: items.map((tm, i) => ({
        at: Math.min(i * 150, Math.max(timing.enter - 50, 0)),
        mutation: tm.mutation,
      })),
      insight: stage === 'compare' && compareInsight ? { at: Math.round(timing.hold * 0.7), text: compareInsight } : undefined,
    });
  }

  return { traceId, query, passes };
}
