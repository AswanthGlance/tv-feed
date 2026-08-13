import type { ExtractedEntity } from '../../types/semanticEvent';
import type { ProgressiveItem } from '../../types/progressiveValue';
import type { NormalizedEntity, NormalizedEntityType } from '../types/entity';
import { shortenLocation } from './normalize';

/* ─────────────────────────────────────────────────────────────────────────────
   Bridges between the extraction-time entity shape (ExtractedEntity, produced
   by the Phoenix tool parsers) and the canonical Level 2 entity
   (NormalizedEntity), plus the candidate-canvas item shape the evolving
   candidate renderer already consumes (ProgressiveItem).

   Kept in one place so field mapping never drifts between the extractor, the
   pass builder and the final response builder.
   ───────────────────────────────────────────────────────────────────────────── */

const TYPE_MAP: Record<string, NormalizedEntityType> = {
  place: 'place',
  hotel: 'hotel',
  restaurant: 'restaurant',
  product: 'product',
  recipe: 'generic',
  media: 'media',
  event: 'event',
  generic: 'generic',
};

export function toNormalizedEntity(entity: ExtractedEntity): NormalizedEntity {
  const location = entity.subtitle;
  return {
    id: entity.id,
    type: TYPE_MAP[entity.type] ?? 'generic',
    title: entity.title,
    subtitle: shortenLocation(location) ?? location,
    location,
    image: entity.image,
    rating: entity.rating,
    reviewCount: entity.reviewCount,
    price: entity.price,
    distance: entity.distance,
    travelTime: entity.travelTime,
    availability: entity.availability,
    score: entity.score,
    externalId: entity.externalId,
    judgment: entity.judgment,
    reasoning: entity.reasoning,
    evidence: (entity.attributes?.bullets as string[] | undefined) ?? undefined,
    attributes: entity.attributes,
    raw: entity.raw,
  };
}

/** NormalizedEntity -> the candidate-canvas item shape. Only used by
 *  archetypes whose passes carry canvas mutations. `state` is supplied by the
 *  caller because it is a timeline decision, not a property of the entity. */
export function toProgressiveItem(
  entity: NormalizedEntity,
  state: ProgressiveItem['state'] = 'discovered'
): ProgressiveItem {
  return {
    id: entity.id,
    type:
      entity.type === 'restaurant' || entity.type === 'hotel' || entity.type === 'destination'
        ? 'place'
        : entity.type === 'product'
          ? 'product'
          : entity.type === 'event'
            ? 'event'
            : entity.type === 'media'
              ? 'media'
              : entity.type === 'place'
                ? 'place'
                : 'generic',
    title: entity.title ?? 'Untitled',
    subtitle: entity.subtitle,
    image: entity.image,
    state,
    metadata: {
      ...(entity.rating != null ? { rating: entity.rating } : {}),
      ...(entity.reviewCount != null ? { reviewCount: entity.reviewCount } : {}),
      ...(entity.price ? { priceLevel: entity.price } : {}),
      ...(typeof entity.availability === 'string' ? { availability: entity.availability } : {}),
      ...(entity.travelTime ? { travelTime: entity.travelTime } : {}),
      ...(entity.distance ? { distance: entity.distance } : {}),
      ...(entity.externalId ? { placeId: entity.externalId } : {}),
      ...(entity.judgment ? { judgment: entity.judgment } : {}),
      ...(entity.evidence?.length ? { evidence: entity.evidence } : {}),
    },
  };
}
