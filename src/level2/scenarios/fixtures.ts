import type { Level2Scenario } from '../types/scenario';
import type { NormalizedEntity } from '../types/entity';
import type { ThinkingPass, ThinkingPayload, ThinkingValueType } from '../types/pass';
import type { FinalResponseModel } from '../types/finalResponse';
import type { ScenarioArchetype } from '../types/archetype';
import { toProgressiveItem } from '../normalization/entityBridge';
import { buildCandidateRankingPasses } from '../userValue/candidateRankingPlan';
import { buildListPasses } from '../userValue/listPlan';
import { extractQueryRequirements } from '../classification/queryRequirements';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Fixture scenarios.

   EVERY SCENARIO HERE IS `source: 'fixture'` AND IS NEVER PRESENTED AS PHOENIX
   OUTPUT. The dev panel always shows the source; the fixture tag is never
   suppressed to make a demo look more real than it is.

   Why fixtures exist even though all nine archetypes have real corpus
   coverage: several pools are thin (route_map has 5 real traces, summary 7,
   single_entity 10 — see PHOENIX_SCENARIO_ARCHETYPES.md), so Refresh inside
   those archetypes would repeat almost immediately, and a demo must not
   depend on Phoenix being reachable at all. Fixtures guarantee that picking
   any archetype and pressing Refresh always works.

   These are DATA. No JSX, no styling, no component references — same contract
   as a Phoenix-derived scenario, so a renderer cannot tell them apart and the
   two paths can never drift.

   Content principle, mirroring the real pipeline: thinking is lighter than the
   final response. Passes carry partial context and counts; the final response
   carries the complete, actionable answer. No pass here previews the finished
   result.
   ───────────────────────────────────────────────────────────────────────────── */

const STATUS = { enterDuration: 500, holdDuration: 1500, exitDuration: 250 };
const VALUE = { enterDuration: 750, holdDuration: 2700, exitDuration: 300 };

/** Status pass — narration only, no payload. */
function s(id: string, narration: string): ThinkingPass {
  return { id, visibility: 'status', narration, ...STATUS };
}

/** Value pass — narration plus a typed payload. */
function v(id: string, narration: string, valueType: ThinkingValueType, payload: ThinkingPayload): ThinkingPass {
  return { id, visibility: 'canvas_value', narration, valueType, payload, ...VALUE };
}

/** Entity builder. `image` is deliberately omitted on every place-like fixture
 *  — that is the real corpus condition (see PHOENIX_SCENARIO_ARCHETYPES.md),
 *  and the renderers must be correct without one.
 *
 *  Exported (along with `scenario`, `rankingScenario`, `listScenario` below)
 *  so the dedicated Memory Retrieval Dev Mode pool (see
 *  scenarios/memoryRetrievalScenarios.ts) can build fixtures the same way
 *  this file does, rather than growing a second authoring convention. */
export function e(id: string, title: string, rest: Partial<NormalizedEntity> = {}): NormalizedEntity {
  return { id, type: 'generic', title, ...rest };
}

/** A discovery pass that also seeds the candidate canvas. */
function discovered(id: string, narration: string, entities: NormalizedEntity[]): ThinkingPass {
  return v(id, narration, 'entity_preview', {
    entities,
    canvas: [{ type: 'ADD_ITEMS', items: entities.map((x) => toProgressiveItem(x)) }],
  });
}

export function scenario(
  id: string,
  archetype: ScenarioArchetype,
  domain: string,
  prompt: string,
  thinkingPasses: ThinkingPass[],
  finalResponse: FinalResponseModel
): Level2Scenario {
  return { id, archetype, domain, prompt, source: 'fixture', thinkingPasses, finalResponse };
}

/* ── text_only ───────────────────────────────────────────────────────────── */

const TEXT_ONLY: Level2Scenario[] = [
  scenario(
    'fx-text-offside',
    'text_only',
    'sports',
    'Explain the offside rule in football like I have never watched a match.',
    [
      s('t1-a', 'Working out what you actually need'),
      v('t1-b', 'Checking how the rule is written today', 'text', {
        lines: ['The rule changed in 1990 and again in 2005', 'Position alone is not an offence'],
      }),
      s('t1-c', 'Putting it in plain language'),
    ],
    {
      kind: 'text',
      headline: 'Offside is about where you are the moment the ball is played — not where you end up',
      body: [
        'You are offside if, at the instant a teammate passes the ball, you are closer to the opponents’ goal line than both the ball and the second-last defender.',
        'Being in that position is not itself an offence. It only becomes one when you get involved — receiving the ball, blocking a defender, or interfering with the goalkeeper.',
        'You cannot be offside from a throw-in, a corner, or a goal kick, or in your own half.',
      ],
      followUps: ['Show me a famous offside decision', 'What is VAR checking exactly', 'Explain the advantage rule'],
    }
  ),
  scenario(
    'fx-text-sourdough',
    'text_only',
    'food',
    'Why does my sourdough come out dense every time?',
    [
      s('t2-a', 'Narrowing down what usually causes this'),
      v('t2-b', 'The three things that explain most dense loaves', 'text', {
        lines: ['Under-fermented dough', 'A weak or young starter', 'Not enough tension when shaping'],
      }),
    ],
    {
      kind: 'text',
      headline: 'Almost always under-fermentation, not your oven',
      body: [
        'A dense crumb usually means the bulk ferment ended too early. The dough should grow by roughly 50–75% and feel airy and jiggly, not just bigger.',
        'A starter that has not doubled reliably within 4–6 hours at room temperature will not have the strength to raise a loaf, whatever else you do right.',
        'If both of those are healthy, look at shaping: without surface tension the loaf spreads outward instead of upward.',
      ],
      followUps: ['How do I tell when bulk is done', 'Fix my starter schedule', 'Show me a shaping technique'],
    }
  ),
  scenario(
    'fx-text-visa',
    'text_only',
    'travel',
    'Do I need a visa for Japan on an Indian passport?',
    [s('t3-a', 'Checking the current entry rules'), v('t3-b', 'What applies right now', 'text', { lines: ['Visa required for Indian passport holders', 'e-Visa available for tourism'] })],
    {
      kind: 'text',
      headline: 'Yes — but tourism now goes through the e-Visa, not the consulate',
      body: [
        'Indian passport holders need a visa for Japan. For short tourist stays you can apply online for an e-Visa instead of visiting a consulate in person.',
        'You will need a passport valid for the length of your stay, a confirmed itinerary, and proof of funds. Processing typically runs about five working days.',
      ],
      followUps: ['What documents exactly', 'How early should I apply', 'Best time to visit Japan'],
    }
  ),
];

