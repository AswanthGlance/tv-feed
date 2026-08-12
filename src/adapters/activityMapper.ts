import type { PhoenixSpan } from '../types/phoenix';
import type { ThinkingStep, ThinkingStepType } from '../types/thinking';
import { safeSpanEnd, safeSpanStart } from '../utils/timing';
import { asString } from '../utils/safeJson';
import {
  buildPlacePhotoIndex,
  extractEvidenceForToolSpans,
  extractFinalResponseEvidence,
} from './evidenceExtractor';

/* ─────────────────────────────────────────────────────────────────────────────
   Grouping key: finer-grained than ThinkingStepType so that e.g. "checking
   drive times" and "checking reviews" stay separate steps even though both
   map to the 'checking' consumer-facing type. Consecutive children sharing a
   groupKey collapse into one step (see groupChildrenIntoSteps) — this is what
   turns a real sequence like
     PlaceSearch, llm.call, GetRoute, llm.call, PlaceReviews, PlaceReviews, llm.call
   into 4 steps instead of 7.
   ───────────────────────────────────────────────────────────────────────────── */
type GroupKey =
  | 'recalling'
  | 'understanding'
  | 'searching'
  | 'route'
  | 'reviewing'
  | 'weather'
  | 'researching'
  | 'visual-generating'
  | 'comparing'
  | 'checking-other'
  | 'guardrail'
  | 'generating'
  | '__skip__';

const GROUP_TO_STEP_TYPE: Record<GroupKey, ThinkingStepType> = {
  recalling: 'retrieving',
  understanding: 'understanding',
  searching: 'searching',
  route: 'checking',
  reviewing: 'checking',
  weather: 'checking',
  researching: 'searching',
  'visual-generating': 'generating',
  comparing: 'comparing',
  'checking-other': 'checking',
  guardrail: 'guardrail',
  generating: 'generating',
  __skip__: 'tool',
};

function toolNameOf(span: PhoenixSpan): string {
  return asString(span.attributes?.['tool.name']) ?? span.name.replace(/^tool\./, '');
}

/** Real tool names observed on aitv-mewtwo-harness: PlaceSearch, NearbyPlaces,
 *  PlaceDetails, PlaceReviews, GetRoute, GetWeather, WebSearch, WebFetch,
 *  VTONGenerate. Anything else falls back to a generic "checking" bucket
 *  rather than being dropped, so future tools still render as *something*. */
function mapToolCategory(toolName: string): GroupKey {
  switch (toolName) {
    case 'PlaceSearch':
    case 'NearbyPlaces':
      return 'searching';
    case 'GetRoute':
      return 'route';
    case 'PlaceDetails':
    case 'PlaceReviews':
      return 'reviewing';
    case 'GetWeather':
      return 'weather';
    case 'WebSearch':
    case 'WebFetch':
      return 'researching';
    case 'VTONGenerate':
      return 'visual-generating';
    default:
      return 'checking-other';
  }
}

const GUARDRAIL_MIN_VISIBLE_MS = 1500;

function classifyChild(span: PhoenixSpan, isFirst: boolean, isLastLlmCall: boolean): GroupKey {
  if (span.name === 'memory.retrieval') return 'recalling';

  if (span.span_kind === 'RETRIEVER') {
    // Other RETRIEVER-kind spans exist (e.g. visual.resolve, observed
    // trailing the final llm.call — it resolves photo references for the
    // response, not a memory lookup) that aren't a distinct consumer-facing
    // activity. Fold into whichever step they're adjacent to rather than
    // mislabeling them as "recalling your preferences".
    return '__skip__';
  }

  if (span.span_kind === 'LLM') {
    if (isLastLlmCall) return 'generating';
    if (isFirst) return 'understanding';
    // Intermediate planning/reasoning calls between tool calls: not shown as
    // their own step (that would leak raw chain-of-thought); folded into
    // whichever real step follows.
    return '__skip__';
  }

  if (span.span_kind === 'TOOL') return mapToolCategory(toolNameOf(span));

  // Speculative span_kinds from the Phoenix docs that don't exist in any
  // trace inspected so far (GUARDRAIL, RERANKER, EVALUATOR, EMBEDDING,
  // AGENT) — handled defensively so instrumentation additions don't crash
  // or silently vanish from the timeline.
  if (span.span_kind === 'GUARDRAIL') {
    const dur = safeSpanEnd(span) - safeSpanStart(span);
    return dur >= GUARDRAIL_MIN_VISIBLE_MS ? 'guardrail' : '__skip__';
  }
  if (span.span_kind === 'RERANKER' || span.span_kind === 'EVALUATOR') return 'comparing';
  if (span.span_kind === 'EMBEDDING') return '__skip__';

  return '__skip__';
}

interface Unit {
  key: GroupKey;
  spans: PhoenixSpan[];
}

function groupChildrenIntoUnits(children: PhoenixSpan[]): Unit[] {
  const lastLlmIndex = [...children].map((s) => s.span_kind === 'LLM').lastIndexOf(true);
  const units: Unit[] = [];
  let pending: PhoenixSpan[] = [];

  children.forEach((span, i) => {
    const key = classifyChild(span, i === 0, i === lastLlmIndex);
    if (key === '__skip__') {
      pending.push(span);
      return;
    }
    units.push({ key, spans: [...pending, span] });
    pending = [];
  });

  // Trailing skipped spans with nothing after them (shouldn't normally
  // happen since the final llm.call is always classified 'generating', but
  // guards against an unusual trace shape) get folded onto the last unit.
  if (pending.length && units.length) {
    units[units.length - 1].spans.push(...pending);
  }

  return units;
}

