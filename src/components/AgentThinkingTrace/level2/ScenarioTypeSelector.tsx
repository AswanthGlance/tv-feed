import { DEV_SCENARIO_KINDS, DEV_SCENARIO_LABEL, isMemoryRetrievalKind, type DevScenarioKind } from '../../../level2/types/devScenario';
import { MEMORY_RETRIEVAL_SCENARIOS } from '../../../level2/scenarios/memoryRetrievalScenarios';
import type { ArchetypeAvailability, HarnessStreamCapture } from '../../../level2/scenarios/registry';
import type { Level2SourceMode } from '../../../level2/runtime/useLevel2Scenario';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Scenario type selector.

   A DEMO/DEVELOPER control, on the right, deliberately separate from the
   leadership-facing Level 1 / Level 2 / Level 3 switch — it changes what KIND
   of answer Level 2 is demonstrating, not which level you are looking at.

   Selecting an option stops the current playback, loads a scenario for it and
   replays from the start; Refresh stays on the current selection and picks a
   different scenario. Both are engineering operations owned by
   useLevel2Scenario — this component only calls them.

   The real-trace count next to each option is honest signal: an archetype with
   no real corpus coverage says so rather than quietly serving a fixture as if
   it were live output. Memory Retrieval always reads 'fixture' — see
   memoryRetrievalScenarios.ts for why it deliberately never tries Phoenix.

   SOURCE is a separate axis from the archetype grid below it: 'Existing'
   is everything above (Phoenix / cached / fixture / memory-retrieval,
   picked by ANSWER SHAPE); 'Harness Stream' replaces the grid with a named
   list of the 10 real captured turns (Q01 School Backpacks … Q10 Wensi
   Tofu), picked by WHICH REAL CAPTURE, never a generic archetype request —
   the harness stream's value is that these are real agent runs worth
   inspecting individually, not one more pool `select()` reaches into. */

const SOURCE_MODE_LABEL: Record<Level2SourceMode, string> = {
  existing: 'Existing',
  harness_stream: 'Harness Stream',
};

const fmtSec = (ms: number | undefined) => (ms == null ? '—' : `${(ms / 1000).toFixed(1)}s`);

