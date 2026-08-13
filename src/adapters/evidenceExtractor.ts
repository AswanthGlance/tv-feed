import type { PhoenixSpan } from '../types/phoenix';
import type { ThinkingEvidence } from '../types/thinking';
import { asString, safeParseJson } from '../utils/safeJson';
import {
  deepExtractResults,
  deepSafeParse,
  extractDescription,
  extractImageUrl,
  extractTitle,
  looksLikeSerializedJson,
  normalizeWebSearchOutput,
} from '../utils/resultNormalizer';

/* ─────────────────────────────────────────────────────────────────────────────
   Shapes below are transcribed from real tool.output payloads observed on the
   aitv-mewtwo-harness project (see conversation trace inspection), not guessed
   from the API docs. If Agent Harness instrumentation changes these, this file
   degrades to empty arrays rather than throwing — see safeParseJson.
   ───────────────────────────────────────────────────────────────────────────── */

interface RawPlace {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  rating?: number;
  user_rating_count?: number;
  price_display?: string;
  open_now?: boolean;
  phone?: string;
  website?: string;
  google_maps_uri?: string;
  photo_url?: string;
}

interface RawPlaceSearchOutput {
  query?: string;
  total_results?: number;
  places?: RawPlace[];
}

interface RawRouteOutput {
  origin?: string;
  destination?: string;
  distance_text?: string;
  duration_text?: string;
}

let evidenceSeq = 0;
function nextId(prefix: string) {
  evidenceSeq += 1;
  return `${prefix}-${evidenceSeq}`;
}

function toolAttr(span: PhoenixSpan, key: 'tool.input' | 'tool.output' | 'tool.name'): unknown {
  return span.attributes?.[key];
}

/** Evidence straight from tool.PlaceSearch / tool.NearbyPlaces output —
 *  the raw candidate set, before the LLM curates/ranks it. */
export function extractPlaceEvidence(toolSpans: PhoenixSpan[]): ThinkingEvidence[] {
  const evidence: ThinkingEvidence[] = [];
  for (const span of toolSpans) {
    const parsed = safeParseJson<RawPlaceSearchOutput>(toolAttr(span, 'tool.output'));
    const places = parsed?.places;
    if (!Array.isArray(places)) continue;
    for (const p of places) {
      if (!p?.name) continue;
      evidence.push({
        id: nextId('place'),
        type: 'place',
        placeId: p.place_id,
        title: p.name,
        subtitle: p.formatted_address,
        image: p.photo_url,
        rating: typeof p.rating === 'number' ? p.rating : undefined,
        reviewCount: typeof p.user_rating_count === 'number' ? p.user_rating_count : undefined,
        url: p.google_maps_uri,
        phone: p.phone,
        raw: p,
      });
    }
  }
  return evidence;
}

/** tool.GetRoute -> a small text evidence carrying real drive-time text.
 *  There's no reliable per-place linkage in current instrumentation (the
 *  route call doesn't carry a place_id), so this surfaces as its own
 *  evidence item rather than being silently merged onto place cards. */
export function extractRouteEvidence(toolSpans: PhoenixSpan[]): ThinkingEvidence[] {
  const evidence: ThinkingEvidence[] = [];
  for (const span of toolSpans) {
    const parsed = safeParseJson<RawRouteOutput>(toolAttr(span, 'tool.output'));
    if (!parsed?.duration_text) continue;
    // `destination` is a full geocodable address (real GetRoute payloads
    // pass a full address, not just a place name), so it goes in the
    // clamped description slot rather than the title.
    const shortTitle = parsed.destination?.split(',')[0]?.trim() || 'Route';
    evidence.push({
      id: nextId('route'),
      type: 'text',
      title: `Directions to ${shortTitle}`,
      description: parsed.destination,
      travelTime: parsed.duration_text,
      distance: parsed.distance_text,
      raw: parsed,
    });
  }
  return evidence;
}

/** tool.WebSearch / tool.WebFetch -> real search-result evidence.
 *  Previously this sliced-and-dumped the raw tool.output string (which is
 *  itself frequently JSON, e.g. `{"type":"web_search_results",...}`)
 *  straight into `description`, which is the exact bug reported: raw JSON
 *  rendered verbatim in the leadership UI. Fixed by routing through
 *  normalizeWebSearchOutput, which safe-parses (including doubly-encoded
 *  strings), finds the actual result list, and extracts title/image/
 *  source/description per item — never the unparsed payload itself. */
