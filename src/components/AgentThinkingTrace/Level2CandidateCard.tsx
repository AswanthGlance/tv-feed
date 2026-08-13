import { useEffect, useState } from 'react';
import { FocusButton } from '../L1/l1SharedComponents';
import { DotsIcon, HeartIcon } from '../L1/TravelL1';
import EnrichedImage from './level2/EnrichedImage';
import { pickLocalFallbackImage } from '../../adapters/localImageFallback';
import type { RequestedAttribute } from '../../adapters/cardImportance';
import {
  CARD_MEDIA_ASPECT,
  SUPPORTING_LINE_BUDGET,
  SUPPORTING_LINE_PRIORITY,
  TITLE_FONT_SIZE,
  TITLE_LINE_CLAMP,
  type SupportingLineKey,
} from '../../adapters/level2Tokens';
import type { CardImportance, ProgressiveItem } from '../../types/progressiveValue';

/* The four-tier image resolver now lives in level2/EnrichedImage.tsx so the
   thinking tile and this final card share ONE implementation — see that file
   for the tier documentation. `EnrichedCardImage` is kept as a thin local
   alias so this component's call sites read unchanged. */
const EnrichedCardImage = EnrichedImage;

/** Which optional facts a tier is allowed to show, and how many — query-
 *  requested attributes (see extractRequestedFields) win the limited slots
 *  first; anything else populated fills remaining slots in a fixed default
 *  order. Shortlisted/promoted/resolved show everything real regardless. */
/* Pre-resolve tiers (compact/standard/shortlisted) also carry a title that
 * can run to 2-3 lines plus, at shortlisted, evidence/stayOption/judgment
 * rows below — real trace data confirmed 4 facts stacked on top of that can
 * overflow a fixed-height card and starve the image (see
 * .att-l2-card-image-wrap's min-height floor, the backstop for whatever this
 * budget still lets through). Resolved is the crystallized 400×480 footprint
 * with room to spare and no competing evidence/stayOption rows, so it alone
 * keeps the fuller budget. */
const TIER_FACT_BUDGET: Record<CardImportance, number> = {
  compact: 1,
  standard: 2,
  shortlisted: 2,
  promoted: 2,
  resolved: 4,
};

type FactKey = 'rating' | 'travelTime' | 'priceLevel' | 'availability';
const REQUESTED_TO_FACT: Record<RequestedAttribute, FactKey> = {
  rating: 'rating',
  price: 'priceLevel',
  availability: 'availability',
  travelTime: 'travelTime',
};

/** Which of the single-line SUPPORTING rows (judgment / evidence / stay
 *  option) a tier is allowed to show at once — see level2Tokens.ts for the
 *  budget-per-tier and priority-order tables this reads. Availability still
 *  depends on the tier's own display rules (stayOption only ever appears
 *  once a candidate is at least shortlisted — see `isShortlisted` below —
 *  independent of whether the DATA exists earlier). Keeps promoted from
 *  stacking evidence + stayOption + judgment on top of each other (the
 *  height-overflow risk that used to starve the image), while still letting
 *  shortlisted/resolved show a little more since they have the room. */
function orderedSupportingLines(
  meta: ProgressiveItem['metadata'],
  importance: CardImportance,
  isShortlistedOrAbove: boolean
): SupportingLineKey[] {
  const available: SupportingLineKey[] = [];
  if (meta?.judgment != null) available.push('judgment');
  if (meta?.evidence?.length) available.push('evidence');
  if (isShortlistedOrAbove && meta?.stayOption != null) available.push('stayOption');

  const budget = SUPPORTING_LINE_BUDGET[importance];
  return SUPPORTING_LINE_PRIORITY.filter((k) => available.includes(k)).slice(0, budget);
}

function orderedFacts(meta: ProgressiveItem['metadata'], importance: CardImportance, requestedFields: RequestedAttribute[]): FactKey[] {
  const available: FactKey[] = [];
  if (meta?.rating != null) available.push('rating');
  if (meta?.travelTime) available.push('travelTime');
  if (meta?.priceLevel) available.push('priceLevel');
  if (meta?.availability) available.push('availability');

  // Compact has room for exactly one glanceable fact — always rating (the
  // spec's own compact example: image, title, rating only), never swapped
  // out for a query-requested attribute there just isn't space for.
  if (importance === 'compact') return available.includes('rating') ? ['rating'] : [];

  const priority = requestedFields.map((f) => REQUESTED_TO_FACT[f]);
  const ordered = [...priority, ...available].filter((f, i, arr) => available.includes(f) && arr.indexOf(f) === i);
  return ordered.slice(0, TIER_FACT_BUDGET[importance]);
}

