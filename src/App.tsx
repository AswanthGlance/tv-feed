import { useState, useEffect, useCallback, useRef } from 'react';
import type { PreferenceProfile } from './data/types';
import type { Screen } from './logic/navigation';
import { isForward } from './logic/navigation';
import { createDefaultProfile, resetProfile, setLanguage, setFamilyFriendly, setMarket } from './logic/preferenceProfile';
import { applyThumbsUpSignal, applyThumbsDownSignal, applyContextualYes, applyPassiveDwell, applySkipFast, applyGenQuestion, applyGenDecay, decayAllWeights, seedVibeCategories } from './logic/signals';
import { logOnboarding } from './logic/signalLog';
import { composeFeed, rerankTail } from './logic/ranking';
import { evaluateBadges } from './data/badges';
import { FEED_ITEMS } from './data/feedItems';
import { INTERSTITIAL_QUESTIONS } from './data/preferenceQuestions';
import { WARM_START_FEED_ITEMS } from './data/warmStartFeedItems';
import { composeFeedWithPreferences } from './logic/feedComposer';
import type { UnifiedFeedItem } from './logic/feedComposer';
import type { FeedItem } from './data/types';
import { clearSignalLog, getSessionId, logInterstitial, logL1Exit, logThumbsUp, logThumbsDown, logPassiveDwell, logContextual } from './logic/signalLog';
import type { SignalLogEntry } from './logic/signalLog';
import { applyOnboardingSignal } from './logic/signals';
import {
  createSparseEnrichedProfile,
  bumpInteractionCount,
} from './logic/profileDraft';
import type { GlanceProfileDraft } from './logic/profileDraft';

// ── Screen components ────────────────────────────────────────────────────────
import WarmProfile1CrispL0Glance from './components/L0/WarmProfile1CrispL0Glance';
import TVStage from './components/TVStage';
import WelcomeScreen from './components/Activation/WelcomeScreen';
import BangaloreConfirm from './components/Activation/BangaloreConfirm';
import TVContentQuestion from './components/Calibration/TVContentQuestion';
import AudienceQuestion from './components/Calibration/AudienceQuestion';
import ShowMoreQuestion from './components/Calibration/ShowMoreQuestion';
import WeekendQuestion from './components/Calibration/WeekendQuestion';
import StyleQuestion from './components/Calibration/StyleQuestion';
import SelfieScreen from './components/Activation/SelfieScreen';
import TuningTransition from './components/Calibration/TuningTransition';
import FeedScreen from './components/Feed/FeedScreen';
import RemoteOverlay from './components/RemoteOverlay';
import Toast from './components/Toast';
import SessionDataOverlay from './components/SessionDataOverlay';
import DataPanel from './components/DataPanel';

// ── Cold-start context stub ──────────────────────────────────────────────────
declare global { interface Window { GLANCE_CTX: Record<string, string>; GLANCE_STATE: string; } }
window.GLANCE_CTX = { city: 'Bangalore', weather: 'rainy', day: 'Friday', timeOfDay: 'evening', upcomingContext: 'long_weekend' };
window.GLANCE_STATE = 'cold';


export type AppState = {
  screen: Screen;
  prevScreen: Screen;
  profile: PreferenceProfile;
  profileDraft: GlanceProfileDraft;
  setupSelections: { tvContent?: string[]; showMore?: string[]; weekend?: string[]; style?: string[] };
  feed: FeedItem[];
  unifiedFeed: UnifiedFeedItem[];
  feedIdx: number;
  debugOpen: boolean;
  sessionOverlayOpen: boolean;
  dataPanelOpen: boolean;
  toastMsg: string;
  showToast: boolean;
  feedbackCount: number;
  onboardingDone: boolean;
  interactionFollowUpsToday: number;
  interstitialsShown: number;
  noInteractionCardCount: number;
  lastInteractionType: string;
  signalLog: SignalLogEntry[];
};

