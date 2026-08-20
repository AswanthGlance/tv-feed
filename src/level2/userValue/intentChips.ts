import type { QueryRequirements } from '../types/query';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Intent chips for the acknowledgement beat.

   The very first thing on screen must never be an empty canvas under
   narration like "Got it — let's see what's around." — but it also must
   never repeat the full prompt (that's not "I understood you," that's an
   echo). This extracts 2-5 SHORT chips from the REAL prompt + the already-
   extracted QueryRequirements — never invented, never a summary the model
   didn't actually establish.

   The strongest signal is a Titlecase phrase already in the user's own
   words — "Thavala Dosai", "Rawla Narlai", "Matcha Cheese Cloud" — which is
   usually the actual subject of the request. Everything else (entity type,
   "near me", ranking/comparison/route intent, requested attributes) comes
   directly off QueryRequirements, which the classifier already computed
   from the same real prompt.
   ───────────────────────────────────────────────────────────────────────────── */

const MAX_CHIPS = 5;

/** Two or more consecutive Titlecase words — "Thavala Dosai", "Hoi An
 *  Ancient Town". Real proper-noun-shaped subjects, not a generic NLP
 *  extraction — deliberately conservative so it never invents a subject a
 *  lowercase prompt didn't actually name. */
const TITLECASE_RUN_RE = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/g;

/** Sentence-initial imperative verbs ("Find Lucknowi Biryani…") are
 *  capitalized purely by English convention, not because they're part of
 *  the subject — stripped off the front of a matched run so "Find Lucknowi
 *  Biryani" becomes "Lucknowi Biryani". */
const LEADING_VERBS = new Set([
  'find', 'show', 'get', 'give', 'help', 'build', 'check', 'tell', 'plan', 'make', 'search', 'looking', 'continue', 'start',
]);

function extractSubjectPhrase(prompt: string): string | undefined {
  const matches = [...prompt.matchAll(TITLECASE_RUN_RE)].map((m) => m[1]);
  if (!matches.length) return undefined;
  // Longest run first — the more words agree on being capitalized, the more
  // likely it's a real proper-noun subject rather than an incidental
  // sentence-initial capital.
  const best = [...matches].sort((a, b) => b.length - a.length)[0];
  const words = best.split(/\s+/);
  if (words.length > 1 && LEADING_VERBS.has(words[0].toLowerCase())) {
    const rest = words.slice(1).join(' ');
    return rest || undefined;
  }
  return best;
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'for', 'to', 'of', 'in', 'on', 'with', 'near', 'me', 'you', 'is', 'are', 'do', 'does',
  'i', 'my', 'that', 'what', 'best', 'top', 'find', 'show', 'get', 'give', 'help', 'build', 'check', 'tell', 'plan',
  'make', 'search', 'looking', 'continue', 'start', 'something', 'new', 'directly', 'not', 'ask', 'questions', 'please',
  'want', 'need', 'can', 'could', 'would', 'this', 'these', 'those', 'full', 'complete', 'real', 'actual', 'want',
]);

/** Last-resort real signal for a prompt with no proper-noun subject and no
 *  entityType extraction hit ("show backpacks for school for male and
 *  female") — the prompt's own significant content words, in the order the
 *  user wrote them. Never fabricated; just what's actually there once verbs
 *  and function words are stripped. */
function extractContentWords(prompt: string, max: number): string[] {
  const words = prompt
    .replace(/[?!.,]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w.toLowerCase()));
  const out: string[] = [];
  const seen = new Set<string>();
  for (const w of words) {
    const key = w.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    if (out.length >= max) break;
  }
  return out;
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

const ATTRIBUTE_LABEL: Record<string, string> = {
  rating: 'Ratings',
  price: 'Price',
  availability: 'Timings',
  location: 'Location',
  duration: 'Duration',
};

/** Up to 5 short chips, never a paraphrase of the whole prompt. Order is
 *  most-specific-first: the real subject phrase leads, generic signals
 *  (near me, ranking, attributes) trail. May return fewer than 2 for a
 *  prompt with genuinely little to extract — never padded with an
 *  unearned chip just to hit a quota. */
export function extractIntentChips(prompt: string | undefined, requirements: QueryRequirements): string[] {
  const text = prompt ?? '';
  const chips: string[] = [];

  const subject = extractSubjectPhrase(text);
  if (subject) chips.push(subject);

  if (requirements.entityType && !(subject && subject.toLowerCase().includes(requirements.entityType.toLowerCase()))) {
    chips.push(capitalize(requirements.entityType));
  }

  // No proper-noun subject AND no extracted entity type — the prompt's own
  // content words are the only real signal left. Never invented.
  if (!subject && !requirements.entityType) {
    chips.push(...extractContentWords(text, 2));
  }

  if (/\bnear\s*(me|by|you)\b/i.test(text)) chips.push('Near me');
  if (requirements.rankingIntent) chips.push('Highly rated');
  if (requirements.comparisonIntent) chips.push('Comparing options');
  if (requirements.routeIntent) chips.push('Directions');
  if (requirements.listIntent) chips.push('Multiple options');

  for (const attr of requirements.requestedAttributes) {
    const label = ATTRIBUTE_LABEL[attr];
    if (label) chips.push(label);
  }

  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of chips) {
    const key = c.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
    if (out.length >= MAX_CHIPS) break;
  }
  return out;
}
