/* L0 Animation Lab — /l0_experiment
   Three-column comparison: Mode A / B / C */

import ModeA from './ModeA';
import ModeB from './ModeB';
import ModeC from './ModeC';
import { useState, useCallback } from 'react';

export default function L0AnimationLabPage() {
  // Replay-all: increment key to force each mode to remount and re-run
  const [replayKey, setReplayKey] = useState(0);

  const replayAll = useCallback(() => {
    setReplayKey(k => k + 1);
  }, []);

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      background: '#070515',
      color: '#fff',
      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      padding: '48px 48px 80px',
      boxSizing: 'border-box',
      gap: 0,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 48,
      }}>
        <div>
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 2.5,
            color: 'rgba(255,255,255,0.3)',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}>
            Glance · L0 Animation Lab
          </div>
          <h1 style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: -0.4,
            color: '#fff',
          }}>
            Agent-to-Text Reveal Systems
          </h1>
          <p style={{
            margin: '8px 0 0',
            fontSize: 14,
            color: 'rgba(255,255,255,0.4)',
            lineHeight: 1.5,
          }}>
            Which feels most agentic? Which is least like ChatGPT? Which is most premium?
          </p>
        </div>

        <button
          onClick={replayAll}
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 10,
            color: 'rgba(255,255,255,0.75)',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'inherit',
            padding: '10px 20px',
            cursor: 'pointer',
            letterSpacing: 0.2,
            transition: 'background 0.15s, color 0.15s',
            flexShrink: 0,
          }}
          onMouseEnter={e => {
            (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.13)';
            (e.target as HTMLElement).style.color = '#fff';
          }}
          onMouseLeave={e => {
            (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.07)';
            (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.75)';
          }}
        >
          ↺ Replay All
        </button>
      </div>

      {/* Three-column grid */}
      <div style={{
        display: 'flex',
        gap: 24,
        flex: 1,
        alignItems: 'stretch',
      }}>
        <ModeA key={`a-${replayKey}`} />
        <ModeB key={`b-${replayKey}`} />
        <ModeC key={`c-${replayKey}`} />
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 48,
        paddingTop: 24,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        gap: 48,
        fontSize: 12,
        color: 'rgba(255,255,255,0.25)',
      }}>
        <span><strong style={{ color: 'rgba(255,255,255,0.45)' }}>Mode A</strong> — Traditional typing. Cursor visible. Production baseline.</span>
        <span><strong style={{ color: 'rgba(255,255,255,0.45)' }}>Mode B</strong> — Pure motion design. Characters resolve blur→sharp on stagger. No cursor, no mascot.</span>
        <span><strong style={{ color: 'rgba(255,255,255,0.45)' }}>Mode C</strong> — Agentic thought reveal. Mascot sweeps line-by-line, arcs to the next, enters CTA.</span>
      </div>
    </div>
  );
}
