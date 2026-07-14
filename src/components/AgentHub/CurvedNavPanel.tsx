/**
 * CurvedNavPanel — Option 2: agent-widget rail.
 *
 * Floating overlay on top of L0 (opened with ←):
 *   · Search pill at the top
 *   · Agent widgets — every hub destination (agents + AI Gallery, Wishlist,
 *     Recent) shares one card system. Compact = 122px square (icon chip +
 *     agent name + one glanceable value). Focused = 400×244 widget where the
 *     agent identity is the hero and the rotating content sits under a fixed
 *     KICKER label. Photos only as inset thumbs.
 *   · Only Settings remains as a plain row at the bottom.
 *
 * Card identity (deliberately NOT the Apple-widget look): each card carries a
 * soft wash of its agent tint and a chat-bubble silhouette (one tight corner,
 * bottom-left) — the agents "speak". Focus = bright ring + outer tint glow,
 * with the mascot sitting inside the card footer next to its line.
 *
 * Scroll system: rAF tween on the same curve/duration as the card expansion
 * toward targets computed from known settled heights (never DOM measurement
 * mid-animation), plus top/bottom fade masks so cards dissolve at the edges.
 *
 * Navigation:
 *   ↑/↓     move focus (search → widgets → settings)
 *   ←/Esc   back to L0
 *   Enter   open focused item
 */

import { useState, useEffect, useRef } from 'react';
import AgentMascot from '../Shared/AgentMascot';

// ─── Types ──────────────────────────────────────────────────────────────────

type Pattern = 'photo' | 'shopping' | 'weather' | 'stat';

type AgentDef = {
  id: string;
  label: string;
  icon: string;
  tint: string;
  pattern: Pattern;
  image?: string;
  /** Image behind the compact square (defaults to `image`) — recognition without reading */
  compactImage?: string;
  /** Compact: ONE glanceable value (number / delta / count / time) */
  compactValue: string;
  /** Compact: what the value refers to */
  compactSub: string;
  /** Fresh-update dot on the compact square */
  fresh?: boolean;
  /** Persistent agent-level state under the agent name */
  statusLine: string;
  /** Fixed uppercase label framing the rotating item */
  kicker: string;
  /** The rotating/timely content title (secondary) */
  itemTitle: string;
  /** One factual proof point */
  detailLine: string;
  /** The one tinted line (number / urgency) */
  accentLine: string;
  mascotLine: string;
};

// ─── Agent widgets ───────────────────────────────────────────────────────────