/* ── candidate_ranking ─────────────────────────────────────────────────────
   The reference archetype. Its fixtures do NOT hand-author a pass list: they
   declare the candidates, the winner and the sources, then run the SAME
   `buildCandidateRankingPasses` arc the real Phoenix path runs. One arc
   definition, so the fixture path cannot drift from the live one — if the arc
   changes, both change together, and a bug can never hide in the fixture.

   `sourceEvidence` is authored here because a fixture has no event stream.
   These are clearly-labelled fixtures everywhere they appear; they are never
   presented as Phoenix output. ──────────────────────────────────────────── */

export function rankingScenario(
  id: string,
  domain: string,
  prompt: string,
  entities: NormalizedEntity[],
  winnerId: string,
  sources: Array<{ label: string; kind: 'web' | 'maps' }>,
  sourceCount: number,
  searchCount: number,
  finalResponse: FinalResponseModel
): Level2Scenario {
  return {
    id,
    archetype: 'candidate_ranking',
    domain,
    prompt,
    source: 'fixture',
    thinkingPasses: buildCandidateRankingPasses({
      events: [],
      entities,
      requirements: extractQueryRequirements(prompt),
      winnerId,
      sourceEvidence: { sources, sourceCount, searchCount },
      // Wording variety (see narrationVariety.ts) — picked once, when this
      // module loads, same as every other fixture scenario built here.
      rng: Math.random,
    }),
    finalResponse,
  };
}

const RANK_A = [
  e('r1-1', 'The Permit Room', { rating: 4.6, reviewCount: 1840, price: '₹1,400 for two', location: 'Koramangala', availability: 'Open till 1am', reasoning: 'Consistently the strongest cocktail programme of the four, and the only one taking walk-ins after 9pm.', judgment: 'Top Pick' }),
  e('r1-2', 'Soka', { rating: 4.5, reviewCount: 920, price: '₹1,800 for two', location: 'Indiranagar', availability: 'Reservation only' }),
  e('r1-3', 'Bar Spirit Forward', { rating: 4.4, reviewCount: 610, price: '₹1,600 for two', location: 'Domlur', availability: 'Open till 12am' }),
  e('r1-4', 'Copitas', { rating: 4.3, reviewCount: 430, price: '₹2,600 for two', location: 'Bellandur', availability: 'Open till 11pm' }),
  e('r1-5', 'Bootlegger', { rating: 4.1, reviewCount: 380, price: '₹1,500 for two', location: 'Church Street', availability: 'Open till 12am' }),
];

const RANK_B = [
  e('r2-2', 'Kuari Pass', { rating: 4.8, reviewCount: 3500, price: '₹9,500', availability: 'Dec–Mar', judgment: 'Top Pick', reasoning: 'Highest rated of the five, gentlest gradient, and the widest safe season window.' }),
  e('r2-1', 'Hampta Pass', { rating: 4.7, reviewCount: 2100, price: '₹8,900', availability: 'Jun–Sep', reasoning: 'Crosses from green Kullu valleys into the Lahaul desert in a single day.' }),
  e('r2-3', 'Brahmatal', { rating: 4.6, reviewCount: 1400, price: '₹8,200', availability: 'Dec–Feb' }),
  e('r2-4', 'Dayara Bugyal', { rating: 4.5, reviewCount: 980, price: '₹7,800', availability: 'Dec–Apr' }),
  e('r2-5', 'Kedarkantha', { rating: 4.4, reviewCount: 5200, price: '₹7,500', availability: 'Dec–Apr' }),
];

const RANK_C = [
  e('r3-1', 'Sparx Red Kicks', { type: 'product', price: '₹1,299', subtitle: 'Sparx', rating: 4.3, judgment: 'Best value', reasoning: 'Half the price of the next option with the same everyday-wear rating.' }),
  e('r3-2', 'Red Tape Classic', { type: 'product', price: '₹2,499', subtitle: 'Red Tape', rating: 4.4 }),
  e('r3-3', 'Lotto Hoop Star', { type: 'product', price: '₹1,899', subtitle: 'Lotto', rating: 4.1 }),
  e('r3-4', 'Red Tape Colourblocked', { type: 'product', price: '₹2,799', subtitle: 'Red Tape', rating: 4.2 }),
];

const CANDIDATE_RANKING: Level2Scenario[] = [
  rankingScenario(
    'fx-rank-cocktails',
    'food',
    'Find the best cocktail bars near me for tonight. Include locality, ratings, price for two, and opening timings.',
    RANK_A,
    'r1-1',
    [
      { label: 'Google Maps', kind: 'maps' },
      { label: 'Zomato', kind: 'web' },
      { label: 'EazyDiner', kind: 'web' },
      { label: 'Condé Nast Traveller', kind: 'web' },
      { label: 'Venue site', kind: 'web' },
    ],
    12,
    4,
    {
      kind: 'entity_rail',
      headline: 'The Permit Room looks like your best fit',
      entities: RANK_A,
      winnerId: 'r1-1',
      winnerRationale: 'Best-rated of the five, takes walk-ins past 11pm, and mid-range on price.',
      followUps: ['Book a table', 'Show me something quieter', 'What is nearby for food'],
    }
  ),
  rankingScenario(
    'fx-rank-treks',
    'travel',
    'Find the best beginner-friendly Himalayan treks. Include ratings, price per person and the best season.',
    RANK_B,
    'r2-2',
    [
      { label: 'Thrillophilia', kind: 'web' },
      { label: 'Indiahikes', kind: 'web' },
      { label: 'TripAdvisor', kind: 'web' },
      { label: 'Google Maps', kind: 'maps' },
    ],
    9,
    3,
    {
      kind: 'entity_rail',
      headline: 'Kuari Pass is the one to start with',
      entities: RANK_B,
      winnerId: 'r2-2',
      winnerRationale: 'Highest rated, gentlest gradient, longest usable season.',
      followUps: ['What gear do I need', 'Compare Kuari and Hampta', 'Find guided operators'],
    }
  ),
  rankingScenario(
    'fx-rank-sneakers',
    'shopping',
    'Show me the best red sneakers under ₹3000. Include price and ratings.',
    RANK_C,
    'r3-1',
    [
      { label: 'Myntra', kind: 'web' },
      { label: 'Ajio', kind: 'web' },
      { label: 'Venue site', kind: 'web' },
    ],
    6,
    2,
    {
      kind: 'entity_rail',
      headline: 'Sparx Red Kicks is the value pick',
      entities: RANK_C,
      winnerId: 'r3-1',
      followUps: ['Show me white sneakers', 'Find matching jeans', 'What is trending now'],
    }
  ),
];

/* ── single_entity ───────────────────────────────────────────────────────── */

