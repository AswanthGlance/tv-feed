import { useEffect, useState } from 'react';
import { fetchPlaceDetails, placePhotoUrl, priceLevelLabel } from '../api/googlePlacesClient';

export type EnrichmentStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface PlaceEnrichment {
  status: EnrichmentStatus;
  photoUrl?: string;
  priceLevel?: string;
  openNow?: boolean;
}

const EMPTY: PlaceEnrichment = { status: 'idle' };

/** Lazily enriches a card with real Google data once it has a place_id.
 *  Fails silently into `status: 'error'` — callers should treat that
 *  exactly like 'idle' (fall back to whatever they already had), never
 *  block or show a broken state on it. */
export function useGooglePlaceEnrichment(placeId: string | undefined): PlaceEnrichment {
  const [state, setState] = useState<PlaceEnrichment>(EMPTY);

  useEffect(() => {
    if (!placeId) {
      setState(EMPTY);
      return;
    }
    let cancelled = false;
    setState({ status: 'loading' });

    fetchPlaceDetails(placeId).then((details) => {
      if (cancelled) return;
      if (!details) {
        setState({ status: 'error' });
        return;
      }
      const photo = details.photos[0];
      setState({
        status: 'ready',
        photoUrl: photo ? placePhotoUrl(photo.name) : undefined,
        priceLevel: priceLevelLabel(details.priceLevel),
        openNow: details.openNow,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [placeId]);

  return state;
}
