import type { NormalizedEntity } from '../types/entity';
import type { QueryRequirements } from '../types/query';
import type { ComparisonFocus, ComparisonValue } from '../types/pass';
import { phrase, STABLE_RNG, type Rng } from './narrationVariety';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Comparison dimensions.

   Derives WHAT THE AGENT CAN HONESTLY COMPARE from a candidate set, as an
   ordered list of one-dimension-at-a-time focuses.

   This is archetype-agnostic on purpose. Candidate ranking uses it today for
   its comparison beats; the standalone `comparison` archetype will use the
   same function against the same entity model, so the two can never drift into
   two different definitions of "what is comparable".

   THREE RULES THIS FILE ENFORCES

   1. A DIMENSION EXISTS ONLY IF THE DATA DOES. A dimension is emitted when at
      least MIN_COVERAGE candidates genuinely carry a value for it. Comparing
      a field one candidate has is not a comparison, it is a lookup.

   2. A MISSING VALUE IS MISSING. `values` is sparse — an absent id means the
      candidate has no value, and the renderer shows an em dash. The candidate
      is never dropped from the comparison and the gap is never filled.

   3. A LEADER IS A CLAIM, SO IT NEEDS PROOF. `leaderIds` is populated only
      when every candidate carries a comparable value, those values share a
      unit, and exactly one is strictly best. Anything short of that is "too
      close to call" and the accent simply does not appear.

   Deliberately NOT here: distance and travel time. Candidate-ranking traces do
   not carry reliable coordinates or travel data (see
   CANDIDATE_RANKING_MAP_DATA_GAP.md), so there is nothing truthful to compare.
   Route-bearing archetypes get that dimension from GetRoute spans instead.
   ───────────────────────────────────────────────────────────────────────────── */

/** Below two real values there is nothing to compare. */
const MIN_COVERAGE = 2;

/** The order the agent inspects dimensions in. Cheapest decision first
 *  (what does it cost), then whether it is even an option (when is it open),
 *  then quality (how good is it) — which is the order a person actually
 *  eliminates options in. */
const DIMENSION_ORDER = ['price', 'availability', 'rating'] as const;

export type ComparisonDimensionKey = (typeof DIMENSION_ORDER)[number];

/** How each dimension is read off an entity, labelled, and narrated. The
 *  narration lives here rather than in the plan so the sentence and the face
 *  label can never describe two different dimensions. */
interface DimensionSpec {
  key: ComparisonDimensionKey;
  /** Face label — short, uppercase at render time. */
  label: string;
  /** The agent's sentence for this beat — several honest phrasings of the
   *  same claim; [0] is canonical (see narrationVariety.ts). */
  narration: readonly [string, ...string[]];
  /** The requirement attribute that asks for this dimension. */
  attribute: string;
  /** A second attribute that asks for the SAME underlying field under a
   *  different name, with the label and sentence that fit that name. A trek's
   *  'Dec–Mar' and a bar's 'Open till 1am' both live on `entity.availability`,
   *  but calling a trekking window "availability" is wrong in the copy —
   *  visibility.ts already groups the two, and this keeps the wording honest
   *  as well as the gate. */
  alias?: { attribute: string; label: string; narration: readonly [string, ...string[]] };
  /** How the renderer should treat the column. See ComparisonFocus.scale. */
  scale: 'numeric' | 'text';
  /** The value for one entity, or undefined when it has no value. */
  read: (entity: NormalizedEntity) => ComparisonValue | undefined;
  /** Comparable magnitude + its unit. A leader is only claimed when every
   *  candidate returns one AND all units match. */
  rank?: (entity: NormalizedEntity) => { amount: number; unit: string } | undefined;
  /** Which end of `rank` wins, and what to call it. */
  best?: 'lowest' | 'highest';
  leaderLabel?: string;
}

/** Strips the digits out of a price string so two prices can be checked for
 *  the SAME unit before either is called lower. '₹1,400 for two' and
 *  '₹850/person' are both numbers with a rupee sign and mean different things;
 *  calling the second one cheaper would be a fabricated comparison. */