const SINGLE_ENTITY: Level2Scenario[] = [
  scenario(
    'fx-single-toit',
    'single_entity',
    'food',
    'Tell me everything about Toit in Indiranagar — is it worth going tonight?',
    [
      s('e1-a', 'Pulling together what is known about it'),
      v('e1-b', 'Checking tonight specifically', 'availability', {
        summary: 'Open, but a wait after 8pm',
        slots: [
          { label: 'Now – 8pm', state: 'open', detail: 'Walk-in seating' },
          { label: '8pm – 10pm', state: 'limited', detail: '40–60 min wait' },
          { label: 'After 10pm', state: 'open' },
        ],
      }),
      v('e1-c', 'What people consistently mention', 'text', { lines: ['Toit Weiss and Basmati Blonde', 'Rooftop is quieter than the ground floor', 'No reservations'] }),
    ],
    {
      kind: 'entity',
      headline: 'Worth going — just get there before 8pm',
      entity: e('e1-1', 'Toit', { rating: 4.5, reviewCount: 21400, price: '₹1,600 for two', location: 'Indiranagar, Bengaluru', reasoning: 'Bengaluru’s most consistently rated brewpub, and the rooftop stays manageable even on weekends.' }),
      facts: [
        { label: 'Rating', value: '4.5 · 21,400 reviews' },
        { label: 'Price', value: '₹1,600 for two' },
        { label: 'Where', value: 'Indiranagar, Bengaluru' },
        { label: 'Hours', value: 'Open 12pm – 1am' },
        { label: 'Booking', value: 'Walk-in only, no reservations' },
      ],
      actions: [{ label: 'Directions', intent: 'directions' }, { label: 'Call', intent: 'call' }],
      followUps: ['Something similar but quieter', 'What should I order', 'Places nearby after'],
    }
  ),
  scenario(
    'fx-single-hawa',
    'single_entity',
    'travel',
    'Is Hawa Mahal worth visiting, and when should I go?',
    [s('e2-a', 'Checking opening times and crowd patterns'), v('e2-b', 'Early morning is materially different', 'count', { value: 9, label: 'am is the quietest hour', qualifier: 'before tour groups arrive' })],
    {
      kind: 'entity',
      headline: 'Go at opening — the facade faces east and the crowds arrive at 10',
      entity: e('e2-1', 'Hawa Mahal', { rating: 4.4, reviewCount: 68000, price: '₹50 for Indian nationals', location: 'Badi Choupad, Jaipur' }),
      facts: [
        { label: 'Rating', value: '4.4 · 68,000 reviews' },
        { label: 'Entry', value: '₹50 Indian / ₹200 foreign nationals' },
        { label: 'Hours', value: '9am – 4:30pm' },
        { label: 'Best time', value: '9am – 10am, before tour groups' },
        { label: 'Time needed', value: '45 minutes' },
      ],
      followUps: ['What else is nearby', 'Book a guide', 'Best rooftop for photos'],
    }
  ),
  scenario(
    'fx-single-lens',
    'single_entity',
    'shopping',
    'Is the 35mm f1.8 worth it as my first prime lens?',
    [s('e3-a', 'Comparing it against what you already own'), v('e3-b', 'What it changes in practice', 'text', { lines: ['Roughly 2 stops faster than a kit zoom', 'Closest to how the eye frames a scene'] })],
    {
      kind: 'entity',
      headline: 'Yes — it is the one prime that replaces most of a kit zoom',
      entity: e('e3-1', '35mm f/1.8', { type: 'product', price: '₹17,500', reasoning: 'The focal length sits closest to natural framing, and the wide aperture is what actually unlocks low light.' }),
      facts: [
        { label: 'Price', value: '₹17,500' },
        { label: 'Aperture', value: 'f/1.8 — about 2 stops faster than a kit zoom' },
        { label: 'Best for', value: 'Street, interiors, low light, environmental portraits' },
        { label: 'Trade-off', value: 'No zoom — you move instead' },
      ],
      followUps: ['Compare with the 50mm', 'Show me sample shots', 'Cheaper alternatives'],
    }
  ),
];

/* ── comparison ──────────────────────────────────────────────────────────── */

