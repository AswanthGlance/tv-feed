import type { ReactNode } from 'react';
import type { ThinkingScenario } from '../../types/thinking';
import { resolveLevel1VisualMode } from '../../adapters/level1VisualMode';
import EvidenceCanvas from './EvidenceCanvas';
import PreferenceVisual from './level1Visuals/PreferenceVisual';
import SearchVisual from './level1Visuals/SearchVisual';
import SynthesisVisual from './level1Visuals/SynthesisVisual';
import MapsVisual from './level1Visuals/MapsVisual';
import RetrievalVisual from './level1Visuals/RetrievalVisual';
import ComparisonVisual from './level1Visuals/ComparisonVisual';
import GenerationVisual from './level1Visuals/GenerationVisual';

/** Resolves activeStep -> Level1VisualMode -> the right-side visual for
 * that specific operation, using ONLY the active step's own evidence
 * (never the old accumulate-everything-since-t0 behavior, which is what
 * made every step's right panel look like the same evidence soup). Keyed
 * by step id + mode so a step change always remounts into the CSS
 * fade/blur transition rather than a hard cut. */
export default function Level1EvidenceCanvas({
  scenario,
  activeStepIndex,
  fallbackHeadline,
}: {
  scenario: ThinkingScenario | undefined;
  activeStepIndex: number;
  fallbackHeadline?: string;
}) {
  const steps = scenario?.steps ?? [];
  const activeStep = steps[activeStepIndex];
  if (!activeStep) return null;

  const mode = resolveLevel1VisualMode(activeStep);

  let content: ReactNode;
  switch (mode) {
    case 'preferences':
      content = <PreferenceVisual evidence={activeStep.evidence} />;
      break;
    case 'search':
      content = <SearchVisual evidence={activeStep.evidence} stepId={activeStep.id} />;
      break;
    case 'maps':
      content = <MapsVisual evidence={activeStep.evidence} />;
      break;
    case 'retrieval':
      content = <RetrievalVisual evidence={activeStep.evidence} />;
      break;
    case 'comparison':
      content = <ComparisonVisual evidence={activeStep.evidence} />;
      break;
    case 'generation':
      content = <GenerationVisual evidence={activeStep.evidence} />;
      break;
    case 'synthesis': {
      const prevStep = steps[activeStepIndex - 1];
      const prevIsSearch = prevStep && resolveLevel1VisualMode(prevStep) === 'search';
      content = (
        <SynthesisVisual
          evidence={activeStep.evidence}
          previousCount={prevIsSearch ? prevStep.evidence.length : undefined}
        />
      );
      break;
    }
    default:
      content = <EvidenceCanvas headline={fallbackHeadline} evidence={activeStep.evidence} />;
  }

  return (
    <div key={`${activeStep.id}-${mode}`} className="att-l1v-transition">
      {content}
    </div>
  );
}
