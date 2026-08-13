import { useEffect, useState } from 'react';
import { useGooglePlaceEnrichment } from '../../../hooks/useGooglePlaceEnrichment';
import { useStockPhoto } from '../../../hooks/useStockPhoto';
import { pickLocalFallbackImage, pickStockPhotoQuery } from '../../../adapters/localImageFallback';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — The shared four-tier image resolver.

   Extracted verbatim from Level2CandidateCard so the THINKING tile and the
   FINAL card resolve imagery through exactly the same integration. This is the
   image path the project already had; nothing new was written for it, and
   there is no second implementation to drift.

   Each tier is strictly a real-or-relevant upgrade over the next:

     1. Google Places photo of the real place — needs a real place_id AND a
        GOOGLE_PLACES_API_KEY whose billing tier includes Photos. (A "demo"
        key authenticates fine and still returns zero photos — see
        LEVEL2_INSTRUMENTATION_GAPS.md.)
     2. The harness's own photo_url from the trace — a relative path meant for
        the Agent Harness backend, so it 404s in this prototype almost always.
     3. A RELEVANT (not real-entity) Pexels photo, searched by a category
        keyword derived from the item's own real title. Needs PEXELS_API_KEY;
        a missing key skips straight through.
     4. A local static image, keyword-matched the same way — so a broken,
        relative or missing URL never leaves an empty frame or a broken glyph.

   Tier 3/4 are never presented as the real venue's photo; they are relevant
   imagery, which is why the category keyword comes from the real title.
   ───────────────────────────────────────────────────────────────────────────── */

export default function EnrichedImage({
  itemId,
  itemTitle,
  placeId,
  fallbackSrc,
  className,
  onTierResolved,
}: {
  itemId: string;
  itemTitle: string;
  placeId?: string;
  fallbackSrc?: string;
  className?: string;
  onTierResolved?: (tier: number) => void;
}) {
  const [tier, setTier] = useState(0);
  const enrichment = useGooglePlaceEnrichment(placeId);
  const stockQuery = pickStockPhotoQuery(itemTitle);
  const stock = useStockPhoto(stockQuery);
  const localFallback = pickLocalFallbackImage(itemTitle, itemId);
  const candidates = [enrichment.photoUrl, fallbackSrc, stock.photoUrl, localFallback];

  let renderedIndex = candidates.length - 1;
  let src: string = localFallback;
  for (let i = tier; i < candidates.length; i++) {
    const candidate = candidates[i];
    if (candidate) {
      src = candidate;
      renderedIndex = i;
      break;
    }
  }

  useEffect(() => {
    onTierResolved?.(renderedIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderedIndex]);

  return (
    <img
      className={className}
      src={src}
      alt=""
      onError={() => setTier(Math.min(renderedIndex + 1, candidates.length - 1))}
    />
  );
}
