/**
 * NewConversationScreen — AI companion home for Ambient TV.
 * Entry point when the user starts a fresh AI conversation.
 *
 * Layout:
 *   Far left: vertical icon nav rail, center at x=66 (Fashion / Mascot [active] / Home Decor / Heart / Settings)
 *   Top-left: GlanceLogo (shared brand mark)
 *   Center: Mascot (with ambient glow/particles) → headline → search bar
 *   Below: 6 capability cards (no heading)
 *   Below: "Choose from Prompts" — 10-card full-bleed marquee (slow ambient
 *     auto-scroll, JS/rAF-driven — see the marquee effect in the component body)
 *   Bottom: mic / keyboard hint row
 *
 * TV navigation:
 *   Default focus: mic button
 *   LEFT from mic → left nav rail (Hanger, idx 0)
 *   RIGHT from left nav rail → mic
 *   UP/DOWN within left nav rail → cycles the 5 icons, clamped (no side effect on select —
 *     no destination screens exist yet for Fashion/Home Decor/Heart in this prototype's scope)
 *   RIGHT from mic → search field
 *   DOWN from search area → capability cards (single row of 6)
 *   UP from any capability card → search field
 *   DOWN from any capability card → prompt-card row
 *   UP from a prompt card → capability card in the same column
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import AgentMascot from '../Shared/AgentMascot';
import GlanceLogo from '../Shared/GlanceLogo';
import { gsap } from 'gsap';
import {
  type IconComponent,
  IconHanger, IconAirplane, IconChefHat, IconGlobe, IconLotus, IconHouse,
  NAV_ITEMS,
} from './agentHubIcons';
import { CAPABILITIES, type Capability } from './agentHubCapabilities';
import AgentSearchBar from './AgentSearchBar';

// ─── Data ──────────────────────────────────────────────────────────────────────

// Prompt-suggestion cards ("Choose from Prompts"). Titles are phrased as
// first-person conversational asks (rather than content-feed headlines) since
// selecting one starts a conversation immediately. `icon` reuses the matching
// capability's glyph. `glowColor` is kept as per-item brand metadata (was
// previously also used to tint a colored glow under each card — round 9
// removed that glow per feedback; the field itself is harmless to keep for
// any future per-item accent use, just no longer read by this component).
type PopularItem = {
  id: string;
  title: string;
  thumbnail: string;
  query: string;
  icon: IconComponent;
  glowColor: string;
};

const POPULAR_ITEMS: PopularItem[] = [
  { id: 'weekend',  title: 'Plan me a weekend getaway',        thumbnail: '/images/feed/feed_54-travel-kerala-backwaters-houseboat.jpg', query: 'Plan me a weekend getaway',        icon: IconAirplane, glowColor: '#60A5FA' },
  { id: 'outfit',   title: 'Help me build a wedding outfit',   thumbnail: '/images/feed/feed_33-culture-wedding-mandap-decor.jpg',       query: 'Help me build a wedding outfit',   icon: IconHanger,   glowColor: '#A78BFA' },
  { id: 'ramen',    title: 'Teach me restaurant-style ramen',  thumbnail: '/images/feed/feed_04-food-dinner-party-table.jpg',            query: 'Teach me restaurant-style ramen',  icon: IconChefHat,  glowColor: '#FF9800' },
  { id: 'match',    title: 'Find me tonight\'s best match',    thumbnail: '/images/feed/feed_25-sports-cricket-stadium-floodlights.jpg',  query: 'Find me tonight\'s best match',    icon: IconGlobe,    glowColor: '#4CAF50' },
  { id: 'living',   title: 'Redesign my living room',          thumbnail: '/images/feed/feed_24-home-cozy-monsoon-living-room.jpg',      query: 'Redesign my living room',          icon: IconHouse,    glowColor: '#2DD4BF' },
  { id: 'occasion', title: 'Style me for a big occasion',      thumbnail: '/images/feed/feed_46-fashion-luxury-flatlay.jpg',             query: 'Style me for a big occasion',      icon: IconHanger,   glowColor: '#A78BFA' },
  { id: 'decor',    title: 'Find me calm home decor ideas',    thumbnail: '/images/feed/feed_28-home-japandi-minimal-living.jpg',        query: 'Find me calm home decor ideas',    icon: IconHouse,    glowColor: '#2DD4BF' },
  { id: 'courtside', title: 'Get me courtside picks tonight',  thumbnail: '/images/feed/feed_45-sports-basketball-sunset-court.jpg',     query: 'Get me courtside picks tonight',   icon: IconGlobe,    glowColor: '#4CAF50' },
  { id: 'morning',  title: 'Plan my morning wellness routine', thumbnail: '/images/feed/feed_52-wellness-surf-morning.jpg',              query: 'Plan my morning wellness routine', icon: IconLotus,    glowColor: '#F06292' },
  { id: 'somewhere', title: 'Take me somewhere new this weekend', thumbnail: '/images/feed/feed_22-travel-seoul-cafe-street.jpg',         query: 'Take me somewhere new this weekend', icon: IconAirplane, glowColor: '#60A5FA' },
];

// Marquee track = the list duplicated back-to-back once. With a uniform flex
// `gap` throughout, animating the track from translateX(0) to translateX(-50%)
// loops seamlessly — the second copy's first card lands exactly where the
// first copy's first card started.
const MARQUEE_ITEMS: PopularItem[] = [...POPULAR_ITEMS, ...POPULAR_ITEMS];

// ─── Focus zones ───────────────────────────────────────────────────────────────

type FocusZone = 'left-nav' | 'search-mic' | 'search-field' | 'capabilities' | 'popular';
type FocusState = { zone: FocusZone; idx: number };

const DEFAULT_FOCUS: FocusState = { zone: 'search-mic', idx: 0 };

function navigate(
  focus: FocusState,
  dir: 'up' | 'down' | 'left' | 'right',
): FocusState {
  const { zone, idx } = focus;

  if (zone === 'left-nav') {
    if (dir === 'right') return { zone: 'search-field', idx: 0 };
    if (dir === 'up' && idx > 0) return { zone, idx: idx - 1 };
    if (dir === 'down' && idx < NAV_ITEMS.length - 1) return { zone, idx: idx + 1 };
    return focus;
  }

  // search-field = keyboard mode (LEFT element)
  if (zone === 'search-field') {
    if (dir === 'left') return { zone: 'left-nav', idx: 0 };
    if (dir === 'right') return { zone: 'search-mic', idx: 0 };
    if (dir === 'down') return { zone: 'capabilities', idx: 0 };
    return focus;
  }

  // search-mic = mic mode (RIGHT element)
  if (zone === 'search-mic') {
    if (dir === 'left') return { zone: 'search-field', idx: 0 };
    if (dir === 'down') return { zone: 'capabilities', idx: 0 };
    return focus;
  }

  if (zone === 'capabilities') {
    if (dir === 'left' && idx > 0) return { zone, idx: idx - 1 };
    if (dir === 'right' && idx < CAPABILITIES.length - 1) return { zone, idx: idx + 1 };
    // Single row of 6 — UP always returns to the search field. DOWN is
    // special-cased in handleKey (not here): it needs the marquee's live
    // scroll offset to land on whichever prompt card is already centered in
    // view, which this pure function has no access to. This branch is a
    // pure-function fallback only (never actually reached in practice).
    if (dir === 'up') return { zone: 'search-field', idx: 0 };
    if (dir === 'down') return { zone: 'popular', idx: Math.min(idx, POPULAR_ITEMS.length - 1) };
    return focus;
  }

  if (zone === 'popular') {
    if (dir === 'left' && idx > 0) return { zone, idx: idx - 1 };
    if (dir === 'right' && idx < POPULAR_ITEMS.length - 1) return { zone, idx: idx + 1 };
    if (dir === 'up') return { zone: 'capabilities', idx: Math.min(idx, CAPABILITIES.length - 1) };
    return focus;
  }

  return focus;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// cubic-bezier(x1,y1,x2,y2) sampler — same technique as CurvedNavPanel.tsx's
// deterministic rAF scroll tween (adapted here for the prompt-card marquee).
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
const marqueeFocusEase = cubicBezier(0.25, 0.8, 0.25, 1);

// ─── Prompt-card marquee geometry ───────────────────────────────────────────────
// Must match the card render (width/gap) below. Position of duplicated-array
// item k = k * MARQUEE_STEP, so one full (non-duplicated) copy spans exactly
// POPULAR_ITEMS.length * MARQUEE_STEP px — that's the seamless-loop period.
const MARQUEE_CARD_W = 260;
const MARQUEE_CARD_H = 160;
const MARQUEE_GAP = 20;
const MARQUEE_STEP = MARQUEE_CARD_W + MARQUEE_GAP;
const MARQUEE_LOOP_WIDTH = POPULAR_ITEMS.length * MARQUEE_STEP;
// Ambient drift speed: one full loop every 110s (matches the previously-tuned
// duration), now expressed as px/ms for the JS-driven rAF loop.
const MARQUEE_IDLE_PX_PER_MS = MARQUEE_LOOP_WIDTH / 110000;
const MARQUEE_FOCUS_MS = 400;
// Focused card lifts by this much (translateY) and grows a focus-ring box-shadow
// that spreads MARQUEE_FOCUS_RING_SPREAD px past every edge. The outer viewport's
// `overflow:hidden` clip box must therefore carry at least this much headroom
// ABOVE the resting card position, or the top of a focused card gets cut off —
// see MARQUEE_VIEWPORT_PAD_TOP below.
const MARQUEE_FOCUS_LIFT = 4;
const MARQUEE_FOCUS_RING_SPREAD = 3;
// Extra padding baked into the carousel's clipping viewport so the focused-card
// lift + ring never pokes above/below the visible box. Padding-top only needs to
// cover lift+ring (7px) but carries a comfortable buffer; padding-bottom mirrors
// it for visual symmetry (no longer glow-driven since round 9 dropped the
// per-card ambient glow, but kept so the box isn't asymmetrically tight).
const MARQUEE_VIEWPORT_PAD_TOP = MARQUEE_FOCUS_LIFT + MARQUEE_FOCUS_RING_SPREAD + 13; // 20px
const MARQUEE_VIEWPORT_PAD_BOTTOM = 20;

// Deterministic decorative particle positions around the mascot (no randomness
// on every render — keeps the entrance animation stable across re-renders).
const MASCOT_PARTICLES = [
  { top: '4%',  left: '86%', size: 5, delay: 0 },
  { top: '78%', left: '92%', size: 3.5, delay: 0.6 },
  { top: '88%', left: '10%', size: 4, delay: 1.2 },
  { top: '10%', left: '4%',  size: 3, delay: 1.8 },
  { top: '46%', left: '96%', size: 3, delay: 0.9 },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export type NewConversationScreenProps = {
  onStartConversation?: (query: string) => void;
  onBack?: () => void;
};

export default function NewConversationScreen({
  onStartConversation,
  onBack,
}: NewConversationScreenProps) {
  const [focus, setFocus] = useState<FocusState>(DEFAULT_FOCUS);
  const [activeCap, setActiveCap] = useState<Capability | null>(null);
  const [placeholder, setPlaceholder] = useState('Ask Anything...');

  const containerRef = useRef<HTMLDivElement>(null);
  const mascotRef    = useRef<HTMLDivElement>(null);
  const headlineRef  = useRef<HTMLDivElement>(null);
  const searchRef    = useRef<HTMLDivElement>(null);
  const capsRef      = useRef<HTMLDivElement>(null);
  const promptsHeadingRef = useRef<HTMLDivElement>(null);
  const popularRef   = useRef<HTMLDivElement>(null);
  const trackRef     = useRef<HTMLDivElement>(null);

  // ── Prompt-card marquee — deterministic rAF tween, same precedent as
  // CurvedNavPanel.tsx's scroll system: position driven from JS, never from
  // CSS @keyframes, so keyboard focus and scroll offset can never drift apart.
  const focusRef            = useRef(focus);
  const marqueeOffsetRef    = useRef(0);      // current px; track transform = -offset
  const marqueeTweenRef     = useRef<{ from: number; target: number; start: number } | null>(null);
  const marqueeTargetIdxRef = useRef<number | null>(null); // idx the current/last tween was computed for
  const marqueeLastTsRef    = useRef<number | null>(null);

  useEffect(() => { focusRef.current = focus; }, [focus]);

  useEffect(() => {
    let raf = 0;
    const step = (ts: number) => {
      const last = marqueeLastTsRef.current;
      const dt = last == null ? 0 : ts - last;
      marqueeLastTsRef.current = ts;

      const f = focusRef.current;
      if (f.zone === 'popular') {
        if (marqueeTargetIdxRef.current !== f.idx) {
          const prevIdx = marqueeTargetIdxRef.current;
          marqueeTargetIdxRef.current = f.idx;
          const cur = marqueeOffsetRef.current;

          if (prevIdx === null) {
            // Fresh entry into the row (from capabilities or elsewhere). The
            // idx was already computed from the live offset at the moment of
            // entry (see computeCenterVisibleIdx in handleKey) — the target
            // tile is already exactly where it is. Zero movement.
            marqueeTweenRef.current = null;
          } else {
            // LEFT/RIGHT within the row — round 9: always re-center the newly
            // focused card at the horizontal middle of the viewport. The focus
            // ring stays put at center; the track scrolls underneath it on
            // every index change (no longer conditional on whether the
            // destination was already visible).
            const viewportWidth = popularRef.current?.clientWidth ?? 1920;
            const rawLeft = f.idx * MARQUEE_STEP;
            // Only two copies of this tile actually exist in the DOM (the
            // duplicated list) — pick whichever is nearer to `cur`. (A round-
            // to-nearest-multiple-of-LOOP_WIDTH trick would be wrong here:
            // rawLeft ranges up to ~0.9×LOOP_WIDTH, so "nearest cycle" can
            // land on a negative, non-existent third copy.)
            const leftCopy1 = rawLeft;
            const leftCopy2 = rawLeft + MARQUEE_LOOP_WIDTH;
            const cycledLeft = Math.abs(leftCopy1 - cur) <= Math.abs(leftCopy2 - cur) ? leftCopy1 : leftCopy2;
            // Upper clamp must span the FULL duplicated track (both copies),
            // not just one loop width — otherwise centering an item late in
            // the list (idx near POPULAR_ITEMS.length-1) gets clamped short
            // and the card stops tracking to center. Lower bound stays 0:
            // the track's first pixel is a hard edge (nothing renders before
            // it), so the first couple of cards can't be perfectly centered —
            // same boundary behavior any edge-anchored carousel has.
            const maxScroll = Math.max(0, 2 * MARQUEE_LOOP_WIDTH - MARQUEE_GAP - viewportWidth);
            const baseTarget = clamp(
              cycledLeft + MARQUEE_CARD_W / 2 - viewportWidth / 2,
              0, maxScroll,
            );
            // Pick whichever wrap-equivalent copy of the target is nearest
            // the current offset, so the tween never crosses most of the
            // loop just because ambient drift happened to be mid-cycle.
            const target = baseTarget + Math.round((cur - baseTarget) / MARQUEE_LOOP_WIDTH) * MARQUEE_LOOP_WIDTH;
            marqueeTweenRef.current = { from: cur, target, start: ts };
          }
        }
        const tween = marqueeTweenRef.current;
        if (tween) {
          const p = clamp((ts - tween.start) / MARQUEE_FOCUS_MS, 0, 1);
          marqueeOffsetRef.current = tween.from + (tween.target - tween.from) * marqueeFocusEase(p);
          if (p >= 1) marqueeTweenRef.current = null; // settled — hold here
        }
      } else {
        // Ambient drift — resumes from wherever the offset currently sits,
        // no snap-back to the start.
        marqueeTargetIdxRef.current = null;
        marqueeTweenRef.current = null;
        if (dt > 0) {
          marqueeOffsetRef.current += MARQUEE_IDLE_PX_PER_MS * dt;
          if (marqueeOffsetRef.current >= MARQUEE_LOOP_WIDTH) {
            marqueeOffsetRef.current -= MARQUEE_LOOP_WIDTH;
          }
        }
      }

      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(${-marqueeOffsetRef.current}px)`;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ── Entrance animation ─────────────────────────────────────────────────────

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      gsap.set(mascotRef.current, { opacity: 0, y: 18, scale: 0.92 });
      gsap.set(headlineRef.current, { opacity: 0, y: 20 });
      gsap.set(searchRef.current, { opacity: 0, y: 22 });
      gsap.set(capsRef.current, { opacity: 0, y: 28 });
      gsap.set(promptsHeadingRef.current, { opacity: 0, y: 16 });
      gsap.set(popularRef.current, { opacity: 0, y: 22 });

      // "Choose from Prompts" is part of the introduction, not a static
      // fixture — it only reveals once the agent, search, and capability
      // row have already appeared, so the prompt row never shows in its
      // final state on first paint.
      tl.to(mascotRef.current,   { opacity: 1, y: 0, scale: 1, duration: 0.6 })
        .to(headlineRef.current, { opacity: 1, y: 0, duration: 0.45 }, '-=0.28')
        .to(searchRef.current,   { opacity: 1, y: 0, duration: 0.45 }, '-=0.2')
        .to(capsRef.current,     { opacity: 1, y: 0, duration: 0.5 },  '-=0.1')
        .to(promptsHeadingRef.current, { opacity: 1, y: 0, duration: 0.35 }, '-=0.05')
        .to(popularRef.current,  { opacity: 1, y: 0, duration: 0.4 },  '-=0.1');
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // ── Capability card focus → update placeholder ─────────────────────────────

  useEffect(() => {
    if (focus.zone === 'capabilities') {
      const cap = CAPABILITIES[focus.idx];
      setActiveCap(cap);
      setPlaceholder(cap.placeholder);
    }
  }, [focus]);

  // ── Reset placeholder when mic or search field is focused from outside caps ─

  useEffect(() => {
    if (focus.zone === 'search-mic' || focus.zone === 'search-field') {
      if (!activeCap) setPlaceholder('Ask Anything...');
    }
    if (focus.zone === 'popular' || focus.zone === 'search-mic') {
      setActiveCap(null);
      if (focus.zone === 'search-mic') setPlaceholder('Ask Anything...');
    }
  }, [focus.zone]);

  // ── Keyboard nav ───────────────────────────────────────────────────────────

  // Which prompt card currently sits closest to the horizontal center of the
  // viewport, purely from the marquee's live (unmoved) offset — used ONLY on
  // entry into the row so DOWN never causes the track to scroll. The track
  // renders the card list twice back-to-back (seamless loop), so a card's
  // on-screen center could be either copy; check both and take whichever is
  // nearer, then fold back to its 0..N-1 source index.
  const computeCenterVisibleIdx = () => {
    const viewportWidth = popularRef.current?.clientWidth ?? 1920;
    const centerX = marqueeOffsetRef.current + viewportWidth / 2;
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < POPULAR_ITEMS.length; i++) {
      const centerCopy1 = i * MARQUEE_STEP + MARQUEE_CARD_W / 2;
      const centerCopy2 = centerCopy1 + MARQUEE_LOOP_WIDTH;
      const d = Math.min(Math.abs(centerCopy1 - centerX), Math.abs(centerCopy2 - centerX));
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    return bestIdx;
  };

  const handleKey = useCallback((e: KeyboardEvent) => {
    const dirMap: Record<string, 'up' | 'down' | 'left' | 'right'> = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    };

    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter',' ','Escape','Backspace'].includes(e.key)) {
      e.preventDefault();
    }

    if (e.key === 'Escape' || e.key === 'Backspace') {
      onBack?.();
      return;
    }

    const dir = dirMap[e.key];
    if (dir) {
      // Entering the prompt row from capabilities must never scroll the
      // marquee — land on whichever card is already centered in view.
      if (dir === 'down' && focus.zone === 'capabilities') {
        setFocus({ zone: 'popular', idx: computeCenterVisibleIdx() });
        return;
      }
      setFocus(prev => navigate(prev, dir));
      return;
    }

    if (e.key === 'Enter' || e.key === ' ') {
      if (focus.zone === 'capabilities') {
        // Selecting a capability opens its L1 conversation-start state
        // immediately — no intermediate category lobby.
        window.location.href = `/l1-category/${CAPABILITIES[focus.idx].landingId}`;
      } else if (focus.zone === 'popular') {
        const item = POPULAR_ITEMS[focus.idx];
        onStartConversation?.(item.query);
      } else if (focus.zone === 'search-mic') {
        onStartConversation?.('');
      }
    }
  }, [focus, onBack, onStartConversation]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const isFocused = (zone: FocusZone, i = 0) => focus.zone === zone && focus.idx === i;

  // Matches the search row's total width (84 mic + 16 gap + 1024 field = 1124) so
  // every section below shares one consistent centered column / left edge.
  const CONTENT_WIDTH = 1124;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute', inset: 0,
        background: [
          'radial-gradient(ellipse 1100px 720px at 50% -4%, rgba(124,58,237,0.16), transparent 62%)',
          'radial-gradient(ellipse 900px 680px at 88% 88%, rgba(76,29,149,0.10), transparent 65%)',
          'linear-gradient(180deg, #07050f 0%, #05040c 55%, #06040f 100%)',
        ].join(', '),
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        fontFamily: '"Plus Jakarta Sans", "Instrument Sans", system-ui, sans-serif',
      }}
    >
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '30px 76px 0',
        position: 'relative', zIndex: 10,
      }}>
        <GlanceLogo />
      </div>

      {/* ── Left icon nav rail — center sits at x=66. Rail is 52px pills, 12px
          gap; stack height = 5*52 + 4*12 = 308, vertically centered on the
          full 1080 viewport via top:0/height:100%/justifyContent:center, so
          it always sits at ((1080-308)/2)=386 to 386+308=694 regardless of
          content above/below (see the "Choose from Prompts" heading below,
          whose `top` is deliberately anchored just past this rail's known
          bottom edge). ─────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', left: 66, top: 0, height: '100%',
        transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
        zIndex: 8,
      }}>
        {NAV_ITEMS.map((item, i) => {
          const focused = isFocused('left-nav', i);
          return (
            <div
              key={item.id}
              onClick={() => setFocus({ zone: 'left-nav', idx: i })}
              style={{
                width: 52, height: 52, borderRadius: 30,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                outline: focused ? '2px solid rgba(139,92,246,0.8)' : 'none',
                outlineOffset: 2,
                transition: 'outline 0.2s ease',
              }}
            >
              <img
                src={item.icon}
                alt=""
                style={{
                  width: 32, height: 32,
                  opacity: item.active ? 1 : 0.55,
                  filter: item.active ? 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' : 'none',
                  transition: 'opacity 0.2s ease, filter 0.2s ease',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* ── Center: Mascot + Headline + Search ──────────────────────────────── */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: 38,
      }}>
        {/* Mascot with ambient glow + floating particles */}
        <div ref={mascotRef} style={{
          position: 'relative',
          width: 140, height: 140,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 14,
        }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.22) 0%, transparent 70%)',
            filter: 'blur(6px)',
            animation: 'nc-mascot-glow 4.2s ease-in-out infinite',
          }} />
          {MASCOT_PARTICLES.map((p, i) => (
            <span
              key={i}
              style={{
                position: 'absolute', top: p.top, left: p.left,
                width: p.size, height: p.size, borderRadius: '50%',
                background: i % 2 === 0
                  ? 'rgba(196,181,253,0.85)'
                  : 'rgba(255,255,255,0.75)',
                boxShadow: '0 0 6px rgba(167,139,250,0.6)',
                animation: `nc-particle-float 5.5s ease-in-out ${p.delay}s infinite`,
              }}
            />
          ))}
          <AgentMascot
            agentMode={focus.zone === 'search-mic' ? 'looking' : 'idle'}
            size={78}
          />
        </div>

        {/* Headline */}
        <div ref={headlineRef} style={{
          fontSize: 38, fontWeight: 600, letterSpacing: '-0.02em',
          color: '#F5F3F7', marginBottom: 38, textAlign: 'center',
        }}>
          Ready to create something new?
        </div>

        {/* Search row — shared AgentSearchBar (mic capsule + field) so this
            stays pixel-identical to ReturningUserScreen. */}
        <div ref={searchRef}>
          <AgentSearchBar
            micFocused={isFocused('search-mic')}
            fieldFocused={isFocused('search-field')}
            placeholder={placeholder}
            onMicClick={() => { setFocus({ zone: 'search-mic', idx: 0 }); onStartConversation?.(''); }}
            onFieldClick={() => setFocus({ zone: 'search-field', idx: 0 })}
          />
        </div>
      </div>

      {/* ── Capability Cards (no heading, per round-4 feedback) ──────────────── */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0 0' }}>
        <div style={{ width: CONTENT_WIDTH }}>
          <div ref={capsRef} style={{
            display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 14,
          }}>
            {CAPABILITIES.map((cap, i) => {
              const focused = isFocused('capabilities', i);
              const active  = activeCap?.id === cap.id;
              const Icon = cap.icon;
              return (
                <div
                  key={cap.id}
                  onClick={() => {
                    setFocus({ zone: 'capabilities', idx: i });
                    window.location.href = `/l1-category/${cap.landingId}`;
                  }}
                  style={{
                    borderRadius: 20,
                    padding: '20px 16px 18px',
                    background: focused
                      ? 'rgba(255,255,255,0.10)'
                      : active
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(20,17,34,0.55)',
                    border: focused
                      ? '2px solid rgba(255,255,255,0.85)'
                      : active
                      ? '1px solid rgba(255,255,255,0.25)'
                      : '1px solid rgba(255,255,255,0.06)',
                    boxShadow: focused
                      ? '0 10px 30px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.15)'
                      : 'none',
                    transform: focused ? 'translateY(-4px)' : 'translateY(0)',
                    transition: 'all 0.22s cubic-bezier(0.22,0.61,0.36,1)',
                    cursor: 'pointer',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    display: 'flex', flexDirection: 'column', gap: 14,
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  <Icon color={cap.accentColor} size={31} />
                  <div>
                    <div style={{
                      fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em',
                      color: focused ? '#F5F3F7' : 'rgba(245,243,247,0.82)',
                      marginBottom: 5, transition: 'color 0.2s',
                    }}>
                      {cap.label}
                    </div>
                    <div style={{
                      fontSize: 12, fontWeight: 400, lineHeight: 1.42,
                      color: focused ? 'rgba(245,243,247,0.7)' : 'rgba(245,243,247,0.38)',
                      transition: 'color 0.2s',
                    }}>
                      {cap.subtitle}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── "Choose from Prompts" title — centered, tracked, divider-flanked ────
          Anchored via absolute `top` (not flow-relative padding) so it's placed
          in the SAME fixed coordinate space as the left-nav rail — its position
          is therefore independent of the capability row's height above it and
          can never drift into collision with the rail's Settings icon (which
          sits at a known, fixed y=386–694 in the 1080 viewport — 5 icons ×
          52px + 4 gaps × 12px = 308px stack, centered in 1080). `top: 716`
          keeps a clear ~22px gap below the Settings icon's y=694 bottom edge
          (pulled up from the previous 738/~44px to tighten the leftover
          headroom, while still staying clear of the rail per the 20–25px
          floor). */}
      <div ref={promptsHeadingRef} style={{ position: 'absolute', left: 0, right: 0, top: 716, display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, width: 600 }}>
          <div style={{
            flex: 1, height: 1,
            background: 'linear-gradient(to left, rgba(255,255,255,0.35), transparent)',
          }} />
          <span style={{
            fontSize: 14, fontWeight: 600, letterSpacing: '2px',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)',
            whiteSpace: 'nowrap',
          }}>
            Choose from Prompts
          </span>
          <div style={{
            flex: 1, height: 1,
            background: 'linear-gradient(to right, rgba(255,255,255,0.35), transparent)',
          }} />
        </div>
      </div>

      {/* ── Prompt-card carousel — full-bleed, spans edge to edge ───────────────
          Full-bleed photo cards, inspired by Figma's "Start from these Prompts"
          pattern (373:675) — adapted, not copied: bottom-left icon + title over
          a dark scrim, border only on the focused card (round 9 dropped the
          resting-state border AND the colored ambient glow that used to sit
          under every card). 260×160 fixed cards don't all fit the viewport, so
          the track auto-scrolls as a slow marquee (list duplicated back-to-back
          so the loop repeats seamlessly). Unlike the search bar / capability
          row above, this row deliberately breaks out of the centered
          CONTENT_WIDTH column to span the full screen width, and (like the
          title above) is anchored via absolute `top` rather than flow padding,
          for the same collision-safety reason.
          Position is driven entirely from JS (see the rAF effect above) — never
          from a CSS @keyframes loop — so keyboard focus and scroll offset can
          never drift apart: `trackRef`'s transform is written imperatively on
          every frame, either advancing (ambient drift), holding still (fresh
          entry into the row — lands on whichever card is already centered, so
          DOWN never causes a scroll), or — round 9 — tweening on EVERY
          LEFT/RIGHT move within the row so the newly-focused card always ends
          up centered in the viewport (the focus ring stays fixed at center;
          the track scrolls underneath it — see the rAF effect above).

          This outer div is the `overflow:hidden` clip box — it's deliberately
          sized TALLER than a resting card (MARQUEE_CARD_H) via top/bottom
          padding (MARQUEE_VIEWPORT_PAD_TOP/BOTTOM) so a focused card's lift
          (translateY) + focus-ring box-shadow have headroom to render without
          getting clipped by this box's own edge. `top` is shifted up by
          MARQUEE_VIEWPORT_PAD_TOP from the intended visual card position (752,
          i.e. 36px below the heading above) so that, after padding-top pushes
          the track back down, cards still land at that same visual position. */}
      <div
        ref={popularRef}
        style={{
          position: 'absolute', left: 0, right: 0,
          top: 752 - MARQUEE_VIEWPORT_PAD_TOP,
          paddingTop: MARQUEE_VIEWPORT_PAD_TOP,
          paddingBottom: MARQUEE_VIEWPORT_PAD_BOTTOM,
          width: '100%', overflow: 'hidden',
        }}
      >
        <div ref={trackRef} style={{ display: 'flex', gap: MARQUEE_GAP, width: 'max-content', willChange: 'transform' }}>
          {MARQUEE_ITEMS.map((item, i) => {
              const idx = i % POPULAR_ITEMS.length;
              const focused = isFocused('popular', idx);
              const Icon = item.icon;
              return (
                <div
                  key={`${item.id}-${i}`}
                  onClick={() => {
                    setFocus({ zone: 'popular', idx });
                    onStartConversation?.(item.query);
                  }}
                  style={{
                    flexShrink: 0, width: MARQUEE_CARD_W, height: MARQUEE_CARD_H, borderRadius: 18,
                    position: 'relative', overflow: 'hidden',
                    // Resting cards carry NO border and NO glow — only the
                    // focused card gets a border + a tight focus-ring
                    // box-shadow (round 9: dropped the colored ambient glow
                    // that used to sit under every card, per feedback).
                    border: focused ? '1.5px solid rgba(255,255,255,0.95)' : 'none',
                    boxShadow: focused ? `0 0 0 ${MARQUEE_FOCUS_RING_SPREAD}px rgba(255,255,255,0.2)` : 'none',
                    transform: focused ? `translateY(-${MARQUEE_FOCUS_LIFT}px)` : 'translateY(0)',
                    transition: 'transform 0.22s cubic-bezier(0.22,0.61,0.36,1), border 0.22s ease, box-shadow 0.22s ease',
                    cursor: 'pointer',
                  }}
                >
                  <img
                    src={item.thumbnail}
                    alt=""
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(180deg, transparent 30%, rgba(5,2,16,0.85) 100%)',
                  }} />
                  <div style={{
                    position: 'absolute', left: 14, right: 14, bottom: 12,
                    display: 'flex', flexDirection: 'column', gap: 8,
                  }}>
                    <Icon color="#FFFFFF" size={18} />
                    <div style={{
                      fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em',
                      color: '#FFFFFF', lineHeight: 1.32,
                    }}>
                      {item.title}
                    </div>
                  </div>
                </div>
              );
          })}
        </div>
      </div>

      <style>{KF}</style>
    </div>
  );
}

const KF = `
@keyframes nc-fade-up {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes nc-mascot-glow {
  0%, 100% { opacity: 0.6; transform: scale(0.94); }
  50%       { opacity: 1;   transform: scale(1.08); }
}
@keyframes nc-particle-float {
  0%, 100% { opacity: 0.25; transform: translateY(0) scale(1); }
  50%       { opacity: 0.9;  transform: translateY(-6px) scale(1.15); }
}
`;
