import type { ThinkingStep, ThinkingStepStatus } from '../../types/thinking';
import ThinkingStepItem from './ThinkingStepItem';
import { STEP_ROW_HEIGHT } from './layoutConstants';

export default function ThinkingTimeline({
  steps,
  statuses,
  activeStepIndex,
}: {
  steps: ThinkingStep[];
  statuses: ThinkingStepStatus[];
  activeStepIndex: number;
}) {
  // Only steps that have actually started render — future steps aren't
  // pre-listed as placeholders, matching the reference's progressive reveal.
  const visibleCount = Math.min(steps.length, Math.max(activeStepIndex + 1, 0));
  // Flexbox stacks every row at exactly STEP_ROW_HEIGHT, so consecutive dot
  // centers are always exactly STEP_ROW_HEIGHT apart — no manual index*height
  // math to get out of sync with the actual rendered rows.
  const lineHeight = Math.max(visibleCount - 1, 0) * STEP_ROW_HEIGHT;

  return (
    <div className="att-timeline">
      {visibleCount > 1 && <div className="att-timeline-line" style={{ height: lineHeight }} />}
      {steps.slice(0, visibleCount).map((step, i) => (
        <ThinkingStepItem key={step.id} step={step} status={statuses[i]} />
      ))}
    </div>
  );
}
