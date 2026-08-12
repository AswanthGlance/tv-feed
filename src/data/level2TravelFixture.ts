import type { ExperiencePassDef, ProgressiveJourney } from '../types/experiencePass';
import type { ProgressiveItem } from '../types/progressiveValue';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 SHELL / PRESENTATION FIXTURE — NOT REAL PHOENIX DATA.

   A hand-authored ExperiencePass timeline standing in for real Phoenix-
   derived mutations until src/adapters/phoenixToMutations.ts is implemented.
   Every candidate, travel time, rating, evidence line and judgment below is
   illustrative placeholder content for demoing the progressive-value
   interaction model — never present it as a real agent result (see dev
   panel: it's tagged "Level 2 presentation fixture", not "Phoenix Live").

   ONE continuously evolving canvas moving through seven meaningful,
   individually-readable passes. There is no eighth "result" pass — RESOLVE
   is the last one, and Level2Experience.tsx keeps rendering the SAME grid
   afterward (just quieter, with the promoted card's actions revealed)
   instead of swapping to a different component tree. See that file's
   header comment for why that distinction matters.

     DISCOVER  ->  ENRICH  ->  COMPARE  ->  NEGATE  ->  SHORTLIST  ->  PROMOTE  ->  RESOLVE

   Each pass carries exactly ONE narration line (WHAT the agent is doing —
   see AgentNarration) and, on passes where the agent has actually reached a
   new conclusion, ONE delayed insight (WHAT it learned — appears partway
   through the hold, not from the pass's start, so it reads as discovered
   rather than as permanent explanatory copy). Card positions stay stable
   discover→negate; only SHORTLIST (modestly) and PROMOTE (substantially)
   change size. Every pass's `mutations`/`insight.at` are offset from that
   PASS's own start (see src/utils/experiencePassSchedule.ts), not the whole
   timeline, so this file reads as "what happens in this state" rather than
   a wall of absolute millisecond math.
   ───────────────────────────────────────────────────────────────────────────── */

const CANDIDATES: Record<string, ProgressiveItem> = {
  chikmagalur: {
    id: 'chikmagalur',
    type: 'place',
    title: 'Chikmagalur',
    subtitle: 'Coffee estates & hill views',
    image: '/images/feed/feed_40-travel-wildlife-dawn-grassland.jpg',
    state: 'discovered',
  },
  sakleshpur: {
    id: 'sakleshpur',
    type: 'place',
    title: 'Sakleshpur',
    subtitle: 'Quiet green hill town',
    image: '/images/feed/feed_29-travel-goa-coastal-road.jpg',
    state: 'discovered',
  },
  coorg: {
    id: 'coorg',
    type: 'place',
    title: 'Coorg',
    subtitle: 'Coffee hills & misty valleys',
    image: '/images/feed/feed_54-travel-kerala-backwaters-houseboat.jpg',
    state: 'discovered',
  },
  kabini: {
    id: 'kabini',
    type: 'place',
    title: 'Kabini',
    subtitle: 'Riverside forest retreat',
    image: '/images/feed/feed_34-travel-nordic-winter-cabin.jpg',
    state: 'discovered',
  },
};

const PASSES: ExperiencePassDef[] = [
  // ── DISCOVER — bare candidates land, one at a time, then a real hold ──
  {
    id: 'discover',
    stage: 'discover',
    narration: { type: 'search', text: 'Searching the web for nearby weekend escapes' },
    enterDuration: 1000,
    holdDuration: 3000,
    exitDuration: 250,
    mutations: [
      { at: 100, mutation: { type: 'ADD_ITEMS', items: [CANDIDATES.chikmagalur] } },
      { at: 350, mutation: { type: 'ADD_ITEMS', items: [CANDIDATES.sakleshpur] } },
      { at: 600, mutation: { type: 'ADD_ITEMS', items: [CANDIDATES.coorg] } },
      { at: 850, mutation: { type: 'ADD_ITEMS', items: [CANDIDATES.kabini] } },
    ],
  },

  // ── ENRICH — same four cards; travel time lands, then (once it's had a
  // moment to be read on its own) one discovered insight synthesizes it. ──
  {
    id: 'enrich',
    stage: 'enrich',
    narration: { type: 'maps', text: 'Checking Google Maps for drive times' },
    enterDuration: 700,
    holdDuration: 3600,
    exitDuration: 250,
    insight: { at: 2700, text: 'A 4–5 hour drive looks like the sweet spot for a short weekend.' },
    mutations: [
      {
        at: 150,
        mutation: {
          type: 'ENRICH_ITEMS',
          patches: [
            { id: 'chikmagalur', data: { travelTime: '4h 20m' } },
            { id: 'sakleshpur', data: { travelTime: '3h 50m' } },
            { id: 'coorg', data: { travelTime: '5h 10m' } },
            { id: 'kabini', data: { travelTime: '5h 45m' } },
          ],
        },
      },
    ],
  },

  // ── COMPARE — a second evidence layer: rating (fact), evidence (data), judgment (agent read) ──
  {
    id: 'compare',
    stage: 'compare',
    narration: { type: 'compare', text: 'Comparing stays, ratings and experiences' },
    enterDuration: 800,
    holdDuration: 4000,
    exitDuration: 250,
    mutations: [
      {
        at: 250,
        mutation: {
          type: 'ENRICH_ITEMS',
          patches: [
            { id: 'chikmagalur', data: { rating: 4.8 } },
            { id: 'sakleshpur', data: { rating: 4.6 } },
            { id: 'coorg', data: { rating: 4.7 } },
            { id: 'kabini', data: { rating: 4.7 } },
          ],
        },
      },
      {
        at: 250,
        mutation: {
          type: 'ADD_EVIDENCE',
          patches: [
            { id: 'chikmagalur', evidence: ['Coffee estates', 'Cool weather'] },
            { id: 'sakleshpur', evidence: ['Quiet stays', 'Nature trails'] },
            { id: 'coorg', evidence: ['Great resorts', 'Popular destination'] },
            { id: 'kabini', evidence: ['Wildlife', 'Premium stays'] },
          ],
        },
      },
      {
        at: 250,
        mutation: {
          type: 'UPDATE_JUDGMENT',
          patches: [
            { id: 'chikmagalur', judgment: 'GOOD BALANCE' },
            { id: 'sakleshpur', judgment: 'CLOSEST OPTION' },
            { id: 'coorg', judgment: 'LONGER JOURNEY' },
            { id: 'kabini', judgment: 'LONGEST JOURNEY' },
          ],
        },
      },
    ],
  },

  // ── NEGATE — Kabini is visibly set aside, with a reason ON the card, not deleted ──
  {
    id: 'negate',
    stage: 'negate',
    narration: { type: 'filter', text: 'Kabini needs more travel time than this weekend allows' },
    enterDuration: 600,
    holdDuration: 2700,
    exitDuration: 250,
    mutations: [
      {
        at: 200,
        mutation: { type: 'NEGATE_ITEMS', items: [{ id: 'kabini', reason: 'Less ideal for a short weekend' }] },
      },
    ],
  },

  // ── SHORTLIST — two finalists emerge; Coorg recedes (lightly); Kabini stays set aside ──
  {
    id: 'shortlist',
    stage: 'shortlist',
    narration: { type: 'rank', text: 'Narrowing 4 destinations to the strongest 2' },
    enterDuration: 700,
    holdDuration: 3600,
    exitDuration: 250,
    insight: { at: 2700, text: 'Chikmagalur and Sakleshpur balance travel time and experience best.' },
    mutations: [
      { at: 250, mutation: { type: 'SHORTLIST_ITEMS', ids: ['chikmagalur', 'sakleshpur'] } },
      // Coorg recedes too, but lighter-touch than Kabini's negation — a
      // metadata flag rather than the 'negated' state itself, since it
      // wasn't ruled out for a specific reason, just outweighed.
      { at: 250, mutation: { type: 'ENRICH_ITEMS', patches: [{ id: 'coorg', data: { deprioritized: true } }] } },
    ],
  },

  // ── PROMOTE — Chikmagalur becomes the emerging winner; Kabini finally recedes ──
  {
    id: 'promote',
    stage: 'promote',
    narration: { type: 'synthesize', text: 'Chikmagalur is emerging as the strongest fit' },
    enterDuration: 800,
    holdDuration: 3600,
    exitDuration: 350,
    insight: { at: 2900, text: 'Chikmagalur combines a manageable drive with stronger stay options.' },
    mutations: [
      { at: 300, mutation: { type: 'PROMOTE_ITEM', id: 'chikmagalur' } },
      {
        at: 300,
        mutation: { type: 'ENRICH_ITEMS', patches: [{ id: 'chikmagalur', data: { stayOption: 'Boutique coffee-estate stays' } }] },
      },
      {
        at: 300,
        mutation: {
          type: 'ADD_EVIDENCE',
          patches: [{ id: 'chikmagalur', evidence: ['Cool weather', 'Coffee estates', 'Manageable drive'] }],
        },
      },
      {
        at: 300,
        mutation: { type: 'UPDATE_JUDGMENT', patches: [{ id: 'chikmagalur', judgment: 'BEST OVERALL WEEKEND FIT' }] },
      },
      // Alternatives recede — Kabini (already set aside two passes ago) is
      // the one that actually leaves the canvas now.
      { at: 600, mutation: { type: 'REMOVE_ITEMS', ids: ['kabini'] } },
    ],
  },

  // ── RESOLVE — the crystallization pass. No further item mutations; the
  // promoted card IS the answer already, this just marks the moment the
  // agent's work turns into a resolved one. Level2Experience.tsx handles
  // the actual "motion stops, actions reveal" behavior once this pass (and
  // the phase machine's short settle beat after it) completes — never by
  // swapping to a different component tree.
  {
    id: 'resolve',
    stage: 'resolve',
    narration: { type: 'resolve', text: 'Building your weekend around Chikmagalur' },
    enterDuration: 700,
    holdDuration: 2200,
    exitDuration: 400,
    mutations: [{ at: 0, mutation: { type: 'RESOLVE_RESULT' } }],
  },
];

export const LEVEL2_TRAVEL_JOURNEY: ProgressiveJourney = {
  query: 'Plan a relaxing weekend escape near Bangalore',
  passes: PASSES,
};
