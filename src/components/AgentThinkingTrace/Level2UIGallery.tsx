import Level2CandidateCard from './Level2CandidateCard';
import { deriveCardImportance } from '../../adapters/cardImportance';
import { getAnalysisLayout, getCardWidths, getCardExtraGutter } from './Level2Experience';
import type { ProgressiveItem, ProgressiveItemState } from '../../types/progressiveValue';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 UI STATE GALLERY — dev-only. Renders representative cards across
   every state/importance tier and candidate count WITHOUT needing a live or
   replayed Phoenix trace, so a visual-QA pass doesn't require scrubbing a
   whole journey timeline to see e.g. "promoted at 8 candidates." Reachable
   from the dev inspector (`D` key) via the "UI Gallery" toggle — see
   AgentExperience.tsx.

   Uses the EXACT SAME layout functions (getAnalysisLayout/getCardWidths/
   getCardExtraGutter) and the EXACT SAME Level2CandidateCard component
   production uses — this is not a re-implementation or a mockup, it's the
   real card renderer fed synthetic ProgressiveItems, so what you see here
   is what production will actually do at that state/count.

   Long titles below are the two REAL titles called out for this QA pass —
   "Girish Ch. Dey & Nakur Ch. Nandy" and "Nathu Mal & Ghudoo Mal | Best
   Rewdi, Gajak, Til Bhuga, Pinni & Premium Sweets" — both confirmed real
   trace output, deliberately harder than the fixture's short travel-town
   names. This is a presentation-only harness (see level2-ui-polish agent
   scope) — the data below is clearly synthetic/labelled, never mistaken for
   a real trace. ───────────────────────────────────────────────────────── */

const IMG = {
  road: '/images/feed/feed_29-travel-goa-coastal-road.jpg',
  wildlife: '/images/feed/feed_40-travel-wildlife-dawn-grassland.jpg',
  houseboat: '/images/feed/feed_54-travel-kerala-backwaters-houseboat.jpg',
  cabin: '/images/feed/feed_34-travel-nordic-winter-cabin.jpg',
};

function item(
  id: string,
  title: string,
  state: ProgressiveItemState,
  overrides: Partial<ProgressiveItem['metadata']> = {},
  image = IMG.road
): ProgressiveItem {
  return {
    id,
    type: 'place',
    title,
    image,
    state,
    metadata: {
      rating: 4.6,
      travelTime: '3h 40m',
      priceLevel: '₹600–1200',
      evidence: ['Coffee estates', 'Cool weather', 'Manageable drive'],
      judgment: 'GOOD BALANCE',
      stayOption: 'Boutique homestays',
      ...overrides,
    },
  };
}

const LONG_TITLE_1 = 'Girish Ch. Dey & Nakur Ch. Nandy';
const LONG_TITLE_2 = 'Nathu Mal & Ghudoo Mal | Best Rewdi, Gajak, Til Bhuga, Pinni & Premium Sweets';

/** One count-based analysis row, using the real production layout math —
 *  the primary regression check for "cards never collide, growth reflows
 *  neighbors" at every candidate-count tier the app can actually reach. */
function AnalysisRow({ n, images }: { n: number; images: string[] }) {
  const states: ProgressiveItemState[] = ['promoted', 'shortlisted', 'negated', 'discovered', 'enriched'];
  const items: ProgressiveItem[] = Array.from({ length: n }, (_, i) =>
    item(
      `g-${n}-${i}`,
      i === 0 ? LONG_TITLE_2 : i === 1 ? LONG_TITLE_1 : `Candidate ${i + 1}`,
      states[i % states.length],
      i === 3 ? { deprioritized: true } : {},
      images[i % images.length]
    )
  );
  const layout = getAnalysisLayout(n);
  const widths = getCardWidths(items.map((it) => ({ id: it.id, state: it.state, deprioritized: !!it.metadata?.deprioritized })), layout);

  return (
    <div className="att-l2-gallery-section">
      <div className="att-l2-gallery-label">
        {n} candidates — base width {layout.width}px · gap {layout.gap}px · {layout.compact ? 'compact tier' : 'standard tier'}
      </div>
      <div className="att-l2-gallery-row" style={{ ['--l2-gap' as string]: `${layout.gap}px` }}>
        {items.map((it) => {
          const importance = deriveCardImportance({
            isResolvedPhase: false,
            isPromotedItem: it.state === 'promoted',
            itemState: it.state,
            isCompactLayout: layout.compact,
          });
          return (
            <Level2CandidateCard
              key={it.id}
              item={it}
              importance={importance}
              cardWidth={widths.get(it.id)}
              extraGutter={getCardExtraGutter(it.state)}
            />
          );
        })}
      </div>
    </div>
  );
}

/** Isolated single-card states — compact/standard/shortlisted/promoted/
 *  resolved/receding side by side at their OWN natural size (not squeezed
 *  into a shared row), so tier-to-tier differences (width, title size,
 *  content density) are easy to compare directly. */
