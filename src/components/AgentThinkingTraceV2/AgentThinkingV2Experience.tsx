import { useEffect, useMemo, useRef, useState } from 'react';
import AgentMascot from '../Shared/AgentMascot';
import Level2FinalResponse, { resolveAdaptedResponse } from '../AgentThinkingTrace/level2/Level2FinalResponse';
import { ScenarioTypeSelector } from '../AgentThinkingTrace/level2/ScenarioTypeSelector';
import { CandidateCanvasThinking } from '../AgentThinkingTrace/level2/CandidateCanvasThinking';
import { resolveThinkingRenderer } from '../../level2/renderers/registry';
import { useLevel2Scenario } from '../../level2/runtime/useLevel2Scenario';
import { useLevel2Runtime } from '../../level2/runtime/useLevel2Runtime';
import type { ScenarioArchetype } from '../../level2/types/archetype';

/* ─────────────────────────────────────────────────────────────────────────────
   AGENT THINKING V2 — /agent_thinking_v2

   The simplified Level 2 thinking → result flow:

     USER INPUT (top-right, persistent)
       ↓
     AGENT CENTERED — mascot + one narration line, mid-screen
       ↓
     LIGHTWEIGHT VISUAL EVIDENCE — appears BELOW the agent, in step with
     what the narration says (images when "Found 5…", facts when
     "Checking prices…", receding tiles when "Narrowing…")
       ↓
     THINKING COMPLETES — final centered statement
       ↓
     EVERYTHING COMPRESSES — evidence shrinks/consolidates
       ↓
     AGENT MOVES TO TOP-LEFT — the hero transition
       ↓
     FINAL RESPONSE — the existing /l1-scenarios template mounts
       (its own mascot pops in exactly where ours landed)

   Deliberately REMOVED from the previous iteration: the flying-tile field,
   the winner-zoom takeover, any card growing large during thinking. Thinking
   hierarchy is restrained (neutral / strong / receding only); the real
   recommendation hierarchy belongs to the final L1 response.

   DATA LAYER IS UNTOUCHED. This component reads useLevel2Scenario +
   useLevel2Runtime exactly as the /agent_thinking_trace Level 2 shell does.
   The runtime's phases map 1:1 onto the experience phases:

     loading        → intro        agent acknowledges the task, centered
     thinking       → thinking     centered narration + lightweight evidence
     consolidating  → compressing  evidence gathers itself, closing statement
     resolving      → handoff      agent travels center → top-left
     final          → final        L1 template owns the stage
   ───────────────────────────────────────────────────────────────────────────── */

type ExperiencePhase = 'intro' | 'thinking' | 'compressing' | 'handoff' | 'final';

const SOURCE_LABEL: Record<string, string> = {
  phoenix: 'Real Agent Harness trace, mapped live',
  cached_phoenix: 'Real Agent Harness trace (cached spans)',
  harness_stream: 'Real captured harness stream',
  fixture: 'Presentation fixture — not Phoenix output',
};

/** The agent acknowledging the task — the first centered beat, before any
 *  real pass narration arrives. Consumer language only. */
const INTRO_LINE = 'Got it — looking for the best options for you.';
const INTRO_HOLD_MS = 1800;

/** The last centered thinking statement, spoken while the evidence
 *  compresses. Phrased per answer shape, never per internal mechanism. */
const CLOSING_LINE: Partial<Record<ScenarioArchetype, string>> = {
  candidate_ranking: 'I’ve got the strongest options.',
  comparison: 'I know how they stack up.',
  route_map: 'I’ve found the best way to go.',
  list: 'I found the ones that fit best.',
  single_entity: 'I found the one that fits best.',
};
const CLOSING_LINE_DEFAULT = 'I’ve got what you need.';

