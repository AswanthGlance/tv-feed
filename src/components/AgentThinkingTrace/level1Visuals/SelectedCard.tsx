import { useState } from 'react';
import type { ThinkingEvidence } from '../../../types/thinking';
import { useGooglePlaceEnrichment } from '../../../hooks/useGooglePlaceEnrichment';

const FALLBACK_IMAGE = '/images/feed/feed_29-travel-goa-coastal-road.jpg';

/** Richer card for the synthesis/"putting it together" step — a numbered
 * badge signals "the agent picked this one." No image slot is forced when
 * the curated answer never had one (a plain card_template answer, e.g. 3
 * food-idea cards, typically won't) — only an image that existed and then
 * failed to load falls back to the local asset. */
export default function SelectedCard({
  evidence,
  index,
  highlight,
}: {
  evidence: ThinkingEvidence;
  index: number;
  highlight?: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const enrichment = useGooglePlaceEnrichment(evidence.placeId);
  const rawImage = enrichment.photoUrl || evidence.image;
  const showImage = !!rawImage;
  const src = imgFailed ? FALLBACK_IMAGE : rawImage;

  return (
    <div className={`att-evidence-card att-selected-card${highlight ? ' att-evidence-card--highlight' : ''}`}>
      <span className="att-selected-badge">{index + 1}</span>
      {showImage ? (
        <>
          <img className="att-evidence-image" src={src} alt="" onError={() => setImgFailed(true)} />
          <div className="att-evidence-body">
            {evidence.title && <div className="att-evidence-title">{evidence.title}</div>}
            {(evidence.subtitle || evidence.badge) && (
              <div className="att-evidence-meta">{evidence.subtitle || evidence.badge}</div>
            )}
          </div>
        </>
      ) : (
        <div className="att-evidence-text-body">
          {evidence.title && <div className="att-evidence-text-title">{evidence.title}</div>}
          {evidence.description && <div className="att-evidence-text-desc">{evidence.description}</div>}
        </div>
      )}
    </div>
  );
}
