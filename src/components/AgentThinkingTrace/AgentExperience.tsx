import { useEffect, useRef, useState } from 'react';
import ExperienceLevelSwitcher from './ExperienceLevelSwitcher';
import Level1Experience from './Level1Experience';
import Level2Experience from './Level2Experience';
import Level3Placeholder from './Level3Placeholder';
import DevInspector from './DevInspector';
import DemoController from './DemoController';
import { useTraceExplorer } from '../../hooks/useTraceExplorer';
import { useTracePlayback } from '../../hooks/useTracePlayback';
import { useExperiencePhase } from '../../hooks/useExperiencePhase';
import { useProgressiveExperience } from '../../hooks/useProgressiveExperience';
import { LEVEL2_TRAVEL_JOURNEY } from '../../data/level2TravelFixture';
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
  const [level, setLevel] = useState<ExperienceLevel>(() => readLevelFromUrl());
  const [devOpen, setDevOpen] = useState(false);

  // ── Level 1 (unchanged from before the level switch existed) ──────────
  const explorer = useTraceExplorer();
  const playback = useTracePlayback(explorer.scenarioData);
  const { phase: level1Phase, backToThinking, jumpToResult } = useExperiencePhase(
    explorer.isLoading,
    playback.isComplete,
    explorer.matchedTrace?.trace_id ?? 'loading'
  );

  // ── Level 2 (new: fixture-driven progressive engine) ───────────────────
  const level2Engine = useProgressiveExperience(LEVEL2_TRAVEL_JOURNEY);
  const {
    phase: level2Phase,
    backToThinking: level2BackToStart,
    jumpToResult: level2JumpToResult,
  } = useExperiencePhase(false, level2Engine.isComplete, 'level2-travel-fixture');

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
      level2Engine.restart();
      level2BackToStart();
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
          setDevOpen((v) => !v);
          break;
        case ' ':
          e.preventDefault();
          if (level === 'level1') playback.isPlaying ? playback.pause() : playback.play();
          else if (level === 'level2') level2Engine.isPlaying ? level2Engine.pause() : level2Engine.play();
          break;
        case 'r':
          if (level === 'level1') {
            playback.restart();
            backToThinking();
          } else if (level === 'level2') {
            level2Engine.restart();
            level2BackToStart();
          }
          break;
        case 'n':
          if (level === 'level1') explorer.loadNew();
          // Level 2 has one fixture for now — "new" degrades to "replay it."
          else if (level === 'level2') {
            level2Engine.restart();
            level2BackToStart();
          }
          break;
        case 'arrowleft':
          if (level === 'level1') playback.prevStep();
          break;
        case 'arrowright':
          if (level === 'level1') playback.nextStep();
          break;
        case 't':
          if (level === 'level1') playback.toggleMode();
          break;
        default:
          if (level === 'level1' && SPEED_KEYS[e.key]) playback.setSpeed(SPEED_KEYS[e.key]);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [level, playback, explorer, backToThinking, level2Engine, level2BackToStart]);

  const activeReplay =
    level === 'level1'
      ? () => { playback.restart(); backToThinking(); }
      : level === 'level2'
        ? () => { level2Engine.restart(); level2BackToStart(); }
        : () => {};
  const activeNewScenario = level === 'level1' ? explorer.loadNew : activeReplay;
  const activeJumpToResult = level === 'level1' ? jumpToResult : level === 'level2' ? level2JumpToResult : () => {};
  const activeBackToThinking = level === 'level1' ? backToThinking : level === 'level2' ? level2BackToStart : () => {};

  return (
    <div id="scaler">
      <div id="stage" className="att-stage">
        <div className="att-bg" />
        <div className="att-bg-glow" />
        <div className="att-bg-vignette" />

        <ExperienceLevelSwitcher level={level} onChange={setLevel} />

        {level === 'level1' && <Level1Experience explorer={explorer} playback={playback} phase={level1Phase} />}
        {level === 'level2' && (
          <Level2Experience engine={level2Engine} phase={level2Phase} query={LEVEL2_TRAVEL_JOURNEY.query} />
        )}
        {level === 'level3' && <Level3Placeholder />}

        {devOpen && level === 'level1' && <DemoController playback={playback} />}

        {devOpen && (
          <DevInspector
            level={level}
            phase={level === 'level1' ? level1Phase : level2Phase}
            matchedTrace={explorer.matchedTrace}
            spans={explorer.allSpans}
            scenarioData={explorer.scenarioData}
            detectedRequest={explorer.detectedRequest}
            skillRaw={explorer.skillRaw}
            resultTemplate={explorer.resultTemplate}
            warnings={explorer.warnings}
            dataSource={level === 'level2' ? 'demo-presentation' : explorer.dataSource}
            poolSize={explorer.poolSize}
            poolStatus={explorer.poolStatus}
            poolError={explorer.poolError}
            level2={{
              narrationType: level2Engine.narration?.type,
              narrationText: level2Engine.narration?.text ?? '',
              insightText: level2Engine.insightText,
              itemCount: level2Engine.items.filter((it) => it.state !== 'removed').length,
              enrichedCount: level2Engine.items.filter((it) => it.state === 'enriched').length,
              negatedCount: level2Engine.items.filter((it) => it.state === 'negated').length,
              shortlistedCount: level2Engine.items.filter((it) => it.state === 'shortlisted').length,
              promotedId: level2Engine.promotedId,
              removedIds: level2Engine.removedIds,
              lastMutationType: level2Engine.lastMutation?.type,
              currentPassStage: level2Engine.currentPass?.stage,
              passIndex: level2Engine.currentPass?.index,
              passCount: level2Engine.passCount,
              passPhase: level2Engine.passPhase,
              passElapsed: level2Engine.passElapsed,
              passRemaining: level2Engine.passRemaining,
              isPlaying: level2Engine.isPlaying,
              speed: level2Engine.speed,
              onPrevPass: level2Engine.prevPass,
              onNextPass: level2Engine.nextPass,
              onTogglePlay: () => (level2Engine.isPlaying ? level2Engine.pause() : level2Engine.play()),
              onSetSpeed: level2Engine.setSpeed,
            }}
            onReplay={activeReplay}
            onNewScenario={activeNewScenario}
            onJumpToResult={activeJumpToResult}
            onBackToThinking={activeBackToThinking}
          />
        )}
      </div>
    </div>
  );
}
