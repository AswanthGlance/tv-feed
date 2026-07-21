/**
 * MascotIntroApp — standalone preview for the L0→L1 mascot intro transition.
 * Route: /mascot-intro
 *
 * Starts directly from the L0 resting state — no entrance animation.
 * Press Enter (or click the CTA pill) to trigger the transition.
 * Press R to replay. ← → to cycle cards.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import TVStage from './components/TVStage';
import StaticL0RestingState from './components/L0/StaticL0RestingState';
import L0ToL1Transition from './components/Feed/L0ToL1Transition';
import AgentCapabilityIntro from './components/Feed/AgentCapabilityIntro';
import { getConversationalCTA } from './logic/ctaGenerator';
import { getReasoning } from './logic/reasoningEngine';
import { WARM_START_FEED_ITEMS } from './data/warmStartFeedItems';
import type { FeedItem } from './data/types';

/* Left-aligned cards only (per brief) */
const DEMO_ITEMS: FeedItem[] = [
  WARM_START_FEED_ITEMS.find(i => i.id === 'ws-coorg')!,
  WARM_START_FEED_ITEMS.find(i => i.id === 'ws-india-afg')!,
].filter(Boolean);

type Stage = 'resting' | 'capability-intro' | 'transition' | 'done';

export default function MascotIntroApp() {
  const [itemIdx, setItemIdx]   = useState(0);
  const [stage, setStage]       = useState<Stage>('resting');
  const [ctaRect, setCtaRect]   = useState<DOMRect | null>(null);
  const [mountKey, setMountKey] = useState(0);   // bump to force clean remount

  const containerRef = useRef<HTMLDivElement>(null);

  const item     = DEMO_ITEMS[itemIdx % DEMO_ITEMS.length];
  const ctaLabel = getConversationalCTA(item);
  const reasoning = getReasoning(item);

  const triggerTransition = useCallback(() => {
    if (stage !== 'resting') return;
    const ctaBtn = document.querySelector<HTMLElement>('[data-cta-pill]');
    const rect = ctaBtn?.getBoundingClientRect() ??
      new DOMRect(window.innerWidth / 2 - 160, window.innerHeight - 140, 320, 64);
    setCtaRect(rect);
    setStage('capability-intro');
  }, [stage]);

  const replay = useCallback((nextIdx?: number) => {
    setStage('resting');
    setCtaRect(null);
    if (nextIdx !== undefined) setItemIdx(nextIdx);
    setMountKey(k => k + 1);
  }, []);

  /* Keyboard handler */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter')       { e.preventDefault(); triggerTransition(); }
      if (e.key === 'r' || e.key === 'R') { replay(); }
      if (e.key === 'ArrowRight')  { replay((itemIdx + 1) % DEMO_ITEMS.length); }
      if (e.key === 'ArrowLeft')   { replay((itemIdx - 1 + DEMO_ITEMS.length) % DEMO_ITEMS.length); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [triggerTransition, replay, itemIdx]);

  return (
    <div ref={containerRef} id="scaler">
      <div id="stage">
        <TVStage screen="feed" slideBack={false}>

          {/* ── Static L0 resting state (always rendered as base) ── */}
          <StaticL0RestingState
            key={`l0-${mountKey}-${item.id}`}
            item={item}
            reasoning={reasoning}
            ctaLabel={ctaLabel}
            onCTAClick={triggerTransition}
          />

          {/* ── Agent capability intro ──────────────────────────── */}
          {stage === 'capability-intro' && (
            <AgentCapabilityIntro
              key={`cap-${mountKey}`}
              ctaLabel={ctaLabel}
              onComplete={() => setStage('transition')}
            />
          )}

          {/* ── L0→L1 transition overlay ──────────────────────── */}
          {(stage === 'transition' || stage === 'done') && ctaRect && (
            <L0ToL1Transition
              key={`tr-${mountKey}`}
              item={item}
              ctaLabel={ctaLabel}
              ctaRect={ctaRect}
              onComplete={() => setStage('done')}
            />
          )}

          {/* ── Keyboard hint (resting state only) ───────────────── */}
          {stage === 'resting' && (
            <div style={{
              position: 'absolute',
              top: 20, right: 24,
              zIndex: 50,
              fontSize: 13,
              fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
              color: 'rgba(255,255,255,0.35)',
              background: 'rgba(0,0,0,0.38)',
              padding: '7px 16px',
              borderRadius: 40,
              letterSpacing: '0.02em',
              pointerEvents: 'none',
            }}>
              Enter to trigger · ← → to change card · R to reset
            </div>
          )}

          {/* ── Card indicator dots ───────────────────────────────── */}
          {stage === 'resting' && DEMO_ITEMS.length > 1 && (
            <div style={{
              position: 'absolute',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex', gap: 8,
              zIndex: 50,
              pointerEvents: 'none',
            }}>
              {DEMO_ITEMS.map((_, i) => (
                <div key={i} style={{
                  width: i === itemIdx % DEMO_ITEMS.length ? 18 : 6,
                  height: 6, borderRadius: 99,
                  background: i === itemIdx % DEMO_ITEMS.length
                    ? 'rgba(167,134,229,0.9)' : 'rgba(255,255,255,0.25)',
                  transition: 'width 0.3s ease',
                }} />
              ))}
            </div>
          )}

        </TVStage>
      </div>

      <style>{`
        @keyframes mi-fade-in {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}

