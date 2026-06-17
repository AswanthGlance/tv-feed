import type { FeedItem } from '../data/types';

/* ─────────────────────────────────────────────────────────────────────────────
   Reasoning Engine — conversational agent reasoning for L0.

   Rules:
   · Every line connects at least 2 signals
   · Every string contains exactly one ". " so ReasoningReveal splits into 2 lines
   · No em dashes. No system language. No "based on your preferences."
   · Tone: a thoughtful friend who understands your context
   ───────────────────────────────────────────────────────────────────────────── */

type GlanceCtx = {
  timeOfDay?: string;
  weather?: string;
  city?: string;
  day?: string;
  upcomingContext?: string;
};

function ctx(): GlanceCtx {
  return (window as any).GLANCE_CTX || {};
}

/* ── Context helpers ──────────────────────────────────────────────────────── */

function time(): string {
  const t = ctx().timeOfDay;
  if (t === 'morning')   return 'this morning';
  if (t === 'afternoon') return 'this afternoon';
  if (t === 'evening')   return 'this evening';
  if (t === 'night')     return 'tonight';
  return 'right now';
}

function weather(): string | null {
  const w = ctx().weather;
  if (w === 'rainy')  return 'a rainy day like today';
  if (w === 'sunny')  return 'a bright, sunny day';
  if (w === 'cloudy') return 'a slow, cloudy afternoon';
  if (w === 'stormy') return 'stormy weather outside';
  if (w === 'clear')  return 'clear skies today';
  return null;
}

function upcoming(): string | null {
  const u = ctx().upcomingContext;
  if (u === 'long_weekend') return 'the long weekend ahead';
  if (u === 'weekend')      return 'the weekend coming up';
  if (u === 'holiday')      return 'the holiday nearby';
  if (u === 'festival')     return 'the festival season';
  return null;
}

function city(): string | null { return ctx().city || null; }
function isEvening(): boolean { return ['evening','night'].includes(ctx().timeOfDay || ''); }
function isMorning(): boolean { return ctx().timeOfDay === 'morning'; }

function subLabel(item: FeedItem, idx = 0): string {
  return (item.subCategories?.[idx] || '').replace(/-/g, ' ');
}

/* ── Category reasoning banks
   Each entry has exactly one ". " so the 2-line split is guaranteed.
   No em dashes. Human voice throughout.
   ─────────────────────────────────────────────────────────────────────────── */

type ReasonFn = (item: FeedItem) => string;

