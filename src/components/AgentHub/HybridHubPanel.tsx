/**
 * HybridHubPanel — Option 2.5: the bridge between Ambient Home and Agent Hub.
 *
 * · Up to three square pinned widgets always sit on L0's left edge — the
 *   user's own picks (max 3). Pressing ← opens the Agent Hub overlay
 *   directly; clicking a pinned square opens it focused on that item.
 * · The hub is a no-scroll overlay: Search pill on top, a 3×3 grid of
 *   primary agent tiles, a smaller utilities grid below — and the pinned
 *   widgets retained as a 4th column on the right.
 * · Pinning (TV remote friendly): short-press OK opens the focused item,
 *   HOLD OK (~½s) pins/unpins it. Works on primary tiles, on pinnable
 *   utilities (AI Gallery), and on the pinned column itself. Maximum 3.
 * · L0 stays frozen, slightly shrunk and shifted right, behind a left
 *   gradient only — no full-screen dim.
 */

import { useState, useEffect, useRef } from 'react';
import AgentMascot from '../Shared/AgentMascot';

// ─── Types & data ─────────────────────────────────────────────────────────────

const FONT = '"Plus Jakarta Sans",system-ui,sans-serif';
const U = (id: string, w = 480) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

/** Anything that can live as a pinned square (agents + pinnable utilities). */
export type PinMeta = {
  id: string;
  label: string;
  icon: string;
  tint: string;
  pinTitle: string;
  pinSub: string;
};

export type PrimaryAgent = PinMeta & {
  kicker: string;
  value: string;
  image?: string;
};

export const PRIMARY: PrimaryAgent[] = [
  { id: 'travel',     label: 'Travel',     icon: '🌄', tint: '#4DD0C4', kicker: 'Weekend escape',   value: 'Coorg · 4 hrs away',     image: '/images/warm-start/coorg.jpg',                              pinTitle: 'Coorg',      pinSub: '4 hrs away' },
  { id: 'recipes',    label: 'Recipes',    icon: '🍝', tint: '#FFB86B', kicker: "Tonight's dinner", value: 'Naan Pizza · 25 min',    image: '/images/feed/feed_04-food-dinner-party-table.jpg',          pinTitle: 'Naan Pizza', pinSub: '25 min' },
  { id: 'shopping',   label: 'Shopping',   icon: '🎧', tint: '#6BD98A', kicker: 'Price drop',       value: 'Sony XM5 · ↓ ₹2,000',    image: U('photo-1505740420928-5e560c06d30e'),                        pinTitle: 'Sony XM5',   pinSub: '↓ ₹2,000' },
  { id: 'fashion',    label: 'Fashion',    icon: '👕', tint: '#F79BC3', kicker: 'Weekend Layers',   value: '3 new looks',            image: '/images/feed/feed_31-fashion-streetwear-editorial.jpg',     pinTitle: '3 looks',    pinSub: 'Rain-ready' },
  { id: 'home-decor', label: 'Home Decor', icon: '💡', tint: '#E8CE8A', kicker: 'New idea',         value: 'Warm layered lighting',  image: '/images/feed/feed_24-home-cozy-monsoon-living-room.jpg',    pinTitle: '5 lamps',    pinSub: 'Warm Lighting' },
  { id: 'sports',     label: 'Sports',     icon: '🏏', tint: '#79C7FF', kicker: 'Ind vs Aus',       value: 'Starts 7:30 PM',         image: '/images/warm-start/ind-vs-afg.png',                          pinTitle: '7:30 PM',    pinSub: 'IND vs AUS' },
  { id: 'weather',    label: 'Weather',    icon: '🌧', tint: '#6FB9FF', kicker: 'Right now',        value: '24° · Rain in 2 hrs',                                                                          pinTitle: '24°',        pinSub: 'Rain in 2 hrs' },
  { id: 'vtone',      label: 'VTone',      icon: '📸', tint: '#F484B8', kicker: 'New for you',      value: '3 new fits · try-on',    image: U('photo-1531123897727-8f129e1688ce'),                        pinTitle: '3 new fits', pinSub: 'Try-on ready' },
  { id: 'lifestyle',  label: 'Lifestyle',  icon: '🌿', tint: '#7FD8A8', kicker: "Today's routine",  value: 'Evening relax · 10 min', image: '/images/feed/feed_32-wellness-sunrise-yoga-lake.jpg',        pinTitle: '10 min',     pinSub: 'Evening relax' },
];

