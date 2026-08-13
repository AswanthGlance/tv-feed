import { normalizeString } from '../normalization/normalize';
import { EMPTY_QUERY_REQUIREMENTS, type QueryRequirements } from '../types/query';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Query requirement extraction.

   Purpose: prioritize USER VALUE. If the prompt asked for price per person,
   a price signal arriving mid-flight is worth showing; if it asked for a
   route, a price signal is noise. Everything downstream (visibility
   classification, pass ordering, which final fields lead) consults this.

   Deliberately lexical, not model-driven: it runs on every trace in a
   1000-trace corpus sweep and must be cheap, deterministic and offline.
   Unmatched phrasing produces fewer requirements, never a wrong guess.
   ───────────────────────────────────────────────────────────────────────────── */

interface AttributeRule {
  key: string;
  patterns: RegExp[];
}

const ATTRIBUTE_RULES: AttributeRule[] = [
  { key: 'rating', patterns: [/\bratings?\b/i, /\breviews?\b/i, /\btop[-\s]?rated\b/i, /\bstars?\b/i] },
  { key: 'price', patterns: [/\bpric(e|ing)\b/i, /\bcost\b/i, /\bper person\b/i, /\bbudget\b/i, /₹|\$|\bfees?\b/i, /\bhow much\b/i] },
  { key: 'location', patterns: [/\blocality\b/i, /\blocation\b/i, /\baddress\b/i, /\bneighbou?rhood\b/i, /\bnear me\b/i, /\bwhere\b/i] },
  { key: 'availability', patterns: [/\btimings?\b/i, /\bslots?\b/i, /\bschedule\b/i, /\bavailability\b/i, /\bopen(ing)?\s+hours?\b/i, /\btonight\b/i, /\bthis weekend\b/i, /\bavailable\b/i] },
  { key: 'duration', patterns: [/\bduration\b/i, /\bhow long\b/i, /\blength\b/i, /\bhours? long\b/i] },
  { key: 'distance', patterns: [/\bdistance\b/i, /\btravel time\b/i, /\bhow far\b/i, /\beta\b/i, /\bdrive time\b/i] },
  { key: 'group_size', patterns: [/\bgroup size\b/i, /\bcapacity\b/i, /\bhow many people\b/i, /\bfor groups?\b/i] },
  { key: 'booking', patterns: [/\bbooking\b/i, /\bbook\b/i, /\breserv(e|ation)\b/i, /\btickets?\b/i] },
  { key: 'category', patterns: [/\bcuisine\b/i, /\btheme\b/i, /\bstyle\b/i, /\bdifficulty\b/i, /\btype of\b/i, /\bgenre\b/i] },
  { key: 'rationale', patterns: [/\bknown for\b/i, /\bwhat makes\b/i, /\bwhy\b/i, /\bspecial\b/i, /\bunique\b/i, /\bhighlights?\b/i] },
  { key: 'season', patterns: [/\bbest seasons?\b/i, /\bwhen to\b/i, /\bweather\b/i] },
  { key: 'image', patterns: [/\bphotos?\b/i, /\bimages?\b/i, /\bpictures?\b/i] },
];

const RANKING_PATTERNS = [
  /\bbest\b/i,
  /\btop[-\s]?rated\b/i,
  /\btop\s+\d+\b/i,
  /\bshortlist\b/i,
  /\brank(ed|ing)?\b/i,
  /\brecommend\b/i,
  /\bchoosing one\b/i,
  /\bpick\b/i,
  /\bstrongest\b/i,
  /\bwhich (one )?should i\b/i,
];

const COMPARISON_PATTERNS = [
  /\bcompare\b/i,
  /\bcomparison\b/i,
  /\bvs\.?\b/i,
  /\bversus\b/i,
  /\bdifference between\b/i,
  /\bwhich is better\b/i,
  /\bside by side\b/i,
  /\bagainst each other\b/i,
];

const ROUTE_PATTERNS = [
  /\broutes?\b/i,
  /\bdirections?\b/i,
  /\bitinerary\b/i,
  /\bhow (do|can) i get\b/i,
  /\bstops?\b/i,
  /\bdrive\b/i,
  /\broad trip\b/i,
  /\bnavigate\b/i,
  /\bgetting there\b/i,
];

const LIST_PATTERNS = [/\blist\b/i, /\boptions?\b/i, /\bshow me\b/i, /\bfind\b/i, /\bideas?\b/i, /\bsuggest\b/i];

