import { fetchSpansForTrace } from '../../api/phoenixClient';
import type { PhoenixSpan } from '../../types/phoenix';
import { cacheGet, cacheKeys, cacheSet, purgeStaleCacheVersions } from '../cache';
import { CORPUS_INDEX } from './corpusIndex';
import { FIXTURE_SCENARIOS } from './fixtures';
import { buildScenarioFromTrace } from './fromTrace';
import { SCENARIO_ARCHETYPES, type ScenarioArchetype } from '../types/archetype';
import { emptyPools, type Level2Scenario, type ScenarioPools, type ScenarioSource } from '../types/scenario';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Scenario registry.

   Answers exactly one question: "give me a scenario of archetype X that isn't
   the one I just showed."

   SOURCE PRIORITY, in order, with the next tried only when the previous fails:

     phoenix          a real trace fetched live and mapped now
     cached_phoenix   a real trace whose spans/scenario are already cached
     fixture          a hand-authored scenario, always marked as such

   Fixtures are a real fallback, never a silent substitute: the source travels
   with the scenario, the dev panel shows it, and a fixture is never described
   as Phoenix output.

   PERFORMANCE: the corpus index is a generated file — no traces are fetched
   at startup, and the 786-trace sweep is never re-run in the browser. A
   trace's spans are fetched exactly once, on first selection, then cached.
   ───────────────────────────────────────────────────────────────────────────── */

/** How many real traces to try before giving up on Phoenix for this pick.
 *  Bounded so one archetype with several unmappable traces can't stall the
 *  demo behind a long chain of failed fetches. */
const MAX_TRACE_ATTEMPTS = 3;
/** How many recently-shown scenarios to remember per archetype when avoiding
 *  immediate repetition. */
const RECENT_MEMORY = 4;

export interface ScenarioSelection {
  scenario: Level2Scenario;
  /** Everything that was tried and failed on the way here — dev panel only. */
  fallbackNotes: string[];
  /** True when Phoenix was attempted and could not supply this archetype. */
  usedFallback: boolean;
}

export interface ArchetypeAvailability {
  archetype: ScenarioArchetype;
  realTraceCount: number;
  fixtureCount: number;
}

function fixturePools(): ScenarioPools {
  const pools = emptyPools();
  for (const scenario of FIXTURE_SCENARIOS) pools[scenario.archetype].push(scenario);
  return pools;
}

export class Level2ScenarioRegistry {
  private readonly fixtures = fixturePools();
  private readonly recent = new Map<ScenarioArchetype, string[]>();
  /** Scenarios already built this session, keyed by trace id. */
  private readonly built = new Map<string, Level2Scenario>();

  constructor() {
    purgeStaleCacheVersions();
  }

  /** What each archetype can actually offer. Drives the selector's own
   *  labelling — an archetype with zero real traces should be honest about
   *  being fixture-backed. */
  availability(): ArchetypeAvailability[] {
    return SCENARIO_ARCHETYPES.map((archetype) => ({
      archetype,
      realTraceCount: CORPUS_INDEX.pools[archetype]?.length ?? 0,
      fixtureCount: this.fixtures[archetype].length,
    }));
  }

  corpusMeta() {
    return {
      generatedAt: CORPUS_INDEX.generatedAt,
      tracesInspected: CORPUS_INDEX.tracesInspected,
      project: CORPUS_INDEX.project,
    };
  }

  private remember(archetype: ScenarioArchetype, id: string) {
    const list = this.recent.get(archetype) ?? [];
    const next = [id, ...list.filter((x) => x !== id)].slice(0, RECENT_MEMORY);
    this.recent.set(archetype, next);
  }

  private isRecent(archetype: ScenarioArchetype, id: string): boolean {
    return (this.recent.get(archetype) ?? []).includes(id);
  }

