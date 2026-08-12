import ThinkingExperience from './ThinkingExperience';
import ResultExperience from './ResultExperience';
import type { useTraceExplorer } from '../../hooks/useTraceExplorer';
import type { TracePlaybackState } from '../../hooks/useTracePlayback';
import type { ExperiencePhase } from '../../hooks/useExperiencePhase';

/** LEVEL 1 — Visible Progress. This is the original /agent_thinking_trace
 *  experience, extracted verbatim out of what used to be the whole of
 *  AgentExperience.tsx so it can sit alongside Level2Experience /
 *  Level3Placeholder behind the top-level level switch. No behavior change
 *  from before the switch existed — explorer/playback/phase are still owned
 *  one level up (in AgentExperience) and just passed through, exactly as
 *  they were read directly there before. */
export default function Level1Experience({
  explorer,
  playback,
  phase,
}: {
  explorer: ReturnType<typeof useTraceExplorer>;
  playback: TracePlaybackState;
  phase: ExperiencePhase;
}) {
  const showResult = phase === 'result';
  const isResolving = phase === 'resolving';

  return (
    <>
      {!showResult && (
        <ThinkingExperience
          scenario={explorer.scenarioData}
          playback={playback}
          isResolving={isResolving}
          isLoading={explorer.isLoading}
          userQuery={explorer.detectedRequest}
        />
      )}

      {showResult && (
        <ResultExperience
          scenarioData={explorer.scenarioData}
          resultTemplate={explorer.resultTemplate}
          userQuery={explorer.detectedRequest}
        />
      )}
    </>
  );
}
