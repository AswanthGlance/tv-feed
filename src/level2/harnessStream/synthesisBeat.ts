import type { SemanticAgentEvent } from '../../types/semanticEvent';
import type { QueryRequirements } from '../types/query';
import type { ScenarioClassification } from '../types/archetype';
import type { FinalResponseModel } from '../types/finalResponse';
import type { SynthesisStructurePayload, ThinkingPass } from '../types/pass';
import { phrase, STABLE_RNG, type Rng } from '../userValue/narrationVariety';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — The SYNTHESIS beat (generic archetypes only).

   A real gap exists in every harness turn between the last useful tool
   result and the model finishing the answer (text_final) — the agent is
   genuinely composing the response during that interval, but nothing
   represents it today, so in Real Timing mode it is dead air on whatever
   the last thinking pass happened to be.

   This is appended ONLY for the generic archetypes (structured_no_image,
   hybrid, text_only, single_entity, comparison, route_map, summary) —
   candidate_ranking and list already close on their own curated 'complete'
   beat and are untouched (see buildScenarioFromHarnessStream.ts).

   It carries NO sourceEventIds on purpose: the generic traceTiming-
   assignment loop in buildScenarioFromHarnessStream.ts only sets
   `traceTiming` for a pass whose sourceEventIds map to real events, so this
   pass stays unanchored — schedule.ts's existing behavior for unanchored
   passes (fill the window up to the real trace end) places it exactly in
   the real tail gap with zero new scheduling logic.

   Never reveals the final answer early — the payload is section/dimension
   LABELS already decided by the classified final response, never any of
   its content (see buildSynthesisPayload).
   ───────────────────────────────────────────────────────────────────────────── */

const MIN_SYNTHESIS_GAP_MS = 3000;

export interface BuildSynthesisBeatInput {
  events: SemanticAgentEvent[];
  requirements: QueryRequirements;
  classification: ScenarioClassification;
  finalResponse: FinalResponseModel;
  /** The user's real prompt — used only as a fallback keyword scan when
   *  `requirements.entityType` didn't extract a noun (queryRequirements.ts's
   *  extraction is pattern-based and doesn't catch every phrasing), so a
   *  recipe-shaped question still gets recipe-shaped synthesis narration. */
  prompt?: string;
  rng?: Rng;
}

function domainNarration(entityType: string | undefined, prompt: string | undefined, rng: Rng): string {
  const t = (entityType ?? prompt ?? '').toLowerCase();
  if (/recipe|dish|cook/.test(t)) {
    return phrase(['Turning the research into a step-by-step recipe', 'Shaping this into a clear recipe'], rng);
  }
  if (/stay|trip|itinerary|plan|hotel|resort/.test(t)) {
    return phrase(['Building the stay plan around these details', 'Putting the plan together around what matters'], rng);
  }
  if (/restaurant|cafe|bar|place/.test(t)) {
    return phrase(['Narrowing this into the most useful shortlist', 'Turning this into a useful shortlist'], rng);
  }
  if (/product|item|gadget/.test(t)) {
    return phrase(['Organizing the options around what matters most', 'Lining up the options that matter most'], rng);
  }
  if (/route|direction|way|drive/.test(t)) {
    return phrase(['Working out the best way there', 'Putting the route together'], rng);
  }
  return phrase(['Pulling the useful details into one clear answer', 'Bringing the details together into an answer'], rng);
}

/** Structure the final response already decided — LABELS only, never its
 *  content. Undefined when the archetype's shape has nothing label-like to
 *  preview (e.g. plain prose), in which case the beat stays narration-only. */
function buildSynthesisPayload(finalResponse: FinalResponseModel): SynthesisStructurePayload | undefined {
  if (finalResponse.kind === 'structured' && finalResponse.rows.length) {
    // `columns` is a generic table header ('Group'/'Item'/'Detail') for the
    // no-peer-entity case — the REAL section labels (e.g. "Base Batter",
    // "Preparation Steps") are each row's first cell (see
    // buildFinalResponse.ts's structuredTable: `[b.title ?? '—', ...]`).
    const labels = Array.from(new Set(finalResponse.rows.map((r) => r[0]).filter((v): v is string => !!v && v !== '—')));
    if (labels.length) return { sections: labels.slice(0, 6) };
  }
  if (finalResponse.kind === 'comparison' && finalResponse.comparison.dimensions.length) {
    return { sections: finalResponse.comparison.dimensions.map((d) => d.label).slice(0, 6) };
  }
  if (finalResponse.kind === 'route' && finalResponse.route.stops.length) {
    return { sections: finalResponse.route.stops.map((s) => s.label).slice(0, 6) };
  }
  if (finalResponse.kind === 'hybrid' && finalResponse.sections.length) {
    // Each section's own title (real, e.g. "Options"), plus — when a nested
    // section is itself a structured table — its real row labels too (e.g.
    // "From Jodhpur", "From Udaipur"). Recurses one level only; never
    // invents a section the trace didn't actually produce.
    const labels: string[] = [];
    for (const section of finalResponse.sections) {
      if (section.title) labels.push(section.title);
      if (section.response.kind === 'structured') {
        for (const row of section.response.rows) {
          if (row[0] && row[0] !== '—') labels.push(row[0]);
        }
      }
    }
    const unique = Array.from(new Set(labels));
    if (unique.length) return { sections: unique.slice(0, 6) };
  }
  return undefined;
}

/** Real, non-'internal' events — what the pass builders actually consume.
 *  The gap this beat represents is measured from the latest of THESE, not
 *  from bookkeeping events (token counts, skill tags) that can trail after
 *  the real work is done. */
function lastMeaningfulEnd(events: SemanticAgentEvent[]): number {
  const meaningful = events.filter((e) => e.type !== 'internal');
  return meaningful.length ? Math.max(...meaningful.map((e) => e.endTime)) : 0;
}

export function buildSynthesisBeat(input: BuildSynthesisBeatInput): ThinkingPass[] {
  const { events, requirements, finalResponse, prompt, rng = STABLE_RNG } = input;
  if (!events.length) return [];

  const traceEnd = Math.max(...events.map((e) => e.endTime));
  const gap = traceEnd - lastMeaningfulEnd(events);
  if (gap < MIN_SYNTHESIS_GAP_MS) return [];

  const payload = buildSynthesisPayload(finalResponse);

  return [
    {
      id: 'pass-synthesis',
      visibility: payload ? 'canvas_value' : 'status',
      narration: domainNarration(requirements.entityType, prompt, rng),
      valueType: payload ? 'synthesis_structure' : undefined,
      payload,
      confidence: 'high',
      enterDuration: 700,
      holdDuration: 2400,
      exitDuration: 300,
    },
  ];
}
