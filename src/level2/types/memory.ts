/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Memory / personal-context model.

   See MEMORY_RETRIEVAL_TRACE_FINDINGS.md for what the real `memory.retrieval`
   span actually contains. In short: it is real (present on ~89% of traces),
   it always runs first, and its `retrieval.documents[].document.content`
   field is the only part ever safe to read — everything else on the span
   (a document id, a truncated user id, internal `MemoryWrite(...)` tool
   instructions embedded in `output.value`) is backend bookkeeping and must
   never reach this model, let alone the UI.

   `MemorySignal` is deliberately thin: a short, already-safe phrase, never a
   raw payload, a score, or an id. `confidence` stays optional because the
   real span carries no per-document confidence number — it is never
   fabricated to fill the field.
   ───────────────────────────────────────────────────────────────────────────── */

export interface MemorySignal {
  /** A coarse, derived tag ('location', 'preference', …) — never the raw
   *  backend category string verbatim if that string itself would read as
   *  technical. Used only to pick an icon/grouping, never shown as text. */
  type: string;
  /** The short, consumer-safe phrase — 'Bengaluru, Karnataka', not the full
   *  sentence it was derived from and never a raw document id. */
  label: string;
  /** Optional secondary detail, when the source content had one worth
   *  keeping separate from the label. */
  value?: string;
  /** Only ever set from a real number the source data carried. Absent (not
   *  0, not guessed) when no such number exists — which is every real
   *  document observed so far (see the findings doc). */
  confidence?: number;
}

export interface MemoryContext {
  /** True only when a memory.retrieval span was found, it reported a hit,
   *  AND at least one signal survived the relevance filter. This is the
   *  single gate the UI needs — everything else here is provenance/dev info. */
  available: boolean;
  sourceSpanIds: string[];
  /** Already filtered for relevance to the current prompt and capped for TV
   *  display (max 3, see relevance.ts). Ready to hand to a renderer as-is. */
  relevantSignals: MemorySignal[];
  /** Developer-diagnostics only — never rendered in consumer UI. Answers
   *  "was memory detected, and why did/didn't it show." */
  diagnostics: {
    spanFound: boolean;
    hit: boolean;
    totalSignalsFound: number;
    relevantSignalCount: number;
    rendered: boolean;
    reason?: string;
  };
}

export const NO_MEMORY_CONTEXT: MemoryContext = {
  available: false,
  sourceSpanIds: [],
  relevantSignals: [],
  diagnostics: {
    spanFound: false,
    hit: false,
    totalSignalsFound: 0,
    relevantSignalCount: 0,
    rendered: false,
    reason: 'no memory.retrieval span on this trace',
  },
};
