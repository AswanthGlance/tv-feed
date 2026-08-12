import type { ThinkingEvidence } from '../../types/thinking';
import { SectionLabel } from '../L1/l1SharedComponents';
import EvidenceCard from './EvidenceCard';
import EvidenceSkeleton from './EvidenceSkeleton';

const VISIBLE_SLOTS = 4;

export default function EvidenceCanvas({
  headline,
  evidence,
}: {
  headline?: string;
  evidence: ThinkingEvidence[];
}) {
  const shown = evidence.slice(0, VISIBLE_SLOTS);
  const skeletonCount = Math.max(0, VISIBLE_SLOTS - shown.length);

  return (
    <div className="att-evidence-column">
      <SectionLabel>WORKING ON IT</SectionLabel>
      {headline && <p className="att-headline" style={{ marginTop: 12 }}>{headline}</p>}
      {shown.length > 0 && (
        <div className="att-evidence-grid">
          {shown.map((ev, i) => (
            <EvidenceCard key={ev.id} evidence={ev} highlight={i === 0} />
          ))}
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <EvidenceSkeleton key={`sk-${i}`} />
          ))}
        </div>
      )}
    </div>
  );
}
