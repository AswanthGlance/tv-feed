/**
 * FloatingWidgetsPanel — an earlier Hybrid Hub exploration (unused; superseded by HybridHubPanel, now Option 4): living AI widgets floating over frozen L0.
 *
 * Same interaction model as Option 2 (one vertical rail, search on top,
 * settings at the bottom, ↑/↓/Enter/←) — but visually it is NOT a sidebar:
 *   · Every item is a live widget with its own identity, size and imagery.
 *     Imagery first, titles second, metadata third.
 *   · Three sizes: small (data), medium (image-forward), large (the focused
 *     widget only). Varied heights/widths + slight indents = organic rhythm.
 *   · No hard borders — frosted glass, soft shadows, elevation. Only the
 *     focused widget carries a glow, grows, and slides slightly INTO L0.
 *   · The mascot lives inside the focused widget with one short line.
 *   · Backdrop: only a soft left gradient; L0 stays clearly visible.
 */

import { useState, useEffect, useRef } from 'react';
import AgentMascot from '../Shared/AgentMascot';

// ─── Types ──────────────────────────────────────────────────────────────────

type Kind = 'hero' | 'split' | 'data' | 'collage' | 'duo';

type WidgetDef = {
  id: string;
  label: string;
  icon: string;
  tint: string;
  kind: Kind;
  /** compact geometry — varied per widget for rhythm */
  w: number;
  h: number;
  indent: number;
  /** expanded height (width is always EXP_W) */
  xH: number;
  images: string[];
  /** compact: title + one value line */
  cTitle: string;
  cSub: string;
  /** entertainment-style playback progress 0..1 */
  progress?: number;
  /** expanded content */
  kicker: string;
  xTitle: string;
  xMeta: string;
  accent: string;
  mascotLine: string;
};

// ─── Widgets ─────────────────────────────────────────────────────────────────

const U = (id: string, w = 640) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

