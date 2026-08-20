import { useState } from 'react';
import type { ThinkingEvidence } from '../../types/thinking';
import { useGooglePlaceEnrichment } from '../../hooks/useGooglePlaceEnrichment';

/* photo_url on tool.PlaceSearch results is a relative path (`/api/photo?...`)
   that belongs to the Agent Harness backend, not Phoenix — there's no known
   absolute host for it from trace data alone (flagged as an instrumentation
   gap), so it 404s almost always. No external image API here — the harness's
   own photo_url, then a local image, so a broken/missing URL never breaks
   the leadership demo. */
const FALLBACK_IMAGE = '/images/feed/feed_29-travel-goa-coastal-road.jpg';

const GOOD_TRAVEL_THRESHOLD_MIN = 180; // matches the reference copy's "within a 3-hour drive" framing

function parseMinutes(text: string | undefined): number | undefined {
  if (!text) return undefined;
  const h = text.match(/(\d+)\s*h/i);
  const m = text.match(/(\d+)\s*m/i);
  if (!h && !m) return undefined;
  return (h ? Number(h[1]) * 60 : 0) + (m ? Number(m[1]) : 0);
}

function travelClass(travelTime: string | undefined): string {
  const mins = parseMinutes(travelTime);
  if (mins == null) return 'att-evidence-travel--neutral';
  return mins <= GOOD_TRAVEL_THRESHOLD_MIN ? 'att-evidence-travel--good' : 'att-evidence-travel--far';
}

export default function EvidenceCard({
  evidence,
  highlight,
}: {
  evidence: ThinkingEvidence;
  highlight?: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const enrichment = useGooglePlaceEnrichment(evidence.placeId);

  if (evidence.type === 'place' || evidence.type === 'image') {
    const src = !imgFailed && evidence.image ? evidence.image : FALLBACK_IMAGE;

    return (
      <div className={`att-evidence-card${highlight ? ' att-evidence-card--highlight' : ''}`}>
        <img className="att-evidence-image" src={src} alt="" onError={() => setImgFailed(true)} />
        <div className="att-evidence-body">
          {evidence.title && <div className="att-evidence-title">{evidence.title}</div>}
          {(evidence.rating != null || evidence.reviewCount != null) && (
            <div className="att-evidence-meta">
              {evidence.rating != null ? `${evidence.rating.toFixed(1)}★` : ''}
              {evidence.reviewCount != null ? ` (${evidence.reviewCount.toLocaleString()})` : ''}
              {enrichment.openNow != null ? ` · ${enrichment.openNow ? 'Open now' : 'Closed'}` : ''}
              {enrichment.priceLevel ? ` · ${enrichment.priceLevel}` : ''}
            </div>
          )}
          {evidence.badge && <div className="att-evidence-badge">{evidence.badge}</div>}
          {evidence.travelTime && (
            <div className={`att-evidence-travel ${travelClass(evidence.travelTime)}`}>{evidence.travelTime}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`att-evidence-card${highlight ? ' att-evidence-card--highlight' : ''}`}>
      <div className="att-evidence-text-body">
        {evidence.title && <div className="att-evidence-text-title">{evidence.title}</div>}
        {evidence.description && <div className="att-evidence-text-desc">{evidence.description}</div>}
        {evidence.travelTime && (
          <div className={`att-evidence-travel-inline ${travelClass(evidence.travelTime)}`}>{evidence.travelTime}</div>
        )}
      </div>
    </div>
  );
}
