import { useState } from 'react';
import { DEV_SCENARIO_LABEL } from '../../../level2/types/devScenario';
import { invalidateLevel2Cache, LEVEL2_CACHE_VERSION } from '../../../level2/cache';
import { PLAYBACK_SPEEDS } from '../../../level2/types/runtime';
import type { Level2ScenarioState } from '../../../level2/runtime/useLevel2Scenario';
import type { Level2RuntimeState } from '../../../level2/types/runtime';
import type { ComparisonFocus, EntityPreviewPayload, RoutePayload } from '../../../level2/types/pass';
import type { MemoryContext } from '../../../level2/types/memory';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Developer diagnostics.

   Answers the questions an engineer actually has while watching a scenario:

     Which archetype is selected, and what was loaded for it?
     Where did it come from — live Phoenix, cache, or a fixture?
     What did it classify as, and how confident was that?
     What did the user's prompt actually ask for?
     Which passes exist, and which of them are status vs value?
     WHAT WAS FILTERED OUT, and why?

   That last one matters most. The whole point of the user-value layer is that
   operations are hidden from the viewer — so the panel must be able to show
   exactly what was hidden and on what grounds. A filter you cannot inspect is
   indistinguishable from a bug.

   Never visible in the leadership view.
   ───────────────────────────────────────────────────────────────────────────── */

type Tab = 'scenario' | 'passes' | 'timing' | 'compare' | 'map' | 'list' | 'filtered' | 'cache';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'scenario', label: 'SCENARIO' },
  { id: 'passes', label: 'PASSES' },
  { id: 'timing', label: 'TIMING' },
  { id: 'compare', label: 'COMPARE' },
  { id: 'map', label: 'MAP' },
  { id: 'list', label: 'LIST' },
  { id: 'filtered', label: 'FILTERED' },
  { id: 'cache', label: 'CACHE' },
];

const MAX_IDLE_GAP_OPTIONS: Array<{ label: string; ms: number }> = [
  { label: 'Off', ms: 0 },
  { label: '5s', ms: 5000 },
  { label: '10s', ms: 10000 },
  { label: '20s', ms: 20000 },
];

const fmtSec = (ms: number | undefined) => (ms == null ? '—' : `${(ms / 1000).toFixed(1)}s`);

const SOURCE_LABEL: Record<string, string> = {
  phoenix: 'Phoenix — live fetch, mapped now',
  cached_phoenix: 'Phoenix — cached spans',
  harness_stream: 'Harness Stream — real capture, classified',
  fixture: 'Fixture — hand-authored, NOT Phoenix output',
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <>
      <span className="att-dev-meta-label">{label}</span>
      <span className="att-dev-meta-value">{value}</span>
    </>
  );
}