const banks: Record<string, ReasonFn[]> = {

  food: [
    (i) => city()
      ? `${city()}'s ${subLabel(i,0)} culture ran deep in your local picks. That's what brought this forward.`
      : `Your taste for ${subLabel(i,0)} matched what people around you tend to lean toward. That's the connection.`,

    (i) => weather()
      ? `With ${weather()}, your comfort food signals pointed straight toward ${subLabel(i,0)}. This felt like the right match.`
      : `Your comfort food signals came through clearly in your picks. ${subLabel(i,0)} fit that direction well.`,

    (i) => isEvening()
      ? `Your evening picks have been leaning toward shared, warm meals. ${subLabel(i,0)} felt exactly right for tonight.`
      : `You tend to lean toward slow, unhurried food ${time()}. ${subLabel(i,0)} matched that pattern.`,

    (i) => upcoming()
      ? `With ${upcoming()}, your interest in ${subLabel(i,0)} pointed toward something worth sitting down for. This fits.`
      : `You've leaned toward comfort food in similar moments before. ${subLabel(i,0)} fit that thread.`,

    (i) => `Your past food picks tilted local and specific. ${subLabel(i,0)} surfaced because the pattern held.`,
  ],

  fashion: [
    (i) => upcoming()
      ? `Your style picks leaned ${subLabel(i,0)}, and with ${upcoming()} coming up, this felt like the right pull. Good timing.`
      : `Your recent style picks keep pointing toward ${subLabel(i,0)}. This edit caught that direction exactly.`,

    (i) => `You've been responding to ${subLabel(i,1) || 'editorial'} aesthetics lately. This fit that thread without forcing it.`,

    (_i) => isEvening()
      ? `Your evening style signals lean considered and intentional. This matched that energy for tonight.`
      : `Your eye for detail came through consistently in your picks. This one rewards a closer look.`,

    (i) => city()
      ? `${city()}'s street energy matched your ${subLabel(i,0)} interest well. I pulled this for that reason.`
      : `Your ${subLabel(i,0)} interest and the social energy in your recent picks brought this forward.`,
  ],

  travel: [
    (i) => city()
      ? `From ${city()}, ${subLabel(i,0)} is within reach. Your travel picks have been leaning that direction anyway.`
      : `Your curiosity about ${subLabel(i,0)} came through in your onboarding answers. This continues that thread.`,

    (i) => upcoming()
      ? `With ${upcoming()}, your interest in ${subLabel(i,0)} made this the most natural thing to surface right now. It fits the moment.`
      : `Your travel picks gravitate toward ${subLabel(i,1) || 'scenic'} escapes. This one delivers exactly that.`,

    (i) => weather()
      ? `${weather()} tends to pull out your quieter travel instincts. ${subLabel(i,0)} matched that mood well.`
      : `You lean toward ${subLabel(i,0)} when the pace slows down. ${isMorning() ? 'This morning felt like the right moment.' : 'The timing felt right.'}`,

    (i) => `Your cultural travel interest has been consistent across your picks. ${subLabel(i,0)} surfaced because of that, not in spite of it.`,
  ],

  wellness: [
    (i) => isMorning()
      ? `You've shown a morning ritual instinct across your picks. ${subLabel(i,0)} fits that quiet slot before the day fills up.`
      : `Your evening signals lean calm and restorative. ${subLabel(i,0)} matched that direction for tonight.`,

    (i) => weather()
      ? `With ${weather()}, your slow-living signals pointed toward ${subLabel(i,0)} as the right kind of pause. This fits.`
      : `Your ${subLabel(i,0)} interest came through clearly in your picks. This surfaced because the signals aligned well.`,

    (_i) => isEvening()
      ? `You've been leaning toward calm, unhurried evenings lately. This fits that rhythm without asking much of you.`
      : `Your self-care signals have been consistent. This matched what you've been gravitating toward.`,

    (i) => upcoming()
      ? `With ${upcoming()} coming, your ${subLabel(i,0)} interest made this worth pulling forward now. Good timing.`
      : `Your slow-living signals and your ${subLabel(i,0)} interest pointed at this together. It felt earned.`,
  ],

  home: [
    (i) => weather()
      ? `${weather()} tends to sharpen your home instincts. ${subLabel(i,0)} surfaced for exactly that reason today.`
      : `Your ${subLabel(i,0)} signals have been consistent across your picks. This came up because the pattern held.`,

    (i) => upcoming()
      ? `With ${upcoming()} ahead, your interest in ${subLabel(i,0)} made this feel timely rather than random. It fits the moment.`
      : `The ${subLabel(i,1) || 'cozy'} aesthetic you keep returning to, this one delivers it cleanly.`,

    (_i) => isMorning()
      ? `Your morning picks lean domestic and grounded. This fit the mood before the day picked up pace.`
      : `Your slow-living signals came through across multiple picks. This matched that consistent thread.`,

    (i) => city()
      ? `${city()} homes lean ${subLabel(i,1) || 'warm'} in how they're styled. Your picks reflected that instinct clearly.`
      : `You responded to warm, considered interiors before. This continues that direction naturally.`,
  ],

  sports: [
    (i) => isEvening()
      ? `Evening energy signals came through clearly in your picks. ${subLabel(i,0)} matched that for tonight.`
      : `Your ${subLabel(i,0)} interest and ${isMorning() ? 'the energy of the morning' : time()} made this the obvious pick.`,

    (i) => upcoming()
      ? `With ${upcoming()}, your ${subLabel(i,0)} interest picked up noticeably. This felt right for where you are.`
      : `You've been responding to high-energy content consistently. ${subLabel(i,0)} matched that pattern.`,

    (i) => city()
      ? `${subLabel(i,0)} runs deep in ${city()}'s sports culture. Your interest and your location aligned here naturally.`
      : `Your ${subLabel(i,1) || 'sport'} interest matched well with what's moving today. This hit both.`,

    (i) => `You've paused on ${subLabel(i,0)} content before. I surfaced this to continue that thread.`,
  ],

  entertainment: [
    (i) => isEvening()
      ? `Your evening picks lean cultural and immersive. ${subLabel(i,0)} surfaced for exactly that tonight.`
      : `Your ${subLabel(i,0)} interest came through your earlier picks. This kept that thread going.`,

    (i) => upcoming()
      ? `With ${upcoming()}, your ${subLabel(i,0)} interest made this feel timely. It fits the moment well.`
      : `You were already in that rhythm. This continues the evening without making you search for it.`,

    (i) => city()
      ? `${city()}'s ${subLabel(i,0)} scene is strong. Your cultural picks pointed right here.`
      : `Your cultural content signals have been consistent. This matched both the depth and the direction.`,

    (_i) => `You responded to similar content earlier. I surfaced this to keep that momentum going.`,
  ],

  luxury: [
    (i) => upcoming()
      ? `Your premium instincts came through clearly. With ${upcoming()}, this felt worth surfacing now.`
      : `Your aspirational signals pointed toward ${subLabel(i,0)}. The timing lined up well.`,

    (i) => `Your taste for ${subLabel(i,1) || 'elevated'} quality came through in your picks. This delivered on both the feel and the standard.`,

    (i) => city()
      ? `${city()} has a strong luxury sensibility. Your picks leaned that way, so I matched accordingly.`
      : `Your premium content signals were consistent across your picks. This surfaced for that reason.`,

    (_i) => isEvening()
      ? `Evening is when your aspirational signals tend to be strongest. This matched that window.`
      : `Your premium taste came through early in your picks. This kept that thread going without forcing it.`,
  ],

  beauty: [
    (i) => isMorning()
      ? `Your morning routine signals came through clearly. ${subLabel(i,0)} matched that quiet, intentional start.`
      : `Your ${subLabel(i,0)} interest and ${isEvening() ? 'the evening wind-down mood' : time()} brought this forward.`,

    (i) => weather()
      ? `${weather()} changes what your skin actually needs. ${subLabel(i,0)} felt relevant for that reason today.`
      : `Your self-care signals have been consistent. ${subLabel(i,0)} matched that direction clearly.`,

    (i) => city()
      ? `${city()}'s beauty culture leans ritual-first. Your picks reflected that instinct well.`
      : `The ${subLabel(i,1) || 'ritual'} tone you respond to, this one delivers it with the right weight.`,

    (_i) => `Your self-care signals have shown up consistently across your picks. This matched that thread rather than interrupting it.`,
  ],

  hobbies: [
    (i) => isMorning()
      ? `Your morning picks lean hands-on and slow. ${subLabel(i,0)} matched that start exactly.`
      : `Your ${subLabel(i,0)} interest and ${isEvening() ? 'the slower evening pace' : time()} made this the natural pick.`,

    (i) => upcoming()
      ? `With ${upcoming()}, your ${subLabel(i,0)} interest suggested you might actually want to try this. It's worth it.`
      : `Your creative signals have been consistent. ${subLabel(i,0)} surfaced because the pattern held.`,

    (i) => weather()
      ? `${weather()} tends to surface your quieter, hands-on instincts. ${subLabel(i,0)} matched that mood well.`
      : `You lean toward the ${subLabel(i,1) || 'craft'} side of things when the pace slows. This fit that.`,

    (_i) => `Your slow-living and creative signals aligned clearly here. Both pointed in the same direction.`,
  ],
};

