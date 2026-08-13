import type { PhoenixSpan } from '../../types/phoenix';
import { asString, safeParseJson } from '../normalization/normalize';
import { parseResponseEnvelope, type ParsedEnvelope } from '../normalization/responseEnvelope';
import { partitionEnvelope } from './entityRole';
import { extractQueryRequirements } from './queryRequirements';
import type { ClassificationConfidence, ScenarioClassification } from '../types/archetype';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Trace scenario classifier.

   CLASSIFY BY OUTPUT SHAPE, NEVER BY DOMAIN. Travel is candidate ranking,
   route, single entity and hybrid in this corpus; food is ranking, list and
   structured; sports is text and summary. The skill name tells you nothing
   about which renderer the answer needs, so it is used only for labelling and
   for the one structural exclusion below.

   Runs off ROOT SPAN METADATA ALONE by default — the root `harness.turn` span
   already carries input.value, output.value, turn.tool_sequence and
   turn.skills_selected, so a 1000-trace corpus sweep costs a handful of list
   calls rather than 1000 span fetches. Child spans are optional and only
   refine image/enrichment signals.
   ───────────────────────────────────────────────────────────────────────────── */

/** Phoenix-neutral classifier input. Everything the classifier needs, with no
 *  Phoenix types in the signature — which is also what makes it testable
 *  against hand-written fixtures. */
export interface TraceSummary {
  traceId: string;
  prompt?: string;
  output?: string;
  toolSequence: string[];
  skills: string[];
  toolCallCount: number;
  latencyMs?: number;
}

