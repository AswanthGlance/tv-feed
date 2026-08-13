import type { ThinkingEvidence } from '../../../types/thinking';
import { SectionLabel } from '../../L1/l1SharedComponents';
import EvidenceCard from '../EvidenceCard';

/** Visual/image generation (tool.VTONGenerate today) — distinct from
 * 'synthesis' (the text answer being assembled): this step is literally
 * rendering a new image, so a skeleton "resolving" placeholder while
 * waiting reads correctly instead of a search-results grid. */
export default function GenerationVisual({ evidence }: { evidence: ThinkingEvidence[] }) {
  const shown = evidence.slice(0, 2);

  return (
    <div className="att-evidence-column">
      <SectionLabel>CREATING YOUR VISUAL</SectionLabel>
      <p className="att-headline" style={{ marginTop: 12 }}>
        {shown.length ? 'Your generated look' : 'Rendering a new visual…'}
      </p>
      {shown.length > 0 ? (
        <div className="att-evidence-grid">
          {shown.map((ev, i) => (
            <EvidenceCard key={ev.id} evidence={ev} highlight={i === 0} />
          ))}
        </div>
      ) : (
        <div className="att-evidence-skeleton" aria-hidden="true" />
      )}
    </div>
  );
}