export default function Level2Diagnostics({
  source,
  runtime,
}: {
  source: Level2ScenarioState;
  runtime: Level2RuntimeState;
}) {
  const [tab, setTab] = useState<Tab>('scenario');
  const [cacheMessage, setCacheMessage] = useState<string>();
  const scenario = runtime.scenario;
  const classification = scenario?.classification;
  const requirements = scenario?.requirements;
  const filtered = (scenario?.metadata?.filteredEvents as Array<{ eventId: string; type: string; reason: string }>) ?? [];
  const memoryDiag = scenario?.metadata?.memory as MemoryContext['diagnostics'] | undefined;

  /* Comparison diagnostics. The consumer canvas deliberately shows a value or
     an em dash and nothing else, so this panel is the only place the coverage
     arithmetic behind it is inspectable: which dimensions the data actually
     supported, which candidate is missing which field, and whether a leader
     claim was earned or withheld. */
  const comparisonPasses = (scenario?.thinkingPasses ?? [])
    .map((pass) => ({ pass, focus: (pass.payload as EntityPreviewPayload | undefined)?.comparison }))
    .filter((row): row is { pass: (typeof row)['pass']; focus: ComparisonFocus } => !!row.focus);
  const activeComparison = (runtime.currentPass?.payload as EntityPreviewPayload | undefined)?.comparison;

  /* Spatial diagnostics. The consumer map deliberately shows two markers, a
     connector and two figures — this is where an engineer can see WHICH of
     those are real trace values, and in particular whether the connector is a
     drawn geometry or the abstract stand-in for geometry the trace never
     carried. */
  const routePasses = (scenario?.thinkingPasses ?? []).filter((p) => p.valueType === 'route');
  const activeRoute =
    runtime.currentPass?.valueType === 'route' ? (runtime.currentPass.payload as RoutePayload | undefined) : undefined;
  const anyRoute = activeRoute ?? (routePasses[0]?.payload as RoutePayload | undefined);
  const candidateIds = runtime.items.map((it) => it.id);

  return (
    <div className="att-dev-inspector">
      <div className="att-dev-header">
        <span className="att-dev-title">Level 2 — Scenario Runtime</span>
        <span className="att-dev-sub">
          {DEV_SCENARIO_LABEL[source.selectedArchetype]} · {runtime.phase.toUpperCase()}
        </span>
      </div>

      <div className="att-dev-status-row">
        <span
          className={`att-dev-dot ${
            source.status === 'ready' ? 'att-dev-dot--ok' : source.status === 'error' ? 'att-dev-dot--error' : 'att-dev-dot--loading'
          }`}
        />
        <span>{source.status === 'ready' ? 'Ready' : source.status === 'error' ? 'Error' : 'Loading…'}</span>
        <span className="att-badge-source">{scenario ? SOURCE_LABEL[scenario.source] : '—'}</span>
        {source.usedFallback && <span className="att-badge-source">FELL BACK</span>}
      </div>
      {source.error && <div style={{ fontSize: 11, color: '#e4558a', marginTop: 6 }}>{source.error}</div>}

      <div className="att-dev-playback">
        <button className="att-playback-btn" onClick={runtime.prevPass}>⟵ Prev Pass</button>
        <button className="att-playback-btn" onClick={() => (runtime.isPlaying ? runtime.pause() : runtime.play())}>
          {runtime.isPlaying ? 'Pause' : 'Resume'}
        </button>
        <button className="att-playback-btn" onClick={runtime.nextPass}>Next Pass ⟶</button>
        {/* Replay THIS pass — the QA control that matters for a motion pass:
            re-running one beat (tile arrival, enrichment reveal, the narrowing)
            without sitting through the whole journey to reach it again. */}
        <button
          className="att-playback-btn"
          onClick={() => {
            runtime.goToPass(runtime.currentPassIndex);
            runtime.play();
          }}
        >
          ↻ Pass
        </button>
        <button className="att-playback-btn" onClick={runtime.replay}>Replay all</button>
        <button className="att-playback-btn" onClick={runtime.jumpToFinal}>Jump to final</button>
        <button className="att-playback-btn" onClick={source.refresh}>Refresh scenario</button>
        {PLAYBACK_SPEEDS.map((s) => (
          <button
            key={s}
            className={`att-playback-btn${runtime.speed === s ? ' active' : ''}`}
            onClick={() => runtime.setSpeed(s)}
          >
            {s}×
          </button>
        ))}
        {/* Timing mode — always visible, not only on the TIMING tab. Demo =
            curated cadence; Actual = the SAME passes on the real Phoenix
            clock. Disabled (never fabricated) when the scenario is a fixture
            or carries no trace timestamps. Full diagnostics: TIMING tab. */}
        <span style={{ opacity: 0.55, fontSize: 11, alignSelf: 'center', marginLeft: 8 }}>Timing:</span>
        <button
          className={`att-playback-btn${runtime.requestedTimingMode === 'demo' ? ' active' : ''}`}
          onClick={() => runtime.setTimingMode('demo')}
        >
          Demo
        </button>
        <button
          className={`att-playback-btn${runtime.requestedTimingMode === 'actual' ? ' active' : ''}`}
          onClick={() => runtime.setTimingMode('actual')}
          disabled={!runtime.actualTimingAvailable}
          title={runtime.actualTimingAvailable ? 'Replay this scenario on the real Phoenix clock' : 'Real timing unavailable for this scenario'}
          style={runtime.actualTimingAvailable ? undefined : { opacity: 0.4, cursor: 'not-allowed' }}
        >
          Real Timing
        </button>
      </div>

      <div className="att-dev-tabs">
        {TABS.map((t) => (
          <button key={t.id} className={`att-dev-tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="att-dev-body">
        {tab === 'scenario' && (
          <div className="att-dev-meta-grid">
            <Row label="Selected archetype" value={source.selectedArchetype} />
            <Row label="Scenario ID" value={scenario?.id ?? '—'} />
            <Row label="Source" value={scenario ? SOURCE_LABEL[scenario.source] : '—'} />
            <Row label="Trace ID" value={scenario?.traceId ? `${scenario.traceId.slice(0, 16)}…` : '— (fixture)'} />
            <Row label="Domain" value={scenario?.domain ?? '—'} />
            <Row label="Classification" value={classification ? `${classification.archetype} · ${classification.confidence}` : '— (fixture)'} />
            <Row label="Output shape" value={classification?.outputShape ?? '—'} />
            <Row label="Entities / images" value={classification ? `${classification.entityCount ?? 0} · ${classification.hasImages ? 'has images' : 'NO images'}` : '—'} />
            <Row label="Detected prompt" value={scenario?.prompt ? `${scenario.prompt.slice(0, 140)}…` : '—'} />
            <Row label="Entity type asked for" value={requirements?.entityType ?? '—'} />
            <Row label="Requested attributes" value={requirements?.requestedAttributes.join(', ') || '— (none named)'} />
            <Row
              label="Intents"
              value={
                requirements
                  ? [
                      requirements.rankingIntent && 'ranking',
                      requirements.comparisonIntent && 'comparison',
                      requirements.routeIntent && 'route',
                      requirements.listIntent && 'list',
                      requirements.explanationIntent && 'explanation',
                    ]
                      .filter(Boolean)
                      .join(', ') || '— (none)'
                  : '—'
              }
            />
            {/* Never shown in consumer UI — this is the ONLY place "was
                memory detected / why didn't it render" is answerable. See
                MEMORY_RETRIEVAL_TRACE_FINDINGS.md for why a hit is rare. */}
            <Row
              label="Memory retrieval"
              value={
                !memoryDiag
                  ? '— (not attempted on this path)'
                  : !memoryDiag.spanFound
                    ? 'not detected — no memory.retrieval span'
                    : !memoryDiag.hit
                      ? 'detected — no hit (empty for this user)'
                      : `detected — hit (${memoryDiag.totalSignalsFound} signal${memoryDiag.totalSignalsFound === 1 ? '' : 's'} found)`
              }
            />
            {memoryDiag?.spanFound && (
              <Row
                label="Memory rendered"
                value={
                  memoryDiag.rendered
                    ? `yes — ${memoryDiag.relevantSignalCount} of ${memoryDiag.totalSignalsFound} relevant`
                    : `no — ${memoryDiag.reason ?? 'not relevant'}`
                }
              />
            )}
            <Row label="Runtime phase" value={runtime.phase} />
            <Row label="Pass" value={runtime.passCount ? `${runtime.currentPassIndex + 1}/${runtime.passCount} (${runtime.passPhase ?? '—'})` : '—'} />
            <Row label="Final response type" value={runtime.finalResponse?.kind ?? '—'} />
            <Row label="Winner" value={runtime.promotedId ?? '— (none derived — correct for a list)'} />
            <Row label="Canvas items" value={String(runtime.items.length)} />
            <Row label="Corpus index" value={`${source.corpusMeta.tracesInspected} traces · ${source.corpusMeta.generatedAt.slice(0, 10)}`} />
            {!!source.fallbackNotes.length && (
              <Row label="Fallback trail" value={<span style={{ opacity: 0.8 }}>{source.fallbackNotes.join(' · ')}</span>} />
            )}
            {/* The full classification signal trail is deliberately NOT
                rendered. It is a long unwrapped sentence that spanned the
                bottom of the stage and read as part of the demo rather than as
                diagnostics. The data is still on
                `scenario.classification.signals` for anyone who needs it, and
                the archetype + confidence row above already answers "what did
                this classify as, and how sure was it". */}
          </div>
        )}

        {tab === 'passes' && (
          <div>
            {/* Narration-vs-canvas violations, computed once at scenario build
                (see userValue/discoveryInvariants.ts). Loud here, invisible to
                consumers. Empty on a healthy trace. */}
            {(runtime.scenario?.metadata?.invariantWarnings as Array<{ passId: string; message: string }> | undefined)?.map((w) => (
              <div
                key={`${w.passId}-${w.message}`}
                style={{
                  marginBottom: 10,
                  padding: '6px 8px',
                  border: '1px solid #e05555',
                  color: '#ff8a8a',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                ⚠ {w.message}
              </div>
            ))}
            {runtime.scenario?.thinkingPasses.map((pass, i) => (
              <div
                key={pass.id}
                style={{
                  marginBottom: 10,
                  opacity: i === runtime.currentPassIndex ? 1 : 0.55,
                  borderLeft: `2px solid ${pass.visibility === 'canvas_value' ? '#4ad4a0' : '#7a8aa0'}`,
                  paddingLeft: 8,
                }}
              >
                <div style={{ fontWeight: 700 }}>
                  {i + 1}. {pass.narration}
                </div>
                <div style={{ opacity: 0.7, fontSize: 11 }}>
                  {pass.visibility}
                  {pass.valueType ? ` · ${pass.valueType}` : ' · narration only'}
                  {` · ${pass.enterDuration}/${pass.holdDuration}/${pass.exitDuration}ms`}
                  {pass.confidence ? ` · ${pass.confidence}` : ''}
                </div>
                {!!pass.sourceSpanIds?.length && (
                  <div style={{ opacity: 0.45, fontSize: 10 }}>spans: {pass.sourceSpanIds.slice(0, 4).join(', ')}</div>
                )}
                {/* Candidate-set provenance for discovery passes — how the
                    visible set was resolved, and that the narration count is
                    the same array's length. See candidateResolution.ts. */}
                {pass.debug && (
                  <div style={{ opacity: 0.6, fontSize: 10, lineHeight: 1.5 }}>
                    narration {pass.debug.narrationCount ?? '—'} · visible {pass.debug.visibleCandidateCount} · canonical{' '}
                    {pass.debug.canonicalCandidateCount} · discovery {pass.debug.discoveryExtracted} · final{' '}
                    {pass.debug.finalResponseExtracted} · source {pass.debug.entitySource}
                    {pass.debug.subsetSource ? ` (${pass.debug.subsetSource})` : ''} · img {pass.debug.imagesAvailable}/
                    {pass.debug.visibleCandidateCount} · geo {pass.debug.coordinatesAvailable}/{pass.debug.visibleCandidateCount}
                    {pass.debug.droppedTitles?.length ? ` · dropped: ${pass.debug.droppedTitles.join(', ')}` : ''}
                  </div>
                )}
              </div>
            ))}
            {!runtime.scenario?.thinkingPasses.length && <div style={{ opacity: 0.5 }}>No passes.</div>}
          </div>
        )}

        {tab === 'timing' && (
          <div>
            {/* Dev-only control — WHEN passes appear, never what they show.
                Demo = curated leadership cadence; Actual = the same passes on
                the real Phoenix clock (see level2/runtime/schedule.ts). */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ opacity: 0.7, marginBottom: 6 }}>Timing mode</div>
              <button
                className={`att-playback-btn${runtime.requestedTimingMode === 'demo' ? ' active' : ''}`}
                onClick={() => runtime.setTimingMode('demo')}
              >
                Demo Timing
              </button>
              <button
                className={`att-playback-btn${runtime.requestedTimingMode === 'actual' ? ' active' : ''}`}
                onClick={() => runtime.setTimingMode('actual')}
                disabled={!runtime.actualTimingAvailable}
                style={runtime.actualTimingAvailable ? undefined : { opacity: 0.4, cursor: 'not-allowed' }}
              >
                Real Timing
              </button>
              {!runtime.actualTimingAvailable && (
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
                  Real timing unavailable for this scenario{runtime.scenario?.source === 'fixture' ? ' (fixture — no recorded timestamps)' : ' — no trace timestamps'}.
                </div>
              )}
              {runtime.requestedTimingMode === 'actual' && runtime.timingMode === 'demo' && runtime.actualTimingAvailable === false && (
                <div style={{ fontSize: 11, color: '#e4a955', marginTop: 4 }}>Falling back to Demo Timing.</div>
              )}
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ opacity: 0.7, marginBottom: 6 }}>Max idle gap (Real Timing safety cap — Off shows true latency)</div>
              {MAX_IDLE_GAP_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  className={`att-playback-btn${runtime.maxIdleGapMs === opt.ms ? ' active' : ''}`}
                  onClick={() => runtime.setMaxIdleGapMs(opt.ms)}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="att-dev-meta-grid" style={{ marginBottom: 12 }}>
              <Row label="Timing mode" value={runtime.timingMode === 'actual' ? 'Real' : 'Demo'} />
              <Row label="Trace duration" value={fmtSec(runtime.traceDurationMs)} />
              <Row label="Playback timeline" value={fmtSec(runtime.totalDuration)} />
              <Row
                label="First visible value"
                value={fmtSec(runtime.schedule.find((s) => s.pass.visibility === 'canvas_value')?.start)}
              />
              <Row
                label="Final response"
                value={runtime.timingMode === 'actual' ? fmtSec(runtime.traceDurationMs) : `${fmtSec(runtime.totalDuration)} (curated)`}
              />
              <Row label="Current trace time" value={`${fmtSec(runtime.elapsed)} · ${runtime.speed}×`} />
              <Row label="Current state" value={runtime.currentPass?.narration ?? '—'} />
              <Row
                label="State started"
                value={fmtSec(runtime.schedule[runtime.currentPassIndex]?.start)}
              />
              <Row
                label="Next event"
                value={fmtSec(runtime.schedule[runtime.currentPassIndex + 1]?.start)}
              />
            </div>

            {/* Per-pass windows on the ACTIVE timeline. In actual mode the
                right-hand interval is the pass's real mapped event span;
                (interpolated) marks synthetic beats placed between real
                anchors — real timestamps are never invented for them. */}
            <div style={{ opacity: 0.7, marginBottom: 6 }}>Pass windows</div>
            {runtime.schedule.map((s) => (
              <div key={s.pass.id} style={{ fontSize: 11, marginBottom: 3, opacity: s.index === runtime.currentPassIndex ? 1 : 0.6 }}>
                <span style={{ display: 'inline-block', minWidth: 110 }}>
                  {fmtSec(s.start)}–{fmtSec(s.end)}
                </span>
                {s.pass.narration}
                {runtime.timingMode === 'actual' && (
                  <span style={{ opacity: 0.55 }}>
                    {s.pass.traceTiming
                      ? ` · real ${fmtSec(s.pass.traceTiming.start)}–${fmtSec(s.pass.traceTiming.end)}`
                      : ' · (interpolated)'}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'compare' && (
          <div>
            <div className="att-dev-meta-grid" style={{ marginBottom: 12 }}>
              <Row label="Comparison mode" value={activeComparison ? 'ACTIVE' : 'inactive'} />
              <Row
                label="Dimension"
                value={
                  activeComparison
                    ? `${activeComparison.key} (${activeComparison.step + 1}/${activeComparison.stepCount})`
                    : '—'
                }
              />
              <Row
                label="Leader"
                value={
                  activeComparison?.leaderIds?.length
                    ? `${activeComparison.leaderIds.join(', ')} — ${activeComparison.leaderLabel}`
                    : '— (data does not distinguish one; no claim made)'
                }
              />
              <Row label="Source" value={scenario ? SOURCE_LABEL[scenario.source] : '—'} />
              <Row label="Dimensions derived" value={comparisonPasses.length ? comparisonPasses.map((r) => r.focus.key).join(' → ') : '— (none the data supports)'} />
            </div>

            {activeComparison && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ opacity: 0.7, marginBottom: 6 }}>Candidate values — {activeComparison.key}</div>
                {candidateIds.map((id) => {
                  const value = activeComparison.values[id];
                  const isLeader = activeComparison.leaderIds?.includes(id);
                  return (
                    <div key={id} style={{ fontSize: 11, marginBottom: 3, opacity: value ? 1 : 0.5 }}>
                      <span style={{ opacity: 0.6 }}>{id}</span> —{' '}
                      {value ? `${value.display}${value.note ? ` (${value.note})` : ''}` : 'MISSING (renders as —)'}
                      {isLeader && <span style={{ color: '#cda5ff' }}> · leader</span>}
                    </div>
                  );
                })}
                {(() => {
                  const missing = candidateIds.filter((id) => !activeComparison.values[id]);
                  return (
                    <div style={{ marginTop: 6, fontSize: 11, opacity: 0.7 }}>
                      Missing values: {missing.length ? missing.join(', ') : 'none'} · coverage{' '}
                      {candidateIds.length - missing.length}/{candidateIds.length}
                    </div>
                  );
                })()}
              </div>
            )}

            {!comparisonPasses.length && (
              <div style={{ opacity: 0.5, fontSize: 11 }}>
                No comparison beats in this arc. A dimension is emitted only when at least two candidates genuinely
                carry it — the arc falls back to a generic compare beat rather than turning cards over to show em
                dashes.
              </div>
            )}
          </div>
        )}

        {tab === 'map' && (
          <div>
            <div className="att-dev-meta-grid" style={{ marginBottom: 12 }}>
              <Row label="Visual mode" value={anyRoute?.geo ? 'route_map (spatial)' : anyRoute ? 'route (text only)' : '— (no spatial pass)'} />
              <Row label="Active beat" value={activeRoute?.stage ?? '— (not on a map pass)'} />
              <Row label="Map beats in arc" value={routePasses.length ? routePasses.map((p) => p.id.replace(/^.*-route-?/, '') || 'route').join(' → ') : '—'} />
              <Row label="Origin" value={anyRoute?.origin ?? '—'} />
              <Row label="Destination" value={anyRoute?.destination ?? '—'} />
              <Row label="Distance" value={anyRoute?.distance ?? '—'} />
              <Row label="Duration" value={anyRoute?.eta ?? '—'} />
              <Row
                label="Origin point"
                value={anyRoute?.geo ? `${anyRoute.geo.origin.lat.toFixed(5)}, ${anyRoute.geo.origin.lng.toFixed(5)} — "${anyRoute.geo.origin.label}"` : '— (no coordinates in trace)'}
              />
              <Row
                label="Destination point"
                value={anyRoute?.geo ? `${anyRoute.geo.destination.lat.toFixed(5)}, ${anyRoute.geo.destination.lng.toFixed(5)} — "${anyRoute.geo.destination.label}"` : '— (no coordinates in trace)'}
              />
              <Row
                label="Route geometry"
                value={
                  !anyRoute?.geo
                    ? '—'
                    : anyRoute.geo.geometry === 'path'
                      ? `path (${anyRoute.geo.path?.length ?? 0} points) — drawn as real geometry`
                      : 'UNAVAILABLE — GetRoute carries leg endpoints only, no polyline. Connector is drawn as an abstract dashed arc, NOT a road.'
                }
              />
              <Row label="Route points" value={anyRoute?.geo ? String(2 + (anyRoute.geo.path?.length ?? 0)) : '0'} />
              <Row label="Data source" value={anyRoute ? 'tool.GetRoute (google_routes_api_v2)' : '—'} />
            </div>
            {!routePasses.length && (
              <div style={{ opacity: 0.5, fontSize: 11 }}>
                This trace made no GetRoute call, so no spatial beat exists. The map is emitted only when the agent
                genuinely did spatial work — never as decoration on a trace that did not.
              </div>
            )}
          </div>
        )}

        {tab === 'list' && (() => {
          /* List count invariants (see listPlan.ts). The one question this tab
             answers: does the narration count === visible items === what the
             canvas is actually showing, and where did the items come from. */
          const listMeta = scenario?.metadata?.list as
            | {
                rawResultCount?: number;
                resolvedListCount: number;
                visibleListCount: number;
                narrationCount: number;
                imagesAvailable: number;
                itemSource: string;
                themeCount: number;
              }
            | undefined;
          if (!listMeta) {
            return (
              <div style={{ opacity: 0.5, fontSize: 11 }}>
                Not a list scenario — the list arc (listPlan.ts) only runs for the list archetype.
              </div>
            );
          }
          const finalCount = runtime.finalResponse?.kind === 'list' ? runtime.finalResponse.items.length : undefined;
          const liveCount = runtime.items.length;
          // The canvas fills at the found pass; before it, 0 live items is
          // expected and not a violation.
          const foundRevealed = runtime.revealedPasses.some((p) => p.id === 'list-found');
          const countMismatch = foundRevealed && liveCount !== listMeta.narrationCount;
          const visualMissing = foundRevealed && listMeta.narrationCount > 0 && liveCount === 0;
          const warn = (msg: string) => (
            <div
              key={msg}
              style={{ marginBottom: 10, padding: '6px 8px', border: '1px solid #e05555', color: '#ff8a8a', fontSize: 11, fontWeight: 700 }}
            >
              ⚠ {msg}
            </div>
          );
          return (
            <div>
              {visualMissing &&
                warn(`LIST VISUAL MISSING — narration claims ${listMeta.narrationCount} but the canvas shows 0 items.`)}
              {!visualMissing &&
                countMismatch &&
                warn(`LIST COUNT MISMATCH — expected ${listMeta.narrationCount}, rendered ${liveCount}.`)}
              <div className="att-dev-meta-grid">
                <Row label="Raw result count" value={listMeta.rawResultCount != null ? `${listMeta.rawResultCount} (retrieval scale — never the finding)` : '— (not reported by trace)'} />
                <Row label="Resolved list count" value={String(listMeta.resolvedListCount)} />
                <Row label="Visible list count" value={String(listMeta.visibleListCount)} />
                <Row label="Narration count" value={String(listMeta.narrationCount)} />
                <Row label="Canvas items (live)" value={foundRevealed ? String(liveCount) : `${liveCount} (found pass not reached yet)`} />
                <Row label="Final response items" value={finalCount != null ? String(finalCount) : '—'} />
                <Row label="Images in trace" value={`${listMeta.imagesAvailable} / ${listMeta.visibleListCount} (renderer backfills the rest — image never required)`} />
                <Row label="Item source" value={listMeta.itemSource} />
                <Row label="Themes derived" value={listMeta.themeCount ? String(listMeta.themeCount) : '— (items carry no shared theme data; grouping beat skipped)'} />
                <Row label="Winner" value={runtime.promotedId ?? '— (none — correct for a list)'} />
              </div>
            </div>
          );
        })()}

        {tab === 'filtered' && (
          <div>
            <div style={{ marginBottom: 10, opacity: 0.7 }}>
              Operations the user-value classifier hid. These really happened; they simply carry nothing a viewer can
              use, so they never became a pass.
            </div>
            {filtered.map((f, i) => (
              <div key={i} style={{ marginBottom: 8, fontSize: 11 }}>
                <span style={{ opacity: 0.6 }}>{f.type}</span> — {f.reason}
              </div>
            ))}
            {!filtered.length && (
              <div style={{ opacity: 0.5 }}>
                {scenario?.source === 'fixture'
                  ? 'Fixture scenarios carry no raw event stream to filter.'
                  : 'Nothing was filtered for this trace.'}
              </div>
            )}
          </div>
        )}

        {tab === 'cache' && (
          <div>
            <div style={{ marginBottom: 8, opacity: 0.7 }}>Cache schema version: v{LEVEL2_CACHE_VERSION}</div>
            <div style={{ marginBottom: 8, opacity: 0.7 }}>
              Span payloads and built scenarios are cached per trace and namespaced by schema version, so changing an
              extraction rule and bumping the version invalidates every stale entry at once.
            </div>
            <button
              className="att-playback-btn"
              onClick={() => setCacheMessage(`Cleared ${invalidateLevel2Cache()} cache entries. Refresh a scenario to refetch.`)}
            >
              Invalidate Level 2 cache
            </button>
            {cacheMessage && <div style={{ marginTop: 8, opacity: 0.8 }}>{cacheMessage}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
