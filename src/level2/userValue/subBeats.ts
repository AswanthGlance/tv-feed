import type { SemanticAgentEvent } from '../../types/semanticEvent';
import { phrase, type Rng } from './narrationVariety';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Sub-beats within a single generic-path phase bucket.

   passBuilder.ts's generic phase builders (buildResearchPass, etc.) collapse
   an ENTIRE phase bucket into one pass — several real WebSearch calls become
   one "Reading up on it" beat. That is the right call when there is nothing
   real to distinguish between the calls, but wrong when the agent genuinely
   investigated different angles of the request (three WebSearch calls for
   three different facts about a recipe): collapsing those loses real,
   perceivable progress and — in Real Timing mode — turns several distinct
   real moments into one long static hold.

   This module answers ONE question: does this bucket's events contain enough
   REAL distinguishing signal to split into more than one consumer beat, and
   if so, what does each beat legitimately say? It never invents a topic — a
   beat's narration comes from the event's own real text_interim narration
   when present (already on `event.narration`), or otherwise from the real
   tool call's own input (a WebSearch query, a WebFetch url/prompt), with the
   words the whole bucket already shares (the subject everyone already knows,
   e.g. the dish name) stripped out so what remains is the actual delta.

   Genuinely simultaneous calls (same `metadata.parallelGroup`) are always
   grouped into ONE beat — parallel work reads as one "checking a few angles
   at once" moment, never serialized into N beats just to fill time.

   Returns undefined (never forces a split) when the bucket doesn't have at
   least two beats with a real, distinguishable topic — the caller keeps its
   existing single-pass behavior in that case.
   ───────────────────────────────────────────────────────────────────────────── */

export interface SubBeat {
  events: SemanticAgentEvent[];
  narration: string;
  isParallelGroup: boolean;
}

/** The generic fallback lines narrationFor() (streamToSemanticEvents.ts)
 *  hands out when a tool call carried no text_interim — recognizing these
 *  lets a sub-beat tell "this event has real, distinct narration" apart from
 *  "this event has no narration of its own, derive one from its input." */
export const GENERIC_FALLBACKS = new Set([
  'Searching for options',
  'Reading up on it',
  'Looking at ratings, reviews and details',
  'Checking travel times',
  'Checking conditions',
]);

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'for', 'to', 'of', 'in', 'on', 'with', 'near', 'me',
  'best', 'top', 'recipe', 'traditional', 'authentic', 'real', 'about', 'full', 'complete',
]);

