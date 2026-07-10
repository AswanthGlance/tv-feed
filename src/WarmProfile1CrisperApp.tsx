/**
 * WarmProfile1CrisperApp — warm-start feed, minimal 1-signal variant.
 * Route: /warm_profile_1_crisper or /warm-profile-1-crisper
 *
 * Content source: Ambient_Feed_Copy_Recommendations_Full.docx — Akshay table.
 * CTA is injected per card from warmCardCrisperData.ts (not ctaGenerator).
 * All signals, layout, animations, and feed behaviour are inherited from WarmProfile1App.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import type { FeedItem, PreferenceProfile } from './data/types';
import { createDefaultProfile } from './logic/preferenceProfile';
import {
  applyThumbsUpSignal, applyThumbsDownSignal, applyContextualYes,
  applyPassiveDwell, applySkipFast, decayAllWeights,
} from './logic/signals';
import { rerankTail } from './logic/ranking';
import { WARM_START_FEED_ITEMS } from './data/warmStartFeedItems';
import { composeFeedWithPreferences } from './logic/feedComposer';
import type { UnifiedFeedItem } from './logic/feedComposer';
import type { QuestionConfig } from './data/preferenceQuestions';
import { evaluateBadges } from './data/badges';
import TVStage from './components/TVStage';
import FeedScreen from './components/Feed/FeedScreen';
import WarmProfile1CrisperL0Glance from './components/L0/WarmProfile1CrisperL0Glance';
import Toast from './components/Toast';
import RemoteOverlay from './components/RemoteOverlay';
import AgentHubPanel from './components/AgentHub/AgentHubPanel';
import CurvedNavPanel from './components/AgentHub/CurvedNavPanel';
import TwoLevelNavPanel from './components/AgentHub/TwoLevelNavPanel';
import ExploreFirstPanel from './components/AgentHub/ExploreFirstPanel';

declare global { interface Window { GLANCE_CTX: Record<string, string>; GLANCE_STATE: string; } }
window.GLANCE_CTX = { city: 'Bangalore', weather: 'rainy', day: 'Saturday', timeOfDay: 'morning', upcomingContext: 'weekend' };
window.GLANCE_STATE = 'warm';

const TRAVEL_BOOKING_QUESTION: QuestionConfig = {
  id: 'travel-booking-style',
  surface: 'interstitial',
  template: 'single-select',
  question: 'What does your typical travel booking look like?',
  subtext: 'Pick the one that sounds most like you',
  autoDismissMs: 0,
  skipBehavior: 'no-signal',
  expectedSignalGain: 4,
  options: [
    {
      id: 'bnb',
      label: 'Cozy bed & breakfast',
      image: '/images/warm-start/pref-bnb.jpg',
      boosts: { subCategories: ['bnb', 'boutique-stay', 'slow-travel'], vibes: ['cozy', 'warm', 'calm'] },
      confirmationText: 'More cozy stays and local escapes coming up.',
    },
    {
      id: 'hotel',
      label: 'Comfortable hotel',
      image: '/images/warm-start/pref-hotel.jpg',
      boosts: { subCategories: ['hotel', 'city-travel'], vibes: ['comfort', 'premium', 'calm'] },
      confirmationText: 'More comfortable hotel picks coming up.',
    },
    {
      id: 'resort',
      label: 'Resort or boutique stay',
      image: '/images/warm-start/pref-resort.jpg',
      boosts: { subCategories: ['resort', 'boutique-stay', 'luxury-travel'], vibes: ['luxury', 'premium', 'cinematic'] },
      confirmationText: 'More resort and boutique stays coming up.',
    },
    {
      id: 'lastminute',
      label: 'Last-minute bookings',
      image: '/images/warm-start/pref-lastminute.jpg',
      boosts: { subCategories: ['weekend-escape', 'spontaneous-travel'], vibes: ['bold', 'fresh', 'social'] },
      confirmationText: 'More spontaneous and last-minute picks coming up.',
    },
  ],
};

const WARM_START_PREFERENCE_QUESTIONS = [TRAVEL_BOOKING_QUESTION];
const IDLE_CEILING_MS = 60_000;

function buildInitialFeed(): { feed: FeedItem[]; unifiedFeed: UnifiedFeedItem[] } {
  const feed = WARM_START_FEED_ITEMS;
  const unifiedFeed = composeFeedWithPreferences(feed, WARM_START_PREFERENCE_QUESTIONS);
  return { feed, unifiedFeed };
}

type WarmStartState = {
  profile: PreferenceProfile;
  feed: FeedItem[];
  unifiedFeed: UnifiedFeedItem[];
  feedIdx: number;
  feedbackCount: number;
  interactionFollowUpsToday: number;
  toastMsg: string;
  showToast: boolean;
};

export default function WarmProfile1CrisperApp() {
  const { feed: initialFeed, unifiedFeed: initialUnified } = buildInitialFeed();

  const [state, setState] = useState<WarmStartState>({
    profile: createDefaultProfile(),
    feed: initialFeed,
    unifiedFeed: initialUnified,
    feedIdx: 0,
    feedbackCount: 0,
    interactionFollowUpsToday: 0,
    toastMsg: '',
    showToast: false,
  });

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onNextRef  = useRef<(dwellMs?: number) => void>(() => {});

  const toast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setState(s => ({ ...s, toastMsg: msg, showToast: true }));
    toastTimer.current = setTimeout(() => setState(s => ({ ...s, showToast: false })), 2200);
  }, []);

  const handleTimelineComplete = useCallback(() => {}, []);

  const cancelHold = useCallback(() => {
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
  }, []);

  const handleThumbsUp = useCallback((item: FeedItem, boosts: Record<string, string[]>, label: string) => {
    cancelHold();
    setState(s => {
      const p = { ...s.profile, weights: { ...s.profile.weights }, negativeWeights: { ...s.profile.negativeWeights } };
      applyThumbsUpSignal(p, boosts as any, label);
      const newFeed = rerankTail(s.feed, s.feedIdx, p);
      const unified = composeFeedWithPreferences(newFeed, WARM_START_PREFERENCE_QUESTIONS);
      const badges = evaluateBadges(p.weights, s.feedbackCount + 1, false);
      return { ...s, profile: { ...p, badges }, feed: newFeed, unifiedFeed: unified, feedbackCount: s.feedbackCount + 1 };
    });
  }, [cancelHold]);

  const handleThumbsDown = useCallback((item: FeedItem, decays: Record<string, string[]>, label: string, sessionOnly: boolean) => {
    cancelHold();
    setState(s => {
      const p = { ...s.profile, weights: { ...s.profile.weights }, negativeWeights: { ...s.profile.negativeWeights } };
      applyThumbsDownSignal(p, decays as any, label, sessionOnly);
      const newFeed = rerankTail(s.feed, s.feedIdx, p);
      const unified = composeFeedWithPreferences(newFeed, WARM_START_PREFERENCE_QUESTIONS);
      const badges = evaluateBadges(p.weights, s.feedbackCount + 1, false);
      return { ...s, profile: { ...p, badges }, feed: newFeed, unifiedFeed: unified, feedbackCount: s.feedbackCount + 1 };
    });
  }, [cancelHold]);

  const handleContextualYes = useCallback((item: FeedItem) => {
    cancelHold();
    setState(s => {
      const p = { ...s.profile, weights: { ...s.profile.weights } };
      const boosts = { categories: [item.category], subCategories: item.subCategories.slice(0, 2), vibes: item.vibes.slice(0, 2) };
      applyContextualYes(p, boosts, `More ${item.contextualTopic || item.category}`);
      const newFeed = rerankTail(s.feed, s.feedIdx, p);
      const unified = composeFeedWithPreferences(newFeed, WARM_START_PREFERENCE_QUESTIONS);
      return { ...s, profile: p, feed: newFeed, unifiedFeed: unified };
    });
    toast(`✦ More ${item.contextualTopic || item.category} coming up`);
  }, [cancelHold, toast]);

  const handlePassiveDwell = useCallback((item: FeedItem, isRepeat: boolean) => {
    setState(s => {
      const p = { ...s.profile, weights: { ...s.profile.weights } };
      applyPassiveDwell(p, { categories: [item.category], vibes: item.vibes.slice(0, 2) }, item.title, isRepeat);
      return { ...s, profile: p };
    });
  }, []);

  const handleL1Exit = useCallback((item: FeedItem, label: string, key: string) => {
    cancelHold();
    setState(s => {
      if (s.interactionFollowUpsToday >= 1) return s;
      const p = { ...s.profile, weights: { ...s.profile.weights } };
      const boosts = { subCategories: key ? [key] : [], categories: [item.category] };
      applyThumbsUpSignal(p, boosts as any, `L1 exit: ${label}`);
      const newFeed = rerankTail(s.feed, s.feedIdx, p);
      const unified = composeFeedWithPreferences(newFeed, WARM_START_PREFERENCE_QUESTIONS);
      return { ...s, profile: p, feed: newFeed, unifiedFeed: unified, interactionFollowUpsToday: s.interactionFollowUpsToday + 1 };
    });
    toast(`✦ More ${label} coming up`);
  }, [cancelHold, toast]);

  const handleInterstitialAnswer = useCallback((label: string, boosts: any, confirmationText: string) => {
    cancelHold();
    setState(s => {
      const p = { ...s.profile, weights: { ...s.profile.weights } };
      applyThumbsUpSignal(p, boosts, label);
      const newFeed = rerankTail(s.feed, s.feedIdx, p);
      const unified = composeFeedWithPreferences(newFeed, WARM_START_PREFERENCE_QUESTIONS);
      return { ...s, profile: p, feed: newFeed, unifiedFeed: unified };
    });
    toast(`✦ ${confirmationText}`);
  }, [cancelHold, toast]);

  const handleFeedNav = useCallback((dir: 'next' | 'prev', dwellMs?: number) => {
    cancelHold();
    setState(s => {
      const totalLen = s.unifiedFeed.length > 0 ? s.unifiedFeed.length : s.feed.length;
      const nextIdx = dir === 'next'
        ? (s.feedIdx + 1) % totalLen
        : (s.feedIdx - 1 + totalLen) % totalLen;

      const currentUnified = s.unifiedFeed[s.feedIdx];
      const departedItem = currentUnified?.type === 'glance'
        ? currentUnified.item
        : s.feed[s.feedIdx] ?? null;

      const nextUnified = s.unifiedFeed[nextIdx];
      const item = nextUnified?.type === 'glance' ? nextUnified.item : (s.feed[nextIdx] ?? s.feed[0]);

      const seen = item ? [...new Set([...s.profile.seenItemIds, item.id])] : s.profile.seenItemIds;
      let p = { ...s.profile, weights: { ...s.profile.weights }, negativeWeights: { ...s.profile.negativeWeights }, evidenceCounts: { ...s.profile.evidenceCounts }, seenItemIds: seen };

      if (dwellMs !== undefined && dwellMs < 2000 && departedItem) {
        applySkipFast(p, { categories: [departedItem.category], vibes: departedItem.vibes.slice(0, 1) }, departedItem.title);
      }

      const newCount = s.feedbackCount + 1;
      if (newCount % 5 === 0) decayAllWeights(p);

      const newFeed = rerankTail(s.feed, s.feedIdx, p);
      const unified = composeFeedWithPreferences(newFeed, WARM_START_PREFERENCE_QUESTIONS);

      return { ...s, feedIdx: nextIdx, profile: p, feed: newFeed, unifiedFeed: unified, feedbackCount: newCount };
    });
  }, [cancelHold]);

  const handleNext = useCallback((dwellMs?: number) => handleFeedNav('next', dwellMs), [handleFeedNav]);
  onNextRef.current = handleNext;

  const handleReset = useCallback(() => {
    cancelHold();
    const { feed, unifiedFeed } = buildInitialFeed();
    window.GLANCE_STATE = 'warm';
    setState({
      profile: createDefaultProfile(),
      feed,
      unifiedFeed,
      feedIdx: 0,
      feedbackCount: 0,
      interactionFollowUpsToday: 0,
      toastMsg: '',
      showToast: false,
    });
    toast('✦ Starting fresh from here.');
  }, [cancelHold, toast]);

  // ── Navigation-concept exploration selector (dev, L0-only) ──────────────────
  // 1 = full-screen Agent Hub · 2 = curved vertical nav · 3 = AI Workspace · 4 = Explore-first
  type NavOption = 1 | 2 | 3 | 4;
  const [navOption, setNavOption] = useState<NavOption>(3);
  const [navOpenConcept, setNavOpenConcept] = useState<NavOption | null>(null);
  const navOpen = navOpenConcept !== null;

  // While L0 is focused (nav closed), keys 1/2/3/4 switch the concept the ← opens.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (navOpen) return;
      // Options 1, 2 and 4 are hidden for now — only Option 3 is active.
      if (e.key === '3') { setNavOption(3); toast('← opens Option 3 · AI Workspace'); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navOpen, toast]);

  const openNav = useCallback(() => setNavOpenConcept(navOption), [navOption]);
  const closeNav = useCallback(() => setNavOpenConcept(null), []);

  // Per-concept L0 treatment while the nav is open.
  // Option 1 (full-screen hub): dim heavily. Option 2/3 (left panels): keep L0
  // legible on the right, nudged right + slightly scaled for spatial continuity.
  const l0Treatment: React.CSSProperties =
    navOpenConcept === 1
      ? { filter: 'brightness(0.45)', opacity: 0.7, transform: 'none' }
      : navOpenConcept === 3 || navOpenConcept === 4
      // Option 3 & 4: recognizable but clearly secondary — dimmed, desaturated, mild blur, pushed right
      ? { filter: 'brightness(0.6) saturate(0.7) blur(3px)', opacity: 0.9, transform: 'translateX(90px) scale(0.9)' }
      : navOpen
      ? { filter: 'brightness(0.82) blur(2px)', opacity: 0.92, transform: 'translateX(64px) scale(0.94)' }
      : { filter: 'none', opacity: 1, transform: 'none' };

  const { profile, feed, unifiedFeed, feedIdx, interactionFollowUpsToday, toastMsg, showToast } = state;

  // Current L0 content — used for contextual entry into the workspace (Option 3),
  // so the hub focuses the agent matching what's on screen.
  const currentUnified = unifiedFeed[feedIdx];
  const currentItem = currentUnified?.type === 'glance' ? currentUnified.item : feed[feedIdx] ?? feed[0];
  const currentCategory = currentItem?.category;
  const currentSubs = currentItem?.subCategories;
  const currentTitle = currentItem?.title;

  return (
    <>
      <div id="scaler">
        <div id="stage">
          <TVStage screen="feed" slideBack={false}>
            {/* L0 feed — always mounted; treatment varies per open concept */}
            <div style={{
              position: 'absolute', inset: 0,
              transformOrigin: 'right center',
              transition: 'filter 0.34s ease, opacity 0.34s ease, transform 0.34s cubic-bezier(0.22,0.61,0.36,1)',
              pointerEvents: navOpen ? 'none' : 'auto',
              ...l0Treatment,
            }}>
              <FeedScreen
                feed={feed}
                unifiedFeed={unifiedFeed}
                feedIdx={feedIdx}
                profile={profile}
                onNext={handleNext}
                onPrev={(dwellMs) => handleFeedNav('prev', dwellMs)}
                onThumbsUp={handleThumbsUp}
                onThumbsDown={handleThumbsDown}
                onContextualYes={handleContextualYes}
                onPassiveDwell={handlePassiveDwell}
                onSettingsChange={() => {}}
                onReset={handleReset}
                onGenAnswer={() => {}}
                onL1Exit={handleL1Exit}
                onInterstitialAnswer={handleInterstitialAnswer}
                interactionFollowUpsToday={interactionFollowUpsToday}
                onOpenDataPanel={() => {}}
                toast={toast}
                renderL0={(item, paused, onCTAClick) => (
                  <WarmProfile1CrisperL0Glance
                    key={item.id}
                    item={item}
                    profile={profile}
                    paused={paused}
                    onCTAClick={onCTAClick}
                    onTimelineComplete={handleTimelineComplete}
                  />
                )}
                idleMs={IDLE_CEILING_MS}
                onAgentHub={openNav}
                hubOpen={navOpen}
              />
            </div>

            {/* L0 exploration selector — dev only, chooses what ← opens */}
            {!navOpen && (
              <NavOptionSelector active={navOption} onSelect={setNavOption} />
            )}

            {/* Subtle left-edge affordance — hints "press ← to explore" */}
            {!navOpen && <LeftEdgeAffordance onOpen={openNav} />}

            {/* Selected navigation concept — slides in from the left */}
            {navOpenConcept === 1 && (
              <AgentHubPanel entering onBack={closeNav} />
            )}
            {navOpenConcept === 2 && (
              <CurvedNavPanel onBack={closeNav} onToast={toast} />
            )}
            {navOpenConcept === 3 && (
              <TwoLevelNavPanel
                onBack={closeNav}
                onToast={toast}
                currentCategory={currentCategory}
                currentSubs={currentSubs}
                currentTitle={currentTitle}
              />
            )}
            {navOpenConcept === 4 && (
              <ExploreFirstPanel
                onBack={closeNav}
                onToast={toast}
                currentCategory={currentCategory}
                currentSubs={currentSubs}
                currentTitle={currentTitle}
              />
            )}
          </TVStage>
          <Toast msg={toastMsg} show={showToast} />
        </div>
      </div>
      <RemoteOverlay />
    </>
  );
}

