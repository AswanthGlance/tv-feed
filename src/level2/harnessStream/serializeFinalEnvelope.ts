import type { HarnessTextFinalBlock } from './types';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Harness stream final blocks -> Phoenix-shaped envelope text.

   The stream's `text_final`/`text_replace` blocks are already clean JSON
   ({type:'text'}, {type:'product_picks', products}, {type:'place_card',
   sections}, {type:'card_template', sections}, {type:'suggestions', chips}) —
   structurally nicer than Phoenix's `<place_card>` XML-ish `output.value`.

   Rather than writing a second final-response builder, this serializes those
   blocks INTO that same XML-ish text, so classifyTraceScenario,
   parseResponseEnvelope, partitionEnvelope and buildFinalResponse all run
   completely UNCHANGED on the result — real code reuse, not a re-implemented
   parallel path. This is the one function in the whole harness-stream
   pipeline that produces Phoenix-shaped text; everything upstream of it
   (streamToSemanticEvents) and everything downstream of the parsers it feeds
   stays source-neutral.

   `product_picks` are serialized through the SAME `<card>` vocabulary
   `<place_card>` uses (title/badge/rating/price/why/visual/cta), not
   Phoenix's own impoverished `<product_ids>` format (id/title/note only) —
   the stream's product data carries real price/image/reasoning that format
   was never built to hold, and envelopeCardToEntity already reads exactly
   these fields generically (it is not place-specific).

   Image URLs are embedded as a `url` attribute on the synthetic `<visual>`
   tag. The current envelopeCardToEntity does not read that attribute (real
   Phoenix cards never carried one) — `detectImages`'s classification signal
   still fires correctly regardless, because it is a blind regex scan of the
   whole output text, not a structured read. Wiring the attribute into a
   rendered NormalizedEntity.image is a small, additive follow-up to
   entityRole.ts, deliberately deferred past this parsing/classification
   pass (see PASS 3/5 in the plan) rather than bundled in here.
   ───────────────────────────────────────────────────────────────────────────── */

