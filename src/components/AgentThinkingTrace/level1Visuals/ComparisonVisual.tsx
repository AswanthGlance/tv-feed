import type { ThinkingEvidence } from '../../../types/thinking';
import { SectionLabel } from '../../L1/l1SharedComponents';
import EvidenceCard from '../EvidenceCard';

/** "Comparing the options" — RERANKER/EVALUATOR spans rarely carry
 * structured tool evidence of their own (they operate over evidence
 * already gathered, not a fresh tool call), so this honestly shows an
 * ambient "weighing tradeoffs" state rather than repeating the previous
 * step's cards or fabricating comparison deltas that aren't in the trace. */
export default function ComparisonVisual({ evidence }: { evidence: ThinkingEvidence[] }) {
  const shown = evidence.slice(0, 4);

  return (
    <div className="att-evidence-column">
      <SectionLabel>COMPARING THE OPTIONS</SectionLabel>
      <p className="att-headline" style={{ marginTop: 12 }}>
        {shown.length ? 'Weighing the strongest candidates' : 'Weighing tradeoffs across the options…'}
      </p>
      {shown.length > 0 ? (
        <div className="att-evidence-grid">
          {shown.map((ev, i) => (
            <EvidenceCard key={ev.id} evidence={ev} highlight={i === 0} />
          ))}
        </div>
      ) : (
        <div className="att-compare-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      )}
    </div>
  );
}