// ─── L0 left-edge affordance — subtle "press ← to explore" hint ─────────────────

function LeftEdgeAffordance({ onOpen }: { onOpen: () => void }) {
  return (
    <div
      onClick={onOpen}
      style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 70,
        display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
        cursor: 'pointer', zIndex: 55, pointerEvents: 'auto',
      }}
    >
      {/* soft glowing edge */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 70,
        background: 'linear-gradient(to right, rgba(167,134,229,0.16), transparent)',
        animation: 'l0-edge-pulse 3.4s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      {/* thin bright rail on the very edge */}
      <div style={{
        position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
        width: 3, height: 120, borderRadius: 3,
        background: 'linear-gradient(to bottom, transparent, rgba(199,182,245,0.7), transparent)',
        animation: 'l0-edge-pulse 3.4s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      {/* minimal chevron */}
      <div style={{
        marginLeft: 12, fontSize: 22, lineHeight: 1,
        color: 'rgba(255,255,255,0.55)',
        animation: 'l0-chevron-drift 3.4s ease-in-out infinite',
        pointerEvents: 'none',
      }}>‹</div>
      <style>{`
        @keyframes l0-edge-pulse {
          0%, 100% { opacity: 0.4; }
          50%      { opacity: 1; }
        }
        @keyframes l0-chevron-drift {
          0%, 100% { opacity: 0.35; transform: translateX(0); }
          50%      { opacity: 0.85; transform: translateX(-3px); }
        }
      `}</style>
    </div>
  );
}

// ─── L0 exploration selector (dev only) ─────────────────────────────────────────
// Chooses which navigation concept ← opens. Keys 1/2/3 also switch it.

function NavOptionSelector({ active, onSelect }: {
  active: 1 | 2 | 3 | 4; onSelect: (o: 1 | 2 | 3 | 4) => void;
}) {
  // Options 1, 2 and 4 are hidden for now — only Option 3 is shown.
  const options: { n: 1 | 2 | 3 | 4; label: string }[] = [
    { n: 3, label: 'Workspace' },
  ];
  return (
    <div style={{
      position: 'absolute', top: 22, left: '50%', transform: 'translateX(-50%)',
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '7px 10px 7px 14px', borderRadius: 999, zIndex: 70,
      background: 'rgba(10,7,20,0.72)',
      border: '1px solid rgba(255,255,255,0.1)',
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      boxShadow: '0 6px 24px rgba(0,0,0,0.4)',
    }}>
      <span style={{
        fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
        fontSize: 10, fontWeight: 700, color: 'rgba(167,134,229,0.55)',
        textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 2,
      }}>← opens</span>
      {options.map(o => {
        const on = active === o.n;
        return (
          <button
            key={o.n}
            onClick={() => onSelect(o.n)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 999, cursor: 'pointer',
              background: on ? 'rgba(112,71,226,0.28)' : 'transparent',
              border: on ? '1px solid rgba(167,134,229,0.6)' : '1px solid rgba(255,255,255,0.08)',
              fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
              transition: 'all 0.18s ease',
            }}
          >
            <span style={{
              fontSize: 10, fontWeight: 800,
              color: on ? '#C9B6F5' : 'rgba(255,255,255,0.3)',
            }}>{o.n}</span>
            <span style={{
              fontSize: 11, fontWeight: 600,
              color: on ? '#F5F3F7' : 'rgba(255,255,255,0.4)',
            }}>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