const WIDGETS: WidgetDef[] = [
  {
    id: 'travel', label: 'Travel', icon: '🌄', tint: '#4DD0C4', kind: 'hero',
    w: 380, h: 148, indent: 0, xH: 296,
    images: ['/images/warm-start/coorg.jpg'],
    cTitle: 'Coorg', cSub: '4 hrs away',
    kicker: 'Weekend escape', xTitle: 'Coorg',
    xMeta: 'Coffee estates · Monsoon season · 4 hrs away',
    accent: '₹3,500 – ₹5,500 / night',
    mascotLine: "Let's plan your weekend.",
  },
  {
    id: 'recipes', label: 'Recipes', icon: '🍝', tint: '#FFB86B', kind: 'hero',
    w: 364, h: 140, indent: 8, xH: 290,
    images: ['/images/feed/feed_04-food-dinner-party-table.jpg'],
    cTitle: 'Naan Pizza', cSub: '25 min',
    kicker: "Tonight's recommendation", xTitle: 'Butter Garlic Naan Pizza',
    xMeta: '25 min · 6 ingredients you likely have',
    accent: 'Ready before the match starts',
    mascotLine: 'I can help you cook tonight.',
  },
  {
    id: 'shopping', label: 'Shopping', icon: '🎧', tint: '#6BD98A', kind: 'split',
    w: 348, h: 100, indent: 0, xH: 256,
    images: [U('photo-1505740420928-5e560c06d30e', 480)],
    cTitle: '₹2,000 OFF', cSub: 'Sony XM5',
    kicker: 'Price drop', xTitle: 'Sony WH-1000XM5',
    xMeta: '₹24,990 · lowest this month',
    accent: 'In stock · Free delivery',
    mascotLine: 'I found a better deal.',
  },
  {
    id: 'entertainment', label: 'Watch', icon: '▶', tint: '#C79BFF', kind: 'hero',
    w: 376, h: 148, indent: 4, xH: 294,
    images: ['/images/feed/feed_60-entertainment-vinyl-music-room.jpg'],
    cTitle: 'The Bear', cSub: 'S5 · E4 · 18 min left',
    progress: 0.64,
    kicker: 'Continue watching', xTitle: 'The Bear · Season 5',
    xMeta: 'Episode 4 · 18 minutes remaining',
    accent: 'Picks up right where you paused',
    mascotLine: 'Ready when you are.',
  },
  {
    id: 'fashion', label: 'Fashion', icon: '👕', tint: '#F79BC3', kind: 'hero',
    w: 356, h: 136, indent: 12, xH: 286,
    images: ['/images/feed/feed_31-fashion-streetwear-editorial.jpg'],
    cTitle: 'Weekend Layers', cSub: '3 new looks',
    kicker: 'Styled for the rain', xTitle: 'Weekend Layers',
    xMeta: '3 complete looks · smart casual',
    accent: 'Matched to Bengaluru monsoon',
    mascotLine: "I've put together some looks.",
  },
  {
    id: 'weather', label: 'Weather', icon: '🌧', tint: '#6FB9FF', kind: 'data',
    w: 336, h: 110, indent: 0, xH: 264,
    images: [],
    cTitle: '24°', cSub: 'Rain in 2 hrs',
    kicker: 'Right now · Bengaluru', xTitle: '24° · Feels like 26°',
    xMeta: 'Light jacket recommended',
    accent: 'Rain expected around 5 PM',
    mascotLine: 'Carry an umbrella today.',
  },
  {
    id: 'wellness', label: 'Wellness', icon: '🧘', tint: '#7FD8A8', kind: 'hero',
    w: 360, h: 132, indent: 8, xH: 284,
    images: ['/images/feed/feed_32-wellness-sunrise-yoga-lake.jpg'],
    cTitle: '10-min Breathing', cSub: 'Ready now',
    kicker: 'For this evening', xTitle: '10-minute Breathing',
    xMeta: 'Mindfulness · no equipment needed',
    accent: '4-day sleep streak going',
    mascotLine: "Great for winding down.",
  },
  {
    id: 'pets', label: 'Pets', icon: '🐶', tint: '#F5C878', kind: 'split',
    w: 340, h: 96, indent: 10, xH: 252,
    images: [U('photo-1583337130417-3346a1be7dee', 480)],
    cTitle: 'Bruno', cSub: 'Vaccination Mon 21',
    kicker: 'Coming up', xTitle: "Bruno's vaccination",
    xMeta: 'Golden Retriever · 3 yrs · due Mon 21',
    accent: 'Vet visit in 3 days',
    mascotLine: "Bruno's due for a check-in.",
  },
  {
    id: 'home-decor', label: 'Home', icon: '💡', tint: '#E8CE8A', kind: 'hero',
    w: 368, h: 136, indent: 4, xH: 286,
    images: ['/images/feed/feed_24-home-cozy-monsoon-living-room.jpg'],
    cTitle: 'Warm Lighting', cSub: '5 lamps matched',
    kicker: 'New idea', xTitle: 'Warm Layered Lighting',
    xMeta: '5 matching lamps · ₹2,500 – ₹8,000',
    accent: 'Perfect for monsoon evenings',
    mascotLine: 'I found some lighting ideas.',
  },
  {
    id: 'sports', label: 'Sports', icon: '🏏', tint: '#79C7FF', kind: 'hero',
    w: 380, h: 148, indent: 0, xH: 294,
    images: ['/images/warm-start/ind-vs-afg.png'],
    cTitle: 'RCB vs CSK', cSub: 'Tonight · 7:30 PM',
    kicker: 'Tonight 7:30 PM', xTitle: 'RCB vs CSK',
    xMeta: 'M. Chinnaswamy Stadium · T20',
    accent: 'Reminder set · live in 3 hrs',
    mascotLine: 'Big match tonight.',
  },
  {
    id: 'news', label: 'News', icon: '📰', tint: '#93AFC9', kind: 'split',
    w: 332, h: 92, indent: 8, xH: 248,
    images: [U('photo-1504711434969-e33886168f5c', 480)],
    cTitle: '6 stories', cSub: 'Morning Brief',
    kicker: 'Morning brief', xTitle: 'Bengaluru · India · Tech',
    xMeta: 'Updated 2h ago',
    accent: 'Read in 90 seconds',
    mascotLine: "Here's what's happening.",
  },
  {
    id: 'vtone', label: 'VTone', icon: '📸', tint: '#F484B8', kind: 'duo',
    w: 358, h: 134, indent: 6, xH: 286,
    images: [U('photo-1531123897727-8f129e1688ce', 480), U('photo-1490481651871-ab68de25d43d', 480)],
    cTitle: 'New look preview', cSub: '3 new fits',
    kicker: 'New for you', xTitle: 'Your Look, Restyled',
    xMeta: 'Selfie try-on · 12 saved styles',
    accent: '3 new fits generated',
    mascotLine: "Let's create a new look.",
  },
  {
    id: 'ai-gallery', label: 'AI Gallery', icon: '✦', tint: '#B9A6F0', kind: 'collage',
    w: 366, h: 134, indent: 4, xH: 286,
    images: [
      U('photo-1541701494587-cb58502866ab', 480),
      '/images/feed/feed_28-home-japandi-minimal-living.jpg',
      '/images/feed/feed_40-travel-wildlife-dawn-grassland.jpg',
      '/images/warm-start/coorg.jpg',
    ],
    cTitle: '24 creations', cSub: 'Latest 2h ago',
    kicker: 'Latest creation', xTitle: 'Coorg Estate in the Mist',
    xMeta: '24 creations · 3 collections',
    accent: '1 draft still open',
    mascotLine: 'Your creations are here.',
  },
  {
    id: 'wishlist', label: 'Wishlist', icon: '♡', tint: '#FF97B5', kind: 'split',
    w: 344, h: 96, indent: 8, xH: 250,
    images: [U('photo-1505740420928-5e560c06d30e', 480)],
    cTitle: '12 saved', cSub: '2 price updates',
    kicker: 'Price update', xTitle: 'Sony XM5 · Coorg stay',
    xMeta: '12 items across 5 topics',
    accent: '↓ ₹2,000 this week',
    mascotLine: 'Some saved items have updates.',
  },
  {
    id: 'recent', label: 'Recent', icon: '⟲', tint: '#8FB8DE', kind: 'split',
    w: 328, h: 88, indent: 4, xH: 246,
    images: [U('photo-1517668808822-9ebb02f2a0e6', 480)],
    cTitle: 'Coffee Machines', cSub: '2 days ago',
    kicker: 'Continue', xTitle: 'Coffee Machine Comparison',
    xMeta: '4 options compared · 2 days ago',
    accent: 'Also open: Coorg trip planning',
    mascotLine: 'Pick up where you left off.',
  },
];

