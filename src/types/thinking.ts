/* ─────────────────────────────────────────────────────────────────────────────
   Consumer-facing domain model. Built from PhoenixTrace/PhoenixSpan by the
   adapters in src/adapters/*, never referenced directly by raw Phoenix shapes.
   ───────────────────────────────────────────────────────────────────────────── */

export type ThinkingStepStatus = 'pending' | 'active' | 'complete' | 'error';

export type ThinkingStepType =
  | 'understanding'
  | 'searching'
  | 'retrieving'
  | 'checking'
  | 'comparing'
  | 'ranking'
  | 'generating'
  | 'tool'
  | 'guardrail';

export type ThinkingEvidenceType =
  | 'place'
  | 'product'
  | 'image'
  | 'text'
  | 'result'
  | 'unknown';

export interface ThinkingEvidence {
  id: string;
  type: ThinkingEvidenceType;
  /** Google Places place_id, when the source data had one — lets the UI
   *  fetch real photos/details via the Google Places proxy. */
  placeId?: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  image?: string;
  rating?: number;
  reviewCount?: number;
  distance?: string;
  travelTime?: string;
  description?: string;
  url?: string;
  phone?: string;
  raw?: unknown;
}

export interface ThinkingStep {
  id: string;
  label: string;
  type: ThinkingStepType;
  status: ThinkingStepStatus;
  sourceSpanIds: string[];
  startTime: number;
  endTime: number;
  activeHeadline?: string;
  evidence: ThinkingEvidence[];
  technical?: {
    spanKinds: string[];
    spanNames: string[];
  };
}

export interface ThinkingScenario {
  traceId: string;
  request?: string;
  response?: string;
  skill?: string;
  startTime: number;
  endTime: number;
  steps: ThinkingStep[];
  spanCount: number;
  toolCallCount?: number;
}

export type DataSource = 'phoenix-live' | 'phoenix-cached' | 'demo-presentation' | 'unavailable';
