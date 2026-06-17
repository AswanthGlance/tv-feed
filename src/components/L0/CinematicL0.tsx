/**
 * CinematicL0 — HERO REASONING redesign.
 *
 * alignment = 'left'   → tag/title top-left, agent+reasoning left, products right
 * alignment = 'center' → tag/title top-left, agent+reasoning centered, products right
 * alignment = 'right'  → tag/title top-left, agent+reasoning right, no products
 *
 * Animation order:
 *  1. BG  2. Header  3. Tag + title fade in top-left  4. Mascot at hero size
 *  5. Reasoning at hero size (character blur reveal)
 *  6. Mascot + reasoning shrink to final resting size
 *  7. Mascot FLIP → CTA  8. CTA types  9. Products (left + center only)
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { FeedItem } from '../../data/types';
import type { AgentMode } from '../Shared/AgentMascot';
import type { GlanceLayout } from '../../config/glanceConfig';
import AgentMascot from '../Shared/AgentMascot';
import GlanceTextReveal, { RESOLVE_MS_REASONING, RESOLVE_MS_CTA } from '../Shared/GlanceTextReveal';
import { gsap } from 'gsap';
import { buildL0Timeline, killL0Timeline } from '../../animations/l0Timeline';
import { getHighlights } from '../../logic/reasoningEngine';
import { getConversationalCTA } from '../../logic/ctaGenerator';

/* ── Constants ────────────────────────────────────────────────────────────── */
const LOGO_SRC = '/glance-logo.png';

/* Word-mask split for the metadata title — same DOM structure as the hero title
   so titleReveal.ts can animate the word-inner spans */
function splitToWords(text: string) {
  return text.split(' ').map((word, i, arr) => (
    <span key={i} className="word-mask" style={{
      display: 'inline-block', overflow: 'hidden',
      paddingBottom: '0.06em', lineHeight: 'inherit',
      marginRight: i < arr.length - 1 ? '0.24em' : 0,
    }}>
      <span className="word-inner" style={{ display: 'inline-block', willChange: 'transform', lineHeight: 'inherit' }}>
        {word}
      </span>
    </span>
  ));
}

/* Header animates only once per session */
let headerHasAnimated = false;

/*
 * Mascot sizes:
 *   HERO  — while reasoning is being delivered (prominent)
 *   FINAL — resting state before CTA
 *   CTA   — inside the pill (unchanged)
 */
const MASCOT_HERO_SIZE  = 80;
const MASCOT_FINAL_SIZE = 52;
const MASCOT_CTA_SIZE   = 52;

/*
 * Scale factors used by the GSAP timeline.
 * We render the mascot at HERO size and scale it to FINAL with GSAP.
 */
const MASCOT_HERO_SCALE  = 1.0;
const MASCOT_FINAL_SCALE = MASCOT_FINAL_SIZE / MASCOT_HERO_SIZE;

/*
 * Reasoning font sizes:
 *   HERO  — while agent is speaking
 *   FINAL — resting state
 * GSAP scales the element (not font-size) for a smooth, snap-free transition.
 */
const REASONING_HERO_FS  = 'clamp(18px, 2.2vw, 32px)';
/* The scale ratio targets approximately the small final size visually */
const REASONING_HERO_SCALE  = 1.0;
const REASONING_FINAL_SCALE = 0.72; /* visually ~clamp(13px,1.35vw,20px) */

/* Per-alignment geometry — content column position + text alignment only.
   Tag/title position is always absolute top-left (shared below). */
const GEO = {
  left: {
    contentLeft:  'clamp(20px, 4.5vw, 88px)',
    contentRight: undefined as string | undefined,
    contentWidth: 'clamp(240px, 52vw, 860px)',
    textAlign:    'left'  as const,
    ctaJustify:   'flex-start' as const,
  },
  center: {
    contentLeft:  '50%',
    contentRight: undefined as string | undefined,
    contentWidth: 'clamp(400px, 72vw, 1100px)',
    textAlign:    'center' as const,
    ctaJustify:   'center' as const,
  },
  right: {
    contentLeft:  undefined as string | undefined,
    contentRight: 'clamp(20px, 4.5vw, 88px)',
    contentWidth: 'clamp(400px, 80vw, 1100px)',
    textAlign:    'right' as const,
    ctaJustify:   'flex-end' as const,
  },
};

const CARD_COLORS = [
  { front: 'linear-gradient(145deg,#c45e1a 0%,#e8863a 55%,#f0a060 100%)' },
  { front: 'linear-gradient(145deg,#1a6045 0%,#2a8f62 55%,#3db882 100%)' },
];

