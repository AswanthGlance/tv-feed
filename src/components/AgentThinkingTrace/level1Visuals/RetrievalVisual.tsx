import type { ThinkingEvidence } from '../../../types/thinking';
import { SectionLabel } from '../../L1/l1SharedComponents';
import EvidenceCard from '../EvidenceCard';

/** "Checking reviews/details" — ratings/review snippets enriching the
 * candidates already found. Reuses EvidenceCard's text branch (title +
 * description) since review evidence is plain text, not image-led. */
export default function RetrievalVisual({ evidence }: { evidence: ThinkingEvidence[] }) {
  const shown = evidence.slice(0, 4);

  return (
    <div className="att-evidence-column">
      <SectionLabel>CHECKING RATINGS &amp; REVIEWS</SectionLabel>
      <p className="att-headline" style={{ marginTop: 12 }}>
        {shown.length ? 'What people are saying' : 'Reading through recent reviews…'}
      </p>
      {shown.length > 0 ? (
        <div className="att-evidence-grid">
          {shown.map((ev, i) => (
            <EvidenceCard key={ev.id} evidence={ev} highlight={i === 0} />
          ))}
        </div>
      ) : (
        <div className="att-search-empty">Reading through recent reviews…</div>
      )}
    </div>
  );
}
