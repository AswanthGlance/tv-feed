import { useEffect, useState } from 'react';
import type { PhoenixSpan, PhoenixTrace } from '../../types/phoenix';
import type { DataSource, ThinkingScenario } from '../../types/thinking';
import type { ExperiencePhase } from '../../hooks/useExperiencePhase';
import type { ResultTemplateId } from '../../adapters/resultTemplate';
import type { ExperienceLevel } from '../../types/experienceLevel';
import type { AgentMutation, CardImportance } from '../../types/progressiveValue';
import type { AgentActionType, PassPhase, PassStage } from '../../types/experiencePass';
import { checkGooglePlacesConfigured } from '../../api/googlePlacesClient';
import { checkPexelsConfigured } from '../../api/pexelsClient';
import { resolveLevel1VisualMode } from '../../adapters/level1VisualMode';
import type { RequestedAttribute } from '../../adapters/cardImportance';
import type { Level2TraceSourceState } from '../../hooks/useLevel2TraceSource';

const IMAGE_TIER_LABEL = ['Google Places real photo', 'Harness photo_url', 'Pexels stock photo', 'Local static fallback'];

type Tab = 'session' | 'raw-spans' | 'mapped-steps' | 'evidence' | 'images' | 'mutations' | 'gaps';

const TABS_LEVEL1: { id: Tab; label: string }[] = [
  { id: 'session', label: 'SESSION' },
  { id: 'raw-spans', label: 'RAW SPANS' },
  { id: 'mapped-steps', label: 'MAPPED STEPS' },
  { id: 'evidence', label: 'EVIDENCE' },
  { id: 'images', label: 'IMAGES' },
];

/* Level 2's tab set matches the FIRST TASK / TRACE MAPPING DEBUGGER brief:
   RAW SPANS -> MUTATIONS (which stand in for "semantic events/passes" here
   since AgentMutation already carries sourceSpanIds/confidence directly —
   see phoenixToMutations.ts) -> GAPS (skipped/unsupported mutations, the
   anti-hallucination trail for whichever trace is loaded). */
const TABS_LEVEL2: { id: Tab; label: string }[] = [
  { id: 'session', label: 'SESSION' },
  { id: 'raw-spans', label: 'RAW SPANS' },
  { id: 'mutations', label: 'MUTATIONS' },
  { id: 'gaps', label: 'GAPS' },
];

const LEVEL_LABEL: Record<ExperienceLevel, string> = {
  level1: 'Level 1 — Visible Progress',
  level2: 'Level 2 — Progressive Value',
  level3: 'Level 3 — Collaborative Agent',
};

interface Level2DevState {
  narrationType?: AgentActionType;
  narrationText: string;
  insightText?: string;
  itemCount: number;
  enrichedCount: number;
  negatedCount: number;
  shortlistedCount: number;
  promotedId?: string;
  removedIds: string[];
  analysisLayout: { width: number; gap: number; compact: boolean };
  /** Position of the promoted item within analysisOrder before reordering —
   *  what "#8/#9 winner" would look like numerically. Undefined until a
   *  winner exists. */
  originalIndex?: number;
  /** Always 0 once resolved (winner-first resultOrder — see
   *  Level2Experience) — kept as an explicit field rather than a hardcoded
   *  "0" in the JSX so the panel reads as verifying the invariant, not
   *  assuming it. */
  resultIndex?: number;
  /** Attribute types the user's own query named explicitly (see
   *  extractRequestedFields) — empty when the query didn't name any. */
  requestedFields: RequestedAttribute[];
  /** Which of the 4 image-fallback tiers rendered for the card DevInspector
   *  is currently following (the promoted/resolved card, or the emerging
   *  pick pre-resolve) — undefined until that card has an image resolved. */
  imageTier?: number;
  /** Content-density tier (see cardImportance.ts) currently resolved for the
   *  promoted item, if one exists. */
  promotedImportance?: CardImportance;
  /** Where the current settled state actually came from — distinguishes a
   *  real Phoenix-derived winner from the honest "no promote signal, showing
   *  a settled list" state from the fixture path. Never let a no-winner
   *  settle read as a confident pick. */
  selectionSource: string;
  /** Real final-response `<card>`s excluded as non-venue supporting info
   *  (e.g. "Booking Tips") — see entityExtraction.ts's isVenueLikeEntity. */
  excludedNonVenueCount: number;
  lastMutationType?: AgentMutation['type'];
  currentPassStage?: PassStage;
  passIndex?: number;
  passCount: number;
  passPhase?: PassPhase;
  passElapsed: number;
  passRemaining: number;
  isPlaying: boolean;
  speed: number;
  onPrevPass: () => void;
  onNextPass: () => void;
  onTogglePlay: () => void;
  onSetSpeed: (speed: number) => void;
}