export function extractWebResultEvidence(toolSpans: PhoenixSpan[]): ThinkingEvidence[] {
  const evidence: ThinkingEvidence[] = [];
  for (const span of toolSpans) {
    const input = safeParseJson<{ query?: string; url?: string; prompt?: string }>(toolAttr(span, 'tool.input'));
    const rawOutput = toolAttr(span, 'tool.output');
    const { evidence: normalized } = normalizeWebSearchOutput(rawOutput, input);
    for (const ev of normalized) {
      evidence.push({
        id: ev.id,
        type: ev.type === 'summary' ? 'summary' : 'web_result',
        title: ev.title,
        subtitle: ev.subtitle,
        description: ev.description,
        image: ev.image,
        source: ev.source,
        url: ev.url,
        raw: ev.raw,
      });
    }
  }
  return evidence;
}

/** tool.PlaceReviews -> review snippets. Shape isn't confirmed against a
 *  real payload (unlike PlaceSearch/GetRoute), so this uses the same
 *  generic result-list extraction as web search rather than guessing at a
 *  specific schema, and drops anything that still looks like unparsed JSON. */
export function extractReviewEvidence(toolSpans: PhoenixSpan[]): ThinkingEvidence[] {
  const evidence: ThinkingEvidence[] = [];
  for (const span of toolSpans) {
    const parsed = deepSafeParse(toolAttr(span, 'tool.output'));
    const records = deepExtractResults(parsed);
    for (const r of records) {
      const description = extractDescription(r, 160);
      if (!description) continue;
      const ratingVal = r.rating;
      evidence.push({
        id: nextId('review'),
        type: 'text',
        title: extractTitle(r) || 'Review',
        description,
        rating: typeof ratingVal === 'number' ? ratingVal : undefined,
        raw: r,
      });
    }
  }
  return evidence;
}

/** tool.VTONGenerate (and any other future image-generation tool) ->
 *  a single generated-image evidence item, when the output actually
 *  carries a resolvable image field. No fabricated placeholder image if
 *  the real payload doesn't have one — see extractImageUrl. */
export function extractGeneratedVisualEvidence(toolSpans: PhoenixSpan[]): ThinkingEvidence[] {
  const evidence: ThinkingEvidence[] = [];
  for (const span of toolSpans) {
    const parsed = deepSafeParse(toolAttr(span, 'tool.output'));
    const records = deepExtractResults(parsed);
    const record = records[0] ?? (parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : undefined);
    const image = record ? extractImageUrl(record) : undefined;
    if (!image) continue;
    evidence.push({ id: nextId('visual'), type: 'image', title: 'Generated visual', image, raw: record });
  }
  return evidence;
}

const PREFERENCE_CHIP_MAXLEN = 40;

/** Truncates on a word boundary rather than mid-word, so a chip never ends
 *  with a half-cut word. */
function shortenPreferencePhrase(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim().replace(/\.$/, '');
  if (clean.length <= PREFERENCE_CHIP_MAXLEN) return clean;
  let out = '';
  for (const word of clean.split(' ')) {
    if (`${out} ${word}`.trim().length > PREFERENCE_CHIP_MAXLEN) break;
    out = `${out} ${word}`.trim();
  }
  return out ? `${out}…` : `${clean.slice(0, PREFERENCE_CHIP_MAXLEN)}…`;
}

/** memory.retrieval is a RETRIEVER-kind span (OpenInference convention),
 *  not a TOOL span, so it's passed the whole unit's spans rather than
 *  toolSpans. Confirmed real shape (inspected live against
 *  aitv-mewtwo-harness): flattened indexed attributes
 *  `retrieval.documents.{i}.document.content` — NOT a nested array under
 *  a single `retrieval.documents` key. `memory.hit: false` traces (no
 *  stored facts yet for that user) genuinely have none of these keys, in
 *  which case this degrades to an empty list — never fabricates specific
 *  preferences — and the caller shows an honest generic visual instead. */