// ─── Constants ───────────────────────────────────────────────────────────────

const FONT = '"Plus Jakarta Sans",system-ui,sans-serif';
const EXP_W = 420;           // focused widget width
const RAIL_W = 480;          // panel width (scroller must fit EXP_W + left pad)
const GAP = 10;              // gap between widgets
const PAD_TOP = 20;          // space above first widget in scroll area
const PAD_BOT = 24;

const SIZE_EASE = 'cubic-bezier(0.34, 1.18, 0.4, 1)';  // premium spring, slight overshoot
const SIZE_MS = 520;

const GLASS = 'rgba(26,26,36,0.55)';

// cubic-bezier sampler for the scroll tween (no overshoot — scroll stays monotonic)
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
const scrollEase = cubicBezier(0.32, 0.72, 0.28, 1);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// ─── Component ───────────────────────────────────────────────────────────────

export type FloatingWidgetsPanelProps = {
  onBack: () => void;
  onToast?: (msg: string) => void;
};

export default function FloatingWidgetsPanel({ onBack, onToast }: FloatingWidgetsPanelProps) {
  // navSlot: -1 = search · 0..N-1 = widgets · N = settings
  const N = WIDGETS.length;
  const MAX = N; // settings row
  const [navSlot, setNavSlot] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  // Deterministic scroll from known settled heights (variable per widget)
  useEffect(() => {
    const c = scrollRef.current;
    if (!c) return;
    const vh = c.clientHeight;
    const sumCompact = WIDGETS.reduce((s, w) => s + w.h, 0) + (N - 1) * GAP;
    let target: number;
    if (navSlot >= 0 && navSlot < N) {
      let before = 0;
      for (let j = 0; j < navSlot; j++) before += WIDGETS[j].h + GAP;
      const xH = WIDGETS[navSlot].xH;
      const contentFocused = PAD_TOP + PAD_BOT + sumCompact - WIDGETS[navSlot].h + xH;
      target = clamp(PAD_TOP + before - (vh - xH) / 2, 0, Math.max(0, contentFocused - vh));
    } else if (navSlot === -1) {
      target = 0;
    } else {
      target = clamp(c.scrollTop, 0, Math.max(0, PAD_TOP + PAD_BOT + sumCompact - vh));
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
  }, [navSlot, N]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const k = e.key;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter',' ','Escape','Backspace'].includes(k)) e.preventDefault();
      if (k === 'Escape' || k === 'Backspace' || k === 'ArrowLeft') { onBack(); return; }
      if (k === 'ArrowUp')   { setNavSlot(s => Math.max(-1, s - 1)); return; }
      if (k === 'ArrowDown') { setNavSlot(s => Math.min(MAX, s + 1)); return; }
      if (k === 'Enter' || k === ' ') {
        if (navSlot === -1) { onToast?.('Opening Search…'); return; }
        if (navSlot < N)    { onToast?.(`Opening ${WIDGETS[navSlot].label}…`); return; }
        onToast?.('Opening Settings…');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navSlot, N, MAX, onBack, onToast]);

  const edgeMask = `linear-gradient(to bottom, transparent 0, black 26px, black calc(100% - 30px), transparent 100%)`;

  return (
    <div style={{
      position: 'absolute', inset: 0,
      overflow: 'hidden', pointerEvents: 'auto',
      animation: 'fw-in 0.28s ease forwards',
    }}>
      {/* Soft left gradient only — L0 stays visible */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 680,
        background: 'linear-gradient(to right, rgba(5,5,12,0.78) 0%, rgba(5,5,12,0.42) 42%, transparent 72%)',
        pointerEvents: 'none',
      }} />

      {/* Rail */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: RAIL_W,
        display: 'flex', flexDirection: 'column',
        padding: '22px 0 16px 24px',
        animation: 'fw-slide-in 0.4s cubic-bezier(0.22,0.61,0.36,1) forwards',
      }}>
        {/* Logo */}
        <div style={{ flexShrink: 0, marginBottom: 14 }}>
          <img src="/glance-logo.png" alt="Glance" style={{ height: 22, opacity: 0.88 }} />
        </div>

        {/* Search — floating pill, visually lighter than the widgets */}
        <SearchPill focused={navSlot === -1} onClick={() => setNavSlot(-1)} />

        {/* Widget rail */}
        <div
          ref={scrollRef}
          style={{
            flex: 1, overflowY: 'auto', overflowX: 'hidden',
            scrollbarWidth: 'none',
            display: 'flex', flexDirection: 'column', gap: GAP,
            padding: `${PAD_TOP}px 0 ${PAD_BOT}px 0`,
            maskImage: edgeMask,
            WebkitMaskImage: edgeMask,
          }}
        >
          <style>{`::-webkit-scrollbar{display:none}`}</style>
          {WIDGETS.map((wd, i) => (
            <Widget
              key={wd.id}
              def={wd}
              focused={navSlot === i}
              neighbor={navSlot === i - 1 || navSlot === i + 1}
              animDelay={i * 0.024 + 0.08}
              onClick={() => setNavSlot(i)}
            />
          ))}
        </div>

        {/* Settings — light row, not a widget */}
        <div style={{ flexShrink: 0, width: 380 }}>
          <SettingsRow focused={navSlot === N} onClick={() => setNavSlot(N)} />
          <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
            {[['↑↓','Navigate'],['Enter','Open'],['←','Back']].map(([k,l]) => (
              <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: FONT, fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
                <kbd style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.28)', fontFamily: FONT }}>{k}</kbd>
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style>{KEYFRAMES}</style>
    </div>
  );
}

// ─── Search pill ──────────────────────────────────────────────────────────────

function SearchPill({ focused, onClick }: { focused: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        flexShrink: 0, width: 380, boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '11px 18px', borderRadius: 999,
        cursor: 'pointer',
        background: focused ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.045)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        boxShadow: focused
          ? '0 0 0 1px rgba(255,255,255,0.30), 0 0 30px rgba(167,134,229,0.22), 0 10px 30px rgba(0,0,0,0.35)'
          : '0 0 0 1px rgba(255,255,255,0.06)',
        transition: 'all 0.22s ease',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.5, flexShrink: 0 }}>
        <circle cx="11" cy="11" r="7" stroke="white" strokeWidth="2"/>
        <path d="M16.5 16.5L21 21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      <span style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 500, color: focused ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.34)', transition: 'color 0.2s ease' }}>
        Search or ask anything
      </span>
    </div>
  );
}

