import type { PhoenixSpan, PhoenixSpanListResponse, PhoenixTrace, PhoenixTraceListResponse } from '../types/phoenix';

/* Browser never talks to the internal Phoenix host directly — it goes through
   the Vite dev-server proxy configured in vite.config.ts (/api/phoenix/* ->
   VITE_PHOENIX_BASE_URL), so no internal hostname or credential ever reaches
   client code.

   Endpoint shapes here are verified against the real deployment's OpenAPI
   spec (phoenix-openapi.json at the project root — download fresh with
   `curl -L https://phoenix.ailooks.internal.glance.com/openapi.json -o
   phoenix-openapi.json`), not assumed from public Phoenix docs. */
const API_ROOT = '/api/phoenix';
export const PHOENIX_PROJECT = import.meta.env.VITE_PHOENIX_PROJECT || 'aitv-mewtwo-harness';

export class PhoenixApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'PhoenixApiError';
    this.status = status;
  }
}

async function getJson<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_ROOT}${path}`, { headers: { Accept: 'application/json' } });
  } catch (e) {
    throw new PhoenixApiError(`Network error reaching Phoenix proxy: ${(e as Error).message}`);
  }
  if (!res.ok) {
    let body = '';
    try { body = await res.text(); } catch { /* ignore */ }
    throw new PhoenixApiError(`Phoenix API ${res.status} ${res.statusText}${body ? `: ${body.slice(0, 300)}` : ''}`, res.status);
  }
  try {
    return (await res.json()) as T;
  } catch (e) {
    throw new PhoenixApiError(`Phoenix API returned invalid JSON: ${(e as Error).message}`);
  }
}

export interface ListTracesOptions {
  limit?: number;
  sort?: 'start_time' | 'latency_ms';
  order?: 'asc' | 'desc';
  cursor?: string;
}

/** GET /v1/projects/{project_identifier}/traces */
export async function listTraces(options: ListTracesOptions = {}): Promise<PhoenixTraceListResponse> {
  const params = new URLSearchParams();
  params.set('sort', options.sort ?? 'start_time');
  params.set('order', options.order ?? 'desc');
  params.set('limit', String(options.limit ?? 50));
  if (options.cursor) params.set('cursor', options.cursor);
  return getJson<PhoenixTraceListResponse>(`/v1/projects/${PHOENIX_PROJECT}/traces?${params.toString()}`);
}

export interface ListSpansOptions {
  traceId?: string;
  /** Span name(s) to filter to — e.g. 'harness.turn' for root turns only.
   *  Confirmed real param on GET /v1/projects/{id}/spans (spec: "Filter by
   *  span name(s)"). No sort/order param exists on this endpoint (unlike
   *  /traces) — results come back roughly-recent-first but not guaranteed
   *  strictly monotonic; treat as an unordered-ish batch to sample from. */
  name?: string;
  limit?: number;
  cursor?: string;
}

/** GET /v1/projects/{project_identifier}/spans — the general span lister.
 *  Filtering by `name=harness.turn` with no `traceId` pulls root spans
 *  across many traces in one call (each root span already carries
 *  input.value/output.value/turn.skills_selected in its own attributes),
 *  which is what trace discovery uses instead of an N+1 per-trace scan. */
export async function listSpans(options: ListSpansOptions = {}): Promise<PhoenixSpan[]> {
  const params = new URLSearchParams();
  if (options.traceId) params.set('trace_id', options.traceId);
  if (options.name) params.set('name', options.name);
  params.set('limit', String(options.limit ?? 1000));
  if (options.cursor) params.set('cursor', options.cursor);
  const res = await getJson<PhoenixSpanListResponse>(`/v1/projects/${PHOENIX_PROJECT}/spans?${params.toString()}`);
  return res.data ?? [];
}

export async function fetchSpansForTrace(traceId: string, limit = 1000): Promise<PhoenixSpan[]> {
  return listSpans({ traceId, limit });
}

/** Root turn spans (name=harness.turn) across many traces in one request —
 *  the pool that random scenario discovery samples from. */
export async function listRootTurnSpans(limit = 200): Promise<PhoenixSpan[]> {
  return listSpans({ name: 'harness.turn', limit });
}

export async function checkPhoenixConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    await listSpans({ name: 'harness.turn', limit: 1 });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export type { PhoenixTrace, PhoenixSpan };
