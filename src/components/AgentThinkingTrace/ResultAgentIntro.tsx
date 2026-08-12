import { useEffect, useState } from 'react';
import AgentMascot from '../Shared/AgentMascot';
import GlanceTextReveal, { RESOLVE_MS_SPEECH } from '../Shared/GlanceTextReveal';

const MASCOT_TO_TYPING_DELAY_MS = 200;

/** The "agent responding" beat the result screen was missing — same mascot,
 *  same position as the thinking-phase status row (top:132/128, left:72),
 *  so it reads as the SAME agent now speaking rather than a new element
 *  appearing from nowhere. Text resolves in with GlanceTextReveal (the
 *  shared cinematic reveal used for all Glance agent speech) instead of
 *  slamming into view with the rest of the card. */
export default function ResultAgentIntro({ text, mascotSize = 44 }: { text: string; mascotSize?: number }) {
  const [playing, setPlaying] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setPlaying(true), MASCOT_TO_TYPING_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="att-result-agent-row">
      <div className="att-result-agent-mascot-wrap" style={{ width: mascotSize, height: mascotSize }}>
        <AgentMascot agentMode={done ? 'idle' : 'thinking'} size={mascotSize} />
      </div>
      <p className="att-result-agent-text">
        <GlanceTextReveal
          text={text}
          playing={playing}
          resolvedOpacity={0.95}
          resolveMs={RESOLVE_MS_SPEECH}
          onDone={() => setDone(true)}
        />
      </p>
    </div>
  );
}
