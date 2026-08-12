import type { ExperienceLevel } from '../../types/experienceLevel';

const OPTIONS: { id: ExperienceLevel; label: string }[] = [
  { id: 'level1', label: 'Level 1' },
  { id: 'level2', label: 'Level 2' },
  { id: 'level3', label: 'Level 3' },
];

/** Leadership / design-comparison control — top-left-safe-area segmented
 *  switch between the three framework levels. Deliberately restrained (small
 *  type, translucent pill, no chrome-heavy tab styling) so it reads as a
 *  presentation control, not a piece of the consumer product. Level 3 is
 *  selectable (shows Level3Placeholder) rather than disabled, since the
 *  point of this iteration is to represent the framework, not gate it. */
export default function ExperienceLevelSwitcher({
  level,
  onChange,
}: {
  level: ExperienceLevel;
  onChange: (level: ExperienceLevel) => void;
}) {
  return (
    <div className="att-level-switch">
      {OPTIONS.map((opt) => (
        <button
          key={opt.id}
          className={`att-level-switch-btn${level === opt.id ? ' att-level-switch-btn--active' : ''}`}
          onClick={() => onChange(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
