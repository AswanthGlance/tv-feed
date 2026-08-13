import type { PhoenixSpan } from '../types/phoenix';
import type { ExtractedEntity, SemanticAgentEvent, SemanticEventType } from '../types/semanticEvent';
import { asString, safeParseJson } from '../utils/safeJson';
import { safeSpanEnd, safeSpanStart } from '../utils/timing';
import {
  extractFinalPlaceCards,
  extractPlaceDetailsEntity,
  extractPlaceSearchEntities,
  extractRouteInfo,
} from './entityExtraction';

/* ─────────────────────────────────────────────────────────────────────────────
   PhoenixSpan[] -> SemanticAgentEvent[].

   This is the ONLY place that reads real Phoenix tool/span names. Everything
   downstream (phoenixToMutations.ts) works off SemanticAgentEvent, so a
   future live-events source or a different tool set only needs to produce
   this same shape, never touch span.attributes directly.

   Classification is signal-based (tool name substrings), grounded in the
   tool names actually observed live on aitv-mewtwo-harness (see
   LEVEL2_INSTRUMENTATION_GAPS.md): tool.PlaceSearch, tool.NearbyPlaces,
   tool.PlaceDetails, tool.PlaceReviews, tool.GetRoute, tool.GetWeather,
   tool.WebSearch, tool.WebFetch. An unrecognized tool name is reported in
   diagnostics and simply produces no event — Level 2 must never guess what
   an unknown tool did.
   ───────────────────────────────────────────────────────────────────────────── */

export interface SemanticEventDiagnostics {
  recognizedTools: string[];
  unrecognizedTools: string[];
  /** Tool spans whose output existed but couldn't be turned into any usable
   *  entity (parse failure surviving even the regex fallback, or a
   *  recognized-but-empty payload). */
  unusableToolOutputs: string[];
  /** Real `<card>` titles from the final response excluded from candidates
   *  because they read as supporting info (e.g. "Booking Tips"), not a
   *  comparable venue — see entityExtraction.ts's isVenueLikeEntity. Never
   *  silently dropped; surfaced here for GAPS-tab visibility. */
  excludedNonVenueCards: string[];
}

function classifyTool(toolName: string): SemanticEventType | undefined {
  const n = toolName.toLowerCase();
  if (n.includes('placesearch') || n.includes('nearbyplaces')) return 'search';
  if (n.includes('getroute') || n.includes('distance')) return 'maps';
  if (n.includes('placedetails') || n.includes('placereviews')) return 'enrichment';
  if (n.includes('websearch')) return 'retrieve';
  if (n.includes('webfetch')) return 'retrieve';
  if (n.includes('getweather')) return 'availability';
  return undefined;
}

function toolName(span: PhoenixSpan): string {
  return asString(span.attributes?.['tool.name']) ?? span.name.replace(/^tool\./, '');
}

function narrationFor(type: SemanticEventType, span: PhoenixSpan): string {
  const input = safeParseJson<{ query?: string }>(span.attributes?.['tool.input']);
  switch (type) {
    case 'search':
      return input?.query ? `Searching for ${input.query}` : 'Searching for options nearby';
    case 'maps':
      return 'Checking travel times';
    case 'enrichment':
      return 'Looking at ratings, reviews and details';
    case 'retrieve':
      return input?.query ? `Researching ${input.query}` : 'Researching the request';
    case 'availability':
      return 'Checking conditions';
    default:
      return 'Working on your request';
  }
}

/** Converts a project's real TOOL spans (already trace-start-relativized)
 *  into SemanticAgentEvents, plus a `final` event from the root span's own
 *  response if it looks like a real answer. Spans that aren't span_kind
 *  TOOL and aren't the root are ignored — LLM/RETRIEVER/CHAIN spans carry no
 *  progressive-value signal Level 2 needs (that's Level 1's job). */
export function extractSemanticEvents(
  spans: PhoenixSpan[],
  rootSpan: PhoenixSpan | undefined,
  traceStartMs: number
): { events: SemanticAgentEvent[]; diagnostics: SemanticEventDiagnostics } {
  const diagnostics: SemanticEventDiagnostics = {
    recognizedTools: [],
    unrecognizedTools: [],
    unusableToolOutputs: [],
    excludedNonVenueCards: [],
  };
  const events: SemanticAgentEvent[] = [];
  let seq = 0;

  for (const span of spans) {
    if (span.span_kind !== 'TOOL') continue;
    const name = toolName(span);
    const type = classifyTool(name);
    if (!type) {
      if (!diagnostics.unrecognizedTools.includes(name)) diagnostics.unrecognizedTools.push(name);
      continue;
    }

    const startTime = safeSpanStart(span) - traceStartMs;
    const endTime = safeSpanEnd(span) - traceStartMs;
    const spanId = span.context?.span_id;

    let entities: ExtractedEntity[];
    if (type === 'search') entities = extractPlaceSearchEntities(span);
    else if (type === 'enrichment') {
      const one = extractPlaceDetailsEntity(span);
      entities = one ? [one] : [];
    } else {
      entities = [];
    }

    const metadata: Record<string, unknown> = {};
    if (type === 'maps') {
      const route = extractRouteInfo(span);
      if (route) Object.assign(metadata, route);
    }

    if ((type === 'search' || type === 'enrichment') && entities.length === 0) {
      diagnostics.unusableToolOutputs.push(name);
    }
    if (!diagnostics.recognizedTools.includes(name)) diagnostics.recognizedTools.push(name);

    seq += 1;
    events.push({
      id: `sem-${seq}`,
      type,
      sourceSpanIds: spanId ? [spanId] : [],
      startTime,
      endTime,
      narration: narrationFor(type, span),
      input: span.attributes?.['tool.input'],
      output: span.attributes?.['tool.output'],
      entities,
      metadata: Object.keys(metadata).length ? metadata : undefined,
    });
  }

  if (rootSpan) {
    const outputValue = asString(rootSpan.attributes?.['output.value']);
    const { cards, excludedTitles } = extractFinalPlaceCards(outputValue);
    diagnostics.excludedNonVenueCards.push(...excludedTitles);
    if (cards.length) {
      seq += 1;
      events.push({
        id: `sem-${seq}`,
        type: 'final',
        sourceSpanIds: rootSpan.context?.span_id ? [rootSpan.context.span_id] : [],
        startTime: safeSpanEnd(rootSpan) - traceStartMs,
        endTime: safeSpanEnd(rootSpan) - traceStartMs,
        narration: 'Putting together a recommendation',
        output: outputValue,
        entities: cards.map((c) => c.entity),
        metadata: { order: cards.map((c) => c.order) },
      });
    }
  }

  events.sort((a, b) => a.startTime - b.startTime);
  return { events, diagnostics };
}
