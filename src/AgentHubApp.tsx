/**
 * AgentHubApp — standalone route wrapper for /agent-hub.
 * The actual UI lives in AgentHubPanel — shared with the overlay mode.
 */

import AgentHubPanel from './components/AgentHub/AgentHubPanel';

type Props = {
  onBack?: () => void;
};

export default function AgentHubApp({ onBack }: Props) {
  const handleBack = () => {
    if (onBack) { onBack(); return; }
    // Standalone: go back in history, or fall back to warm-profile-1-crisper
    if (window.history.length > 1) window.history.back();
    else window.location.href = '/warm-profile-1-crisper';
  };

  return (
    <div id="scaler">
      <div id="stage">
        <AgentHubPanel entering onBack={handleBack} />
      </div>
    </div>
  );
}
