import type { NonEntityBlock, NormalizedEntity } from './entity';
import type { AvailabilityPayload, ComparisonSignalPayload, RoutePayload } from './pass';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Final response model.

   The final response is NOT "the thinking, but finished". It is a different,
   richer artifact: complete, opinionated where the data supports an opinion,
   stable, and actionable. Thinking gives partial context while the answer
   evolves; this is the answer.

   Presentation-neutral by contract — no JSX, no styling, no layout hints.
   Renderers are resolved from `kind` (see types/renderer.ts).
   ───────────────────────────────────────────────────────────────────────────── */

export interface SourceRef {
  label: string;
  url?: string;
}

export interface ActionRef {
  label: string;
  url?: string;
  /** 'book', 'directions', 'call', 'open' — a hint about the KIND of action,
   *  not its appearance. */
  intent?: string;
}

export interface FactRow {
  label: string;
  value: string;
}

interface FinalResponseBase {
  /** Short opinionated line the viewer reads first. */
  headline: string;
  /** Optional one-paragraph framing under the headline. */
  summary?: string;
  followUps?: string[];
  sources?: SourceRef[];
  /** Real content the agent emitted that isn't a comparable candidate
   *  (booking tips, caveats, group-size notes). Shown as supporting
   *  information, never ranked against entities. */
  supporting?: NonEntityBlock[];
}

export interface FinalTextResponse extends FinalResponseBase {
  kind: 'text';
  /** Paragraphs, in order. */
  body: string[];
}

export interface FinalEntityResponse extends FinalResponseBase {
  kind: 'entity';
  entity: NormalizedEntity;
  facts: FactRow[];
  actions?: ActionRef[];
}

export interface FinalEntityRailResponse extends FinalResponseBase {
  kind: 'entity_rail';
  entities: NormalizedEntity[];
  /** Only set when the trace itself distinguished a winner. A rail without a
   *  winner is a legitimate, honest outcome — never invent one. */
  winnerId?: string;
  winnerRationale?: string;
  actions?: Record<string, ActionRef[]>;
}

export interface FinalComparisonResponse extends FinalResponseBase {
  kind: 'comparison';
  comparison: ComparisonSignalPayload;
  /** The agent's own call, when it made one. */
  verdict?: string;
  verdictSubjectId?: string;
  entities?: NormalizedEntity[];
}

export interface FinalRouteResponse extends FinalResponseBase {
  kind: 'route';
  route: RoutePayload;
  notes?: string[];
}

export interface FinalStructuredResponse extends FinalResponseBase {
  kind: 'structured';
  /** A renderer-neutral table. Rows are aligned to `columns` by index. */
  columns: string[];
  rows: string[][];
  /** Optional grouped form for schedules/slot data where a flat table is a
   *  poor fit. */
  availability?: AvailabilityPayload;
}

export interface FinalListResponse extends FinalResponseBase {
  kind: 'list';
  items: NormalizedEntity[];
  /** Deliberately no winner field. A list archetype means the trace gave no
   *  meaningful ranking — the renderer must not promote anything. */
}

export interface FinalSummaryResponse extends FinalResponseBase {
  kind: 'summary';
  takeaways: string[];
  themes?: Array<{ label: string; detail?: string; sourceCount?: number }>;
}

/** Multiple strong output forms in one answer (entities + route +
 *  availability). Each section keeps its own model rather than being flattened
 *  into a lowest-common-denominator shape. */
export interface FinalHybridResponse extends FinalResponseBase {
  kind: 'hybrid';
  sections: Array<{ title?: string; response: FinalResponseModel }>;
}

export type FinalResponseModel =
  | FinalTextResponse
  | FinalEntityResponse
  | FinalEntityRailResponse
  | FinalComparisonResponse
  | FinalRouteResponse
  | FinalStructuredResponse
  | FinalListResponse
  | FinalSummaryResponse
  | FinalHybridResponse;

export type FinalResponseKind = FinalResponseModel['kind'];
