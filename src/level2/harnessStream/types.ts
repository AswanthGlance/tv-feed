/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Harness stream event types.

   The raw shape of the harness's own turn-event stream — the same event
   format `glancetv-helix` forwards live over SSE to real clients today,
   captured here via `POST /internal/v1/turns` + `XRANGE` on the per-turn
   Redis stream (see the capture's own README). This is a REPLAY transport
   today (a saved JSON array) and a LIVE transport later (a buffered SSE
   subscription) — `HarnessTurnEventSource` is the one shape both must
   produce, so nothing downstream of it (streamToSemanticEvents.ts and
   everything after) needs to know which transport supplied it.

   This is this source's analogue of `types/phoenix.ts`'s `PhoenixSpan` — the
   only file allowed to know this raw shape exists. Everything downstream
   works on `SemanticAgentEvent` (see types/semanticEvent.ts), exactly as it
   already does for Phoenix.
   ───────────────────────────────────────────────────────────────────────────── */

export interface HarnessInsightEvent {
  type: 'insight';
  subtype: string;
  label?: string;
  detail?: string;
  ts?: number;
}

export interface HarnessSystemEvent {
  type: 'system';
  subtype: string;
  text?: string;
  token_count?: number;
  threshold?: number;
  input_tokens?: number;
  output_tokens?: number;
}

export interface HarnessReasoningEvent {
  type: 'reasoning';
  text: string;
}

export interface HarnessTextInterimEvent {
  type: 'text_interim';
  text: string;
  step_id?: number;
  names?: string[];
}

export interface HarnessToolUseEvent {
  type: 'tool_use';
  name: string;
  input: Record<string, unknown>;
  tool_use_id: string;
}

export interface HarnessToolResultEvent {
  type: 'tool_result';
  name: string;
  text: string;
  tool_use_id: string;
  is_error?: boolean;
}

export interface HarnessParallelBatchEvent {
  type: 'parallel_batch';
  count: number;
  names: string[];
}

/** Already-clean structured blocks — no XML/regex scraping needed, unlike
 *  Phoenix's `output.value`. Shapes observed: 'text', 'product_picks',
 *  'place_card', 'card_template', 'suggestions'. Kept loose (not a
 *  discriminated union per block type) because unrecognised block types must
 *  degrade — never throw — the same way an unrecognised Phoenix tool does. */
export interface HarnessTextFinalBlock {
  type: string;
  [key: string]: unknown;
}

export interface HarnessTextFinalEvent {
  type: 'text_final' | 'text_replace';
  blocks: HarnessTextFinalBlock[];
}

export interface HarnessTurnCompleteEvent {
  type: 'turn_complete';
  turn_id?: string;
  input_tokens?: number;
  output_tokens?: number;
  latency_ms?: number;
  agent_steps?: number;
  tool_call_count?: number;
  skills_loaded?: string[];
}

export interface HarnessStructuralEvent {
  type: 'turn_started' | 'stream_request_start' | '[DONE]';
}

/** A handful of event shapes exist in real captures that carry no consumer or
 *  timing meaning at all (`text_interim`/`text_final` payload streaming
 *  variants not yet observed, etc.) — kept as a catch-all so an unrecognised
 *  event degrades to 'internal' rather than crashing the adapter. */
export interface HarnessUnknownEvent {
  type: string;
  [key: string]: unknown;
}

export type HarnessStreamEvent =
  | HarnessInsightEvent
  | HarnessSystemEvent
  | HarnessReasoningEvent
  | HarnessTextInterimEvent
  | HarnessToolUseEvent
  | HarnessToolResultEvent
  | HarnessParallelBatchEvent
  | HarnessTextFinalEvent
  | HarnessTurnCompleteEvent
  | HarnessStructuralEvent
  | HarnessUnknownEvent;

/** The one shape every transport must produce. `prompt` is carried alongside
 *  the events rather than parsed out of them — real captures do not include
 *  the human query as its own event, it is known from the request that
 *  started the turn (see the capture README's per-query documentation). */
export interface HarnessTurnEventSource {
  turnId: string;
  prompt: string;
  events: HarnessStreamEvent[];
}