const AGENTS: AgentDef[] = [
  {
    id: 'travel', label: 'Travel', icon: '🌄', tint: '#4DD0C4', pattern: 'photo',
    image: '/images/warm-start/coorg.jpg',
    compactValue: '4 hrs away', compactSub: 'Coorg',
    statusLine: '1 trip saved · 2 chats open',
    kicker: 'This weekend', itemTitle: 'Coorg',
    detailLine: 'Coffee estates · Monsoon season',
    accentLine: '₹3,500 – ₹5,500 / night',
    mascotLine: "Let's plan your weekend.",
  },
  {
    id: 'recipes', label: 'Recipes', icon: '🍝', tint: '#FFB86B', pattern: 'photo',
    image: '/images/feed/feed_42-food-japanese-ramen-counter.jpg',
    compactValue: '25 min', compactSub: 'Naan Pizza',
    statusLine: 'Meal plan in progress · 5 recipes',
    kicker: "Tonight's pick", itemTitle: 'Butter Garlic Naan Pizza',
    detailLine: 'Ingredients you likely have',
    accentLine: '25 min · 6 ingredients',
    mascotLine: 'I can help you cook tonight.',
  },
  {
    id: 'shopping', label: 'Shopping', icon: '🎧', tint: '#6BD98A', pattern: 'shopping',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=70',
    compactValue: '↓ ₹2,000', compactSub: 'Sony XM5', fresh: true,
    statusLine: 'Watching 12 items · 2 drops this week',
    kicker: 'Price drop', itemTitle: 'Sony WH-1000XM5',
    detailLine: 'In stock · Free delivery',
    accentLine: '↓ ₹2,000 · lowest this month',
    mascotLine: 'I found a better deal.',
  },
  {
    id: 'fashion', label: 'Fashion', icon: '👕', tint: '#F79BC3', pattern: 'photo',
    image: '/images/feed/feed_31-fashion-streetwear-editorial.jpg',
    compactValue: '3 looks', compactSub: 'Rain-ready',
    statusLine: "4 looks saved · styled for today's rain",
    kicker: 'Ready to wear', itemTitle: 'Weekend Layers',
    detailLine: 'Rain-ready · Smart casual',
    accentLine: 'Bengaluru monsoon this weekend',
    mascotLine: "I've put together some looks.",
  },
  {
    id: 'weather', label: 'Weather', icon: '🌧', tint: '#6FB9FF', pattern: 'weather',
    compactValue: '24°', compactSub: 'Rain at 5 PM', fresh: true,
    statusLine: 'Bengaluru · monsoon watch on',
    kicker: 'Right now', itemTitle: 'Bengaluru · Feels like 26°',
    detailLine: 'Light jacket recommended',
    accentLine: 'Rain in 2 hours',
    mascotLine: 'Carry an umbrella today.',
  },
  {
    id: 'wellness', label: 'Wellness', icon: '🧘', tint: '#7FD8A8', pattern: 'stat',
    compactImage: '/images/feed/feed_32-wellness-sunrise-yoga-lake.jpg',
    compactValue: '10 min', compactSub: 'Breathing',
    statusLine: 'Better Sleep · 4-day streak',
    kicker: 'Ready now', itemTitle: 'Breathing & mindfulness',
    detailLine: 'No equipment needed',
    accentLine: 'Good for monsoon evenings',
    mascotLine: "This one's great for winding down.",
  },
  {
    id: 'pets', label: 'Pets', icon: '🐶', tint: '#F5C878', pattern: 'photo',
    image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=400&q=70',
    compactValue: 'Mon 21', compactSub: 'Vaccination',
    statusLine: 'Bruno · vet visit in 3 days',
    kicker: 'Coming up', itemTitle: "Bruno's vaccination",
    detailLine: 'Golden Retriever · 3 yrs',
    accentLine: 'Due Mon 21',
    mascotLine: "Bruno's due for a check-in.",
  },
  {
    id: 'home-decor', label: 'Home', icon: '💡', tint: '#E8CE8A', pattern: 'photo',
    image: '/images/feed/feed_24-home-cozy-monsoon-living-room.jpg',
    compactValue: '5 lamps', compactSub: 'Warm Lighting',
    statusLine: '1 AI design · 9-item shopping list',
    kicker: 'New idea', itemTitle: 'Warm Lighting',
    detailLine: 'Layered glow · monsoon evenings',
    accentLine: '₹2,500 – ₹8,000 range',
    mascotLine: 'I found some great lighting ideas.',
  },
  {
    id: 'sports', label: 'Sports', icon: '🏏', tint: '#79C7FF', pattern: 'photo',
    image: '/images/warm-start/ind-vs-afg.png',
    compactValue: '7:30 PM', compactSub: 'RCB vs CSK', fresh: true,
    statusLine: 'Following RCB · 1 reminder set',
    kicker: 'Tonight 7:30 PM', itemTitle: 'RCB vs CSK',
    detailLine: 'M. Chinnaswamy Stadium',
    accentLine: 'Live in 3 hrs · reminder set',
    mascotLine: 'Big match tonight.',
  },
  {
    id: 'news', label: 'News', icon: '📰', tint: '#93AFC9', pattern: 'stat',
    compactImage: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=400&q=70',
    compactValue: '6 stories', compactSub: 'Morning Brief', fresh: true,
    statusLine: 'Following 3 topics · 1 new update',
    kicker: 'Morning brief', itemTitle: 'Bengaluru focus · India · Tech · Local',
    detailLine: 'Updated 2h ago',
    accentLine: 'Read in 90 seconds',
    mascotLine: "Here's what's happening today.",
  },
  {
    id: 'vtone', label: 'VTone', icon: '📸', tint: '#F484B8', pattern: 'stat',
    compactImage: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=400&q=70',
    compactValue: '3 new fits', compactSub: 'Try-on ready',
    statusLine: '12 styles saved',
    kicker: 'New for you', itemTitle: 'A New Look',
    detailLine: 'Upload a selfie · virtual try-on',
    accentLine: '12 saved styles · 3 new fits',
    mascotLine: "Let's create a new look.",
  },
  {
    id: 'ai-gallery', label: 'AI Gallery', icon: '✦', tint: '#B9A6F0', pattern: 'photo',
    image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=400&q=70',
    compactValue: '24 images', compactSub: '2h ago',
    statusLine: '3 collections · 1 draft open',
    kicker: 'Latest creation', itemTitle: 'Coorg Estate in the Mist',
    detailLine: 'Generated 2h ago',
    accentLine: '24 total creations',
    mascotLine: 'Your recent creations are here.',
  },
  {
    id: 'wishlist', label: 'Wishlist', icon: '♡', tint: '#FF97B5', pattern: 'stat',
    compactImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=70',
    compactValue: '12 saved', compactSub: '2 updates', fresh: true,
    statusLine: 'Saved across 5 topics',
    kicker: 'Price update', itemTitle: 'Sony WH-1000XM5',
    detailLine: 'Coorg stay · dates open',
    accentLine: '↓ ₹2,000 this week',
    mascotLine: 'Some saved items have updates.',
  },
  {
    id: 'recent', label: 'Recent', icon: '⟲', tint: '#8FB8DE', pattern: 'stat',
    compactImage: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=400&q=70',
    compactValue: '2 days ago', compactSub: 'Coffee Machines',
    statusLine: '4 threads this week',
    kicker: 'Continue', itemTitle: 'Coffee Machine Comparison',
    detailLine: '4 options compared',
    accentLine: 'Also: Coorg trip planning',
    mascotLine: 'Pick up where you left off.',
  },
];

