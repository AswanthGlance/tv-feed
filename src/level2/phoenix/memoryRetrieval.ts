import type { PhoenixSpan } from '../../types/phoenix';
import type { QueryRequirements } from '../types/query';
import type { MemoryContext, MemorySignal } from '../types/memory';
import { NO_MEMORY_CONTEXT } from '../types/memory';
import { normalizeString } from '../normalization/normalize';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Memory retrieval extraction.

   Reads the real `memory.retrieval` span (span_kind RETRIEVER, always the
   first child of `harness.turn` — verified across 613 real traces, see
   MEMORY_RETRIEVAL_TRACE_FINDINGS.md) and turns it into a MemoryContext.

   ONLY `retrieval.documents.N.document.content` is ever read as user-facing
   text. Everything else on the span — `document.id`, `memory.user_id`, and
   the `output.value` markdown block (which embeds internal
   `MemoryWrite(action=...)` tool instructions for the model, not for a
   viewer) — is backend bookkeeping and is never surfaced.

   MAXIMUM_VISIBLE caps at 3 per the task brief ("1-3 signals max, 4 only if
   extremely compact" — this module keeps to 3; a renderer is free to show
   fewer, never more).
   ───────────────────────────────────────────────────────────────────────────── */

const MAX_VISIBLE_SIGNALS = 3;

const DOCUMENT_CONTENT_RE = /^retrieval\.documents\.(\d+)\.document\.content$/;

interface RawMemoryDocument {
  content: string;
  category?: string;
}

function extractDocuments(attrs: Record<string, unknown>): RawMemoryDocument[] {
  const docs: RawMemoryDocument[] = [];
  for (const key of Object.keys(attrs)) {
    const m = key.match(DOCUMENT_CONTENT_RE);
    if (!m) continue;
    const content = normalizeString(attrs[key]);
    if (!content) continue;
    const category = normalizeString(attrs[`retrieval.documents.${m[1]}.document.metadata.category`]);
    docs.push({ content, category });
  }
  return docs;
}

/** A fact naming where the user is. The one real category observed in the
 *  corpus — see the findings doc. Broadly relevant to almost any local /
 *  "near me" request, which is most of what this app's prompts are, so it is
 *  the one type allowed to skip the generic overlap check below. */
const LOCATION_RE = /\b(?:located|based|lives?)\s+in\s+(.+?)\.?\s*$/i;

/** Turns one raw document's content into a short, consumer-safe signal.
 *  Never returns the raw sentence verbatim when a cleaner phrase can be
 *  derived from it; falls back to a trimmed, truncated version of the
 *  sentence itself otherwise — never a fabricated rewrite. */
function toSignal(doc: RawMemoryDocument): MemorySignal {
  const locationMatch = doc.content.match(LOCATION_RE);
  if (locationMatch) {
    return { type: 'location', label: locationMatch[1].trim() };
  }
  // Generic fallback: strip a leading "User is/has/likes/prefers " subject
  // clause when present, so the chip reads as a phrase, not a full sentence
  // restating "User". Never invents content beyond what was there.
  const stripped = doc.content.replace(/^user\s+(?:is|has|likes?|prefers?|wants?|enjoys?)\s+/i, '').replace(/\.$/, '').trim();
  const label = stripped || doc.content.trim();
  return { type: doc.category ?? 'preference', label: label.length > 42 ? `${label.slice(0, 41).trimEnd()}…` : label };
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'for', 'to', 'of', 'in', 'on', 'at', 'is', 'are', 'me', 'my', 'that', 'this',
  'find', 'best', 'near', 'tonight', 'weekend', 'return', 'include', 'what', 'each', 'makes', 'special', 'from',
  'with', 'your', 'you', 'continue', 'card', 'promise', 'shortlist', 'choosing', 'choose', 'helps', 'concise',
]);

function keywords(text: string | undefined): Set<string> {
  if (!text) return new Set();
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 4 && !STOPWORDS.has(w))
  );
}

/** Only show context that helps explain the current request. A location fact
 *  is broadly relevant (see LOCATION_RE above); anything else needs real
 *  word overlap with what the user actually asked for — no domain-specific
 *  category list is hard-coded here, because no domain beyond "location" has
 *  ever been observed in the real corpus (see the findings doc). This keeps
 *  the filter honest as richer memory content appears over time instead of
 *  guessing at categories today's data has never shown. */
function isRelevant(signal: MemorySignal, promptWords: Set<string>, requirements: QueryRequirements): boolean {
  if (signal.type === 'location') return true;
  const requirementWords = new Set([
    ...(requirements.entityType ? [requirements.entityType.toLowerCase()] : []),
    ...requirements.requestedAttributes.map((a) => a.toLowerCase()),
  ]);
  const signalWords = keywords(signal.label);
  for (const w of signalWords) {
    if (promptWords.has(w) || requirementWords.has(w)) return true;
  }
  return false;
}

export function extractMemoryContext(
  spans: PhoenixSpan[],
  prompt: string | undefined,
  requirements: QueryRequirements
): MemoryContext {
  const span = spans.find((s) => s.name === 'memory.retrieval');
  if (!span) return NO_MEMORY_CONTEXT;

  const attrs = span.attributes ?? {};
  const spanId = span.context?.span_id;
  const sourceSpanIds = spanId ? [spanId] : [];
  const hit = attrs['memory.hit'] === true;

  if (!hit) {
    return {
      available: false,
      sourceSpanIds,
      relevantSignals: [],
      diagnostics: { spanFound: true, hit: false, totalSignalsFound: 0, relevantSignalCount: 0, rendered: false, reason: 'no memory retrieved for this user' },
    };
  }

  const documents = extractDocuments(attrs as Record<string, unknown>);
  const allSignals = documents.map(toSignal);
  const promptWords = keywords(prompt);
  const relevantSignals = allSignals.filter((s) => isRelevant(s, promptWords, requirements)).slice(0, MAX_VISIBLE_SIGNALS);

  if (!relevantSignals.length) {
    return {
      available: false,
      sourceSpanIds,
      relevantSignals: [],
      diagnostics: {
        spanFound: true,
        hit: true,
        totalSignalsFound: allSignals.length,
        relevantSignalCount: 0,
        rendered: false,
        reason: 'no relevant consumer value for this request',
      },
    };
  }

  return {
    available: true,
    sourceSpanIds,
    relevantSignals,
    diagnostics: {
      spanFound: true,
      hit: true,
      totalSignalsFound: allSignals.length,
      relevantSignalCount: relevantSignals.length,
      rendered: true,
    },
  };
}