function IsolatedStatesRow() {
  const configs: Array<{ label: string; importance: Parameters<typeof deriveCardImportance>[0]; state: ProgressiveItemState; width: number; crystallized?: boolean }> = [
    { label: 'compact', importance: { isResolvedPhase: false, isPromotedItem: false, itemState: 'discovered', isCompactLayout: true }, state: 'discovered', width: 152 },
    { label: 'standard', importance: { isResolvedPhase: false, isPromotedItem: false, itemState: 'enriched', isCompactLayout: false }, state: 'enriched', width: 224 },
    { label: 'shortlisted', importance: { isResolvedPhase: false, isPromotedItem: false, itemState: 'shortlisted', isCompactLayout: false }, state: 'shortlisted', width: 244 },
    { label: 'promoted', importance: { isResolvedPhase: false, isPromotedItem: true, itemState: 'promoted', isCompactLayout: false }, state: 'promoted', width: 269 },
    { label: 'resolved (rail)', importance: { isResolvedPhase: true, isPromotedItem: true, itemState: 'promoted', isCompactLayout: false }, state: 'promoted', width: 420, crystallized: true },
    { label: 'receding (negated)', importance: { isResolvedPhase: false, isPromotedItem: false, itemState: 'negated', isCompactLayout: false }, state: 'negated', width: 210 },
  ];
  return (
    <div className="att-l2-gallery-section">
      <div className="att-l2-gallery-label">Isolated tiers — side by side at each tier's own natural size</div>
      <div className="att-l2-gallery-row att-l2-gallery-row--isolated">
        {configs.map((c) => (
          <div key={c.label} className="att-l2-gallery-cell">
            <div className="att-l2-gallery-cell-label">{c.label}</div>
            <Level2CandidateCard
              item={item(`iso-${c.label}`, 'Chikmagalur', c.state, c.state === 'negated' ? { negationReason: 'Too far for a short weekend' } : {})}
              importance={deriveCardImportance(c.importance)}
              cardWidth={c.crystallized ? undefined : c.width}
              crystallized={c.crystallized}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Long-title stress test — the two real titles called out explicitly for
 *  this pass, at promoted and resolved sizes (the two tiers with the most
 *  typography/content packed into the least slack). Confirms: title stays
 *  2-3 lines (never uncontrolled), card stays inside a comfortable footprint,
 *  image/rating/price/differentiator all stay visible without clipping. */
function LongTitleRow() {
  const cases: Array<{ label: string; title: string; importance: 'promoted' | 'resolved' }> = [
    { label: 'promoted · long title A', title: LONG_TITLE_1, importance: 'promoted' },
    { label: 'promoted · long title B', title: LONG_TITLE_2, importance: 'promoted' },
    { label: 'resolved · long title A', title: LONG_TITLE_1, importance: 'resolved' },
    { label: 'resolved · long title B', title: LONG_TITLE_2, importance: 'resolved' },
  ];
  return (
    <div className="att-l2-gallery-section">
      <div className="att-l2-gallery-label">Long real-title stress test</div>
      <div className="att-l2-gallery-row att-l2-gallery-row--isolated">
        {cases.map((c) => (
          <div key={c.label} className="att-l2-gallery-cell">
            <div className="att-l2-gallery-cell-label">{c.label}</div>
            <Level2CandidateCard
              item={item(
                `long-${c.label}`,
                c.title,
                c.importance === 'resolved' ? 'promoted' : 'promoted',
                { rating: 4.3, priceLevel: '₹600–1600 per person', availability: 'Open now', judgment: 'BEST OVERALL FIT' },
                IMG.houseboat
              )}
              importance={c.importance}
              cardWidth={c.importance === 'promoted' ? 300 : undefined}
              crystallized={c.importance === 'resolved'}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Level2UIGallery({ onClose }: { onClose: () => void }) {
  return (
    <div className="att-l2-gallery">
      <div className="att-l2-gallery-header">
        <div>
          <div className="att-l2-gallery-title">LEVEL 2 — UI STATE GALLERY</div>
          <div className="att-l2-gallery-subtitle">
            Dev-only. Every card state/tier/count rendered directly with the production Level2CandidateCard + layout
            math — no trace replay needed. Synthetic data, never real trace output.
          </div>
        </div>
        <button className="att-playback-btn" onClick={onClose}>Close Gallery</button>
      </div>
      <div className="att-l2-gallery-body">
        <IsolatedStatesRow />
        <LongTitleRow />
        <AnalysisRow n={4} images={[IMG.wildlife, IMG.road, IMG.houseboat, IMG.cabin]} />
        <AnalysisRow n={5} images={[IMG.road, IMG.wildlife, IMG.cabin, IMG.houseboat, IMG.road]} />
        <AnalysisRow n={8} images={[IMG.wildlife, IMG.road, IMG.houseboat, IMG.cabin, IMG.wildlife, IMG.road, IMG.houseboat, IMG.cabin]} />
        <AnalysisRow n={10} images={[IMG.road, IMG.wildlife, IMG.cabin, IMG.houseboat, IMG.road, IMG.wildlife, IMG.cabin, IMG.houseboat, IMG.road, IMG.wildlife]} />
      </div>
    </div>
  );
}
