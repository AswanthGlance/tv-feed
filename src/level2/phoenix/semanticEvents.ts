import type { PhoenixSpan } from '../../types/phoenix';
import type { ExtractedEntity, SemanticAgentEvent, SemanticEventType } from '../../types/semanticEvent';
import { safeSpanEnd, safeSpanStart } from '../../utils/timing';
import {
  extractPlaceDetailsEntity,
  extractPlaceSearchEntities,
  extractRouteInfo,
} from '../../adapters/entityExtraction';
import { asString, normalizeNumber, normalizeString, safeParseJson } from '../normalization/normalize';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Phoenix spans -> semantic agent events (archetype-agnostic).

   The ONLY module in the Level 2 pipeline that reads Phoenix span names and
   attribute keys. Everything downstream — visibility classification, pass
   building, final response construction — works on SemanticAgentEvent and
   would keep working against a completely different agent runtime.

   Every tool name below was observed live in the aitv-mewtwo-harness corpus
   (see PHOENIX_SCENARIO_ARCHETYPES.md's tool table). An UNRECOGNISED tool
   produces an `unknown` event rather than a guess: it is counted in
   diagnostics, filtered out by the user-value classifier, and never narrated.

   Non-TOOL spans (llm.call, memory.retrieval, visual.resolve) become
   `internal` events for the same reason — they are real work, they are
   accounted for in diagnostics, and they must never reach the viewer.
   ───────────────────────────────────────────────────────────────────────────── */

export interface SemanticExtractionDiagnostics {
  recognizedTools: string[];
  unrecognizedTools: string[];
  /** Tool spans whose output existed but yielded nothing usable. */
  unusableToolOutputs: string[];
  internalSpanCount: number;
}

function classifyToolName(name: string): SemanticEventType {
  const n = name.toLowerCase();
  if (n.includes('placesearch') || n.includes('nearbyplaces') || n.includes('productsearch') || n.includes('eventsearch')) return 'search';
  if (n.includes('websearch') || n.includes('webfetch')) return 'retrieve';
  if (n.includes('placedetails') || n.includes('placereviews') || n.includes('eventdetails') || n.includes('productdetails')) return 'enrichment';
  if (n.includes('getroute') || n.includes('distance') || n.includes('direction')) return 'maps';
  if (n.includes('getweather')) return 'availability';
  if (n.includes('rank') || n.includes('rerank')) return 'rank';
  if (n.includes('filter')) return 'filter';
  return 'unknown';
}

function toolName(span: PhoenixSpan): string {
  return asString(span.attributes?.['tool.name']) ?? span.name.replace(/^tool\./, '');
}

/* ── Per-tool payload extraction ─────────────────────────────────────────── */

interface RawProduct {
  product_id?: string;
  title?: string;
  brand?: string;
  price?: number;
  currency?: string;
  image_url?: string;
}

/** tool.ProductSearch -> product entities. The one tool family in this corpus
 *  that emits a real `image_url`, so shopping archetypes can render actual
 *  imagery while place-based ones legitimately cannot. */
function extractProductEntities(span: PhoenixSpan): ExtractedEntity[] {
  const parsed = safeParseJson<{ products?: RawProduct[] }>(span.attributes?.['tool.output']);
  const products = parsed?.products;
  if (!Array.isArray(products)) return [];
  return products
    .filter((p) => p?.title)
    .map((p, i) => ({
      id: `product-${span.context?.span_id ?? 'x'}-${i}`,
      type: 'product' as const,
      externalId: p.product_id,
      title: p.title,
      subtitle: normalizeString(p.brand),
      image: p.image_url,
      price: p.price != null ? `${p.currency === 'USD' ? '$' : ''}${p.price}` : undefined,
      raw: p,
    }));
}

/** tool.WebSearch output is PLAIN TEXT, not JSON:
 *
 *    Search results for 'query': 1. Title - Site https://url ### snippet …
 *
 *  No entity is fabricated from it — a web result is a source, not a
 *  selectable thing. What is extracted is the count and the source titles,
 *  which is exactly what a summary/text archetype needs and all it needs. */
function extractWebSearchMetadata(span: PhoenixSpan): { query?: string; resultCount?: number; sources: Array<{ label: string; url?: string }> } {
  const input = safeParseJson<{ query?: string }>(span.attributes?.['tool.input']);
  const out = asString(span.attributes?.['tool.output']) ?? '';
  const sources: Array<{ label: string; url?: string }> = [];

  // Numbered entries: '1. Some Title - somesite.com https://…'
  const entryRe = /(?:^|\s)(\d{1,2})\.\s+([^\n]{4,160}?)\s+(https?:\/\/\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = entryRe.exec(out)) !== null) {
    sources.push({ label: normalizeString(m[2]) ?? m[2], url: m[3] });
    if (sources.length >= 8) break;
  }

  return { query: input?.query, resultCount: sources.length || undefined, sources };
}

/** tool.GetWeather -> a coarse conditions signal. Never turned into a slot
 *  grid the data doesn't support. */
