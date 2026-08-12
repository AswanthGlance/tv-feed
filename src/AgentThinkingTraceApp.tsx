import './styles/agentThinkingTrace.css';
import AgentExperience from './components/AgentThinkingTrace/AgentExperience';

/**
 * Route: /agent_thinking_trace
 * One continuous flow: user input -> agent thinking (real Phoenix trace
 * replay where a matching trace exists) -> progressive evidence -> L1
 * result page, sharing the L1 design system throughout.
 *
 * A random scenario (travel/recipe/sports/entertainment/fashion/local) is
 * picked on load, never repeating the previous session's pick.
 *
 * Dev controls (press D): scenario/session inspector + raw span/step/
 * evidence tabs, Replay / New Scenario / Jump to Result / Back to Thinking.
 * Playback: Space play/pause, R replay current scenario, N new scenario,
 * ←/→ step, 1-4 speed, T real/demo timing.
 */
export default function AgentThinkingTraceApp() {
  return <AgentExperience />;
}
