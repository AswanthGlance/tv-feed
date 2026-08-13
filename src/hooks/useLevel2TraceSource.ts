import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchSpansForTrace, listRootTurnSpans } from '../api/phoenixClient';
import { phoenixSpansToMutations, type MappingDiagnostics } from '../adapters/phoenixToMutations';
import { mutationsToPasses } from '../adapters/mutationsToPasses';
import { analyzeLevel2Compatibility, type Level2CompatibilityResult } from '../adapters/level2Compatibility';
import { loadLastGoodLevel2Trace, saveLastGoodLevel2Trace } from '../utils/level2TraceCache';
import { LEVEL2_TRAVEL_JOURNEY } from '../data/level2TravelFixture';
import type { PhoenixSpan } from '../types/phoenix';
import type { ProgressiveJourney } from '../types/experiencePass';

export type Level2DataSource = 'phoenix-live' | 'phoenix-cached' | 'fixture';

/** How many of the pool's best-by-tool-activity root spans to actually fetch
 *  full spans for and score. Fetching full spans is the expensive step
 *  (a real network round-trip per candidate) — this bounds it to a handful
 *  rather than N+1-ing the whole pool, same spirit as useTraceExplorer's
 *  batched discovery. Domain-neutral on purpose: no skill allowlist, so a
 *  good candidate in an unexpected skill isn't excluded before it's scored
 *  (see level2Compatibility.ts, which is the real arbiter). */
const CANDIDATES_TO_SCORE = 10;
const MIN_TOOL_CALLS = 2;