const fallback: ReasonFn[] = [
  (i) => city()
    ? `Your ${subLabel(i,0)} interest matched what's resonating in ${city()} ${time()}. The timing felt right.`
    : `Your ${subLabel(i,0)} signals and the current context both pointed here. That's what surfaced this.`,
  (i) => upcoming()
    ? `With ${upcoming()}, your ${i.category} interest felt timely enough to surface this now. It fits.`
    : `Your taste and the timing aligned well. This is what that intersection looked like.`,
  (_i) => `Multiple signals pointed the same way, your recent picks, the time, and the context. This is where they landed.`,
];

/* ── Per-item overrides ────────────────────────────────────────────────────── */

const itemOverrides: Record<string, string> = {
  'eatly-dawn':  'Bangalore\'s South Indian breakfast culture ran through your local, comfort-first picks. That\'s what surfaced this.',
  'feed-03':     'Chennai\'s morning food culture is specific and deep. Your regional picks pointed here before the city even woke up.',
  'feed-04':     'Your social dining signals came through clearly across your picks. This matched the shared, unhurried table energy.',
  'feed-05':     'Your heritage travel interest and Rajasthan\'s cultural depth aligned here. Jaipur at blue hour earned its place.',
  'feed-06':     'Your calm, nature-led signals pointed toward the Himalayas. The pace you prefer is exactly what this has.',
  'feed-21':     'Kerala\'s backwater calm matched your slow travel instincts well. Munnar surfaced for that exact combination.',
  'feed-22':     'Your cafe culture interest and Seoul\'s calm urban energy were a natural match. Both pointed here.',
  'feed-25':     'India\'s cricket culture runs deep in your local picks. Stadium energy matched your high-energy signals tonight.',
  'feed-47':     'A rainy day and your chai comfort signals pointed here together. This one felt like a natural conclusion.',

  // ── Cold Start overrides — Bangalore · Monsoon · Morning ─────────────────
  'cs-balcony-escape':   'Bangalore balconies are at their best in monsoon — soft light, cool air, the city blurred behind the rain. Morning is when most balcony setups happen.',
  'cs-gond-art':         'Indoor craft is a natural monsoon-morning fit, and Gond and Madhubani drop-in studios run weekend sessions through the season. This is one of the better slots.',
  'cs-gold-stack':       'Layered everyday-gold is one of the season\'s most-saved jewellery formats, and Bangalore\'s festive jewellery searches climb through monsoon. This surfaced for that reason.',
  'cs-monsoon-football': 'Monsoon turf football is one of Bangalore\'s loudest weekend formats. Most South Bangalore turfs open public morning slots in the rain.',
  'cs-mysore-bonda':     'Bonda and filter coffee is the canonical Bangalore monsoon-morning order. Most spots only run it between 7 and 11.',
  'cs-shivanasamudra':   'Shivanasamudra hits its peak roar in late June. The day-trip window from Bangalore is open for about six weeks.',
  'cs-vidhana-soudha':   'After a monsoon rain, the Vidhana Soudha plaza\'s wet granite holds the dawn reflections that don\'t show up in dry weather. Quietest just after sunrise.',
  'cs-sunnys':           'Sunny\'s is one of Bangalore\'s longest-running breakfast spots. Weekday mornings are the easier slot — most weekend tables are reserved ahead.',
  'cs-pour-over':        'Bangalore is India\'s third-wave coffee capital. Pour-over bars across Indiranagar and Koramangala open early through monsoon.',
  'cs-therpup':          'Pet cafes are a growing Bangalore weekend format. The morning slot is the calmest one for first-time visitors.',
  'cs-vinyasa-cubbon':   'The hour after monsoon rain is the cleanest air Bangalore gets all day. Cubbon Park is at its quietest then.',

  // Warm start — Abhinav's personalised feed
  'ws-india-afg':    'You told me sports matters. India vs Afghanistan is tonight\'s biggest fixture, first ball at 7pm.',
  'ws-nandi-hills':  'You picked sports and local rides. The Nandi loop is Bangalore\'s cleanest pre-dawn route, and the window opens tomorrow morning.',
  'ws-om-beach':     'You chose both wellness and travel. Om Beach sits at that exact overlap, a sunrise yoga session three hours from Goa.',
  'ws-coorg':        'You marked travel and local weekends. Coorg sits right in that overlap, six hours from Bangalore and peak green this fortnight.',
  'ws-amalfi':       'You said you travel with your partner. Amalfi is the most-asked-about destination for Indian couples this year, so I kept it close.',
  'ws-wind-down':    'You wanted more wellness, and you watch this with your partner. I brought the wind-down forward, it\'s the easiest routine for two people to start tonight.',
  'ws-vinyl-ritual': 'You added music to your picks. I brought vinyl forward because slow-listening is quietly making a comeback, and evenings are when it fits best.',
  'ws-gehra-hua':    'You marked trending music and Hindi hits. Gehra Hua is the most-played track in India this week, so I\'ve queued the rest of the playlist from here.',
};

