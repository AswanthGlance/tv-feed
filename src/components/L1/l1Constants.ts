/* ─── Layout constants (1920 × 1080 canvas) ──────────────────────────────── */
export const LEFT_PAD = 72;
export const COL_GAP  = 48;
export const CARD_GAP = 14;

/* ─── Vertical rhythm — 3-row structure ──────────────────────────────────── */
// Row 1 – top bar:       top=44, height≈80px  → baseline at ~124px
// Row 2 – agent row:     top=140
// Row 3 – renderer:      top=RENDERER_TOP    (below agent message)
// Row 3 – bottom prompts: bottom=0, height=148px
export const AGENT_TOP     = 140;   // mascot row top
export const RENDERER_TOP  = 262;   // renderer layer top (more room below agent)
export const BOTTOM_H      = 148;   // prompt row height
export const BOTTOM_PAD    = 22;    // prompt row inner vertical padding

/* ─── Unified focus token ─────────────────────────────────────────────────── */
export const FOCUS_BORDER     = '2px solid rgba(255,255,255,0.88)';
export const FOCUS_SHADOW     = '0 0 0 1px rgba(255,255,255,0.5), 0 0 18px 4px rgba(255,255,255,0.2), 0 0 48px 12px rgba(200,180,255,0.12)';
export const IDLE_BORDER      = (alpha = '0.08') => `1.5px solid rgba(255,255,255,${alpha})`;
export const FOCUS_TRANSITION = 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)';

/* ─── Animation phases ────────────────────────────────────────────────────── */
export enum ScreenPhase {
  BACKGROUND      = 'BACKGROUND',
  AGENT           = 'AGENT',
  MESSAGE         = 'MESSAGE',
  PRIMARY_CONTENT = 'PRIMARY_CONTENT',
  SECONDARY_CONTENT = 'SECONDARY_CONTENT',
  PROMPTS         = 'PROMPTS',
  COMPLETE        = 'COMPLETE',
}

/* ─── Renderer prop interface ─────────────────────────────────────────────── */
export interface RendererProps {
  focusIdx: number;
  phase: ScreenPhase;
  onScrollRequest?: (offsetPx: number) => void;
}