/** Pinnable non-agent destinations. */
const PINNABLE_UTILITIES: PinMeta[] = [
  { id: 'ai-gallery', label: 'AI Gallery', icon: '✦', tint: '#B9A6F0', pinTitle: '24 images', pinSub: 'Latest 2h ago' },
];

export const MAX_PINS = 3;
export const DEFAULT_PINNED = ['shopping', 'ai-gallery'];

const pinnableById = (id: string): PinMeta | undefined =>
  PRIMARY.find(a => a.id === id) ?? PINNABLE_UTILITIES.find(u => u.id === id);

type Utility = { id: string; label: string; icon: string; sub: string };

const UTILITIES: Utility[] = [
  { id: 'ai-gallery', label: 'AI Gallery', icon: '✦', sub: '24 images' },
  { id: 'recent',     label: 'Recent',     icon: '⟲', sub: 'Coffee Machines' },
  { id: 'wishlist',   label: 'Wishlist',   icon: '♡', sub: '12 saved' },
  { id: 'settings',   label: 'Settings',   icon: '⚙', sub: 'Bengaluru · 24°' },
];

const COLS = 3;
const PANEL_W = 726;   // grid (3 cols) + pinned column
const TILE_H = 156;    // primary tile height
const UTIL_H = 56;     // utility tile height
const PIN_SQ = 112;    // pinned square size
const HOLD_MS = 550;   // hold-OK duration to pin/unpin

// Navigation zones (integer slots):
const SEARCH = -1;           // search pill
// 0..8   primary grid (3 cols)
const UTIL_BASE = 9;         // 9..12 utilities (3 cols, rows of 3+1)
const PIN_BASE = 20;         // 20..22 pinned column (dynamic length)

// ─── PinnedWidgetsRail — square glances on L0's left edge ───────────────────

export function PinnedWidgetsRail({ pinnedIds, onOpen }: {
  pinnedIds: string[];
  /** click a square → open the hub focused on that item */
  onOpen?: (id: string) => void;
}) {
  return (
    <div style={{
      position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)',
      display: 'flex', flexDirection: 'column', gap: 12, zIndex: 56,
      animation: 'hh-in 0.4s ease both',
    }}>
      {pinnedIds.map(id => {
        const m = pinnableById(id);
        if (!m) return null;
        return <PinSquare key={m.id} meta={m} onClick={() => onOpen?.(m.id)} />;
      })}
      <style>{KEYFRAMES}</style>
    </div>
  );
}

