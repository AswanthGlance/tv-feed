import QueryContext from './QueryContext';
import ResultAgentIntro from './ResultAgentIntro';
import ResultLayout from './ResultLayout';
import type { ResultTemplateId } from '../../adapters/resultTemplate';
import { deriveResultContent } from '../../adapters/resultContent';
import type { ThinkingScenario } from '../../types/thinking';

export default function ResultExperience({
  scenarioData,
  resultTemplate,
  userQuery,
}: {
  scenarioData: ThinkingScenario | undefined;
  resultTemplate: ResultTemplateId;
  userQuery?: string;
}) {
  const content = deriveResultContent(scenarioData, resultTemplate);

  return (
    <div className="att-result-layer">
      <div className="att-header">
        <img className="att-logo" src="/glance-logo.png" alt="glance" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      </div>
      <QueryContext query={userQuery} />

      {content ? (
        <>
          <ResultAgentIntro text="Here's what I found." mascotSize={52} />
          <ResultLayout content={content} />
        </>
      ) : (
        <div className="att-result-empty">
          <div className="att-result-empty-title">No structured result in this trace</div>
          <div className="att-result-empty-desc">
            The agent responded, but this trace didn’t produce recognizable place/card content —
            check the dev panel’s EVIDENCE tab for the raw response.
          </div>
        </div>
      )}
    </div>
  );
}
