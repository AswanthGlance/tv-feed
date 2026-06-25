/**
 * L0T1Lab — Motion specification + developer handoff environment.
 * Route: /l0_t1 or /l0-t1
 *
 * Source of truth for L0 T1 animation. Uses warm_profile_1 content (ws-coorg card).
 * Figma: https://www.figma.com/design/KYdnEWrg6g0wt4dWO1QAfd/Akira-v4--Ambient-
 *
 * Keyboard controls:
 *   1–8      Jump to state
 *   ← →      Prev/Next state
 *   Space     Replay current state
 *   R         Replay from State 1
 *   D         Toggle dev inspector
 *   ↓         Focus next action (Like → Dislike → Shop)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import AgentMascot from './components/Shared/AgentMascot';
import type { AgentMode } from './components/Shared/AgentMascot';
import GlanceTextReveal from './components/Shared/GlanceTextReveal';
import {
  REASONING_REVEAL_MS, REASONING_HOLD_MS,
  AGENT_REVEAL_MS, AGENT_HOLD_MS,
  TITLE_HOLD_MS,
  HERO_SHRINK_MS, HERO_SHRINK_HOLD_MS,
  AGENT_LOOK_TO_CTA_MS, CTA_PILL_REVEAL_MS,
  MASCOT_FLIP_MS, CTA_SETTLE_MS,
  CTA_TEXT_REVEAL_MS, BEAM_MARGIN_MS,
  FINAL_HOLD_MS,
  BACKGROUND_DRIFT_MS, BACKGROUND_DRIFT_SCALE,
  BACKGROUND_DRIFT_PAN_X, BACKGROUND_DRIFT_PAN_Y,
  MASCOT_HERO_SIZE, MASCOT_FINAL_SIZE, MASCOT_CTA_SIZE,
  MASCOT_HERO_SCALE, MASCOT_FINAL_SCALE,
  REASONING_HERO_SCALE, REASONING_FINAL_SCALE,
  DEV_OVERLAY_KEY, STATES, LAYOUT,
  type LabState,
} from './config/l0T1Config';
import { setProfileOverrides } from './logic/reasoningEngine';
import { WARM_CARD_SIGNAL_DATA_CRISP } from './components/L0/warmCardSignalDataCrisp';

/* ── Warm profile context ───────────────────────────────────────────────── */
if (typeof window !== 'undefined') {
  (window as any).GLANCE_CTX = { city: 'Bangalore', weather: 'rainy', day: 'Saturday', timeOfDay: 'morning', upcomingContext: 'weekend' };
  (window as any).GLANCE_STATE = 'warm';
  setProfileOverrides({
    'ws-coorg': "Attikan won the specialty cup and runs estate stays — peak green this fortnight. I'll shortlist Ama and Attikan for two nights.",
  });
}

/* ── Card data (ws-coorg, warm_profile_1) ───────────────────────────────── */
const CARD = {
  id:          'ws-coorg',
  image:       '/images/warm-start/coorg.jpg',
  title:       'A Coffee Estate at First Light',
  tag1:        'Weekend Escapes',
  tag2:        'Travel',
  reasoning:   "Attikan won the specialty cup and runs estate stays — peak green this fortnight. I'll shortlist Ama and Attikan for two nights.",
  reasoningHls: ['peak green this fortnight', 'Attikan'],
  ctaLabel:    'Want me to shortlist estate stays?',
  signal1:     WARM_CARD_SIGNAL_DATA_CRISP['ws-coorg']?.signal1 ?? '',
  signal1Hls:  WARM_CARD_SIGNAL_DATA_CRISP['ws-coorg']?.signal1Hls ?? [],
  signal2:     WARM_CARD_SIGNAL_DATA_CRISP['ws-coorg']?.signal2 ?? '',
  signal2Hls:  WARM_CARD_SIGNAL_DATA_CRISP['ws-coorg']?.signal2Hls ?? [],
};

/* ── Timing cumulative map (used by state tracker) ───────────────────────── */
const T = {
  BG:       0,
  TITLE:    1100,
  AGENT:    1100 + TITLE_HOLD_MS,
  REASON:   1100 + TITLE_HOLD_MS + AGENT_REVEAL_MS + AGENT_HOLD_MS,
  SHRINK:   1100 + TITLE_HOLD_MS + AGENT_REVEAL_MS + AGENT_HOLD_MS + REASONING_REVEAL_MS + REASONING_HOLD_MS,
  CTA_ENTRY: 0, // computed below
  CTA_EXPAND: 0,
  CTA_TEXT: 0,
  HOLD:     0,
};
T.CTA_ENTRY  = T.SHRINK  + HERO_SHRINK_MS + HERO_SHRINK_HOLD_MS + AGENT_LOOK_TO_CTA_MS;
T.CTA_EXPAND = T.CTA_ENTRY + 400; // mascot starts flying
T.CTA_TEXT   = T.CTA_ENTRY + 400 + MASCOT_FLIP_MS + 220 + CTA_SETTLE_MS;
T.HOLD       = T.CTA_TEXT + CTA_TEXT_REVEAL_MS + BEAM_MARGIN_MS + 200;