const COMPARISON: Level2Scenario[] = [
  scenario(
    'fx-compare-rafting',
    'comparison',
    'travel',
    'Compare white water rafting on the Ganga, the Barapole and the Cauvery for a first-timer.',
    [
      s('c1-a', 'Lining the three rivers up on the same terms'),
      v('c1-b', 'They differ most on difficulty and season', 'comparison_signal', {
        subjects: [
          { id: 'c1-ganga', label: 'Ganga' },
          { id: 'c1-barapole', label: 'Barapole' },
          { id: 'c1-cauvery', label: 'Cauvery' },
        ],
        dimensions: [
          { key: 'grade', label: 'Rapids', values: { 'c1-ganga': 'Grade II–III', 'c1-barapole': 'Grade IV', 'c1-cauvery': 'Grade II' }, leaderId: 'c1-cauvery' },
          { key: 'season', label: 'Season', values: { 'c1-ganga': 'Oct–Mar', 'c1-barapole': 'Jun–Sep', 'c1-cauvery': 'Year-round' }, leaderId: 'c1-cauvery' },
        ],
      }),
    ],
    {
      kind: 'comparison',
      headline: 'For a first-timer, the Cauvery — the Barapole is not a beginner river',
      comparison: {
        subjects: [
          { id: 'c1-ganga', label: 'Ganga (Rishikesh)' },
          { id: 'c1-barapole', label: 'Barapole (Coorg)' },
          { id: 'c1-cauvery', label: 'Cauvery (Dubare)' },
        ],
        dimensions: [
          { key: 'grade', label: 'Rapids', values: { 'c1-ganga': 'Grade II–III', 'c1-barapole': 'Grade IV, technical', 'c1-cauvery': 'Grade II, gentle' }, leaderId: 'c1-cauvery' },
          { key: 'season', label: 'Best season', values: { 'c1-ganga': 'Oct–Mar', 'c1-barapole': 'Jun–Sep monsoon peak', 'c1-cauvery': 'Year-round' }, leaderId: 'c1-cauvery' },
          { key: 'length', label: 'Stretch', values: { 'c1-ganga': '16 km', 'c1-barapole': '4 km', 'c1-cauvery': '6 km' } },
          { key: 'price', label: 'Price', values: { 'c1-ganga': '₹1,200', 'c1-barapole': '₹1,800', 'c1-cauvery': '₹1,000' }, leaderId: 'c1-cauvery' },
        ],
      },
      verdict: 'Gentle Grade II water, year-round season, and the lowest price of the three.',
      verdictSubjectId: 'c1-cauvery',
      followUps: ['Book a Cauvery slot', 'What should I wear', 'Show me the Ganga stretch'],
    }
  ),
  scenario(
    'fx-compare-phones',
    'comparison',
    'shopping',
    'Compare these two phones on camera, battery and price.',
    [s('c2-a', 'Putting them side by side'), v('c2-b', 'They split on battery versus camera', 'comparison_signal', {
      subjects: [{ id: 'c2-a1', label: 'Model A' }, { id: 'c2-b1', label: 'Model B' }],
      dimensions: [{ key: 'battery', label: 'Battery', values: { 'c2-a1': '5,000 mAh', 'c2-b1': '4,400 mAh' }, leaderId: 'c2-a1' }],
    })],
    {
      kind: 'comparison',
      headline: 'One wins on battery, the other on camera — the price is a tie',
      comparison: {
        subjects: [{ id: 'c2-a1', label: 'Model A' }, { id: 'c2-b1', label: 'Model B' }],
        dimensions: [
          { key: 'camera', label: 'Camera', values: { 'c2-a1': '50MP, no OIS', 'c2-b1': '50MP with OIS' }, leaderId: 'c2-b1' },
          { key: 'battery', label: 'Battery', values: { 'c2-a1': '5,000 mAh · 2 days', 'c2-b1': '4,400 mAh · 1.5 days' }, leaderId: 'c2-a1' },
          { key: 'price', label: 'Price', values: { 'c2-a1': '₹32,999', 'c2-b1': '₹33,499' } },
        ],
      },
      // The only comparison fixture whose subjects carry imagery — this is
      // what exercises the image-led 'cards-tabs' L1 family (see
      // resolveL1Family in adaptToL1.ts). The other two comparison fixtures
      // deliberately have none, covering the far more common no-image case.
      entities: [
        e('c2-a1', 'Model A', { image: '/images/feed/feed_31-fashion-streetwear-editorial.jpg' }),
        e('c2-b1', 'Model B', { image: '/images/feed/feed_25-sports-cricket-stadium-floodlights.jpg' }),
      ],
      followUps: ['Which is better for video', 'Show me cheaper options', 'Compare with a third'],
    }
  ),
  scenario(
    'fx-compare-paragliding',
    'comparison',
    'travel',
    'Compare Bir Billing, Nainital and Gulmarg for paragliding.',
    [s('c3-a', 'Comparing altitude, season and flight length'), v('c3-b', 'Bir Billing leads on every axis but access', 'comparison_signal', {
      subjects: [{ id: 'c3-bir', label: 'Bir Billing' }, { id: 'c3-nai', label: 'Nainital' }, { id: 'c3-gul', label: 'Gulmarg' }],
      dimensions: [{ key: 'altitude', label: 'Takeoff altitude', values: { 'c3-bir': '2,400 m', 'c3-nai': '1,900 m', 'c3-gul': '2,650 m' }, leaderId: 'c3-gul' }],
    })],
    {
      kind: 'comparison',
      headline: 'Bir Billing, unless you are already in Kashmir',
      comparison: {
        subjects: [{ id: 'c3-bir', label: 'Bir Billing' }, { id: 'c3-nai', label: 'Nainital' }, { id: 'c3-gul', label: 'Gulmarg' }],
        dimensions: [
          { key: 'altitude', label: 'Takeoff', values: { 'c3-bir': '2,400 m', 'c3-nai': '1,900 m', 'c3-gul': '2,650 m' }, leaderId: 'c3-gul' },
          { key: 'flight', label: 'Flight time', values: { 'c3-bir': '30–60 min', 'c3-nai': '20–40 min', 'c3-gul': '15–30 min' }, leaderId: 'c3-bir' },
          { key: 'season', label: 'Season', values: { 'c3-bir': 'Mar–Jun, Sep–Nov', 'c3-nai': 'Mar–Jun, Oct–Nov', 'c3-gul': 'Apr–Jun, Sep–Oct' }, leaderId: 'c3-bir' },
          { key: 'training', label: 'Training schools', values: { 'c3-bir': 'Several dedicated schools', 'c3-nai': 'Tandem only', 'c3-gul': 'Tandem only' }, leaderId: 'c3-bir' },
        ],
      },
      verdict: 'Longest flights, widest season, and the only site with dedicated training schools.',
      verdictSubjectId: 'c3-bir',
      followUps: ['Book a tandem flight', 'Best month to go', 'What does it cost'],
    }
  ),
];

/* ── route_map ───────────────────────────────────────────────────────────── */

const ROUTE_MAP: Level2Scenario[] = [
  scenario(
    'fx-route-coorg',
    'route_map',
    'travel',
    'Plan the drive from Bengaluru to Coorg with a good breakfast stop.',
    [
      s('rt1-a', 'Looking at the two usual ways out of the city'),
      v('rt1-b', '18 minutes saved going via Mysuru Road', 'route', {
        origin: 'Bengaluru',
        destination: 'Madikeri, Coorg',
        stops: [],
        distance: '256 km',
        eta: '5 h 20 m',
        savings: '18 minutes saved',
        alternates: [{ label: 'Via Hassan', eta: '5 h 38 m', distance: '264 km', note: 'Fewer tolls, rougher surface' }],
      }),
      s('rt1-c', 'Finding somewhere to stop about two hours in'),
    ],
    {
      kind: 'route',
      headline: 'Via Mysuru Road, with breakfast at Kamat Lokaruchi',
      route: {
        origin: 'Bengaluru',
        destination: 'Madikeri, Coorg',
        distance: '256 km',
        eta: '5 h 20 m',
        savings: '18 minutes faster than the Hassan route',
        stops: [
          { id: 'rt1-s1', label: 'Bengaluru', eta: '0:00', detail: 'Start' },
          { id: 'rt1-s2', label: 'Kamat Lokaruchi, Ramanagara', eta: '1:10', detail: 'Breakfast · opens 7am' },
          { id: 'rt1-s3', label: 'Mysuru bypass', eta: '2:50', detail: 'Fuel and rest' },
          { id: 'rt1-s4', label: 'Madikeri', eta: '5:20', detail: 'Arrive' },
        ],
        alternates: [{ label: 'Via Hassan', eta: '5 h 38 m', distance: '264 km', note: 'Fewer tolls but a rougher surface after Channarayapatna' }],
      },
      notes: ['Leave before 6am to clear the Mysuru Road bottleneck', 'The last 30 km are ghat roads — slower than the ETA suggests'],
      followUps: ['Where should I stay in Coorg', 'Add a lunch stop', 'Show the Hassan route instead'],
    }
  ),
  scenario(
    'fx-route-airport',
    'route_map',
    'travel',
    'Fastest way to the airport at 6am on a Monday?',
    [v('rt2-a', 'Checking both routes at your actual departure time', 'route', { stops: [], eta: '48 min', distance: '39 km', savings: '12 minutes saved', origin: 'Indiranagar', destination: 'Kempegowda International' })],
    {
      kind: 'route',
      headline: 'Hebbal flyover — 48 minutes at that hour',
      route: {
        origin: 'Indiranagar',
        destination: 'Kempegowda International Airport',
        distance: '39 km',
        eta: '48 min',
        savings: '12 minutes faster than the Outer Ring Road',
        stops: [
          { id: 'rt2-s1', label: 'Indiranagar', eta: '0:00' },
          { id: 'rt2-s2', label: 'Hebbal flyover', eta: '0:22', detail: 'Clear before 7am' },
          { id: 'rt2-s3', label: 'Airport', eta: '0:48' },
        ],
        alternates: [{ label: 'Outer Ring Road', eta: '60 min', note: 'Backs up from 6:30am' }],
      },
      notes: ['Leave by 5:40am to keep this ETA'],
      followUps: ['Book a cab', 'What if I leave at 7', 'Airport lounge access'],
    }
  ),
  scenario(
    'fx-route-goa',
    'route_map',
    'travel',
    'Three-day Goa itinerary starting from Panjim.',
    [s('rt3-a', 'Grouping places by how far apart they are'), v('rt3-b', 'North and south split cleanly into two days', 'route', { stops: [], origin: 'Panjim', destination: 'Panjim' })],
    {
      kind: 'route',
      headline: 'North on day one, south on day two, Panjim on day three',
      route: {
        origin: 'Panjim',
        destination: 'Panjim',
        distance: '180 km over three days',
        eta: '3 days',
        stops: [
          { id: 'rt3-s1', label: 'Day 1 · Anjuna, Vagator, Chapora', eta: 'Day 1', detail: '22 km loop' },
          { id: 'rt3-s2', label: 'Day 2 · Palolem, Agonda, Cabo de Rama', eta: 'Day 2', detail: '68 km each way' },
          { id: 'rt3-s3', label: 'Day 3 · Fontainhas, Old Goa, Divar', eta: 'Day 3', detail: '18 km loop' },
        ],
      },
      notes: ['Day 2 is the long drive — start by 8am', 'Divar ferry runs until 10pm'],
      followUps: ['Where to stay each night', 'Add a beach shack list', 'Rent a scooter'],
    }
  ),
];