function words(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/["'“”]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** Words present in EVERY query — the subject the whole bucket already
 *  established (a dish name repeated across every search), not worth saying
 *  again in each individual beat. */
function sharedWordSet(queries: string[]): Set<string> {
  if (queries.length < 2) return new Set();
  const counts = new Map<string, number>();
  for (const q of queries) {
    for (const w of new Set(words(q))) counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  const shared = new Set<string>();
  for (const [w, c] of counts) if (c >= queries.length) shared.add(w);
  return shared;
}

function distinctPhrase(query: string, shared: Set<string>): string {
  const kept = words(query).filter((w) => !shared.has(w) && !STOPWORDS.has(w) && w.length > 2);
  return kept.slice(0, 6).join(' ');
}

function hostnameOf(url: string): string | undefined {
  const m = url.match(/^https?:\/\/(?:www\.)?([^/]+)/i);
  return m?.[1];
}

/** Groups consecutive events sharing the same real parallelGroup id into one
 *  group; every other event is its own singleton group. Order preserved. */
function groupByParallel(events: SemanticAgentEvent[]): { events: SemanticAgentEvent[]; isParallelGroup: boolean }[] {
  const groups: { events: SemanticAgentEvent[]; isParallelGroup: boolean }[] = [];
  let i = 0;
  while (i < events.length) {
    const groupId = (events[i].metadata as Record<string, unknown> | undefined)?.parallelGroup;
    if (groupId == null) {
      groups.push({ events: [events[i]], isParallelGroup: false });
      i += 1;
      continue;
    }
    const run: SemanticAgentEvent[] = [];
    while (i < events.length && (events[i].metadata as Record<string, unknown> | undefined)?.parallelGroup === groupId) {
      run.push(events[i]);
      i += 1;
    }
    groups.push({ events: run, isParallelGroup: run.length > 1 });
  }
  return groups;
}

/** Search-style queries only ("Thavala Dosai crispy thick batter…") — real
 *  keyword-style text where word-level filtering reads naturally. A
 *  WebFetch's `prompt` is an LLM-to-tool extraction instruction in full
 *  sentences ("Extract the complete recipe including…"); filtering words out
 *  of a sentence produces disjointed word-salad, so that case is handled
 *  separately via the real URL's hostname instead (see deriveGroupTopic). */
function eventQueryText(event: SemanticAgentEvent): string | undefined {
  const input = event.input as Record<string, unknown> | undefined;
  return typeof input?.query === 'string' && input.query.trim() ? input.query : undefined;
}

const RESEARCH_VERBS = ['Checking', 'Looking into', 'Cross-checking', 'Digging into'] as const;
const SEARCH_VERBS = ['Checking', 'Looking into', 'Also checking'] as const;

/** Real, derived narration for one group — never a guess at what the agent
 *  was "really" doing, only what its own real narration/input says. Returns
 *  undefined when the group carries no usable real signal to distinguish it
 *  from its siblings. */
function deriveGroupTopic(group: { events: SemanticAgentEvent[]; isParallelGroup: boolean }, shared: Set<string>, rng: Rng): string | undefined {
  if (group.isParallelGroup) {
    return phrase(['Checking a few angles at once', 'Looking at this from a few angles', 'Running a few checks in parallel'], rng);
  }

  const event = group.events[0];

  // Real text_interim, when the stream carried one for this exact call —
  // already the strongest, most specific real signal available.
  if (!GENERIC_FALLBACKS.has(event.narration)) return event.narration;

  const query = eventQueryText(event);
  if (query) {
    const delta = distinctPhrase(query, shared);
    if (delta) {
      const verbs = event.type === 'retrieve' ? RESEARCH_VERBS : SEARCH_VERBS;
      return `${phrase(verbs, rng)} ${delta}`;
    }
  }

  const input = event.input as Record<string, unknown> | undefined;
  const url = typeof input?.url === 'string' ? input.url : undefined;
  const host = url ? hostnameOf(url) : undefined;
  if (host) return phrase([`Reading the details on ${host}`, `Checking what ${host} says`], rng);

  return undefined;
}

/** Splits a phase bucket's events into real sub-beats, or returns undefined
 *  when there isn't enough real distinguishing signal to justify it (never
 *  forces a split — a bucket with one real topic stays one pass). */
export function splitIntoSubBeats(events: SemanticAgentEvent[], rng: Rng): SubBeat[] | undefined {
  if (events.length < 2) return undefined;

  const groups = groupByParallel(events);
  if (groups.length < 2) return undefined;

  // Shared-subject detection reads across EVERY real query in the bucket,
  // including the ones inside a merged parallel beat — two of three real
  // WebSearch calls being simultaneous doesn't make their shared words (the
  // dish name every query repeats) any less shared.
  const queries = events.map(eventQueryText).filter((q): q is string => !!q);
  const shared = sharedWordSet(queries);

  const topics = groups.map((g) => deriveGroupTopic(g, shared, rng));
  const distinctTopics = new Set(topics.filter((t): t is string => !!t));
  // Eligible only when there's real signal AND it actually distinguishes at
  // least two beats from each other — a bucket where every derived topic
  // collapses to the same phrase gets no benefit from splitting.
  if (distinctTopics.size < 2) return undefined;

  return groups.map((g, i) => ({
    events: g.events,
    isParallelGroup: g.isParallelGroup,
    narration: topics[i] ?? deriveGroupTopic(g, shared, rng) ?? g.events[0].narration,
  }));
}
