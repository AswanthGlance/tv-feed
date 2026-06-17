/* ProductRail — product cards for L0 glance.
   Figma reference: node 925:3942 — stacked image tiles (front + back rotated).
   Single card for cinematic layout, horizontal rail for standard. */

type ProductCard = { label: string; index: number };
type Props = {
  cards: ProductCard[];
  animStep: number;
  cardRevealStep: number;
  align: 'left' | 'center' | 'right';
  orientation?: 'horizontal' | 'vertical';
};

const LABEL_MAP: Record<string, string> = {
  'masala-dosa':      'Masala Dosa',
  'filter-coffee':    'Filter Coffee',
  'idli-vada':        'Idli & Vada',
  'south-indian':     'South Indian',
  'breakfast':        'Breakfast',
  'regional-cuisine': 'Regional',
  'street-food':      'Street Food',
  'comfort-food':     'Comfort Food',
  'street-style':     'Street Style',
  'editorial':        'Editorial',
  'accessories':      'Accessories',
  'wellness':         'Wellness',
};

/* Warm food-palette gradient pairs [front, back] */
const CARD_PALETTES = [
  { front: 'linear-gradient(145deg,#c45e1a 0%,#e8863a 60%,#f0a060 100%)', back: 'linear-gradient(145deg,#8b3a10 0%,#b55520 100%)' },
  { front: 'linear-gradient(145deg,#3d1a0c 0%,#7a3515 60%,#c26020 100%)', back: 'linear-gradient(145deg,#2a1008 0%,#5a2510 100%)' },
  { front: 'linear-gradient(145deg,#1a2a0c 0%,#3a5a18 60%,#6a9030 100%)', back: 'linear-gradient(145deg,#0c1a06 0%,#2a4010 100%)' },
];

function humanize(slug: string) {
  return LABEL_MAP[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function ProductRail({ cards, animStep, cardRevealStep, align, orientation = 'horizontal' }: Props) {
  if (!cards.length) return null;
  const isVertical = orientation === 'vertical';
  const justifyMap = { left: 'flex-start', center: 'center', right: 'flex-end' };

  return (
    <div style={{
      display: 'flex',
      flexDirection: isVertical ? 'column' : 'row',
      gap: isVertical ? 10 : 14,
      justifyContent: isVertical ? undefined : justifyMap[align],
      alignItems: isVertical ? 'flex-end' : undefined,
      marginBottom: isVertical ? 0 : 22,
    }}>
      {cards.map((card, i) => {
        const revealed = (animStep >= 9 || animStep >= 6) && i <= cardRevealStep;
        return (
          <div
            key={card.label}
            style={{
              opacity: revealed ? 1 : 0,
              transform: revealed ? 'translateX(0) scale(1)' : 'translateX(32px) scale(0.92)',
              transition: `opacity 0.55s cubic-bezier(0.22,1,0.36,1) ${i * 0.05}s, transform 0.55s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.05}s`,
            }}
          >
            <StackedTile label={humanize(card.label)} paletteIdx={i} />
          </div>
        );
      })}
    </div>
  );
}

/* Figma-style stacked tile: front card straight, back card rotated +9° */
function StackedTile({ label, paletteIdx }: { label: string; paletteIdx: number }) {
  const p = CARD_PALETTES[paletteIdx % CARD_PALETTES.length];
  const size = 88;
  const br   = 20;
  const bw   = 3;

  return (
    <div style={{ position: 'relative', width: size + 16, height: size + 12, flexShrink: 0 }}>
      {/* Back tile — rotated */}
      <div style={{
        position: 'absolute',
        top: 4,
        left: 12,
        width: size,
        height: size,
        borderRadius: br,
        border: `${bw}px solid rgba(255,255,255,0.85)`,
        boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
        background: p.back,
        transform: 'rotate(9deg)',
      }} />

      {/* Front tile — straight, with label */}
      <div style={{
        position: 'absolute',
        top: 4,
        left: 4,
        width: size,
        height: size,
        borderRadius: br,
        border: `${bw}px solid rgba(255,255,255,0.95)`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        background: p.front,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}>
        {/* Bottom label strip */}
        <div style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)',
          padding: '10px 8px 7px',
          fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
          fontSize: 11,
          fontWeight: 700,
          color: 'rgba(255,255,255,0.95)',
          letterSpacing: 0.3,
          lineHeight: 1.2,
          textTransform: 'uppercase',
        }}>
          {label}
        </div>
      </div>
    </div>
  );
}