// ─── Bottom rows (only Settings is a plain row) ──────────────────────────────

type MenuDef = { id: string; icon: string; label: string; sub: string };

const MENU: MenuDef[] = [
  { id: 'settings', icon: '⚙', label: 'Settings', sub: 'Bengaluru · 24°' },
];

// ─── Constants ───────────────────────────────────────────────────────────────

const FONT = '"Plus Jakarta Sans",system-ui,sans-serif';
const RAIL_W = 448;          // outer rail (incl. padding)
const CARD_W = 400;          // expanded widget width
const SQ = 122;              // compact square size
const GAP = 14;              // breathing room between widgets
const EXP_H = 244;           // ONE expanded height for all agents (2 × SQ)
const PAD_TOP = 34;          // scroller padding-top (air under the search pill)
const PAD_BOT = 30;          // scroller padding-bottom

// Silky size curve — shared by card size AND scroll tween
const SIZE_EASE = 'cubic-bezier(0.25, 0.8, 0.25, 1)';
const SIZE_MS = 560;

// Chat-bubble silhouette — one tight corner (bottom-left): the agents "speak".
const RADIUS_COMPACT = '22px 22px 22px 7px';
const RADIUS_FOCUSED = '26px 26px 26px 9px';

const RING_REST = 'inset 0 0 0 1px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 14px rgba(0,0,0,0.30)';
const ringFocus = (tint: string) =>
  `inset 0 0 0 1px rgba(255,255,255,0.42), inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 1.5px ${tint}73, 0 0 22px ${tint}59, 0 0 54px ${tint}47, 0 24px 64px rgba(0,0,0,0.55)`;
