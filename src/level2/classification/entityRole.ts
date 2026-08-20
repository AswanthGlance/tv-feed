import type { EnvelopeCard, ParsedEnvelope } from '../normalization/responseEnvelope';
import { extractRating, extractReviewCount, normalizeString, shortenLocation } from '../normalization/normalize';
import type { EntityPartition, EntityRole, NonEntityBlock, NormalizedEntity } from '../types/entity';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Entity vs attribute vs supporting information.

   The failure this prevents: 'Booking Tips', 'Group Size', 'Available Time
   Slots' and 'Price Range' being ranked as peer candidates against real
   venues. They are real content the agent emitted — they are not choices.

   THE RULE, and why it is this rule: a card earns `entity` role only if it
   carries at least one signal that only a real, selectable thing has — a
   provider id, a rating, a price, a booking/maps link, or a phone number.
   Title text alone never qualifies a card in, because 'Booking Tips' and
   'Hampta Pass Trek' are typographically identical.

   Validated against the live corpus: of 188 `<card>` blocks sampled, 17
   carried none of those signals, and all 17 were non-entities ('Before You
   Go', 'Best Season', 'Difficulty Level', 'Trek Comparison'). Zero real
   venues were excluded. The check is empirical, not assumed.
   ───────────────────────────────────────────────────────────────────────────── */

/** Titles that name a PROPERTY or a comparison DIMENSION rather than a thing. */
const ATTRIBUTE_TITLE_RE =
  /^(price(\s*range)?|cost|budget|group\s*size(\s*&\s*pricing)?|duration|timings?|available\s+time\s+slots?|hours?|capacity|difficulty(\s*level)?|best\s+season|altitude.*|rating|what\s+to\s+bring|best\s+for\s+.+|best\s+scenery|.*\bcomparison\b.*)$/i;

/** Titles that carry ADVICE or context, not a choice and not a property. */
const SUPPORTING_TITLE_RE =
  /^(booking\s*tips?|before\s+you\s+(go|book)|good\s+to\s+know|how\s+it\s+works|tips?|notes?|pro\s*tips?|about|planning\s+notes?|safety.*|faqs?|getting\s+there|what\s+to\s+expect)$/i;

/** Signals only a real, selectable thing carries. */
function hasEntitySignal(card: EnvelopeCard): boolean {
  return !!card.placeId || !!card.ratingText || !!card.priceText || !!card.ctaUrl || !!card.phone;
}

export function classifyCardRole(card: EnvelopeCard): EntityRole {
  const title = card.title?.trim() ?? '';
  if (title && SUPPORTING_TITLE_RE.test(title)) return 'supporting';
  if (title && ATTRIBUTE_TITLE_RE.test(title)) return 'attribute';
  if (hasEntitySignal(card)) return 'entity';
  // A `<bullets>` breakdown compares several already-named things; it is a
  // dimension, not one of them.
  if (card.bullets.length) return 'attribute';
  return 'supporting';
}

let seq = 0;
function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}-${seq}`;
}

/** Resets the id counter. Test-only — production ids just need to be unique
 *  within a scenario, not stable across processes. */
export function __resetEntityIdSeq(): void {
  seq = 0;
}

function priceToLocation(card: EnvelopeCard): string | undefined {
  // Real `<note>` values lead with a 📍 locality before other details, e.g.
  // '📍 Maah Space, Vaishali Nagar · Sun 9 Aug, 4:00 PM'. Take only the
  // locality segment; never reinterpret the rest as a place.
  const note = card.note;
  if (!note) return undefined;
  const m = note.match(/📍\s*([^·|]+)/);
  return m ? normalizeString(m[1]) : undefined;
}

export function envelopeCardToEntity(card: EnvelopeCard): NormalizedEntity {
  const location = priceToLocation(card);
  return {
    id: nextId('entity'),
    type: 'generic',
    title: card.title,
    subtitle: shortenLocation(location) ?? location,
    location,
    externalId: card.placeId,
    image: card.imageUrl,
    rating: extractRating(card.ratingText),
    reviewCount: extractReviewCount(card.ratingText),
    price: card.priceText,
    availability: card.hours ?? undefined,
    judgment: card.badge,
    reasoning: card.why,
    evidence: card.bullets.length ? card.bullets : undefined,
    attributes: {
      ...(card.ctaUrl ? { ctaUrl: card.ctaUrl } : {}),
      ...(card.phone ? { phone: card.phone } : {}),
      ...(card.visualQuery ? { visualQuery: card.visualQuery } : {}),
      ...(card.note ? { note: card.note } : {}),
    },
    raw: card.raw,
  };
}

function cardToBlock(card: EnvelopeCard, role: Exclude<EntityRole, 'entity'>): NonEntityBlock {
  const lines = [card.why, card.note, ...card.bullets].filter((l): l is string => !!l);
  return { role, title: card.title, lines, raw: card.raw };
}

/** Splits a parsed envelope's cards into comparable peers and everything
 *  else. Nothing is discarded — supporting blocks stay available for the
 *  final response's supporting section. */
export function partitionEnvelope(envelope: ParsedEnvelope): EntityPartition {
  const entities: NormalizedEntity[] = [];
  const supporting: NonEntityBlock[] = [];

  for (const card of envelope.cards) {
    const role = classifyCardRole(card);
    if (role === 'entity') entities.push(envelopeCardToEntity(card));
    else supporting.push(cardToBlock(card, role));
  }

  for (const product of envelope.products) {
    entities.push({
      id: nextId('entity'),
      type: 'product',
      title: product.title,
      subtitle: product.note,
      externalId: product.id,
      attributes: product.note ? { note: product.note } : undefined,
      raw: product,
    });
  }

  return { entities, supporting };
}
