/**
 * V6PersistentStrip — the Smart Tiles sidecar: the spine between Ambient Home
 * and the Agent Hub.
 *
 * NOT five independent cards floating on L0 — one coherent GLASS PANEL
 * (think macOS Find My's panel) with the intelligent tiles organized inside
 * it. The outer surface provides the structure; the tiles sit within.
 *
 * Two lives, one component:
 *
 *   closed — a FLOATING rounded panel over the full-bleed L0 background:
 *            it touches no screen edge (visible margins all around), the L0
 *            imagery stays faintly perceptible through the glass, and open
 *            breathing space separates it from the L0 foreground content —
 *            a floating object above Ambient, never a sidebar.
 *   open   — travels (one translateX) into its dedicated full-height zone
 *            between hub and L0, where a frosted surface takes over and the
 *            three layers read as separate physical surfaces.
 *
 * Every tile is SQUARE — width == height, always. Two clearly separated
 * sections:
 *   PINNED — user intent, stable, quiet descriptors + pin glyph
 *   ACTIVE — Ambient-selected surfaces with colored status chips (LIVE /
 *            READY / CONTINUE) that answer "why should I care right now?"
 *
 * Tiles share dimensions, radii and focus behaviour, but the information
 * inside adapts to the content type: sports → score-first · shopping →
 * price-first · generation → image-first · trip → destination-first.
 *
 * The teach-pinning affordance sits at the VERY END — it never interrupts
 * real content.
 */

import { FONT } from '../HybridHubPanel';
import {
  V6_STRIP_ZONE_W, V6_STRIP_X_CLOSED, V6_STRIP_X_OPEN, V6_EASE, V6_OPEN_MS,
  V6_MAX_PINS, type V6StripItem,
} from './v6Data';

/** square tile size — width == height, always. Sized so the full stack
 *  (2 pinned + 5 active + labels + divider + pin affordance) fits the
 *  full-height sidecar with breathing room. */
const SQ = 120;
const PAD = (V6_STRIP_ZONE_W - SQ) / 2; // 40

/**
 * Closed-state floating panel geometry — the panel floats INSIDE the zone
 * with visible margins on every side (Find My treatment), and the tiles
 * (fixed at PAD from the zone edge) sit exactly centered in it:
 * 20 + (160 − 120) / 2 = 40 = PAD.
 */
const PANEL_MARGIN_L = 20;
const PANEL_MARGIN_Y = 28;
const PANEL_W = SQ + 2 * (PAD - PANEL_MARGIN_L);   // 160 — right edge at x = 180
const PANEL_RADIUS = 32;

export function PinGlyph({ size = 10, tint = 'rgba(255,255,255,0.55)' }: { size?: number; tint?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={tint} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 17 V21.5 M7 11 L7 5 A1.5 1.5 0 0 1 8.5 3.5 H15.5 A1.5 1.5 0 0 1 17 5 V11 L19 14.5 H5 Z" />
    </svg>
  );
}

const LABEL: React.CSSProperties = {
  fontFamily: FONT, fontSize: 9, fontWeight: 800, letterSpacing: '0.18em',
  textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)',
  margin: '0 2px 8px',
};

export type V6PersistentStripProps = {
  open: boolean;
  pins: V6StripItem[];
  actives: V6StripItem[];
  /** id of the focused strip item — null when focus is elsewhere */
  focusedId: string | null;
  onItemClick: (id: string) => void;
};

