import { EVIDENCE_LEFT, HEADLINE_CONNECT_Y, TIMELINE_RIGHT_EDGE, activeDotY } from './layoutConstants';

/* A plain right-angle elbow (step -> midpoint -> headline), not a curve.
 * The reference's decorative bezier didn't hold up once the layout changed
 * category to category — a straight elbow stays clean at any vertical
 * offset between the active step and the (fixed) headline position. */
export default function ActiveWorkConnector({ activeStepIndex }: { activeStepIndex: number }) {
  if (activeStepIndex < 0) return null;

  const y1 = activeDotY(activeStepIndex);
  const x1 = TIMELINE_RIGHT_EDGE;
  const midX = x1 + (EVIDENCE_LEFT - x1) * 0.45;

  const d = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${HEADLINE_CONNECT_Y} L ${EVIDENCE_LEFT} ${HEADLINE_CONNECT_Y}`;

  return (
    <svg className="att-connector" width="1920" height="1080" viewBox="0 0 1920 1080">
      <circle cx={x1} cy={y1} r="3" />
      <path d={d} />
    </svg>
  );
}