function PinSquare({ meta, focused, onClick }: { meta: PinMeta; focused?: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: PIN_SQ, height: PIN_SQ, boxSizing: 'border-box', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '11px 12px', borderRadius: 20,
        background: focused ? 'rgba(24,24,36,0.9)' : 'rgba(14,14,22,0.6)',
        backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)',
        boxShadow: focused
          ? `inset 0 0 0 1px rgba(255,255,255,0.38), 0 0 0 1px ${meta.tint}59, 0 0 28px ${meta.tint}40, 0 14px 36px rgba(0,0,0,0.5)`
          : 'inset 0 0 0 1px rgba(255,255,255,0.09), 0 8px 24px rgba(0,0,0,0.35)',
        transform: focused ? 'scale(1.05)' : 'scale(1)',
        transition: 'all 0.28s cubic-bezier(0.25, 0.8, 0.25, 1)',
      }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: 9,
        background: `${meta.tint}26`, display: 'grid', placeItems: 'center', fontSize: 14,
      }}>
        {meta.icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: '-0.015em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {meta.pinTitle}
        </div>
        <div style={{ fontFamily: FONT, fontSize: 9.5, fontWeight: 600, color: meta.tint, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {meta.pinSub}
        </div>
      </div>
    </div>
  );
}

// ─── HybridHubPanel — search + 3-col grid + pinned 4th column ────────────────

export type HybridHubPanelProps = {
  onBack: () => void;
  onToast?: (msg: string) => void;
  /** item to focus on entry (primary agent or utility id) */
  initialAgentId?: string;
  pinnedIds: string[];
  onTogglePin: (id: string) => void;
};

export default function HybridHubPanel({ onBack, onToast, initialAgentId, pinnedIds, onTogglePin }: HybridHubPanelProps) {
  const initialSlot = (() => {
    const p = PRIMARY.findIndex(a => a.id === initialAgentId);
    if (p >= 0) return p;
    const u = UTILITIES.findIndex(x => x.id === initialAgentId);
    if (u >= 0) return UTIL_BASE + u;
    return 0;
  })();
  const [slot, setSlot] = useState(initialSlot);
  const pinCount = pinnedIds.length;
  const holdRef = useRef<{ t: ReturnType<typeof setTimeout> | null; fired: boolean }>({ t: null, fired: false });

  // If pins shrink under the focused pin slot, clamp back into a valid slot.
  useEffect(() => {
    if (slot >= PIN_BASE && slot - PIN_BASE >= pinCount) {
      setSlot(pinCount > 0 ? PIN_BASE + pinCount - 1 : 8);
    }
  }, [pinCount, slot]);

  const togglePin = (id: string) => {
    const m = pinnableById(id);
    if (!m) return;
    if (pinnedIds.includes(id)) {
      onTogglePin(id);
      onToast?.(`Unpinned ${m.label} from L0`);
    } else if (pinCount >= MAX_PINS) {
      onToast?.(`Maximum ${MAX_PINS} pins — unpin one first`);
    } else {
      onTogglePin(id);
      onToast?.(`📌 Pinned ${m.label} — always on L0`);
    }
  };

  useEffect(() => {
    const zones = () => {
      const inGrid  = slot >= 0 && slot < 9;
      const inUtils = slot >= UTIL_BASE && slot < UTIL_BASE + UTILITIES.length;
      const inPins  = slot >= PIN_BASE;
      return { inGrid, inUtils, inPins, utilIdx: inUtils ? slot - UTIL_BASE : 0 };
    };

    const down = (e: KeyboardEvent) => {
      const k = e.key;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter',' ','Escape','Backspace'].includes(k)) e.preventDefault();
      if (k === 'Escape' || k === 'Backspace') { onBack(); return; }

      // OK button: short press = open (on keyup) · hold = pin/unpin
      if (k === 'Enter' || k === ' ') {
        if (e.repeat) return;
        const { inGrid, inUtils, inPins, utilIdx } = zones();
        holdRef.current.fired = false;
        holdRef.current.t = setTimeout(() => {
          holdRef.current.fired = true;
          holdRef.current.t = null;
          if (inGrid) { togglePin(PRIMARY[slot].id); return; }
          if (inPins) { togglePin(pinnedIds[slot - PIN_BASE]); return; }
          if (inUtils) {
            const u = UTILITIES[utilIdx];
            if (pinnableById(u.id)) togglePin(u.id);
            else onToast?.(`${u.label} can't be pinned`);
          }
        }, HOLD_MS);
        return;
      }

      const { inGrid, inUtils, inPins, utilIdx } = zones();
      const gridRow = inGrid ? Math.floor(slot / COLS) : 0;
      const gridCol = inGrid ? slot % COLS : 0;
      const utilRow = Math.floor(utilIdx / COLS);
      const utilCol = utilIdx % COLS;

      if (k === 'ArrowLeft') {
        if (slot === SEARCH) { onBack(); return; }
        if (inGrid)  { gridCol > 0 ? setSlot(s => s - 1) : onBack(); return; }
        if (inUtils) { utilCol > 0 ? setSlot(s => s - 1) : onBack(); return; }
        if (inPins)  { setSlot((slot - PIN_BASE) * COLS + (COLS - 1)); return; } // back into grid, same row
        return;
      }
      if (k === 'ArrowRight') {
        if (inGrid) {
          if (gridCol < COLS - 1) setSlot(s => s + 1);
          else if (pinCount > 0) setSlot(PIN_BASE + Math.min(gridRow, pinCount - 1));
          return;
        }
        if (inUtils && utilCol < COLS - 1 && utilIdx + 1 < UTILITIES.length) setSlot(s => s + 1);
        return;
      }
      if (k === 'ArrowDown') {
        if (slot === SEARCH) { setSlot(0); return; }
        if (inGrid) {
          if (gridRow < 2) setSlot(s => s + COLS);
          else setSlot(UTIL_BASE + Math.min(gridCol, UTILITIES.length - 1)); // utils row 0
          return;
        }
        if (inUtils && utilRow === 0) {
          const target = UTIL_BASE + COLS + Math.min(utilCol, UTILITIES.length - COLS - 1);
          if (target < UTIL_BASE + UTILITIES.length) setSlot(target);
          return;
        }
        if (inPins && slot - PIN_BASE < pinCount - 1) setSlot(s => s + 1);
        return;
      }
      if (k === 'ArrowUp') {
        if (inGrid)  { gridRow > 0 ? setSlot(s => s - COLS) : setSlot(SEARCH); return; }
        if (inUtils) { utilRow > 0 ? setSlot(s => s - COLS) : setSlot(2 * COLS + utilCol); return; }
        if (inPins)  { slot > PIN_BASE ? setSlot(s => s - 1) : setSlot(SEARCH); return; }
        return;
      }
    };

    const up = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (holdRef.current.t) { clearTimeout(holdRef.current.t); holdRef.current.t = null; }
      if (holdRef.current.fired) { holdRef.current.fired = false; return; } // hold already handled
      const { inGrid, inUtils, inPins, utilIdx } = zones();
      if (slot === SEARCH) { onToast?.('Opening Search…'); return; }
      if (inGrid)  { onToast?.(`Opening ${PRIMARY[slot].label}…`); return; }
      if (inUtils) { onToast?.(`Opening ${UTILITIES[utilIdx].label}…`); return; }
      if (inPins)  { onToast?.(`Opening ${pinnableById(pinnedIds[slot - PIN_BASE])?.label}…`); return; }
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      if (holdRef.current.t) clearTimeout(holdRef.current.t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot, pinCount, pinnedIds, onBack, onToast]);

  return (
    <div style={{
      position: 'absolute', inset: 0,
      overflow: 'hidden', pointerEvents: 'auto',
      animation: 'hh-in 0.25s ease forwards',
    }}>
      {/* Left gradient only — solid behind the grid, L0 stays visible right of it */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: PANEL_W + 300,
        background: 'linear-gradient(to right, rgba(5,5,12,0.95) 0%, rgba(5,5,12,0.9) 52%, rgba(5,5,12,0.5) 78%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* Panel — everything visible, no scrolling */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: PANEL_W,
        boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column',
        padding: '28px 32px 20px 32px',
        animation: 'hh-slide-in 0.38s cubic-bezier(0.25, 0.8, 0.25, 1) forwards',
      }}>
        {/* Logo */}
        <div style={{ flexShrink: 0, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/glance-logo.png" alt="Glance" style={{ height: 22, opacity: 0.88 }} />
          <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
            Agent Hub
          </span>
        </div>

        {/* Search — on top of the hub */}
        <SearchPill focused={slot === SEARCH} onClick={() => setSlot(SEARCH)} />

        <div style={{ height: 16, flexShrink: 0 }} />

        {/* Grid area + pinned 4th column */}
        <div style={{ display: 'flex', gap: 14, flexShrink: 0 }}>
          {/* Left: primary grid + utilities */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <SectionLabel text="Primary AI" />
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: 10 }}>
              {PRIMARY.map((a, i) => (
                <PrimaryTile
                  key={a.id}
                  agent={a}
                  focused={slot === i}
                  pinned={pinnedIds.includes(a.id)}
                  animDelay={i * 0.02 + 0.05}
                  onClick={() => setSlot(i)}
                />
              ))}
            </div>

            <div style={{ height: 18 }} />

            <SectionLabel text="Utilities" />
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: 8 }}>
              {UTILITIES.map((u, i) => (
                <UtilityTile
                  key={u.id}
                  item={u}
                  focused={slot === UTIL_BASE + i}
                  pinned={pinnedIds.includes(u.id)}
                  tint={pinnableById(u.id)?.tint}
                  onClick={() => setSlot(UTIL_BASE + i)}
                />
              ))}
            </div>
          </div>

          {/* Right: pinned widgets — the same squares that live on L0 */}
          <div style={{ width: PIN_SQ, flexShrink: 0 }}>
            <SectionLabel text="Pinned" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pinnedIds.map((id, i) => {
                const m = pinnableById(id);
                if (!m) return null;
                return <PinSquare key={id} meta={m} focused={slot === PIN_BASE + i} onClick={() => setSlot(PIN_BASE + i)} />;
              })}
              {Array.from({ length: MAX_PINS - pinnedIds.length }).map((_, i) => (
                <div key={`empty-${i}`} style={{
                  width: PIN_SQ, height: PIN_SQ, boxSizing: 'border-box', borderRadius: 20,
                  border: '1.5px dashed rgba(255,255,255,0.14)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
                }}>
                  <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.3)' }}>＋</span>
                  <span style={{ fontFamily: FONT, fontSize: 8.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', textAlign: 'center', lineHeight: 1.5 }}>
                    Hold OK<br />to pin
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hints */}
        <div style={{ flexShrink: 0, display: 'flex', gap: 12, paddingTop: 12, marginTop: 'auto' }}>
          {[['↑↓←→','Navigate'],['OK','Open'],['Hold OK','Pin / Unpin'],['←','Back to L0']].map(([k,l]) => (
            <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: FONT, fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
              <kbd style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.28)', fontFamily: FONT }}>{k}</kbd>
              {l}
            </span>
          ))}
        </div>
      </div>

      <style>{KEYFRAMES}</style>
    </div>
  );
}

// ─── Pieces ───────────────────────────────────────────────────────────────────

function SearchPill({ focused, onClick }: { focused: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        flexShrink: 0, boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '11px 18px', borderRadius: 999, cursor: 'pointer',
        background: focused ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)',
        boxShadow: focused
          ? '0 0 0 1px rgba(255,255,255,0.32), 0 0 30px rgba(167,134,229,0.22), 0 10px 30px rgba(0,0,0,0.35)'
          : 'inset 0 0 0 1px rgba(255,255,255,0.08)',
        transition: 'all 0.24s ease',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.55, flexShrink: 0 }}>
        <circle cx="11" cy="11" r="7" stroke="white" strokeWidth="2"/>
        <path d="M16.5 16.5L21 21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      <span style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 500, color: focused ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.38)', transition: 'color 0.2s ease' }}>
        Search or ask anything
      </span>
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{
      flexShrink: 0, fontFamily: FONT, fontSize: 9.5, fontWeight: 800,
      letterSpacing: '0.16em', textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.32)', margin: '0 2px 9px',
    }}>
      {text}
    </div>
  );
}