export default function V6PersistentStrip({ open, pins, actives, focusedId, onItemClick }: V6PersistentStripProps) {
  // the tiles react gently around the focused one
  const ordered = [...pins, ...actives];
  const focusedIdx = focusedId ? ordered.findIndex(i => i.id === focusedId) : -1;
  const proximity = (item: V6StripItem): 0 | 1 | 2 => {
    if (focusedIdx < 0) return 2;
    const d = Math.abs(ordered.findIndex(i => i.id === item.id) - focusedIdx);
    return d === 0 ? 0 : d === 1 ? 1 : 2;
  };

  return (
    <div style={{
      position: 'absolute', top: 0, bottom: 0, left: 0, width: V6_STRIP_ZONE_W,
      boxSizing: 'border-box',
      transform: `translateX(${open ? V6_STRIP_X_OPEN : V6_STRIP_X_CLOSED}px)`,
      transition: `transform ${V6_OPEN_MS}ms ${V6_EASE}`,
      zIndex: 58, pointerEvents: 'auto',
      animation: 'v6-fade-in 0.5s ease both',
    }}>
      {/* closed only: ONE floating rounded glass panel — a Find My-style
          object sitting ABOVE Ambient, never a sidebar. It touches no screen
          edge: visible L0 background shows on all four sides, and the L0
          background itself stays full-bleed behind it. The panel, not the
          tiles, carries the container role. */}
      <div style={{
        position: 'absolute',
        top: PANEL_MARGIN_Y, bottom: PANEL_MARGIN_Y,
        left: PANEL_MARGIN_L, width: PANEL_W,
        borderRadius: PANEL_RADIUS,
        background: 'linear-gradient(180deg, rgba(22,20,34,0.5) 0%, rgba(11,10,19,0.58) 100%)',
        backdropFilter: 'blur(30px) saturate(1.15)', WebkitBackdropFilter: 'blur(30px) saturate(1.15)',
        boxShadow: `
          inset 0 1px 0 rgba(255,255,255,0.08),
          inset 0 0 0 1px rgba(255,255,255,0.06),
          0 24px 70px rgba(0,0,0,0.45)`,
        opacity: open ? 0 : 1,
        transition: `opacity ${V6_OPEN_MS}ms ease`,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(6,5,13,0.92) 0%, rgba(4,4,9,0.96) 100%)',
        backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)',
        boxShadow: 'inset 1px 0 0 rgba(255,255,255,0.05), inset -1px 0 0 rgba(255,255,255,0.04)',
        opacity: open ? 1 : 0,
        transition: `opacity ${V6_OPEN_MS}ms ease`,
        pointerEvents: 'none',
      }} />

      {/* Content column — tiles float vertically centered in the full-height surface */}
      <div style={{
        position: 'relative', height: '100%', boxSizing: 'border-box',
        padding: `0 ${PAD}px`,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>
        <div style={{ position: 'relative' }}>
          {/* PINNED — user intent */}
          <div style={LABEL}>Pinned</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pins.map(item => (
              <StripTile key={item.id} item={item} proximity={proximity(item)} onClick={() => onItemClick(item.id)} />
            ))}
          </div>

          {/* quiet divider — the two concepts never blur into one stack */}
          <div style={{ height: 1, margin: '14px 2px', background: 'rgba(255,255,255,0.1)' }} />

          {/* ACTIVE — what matters right now, selected by Ambient */}
          <div style={LABEL}>Active</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {actives.map(item => (
              <StripTile key={item.id} item={item} proximity={proximity(item)} onClick={() => onItemClick(item.id)} />
            ))}
          </div>

          {/* teach-pinning affordance — at the very end, never between content */}
          {pins.length < V6_MAX_PINS && <EndPinAffordance />}
        </div>
      </div>

      <style>{STRIP_KF}</style>
    </div>
  );
}

/**
 * One square glance tile. Hierarchy for TV distance: STATUS → HERO →
 * CONTEXT, and nothing else. Pinned tiles are quieter (neutral status +
 * pin glyph); active tiles carry a colored, breathing status chip.
 *
 * Content-adaptive within the same square: shopping is price-first (the
 * tracked price is the tinted hero line), sports is score-first (heavy
 * overlay keeps the value dominant), generation stays image-first (brighter
 * image, lighter scrim), trips are destination-first.
 *
 * Focus: proximity 0 (focused) comes gently forward with a small spring;
 * proximity 1 (immediate neighbours) reacts very subtly; everything else
 * rests. Never exaggerated, never overlapping.
 */