function extractWeatherMetadata(span: PhoenixSpan): Record<string, unknown> | undefined {
  const parsed = safeParseJson<Record<string, unknown>>(span.attributes?.['tool.output']);
  if (!parsed) return undefined;
  const condition = normalizeString(parsed.condition ?? parsed.summary ?? parsed.description);
  const temp = normalizeNumber(parsed.temperature ?? parsed.temp);
  if (!condition && temp == null) return undefined;
  return { condition, temperature: temp };
}

function narrationFor(type: SemanticEventType, name: string, meta: Record<string, unknown>): string {
  switch (type) {
    case 'search':
      return typeof meta.query === 'string' ? `Searching for ${meta.query}` : 'Searching for options';
    case 'retrieve':
      return typeof meta.query === 'string' ? `Researching ${meta.query}` : 'Reading up on it';
    case 'enrichment':
      return 'Looking at ratings, reviews and details';
    case 'maps':
      return 'Checking travel times';
    case 'availability':
      return 'Checking conditions';
    case 'rank':
      return 'Weighing the options';
    case 'filter':
      return 'Ruling some out';
    default:
      return `Running ${name}`;
  }
}

export interface SemanticExtractionResult {
  events: SemanticAgentEvent[];
  diagnostics: SemanticExtractionDiagnostics;
}

export function extractLevel2SemanticEvents(spans: PhoenixSpan[], rootSpan?: PhoenixSpan): SemanticExtractionResult {
  const diagnostics: SemanticExtractionDiagnostics = {
    recognizedTools: [],
    unrecognizedTools: [],
    unusableToolOutputs: [],
    internalSpanCount: 0,
  };
  const events: SemanticAgentEvent[] = [];
  if (!spans.length) return { events, diagnostics };

  const traceStart = Math.min(...spans.map((s) => safeSpanStart(s)));
  let seq = 0;

  for (const span of spans) {
    const spanId = span.context?.span_id;
    const startTime = safeSpanStart(span) - traceStart;
    const endTime = safeSpanEnd(span) - traceStart;

    if (span.span_kind !== 'TOOL') {
      // Real work with no consumer meaning. Recorded, never narrated.
      if (span !== rootSpan) {
        diagnostics.internalSpanCount += 1;
        seq += 1;
        events.push({
          id: `sem-${seq}`,
          type: 'internal',
          sourceSpanIds: spanId ? [spanId] : [],
          startTime,
          endTime,
          narration: span.name,
          metadata: { spanName: span.name },
        });
      }
      continue;
    }

    const name = toolName(span);
    const type = classifyToolName(name);

    if (type === 'unknown') {
      if (!diagnostics.unrecognizedTools.includes(name)) diagnostics.unrecognizedTools.push(name);
    } else if (!diagnostics.recognizedTools.includes(name)) {
      diagnostics.recognizedTools.push(name);
    }

    let entities: ExtractedEntity[] = [];
    const metadata: Record<string, unknown> = { tool: name };

    if (type === 'search') {
      entities = /product/i.test(name) ? extractProductEntities(span) : extractPlaceSearchEntities(span);
      const input = safeParseJson<{ query?: string; query_text?: string }>(span.attributes?.['tool.input']);
      metadata.query = input?.query ?? input?.query_text;
      metadata.resultCount = entities.length || undefined;
      if (!entities.length) diagnostics.unusableToolOutputs.push(name);
    } else if (type === 'enrichment') {
      const one = extractPlaceDetailsEntity(span);
      entities = one ? [one] : [];
      if (!entities.length) diagnostics.unusableToolOutputs.push(name);
    } else if (type === 'retrieve') {
      const web = extractWebSearchMetadata(span);
      metadata.query = web.query;
      metadata.resultCount = web.resultCount;
      metadata.sources = web.sources;
      metadata.facts = web.sources.map((s) => s.label);
    } else if (type === 'maps') {
      const route = extractRouteInfo(span);
      if (route) Object.assign(metadata, route);
      else diagnostics.unusableToolOutputs.push(name);
    } else if (type === 'availability') {
      const weather = extractWeatherMetadata(span);
      if (weather) Object.assign(metadata, weather);
    }

    seq += 1;
    events.push({
      id: `sem-${seq}`,
      type,
      sourceSpanIds: spanId ? [spanId] : [],
      startTime,
      endTime,
      narration: narrationFor(type, name, metadata),
      input: span.attributes?.['tool.input'],
      output: span.attributes?.['tool.output'],
      entities,
      metadata,
    });
  }

  if (rootSpan) {
    seq += 1;
    events.push({
      id: `sem-${seq}`,
      type: 'final',
      sourceSpanIds: rootSpan.context?.span_id ? [rootSpan.context.span_id] : [],
      startTime: safeSpanEnd(rootSpan) - traceStart,
      endTime: safeSpanEnd(rootSpan) - traceStart,
      narration: 'Putting the answer together',
      output: rootSpan.attributes?.['output.value'],
    });
  }

  events.sort((a, b) => a.startTime - b.startTime);
  return { events, diagnostics };
}
