/**
 * WarmStartApp — warm-start feed experience for a known user (Abhinav).
 * Route: /demo_warm_start
 *
 * Profile: Male 35–40, sports + travel + wellness + music, watches with partner.
 * Context: Bangalore · Monsoon · Morning.
 * Content source: Glance_TV_Warm_Start_Content_v1.docx
 *
 * Identical mechanics to ColdStartApp — only feed content differs.
 */
import { useState, useCallback, useRef } from 'react';
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
import ColdStartL0Glance from './components/L0/ColdStartL0Glance';
import Toast from './components/Toast';
import RemoteOverlay from './components/RemoteOverlay';

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

const IDLE_CEILING_MS = 99_999;
const HOLD_AFTER_COMPLETE_MS = 10_000;

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

export default function WarmStartApp() {
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

  const handleTimelineComplete = useCallback(() => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => {
      onNextRef.current(HOLD_AFTER_COMPLETE_MS);
    }, HOLD_AFTER_COMPLETE_MS);
  }, []);

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

  const { profile, feed, unifiedFeed, feedIdx, interactionFollowUpsToday, toastMsg, showToast } = state;

  return (
    <>
      <div id="scaler">
        <div id="stage">
          <TVStage screen="feed" slideBack={false}>
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
                <ColdStartL0Glance
                  key={item.id}
                  item={item}
                  profile={profile}
                  paused={paused}
                  onCTAClick={onCTAClick}
                  onTimelineComplete={handleTimelineComplete}
                />
              )}
              idleMs={IDLE_CEILING_MS}
            />
          </TVStage>
          <Toast msg={toastMsg} show={showToast} />
        </div>
      </div>
      <RemoteOverlay />
    </>
  );
}