function priceUnit(text: string): string {
  return text
    .replace(/[\d,.]+/g, '#')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function priceAmount(text: string): number | undefined {
  const match = text.replace(/,/g, '').match(/\d+(?:\.\d+)?/);
  if (!match) return undefined;
  const value = Number(match[0]);
  return Number.isFinite(value) ? value : undefined;
}

/** Hours/season strings run long ('Mon–Fri 11am–11pm · Sat–Sun 10am–1am'). The
 *  comparison face has one line for the value, so it shows the first segment —
 *  a truncation of the real string, never a rewrite of it. */
function shortAvailability(text: string): string {
  const first = text.split(/[·|;]/)[0].trim();
  return first.length > 26 ? `${first.slice(0, 25).trimEnd()}…` : first;
}

/** Splits '₹2,750 per person' into the figure and its qualifier. Both halves
 *  are kept and both are shown — the number leads because it is the part that
 *  differs between cards, and the qualifier follows quietly because it is
 *  usually identical on all of them. A string with no trailing text splits into
 *  a display and no note. */
function splitAmount(text: string): ComparisonValue {
  const match = text.trim().match(/^(\D*[\d][\d,.]*)\s*(.*)$/);
  if (!match) return { display: text.trim() };
  const note = match[2].trim();
  return { display: match[1].trim(), ...(note ? { note } : {}) };
}

const SPECS: DimensionSpec[] = [
  {
    key: 'price',
    label: 'Price',
    narration: ['Comparing prices', 'Weighing up the prices', 'Looking at what each one costs'],
    attribute: 'price',
    scale: 'numeric',
    read: (e) => (e.price ? splitAmount(String(e.price)) : undefined),
    rank: (e) => {
      if (!e.price) return undefined;
      const amount = priceAmount(String(e.price));
      return amount == null ? undefined : { amount, unit: priceUnit(String(e.price)) };
    },
    best: 'lowest',
    leaderLabel: 'Lowest',
  },
  {
    key: 'availability',
    label: 'Availability',
    narration: ['Checking availability', "Seeing what's actually open", "Checking what's available"],
    attribute: 'availability',
    alias: {
      attribute: 'season',
      label: 'Season',
      narration: ['Checking the season', 'Looking at the best season', 'Checking seasonal timing'],
    },
    scale: 'text',
    read: (e) =>
      typeof e.availability === 'string' && e.availability.trim()
        ? { display: shortAvailability(e.availability) }
        : undefined,
    // No rank. 'Open till 1am' vs 'Reservation only' vs 'Dec–Mar' have no
    // shared scale, so no candidate is ever called the most available.
  },
  {
    key: 'rating',
    label: 'Rating',
    narration: ['Looking at ratings', 'Checking how each one rates', 'Weighing up the ratings'],
    attribute: 'rating',
    scale: 'numeric',
    read: (e) => (e.rating != null ? { display: `${e.rating}★` } : undefined),
    rank: (e) => (e.rating != null ? { amount: e.rating, unit: 'star' } : undefined),
    best: 'highest',
    leaderLabel: 'Top rated',
  },
];

/** The single leader on a dimension, when the data actually distinguishes one.
 *  Returns [] rather than guessing — see rule 3 in the header. */
function resolveLeader(entities: NormalizedEntity[], spec: DimensionSpec): string[] {
  if (!spec.rank || !spec.best) return [];

  const ranked = entities.map((e) => ({ id: e.id, rank: spec.rank!(e) }));
  // Every candidate must be comparable. If one is missing a value it could be
  // the real leader, so nothing can be called best.
  if (ranked.some((r) => !r.rank)) return [];

  const units = new Set(ranked.map((r) => r.rank!.unit));
  if (units.size > 1) return [];

  const amounts = ranked.map((r) => r.rank!.amount);
  const target = spec.best === 'lowest' ? Math.min(...amounts) : Math.max(...amounts);
  const winners = ranked.filter((r) => r.rank!.amount === target);
  // A tie is not a leader — two cards wearing a 'Lowest' badge tells the
  // viewer nothing and reads as a bug.
  return winners.length === 1 ? [winners[0].id] : [];
}

export interface ComparisonDimensionsInput {
  entities: NormalizedEntity[];
  /** When the prompt named specific attributes, only those are compared —
   *  the agent should be seen weighing what was asked for. With no attributes
   *  named, everything the data supports is fair game. */
  requirements?: QueryRequirements;
  /** Wording variety — see narrationVariety.ts. Omit for today's exact
   *  canonical copy (every existing caller/test does). */
  rng?: Rng;
}

/** Diagnostics-facing view of one derived dimension. Carries the coverage
 *  arithmetic the dev panel reports, alongside the presentation focus. */
export interface DerivedComparisonDimension {
  focus: ComparisonFocus;
  narration: string;
  /** Ids with no value for this dimension. */
  missingIds: string[];
  coverage: number;
}

/** Every dimension this candidate set can honestly be compared on, in
 *  inspection order. Empty when the data supports none — callers must handle
 *  that by omitting the comparison beat entirely, not by inventing one. */
export function deriveComparisonDimensions(input: ComparisonDimensionsInput): DerivedComparisonDimension[] {
  const { entities } = input;
  const rng = input.rng ?? STABLE_RNG;
  if (entities.length < 2) return [];

  const asked = new Set(input.requirements?.requestedAttributes ?? []);

  const candidates = DIMENSION_ORDER.map((key) => SPECS.find((s) => s.key === key)!)
    .map((spec) => {
      // The alias only takes over the wording when the prompt asked for the
      // aliased name and NOT the primary one.
      const useAlias = !!spec.alias && !asked.has(spec.attribute) && asked.has(spec.alias.attribute);
      const wording = useAlias ? spec.alias! : spec;
      return { spec, wording, asksFor: asked.has(spec.attribute) || useAlias };
    })
    .filter(({ asksFor }) => !asked.size || asksFor)
    .map(({ spec, wording }) => {
      const values: Record<string, ComparisonValue> = {};
      const missingIds: string[] = [];
      for (const entity of entities) {
        const value = spec.read(entity);
        if (value) values[entity.id] = value;
        else missingIds.push(entity.id);
      }
      return { spec, wording, values, missingIds, coverage: Object.keys(values).length };
    })
    .filter((d) => d.coverage >= MIN_COVERAGE);

  return candidates.map((d, index) => {
    const leaderIds = resolveLeader(entities, d.spec);
    return {
      narration: phrase(d.wording.narration, rng),
      missingIds: d.missingIds,
      coverage: d.coverage,
      focus: {
        key: d.spec.key,
        label: d.wording.label,
        scale: d.spec.scale,
        values: d.values,
        ...(leaderIds.length ? { leaderIds, leaderLabel: d.spec.leaderLabel } : {}),
        step: index,
        stepCount: candidates.length,
      },
    };
  });
}
