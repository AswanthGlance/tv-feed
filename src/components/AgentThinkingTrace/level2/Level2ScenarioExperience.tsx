import AgentMascot from '../../Shared/AgentMascot';
import QueryContext from '../QueryContext';
import { ScenarioTypeSelector } from './ScenarioTypeSelector';
import { resolveThinkingRenderer } from '../../../level2/renderers/registry';
import Level2FinalResponse from './Level2FinalResponse';
import type { Level2ScenarioState } from '../../../level2/runtime/useLevel2Scenario';
import type { Level2RuntimeState } from '../../../level2/types/runtime';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Scenario experience shell.

   Owns almost nothing. It reads `phase` from the runtime and hands the current
   pass (or the final response) to whichever renderer the registry resolves.
   There is no archetype conditional in this file and no timing logic — adding
   an archetype does not change it.

   The phase sequence is one continuous surface, never a route change:

     thinking       the current pass's value renderer is on screen
     consolidating  thinking is still shown, visibly settling
     resolving      handover beat — Level2FinalResponse mounts
     final          Level2FinalResponse holds the stage

   The status/value distinction is honoured structurally: a `status` pass has
   no payload and therefore renders narration alone. It cannot accidentally
   show a canvas, because it has nothing to show.

   Level2FinalResponse is not a renderer this file dispatches to — it IS one
   of the four existing /l1-scenarios templates, mounted full-stage with its
   own mascot, agent-line, and prompt row (same absolute coordinates as
   /l1-scenarios itself). So once `showFinal`, this shell's own status row and
   prompt row step aside entirely rather than layering a second mascot/prompt
   row on top of the one the L1 template already renders. */

const SOURCE_LABEL: Record<string, string> = {
  phoenix: 'Real Agent Harness trace, mapped live',
  cached_phoenix: 'Real Agent Harness trace (cached spans)',
  fixture: 'Presentation fixture — not Phoenix output',
};

export default function Level2ScenarioExperience({
  source,
  runtime,
  showDevChrome,
}: {
  source: Level2ScenarioState;
  runtime: Level2RuntimeState;
  /** The scenario selector is a demo/developer control. Hidden for a clean
   *  leadership view; the runtime is identical either way. */
  showDevChrome: boolean;
}) {
  const { scenario, phase } = runtime;
  const isThinking = phase === 'thinking' || phase === 'consolidating';
  const showFinal = phase === 'resolving' || phase === 'final';

  const currentPass = runtime.currentPass;
  const ThinkingRenderer =
    scenario && currentPass?.valueType ? resolveThinkingRenderer(scenario.archetype, currentPass.valueType) : undefined;

  return (
    <div className="att-l2-layer">
      <div className="att-header">
        <img
          className="att-logo"
          src="/glance-logo.png"
          alt="glance"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>

      <QueryContext query={scenario?.prompt ?? ''} />

      {/* ── The agent ──────────────────────────────────────────────────────
          ONE mascot for the whole journey. It is anchored in CSS at the L1
          template's own mascot coordinates (left 72, top 156, 80×80 — see
          L1Scenarios' AGENT_TOP) and pushed to centre stage by a transform
          while thinking. Returning to `transform: none` at consolidation
          therefore animates it from the centre to exactly where the L1 mascot
          is about to appear: a shared-position handoff, no second mascot, no
          jump. It unmounts only once the L1 template has taken over. */}
      {!showFinal && (
        <div className={`att-l2-agent att-l2-agent--${phase}`}>
          <AgentMascot agentMode="thinking" size={80} />
        </div>
      )}

      {/* Narration sits directly under the centred agent, and fades at
          consolidation — the L1 template types its own agent line, so keeping
          this one alive would put the same sentence on screen twice. */}
      {!showFinal && (
        <div className={`att-l2-narration-wrap att-l2-narration-wrap--${phase}`}>
          <div className={`att-l2-narration att-l2-narration--${phase}`}>
            {phase === 'loading' ? 'Getting started' : (currentPass?.narration ?? '')}
          </div>
          {/* Status pass (no payload): the canvas is deliberately empty, so a
              quiet typing-style pulse rides WITH the narration — the screen
              never reads as stuck, and nothing is fabricated below. */}
          {isThinking && currentPass && !currentPass.payload && (
            <div className="att-l2v-ambient" aria-hidden>
              <span /><span /><span />
            </div>
          )}
        </div>
      )}

      <div className={`att-l2-canvas att-l2-canvas--${phase}`}>
        {phase === 'loading' && (
          <div className="att-l2-skeleton-row">
            {[0, 1, 2].map((i) => (
              <div key={i} className="att-l2-skeleton-card" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        )}

        {/* KEYING IS LOAD-BEARING HERE.
            An entity_preview pass keeps the STABLE key 'canvas', so the
            candidate tiles mount exactly once — at "Found N …" — and then
            persist untouched through enrichment, comparison and narrowing.
            Only their props change. Keying this by pass id (as it was) tore
            the whole row down and rebuilt it on every sentence, which is why
            the cards appeared to reload and the images re-fetched.
            Non-canvas passes (sources, counts, text) are ephemeral by nature
            and keep their per-pass key so each still plays its entrance. */}
        {isThinking && scenario && currentPass && (
          <div
            className={`att-l2v-pass att-l2v-pass--${runtime.passPhase ?? 'hold'}`}
            key={currentPass.valueType === 'entity_preview' ? 'canvas' : currentPass.id}
          >
            {/* A status pass has no payload by contract — narration (plus the
                ambient pulse beside it, see the status row above) is the
                whole of it. Nothing renders here, deliberately. */}
            {ThinkingRenderer && currentPass.payload && (
              <ThinkingRenderer
                pass={currentPass}
                scenario={scenario}
                payload={currentPass.payload as never}
                runtime={runtime}
              />
            )}
          </div>
        )}

      </div>

      {/* Level2FinalResponse mounts full-stage (inset: 0) as a sibling of the
          canvas, not nested inside it — it is one of the four /l1-scenarios
          templates and positions its own mascot, agent-line, and prompt row
          exactly as /l1-scenarios does, so it must not be constrained by the
          canvas's flex column. */}
      {showFinal && runtime.finalResponse && (
        <div className={`att-l2f-layer att-l2f-layer--${phase}`}>
          <Level2FinalResponse response={runtime.finalResponse} />
        </div>
      )}

      {showDevChrome && (
        <ScenarioTypeSelector
          selected={source.selectedArchetype}
          onSelect={source.selectArchetype}
          onRefresh={source.refresh}
          availability={source.availability}
          source={scenario ? SOURCE_LABEL[scenario.source] : undefined}
          isLoading={source.status === 'loading'}
        />
      )}

      {/* Source is never hidden, even without dev chrome — a fixture must
          never be able to read as live Phoenix output. */}
      {scenario && <div className="att-l2-fixture-tag">{SOURCE_LABEL[scenario.source]}</div>}
    </div>
  );
}
