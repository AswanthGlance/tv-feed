import { useEffect, useState } from 'react';
import type { ThinkingEvidence } from '../../../types/thinking';
import { SectionLabel } from '../../L1/l1SharedComponents';
import SearchResultCard from './SearchResultCard';

const REVEAL_INTERVAL_MS = 550;
const MAX_SHOWN = 4;

/** "Searching the web" step — real normalized search results arrive one
 * at a time (result 1, pause, result 2, ...) rather than all four at once,
 * so the panel visibly communicates "the agent is finding things" instead
 * of looking like an already-finished grid. */
export default function SearchVisual({ evidence, stepId }: { evidence: ThinkingEvidence[]; stepId: string }) {
  const items = evidence
    .filter((e) => e.type === 'web_result' || e.type === 'summary' || e.type === 'place')
    .slice(0, MAX_SHOWN);
  const [revealCount, setRevealCount] = useState(items.length ? 1 : 0);

  useEffect(() => {
    setRevealCount(items.length ? 1 : 0);
    if (items.length <= 1) return;
    const timers: number[] = [];
    for (let i = 1; i < items.length; i++) {
      timers.push(window.setTimeout(() => setRevealCount((c) => Math.max(c, i + 1)), i * REVEAL_INTERVAL_MS));
    }
    return () => timers.forEach((t) => clearTimeout(t));
    // Restart the reveal sequence whenever this step (or its item count)
    // changes — not on every evidence array identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepId, items.length]);

  return (
    <div className="att-evidence-column">
      <SectionLabel>SEARCHING ACROSS THE WEB</SectionLabel>
      <p className="att-headline" style={{ marginTop: 12 }}>
        {items.length ? `${revealCount} of ${items.length} references found` : 'Looking for useful references…'}
      </p>
      {items.length > 0 ? (
        <div className="att-evidence-grid">
          {items.slice(0, revealCount).map((ev, i) => (
            <SearchResultCard key={ev.id} evidence={ev} highlight={i === 0} />
          ))}
          {Array.from({ length: Math.max(0, items.length - revealCount) }).map((_, i) => (
            <div key={`ph-${i}`} className="att-search-card-skeleton" aria-hidden="true" />
          ))}
        </div>
      ) : (
        <div className="att-search-empty">Still narrowing down useful sources…</div>
      )}
    </div>
  );
}