  /** Candidate trace ids for an archetype, freshest-unseen first. Falls back
   *  to allowing repeats only when every candidate has been seen — a pool of
   *  one must still return that one rather than nothing. */
  private orderedTraceRefs(archetype: ScenarioArchetype) {
    const refs = CORPUS_INDEX.pools[archetype] ?? [];
    const unseen = refs.filter((r) => !this.isRecent(archetype, `trace-${r.traceId}`));
    return unseen.length ? unseen : refs;
  }

  private async spansFor(traceId: string): Promise<{ spans: PhoenixSpan[]; fromCache: boolean }> {
    const cached = cacheGet<PhoenixSpan[]>(cacheKeys.spans(traceId));
    if (cached?.length) return { spans: cached, fromCache: true };
    const spans = await fetchSpansForTrace(traceId);
    if (spans.length) cacheSet(cacheKeys.spans(traceId), spans);
    return { spans, fromCache: false };
  }

  private pickFixture(archetype: ScenarioArchetype): Level2Scenario | undefined {
    const pool = this.fixtures[archetype];
    if (!pool.length) return undefined;
    const unseen = pool.filter((s) => !this.isRecent(archetype, s.id));
    return (unseen.length ? unseen : pool)[0];
  }

  /** Selects a scenario for `archetype`. Never throws and never returns
   *  undefined for an archetype that has any fixture coverage. */
  async select(archetype: ScenarioArchetype, options: { preferSource?: ScenarioSource } = {}): Promise<ScenarioSelection | undefined> {
    const fallbackNotes: string[] = [];

    if (options.preferSource !== 'fixture') {
      const refs = this.orderedTraceRefs(archetype);
      let attempts = 0;

      for (const ref of refs) {
        if (attempts >= MAX_TRACE_ATTEMPTS) {
          fallbackNotes.push(`Stopped after ${MAX_TRACE_ATTEMPTS} trace attempts to keep selection responsive.`);
          break;
        }
        attempts += 1;

        const alreadyBuilt = this.built.get(ref.traceId);
        if (alreadyBuilt) {
          this.remember(archetype, alreadyBuilt.id);
          return { scenario: alreadyBuilt, fallbackNotes, usedFallback: false };
        }

        try {
          const { spans, fromCache } = await this.spansFor(ref.traceId);
          if (!spans.length) {
            fallbackNotes.push(`Trace ${ref.traceId.slice(0, 8)} returned no spans.`);
            continue;
          }

          const source: ScenarioSource = fromCache ? 'cached_phoenix' : 'phoenix';
          const { scenario, rejectedReason } = buildScenarioFromTrace(spans, source);

          if (!scenario) {
            fallbackNotes.push(`Trace ${ref.traceId.slice(0, 8)} rejected: ${rejectedReason ?? 'unmappable'}.`);
            continue;
          }

          // The corpus index classified this trace from root-span metadata
          // only. Re-classification with full spans occasionally disagrees —
          // trust the full-span result and skip rather than mislabel it.
          if (scenario.archetype !== archetype) {
            fallbackNotes.push(
              `Trace ${ref.traceId.slice(0, 8)} reclassified as ${scenario.archetype} once its spans were read — skipped.`
            );
            continue;
          }

          this.built.set(ref.traceId, scenario);
          cacheSet(cacheKeys.scenario(ref.traceId), scenario);
          this.remember(archetype, scenario.id);
          return { scenario, fallbackNotes, usedFallback: false };
        } catch (e) {
          fallbackNotes.push(`Trace ${ref.traceId.slice(0, 8)} fetch failed: ${(e as Error).message}`);
        }
      }

      if (!refs.length) fallbackNotes.push(`No real trace in the corpus classified as ${archetype}.`);
    }

    const fixture = this.pickFixture(archetype);
    if (!fixture) return undefined;
    this.remember(archetype, fixture.id);
    return { scenario: fixture, fallbackNotes, usedFallback: options.preferSource !== 'fixture' };
  }
}

/** One registry per app session. Selection state (what was shown recently,
 *  what has already been built) is session-scoped by design — Refresh should
 *  vary within a session, not across reloads. */
export const level2Registry = new Level2ScenarioRegistry();