/** Focused card nudges toward screen center — embossed, coming forward */
const FOCUS_SHIFT = 16;
/** Horizontal breathing room inside the scroller so the glow isn't clipped */
const GLOW_PAD_L = 26;
const GLOW_PAD_R = 44;

// Card surface: graphite with a soft wash of the agent tint from the top-left
const surface = (tint: string) =>
  `linear-gradient(145deg, ${tint}1F 0%, rgba(24,24,31,0.94) 52%)`;

// cubic-bezier(0.32, 0.72, 0.28, 1) sampler for the scroll tween
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  const sampleDX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    let t = x;
    for (let i = 0; i < 5; i++) {
      const dx = sampleX(t) - x;
      const d = sampleDX(t);
      if (Math.abs(dx) < 1e-4 || d === 0) break;
      t -= dx / d;
    }
    return sampleY(t);
  };
}
const scrollEase = cubicBezier(0.25, 0.8, 0.25, 1);

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// ─── Component ───────────────────────────────────────────────────────────────

export type CurvedNavPanelProps = {
  onBack: () => void;
  onToast?: (msg: string) => void;
};

export default function CurvedNavPanel({ onBack, onToast }: CurvedNavPanelProps) {
  // navSlot: -1 = search · 0..A-1 = agent widgets · A..A+M-1 = bottom rows
  const A = AGENTS.length;
  const MAX = A + MENU.length - 1;
  const [navSlot, setNavSlot] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  // Deterministic scroll: target computed from settled heights, driven by a
  // rAF tween on the SAME curve/duration as the card expand — never measured
  // from the DOM mid-animation, so the focused card can't land under the pill.
  useEffect(() => {
    const c = scrollRef.current;
    if (!c) return;
    const vh = c.clientHeight;
    const contentFocused = PAD_TOP + PAD_BOT + (A - 1) * (SQ + GAP) + EXP_H;
    const contentCompact = PAD_TOP + PAD_BOT + A * SQ + (A - 1) * GAP;
    let target: number;
    if (navSlot >= 0 && navSlot < A) {
      const finalTop = PAD_TOP + navSlot * (SQ + GAP);
      target = clamp(finalTop - (vh - EXP_H) / 2, 0, Math.max(0, contentFocused - vh));
    } else if (navSlot === -1) {
      target = 0;
    } else {
      target = clamp(c.scrollTop, 0, Math.max(0, contentCompact - vh));
    }

    cancelAnimationFrame(rafRef.current);
    const from = c.scrollTop;
    if (Math.abs(target - from) < 1) return;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = clamp((now - t0) / SIZE_MS, 0, 1);
      c.scrollTop = from + (target - from) * scrollEase(p);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [navSlot, A]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const k = e.key;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter',' ','Escape','Backspace'].includes(k)) e.preventDefault();
      if (k === 'Escape' || k === 'Backspace' || k === 'ArrowLeft') { onBack(); return; }
      if (k === 'ArrowUp')   { setNavSlot(s => Math.max(-1, s - 1)); return; }
      if (k === 'ArrowDown') { setNavSlot(s => Math.min(MAX, s + 1)); return; }
      if (k === 'Enter' || k === ' ') {
        if (navSlot === -1) { onToast?.('Opening Search…'); return; }
        if (navSlot < A)    { onToast?.(`Opening ${AGENTS[navSlot].label}…`); return; }
        onToast?.(`Opening ${MENU[navSlot - A].label}…`);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navSlot, A, MAX, onBack, onToast]);

  const edgeMask = `linear-gradient(to bottom, transparent 0, black 26px, black calc(100% - 30px), transparent 100%)`;

  return (
    <div style={{
      position: 'absolute', inset: 0,
      overflow: 'hidden', pointerEvents: 'auto',
      animation: 'wrl-in 0.25s ease forwards',
    }}>
      {/* Gradient backdrop */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 700,
        background: 'linear-gradient(to right, rgba(4,4,10,0.96) 0%, rgba(4,4,10,0.84) 42%, rgba(4,4,10,0.34) 70%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* Rail */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: RAIL_W,
        display: 'flex', flexDirection: 'column',
        padding: '28px 24px 22px 24px',
        animation: 'wrl-slide-in 0.38s cubic-bezier(0.22,0.61,0.36,1) forwards',
      }}>
        {/* Logo */}
        <div style={{ flexShrink: 0, marginBottom: 16 }}>
          <img src="/glance-logo.png" alt="Glance" style={{ height: 24, opacity: 0.88 }} />
        </div>

        {/* Search pill */}
        <SearchPill focused={navSlot === -1} onClick={() => setNavSlot(-1)} />

        {/* Scrollable widget rail — edge fades instead of hard clipping */}
        <div
          ref={scrollRef}
          style={{
            flex: 1, overflowY: 'auto', overflowX: 'hidden',
            scrollbarWidth: 'none',
            display: 'flex', flexDirection: 'column', gap: GAP,
            margin: `0 -${GLOW_PAD_R}px 0 -${GLOW_PAD_L}px`,
            padding: `${PAD_TOP}px ${GLOW_PAD_R}px ${PAD_BOT}px ${GLOW_PAD_L}px`,
            maskImage: edgeMask,
            WebkitMaskImage: edgeMask,
          }}
        >
          <style>{`::-webkit-scrollbar{display:none}`}</style>
          {AGENTS.map((agent, i) => (
            <WidgetCard
              key={agent.id}
              agent={agent}
              focused={navSlot === i}
              animDelay={i * 0.022 + 0.06}
              onClick={() => setNavSlot(i)}
            />
          ))}
        </div>

        {/* Settings — the one plain row */}
        <div style={{ flexShrink: 0 }}>
          <div style={{
            height: 1, margin: '0 4px 10px',
            background: 'linear-gradient(to right, rgba(255,255,255,0.1), rgba(255,255,255,0.03), transparent)',
          }} />
          {MENU.map((m, i) => (
            <MenuRow
              key={m.id}
              item={m}
              focused={navSlot === A + i}
              onClick={() => setNavSlot(A + i)}
            />
          ))}
        </div>

        {/* Nav hints */}
        <div style={{ flexShrink: 0, display: 'flex', gap: 12, paddingTop: 12 }}>
          {[['↑↓','Navigate'],['Enter','Open'],['←','Back']].map(([k,l]) => (
            <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: FONT, fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
              <kbd style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.28)', fontFamily: FONT }}>{k}</kbd>
              {l}
            </span>
          ))}
        </div>
      </div>

      {/* Position dots — where you are, and how far Settings is */}
      <div style={{
        position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        zIndex: 2, pointerEvents: 'none',
        animation: 'wrl-in 0.4s 0.2s both',
      }}>
        {AGENTS.map((a, i) => (
          <span key={a.id} style={{
            width: 4, height: navSlot === i ? 18 : 4, borderRadius: 99,
            background: navSlot === i ? a.tint : 'rgba(255,255,255,0.22)',
            boxShadow: navSlot === i ? `0 0 10px ${a.tint}99` : 'none',
            transition: `height 0.4s ${SIZE_EASE}, background 0.35s ease, box-shadow 0.35s ease`,
          }} />
        ))}
        {/* settings marker */}
        <span style={{
          fontSize: 8, lineHeight: 1, marginTop: 4,
          color: navSlot >= A ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
          transition: 'color 0.35s ease',
        }}>⚙</span>
      </div>

      <style>{KEYFRAMES}</style>
    </div>
  );
}