/* ── structured_no_image ─────────────────────────────────────────────────── */

const STRUCTURED: Level2Scenario[] = [
  scenario(
    'fx-struct-fixtures',
    'structured_no_image',
    'sports',
    'What are this weekend’s Premier League fixtures and kickoff times in IST?',
    [
      s('st1-a', 'Pulling the weekend schedule'),
      v('st1-b', '10 fixtures across Saturday and Sunday', 'count', { value: 10, label: 'fixtures this weekend' }),
      v('st1-c', 'Converting kickoffs to your time', 'timeline', {
        items: [
          { label: 'Saturday early', time: '5:30pm IST' },
          { label: 'Saturday 3pm block', time: '8:30pm IST' },
          { label: 'Sunday late', time: '10:00pm IST' },
        ],
      }),
    ],
    {
      kind: 'structured',
      headline: '10 fixtures — the two that matter are both on Sunday',
      columns: ['Fixture', 'Day', 'Kickoff (IST)'],
      rows: [
        ['Arsenal v Liverpool', 'Sunday', '10:00pm'],
        ['Man City v Spurs', 'Sunday', '7:30pm'],
        ['Chelsea v Brighton', 'Saturday', '8:30pm'],
        ['Newcastle v Villa', 'Saturday', '8:30pm'],
        ['Everton v Fulham', 'Saturday', '5:30pm'],
      ],
      followUps: ['Set a reminder for Arsenal v Liverpool', 'Show the table', 'Where can I watch'],
    }
  ),
  scenario(
    'fx-struct-slots',
    'structured_no_image',
    'local_experiences',
    'What weekend slots are available for the pottery workshop, and what do they cost?',
    [
      s('st2-a', 'Checking the weekend calendar'),
      v('st2-b', '5 of 8 weekend slots still open', 'availability', {
        summary: '5 of 8 open',
        slots: [
          { label: 'Sat 10am', state: 'full' },
          { label: 'Sat 1pm', state: 'open', detail: '4 places' },
          { label: 'Sat 4pm', state: 'limited', detail: '1 place' },
          { label: 'Sun 10am', state: 'open', detail: '6 places' },
          { label: 'Sun 1pm', state: 'open', detail: '6 places' },
        ],
      }),
    ],
    {
      kind: 'structured',
      headline: '5 slots left this weekend — Sunday morning has the most room',
      columns: ['Slot', 'Places left', 'Price', 'Duration'],
      rows: [
        ['Sat 1pm', '4', '₹1,800', '2h'],
        ['Sat 4pm', '1', '₹1,800', '2h'],
        ['Sun 10am', '6', '₹1,600', '2h'],
        ['Sun 1pm', '6', '₹1,600', '2h'],
        ['Sun 4pm', '3', '₹1,800', '2h'],
      ],
      availability: {
        summary: '5 of 8 weekend slots open',
        slots: [
          { label: 'Sat 10am', state: 'full' },
          { label: 'Sat 1pm', state: 'open', detail: '4 places' },
          { label: 'Sat 4pm', state: 'limited', detail: '1 place' },
          { label: 'Sun 10am', state: 'open', detail: '6 places' },
          { label: 'Sun 1pm', state: 'open', detail: '6 places' },
        ],
      },
      followUps: ['Book Sunday 10am', 'What should I bring', 'Is there a beginner session'],
    }
  ),
  scenario(
    'fx-struct-nutrition',
    'structured_no_image',
    'food',
    'Give me the macros for these five breakfast options.',
    [s('st3-a', 'Working out the per-serving numbers'), v('st3-b', 'Two clear the 20g protein bar', 'count', { value: 2, label: 'over 20g protein', qualifier: 'out of 5' })],
    {
      kind: 'structured',
      headline: 'Only the eggs and the Greek yoghurt clear 20g of protein',
      columns: ['Option', 'Calories', 'Protein', 'Carbs', 'Fat'],
      rows: [
        ['3 eggs + toast', '380', '24 g', '28 g', '18 g'],
        ['Greek yoghurt + granola', '340', '22 g', '38 g', '10 g'],
        ['Masala oats', '290', '9 g', '48 g', '6 g'],
        ['Idli + sambar (3)', '310', '11 g', '56 g', '4 g'],
        ['Banana smoothie', '260', '8 g', '44 g', '5 g'],
      ],
      followUps: ['Highest protein under 300 calories', 'Make the oats higher protein', 'Weekly breakfast plan'],
    }
  ),
];

/* ── list ──────────────────────────────────────────────────────────────────
   Like candidate_ranking, list fixtures do NOT hand-author their pass arcs:
   they declare the items and sources, then run the SAME `buildListPasses`
   the real Phoenix path runs (see listPlan.ts). One arc definition — the
   fixture path cannot drift from the live one, the narration count is
   derived from the same array the canvas renders, and no fixture can
   reintroduce the duplicate "Found N…" + "N worth checking" copy. */