function PrimaryTile({ agent, focused, pinned, animDelay, onClick }: {
  agent: PrimaryAgent;
  focused: boolean;
  pinned: boolean;
  animDelay: number;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative', height: TILE_H, boxSizing: 'border-box',
        borderRadius: 18, overflow: 'hidden', cursor: 'pointer',
        background: 'rgba(22,22,32,0.6)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        boxShadow: focused
          ? `inset 0 0 0 1px rgba(255,255,255,0.38), 0 0 0 1px ${agent.tint}59, 0 0 30px ${agent.tint}40, 0 14px 40px rgba(0,0,0,0.5)`
          : 'inset 0 0 0 1px rgba(255,255,255,0.07), 0 6px 18px rgba(0,0,0,0.3)',
        transform: focused ? 'scale(1.035)' : 'scale(1)',
        transition: 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.3s ease',
        animation: `hh-item-in 0.36s ${animDelay.toFixed(2)}s both`,
        zIndex: focused ? 1 : 0,
      }}
    >
      {agent.image && (
        <>
          <img src={agent.image} alt="" style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', filter: focused ? 'brightness(0.72)' : 'brightness(0.5) saturate(0.9)',
            transition: 'filter 0.3s ease',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(8,8,14,0.94) 0%, rgba(8,8,14,0.45) 55%, rgba(8,8,14,0.15) 100%)',
          }} />
        </>
      )}

      <div style={{ position: 'relative', height: '100%', boxSizing: 'border-box', padding: '12px 13px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{
            width: 30, height: 30, borderRadius: 10,
            background: agent.image ? 'rgba(12,12,18,0.55)' : `${agent.tint}26`,
            backdropFilter: agent.image ? 'blur(10px)' : undefined,
            WebkitBackdropFilter: agent.image ? 'blur(10px)' : undefined,
            boxShadow: agent.image ? `inset 0 0 0 1px ${agent.tint}40` : 'none',
            display: 'grid', placeItems: 'center', fontSize: 15,
          }}>
            {agent.icon}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* pin badge — continuity with the L0 squares */}
            {pinned && (
              <span style={{
                fontFamily: FONT, fontSize: 8, fontWeight: 800, letterSpacing: '0.08em',
                color: '#0C1014', background: agent.tint, borderRadius: 999, padding: '2px 7px',
                boxShadow: `0 0 10px ${agent.tint}66`,
              }}>
                PIN
              </span>
            )}
            {focused && (
              <div style={{ width: 24, height: 24, display: 'grid', placeItems: 'center', animation: 'hh-in 0.3s 0.12s both' }}>
                <AgentMascot agentMode="idle" size={24} />
              </div>
            )}
          </div>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 800, color: 'rgba(255,255,255,0.96)', letterSpacing: '-0.015em', textShadow: agent.image ? '0 1px 5px rgba(0,0,0,0.6)' : 'none' }}>
            {agent.label}
          </div>
          <div style={{ fontFamily: FONT, fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: agent.tint, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: agent.image ? '0 1px 4px rgba(0,0,0,0.6)' : 'none' }}>
            {agent.kicker}
          </div>
          <div style={{ fontFamily: FONT, fontSize: 10.5, fontWeight: 600, color: 'rgba(255,255,255,0.68)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: agent.image ? '0 1px 4px rgba(0,0,0,0.6)' : 'none' }}>
            {agent.value}
          </div>
        </div>
      </div>
    </div>
  );
}

