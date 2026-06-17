/**
 * L0PreviewApp — design-QA harness for the full unified feed.
 *
 * The feed is a mix of L0 glances and preference cards, composed by
 * composeFeedWithPreferences(). Navigate with ↑↓ or wait for auto-advance.
 *
 * URL: http://localhost:5175/l0-preview.html
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { PreferenceProfile } from './data/types';
import { FEED_ITEMS } from './data/feedItems';
import { createDefaultProfile } from './logic/preferenceProfile';
import { getGlanceConfig } from './config/glanceConfig';
import { INTERSTITIAL_QUESTIONS } from './data/preferenceQuestions';
import { composeFeedWithPreferences } from './logic/feedComposer';
import L0Glance from './components/L0/L0Glance';
import PreferenceCard from './components/Feed/PreferenceCard';

const IDLE_MS = 14_000;

export default function L0PreviewApp() {
  const profile = createDefaultProfile() as PreferenceProfile;

  /* Compose the unified feed once */
  const unifiedFeed = useMemo(
    () => composeFeedWithPreferences(FEED_ITEMS, INTERSTITIAL_QUESTIONS),
    [],
  );

  const [idx, setIdx] = useState(0);
  const idleTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentItem = unifiedFeed[idx];

  /* Track the last L0 image seen so preference cards can use it as blurred BG */
  const lastL0Image = useRef<string | undefined>(undefined);
  if (currentItem.type === 'glance') {
    lastL0Image.current = currentItem.item.image;
  }

  const goNext = useCallback(() => {
    setIdx(i => Math.min(i + 1, unifiedFeed.length - 1));
  }, [unifiedFeed.length]);

  const goPrev = useCallback(() => {
    setIdx(i => Math.max(i - 1, 0));
  }, []);

  const resetIdle = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    /* Only auto-advance on L0 glances, not preference cards */
    if (currentItem.type === 'glance') {
      idleTimer.current = setTimeout(goNext, IDLE_MS);
    }
  }, [goNext, currentItem.type]);

  useEffect(() => {
    resetIdle();
    return () => { if (idleTimer.current) clearTimeout(idleTimer.current); };
  }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Keyboard — only active when not on a preference card (PreferenceCard owns its own keys) */
  useEffect(() => {
    if (currentItem.type === 'preference') return;
    const handler = (e: KeyboardEvent) => {
      resetIdle();
      if (e.key === 'ArrowDown') goNext();
      if (e.key === 'ArrowUp')   goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentItem.type, goNext, goPrev, resetIdle]);

  /* Layout info for HUD (only for glance items) */
  const config = currentItem.type === 'glance'
    ? getGlanceConfig(currentItem.item)
    : null;

  const glanceCount    = unifiedFeed.filter(i => i.type === 'glance').length;
  const prefCount      = unifiedFeed.filter(i => i.type === 'preference').length;
  const currentIsGlance = currentItem.type === 'glance';

  return (
    <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', background: '#000', overflow: 'hidden' }}>

      {/* ── Render current feed item ── */}
      {currentItem.type === 'glance' && (
        <L0Glance
          key={currentItem.id}
          item={currentItem.item}
          profile={profile}
          onCTAClick={() => {}}
        />
      )}

      {currentItem.type === 'preference' && (
        <PreferenceCard
          key={currentItem.id}
          question={currentItem.question}
          prevImage={lastL0Image.current}
          onAnswer={() => goNext()}
          onSkip={() => goNext()}
        />
      )}

      {/* ── HUD (only on glance cards) ── */}
      {currentIsGlance && config && (
        <div style={{
          position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)',
          zIndex: 99, display: 'flex', alignItems: 'center', gap: 12,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999,
          padding: '6px 18px',
          fontFamily: 'system-ui', fontSize: 13, color: 'rgba(255,255,255,0.7)',
          pointerEvents: 'none',
        }}>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>↑↓ to browse</span>
          <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.2)' }} />
          <span>{idx + 1} / {unifiedFeed.length}</span>
          <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.2)' }} />
          <span style={{ color: 'rgba(167,134,229,0.7)', fontSize: 11 }}>
            {glanceCount}L + {prefCount}P
          </span>
          <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.2)' }} />
          <span style={{
            color: config.layout === 'left' ? '#a78be5' : config.layout === 'center' ? '#60d9fa' : '#f9a84d',
            fontWeight: 600,
          }}>{config.layout}</span>
          <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.2)' }} />
          <span style={{ color: 'rgba(255,255,255,0.45)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentItem.id}
          </span>
        </div>
      )}
    </div>
  );
}