const LABEL_MAP: Record<string, string> = {
  'masala-dosa':   'Masala Dosa',
  'filter-coffee': 'Filter Coffee',
  'idli-vada':     'Idli & Vada',
};
const s2l = (s: string) =>
  LABEL_MAP[s] ?? s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const CATEGORY_TAG: Record<string, string> = {
  food:          'Food Pick',
  fashion:       'Style Pick',
  travel:        'Travel Pick',
  wellness:      'Wellness Pick',
  home:          'Home Pick',
  sports:        'Sports Pick',
  entertainment: 'Entertainment',
  luxury:        'Luxury Pick',
  beauty:        'Beauty Pick',
  hobbies:       'Discover',
};

function getTagLabel(item: FeedItem): string {
  if (item.locationLabel) return item.locationLabel;
  return CATEGORY_TAG[item.category] ?? s2l(item.category);
}

/* Timing aliases — use shared constants from GlanceTextReveal */
const REASONING_RESOLVE_MS = RESOLVE_MS_REASONING;
const CTA_RESOLVE_MS       = RESOLVE_MS_CTA;

/* ── Props ────────────────────────────────────────────────────────────────── */
type Props = {
  item:         FeedItem;
  reasoning:    string;
  paused?:      boolean;
  ctaFocused:   boolean;
  onCTAClick:   () => void;
  alignment:    GlanceLayout;
  showProducts: boolean;
};

