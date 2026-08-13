import type { SemanticAgentEvent } from '../../types/semanticEvent';
import type { AgentMutation } from '../../types/progressiveValue';
import { toNormalizedEntity, toProgressiveItem } from '../normalization/entityBridge';
import { extractSourceEvidence, type SourceEvidence } from '../phoenix/sources';
import { phrase, STABLE_RNG, type Rng } from './narrationVariety';
import type { NormalizedEntity } from '../types/entity';
import type { QueryRequirements } from '../types/query';
import type { ThinkingPass } from '../types/pass';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — List without winner: the thinking arc.

   THE PRODUCT PRINCIPLE THIS FILE ENFORCES:

       THE USER ASKED FOR A SET OF THINGS TO EXPLORE — NOT ONE BEST OPTION.

   The generic pass builder produced exactly the failures this file replaces:

     "Found 10 promising options"  +  a count card "10 options worth checking"
     — the same fact said twice, with ZERO items on the canvas, because the
     deployment truncates `tool.output` at 2000 chars and discovery parsed
     nothing. Meanwhile the FINAL RESPONSE of the very same trace names all
     ten items.

   So `list` gets a DELIBERATE arc, mirroring candidateRankingPlan.ts but with
   list semantics — breadth, accumulation, themes — and never elimination:

       acknowledge  "On it — seeing what's out there."
       sources      "Looking across a few sources"            + real sources
       scale        "127 results surfaced — narrowing down"     (status; only
                    when raw retrieval scale dwarfs the resolved list)
       found        "10 sneaker trends are showing up right now" + 10 tiles
       themes       "Three themes keep repeating"             + same tiles
                    regrouped (ONLY when the items genuinely carry a theme)
       complete     "Here's what's showing up."

   THE INVARIANTS, in order of importance:

     1. ONE canonical list set. Narration count, canvas tiles and diagnostics
        all derive from the SAME `visible` array — they cannot drift.
     2. Items are resolved BEFORE narration is generated. When discovery-time
        parsing failed, the final response's own entities back-fill the
        canvas — a replay of the same run, never fabricated content
        (`itemSource: 'final_response_backfill'` marks it for the dev panel).
     3. An image is never required. An item is valid with a stable id and a
        title; the tile renders text-first when no image exists.
     4. RAW RESULT COUNT is not the finding. "109" is retrieval scale; the
        narration reports it as scale, and the discovery claim uses the
        resolved display count.
     5. No shortlist, no "3 stand out", no promotion. A list stays broad all
        the way to the final response, which owns the answer.
     6. No duplicate copy. The discovery pass carries the items themselves —
        never a second count payload restating the narration.
   ───────────────────────────────────────────────────────────────────────────── */

const T = {
  acknowledge: { enterDuration: 400, holdDuration: 1300, exitDuration: 250 },
  sources: { enterDuration: 800, holdDuration: 2100, exitDuration: 300 },
  scale: { enterDuration: 450, holdDuration: 1500, exitDuration: 250 },
  /* Ten tiles arrive on a stagger, so enter covers the full accumulation
     before the reading hold begins. */
  found: { enterDuration: 1150, holdDuration: 2900, exitDuration: 300 },
  themes: { enterDuration: 900, holdDuration: 2700, exitDuration: 300 },
  complete: { enterDuration: 400, holdDuration: 1400, exitDuration: 300 },
} as const;

/** TV display cap. Ten fills a balanced 5+5 grid; beyond that the set stops
 *  being scannable and the overflow belongs to the final response. */
export const MAX_VISIBLE_LIST_ITEMS = 10;

/** Raw retrieval scale is only worth a beat when it genuinely dwarfs the
 *  resolved list — "12 results" for a 10-item list is not a story. */
const SCALE_MIN_RAW = 20;
const SCALE_MIN_RATIO = 2;

/* ── Contextual noun phrase ──────────────────────────────────────────────────
   "promising options" reads like ranking. A list narration should use the
   user's own subject: sneaker trends, breakfast ideas, things to do this
   weekend, documentaries. Lexical and deterministic, same contract as
   queryRequirements — unmatched phrasing falls back, never guesses wrong. */