export function ScenarioTypeSelector({
  selected,
  onSelect,
  onRefresh,
  onNextExample,
  availability,
  source,
  isLoading,
  sourceMode,
  onSelectSourceMode,
  harnessStreamCaptures,
  selectedHarnessCaptureId,
  onSelectHarnessCapture,
  elapsedMs,
  totalMs,
  timingModeLabel,
}: {
  selected: DevScenarioKind;
  onSelect: (kind: DevScenarioKind) => void;
  /** REPLAY the current selection (same R-key semantics everywhere in
   *  Level 2 — never switches which scenario is showing). */
  onRefresh: () => void;
  /** Deliberately moves to a DIFFERENT scenario. Optional — omitted by
   *  callers that haven't wired it keeps just the Refresh button. */
  onNextExample?: () => void;
  availability: ArchetypeAvailability[];
  source?: string;
  isLoading: boolean;
  /** Omitted entirely by callers that haven't wired the source axis yet —
   *  defaults to the 'existing' grid so this stays backward compatible. */
  sourceMode?: Level2SourceMode;
  onSelectSourceMode?: (mode: Level2SourceMode) => void;
  harnessStreamCaptures?: HarnessStreamCapture[];
  selectedHarnessCaptureId?: string;
  onSelectHarnessCapture?: (id: string) => void;
  /** Live playback clock — folded into this panel rather than a dedicated
   *  timing panel, so "how long is this actually taking" stays visible
   *  without the full diagnostics panel mounted. */
  elapsedMs?: number;
  totalMs?: number;
  timingModeLabel?: 'Real' | 'Demo';
}) {
  const byArchetype = new Map(availability.map((a) => [a.archetype, a]));
  const mode: Level2SourceMode = sourceMode ?? 'existing';
  const canToggleSource = Boolean(onSelectSourceMode);

  return (
    <div className="att-l2-scenario-selector">
      <div className="att-l2-scenario-selector-head">
        <span className="att-l2-scenario-selector-title">Scenario Type</span>
        <div className="att-l2-scenario-head-actions">
          {/* Refresh = REPLAY (same as the R key — never changes which
              scenario is showing). Next Example is the deliberate "move on"
              action, kept as a visibly separate control. */}
          <button type="button" className="att-l2-scenario-refresh" onClick={onRefresh} disabled={isLoading} title="Replay this scenario from the start (R)">
            {isLoading ? '…' : 'Replay'}
          </button>
          {onNextExample && (
            <button type="button" className="att-l2-scenario-refresh" onClick={onNextExample} disabled={isLoading} title="Move to a different scenario (N)">
              Next Example
            </button>
          )}
        </div>
      </div>

      {canToggleSource && (
        <div className="att-l2-source-toggle">
          {(['existing', 'harness_stream'] as const).map((m) => (
            <button
              key={m}
              type="button"
              className={`att-l2-source-toggle-option${mode === m ? ' att-l2-source-toggle-option--active' : ''}`}
              onClick={() => onSelectSourceMode?.(m)}
            >
              {SOURCE_MODE_LABEL[m]}
            </button>
          ))}
        </div>
      )}

      {mode === 'harness_stream' ? (
        <div className="att-l2-scenario-options">
          {(harnessStreamCaptures ?? []).map((capture, i) => (
            <button
              key={capture.id}
              type="button"
              className={`att-l2-scenario-option${capture.id === selectedHarnessCaptureId ? ' att-l2-scenario-option--active' : ''}`}
              onClick={() => onSelectHarnessCapture?.(capture.id)}
            >
              <span className="att-l2-scenario-option-index">{i + 1}</span>
              <span className="att-l2-scenario-option-label">
                {capture.id.toUpperCase()} — {capture.label}
              </span>
              <span className="att-l2-scenario-option-count" title={`Classified as ${capture.archetype}`}>
                {capture.archetype}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="att-l2-scenario-options">
          {DEV_SCENARIO_KINDS.map((kind, i) => {
            const isMemory = isMemoryRetrievalKind(kind);
            const info = isMemory ? undefined : byArchetype.get(kind);
            const realCount = info?.realTraceCount ?? 0;
            return (
              <button
                key={kind}
                type="button"
                className={`att-l2-scenario-option${kind === selected ? ' att-l2-scenario-option--active' : ''}`}
                onClick={() => onSelect(kind)}
              >
                <span className="att-l2-scenario-option-index">{i + 1}</span>
                <span className="att-l2-scenario-option-label">{DEV_SCENARIO_LABEL[kind]}</span>
                <span
                  className="att-l2-scenario-option-count"
                  title={isMemory ? `${MEMORY_RETRIEVAL_SCENARIOS.length} curated fixture(s) — never a real trace, see dev notes` : `${realCount} real trace(s) in the corpus`}
                >
                  {isMemory ? 'fixture' : realCount > 0 ? realCount : 'fixture'}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Dev-only explanation — never shown in the leadership/consumer view
          (this whole selector is dev chrome). Only Memory Retrieval and
          Harness Stream get one: the nine answer-shape options are
          self-explanatory. */}
      {mode === 'existing' && isMemoryRetrievalKind(selected) && (
        <div className="att-l2-scenario-explainer">
          Demonstrates how relevant remembered context is surfaced before the agent continues.
        </div>
      )}
      {mode === 'harness_stream' && (
        <div className="att-l2-scenario-explainer">
          Real captured agent runs, classified by the same pipeline as every other source — not a hand-authored demo.
        </div>
      )}

      {source && <div className="att-l2-scenario-source">{source}</div>}

      {elapsedMs != null && (
        <div className="att-l2-scenario-timer">
          <span>{timingModeLabel ?? 'Demo'} timing</span>
          <span className="att-l2-scenario-timer-value">
            {fmtSec(elapsedMs)} / {fmtSec(totalMs)}
          </span>
        </div>
      )}
    </div>
  );
}