function elapsedToState(ms: number): LabState {
  if (ms >= T.HOLD)      return 8;
  if (ms >= T.CTA_TEXT)  return 7;
  if (ms >= T.CTA_EXPAND)return 6;
  if (ms >= T.CTA_ENTRY) return 5;
  if (ms >= T.SHRINK)    return 4;
  if (ms >= T.REASON)    return 3;
  if (ms >= T.AGENT)     return 2;
  return 1;
}

/* ── Focus targets for the bottom bar ───────────────────────────────────── */
type FocusTarget = 'cta' | 'feedback';

/* ── Figma-spec feedback icon (single pill: thumbs up + thumbs down) ─────── */
function FeedbackIcon() {
  return (
    <svg width="66" height="40" viewBox="0 0 66 40" fill="none">
      {/* Thumbs up */}
      <path d="M13 28V18L18 10L19.5 11.5C20.3 12.4 20.5 13.5 20.2 14.7L19.5 18H26C27.1 18 28 18.9 28 20L25 28H13Z"
        fill="rgba(255,255,255,0.72)" />
      <rect x="8" y="18" width="5" height="10" rx="1" fill="rgba(255,255,255,0.72)" />
      {/* Thumbs down */}
      <path d="M53 12V22L48 30L46.5 28.5C45.7 27.6 45.5 26.5 45.8 25.3L46.5 22H40C38.9 22 38 21.1 38 20L41 12H53Z"
        fill="rgba(255,255,255,0.72)" />
      <rect x="53" y="12" width="5" height="10" rx="1" fill="rgba(255,255,255,0.72)" />
    </svg>
  );
}

/* ── WordReveal — clip-mask slide-up per word with stagger ──────────────── */
interface WordRevealProps {
  words: string[];
  fontSize: number;
  fontWeight: number;
  fontFamily: string;
  staggerMs: number;
  durationMs: number;
  delayMs?: number;
  playing: boolean;
  textShadow?: string;
  wrap?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}
function WordReveal({ words, fontSize, fontWeight, fontFamily, staggerMs, durationMs, delayMs = 0, playing, textShadow, wrap, prefix, suffix }: WordRevealProps) {
  const refs = useRef<(HTMLSpanElement | null)[]>([]);
  useEffect(() => {
    if (!playing) return;
    refs.current.forEach((el, i) => {
      if (!el) return;
      gsap.fromTo(el,
        { y: '110%', opacity: 0 },
        { y: '0%', opacity: 1, duration: durationMs / 1000, delay: (delayMs + i * staggerMs) / 1000, ease: 'power3.out' }
      );
    });
  }, [playing]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ display: wrap ? 'flex' : 'contents', flexWrap: wrap ? 'wrap' : undefined, gap: wrap ? '0.28em' : undefined, alignItems: 'baseline' }}>
      {prefix}
      {words.map((word, i) => (
        <div key={i} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', lineHeight: 1.25 }}>
          <span
            ref={el => { refs.current[i] = el; }}
            style={{
              display: 'inline-block',
              fontSize, fontWeight, fontFamily, color: '#fff',
              textShadow, letterSpacing: '0.02em', whiteSpace: 'nowrap',
              opacity: 0, transform: 'translateY(110%)',
            }}
          >
            {word}
          </span>
        </div>
      ))}
      {suffix}
    </div>
  );
}

