import type { Level2Scenario } from '../types/scenario';
import type { MemoryContext, MemorySignal } from '../types/memory';
import { buildMemoryContextPass, memoryFollowUpNarration } from '../userValue/memoryContextPlan';
import { e, rankingScenario, listScenario } from './fixtures';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Memory Retrieval (Dev Mode dedicated scenario).

   ROLE 2 from the task brief: a scenario the demo can deliberately select to
   show the memory step, distinct from ROLE 1 (the same step appearing
   automatically as pass 0 of any real trace that has a relevant hit — see
   userValue/memoryContextPlan.ts, wired into every real archetype by
   scenarios/fromTrace.ts).

   WHY FIXTURES, NOT REAL TRACES: MEMORY_RETRIEVAL_TRACE_FINDINGS.md surveyed
   613 real traces. `memory.hit: true` occurred on 5 of them, all the same
   user, all carrying the exact same single fact ("User is located in
   Bengaluru, Karnataka") — real, but not the multi-signal, multi-domain
   demonstration this scenario exists to show, and there is no persisted real
   trace id from that survey to build a live/cached entry from. Per the task
   brief ("fixtures must clearly be marked as fixtures" / "do not fabricate
   real memories"), every entry here is `source: 'fixture'` — never presented
   as Phoenix output — and the registry (see registry.ts) never tries a real
   trace for this pool. `fx-memory-location` mirrors the one signal shape
   actually observed in the real corpus (a location fact) precisely so the
   demo includes an example grounded in real evidence, without pretending it
   IS that trace.

   Each entry is built the same way a real trace is: a normal archetype
   fixture (candidate_ranking / list, via the SAME `rankingScenario` /
   `listScenario` helpers fixtures.ts uses) with the SAME `buildMemoryContextPass`
   prepended and the SAME `memoryFollowUpNarration` override on the pass right
   after it (see fromTrace.ts, which does this identically for real traces) —
   so this pool can never drift from how memory actually renders elsewhere.
   ───────────────────────────────────────────────────────────────────────────── */

function memoryHit(signals: MemorySignal[]): MemoryContext {
  return {
    available: true,
    sourceSpanIds: [],
    relevantSignals: signals,
    diagnostics: {
      spanFound: true,
      hit: true,
      totalSignalsFound: signals.length,
      relevantSignalCount: signals.length,
      rendered: true,
    },
  };
}

/** Prepends the memory pass and re-narrates the pass right after it, exactly
 *  as fromTrace.ts does for a real trace — see that file for why only the
 *  narration of the following pass changes and nothing else about it does. */
function withMemory(base: Level2Scenario, signals: MemorySignal[]): Level2Scenario {
  const context = memoryHit(signals);
  const memoryPass = buildMemoryContextPass(context, base.domain, Math.random)!;
  const [next, ...rest] = base.thinkingPasses;
  const thinkingPasses = next
    ? [memoryPass, { ...next, narration: memoryFollowUpNarration(base.domain, Math.random) }, ...rest]
    : [memoryPass, ...base.thinkingPasses];

  return {
    ...base,
    id: `mem-${base.id}`,
    thinkingPasses,
    metadata: { ...(base.metadata ?? {}), memory: context.diagnostics },
  };
}

/* ── Travel — quiet, nearby, nature-forward stays ────────────────────────── */

const TRAVEL_STAYS = [
  e('mt-1', 'Doddamakali River Camp', { type: 'hotel', location: 'Kanakapura, ~90 min drive', rating: 4.6, reviewCount: 640, price: '₹4,200 per person', availability: 'Weekend slots open', judgment: 'Top Pick', reasoning: 'Riverside, tent-only, and the shortest drive of the four that still feels away from the city.' }),
  e('mt-2', 'Kadu Jungle Camp', { type: 'hotel', location: 'Bannerghatta, ~60 min drive', rating: 4.4, reviewCount: 410, price: '₹3,800 per person', availability: 'Open' }),
  e('mt-3', 'Bheemeshwari Nature Camp', { type: 'hotel', location: 'Cauvery basin, ~2 hr drive', rating: 4.5, reviewCount: 980, price: '₹5,500 per person', availability: 'Reservation only' }),
  e('mt-4', 'The Windflower Prakruthi', { type: 'hotel', location: 'Sakleshpur, ~3.5 hr drive', rating: 4.7, reviewCount: 1240, price: '₹7,900 for two', availability: 'Open' }),
];

const TRAVEL = withMemory(
  rankingScenario(
    'fx-memory-travel-escape',
    'travel',
    'Plan a relaxing weekend escape near Bangalore',
    TRAVEL_STAYS,
    'mt-1',
    [
      { label: 'Google Maps', kind: 'maps' },
      { label: 'Thrillophilia', kind: 'web' },
      { label: 'Venue site', kind: 'web' },
    ],
    7,
    2,
    {
      kind: 'entity_rail',
      headline: 'Doddamakali River Camp fits what you usually look for',
      entities: TRAVEL_STAYS,
      winnerId: 'mt-1',
      winnerRationale: 'Quietest of the four, shortest drive, and nature-forward without being a resort.',
      followUps: ['Show me something further out', 'Check weekend availability', 'Find one with a pool'],
    }
  ),
  [
    { type: 'preference', label: 'Quiet stays' },
    { type: 'preference', label: 'Shorter drives' },
    { type: 'preference', label: 'Nature + boutique stays' },
  ]
);

/* ── Restaurant — vegetarian-friendly, nearby ────────────────────────────── */

const DINING = [
  e('md-1', 'Mavalli Tiffin Room (MTR)', { type: 'restaurant', location: 'Lalbagh Road, 2.1 km away', rating: 4.5, reviewCount: 8200, price: '₹500 for two', availability: 'Open till 9:30pm', judgment: 'Top Pick', reasoning: 'Fully vegetarian, closest of the shortlist, and rarely needs a wait outside peak hours.' }),
  e('md-2', 'Carrots — Pure Veg', { type: 'restaurant', location: 'Residency Road, 3.4 km away', rating: 4.3, reviewCount: 1100, price: '₹900 for two', availability: 'Open till 11pm' }),
  e('md-3', 'Vasudev Adigas', { type: 'restaurant', location: 'Multiple nearby outlets', rating: 4.1, reviewCount: 3400, price: '₹350 for two', availability: 'Open till 10pm' }),
];

const RESTAURANT = withMemory(
  rankingScenario(
    'fx-memory-dinner-tonight',
    'food',
    'Find somewhere good for dinner tonight',
    DINING,
    'md-1',
    [
      { label: 'Google Maps', kind: 'maps' },
      { label: 'Zomato', kind: 'web' },
    ],
    5,
    2,
    {
      kind: 'entity_rail',
      headline: 'MTR is the closest fully-vegetarian option tonight',
      entities: DINING,
      winnerId: 'md-1',
      winnerRationale: 'Vegetarian, nearby, and open through dinner service.',
      followUps: ['Show me something further', 'Any place with outdoor seating', 'Book a table'],
    }
  ),
  [
    { type: 'preference', label: 'Vegetarian-friendly' },
    { type: 'preference', label: 'Nearby' },
  ]
);

/* ── Shopping — movie-night TV, usual budget band ────────────────────────── */

const TVS = [
  e('ms-1', 'Sony Bravia X75L 55"', { type: 'product', subtitle: 'Sony', price: '₹52,990', rating: 4.4, judgment: 'Top Pick', reasoning: 'Strongest motion handling in your usual price band, which matters most for movie nights.' }),
  e('ms-2', 'Samsung QLED Q60 55"', { type: 'product', subtitle: 'Samsung', price: '₹58,999', rating: 4.3 }),
  e('ms-3', 'TCL C655 Pro 55"', { type: 'product', subtitle: 'TCL', price: '₹44,990', rating: 4.1 }),
];

const SHOPPING = withMemory(
  rankingScenario(
    'fx-memory-tv-movie-nights',
    'shopping',
    'Find me a TV for movie nights',
    TVS,
    'ms-1',
    [
      { label: 'Amazon', kind: 'web' },
      { label: 'Flipkart', kind: 'web' },
      { label: 'RTINGS', kind: 'web' },
    ],
    8,
    2,
    {
      kind: 'entity_rail',
      headline: 'The Bravia X75L is the strongest fit for movie nights',
      entities: TVS,
      winnerId: 'ms-1',
      winnerRationale: 'Best motion and contrast for film in your usual ₹40–60k range.',
      followUps: ['Show me something bigger', 'Compare Sony and Samsung', 'Anything with better speakers'],
    }
  ),
  [
    { type: 'preference', label: 'Great for movie nights' },
    { type: 'preference', label: 'Usually stays around ₹40–60k' },
  ]
);

/* ── Entertainment — thrillers, character-driven, ~2hr — a SET, no winner ── */

const WATCH_LIST = [
  e('me-1', 'Andhadhun', { type: 'media', subtitle: '2018 · Thriller', attributes: { runtime: '139 min' } }),
  e('me-2', 'Drishyam', { type: 'media', subtitle: '2013 · Thriller', attributes: { runtime: '160 min' } }),
  e('me-3', 'Kahaani', { type: 'media', subtitle: '2012 · Thriller', attributes: { runtime: '122 min' } }),
  e('me-4', 'Talvar', { type: 'media', subtitle: '2015 · Thriller', attributes: { runtime: '132 min' } }),
];

const ENTERTAINMENT = withMemory(
  listScenario(
    'fx-memory-watch-tonight',
    'entertainment',
    'Find something to watch tonight',
    WATCH_LIST,
    [{ label: 'JustWatch', kind: 'web' }],
    3,
    1,
    {
      kind: 'list',
      headline: '4 character-driven thrillers, all close to two hours',
      items: [
        e('me-1', 'Andhadhun', { type: 'media', subtitle: '2018 · Thriller · 139 min', reasoning: 'Twist-driven and tightly plotted, the closest match to what you usually go for.' }),
        e('me-2', 'Drishyam', { type: 'media', subtitle: '2013 · Thriller · 160 min', reasoning: 'Slower burn, longest of the four, but consistently mentioned alongside Andhadhun.' }),
        e('me-3', 'Kahaani', { type: 'media', subtitle: '2012 · Thriller · 122 min', reasoning: 'Shortest runtime here, still a strong character lead.' }),
        e('me-4', 'Talvar', { type: 'media', subtitle: '2015 · Thriller · 132 min', reasoning: 'More procedural, based on a real case.' }),
      ],
      followUps: ['Something lighter instead', 'Just the shortest one', 'Anything newer'],
    }
  ),
  [
    { type: 'preference', label: 'Thrillers' },
    { type: 'preference', label: 'Character-driven' },
    { type: 'preference', label: '90–120 min' },
  ]
);

/* ── Travel / family — short-drive, nature, family-friendly — a SET ─────── */

const FAMILY_SPOTS = [
  e('mf-1', 'Bannerghatta Nature Camp', { type: 'destination', location: '~60 min drive' }),
  e('mf-2', 'Savandurga Base Camp', { type: 'destination', location: '~75 min drive' }),
  e('mf-3', 'Hesaraghatta Lake Farmstay', { type: 'destination', location: '~50 min drive' }),
];

const FAMILY_TRIP = withMemory(
  listScenario(
    'fx-memory-weekend-family',
    'travel',
    'Suggest a weekend trip',
    FAMILY_SPOTS,
    [{ label: 'Google Maps', kind: 'maps' }],
    3,
    1,
    {
      kind: 'list',
      headline: '3 short, family-friendly weekend spots',
      items: [
        e('mf-1', 'Bannerghatta Nature Camp', { location: '~60 min drive', subtitle: 'Trails and a supervised kids’ zone', reasoning: 'Closest, and set up for families rather than an adults-only trek.' }),
        e('mf-2', 'Savandurga Base Camp', { location: '~75 min drive', subtitle: 'Easy walking trail, open ground for kids' }),
        e('mf-3', 'Hesaraghatta Lake Farmstay', { location: '~50 min drive', subtitle: 'Farm animals, lake walk, easiest for young kids' }),
      ],
      followUps: ['Which has the shortest walk', 'Anything with a pool', 'Book Hesaraghatta'],
    }
  ),
  [
    { type: 'preference', label: 'Family-friendly' },
    { type: 'preference', label: 'Short drive' },
    { type: 'preference', label: 'Nature' },
  ]
);

/* ── A location fact — the one signal shape actually observed in the real
   corpus (see MEMORY_RETRIEVAL_TRACE_FINDINGS.md #5). Content-shape matches
   the real finding; the scenario around it is still a fixture, and is
   labelled as one everywhere the app shows source. ─────────────────────── */

const NEARBY_COFFEE = [
  e('ml-1', 'Third Wave Coffee', { type: 'restaurant', location: 'Indiranagar, Bengaluru', rating: 4.3, judgment: 'Top Pick', reasoning: 'Closest well-rated option to where you usually are.' }),
  e('ml-2', 'Blue Tokai Coffee Roasters', { type: 'restaurant', location: 'Indiranagar, Bengaluru', rating: 4.4 }),
  e('ml-3', 'Kapi Time', { type: 'restaurant', location: 'Indiranagar, Bengaluru', rating: 4.1 }),
];

const LOCATION = withMemory(
  rankingScenario(
    'fx-memory-location-coffee',
    'food',
    'Find good coffee spots near me',
    NEARBY_COFFEE,
    'ml-1',
    [{ label: 'Google Maps', kind: 'maps' }],
    3,
    1,
    {
      kind: 'entity_rail',
      headline: 'Third Wave Coffee is the closest strong option',
      entities: NEARBY_COFFEE,
      winnerId: 'ml-1',
      followUps: ['Show me quieter spots', 'Anything with outdoor seating', 'Find one open right now'],
    }
  ),
  [{ type: 'location', label: 'Bengaluru, Karnataka' }]
);

export const MEMORY_RETRIEVAL_SCENARIOS: Level2Scenario[] = [
  TRAVEL,
  RESTAURANT,
  SHOPPING,
  ENTERTAINMENT,
  FAMILY_TRIP,
  LOCATION,
];
