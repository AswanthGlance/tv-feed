import { useState } from 'react';
import { FocusButton } from '../L1/l1SharedComponents';
import { DotsIcon, HeartIcon } from '../L1/TravelL1';
import { useGooglePlaceEnrichment } from '../../hooks/useGooglePlaceEnrichment';
import type { ResolvedResultContent } from '../../adapters/resultContent';

/* The harness's own photo_url is a relative path with no known absolute
 * host (same instrumentation gap as EvidenceCard) — it will 404 in the
 * browser essentially always. A local static image is the final rung so a
 * broken URL never leaves the result hero blank. */
const LOCAL_FALLBACK_IMAGE = '/images/feed/feed_29-travel-goa-coastal-road.jpg';

/** Google Places photo (when a placeId resolves one) -> fallbackSrc (the
 *  harness-provided image, usually unresolvable) -> local static image.
 *  Shared by hero + support images so the fallback chain isn't duplicated
 *  per usage. */
function EnrichedImage({
  placeId,
  fallbackSrc,
  className,
}: {
  placeId?: string;
  fallbackSrc?: string;
  className: string;
}) {
  // Index into the tier we're willing to try from (advances only on an
  // actual load failure, via renderedIndex below — never skips a tier that
  // hasn't actually failed yet, so a slow-to-resolve Google photo still
  // gets picked up rather than being raced past).
  const [tier, setTier] = useState(0);
  const enrichment = useGooglePlaceEnrichment(placeId);
  const candidates = [enrichment.photoUrl, fallbackSrc, LOCAL_FALLBACK_IMAGE];

  let renderedIndex = candidates.length - 1;
  let src: string = LOCAL_FALLBACK_IMAGE;
  for (let i = tier; i < candidates.length; i++) {
    const candidate = candidates[i];
    if (candidate) {
      src = candidate;
      renderedIndex = i;
      break;
    }
  }

  return (
    <img
      className={className}
      src={src}
      alt=""
      onError={() => setTier(Math.min(renderedIndex + 1, candidates.length - 1))}
    />
  );
}

function Sparkle() {
  return (
    <svg width="14" height="14" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
      <path d="M6 0.5L7.3 4.7L11.5 6L7.3 7.3L6 11.5L4.7 7.3L0.5 6L4.7 4.7L6 0.5Z" fill="rgba(255,255,255,0.7)" />
    </svg>
  );
}

/** Rating row shared by the hero card and each collapsed card — orange
 *  star + rating, matching the real L1 templates' treatment exactly (same
 *  color token, same "(N REVIEWS)" caps convention) rather than inventing a
 *  new one for this screen. `subtitle` here is whatever
 *  adapters/resultContent.ts already formatted (e.g. "4.4★ (1.4k reviews)"
 *  or, for Level 2, a bare travel-time string like "3h 50m drive"). The
 *  star icon only renders when the text actually carries a rating (embeds
 *  "★") — showing a star glyph next to a travel time would misread as a
 *  rating that doesn't exist. The embedded "★" character itself is
 *  stripped so it's never doubled up with the icon. */
function RatingRow({ text }: { text: string }) {
  const hasRating = text.includes('★');
  return (
    <div className="att-result-rating-row">
      {hasRating && <img src="/images/l1/star.svg" alt="" className="att-result-star" />}
      <span>{hasRating ? text.replace('★', '') : text}</span>
    </div>
  );
}

/** The result screen, redesigned to match the real L1 templates' own
 *  "Cards" carousel (see /l1-scenarios) rather than a bespoke hero+rail
 *  layout: one expanded focus card (image left, editorial details +
 *  CTA row right) followed by a rail of collapsed cards, then a bottom
 *  prompt row. Visual layout only — no D-pad card-to-card focus, no flyout
 *  menu, no QR checkout modal; the "..." / heart / Check out buttons are
 *  chrome, not wired to state, matching this screen's read-only purpose. */
export default function ResultLayout({ content }: { content: ResolvedResultContent }) {
  return (
    <div className="att-result-carousel">
      <div className="att-result-rail">
        <div className="att-result-hero-card">
          <EnrichedImage className="att-result-hero-image" placeId={content.heroPlaceId} fallbackSrc={content.heroImage} />

          <div className="att-result-hero-body">
            <div className="att-result-hero-top">
              <div className="att-result-eyebrow-row">
                <Sparkle />
                <span>{content.eyebrow}</span>
              </div>
              {content.description && <p className="att-result-hero-description">{content.description}</p>}
            </div>

            <div className="att-result-hero-bottom">
              {content.subtitle && <RatingRow text={content.subtitle} />}
              <div className="att-result-hero-title">{content.title}</div>

              <div className="att-result-hero-cta-row">
                <div className="att-result-icon-btn" aria-hidden>
                  <DotsIcon color="#fff" />
                </div>
                <div className="att-result-icon-btn" aria-hidden>
                  <HeartIcon stroke="#fff" />
                </div>
                <FocusButton focused={false} variant="white">
                  {content.ctaLabel}
                </FocusButton>
              </div>
            </div>
          </div>
        </div>

        {content.supporting.map((item, i) => (
          <div className="att-result-collapsed-card" key={i}>
            <EnrichedImage className="att-result-collapsed-image" placeId={item.placeId} fallbackSrc={item.image} />
            <div className="att-result-collapsed-overlay">
              {item.subtitle && <RatingRow text={item.subtitle} />}
              <div className="att-result-collapsed-title">{item.title}</div>
            </div>
          </div>
        ))}
      </div>

      {content.followUps.length > 0 && (
        <div className="att-result-prompt-row">
          <div className="att-result-prompt-icons">
            <div className="att-result-prompt-icon-btn">
              <img src="/images/l1/keyboard.svg" alt="" />
            </div>
            <div className="att-result-prompt-icon-btn">
              <img src="/images/l1/mic.svg" alt="" />
            </div>
          </div>
          {content.followUps.map((prompt, i) => (
            <div className="att-result-prompt-pill" key={i}>{prompt}</div>
          ))}
        </div>
      )}
    </div>
  );
}