/* ── Auto-highlight extraction ─────────────────────────────────────────────── */

const STOP_FRAGMENTS = new Set([
  'right now', 'this morning', 'this afternoon', 'this evening', 'tonight',
  'a rainy day like today', 'a bright, sunny day', 'a slow, cloudy afternoon',
  'stormy weather outside', 'clear skies today',
  'the long weekend ahead', 'the weekend coming up', 'the holiday nearby', 'the festival season',
  'that\'s what surfaced this', 'that\'s the connection', 'for that reason',
  'for exactly that', 'this felt like', 'this fit', 'this fits',
]);

function extractHighlights(text: string, item: FeedItem): string[] {
  const candidates: string[] = [];
  for (const sub of item.subCategories ?? []) {
    const label = sub.replace(/-/g, ' ');
    if (new RegExp(label, 'i').test(text)) candidates.push(label);
  }
  const c = city();
  if (c && text.includes(c)) candidates.push(c);
  if (item.contextualTopic && new RegExp(item.contextualTopic, 'i').test(text)) {
    candidates.push(item.contextualTopic);
  }
  for (const vibe of item.vibes ?? []) {
    if (text.toLowerCase().includes(vibe)) candidates.push(vibe);
  }
  const seen = new Set<string>();
  const result: string[] = [];
  for (const cand of candidates) {
    const key = cand.toLowerCase();
    if (seen.has(key) || STOP_FRAGMENTS.has(key) || cand.length < 3) continue;
    seen.add(key);
    result.push(cand);
    if (result.length === 2) break;
  }
  return result;
}