/* ── State inspector panel ───────────────────────────────────────────────── */
function Inspector({
  currentState,
  elapsed,
  stateElapsed,
  onJump,
}: {
  currentState: LabState;
  elapsed: number;
  stateElapsed: number;
  onJump: (s: LabState) => void;
}) {
  const stateTimes: Record<LabState, number> = {
    1: T.BG, 2: T.AGENT, 3: T.REASON, 4: T.SHRINK,
    5: T.CTA_ENTRY, 6: T.CTA_EXPAND, 7: T.CTA_TEXT, 8: T.HOLD,
  };
  const stateDurations: Record<LabState, string> = {
    1: `${TITLE_HOLD_MS}ms hold`,
    2: `${AGENT_REVEAL_MS}ms + ${AGENT_HOLD_MS}ms hold`,
    3: `${REASONING_REVEAL_MS}ms + ${REASONING_HOLD_MS}ms hold`,
    4: `${HERO_SHRINK_MS}ms + ${HERO_SHRINK_HOLD_MS}ms hold`,
    5: `${CTA_PILL_REVEAL_MS}ms`,
    6: `${MASCOT_FLIP_MS}ms arc`,
    7: `${CTA_TEXT_REVEAL_MS}ms`,
    8: `${FINAL_HOLD_MS}ms`,
  };

  return (
    <div style={{
      position: 'absolute', top: 20, right: 20, zIndex: 9999,
      background: 'rgba(8,4,20,0.88)',
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 16, padding: '16px 18px', width: 280,
      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
      color: 'rgba(255,255,255,0.88)',
      pointerEvents: 'auto',
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(167,139,250,0.7)', marginBottom: 12 }}>
        L0 T1 State Inspector
      </div>

      {/* Timing */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Total elapsed</span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontVariantNumeric: 'tabular-nums' }}>{elapsed.toFixed(0)} ms</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>State elapsed</span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontVariantNumeric: 'tabular-nums' }}>{stateElapsed.toFixed(0)} ms</span>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 10 }} />

      {/* State list */}
      {STATES.map(s => {
        const id = s.id as LabState;
        const active = id === currentState;
        const done   = id < currentState;
        return (
          <button
            key={id}
            onClick={() => onJump(id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              background: active ? 'rgba(167,139,250,0.15)' : 'transparent',
              border: active ? '1px solid rgba(167,139,250,0.3)' : '1px solid transparent',
              borderRadius: 8, padding: '6px 8px', marginBottom: 3, cursor: 'pointer',
              opacity: done ? 0.4 : 1,
              transition: 'all 0.15s',
            }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: 99, flexShrink: 0,
              background: active ? '#a78bfa' : done ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 700, color: active ? '#1a0a40' : 'rgba(255,255,255,0.5)',
              boxShadow: active ? '0 0 8px rgba(167,139,250,0.6)' : 'none',
            }}>
              {s.shortcut}
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: 11, fontWeight: active ? 700 : 400, color: active ? '#e9d5ff' : 'rgba(255,255,255,0.6)' }}>
                {s.label}
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
                {stateDurations[id]}
              </div>
            </div>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontVariantNumeric: 'tabular-nums' }}>
              {stateTimes[id]}ms
            </span>
          </button>
        );
      })}

      <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '10px 0 8px' }} />
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', lineHeight: 1.7 }}>
        1–8 jump · ← → step · Space replay · R restart · D hide
      </div>
    </div>
  );
}