export default function AgentThinkingV2Experience() {
  const source = useLevel2Scenario();

  /* Hold the intro beat briefly even after the scenario is ready, so the
     acknowledgement is actually readable before pass 1 speaks. */
  const [introHold, setIntroHold] = useState(true);
  const scenarioId = source.scenario?.id;
  useEffect(() => {
    if (source.status !== 'ready') return;
    setIntroHold(true);
    const t = setTimeout(() => setIntroHold(false), INTRO_HOLD_MS);
    return () => clearTimeout(t);
  }, [source.status, scenarioId]);

  const runtime = useLevel2Runtime(
    source.scenario,
    source.selectedArchetype,
    source.status === 'loading' || introHold
  );

  /* The runtime's clock ticks from mount — restart it the moment the intro
     beat ends so pass 1 plays from zero instead of having burned under the
     acknowledgement line. */
  const replayRef = useRef(runtime.replay);
  replayRef.current = runtime.replay;
  useEffect(() => {
    if (!introHold) replayRef.current();
  }, [introHold]);

  const { scenario, phase: runtimePhase, currentPass } = runtime;

  const phase: ExperiencePhase =
    runtimePhase === 'loading'
      ? 'intro'
      : runtimePhase === 'thinking'
        ? 'thinking'
        : runtimePhase === 'consolidating'
          ? 'compressing'
          : runtimePhase === 'resolving'
            ? 'handoff'
            : 'final';

  /* ── Narration — one agent, one message ─────────────────────────────────
     intro        acknowledgement
     thinking     the current pass's consumer line (contract: never a raw
                  tool/span name — pass.ts forbids it upstream)
     compressing  the closing statement (kept through handoff so it fades
                  with the traveling agent rather than cutting)
     final        nothing — the final statement belongs to the L1 template */
  const narration =
    phase === 'intro'
      ? INTRO_LINE
      : phase === 'thinking'
        ? currentPass?.narration ?? ''
        : phase === 'compressing' || phase === 'handoff'
          ? (CLOSING_LINE[scenario?.archetype ?? 'summary'] ?? CLOSING_LINE_DEFAULT)
          : '';

  /* Key so each new line re-runs the enter animation — but NOT between
     compressing and handoff, where the same closing line only fades. */
  const narrationKey =
    phase === 'thinking' ? currentPass?.id ?? 'pass' : phase === 'handoff' ? 'compressing' : phase;

  /* ── Evidence — lightweight, below the centered agent ────────────────────
     Canvas-carrying archetypes (candidate_ranking) keep ONE persistent
     canvas: previews appear when items are added, gain a fact when enriched,
     recede when narrowed — never unmounting between passes. Everything else
     renders the current pass's typed value renderer. */
  const hasCanvas = runtime.items.length > 0;
  const ThinkingRenderer =
    scenario && currentPass?.valueType
      ? resolveThinkingRenderer(scenario.archetype, currentPass.valueType)
      : undefined;

  const showPassValue = !hasCanvas && !!ThinkingRenderer && !!currentPass?.payload;
  /* A status pass (no payload) while a canvas is up = "the agent is gathering
     more information" — a quiet scan rides across the existing previews. */
  const isScanning = phase === 'thinking' && hasCanvas && !!currentPass && !currentPass.payload;

  const isThinkingPhase = phase === 'intro' || phase === 'thinking' || phase === 'compressing';
  const showEvidence = (phase === 'thinking' || phase === 'compressing' || phase === 'handoff') && (hasCanvas || showPassValue);

  /* ── Final reveal — a beat after the agent lands top-left ──────────────── */
  const [showFinalLayer, setShowFinalLayer] = useState(false);
  useEffect(() => {
    if (phase !== 'final') {
      setShowFinalLayer(false);
      return;
    }
    const t = setTimeout(() => setShowFinalLayer(true), 350);
    return () => clearTimeout(t);
  }, [phase]);

  /* ── Dev chrome (D) — developer content never mixes with consumer UI ───── */
  const [devOpen, setDevOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'd') setDevOpen((v) => !v);
      else if (e.key === ' ') {
        e.preventDefault();
        if (runtime.isPlaying) runtime.pause();
        else runtime.play();
      } else if (k === 'r') source.refresh();
      else if (k === 'f') runtime.jumpToFinal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [runtime, source]);

  const finalFamily = useMemo(
    () => (runtime.finalResponse ? resolveAdaptedResponse(runtime.finalResponse).family : '—'),
    [runtime.finalResponse]
  );

  /* Mascot animates via CSS on .atv2-agent; keep a ref only to scope reflow
     reads if ever needed — the travel itself is a pure class transition. */
  const agentRef = useRef<HTMLDivElement | null>(null);

  return (
    <div id="scaler">
      <div id="stage" className="atv2-stage" data-phase={phase}>
        {/* Ambient purple background — same family as the existing stage */}
        <div className="atv2-bg" />
        <div className="atv2-bg-glow" />
        <div className="atv2-bg-vignette" />

        {/* TOP LEFT — logo */}
        <div className="atv2-header">
          <img
            className="atv2-logo"
            src="/glance-logo.png"
            alt="glance"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>

        {/* TOP CENTER — level selector */}
        <div className="atv2-level-switch">
          {(['Level 1', 'Level 2', 'Level 3'] as const).map((label) => (
            <button
              key={label}
              className={`atv2-level-btn${label === 'Level 2' ? ' atv2-level-btn--active' : ''}`}
              onClick={() => {
                if (label !== 'Level 2') window.location.href = '/agent_thinking_trace';
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* TOP RIGHT — the user's query, persistent through every phase */}
        {scenario?.prompt && (
          <div className="atv2-query">
            <span className="atv2-query-prefix">You asked</span>
            <div className="atv2-query-pill">
              <span className="atv2-query-text">{scenario.prompt}</span>
            </div>
          </div>
        )}

        {/* THE AGENT — centered during thinking, travels to the top-left on
            handoff. One element, one shared-position transition: the hero
            moment of the whole experience. */}
        <div ref={agentRef} className={`atv2-agent atv2-agent--${phase}`}>
          <AgentMascot agentMode={isThinkingPhase ? 'thinking' : 'looking'} size={80} />
        </div>

        {/* CENTER NARRATION — one message at a time, under the mascot */}
        {narration && (
          <div className={`atv2-narration-slot atv2-narration-slot--${phase}`}>
            <div key={narrationKey} className="atv2-narration">
              {narration}
            </div>
            {/* A status pass with no evidence on screen still has to read as
                alive — the shared quiet typing pulse, never fabricated
                content. */}
            {(phase === 'intro' || (phase === 'thinking' && !!currentPass && !currentPass.payload && !hasCanvas)) && (
              <div className="att-l2v-ambient atv2-ambient" aria-hidden>
                <span /><span /><span />
              </div>
            )}
          </div>
        )}

        {/* LIGHTWEIGHT EVIDENCE — below the centered agent. Neutral / strong /
            receding only; nothing here ever becomes the final response. */}
        {showEvidence && scenario && (
          <div
            className={`atv2-evidence atv2-evidence--${phase}${isScanning ? ' atv2-evidence--scanning' : ''}`}
          >
            {hasCanvas ? (
              <CandidateCanvasThinking
                pass={currentPass!}
                scenario={scenario}
                payload={(currentPass?.payload ?? { entities: [] }) as never}
                runtime={runtime}
              />
            ) : (
              showPassValue &&
              ThinkingRenderer &&
              currentPass && (
                <div
                  // Same stable-key contract as Level2ScenarioExperience.tsx —
                  // sources/route persist and update in place instead of
                  // remounting on every sub-beat/map stage.
                  key={
                    currentPass.valueType === 'sources' || currentPass.valueType === 'route'
                      ? `${currentPass.valueType}-canvas`
                      : currentPass.id
                  }
                  className="atv2-pass"
                  data-active-hold={
                    runtime.timingMode === 'actual' && runtime.passPhase === 'hold' && currentPass.payload
                      ? currentPass.valueType ?? 'generic'
                      : undefined
                  }
                >
                  <ThinkingRenderer
                    pass={currentPass}
                    scenario={scenario}
                    payload={currentPass.payload as never}
                    runtime={runtime}
                  />
                </div>
              )
            )}
          </div>
        )}

        {/* FINAL RESPONSE — the existing /l1-scenarios template, full stage.
            Its own mascot pops in exactly where ours landed; the traveling
            agent above fades under it (see .atv2-agent--final). */}
        {showFinalLayer && runtime.finalResponse && (
          <div className="atv2-final-layer">
            <Level2FinalResponse response={runtime.finalResponse} />
          </div>
        )}

        {/* Dev chrome — D only. Kept entirely outside the consumer canvas. */}
        {devOpen && (
          <>
            <div className="atv2-dev-panel">
              <div className="atv2-dev-title">Level 2 · Dev</div>
              <div className="atv2-dev-row"><span>Archetype</span><b>{scenario?.archetype ?? '—'}</b></div>
              <div className="atv2-dev-row"><span>Source</span><b>{scenario?.source ?? '—'}</b></div>
              <div className="atv2-dev-row">
                <span>Current pass</span>
                <b>{runtime.currentPassIndex + 1} / {runtime.passCount}</b>
              </div>
              <div className="atv2-dev-row"><span>Phase</span><b>{phase}</b></div>
              <div className="atv2-dev-row"><span>Final renderer</span><b>{finalFamily}</b></div>
              {/* Timing mode — WHEN passes appear, never what they show.
                  Demo = curated cadence; Actual = the same passes on the real
                  Phoenix clock (see level2/runtime/schedule.ts). Disabled for
                  fixtures — real timing is never fabricated. */}
              <div className="atv2-dev-row" style={{ alignItems: 'center' }}>
                <span>Timing</span>
                <b>
                  <button
                    onClick={() => runtime.setTimingMode('demo')}
                    style={{
                      background: runtime.requestedTimingMode === 'demo' ? 'rgba(120,220,170,0.25)' : 'transparent',
                      color: 'inherit',
                      border: '1px solid rgba(255,255,255,0.25)',
                      borderRadius: 4,
                      padding: '2px 8px',
                      marginRight: 6,
                      cursor: 'pointer',
                      font: 'inherit',
                    }}
                  >
                    Demo
                  </button>
                  <button
                    onClick={() => runtime.setTimingMode('actual')}
                    disabled={!runtime.actualTimingAvailable}
                    title={runtime.actualTimingAvailable ? 'Replay on the real Phoenix clock' : 'Actual timing unavailable for fixture'}
                    style={{
                      background: runtime.requestedTimingMode === 'actual' ? 'rgba(120,220,170,0.25)' : 'transparent',
                      color: 'inherit',
                      border: '1px solid rgba(255,255,255,0.25)',
                      borderRadius: 4,
                      padding: '2px 8px',
                      cursor: runtime.actualTimingAvailable ? 'pointer' : 'not-allowed',
                      opacity: runtime.actualTimingAvailable ? 1 : 0.4,
                      font: 'inherit',
                    }}
                  >
                    Actual
                  </button>
                </b>
              </div>
              {runtime.timingMode === 'actual' && (
                <>
                  <div className="atv2-dev-row">
                    <span>Max idle gap</span>
                    <b>
                      {[0, 5000, 10000, 20000].map((ms) => (
                        <button
                          key={ms}
                          onClick={() => runtime.setMaxIdleGapMs(ms)}
                          style={{
                            background: runtime.maxIdleGapMs === ms ? 'rgba(120,220,170,0.25)' : 'transparent',
                            color: 'inherit',
                            border: '1px solid rgba(255,255,255,0.25)',
                            borderRadius: 4,
                            padding: '2px 6px',
                            marginLeft: 4,
                            cursor: 'pointer',
                            font: 'inherit',
                          }}
                        >
                          {ms ? `${ms / 1000}s` : 'Off'}
                        </button>
                      ))}
                    </b>
                  </div>
                  <div className="atv2-dev-row">
                    <span>Trace / elapsed</span>
                    <b>
                      {runtime.traceDurationMs != null ? `${(runtime.traceDurationMs / 1000).toFixed(1)}s` : '—'} ·{' '}
                      {(runtime.elapsed / 1000).toFixed(1)}s
                    </b>
                  </div>
                </>
              )}
              {!runtime.actualTimingAvailable && (
                <div className="atv2-dev-keys">Actual timing unavailable{scenario?.source === 'fixture' ? ' for fixture' : ''}</div>
              )}
              <div className="atv2-dev-keys">Space play/pause · R refresh · F jump to final</div>
            </div>
            <ScenarioTypeSelector
              selected={source.selectedArchetype}
              onSelect={source.selectArchetype}
              onRefresh={source.refresh}
              availability={source.availability}
              source={scenario ? SOURCE_LABEL[scenario.source] : undefined}
              isLoading={source.status === 'loading'}
              sourceMode={source.sourceMode}
              onSelectSourceMode={source.selectSourceMode}
              harnessStreamCaptures={source.harnessStreamCaptures}
              selectedHarnessCaptureId={source.selectedHarnessCaptureId}
              onSelectHarnessCapture={source.selectHarnessCapture}
              elapsedMs={scenario ? runtime.elapsed : undefined}
              totalMs={runtime.totalDuration}
              timingModeLabel={runtime.timingMode === 'actual' ? 'Real' : 'Demo'}
            />
          </>
        )}

        {source.status === 'error' && (
          <div className="atv2-error">{source.error}</div>
        )}

        {/* Source is never hidden — a fixture must never read as live output. */}
        {scenario && <div className="atv2-fixture-tag">{SOURCE_LABEL[scenario.source]}</div>}
      </div>
    </div>
  );
}
