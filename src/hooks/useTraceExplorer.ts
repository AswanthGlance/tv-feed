import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchSpansForTrace, listRootTurnSpans } from '../api/phoenixClient';
import { buildThinkingScenario, extractSkillRaw, spanToPseudoTrace } from '../adapters/phoenixAdapter';
import { resolveResultTemplate, type ResultTemplateId } from '../adapters/resultTemplate';
import { loadLastGoodTrace, saveLastGoodTrace } from '../utils/traceCache';
import type { PhoenixSpan, PhoenixTrace } from '../types/phoenix';
import type { DataSource, ThinkingScenario } from '../types/thinking';

const MIN_TOKENS_FOR_VIABLE = 1;

function isViableRoot(span: PhoenixSpan): boolean {
  const attrs = span.attributes ?? {};
  const hasRequest = typeof attrs['input.value'] === 'string' && (attrs['input.value'] as string).trim().length > 0;
  const hasResponse = typeof attrs['output.value'] === 'string' && (attrs['output.value'] as string).trim().length > 0;
  const tokens = Number(attrs['llm.token_count.total'] ?? 0);
  return hasRequest && hasResponse && tokens >= MIN_TOKENS_FOR_VIABLE;
}

function pickRandom<T>(items: T[]): T | undefined {
  if (!items.length) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}

interface LoadedTrace {
  rootSpan: PhoenixSpan;
  scenario: ThinkingScenario;
  allSpans: PhoenixSpan[];
  matchedTrace: PhoenixTrace;
  source: DataSource;
  warnings: string[];
}

/** Picks a genuinely random real trace from the live pool every time it's
 *  asked to (page load, or "N" for a new one) — no fixed set of pre-authored
 *  use cases. The result page renders whatever that trace's real harness
 *  response actually was.
 *
 *  Discovery: one batched call to /spans?name=harness.turn (root turns
 *  across many traces at once, each already carrying input.value/
 *  output.value/turn.skills_selected) rather than fetching full spans per
 *  candidate trace. The batch is cached in memory and resampled on "N";
 *  only a full page reload re-fetches it, matching "every time I refresh,
 *  come up with something different" while keeping in-session variety fast. */
export function useTraceExplorer() {
  const [pool, setPool] = useState<PhoenixSpan[]>([]);
  const [poolStatus, setPoolStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [poolError, setPoolError] = useState<string | undefined>();
  const [loaded, setLoaded] = useState<LoadedTrace | undefined>();
  const [loadedStatus, setLoadedStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const usedTraceIds = useRef<Set<string>>(new Set());

  const selectFrom = useCallback(async (candidates: PhoenixSpan[]) => {
    const unused = candidates.filter((s) => !usedTraceIds.current.has(s.context.trace_id));
    const fromPool = unused.length ? unused : candidates; // exhausted -> allow repeats again
    const rootSpan = pickRandom(fromPool);
    if (!rootSpan) throw new Error('No viable traces in the pool.');

    usedTraceIds.current.add(rootSpan.context.trace_id);
    setLoadedStatus('loading');

    const fullSpans = await fetchSpansForTrace(rootSpan.context.trace_id);
    const pseudoTrace = spanToPseudoTrace(rootSpan);
    const built = buildThinkingScenario(pseudoTrace, fullSpans.length ? fullSpans : [rootSpan]);

    saveLastGoodTrace(pseudoTrace, fullSpans.length ? fullSpans : [rootSpan]);
    setLoaded({
      rootSpan,
      scenario: built.scenario,
      allSpans: built.allSpans,
      matchedTrace: pseudoTrace,
      source: 'phoenix-live',
      warnings: built.warnings,
    });
    setLoadedStatus('ready');
  }, []);

  const loadFromCache = useCallback((reason: string) => {
    const cached = loadLastGoodTrace();
    if (!cached) {
      setLoadedStatus('error');
      setLoaded(undefined);
      return;
    }
    const built = buildThinkingScenario(cached.trace, cached.spans);
    setLoaded({
      rootSpan: cached.spans.find((s) => !s.parent_id) ?? cached.spans[0],
      scenario: built.scenario,
      allSpans: built.allSpans,
      matchedTrace: cached.trace,
      source: 'phoenix-cached',
      warnings: [reason, ...built.warnings],
    });
    setLoadedStatus('ready');
  }, []);

  const fetchPool = useCallback(async () => {
    setPoolStatus('loading');
    try {
      const spans = await listRootTurnSpans(200);
      const viable = spans.filter(isViableRoot);
      setPool(viable.length ? viable : spans);
      setPoolStatus('ready');
      setPoolError(undefined);
      return viable.length ? viable : spans;
    } catch (e) {
      setPoolStatus('error');
      setPoolError((e as Error).message);
      setPool([]);
      return [];
    }
  }, []);

  const loadNew = useCallback(() => {
    if (pool.length) {
      selectFrom(pool).catch(() => loadFromCache('Failed to load the selected trace’s spans.'));
    } else {
      fetchPool().then((viable) => {
        if (viable.length) selectFrom(viable).catch(() => loadFromCache('Failed to load the selected trace’s spans.'));
        else loadFromCache('Phoenix trace pool has no viable traces right now.');
      });
    }
  }, [pool, selectFrom, fetchPool, loadFromCache]);

  useEffect(() => {
    fetchPool().then((viable) => {
      if (viable.length) {
        selectFrom(viable).catch(() => loadFromCache('Failed to load the selected trace’s spans.'));
      } else {
        loadFromCache('Phoenix trace pool scan failed or returned nothing usable.');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const skillRaw = loaded ? extractSkillRaw(loaded.rootSpan.attributes) : undefined;
  const resultTemplate: ResultTemplateId = resolveResultTemplate(skillRaw ?? loaded?.scenario.skill);

  return {
    isLoading: poolStatus === 'loading' || loadedStatus === 'loading',
    scenarioData: loaded?.scenario,
    rootSpan: loaded?.rootSpan,
    allSpans: loaded?.allSpans ?? [],
    warnings: loaded?.warnings ?? [],
    detectedRequest: loaded?.scenario.request,
    skillRaw,
    resultTemplate,
    matchedTrace: loaded?.matchedTrace,
    dataSource: (loaded?.source ?? 'unavailable') as DataSource,
    poolSize: pool.length,
    poolStatus,
    poolError,
    loadNew,
  };
}