function toolCallCount(span: PhoenixSpan): number {
  const n = Number(span.attributes?.['turn.tool_call_count'] ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/** Real, confirmed finding (see LEVEL2_INSTRUMENTATION_GAPS.md): traces
 *  whose turn.skills_selected includes the `aigc_*` family are batch
 *  CONTENT-GENERATION requests ("Generate and Publish 3 travel cards, each
 *  for a different persona") — structurally the wrong shape for Level 2.
 *  Their 3 output cards are independent, unrelated results, not competing
 *  candidates for one slot, so there is no real winner signal to derive
 *  PROMOTE/RESOLVE from no matter how much tool activity they have (and
 *  they tend to have a LOT — up to 20 tool calls, more than genuine
 *  "find me the best X" requests), which otherwise biases naive
 *  tool-call-count ranking straight at them. Excluded outright rather than
 *  just deprioritized, since they're not a worse Level 2 candidate, they're
 *  not a Level 2 candidate at all. */
function isBatchGenerationSkill(span: PhoenixSpan): boolean {
  const skills = String(span.attributes?.['turn.skills_selected'] ?? '');
  return skills.split(',').some((s) => s.trim().startsWith('aigc_'));
}

function isEligibleRoot(span: PhoenixSpan): boolean {
  const attrs = span.attributes ?? {};
  const hasRequest = typeof attrs['input.value'] === 'string' && (attrs['input.value'] as string).trim().length > 0;
  const hasResponse = typeof attrs['output.value'] === 'string' && (attrs['output.value'] as string).trim().length > 0;
  return hasRequest && hasResponse && toolCallCount(span) >= MIN_TOOL_CALLS && !isBatchGenerationSkill(span);
}

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const SCORE_RANK: Record<Level2CompatibilityResult['score'], number> = { HIGH: 3, MEDIUM: 2, LOW: 1, UNSUPPORTED: 0 };

export interface Level2TraceOption {
  traceId: string;
  request: string;
  spanCount: number;
  toolCallCount: number;
  compatibility: Level2CompatibilityResult;
}

export interface Level2TraceSourceState {
  journey: ProgressiveJourney;
  dataSource: Level2DataSource;
  status: 'loading' | 'ready' | 'error';
  error?: string;
  diagnostics?: MappingDiagnostics;
  compatibility?: Level2CompatibilityResult;
  /** Every real candidate that was actually scored during the last
   *  discovery run — dev-panel trace selector material (see FIRST TASK /
   *  TRACE SELECTOR in the brief). Empty when running on fixture/cache. */
  scoredCandidates: Level2TraceOption[];
  traceId?: string;
  rootSpan?: PhoenixSpan;
  spans?: PhoenixSpan[];
  reload: () => void;
  useFixture: () => void;
  useCached: () => boolean;
}

/** Level 2's real-trace discovery + mapping orchestration — the analogue of
 *  useTraceExplorer (Level 1) but selecting for PROGRESSIVE VALUE
 *  compatibility (multiple real candidates + enrichment + resolution)
 *  rather than "has a request and a response". Auto-selects the best-
 *  scoring real trace on mount; degrades phoenix-live -> phoenix-cached ->
 *  fixture on failure, per the DATA SOURCE MODES requirement — never
 *  silently swaps to fixture content while implying it's live. */
/** No passes yet — useProgressiveExperience/Level2Experience render this as
 *  the empty-canvas skeleton (see Level2Experience.tsx) rather than briefly
 *  flashing fixture content that then jump-restarts once a real trace
 *  loads. Only ever the INITIAL state while discovery is in flight; the
 *  fixture is a real fallback (see useFixture), never the default. */
const EMPTY_JOURNEY: ProgressiveJourney = { query: '', passes: [] };

export function useLevel2TraceSource(): Level2TraceSourceState {
  const [journey, setJourney] = useState<ProgressiveJourney>(EMPTY_JOURNEY);
  const [dataSource, setDataSource] = useState<Level2DataSource>('phoenix-live');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | undefined>();
  const [diagnostics, setDiagnostics] = useState<MappingDiagnostics | undefined>();
  const [compatibility, setCompatibility] = useState<Level2CompatibilityResult | undefined>();
  const [scoredCandidates, setScoredCandidates] = useState<Level2TraceOption[]>([]);
  const [traceId, setTraceId] = useState<string | undefined>();
  const [rootSpan, setRootSpan] = useState<PhoenixSpan | undefined>();
  const [spans, setSpans] = useState<PhoenixSpan[] | undefined>();
  const runIdRef = useRef(0);

  const useFixture = useCallback(() => {
    setJourney(LEVEL2_TRAVEL_JOURNEY);
    setDataSource('fixture');
    setDiagnostics(undefined);
    setCompatibility(undefined);
    setTraceId(undefined);
    setRootSpan(undefined);
    setSpans(undefined);
    setStatus('ready');
  }, []);

  const useCached = useCallback((): boolean => {
    const cached = loadLastGoodLevel2Trace();
    if (!cached) return false;
    setJourney(cached.journey);
    setDataSource('phoenix-cached');
    setDiagnostics(cached.diagnostics);
    setTraceId(cached.traceId);
    setRootSpan(cached.rootSpan);
    setSpans(cached.spans);
    setStatus('ready');
    return true;
  }, []);

  const reload = useCallback(() => {
    const runId = ++runIdRef.current;
    setStatus('loading');
    setError(undefined);

    (async () => {
      const pool = await listRootTurnSpans(200);
      // Shuffled, not sorted by raw tool-call count: sorting by tool count
      // alone systematically over-selects the aigc_* batch-generation
      // traces that survive isEligibleRoot's skill filter's edge cases and
      // any other high-call-count-but-poor-fit shape — a representative
      // random sample of otherwise-eligible traces finds a genuine
      // comparative-recommendation trace far more reliably in practice.
      const eligible = shuffle(pool.filter(isEligibleRoot)).slice(0, CANDIDATES_TO_SCORE);
      if (!eligible.length) throw new Error('No trace in the pool has enough tool activity to evaluate for Level 2.');

      let best: { root: PhoenixSpan; spans: PhoenixSpan[]; compat: Level2CompatibilityResult } | undefined;
      const scored: Level2TraceOption[] = [];
      let failedFetches = 0;

      for (const root of eligible) {
        if (runIdRef.current !== runId) return; // a newer reload superseded this one
        // One candidate's fetch failing (a single flaky request among up to
        // CANDIDATES_TO_SCORE sequential ones — real and observed against
        // the VPN-gated internal Phoenix host, see CLAUDE_HANDOFF.md §4.1)
        // must not discard every OTHER candidate already found/scored in
        // this same run. Skip just this one and keep going; only the
        // outer catch (below) falls all the way back to cache/fixture, and
        // only when NOTHING in the whole batch came back usable.
        let fullSpans: PhoenixSpan[];
        try {
          fullSpans = await fetchSpansForTrace(root.context.trace_id);
        } catch {
          failedFetches += 1;
          continue;
        }
        const compat = analyzeLevel2Compatibility(fullSpans);
        scored.push({
          traceId: root.context.trace_id,
          request: String(root.attributes?.['input.value'] ?? ''),
          spanCount: fullSpans.length,
          toolCallCount: toolCallCount(root),
          compatibility: compat,
        });
        if (!best || SCORE_RANK[compat.score] > SCORE_RANK[best.compat.score]) {
          best = { root, spans: fullSpans, compat };
        }
        if (compat.score === 'HIGH') break; // good enough — stop paying for more fetches
      }

      if (!best && failedFetches > 0 && failedFetches === eligible.length) {
        throw new Error(`All ${failedFetches} candidate trace fetch(es) failed (network/VPN?) — none could be scored.`);
      }

      if (runIdRef.current !== runId) return;
      setScoredCandidates(scored);

      if (!best || best.compat.score === 'UNSUPPORTED') {
        throw new Error('No trace in the sampled pool scored above UNSUPPORTED for Level 2 compatibility.');
      }

      const { mutations, diagnostics: mapDiag, query } = phoenixSpansToMutations(best.spans);
      const requestText = query || String(best.root.attributes?.['input.value'] ?? 'Agent request');
      const builtJourney = mutationsToPasses(mutations, requestText, best.root.context.trace_id);

      setJourney(builtJourney);
      setDataSource('phoenix-live');
      setDiagnostics(mapDiag);
      setCompatibility(best.compat);
      setTraceId(best.root.context.trace_id);
      setRootSpan(best.root);
      setSpans(best.spans);
      setStatus('ready');

      if (best.compat.score === 'HIGH' || best.compat.score === 'MEDIUM') {
        saveLastGoodLevel2Trace(best.root.context.trace_id, best.root, best.spans, builtJourney, mapDiag);
      }
    })().catch((e: Error) => {
      if (runIdRef.current !== runId) return;
      setError(e.message);
      // DATA SOURCE MODES fallback chain: phoenix-live -> phoenix-cached -> fixture.
      if (!useCached()) useFixture();
    });
  }, [useCached, useFixture]);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    journey,
    dataSource,
    status,
    error,
    diagnostics,
    compatibility,
    scoredCandidates,
    traceId,
    rootSpan,
    spans,
    reload,
    useFixture,
    useCached,
  };
}