// ─── SearchPill ───────────────────────────────────────────────────────────────

function SearchPill({ focused, onClick }: { focused: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        flexShrink: 0, alignSelf: 'flex-start', boxSizing: 'border-box',
        width: focused ? CARD_W : 148,
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '11px 18px', borderRadius: 999,
        cursor: 'pointer', overflow: 'hidden', whiteSpace: 'nowrap',
        background: focused ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.055)',
        border: `1px solid ${focused ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.09)'}`,
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        boxShadow: focused ? '0 0 34px rgba(167,134,229,0.25), 0 10px 34px rgba(0,0,0,0.4)' : 'none',
        transition: `width ${SIZE_MS}ms ${SIZE_EASE}, background 0.25s ease, border-color 0.25s ease, box-shadow 0.3s ease`,
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.55, flexShrink: 0 }}>
        <circle cx="11" cy="11" r="7" stroke="white" strokeWidth="2"/>
        <path d="M16.5 16.5L21 21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 500, color: focused ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.42)', transition: 'color 0.25s ease' }}>
        {focused ? 'Search or ask anything' : 'Search'}
      </span>
    </div>
  );
}

// ─── WidgetCard — square ↔ expanded on one shared surface ───────────────────

function WidgetCard({ agent, focused, animDelay, onClick }: {
  agent: AgentDef;
  focused: boolean;
  animDelay: number;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        flexShrink: 0, position: 'relative', overflow: 'hidden', cursor: 'pointer',
        width: focused ? CARD_W : SQ,
        height: focused ? EXP_H : SQ,
        borderRadius: focused ? RADIUS_FOCUSED : RADIUS_COMPACT,
        background: surface(agent.tint),
        backdropFilter: 'blur(40px) saturate(140%)', WebkitBackdropFilter: 'blur(40px) saturate(140%)',
        boxShadow: focused ? ringFocus(agent.tint) : RING_REST,
        transform: focused ? `translateX(${FOCUS_SHIFT}px)` : 'translateX(0)',
        willChange: 'width, height, transform',
        transition: `width ${SIZE_MS}ms ${SIZE_EASE}, height ${SIZE_MS}ms ${SIZE_EASE}, border-radius ${SIZE_MS}ms ${SIZE_EASE}, transform ${SIZE_MS}ms ${SIZE_EASE}, box-shadow 0.45s ease`,
        animation: `wrl-item-in 0.38s ${animDelay.toFixed(2)}s both`,
      }}
    >
      {/* Compact face — fixed square metrics so it never reflows */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: SQ, height: SQ,
        padding: '12px 13px', boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        opacity: focused ? 0 : 1,
        transition: `opacity 0.26s ${focused ? '0s' : '0.22s'} ease`,
        pointerEvents: 'none',
      }}>
        {/* Image background — recognise the agent without reading */}
        {(agent.compactImage || agent.image) && (
          <>
            <img src={agent.compactImage ?? agent.image} alt="" style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', filter: 'brightness(0.62) saturate(0.95)',
            }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(12,12,18,0.92) 0%, rgba(12,12,18,0.42) 52%, rgba(12,12,18,0.18) 100%)',
            }} />
          </>
        )}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <IconChip agent={agent} size={32} onImage={!!(agent.compactImage || agent.image)} />
          {agent.fresh && (
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: agent.tint, marginTop: 2, boxShadow: `0 0 8px ${agent.tint}` }} />
          )}
        </div>
        <div style={{ position: 'relative', minWidth: 0 }}>
          <div style={{ fontFamily: FONT, fontSize: 9, fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
            {agent.label}
          </div>
          <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 800, color: agent.tint, letterSpacing: '-0.01em', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 1px 5px rgba(0,0,0,0.55)' }}>
            {agent.compactValue}
          </div>
          <div style={{ fontFamily: FONT, fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.62)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
            {agent.compactSub}
          </div>
        </div>
      </div>

      {/* Expanded face — fixed expanded metrics, cross-fades in */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: CARD_W, height: EXP_H,
        boxSizing: 'border-box',
        opacity: focused ? 1 : 0,
        transition: `opacity 0.36s ${focused ? '0.18s' : '0s'} ease`,
        pointerEvents: 'none',
      }}>
        <ExpandedFace agent={agent} active={focused} />
      </div>
    </div>
  );
}

