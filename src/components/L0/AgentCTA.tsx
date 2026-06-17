/* AgentCTA — Figma reference node 925:2651
   White pill (h=64, border-radius=72, px=24)
   When showMascotInside=true the purple Rive mascot sits inside the pill
   (this is the step where the mascot "moves into" the CTA). */

import { BorderBeam } from 'border-beam';
import AgentMascot from '../Shared/AgentMascot';
import type { AgentMode } from '../Shared/AgentMascot';

type Props = {
  label: string;
  focused: boolean;
  animStep: number;
  align: 'left' | 'center' | 'right';
  onClick: () => void;
  showMascotInside?: boolean;
  agentMode?: AgentMode;
  /* legacy compat */
  onWhyClick?: () => void;
  showWhy?: boolean;
};

export default function AgentCTA({
  label,
  focused,
  animStep,
  align,
  onClick,
  showMascotInside = false,
  agentMode = 'idle',
}: Props) {
  const visible = animStep >= 5 || animStep === 8;
  const justifyMap = { left: 'flex-start', center: 'center', right: 'flex-end' };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        justifyContent: justifyMap[align],
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(18px)',
        transition: 'opacity 0.6s cubic-bezier(0.34,1.56,0.64,1), transform 0.6s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      <BorderBeam
        size="sm"
        colorVariant="colorful"
        duration={2.0}
        brightness={1.7}
        saturation={3.0}
        strength={1.5}
      >
        <button
          tabIndex={-1}
          onClick={onClick}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            height: 64,
            padding: '0 28px',
            borderRadius: 72,
            background: focused ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.92)',
            border: 'none',
            cursor: 'pointer',
            boxShadow: focused
              ? '0 8px 40px rgba(0,0,0,0.22), 0 0 0 3px rgba(255,255,255,0.35)'
              : '0 8px 40px rgba(0,0,0,0.14)',
            transform: focused ? 'scale(1.04)' : 'scale(1)',
            transition: 'box-shadow 0.2s, transform 0.2s, background 0.2s',
            outline: 'none',
          }}
        >
          {/* Mascot moves into CTA — small size inside the pill */}
          {showMascotInside && (
            <div
              style={{
                flexShrink: 0,
                animation: 'mascot-slide-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
                marginLeft: -4,
              }}
            >
              <AgentMascot agentMode={agentMode} size={42} />
            </div>
          )}

          <span
            style={{
              fontSize: 'clamp(16px, 1.5vw, 24px)',
              fontWeight: 600,
              color: '#111',
              letterSpacing: 0,
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </span>
        </button>
      </BorderBeam>

      <style>{`
        @keyframes mascot-slide-in {
          from { opacity: 0; transform: translateX(-20px) scale(0.6); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
