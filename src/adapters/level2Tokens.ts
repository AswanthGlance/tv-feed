import type { CardImportance, ProgressiveItemState } from '../types/progressiveValue';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 UI TOKENS — every tunable visual-hierarchy value for the analysis
   grid / candidate card, centralized so the CSS/TSX never repeats a magic
   number. This is a presentation-only file (see level2-ui-polish agent
   scope) — nothing here changes what counts as a candidate or who wins.
   ───────────────────────────────────────────────────────────────────────────── */

/** Fixed width:height ratio for every card's media frame, at every tier,
 *  every candidate count, and in the resolved rail. The frame's absolute
 *  size grows with the card; its SHAPE never changes — the hard requirement
 *  that fixes "image height jumps between states." Chosen to match the
 *  app's existing feed photography (landscape hero shots: roads, coastlines,
 *  cabins) without cropping them into an awkward tall sliver. */
export const CARD_MEDIA_ASPECT = 1.22; // width / height

/** How much wider than a baseline (weight 1) card each item state renders,
 *  as a REAL width (not a `scale` transform) — the fix for the grid-
 *  collision bug: because this changes the actual box the card occupies,
 *  flexbox naturally reflows/repositions every neighbor, it never just
 *  paints over them.
 *
 *  Every state stays at the SAME baseline weight except `promoted` —
 *  candidates render visually equal all the way through discover/enrich/
 *  compare/negate/shortlist, and only start differing in size once the
 *  agent actually picks a strongest option. Varying size earlier (a
 *  shortlisted card growing, a negated one shrinking) read as "these are
 *  already different sizes and nobody's been promoted yet" rather than
 *  meaningful signal — the promotion moment itself is what should look
 *  different, not a gradual drift beforehand. */
export const CARD_STATE_WIDTH_WEIGHT: Record<ProgressiveItemState, number> = {
  discovered: 1,
  enriched: 1,
  negated: 1,
  shortlisted: 1,
  promoted: 1.2,
  removed: 1,
};
/** Same principle as CARD_STATE_WIDTH_WEIGHT above — no narrowing before a
 *  strongest option is picked. */
export const DEPRIORITIZED_WIDTH_WEIGHT = 1;

/** Row gap by candidate count — the container's uniform `gap`. Bumped up
 *  from the original 22/16/12 baseline toward the brief's ~24–28px
 *  standard↔standard target while still leaving room for 8–10 candidates
 *  to fit one row. */
export const ANALYSIS_GAP_BY_COUNT = (n: number): number => (n <= 4 ? 26 : n <= 6 ? 20 : n <= 9 ? 16 : 13);

/** Per-tier ceiling on the baseline (weight-1) card width, so a small pool
 *  (1–3 candidates) doesn't render absurdly oversized cards. */
export const TIER_MAX_WIDTH_BY_COUNT = (n: number): number => (n <= 4 ? 264 : n <= 6 ? 224 : n <= 9 ? 186 : 152);

/** Extra breathing room (px, applied as margin on EACH side of the card)
 *  added on top of the base row gap for a promoted card only — see
 *  CARD_STATE_WIDTH_WEIGHT's comment: no other state gets special
 *  spacing before a strongest option is picked. Together with the base gap
 *  this lands in the brief's ~32–48px promoted↔standard target range
 *  without needing per-pair custom flex gap math. */
export const PROMOTED_EXTRA_GUTTER = 11;

/** Title font size per content-density tier — modest steps (never the old
 *  22px -> 34px / +54% jump), matching "importance moves typography only
 *  10–20%, never 100%+." Compact is handled separately (a candidate-COUNT
 *  density concern, not a hierarchy tier) and keeps its own smaller size. */
export const TITLE_FONT_SIZE: Record<Exclude<CardImportance, 'compact'>, number> = {
  standard: 22,
  shortlisted: 23,
  promoted: 25,
  resolved: 23,
};

/** How many lines a title may wrap to per tier — 2 lines everywhere except
 *  the two "hero" tiers, which can afford a 3rd line given their larger
 *  footprint. */
export const TITLE_LINE_CLAMP: Record<CardImportance, number> = {
  compact: 2,
  standard: 2,
  shortlisted: 2,
  promoted: 3,
  resolved: 3,
};

/** SUPPORTING LINE — the single-line-each evidence / stayOption / judgment
 *  rows. Budget = how many of them a tier may show at once; priority = the
 *  order they compete for those slots (judgment first — the agent's own
 *  concluding read is the highest-value single line when only one fits).
 *  Compact never shows any (rating-only, per the card-state spec). */
export type SupportingLineKey = 'judgment' | 'evidence' | 'stayOption';
export const SUPPORTING_LINE_BUDGET: Record<CardImportance, number> = {
  compact: 0,
  standard: 1,
  shortlisted: 2,
  promoted: 1,
  resolved: 2,
};
export const SUPPORTING_LINE_PRIORITY: SupportingLineKey[] = ['judgment', 'evidence', 'stayOption'];