const itemHighlights: Record<string, string[]> = {
  'eatly-dawn': ['South Indian breakfast culture', 'comfort-first picks'],
  'feed-03':    ['regional picks', 'morning food culture'],
  'feed-04':    ['social dining', 'shared, unhurried'],
  'feed-05':    ['heritage travel interest', 'cultural depth'],
  'feed-06':    ['nature-led signals', 'Himalayas'],
  'feed-21':    ['slow travel instincts', 'Kerala'],
  'feed-22':    ['cafe culture interest', 'Seoul'],
  'feed-25':    ['cricket culture', 'high-energy signals'],
  'feed-47':    ['chai comfort signals', 'rainy day'],

  // ── Cold Start highlights ─────────────────────────────────────────────────
  'cs-balcony-escape':   ['Bangalore balconies', 'monsoon'],
  'cs-gond-art':         ['monsoon-morning fit', 'drop-in studios'],
  'cs-gold-stack':       ['everyday-gold', 'festive jewellery'],
  'cs-monsoon-football': ['Monsoon turf football', 'morning slots'],
  'cs-mysore-bonda':     ['Bangalore monsoon-morning', 'filter coffee'],
  'cs-shivanasamudra':   ['peak roar', 'day-trip window'],
  'cs-vidhana-soudha':   ['wet granite', 'dawn reflections'],
  'cs-sunnys':           ['longest-running breakfast', 'weekday mornings'],
  'cs-pour-over':        ['third-wave coffee capital', 'open early'],
  'cs-therpup':          ['morning slot', 'first-time visitors'],
  'cs-vinyasa-cubbon':   ['cleanest air', 'Cubbon Park'],

  // Warm start highlights
  'ws-india-afg':    ['biggest fixture', 'first ball at 7pm'],
  'ws-nandi-hills':  ['Nandi loop', 'opens tomorrow morning'],
  'ws-om-beach':     ['sunrise yoga session', 'three hours from Goa'],
  'ws-coorg':        ['peak green this fortnight', 'six hours from Bangalore'],
  'ws-amalfi':       ['travel with your partner', 'most-asked-about destination'],
  'ws-wind-down':    ['wind-down', 'easiest routine for two'],
  'ws-vinyl-ritual': ['quietly making a comeback', 'evenings are when it fits'],
  'ws-gehra-hua':    ['most-played track', 'queued the rest of the playlist'],
};

/* ── Profile-level overrides (injected per route, override itemOverrides) ─── */

let profileOverrides: Record<string, string> = {};
let profileHighlights: Record<string, string[]> = {};

export function setProfileOverrides(
  reasoning: Record<string, string>,
  highlights: Record<string, string[]> = {},
): void {
  profileOverrides = reasoning;
  profileHighlights = highlights;
}

/* ── Public API ─────────────────────────────────────────────────────────────── */

export function getReasoning(item: FeedItem): string {
  if (profileOverrides[item.id]) return profileOverrides[item.id];
  if (itemOverrides[item.id]) return itemOverrides[item.id];
  const pool = banks[item.category] || fallback;
  const hash = item.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return pool[hash % pool.length](item);
}

export function getHighlights(item: FeedItem, reasoning?: string): string[] {
  if (profileHighlights[item.id]) return profileHighlights[item.id];
  if (itemHighlights[item.id]) return itemHighlights[item.id];
  return extractHighlights(reasoning ?? getReasoning(item), item);
}
