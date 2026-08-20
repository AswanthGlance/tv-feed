import { useEffect, useState } from 'react';
import { pickLocalFallbackImage } from '../../../adapters/localImageFallback';
import { fetchPlaceDetails, placePhotoUrl } from '../../../api/googlePlacesClient';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — The shared image resolver.

   Extracted verbatim from Level2CandidateCard so the THINKING tile and the
   FINAL card resolve imagery through exactly the same integration.

   Three tiers, in order:

     1. The trace's own photo_url, when the trace actually carries one (real,
        already-resolved — no fetch needed).
     2. A LIVE Google Places photo, when the entity carries a real place_id
        and the trace itself carried no image — the same already-configured
        googlePlacesClient.ts the Progressive L1 prototype uses (proxied
        server-side, see vite.config.ts; the API key never reaches the
        browser). Fetched once per place_id (client-side cache in
        googlePlacesClient.ts), and only ever swapped in — the local
        fallback below renders immediately while this resolves in the
        background, so there is never a blank frame waiting on it.
     3. A local static image, keyword-matched against the item's real title —
        so a broken, relative, missing, absent, or still-resolving URL never
        leaves an empty frame or a broken glyph.

   Tier 3 is never presented as the real venue's photo; it's relevant
   imagery, which is why the category keyword comes from the real title.
   ───────────────────────────────────────────────────────────────────────────── */

export default function EnrichedImage({
  itemId,
  itemTitle,
  fallbackSrc,
  placeId,
  className,
  onTierResolved,
}: {
  itemId: string;
  itemTitle: string;
  fallbackSrc?: string;
  /** Real Google place_id, when the entity resolved to one — enables tier 2
   *  (see file header). Omit or pass undefined to keep this at the original
   *  two-tier, zero-network behavior. */
  placeId?: string;
  className?: string;
  onTierResolved?: (tier: number) => void;
}) {
  const [tier, setTier] = useState(0);
  const [livePhotoSrc, setLivePhotoSrc] = useState<string | undefined>(undefined);
  const localFallback = pickLocalFallbackImage(itemTitle, itemId);

  // Only worth fetching when the trace itself carried nothing — a real
  // photo_url from the trace always wins, never overridden by a live fetch.
  useEffect(() => {
    if (fallbackSrc || !placeId) return;
    let cancelled = false;
    fetchPlaceDetails(placeId).then((details) => {
      if (cancelled) return;
      const photo = details?.photos[0];
      if (photo) setLivePhotoSrc(placePhotoUrl(photo.name, 480));
    });
    return () => {
      cancelled = true;
    };
  }, [fallbackSrc, placeId]);

  const candidates = [fallbackSrc, livePhotoSrc, localFallback];

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