export function extractPreferenceEvidence(spans: PhoenixSpan[]): ThinkingEvidence[] {
  const evidence: ThinkingEvidence[] = [];
  for (const span of spans) {
    if (span.span_kind !== 'RETRIEVER') continue;
    const attrs = span.attributes ?? {};

    for (let i = 0; i < 20; i++) {
      const content = asString(attrs[`retrieval.documents.${i}.document.content`]);
      if (content === undefined) break;
      if (!content.trim() || looksLikeSerializedJson(content)) continue;
      evidence.push({ id: nextId('preference'), type: 'preference', title: shortenPreferencePhrase(content), raw: content });
    }
    if (evidence.length) continue;

    // Fallback 1: a nested array/object shape, in case instrumentation
    // ever changes away from flattened keys.
    const fromOutput = deepSafeParse(toolAttr(span, 'tool.output'));
    for (const doc of deepExtractResults(fromOutput)) {
      const nested = doc.document && typeof doc.document === 'object' ? (doc.document as Record<string, unknown>) : doc;
      const text = extractDescription(nested, 60) ?? extractTitle(nested);
      if (!text || looksLikeSerializedJson(text)) continue;
      evidence.push({ id: nextId('preference'), type: 'preference', title: shortenPreferencePhrase(text), raw: doc });
    }
    if (evidence.length) continue;

    // Fallback 2: output.value's own markdown fact list (real shape seen:
    // "## Fact\n- [id] User is located in Bengaluru, Karnataka.").
    const outputText = asString(attrs['output.value']);
    if (outputText) {
      const factLines = outputText.match(/^-\s*(?:\[[a-f0-9-]+\]\s*)?.+$/gim) ?? [];
      for (const line of factLines) {
        const cleaned = line.replace(/^-\s*(?:\[[a-f0-9-]+\]\s*)?/, '').trim();
        if (cleaned && !looksLikeSerializedJson(cleaned)) {
          evidence.push({ id: nextId('preference'), type: 'preference', title: shortenPreferencePhrase(cleaned) });
        }
      }
    }
  }
  return evidence;
}

/** Dispatches by tool.name — used for per-step "progressive" evidence tied
 *  to when each tool span actually completed during playback. */
export function extractEvidenceForToolSpans(toolSpans: PhoenixSpan[]): ThinkingEvidence[] {
  const byTool = new Map<string, PhoenixSpan[]>();
  for (const span of toolSpans) {
    const name = asString(toolAttr(span, 'tool.name')) ?? span.name;
    if (!byTool.has(name)) byTool.set(name, []);
    byTool.get(name)!.push(span);
  }

  const out: ThinkingEvidence[] = [];
  for (const [name, spans] of byTool) {
    if (name === 'PlaceSearch' || name === 'NearbyPlaces' || name === 'PlaceDetails') {
      out.push(...extractPlaceEvidence(spans));
    } else if (name === 'GetRoute') {
      out.push(...extractRouteEvidence(spans));
    } else if (name === 'PlaceReviews') {
      out.push(...extractReviewEvidence(spans));
    } else if (name === 'WebSearch' || name === 'WebFetch') {
      out.push(...extractWebResultEvidence(spans));
    } else if (name === 'VTONGenerate') {
      out.push(...extractGeneratedVisualEvidence(spans));
    }
  }
  return out;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Final-response parsing — harness.turn's output.value attribute. The system
   prompt (captured in system_prompt.content on the same span) documents a
   small fixed set of response blocks: place_card, card_template, product_ids,
   weather_result, markdown table, or plain text. Parsing is regex-based and
   tolerant: a malformed block degrades to plain text rather than throwing.
   ───────────────────────────────────────────────────────────────────────────── */

function stripSuggestions(text: string): string {
  return text.replace(/<suggestions>[\s\S]*?<\/suggestions>/i, '').trim();
}

function parseRatingText(ratingText: string | undefined): { rating?: number; reviewCount?: number } {
  if (!ratingText) return {};
  const m = ratingText.match(/([\d.]+)\s*★[^\d]*([\d,]+)?/);
  if (!m) return {};
  const rating = Number(m[1]);
  const reviewCount = m[2] ? Number(m[2].replace(/,/g, '')) : undefined;
  return {
    rating: Number.isFinite(rating) ? rating : undefined,
    reviewCount: reviewCount != null && Number.isFinite(reviewCount) ? reviewCount : undefined,
  };
}

function extractTagAttr(block: string, attrName: string): string | undefined {
  const m = block.match(new RegExp(`${attrName}="([^"]*)"`, 'i'));
  return m ? m[1] : undefined;
}

function extractTagContent(block: string, tag: string): string | undefined {
  const m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return m ? m[1].trim() : undefined;
}

function extractCtaUrl(block: string): string | undefined {
  const content = extractTagContent(block, 'cta');
  if (!content) return undefined;
  const m = content.match(/\]\(([^)]+)\)/);
  return m ? m[1] : undefined;
}

