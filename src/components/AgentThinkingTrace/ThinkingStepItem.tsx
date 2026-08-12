import type { ThinkingStep, ThinkingStepStatus } from '../../types/thinking';
import { STEP_ROW_HEIGHT } from './layoutConstants';

export default function ThinkingStepItem({
  step,
  status,
}: {
  step: ThinkingStep;
  status: ThinkingStepStatus;
}) {
  return (
    <div className={`att-step att-step--${status}`} style={{ height: STEP_ROW_HEIGHT }}>
      <span className="att-step-dot-col">
        <span className="att-step-dot" />
      </span>
      <span className="att-step-label">{step.label}</span>
    </div>
  );
}
