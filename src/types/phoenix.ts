/* ─────────────────────────────────────────────────────────────────────────────
   Raw Phoenix API types — aitv-mewtwo-harness project.

   Verified against the live server on 2026-08-11 (GET /v1/projects/.../traces
   and /v1/projects/.../spans). Do not extend these speculatively — if a field
   isn't confirmed in a real payload, treat it as optional/unknown.

   Observed span_kind values: CHAIN, LLM, RETRIEVER, TOOL.
   Observed span names: harness.turn, llm.call, memory.retrieval,
   tool.PlaceSearch, tool.PlaceReviews, tool.PlaceDetails, tool.GetRoute,
   tool.GetWeather, tool.WebSearch, tool.WebFetch, tool.VTONGenerate,
   visual.resolve.
   ───────────────────────────────────────────────────────────────────────────── */

export interface PhoenixTrace {
  id: string;
  trace_id: string;
  project_id: string;
  start_time: string;
  end_time: string;
  token_count_prompt?: number;
  token_count_completion?: number;
  token_count_total?: number;
}

export interface PhoenixTraceListResponse {
  data: PhoenixTrace[];
  next_cursor?: string | null;
}

export interface PhoenixSpanEvent {
  name: string;
  timestamp: string;
  attributes?: Record<string, unknown>;
}

export interface PhoenixSpanContext {
  trace_id: string;
  span_id: string;
}

export interface PhoenixSpan {
  id?: string;
  name: string;
  span_kind: string;
  context: PhoenixSpanContext;
  parent_id?: string | null;
  start_time: string;
  end_time: string;
  status_code: string;
  status_message?: string;
  attributes?: Record<string, unknown>;
  events?: PhoenixSpanEvent[];
}

export interface PhoenixSpanListResponse {
  data: PhoenixSpan[];
  next_cursor?: string | null;
}
