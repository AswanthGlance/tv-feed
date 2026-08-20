import { useEffect, useRef, useState } from 'react';
import ExperienceLevelSwitcher from './ExperienceLevelSwitcher';
import Level1Experience from './Level1Experience';
import Level3Placeholder from './Level3Placeholder';
import Level2UIGallery from './Level2UIGallery';
import DevInspector from './DevInspector';
import DemoController from './DemoController';
import Level2ScenarioExperience from './level2/Level2ScenarioExperience';
import Level2Diagnostics from './level2/Level2Diagnostics';
import { useTraceExplorer } from '../../hooks/useTraceExplorer';
import { useTracePlayback } from '../../hooks/useTracePlayback';
import { useExperiencePhase } from '../../hooks/useExperiencePhase';
import { useLevel2Scenario } from '../../level2/runtime/useLevel2Scenario';
import { useLevel2Runtime } from '../../level2/runtime/useLevel2Runtime';
import { DEV_SCENARIO_KINDS } from '../../level2/types/devScenario';
import { useStageScale } from './useStageScale';
import { readLevelFromUrl, writeLevelToUrl, type ExperienceLevel } from '../../types/experienceLevel';

const SPEED_KEYS: Record<string, number> = { '1': 0.5, '2': 1, '3': 1.5, '4': 2 };
const SHIFT_DIGIT_TO_LEVEL: Record<string, ExperienceLevel> = {
  Digit1: 'level1',
  Digit2: 'level2',
  Digit3: 'level3',
};

/** Top-level shell for /agent_thinking_trace. Owns the leadership-facing
 *  Level 1 / Level 2 / Level 3 switch and everything both real levels need
 *  (Level 1's live Phoenix explorer + playback, Level 2's fixture-driven
 *  progressive engine) so switching levels never loses or re-randomizes the
 *  current scenario — it only restarts that level's own playback from t=0.
 *  See CLAUDE_HANDOFF.md for Level 1's original architecture, which is
 *  unchanged here (just extracted into Level1Experience.tsx). */
