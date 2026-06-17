/**
 * ColdStartApp — standalone cold-start feed experience.
 * Route: /demo_cold_start
 *
 * A user who skipped onboarding. Glance knows very little.
 * Uses curated Bangalore · Monsoon · Morning starter content.
 * Design, animation, and component language is identical to the main feed.
 *
 * Differences from the main feed:
 *  - Uses ColdStartL0Glance (fixed agent sequence, onTimelineComplete callback)
 *  - idleMs is set to a large ceiling (99999) — advance is driven by onTimelineComplete
 *  - After onTimelineComplete fires, a 10s hold timer starts, then auto-advances
 *  - User interaction resets/cancels the hold as usual
 */
import { useState, useCallback, useRef } from 'react';
import type { FeedItem, PreferenceProfile } from './data/types';
import { createDefaultProfile } from './logic/preferenceProfile';
import {
  applyThumbsUpSignal, applyThumbsDownSignal, applyContextualYes,
  applyPassiveDwell, applySkipFast, decayAllWeights,
} from './logic/signals';
import { rerankTail } from './logic/ranking';
import { COLD_START_FEED_ITEMS } from './data/coldStartFeedItems';
import { composeFeedWithPreferences } from './logic/feedComposer';
import type { UnifiedFeedItem } from './logic/feedComposer';
import type { QuestionConfig } from './data/preferenceQuestions';
import { evaluateBadges } from './data/badges';
import TVStage from './components/TVStage';
import FeedScreen from './components/Feed/FeedScreen';
import ColdStartL0Glance from './components/L0/ColdStartL0Glance';
import Toast from './components/Toast';
import RemoteOverlay from './components/RemoteOverlay';

// Reasoning engine context: Bangalore · Monsoon · Morning
declare global { interface Window { GLANCE_CTX: Record<string, string>; GLANCE_STATE: string; } }
window.GLANCE_CTX = { city: 'Bangalore', weather: 'rainy', day: 'Saturday', timeOfDay: 'morning', upcomingContext: 'weekend' };
window.GLANCE_STATE = 'cold';

// "Who watches this TV?" — single-select, 4 options, images from setup flow
const WHO_WATCHES_QUESTION: QuestionConfig = {
  id: 'who-watches-tv',
  surface: 'interstitial',
  template: 'single-select',
  question: 'Who watches this TV?',
  subtext: 'This helps me get the tone right from the start',
  autoDismissMs: 0,
  skipBehavior: 'no-signal',
  expectedSignalGain: 4,
  options: [
    {
      id: 'solo',
      label: 'Mostly me',
      image: '/images/setup/setup_q2_solo.jpg',
      boosts: { vibes: ['personal', 'intimate', 'focused'] },
      confirmationText: "Got it. I'll tune this closely to your personal taste.",
    },
    {
      id: 'couple',
      label: 'My partner and I',
      image: '/images/setup/setup_q2_pair.jpg',
      boosts: { vibes: ['social', 'warm', 'calm'] },
      confirmationText: "Perfect. I'll find content you'd both reach for.",
    },
    {
      id: 'kids',
      label: 'Kids watch it too',
      image: '/images/setup/setup_q2_kids.jpg',
      boosts: { vibes: ['family', 'warm', 'comfort'], categories: ['entertainment', 'food'] },
      confirmationText: 'Noted. Family-friendly is built in from the start.',
    },
    {
      id: 'social',
      label: 'Friends & family',
      image: '/images/setup/setup_q2_friends.jpg',
      boosts: { vibes: ['social', 'festive', 'high-energy'], categories: ['entertainment', 'food'] },
      confirmationText: 'Love it. Great crowd-pleasing picks coming your way.',
    },
  ],
};

const COLD_START_PREFERENCE_QUESTIONS = [WHO_WATCHES_QUESTION];

