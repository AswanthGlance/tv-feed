import AgentMascot from '../Shared/AgentMascot';
import QueryContext from './QueryContext';
import ThinkingTimeline from './ThinkingTimeline';
import ActiveWorkConnector from './ActiveWorkConnector';
import EvidenceCanvas from './EvidenceCanvas';
import type { ThinkingScenario } from '../../types/thinking';
import type { TracePlaybackState } from '../../hooks/useTracePlayback';

export default function ThinkingExperience({
  scenario,
  playback,
  isResolving,
  isLoading,
  userQuery,
}: {
  scenario: ThinkingScenario | undefined;
  playback: TracePlaybackState;
  isResolving: boolean;
  isLoading: boolean;
  userQuery?: string;
}) {
  const steps = scenario?.steps ?? [];
  const activeIndex = playback.activeStepIndex;

  const statusLabel = isLoading
    ? 'Connecting...'
    : !scenario
      ? 'Unable to reach a live trace'
      : playback.isComplete
        ? 'Done'
        : 'Searching...';

  return (
    <div className={`att-thinking-layer${isResolving ? ' att-thinking-layer--resolving' : ''}`}>
      <div className="att-header">
        <img className="att-logo" src="/glance-logo.png" alt="glance" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      </div>
      <QueryContext query={userQuery} />

      <div className="att-agent-row">
        <div className="att-mascot-wrap">
          <AgentMascot agentMode={isLoading ? 'looking' : playback.isComplete ? 'idle' : 'thinking'} size={52} />
        </div>
        <span className="att-status-text">{statusLabel}</span>
      </div>

      {steps.length > 0 && (
        <>
          <ThinkingTimeline steps={steps} statuses={playback.stepStatuses} activeStepIndex={activeIndex} />
          <ActiveWorkConnector activeStepIndex={activeIndex} />
          <EvidenceCanvas headline={steps[activeIndex]?.activeHeadline} evidence={playback.visibleEvidence} />
        </>
      )}
    </div>
  );
}
