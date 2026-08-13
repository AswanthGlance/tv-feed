import { useEffect, useState } from 'react';
import { searchStockPhoto } from '../api/pexelsClient';

export type StockPhotoStatus = 'idle' | 'loading' | 'ready' | 'error';

/** Lazily fetches a relevant (not real-entity) stock photo for `query` —
 *  mirrors useGooglePlaceEnrichment's shape so EnrichedCardImage can treat
 *  every remote tier the same way. Fails silently into 'error', which
 *  callers treat exactly like 'idle' — never blocks or shows a broken
 *  state. */
export function useStockPhoto(query: string | undefined): { status: StockPhotoStatus; photoUrl?: string } {
  const [state, setState] = useState<{ status: StockPhotoStatus; photoUrl?: string }>({ status: 'idle' });

  useEffect(() => {
    if (!query) {
      setState({ status: 'idle' });
      return;
    }
    let cancelled = false;
    setState({ status: 'loading' });

    searchStockPhoto(query).then((photoUrl) => {
      if (cancelled) return;
      setState(photoUrl ? { status: 'ready', photoUrl } : { status: 'error' });
    });

    return () => {
      cancelled = true;
    };
  }, [query]);

  return state;
}
