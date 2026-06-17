import AgentMascot from '../Shared/AgentMascot';
import type { AgentMode } from '../Shared/AgentMascot';
import type { GlanceLayout } from '../../config/glanceConfig';

/* Standard layout reasoning — mascot + free-floating text, no glass container.
   The cinematic layout handles its own reasoning inline in GlanceLayout. */

type Props = {
  reasoning: string;
  agentMode: AgentMode;
  layout: GlanceLayout;
  animStep: number;
  align: 'left' | 'center' | 'right';
};

export default function AgentReasoning({ reasoning, agentMode, layout, animStep, align }: Props) {
  const visible = animStep >= 4;
  const showInlineMascot = layout !== 'center';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: showInlineMascot ? 14 : 0,
        justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
        maxWidth: layout === 'center' ? 680 : 640,
        margin: align === 'center' ? '0 auto 24px' : '0 0 24px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(14px)',
        filter: visible ? 'blur(0)' : 'blur(6px)',
        transition: 'opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1), filter 0.7s cubic-bezier(0.22,1,0.36,1)',
      }}
    >
      {showInlineMascot && layout !== 'right' && (
        <div style={{ flexShrink: 0, marginTop: 2 }}>
          <AgentMascot agentMode={agentMode} size={36} />
        </div>
      )}

      <p
        style={{
          margin: 0,
          fontSize: 20,
          lineHeight: 1.55,
          color: 'rgba(255,255,255,0.72)',
          fontFamily: '"SF Pro Text", "Inter", system-ui, sans-serif',
          fontWeight: 400,
          textAlign: align === 'right' ? 'right' : align === 'center' ? 'center' : 'left',
          letterSpacing: 0.1,
          textShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }}
      >
        {reasoning}
      </p>

      {showInlineMascot && layout === 'right' && (
        <div style={{ flexShrink: 0, marginTop: 2 }}>
          <AgentMascot agentMode={agentMode} size={36} />
        </div>
      )}
    </div>
  );
}