function StripTile({ item, proximity, onClick }: { item: V6StripItem; proximity: 0 | 1 | 2; onClick: () => void }) {
  const focused = proximity === 0;
  const pinned = item.kind === 'pinned';
  const heavy = item.overlay === 'heavy';
  const imageFirst = item.contentType === 'generation';
  const priceFirst = item.contentType === 'shopping';
  const scoreFirst = item.contentType === 'sports';
  const scale = focused ? 1.08 : proximity === 1 ? 1.015 : 1;

  // price-first: the tracked price leads, the product name supports
  const big = priceFirst ? item.context : item.hero;
  const small = priceFirst ? item.hero : item.context;

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative', width: SQ, height: SQ, boxSizing: 'border-box',
        borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
        background: '#0a0a10',
        zIndex: focused ? 2 : proximity === 1 ? 1 : 0,
        transform: `scale(${scale})`,
        boxShadow: focused
          ? '0 0 0 1.5px rgba(255,255,255,0.8), 0 0 30px rgba(255,255,255,0.1), 0 18px 42px rgba(0,0,0,0.6)'
          : '0 4px 14px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.06)',
        // small spring — "this tile is now active", nothing more
        transition: 'transform 0.38s cubic-bezier(0.34, 1.45, 0.64, 1), box-shadow 0.3s ease',
      }}
    >
      <img src={item.image} alt="" style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
        filter: focused
          ? (heavy ? 'brightness(0.55)' : 'brightness(0.85)')
          : (heavy ? 'brightness(0.36) saturate(0.85)'
            : imageFirst ? 'brightness(0.72)'
            : pinned ? 'brightness(0.55) saturate(0.9)' : 'brightness(0.6) saturate(0.95)'),
        transform: `scale(${focused ? 1.06 : 1})`,
        transition: 'filter 0.3s ease, transform 0.5s ' + V6_EASE,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: heavy
          ? 'linear-gradient(to top, rgba(4,4,8,0.96) 0%, rgba(4,4,8,0.6) 58%, rgba(4,4,8,0.3) 100%)'
          : imageFirst
            ? 'linear-gradient(to top, rgba(4,4,8,0.88) 0%, rgba(4,4,8,0.2) 46%, rgba(4,4,8,0.02) 100%)'
            : 'linear-gradient(to top, rgba(4,4,8,0.94) 0%, rgba(4,4,8,0.34) 55%, rgba(4,4,8,0.05) 100%)',
      }} />

      {/* STATUS — why this tile exists right now */}
      {pinned ? (
        <span style={{ position: 'absolute', top: 8, left: 9, display: 'flex', alignItems: 'center', gap: 4 }}>
          <PinGlyph size={8.5} />
          <span style={{
            fontFamily: FONT, fontSize: 8, fontWeight: 700, letterSpacing: '0.06em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.68)', whiteSpace: 'nowrap',
          }}>
            {item.status}
          </span>
        </span>
      ) : (
        <span style={{
          position: 'absolute', top: 8, left: 8,
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '2.5px 7px', borderRadius: 999,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          boxShadow: `inset 0 0 0 1px ${item.tone}44`,
        }}>
          <span style={{
            width: 4.5, height: 4.5, borderRadius: '50%', background: item.tone, flexShrink: 0,
            animation: item.live ? 'v6-pulse-live 1.4s ease-in-out infinite' : 'v6-pulse-soft 3.2s ease-in-out infinite',
          }} />
          <span style={{ fontFamily: FONT, fontSize: 8.5, fontWeight: 800, letterSpacing: '0.08em', color: item.tone, whiteSpace: 'nowrap' }}>
            {item.status}
          </span>
        </span>
      )}

      {/* HERO → CONTEXT */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '9px 10px', boxSizing: 'border-box' }}>
        <div style={{
          fontFamily: FONT,
          fontSize: scoreFirst ? 18 : big.length <= 10 ? 16.5 : 13,
          fontWeight: 800,
          color: priceFirst ? item.tone : '#fff',
          letterSpacing: '-0.015em', lineHeight: 1.05,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          textShadow: '0 1px 5px rgba(0,0,0,0.7)',
        }}>
          {big}
        </div>
        <div style={{
          fontFamily: FONT, fontSize: 9.5, fontWeight: 600, color: 'rgba(255,255,255,0.72)',
          marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {small}
        </div>
      </div>
    </div>
  );
}

/** End-of-strip pin affordance — extremely subtle, teaches, never interrupts. */
function EndPinAffordance() {
  return (
    <div style={{
      marginTop: 14, width: SQ, height: 44, boxSizing: 'border-box', borderRadius: 12,
      border: '1px dashed rgba(255,255,255,0.14)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
      opacity: 0.62,
    }}>
      <span style={{ fontFamily: FONT, fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>
        + Pin something
      </span>
      <span style={{ fontFamily: FONT, fontSize: 8, fontWeight: 500, color: 'rgba(255,255,255,0.3)' }}>
        Hold OK on a card
      </span>
    </div>
  );
}

const STRIP_KF = `
@keyframes v6-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes v6-pulse-live {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.4; transform: scale(0.7); }
}
@keyframes v6-pulse-soft {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.45; }
}
`;