export function listScenario(
  id: string,
  domain: string,
  prompt: string,
  items: NormalizedEntity[],
  sources: Array<{ label: string; kind: 'web' | 'maps' }>,
  sourceCount: number,
  searchCount: number,
  finalResponse: FinalResponseModel,
  rawResultCount?: number
): Level2Scenario {
  const plan = buildListPasses({
    events: [],
    entities: items,
    requirements: extractQueryRequirements(prompt),
    prompt,
    sourceEvidence: { sources, sourceCount, searchCount },
    isFixture: true,
    rawResultCount,
    rng: Math.random,
  });
  return {
    id,
    archetype: 'list',
    domain,
    prompt,
    source: 'fixture',
    thinkingPasses: plan.passes,
    finalResponse,
    metadata: { list: plan.meta },
  };
}

/* The failing case from the brief, end to end: 10 trends, raw retrieval scale
   of 109 results, per-item trend signals the "trace" itself carries, and
   theme categories so the grouping beat runs. */
const SNEAKER_TRENDS = [
  e('l4-1', 'Retro runners', { type: 'product', judgment: 'Trending', attributes: { category: 'Retro' } }),
  e('l4-2', 'Silver metallics', { type: 'product', judgment: 'Rising', attributes: { category: 'Minimal' } }),
  e('l4-3', 'Terrace sneakers', { type: 'product', judgment: 'Popular', attributes: { category: 'Retro' } }),
  e('l4-4', 'Trail-inspired', { type: 'product', judgment: 'Rising', attributes: { category: 'Performance' } }),
  e('l4-5', 'Low-profile courts', { type: 'product', judgment: 'Trending', attributes: { category: 'Minimal' } }),
  e('l4-6', 'Chunky max cushioning', { type: 'product', judgment: 'Popular', attributes: { category: 'Performance' } }),
  e('l4-7', 'Suede classics', { type: 'product', judgment: 'Classic', attributes: { category: 'Retro' } }),
  e('l4-8', 'Racing flats', { type: 'product', judgment: 'New', attributes: { category: 'Performance' } }),
  e('l4-9', 'All-white minimals', { type: 'product', judgment: 'Popular', attributes: { category: 'Minimal' } }),
  e('l4-10', 'Gum-sole lows', { type: 'product', judgment: 'Rising', attributes: { category: 'Minimal' } }),
];

const LIST: Level2Scenario[] = [
  listScenario(
    'fx-list-sneaker-trends',
    'shopping',
    "What's trending in sneakers?",
    SNEAKER_TRENDS,
    [
      { label: 'Highsnobiety', kind: 'web' },
      { label: 'GQ', kind: 'web' },
      { label: 'Sneaker News', kind: 'web' },
      { label: 'Myntra', kind: 'web' },
    ],
    9,
    3,
    {
      kind: 'list',
      headline: "What's trending in sneakers right now",
      items: SNEAKER_TRENDS,
      followUps: ['Show me retro runners under ₹5000', 'Which brands lead each trend', 'What is fading out'],
    },
    109
  ),
  listScenario(
    'fx-list-bookshops',
    'local_experiences',
    'Show me independent bookshops in the city.',
    [
      e('l1-1', 'Blossom Book House', { location: 'Church Street' }),
      e('l1-2', 'Champaca', { location: 'Vasanth Nagar' }),
      e('l1-3', 'Bookworm', { location: 'Shrungar Complex' }),
      e('l1-4', 'Atta Galatta', { location: 'Koramangala' }),
      e('l1-5', 'Goobe’s Book Republic', { location: 'Church Street' }),
    ],
    [
      { label: 'Google Maps', kind: 'maps' },
      { label: 'LBB', kind: 'web' },
      { label: 'The Hindu', kind: 'web' },
    ],
    6,
    2,
    {
      // No winner field exists on this type. A list is an honest outcome when
      // nothing distinguishes one option — the renderer must promote nothing.
      kind: 'list',
      headline: '5 independent bookshops, all still trading',
      items: [
        e('l1-1', 'Blossom Book House', { location: 'Church Street', reasoning: 'Three floors, strongest secondhand selection.' }),
        e('l1-2', 'Champaca', { location: 'Vasanth Nagar', reasoning: 'Curated, with a cafe and a children’s room.' }),
        e('l1-3', 'Bookworm', { location: 'Shrungar Complex', reasoning: 'Dense secondhand stacks, good for browsing.' }),
        e('l1-4', 'Atta Galatta', { location: 'Koramangala', reasoning: 'Indian-language focus and regular events.' }),
        e('l1-5', 'Goobe’s Book Republic', { location: 'Church Street', reasoning: 'Basement shop, strong on graphic novels.' }),
      ],
      followUps: ['Which has a cafe', 'Open on Sunday', 'Find one near me'],
    }
  ),
  listScenario(
    'fx-list-podcasts',
    'media',
    'What podcasts should I try for long drives?',
    [
      e('l2-1', 'The Rest Is History', { subtitle: 'Two-part deep dives, ~50 min each' }),
      e('l2-2', 'Darknet Diaries', { subtitle: 'Standalone stories, 60–90 min' }),
      e('l2-3', 'Seen and the Unseen', { subtitle: 'Long conversations, often 3h+' }),
      e('l2-4', 'Cautionary Tales', { subtitle: 'Tight 40-minute episodes' }),
      e('l2-5', 'Empire', { subtitle: 'Serialised history, ~45 min' }),
      e('l2-6', 'Search Engine', { subtitle: 'One question per episode' }),
    ],
    [
      { label: 'Spotify', kind: 'web' },
      { label: 'Apple Podcasts', kind: 'web' },
    ],
    4,
    2,
    {
      kind: 'list',
      headline: 'Six that hold up over a five-hour drive',
      items: [
        e('l2-1', 'The Rest Is History', { subtitle: 'Two-part deep dives, ~50 min each' }),
        e('l2-2', 'Darknet Diaries', { subtitle: 'Standalone stories, 60–90 min' }),
        e('l2-3', 'Seen and the Unseen', { subtitle: 'Long conversations, often 3h+' }),
        e('l2-4', 'Cautionary Tales', { subtitle: 'Tight 40-minute episodes' }),
        e('l2-5', 'Empire', { subtitle: 'Serialised history, ~45 min' }),
        e('l2-6', 'Search Engine', { subtitle: 'One question per episode' }),
      ],
      followUps: ['Something lighter', 'Indian podcasts only', 'Download for offline'],
    }
  ),
  listScenario(
    'fx-list-markets',
    'local_experiences',
    'List the weekend farmers markets around the city.',
    [
      e('l3-1', 'Jayanagar Sunday Market', { location: 'Jayanagar 4th Block' }),
      e('l3-2', 'Whitefield Farmers Market', { location: 'Whitefield' }),
      e('l3-3', 'Indiranagar Green Market', { location: 'Indiranagar' }),
      e('l3-4', 'Sahakarnagar Organic Bazaar', { location: 'Sahakarnagar' }),
    ],
    [{ label: 'Google Maps', kind: 'maps' }],
    1,
    1,
    {
      kind: 'list',
      headline: '4 weekend markets, spread across the city',
      items: [
        e('l3-1', 'Jayanagar Sunday Market', { location: 'Jayanagar 4th Block', subtitle: 'Sundays 7am – 12pm' }),
        e('l3-2', 'Whitefield Farmers Market', { location: 'Whitefield', subtitle: 'Saturdays 8am – 1pm' }),
        e('l3-3', 'Indiranagar Green Market', { location: 'Indiranagar', subtitle: 'Sundays 8am – 11am' }),
        e('l3-4', 'Sahakarnagar Organic Bazaar', { location: 'Sahakarnagar', subtitle: 'Saturdays 7am – 11am' }),
      ],
      followUps: ['Which is closest to me', 'What is in season', 'Any weekday markets'],
    }
  ),
];

