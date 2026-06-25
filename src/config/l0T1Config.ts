/**
 * l0T1Config.ts — Single source of truth for all L0 T1 motion lab timings.
 *
 * All durations in milliseconds. Edit here; nothing is hardcoded elsewhere in the lab.
 * These constants feed directly into the Android TV handoff spec.
 */

/* ── State durations ─────────────────────────────────────────────────────── */

/** State 1: BG fades in + parallax zoom-out spread */
export const BG_REVEAL_MS            = 1000;
/** State 1: hold after BG before anything else moves */
export const BG_HOLD_MS              = 0;   // BG and overlay overlap intentionally
/** Overlay fade */
export const OVERLAY_REVEAL_MS       = 850;
/** Header slide-down (first card only) */
export const HEADER_REVEAL_MS        = 500;
/** Tag badge slide-up */
export const TAG_REVEAL_MS           = 400;
/** Title word-mask reveal (spread across words with 70ms stagger) */
export const TITLE_REVEAL_MS         = 800;
/** Hold after title before agent appears */
export const TITLE_HOLD_MS           = 1000;

/** State 2: Mascot float-in at hero size */
export const AGENT_REVEAL_MS         = 600;
/** Hold after mascot appears before reasoning starts */
export const AGENT_HOLD_MS           = 1000;

/** State 3: Reasoning blur→sharp character reveal spread */
export const REASONING_REVEAL_MS     = 4500;
/** State 3: Hold after reasoning completes — user reads */
export const REASONING_HOLD_MS       = 5000;

/** State 4: Mascot + reasoning scale down simultaneously */
export const HERO_SHRINK_MS          = 500;
/** Hold after shrink before agent looks */
export const HERO_SHRINK_HOLD_MS     = 500;

/** Pause between agent-look and CTA pill appearing */
export const AGENT_LOOK_TO_CTA_MS    = 650;
/** State 5: CTA pill slides up */
export const CTA_PILL_REVEAL_MS      = 350;
/** Mascot FLIP arc total */
export const MASCOT_FLIP_MS          = 700;
/** Settle pause inside CTA before text starts */
export const CTA_SETTLE_MS           = 380;

/** State 7: CTA text blur→sharp character reveal spread */
export const CTA_TEXT_REVEAL_MS      = 1400;
/** Margin before beam/glow fires */
export const BEAM_MARGIN_MS          = 150;

/** State 8: Final resting hold */
export const FINAL_HOLD_MS           = 10_000;

/* ── Background drift (during State 8 final hold) ───────────────────────── */
export const BACKGROUND_DRIFT_MS     = 14_000;
export const BACKGROUND_DRIFT_SCALE  = 1.025;
export const BACKGROUND_DRIFT_PAN_X  = 0.6;
export const BACKGROUND_DRIFT_PAN_Y  = 0.3;

/* ── Mascot scale ────────────────────────────────────────────────────────── */
export const MASCOT_HERO_SIZE        = 56;   // px — Figma: 56px while reasoning delivers
export const MASCOT_FINAL_SIZE       = 40;   // px — Figma: 40px resting / in CTA
export const MASCOT_CTA_SIZE         = 40;
export const MASCOT_HERO_SCALE       = 1.0;
export const MASCOT_FINAL_SCALE      = MASCOT_FINAL_SIZE / MASCOT_HERO_SIZE; // 0.714

/* ── Reasoning scale ─────────────────────────────────────────────────────── */
export const REASONING_HERO_SCALE    = 1.0;
export const REASONING_FINAL_SCALE   = 0.78;

/* ── Figma-spec layout values (1920×1080 canvas) ─────────────────────────── */
export const LAYOUT = {
  CONTENT_LEFT:          80,    // px — all content anchors to 80px left
  TITLE_TOP:             228,   // px — Reason block top
  REASONING_TOP:         808,   // px — chat text top
  CTA_BOTTOM:            72,    // px — distance from bottom
  CTA_HEIGHT:            72,    // px
  CTA_RADIUS:            72,    // px
  FEEDBACK_LEFT:         602,   // px — like/dislike chip
  SHOP_LEFT:             1576,  // px — shop products card
  SHOP_WIDTH:            278,   // px
} as const;

/* ── Dev overlay ─────────────────────────────────────────────────────────── */
export const DEV_OVERLAY_KEY = 'D';

/* ── State labels ─────────────────────────────────────────────────────────── */
export const STATES = [
  { id: 1, key: '1', label: 'Title Reveal',    shortcut: '1' },
  { id: 2, key: '2', label: 'Agent Reveal',    shortcut: '2' },
  { id: 3, key: '3', label: 'Reasoning',       shortcut: '3' },
  { id: 4, key: '4', label: 'Hero Shrink',     shortcut: '4' },
  { id: 5, key: '5', label: 'CTA Entry',       shortcut: '5' },
  { id: 6, key: '6', label: 'CTA Expand',      shortcut: '6' },
  { id: 7, key: '7', label: 'CTA Text',        shortcut: '7' },
  { id: 8, key: '8', label: 'Final Hold',      shortcut: '8' },
] as const;

export type LabState = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