export default function App({ warmFeedMode = false }: { warmFeedMode?: boolean }) {
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const [_sliders, _setSliders] = useState({ interactionCap: 1, interstitialN: 10, decayFactor: 0.97 });
  const [fromWelcome, setFromWelcome] = useState(false);

  const [state, setState] = useState<AppState>({
    screen: 'welcome',
    prevScreen: 'welcome',
    profile: createDefaultProfile(),
    profileDraft: createSparseEnrichedProfile(),
    feed: [],
    unifiedFeed: [],
    feedIdx: 0,
    setupSelections: {},
    debugOpen: false,
    sessionOverlayOpen: false,
    dataPanelOpen: false,
    toastMsg: '',
    showToast: false,
    feedbackCount: 0,
    onboardingDone: false,
    interactionFollowUpsToday: 0,
    interstitialsShown: 0,
    noInteractionCardCount: 0,
    lastInteractionType: 'none',
    signalLog: [],
  });

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const go = useCallback((to: Screen) => {
    setState(s => ({ ...s, prevScreen: s.screen, screen: to }));
  }, []);

  const toast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setState(s => ({ ...s, toastMsg: msg, showToast: true }));
    toastTimer.current = setTimeout(() => setState(s => ({ ...s, showToast: false })), 2200);
  }, []);

  const enterFeed = useCallback((profile: PreferenceProfile, draft: GlanceProfileDraft) => {
    const { profile: seededProfile, derivedTokens } = seedVibeCategories(
      profile,
      profile.selectedQ1Scenario,
      profile.selectedQ2Worlds || [],
    );
    const derivedEntry = derivedTokens.length > 0 ? logOnboarding(
      `vibe-derived: ${derivedTokens.join(', ')}`,
      derivedTokens,
      Object.fromEntries(derivedTokens.map(t => [t, (seededProfile.weights[t] || 0) - (profile.weights[t] || 0)])),
    ) : null;
    const composed = warmFeedMode ? WARM_START_FEED_ITEMS : composeFeed(FEED_ITEMS, seededProfile);
    const unified  = composeFeedWithPreferences(composed, warmFeedMode ? [] : INTERSTITIAL_QUESTIONS);
    const badges = evaluateBadges(seededProfile.weights, 0, true);
    window.GLANCE_STATE = 'warm';
    setState(s => ({
      ...s,
      profile: { ...seededProfile, badges },
      profileDraft: draft,
      feed: composed,
      unifiedFeed: unified,
      feedIdx: 0,
      screen: 'feed',
      prevScreen: s.screen,
      onboardingDone: true,
      signalLog: derivedEntry ? [...s.signalLog, derivedEntry] : s.signalLog,
    }));
  }, []);

  const handleThumbsUp = useCallback((item: FeedItem, boosts: Record<string, string[]>, label: string) => {
    setState(s => {
      const p = { ...s.profile, weights: { ...s.profile.weights }, negativeWeights: { ...s.profile.negativeWeights } };
      const before = { ...p.weights };
      applyThumbsUpSignal(p, boosts as any, label);
      const deltas: Record<string, number> = {};
      for (const k of Object.keys(p.weights)) { const d = (p.weights[k] || 0) - (before[k] || 0); if (Math.abs(d) > 0.001) deltas[k] = d; }
      const entry = logThumbsUp(item.id, item.title, item.category, label, boosts.subCategories || [], deltas);
      const newFeed = rerankTail(s.feed, s.feedIdx, p);
      const badges = evaluateBadges(p.weights, s.feedbackCount + 1, s.onboardingDone);
      const draft = bumpInteractionCount(s.profileDraft);
      return { ...s, profile: { ...p, badges }, profileDraft: draft, feed: newFeed, feedbackCount: s.feedbackCount + 1, noInteractionCardCount: 0, lastInteractionType: 'like', signalLog: [...s.signalLog, entry] };
    });
  }, []);

  const handleThumbsDown = useCallback((item: FeedItem, decays: Record<string, string[]>, label: string, sessionOnly: boolean) => {
    setState(s => {
      const p = { ...s.profile, weights: { ...s.profile.weights }, negativeWeights: { ...s.profile.negativeWeights } };
      const beforeNeg = { ...p.negativeWeights };
      applyThumbsDownSignal(p, decays as any, label, sessionOnly);
      const deltas: Record<string, number> = {};
      for (const k of Object.keys(p.negativeWeights)) { const d = (p.negativeWeights[k] || 0) - (beforeNeg[k] || 0); if (Math.abs(d) > 0.001) deltas[k] = -d; }
      const entry = logThumbsDown(item.id, item.title, item.category, label, decays.categories || [], sessionOnly, deltas);
      const newFeed = rerankTail(s.feed, s.feedIdx, p);
      const badges = evaluateBadges(p.weights, s.feedbackCount + 1, s.onboardingDone);
      const draft = bumpInteractionCount(s.profileDraft);
      return { ...s, profile: { ...p, badges }, profileDraft: draft, feed: newFeed, feedbackCount: s.feedbackCount + 1, noInteractionCardCount: 0, lastInteractionType: 'dislike', signalLog: [...s.signalLog, entry] };
    });
  }, []);

  const handleContextualYes = useCallback((item: FeedItem) => {
    setState(s => {
      const p = { ...s.profile, weights: { ...s.profile.weights } };
      const boosts = { categories: [item.category], subCategories: item.subCategories.slice(0,2), vibes: item.vibes.slice(0,2) };
      const before = { ...p.weights };
      applyContextualYes(p, boosts, `More ${item.contextualTopic || item.category}`);
      const deltas: Record<string, number> = {};
      for (const k of Object.keys(p.weights)) { const d = (p.weights[k] || 0) - (before[k] || 0); if (Math.abs(d) > 0.001) deltas[k] = d; }
      const entry = logContextual(item.id, item.title, item.contextualTopic || item.category, 'yes', deltas);
      const newFeed = rerankTail(s.feed, s.feedIdx, p);
      return { ...s, profile: p, feed: newFeed, noInteractionCardCount: 0, lastInteractionType: 'contextual', signalLog: [...s.signalLog, entry] };
    });
    toast(`✦ More ${item.contextualTopic || item.category} coming up`);
  }, [toast]);

  const handlePassiveDwell = useCallback((item: FeedItem, isRepeat: boolean) => {
    setState(s => {
      const p = { ...s.profile, weights: { ...s.profile.weights } };
      const before = { ...p.weights };
      const boosts = { categories: [item.category], vibes: item.vibes.slice(0,2) };
      applyPassiveDwell(p, boosts, item.title, isRepeat);
      const deltas: Record<string, number> = {};
      for (const k of Object.keys(p.weights)) { const d = (p.weights[k] || 0) - (before[k] || 0); if (Math.abs(d) > 0.001) deltas[k] = d; }
      const entry = logPassiveDwell(item.id, item.title, item.category, isRepeat, deltas);
      return { ...s, profile: p, signalLog: [...s.signalLog, entry] };
    });
  }, []);

  const handleL1Exit = useCallback((item: FeedItem, label: string, key: string) => {
    setState(s => {
      if (s.interactionFollowUpsToday >= 1) return s;
      const p = { ...s.profile, weights: { ...s.profile.weights } };
      const before = { ...p.weights };
      const boosts = { subCategories: key ? [key] : [], categories: [item.category] };
      applyThumbsUpSignal(p, boosts as any, `L1 exit: ${label}`);
      const deltas: Record<string, number> = {};
      for (const k of Object.keys(p.weights)) { const d = (p.weights[k] || 0) - (before[k] || 0); if (Math.abs(d) > 0.001) deltas[k] = d; }
      const entry = logL1Exit(item.id, item.title, item.category, label, key, deltas);
      const newFeed = rerankTail(s.feed, s.feedIdx, p);
      return { ...s, profile: p, feed: newFeed, interactionFollowUpsToday: s.interactionFollowUpsToday + 1, noInteractionCardCount: 0, lastInteractionType: 'l1-exit', signalLog: [...s.signalLog, entry] };
    });
    toast(`✦ More ${label} coming up`);
  }, [toast]);

  const handleInterstitialAnswer = useCallback((label: string, boosts: any, confirmationText: string) => {
    setState(s => {
      const p = { ...s.profile, weights: { ...s.profile.weights } };
      const before = { ...p.weights };
      applyThumbsUpSignal(p, boosts, label);
      const deltas: Record<string, number> = {};
      for (const k of Object.keys(p.weights)) { const d = (p.weights[k] || 0) - (before[k] || 0); if (Math.abs(d) > 0.001) deltas[k] = d; }
      const entry = logInterstitial(`Interstitial: ${label}`, Object.values(boosts).flat() as string[], deltas);
      const newFeed = rerankTail(s.feed, s.feedIdx, p);
      return { ...s, profile: p, feed: newFeed, interstitialsShown: s.interstitialsShown + 1, noInteractionCardCount: 0, lastInteractionType: 'interstitial', signalLog: [...s.signalLog, entry] };
    });
    toast(`✦ ${confirmationText}`);
  }, [toast]);

  const handleFeedNav = useCallback((dir: 'next' | 'prev', dwellMs?: number) => {
    setState(s => {
      /* Navigate the unified feed; fall back to plain feed length if no unified feed */
      const totalLen = s.unifiedFeed.length > 0 ? s.unifiedFeed.length : s.feed.length;
      const nextIdx = dir === 'next'
        ? (s.feedIdx + 1) % totalLen
        : (s.feedIdx - 1 + totalLen) % totalLen;

      /* Skip signal/dwell logic for preference card slots */
      const nextUnified = s.unifiedFeed[nextIdx];
      const isNextPref = nextUnified?.type === 'preference';

      /* Resolve the actual FeedItem for the CURRENT slot (for skip signal) */
      const currentUnified = s.unifiedFeed[s.feedIdx];
      const departedItem = currentUnified?.type === 'glance'
        ? currentUnified.item
        : s.feed[s.feedIdx] ?? null;

      /* Resolve FeedItem for the NEXT slot (for seenItemIds) */
      const item = isNextPref
        ? (s.feed[nextIdx] ?? s.feed[0])
        : (nextUnified?.type === 'glance' ? nextUnified.item : s.feed[nextIdx]);

      const next = nextIdx;
      const seen = item ? [...new Set([...s.profile.seenItemIds, item.id])] : s.profile.seenItemIds;
      let p = { ...s.profile, weights: { ...s.profile.weights }, negativeWeights: { ...s.profile.negativeWeights }, evidenceCounts: { ...s.profile.evidenceCounts }, seenItemIds: seen };
      if (dwellMs !== undefined && dwellMs < 2000 && departedItem) {
        applySkipFast(p, { categories: [departedItem.category], vibes: departedItem.vibes.slice(0,1) }, departedItem.title);
      }
      const newCardCount = s.feedbackCount + 1;
      if (newCardCount % 5 === 0) decayAllWeights(p);
      const newFeed = rerankTail(s.feed, s.feedIdx, p);
      /* Recompose unified feed after rerank so preference positions stay consistent */
      const newUnified = composeFeedWithPreferences(newFeed, INTERSTITIAL_QUESTIONS);
      const newNoInteraction = s.noInteractionCardCount + 1;
      return { ...s, feedIdx: next, profile: p, feed: newFeed, unifiedFeed: newUnified, feedbackCount: newCardCount, noInteractionCardCount: newNoInteraction };
    });
  }, []);

  const handleReset = useCallback(() => {
    clearSignalLog();
    window.GLANCE_STATE = 'cold';
    setState(s => {
      const p = resetProfile(s.profile);
      const composed = composeFeed(FEED_ITEMS, p);
      const unified  = composeFeedWithPreferences(composed, INTERSTITIAL_QUESTIONS);
      return {
        ...s, profile: p, profileDraft: createSparseEnrichedProfile(),
        feed: composed, unifiedFeed: unified, feedIdx: 0, feedbackCount: 0,
        onboardingDone: false, interactionFollowUpsToday: 0,
        interstitialsShown: 0, noInteractionCardCount: 0,
        lastInteractionType: 'none', signalLog: [],
        screen: 'welcome', prevScreen: 'welcome',
      };
    });
    toast('✦ Starting fresh from here.');
  }, [toast]);

  const handleGenAnswer = useCallback((opt: { boost?: string[]; cut?: string[]; discover?: boolean; reinforce?: boolean; tuned: string }) => {
    setState(s => {
      const p = { ...s.profile, weights: { ...s.profile.weights }, negativeWeights: { ...s.profile.negativeWeights }, evidenceCounts: { ...s.profile.evidenceCounts } };
      if (opt.boost) applyGenQuestion(p, opt.boost, opt.tuned);
      if (opt.cut) applyGenDecay(p, opt.cut, opt.tuned);
      if (opt.discover) {
        const cats = ['fashion','food','travel','wellness','home','sports','entertainment','luxury','beauty','hobbies'];
        let loKey = cats[0], loEvidence = Infinity;
        cats.forEach(c => { const ev = p.evidenceCounts[`cat:${c}`] || 0; if (ev < loEvidence) { loEvidence = ev; loKey = c; } });
        applyGenQuestion(p, [loKey], opt.tuned);
      }
      if (opt.reinforce) {
        const top = Object.entries(p.weights).filter(([k]) => k.startsWith('cat:')).sort((a, b) => b[1] - a[1])[0];
        if (top) applyGenQuestion(p, [top[0].slice(4)], opt.tuned);
      }
      const newFeed = rerankTail(s.feed, s.feedIdx, p);
      return { ...s, profile: p, feed: newFeed, noInteractionCardCount: 0, lastInteractionType: 'gen-question' };
    });
  }, []);

  const handleSettingsChange = useCallback((change: { language?: string; familyFriendly?: boolean; market?: any }) => {
    setState(s => {
      let p = s.profile;
      if (change.language !== undefined) p = setLanguage(p, change.language);
      if (change.familyFriendly !== undefined) p = setFamilyFriendly(p, change.familyFriendly);
      if (change.market !== undefined) p = setMarket(p, change.market);
      const newFeed = rerankTail(s.feed, s.feedIdx, p);
      return { ...s, profile: p, feed: newFeed };
    });
  }, []);

  // Global keyboard handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const { key } = e;
      if (key === 'd' || key === 'D') setState(s => ({ ...s, debugOpen: !s.debugOpen }));
      if (key === 'e' || key === 'E') setState(s => ({ ...s, sessionOverlayOpen: !s.sessionOverlayOpen }));
      if (key === 's' || key === 'S') setState(s => ({ ...s, dataPanelOpen: !s.dataPanelOpen }));
      if (key === 'r' || key === 'R') handleReset();
      if (key === 'm' || key === 'M') {
        setState(s => {
          const markets: Array<'india'|'us'|'global'> = ['india','us','global'];
          const next = markets[(markets.indexOf(s.profile.market)+1)%3];
          return { ...s, profile: setMarket(s.profile, next) };
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleReset]);

  // No scaling — stage fills viewport natively via CSS


  const { screen, prevScreen, profile, profileDraft, feed, feedIdx, debugOpen, sessionOverlayOpen, dataPanelOpen, toastMsg, showToast, signalLog, interactionFollowUpsToday } = state;
  const slideBack = !isForward(prevScreen, screen);

  return (
    <>
      <div id="scaler">
        <div id="stage">
          <TVStage screen={screen} slideBack={slideBack}>

            {/* ── Welcome ───────────────────────────────────────────────── */}
            {screen === 'welcome' && (
              <WelcomeScreen
                onNext={() => { setFromWelcome(true); go('bangalore-confirm'); }}
                onSkip={() => go('tv-content')}
                onSkipAll={() => enterFeed(profile, profileDraft)}
              />
            )}

            {/* ── Bangalore confirm ─────────────────────────────────────── */}
            {screen === 'bangalore-confirm' && (
              <BangaloreConfirm
                onConfirm={() => go('tv-content')}
                onNotQuite={() => go('tv-content')}
                fromWelcome={fromWelcome}
              />
            )}

            {/* ── Q1: TV content type ───────────────────────────────────── */}
            {screen === 'tv-content' && (
              <TVContentQuestion
                profile={profile}
                initialSelected={state.setupSelections.tvContent as any}
                onNext={(p) => { setState(s => ({ ...s, profile: p })); go('audience'); }}
                onSkip={() => go('audience')}
                onBack={() => go('bangalore-confirm')}
              />
            )}

            {/* ── Q2: Audience ──────────────────────────────────────────── */}
            {screen === 'audience' && (
              <AudienceQuestion
                profile={profile}
                onNext={(p) => { setState(s => ({ ...s, profile: p })); go('show-more'); }}
                onSkip={() => go('show-more')}
                onBack={() => go('tv-content')}
              />
            )}

            {/* ── Q3: Show more (with Explore More) ────────────────────── */}
            {screen === 'show-more' && (
              <ShowMoreQuestion
                profile={profile}
                initialSelected={state.setupSelections.showMore}
                onNext={(p) => { setState(s => ({ ...s, profile: p })); go('weekend'); }}
                onSkip={() => go('weekend')}
                onBack={() => go('audience')}
              />
            )}

            {/* ── Q4: Weekend lifestyle ─────────────────────────────────── */}
            {screen === 'weekend' && (
              <WeekendQuestion
                profile={profile}
                initialSelected={state.setupSelections.weekend as any}
                onNext={(p) => { setState(s => ({ ...s, profile: p })); go('style'); }}
                onSkip={() => go('style')}
                onBack={() => go('show-more')}
              />
            )}

            {/* ── Q5: Style ─────────────────────────────────────────────── */}
            {screen === 'style' && (
              <StyleQuestion
                profile={profile}
                initialSelected={state.setupSelections.style as any}
                onNext={(p) => { setState(s => ({ ...s, profile: p })); go('selfie'); }}
                onSkip={() => go('selfie')}
                onBack={() => go('weekend')}
              />
            )}

            {/* ── Selfie value demo ─────────────────────────────────────── */}
            {screen === 'selfie' && (
              <SelfieScreen
                onNext={() => go('tuning')}
                onSkip={() => go('tuning')}
              />
            )}

            {/* ── Building feed transition ──────────────────────────────── */}
            {screen === 'tuning' && (
              <TuningTransition
                profileDraft={profileDraft}
                onDone={() => enterFeed(profile, profileDraft)}
              />
            )}

            {/* ── Feed ──────────────────────────────────────────────────── */}
            {screen === 'feed' && (
              <FeedScreen
                feed={feed}
                unifiedFeed={state.unifiedFeed}
                feedIdx={feedIdx}
                profile={profile}
                onNext={(dwellMs) => handleFeedNav('next', dwellMs)}
                onPrev={(dwellMs) => handleFeedNav('prev', dwellMs)}
                onThumbsUp={handleThumbsUp}
                onThumbsDown={handleThumbsDown}
                onContextualYes={handleContextualYes}
                onPassiveDwell={handlePassiveDwell}
                onSettingsChange={handleSettingsChange}
                onReset={handleReset}
                onGenAnswer={handleGenAnswer}
                onL1Exit={handleL1Exit}
                onInterstitialAnswer={handleInterstitialAnswer}
                interactionFollowUpsToday={interactionFollowUpsToday}
                onOpenDataPanel={() => setState(s => ({ ...s, dataPanelOpen: true }))}
                toast={toast}
                {...(warmFeedMode ? {
                  renderL0: (item, paused) => (
                    <WarmProfile1CrispL0Glance
                      key={item.id}
                      item={item}
                      profile={profile}
                      paused={paused}
                      onCTAClick={() => {}}
                      onTimelineComplete={() => {}}
                    />
                  ),
                } : {})}
              />
            )}

          </TVStage>
          <Toast msg={toastMsg} show={showToast} />
        </div>
      </div>

      {/* ── Debug panel (D key) — live profile + counters ─────────────────── */}
      {debugOpen && (
        <div style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: '40%', zIndex: 9999,
          background: 'rgba(0,0,0,0.92)',
          backdropFilter: 'blur(12px)',
          borderLeft: '1px solid rgba(112,71,226,0.3)',
          overflow: 'auto',
          padding: '24px 20px',
          fontFamily: 'monospace',
          fontSize: 11,
          color: '#a78be5',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#F5F3F7' }}>Debug Panel</span>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
              color: '#7047E2', background: 'rgba(112,71,226,0.2)',
              border: '1px solid rgba(112,71,226,0.4)', borderRadius: 4, padding: '3px 8px',
            }}>{window.GLANCE_STATE.toUpperCase()}</span>
          </div>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#c4b5fd', fontSize: 10 }}>
            {JSON.stringify({
              state: window.GLANCE_STATE,
              screen,
              GLANCE_CTX: window.GLANCE_CTX,
              GLANCE_PROFILE_DRAFT: profileDraft,
              INTERESTS: Object.fromEntries(
                Object.entries(profile.weights)
                  .filter(([,v]) => v > 0.01)
                  .sort((a,b) => b[1] - a[1])
                  .slice(0, 20)
              ),
              noInteractionCardCount: state.noInteractionCardCount,
              interstitialsShown: state.interstitialsShown,
              l1FollowupsShown: state.interactionFollowUpsToday,
              globalPromptCooldownActive: false,
              lastInteractionType: state.lastInteractionType,
              feedbackCount: state.feedbackCount,
            }, null, 2)}
          </pre>
        </div>
      )}

      {/* ── Session overlay (E key) ────────────────────────────────────────── */}
      {sessionOverlayOpen && (
        <SessionDataOverlay
          profile={profile}
          feed={feed}
          feedIdx={feedIdx}
          feedbackCount={state.feedbackCount}
          onboardingDone={state.onboardingDone}
          onClose={() => setState(s => ({ ...s, sessionOverlayOpen: false }))}
        />
      )}

      {/* ── Data panel (S key) ────────────────────────────────────────────── */}
      {dataPanelOpen && (
        <DataPanel
          signals={signalLog}
          sessionId={getSessionId()}
          onClose={() => setState(s => ({ ...s, dataPanelOpen: false }))}
        />
      )}

      <RemoteOverlay />
    </>
  );
}
