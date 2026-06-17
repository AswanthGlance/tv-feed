import type { FeedItem } from '../data/types';

/* ─────────────────────────────────────────────────────────────────────────────
   Glance Configuration — maps each feed item to its layout variant and
   product card configuration. Configuration-driven, no per-item components.
   ───────────────────────────────────────────────────────────────────────────── */

export type GlanceLayout = 'left' | 'center' | 'right';

export type GlanceConfig = {
  layout: GlanceLayout;
  /** Override title font size (px). Defaults per layout. */
  titleSize?: number;
  /** Show location chip — defaults to !!item.locationLabel */
  showLocation?: boolean;
  /** Number of product cards to show (0 = none, default 2) */
  cardCount?: number;
  /** CTA label override — defaults to item.ctaLabel */
  ctaOverride?: string;
  /**
   * When true: title opens huge and centred, then migrates to bottom-left.
   * This is the Phase 2 cinematic sequence for left-layout items.
   */
  cinematicTitle?: boolean;
};

/* ── Per-item config map ──────────────────────────────────────────────────── */
const CONFIG_MAP: Record<string, GlanceConfig> = {
  'eatly-dawn': { layout: 'left',   cardCount: 2 },
  'feed-04': { layout: 'left' },
  'feed-07': { layout: 'left' },
  'feed-08': { layout: 'right', cardCount: 0 },
  'feed-09': { layout: 'left' },
  'feed-11': { layout: 'right', cardCount: 0 },
  'feed-13': { layout: 'center', cardCount: 0 },
  'feed-15': { layout: 'center' },
  'feed-16': { layout: 'left', cardCount: 0 },
  'feed-18': { layout: 'center', cardCount: 0 },
  'feed-22': { layout: 'left', cardCount: 0 },
  'feed-24': { layout: 'center', cardCount: 0 },
  'feed-25': { layout: 'right', cardCount: 0 },
  'feed-28': { layout: 'center', cardCount: 0 },
  'feed-29': { layout: 'left', cardCount: 0 },
  'feed-31': { layout: 'left' },
  'feed-32': { layout: 'center', cardCount: 0 },
  'feed-33': { layout: 'center', cardCount: 0 },
  'feed-34': { layout: 'center', cardCount: 0 },
  'feed-36': { layout: 'left' },
  'feed-40': { layout: 'center', cardCount: 0 },
  'feed-42': { layout: 'left', cardCount: 0 },
  'feed-44': { layout: 'left', cardCount: 0 },
  'feed-45': { layout: 'left', cardCount: 0 },
  'feed-46': { layout: 'center' },
  'feed-47': { layout: 'center', cardCount: 0 },
  'feed-49': { layout: 'left', cardCount: 0 },
  'feed-50': { layout: 'left', cardCount: 0 },
  'feed-52': { layout: 'right', cardCount: 0 },
  'feed-54': { layout: 'left', cardCount: 0 },
  'feed-58': { layout: 'right', cardCount: 0 },
  'feed-59': { layout: 'left' },
  'feed-60': { layout: 'left', cardCount: 0 },
  'feed-63': { layout: 'center', cardCount: 0 },
  'feed-64': { layout: 'left', cardCount: 0 },
  'feed-65': { layout: 'right', cardCount: 0 },

  // ── Cold Start feed items ─────────────────────────────────────────────────
  'cs-balcony-escape':   { layout: 'left',   cardCount: 0 },
  'cs-gond-art':         { layout: 'center', cardCount: 0 },
  'cs-gold-stack':       { layout: 'right',  cardCount: 0 },
  'cs-monsoon-football': { layout: 'left',   cardCount: 0 },
  'cs-mysore-bonda':     { layout: 'center', cardCount: 0 },
  'cs-shivanasamudra':   { layout: 'right',  cardCount: 0 },
  'cs-vidhana-soudha':   { layout: 'left',   cardCount: 0 },
  'cs-sunnys':           { layout: 'center', cardCount: 0 },
  'cs-pour-over':        { layout: 'left',   cardCount: 0 },
  'cs-therpup':          { layout: 'right',  cardCount: 0 },
  'cs-vinyasa-cubbon':   { layout: 'center', cardCount: 0 },

  // ── Warm Start feed items ─────────────────────────────────────────────────
  'ws-india-afg':   { layout: 'left',   cardCount: 0 },
  'ws-nandi-hills': { layout: 'right',  cardCount: 0 },
  'ws-om-beach':    { layout: 'center', cardCount: 0 },
  'ws-coorg':       { layout: 'left',   cardCount: 0 },
  'ws-amalfi':      { layout: 'right',  cardCount: 0 },
  'ws-wind-down':   { layout: 'center', cardCount: 0 },
  'ws-vinyl-ritual':{ layout: 'left',   cardCount: 0 },
  'ws-gehra-hua':   { layout: 'right',  cardCount: 0 },
};

const FALLBACK_LAYOUTS: GlanceLayout[] = ['left', 'right', 'center'];

export function getGlanceConfig(item: FeedItem): GlanceConfig {
  if (CONFIG_MAP[item.id]) return CONFIG_MAP[item.id];
  // Deterministic fallback for unmapped items
  const hash = item.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return { layout: FALLBACK_LAYOUTS[hash % 3] };
}

/* ── Layout geometry constants ────────────────────────────────────────────── */

export const LAYOUT_GEOMETRY: Record<GlanceLayout, {
  textLeft: number | string;
  textRight?: number | string;
  textAlign: 'left' | 'center' | 'right';
  maxWidth: number;
  titleSize: number;
  mascotSize: number;
  bottomInset: number;
}> = {
  left: {
    textLeft: 80,
    textAlign: 'left',
    maxWidth: 820,
    titleSize: 58,
    mascotSize: 48,
    bottomInset: 72,
  },
  center: {
    textLeft: '50%',
    textAlign: 'center',
    maxWidth: 900,
    titleSize: 68,
    mascotSize: 72,
    bottomInset: 72,
  },
  right: {
    textLeft: undefined as any,
    textRight: 80,
    textAlign: 'right',
    maxWidth: 780,
    titleSize: 52,
    mascotSize: 56,
    bottomInset: 72,
  },
};