const SPEED_OPTIONS = [0.5, 1, 1.5, 2];
const fmtSec = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

export default function DevInspector({
  level,
  phase,
  matchedTrace,
  spans,
  scenarioData,
  detectedRequest,
  skillRaw,
  resultTemplate,
  warnings,
  dataSource,
  poolSize,
  poolStatus,
  poolError,
  level2,
  level2Source,
  onReplay,
  onNewScenario,
  onJumpToResult,
  onBackToThinking,
  galleryOpen,
  onToggleGallery,
}: {
  level: ExperienceLevel;
  phase: ExperiencePhase;
  matchedTrace?: PhoenixTrace;
  spans: PhoenixSpan[];
  scenarioData?: ThinkingScenario;
  detectedRequest?: string;
  skillRaw?: string;
  resultTemplate: ResultTemplateId;
  warnings: string[];
  dataSource: DataSource;
  poolSize: number;
  poolStatus: 'loading' | 'ready' | 'error';
  poolError?: string;
  /** Legacy Level 2 state. Optional because Level 2 now runs on the scenario
   *  runtime and gets its own diagnostics panel (see level2/Level2Diagnostics);
   *  this inspector is mounted for Level 1. */
  level2?: Level2DevState;
  level2Source?: Level2TraceSourceState;
  onReplay: () => void;
  onNewScenario: () => void;
  onJumpToResult: () => void;
  onBackToThinking: () => void;
  /** Dev-only UI State Gallery (see Level2UIGallery.tsx) — every Level 2
   *  card state/tier/count rendered directly, no trace replay needed.
   *  Undefined outside Level 2 (the toggle button simply doesn't render). */
  galleryOpen?: boolean;
  onToggleGallery?: () => void;
}) {
  const [tab, setTab] = useState<Tab>('session');
  const [placesStatus, setPlacesStatus] = useState<{ ok: boolean; error?: string } | undefined>();
  const [pexelsStatus, setPexelsStatus] = useState<{ ok: boolean; error?: string } | undefined>();
  const tabs = level === 'level2' ? TABS_LEVEL2 : TABS_LEVEL1;
  const activeTab = tabs.some((t) => t.id === tab) ? tab : 'session';

  const recallingStep = scenarioData?.steps.find((s) => s.type === 'retrieving');
  const preferenceSource = !recallingStep
    ? '—'
    : recallingStep.evidence.some((e) => e.type === 'preference')
      ? 'real trace'
      : 'fallback presentation';

  useEffect(() => {
    let cancelled = false;
    checkGooglePlacesConfigured().then((r) => { if (!cancelled) setPlacesStatus(r); });
    checkPexelsConfigured().then((r) => { if (!cancelled) setPexelsStatus(r); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="att-dev-panel">
      <div className="att-dev-header">
        <div className="att-dev-title">AGENT EXPERIENCE — DEV INSPECTOR</div>
        {level !== 'level2' && (
          <div className="att-dev-status-row">
            <span
              className={`att-dev-dot ${
                poolStatus === 'ready' ? 'att-dev-dot--ok' : poolStatus === 'error' ? 'att-dev-dot--error' : 'att-dev-dot--loading'
              }`}
            />
            <span>{poolStatus === 'ready' ? 'Connected' : poolStatus === 'error' ? 'Error' : 'Loading…'}</span>
            <span className="att-badge-source">
              {dataSource === 'phoenix-live'
                ? 'Phoenix Live'
                : dataSource === 'phoenix-cached'
                  ? 'Cached Phoenix Trace'
                  : dataSource === 'demo-presentation'
                    ? 'Level 2 Presentation Fixture'
                    : 'Unavailable'}
            </span>
            <span
              className={`att-dev-dot ${placesStatus == null ? 'att-dev-dot--loading' : placesStatus.ok ? 'att-dev-dot--ok' : 'att-dev-dot--error'}`}
            />
            <span>Google Places: {placesStatus == null ? 'checking…' : placesStatus.ok ? 'configured' : 'not configured'}</span>
          </div>
        )}
        {poolStatus === 'error' && poolError && level !== 'level2' && (
          <div style={{ marginTop: 6, fontSize: 11, color: '#e4558a' }}>Phoenix pool scan error: {poolError}</div>
        )}
        {placesStatus && !placesStatus.ok && placesStatus.error && level !== 'level2' && (
          <div style={{ marginTop: 4, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Places: {placesStatus.error}</div>
        )}

        {level === 'level2' && level2 && level2Source && (
          <>
            <div className="att-dev-status-row">
              <span
                className={`att-dev-dot ${
                  level2Source.status === 'ready' ? 'att-dev-dot--ok' : level2Source.status === 'error' ? 'att-dev-dot--error' : 'att-dev-dot--loading'
                }`}
              />
              <span>{level2Source.status === 'ready' ? 'Ready' : level2Source.status === 'error' ? 'Error (fell back)' : 'Discovering…'}</span>
              <span className="att-badge-source">
                {level2Source.dataSource === 'phoenix-live'
                  ? 'Phoenix Replay'
                  : level2Source.dataSource === 'phoenix-cached'
                    ? 'Cached Phoenix Trace'
                    : 'Fixture'}
              </span>
              {level2Source.compatibility && (
                <span className="att-badge-source">Level 2 fit: {level2Source.compatibility.score}</span>
              )}
            </div>
            <div className="att-dev-status-row" style={{ marginTop: 6 }}>
              <span
                className={`att-dev-dot ${placesStatus == null ? 'att-dev-dot--loading' : placesStatus.ok ? 'att-dev-dot--ok' : 'att-dev-dot--error'}`}
              />
              <span>Google Places photos: {placesStatus == null ? 'checking…' : placesStatus.ok ? 'auth OK (see GAPS for photo-tier check)' : 'not configured'}</span>
              <span
                className={`att-dev-dot ${pexelsStatus == null ? 'att-dev-dot--loading' : pexelsStatus.ok ? 'att-dev-dot--ok' : 'att-dev-dot--error'}`}
              />
              <span>Pexels: {pexelsStatus == null ? 'checking…' : pexelsStatus.ok ? 'configured' : 'not configured'}</span>
            </div>
            {level2Source.error && (
              <div style={{ marginTop: 6, fontSize: 11, color: '#e4558a' }}>Discovery error: {level2Source.error}</div>
            )}
            <div className="att-dev-controls-row">
              <button
                className={`att-playback-btn${level2Source.dataSource === 'phoenix-live' ? ' active' : ''}`}
                onClick={level2Source.reload}
              >
                Phoenix Replay
              </button>
              <button
                className={`att-playback-btn${level2Source.dataSource === 'phoenix-cached' ? ' active' : ''}`}
                onClick={level2Source.useCached}
              >
                Cached Trace
              </button>
              <button
                className={`att-playback-btn${level2Source.dataSource === 'fixture' ? ' active' : ''}`}
                onClick={level2Source.useFixture}
              >
                Fixture
              </button>
              {onToggleGallery && (
                <button
                  className={`att-playback-btn${galleryOpen ? ' active' : ''}`}
                  onClick={onToggleGallery}
                  title="Every card state/tier/count, no trace replay needed"
                >
                  {galleryOpen ? 'Close UI Gallery' : 'UI Gallery'}
                </button>
              )}
            </div>
          </>
        )}

        <div className="att-dev-meta-grid">
          <span className="att-dev-meta-label">Experience Level</span>
          <span className="att-dev-meta-value">{LEVEL_LABEL[level]}</span>
          <span className="att-dev-meta-label">Experience Phase</span>
          <span className="att-dev-meta-value">{phase}</span>

          {level === 'level1' && (
            <>
              <span className="att-dev-meta-label">Detected skill(s)</span>
              <span className="att-dev-meta-value">{skillRaw ?? '—'}</span>
              <span className="att-dev-meta-label">Phoenix Trace</span>
              <span className="att-dev-meta-value">{matchedTrace ? matchedTrace.trace_id.slice(0, 12) + '…' : '—'}</span>
              <span className="att-dev-meta-label">Result Template</span>
              <span className="att-dev-meta-value">{resultTemplate}</span>
              <span className="att-dev-meta-label">Candidate pool</span>
              <span className="att-dev-meta-value">{poolSize} traces</span>
              <span className="att-dev-meta-label">Preference source</span>
              <span className="att-dev-meta-value">{preferenceSource}</span>
            </>
          )}

          {level === 'level2' && level2 && level2Source && (
            <>
              <span className="att-dev-meta-label">Real trace ID</span>
              <span className="att-dev-meta-value">{level2Source.traceId ? level2Source.traceId.slice(0, 16) + '…' : '—'}</span>
              <span className="att-dev-meta-label">Real request</span>
              <span className="att-dev-meta-value">{level2Source.journey.query || '—'}</span>
              <span className="att-dev-meta-label">Current Pass</span>
              <span className="att-dev-meta-value">
                {level2.currentPassStage ? level2.currentPassStage.toUpperCase() : '—'}
                {level2.passIndex != null ? ` (${level2.passIndex + 1}/${level2.passCount})` : ''}
              </span>
              <span className="att-dev-meta-label">Pass phase</span>
              <span className="att-dev-meta-value">{level2.passPhase ? level2.passPhase.toUpperCase() : '—'}</span>
              <span className="att-dev-meta-label">Pass elapsed / remaining</span>
              <span className="att-dev-meta-value">{fmtSec(level2.passElapsed)} / {fmtSec(level2.passRemaining)}</span>
              <span className="att-dev-meta-label">Agent Action Type</span>
              <span className="att-dev-meta-value">{level2.narrationType ?? '—'}</span>
              <span className="att-dev-meta-label">Narration</span>
              <span className="att-dev-meta-value">{level2.narrationText || '—'}</span>
              <span className="att-dev-meta-label">Insight</span>
              <span className="att-dev-meta-value">{level2.insightText || '—'}</span>
              <span className="att-dev-meta-label">Current mutation</span>
              <span className="att-dev-meta-value">{level2.lastMutationType ?? '—'}</span>
              <span className="att-dev-meta-label">Visible / enriched</span>
              <span className="att-dev-meta-value">{level2.itemCount} / {level2.enrichedCount}</span>
              <span className="att-dev-meta-label">Negated / shortlisted</span>
              <span className="att-dev-meta-value">{level2.negatedCount} / {level2.shortlistedCount}</span>
              <span className="att-dev-meta-label">Promoted item</span>
              <span className="att-dev-meta-value">{level2.promotedId ?? '—'}</span>
              <span className="att-dev-meta-label">Removed items</span>
              <span className="att-dev-meta-value">{level2.removedIds.length ? level2.removedIds.join(', ') : '—'}</span>
              <span className="att-dev-meta-label">Analysis layout</span>
              <span className="att-dev-meta-value">
                {level2.analysisLayout.compact ? 'compact' : 'standard'} · base width {level2.analysisLayout.width}px · gap {level2.analysisLayout.gap}px
              </span>
              <span className="att-dev-meta-label">All candidates in viewport</span>
              <span className="att-dev-meta-value">
                {level2.itemCount}/{level2.itemCount} (guaranteed by layout math — width×count+gaps ≤ 1776px canvas)
              </span>
              <span className="att-dev-meta-label">Original index → result index</span>
              <span className="att-dev-meta-value">
                {level2.originalIndex != null ? `#${level2.originalIndex} → #${level2.resultIndex}` : '—'}
              </span>
              <span className="att-dev-meta-label">Result mode</span>
              <span className="att-dev-meta-value">{level2.promotedId && level2.resultIndex != null ? 'horizontal rail (winner-first)' : 'analysis grid'}</span>
              <span className="att-dev-meta-label">Requested attributes (from query)</span>
              <span className="att-dev-meta-value">{level2.requestedFields.length ? level2.requestedFields.join(', ') : '— (none named explicitly)'}</span>
              <span className="att-dev-meta-label">Promoted card importance</span>
              <span className="att-dev-meta-value">{level2.promotedImportance ?? '—'}</span>
              <span className="att-dev-meta-label">Promoted card image source</span>
              <span className="att-dev-meta-value">{level2.imageTier != null ? `tier ${level2.imageTier} — ${IMAGE_TIER_LABEL[level2.imageTier]}` : '—'}</span>
              <span className="att-dev-meta-label">Selection source</span>
              <span className="att-dev-meta-value">{level2.selectionSource}</span>
              <span className="att-dev-meta-label">Excluded non-venue cards</span>
              <span className="att-dev-meta-value">{level2.excludedNonVenueCount}</span>
            </>
          )}
        </div>

        <div className="att-dev-controls-row">
          <button className="att-playback-btn" onClick={onReplay}>Replay</button>
          <button className="att-playback-btn" onClick={onNewScenario}>New Scenario</button>
          <button className="att-playback-btn" onClick={onJumpToResult}>Jump to Result</button>
          <button className="att-playback-btn" onClick={onBackToThinking}>Back to Thinking</button>
        </div>

        {level === 'level2' && level2 && level2Source && (
          <div className="att-dev-controls-row">
            <button className="att-playback-btn" onClick={level2.onPrevPass}>⟵ Prev Pass</button>
            <button className="att-playback-btn" onClick={level2.onTogglePlay}>{level2.isPlaying ? 'Pause' : 'Resume'}</button>
            <button className="att-playback-btn" onClick={level2.onNextPass}>Next Pass ⟶</button>
            {SPEED_OPTIONS.map((s) => (
              <button
                key={s}
                className={`att-playback-btn${level2.speed === s ? ' active' : ''}`}
                onClick={() => level2.onSetSpeed(s)}
              >
                {s}x
              </button>
            ))}
          </div>
        )}

        {warnings.length > 0 && (
          <div style={{ marginTop: 10, fontSize: 11, color: '#f5c542' }}>
            {warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
          </div>
        )}
      </div>

      <div className="att-dev-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`att-dev-tab${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="att-dev-body">
        {activeTab === 'session' && level === 'level1' && (
          <>
            <div style={{ marginBottom: 8, opacity: 0.6 }}>Detected request (raw trace): {detectedRequest ?? '—'}</div>
            <div style={{ marginBottom: 8, opacity: 0.6 }}>Detected skill(s): {skillRaw ?? '—'}</div>
            <div style={{ marginBottom: 8, opacity: 0.6 }}>Resolved template: {resultTemplate}</div>
            <div style={{ marginBottom: 8, opacity: 0.6 }}>Candidate pool size (this session): {poolSize}</div>
            <pre>{JSON.stringify(matchedTrace, null, 2)}</pre>
          </>
        )}

        {activeTab === 'session' && level === 'level2' && level2 && level2Source && (
          <>
            <div style={{ marginBottom: 8, opacity: 0.6 }}>
              Source: {level2Source.dataSource === 'phoenix-live' ? 'real Phoenix trace, replayed live' : level2Source.dataSource === 'phoenix-cached' ? 'cached real Phoenix trace (Phoenix unavailable at discovery time)' : 'Level 2 presentation fixture (src/data/level2TravelFixture.ts) — not a Phoenix trace'}.
            </div>
            <div style={{ marginBottom: 8, opacity: 0.6 }}>Real trace ID: {level2Source.traceId ?? '—'}</div>
            <div style={{ marginBottom: 8, opacity: 0.6 }}>Real request: {level2Source.journey.query || '—'}</div>
            {level2Source.compatibility && (
              <div style={{ marginBottom: 8, opacity: 0.6 }}>
                Compatibility: {level2Source.compatibility.score} — {level2Source.compatibility.reasons.join(' ')}
              </div>
            )}
            <div style={{ marginBottom: 8, opacity: 0.6 }}>Current pass: {level2.currentPassStage ?? '—'} ({level2.passPhase ?? '—'})</div>
            <div style={{ marginBottom: 8, opacity: 0.6 }}>Agent action type: {level2.narrationType ?? '—'}</div>
            <div style={{ marginBottom: 8, opacity: 0.6 }}>Narration: {level2.narrationText || '—'}</div>
            <div style={{ marginBottom: 8, opacity: 0.6 }}>Insight: {level2.insightText || '—'}</div>
            <div style={{ marginBottom: 8, opacity: 0.6 }}>Current mutation: {level2.lastMutationType ?? '—'}</div>
            <div style={{ marginBottom: 8, opacity: 0.6 }}>Promoted item: {level2.promotedId ?? '—'}</div>
            <div style={{ marginBottom: 8, opacity: 0.6 }}>Removed items: {level2.removedIds.length ? level2.removedIds.join(', ') : '—'}</div>

            {level2Source.scoredCandidates.length > 0 && (
              <>
                <div style={{ marginTop: 16, marginBottom: 8, fontWeight: 700, opacity: 0.8 }}>
                  TRACE SELECTOR — last discovery run ({level2Source.scoredCandidates.length} candidates scored)
                </div>
                {level2Source.scoredCandidates.map((c) => (
                  <div key={c.traceId} className="att-step-inspect">
                    <div className="att-step-inspect-label">
                      {c.request.slice(0, 90) || '(no request text)'}{c.traceId === level2Source.traceId ? '  ← selected' : ''}
                    </div>
                    <div className="att-step-inspect-meta">trace: {c.traceId.slice(0, 16)}…</div>
                    <div className="att-step-inspect-meta">spans: {c.spanCount} · tool calls: {c.toolCallCount}</div>
                    <div className="att-step-inspect-meta">Level 2 compatibility: {c.compatibility.score}</div>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {activeTab === 'mutations' && level2Source && (
          <>
            <div style={{ marginBottom: 10, opacity: 0.6 }}>
              Every mutation the currently-loaded journey will replay, grouped by pass — exactly what
              phoenixSpansToMutations() derived from the real trace (or the fixture, if that's the active source).
              sourceSpanIds/confidence are absent on fixture mutations by design (see progressiveValue.ts).
            </div>
            {level2Source.journey.passes.map((pass) => (
              <div key={pass.id} style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 700, opacity: 0.85, marginBottom: 4 }}>
                  {pass.stage.toUpperCase()} — "{pass.narration.text}"{pass.insight ? ` · insight: "${pass.insight.text}"` : ''}
                </div>
                {pass.mutations.map((pm, i) => (
                  <div key={i} className="att-step-inspect">
                    <div className="att-step-inspect-label">
                      {pm.mutation.type}
                      {pm.mutation.confidence ? (
                        <span style={{ marginLeft: 8, opacity: 0.6, fontWeight: 400 }}>confidence: {pm.mutation.confidence}</span>
                      ) : null}
                    </div>
                    <div className="att-step-inspect-meta">
                      source spans: {pm.mutation.sourceSpanIds?.length ? pm.mutation.sourceSpanIds.join(', ') : '— (fixture)'}
                    </div>
                    <div className="att-step-inspect-meta">{JSON.stringify(pm.mutation).slice(0, 220)}</div>
                  </div>
                ))}
              </div>
            ))}
            {!level2Source.journey.passes.length && <div style={{ opacity: 0.5 }}>No passes yet.</div>}
          </>
        )}

        {activeTab === 'gaps' && level2Source && (
          <>
            <div style={{ marginBottom: 10, opacity: 0.6 }}>
              What this trace's real data could NOT support — mutations that were considered and deliberately
              skipped rather than guessed (see LEVEL2_INSTRUMENTATION_GAPS.md for the systemic version of this list).
            </div>
            {level2Source.diagnostics ? (
              <>
                <div style={{ marginBottom: 8, opacity: 0.7 }}>Recognized tools: {level2Source.diagnostics.recognizedTools.join(', ') || '—'}</div>
                <div style={{ marginBottom: 8, opacity: 0.7 }}>Unrecognized tools: {level2Source.diagnostics.unrecognizedTools.join(', ') || '—'}</div>
                <div style={{ marginBottom: 8, opacity: 0.7 }}>Unusable tool outputs: {level2Source.diagnostics.unusableToolOutputs.join(', ') || '—'}</div>
                <div style={{ marginBottom: 8, opacity: 0.7 }}>Real candidates extracted: {level2Source.diagnostics.extractedEntityCount} · final response cards: {level2Source.diagnostics.finalCardCount}</div>
                <div style={{ marginTop: 12, marginBottom: 6, fontWeight: 700, opacity: 0.8 }}>
                  Excluded non-venue cards ({level2Source.diagnostics.excludedNonVenueCards.length})
                </div>
                <div style={{ marginBottom: 8, opacity: 0.6, fontSize: 12 }}>
                  Real final-response &lt;card&gt;s that read as supporting info (e.g. "Booking Tips"), not a
                  comparable venue — kept out of the candidate/shortlist pipeline entirely.
                </div>
                {level2Source.diagnostics.excludedNonVenueCards.map((title, i) => (
                  <div key={i} style={{ marginBottom: 6, fontSize: 12, opacity: 0.65 }}>✕ {title}</div>
                ))}
                {!level2Source.diagnostics.excludedNonVenueCards.length && <div style={{ opacity: 0.5, marginBottom: 8 }}>None excluded for this trace.</div>}
                <div style={{ marginTop: 12, marginBottom: 6, fontWeight: 700, opacity: 0.8 }}>Skipped mutations ({level2Source.diagnostics.skipped.length})</div>
                {level2Source.diagnostics.skipped.map((s, i) => (
                  <div key={i} style={{ marginBottom: 6, fontSize: 12, opacity: 0.65 }}>⚠ {s}</div>
                ))}
                {!level2Source.diagnostics.skipped.length && <div style={{ opacity: 0.5 }}>Nothing skipped for this trace.</div>}
              </>
            ) : (
              <div style={{ opacity: 0.5 }}>No mapping diagnostics — running on the fixture.</div>
            )}
          </>
        )}

        {activeTab === 'session' && level === 'level3' && (
          <div style={{ opacity: 0.6 }}>Level 3 is a placeholder — no session state yet.</div>
        )}

        {activeTab === 'raw-spans' && (
          <pre>{JSON.stringify(spans, null, 2)}</pre>
        )}

        {activeTab === 'mapped-steps' && (
          <>
            {(scenarioData?.steps ?? []).map((step) => (
              <div key={step.id} className="att-step-inspect">
                <div className="att-step-inspect-label">{step.label} <span style={{ opacity: 0.5 }}>({step.type})</span></div>
                <div className="att-step-inspect-meta">resolved visual mode: <strong>{resolveLevel1VisualMode(step)}</strong></div>
                <div className="att-step-inspect-meta">spans: {step.technical?.spanNames.join(', ') || '—'}</div>
                <div className="att-step-inspect-meta">kinds: {step.technical?.spanKinds.join(', ') || '—'}</div>
                <div className="att-step-inspect-meta">span ids: {step.sourceSpanIds.join(', ') || '—'}</div>
                <div className="att-step-inspect-meta">evidence: {step.evidence.length}</div>
              </div>
            ))}
            {!scenarioData?.steps.length && <div style={{ opacity: 0.5 }}>No steps mapped.</div>}
          </>
        )}

        {activeTab === 'evidence' && (
          <pre>{JSON.stringify(scenarioData?.steps.flatMap((s) => s.evidence) ?? [], null, 2)}</pre>
        )}

        {activeTab === 'images' && (
          <>
            <div style={{ marginBottom: 8, opacity: 0.6 }}>
              Per-evidence-item image resolution. "detected field" reflects whatever key the normalizer actually
              matched (image/image_url/thumbnail/etc) — see raw below each row if it looks wrong.
            </div>
            {(scenarioData?.steps.flatMap((s) => s.evidence) ?? []).map((ev) => (
              <div key={ev.id} className="att-step-inspect">
                <div className="att-step-inspect-label">{ev.title || '(untitled)'} <span style={{ opacity: 0.5 }}>({ev.type})</span></div>
                <div className="att-step-inspect-meta">image url: {ev.image || '— none extracted —'}</div>
                <div className="att-step-inspect-meta">source: {ev.source || '—'}</div>
                <div className="att-step-inspect-meta">fallback will be used: {ev.image ? 'only on load failure' : 'no image slot (text card)'}</div>
              </div>
            ))}
            {!(scenarioData?.steps.flatMap((s) => s.evidence) ?? []).length && (
              <div style={{ opacity: 0.5 }}>No evidence mapped yet.</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
