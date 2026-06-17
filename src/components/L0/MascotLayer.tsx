import AgentMascot from '../Shared/AgentMascot';
import type { AgentMode } from '../Shared/AgentMascot';
import type { GlanceLayout } from '../../config/glanceConfig';

type Props = {
  agentMode: AgentMode;
  size: number;
  layout: GlanceLayout;
  /** Animation step index — mascot appears at step 2 */
  animStep: number;
};

/* Mascot placement differs per layout variant:
   · left   — inline inside reasoning bubble (handled by AgentReasoning)
   · center — floating above title, absolutely positioned
   · right  — inline inside reasoning bubble (handled by AgentReasoning)
   This component only renders for the center layout.
*/
export default function MascotLayer({ agentMode, size, layout, animStep }: Props) {
  if (layout !== 'center') return null;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: 20,
        opacity: animStep >= 2 ? 1 : 0,
        animation: animStep >= 2 ? 'l0-mascot-appear 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'none',
      }}
    >
      <AgentMascot agentMode={agentMode} size={size} />
    </div>
  );
}