/* ── Main lab ────────────────────────────────────────────────────────────── */
export default function L0T1Lab() {
  const [labState,        setLabState]       = useState<LabState>(1);
  const [renderKey,       setRenderKey]      = useState(0);
  const [showInspector,   setShowInspector]  = useState(true);
  const [focusTarget,     setFocusTarget]    = useState<FocusTarget>('cta');
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [productVisible,  setProductVisible]  = useState(false);

  /* Animation state */
  const [bgReady,          setBgReady]        = useState(false);
  const [titleVisible,     setTitleVisible]   = useState(false);
  const [agentVisible,     setAgentVisible]   = useState(false);
  const [reasoningPlaying, setReasoningPlaying] = useState(false);
  const [reasoningVisible, setReasoningVisible] = useState(false);
  const [agentMode,        setAgentMode]      = useState<AgentMode>('idle');
  const [ctaVisible,       setCtaVisible]     = useState(false);
  const [ctaTextPlaying,   setCtaTextPlaying] = useState(false);
  const [ctaActive,        setCtaActive]      = useState(false);
  const [beamActive,       setBeamActive]     = useState(false);
  const [mascotInCta,      setMascotInCta]    = useState(false);
  const [driftActive,      setDriftActive]    = useState(false);

  /* Timing tracker */
  const [elapsed,       setElapsed]      = useState(0);
  const [stateElapsed,  setStateElapsed] = useState(0);
  const startTimeRef    = useRef<number | null>(null);
  const stateStartRef   = useRef<number | null>(null);
  const rafRef          = useRef<number | null>(null);
  const timersRef       = useRef<ReturnType<typeof setTimeout>[]>([]);

  /* Refs for GSAP */
  const bgRef           = useRef<HTMLDivElement>(null);
  const overlayRef      = useRef<HTMLDivElement>(null);
  const headerRef       = useRef<HTMLDivElement>(null);
  const tagBlockRef     = useRef<HTMLDivElement>(null);
  const mascotFloatRef  = useRef<HTMLDivElement>(null);
  const reasoningRef    = useRef<HTMLParagraphElement>(null);
  const ctaWrapRef      = useRef<HTMLDivElement>(null);
  const ctaMascotSlotRef= useRef<HTMLDivElement>(null);
  const ctaLabelClipRef = useRef<HTMLDivElement>(null);
  const ctaLabelRef     = useRef<HTMLSpanElement>(null);
  const feedbackWrapRef = useRef<HTMLDivElement>(null);
  const shopCardRef     = useRef<HTMLDivElement>(null);
  const containerRef    = useRef<HTMLDivElement>(null);
  const tlRef           = useRef<gsap.core.Timeline | null>(null);

  /* ── Ticker ─────────────────────────────────────────────────────────── */
  const startTicker = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startTimeRef.current  = performance.now();
    stateStartRef.current = performance.now();
    const tick = () => {
      const now   = performance.now();
      const total = now - (startTimeRef.current ?? now);
      setElapsed(total);
      const s = elapsedToState(total);
      setLabState(prev => {
        if (prev !== s) stateStartRef.current = now;
        return s;
      });
      setStateElapsed(now - (stateStartRef.current ?? now));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopTicker = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  /* ── Clear all animation state ───────────────────────────────────────── */
  const clearAll = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    tlRef.current?.kill();
    stopTicker();
    setBgReady(false);
    setTitleVisible(false);
    setAgentVisible(false);
    setReasoningPlaying(false);
    setReasoningVisible(false);
    setAgentMode('idle');
    setCtaVisible(false);
    setCtaTextPlaying(false);
    setCtaActive(false);
    setBeamActive(false);
    setMascotInCta(false);
    setDriftActive(false);
    setFocusTarget('cta');
    setFeedbackVisible(false);
    setProductVisible(false);
  }, [stopTicker]);

  /* ── Scheduled timer helper ──────────────────────────────────────────── */
  const after = useCallback((ms: number, fn: () => void) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
    return t;
  }, []);

  /* ── Build + run the animation sequence ─────────────────────────────── */
  const runSequence = useCallback(() => {
    if (!bgRef.current) return;

    /* Initial GSAP states */
    gsap.set([bgRef.current, overlayRef.current].filter(Boolean), { opacity: 0 });
    gsap.set(headerRef.current, { opacity: 0, y: -12 });
    gsap.set(tagBlockRef.current, { opacity: 0, y: 10 });
    gsap.set(mascotFloatRef.current, { opacity: 0, y: 10, scale: MASCOT_HERO_SCALE });
    gsap.set(reasoningRef.current, { opacity: 0, scale: MASCOT_HERO_SCALE });
    gsap.set(ctaWrapRef.current, { opacity: 0, y: 16 });
    // feedback + product visibility driven by CSS transition on state, no GSAP needed

    startTicker();

    /* State 1 — BG + Overlay + Header + Title */
    gsap.to(bgRef.current, { opacity: 1, duration: 1.0, ease: 'power2.inOut' });
    if (bgRef.current) gsap.fromTo(bgRef.current,
      { scale: 1.04, yPercent: -1.5 }, { scale: 1.0, yPercent: 0, duration: 2.8, ease: 'power1.out' });
    after(400, () => {
      if (overlayRef.current) gsap.to(overlayRef.current, { opacity: 1, duration: 0.85, ease: 'power2.out' });
    });
    after(900, () => {
      if (headerRef.current) gsap.to(headerRef.current, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
    });
    after(1100, () => {
      setBgReady(true);
      setTitleVisible(true);
      if (tagBlockRef.current) gsap.to(tagBlockRef.current, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
    });

    /* State 2 — Agent at hero size */
    after(1100 + TITLE_HOLD_MS, () => {
      setAgentVisible(true);
      setAgentMode('idle');
      if (mascotFloatRef.current) gsap.to(mascotFloatRef.current, {
        opacity: 1, y: 0, duration: AGENT_REVEAL_MS / 1000, ease: 'power3.out',
      });
    });

    /* State 3 — Reasoning reveal */
    const reasonStart = 1100 + TITLE_HOLD_MS + AGENT_REVEAL_MS + AGENT_HOLD_MS;
    after(reasonStart, () => {
      setReasoningVisible(true);
      setReasoningPlaying(true);
      setAgentMode('thinking');
      if (reasoningRef.current) gsap.to(reasoningRef.current, { opacity: 1, duration: 0.35, ease: 'power2.out' });
    });

    /* State 4 — Hero shrink (fires after reasoning hold) */
    const shrinkStart = reasonStart + REASONING_REVEAL_MS + REASONING_HOLD_MS;
    after(shrinkStart, () => {
      setReasoningPlaying(false);
      if (mascotFloatRef.current) gsap.to(mascotFloatRef.current, {
        scale: MASCOT_FINAL_SCALE, duration: HERO_SHRINK_MS / 1000, ease: 'power2.inOut',
      });
      if (reasoningRef.current) gsap.to(reasoningRef.current, {
        scale: REASONING_FINAL_SCALE, duration: HERO_SHRINK_MS / 1000, ease: 'power2.inOut',
      });
    });

    /* Agent look */
    const lookAt = shrinkStart + HERO_SHRINK_MS + HERO_SHRINK_HOLD_MS;
    after(lookAt, () => setAgentMode('looking'));

    /* State 5 — CTA pill only */
    after(lookAt + AGENT_LOOK_TO_CTA_MS, () => {
      setCtaVisible(true);
      if (ctaWrapRef.current) gsap.to(ctaWrapRef.current, {
        opacity: 1, y: 0, duration: CTA_PILL_REVEAL_MS / 1000, ease: 'power3.out',
      });
    });

    /* State 6 — Mascot FLIP arc */
    after(lookAt + AGENT_LOOK_TO_CTA_MS + 400, () => {
      const fEl = mascotFloatRef.current;
      const tEl = ctaMascotSlotRef.current;
      if (!fEl || !tEl) return;

      const fR = fEl.getBoundingClientRect();
      const tR = tEl.getBoundingClientRect();
      const dx = (tR.left + tR.width * 0.5) - (fR.left + fR.width / 2);
      const dy = (tR.top  + tR.height * 0.5) - (fR.top  + fR.height / 2);
      const arcH = Math.abs(dy) * 0.45 + 32;

      gsap.to(fEl, {
        duration: MASCOT_FLIP_MS / 1000, ease: 'power2.inOut',
        keyframes: [
          { x: dx * 0.5, y: dy * 0.5 - arcH, scale: 0.8, duration: (MASCOT_FLIP_MS / 1000) * 0.5, ease: 'power2.out' },
          { x: dx,       y: dy,               scale: 0.5, duration: (MASCOT_FLIP_MS / 1000) * 0.5, ease: 'power3.in'  },
        ],
        onComplete() {
          gsap.set(fEl, { opacity: 0 });
          gsap.to(fEl, { width: 0, duration: 0.2, ease: 'power2.in' });
          // setMascotInCta(true) causes React to mount the CTA mascot — no GSAP needed on the slot
          setMascotInCta(true);
          after(CTA_SETTLE_MS, () => {
            /* State 7 — CTA text */
            setCtaTextPlaying(true);
          });
        },
      });
    });

    /* State 8 — CTA text done → feedback → products (staggered) */
    const beamAt = lookAt + AGENT_LOOK_TO_CTA_MS + 400 + MASCOT_FLIP_MS + 220 + CTA_SETTLE_MS + CTA_TEXT_REVEAL_MS + BEAM_MARGIN_MS;
    after(beamAt, () => {
      setBeamActive(true);
      setCtaActive(true);
    });
    /* Feedback pill — smooth fade+rise, 400ms after CTA text done */
    after(beamAt + 400, () => {
      setFeedbackVisible(true);
    });
    /* Products — smooth fade+slide from right, 350ms after feedback */
    after(beamAt + 750, () => {
      setProductVisible(true);
      setDriftActive(true);
    });
  }, [after, startTicker]);

  /* ── CTA label clip expand ───────────────────────────────────────────── */
  useEffect(() => {
    if (!ctaTextPlaying || !ctaLabelClipRef.current || !ctaLabelRef.current) return;
    const w = ctaLabelRef.current.offsetWidth;
    gsap.fromTo(ctaLabelClipRef.current, { width: 0 }, {
      width: w, duration: CTA_TEXT_REVEAL_MS / 1000, ease: 'power1.inOut',
    });
  }, [ctaTextPlaying]);

  /* ── Drift animation ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (!driftActive || !containerRef.current) return;
    const tl = gsap.timeline({ repeat: -1, yoyo: true });
    tl.to(containerRef.current, {
      scale: BACKGROUND_DRIFT_SCALE,
      xPercent: BACKGROUND_DRIFT_PAN_X,
      yPercent: -BACKGROUND_DRIFT_PAN_Y,
      duration: BACKGROUND_DRIFT_MS / 1000,
      ease: 'sine.inOut',
    });
    return () => { tl.kill(); };
  }, [driftActive]);

  /* ── Mount / reset ───────────────────────────────────────────────────── */
  useEffect(() => {
    clearAll();
    const img = new Image();
    const fallback = setTimeout(() => runSequence(), 1200);
    img.onload = img.onerror = () => { clearTimeout(fallback); runSequence(); };
    img.src = CARD.image;
    return () => { clearTimeout(fallback); clearAll(); };
  }, [renderKey]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Jump to a specific state ────────────────────────────────────────── */
  const jumpToState = useCallback((target: LabState) => {
    clearAll();
    /* Jump by fast-forwarding all preceding state changes instantly */
    if (!bgRef.current) return;
    gsap.set(bgRef.current, { opacity: 1, scale: 1, yPercent: 0 });
    gsap.set(overlayRef.current, { opacity: 1 });
    gsap.set(headerRef.current, { opacity: 1, y: 0 });
    gsap.set(tagBlockRef.current, { opacity: 1, y: 0 });
    setBgReady(true);

    if (target >= 1) setTitleVisible(true);

    if (target >= 2) {
      setAgentVisible(true);
      gsap.set(mascotFloatRef.current, { opacity: 1, y: 0, scale: MASCOT_HERO_SCALE });
      gsap.set(reasoningRef.current, { opacity: 0, scale: MASCOT_HERO_SCALE });
      setAgentMode('idle');
    }

    if (target >= 3) {
      setReasoningVisible(true);
      setReasoningPlaying(true);
      setAgentMode('thinking');
      gsap.set(reasoningRef.current, { opacity: 1, scale: MASCOT_HERO_SCALE });
    }

    if (target >= 4) {
      setReasoningPlaying(false);
      setAgentMode('idle');
      gsap.set(mascotFloatRef.current, { scale: MASCOT_FINAL_SCALE });
      gsap.set(reasoningRef.current, { scale: REASONING_FINAL_SCALE });
    }

    if (target >= 5) {
      setAgentMode('looking');
      setCtaVisible(true);
      gsap.set(ctaWrapRef.current, { opacity: 1, y: 0 });
    }

    if (target >= 6) {
      setMascotInCta(true);
      gsap.set(mascotFloatRef.current, { opacity: 0, width: 0 });
    }

    if (target >= 7) {
      setCtaTextPlaying(true);
      setTimeout(() => {
        if (ctaLabelRef.current && ctaLabelClipRef.current) {
          ctaLabelClipRef.current.style.width = ctaLabelRef.current.offsetWidth + 'px';
        }
      }, 50);
    }

    if (target >= 8) {
      setBeamActive(true);
      setCtaActive(true);
      setDriftActive(true);
      setFeedbackVisible(true);
      setProductVisible(true);
    }

    /* Start ticker from the corresponding cumulative time */
    const stateTimes: Record<LabState, number> = {
      1: T.BG, 2: T.AGENT, 3: T.REASON, 4: T.SHRINK,
      5: T.CTA_ENTRY, 6: T.CTA_EXPAND, 7: T.CTA_TEXT, 8: T.HOLD,
    };
    const offset = stateTimes[target];
    startTimeRef.current  = performance.now() - offset;
    stateStartRef.current = performance.now();
    setLabState(target);
    setElapsed(offset);
    setStateElapsed(0);

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const tick = () => {
      const now   = performance.now();
      const total = now - (startTimeRef.current ?? now);
      setElapsed(total);
      const s = elapsedToState(total);
      setLabState(prev => { if (prev !== s) stateStartRef.current = now; return s; });
      setStateElapsed(now - (stateStartRef.current ?? now));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [clearAll]);

  /* ── Keyboard ────────────────────────────────────────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === DEV_OVERLAY_KEY || e.key === DEV_OVERLAY_KEY.toLowerCase()) {
        setShowInspector(v => !v); return;
      }
      if (e.key === 'r' || e.key === 'R') { setRenderKey(k => k + 1); return; }
      if (e.key === ' ') { e.preventDefault(); jumpToState(labState); return; }

      if (e.key === 'ArrowRight') { e.preventDefault(); jumpToState(Math.min(8, labState + 1) as LabState); return; }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); jumpToState(Math.max(1, labState - 1) as LabState); return; }

      /* Number shortcuts 1–8 */
      const n = parseInt(e.key);
      if (n >= 1 && n <= 8) { jumpToState(n as LabState); return; }

      /* Focus cycling with arrow down/up between CTA and feedback */
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && labState >= 8) {
        setFocusTarget(prev => prev === 'cta' ? 'feedback' : 'cta');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [labState, focusTarget, jumpToState]);

  /* ── Derived ─────────────────────────────────────────────────────────── */
  const ctaFocused = focusTarget === 'cta' && labState >= 8;
  const ctaBoxShadow = beamActive
    ? ctaFocused
      ? '0 0 0 3px rgba(255,255,255,0.3), 0 6px 32px rgba(0,0,0,0.22), 0 0 32px 8px rgba(112,71,226,0.5)'
      : '0 4px 24px rgba(0,0,0,0.14), 0 0 32px 8px rgba(112,71,226,0.38)'
    : ctaFocused
      ? '0 0 0 3px rgba(255,255,255,0.3)'
      : '0 4px 24px rgba(0,0,0,0.12)';

  const BOTTOM = 72; // px from bottom

  return (
    <div ref={containerRef} style={{
      position: 'relative', width: 1920, height: 1080,
      overflow: 'hidden', background: '#040208',
      transformOrigin: 'center center',
    }}>
      {/* ── BG image ─────────────────────────────────────────────────── */}
      <div ref={bgRef} style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${CARD.image})`,
        backgroundSize: 'cover', backgroundPosition: 'center 32%',
        willChange: 'transform, opacity', zIndex: 1,
      }} />

      {/* ── Overlay scrim (Figma-spec multi-layer) ───────────────────── */}
      <div ref={overlayRef} style={{
        position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
        background: [
          'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 28%, rgba(0,0,0,0.08) 52%, transparent 68%)',
          'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.25) 18%, transparent 36%)',
          'linear-gradient(to right, rgba(0,0,0,0.50) 0%, rgba(0,0,0,0.18) 36%, transparent 60%)',
        ].join(', '),
      }} />

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div ref={headerRef} style={{
        position: 'absolute', top: 56, left: LAYOUT.CONTENT_LEFT, right: LAYOUT.CONTENT_LEFT,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        zIndex: 30, willChange: 'opacity, transform',
      }}>
        <img src="/glance-logo.png" alt="glance" style={{ height: 34, width: 'auto', objectFit: 'contain' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 26, color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, system-ui', fontWeight: 500, letterSpacing: '-0.01em' }}>
            ☁ 31°
          </span>
          <span style={{ fontSize: 26, color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, system-ui', fontWeight: 500 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
          <span style={{ fontSize: 32, color: '#fff', fontFamily: '"Plus Jakarta Sans", system-ui', fontWeight: 400, letterSpacing: '0.02em', fontVariantNumeric: 'tabular-nums' }}>
            {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false })}
          </span>
        </div>
      </div>

      {/* ── Tag + Title block (Figma: top:228, left:80, width:360) ───── */}
      <div ref={tagBlockRef} style={{
        position: 'absolute', top: LAYOUT.TITLE_TOP, left: LAYOUT.CONTENT_LEFT, width: 480,
        zIndex: 20, display: 'flex', flexDirection: 'column', gap: 16,
        willChange: 'opacity, transform',
      }}>
        {/* Tag row — vertical bar + word-by-word reveal */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <WordReveal
            words={[CARD.tag1]}
            fontSize={22} fontWeight={500} fontFamily="Inter, system-ui"
            staggerMs={90} durationMs={480} delayMs={0}
            playing={titleVisible}
            suffix={
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 12 }}>
                <div style={{ width: 8, height: 3, background: '#fff', borderRadius: 10 }} />
                <WordReveal
                  words={[CARD.tag2]}
                  fontSize={22} fontWeight={500} fontFamily="Inter, system-ui"
                  staggerMs={90} durationMs={480} delayMs={220}
                  playing={titleVisible}
                />
              </div>
            }
            prefix={<div style={{ width: 3, height: 32, background: '#fff', borderRadius: 4, flexShrink: 0, marginRight: 16 }} />}
          />
        </div>
        {/* Title — word-by-word, starts 180ms after tag */}
        {titleVisible && (
          <WordReveal
            words={CARD.title.split(' ')}
            fontSize={28} fontWeight={700} fontFamily='"Plus Jakarta Sans", system-ui'
            staggerMs={80} durationMs={520} delayMs={180}
            playing={titleVisible}
            textShadow="0 1px 4px rgba(0,0,0,0.15)"
            wrap
          />
        )}
      </div>

      {/* ── Mascot float — sits directly above the reasoning block ────── */}
      {agentVisible && (
        <div ref={mascotFloatRef} style={{
          position: 'absolute',
          top: LAYOUT.REASONING_TOP - MASCOT_HERO_SIZE - 20,
          left: LAYOUT.CONTENT_LEFT,
          willChange: 'opacity, transform, width',
          zIndex: 25,
          transformOrigin: 'left center',
        }}>
          <AgentMascot agentMode={agentMode} size={MASCOT_HERO_SIZE} />
        </div>
      )}

      {/* ── Reasoning text (Figma: top:808, left:80, w:960, size:32px) ─ */}
      {reasoningVisible && (
        <p ref={reasoningRef} style={{
          position: 'absolute',
          top: LAYOUT.REASONING_TOP,
          left: LAYOUT.CONTENT_LEFT,
          width: 960,
          zIndex: 20,
          margin: 0,
          fontFamily: '"Plus Jakarta Sans", system-ui',
          fontWeight: 400,
          fontSize: 32,
          lineHeight: 1.35,
          letterSpacing: '0.01em',
          color: 'rgba(255,255,255,0.8)',
          willChange: 'opacity, transform',
          transformOrigin: 'left top',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          <GlanceTextReveal
            text={CARD.reasoning}
            highlights={CARD.reasoningHls}
            twoLine={false}
            playing={reasoningPlaying}
            resolvedOpacity={0.8}
            resolveMs={REASONING_REVEAL_MS}
            onDone={() => {}}
          />
        </p>
      )}

      {/* ── Bottom row: CTA + Feedback + Shop ───────────────────────── */}
      <div style={{
        position: 'absolute',
        bottom: BOTTOM,
        left: 0, right: 0,
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
      }}>
        {/* CTA pill (Figma: left:80, h:72, rounded:72) */}
        {ctaVisible && (
          <div ref={ctaWrapRef} style={{ marginLeft: LAYOUT.CONTENT_LEFT, willChange: 'opacity, transform', flexShrink: 0 }}>
            <button
              tabIndex={-1}
              onClick={() => ctaActive && setFocusTarget('cta')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 0,
                height: LAYOUT.CTA_HEIGHT,
                paddingLeft: 8,
                paddingRight: mascotInCta ? 28 : 8,
                borderRadius: LAYOUT.CTA_RADIUS,
                background: mascotInCta ? (ctaFocused ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.95)') : 'transparent',
                border: 'none',
                cursor: ctaActive ? 'pointer' : 'default',
                outline: 'none',
                boxShadow: ctaBoxShadow,
                transform: ctaFocused ? 'scale(1.03)' : 'scale(1)',
                transition: 'background 0.25s, box-shadow 0.5s, transform 0.2s, padding-right 0.3s',
                whiteSpace: 'nowrap',
              }}
            >
              {/* Mascot slot inside CTA — only rendered after the flip lands */}
              <div ref={ctaMascotSlotRef} style={{
                flexShrink: 0,
                width: mascotInCta ? MASCOT_CTA_SIZE : 0,
                height: MASCOT_CTA_SIZE,
                marginRight: mascotInCta ? 10 : 0,
                overflow: 'hidden',
                willChange: 'opacity, transform, width',
                transition: 'margin-right 0.3s, width 0.2s',
              }}>
                {mascotInCta && (
                  <AgentMascot agentMode="looking" size={MASCOT_CTA_SIZE} />
                )}
              </div>
              {/* CTA label clip-reveal */}
              <div ref={ctaLabelClipRef} style={{
                overflow: 'hidden', position: 'relative', width: 0,
                height: LAYOUT.CTA_HEIGHT, flexShrink: 0,
              }}>
                <span ref={ctaLabelRef} style={{
                  position: 'absolute', top: '50%', left: 0,
                  transform: 'translateY(-50%)',
                  width: 'max-content',
                  fontSize: 24, fontWeight: 600, color: '#111',
                  fontFamily: '"Plus Jakarta Sans", system-ui',
                  letterSpacing: '0.01em', whiteSpace: 'nowrap',
                }}>
                  <GlanceTextReveal
                    text={CARD.ctaLabel}
                    twoLine={false}
                    playing={ctaTextPlaying}
                    resolvedOpacity={1}
                    resolveMs={CTA_TEXT_REVEAL_MS}
                    onDone={() => {}}
                  />
                </span>
              </div>
            </button>
          </div>
        )}

        {/* Feedback — single dark pill (Figma: left:602, thumbs-up + thumbs-down icon) */}
        <div ref={feedbackWrapRef} style={{
          position: 'absolute',
          left: LAYOUT.FEEDBACK_LEFT,
          bottom: 0,
          opacity: feedbackVisible ? 1 : 0,
          transform: feedbackVisible ? 'translateY(0px)' : 'translateY(14px)',
          transition: 'opacity 0.65s cubic-bezier(0.16,1,0.3,1), transform 0.65s cubic-bezier(0.16,1,0.3,1)',
          pointerEvents: feedbackVisible ? 'auto' : 'none',
        }}>
          <button
            onClick={() => setFocusTarget(t => t === 'feedback' ? 'cta' : 'feedback')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '16px 20px',
              background: 'linear-gradient(180deg, rgba(20,20,20,0.9) 0%, rgba(0,0,0,0.9) 100%)',
              backdropFilter: 'blur(16.875px)', WebkitBackdropFilter: 'blur(16.875px)',
              border: '2px solid rgba(255,255,255,1)',
              borderRadius: 36,
              cursor: 'pointer', outline: 'none',
            }}
          >
            <FeedbackIcon />
          </button>
        </div>

        {/* Products — stacked images only, no text, no border (Figma: left:1752, size:80) */}
        <div ref={shopCardRef} style={{
          position: 'absolute',
          left: 1752,
          bottom: 4,
          width: 80,
          height: 80,
          opacity: productVisible ? 1 : 0,
          transform: productVisible ? 'translateX(0px)' : 'translateX(28px)',
          transition: 'opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)',
          pointerEvents: 'none',
        }}>
          {/* Back image: rotated 10°, offset */}
          <div style={{
            position: 'absolute', top: 0, left: 15, width: 72, height: 72,
            borderRadius: 16, border: '3px solid #fff',
            background: '#c1b4a1',
            transform: 'rotate(10deg)',
            boxShadow: '0 0 7px rgba(0,0,0,0.3)',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(145deg, #d4c5b0, #a89880)' }} />
          </div>
          {/* Front image */}
          <div style={{
            position: 'absolute', top: 0, left: 0, width: 80, height: 80,
            borderRadius: 18, border: '3px solid #fff',
            background: '#c1b4a1',
            boxShadow: '0 0 8px rgba(0,0,0,0.3)',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(145deg, #e8ddd0, #beb0a0)' }} />
          </div>
        </div>
      </div>

      {/* ── Lab watermark ─────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
        zIndex: 9998,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.07)', borderRadius: 999,
        padding: '4px 14px',
        fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.28)',
        fontFamily: '"Plus Jakarta Sans", system-ui',
        pointerEvents: 'none',
      }}>
        L0 T1 Motion Lab — Dev Handoff — Not Production
      </div>

      {/* ── State inspector ───────────────────────────────────────────── */}
      {showInspector && (
        <Inspector
          currentState={labState}
          elapsed={elapsed}
          stateElapsed={stateElapsed}
          onJump={jumpToState}
        />
      )}

      {/* ── Timeline scrub bar ────────────────────────────────────────── */}
      {showInspector && (
        <div style={{
          position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(8,4,20,0.82)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999,
          padding: '8px 16px',
        }}>
          {/* Prev */}
          <button onClick={() => jumpToState(Math.max(1, labState - 1) as LabState)} style={scrubBtnStyle}>
            ← Prev
          </button>
          {/* Replay */}
          <button onClick={() => jumpToState(labState)} style={{ ...scrubBtnStyle, color: '#a78bfa' }}>
            ↺ Replay
          </button>
          {/* Next */}
          <button onClick={() => jumpToState(Math.min(8, labState + 1) as LabState)} style={scrubBtnStyle}>
            Next →
          </button>
          <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.12)', margin: '0 4px' }} />
          {/* Replay all */}
          <button onClick={() => setRenderKey(k => k + 1)} style={{ ...scrubBtnStyle, color: 'rgba(255,255,255,0.4)' }}>
            ↺ All
          </button>
        </div>
      )}
    </div>
  );
}

const scrubBtnStyle: React.CSSProperties = {
  background: 'transparent', border: 'none', cursor: 'pointer',
  fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.55)',
  fontFamily: '"Plus Jakarta Sans", system-ui', letterSpacing: '0.04em',
  padding: '2px 6px', borderRadius: 4, outline: 'none',
};