// ─── Widget ───────────────────────────────────────────────────────────────────

function Widget({ def, focused, neighbor, animDelay, onClick }: {
  def: WidgetDef;
  focused: boolean;
  neighbor: boolean;
  animDelay: number;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        flexShrink: 0, position: 'relative', overflow: 'hidden', cursor: 'pointer',
        width: focused ? EXP_W : def.w,
        height: focused ? def.xH : def.h,
        marginLeft: focused ? 0 : def.indent,
        borderRadius: 24,
        background: GLASS,
        backdropFilter: 'blur(34px) saturate(150%)', WebkitBackdropFilter: 'blur(34px) saturate(150%)',
        boxShadow: focused
          ? `0 0 0 1px rgba(255,255,255,0.32), 0 0 46px ${def.tint}47, 0 30px 70px rgba(0,0,0,0.55)`
          : '0 10px 30px rgba(0,0,0,0.35)',
        transform: focused ? 'translateX(4px)' : neighbor ? 'translateX(7px)' : 'translateX(0)',
        transition: `width ${SIZE_MS}ms ${SIZE_EASE}, height ${SIZE_MS}ms ${SIZE_EASE}, margin-left ${SIZE_MS}ms ${SIZE_EASE}, transform ${SIZE_MS}ms ${SIZE_EASE}, box-shadow 0.35s ease`,
        animation: `fw-item-in 0.4s ${animDelay.toFixed(2)}s both`,
        opacity: 1,
      }}
    >
      {/* Compact face */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: def.w, height: def.h,
        opacity: focused ? 0 : 1,
        transition: `opacity 0.22s ${focused ? '0s' : '0.2s'} ease`,
        pointerEvents: 'none',
      }}>
        <CompactFace def={def} />
      </div>

      {/* Expanded face */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: EXP_W, height: def.xH,
        opacity: focused ? 1 : 0,
        transition: `opacity 0.32s ${focused ? '0.16s' : '0s'} ease`,
        pointerEvents: 'none',
      }}>
        <ExpandedFace def={def} active={focused} />
      </div>
    </div>
  );
}

