import type { TraceSummary } from '../classification/scenarioClassifier';
import { serializeFinalEnvelope } from './serializeFinalEnvelope';
import type {
  HarnessInsightEvent,
  HarnessTextFinalBlock,
  HarnessTextFinalEvent,
  HarnessToolUseEvent,
  HarnessTurnEventSource,
} from './types';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Harness stream -> TraceSummary.

   Builds the SAME Phoenix-neutral TraceSummary classifyTraceScenario already
   takes (see scenarioClassifier.ts — 'no Phoenix types in the signature,
   which is also what makes it testable against hand-written fixtures'), so
   the real classifier runs completely unchanged for this source. Only
   `output` needs real construction work (serializeFinalEnvelope) — everything
   else reads directly off the stream's own events.
   ───────────────────────────────────────────────────────────────────────────── */

export function buildTraceSummary(turn: HarnessTurnEventSource): TraceSummary {
  const toolSequence: string[] = [];
  const skills = new Set<string>();
  let toolCallCount = 0;
  let latencyMs: number | undefined;
  let finalBlocks: HarnessTextFinalBlock[] | undefined;

  for (const event of turn.events) {
    // HarnessUnknownEvent's deliberately loose `type: string` catch-all (see
    // types.ts) keeps TypeScript from narrowing HarnessStreamEvent purely by
    // `event.type === '…'` equality — each runtime check below already
    // proves the real shape, so the cast alongside it is safe.
    if (event.type === 'tool_use') {
      const e = event as HarnessToolUseEvent;
      toolSequence.push(e.name);
      toolCallCount += 1;
    }
    if (event.type === 'insight') {
      const e = event as HarnessInsightEvent;
      if (e.subtype === 'skills_loaded' && e.detail) {
        // Real shape: 'default, fashion, travel' — matches
        // scenarioClassifier's own comma-split convention for turn.skills_selected.
        for (const s of e.detail.split(',').map((x) => x.trim()).filter(Boolean)) skills.add(s);
      }
    }
    if (event.type === 'text_final' || event.type === 'text_replace') {
      // text_replace is the settled version of a text_final the stream sent
      // moments earlier (see README: 'text_replace' mirrors the same final
      // block once the turn is fully resolved) — last one wins.
      finalBlocks = (event as HarnessTextFinalEvent).blocks;
    }
    if (event.type === 'turn_complete' && typeof event.latency_ms === 'number') {
      latencyMs = event.latency_ms;
    }
  }

  return {
    traceId: turn.turnId,
    prompt: turn.prompt,
    output: serializeFinalEnvelope(finalBlocks ?? []),
    toolSequence,
    skills: [...skills],
    toolCallCount,
    latencyMs,
  };
}