function UtilityTile({ item, focused, pinned, tint, onClick }: {
  item: Utility;
  focused: boolean;
  pinned?: boolean;
  tint?: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        height: UTIL_H, boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '0 12px', borderRadius: 13, cursor: 'pointer',
        background: focused ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.03)',
        boxShadow: focused
          ? 'inset 0 0 0 1px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.35)'
          : 'inset 0 0 0 1px rgba(255,255,255,0.05)',
        transform: focused ? 'scale(1.04)' : 'scale(1)',
        transition: 'all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)',
      }}
    >
      <span style={{ width: 16, textAlign: 'center', fontSize: 13, color: focused ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)', transition: 'color 0.2s ease', flexShrink: 0 }}>
        {item.icon}
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontFamily: FONT, fontSize: 11.5, fontWeight: 700, color: focused ? '#fff' : 'rgba(255,255,255,0.6)', transition: 'color 0.2s ease', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.label}
        </div>
        <div style={{ fontFamily: FONT, fontSize: 9, fontWeight: 500, color: focused ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)', marginTop: 1, transition: 'color 0.2s ease', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.sub}
        </div>
      </div>
      {pinned && tint && (
        <span style={{
          fontFamily: FONT, fontSize: 7.5, fontWeight: 800, letterSpacing: '0.08em', flexShrink: 0,
          color: '#0C1014', background: tint, borderRadius: 999, padding: '2px 6px',
        }}>
          PIN
        </span>
      )}
    </div>
  );
}

// ─── Keyframes ────────────────────────────────────────────────────────────────

const KEYFRAMES = `
@keyframes hh-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes hh-slide-in {
  from { transform: translateX(-32px); opacity: 0; }
  to   { transform: translateX(0);     opacity: 1; }
}
@keyframes hh-item-in {
  from { opacity: 0; transform: translateX(-14px); }
  to   { opacity: 1; transform: translateX(0); }
}
`;
