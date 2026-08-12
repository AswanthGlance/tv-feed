import { FocusButton } from '../L1/l1SharedComponents';
import { DotsIcon, HeartIcon } from '../L1/TravelL1';
import type { ProgressiveItem } from '../../types/progressiveValue';

/** One card, one stable DOM identity for the item's whole lifetime
 *  (discovered -> enriched -> negated -> shortlisted/removed -> promoted ->
 *  resolved). Information accumulates into the same node via conditional
 *  child rows driven by `state`/`metadata` rather than swapping in a
 *  different component per state, so the card reads as "learning more," not
 *  "being replaced." All transition timing (including size/position) is CSS
 *  (state class change), never a per-card timer.
 *
 *  This is also the SAME component used for the crystallized final answer —
 *  see the `resolved` prop. There is no separate "result card" component:
 *  once the promoted candidate resolves, this exact node just gains a CTA
 *  row (reusing L1's own FocusButton/DotsIcon/HeartIcon, not an invented
 *  style) rather than the app swapping to a different visual tree.
 *
 *  Deliberately mixes several signals beyond size — border/glow emphasis,
 *  opacity/saturation, and a typographic split between FACT (travel time,
 *  rating — plain, light color), EVIDENCE (short data bullets — quiet,
 *  joined into one line) and JUDGMENT (the agent's own concluding read —
 *  bold, uppercase, accent-colored) — so "why this card matters" doesn't
 *  rely on "is it bigger than the others."
 *
 *  Every value below is `key`-ed by its own content, not just conditionally
 *  rendered — a row that's already on screen (e.g. `judgment` going from
 *  "GOOD BALANCE" to "BEST OVERALL WEEKEND FIT" at PROMOTE) still needs a
 *  fresh DOM node to replay its shimmer-in when the *value* changes, not
 *  just the first time it appears.
 *
 *  On top of that, `changeSignature` below fingerprints the item's whole
 *  state+metadata so the CARD ITSELF (not just the one line that changed)
 *  gets a full-surface shimmer sweep every time anything about it updates —
 *  a single per-line shimmer was too easy to miss ("is this still working,
 *  or done?"); a full-card sweep at a longer, clearly-visible duration
 *  isn't. */
export default function Level2CandidateCard({
  item,
  resolved = false,
  crystallized = false,
}: {
  item: ProgressiveItem;
  /** True only for the promoted candidate once the journey has fully
   *  crystallized — reveals the CTA row. Never true for anyone else. */
  resolved?: boolean;
  /** True for every still-visible card once the journey has fully
   *  crystallized (phase === 'result') — settles every card to the same
   *  footprint/typography so the ending reads as "these are your options",
   *  not "one card that grew". Independent of `resolved`, which only
   *  controls the CTA row on the winning card. */
  crystallized?: boolean;
}) {
  const meta = item.metadata ?? {};
  const isPromoted = item.state === 'promoted';
  const isNegated = item.state === 'negated';
  const isShortlisted = item.state === 'shortlisted' || isPromoted;
  const isDeprioritized = item.state === 'enriched' && !!meta.deprioritized;
  const evidenceText = meta.evidence?.length ? meta.evidence.join(' · ') : undefined;
  const changeSignature = `${item.state}|${JSON.stringify(meta)}`;

  return (
    <div
      className={`att-l2-card att-l2-card--${item.state}${isDeprioritized ? ' att-l2-card--deprioritized' : ''}${resolved ? ' att-l2-card--resolved' : ''}${crystallized ? ' att-l2-card--crystallized' : ''}`}
    >
      <div key={changeSignature} className="att-l2-card-shimmer" aria-hidden />
      <div className="att-l2-card-image-wrap">
        {item.image && <img className="att-l2-card-image" src={item.image} alt="" />}
        {isPromoted && !resolved && <span className="att-l2-card-promoted-badge">Emerging pick</span>}
      </div>
      <div className="att-l2-card-body">
        <div className="att-l2-card-title">{item.title}</div>

        {!meta.travelTime && item.subtitle && (
          <div className="att-l2-card-subtitle">{item.subtitle}</div>
        )}

        {(meta.travelTime || meta.rating != null) && (
          <div className="att-l2-card-facts">
            {meta.travelTime && (
              <span key={String(meta.travelTime)} className="att-l2-shimmer-in">{String(meta.travelTime)} drive</span>
            )}
            {meta.rating != null && (
              <span key={meta.rating} className="att-l2-shimmer-in">{Number(meta.rating).toFixed(1)}★</span>
            )}
          </div>
        )}

        {isNegated && meta.negationReason != null && (
          <div className="att-l2-card-negation att-l2-shimmer-in">{String(meta.negationReason)}</div>
        )}

        {evidenceText && (
          <div key={evidenceText} className="att-l2-card-evidence att-l2-shimmer-in">{evidenceText}</div>
        )}

        {isShortlisted && meta.stayOption != null && (
          <div className="att-l2-card-stay att-l2-shimmer-in">{String(meta.stayOption)}</div>
        )}

        {meta.judgment != null && (
          <div key={String(meta.judgment)} className="att-l2-card-judgment att-l2-shimmer-in">{String(meta.judgment)}</div>
        )}

        {resolved && (
          <div className="att-l2-card-cta-row">
            <div className="att-l2-card-icon-btn" aria-hidden>
              <DotsIcon color="#fff" />
            </div>
            <div className="att-l2-card-icon-btn" aria-hidden>
              <HeartIcon stroke="#fff" />
            </div>
            <FocusButton focused={false} variant="white">Check out</FocusButton>
          </div>
        )}
      </div>
    </div>
  );
}
