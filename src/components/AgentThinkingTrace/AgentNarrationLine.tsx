import AgentActionIcon from './AgentActionIcon';
import type { AgentNarration } from '../../types/experiencePass';

/** Level 2's ONE primary narration line — replaces the old two-line
 *  activity+observation strip. A single compact statement of WHAT the agent
 *  is doing right now, with a small action-type icon reinforcing "the agent
 *  switched capabilities." No second explanatory subtitle underneath —
 *  the cards are the evidence; an EmergingInsight (separate component)
 *  covers WHAT the agent learned, and only when it's actually discovered
 *  something new. `key={narration.text}` forces a fresh DOM node whenever
 *  the text itself changes (not just on first mount), so the entrance
 *  animation replays every pass instead of playing once, ever. */
export default function AgentNarrationLine({
  narration,
  isComplete,
}: {
  narration?: AgentNarration;
  isComplete: boolean;
}) {
  if (!narration) return null;

  return (
    <div className="att-l2-narration">
      <span className={`att-l2-narration-icon${isComplete ? ' att-l2-narration-icon--done' : ''}`}>
        <AgentActionIcon type={narration.type} />
      </span>
      <span
        key={narration.text}
        className={`att-l2-narration-text${isComplete ? ' att-l2-narration-text--resolved' : ''}`}
      >
        {narration.text}
      </span>
    </div>
  );
}