/* ── summary ─────────────────────────────────────────────────────────────── */

const SUMMARY: Level2Scenario[] = [
  scenario(
    'fx-summary-ev',
    'summary',
    'general',
    'What is the current state of EV charging in Indian cities?',
    [
      s('sm1-a', 'Reading across recent coverage'),
      v('sm1-b', 'Three themes keep recurring', 'cluster', {
        clusters: [
          { label: 'Charger availability', count: 9 },
          { label: 'Payment fragmentation', count: 6 },
          { label: 'Apartment charging rules', count: 4 },
        ],
      }),
    ],
    {
      kind: 'summary',
      headline: 'Coverage is no longer the bottleneck — reliability and payments are',
      takeaways: [
        'Metro coverage has roughly tripled in two years; the gap is now between cities, not within them.',
        'Reliability is the recurring complaint: a meaningful share of listed chargers are offline or occupied.',
        'Payments are fragmented across a dozen apps, each with its own wallet.',
        'Apartment-level charging remains the hardest unsolved piece for private owners.',
      ],
      themes: [
        { label: 'Charger availability', detail: 'Strong in metros, thin on highways', sourceCount: 9 },
        { label: 'Payment fragmentation', detail: 'No common roaming standard yet', sourceCount: 6 },
        { label: 'Apartment charging', detail: 'Society approval is the usual blocker', sourceCount: 4 },
      ],
      followUps: ['Which apps cover the most chargers', 'Highway charging on my route', 'Home charger installation'],
    }
  ),
  scenario(
    'fx-summary-reviews',
    'summary',
    'food',
    'Summarise what people actually say about this restaurant.',
    [s('sm2-a', 'Reading through the reviews'), v('sm2-b', 'The praise and the complaints are both consistent', 'cluster', { clusters: [{ label: 'Food quality', count: 41 }, { label: 'Wait times', count: 28 }, { label: 'Noise', count: 17 }] })],
    {
      kind: 'summary',
      headline: 'People love the food and complain about the wait — consistently, for years',
      takeaways: [
        'Food quality is praised in nearly every positive review, with the same three dishes named repeatedly.',
        'Wait times are the single largest complaint, concentrated between 8pm and 10pm on weekends.',
        'Noise levels come up often enough to matter if you want a conversation.',
        'Service is described as fast once seated — the bottleneck is the door, not the floor.',
      ],
      themes: [
        { label: 'Food quality', detail: 'Overwhelmingly positive', sourceCount: 41 },
        { label: 'Wait times', detail: 'Worst 8–10pm on weekends', sourceCount: 28 },
        { label: 'Noise', detail: 'Ground floor louder than the rooftop', sourceCount: 17 },
      ],
      followUps: ['Best time to avoid the wait', 'What should I order', 'Somewhere quieter nearby'],
    }
  ),
  scenario(
    'fx-summary-monsoon',
    'summary',
    'travel',
    'What is the monsoon actually like for travel in the Western Ghats?',
    [s('sm3-a', 'Reading across trip reports and forecasts'), v('sm3-b', 'What keeps coming up', 'text', { lines: ['June and July are the heaviest', 'Leeches are the common complaint', 'September is the sweet spot'] })],
    {
      kind: 'summary',
      headline: 'September is the window — the greenery without the washout',
      takeaways: [
        'June and July carry the heaviest rain; trails and viewpoints are frequently closed.',
        'August improves but landslide closures are still common on ghat roads.',
        'September keeps the greenery and the waterfalls with far fewer closures.',
        'Leeches are the most consistent complaint across every month of the season.',
      ],
      themes: [
        { label: 'Rainfall', detail: 'Peaks June–July', sourceCount: 12 },
        { label: 'Road closures', detail: 'Landslides through August', sourceCount: 8 },
        { label: 'Leeches', detail: 'Mentioned in most trip reports', sourceCount: 15 },
      ],
      followUps: ['Best September destinations', 'What to pack', 'Are treks open in September'],
    }
  ),
];

/* ── hybrid ──────────────────────────────────────────────────────────────── */