export default function AgentExperience() {
  useStageScale();
  const [level, setLevel] = useState<ExperienceLevel>(() => readLevelFromUrl());
  const [devOpen, setDevOpen] = useState(false);
  // Dev-only UI State Gallery (see Level2UIGallery.tsx) — every card
  // state/tier/count without needing a live/replayed trace. Only reachable
  // once the dev inspector is open, and closes itself if the inspector does.
  const [galleryOpen, setGalleryOpen] = useState(false);

  // ── Level 1 (unchanged from before the level switch existed) ──────────
  const explorer = useTraceExplorer();
  const playback = useTracePlayback(explorer.scenarioData);
  const { phase: level1Phase, backToThinking, jumpToResult } = useExperiencePhase(
    explorer.isLoading,
    playback.isComplete,
    explorer.matchedTrace?.trace_id ?? 'loading'
  );

  // ── Level 2 — scenario-based runtime ───────────────────────────────────
  // Level 2 is no longer one card-ranking demo. `useLevel2Scenario` owns
  // which ARCHETYPE is selected and which scenario is loaded for it (real
  // Phoenix trace -> cached trace -> fixture, in that order);
  // `useLevel2Runtime` owns the pass clock and the
  // thinking->consolidating->resolving->final state machine for whatever it
  // loaded. Neither knows anything about how a scenario looks.
  const level2Source = useLevel2Scenario();
  const level2Runtime = useLevel2Runtime(
    level2Source.scenario,
    level2Source.selectedArchetype,
    level2Source.status === 'loading'
  );

  useEffect(() => writeLevelToUrl(level), [level]);

  // Switching TO a level restarts that level's own playback from the
  // beginning (per spec) without touching the other level's state or
  // re-fetching/re-randomizing anything. Skipped on first mount so the URL
  // ?level= deep-link doesn't get its initial playback reset for no reason.
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (level === 'level1') {
      playback.restart();
      backToThinking();
    } else if (level === 'level2') {
      level2Runtime.replay();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return;

      if (e.shiftKey && SHIFT_DIGIT_TO_LEVEL[e.code]) {
        e.preventDefault();
        setLevel(SHIFT_DIGIT_TO_LEVEL[e.code]);
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'd':
          setDevOpen((v) => {
            if (v) setGalleryOpen(false); // closing the inspector also closes the dev-only gallery
            return !v;
          });
          break;
        case ' ':
          e.preventDefault();
          if (level === 'level1') playback.isPlaying ? playback.pause() : playback.play();
          else if (level === 'level2') level2Runtime.isPlaying ? level2Runtime.pause() : level2Runtime.play();
          break;
        case 'r':
          if (level === 'level1') {
            playback.restart();
            backToThinking();
          } else if (level === 'level2') {
            // R = REFRESH SCENARIO, staying inside the selected archetype.
            // Choosing "Comparison" and pressing R must give another
            // comparison, never a different shape of answer.
            level2Source.refresh();
          }
          break;
        case 'n':
          if (level === 'level1') explorer.loadNew();
          else if (level === 'level2') level2Source.nextExample();
          break;
        case 'arrowleft':
          if (level === 'level1') playback.prevStep();
          else if (level === 'level2') level2Runtime.prevPass();
          break;
        case 'arrowright':
          if (level === 'level1') playback.nextStep();
          else if (level === 'level2') level2Runtime.nextPass();
          break;
        case 't':
          if (level === 'level1') playback.toggleMode();
          break;
        default:
          if (SPEED_KEYS[e.key]) {
            if (level === 'level1') playback.setSpeed(SPEED_KEYS[e.key]);
            else if (level === 'level2') level2Runtime.setSpeed(SPEED_KEYS[e.key]);
          }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [level, playback, explorer, backToThinking, level2Runtime, level2Source]);

  // Shift+A..J selects a scenario type directly — a demo shortcut for the
  // same operation the Scenario Type selector performs. A..I are the nine
  // answer-shape archetypes; J is the dedicated Memory Retrieval Dev Mode
  // demo (see types/devScenario.ts) appended after them.
  useEffect(() => {
    if (level !== 'level2') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.shiftKey || !e.code.startsWith('Key')) return;
      const index = 'ABCDEFGHIJ'.indexOf(e.code.slice(3));
      if (index < 0 || index >= DEV_SCENARIO_KINDS.length) return;
      e.preventDefault();
      level2Source.selectArchetype(DEV_SCENARIO_KINDS[index]);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [level, level2Source]);

  const activeReplay =
    level === 'level1'
      ? () => { playback.restart(); backToThinking(); }
      : level === 'level2'
        ? level2Runtime.replay
        : () => {};
  const activeNewScenario = level === 'level1' ? explorer.loadNew : level === 'level2' ? level2Source.refresh : activeReplay;
  const activeJumpToResult = level === 'level1' ? jumpToResult : level === 'level2' ? level2Runtime.jumpToFinal : () => {};
  const activeBackToThinking = level === 'level1' ? backToThinking : level === 'level2' ? level2Runtime.replay : () => {};

  return (
    <div id="scaler" className="att-scaler">
      {/* The stage is a FIXED 1920×1080 box scaled to fit the viewport — see
          useStageScale. Everything inside is authored against those exact
          coordinates, so this is what makes the composition correct on a
          laptop instead of overflowing and cropping. */}
      <div id="stage" className="att-stage att-stage--fit">
        <div className="att-bg" />
        <div className="att-bg-glow" />
        <div className="att-bg-vignette" />

        <ExperienceLevelSwitcher level={level} onChange={setLevel} />

        {level === 'level1' && <Level1Experience explorer={explorer} playback={playback} phase={level1Phase} />}
        {level === 'level2' && (
          <Level2ScenarioExperience source={level2Source} runtime={level2Runtime} showDevChrome={devOpen} />
        )}
        {level === 'level3' && <Level3Placeholder />}

        {level === 'level2' && devOpen && galleryOpen && <Level2UIGallery onClose={() => setGalleryOpen(false)} />}

        {devOpen && level === 'level1' && <DemoController playback={playback} />}

        {/* Level 2's full diagnostics panel (archetype, classification
            confidence, what the user-value filter hid) is deliberately not
            mounted — it covered the left side of the stage during a demo.
            Its questions are still answerable from Level2Diagnostics.tsx
            directly (e.g. in a local dev build); re-add the line below to
            bring it back:
              {devOpen && level === 'level2' && <Level2Diagnostics source={level2Source} runtime={level2Runtime} />} */}

        {devOpen && level !== 'level2' && (
          <DevInspector
            level={level}
            phase={level1Phase}
            matchedTrace={explorer.matchedTrace}
            spans={explorer.allSpans}
            scenarioData={explorer.scenarioData}
            detectedRequest={explorer.detectedRequest}
            skillRaw={explorer.skillRaw}
            resultTemplate={explorer.resultTemplate}
            warnings={explorer.warnings}
            dataSource={explorer.dataSource}
            poolSize={explorer.poolSize}
            poolStatus={explorer.poolStatus}
            poolError={explorer.poolError}
            onReplay={activeReplay}
            onNewScenario={activeNewScenario}
            onJumpToResult={activeJumpToResult}
            onBackToThinking={activeBackToThinking}
            galleryOpen={galleryOpen}
            onToggleGallery={() => setGalleryOpen((v) => !v)}
          />
        )}
      </div>
    </div>
  );
}
