import { ARCHETYPE_LABEL, SCENARIO_ARCHETYPES, type ScenarioArchetype } from '../../../level2/types/archetype';
import type { ArchetypeAvailability } from '../../../level2/scenarios/registry';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Scenario type selector.

   A DEMO/DEVELOPER control, on the right, deliberately separate from the
   leadership-facing Level 1 / Level 2 / Level 3 switch — it changes what KIND
   of answer Level 2 is demonstrating, not which level you are looking at.

   Selecting an archetype stops the current playback, loads a scenario of that
   shape and replays from the start; Refresh stays inside the current archetype
   and picks a different scenario. Both are engineering operations owned by
   useLevel2Scenario — this component only calls them.

   The real-trace count next to each option is honest signal: an archetype with
   no real corpus coverage says so rather than quietly serving a fixture as if
   it were live output.
   ───────────────────────────────────────────────────────────────────────────── */

export function ScenarioTypeSelector({
  selected,
  onSelect,
  onRefresh,
  availability,
  source,
  isLoading,
}: {
  selected: ScenarioArchetype;
  onSelect: (archetype: ScenarioArchetype) => void;
  onRefresh: () => void;
  availability: ArchetypeAvailability[];
  source?: string;
  isLoading: boolean;
}) {
  const byArchetype = new Map(availability.map((a) => [a.archetype, a]));

  return (
    <div className="att-l2-scenario-selector">
      <div className="att-l2-scenario-selector-head">
        <span className="att-l2-scenario-selector-title">Scenario Type</span>
        <button type="button" className="att-l2-scenario-refresh" onClick={onRefresh} disabled={isLoading}>
          {isLoading ? '…' : 'Refresh'}
        </button>
      </div>

      <div className="att-l2-scenario-options">
        {SCENARIO_ARCHETYPES.map((archetype, i) => {
          const info = byArchetype.get(archetype);
          const realCount = info?.realTraceCount ?? 0;
          return (
            <button
              key={archetype}
              type="button"
              className={`att-l2-scenario-option${archetype === selected ? ' att-l2-scenario-option--active' : ''}`}
              onClick={() => onSelect(archetype)}
            >
              <span className="att-l2-scenario-option-index">{i + 1}</span>
              <span className="att-l2-scenario-option-label">{ARCHETYPE_LABEL[archetype]}</span>
              <span className="att-l2-scenario-option-count" title={`${realCount} real trace(s) in the corpus`}>
                {realCount > 0 ? realCount : 'fixture'}
              </span>
            </button>
          );
        })}
      </div>

      {source && <div className="att-l2-scenario-source">{source}</div>}
    </div>
  );
}