/** One card, one stable DOM identity for the item's whole lifetime
 *  (discovered -> enriched -> negated -> shortlisted/removed -> promoted ->
 *  resolved). Information accumulates into the same node via conditional
 *  child rows driven by `state`/`metadata`/`importance` rather than swapping
 *  in a different component per state, so the card reads as "learning more,"
 *  not "being replaced." All transition timing (including size/position) is
 *  CSS (state class change), never a per-card timer.
 *
 *  This is also the SAME component used for the crystallized final answer —
 *  see `importance === 'resolved'`. There is no separate "result card"
 *  component: once the promoted candidate resolves, this exact node just
 *  gains a CTA row (reusing L1's own FocusButton/DotsIcon/HeartIcon, not an
 *  invented style) rather than the app swapping to a different visual tree.
 *
 *  `importance` (see src/adapters/cardImportance.ts) is the single source of
 *  truth for CONTENT DENSITY — which optional rows render — and is a
 *  separate axis from `item.state` (which drives the emphasis styling:
 *  border/glow/scale, unchanged below) and from `crystallized`/`focused`
 *  (phase-level rail sizing / TV remote-nav ring, neither of which is a
 *  content-density concern).
 *
 *  Deliberately mixes several signals beyond size — border/glow emphasis,
 *  opacity/saturation, and a typographic split between FACT (travel time,
 *  rating, price, availability — plain, light color), EVIDENCE (short data
 *  bullets — quiet, joined into one line) and JUDGMENT (the agent's own
 *  concluding read — bold, uppercase, accent-colored) — so "why this card
 *  matters" doesn't rely on "is it bigger than the others."
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
  importance,
  crystallized = false,
  focused = false,
  requestedFields = [],
  cardWidth,
  extraGutter = 0,
  railTier,
  onImageTierResolved,
  cardRef,
}: {
  item: ProgressiveItem;
  /** Content-density tier — see src/adapters/cardImportance.ts. `'resolved'`
   *  is true for exactly one card, the promoted winner once the journey has
   *  crystallized: it's the only tier that reveals the CTA row and the
   *  "Top Pick" badge. */
  importance: CardImportance;
  /** True for every still-visible card once the journey has fully
   *  crystallized (phase === 'result') — settles every card to the same
   *  rail footprint/typography so the ending reads as "these are your
   *  options," not "one card that grew." Purely a sizing axis, independent
   *  of `importance`'s content-density tier (a resolved-phase non-winner
   *  card is `importance='standard'` + `crystallized=true`). */
  crystallized?: boolean;
  /** True for whichever rail card currently has remote/keyboard focus
   *  (LEFT/RIGHT navigation, see Level2Experience) — the TV focus ring, not
   *  a native DOM :focus. Meaningless (never true) during analysis. */
  focused?: boolean;
  /** Attribute types the user's own query named explicitly (see
   *  extractRequestedFields) — wins the limited fact-row slots at
   *  compact/standard tiers ahead of incidental data. */
  requestedFields?: RequestedAttribute[];
  /** This card's real rendered width in px during analysis (see
   *  Level2Experience's getCardWidths) — a REAL box size driven by the
   *  item's state weight, not a `scale` transform, so growing/shrinking
   *  actually reflows neighbors instead of overlapping them. Undefined once
   *  `crystallized` (the fixed rail footprint takes over via CSS). */
  cardWidth?: number;
  /** Extra per-side margin (px) for shortlisted/promoted cards during
   *  analysis, on top of the row's base gap — see getCardExtraGutter. 0
   *  (no-op) once crystallized. */
  extraGutter?: number;
  /** Rank-based recession for a resolved-rail peer that isn't the winner —
   *  undefined/'primary' (the winner itself, or the first alternate right
   *  after it) renders at full weight; 'secondary'/'tertiary' fade+shrink a
   *  notch further per step. Derived in Level2Experience from the card's
   *  real position in resultOrder (the agent's own real response order —
   *  see that file's comments), and ONLY when a real winner exists; never
   *  set during the honest no-promote-signal settle, where there's no real
   *  signal to base a rank on. */
  railTier?: 'secondary' | 'tertiary';
  /** Dev-diagnostics hook: which of the 4 image-fallback tiers actually
   *  rendered for this card. Only wired up for the card(s) DevInspector is
   *  currently showing — cheap to leave undefined everywhere else. */
  onImageTierResolved?: (tier: number) => void;
  /** Registers/deregisters this card's root DOM node for the winner-
   *  promotion FLIP animation (see useWinnerPromotionFlip.ts) — needs the
   *  real node to read its rendered position and to hide it during the
   *  ghost's flight. Cheap no-op when undefined (analysis-only render). */
  cardRef?: (el: HTMLDivElement | null) => void;
}) {
  const meta = item.metadata ?? {};
  const isPromoted = item.state === 'promoted';
  const isNegated = item.state === 'negated';
  const isShortlisted = item.state === 'shortlisted' || isPromoted;
  const isDeprioritized = item.state === 'enriched' && !!meta.deprioritized;
  const isCompact = importance === 'compact';
  const isResolvedCard = importance === 'resolved';
  const evidenceText = meta.evidence?.length ? meta.evidence.join(' · ') : undefined;
  const changeSignature = `${item.state}|${JSON.stringify(meta)}`;

  const facts = orderedFacts(meta, importance, requestedFields);
  const FACT_LABEL: Record<FactKey, string> = {
    rating: meta.rating != null ? `${Number(meta.rating).toFixed(1)}★` : '',
    travelTime: meta.travelTime ? `${String(meta.travelTime)} drive` : '',
    priceLevel: meta.priceLevel ? String(meta.priceLevel) : '',
    availability: meta.availability ? String(meta.availability) : '',
  };

  // One-line supporting rows (judgment / evidence / stayOption) — budgeted
  // and priority-ordered per tier (see level2Tokens.ts) so a growing card
  // gains ONE clear "why this matters" line, never all three stacked (the
  // height-overflow / image-starving risk the tier budget exists to avoid).
  // Selection uses judgment-first priority (see level2Tokens.ts — the
  // single most valuable line when only one fits); DISPLAY order stays
  // data-before-opinion (evidence -> stayOption -> judgment) so judgment's
  // bold/uppercase/gold treatment still reads as "the closing read," same
  // as before this pass.
  const DISPLAY_ORDER: SupportingLineKey[] = ['evidence', 'stayOption', 'judgment'];
  const supportingLines = orderedSupportingLines(meta, importance, isShortlisted).sort(
    (a, b) => DISPLAY_ORDER.indexOf(a) - DISPLAY_ORDER.indexOf(b)
  );
  const SUPPORTING_RENDER: Record<SupportingLineKey, { key: string; className: string; text: string } | null> = {
    judgment: meta.judgment != null ? { key: String(meta.judgment), className: 'att-l2-card-judgment', text: String(meta.judgment) } : null,
    evidence: evidenceText ? { key: evidenceText, className: 'att-l2-card-evidence', text: evidenceText } : null,
    stayOption: meta.stayOption != null ? { key: String(meta.stayOption), className: 'att-l2-card-stay', text: String(meta.stayOption) } : null,
  };

  // Real box geometry (see Level2Experience's getCardWidths/getCardExtraGutter)
  // plus the title's tier-driven size/clamp — all passed as CSS custom
  // properties so the CSS stays the single place that consumes them, and
  // level2Tokens.ts stays the single place that defines them. Undefined
  // cardWidth (once crystallized) leaves the CSS's own fixed-rail rule in
  // control.
  const cardStyle: React.CSSProperties & Record<string, string | number> = {
    '--l2-title-size': `${importance === 'compact' ? 15 : TITLE_FONT_SIZE[importance]}px`,
    '--l2-title-clamp': TITLE_LINE_CLAMP[importance],
  };
  if (cardWidth != null) cardStyle['--l2-card-w'] = `${cardWidth}px`;
  if (extraGutter) cardStyle.marginLeft = cardStyle.marginRight = extraGutter;

  return (
    <div
      ref={cardRef}
      className={`att-l2-card att-l2-card--${item.state} att-l2-card--importance-${importance}${isDeprioritized ? ' att-l2-card--deprioritized' : ''}${isResolvedCard ? ' att-l2-card--resolved' : ''}${crystallized ? ' att-l2-card--crystallized' : ''}${isCompact ? ' att-l2-card--compact' : ''}${focused ? ' att-l2-card--focused' : ''}${isResolvedCard ? ' att-l2-card--top-pick' : ''}${railTier ? ` att-l2-card--rail-${railTier}` : ''}`}
      style={cardStyle}
    >
      <div key={changeSignature} className="att-l2-card-shimmer" aria-hidden />
      <div className="att-l2-card-image-wrap" style={{ aspectRatio: CARD_MEDIA_ASPECT }}>
        <EnrichedCardImage
          itemId={item.id}
          itemTitle={item.title}
          className="att-l2-card-image"
          placeId={meta.placeId as string | undefined}
          fallbackSrc={item.image}
          onTierResolved={onImageTierResolved}
        />
        {isPromoted && !isResolvedCard && <span className="att-l2-card-promoted-badge">Emerging pick</span>}
        {isResolvedCard && <span className="att-l2-card-promoted-badge att-l2-card-promoted-badge--top">Top Pick</span>}
      </div>
      <div className="att-l2-card-body">
        <div className="att-l2-card-title">{item.title}</div>

        {!isCompact && !meta.travelTime && item.subtitle && (
          <div className="att-l2-card-subtitle">{item.subtitle}</div>
        )}

        {facts.length > 0 && (
          <div className="att-l2-card-facts">
            {facts.map((key) => (
              <span key={key} className="att-l2-shimmer-in">{FACT_LABEL[key]}</span>
            ))}
          </div>
        )}

        {isNegated && meta.negationReason != null && (
          <div className="att-l2-card-negation att-l2-shimmer-in">{String(meta.negationReason)}</div>
        )}

        {supportingLines.map((k) => {
          const row = SUPPORTING_RENDER[k];
          if (!row) return null;
          return (
            <div key={row.key} className={`${row.className} att-l2-shimmer-in`}>{row.text}</div>
          );
        })}

        {isResolvedCard && (
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