/* ── Component ────────────────────────────────────────────────────────────── */
export default function CinematicL0({
  item, reasoning, paused = false, ctaFocused, onCTAClick, alignment, showProducts,
}: Props) {
  const geo = GEO[alignment];

  /* ── Refs ───────────────────────────────────────────────────────────── */
  const containerRef    = useRef<HTMLDivElement>(null);
  const bgRef           = useRef<HTMLDivElement>(null);
  const overlayRef      = useRef<HTMLDivElement>(null);
  const headerRef       = useRef<HTMLDivElement>(null);
  const tagRef          = useRef<HTMLDivElement>(null);
  const titleRef        = useRef<HTMLHeadingElement>(null);
  const mascotFloatRef  = useRef<HTMLDivElement>(null);
  const mascotSpacerRef = useRef<HTMLDivElement>(null);
  const reasoningRef    = useRef<HTMLParagraphElement>(null);
  const ctaWrapRef      = useRef<HTMLDivElement>(null);
  const ctaPillRef      = useRef<HTMLButtonElement>(null);
  const ctaBeamOuterRef = useRef<HTMLDivElement>(null);
  const ctaMascotSlotRef= useRef<HTMLDivElement>(null);
  const ctaLabelRef     = useRef<HTMLSpanElement>(null);
  const ctaLabelClipRef = useRef<HTMLDivElement>(null);
  const cardRef         = useRef<HTMLDivElement>(null);
  const card0Ref        = useRef<HTMLDivElement>(null);
  const card1Ref        = useRef<HTMLDivElement>(null);

  /* ── State ──────────────────────────────────────────────────────────── */
  const [reasoningPlaying, setReasoningPlaying] = useState(false);
  const [mascotLooking,    setMascotLooking]    = useState(false);
  const [ctaTextPlaying,   setCtaTextPlaying]   = useState(false);
  const [ctaVisible,       setCtaVisible]       = useState(false);
  const [ctaActive,        setCtaActive]        = useState(false);
  const [beamActive,       setBeamActive]       = useState(false);
  const [mascotGone,       setMascotGone]       = useState(false);
  const [clock, setClock] = useState(() =>
    new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      .replace(/\s?[AP]M/i, ''));
  const [ampm, setAmpm] = useState(() => new Date().getHours() < 12 ? 'AM' : 'PM');

  const tlRef       = useRef<gsap.core.Timeline | null>(null);
  const timersRef   = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [prevImage, setPrevImage] = useState(item.image);

  /* Clock tick */
  useEffect(() => {
    const t = setInterval(() => {
      const n = new Date();
      setClock(n.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/\s?[AP]M/i, ''));
      setAmpm(n.getHours() < 12 ? 'AM' : 'PM');
    }, 30_000);
    return () => clearInterval(t);
  }, []);

  /* Main animation */
  useEffect(() => {
    setReasoningPlaying(false);
    setMascotLooking(false);
    setCtaTextPlaying(false);
    setCtaVisible(false);
    setCtaActive(false);
    setBeamActive(false);
    setMascotGone(false);
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    killL0Timeline(tlRef.current, [
      bgRef.current, overlayRef.current, headerRef.current, tagRef.current,
      titleRef.current, mascotFloatRef.current, reasoningRef.current,
      ctaWrapRef.current, ctaMascotSlotRef.current,
      card0Ref.current, card1Ref.current,
    ]);

    const typingDuration  = REASONING_RESOLVE_MS;
    const ctaRevealDuration = CTA_RESOLVE_MS;

    function startTimeline() {
      const animateHeader = !headerHasAnimated;
      headerHasAnimated = true;

      tlRef.current = buildL0Timeline(
        {
          bg:            bgRef.current,
          overlay:       overlayRef.current,
          header:        headerRef.current,
          tagEl:         tagRef.current,
          titleEl:       titleRef.current,
          mascotFloat:   mascotFloatRef.current,
          reasoning:     reasoningRef.current,
          ctaWrap:       ctaWrapRef.current,
          ctaPill:       ctaPillRef.current,
          ctaBeam:       ctaBeamOuterRef.current,
          ctaMascotSlot: ctaMascotSlotRef.current,
          card:          cardRef.current,
          cards:         [card0Ref.current, card1Ref.current],
          container:     containerRef.current,
        },
        {
          typingDuration,
          ctaRevealDuration,
          mascotHeroScale:      MASCOT_HERO_SCALE,
          mascotFinalScale:     MASCOT_FINAL_SCALE,
          reasoningHeroScale:   REASONING_HERO_SCALE,
          reasoningFinalScale:  REASONING_FINAL_SCALE,
          alignment,
          showProducts,
          animateHeader,
          onTypingStart:    () => setReasoningPlaying(true),
          onAgentLook:      () => setMascotLooking(true),
          onCTATypingStart: () => { setCtaVisible(true); setCtaTextPlaying(true); },
          onBeamStart:      () => { setBeamActive(true); setCtaActive(true); },
          onMascotGone:     () => setMascotGone(true),
        },
      );
    }

    const img = new Image();
    const fallback = setTimeout(startTimeline, 1500);
    img.onload = img.onerror = () => { clearTimeout(fallback); startTimeline(); };
    img.src = item.image;
    const prevTimer = setTimeout(() => setPrevImage(item.image), 1100);
    timersRef.current.push(prevTimer);

    return () => {
      clearTimeout(fallback);
      timersRef.current.forEach(clearTimeout);
      killL0Timeline(tlRef.current);
    };
  }, [item.id, alignment]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Pause / resume the GSAP timeline and any active GlanceTextReveal tweens */
  useEffect(() => {
    if (paused) {
      tlRef.current?.pause();
      gsap.globalTimeline.pause();
    } else {
      gsap.globalTimeline.resume();
      tlRef.current?.resume();
    }
    return () => { gsap.globalTimeline.resume(); };
  }, [paused]);

  /* CTA label clip: GSAP grows clip width to reveal text.
     The inner span is absolutely positioned so it lays out at its natural
     width regardless of the clip container's current width — no wrapping. */
  useEffect(() => {
    if (!ctaTextPlaying || !ctaLabelClipRef.current || !ctaLabelRef.current) return;
    const fullWidth = ctaLabelRef.current.offsetWidth;
    gsap.fromTo(ctaLabelClipRef.current,
      { width: 0 },
      { width: fullWidth, duration: CTA_RESOLVE_MS / 1000, ease: 'power1.inOut' },
    );
  }, [ctaTextPlaying]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Center spacer collapse when mascot leaves */
  useEffect(() => {
    if (!mascotGone || alignment !== 'center') return;
    const spacer = mascotSpacerRef.current;
    if (!spacer) return;
    const currentH = spacer.offsetHeight;
    gsap.fromTo(spacer,
      { height: currentH, marginBottom: spacer.style.marginBottom || 0 },
      { height: 0, marginBottom: 0, duration: 0.65, ease: 'power2.inOut',
        onComplete: () => { spacer.style.overflow = 'hidden'; } }
    );
  }, [mascotGone, alignment]);

  /* ── Derived ────────────────────────────────────────────────────────── */
  const highlights      = getHighlights(item, reasoning);
  const onReasoningDone = useCallback(() => { /* GSAP calls onAgentLook; nothing extra needed */ }, []);
  const onCtaRevealDone = useCallback(() => { /* beam handled by onBeamStart from timeline */ }, []);
  const ctaLabel        = getConversationalCTA(item);

  const derivedMascotMode: AgentMode =
    mascotLooking    ? 'looking'  :
    reasoningPlaying ? 'thinking' :
                       'idle';

  const rawSubs    = item.subCategories.slice(0, 2);
  while (rawSubs.length < 2) rawSubs.push(item.category);
  const cardLabels = rawSubs.map(s2l);
  const cardRefs   = [card0Ref, card1Ref];

  const TILE    = 'clamp(68px, 8vw, 96px)';
  const TILE_BR = 'clamp(12px, 1.4vw, 18px)';
  const BOTTOM  = 'clamp(28px, 5vh, 56px)';

  const contentTransform = alignment === 'center' ? 'translateX(-50%)' : undefined;

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Persistent prev-image layer */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${prevImage})`,
        backgroundSize: 'cover', backgroundPosition: 'center 32%',
        zIndex: 0,
      }} />

      {/* BG — animated layer */}
      <div ref={bgRef} style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${item.image})`,
        backgroundSize: 'cover', backgroundPosition: 'center 32%',
        willChange: 'transform, opacity',
        zIndex: 1,
      }} />

      {/* OVERLAY */}
      <div ref={overlayRef} style={{
        position: 'absolute', inset: 0,
        background: [
          'linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.50) 28%, rgba(0,0,0,0.06) 55%, transparent 70%)',
          'linear-gradient(to bottom, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.22) 18%, transparent 38%)',
          alignment === 'right'
            ? 'linear-gradient(to left, rgba(0,0,0,0.60) 0%, rgba(0,0,0,0.20) 40%, transparent 65%)'
            : 'linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 40%, transparent 65%)',
        ].join(', '),
        pointerEvents: 'none',
        zIndex: 2,
      }} />

      {/* HEADER — logo left, time/date right */}
      <div ref={headerRef} style={{
        position: 'absolute',
        top: 'clamp(16px, 3vh, 48px)',
        left: 'clamp(20px, 4.5vw, 88px)',
        right: 'clamp(20px, 4.5vw, 88px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        zIndex: 30, willChange: 'opacity, transform',
      }}>
        <img
          src={LOGO_SRC}
          alt="glance"
          style={{
            height: 'clamp(26px, 3.2vh, 48px)',
            width: 'auto', display: 'block',
            flexShrink: 0, objectFit: 'contain', objectPosition: 'left center',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(5px,0.7vw,10px)' }}>
          <span style={{ fontSize: 'clamp(10px,1.1vw,18px)', color: 'rgba(255,255,255,0.45)', fontFamily: 'system-ui', fontWeight: 500 }}>
            ☁ 65°
          </span>
          <span style={{ fontSize: 'clamp(10px,1.1vw,18px)', color: 'rgba(255,255,255,0.45)', fontFamily: 'system-ui', fontWeight: 500 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
          <span style={{ fontSize: 'clamp(10px,1.1vw,18px)', color: '#ffffff', fontFamily: 'system-ui', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
            {clock} {ampm}
          </span>
        </div>
      </div>

      {/* TAG + TITLE — always top-left, small metadata, all alignments */}
      <div style={{
        position: 'absolute',
        top: 'clamp(80px, 12vh, 140px)',
        left: 'clamp(20px, 4.5vw, 88px)',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 'clamp(6px, 0.8vh, 10px)',
        maxWidth: 'clamp(300px, 45vw, 700px)',
      }}>
        {/* TAG */}
        <div ref={tagRef} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.10)',
          border: '1px solid rgba(255,255,255,0.16)',
          borderRadius: 999,
          padding: 'clamp(3px,0.4vh,5px) clamp(8px,1vw,13px)',
          backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          willChange: 'opacity',
          alignSelf: 'flex-start',
        }}>
          <span style={{
            fontSize: 'clamp(8px,0.8vw,11px)', fontWeight: 700,
            color: 'rgba(255,255,255,0.72)', letterSpacing: '0.11em',
            textTransform: 'uppercase', fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
          }}>{getTagLabel(item)}</span>
        </div>

        {/* TITLE — small, metadata role */}
        <h1 ref={titleRef} style={{
          margin: 0,
          fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
          fontWeight: 700,
          fontSize: 'clamp(18px, 2.2vw, 34px)',
          lineHeight: 1.15,
          letterSpacing: '-0.018em',
          color: 'rgba(255,255,255,0.88)',
          textShadow: '0 2px 16px rgba(0,0,0,0.55)',
          willChange: 'transform',
          textAlign: 'left',
          transformOrigin: 'left bottom',
        }}>
          {splitToWords(item.title)}
        </h1>
      </div>

      {/* CONTENT COLUMN — agent + reasoning + CTA */}
      <div style={{
        position: 'absolute',
        left:   alignment === 'right' ? 0 : geo.contentLeft,
        right:  geo.contentRight,
        bottom: BOTTOM,
        width:  alignment === 'right' ? undefined : geo.contentWidth,
        transform: contentTransform,
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}>

        {/* MASCOT — center: standalone above reasoning; left/right: inline */}
        {alignment === 'center' && (
          <div ref={mascotSpacerRef} style={{
            marginBottom: 'clamp(10px, 1.5vh, 18px)',
            flexShrink: 0,
            width: '100%',
          }}>
            <div ref={mascotFloatRef} style={{
              display: 'flex', justifyContent: 'center',
              willChange: 'opacity, transform',
              pointerEvents: 'none',
            }}>
              <AgentMascot agentMode={derivedMascotMode} size={MASCOT_HERO_SIZE} />
            </div>
          </div>
        )}

        {/* REASONING ROW (with inline mascot for left/right) */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          flexDirection: alignment === 'right' ? 'row-reverse' : 'row',
          justifyContent: alignment === 'center' ? 'center' : 'flex-start',
          gap: alignment !== 'center' && !mascotGone ? 'clamp(8px,1.2vw,16px)' : 0,
          marginBottom: 'clamp(18px, 2.8vh, 32px)',
          overflow: 'visible',
        }}>
          {/* Inline mascot for left + right */}
          {alignment !== 'center' && (
            <div ref={mascotFloatRef} style={{
              flexShrink: 0,
              width:  mascotGone ? 0 : MASCOT_HERO_SIZE,
              height: mascotGone ? 0 : MASCOT_HERO_SIZE,
              overflow: 'hidden',
              willChange: 'opacity, transform, width',
              pointerEvents: 'none',
            }}>
              <AgentMascot agentMode={derivedMascotMode} size={MASCOT_HERO_SIZE} />
            </div>
          )}

          {/* REASONING — hero font size; GSAP will scale down to final */}
          <p ref={reasoningRef} style={{
            margin: 0,
            flex: alignment === 'center' ? undefined : 1,
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            fontWeight: 400,
            fontSize: REASONING_HERO_FS,
            lineHeight: 1.65,
            color: 'rgba(255,255,255,0.78)',
            textShadow: '0 1px 6px rgba(0,0,0,0.4), 0 0 20px rgba(192,132,252,0.18)',
            willChange: 'opacity, transform',
            maxWidth: alignment === 'center' ? 'clamp(400px, 55vw, 760px)' : 'none',
            width: '100%',
            textAlign: geo.textAlign,
            transformOrigin:
              alignment === 'center' ? 'center top' :
              alignment === 'right'  ? 'right top'  :
                                       'left top',
          }}>
            <GlanceTextReveal
              text={reasoning}
              highlights={highlights}
              twoLine
              playing={reasoningPlaying}
              resolvedOpacity={0.78}
              resolveMs={REASONING_RESOLVE_MS}
              onDone={onReasoningDone}
            />
          </p>
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', justifyContent: geo.ctaJustify }}>
          <div ref={ctaWrapRef} style={{ willChange: 'opacity, transform' }}>
            <div ref={ctaBeamOuterRef}>
              <button
                ref={ctaPillRef}
                tabIndex={-1}
                onClick={onCTAClick}
                style={{
                  display: 'inline-flex', alignItems: 'center',
                  justifyContent: alignment === 'right' ? 'flex-end' : 'flex-start',
                  gap: 0,
                  height: 'clamp(52px,5.8vh,68px)',
                  paddingLeft: 8,
                  paddingRight: 'clamp(14px,1.8vw,24px)',
                  borderRadius: 999,
                  background: !mascotGone ? 'transparent' : ctaFocused ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.95)',
                  transition: 'background 0.25s ease, box-shadow 0.5s ease, transform 0.2s',
                  border: 'none',
                  cursor: ctaActive ? 'pointer' : 'default',
                  outline: 'none',
                  boxShadow: beamActive
                    ? ctaFocused
                      ? '0 0 0 3px rgba(255,255,255,0.4), 0 6px 32px rgba(0,0,0,0.22), 0 0 32px 8px rgba(112,71,226,0.45)'
                      : '0 4px 24px rgba(0,0,0,0.14), 0 0 32px 8px rgba(112,71,226,0.38)'
                    : ctaFocused
                      ? '0 0 0 3px rgba(255,255,255,0.4), 0 6px 32px rgba(0,0,0,0.22)'
                      : '0 4px 24px rgba(0,0,0,0.12)',
                  transform: ctaFocused ? 'scale(1.04)' : 'scale(1)',
                  whiteSpace: 'nowrap',
                }}
              >
                <div ref={ctaMascotSlotRef} style={{
                  flexShrink: 0,
                  width: MASCOT_CTA_SIZE, height: MASCOT_CTA_SIZE,
                  marginRight: ctaVisible ? 10 : 0,
                  position: 'relative', willChange: 'opacity, transform',
                  transition: 'margin-right 0.3s ease',
                }}>
                  <AgentMascot agentMode="looking" size={MASCOT_CTA_SIZE} />
                </div>

                {/* Clip wrapper: overflow:hidden container that GSAP grows.
                    Inner span is absolutely positioned so it always lays out
                    at natural width — never wraps regardless of clip width. */}
                <div ref={ctaLabelClipRef} style={{
                  position: 'relative',
                  overflow: 'hidden',
                  width: 0,
                  height: 'clamp(52px,5.8vh,68px)',
                  flexShrink: 0,
                }}>
                  <span ref={ctaLabelRef} style={{
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    transform: 'translateY(-50%)',
                    width: 'max-content',
                    fontSize: 'clamp(13px,1.35vw,20px)',
                    fontWeight: 600, color: '#111',
                    fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
                    whiteSpace: 'nowrap',
                  }}>
                    <GlanceTextReveal
                      text={ctaLabel}
                      twoLine={false}
                      playing={ctaTextPlaying}
                      resolvedOpacity={1}
                      resolveMs={CTA_RESOLVE_MS}

                      onDone={onCtaRevealDone}
                    />
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PRODUCT CARDS — right-anchored; only for left + center */}
      {showProducts && (
        <div style={{
          position: 'absolute',
          bottom: BOTTOM,
          right: 'clamp(20px,3.5vw,60px)',
          zIndex: 20,
          width: `calc(${TILE} + 18px)`,
          height: TILE,
          overflow: 'visible',
        }}>
          {cardLabels.map((label, i) => {
            const col = CARD_COLORS[i % CARD_COLORS.length];
            return (
              <div
                key={label}
                ref={cardRefs[i]}
                style={{
                  position: 'absolute',
                  top: 0, left: 0,
                  width: TILE, height: TILE,
                  borderRadius: TILE_BR,
                  border: `2.5px solid rgba(255,255,255,${i === 0 ? 0.96 : 0.85})`,
                  boxShadow: `0 ${4 + i * 2}px ${18 + i * 4}px rgba(0,0,0,0.42)`,
                  background: col.front,
                  overflow: 'hidden',
                  display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                  willChange: 'transform, opacity',
                  zIndex: 2 - i,
                }}
              >
                <div style={{
                  background: 'linear-gradient(to top,rgba(0,0,0,0.72) 0%,transparent 100%)',
                  padding: 'clamp(5px,0.7vh,9px) clamp(5px,0.6vw,7px)',
                  fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
                  fontSize: 'clamp(8px,0.85vw,11px)', fontWeight: 700,
                  color: 'rgba(255,255,255,0.94)', letterSpacing: 0.3,
                  lineHeight: 1.2, textTransform: 'uppercase',
                }}>
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PAUSE INDICATOR */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        pointerEvents: 'none',
        opacity: paused ? 1 : 0,
        transition: 'opacity 0.2s ease',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          background: 'rgba(0,0,0,0.52)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: 999,
          padding: '10px 20px',
          border: '1px solid rgba(255,255,255,0.12)',
        }}>
          {/* Pause icon — two bars */}
          <svg width="16" height="18" viewBox="0 0 16 18" fill="none">
            <rect x="1" y="0" width="5" height="18" rx="2" fill="rgba(255,255,255,0.85)" />
            <rect x="10" y="0" width="5" height="18" rx="2" fill="rgba(255,255,255,0.85)" />
          </svg>
          <span style={{
            fontSize: 13, fontWeight: 600,
            color: 'rgba(255,255,255,0.80)',
            fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>Paused</span>
        </div>
      </div>
    </div>
  );
}
