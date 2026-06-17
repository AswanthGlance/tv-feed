import { useEffect, useRef, useState } from 'react';
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';

/* ─────────────────────────────────────────────────────────────────────────────
   AgentMascot — single source of truth for the Glance Rive mascot.

   Rive file:  /public/mascot.riv
   State machine: "G_Moscot_States"
   States:
     · "Idel _Eyeblink"  → agentMode = 'idle'
     · "Looking Around"  → agentMode = 'looking'

   Phase 1.1 ambient behavior (container animation only, not Rive states):
     · Slow breathing via CSS scale animation
     · Occasional gaze-shift: switches to 'looking' for ~1.4s then returns
     · Gaze-shift interval: randomised 6–14s to avoid predictability
   ───────────────────────────────────────────────────────────────────────────── */

export type AgentMode = 'idle' | 'looking' | 'thinking';

const STATE_MACHINE  = 'G_Moscot_States';
const STATE_IDLE     = 'Idel _Eyeblink';
const STATE_LOOKING  = 'Looking Around';
const STATE_THINKING = 'Loading';
const INPUT_LOOKING  = 'Looking';

type Props = {
  agentMode?: AgentMode;
  size?: number;
  className?: string;
};

export default function AgentMascot({
  agentMode = 'idle',
  size = 96,
  className = '',
}: Props) {
  const prevMode = useRef<AgentMode | null>(null);

  const { rive, RiveComponent } = useRive({
    src: '/mascot.riv',
    stateMachines: STATE_MACHINE,
    autoplay: true,
  });

  const lookingInput = useStateMachineInput(rive, STATE_MACHINE, INPUT_LOOKING);

  useEffect(() => {
    if (!rive) return;
    if (prevMode.current === agentMode) return;
    prevMode.current = agentMode;

    if (agentMode === 'thinking') {
      /* Loading state has no boolean input — play directly */
      rive.play(STATE_THINKING);
    } else if (lookingInput !== null && lookingInput !== undefined) {
      lookingInput.value = agentMode === 'looking';
    } else {
      rive.play(agentMode === 'looking' ? STATE_LOOKING : STATE_IDLE);
    }
  }, [rive, lookingInput, agentMode]);

  const isLooking   = agentMode === 'looking';
  const isThinking  = agentMode === 'thinking';

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: size,
    height: size,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transform: (isLooking || isThinking) ? 'scale(1.06)' : 'scale(1)',
    transition: 'transform 0.55s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s cubic-bezier(0.22,1,0.36,1)',
    opacity: 1,
    animation: isThinking
      ? '_am-breathe-thinking 1.2s ease-in-out infinite'
      : isLooking
        ? '_am-breathe-looking 1.8s ease-in-out infinite'
        : '_am-breathe-idle    3.2s ease-in-out infinite',
  };

  const glowStyle: React.CSSProperties = {
    position: 'absolute',
    inset: -size * 0.15,
    borderRadius: '50%',
    pointerEvents: 'none',
    background: isThinking
      ? 'radial-gradient(circle, rgba(148,163,252,0.22) 0%, transparent 65%)'
      : isLooking
        ? 'radial-gradient(circle, rgba(192,132,252,0.18) 0%, transparent 65%)'
        : 'radial-gradient(circle, rgba(112,71,226,0.10) 0%, transparent 65%)',
    animation: isThinking
      ? '_am-glow-thinking 1.2s ease-in-out infinite'
      : isLooking
        ? '_am-glow-looking 1.8s ease-in-out infinite'
        : '_am-glow-idle    3.2s ease-in-out infinite',
    transition: 'background 0.6s ease',
  };

  const modeClass = isThinking ? 'agent-mascot--thinking' : isLooking ? 'agent-mascot--looking' : 'agent-mascot--idle';

  return (
    <>
      <style>{AGENT_MASCOT_KEYFRAMES}</style>

      <div
        className={`agent-mascot ${modeClass}${className ? ` ${className}` : ''}`}
        style={containerStyle}
      >
        <div style={glowStyle} />

        <RiveComponent
          style={{
            width: size,
            height: size,
            position: 'relative',
            zIndex: 1,
            display: 'block',
          }}
        />
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Keyframes — Phase 1.1
   Breathing via container scale (very subtle).
   Gaze-shift handled by state — no separate animation needed.
   ───────────────────────────────────────────────────────────────────────────── */

const AGENT_MASCOT_KEYFRAMES = `

/* Idle breathing — slow 3.2s organic cycle */
@keyframes _am-breathe-idle {
  0%, 100% { transform: scale(1.000); }
  45%       { transform: scale(1.028); }
  72%       { transform: scale(0.994); }
}

/* Looking breathing — slightly faster, more alert */
@keyframes _am-breathe-looking {
  0%, 100% { transform: scale(1.060); }
  40%       { transform: scale(1.080); }
  70%       { transform: scale(1.052); }
}

/* Idle glow pulse */
@keyframes _am-glow-idle {
  0%, 100% { opacity: 0.55; transform: scale(0.90); }
  50%       { opacity: 0.85; transform: scale(1.08); }
}

/* Looking glow — tighter, more alert */
@keyframes _am-glow-looking {
  0%, 100% { opacity: 0.70; transform: scale(0.94); }
  45%       { opacity: 1;    transform: scale(1.14); }
}

/* Thinking breathing — faster, subtle bob */
@keyframes _am-breathe-thinking {
  0%, 100% { transform: scale(1.060); }
  50%       { transform: scale(1.075); }
}

/* Thinking glow — blue-tinted, fast pulse */
@keyframes _am-glow-thinking {
  0%, 100% { opacity: 0.60; transform: scale(0.92); }
  50%       { opacity: 1;    transform: scale(1.18); }
}

.agent-mascot {
  will-change: transform, opacity;
}

.agent-mascot--looking {
}

.agent-mascot--idle {
}

.agent-mascot--thinking {
}
`;