// ─── Compact faces — imagery first ───────────────────────────────────────────

function LabelPill({ def }: { def: WidgetDef }) {
  return (
    <div style={{
      position: 'absolute', top: 10, left: 12,
      display: 'flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 999,
      background: 'rgba(8,8,14,0.45)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    }}>
      <span style={{ fontSize: 10 }}>{def.icon}</span>
      <span style={{ fontFamily: FONT, fontSize: 8.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)' }}>
        {def.label}
      </span>
    </div>
  );
}

function CompactFace({ def }: { def: WidgetDef }) {
  // hero — full-bleed image, text overlaid at the bottom
  if (def.kind === 'hero') {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <img src={def.images[0]} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(6,6,12,0.82) 0%, rgba(6,6,12,0.12) 52%, transparent 100%)' }} />
        <LabelPill def={def} />
        <div style={{ position: 'absolute', left: 14, right: 14, bottom: def.progress !== undefined ? 16 : 11 }}>
          <div style={{ fontFamily: FONT, fontSize: 16.5, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', textShadow: '0 1px 8px rgba(0,0,0,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {def.cTitle}
          </div>
          <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: def.tint, marginTop: 2, textShadow: '0 1px 5px rgba(0,0,0,0.6)' }}>
            {def.cSub}
          </div>
        </div>
        {def.progress !== undefined && (
          <div style={{ position: 'absolute', left: 14, right: 14, bottom: 9, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.22)' }}>
            <div style={{ width: `${def.progress * 100}%`, height: '100%', borderRadius: 99, background: def.tint }} />
          </div>
        )}
      </div>
    );
  }

  // split — value left, image bleeding in from the right
  if (def.kind === 'split') {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '46%' }}>
          <img src={def.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to right, ${'rgba(26,26,36,1)'} 0%, rgba(26,26,36,0.1) 60%, transparent 100%)` }} />
        </div>
        <div style={{ position: 'absolute', left: 16, top: 0, bottom: 0, width: '54%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontFamily: FONT, fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
            {def.icon} {def.label}
          </div>
          <div style={{ fontFamily: FONT, fontSize: 17, fontWeight: 800, color: def.tint, letterSpacing: '-0.015em', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {def.cTitle}
          </div>
          <div style={{ fontFamily: FONT, fontSize: 10.5, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {def.cSub}
          </div>
        </div>
      </div>
    );
  }

  // data — weather: temp + living icon
  if (def.kind === 'data') {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', padding: '0 18px', boxSizing: 'border-box' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: FONT, fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
            {def.label}
          </div>
          <div style={{ fontFamily: FONT, fontSize: 34, fontWeight: 900, color: '#fff', letterSpacing: '-0.045em', lineHeight: 1, marginTop: 4 }}>
            {def.cTitle}
          </div>
          <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: def.tint, marginTop: 4 }}>
            {def.cSub}
          </div>
        </div>
        <RainIcon tint={def.tint} size={44} />
      </div>
    );
  }

  // duo — two previews side by side (VTone)
  if (def.kind === 'duo') {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', gap: 2 }}>
          {def.images.slice(0, 2).map((src, i) => (
            <img key={i} src={src} alt="" style={{ width: '50%', height: '100%', objectFit: 'cover' }} />
          ))}
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(6,6,12,0.78) 0%, transparent 46%)' }} />
        <LabelPill def={def} />
        <div style={{ position: 'absolute', left: 14, bottom: 11 }}>
          <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>
            {def.cTitle}
          </div>
          <div style={{ fontFamily: FONT, fontSize: 10.5, fontWeight: 700, color: def.tint, marginTop: 2 }}>
            {def.cSub}
          </div>
        </div>
      </div>
    );
  }

  // collage — 2×2 grid (AI Gallery)
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 2 }}>
        {def.images.slice(0, 4).map((src, i) => (
          <img key={i} src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ))}
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(6,6,12,0.75) 0%, transparent 42%)' }} />
      <LabelPill def={def} />
      <div style={{ position: 'absolute', left: 14, bottom: 11 }}>
        <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>
          {def.cTitle}
        </div>
        <div style={{ fontFamily: FONT, fontSize: 10.5, fontWeight: 700, color: def.tint, marginTop: 2 }}>
          {def.cSub}
        </div>
      </div>
    </div>
  );
}

// Living weather icon — drifting cloud + falling drops
function RainIcon({ tint, size }: { tint: string; size: number }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <span style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', fontSize: size * 0.62, animation: 'fw-cloud 3.6s ease-in-out infinite' }}>☁️</span>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          position: 'absolute', top: size * 0.58, left: size * (0.28 + i * 0.22),
          width: 3, height: 8, borderRadius: 99, background: tint,
          animation: `fw-drop 1.4s ${i * 0.35}s ease-in infinite`,
        }} />
      ))}
    </div>
  );
}

// ─── Expanded face — the widget comes forward ────────────────────────────────

function ExpandedFace({ def, active }: { def: WidgetDef; active: boolean }) {
  const imgH = Math.round(def.xH * 0.54);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Visual — bigger imagery on top */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: imgH, overflow: 'hidden' }}>
        {def.kind === 'data' ? (
          <WeatherVisual def={def} />
        ) : def.kind === 'duo' ? (
          <div style={{ display: 'flex', gap: 2, width: '100%', height: '100%' }}>
            {def.images.slice(0, 2).map((src, i) => (
              <img key={i} src={src} alt="" style={{ width: '50%', height: '100%', objectFit: 'cover' }} />
            ))}
          </div>
        ) : def.kind === 'collage' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 2, width: '100%', height: '100%' }}>
            <img src={def.images[3]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', gridRow: 'span 2' }} />
            {def.images.slice(0, 2).map((src, i) => (
              <img key={i} src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ))}
          </div>
        ) : (
          <img src={def.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: active ? 'scale(1)' : 'scale(1.08)', transition: `transform ${SIZE_MS + 200}ms ${SIZE_EASE}` }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,26,36,0.9) 0%, transparent 40%)' }} />
        <LabelPill def={def} />
        {def.progress !== undefined && (
          <div style={{ position: 'absolute', left: 16, right: 16, bottom: 10, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.22)' }}>
            <div style={{ width: `${def.progress * 100}%`, height: '100%', borderRadius: 99, background: def.tint }} />
          </div>
        )}
      </div>

      {/* Info — title second, metadata third */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: imgH, bottom: 0, padding: '10px 16px 14px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontFamily: FONT, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: def.tint }}>
          {def.kicker}
        </div>
        <div style={{ fontFamily: FONT, fontSize: 20, fontWeight: 800, color: 'rgba(255,255,255,0.97)', letterSpacing: '-0.02em', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {def.xTitle}
        </div>
        <div style={{ fontFamily: FONT, fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {def.xMeta} · <span style={{ color: def.tint, fontWeight: 700 }}>{def.accent}</span>
        </div>

        {/* The agent speaks — mascot inside the widget */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 'auto', minWidth: 0 }}>
          <div style={{ flexShrink: 0, width: 34, height: 34, display: 'grid', placeItems: 'center', opacity: active ? 1 : 0, transform: active ? 'scale(1)' : 'scale(0.8)', transition: 'opacity 0.3s 0.28s ease, transform 0.3s 0.28s ease' }}>
            {active && <AgentMascot agentMode="idle" size={34} />}
          </div>
          <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.72)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: active ? 1 : 0, transition: 'opacity 0.3s 0.34s ease' }}>
            {def.mascotLine}
          </span>
        </div>
      </div>
    </div>
  );
}

// Weather expanded visual — big living forecast
function WeatherVisual({ def }: { def: WidgetDef }) {
  const bars = [16, 22, 30, 40, 46, 42, 34, 27, 21, 16, 12, 14];
  return (
    <div style={{ width: '100%', height: '100%', padding: '18px 18px 12px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', background: 'linear-gradient(160deg, rgba(24,42,74,0.6), rgba(12,16,30,0.2))' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontFamily: FONT, fontSize: 52, fontWeight: 900, color: '#fff', letterSpacing: '-0.05em', lineHeight: 1 }}>
          {def.cTitle}
        </div>
        <RainIcon tint={def.tint} size={52} />
      </div>
      <div style={{ marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 34 }}>
          {bars.map((h, i) => (
            <div key={i} style={{ flex: 1, height: h * 0.72, borderRadius: 99, background: `hsl(${262 - i * 19}, 82%, 62%)`, opacity: 0.92 }} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          {['Now', '3 PM', '6 PM', '9 PM'].map(t => (
            <span key={t} style={{ fontFamily: FONT, fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.35)' }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Settings row ─────────────────────────────────────────────────────────────

function SettingsRow({ focused, onClick }: { focused: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 14px', borderRadius: 999, cursor: 'pointer',
        background: focused ? 'rgba(255,255,255,0.10)' : 'transparent',
        boxShadow: focused ? '0 0 0 1px rgba(255,255,255,0.22)' : 'none',
        transition: 'all 0.2s ease',
      }}
    >
      <span style={{ fontSize: 13, color: focused ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)', transition: 'color 0.2s ease' }}>⚙</span>
      <span style={{ fontFamily: FONT, fontSize: 12.5, fontWeight: 600, color: focused ? '#fff' : 'rgba(255,255,255,0.5)', flex: 1, transition: 'color 0.2s ease' }}>
        Settings
      </span>
      <span style={{ fontFamily: FONT, fontSize: 10.5, fontWeight: 500, color: focused ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.22)' }}>
        Bengaluru · 24°
      </span>
    </div>
  );
}

// ─── Keyframes ────────────────────────────────────────────────────────────────

const KEYFRAMES = `
@keyframes fw-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes fw-slide-in {
  from { transform: translateX(-36px); opacity: 0; }
  to   { transform: translateX(0);     opacity: 1; }
}
@keyframes fw-item-in {
  from { opacity: 0; transform: translateX(-18px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes fw-cloud {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50%      { transform: translateX(-50%) translateY(-3px); }
}
@keyframes fw-drop {
  0%   { transform: translateY(0);   opacity: 0; }
  25%  { opacity: 0.9; }
  75%  { opacity: 0.6; }
  100% { transform: translateY(11px); opacity: 0; }
}
`;
