import AgentMascot from '../Shared/AgentMascot';
import QueryContext from './QueryContext';
import AgentNarrationLine from './AgentNarrationLine';
import Level2CandidateCard from './Level2CandidateCard';
import EmergingInsight from './EmergingInsight';
import type { ProgressiveExperienceState } from '../../hooks/useProgressiveExperience';
import type { ExperiencePhase } from '../../hooks/useExperiencePhase';
import type { AgentNarration } from '../../types/experiencePass';

/** Suggested next queries for the bottom prompt row — only shown once the
 *  journey has crystallized (matches the real L1 templates' own bottom
 *  prompt row, e.g. TravelL1's FOLLOW_UPS). Chrome text, not wired to any
 *  navigation. */
const LEVEL2_FOLLOW_UPS = [
  'Plan a 2-day Chikmagalur itinerary',
  'Find coffee estate homestays',
  'Check weather for this weekend',
  'Estimate trip budget',
];

/** LEVEL 2 — Progressive Value shell. The evolving candidate canvas is the
 *  hero; the agent-status area (mascot + one narration line) is
 *  deliberately small and secondary.
 *
 *  CRITICAL: this never swaps to a different component tree for "the
 *  result." There is no separate thinking-layer/result-layer pair here
 *  (unlike Level 1, which is untouched) — the SAME grid of
 *  Level2CandidateCards renders throughout the whole journey. Once it
 *  crystallizes (phase === 'result'), the promoted card just stops moving
 *  and gains a CTA row (Level2CandidateCard's `resolved` prop), the
 *  narration line switches to a quiet completion message, and the insight
 *  panel naturally goes quiet too (RESOLVE declares none). The viewer
 *  should never perceive "leaving thinking and opening a result screen" —
 *  the working answer IS the final answer, just settled.
 *
 *  Driven entirely by useProgressiveExperience(journey) — see
 *  src/data/level2TravelFixture.ts for the (explicitly labelled)
 *  presentation-fixture pass timeline this renders. */
export default function Level2Experience({
  engine,
  phase,
  query,
}: {
  engine: ProgressiveExperienceState;
  phase: ExperiencePhase;
  query: string;
}) {
  const promoted = engine.items.find((it) => it.id === engine.promotedId);
  // Guards against a truncated/edited journey that reaches isComplete
  // without ever emitting PROMOTE_ITEM — the narration/CTA crystallization
  // simply never triggers rather than referencing a candidate that doesn't
  // exist.
  const isResolved = phase === 'result' && !!promoted;

  const narration: AgentNarration | undefined = isResolved
    ? { type: 'resolve', text: `${promoted!.title} looks like your best fit` }
    : engine.narration;

  // Once crystallized, a candidate that was set aside (Kabini) has nothing
  // left to show for itself — it already played its shrink-and-fade recede
  // during PROMOTE; leaving its now-tiny ghost card mounted afterward would
  // read as "still there, just ignored" rather than "no longer a contender".
  const visibleItems = isResolved ? engine.items.filter((it) => it.state !== 'removed') : engine.items;

  return (
    <div className="att-l2-layer">
      <div className="att-header">
        <img
          className="att-logo"
          src="/glance-logo.png"
          alt="glance"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      </div>
      <QueryContext query={query} />

      <div className="att-l2-status-row">
        <div className="att-l2-mascot-wrap">
          <AgentMascot agentMode={engine.isComplete ? 'idle' : 'thinking'} size={36} />
        </div>
        <AgentNarrationLine narration={narration} isComplete={isResolved} />
      </div>

      <div className="att-l2-canvas">
        {engine.items.length === 0 ? (
          <div className="att-l2-skeleton-row">
            {[0, 1, 2].map((i) => (
              <div key={i} className="att-l2-skeleton-card" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        ) : (
          <div className="att-l2-grid">
            {visibleItems.map((item) => (
              <Level2CandidateCard
                key={item.id}
                item={item}
                resolved={isResolved && item.id === engine.promotedId}
                crystallized={isResolved}
              />
            ))}
          </div>
        )}

        <EmergingInsight text={engine.insightText} />

        {isResolved && (
          <div className="att-result-prompt-row">
            <div className="att-result-prompt-icons">
              <div className="att-result-prompt-icon-btn">
                <img src="/images/l1/keyboard.svg" alt="" />
              </div>
              <div className="att-result-prompt-icon-btn">
                <img src="/images/l1/mic.svg" alt="" />
              </div>
            </div>
            {LEVEL2_FOLLOW_UPS.map((prompt, i) => (
              <div className="att-result-prompt-pill" key={i}>{prompt}</div>
            ))}
          </div>
        )}
      </div>

      <div className="att-l2-fixture-tag">Level 2 shell — presentation fixture, not live Phoenix output</div>
    </div>
  );
}
