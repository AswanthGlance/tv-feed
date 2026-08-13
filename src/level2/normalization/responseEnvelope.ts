import { extractUrl, normalizeString, stripMarkup } from './normalize';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Final response envelope parsing.

   The harness answers in one of a small number of real, observed envelopes
   (verified against the live aitv-mewtwo-harness corpus, not documentation):

     <place_card>    <summary/> <panel><section title><card title>…
     <card_template> same structure, different wrapper
     <product_ids>   'id: Title | Note' lines, one per product
     prose           plain text, sometimes with a trailing <suggestions>
     empty           the turn produced no output at all

   Prose can also PRECEDE a structured block in the same response — real
   traces open with a sentence and then emit <place_card>. Both parts are
   captured; neither is discarded.

   This module is shape parsing only. It makes no judgement about what the
   blocks MEAN — that is entityRole.ts (is this card a comparable peer?) and
   scenarioClassifier.ts (what archetype is this trace?).
   ───────────────────────────────────────────────────────────────────────────── */

export type ResponseShape = 'place_card' | 'card_template' | 'product_ids' | 'prose' | 'empty';

export interface EnvelopeCard {
  title?: string;
  badge?: string;
  ratingText?: string;
  priceText?: string;
  why?: string;
  note?: string;
  hours?: string;
  placeId?: string;
  visualQuery?: string;
  ctaUrl?: string;
  phone?: string;
  /** `<bullets><point>` lines. Observed only on NON-entity cards in the real
   *  corpus — dimension breakdowns ('Bir Billing: 2,400m takeoff, 30–60 min
   *  flights') that compare several already-named things rather than
   *  describing one candidate. A strong comparison signal. */
  bullets: string[];
  /** The raw `<card>…</card>` block, kept for provenance/debugging. */
  raw: string;
}

export interface EnvelopeSection {
  title?: string;
  cards: EnvelopeCard[];
}

export interface ParsedEnvelope {
  shape: ResponseShape;
  /** `<summary>` content when the envelope has one. */
  summary?: string;
  /** Prose outside any structured block, in document order. */
  prose: string[];
  sections: EnvelopeSection[];
  /** Flattened cards across all sections, in document order. */
  cards: EnvelopeCard[];
  /** `<product_ids>` entries. */
  products: Array<{ id: string; title: string; note?: string }>;
  /** `<suggestions><chip>` follow-ups. */
  chips: string[];
  /** True when the response is a batch-publish confirmation ('Published 3
   *  experience cards…') rather than an answer to a user question. */
  isBatchPublish: boolean;
}

const EMPTY_ENVELOPE: ParsedEnvelope = {
  shape: 'empty',
  prose: [],
  sections: [],
  cards: [],
  products: [],
  chips: [],
  isBatchPublish: false,
};

function tagContent(block: string, tag: string): string | undefined {
  const m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i'));
  return m ? normalizeString(m[1]) : undefined;
}

function tagAttr(block: string, attrName: string): string | undefined {
  const m = block.match(new RegExp(`${attrName}="([^"]*)"`, 'i'));
  return m ? normalizeString(m[1]) : undefined;
}

function parseCard(raw: string): EnvelopeCard {
  return {
    title: tagAttr(raw, 'title'),
    badge: tagContent(raw, 'badge'),
    ratingText: tagContent(raw, 'rating'),
    priceText: tagContent(raw, 'price'),
    why: tagContent(raw, 'why'),
    note: tagContent(raw, 'note'),
    hours: tagContent(raw, 'hours'),
    // `place_id` lives on the nested <visual> tag rather than <card> itself
    // on every real trace inspected, so the attribute is searched across the
    // whole card block instead of one specific tag.
    placeId: tagAttr(raw, 'place_id'),
    visualQuery: tagAttr(raw, 'query'),
    ctaUrl: extractUrl(tagContent(raw, 'cta')),
    phone: tagContent(raw, 'phone'),
    bullets: (raw.match(/<point>([\s\S]*?)<\/point>/gi) ?? [])
      .map((p) => stripMarkup(p.replace(/<\/?point>/gi, '')))
      .filter((p): p is string => !!p),
    raw,
  };
}