const HYBRID: Level2Scenario[] = [
  scenario(
    'fx-hybrid-daytrip',
    'hybrid',
    'travel',
    'Plan a day trip out of the city on Sunday — where to go, how long it takes, and what is open.',
    [
      discovered('h1-a', 'Found 4 places within a two-hour drive', [
        e('h1-1', 'Nandi Hills', { rating: 4.4, location: 'Chikkaballapur', travelTime: '1 h 20 m' }),
        e('h1-2', 'Skandagiri', { rating: 4.3, location: 'Chikkaballapur', travelTime: '1 h 40 m' }),
        e('h1-3', 'Bheemeshwari', { rating: 4.5, location: 'Mandya', travelTime: '2 h 10 m' }),
        e('h1-4', 'Ramanagara', { rating: 4.2, location: 'Ramanagara', travelTime: '1 h 05 m' }),
      ]),
      v('h1-b', 'Nandi Hills is the shortest drive', 'route', {
        origin: 'Bengaluru',
        destination: 'Nandi Hills',
        stops: [],
        distance: '61 km',
        eta: '1 h 20 m',
        savings: '20 minutes less than the next option',
      }),
      v('h1-c', 'Two of the four open early enough', 'availability', {
        summary: '2 of 4 open before 7am',
        slots: [
          { label: 'Nandi Hills', state: 'open', detail: 'Gates 6am' },
          { label: 'Skandagiri', state: 'limited', detail: 'Permit needed' },
          { label: 'Bheemeshwari', state: 'open', detail: 'From 7am' },
          { label: 'Ramanagara', state: 'full', detail: 'Closed Sundays' },
        ],
      }),
    ],
    {
      kind: 'hybrid',
      headline: 'Nandi Hills — shortest drive, opens at 6am, and you beat the crowd',
      sections: [
        {
          title: 'Where to go',
          response: {
            kind: 'entity_rail',
            headline: 'Nandi Hills leads',
            entities: [
              e('h1-1', 'Nandi Hills', { rating: 4.4, location: 'Chikkaballapur', travelTime: '1 h 20 m', judgment: 'Top Pick', reasoning: 'Shortest drive, earliest gates, and the sunrise view is the point of going.' }),
              e('h1-3', 'Bheemeshwari', { rating: 4.5, location: 'Mandya', travelTime: '2 h 10 m', reasoning: 'Higher rated but a much longer drive.' }),
              e('h1-2', 'Skandagiri', { rating: 4.3, location: 'Chikkaballapur', travelTime: '1 h 40 m' }),
            ],
            winnerId: 'h1-1',
          },
        },
        {
          title: 'Getting there',
          response: {
            kind: 'route',
            headline: '61 km, about 1 h 20 m',
            route: {
              origin: 'Bengaluru',
              destination: 'Nandi Hills',
              distance: '61 km',
              eta: '1 h 20 m',
              stops: [
                { id: 'h1-s1', label: 'Hebbal', eta: '0:20' },
                { id: 'h1-s2', label: 'Devanahalli', eta: '0:50' },
                { id: 'h1-s3', label: 'Nandi Hills gate', eta: '1:20', detail: 'Gates open 6am' },
              ],
            },
          },
        },
        {
          title: 'When to leave',
          response: {
            kind: 'structured',
            headline: 'Leave by 4:30am for sunrise',
            columns: ['Leave', 'Arrive', 'What you get'],
            rows: [
              ['4:30am', '5:50am', 'Sunrise, light traffic at the gate'],
              ['6:00am', '7:20am', 'Clear views, queue at the gate'],
              ['8:00am', '9:30am', 'Crowded, parking well below the summit'],
            ],
          },
        },
      ],
      followUps: ['Breakfast near Nandi Hills', 'What if it rains', 'Show me the Bheemeshwari option'],
    }
  ),
  scenario(
    'fx-hybrid-dinner',
    'hybrid',
    'food',
    'Book dinner for four tonight somewhere I can get to in 20 minutes.',
    [
      discovered('h2-a', 'Found 3 within 20 minutes', [
        e('h2-1', 'Naru Noodle Bar', { rating: 4.8, travelTime: '12 min' }),
        e('h2-2', 'Pizza 4P’s', { rating: 4.6, travelTime: '18 min' }),
        e('h2-3', 'Dashi', { rating: 4.5, travelTime: '15 min' }),
      ]),
      v('h2-b', 'Only one has a table for four tonight', 'availability', {
        summary: '1 of 3 available',
        slots: [
          { label: 'Naru Noodle Bar', state: 'full', detail: 'Booked out' },
          { label: 'Pizza 4P’s', state: 'open', detail: '8:15pm, table for 4' },
          { label: 'Dashi', state: 'limited', detail: 'Bar seats only' },
        ],
      }),
    ],
    {
      kind: 'hybrid',
      headline: 'Pizza 4P’s at 8:15pm — the only table for four inside your radius',
      sections: [
        {
          title: 'The booking',
          response: {
            kind: 'entity',
            headline: 'Pizza 4P’s · 8:15pm · table for 4',
            entity: e('h2-2', 'Pizza 4P’s', { rating: 4.6, travelTime: '18 min', price: '₹2,400 for two' }),
            facts: [
              { label: 'Time', value: '8:15pm tonight' },
              { label: 'Party', value: '4 people' },
              { label: 'Travel', value: '18 minutes' },
              { label: 'Price', value: '₹2,400 for two' },
            ],
            actions: [{ label: 'Confirm booking', intent: 'book' }, { label: 'Directions', intent: 'directions' }],
          },
        },
        {
          title: 'The others',
          response: {
            kind: 'list',
            headline: 'Both full tonight',
            items: [
              e('h2-1', 'Naru Noodle Bar', { rating: 4.8, travelTime: '12 min', reasoning: 'Highest rated, but booked out for the night.' }),
              e('h2-3', 'Dashi', { rating: 4.5, travelTime: '15 min', reasoning: 'Bar seats only — no table for four.' }),
            ],
          },
        },
      ],
      followUps: ['Confirm the booking', 'Try 9:30pm instead', 'Widen the radius'],
    }
  ),
  scenario(
    'fx-hybrid-move',
    'hybrid',
    'general',
    'I am moving to Pune next month — what do I need to sort out, and where should I look to live?',
    [
      s('h3-a', 'Splitting this into places and paperwork'),
      v('h3-b', 'Three areas fit your commute', 'count', { value: 3, label: 'areas within a 30-minute commute', qualifier: 'out of 11 checked' }),
      v('h3-c', 'Five things have deadlines', 'timeline', {
        items: [
          { label: 'Notice to current landlord', time: 'This week' },
          { label: 'Shortlist and view', time: 'Weeks 2–3' },
          { label: 'Agreement and registration', time: 'Week 4' },
          { label: 'Address change · bank, Aadhaar', time: 'After moving' },
        ],
      }),
    ],
    {
      kind: 'hybrid',
      headline: 'Look in Baner, Kalyani Nagar or Viman Nagar — and start the notice period this week',
      sections: [
        {
          title: 'Where to live',
          response: {
            kind: 'list',
            headline: 'Three areas inside a 30-minute commute',
            items: [
              e('h3-1', 'Baner', { subtitle: '25 min · newer stock, higher rent' }),
              e('h3-2', 'Kalyani Nagar', { subtitle: '20 min · walkable, mid-range' }),
              e('h3-3', 'Viman Nagar', { subtitle: '30 min · best value, busier roads' }),
            ],
          },
        },
        {
          title: 'What to sort out',
          response: {
            kind: 'structured',
            headline: 'Five deadlines in order',
            columns: ['Task', 'When', 'Note'],
            rows: [
              ['Notice to landlord', 'This week', 'Usually 30 days'],
              ['Shortlist and view', 'Weeks 2–3', 'Weekends fill up fast'],
              ['Agreement + registration', 'Week 4', 'Both parties must be present'],
              ['Transfer utilities', 'Moving week', 'Needs the agreement copy'],
              ['Address change', 'After moving', 'Bank, Aadhaar, insurance'],
            ],
          },
        },
      ],
      followUps: ['Compare the three areas', 'What rent should I budget', 'Find a packer'],
    }
  ),
];

/** Every fixture scenario, grouped by archetype. Three per archetype so
 *  Refresh always has somewhere else to go without repeating. */
export const FIXTURE_SCENARIOS: Level2Scenario[] = [
  ...TEXT_ONLY,
  ...CANDIDATE_RANKING,
  ...SINGLE_ENTITY,
  ...COMPARISON,
  ...ROUTE_MAP,
  ...STRUCTURED,
  ...LIST,
  ...SUMMARY,
  ...HYBRID,
];
