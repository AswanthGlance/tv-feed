/**
 * warmCardSignalData.ts — per-card signal + reasoning data for warm_profile_1.
 *
 * Each entry defines the two signals and reasoning block for one feed item.
 * All 8 warm-start cards follow the Card 1 template structure.
 *
 * Signal rules (from WARM_START_REASONING_TEMPLATE.md):
 *   - Exactly 2 signals per card
 *   - One thought per signal, one line
 *   - Written as agent memory / observation ("You picked…", "You've been…")
 *   - Each signal has 1–2 highlight phrases (purple glow)
 *
 * Reasoning rules:
 *   - 2–3 sentences max
 *   - Answers "why am I showing this now"
 *   - First-person agent voice
 *   - 1–2 highlighted phrases
 */

export type WarmCardSignalEntry = {
  signal1:      string;
  signal1Hls:   string[];
  signal2:      string;
  signal2Hls:   string[];
  reasoning:    string;
  reasoningHls: string[];
};

export const WARM_CARD_SIGNAL_DATA: Record<string, WarmCardSignalEntry> = {

  // Card 1 — Sports · Live tonight (Doc: Card 1)
  'ws-india-afg': {
    signal1:      "You've liked 12 IPL-themed cards across April and May.",
    signal1Hls:   ['12 IPL-themed cards'],
    signal2:      "In March we chatted about your T20 fantasy build.",
    signal2Hls:   ['T20 fantasy build'],
    reasoning:    "India vs Afghanistan is at the Chinnaswamy tonight, first ball at 7pm.\nLast group-stage fixture before the knockouts.\nI'll set your reminder and surface a fantasy XI 30 minutes before lock.",
    reasoningHls: ['Chinnaswamy tonight', 'first ball at 7pm'],
  },

  // Card 2 — Sports · Local (Doc: Card 2)
  'ws-nandi-hills': {
    signal1:      "Three weeks back, you chatted about your first triathlon.",
    signal1Hls:   ['first triathlon'],
    signal2:      "The Garmin 265 and Lazer helmet are on your list.",
    signal2Hls:   ['Garmin 265', 'Lazer helmet'],
    reasoning:    "The Hebbal group rolls out for the Nandi loop at 4:30am Sunday.\n60km round-trip, ascent at sunrise, back by 9.\nI'll map your route and add you to their WhatsApp on your nod.",
    reasoningHls: ['Nandi loop at 4:30am Sunday', 'ascent at sunrise'],
  },

  // Card 3 — Wellness · Travel (Doc: Card 5)
  'ws-om-beach': {
    signal1:      "In February, you asked me for a non-touristy Goa weekend.",
    signal1Hls:   ['non-touristy Goa weekend'],
    signal2:      "Vihangama Cafe is bookmarked.",
    signal2Hls:   ['Vihangama Cafe'],
    reasoning:    "Gokarna sits 8 hours by road or a 1-hour fly-and-drive via Hubli.\nOm Beach at 6am is what you actually wanted in February.\nI'll plan the weekend: SwaSwara overnight, sunrise yoga, Vihangama on the way back.",
    reasoningHls: ['Om Beach at 6am', 'SwaSwara overnight'],
  },

  // Card 4 — Travel · Weekend (Doc: Card 6)
  'ws-coorg': {
    signal1:      "Ama Plantation has been on your wishlist since February.",
    signal1Hls:   ['Ama Plantation', 'February'],
    signal2:      "You asked me twice about Indian single-origins.",
    signal2Hls:   ['Indian single-origins'],
    reasoning:    "Attikan won the Indian Coffee Board's specialty cup last season\nand runs estate stays through monsoon. Six hours from Bangalore, peak green this fortnight.\nI'll shortlist three for you: Ama, Attikan, and one more, two nights each.",
    reasoningHls: ['Attikan', 'peak green this fortnight'],
  },

  // Card 5 — Travel · Aspirational (Doc: Card 7)
  'ws-amalfi': {
    signal1:      "We've been chatting Amalfi vs. the Greek Islands for late September.",
    signal1Hls:   ['Amalfi vs. the Greek Islands', 'late September'],
    signal2:      "You've liked Aman and Belmond cards.",
    signal2Hls:   ['Aman and Belmond'],
    reasoning:    "September is shoulder season for the Coast. Water still warm, crowds thinned.\nLe Sirenuse in Positano has a six-night September window open right now.\nI'll save it to your travel board for the longer trip with your partner.",
    reasoningHls: ['Le Sirenuse in Positano', 'six-night September window'],
  },

  // Card 6 — Wellness · Routine (Doc: Card 8)
  'ws-wind-down': {
    signal1:      "Two weeks back, you chatted about late screen time and your sleep.",
    signal1Hls:   ['late screen time', 'sleep'],
    signal2:      "Last week, you asked about magnesium glycinate.",
    signal2Hls:   ['magnesium glycinate'],
    reasoning:    "Sleep keeps coming up across our chats and it's the easiest place to start.\nI've put together a 30-minute wind-down: lights down at 10:15, a yoga nidra track, screens off at 10:45.\nWant me to cue it for tonight?",
    reasoningHls: ['30-minute wind-down', 'yoga nidra track'],
  },

  // Card 7 — Music · Format (Doc: Card 9)
  'ws-vinyl-ritual': {
    signal1:      "Two months back, you asked me how to play your father's 50-year-old records.",
    signal1Hls:   ["father's 50-year-old records"],
    signal2:      "The Pro-Ject turntable is on your list.",
    signal2Hls:   ['Pro-Ject turntable'],
    reasoning:    "The Local in Indiranagar runs a Hindi film soundtracks night this Saturday.\nI'd have you start there before you commit to the turntable.\nHear the Aandhi reissue and the Rafi pressing on their setup first.",
    reasoningHls: ['Hindi film soundtracks night this Saturday', 'Aandhi reissue'],
  },

  // Card 8 — Music · Trending (Doc: Card 10)
  'ws-gehra-hua': {
    signal1:      "You've liked 3 Peter Cat cards and bookmarked The Local.",
    signal1Hls:   ['Peter Cat', 'The Local'],
    signal2:      "Aswekeepsearching and Tejas run through everything you've been saving.",
    signal2Hls:   ['Aswekeepsearching', 'Tejas'],
    reasoning:    "Gehra Hua is the most-played Hindi track in the country this week.\nAnuv Jain at the front, Bombay-indie production behind.\nI've built you a 14-track playlist: Gehra Hua, three Peter Cat picks, Aswekeepsearching, Tejas, and the rest of the week's chart.",
    reasoningHls: ['most-played Hindi track', '14-track playlist'],
  },

};
