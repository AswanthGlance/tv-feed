import type { PhoenixSpan } from '../types/phoenix';
import type { ThinkingEvidence } from '../types/thinking';
import { asString, safeParseJson } from '../utils/safeJson';

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

/** tool.WebSearch / tool.WebFetch -> generic research evidence when the
 *  trace has no structured place/product data (e.g. a menu lookup). */
export function extractWebResultEvidence(toolSpans: PhoenixSpan[]): ThinkingEvidence[] {
  const evidence: ThinkingEvidence[] = [];
  for (const span of toolSpans) {
    const input = safeParseJson<{ query?: string; url?: string; prompt?: string }>(toolAttr(span, 'tool.input'));
    const output = asString(toolAttr(span, 'tool.output'));
    if (!output) continue;
    const snippet = output.replace(/\s+/g, ' ').trim().slice(0, 220);
    evidence.push({
      id: nextId('result'),
      type: 'result',
      title: input?.query || input?.url || 'Search result',
      description: snippet,
      url: input?.url,
    });
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
    } else if (name === 'WebSearch' || name === 'WebFetch') {
      out.push(...extractWebResultEvidence(spans));
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
