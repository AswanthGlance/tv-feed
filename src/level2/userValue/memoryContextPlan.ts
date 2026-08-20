import type { MemoryContext } from '../types/memory';
import type { ThinkingPass } from '../types/pass';
import { phrase, STABLE_RNG, type Rng } from './narrationVariety';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Memory / personal-context thinking pass.

   OPTIONAL, and FIRST when present. Never "Retrieving memory" / "Reading
   user profile" / "Fetching personalization context" / "Loading
   preferences" — those are backend terms. The narration says what the agent
   is doing FOR the user, in the language of this specific request.

   Domain buckets are deliberately generic (travel / dining / shopping /
   entertainment / a neutral fallback) rather than derived from the memory
   content itself — the real corpus has only ever produced a location fact
   (see MEMORY_RETRIEVAL_TRACE_FINDINGS.md), so the DOMAIN comes from what the
   user asked (`scenario.domain` / `turn.skills_selected`), never from
   guessing at a preference category no real trace has shown yet.
   ───────────────────────────────────────────────────────────────────────────── */

type DomainBucket = 'travel' | 'dining' | 'shopping' | 'entertainment' | 'general';

const DOMAIN_KEYWORDS: Array<{ bucket: DomainBucket; re: RegExp }> = [
  { bucket: 'travel', re: /travel|trip|trek|hike|stay|hotel|getaway|weekend|resort|itinerary/i },
  { bucket: 'dining', re: /food|restaurant|dining|cafe|eat|cuisine|dinner|lunch|breakfast/i },
  { bucket: 'shopping', re: /shop|product|fashion|wear|buy|store|apparel/i },
  { bucket: 'entertainment', re: /movie|show|music|concert|comedy|event|entertainment|game|watch/i },
];

function domainBucket(domain: string | undefined): DomainBucket {
  if (!domain) return 'general';
  const match = DOMAIN_KEYWORDS.find(({ re }) => re.test(domain));
  return match?.bucket ?? 'general';
}

const MEMORY_NARRATION: Record<DomainBucket, readonly [string, ...string[]]> = {
  travel: [
    'Keeping your usual travel preferences in mind',
    'Keeping your travel preferences in mind',
    "Starting with what you usually look for when traveling",
  ],
  dining: [
    'Keeping your usual dining preferences in mind',
    'Keeping your dining preferences in mind',
    'Starting with what you usually care about at a meal',
  ],
  shopping: [
    'Starting with the things you usually care about',
    'Keeping your usual preferences in mind',
    'Using what you usually look for',
  ],
  entertainment: [
    "Using what you've enjoyed before",
    'Keeping your usual preferences in mind',
    "Starting with what you usually enjoy",
  ],
  general: ['Keeping your preferences in mind', 'Starting with what matters to you', 'Using your usual preferences'],
};

/* Hold 1.5-2.5s per the brief; enter/exit match the other VALUE_TIMING beats
   elsewhere in Level 2 so this pass doesn't stand out rhythmically. */
const MEMORY_TIMING = { enterDuration: 700, holdDuration: 2000, exitDuration: 300 };

/** Builds the optional first pass. Returns undefined whenever memory isn't
 *  available OR has nothing relevant to show — the caller (fromTrace.ts)
 *  simply doesn't prepend anything in that case, so the flow starts at
 *  search/discovery exactly as it always has. */
export function buildMemoryContextPass(memoryContext: MemoryContext, domain: string | undefined, rng: Rng = STABLE_RNG): ThinkingPass | undefined {
  if (!memoryContext.available || !memoryContext.relevantSignals.length) return undefined;

  const bucket = domainBucket(domain);
  return {
    id: 'pass-0-memory-context',
    visibility: 'canvas_value',
    narration: phrase(MEMORY_NARRATION[bucket], rng),
    valueType: 'memory_signals',
    payload: { signals: memoryContext.relevantSignals },
    sourceSpanIds: memoryContext.sourceSpanIds,
    // "Recalled", not "just observed" — the confidence tier below anything
    // read fresh off a tool call this turn.
    confidence: 'medium',
    ...MEMORY_TIMING,
  };
}

/* ── RECALL → USE ─────────────────────────────────────────────────────────
   The pass immediately after memory must read as a continuation of it, not
   as an unrelated next step — "Keeping your travel preferences in mind" ->
   "Looking for escapes that fit that", never -> "Checking trending picks".
   Callers (fromTrace.ts for real traces, memoryRetrievalScenarios.ts for the
   dedicated Dev Mode demo) overwrite the narration of the first post-memory
   pass with this line; nothing else about that pass changes. Same domain
   buckets as the memory line itself, so the two always agree on subject. */
const FOLLOW_UP_NARRATION: Record<DomainBucket, readonly [string, ...string[]]> = {
  travel: ['Looking for escapes that fit that', 'Looking for stays that match that'],
  dining: ['Looking for dinner options around those preferences', 'Looking for places that fit'],
  shopping: ['Looking for options around what matters to you', 'Looking with that in mind'],
  entertainment: ['Finding something that matches your usual taste', 'Looking for something that fits that'],
  general: ['Looking for options that fit', 'Continuing with that in mind'],
};

export function memoryFollowUpNarration(domain: string | undefined, rng: Rng = STABLE_RNG): string {
  return phrase(FOLLOW_UP_NARRATION[domainBucket(domain)], rng);
}
