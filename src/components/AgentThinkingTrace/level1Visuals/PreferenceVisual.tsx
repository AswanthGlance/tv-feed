import type { ThinkingEvidence } from '../../../types/thinking';
import { SectionLabel } from '../../L1/l1SharedComponents';

/* Shown only when the trace's memory.retrieval span genuinely had no
 * usable content — never specific invented preferences, per product spec
 * ("do not invent specific user preferences and claim they came from the
 * trace"). Kept generic and honest. */
const FALLBACK_CHIPS = ['Recent activity', 'Things you have engaged with', 'General interests'];

export default function PreferenceVisual({ evidence }: { evidence: ThinkingEvidence[] }) {
  const chips = evidence.filter((e) => e.type === 'preference' && e.title).map((e) => e.title as string);
  const hasReal = chips.length > 0;
  const shown = hasReal ? chips.slice(0, 6) : FALLBACK_CHIPS;

  return (
    <div className="att-evidence-column">
      <SectionLabel>{hasReal ? 'RECALLING WHAT YOU LIKE' : 'LOOKING AT YOUR RECENT CONTEXT'}</SectionLabel>
      <p className="att-headline" style={{ marginTop: 12 }}>
        {hasReal ? 'Based on what you’ve liked before' : 'Piecing together recent signals…'}
      </p>
      <div className="att-pref-chip-row">
        {shown.map((label, i) => (
          <span key={`${label}-${i}`} className="att-pref-chip" style={{ animationDelay: `${i * 90}ms` }}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
