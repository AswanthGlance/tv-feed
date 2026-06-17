/**
 * WarmProfile1App — warm-start feed for Akshay (profile variant 1).
 * Route: /warm_profile_1
 *
 * Same feed, images, layout, and animations as WarmStartApp (Abhinav).
 * Only Card 1 (ws-india-afg) reasoning is updated per Akshay's profile.
 * Content source: Glance_TV_Warm_Start_Akshay.docx
 *
 * Profile: Male 35–40, Bangalore (Indiranagar / HSR). Sports + movies/series
 * with partner. Athletic build, disposable income, taste leans classy + trending.
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
import { setProfileOverrides } from './logic/reasoningEngine';
import TVStage from './components/TVStage';
import FeedScreen from './components/Feed/FeedScreen';
import WarmProfile1L0Glance from './components/L0/WarmProfile1L0Glance';
import Toast from './components/Toast';
import RemoteOverlay from './components/RemoteOverlay';

declare global { interface Window { GLANCE_CTX: Record<string, string>; GLANCE_STATE: string; } }
window.GLANCE_CTX = { city: 'Bangalore', weather: 'rainy', day: 'Saturday', timeOfDay: 'morning', upcomingContext: 'weekend' };
window.GLANCE_STATE = 'warm';

/* ── Akshay: all 8 warm-start cards ────────────────────────────────────────── */
setProfileOverrides(
  {
    // Card 1 — reasoning is shown via SignalDecisionReasoning; this is a fallback
    'ws-india-afg':
      "India vs Afghanistan is at the Chinnaswamy tonight, first ball at 7pm. Last group-stage fixture before the knockouts. I'll set your reminder and surface a fantasy XI 30 minutes before lock.",

    // Card 2 — Nandi Hills
    'ws-nandi-hills':
      "The Hebbal group rolls out for the Nandi loop at 4:30am Sunday. 60km round-trip, ascent at sunrise, back by 9. I'll map your route and add you to their WhatsApp on your nod.",

    // Card 3 — Om Beach
    'ws-om-beach':
      "Gokarna sits 8 hours by road or a 1-hour fly-and-drive via Hubli. Om Beach at 6am is the cleaner version of what you actually wanted in February. I'll plan the weekend: SwaSwara overnight, sunrise yoga, Vihangama on the way back.",

    // Card 4 — Coffee Estate
    'ws-coorg':
      "Attikan won the Indian Coffee Board's specialty cup last season and runs estate stays through monsoon. Six hours from Bangalore, peak green this fortnight. I'll shortlist three for you: Ama, Attikan, and one more, two nights each.",

    // Card 5 — Amalfi
    'ws-amalfi':
      "September is shoulder season for the Coast. Water still warm, crowds thinned. Le Sirenuse in Positano has a six-night September window open right now. I'll save it to your travel board for the longer trip with your partner.",

    // Card 6 — Wind Down
    'ws-wind-down':
      "Sleep keeps coming up across our chats and it's the easiest place to start. I've put together a 30-minute wind-down: lights down at 10:15, a yoga nidra track, screens off at 10:45. Want me to cue it for tonight?",

    // Card 7 — Vinyl
    'ws-vinyl-ritual':
      "The Local in Indiranagar runs a Hindi film soundtracks night this Saturday. I'd have you start there before you commit to the turntable. Hear the Aandhi reissue and the Rafi pressing on their setup first.",

    // Card 8 — Gehra Hua
    'ws-gehra-hua':
      "Gehra Hua is the most-played Hindi track in the country this week. Anuv Jain at the front, Bombay-indie production behind. I've built you a 14-track playlist: Gehra Hua, three Peter Cat picks, Aswekeepsearching, Tejas, and the rest of the week's chart.",
  },
  {
    'ws-india-afg':    ['Chinnaswamy tonight', 'first ball at 7pm'],
    'ws-nandi-hills':  ['Nandi loop at 4:30am Sunday', 'ascent at sunrise'],
    'ws-om-beach':     ['Om Beach at 6am', 'SwaSwara overnight'],
    'ws-coorg':        ['Attikan', 'peak green this fortnight'],
    'ws-amalfi':       ['Le Sirenuse in Positano', 'six-night September window'],
    'ws-wind-down':    ['30-minute wind-down', 'yoga nidra track'],
    'ws-vinyl-ritual': ['Hindi film soundtracks night this Saturday', 'Aandhi reissue'],
    'ws-gehra-hua':    ['most-played Hindi track', '14-track playlist'],
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

const WARM_START_PREFERENCE_QUESTIONS = [TRAVEL_BOOKING_QUESTION];

// 60-second idle timer is the only auto-advance mechanism.
// handleTimelineComplete no longer triggers an advance — it just fires for
// future instrumentation. Manual navigation (arrow keys, remote) still works.
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

export default function WarmProfile1App() {
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
                <WarmProfile1L0Glance
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
