/**
 * HybridHubPanel — Option 4 (previously "Option 2.5"): the bridge between
 * Ambient Home and Agent Hub.
 *
 * · Up to four Adaptive AI Glances sit on L0's left edge (Live Sports on top —
 *   the handy one, then Continue Thread, AI Generation). Pressing ← opens the
 *   hub with focus already on the top glance; the glance tiles DO NOT move —
 *   the hub column renders in exactly the same spot as the L0 rail, so the
 *   transition is seamless: the panel materializes to their right.
 * · The hub: "Ask Glance" hero (with mic) on top, a 3×2 grid of icon-led
 *   agent cards (no imagery — imagery lives only on the glances), and a
 *   4-column "Your Space" row (AI Gallery, Wishlist, Weather, Settings).
 * · Pinning (TV remote friendly): short-press OK opens the focused item,
 *   HOLD OK (~½s) pins/unpins it. Max 4 pinned.
 * · L0 stays frozen, slightly shrunk and shifted right, behind a left
 *   gradient only — no full-screen dim.
 *
 * Visual system: four card types — Hero, Agent card, Adaptive glance,
 * Utility card — sharing one radius scale and one focus treatment
 * (quiet white ring + lift, no colored glow).
 */

import { useState, useEffect, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import AgentMascot from '../Shared/AgentMascot';

// ─── Design tokens — shared across all four card types ──────────────────────
// Exported: this file is the design-system source of truth for the Agent Hub
// options — Option 5 (Explore First) imports everything visual from here.

export const FONT = '"Plus Jakarta Sans",system-ui,sans-serif';

export const RADIUS = { hero: 26, card: 20, pin: 18 };

/** The one focus treatment reused everywhere: soft ring + glow + lift — not just an outline. */
export function chrome(focused: boolean, restShadow: string, focusScale = 1.03): CSSProperties {
  return {
    boxShadow: focused
      ? '0 0 0 1.5px rgba(255,255,255,0.75), 0 0 36px rgba(255,255,255,0.12), 0 22px 52px rgba(0,0,0,0.6)'
      : restShadow,
    transform: `scale(${focused ? focusScale : 1})`,
    transition: 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.3s ease',
  };
}

/** Minimal pin indicator — a plain dot, not a colored badge. */
function PinDot() {
  return (
    <div style={{
      position: 'absolute', top: 12, right: 12, width: 9, height: 9, borderRadius: '50%',
      background: '#fff', boxShadow: '0 0 0 3px rgba(255,255,255,0.16), 0 2px 6px rgba(0,0,0,0.4)',
    }} />
  );
}

// ─── Icon set — line icons in the Agent Home style ───────────────────────────

export function Icon({ name, tint, size = 26 }: { name: string; tint: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    travel:        <path d="M22 2 L11 13 M22 2 L15 22 L11 13 L2 9 Z" />,
    recipes:       <><path d="M7.2 13.2 A4.1 4.1 0 1 1 8.4 5.5 A5.1 5.1 0 0 1 12 4 a5.1 5.1 0 0 1 3.6 1.5 A4.1 4.1 0 1 1 16.8 13.2 V19 H7.2 Z" /><path d="M7.2 16.2 H16.8" /></>,
    shopping:      <><path d="M6 7.5 H18 L19 21 H5 Z" /><path d="M9 10 V6.5 a3 3 0 0 1 6 0 V10" /></>,
    entertainment: <><circle cx="12" cy="12" r="9" /><path d="M10.2 8.6 L15.6 12 L10.2 15.4 Z" /></>,
    fashion:       <><path d="M12 7.4 L21 15.5 H3 Z" /><path d="M12 7.4 V6 a2 2 0 1 1 2-2" /></>,
    'home-decor':  <><path d="M3 11.2 L12 3.5 L21 11.2" /><path d="M5.5 9.5 V20.5 H18.5 V9.5" /></>,
    gallery:       <><rect x="3" y="5" width="18" height="14" rx="2.2" /><circle cx="8.6" cy="10" r="1.5" /><path d="M4 17.5 L9.5 12.5 L14 16.5 L16.8 13.8 L20.5 17.5" /></>,
    wishlist:      <path d="M12 20.2 C7.2 16.2 3.8 13 3.8 9.5 A4.3 4.3 0 0 1 12 7 A4.3 4.3 0 0 1 20.2 9.5 C20.2 13 16.8 16.2 12 20.2 Z" />,
    weather:       <><path d="M7 16 a4.6 4.6 0 1 1 0.9-9.1 A5.6 5.6 0 0 1 18.6 8.6 A3.8 3.8 0 0 1 17.6 16 Z" /><path d="M8.5 19 v1.6 M12 19 v1.6 M15.5 19 v1.6" /></>,
    settings:      <><circle cx="12" cy="12" r="3.1" /><path d="M12 2.5 v2.8 M12 18.7 v2.8 M2.5 12 h2.8 M18.7 12 h2.8 M5.2 5.2 l2 2 M16.8 16.8 l2 2 M18.8 5.2 l-2 2 M7.2 16.8 l-2 2" /></>,
    mic:           <><rect x="9.3" y="2.5" width="5.4" height="11" rx="2.7" /><path d="M5.5 11.5 a6.5 6.5 0 0 0 13 0 M12 18 V21.5" /></>,
    recent:        <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5 V12 l3.2 2" /></>,
    explore:       <><circle cx="12" cy="12" r="9" /><path d="M15.6 8.4 L13.6 13.6 L8.4 15.6 L10.4 10.4 Z" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={tint} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

// ─── Types & data ─────────────────────────────────────────────────────────────

/**
 * Anything that can live as a pinned glance. A glance is status-first, not
 * content-first — it answers "why does this card exist" in under a second:
 *   STATUS (why now) → HERO (the one value) → OBJECT → CONTEXT
 */
export type PinMeta = {
  id: string;
  label: string;
  /** why this card exists right now — 'LIVE', 'CONTINUE', 'READY', … */
  status: string;
  /** accent color for the status + what makes each glance feel its own */
  tone: string;
  /** the one dominant piece of information */
  hero: string;
  /** what the hero value refers to, if the hero alone isn't enough */
  object?: string;
  /** one short supporting line */
  context?: string;
  /** backdrop image — supports the hero value, never dominates it */
  image?: string;
  /** live surfaces pulse faster and stay red */
  live?: boolean;
  /** 'heavy' dims the image hard for data-first glances (scores, prices) */
  overlay?: 'heavy' | 'soft';
};

export type PrimaryAgent = PinMeta & {
  icon: string;
  /** the one concise contextual value shown under the title */
  value: string;
};

/** The six primary AI agents — intelligent specialists, deliberately capped. */
export const PRIMARY: PrimaryAgent[] = [
  { id: 'travel',        label: 'Travel',        icon: 'travel',        tone: '#4DD0C4', value: 'Coorg · 4 hrs away',     image: '/images/warm-start/coorg.jpg',                            status: 'TRIP',       hero: 'Coorg',      context: '4 hrs away' },
  { id: 'recipes',       label: 'Recipes',       icon: 'recipes',       tone: '#FFB86B', value: 'Naan Pizza · 25 min',    image: '/images/feed/feed_04-food-dinner-party-table.jpg',        status: 'TONIGHT',    hero: '25 min',     object: 'Naan Pizza' },
  { id: 'shopping',      label: 'Shopping',      icon: 'shopping',      tone: '#6BD98A', value: 'Sony XM5 · Price Drop',  image: '/images/feed/feed_46-fashion-luxury-flatlay.jpg',         status: 'PRICE DROP', hero: '₹2,000 OFF', object: 'Sony XM5', context: 'Today', overlay: 'heavy' },
  { id: 'entertainment', label: 'Entertainment', icon: 'entertainment', tone: '#B48CFF', value: 'The Bear · S3E4',        image: '/images/feed/feed_60-entertainment-vinyl-music-room.jpg', status: 'RESUME',     hero: 'The Bear',   context: 'S3E4' },
  { id: 'fashion',       label: 'Fashion',       icon: 'fashion',       tone: '#F79BC3', value: '3 new looks',            image: '/images/feed/feed_31-fashion-streetwear-editorial.jpg',  status: 'NEW',        hero: '3 looks',    context: 'Rain-ready' },
  { id: 'home-decor',    label: 'Home Decor',    icon: 'home-decor',    tone: '#E8CE8A', value: 'Warm layered lighting',  image: '/images/feed/feed_24-home-cozy-monsoon-living-room.jpg', status: 'IDEA',       hero: '5 lamps',    context: 'Warm light' },
];

/**
 * Adaptive AI Glances — dynamic AI surfaces, not fixed shortcuts. Hardcoded
 * for the prototype; later the AI reorders them by what matters right now
 * (live match → sports first, active trip → travel first). Each one has its
 * own visual language: sports is score-first over a hard-dimmed stadium,
 * travel is destination-image-led, generation is thumbnail + READY badge.
 */
export const ADAPTIVE_GLANCES: PinMeta[] = [
  { id: 'live-sports',     label: 'Live Sports',     status: 'LIVE',     tone: '#FF5A5A', hero: '241/4',        object: 'IND vs AUS', context: '47.3 overs',       image: '/images/feed/feed_25-sports-cricket-stadium-floodlights.jpg', live: true, overlay: 'heavy' },
  { id: 'continue-thread', label: 'Continue Thread', status: 'CONTINUE', tone: '#8FD6FF', hero: 'Coorg Trip',                         context: '2 new ideas',      image: '/images/warm-start/coorg.jpg' },
  { id: 'ai-generation',   label: 'AI Generation',   status: 'READY',    tone: '#C9A6F5', hero: 'Forest Cabin',                       context: 'Continue editing', image: '/images/feed/feed_34-travel-nordic-winter-cabin.jpg' },
];

/** Pinnable non-agent destinations from Your Space. */
const PINNABLE_SPACE: PinMeta[] = [
  { id: 'ai-gallery', label: 'AI Gallery', status: 'GENERATED', tone: '#B9A6F0', hero: '24 images', context: 'Latest 2h ago', image: '/images/feed/feed_63-culture-holi-color-abstract.jpg' },
];

export const MAX_PINS = 4;
export const DEFAULT_PINNED = ['live-sports', 'continue-thread', 'ai-generation'];
/** Extra pinnables registered by other surfaces (e.g. Explore collections in Option 5). */
const EXTRA_PINNABLES: PinMeta[] = [];
export function registerPinnable(item: PinMeta) {
  const i = EXTRA_PINNABLES.findIndex(e => e.id === item.id);
  if (i >= 0) EXTRA_PINNABLES[i] = item; else EXTRA_PINNABLES.push(item);
}

export const pinnableById = (id: string): PinMeta | undefined =>
  PRIMARY.find(a => a.id === id) ?? ADAPTIVE_GLANCES.find(g => g.id === id)
  ?? PINNABLE_SPACE.find(u => u.id === id) ?? EXTRA_PINNABLES.find(e => e.id === id);

type SpaceItem = {
  id: string;
  label: string;
  sub: string;
  icon: string;
  tint: string;
  /** each utility has its own emphasis: imagery, saved item, temperature, or quiet */
  variant: 'gallery' | 'wishlist' | 'weather' | 'settings';
  thumbs?: string[];
  value?: string;
};

/** Your Space — utility surfaces below the agents, Settings included. */
const YOUR_SPACE: SpaceItem[] = [
  { id: 'ai-gallery', label: 'AI Gallery', sub: '24 images',   icon: 'gallery',  tint: '#B9A6F0', variant: 'gallery',
    thumbs: [
      '/images/feed/feed_34-travel-nordic-winter-cabin.jpg',
      '/images/feed/feed_63-culture-holi-color-abstract.jpg',
      '/images/feed/feed_31-fashion-streetwear-editorial.jpg',
    ] },
  { id: 'wishlist',   label: 'Wishlist',   sub: '12 saved',    icon: 'wishlist', tint: '#F79BC3', variant: 'wishlist',
    thumbs: ['/images/feed/feed_46-fashion-luxury-flatlay.jpg'] },
  { id: 'weather',    label: 'Weather',    sub: 'Rain in 2 hrs', icon: 'weather', tint: '#6FB9FF', variant: 'weather', value: '24°' },
  { id: 'settings',   label: 'Settings',   sub: 'Preferences', icon: 'settings', tint: '#9AA3B2', variant: 'settings' },
];
const SPACE_COLS = YOUR_SPACE.length;

const COLS = 3;
const PIN_SQ = 112;      // adaptive glance size — identical on L0 and in the hub (seamless)
const RAIL_X = 20;       // glance column x — identical on L0 and in the hub (seamless)
const RAIL_GAP = 20;     // smart-card stack gap — identical on L0 and in the hub
const CONTENT_X = 176;   // panel content starts right of the glances column
const PANEL_W = 950;     // glances column + content
const TILE_H = 158;      // agent card height — room for title + capabilities + activity
const SPACE_H = 100;     // your-space tile height
export const HOLD_MS = 550;  // hold-OK duration to pin/unpin

// Navigation zones (integer slots):
const ASK_GLANCE = -1;       // Ask Glance hero
// 0..5   agents grid (3 cols × 2 rows)
const SPACE_BASE = 9;        // 9..12 your space (4 cols, single row — Settings last)
const PIN_BASE = 20;         // 20..23 glances column (dynamic length)

// ─── PinnedWidgetsRail — adaptive glances on L0's left edge ─────────────────

export function PinnedWidgetsRail({ pinnedIds, onOpen }: {
  pinnedIds: string[];
  /** click a glance → open the hub focused on that item */
  onOpen?: (id: string) => void;
}) {
  return (
    <div style={{
      position: 'absolute', left: RAIL_X, top: '50%', transform: 'translateY(-50%)',
      display: 'flex', flexDirection: 'column', gap: RAIL_GAP, zIndex: 56,
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

export function PinSquare({ meta, focused, onClick }: { meta: PinMeta; focused?: boolean; onClick?: () => void }) {
  const heavy = meta.overlay === 'heavy';
  // Short heroes (scores, counts) go big; longer ones (names) step down and may wrap.
  const heroSize = meta.hero.length <= 7 ? 23 : 16;
  return (
    <div
      onClick={onClick}
      style={{
        width: PIN_SQ, height: PIN_SQ, boxSizing: 'border-box', cursor: 'pointer',
        position: 'relative', overflow: 'hidden', borderRadius: RADIUS.pin,
        background: '#0a0a10',
        ...chrome(focused ?? false, '0 4px 16px rgba(0,0,0,0.3)', 1.045),
      }}
    >
      {meta.image ? (
        <img src={meta.image} alt="" style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
          filter: focused
            ? (heavy ? 'brightness(0.5)' : 'brightness(0.78)')
            : (heavy ? 'brightness(0.34) saturate(0.85)' : 'brightness(0.55) saturate(0.92)'),
          transition: 'filter 0.3s ease',
        }} />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.05)' }} />
      )}
      <div style={{
        position: 'absolute', inset: 0,
        background: heavy
          ? 'linear-gradient(to top, rgba(4,4,8,0.96) 0%, rgba(4,4,8,0.62) 60%, rgba(4,4,8,0.3) 100%)'
          : 'linear-gradient(to top, rgba(4,4,8,0.94) 0%, rgba(4,4,8,0.32) 55%, rgba(4,4,8,0.05) 100%)',
      }} />

      {/* STATUS — why this card exists right now. Its dot breathes: the AI is working. */}
      <span style={{
        position: 'absolute', top: 8, left: 8,
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '3px 7px', borderRadius: 999,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        boxShadow: `inset 0 0 0 1px ${meta.tone}44`,
      }}>
        <span style={{
          width: 5, height: 5, borderRadius: '50%', background: meta.tone, flexShrink: 0,
          animation: meta.live ? 'hh-live-pulse 1.4s ease-in-out infinite' : 'hh-status-pulse 3.2s ease-in-out infinite',
        }} />
        <span style={{ fontFamily: FONT, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.08em', color: meta.tone, whiteSpace: 'nowrap' }}>
          {meta.status}
        </span>
      </span>

      {/* HERO → OBJECT → CONTEXT */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '10px 11px', boxSizing: 'border-box' }}>
        <div style={{
          fontFamily: FONT, fontSize: heroSize, fontWeight: 800, color: '#fff',
          letterSpacing: '-0.02em', lineHeight: 1.02,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          textShadow: '0 1px 5px rgba(0,0,0,0.7)',
        }}>
          {meta.hero}
        </div>
        {meta.object && (
          <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.92)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
            {meta.object}
          </div>
        )}
        {meta.context && (
          <div style={{ fontFamily: FONT, fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.66)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {meta.context}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── HybridHubPanel — glances (left, static) + hero + agents + Your Space ───

export type HybridHubPanelProps = {
  onBack: () => void;
  onToast?: (msg: string) => void;
  /** item to focus on entry (agent, space item, or pinned glance id) */
  initialAgentId?: string;
  pinnedIds: string[];
  onTogglePin: (id: string) => void;
};

export default function HybridHubPanel({ onBack, onToast, initialAgentId, pinnedIds, onTogglePin }: HybridHubPanelProps) {
  const initialSlot = (() => {
    const p = PRIMARY.findIndex(a => a.id === initialAgentId);
    if (p >= 0) return p;
    const sp = YOUR_SPACE.findIndex(x => x.id === initialAgentId);
    if (sp >= 0) return SPACE_BASE + sp;
    const pin = pinnedIds.findIndex(id => id === initialAgentId);
    if (pin >= 0) return PIN_BASE + pin;
    return PIN_BASE; // default focus: top adaptive glance (Live Sports)
  })();
  const [slot, setSlot] = useState(initialSlot);
  const pinCount = pinnedIds.length;
  const holdRef = useRef<{ t: ReturnType<typeof setTimeout> | null; fired: boolean }>({ t: null, fired: false });

  // If pins shrink under the focused pin slot, clamp back into a valid slot.
  useEffect(() => {
    if (slot >= PIN_BASE && slot - PIN_BASE >= pinCount) {
      setSlot(pinCount > 0 ? PIN_BASE + pinCount - 1 : 0);
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
      const inAgents = slot >= 0 && slot < PRIMARY.length;
      const inSpace = slot >= SPACE_BASE && slot < SPACE_BASE + YOUR_SPACE.length;
      const inPins = slot >= PIN_BASE;
      return { inAgents, inSpace, inPins, spaceIdx: inSpace ? slot - SPACE_BASE : 0 };
    };

    const down = (e: KeyboardEvent) => {
      const k = e.key;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter',' ','Escape','Backspace'].includes(k)) e.preventDefault();
      if (k === 'Escape' || k === 'Backspace') { onBack(); return; }

      // OK button: short press = open (on keyup) · hold = pin/unpin
      if (k === 'Enter' || k === ' ') {
        if (e.repeat) return;
        const { inAgents, inSpace, inPins, spaceIdx } = zones();
        holdRef.current.fired = false;
        holdRef.current.t = setTimeout(() => {
          holdRef.current.fired = true;
          holdRef.current.t = null;
          if (inAgents) { togglePin(PRIMARY[slot].id); return; }
          if (inPins) { togglePin(pinnedIds[slot - PIN_BASE]); return; }
          if (inSpace) {
            const it = YOUR_SPACE[spaceIdx];
            if (pinnableById(it.id)) togglePin(it.id);
            else onToast?.(`${it.label} can't be pinned`);
          }
        }, HOLD_MS);
        return;
      }

      const { inAgents, inSpace, inPins, spaceIdx } = zones();
      const agentRow = inAgents ? Math.floor(slot / COLS) : 0;
      const agentCol = inAgents ? slot % COLS : 0;
      const pinIdx = inPins ? slot - PIN_BASE : 0;

      if (k === 'ArrowLeft') {
        if (slot === ASK_GLANCE) { onBack(); return; }
        // glances are the leftmost column — one more ← exits to L0
        if (inPins)   { onBack(); return; }
        if (inAgents) { agentCol > 0 ? setSlot(s => s - 1) : setSlot(PIN_BASE + Math.min(agentRow, pinCount - 1)); return; }
        if (inSpace)  { spaceIdx > 0 ? setSlot(s => s - 1) : setSlot(PIN_BASE + pinCount - 1); return; }
        return;
      }
      if (k === 'ArrowRight') {
        if (inPins)   { setSlot(Math.min(pinIdx, 1) * COLS); return; } // into agents, matching row
        if (inAgents && agentCol < COLS - 1) { setSlot(s => s + 1); return; }
        if (inSpace && spaceIdx < SPACE_COLS - 1) { setSlot(s => s + 1); return; }
        return;
      }
      if (k === 'ArrowDown') {
        if (slot === ASK_GLANCE) { setSlot(0); return; }
        if (inAgents) {
          if (agentRow === 0) setSlot(s => s + COLS);
          else setSlot(SPACE_BASE + agentCol);
          return;
        }
        if (inPins && pinIdx < pinCount - 1) setSlot(s => s + 1);
        return;
      }
      if (k === 'ArrowUp') {
        if (inAgents) { agentRow > 0 ? setSlot(s => s - COLS) : setSlot(ASK_GLANCE); return; }
        if (inSpace)  { setSlot(COLS + Math.min(spaceIdx, COLS - 1)); return; } // agents row 1
        if (inPins)   { if (pinIdx > 0) setSlot(s => s - 1); return; }
        return;
      }
    };

    const up = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (holdRef.current.t) { clearTimeout(holdRef.current.t); holdRef.current.t = null; }
      if (holdRef.current.fired) { holdRef.current.fired = false; return; } // hold already handled
      const { inAgents, inSpace, inPins, spaceIdx } = zones();
      if (slot === ASK_GLANCE) { onToast?.('Opening Ask Glance…'); return; }
      if (inAgents) { onToast?.(`Opening ${PRIMARY[slot].label}…`); return; }
      if (inSpace)  { onToast?.(`Opening ${YOUR_SPACE[spaceIdx].label}…`); return; }
      if (inPins)   { onToast?.(`Opening ${pinnableById(pinnedIds[slot - PIN_BASE])?.label}…`); return; }
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
        position: 'absolute', left: 0, top: 0, bottom: 0, width: PANEL_W + 380,
        background: 'linear-gradient(to right, rgba(5,5,12,1) 0%, rgba(5,5,12,0.985) 66%, rgba(5,5,12,0.6) 86%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* Glances column — exactly where the L0 rail sits, so the tiles never
          move when the hub opens. Only the label, focus ring and the empty
          pin slot fade in around them. */}
      <div style={{
        position: 'absolute', left: RAIL_X, top: '50%', transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', gap: RAIL_GAP, zIndex: 2,
      }}>
        <div style={{
          position: 'absolute', bottom: '100%', left: 2, marginBottom: 10,
          fontFamily: FONT, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.16em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)',
          animation: 'hh-in 0.4s 0.15s both', whiteSpace: 'nowrap',
        }}>
          ✦ Smart Updates
        </div>
        {pinnedIds.map((id, i) => {
          const m = pinnableById(id);
          if (!m) return null;
          return <PinSquare key={id} meta={m} focused={slot === PIN_BASE + i} onClick={() => setSlot(PIN_BASE + i)} />;
        })}
        {pinCount < MAX_PINS && (
          <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: RAIL_GAP, display: 'flex', flexDirection: 'column', gap: RAIL_GAP, animation: 'hh-in 0.4s 0.15s both' }}>
            {Array.from({ length: MAX_PINS - pinCount }).map((_, i) => (
              <div key={`empty-${i}`} style={{
                width: PIN_SQ, height: PIN_SQ, boxSizing: 'border-box', borderRadius: RADIUS.pin,
                border: '1.5px dashed rgba(255,255,255,0.14)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>＋</span>
                <span style={{ fontFamily: FONT, fontSize: 7.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.26)', textAlign: 'center', lineHeight: 1.4 }}>
                  Hold OK<br />to pin
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Panel content — slides in to the right of the static glances */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: PANEL_W,
        boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column',
        padding: `36px 44px 28px ${CONTENT_X}px`,
        animation: 'hh-slide-in 0.38s cubic-bezier(0.25, 0.8, 0.25, 1) forwards',
      }}>
        {/* Logo — fixed to the top */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/glance-logo.png" alt="Glance" style={{ height: 22, opacity: 0.88 }} />
          <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
            Agent Hub
          </span>
        </div>

        {/* Everything else centers between the logo and the hints. */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Ask Glance — the hero, with mic. The mascot is the emotional anchor. */}
          <AskGlanceHero focused={slot === ASK_GLANCE} onClick={() => setSlot(ASK_GLANCE)} />

          <div style={{ height: 28, flexShrink: 0 }} />

          <SectionLabel text="Agents" />
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: 16 }}>
            {PRIMARY.map((a, i) => (
              <PrimaryTile
                key={a.id}
                agent={a}
                focused={slot === i}
                pinned={pinnedIds.includes(a.id)}
                animDelay={i * 0.02 + 0.09}
                onClick={() => setSlot(i)}
              />
            ))}
          </div>

          <div style={{ height: 30 }} />

          <SectionLabel text="Your Space" />
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${SPACE_COLS}, 1fr)`, gap: 12 }}>
            {YOUR_SPACE.map((it, i) => (
              <SpaceTile
                key={it.id}
                item={it}
                focused={slot === SPACE_BASE + i}
                pinned={pinnedIds.includes(it.id)}
                animDelay={(PRIMARY.length + i) * 0.02 + 0.09}
                onClick={() => setSlot(SPACE_BASE + i)}
              />
            ))}
          </div>
        </div>

        {/* Hints — fixed to the bottom */}
        <div style={{ flexShrink: 0, display: 'flex', gap: 12, paddingTop: 12 }}>
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

function AskGlanceHero({ focused, onClick }: { focused: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        flexShrink: 0, boxSizing: 'border-box', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 26,
        padding: '30px 36px', borderRadius: RADIUS.hero,
        // one surface, one interaction — soft top-light so it reads as a place, not a card
        background: 'linear-gradient(180deg, rgba(32,32,44,0.97) 0%, rgba(15,15,22,0.97) 100%)',
        backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
        animation: 'hh-item-in 0.36s 0.02s both',
        ...chrome(focused,
          'inset 0 1px 0 rgba(255,255,255,0.09), inset 0 0 0 1px rgba(255,255,255,0.05), 0 10px 30px rgba(0,0,0,0.35)',
          1.015),
      }}
    >
      {/* The microphone IS the interaction — bare icon, generous space, no nested button */}
      <Icon name="mic" tint={focused ? '#fff' : 'rgba(255,255,255,0.8)'} size={30} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FONT, fontSize: 25, fontWeight: 800, color: '#fff', letterSpacing: '-0.015em' }}>
          Ask Glance
        </div>
        <div style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 500, color: 'rgba(255,255,255,0.52)', marginTop: 5 }}>
          Start a conversation
        </div>
      </div>
      {/* Mascot floats on the far right — the AI's identity, not a button */}
      <div style={{
        width: 64, height: 64, flexShrink: 0,
        display: 'grid', placeItems: 'center',
        filter: 'drop-shadow(0 0 26px rgba(139,92,246,0.45))',
        animation: 'hh-mascot-float 4.5s ease-in-out infinite',
      }}>
        <AgentMascot agentMode="idle" size={56} />
      </div>
    </div>
  );
}

export function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{
      flexShrink: 0, fontFamily: FONT, fontSize: 9.5, fontWeight: 800,
      letterSpacing: '0.16em', textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.3)', margin: '0 2px 10px',
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
        borderRadius: RADIUS.card, overflow: 'hidden', cursor: 'pointer',
        background: '#0b0b12',
        animation: `hh-item-in 0.36s ${animDelay.toFixed(2)}s both`,
        zIndex: focused ? 1 : 0,
        boxShadow: focused
          ? '0 0 0 1.5px rgba(255,255,255,0.75), 0 0 36px rgba(255,255,255,0.12), inset 0 1px 0 rgba(255,255,255,0.16), 0 26px 60px rgba(0,0,0,0.62)'
          : 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1px rgba(255,255,255,0.03), 0 6px 18px rgba(0,0,0,0.28)',
        transform: `scale(${focused ? 1.035 : 1})`,
        transition: 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.3s ease',
      }}
    >
      {/* Ambient domain imagery — the world behind the glass. It says "travel"
          before the title does, without turning the card into a photo. */}
      {agent.image && (
        <img src={agent.image} alt="" style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
          opacity: focused ? 0.85 : 0.6,
          filter: 'brightness(0.62) saturate(0.92)',
          transform: `scale(${focused ? 1.07 : 1})`,
          transition: 'opacity 0.35s ease, transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)',
        }} />
      )}
      {/* Glass over the world + a whisper of the agent's own light, top-left */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(120% 90% at 18% 0%, ${agent.tone}14, transparent 55%),
          linear-gradient(180deg, rgba(9,9,15,0.42) 0%, rgba(9,9,15,0.86) 100%)`,
      }} />

      {pinned && <PinDot />}

      <div style={{ position: 'relative', height: '100%', boxSizing: 'border-box', padding: '18px 18px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Icon name={agent.icon} tint={agent.tone} size={26} />
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontFamily: FONT, fontSize: 18, fontWeight: 800, letterSpacing: '-0.015em',
            color: focused ? '#fff' : 'rgba(255,255,255,0.94)', transition: 'color 0.25s ease',
            textShadow: '0 1px 5px rgba(0,0,0,0.5)',
          }}>
            {agent.label}
          </div>
          <div style={{ fontFamily: FONT, fontSize: 12.5, fontWeight: 500, color: focused ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.55)', transition: 'color 0.25s ease', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
            {agent.value}
          </div>
        </div>
      </div>
    </div>
  );
}

function SpaceTile({ item, focused, pinned, animDelay, onClick }: {
  item: SpaceItem;
  focused: boolean;
  pinned?: boolean;
  animDelay: number;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative', height: SPACE_H, boxSizing: 'border-box',
        borderRadius: RADIUS.card, cursor: 'pointer',
        // settings stays visually quiet; the others get the standard glass
        background: item.variant === 'settings'
          ? (focused ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.014)')
          : focused
            ? 'linear-gradient(180deg, rgba(255,255,255,0.085) 0%, rgba(255,255,255,0.045) 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.02) 100%)',
        padding: '14px 16px 13px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        animation: `hh-item-in 0.36s ${animDelay.toFixed(2)}s both`,
        ...chrome(focused, item.variant === 'settings'
          ? 'inset 0 0 0 1px rgba(255,255,255,0.025)'
          : 'inset 0 1px 0 rgba(255,255,255,0.07), inset 0 0 0 1px rgba(255,255,255,0.04), 0 4px 14px rgba(0,0,0,0.22)'),
      }}
    >
      {pinned && <PinDot />}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Icon name={item.icon} tint={item.tint} size={22} />
        {/* gallery leads with imagery; wishlist with the saved item */}
        {item.thumbs && (
          <div style={{ display: 'flex', gap: 4 }}>
            {item.thumbs.map((src, i) => (
              <img key={i} src={src} alt="" style={{
                width: item.variant === 'wishlist' ? 34 : 26,
                height: item.variant === 'wishlist' ? 34 : 26,
                borderRadius: 8, objectFit: 'cover',
                filter: focused ? 'brightness(0.95)' : 'brightness(0.75)',
                transition: 'filter 0.25s ease',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.4)',
              }} />
            ))}
          </div>
        )}
      </div>

      {item.variant === 'weather' ? (
        /* weather is temperature-first */
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
          <span style={{ fontFamily: FONT, fontSize: 24, fontWeight: 800, color: focused ? '#fff' : 'rgba(255,255,255,0.95)', letterSpacing: '-0.02em', transition: 'color 0.25s ease' }}>
            {item.value}
          </span>
          <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.sub}
          </span>
        </div>
      ) : (
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontFamily: FONT, fontSize: 14, fontWeight: item.variant === 'settings' ? 600 : 800,
            color: item.variant === 'settings'
              ? (focused ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.55)')
              : (focused ? '#fff' : 'rgba(255,255,255,0.95)'),
            letterSpacing: '-0.01em', transition: 'color 0.25s ease',
          }}>
            {item.label}
          </div>
          <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 500, color: item.variant === 'settings' ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.48)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.sub}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Keyframes ────────────────────────────────────────────────────────────────

export const KEYFRAMES = `
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
@keyframes hh-live-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.4; transform: scale(0.7); }
}
@keyframes hh-status-pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.45; }
}
@keyframes hh-mascot-float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-5px); }
}
`;
