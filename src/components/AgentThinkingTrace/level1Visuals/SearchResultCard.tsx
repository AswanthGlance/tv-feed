import { useState } from 'react';
import type { ThinkingEvidence } from '../../../types/thinking';

const FALLBACK_IMAGE = '/images/feed/feed_29-travel-goa-coastal-road.jpg';

function SearchGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="10.5" cy="10.5" r="6.5" stroke="rgba(255,255,255,0.35)" strokeWidth="1.6" />
      <line x1="15.3" y1="15.3" x2="20" y2="20" stroke="rgba(255,255,255,0.35)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Compact, lower-emphasis search-finding card — deliberately distinct from
 * the standard evidence card (smaller, plain title/source/snippet, no
 * rating/travel chrome) so search results read as "still exploring" rather
 * than a finished result. Image only renders when the normalized payload
 * actually had one; a missing image gets a search glyph, not a forced
 * stock photo — a load *failure* (image existed but broke) falls back to
 * the tasteful local image instead. */
export default function SearchResultCard({ evidence, highlight }: { evidence: ThinkingEvidence; highlight?: boolean }) {
  const [imgFailed, setImgFailed] = useState(false);
  const hasImage = !!evidence.image;
  const src = imgFailed ? FALLBACK_IMAGE : evidence.image;

  return (
    <div className={`att-search-card${highlight ? ' att-search-card--highlight' : ''}`}>
      {hasImage ? (
        <img className="att-search-card-image" src={src} alt="" onError={() => setImgFailed(true)} />
      ) : (
        <div className="att-search-card-icon">
          <SearchGlyph />
        </div>
      )}
      <div className="att-search-card-body">
        {evidence.title && <div className="att-search-card-title">{evidence.title}</div>}
        {(evidence.source || evidence.subtitle) && (
          <div className="att-search-card-source">{evidence.source || evidence.subtitle}</div>
        )}
        {evidence.description && <div className="att-search-card-desc">{evidence.description}</div>}
      </div>
    </div>
  );
}