function mergeRunLength(units: Unit[]): Unit[] {
  const merged: Unit[] = [];
  for (const unit of units) {
    const last = merged[merged.length - 1];
    if (last && last.key === unit.key) {
      last.spans.push(...unit.spans);
    } else {
      merged.push({ key: unit.key, spans: [...unit.spans] });
    }
  }
  return merged;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Label banks — per skill (turn.skills_selected), per group. Falls back to
   'default' when the skill has no tailored copy, or when skill is unknown.
   Keep additions here in sync with real skill_selector.all_scores keys seen
   on the harness: events, fashion, food, home_decor, local_experiences,
   sports, travel, weather_planner.
   ───────────────────────────────────────────────────────────────────────────── */
const LABELS: Partial<Record<GroupKey, Record<string, string>>> = {
  recalling: { default: 'Recalling your preferences' },
  understanding: { default: 'Understanding your request' },
  searching: {
    travel: 'Exploring nearby escapes',
    food: 'Finding nearby restaurants',
    local_experiences: 'Finding nearby spots',
    home_decor: 'Finding matching pieces',
    fashion: 'Finding matching products',
    default: 'Searching nearby options',
  },
  route: { default: 'Checking drive times' },
  reviewing: {
    travel: 'Shortlisting the best',
    food: 'Checking ratings and reviews',
    default: 'Checking ratings and reviews',
  },
  weather: { default: 'Checking the weather' },
  researching: {
    food: 'Looking up the details',
    default: 'Searching the web',
  },
  'visual-generating': {
    fashion: 'Creating your look',
    default: 'Generating visuals',
  },
  comparing: { default: 'Comparing the options' },
  'checking-other': { default: 'Checking the details' },
  guardrail: { default: 'Reviewing for safety' },
  generating: {
    travel: 'Comparing stays & experiences',
    food: 'Comparing the best options',
    fashion: 'Narrowing down the best options',
    default: 'Putting it all together',
  },
};

function pickLabel(key: GroupKey, skill: string | undefined): string {
  const bank = LABELS[key];
  if (!bank) return 'Working on it';
  return (skill && bank[skill]) || bank.default;
}

const HEADLINES: Record<string, string> = {
  travel: 'Finding great stays and experiences for your weekend...',
  food: 'Finding great bites nearby...',
  fashion: 'Finding pieces that match your style...',
  home_decor: 'Finding pieces that fit your space...',
  local_experiences: 'Finding things worth doing nearby...',
  events: 'Finding events worth going to...',
  sports: 'Getting the latest on your game...',
  weather_planner: 'Checking the forecast for your plans...',
};

export function buildActiveHeadline(skill: string | undefined, request: string | undefined): string {
  if (skill && HEADLINES[skill]) return HEADLINES[skill];
  if (request) {
    const trimmed = request.trim();
    const short = trimmed.length > 60 ? `${trimmed.slice(0, 57)}...` : trimmed;
    return `Working on: ${short}`;
  }
  return 'Putting together your answer...';
}

let stepSeq = 0;
function nextStepId() {
  stepSeq += 1;
  return `step-${stepSeq}`;
}

export interface BuildStepsOptions {
  skill?: string;
  finalOutputValue?: string;
  headline: string;
}

/** Turns harness.turn's direct children into the consumer-facing timeline.
 *  `allToolSpans` (every TOOL span in the trace, not just this step's) is
 *  used to build the place_id -> photo cross-reference for the curated
 *  final-response evidence. */
export function buildThinkingSteps(
  children: PhoenixSpan[],
  allToolSpans: PhoenixSpan[],
  options: BuildStepsOptions
): ThinkingStep[] {
  const units = mergeRunLength(groupChildrenIntoUnits(children));
  const photoIndex = buildPlacePhotoIndex(allToolSpans);

  return units.map((unit): ThinkingStep => {
    const spans = unit.spans;
    const start = Math.min(...spans.map((s) => safeSpanStart(s)));
    const end = Math.max(...spans.map((s) => safeSpanEnd(s)));
    const toolSpans = spans.filter((s) => s.span_kind === 'TOOL');

    const evidence =
      unit.key === 'generating'
        ? extractFinalResponseEvidence(options.finalOutputValue, photoIndex)
        : extractEvidenceForToolSpans(toolSpans);

    return {
      id: nextStepId(),
      label: pickLabel(unit.key, options.skill),
      type: GROUP_TO_STEP_TYPE[unit.key],
      status: 'pending',
      sourceSpanIds: spans.map((s) => s.context?.span_id).filter((id): id is string => !!id),
      startTime: start,
      endTime: end,
      activeHeadline: options.headline,
      evidence,
      technical: {
        spanKinds: [...new Set(spans.map((s) => s.span_kind))],
        spanNames: [...new Set(spans.map((s) => s.name))],
      },
    };
  });
}