export function summarizeRootSpan(span: PhoenixSpan): TraceSummary {
  const attrs = span.attributes ?? {};
  const rawSeq = attrs['turn.tool_sequence'];
  const parsedSeq = safeParseJson<string[]>(rawSeq);
  const toolSequence = Array.isArray(parsedSeq)
    ? parsedSeq.map((t) => String(t))
    : String(asString(rawSeq) ?? '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

  return {
    traceId: span.context?.trace_id ?? '',
    prompt: asString(attrs['input.value']),
    output: asString(attrs['output.value']),
    toolSequence,
    skills: String(asString(attrs['turn.skills_selected']) ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    toolCallCount: Number(attrs['turn.tool_call_count'] ?? toolSequence.length) || 0,
    latencyMs: Number(attrs['turn.latency_ms'] ?? 0) || undefined,
  };
}

const MAP_TOOL_RE = /(getroute|directions|distance|matrix|navigation|maps)/i;
const ENRICH_TOOL_RE = /(placedetails|placereviews|productdetails|detail)/i;
const SEARCH_TOOL_RE = /(websearch|placesearch|nearbyplaces|productsearch|search|retriev)/i;
/** Batch content-generation runs. Structurally not a Level 2 scenario: their
 *  N outputs are independent deliverables published to a feed, not competing
 *  candidates for one slot, so there is no answer to progressively reveal. */
const BATCH_TOOL_RE = /^aigc/i;

const WINNER_BADGE_RE = /\b(top\s*pick|best|#\s*1|winner|favou?rite|editor'?s?\s*(choice|pick)|our\s*pick|recommended)\b/i;
const IMAGE_URL_RE = /https?:\/\/[^\s"'<>)\]]+\.(png|jpe?g|webp|avif)(\?|#|"|$)/i;

const TIME_RE = /\b\d{1,2}[:.]\d{2}\s*(am|pm)?\b/i;
const SLOT_WORD_RE = /\b(slots?|schedule|timetable|fixtures?|line-?up|itinerary|agenda|availability)\b/i;
const SCORE_RE = /\b\d+\s*[-–]\s*\d+\b/;
const TABLE_RE = /\|.*\|/;

function uniq(items: string[]): string[] {
  return [...new Set(items)];
}

function countMatching(tools: string[], re: RegExp): number {
  return tools.filter((t) => re.test(t)).length;
}

function detectImages(envelope: ParsedEnvelope, output: string | undefined, spans: PhoenixSpan[]): boolean {
  if (output && IMAGE_URL_RE.test(output)) return true;
  if (envelope.cards.some((c) => c.raw && IMAGE_URL_RE.test(c.raw))) return true;
  for (const span of spans) {
    const out = asString(span.attributes?.['tool.output']);
    if (out && IMAGE_URL_RE.test(out)) return true;
  }
  return false;
}

/** Real structure, not the WORD 'schedule'.
 *
 *  An earlier version treated a single slot-word match as sufficient, which
 *  swept 86 corpus traces into `structured_no_image` — and essentially all of
 *  them turned out to be plain prose that produced an empty table. Structure
 *  now has to be demonstrable: a markdown table, several concrete times, a
 *  score line, or cards actually carrying price/hours/bullet data. A slot word
 *  on its own only counts alongside at least one real time. */
function detectStructured(envelope: ParsedEnvelope, output: string | undefined): boolean {
  if (envelope.cards.some((c) => c.priceText || c.hours || c.bullets.length)) return true;
  const text = output ?? '';
  if (TABLE_RE.test(text)) return true;
  const timeMatches = text.match(new RegExp(TIME_RE.source, 'gi'))?.length ?? 0;
  if (timeMatches >= 3) return true;
  if (SCORE_RE.test(text) && timeMatches >= 1) return true;
  return SLOT_WORD_RE.test(text) && timeMatches >= 1;
}

function detectMapSignals(tools: string[], output: string | undefined, routeIntent: boolean): boolean {
  if (countMatching(tools, MAP_TOOL_RE) > 0) return true;
  const text = output ?? '';
  const routeWords = /\b(route|directions|itinerary|stops?|eta|km away|minutes? away|drive)\b/i.test(text);
  return routeIntent && routeWords;
}

/** Classifies a trace into a scenario archetype. `spans` is optional — pass
 *  it only when the trace has already been fetched for another reason; the
 *  classification is stable without it. */
export function classifyTraceScenario(summary: TraceSummary, spans: PhoenixSpan[] = []): ScenarioClassification {
  const signals: string[] = [];
  const envelope = parseResponseEnvelope(summary.output);
  const requirements = extractQueryRequirements(summary.prompt);
  const tools = uniq(summary.toolSequence);

  const hasImages = detectImages(envelope, summary.output, spans);
  const hasStructuredData = detectStructured(envelope, summary.output);
  const hasMapSignals = detectMapSignals(summary.toolSequence, summary.output, requirements.routeIntent);

  const base = {
    prompt: summary.prompt,
    hasImages,
    hasMapSignals,
    hasStructuredData,
    outputShape: envelope.shape,
  };

  // ── Structural exclusions. These are real traces, but not Level 2 shapes.
  if (envelope.shape === 'empty') {
    return {
      ...base,
      archetype: 'unknown',
      confidence: 'high',
      signals: ['Turn produced no output at all.'],
      entityCount: 0,
      excludedReason: 'empty_response',
    };
  }

  if (envelope.isBatchPublish || countMatching(summary.toolSequence, BATCH_TOOL_RE) > 0 || summary.skills.some((s) => BATCH_TOOL_RE.test(s))) {
    return {
      ...base,
      archetype: 'unknown',
      confidence: 'high',
      signals: ['Batch content-generation run — outputs are independent published cards, not competing candidates.'],
      entityCount: 0,
      excludedReason: 'batch_generation',
    };
  }

  const { entities, supporting } = partitionEnvelope(envelope);
  const entityCount = entities.length;
  const dimensionBlocks = supporting.filter((b) => b.role === 'attribute');
  const searchCount = countMatching(summary.toolSequence, SEARCH_TOOL_RE);
  const enrichCount = countMatching(summary.toolSequence, ENRICH_TOOL_RE);

  signals.push(`${entityCount} comparable entit${entityCount === 1 ? 'y' : 'ies'}, ${supporting.length} supporting block(s).`);
  if (dimensionBlocks.length) signals.push(`${dimensionBlocks.length} dimension block(s): ${dimensionBlocks.map((b) => b.title).filter(Boolean).join(', ')}.`);
  if (searchCount) signals.push(`${searchCount} search/retrieval call(s).`);
  if (enrichCount) signals.push(`${enrichCount} enrichment call(s).`);
  if (hasMapSignals) signals.push('Route/map signals present.');
  if (!hasImages) signals.push('No usable image in the trace — must render image-free.');

  const finish = (
    archetype: ScenarioClassification['archetype'],
    confidence: ClassificationConfidence,
    reason: string
  ): ScenarioClassification => ({ ...base, archetype, confidence, signals: [reason, ...signals], entityCount });

  // ── Multiple peer entities ────────────────────────────────────────────
  if (entityCount >= 2) {
    // Multiple strong output forms at once. Kept ahead of ranking because a
    // trace that produced both a candidate set AND a route needs both
    // renderers, not the winner of a fight between them.
    if (hasMapSignals && countMatching(summary.toolSequence, MAP_TOOL_RE) > 0) {
      return finish('hybrid', 'medium', 'Peer entities plus real route/distance tool output — more than one output form.');
    }

    // Dimension blocks ARE the comparison structure: 'Best for Beginners',
    // 'Difficulty Level', 'Best Season' each restate every subject along one
    // axis. Two or more of them means the agent compared rather than ranked.
    if (dimensionBlocks.length >= 2) {
      return finish(
        'comparison',
        requirements.comparisonIntent ? 'high' : 'medium',
        `Repeated per-dimension breakdown across subjects (${dimensionBlocks.length} dimensions).`
      );
    }

    const winner = entities.find((e) => e.judgment && WINNER_BADGE_RE.test(e.judgment));
    if (winner) {
      return finish('candidate_ranking', 'high', `Explicit winner signal on "${winner.title ?? winner.id}" (badge: ${winner.judgment}).`);
    }

    // A ranking REQUEST plus a distinguishing score is enough; a ranking
    // request with nothing to rank on is not — that resolves to a list, and
    // the renderer must not invent a winner for it.
    const rated = entities.filter((e) => e.rating != null);
    if (requirements.rankingIntent && rated.length === entityCount && entityCount > 1) {
      const top = Math.max(...rated.map((e) => e.rating!));
      const distinct = rated.filter((e) => e.rating === top).length === 1;
      if (distinct) return finish('candidate_ranking', 'medium', 'Ranking request and one candidate rates strictly highest.');
    }

    return finish(
      'list',
      requirements.rankingIntent ? 'medium' : 'high',
      requirements.rankingIntent
        ? 'Ranking was requested but no candidate is distinguishable — honest list, no winner.'
        : 'Multiple peers with no ranking signal.'
    );
  }

  // ── Exactly one peer entity ───────────────────────────────────────────
  if (entityCount === 1) {
    return finish(
      'single_entity',
      enrichCount >= 2 ? 'high' : 'medium',
      enrichCount >= 2
        ? `One dominant entity with ${enrichCount} enrichment operations around it.`
        : 'One dominant entity in the response.'
    );
  }

  // ── No peer entities ──────────────────────────────────────────────────
  if (hasMapSignals && requirements.routeIntent) {
    return finish('route_map', 'medium', 'Route intent with map/route signals and no peer-entity set.');
  }

  if (hasStructuredData) {
    return finish('structured_no_image', hasImages ? 'low' : 'medium', 'Structured/numeric output (slots, schedule, table) with no peer-entity set.');
  }

  const proseLength = envelope.prose.join(' ').length;
  if (searchCount >= 4 && proseLength > 200) {
    return finish('summary', 'medium', `Synthesis across ${searchCount} sources with no entity set.`);
  }

  if (proseLength > 0) {
    return finish('text_only', requirements.explanationIntent ? 'high' : 'medium', 'Prose answer with no peer entities, no route, no structured block.');
  }

  return {
    ...base,
    archetype: 'unknown',
    confidence: 'low',
    signals: ['Response has no prose, no entities and no structured content the classifier recognises.', ...signals],
    entityCount: 0,
    excludedReason: 'unrecognised_shape',
  };
}
