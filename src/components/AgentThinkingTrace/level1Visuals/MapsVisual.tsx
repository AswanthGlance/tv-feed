import type { ThinkingEvidence } from '../../../types/thinking';
import { SectionLabel } from '../../L1/l1SharedComponents';
import EvidenceCard from '../EvidenceCard';

/** "Checking Google Maps" / nearby-place search — reuses EvidenceCard's
 * place branch directly since it already renders rating/travel-time/
 * distance chrome correctly for place evidence; this component only adds
 * the maps-specific framing around it. */
export default function MapsVisual({ evidence }: { evidence: ThinkingEvidence[] }) {
  const shown = evidence.slice(0, 4);

  return (
    <div className="att-evidence-column">
      <SectionLabel>CHECKING THE MAP</SectionLabel>
      <p className="att-headline" style={{ marginTop: 12 }}>
        {shown.length
          ? `${shown.length} nearby ${shown.length === 1 ? 'option' : 'options'} plotted`
          : 'Checking distances and routes…'}
      </p>
      {shown.length > 0 ? (
        <div className="att-evidence-grid">
          {shown.map((ev, i) => (
            <EvidenceCard key={ev.id} evidence={ev} highlight={i === 0} />
          ))}
        </div>
      ) : (
        <div className="att-search-empty">Checking distances and routes…</div>
      )}
    </div>
  );
}
