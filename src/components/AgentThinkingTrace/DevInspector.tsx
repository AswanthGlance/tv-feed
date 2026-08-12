import { useEffect, useState } from 'react';
import type { PhoenixSpan, PhoenixTrace } from '../../types/phoenix';
import type { DataSource, ThinkingScenario } from '../../types/thinking';
import type { ExperiencePhase } from '../../hooks/useExperiencePhase';
import type { ResultTemplateId } from '../../adapters/resultTemplate';
import type { ExperienceLevel } from '../../types/experienceLevel';
import type { AgentMutation } from '../../types/progressiveValue';
import type { AgentActionType, PassPhase, PassStage } from '../../types/experiencePass';
import { checkGooglePlacesConfigured } from '../../api/googlePlacesClient';

type Tab = 'session' | 'raw-spans' | 'mapped-steps' | 'evidence';

const TABS: { id: Tab; label: string }[] = [
  { id: 'session', label: 'SESSION' },
  { id: 'raw-spans', label: 'RAW SPANS' },
  { id: 'mapped-steps', label: 'MAPPED STEPS' },
  { id: 'evidence', label: 'EVIDENCE' },
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
  onReplay,
  onNewScenario,
  onJumpToResult,
  onBackToThinking,
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
  level2: Level2DevState;
  onReplay: () => void;
  onNewScenario: () => void;
  onJumpToResult: () => void;
  onBackToThinking: () => void;
}) {
  const [tab, setTab] = useState<Tab>('session');
  const [placesStatus, setPlacesStatus] = useState<{ ok: boolean; error?: string } | undefined>();

  useEffect(() => {
    let cancelled = false;
    checkGooglePlacesConfigured().then((r) => { if (!cancelled) setPlacesStatus(r); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="att-dev-panel">
      <div className="att-dev-header">
        <div className="att-dev-title">AGENT EXPERIENCE — DEV INSPECTOR</div>
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
        {poolStatus === 'error' && poolError && (
          <div style={{ marginTop: 6, fontSize: 11, color: '#e4558a' }}>Phoenix pool scan error: {poolError}</div>
        )}
        {placesStatus && !placesStatus.ok && placesStatus.error && (
          <div style={{ marginTop: 4, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Places: {placesStatus.error}</div>
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
            </>
          )}

          {level === 'level2' && (
            <>
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
            </>
          )}
        </div>

        <div className="att-dev-controls-row">
          <button className="att-playback-btn" onClick={onReplay}>Replay</button>
          <button className="att-playback-btn" onClick={onNewScenario}>New Scenario</button>
          <button className="att-playback-btn" onClick={onJumpToResult}>Jump to Result</button>
          <button className="att-playback-btn" onClick={onBackToThinking}>Back to Thinking</button>
        </div>

        {level === 'level2' && (
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
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`att-dev-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="att-dev-body">
        {tab === 'session' && level === 'level1' && (
          <>
            <div style={{ marginBottom: 8, opacity: 0.6 }}>Detected request (raw trace): {detectedRequest ?? '—'}</div>
            <div style={{ marginBottom: 8, opacity: 0.6 }}>Detected skill(s): {skillRaw ?? '—'}</div>
            <div style={{ marginBottom: 8, opacity: 0.6 }}>Resolved template: {resultTemplate}</div>
            <div style={{ marginBottom: 8, opacity: 0.6 }}>Candidate pool size (this session): {poolSize}</div>
            <pre>{JSON.stringify(matchedTrace, null, 2)}</pre>
          </>
        )}

        {tab === 'session' && level === 'level2' && (
          <>
            <div style={{ marginBottom: 8, opacity: 0.6 }}>Source: Level 2 presentation fixture (src/data/level2TravelFixture.ts) — not a Phoenix trace.</div>
            <div style={{ marginBottom: 8, opacity: 0.6 }}>Current pass: {level2.currentPassStage ?? '—'} ({level2.passPhase ?? '—'})</div>
            <div style={{ marginBottom: 8, opacity: 0.6 }}>Agent action type: {level2.narrationType ?? '—'}</div>
            <div style={{ marginBottom: 8, opacity: 0.6 }}>Narration: {level2.narrationText || '—'}</div>
            <div style={{ marginBottom: 8, opacity: 0.6 }}>Insight: {level2.insightText || '—'}</div>
            <div style={{ marginBottom: 8, opacity: 0.6 }}>Current mutation: {level2.lastMutationType ?? '—'}</div>
            <div style={{ marginBottom: 8, opacity: 0.6 }}>Promoted item: {level2.promotedId ?? '—'}</div>
            <div style={{ marginBottom: 8, opacity: 0.6 }}>Removed items: {level2.removedIds.length ? level2.removedIds.join(', ') : '—'}</div>
          </>
        )}

        {tab === 'session' && level === 'level3' && (
          <div style={{ opacity: 0.6 }}>Level 3 is a placeholder — no session state yet.</div>
        )}

        {tab === 'raw-spans' && (
          <pre>{JSON.stringify(spans, null, 2)}</pre>
        )}

        {tab === 'mapped-steps' && (
          <>
            {(scenarioData?.steps ?? []).map((step) => (
              <div key={step.id} className="att-step-inspect">
                <div className="att-step-inspect-label">{step.label} <span style={{ opacity: 0.5 }}>({step.type})</span></div>
                <div className="att-step-inspect-meta">spans: {step.technical?.spanNames.join(', ') || '—'}</div>
                <div className="att-step-inspect-meta">kinds: {step.technical?.spanKinds.join(', ') || '—'}</div>
                <div className="att-step-inspect-meta">span ids: {step.sourceSpanIds.join(', ') || '—'}</div>
                <div className="att-step-inspect-meta">evidence: {step.evidence.length}</div>
              </div>
            ))}
            {!scenarioData?.steps.length && <div style={{ opacity: 0.5 }}>No steps mapped.</div>}
          </>
        )}

        {tab === 'evidence' && (
          <pre>{JSON.stringify(scenarioData?.steps.flatMap((s) => s.evidence) ?? [], null, 2)}</pre>
        )}
      </div>
    </div>
  );
}
