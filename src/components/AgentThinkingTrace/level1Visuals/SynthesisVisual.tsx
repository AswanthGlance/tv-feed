import type { ThinkingEvidence } from '../../../types/thinking';
import { SectionLabel } from '../../L1/l1SharedComponents';
import SelectedCard from './SelectedCard';

/** "Putting it all together" step. Its evidence is already the agent's
 * curated final-response content (extractFinalResponseEvidence — the same
 * place_card/card_template/plain-text blocks that become the actual
 * answer), so no extra client-side "selection" logic is needed — the
 * visual mutation this step needs to communicate is just: stop looking
 * like raw search findings, start looking like a deliberate, organized
 * pick. `previousCount` (the preceding search step's candidate count, if
 * any) drives the "N ideas explored -> M selected" framing. */
export default function SynthesisVisual({
  evidence,
  previousCount,
}: {
  evidence: ThinkingEvidence[];
  previousCount?: number;
}) {
  const selected = evidence.slice(0, 4);

  return (
    <div className="att-evidence-column">
      <SectionLabel>PUTTING YOUR PICKS TOGETHER</SectionLabel>
      <p className="att-headline" style={{ marginTop: 12 }}>
        {previousCount && previousCount > selected.length
          ? `${previousCount} ideas explored → ${selected.length} selected`
          : `${selected.length || ''} ${selected.length === 1 ? 'idea' : 'ideas'} selected`.trim()}
      </p>
      {selected.length > 0 ? (
        <div className="att-evidence-grid">
          {selected.map((ev, i) => (
            <SelectedCard key={ev.id} evidence={ev} index={i} highlight={i === 0} />
          ))}
        </div>
      ) : (
        <div className="att-search-empty">Assembling the response…</div>
      )}
    </div>
  );
}