// Large idle ceiling — auto-advance is driven by onTimelineComplete + 10s hold, not flat timer
const IDLE_CEILING_MS = 99_999;
const HOLD_AFTER_COMPLETE_MS = 10_000;

function buildInitialFeed(): { feed: FeedItem[]; unifiedFeed: UnifiedFeedItem[] } {
  const feed = COLD_START_FEED_ITEMS;
  const unifiedFeed = composeFeedWithPreferences(feed, COLD_START_PREFERENCE_QUESTIONS);
  return { feed, unifiedFeed };
}

type ColdStartState = {
  profile: PreferenceProfile;
  feed: FeedItem[];
  unifiedFeed: UnifiedFeedItem[];
  feedIdx: number;
  feedbackCount: number;
  interactionFollowUpsToday: number;
  toastMsg: string;
  showToast: boolean;
};

export default function ColdStartApp() {
  const { feed: initialFeed, unifiedFeed: initialUnified } = buildInitialFeed();

  const [state, setState] = useState<ColdStartState>({
    profile: createDefaultProfile(),
    feed: initialFeed,
    unifiedFeed: initialUnified,
    feedIdx: 0,
    feedbackCount: 0,
    interactionFollowUpsToday: 0,
    toastMsg: '',
    showToast: false,
  });

  const toastTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Stable ref to onNext so the hold timer always calls the latest version
  const onNextRef   = useRef<(dwellMs?: number) => void>(() => {});

  const toast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setState(s => ({ ...s, toastMsg: msg, showToast: true }));
    toastTimer.current = setTimeout(() => setState(s => ({ ...s, showToast: false })), 2200);
  }, []);

  /* Called by ColdStartL0Glance when the full sequence settles.
     Starts the 10s hold — if no user interaction, auto-advances. */
  const handleTimelineComplete = useCallback(() => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => {
      onNextRef.current(HOLD_AFTER_COMPLETE_MS);
    }, HOLD_AFTER_COMPLETE_MS);
  }, []);

  /* Cancel hold on any user interaction (thumbs, contextual, nav) */
  const cancelHold = useCallback(() => {
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
  }, []);

  const handleThumbsUp = useCallback((item: FeedItem, boosts: Record<string, string[]>, label: string) => {
    cancelHold();
    setState(s => {
      const p = { ...s.profile, weights: { ...s.profile.weights }, negativeWeights: { ...s.profile.negativeWeights } };
      applyThumbsUpSignal(p, boosts as any, label);
      const newFeed = rerankTail(s.feed, s.feedIdx, p);
      const unified = composeFeedWithPreferences(newFeed, COLD_START_PREFERENCE_QUESTIONS);
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
      const unified = composeFeedWithPreferences(newFeed, COLD_START_PREFERENCE_QUESTIONS);
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
      const unified = composeFeedWithPreferences(newFeed, COLD_START_PREFERENCE_QUESTIONS);
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
      const unified = composeFeedWithPreferences(newFeed, COLD_START_PREFERENCE_QUESTIONS);
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
      const unified = composeFeedWithPreferences(newFeed, COLD_START_PREFERENCE_QUESTIONS);
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
      const unified = composeFeedWithPreferences(newFeed, COLD_START_PREFERENCE_QUESTIONS);

      return { ...s, feedIdx: nextIdx, profile: p, feed: newFeed, unifiedFeed: unified, feedbackCount: newCount };
    });
  }, [cancelHold]);

  // Keep onNextRef current so the holdTimer closure always advances
  const handleNext = useCallback((dwellMs?: number) => handleFeedNav('next', dwellMs), [handleFeedNav]);
  onNextRef.current = handleNext;

  const handleReset = useCallback(() => {
    cancelHold();
    const { feed, unifiedFeed } = buildInitialFeed();
    window.GLANCE_STATE = 'cold';
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
              /* Cold-start specific: use fixed-sequence L0 component */
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
              /* Large ceiling: advance is driven by onTimelineComplete + 10s hold */
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
