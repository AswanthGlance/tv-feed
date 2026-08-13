import type { ClassificationConfidence, ScenarioArchetype } from '../types/archetype';

/* Shape of the generated corpus index (src/level2/scenarios/corpusIndex.ts).
   Kept in a hand-written file so the generated one stays pure data and the
   contract between the sweep script and the app is explicit. */

export interface CorpusTraceRef {
  traceId: string;
  prompt: string;
  domain: string;
  confidence: ClassificationConfidence;
  entityCount: number;
  hasImages: boolean;
  outputShape?: string;
}

export interface CorpusIndex {
  version: number;
  generatedAt: string;
  project: string;
  tracesInspected: number;
  pools: Record<ScenarioArchetype, CorpusTraceRef[]>;
}