function parseSections(panel: string): EnvelopeSection[] {
  const sectionBlocks = panel.match(/<section[^>]*>[\s\S]*?<\/section>/gi);
  if (!sectionBlocks || !sectionBlocks.length) {
    const cards = (panel.match(/<card[^>]*>[\s\S]*?<\/card>/gi) ?? []).map(parseCard);
    return cards.length ? [{ cards }] : [];
  }
  return sectionBlocks.map((block) => ({
    title: tagAttr(block, 'title'),
    cards: (block.match(/<card[^>]*>[\s\S]*?<\/card>/gi) ?? []).map(parseCard),
  }));
}

type ParsedProduct = { id: string; title: string; note?: string };

function parseProducts(output: string): ParsedProduct[] {
  const block = output.match(/<product_ids>([\s\S]*?)<\/product_ids>/i);
  if (!block) return [];
  const out: ParsedProduct[] = [];
  for (const line of block[1].split('\n').map((l) => l.trim()).filter(Boolean)) {
    // 'b7609a74-9011-…: Red Tape classic | Timeless red style'
    const m = line.match(/^([\w-]+)\s*:\s*([^|]+?)(?:\s*\|\s*(.+))?$/);
    if (!m) continue;
    out.push({ id: m[1], title: normalizeString(m[2]) ?? m[2], note: normalizeString(m[3] ?? '') });
  }
  return out;
}

const BATCH_PUBLISH_RE = /^\s*published\s+\d+\s+/i;

export function parseResponseEnvelope(outputValue: unknown): ParsedEnvelope {
  const output = typeof outputValue === 'string' ? outputValue : undefined;
  if (!output || !output.trim()) return { ...EMPTY_ENVELOPE };

  const chips = (output.match(/<chip>([\s\S]*?)<\/chip>/gi) ?? [])
    .map((c) => normalizeString(c.replace(/<\/?chip>/gi, '')))
    .filter((c): c is string => !!c);

  const wrapperMatch =
    output.match(/<place_card>([\s\S]*?)<\/place_card>/i) ?? output.match(/<card_template>([\s\S]*?)<\/card_template>/i);
  const wrapperTag = wrapperMatch ? (output.includes('<place_card>') ? 'place_card' : 'card_template') : undefined;

  // Prose outside the structured wrapper and outside <suggestions>.
  const withoutStructured = output
    .replace(/<place_card>[\s\S]*?<\/place_card>/gi, '\n')
    .replace(/<card_template>[\s\S]*?<\/card_template>/gi, '\n')
    .replace(/<product_ids>[\s\S]*?<\/product_ids>/gi, '\n')
    .replace(/<suggestions>[\s\S]*?<\/suggestions>/gi, '\n');
  const prose = withoutStructured
    .split(/\n{1,}/)
    .map((p) => stripMarkup(p))
    .filter((p): p is string => !!p && p.length > 1);

  const isBatchPublish = prose.some((p) => BATCH_PUBLISH_RE.test(p));

  if (wrapperMatch && wrapperTag) {
    const inner = wrapperMatch[1];
    const panel = inner.match(/<panel>([\s\S]*?)<\/panel>/i)?.[1] ?? inner;
    const sections = parseSections(panel);
    return {
      shape: wrapperTag as ResponseShape,
      summary: tagContent(inner, 'summary'),
      prose,
      sections,
      cards: sections.flatMap((s) => s.cards),
      products: parseProducts(output),
      chips,
      isBatchPublish,
    };
  }

  const products = parseProducts(output);
  if (products.length) {
    return { shape: 'product_ids', prose, sections: [], cards: [], products, chips, isBatchPublish };
  }

  return { shape: 'prose', prose, sections: [], cards: [], products: [], chips, isBatchPublish };
}
