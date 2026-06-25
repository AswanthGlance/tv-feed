/**
 * WarmProfile2CrispApp — warm-start feed for Ananya, crisp reasoning variant.
 * Route: /warm_profile_2_crisp  or  /warm-profile-2-crisp
 *
 * Identical structure to WarmProfile1CrispApp except:
 *   - Uses WARM_PROFILE_2_FEED_ITEMS (11 Ananya cards, cold-start images)
 *   - Uses WarmProfile2CrispL0Glance (WARM_PROFILE_2_SIGNAL_DATA_CRISP)
 *   - setProfileOverrides uses Ananya's per-card reasoning
 *
 * Signals, layouts, animations, timing, and all other behaviour are unchanged.
 */
import { useState, useCallback, useRef } from 'react';
import type { FeedItem, PreferenceProfile } from './data/types';
import { createDefaultProfile } from './logic/preferenceProfile';
import {
  applyThumbsUpSignal, applyThumbsDownSignal, applyContextualYes,
  applyPassiveDwell, applySkipFast, decayAllWeights,
} from './logic/signals';
import { rerankTail } from './logic/ranking';
import { WARM_PROFILE_2_FEED_ITEMS } from './data/warmProfile2FeedItems';
import { composeFeedWithPreferences } from './logic/feedComposer';
import type { UnifiedFeedItem } from './logic/feedComposer';
import type { QuestionConfig } from './data/preferenceQuestions';
import { evaluateBadges } from './data/badges';
import { setProfileOverrides } from './logic/reasoningEngine';
import TVStage from './components/TVStage';
import FeedScreen from './components/Feed/FeedScreen';
import WarmProfile2CrispL0Glance from './components/L0/WarmProfile2CrispL0Glance';
import Toast from './components/Toast';
import RemoteOverlay from './components/RemoteOverlay';

declare global { interface Window { GLANCE_CTX: Record<string, string>; GLANCE_STATE: string; } }
window.GLANCE_CTX = { city: 'Bangalore', weather: 'rainy', day: 'Saturday', timeOfDay: 'morning', upcomingContext: 'weekend' };
window.GLANCE_STATE = 'warm';

/* ── Ananya: all 11 warm-profile-2 cards — crisp reasoning ─────────────────── */
setProfileOverrides(
  {
    'wp2-balcony':
      "Lalbagh prices climb in eight weeks — I'll pull a starter set\nof five monsoon plants plus fairy lights, under ₹3,500.",

    'wp2-gond-art':
      "Three studios near you added Saturday Gond drop-ins: ₹1,800,\nmaterials included. I'd book the 10am slot — that light is right.",

    'wp2-gold-stack':
      "Gold dipped to its softest since March — Onam will pull it back.\nI'll shortlist a chain, cuff, and two-ring stack under 8g.",

    'wp2-football':
      "The BWFL runs an open pickup at the Koramangala turf Sunday at 8am.\nI'll add you to the WhatsApp list and hold a 6:30 alarm.",

    'wp2-bonda':
      "Five ingredients, 25 minutes, plus a 90-minute curd-rest doing the work.\nI'll send the recipe to your phone for the weekend.",

    'wp2-shivanasamudra':
      "KRS released 14,200 cusecs yesterday — loudest in three monsoons.\nI'll plan 6am out, lunch at Talakadu, back by 4.",

    'wp2-vidhana':
      "After last night's rain, the granite plinth is a black mirror.\nSunrise is 5:48 — your shot lives in the 30 minutes before traffic.",

    'wp2-sunnys':
      "Sunny's on Lavelle Road has run eggs benedict and slow coffee since 1990.\nTuesday and Wednesday breakfasts are the calmest.",

    'wp2-pour-over':
      "Subko's Indiranagar runs a 45-minute walkthrough Saturday mornings.\nI'll book the 9am slot — smallest group, technique straight to your kitchen.",

    'wp2-therpup':
      "TherPUP in Whitefield: ₹500 an hour, eight resident dogs.\nThe 10am slot averages 4 guests — loosest just after their morning walk.",

    'wp2-vinyasa':
      "Iyengar lands cleaner for desk-job shoulders — Cubbon AQI is 22 post-rain.\nI've cued a 20-minute flow, props-light. Press play and start.",
  },
  {
    'wp2-balcony':        ['Lalbagh prices climb', 'five monsoon plants'],
    'wp2-gond-art':       ['Saturday Gond drop-ins', '10am slot'],
    'wp2-gold-stack':     ['softest since March', 'chain, cuff, and two-ring stack'],
    'wp2-football':       ['Koramangala turf this Sunday', '6:30 alarm'],
    'wp2-bonda':          ['five ingredients, 25 minutes', 'recipe to your phone'],
    'wp2-shivanasamudra': ['14,200 cusecs yesterday', '6am out, lunch at Talakadu'],
    'wp2-vidhana':        ['granite plinth is a black mirror', '30 minutes before traffic'],
    'wp2-sunnys':         ['eggs benedict and slow coffee since 1990', 'Tuesday and Wednesday'],
    'wp2-pour-over':      ["Subko's Indiranagar", '9am slot'],
    'wp2-therpup':        ['TherPUP in Whitefield', '10am slot averages 4 guests'],
    'wp2-vinyasa':        ['desk-job shoulders', 'Cubbon AQI is 22'],
  },
);

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

const WARM_PROFILE_2_PREFERENCE_QUESTIONS = [TRAVEL_BOOKING_QUESTION];

const IDLE_CEILING_MS = 60_000;

function buildInitialFeed(): { feed: FeedItem[]; unifiedFeed: UnifiedFeedItem[] } {
  const feed = WARM_PROFILE_2_FEED_ITEMS;
  const unifiedFeed = composeFeedWithPreferences(feed, WARM_PROFILE_2_PREFERENCE_QUESTIONS);
  return { feed, unifiedFeed };
}

type WarmProfile2State = {
  profile: PreferenceProfile;
  feed: FeedItem[];
  unifiedFeed: UnifiedFeedItem[];
  feedIdx: number;
  feedbackCount: number;
  interactionFollowUpsToday: number;
  toastMsg: string;
  showToast: boolean;
};

export default function WarmProfile2CrispApp() {
  const { feed: initialFeed, unifiedFeed: initialUnified } = buildInitialFeed();

  const [state, setState] = useState<WarmProfile2State>({
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
    // No-op: auto-advance is handled by the 60s idle timer in FeedScreen.
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
      const unified = composeFeedWithPreferences(newFeed, WARM_PROFILE_2_PREFERENCE_QUESTIONS);
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
      const unified = composeFeedWithPreferences(newFeed, WARM_PROFILE_2_PREFERENCE_QUESTIONS);
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
      const unified = composeFeedWithPreferences(newFeed, WARM_PROFILE_2_PREFERENCE_QUESTIONS);
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
      const unified = composeFeedWithPreferences(newFeed, WARM_PROFILE_2_PREFERENCE_QUESTIONS);
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
      const unified = composeFeedWithPreferences(newFeed, WARM_PROFILE_2_PREFERENCE_QUESTIONS);
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
      const unified = composeFeedWithPreferences(newFeed, WARM_PROFILE_2_PREFERENCE_QUESTIONS);

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
              renderL0={(item, paused) => (
                <WarmProfile2CrispL0Glance
                  key={item.id}
                  item={item}
                  profile={profile}
                  paused={paused}
                  onCTAClick={() => {}}
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
