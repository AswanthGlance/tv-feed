/* ─────────────────────────────────────────────────────────────────────────────
   Normalized intermediate shape for tool/search output. Adapters parse raw
   Phoenix tool.output payloads (JSON object, JSON string, doubly-encoded
   string, or plain prose) into this shape via src/utils/resultNormalizer.ts
   BEFORE any of it reaches a card component — raw payloads must never be
   passed straight into UI-facing evidence.
   ───────────────────────────────────────────────────────────────────────────── */

export type NormalizedEvidenceType =
  | 'preference'
  | 'web_result'
  | 'place'
  | 'recipe'
  | 'product'
  | 'media'
  | 'summary'
  | 'generic';

export interface NormalizedEvidence {
  id: string;
  type: NormalizedEvidenceType;
  title?: string;
  subtitle?: string;
  description?: string;
  image?: string;
  source?: string;
  url?: string;
  rating?: number;
  reviewCount?: number;
  tags?: string[];
  raw?: unknown;
}