/** place_id -> photo_url lookup built from every PlaceSearch-family tool
 *  call in the trace, so the curated final cards can carry a real image
 *  even though the response text itself never repeats the photo URL. */
export function buildPlacePhotoIndex(toolSpans: PhoenixSpan[]): Map<string, string> {
  const index = new Map<string, string>();
  for (const ev of extractPlaceEvidence(toolSpans)) {
    const placeId = (ev.raw as RawPlace | undefined)?.place_id;
    if (placeId && ev.image) index.set(placeId, ev.image);
  }
  return index;
}

function parsePlaceCardBlock(outputText: string, photoIndex: Map<string, string>): ThinkingEvidence[] {
  const blockMatch = outputText.match(/<place_card>([\s\S]*?)<\/place_card>/i);
  if (!blockMatch) return [];
  const cardBlocks = blockMatch[1].match(/<card[^>]*>[\s\S]*?<\/card>/gi) ?? [];

  return cardBlocks.map((block) => {
    const title = extractTagAttr(block, 'title');
    const { rating, reviewCount } = parseRatingText(extractTagContent(block, 'rating'));
    const placeId = extractTagAttr(block, 'place_id');
    return {
      id: nextId('place-card'),
      type: 'place' as const,
      placeId,
      title,
      badge: extractTagContent(block, 'badge'),
      description: extractTagContent(block, 'why'),
      rating,
      reviewCount,
      image: placeId ? photoIndex.get(placeId) : undefined,
      url: extractCtaUrl(block),
      phone: extractTagContent(block, 'phone')?.match(/\]\(tel:([^)]+)\)/)?.[1],
    };
  });
}

function parseCardTemplateBlock(outputText: string): ThinkingEvidence[] {
  const blockMatch = outputText.match(/<card_template>([\s\S]*?)<\/card_template>/i);
  if (!blockMatch) return [];
  const summary = extractTagContent(blockMatch[1], 'summary');
  const cardBlocks = blockMatch[1].match(/<card[^>]*>[\s\S]*?<\/card>/gi) ?? [];

  const evidence: ThinkingEvidence[] = [];
  if (summary) {
    evidence.push({ id: nextId('summary'), type: 'text', description: summary });
  }
  for (const block of cardBlocks) {
    const points = [...block.matchAll(/<point>([\s\S]*?)<\/point>/gi)].map((m) => m[1].trim());
    evidence.push({
      id: nextId('card'),
      type: 'text',
      title: extractTagAttr(block, 'title'),
      description: points.join(' · ') || undefined,
    });
  }
  return evidence;
}

function parseProductIdsBlock(outputText: string): ThinkingEvidence[] {
  const blockMatch = outputText.match(/<product_ids>([\s\S]*?)<\/product_ids>/i);
  if (!blockMatch) return [];
  const ids = blockMatch[1].split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
  return ids.map((id) => ({ id: nextId('product'), type: 'product' as const, title: id }));
}

/** Extracts the curated evidence set from the final agent response. Falls
 *  back through place_card -> card_template -> product_ids -> plain-text
 *  summary, always returning *something* usable rather than an empty
 *  evidence set for a response the agent clearly did produce. */
export function extractFinalResponseEvidence(
  outputValue: string | undefined,
  photoIndex: Map<string, string>
): ThinkingEvidence[] {
  if (!outputValue) return [];
  const text = stripSuggestions(outputValue);
  if (!text) return [];

  const placeCards = parsePlaceCardBlock(text, photoIndex);
  if (placeCards.length) return placeCards;

  const templateCards = parseCardTemplateBlock(text);
  if (templateCards.length) return templateCards;

  const products = parseProductIdsBlock(text);
  if (products.length) return products;

  const plain = text.replace(/<\/?[a-z_]+[^>]*>/gi, ' ').replace(/\s+/g, ' ').trim();
  if (!plain) return [];
  return [{ id: nextId('text'), type: 'text', description: plain.slice(0, 600) }];
}