function esc(value: unknown): string {
  return String(value ?? '').replace(/"/g, '&quot;');
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function num(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

interface SyntheticCard {
  title?: string;
  badge?: string;
  ratingText?: string;
  priceText?: string;
  why?: string;
  hours?: string;
  placeId?: string;
  visualQuery?: string;
  imageUrl?: string;
  ctaUrl?: string;
  phone?: string;
  bullets?: string[];
}

function cardXml(c: SyntheticCard): string {
  const parts = [`<card title="${esc(c.title)}"${c.placeId ? ` place_id="${esc(c.placeId)}"` : ''}>`];
  if (c.badge) parts.push(`<badge>${esc(c.badge)}</badge>`);
  if (c.ratingText) parts.push(`<rating>${esc(c.ratingText)}</rating>`);
  if (c.priceText) parts.push(`<price>${esc(c.priceText)}</price>`);
  if (c.why) parts.push(`<why>${esc(c.why)}</why>`);
  if (c.hours) parts.push(`<hours>${esc(c.hours)}</hours>`);
  if (c.bullets?.length) parts.push(`<bullets>${c.bullets.map((p) => `<point>${esc(p)}</point>`).join('')}</bullets>`);
  if (c.visualQuery || c.placeId || c.imageUrl) {
    parts.push(`<visual query="${esc(c.visualQuery)}" title="${esc(c.title)}"${c.placeId ? ` place_id="${esc(c.placeId)}"` : ''}${c.imageUrl ? ` url="${esc(c.imageUrl)}"` : ''}/>`);
  }
  if (c.ctaUrl) parts.push(`<cta>${esc(c.ctaUrl)}</cta>`);
  if (c.phone) parts.push(`<phone>${esc(c.phone)}</phone>`);
  parts.push('</card>');
  return parts.join('');
}

/** `4.4★ · 779 reviews`-shaped text — the exact form entityRole.ts's
 *  extractRating/extractReviewCount already parse (see entityRole.ts's own
 *  `ratingText` handling), so a real numeric rating from the stream renders
 *  through the same parser Phoenix ratings use, no new extraction needed. */
function ratingText(rating: unknown, reviewCount: unknown): string | undefined {
  const r = num(rating);
  if (r == null) return undefined;
  const rc = num(reviewCount);
  return `${r}★${rc != null ? ` · ${rc} reviews` : ''}`;
}

function placeCardBlockToCards(block: HarnessTextFinalBlock): { sections: Array<{ title?: string; cards: SyntheticCard[] }>; conclusion?: string } {
  const sections = Array.isArray(block.sections) ? (block.sections as Array<Record<string, unknown>>) : [];
  return {
    conclusion: str(block.conclusion),
    sections: sections.map((section) => ({
      title: str(section.title),
      cards: (Array.isArray(section.cards) ? (section.cards as Array<Record<string, unknown>>) : []).map((card): SyntheticCard => {
        const visual = (card.visual ?? {}) as Record<string, unknown>;
        const asset = Array.isArray(visual.assets) ? (visual.assets[0] as Record<string, unknown> | undefined) : undefined;
        const cta = (card.cta ?? {}) as Record<string, unknown>;
        const phone = (card.phone ?? {}) as Record<string, unknown>;
        return {
          title: str(card.title),
          badge: str(card.badge),
          ratingText: str(card.rating) ?? ratingText((card as Record<string, unknown>).ratingValue, (card as Record<string, unknown>).reviewCount),
          priceText: str(card.price),
          why: str(card.why) ?? str(card.note),
          hours: str(card.hours),
          placeId: str(visual.place_id),
          visualQuery: str(visual.query) ?? str(visual.title),
          imageUrl: str(asset?.url),
          ctaUrl: str(cta.url),
          phone: str(phone.num),
        };
      }),
    })),
  };
}

function productPicksBlockToCards(block: HarnessTextFinalBlock): { sections: Array<{ title?: string; cards: SyntheticCard[] }> } {
  const products = Array.isArray(block.products) ? (block.products as Array<Record<string, unknown>>) : [];
  return {
    sections: [
      {
        cards: products.map((p): SyntheticCard => ({
          title: str(p.title) ?? str(p.product_label),
          badge: str(p.product_label),
          priceText: num(p.price) != null ? `${p.currency === 'USD' ? '$' : '₹'}${p.price}` : undefined,
          why: str(p.llm_reasoning),
          placeId: str(p.product_id),
          visualQuery: str(p.title),
          imageUrl: str(p.image_url),
          ctaUrl: str(p.deeplink_url),
        })),
      },
    ],
  };
}

function cardTemplateBlockToCards(block: HarnessTextFinalBlock): { sections: Array<{ title?: string; cards: SyntheticCard[] }>; conclusion?: string } {
  const sections = Array.isArray(block.sections) ? (block.sections as Array<Record<string, unknown>>) : [];
  return {
    conclusion: str(block.conclusion),
    sections: sections.map((section) => ({
      title: str(section.title),
      cards: (Array.isArray(section.cards) ? (section.cards as Array<Record<string, unknown>>) : []).map((card): SyntheticCard => {
        const points = Array.isArray(card.points) ? (card.points as unknown[]).map((p) => String(p)) : [];
        const visual = (card.visual ?? {}) as Record<string, unknown>;
        const assets = Array.isArray(visual.assets) ? (visual.assets as Array<Record<string, unknown>>) : [];
        return {
          // No rating/price/place_id/cta on a recipe-style card by design —
          // these are structured/attribute content, not selectable peers, and
          // correctly fall through classifyCardRole to 'attribute'/'supporting'.
          // Bullets (not a flattened `why`) is what detectStructured actually
          // scans for — a card_template card with real steps/ingredients must
          // preserve them as <bullets><point> or it silently misclassifies as
          // text_only instead of structured_no_image.
          title: str(card.title),
          why: str(card.text),
          bullets: points.length ? points : undefined,
          imageUrl: str(assets[0]?.url),
        };
      }),
    })),
  };
}

/** Serializes one turn's `text_final`/`text_replace` blocks into the same
 *  XML-ish `output.value` text a real Phoenix trace would have carried.
 *  Unrecognised block types are skipped (never guessed into a shape). */
export function serializeFinalEnvelope(blocks: HarnessTextFinalBlock[]): string {
  const prose: string[] = [];
  let wrapper: 'place_card' | 'card_template' | undefined;
  let panelXml = '';
  let conclusion: string | undefined;
  let chips: string[] = [];

  for (const block of blocks) {
    if (block.type === 'text' && typeof block.text === 'string') {
      prose.push(block.text);
      continue;
    }
    if (block.type === 'suggestions' && Array.isArray(block.chips)) {
      chips = (block.chips as unknown[]).map((c) => String(c));
      continue;
    }
    if (block.type === 'place_card') {
      const { sections, conclusion: c } = placeCardBlockToCards(block);
      wrapper = 'place_card';
      conclusion = c;
      panelXml += sections.map((s) => `<section${s.title ? ` title="${esc(s.title)}"` : ''}>${s.cards.map(cardXml).join('')}</section>`).join('');
      continue;
    }
    if (block.type === 'product_picks') {
      const { sections } = productPicksBlockToCards(block);
      wrapper = wrapper ?? 'place_card';
      panelXml += sections.map((s) => `<section${s.title ? ` title="${esc(s.title)}"` : ''}>${s.cards.map(cardXml).join('')}</section>`).join('');
      continue;
    }
    if (block.type === 'card_template') {
      const { sections, conclusion: c } = cardTemplateBlockToCards(block);
      wrapper = wrapper ?? 'card_template';
      conclusion = conclusion ?? c;
      panelXml += sections.map((s) => `<section${s.title ? ` title="${esc(s.title)}"` : ''}>${s.cards.map(cardXml).join('')}</section>`).join('');
      continue;
    }
    // Unrecognised block type — diagnostics only, never guessed. The caller
    // (buildScenarioFromHarnessStream) can inspect which block types were
    // skipped via the returned unrecognisedBlockTypes.
  }

  const summarySentence = prose[0];
  const bodyProse = prose.slice(wrapper ? 1 : 0).join('\n\n');

  if (wrapper) {
    const inner = `${summarySentence ? `<summary>${esc(summarySentence)}</summary>` : ''}<panel>${panelXml}</panel>`;
    const structured = `<${wrapper}>${inner}</${wrapper}>`;
    const trailing = [bodyProse, conclusion].filter(Boolean).join('\n\n');
    const chipsXml = chips.length ? `<suggestions>${chips.map((c) => `<chip>${esc(c)}</chip>`).join('')}</suggestions>` : '';
    return `${structured}${trailing ? `\n${trailing}` : ''}${chipsXml}`;
  }

  // Plain prose only (e.g. q09's no-result answer) — the SAME shape
  // parseResponseEnvelope already produces for a real Phoenix prose response.
  const chipsXml = chips.length ? `<suggestions>${chips.map((c) => `<chip>${esc(c)}</chip>`).join('')}</suggestions>` : '';
  return `${prose.join('\n\n')}${chipsXml}`;
}