// ─── Expanded face — one template, agent identity first ─────────────────────

function IconChip({ agent, size, onImage }: { agent: AgentDef; size: number; onImage?: boolean }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.32), flexShrink: 0,
      background: onImage ? 'rgba(12,12,18,0.55)' : `${agent.tint}26`,
      backdropFilter: onImage ? 'blur(10px)' : undefined,
      WebkitBackdropFilter: onImage ? 'blur(10px)' : undefined,
      boxShadow: onImage ? `inset 0 0 0 1px ${agent.tint}40` : 'none',
      display: 'grid', placeItems: 'center', fontSize: Math.round(size * 0.55),
    }}>
      {agent.icon}
    </div>
  );
}

function Kicker({ agent }: { agent: AgentDef }) {
  return (
    <div style={{ fontFamily: FONT, fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: agent.tint }}>
      {agent.kicker}
    </div>
  );
}

function Thumb({ src }: { src: string }) {
  return (
    <div style={{
      width: 112, height: 112, borderRadius: 18, overflow: 'hidden', flexShrink: 0,
      position: 'relative',
    }}>
      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      <div style={{ position: 'absolute', inset: 0, borderRadius: 18, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.10)' }} />
    </div>
  );
}

function ExpandedFace({ agent, active }: { agent: AgentDef; active: boolean }) {
  return (
    <div style={{ width: '100%', height: '100%', padding: 20, boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      {/* Zone A — agent identity only; light and instant */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, flexShrink: 0 }}>
        <IconChip agent={agent} size={34} />
        <div style={{ fontFamily: FONT, fontSize: 19, fontWeight: 800, color: 'rgba(255,255,255,0.96)', letterSpacing: '-0.02em', lineHeight: 1.1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {agent.label}
        </div>
      </div>

      {/* Zone B — the rotating item, framed by the kicker */}
      <div style={{ flex: 1, marginTop: 13, minHeight: 0 }}>
        <ZoneB agent={agent} />
      </div>

      {/* Zone C — the agent speaks: mascot inside the card + its line */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0, marginTop: 10, minWidth: 0 }}>
        <div style={{ flexShrink: 0, width: 32, height: 32, display: 'grid', placeItems: 'center' }}>
          {active && <AgentMascot agentMode="looking" size={32} />}
        </div>
        <span style={{ fontFamily: FONT, fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,0.62)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {agent.mascotLine}
        </span>
      </div>
    </div>
  );
}

function ZoneB({ agent }: { agent: AgentDef }) {
  // photo — three light lines + inset thumbnail
  if (agent.pattern === 'photo') {
    return (
      <div style={{ display: 'flex', gap: 16, height: '100%' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Kicker agent={agent} />
          <div style={{ fontFamily: FONT, fontSize: 18, fontWeight: 800, color: 'rgba(255,255,255,0.96)', letterSpacing: '-0.015em', lineHeight: 1.2, marginTop: 8 }}>
            {agent.itemTitle}
          </div>
          <div style={{ fontFamily: FONT, fontSize: 12.5, fontWeight: 700, color: agent.tint, marginTop: 8 }}>
            {agent.accentLine}
          </div>
        </div>
        {agent.image && <Thumb src={agent.image} />}
      </div>
    );
  }

  // shopping — price + solid-tint drop pill + thumbnail
  if (agent.pattern === 'shopping') {
    return (
      <div style={{ display: 'flex', gap: 16, height: '100%' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Kicker agent={agent} />
          <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.92)', marginTop: 8 }}>
            {agent.itemTitle}
          </div>
          <div style={{ fontFamily: FONT, fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginTop: 4 }}>
            ₹24,990
          </div>
          <span style={{
            display: 'inline-block', fontFamily: FONT, fontSize: 10.5, fontWeight: 800,
            color: '#0C1510', background: agent.tint, borderRadius: 999, padding: '3px 10px', marginTop: 8,
          }}>
            {agent.accentLine}
          </span>
        </div>
        {agent.image && <Thumb src={agent.image} />}
      </div>
    );
  }

  // weather — big temp + hourly bar meter
  if (agent.pattern === 'weather') {
    const bars = [16, 22, 30, 40, 46, 42, 34, 27, 21, 16, 12, 11, 14, 18];
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ fontFamily: FONT, fontSize: 44, fontWeight: 900, color: '#fff', letterSpacing: '-0.045em', lineHeight: 1 }}>
            {agent.compactValue}
          </div>
          <div style={{ minWidth: 0, paddingTop: 2 }}>
            <Kicker agent={agent} />
            <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.92)', marginTop: 4 }}>
              {agent.itemTitle}
            </div>
            <div style={{ fontFamily: FONT, fontSize: 11.5, fontWeight: 700, color: agent.tint, marginTop: 3 }}>
              {agent.accentLine}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 40 }}>
            {bars.map((h, i) => (
              <div key={i} style={{
                flex: 1, height: h * 0.85, borderRadius: 99,
                background: `hsl(${262 - i * 17}, 82%, 62%)`,
                opacity: 0.92,
              }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            {['Now', '3 PM', '6 PM', '9 PM'].map(t => (
              <span key={t} style={{ fontFamily: FONT, fontSize: 9.5, fontWeight: 600, color: 'rgba(255,255,255,0.35)' }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // stat — big value + one line, with an image thumb (wellness, news, vtone, wishlist, recent)
  const statThumb = agent.image ?? agent.compactImage;
  return (
    <div style={{ display: 'flex', gap: 16, height: '100%' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Kicker agent={agent} />
        <div style={{ fontFamily: FONT, fontSize: 30, fontWeight: 900, color: '#fff', letterSpacing: '-0.035em', lineHeight: 1, marginTop: 8 }}>
          {agent.compactValue}
        </div>
        <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginTop: 6 }}>
          {agent.itemTitle}
        </div>
        <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: agent.tint, marginTop: 8 }}>
          {agent.accentLine}
        </div>
      </div>
      {statThumb && <Thumb src={statThumb} />}
    </div>
  );
}

// ─── MenuRow — plain row at the bottom of the rail (Settings) ────────────────

function MenuRow({ item, focused, onClick }: { item: MenuDef; focused: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 11,
        padding: '8px 13px', borderRadius: 12, cursor: 'pointer',
        background: focused ? 'rgba(255,255,255,0.12)' : 'transparent',
        border: `1px solid ${focused ? 'rgba(255,255,255,0.16)' : 'transparent'}`,
        transition: 'background 0.18s ease, border-color 0.18s ease',
      }}
    >
      <span style={{ width: 18, textAlign: 'center', fontSize: 14, color: focused ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)', transition: 'color 0.18s ease' }}>
        {item.icon}
      </span>
      <span style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 600, color: focused ? '#fff' : 'rgba(255,255,255,0.6)', flex: 1, transition: 'color 0.18s ease' }}>
        {item.label}
      </span>
      <span style={{ fontFamily: FONT, fontSize: 10.5, fontWeight: 500, color: focused ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)', transition: 'color 0.18s ease' }}>
        {item.sub}
      </span>
      <span style={{ fontFamily: FONT, fontSize: 12, color: focused ? 'rgba(255,255,255,0.55)' : 'transparent', transition: 'color 0.18s ease' }}>
        ›
      </span>
    </div>
  );
}

// ─── Keyframes ────────────────────────────────────────────────────────────────

const KEYFRAMES = `
@keyframes wrl-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes wrl-slide-in {
  from { transform: translateX(-32px); opacity: 0; }
  to   { transform: translateX(0);     opacity: 1; }
}
@keyframes wrl-item-in {
  from { opacity: 0; transform: translateX(-16px); }
  to   { opacity: 1; transform: translateX(0); }
}
`;
