/**
 * L0ExportApp — renders the final resting state of all three L0 layout templates
 * at 1920×1080 for Figma export. No animations. No GSAP. Pure final state.
 *
 * Templates:
 *   Left   — eatly-dawn   (food, left layout, 2 product cards)
 *   Center — feed-46      (fashion, center layout, 2 product cards)
 *   Right  — feed-52      (wellness, right layout, no products)
 *
 * Navigate between templates: ← → arrow keys, or click nav dots.
 */

import { useState } from 'react';
import L0FinalState from './components/export/L0FinalState';

const TEMPLATES = [
  {
    id: 'left',
    label: '01 Left Template',
    itemId: 'eatly-dawn',
    image: '/images/feed/eatly-dawn.jpg',
    title: 'Eatly at dawn',
    locationLabel: 'Bangalore',
    category: 'food',
    tagLabel: 'Bangalore',
    subtitle: "Bangalore has a strong South Indian culture. That's what surfaced this.",
    reasoning: "Bangalore's South Indian breakfast culture ran through your local, comfort-first picks. That's what surfaced this.",
    highlights: ['South Indian breakfast culture', 'comfort-first picks'],
    ctaLabel: 'Show me what makes this special',
    alignment: 'left' as const,
    showProducts: true,
    productLabels: ['Masala Dosa', 'Filter Coffee'],
  },
  {
    id: 'center',
    label: '02 Center Template',
    itemId: 'feed-46',
    image: '/images/feed/feed_46-fashion-luxury-flatlay.jpg',
    title: 'Luxury Flatlay',
    locationLabel: undefined,
    category: 'fashion',
    tagLabel: 'Style Pick',
    subtitle: 'The edit that starts every great outfit.',
    reasoning: "Your recent style picks keep pointing toward luxury fashion. This edit caught that direction exactly.",
    highlights: ['luxury fashion'],
    ctaLabel: 'Show me the full look',
    alignment: 'center' as const,
    showProducts: true,
    productLabels: ['Luxury Fashion', 'Accessories'],
  },
  {
    id: 'right',
    label: '03 Right Template',
    itemId: 'feed-52',
    image: '/images/feed/feed_52-wellness-surf-morning.jpg',
    title: 'Surf Morning',
    locationLabel: undefined,
    category: 'wellness',
    tagLabel: 'Wellness Pick',
    subtitle: 'Cold water, early light, and the set you have been waiting for.',
    reasoning: "Your surf and outdoor wellness interest came through clearly in your picks. This surfaced because the signals aligned well.",
    highlights: ['surf', 'outdoor wellness'],
    ctaLabel: 'Tell me more about this',
    alignment: 'right' as const,
    showProducts: false,
    productLabels: [],
  },
];

export default function L0ExportApp() {
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative', overflow: 'hidden' }}>

      {/* Template switcher — top-center HUD */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 8,
        padding: '10px 0',
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)',
        pointerEvents: 'auto',
      }}>
        {TEMPLATES.map((t, i) => (
          <button
            key={t.id}
            onClick={() => setActiveIdx(i)}
            style={{
              background: i === activeIdx ? 'rgba(167,134,229,0.9)' : 'rgba(255,255,255,0.12)',
              border: 'none', borderRadius: 999,
              padding: '5px 16px',
              color: i === activeIdx ? '#111' : 'rgba(255,255,255,0.7)',
              fontFamily: 'system-ui', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {t.label}
          </button>
        ))}
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontFamily: 'system-ui', marginLeft: 8 }}>
          ← → to switch
        </span>
      </div>

      {/* Keyboard navigation */}
      <KeyboardNav
        onPrev={() => setActiveIdx(i => Math.max(0, i - 1))}
        onNext={() => setActiveIdx(i => Math.min(TEMPLATES.length - 1, i + 1))}
      />

      {/* Template render — fill the whole viewport at 1920×1080 */}
      <L0FinalState key={TEMPLATES[activeIdx].id} template={TEMPLATES[activeIdx]} />
    </div>
  );
}

function KeyboardNav({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
  // Attach keyboard listener
  const ref = (el: HTMLDivElement | null) => {
    if (!el) return;
    // handled via global useEffect pattern
  };

  // Use effect via a mini component approach
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') onPrev();
    if (e.key === 'ArrowRight') onNext();
  };

  return (
    <div
      ref={ref}
      tabIndex={0}
      onKeyDown={handleKey}
      style={{ position: 'absolute', inset: 0, outline: 'none' }}
    />
  );
}
