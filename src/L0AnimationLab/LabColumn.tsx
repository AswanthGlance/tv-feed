/* LabColumn — shared shell for all three animation experiments.
   Each column renders the same content (title, reasoning slot, CTA).
   Mascot positioning is owned by each mode's renderReasoning() slot. */

import type { AgentMode } from '../components/Shared/AgentMascot';
import AgentMascot from '../components/Shared/AgentMascot';
import { BorderBeam } from 'border-beam';

export const REASONING_TEXT = "Bangalore's breakfast culture matched your local-food picks, so I brought this forward.";
export const TITLE_TEXT     = "Idli at Dawn";
export const CTA_LABEL      = "Show me what makes this special";

export type ColumnState = 'idle' | 'running' | 'done';

export type LabColumnProps = {
  label:           string;
  modeTag:         string;
  state:           ColumnState;
  agentMode:       AgentMode;
  ctaVisible:      boolean;
  mascotInCTA:     boolean;
  onReplay:        () => void;
  renderReasoning: () => React.ReactNode;
};

export default function LabColumn({
  label, modeTag, agentMode, ctaVisible, mascotInCTA,
  onReplay, renderReasoning,
}: LabColumnProps) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      padding: '40px 48px',
      background: 'rgba(255,255,255,0.025)',
      borderRadius: 24,
      border: '1px solid rgba(255,255,255,0.06)',
      minHeight: 0,
      position: 'relative',
    }}>
      {/* Mode label + name */}
      <div style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 2,
        color: 'rgba(255,255,255,0.35)',
        textTransform: 'uppercase',
        fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
        marginBottom: 6,
      }}>{modeTag}</div>

      <div style={{
        fontSize: 15,
        fontWeight: 600,
        color: 'rgba(255,255,255,0.85)',
        fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
        marginBottom: 36,
        letterSpacing: 0.2,
      }}>{label}</div>

      {/* Card title */}
      <p style={{
        margin: '0 0 10px',
        fontSize: 38,
        fontWeight: 700,
        color: '#fff',
        fontFamily: '"Plus Jakarta Sans", "SF Pro Display", system-ui, sans-serif',
        lineHeight: 1.15,
        letterSpacing: -0.5,
      }}>{TITLE_TEXT}</p>

      <p style={{
        margin: '0 0 28px',
        fontSize: 14,
        fontWeight: 500,
        color: 'rgba(255,255,255,0.45)',
        fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
      }}>Bangalore · Food Story</p>

      {/* Reasoning slot — each mode owns mascot placement inside here */}
      <div style={{ marginBottom: 28, width: '100%' }}>
        {renderReasoning()}
      </div>

      {/* CTA — unified across all modes */}
      <div style={{
        opacity:    ctaVisible ? 1 : 0,
        transform:  ctaVisible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1)',
      }}>
        <BorderBeam size="sm" colorVariant="colorful" duration={2.0} brightness={1.7} saturation={3.0} strength={1.5}>
          <button style={{
            display:    'inline-flex',
            alignItems: 'center',
            gap:        10,
            height:     52,
            padding:    '0 24px',
            borderRadius: 72,
            background: 'rgba(255,255,255,0.93)',
            border:     'none',
            cursor:     'pointer',
            boxShadow:  '0 6px 32px rgba(0,0,0,0.18)',
          }}>
            {mascotInCTA && (
              <div style={{ animation: 'lab-mascot-in 0.45s cubic-bezier(0.34,1.56,0.64,1) both' }}>
                <AgentMascot agentMode={agentMode} size={34} />
              </div>
            )}
            <span style={{
              fontSize:   15,
              fontWeight: 600,
              color:      '#111',
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              whiteSpace: 'nowrap',
            }}>{CTA_LABEL}</span>
          </button>
        </BorderBeam>
      </div>

      {/* Replay */}
      <button
        onClick={onReplay}
        style={{
          position:   'absolute',
          top:        20,
          right:      20,
          background: 'rgba(255,255,255,0.08)',
          border:     '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8,
          color:      'rgba(255,255,255,0.55)',
          fontSize:   12,
          fontWeight: 500,
          fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
          padding:    '6px 12px',
          cursor:     'pointer',
          transition: 'background 0.15s, color 0.15s',
        }}
        onMouseEnter={e => {
          (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.14)';
          (e.target as HTMLElement).style.color = '#fff';
        }}
        onMouseLeave={e => {
          (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
          (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.55)';
        }}
      >
        ↺ Replay
      </button>

      <style>{`
        @keyframes lab-mascot-in {
          from { opacity: 0; transform: translateX(-14px) scale(0.6); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