export interface ListNounPhrase {
  /** 'sneaker trends', 'breakfast ideas', 'things to do this weekend' */
  plural: string;
  /** 'sneaker trend', 'breakfast idea', 'thing to do this weekend' */
  singular: string;
  /** Which flavour of copy the discovery/conclusion beats should use. */
  kind: 'trends' | 'ideas' | 'todo' | 'generic';
}

const NOUN_STOPWORDS = new Set([
  'some', 'more', 'good', 'great', 'nice', 'other', 'a', 'an', 'the', 'my', 'your', 'me', 'few',
  'new', 'best', 'top', 'healthy', 'easy', 'quick', 'cheap', 'popular', 'fun',
]);

function singularize(word: string): string {
  if (/ies$/i.test(word)) return word.replace(/ies$/i, 'y');
  if (/s$/i.test(word) && !/ss$/i.test(word)) return word.replace(/s$/i, '');
  return word;
}

function pluralize(word: string): string {
  if (/y$/i.test(word) && !/[aeiou]y$/i.test(word)) return word.replace(/y$/i, 'ies');
  if (/s$/i.test(word)) return word;
  return `${word}s`;
}

export function listNounPhrase(prompt: string | undefined, requirements: QueryRequirements): ListNounPhrase {
  const text = (prompt ?? '').toLowerCase();

  // "What's trending in sneakers?" → sneaker trends
  const trendingIn = text.match(/\btrend(?:s|ing)?\s+(?:in|for|with|among)\s+([a-z][a-z' -]{2,30}?)(?:\s+(?:right now|today|this\s+\w+))?\s*[?.!]?$/i);
  if (trendingIn) {
    const subject = singularize(trendingIn[1].trim().split(/\s+/).pop() ?? trendingIn[1].trim());
    return { plural: `${subject} trends`, singular: `${subject} trend`, kind: 'trends' };
  }
  if (/\btrend(s|ing)?\b/.test(text)) {
    const subject = requirements.entityType;
    return subject
      ? { plural: `${subject} trends`, singular: `${subject} trend`, kind: 'trends' }
      : { plural: 'trends', singular: 'trend', kind: 'trends' };
  }

  // "Things to do this weekend" → things to do this weekend
  if (/\bthings?\s+to\s+do\b/.test(text)) {
    const time = text.match(/\b(this weekend|this week|tonight|today|tomorrow)\b/)?.[1];
    const tail = time ? ` ${time}` : '';
    return { plural: `things to do${tail}`, singular: `thing to do${tail}`, kind: 'todo' };
  }

  // "Healthy breakfast ideas" → breakfast ideas
  const ideas = text.match(/([a-z][a-z' -]{2,40}?)\s+ideas?\b/);
  if (ideas) {
    const words = ideas[1].trim().split(/\s+/).filter((w) => !NOUN_STOPWORDS.has(w));
    const subject = words[words.length - 1];
    return subject
      ? { plural: `${subject} ideas`, singular: `${subject} idea`, kind: 'ideas' }
      : { plural: 'ideas', singular: 'idea', kind: 'ideas' };
  }
  if (/\bideas?\b/.test(text)) return { plural: 'ideas', singular: 'idea', kind: 'ideas' };

  // The head noun the user themselves used ("documentaries", "bookshops").
  if (requirements.entityType) {
    return { plural: pluralize(requirements.entityType), singular: requirements.entityType, kind: 'generic' };
  }
  return { plural: 'options', singular: 'option', kind: 'generic' };
}

/* ── Trend signal ────────────────────────────────────────────────────────────
   For "what's trending" queries the tile should carry the lightweight signal
   the trace itself expressed — Trending / Rising / Popular / New — and nothing
   when the data says nothing. Scanned from the entity's own judgment,
   subtitle and reasoning; never scored, never invented. */

const TREND_SIGNAL_RE = /\b(trending|rising|surging|popular|new|classic|frequently mentioned|everywhere)\b/i;

export function trendSignalFor(entity: NormalizedEntity): string | undefined {
  const sources = [
    entity.judgment,
    typeof entity.attributes?.trend === 'string' ? (entity.attributes.trend as string) : undefined,
    entity.subtitle,
    entity.reasoning,
  ];
  for (const text of sources) {
    const m = typeof text === 'string' ? text.match(TREND_SIGNAL_RE) : null;
    if (m) {
      const word = m[1].toLowerCase();
      if (word === 'surging') return 'Rising';
      if (word === 'everywhere' || word === 'frequently mentioned') return 'Everywhere';
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
  }
  return undefined;
}

/* ── Themes ──────────────────────────────────────────────────────────────────
   A list evolves by CLUSTERING, never by elimination — but only when the
   items genuinely carry a shared theme attribute. Requires ≥2 groups of ≥2
   covering the whole visible set; anything less and no theme beat exists. */

export interface ListThemeGroup {
  label: string;
  ids: string[];
}

export function deriveListThemes(entities: NormalizedEntity[]): ListThemeGroup[] {
  const groups = new Map<string, ListThemeGroup>();
  let grouped = 0;
  for (const entity of entities) {
    const raw = entity.attributes?.category ?? entity.attributes?.theme ?? entity.attributes?.group;
    const label = typeof raw === 'string' ? raw.trim() : '';
    if (!label) continue;
    const key = label.toLowerCase();
    if (!groups.has(key)) groups.set(key, { label, ids: [] });
    groups.get(key)!.ids.push(entity.id);
    grouped += 1;
  }
  const out = [...groups.values()];
  if (out.length < 2) return [];
  if (out.some((g) => g.ids.length < 2)) return [];
  if (grouped < entities.length) return [];
  return out;
}

/* ── Canonical set resolution ──────────────────────────────────────────────── */

function dedupeEntities(entities: NormalizedEntity[]): NormalizedEntity[] {
  const seen = new Set<string>();
  const out: NormalizedEntity[] = [];
  for (const e of entities) {
    const key = e.externalId ?? e.title?.toLowerCase().trim() ?? e.id;
    if (seen.has(key)) continue;
    seen.add(key);
    // A list item is valid with a stable id and a meaningful title. An image
    // is never required — but a nameless entry is not showable.
    if (!e.title?.trim()) continue;
    out.push(e);
  }
  return out;
}

/** How wide the retrieval actually was — result counts the search events
 *  reported, summed. This is SCALE, never the finding. */
function rawResultCountFrom(events: SemanticAgentEvent[]): number {
  let sum = 0;
  for (const event of events) {
    if (event.type !== 'search' && event.type !== 'retrieve') continue;
    const v = (event.metadata as Record<string, unknown> | undefined)?.resultCount;
    if (typeof v === 'number') sum += v;
  }
  return sum;
}

/* ── Diagnostics contract (§ dev panel) ────────────────────────────────────── */

export interface ListPlanMeta {
  /** Retrieval scale the trace reported, when it did. */
  rawResultCount?: number;
  /** Canonical resolved list size (before the TV display cap). */
  resolvedListCount: number;
  /** What the canvas shows — and therefore what the narration claims. */
  visibleListCount: number;
  /** The count the discovery narration states. MUST equal visibleListCount. */
  narrationCount: number;
  /** Visible items whose TRACE carried an image URL (the renderer's four-tier
   *  resolver still gives the rest relevant imagery). */
  imagesAvailable: number;
  /** Where the visible items came from. */
  itemSource: 'discovery' | 'final_response_backfill' | 'fixture';
  themeCount: number;
}

export interface ListPlanInput {
  events: SemanticAgentEvent[];
  /** The final response's own list items — the canonical curated set this
   *  same run produced. */
  entities: NormalizedEntity[];
  requirements: QueryRequirements;
  prompt?: string;
  /** Fixtures supply evidence directly (they have no event stream) and mark
   *  themselves so `itemSource` never claims a parse that didn't happen. */
  sourceEvidence?: SourceEvidence;
  isFixture?: boolean;
  /** Fixture override for retrieval scale; traces derive it from events. */
  rawResultCount?: number;
  rng?: Rng;
}

export interface ListPlanResult {
  passes: ThinkingPass[];
  meta: ListPlanMeta;
}

export function buildListPasses(input: ListPlanInput): ListPlanResult {
  const { events, requirements } = input;
  const rng = input.rng ?? STABLE_RNG;

  /* 1 — RESOLVE ITEMS FIRST. Narration is generated from the visible set,
     never the other way round. */
  const discoveryEntities = dedupeEntities(
    events.filter((e) => e.type === 'search').flatMap((e) => (e.entities ?? []).map(toNormalizedEntity))
  );
  const finalEntities = dedupeEntities(input.entities);

  // The final response is the same run's own curated list — richer and
  // already ordered — so it is the canonical set whenever it exists. The
  // discovery parse only matters for PROVENANCE: when it failed (the 2000-char
  // truncation case) the canvas is back-filled from the final entities and the
  // dev panel says so.
  const canonical = finalEntities.length ? finalEntities : discoveryEntities;
  const visible = canonical.slice(0, MAX_VISIBLE_LIST_ITEMS);
  const itemSource: ListPlanMeta['itemSource'] = input.isFixture
    ? 'fixture'
    : discoveryEntities.length >= Math.min(2, canonical.length)
      ? 'discovery'
      : 'final_response_backfill';

  const rawResultCount = input.rawResultCount ?? rawResultCountFrom(events) ?? 0;
  const noun = listNounPhrase(input.prompt, requirements);
  const themes = deriveListThemes(visible);

  const meta: ListPlanMeta = {
    rawResultCount: rawResultCount || undefined,
    resolvedListCount: canonical.length,
    visibleListCount: visible.length,
    narrationCount: visible.length,
    imagesAvailable: visible.filter((e) => !!e.image).length,
    itemSource,
    themeCount: themes.length,
  };

  const passes: ThinkingPass[] = [];

  /* 2 — ACKNOWLEDGE. */
  passes.push({
    id: 'list-acknowledge',
    visibility: 'status',
    narration: phrase(
      ["On it — seeing what's out there.", "Got it — let's see what's around.", 'On it — having a look around.'],
      rng
    ),
    confidence: 'high',
    ...T.acknowledge,
  });

  /* 3 — SOURCES. Same credibility rules as candidate ranking: breadth is only
     claimed over real, named sources; a maps-only trace says so; a single web
     source is not a beat. */
  const evidence = input.sourceEvidence ?? extractSourceEvidence(events, visible.map((e) => e.title ?? ''));
  if (evidence.sources.length === 1 && evidence.sources[0].kind === 'maps') {
    passes.push({
      id: 'list-sources',
      visibility: 'status',
      narration: phrase(["Scanning what's nearby on the map", 'Checking places nearby on the map', 'Looking at what maps has nearby'], rng),
      confidence: 'high',
      ...T.sources,
    });
  } else if (evidence.sources.length >= 2) {
    passes.push({
      id: 'list-sources',
      visibility: 'canvas_value',
      narration:
        evidence.sourceCount >= 4
          ? phrase(["Looking across a few sources", "Checking what's showing up across sources", 'Reading around this from a few angles'], rng)
          : phrase(['Cross-checking a couple of sources', 'Comparing notes across a couple of sources', 'Double-checking against another source'], rng),
      valueType: 'sources',
      payload: {
        sources: evidence.sources.map((s) => ({ label: s.label, kind: s.kind, domain: s.domain })),
        sourceCount: evidence.sourceCount,
        searchCount: evidence.searchCount,
      },
      sourceEventIds: events.filter((e) => e.type === 'retrieve').map((e) => e.id),
      confidence: 'high',
      ...T.sources,
    });
  }

  if (!visible.length) {
    // Nothing resolvable to show — narrate the work, claim no findings, and
    // let the final response carry the answer. Never a count over an empty
    // canvas.
    passes.push({
      id: 'list-empty',
      visibility: 'status',
      narration: phrase(['Pulling together what I found', 'Putting the set together', 'Gathering it up'], rng),
      confidence: 'high',
      ...T.complete,
    });
    return { passes, meta };
  }

  /* 4 — SCALE (optional). "109 results" is retrieval scale, not the finding.
     It is reported as scale — a status beat — and the display count belongs
     to the discovery claim that follows. */
  if (rawResultCount >= SCALE_MIN_RAW && rawResultCount >= visible.length * SCALE_MIN_RATIO) {
    const surfaced = phrase(
      [
        (n: number) => `${n} results surfaced — narrowing to what matters`,
        (n: number) => `${n} results surfaced — sorting through them`,
        (n: number) => `A lot is showing up — sifting through ${n} results`,
      ] as const,
      rng
    );
    passes.push({
      id: 'list-scale',
      visibility: 'status',
      narration: surfaced(rawResultCount),
      confidence: 'high',
      ...T.scale,
    });
  }

  /* 5 — FOUND. THE core beat: the narration count IS visible.length, and the
     pass carries the very items that prove it. No count payload, no second
     heading — the canvas is the second layer of communication. */
  const items = visible.map((e) => {
    const item = toProgressiveItem(e);
    const signal = trendSignalFor(e);
    return signal ? { ...item, metadata: { ...item.metadata, signal } } : item;
  });

  const n = visible.length;
  const foundNarration =
    n === 1
      ? phrase([`Found one ${noun.singular} worth a look`, `One ${noun.singular} keeps coming up`], rng)
      : noun.kind === 'trends'
        ? phrase(
            [
              `${n} ${noun.plural} are showing up right now`,
              `${n} ${noun.plural} keep showing up`,
              `Found ${n} ${noun.plural} showing up consistently`,
            ],
            rng
          )
        : noun.kind === 'todo'
          ? phrase([`Found ${n} ${noun.plural}`, `${n} ${noun.plural} are on`, `Turned up ${n} ${noun.plural}`], rng)
          : noun.kind === 'ideas'
            ? phrase([`Found ${n} ${noun.plural} worth trying`, `${n} ${noun.plural} worth trying`, `Turned up ${n} ${noun.plural} worth trying`], rng)
            : phrase(
                [`Found ${n} ${noun.plural} worth exploring`, `Found ${n} ${noun.plural} worth a look`, `${n} ${noun.plural} are worth a look`],
                rng
              );

  passes.push({
    id: 'list-found',
    visibility: 'canvas_value',
    narration: foundNarration,
    valueType: 'entity_preview',
    payload: {
      entities: visible,
      canvas: [{ type: 'ADD_ITEMS', items } as AgentMutation],
    },
    sourceEventIds: events.filter((e) => e.type === 'search').map((e) => e.id),
    confidence: itemSource === 'final_response_backfill' ? 'medium' : 'high',
    ...T.found,
  });

  /* 6 — THEMES (optional). The SAME items regroup under labels the data
     itself carries. No mutation: item state never changes, nothing recedes,
     nothing is shortlisted — grouping is this pass's payload alone. */
  if (themes.length) {
    const themeWord = themes.length === 2 ? 'Two' : themes.length === 3 ? 'Three' : `${themes.length}`;
    passes.push({
      id: 'list-themes',
      visibility: 'canvas_value',
      narration: phrase(
        [
          `${themeWord} themes keep repeating`,
          `${themeWord} directions keep coming up`,
          `The set is settling into ${themeWord.toLowerCase()} themes`,
        ],
        rng
      ),
      valueType: 'entity_preview',
      payload: { entities: visible, groups: themes },
      confidence: 'high',
      ...T.themes,
    });
  }

  /* 7 — COMPLETE. A settle beat, in the query's own language. The evidence
     stays exactly as it is — broad, nothing promoted. */
  passes.push({
    id: 'list-complete',
    visibility: 'status',
    narration:
      noun.kind === 'trends'
        ? phrase(["Here's what's trending right now.", "That's what's showing up right now.", "Here's what keeps coming up."], rng)
        : noun.kind === 'todo'
          ? phrase(["Here's what's on.", "That's what's happening.", 'A good spread to pick from.'], rng)
          : phrase(["Here's the set — worth exploring.", "That's a good set to explore.", "Here's the full spread."], rng),
    confidence: 'high',
    ...T.complete,
  });

  return { passes, meta };
}
