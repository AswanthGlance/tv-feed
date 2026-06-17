/* Mode B — Cinematic Reveal
   No cursor. No typing. Characters resolve blur→sharp on stagger.
   Mascot sits left of the reasoning text throughout — present, still, owning the thought.
   During reveal: 'thinking'. After: unified CTA sequence. */

import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import LabColumn, { REASONING_TEXT } from './LabColumn';
import type { ColumnState } from './LabColumn';
import AgentMascot from '../components/Shared/AgentMascot';
import type { AgentMode } from '../components/Shared/AgentMascot';
import { triggerCTA } from './useCTASequence';

// Total duration across which all chars resolve (ms)
const TOTAL_RESOLVE_MS = 2600;
// Per-character blur→sharp transition
const CHAR_DURATION    = 0.75;
const CHAR_EASE        = 'power2.out';

export default function ModeB() {
  const [state, setState]           = useState<ColumnState>('idle');
  const [agentMode, setAgentMode]   = useState<AgentMode>('thinking');
  const [ctaVisible, setCtaVisible] = useState(false);
  const [mascotInCTA, setMascotInCTA] = useState(false);

  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const tlRef    = useRef<gsap.core.Timeline | null>(null);

  const chars = Array.from(REASONING_TEXT);

  const cleanup = useCallback(() => {
    tlRef.current?.kill();
    tlRef.current = null;
  }, []);

  const resetChars = useCallback(() => {
    charRefs.current.forEach(el => {
      if (el) gsap.set(el, { opacity: 0, filter: 'blur(12px)' });
    });
  }, []);

  const run = useCallback(() => {
    cleanup();
    resetChars();
    setCtaVisible(false);
    setMascotInCTA(false);
    setAgentMode('thinking');
    setState('idle');

    setTimeout(() => {
      setState('running');

      const staggerEach = (TOTAL_RESOLVE_MS / 1000) / Math.max(1, chars.length - 1);

      const tl = gsap.timeline({
        onComplete() {
          triggerCTA({ setAgentMode, setCtaVisible, setMascotInCTA, setState });
        },
      });

      charRefs.current.forEach((el, i) => {
        if (!el) return;
        tl.to(el, {
          opacity:  0.72,
          filter:   'blur(0px)',
          duration: CHAR_DURATION,
          ease:     CHAR_EASE,
        }, i * staggerEach);
      });

      tlRef.current = tl;
    }, 400);
  }, [cleanup, resetChars, chars.length]);

  useEffect(() => { run(); return cleanup; }, []);

  return (
    <LabColumn
      label="Cinematic Reveal"
      modeTag="Mode B"
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
            {chars.map((ch, i) => (
              <span
                key={i}
                ref={el => { charRefs.current[i] = el; }}
                style={{
                  display:    'inline',
                  whiteSpace: ch === ' ' ? 'pre' : 'normal',
                  opacity:    0,
                  filter:     'blur(12px)',
                  willChange: 'filter, opacity',
                }}
              >{ch}</span>
            ))}
          </p>
        </div>
      )}
    />
  );
}