const EXPLANATION_PATTERNS = [
  /\bexplain\b/i,
  /\bwhat is\b/i,
  /\bwhat are\b/i,
  /\bhow does\b/i,
  /\btell me about\b/i,
  /\bsummar(y|ise|ize)\b/i,
  /\boverview\b/i,
  /\bwhy (is|are|does)\b/i,
];

/** 'Include venue name, locality, ...' is the harness's own house style and
 *  is by far the most reliable entity-type signal in the corpus. Falls back
 *  to the head noun after a find/show verb. */
const INCLUDE_NOUN_RE = /\binclude\s+(?:the\s+)?([a-z]{3,20})\s+names?\b/i;
/* Hyphens are inside the word class and the window is three words wide, so
   'find the best beginner-friendly Himalayan treks' yields 'trek' and not
   'beginner' — the head noun is the last word, and a hyphenated adjective
   must not truncate the match before reaching it. */
const FIND_NOUN_RE = /\b(?:find|show me|looking for|recommend)\s+(?:me\s+)?(?:the\s+)?(?:best|top[-\s]?rated|top\s+\d+\s+)?((?:[a-z][a-z-]*\s+){0,3}[a-z]{3,20})\b/i;

const STOPWORD_NOUNS = new Set([
  'some', 'more', 'good', 'great', 'nice', 'other', 'a', 'an', 'the', 'my', 'your', 'similar', 'top', 'best', 'near',
  'new', 'local', 'popular', 'affordable', 'cheap', 'quick', 'easy',
]);

function matchAny(text: string, patterns: RegExp[], matched: string[]): boolean {
  let hit = false;
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      hit = true;
      if (!matched.includes(m[0].toLowerCase())) matched.push(m[0].toLowerCase());
    }
  }
  return hit;
}

/** Words that end the noun phrase. 'the best red sneakers under ₹3000' must
 *  yield 'sneaker', not 'under' — the phrase stops at the preposition. */
const PHRASE_BOUNDARY = new Set([
  'under', 'over', 'below', 'above', 'near', 'in', 'at', 'on', 'for', 'with',
  'within', 'around', 'that', 'which', 'to', 'from', 'by', 'and', 'or', 'about',
]);

function extractEntityType(text: string): string | undefined {
  const inc = text.match(INCLUDE_NOUN_RE);
  if (inc) return inc[1].toLowerCase();

  const find = text.match(FIND_NOUN_RE);
  if (find) {
    const raw = find[1].trim().split(/\s+/);
    // Cut at the first boundary word, THEN drop adjectives — order matters:
    // filtering first would let a word after the boundary become the head.
    const boundary = raw.findIndex((w) => PHRASE_BOUNDARY.has(w.toLowerCase()));
    const phrase = boundary === -1 ? raw : raw.slice(0, boundary);
    const words = phrase.filter((w) => !STOPWORD_NOUNS.has(w.toLowerCase()));
    const head = words[words.length - 1];
    if (head && head.length >= 3) return head.toLowerCase().replace(/s$/, '');
  }
  return undefined;
}

export function extractQueryRequirements(prompt: string | undefined): QueryRequirements {
  const text = normalizeString(prompt);
  if (!text) return { ...EMPTY_QUERY_REQUIREMENTS, requestedAttributes: [], matchedPhrases: [] };

  const matchedPhrases: string[] = [];
  const requestedAttributes: string[] = [];

  for (const rule of ATTRIBUTE_RULES) {
    if (matchAny(text, rule.patterns, matchedPhrases)) requestedAttributes.push(rule.key);
  }

  const rankingIntent = matchAny(text, RANKING_PATTERNS, matchedPhrases);
  const comparisonIntent = matchAny(text, COMPARISON_PATTERNS, matchedPhrases);
  const routeIntent = matchAny(text, ROUTE_PATTERNS, matchedPhrases);
  const explanationIntent = matchAny(text, EXPLANATION_PATTERNS, matchedPhrases);
  // A list intent is only meaningful when the prompt did NOT ask for a
  // ranked/best answer — 'find the best X' is a ranking request that happens
  // to contain a list verb, not a list request.
  const listIntent = matchAny(text, LIST_PATTERNS, matchedPhrases) && !rankingIntent;

  return {
    entityType: extractEntityType(text),
    requestedAttributes,
    comparisonIntent,
    rankingIntent,
    routeIntent,
    listIntent,
    explanationIntent,
    matchedPhrases,
  };
}
