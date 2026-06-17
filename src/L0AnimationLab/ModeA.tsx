/* Mode A — Current Typing
   Production typewriter implementation, baseline.
   Mascot sits left of the reasoning text, in 'thinking' during typing,
   switches to 'looking' then 'idle' through the unified CTA sequence. */

import { useEffect, useState, useCallback } from 'react';
import LabColumn, { REASONING_TEXT } from './LabColumn';
import type { ColumnState } from './LabColumn';
import TypewriterText from '../components/Shared/TypewriterText';
import AgentMascot from '../components/Shared/AgentMascot';
import type { AgentMode } from '../components/Shared/AgentMascot';
import { triggerCTA } from './useCTASequence';

const TYPING_SPEED = 38;

export default function ModeA() {
  const [state, setState]           = useState<ColumnState>('idle');
  const [agentMode, setAgentMode]   = useState<AgentMode>('thinking');
  const [ctaVisible, setCtaVisible] = useState(false);
  const [mascotInCTA, setMascotInCTA] = useState(false);
  const [playing, setPlaying]       = useState(false);
  const [key, setKey]               = useState(0);

  const run = useCallback(() => {
    setPlaying(false);
    setCtaVisible(false);
    setMascotInCTA(false);
    setAgentMode('thinking');
    setState('idle');
    setKey(k => k + 1);

    setTimeout(() => {
      setState('running');
      setPlaying(true);
    }, 400);
  }, []);

  useEffect(() => { run(); }, []);

  const onTypingDone = useCallback(() => {
    triggerCTA({ setAgentMode, setCtaVisible, setMascotInCTA, setState });
  }, []);

  return (
    <LabColumn
      label="Current Typing"
      modeTag="Mode A"
      state={state}
      agentMode={agentMode}
      ctaVisible={ctaVisible}
      mascotInCTA={mascotInCTA}
      onReplay={run}
      renderReasoning={() => (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          {/* Left mascot — fades out and collapses when it moves into the CTA pill */}
          <div style={{
            flexShrink:  0,
            marginTop:   2,
            opacity:     mascotInCTA ? 0 : 1,
            width:       mascotInCTA ? 0 : 38,
            overflow:    'hidden',
            transition:  'opacity 0.25s ease-out, width 0.3s cubic-bezier(0.4,0,0.2,1)',
          }}>
            <AgentMascot agentMode={agentMode} size={38} />
          </div>

          <p style={{
            margin:        0,
            fontSize:      19,
            lineHeight:    1.6,
            color:         'rgba(255,255,255,0.72)',
            fontFamily:    '"SF Pro Text", "Inter", system-ui, sans-serif',
            fontWeight:    400,
            letterSpacing: 0.1,
            textAlign:     'left',
          }}>
            {playing && (
              <TypewriterText
                key={key}
                text={REASONING_TEXT}
                speed={TYPING_SPEED}
                playing={playing}
                showCursor={true}
                onDone={onTypingDone}
              />
            )}
          </p>
        </div>
      )}
    />
  );
}
