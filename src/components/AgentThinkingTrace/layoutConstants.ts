/* Single source of truth for the geometry shared between the timeline, the
 * connector, and the evidence column — so they can never drift out of sync
 * with each other (the exact class of bug that produced the original
 * "disconnected dots" / misaligned connector). */
export const TIMELINE_LEFT = 72;
export const TIMELINE_TOP = 210;
export const TIMELINE_WIDTH = 460;
export const STEP_ROW_HEIGHT = 56;
export const DOT_CENTER_OFFSET = 28;

export const EVIDENCE_LEFT = 620;
export const EVIDENCE_TOP = 220;
export const HEADLINE_CONNECT_Y = EVIDENCE_TOP + 9;

export function activeDotY(activeStepIndex: number): number {
  return TIMELINE_TOP + activeStepIndex * STEP_ROW_HEIGHT + DOT_CENTER_OFFSET;
}

export const TIMELINE_RIGHT_EDGE = TIMELINE_LEFT + TIMELINE_WIDTH;
