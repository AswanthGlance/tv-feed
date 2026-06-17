/**
 * WarmProfile1CinematicL0 — warm_profile_1, all 8 cards.
 *
 * Identical to ColdStartCinematicL0 except the reasoning paragraph is replaced
 * by SignalDecisionReasoning, which runs the signal → reasoning sequence.
 * Signal/reasoning content is injected via the `signalData` prop.
 * See warmCardSignalData.ts for per-card content.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { FeedItem } from '../../data/types';
import type { AgentMode } from '../Shared/AgentMascot';
import AgentMascot from '../Shared/AgentMascot';
import GlanceTextReveal, { RESOLVE_MS_CTA } from '../Shared/GlanceTextReveal';
import SignalDecisionReasoning from './SignalDecisionReasoning';
import CenterSignalDecisionReasoning from './CenterSignalDecisionReasoning';
import type { WarmCardSignalEntry } from './warmCardSignalData';
import { gsap } from 'gsap';
import { buildColdStartL0Timeline, killColdStartL0Timeline } from '../../animations/coldStartL0Timeline';
import { getConversationalCTA } from '../../logic/ctaGenerator';

const LOGO_SRC = '/glance-logo.png';

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

let headerHasAnimated = false;

const MASCOT_HERO_SIZE  = 80;
const MASCOT_FINAL_SIZE = 52;
const MASCOT_CTA_SIZE   = 52;

const MASCOT_HERO_SCALE  = 1.0;
const MASCOT_FINAL_SCALE = MASCOT_FINAL_SIZE / MASCOT_HERO_SIZE;

const GEO = {
  left: {
    contentLeft:  'clamp(20px, 4.5vw, 88px)',
    contentRight: undefined as string | undefined,
    contentWidth: 'clamp(240px, 62vw, 1060px)',
    textAlign:    'left'  as const,
    ctaJustify:   'flex-start' as const,
  },
  center: {
    contentLeft:  '50%',
    contentRight: undefined as string | undefined,
    contentWidth: 'clamp(240px, 62vw, 1060px)',
    textAlign:    'center' as const,
    ctaJustify:   'center' as const,
  },
  right: {
    contentLeft:  undefined as string | undefined,
    contentRight: 'clamp(20px, 4.5vw, 88px)',
    contentWidth: 'clamp(240px, 62vw, 1060px)',
    textAlign:    'right' as const,
    ctaJustify:   'flex-end' as const,
  },
};

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
  return CATEGORY_TAG[item.category] ?? item.category;
}

// Signal sequence total before onSequenceDone fires: ~30.2s.
// Ceiling must exceed actual sequence — heroShrink is triggered manually via onSequenceDone,
// never by GSAP reaching the label. 45s gives ample headroom for all 8 cards.
const SEQUENCE_DURATION_MS = 45000;
// CTA text reveal — slow, deliberate. Standard is 1400ms.
const CTA_RESOLVE_MS = 3000;

type Alignment = 'left' | 'center' | 'right';

type Props = {
  item:               FeedItem;
  paused?:            boolean;
  ctaFocused:         boolean;
  onCTAClick:         () => void;
  alignment:          Alignment;
  onTimelineComplete: () => void;
  signalData:         WarmCardSignalEntry;
  bgEntrance?:        'zoom-dissolve' | 'plain';
};

export default function WarmProfile1CinematicL0({
  item, paused = false, ctaFocused, onCTAClick, alignment, onTimelineComplete, signalData,
  bgEntrance = 'plain',
}: Props) {
  const geo = GEO[alignment];

  const containerRef    = useRef<HTMLDivElement>(null);
  const prevImageRef    = useRef<HTMLDivElement>(null);
  const bgRef           = useRef<HTMLDivElement>(null);
  const overlayRef      = useRef<HTMLDivElement>(null);
  const headerRef       = useRef<HTMLDivElement>(null);
  const tagRef          = useRef<HTMLDivElement>(null);
  const titleRef        = useRef<HTMLHeadingElement>(null);
  const mascotFloatRef  = useRef<HTMLDivElement>(null);
  const mascotSpacerRef = useRef<HTMLDivElement>(null);
  const reasoningRef    = useRef<HTMLDivElement>(null);  // wraps SignalDecisionReasoning
  const ctaWrapRef      = useRef<HTMLDivElement>(null);
  const ctaPillRef      = useRef<HTMLButtonElement>(null);
  const ctaBeamOuterRef = useRef<HTMLDivElement>(null);
  const ctaMascotSlotRef= useRef<HTMLDivElement>(null);
  const ctaLabelRef     = useRef<HTMLSpanElement>(null);
  const ctaLabelClipRef = useRef<HTMLDivElement>(null);

  const [signalPlaying,  setSignalPlaying]  = useState(false);
  const [mascotLooking,  setMascotLooking]  = useState(false);
  const [ctaTextPlaying, setCtaTextPlaying] = useState(false);
  const [ctaVisible,     setCtaVisible]     = useState(false);
  const [ctaActive,      setCtaActive]      = useState(false);
  const [beamActive,     setBeamActive]     = useState(false);
  const [mascotGone,     setMascotGone]     = useState(false);
;
  const [clock, setClock] = useState(() =>
    new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      .replace(/\s?[AP]M/i, ''));
  const [ampm, setAmpm] = useState(() => new Date().getHours() < 12 ? 'AM' : 'PM');

  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [prevImage, setPrevImage] = useState(item.image);

  const onTimelineCompleteRef = useRef(onTimelineComplete);
  useEffect(() => { onTimelineCompleteRef.current = onTimelineComplete; }, [onTimelineComplete]);

  // After signal sequence ends, manually fire the mascot shrink + CTA entrance
  // instead of waiting for GSAP's typingDuration to expire.
  const heroShrinkCallbackRef = useRef<(() => void) | null>(null);

  const handleSequenceDone = useCallback(() => {
    heroShrinkCallbackRef.current?.();
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      const n = new Date();
      setClock(n.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/\s?[AP]M/i, ''));
      setAmpm(n.getHours() < 12 ? 'AM' : 'PM');
    }, 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setSignalPlaying(false);
    setMascotLooking(false);
    setCtaTextPlaying(false);
    setCtaVisible(false);
    setCtaActive(false);
    setBeamActive(false);
    setMascotGone(false);
    heroShrinkCallbackRef.current = null;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    killColdStartL0Timeline(tlRef.current, [
      bgRef.current, overlayRef.current, headerRef.current, tagRef.current,
      titleRef.current, mascotFloatRef.current, reasoningRef.current,
      ctaWrapRef.current, ctaMascotSlotRef.current,
    ]);

    function startTimeline() {
      const animateHeader = !headerHasAnimated;
      headerHasAnimated = true;

      // We pass a very large typingDuration so heroShrink never fires automatically.
      // Instead, handleSequenceDone drives heroShrink via heroShrinkCallbackRef.
      // Reset prevImage opacity so it's visible as the underlay for this dissolve.
      if (prevImageRef.current) gsap.set(prevImageRef.current, { opacity: 1 });

      tlRef.current = buildColdStartL0Timeline(
        {
          bg:            bgRef.current,
          prevBg:        prevImageRef.current,
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
          card:          null,
          cards:         [],
          container:     containerRef.current,
        },
        {
          typingDuration:      SEQUENCE_DURATION_MS,
          ctaRevealDuration:   CTA_RESOLVE_MS,
          mascotHeroScale:     MASCOT_HERO_SCALE,
          mascotFinalScale:    MASCOT_FINAL_SCALE,
          reasoningHeroScale:  1.0,
          reasoningFinalScale: 0.88,
          alignment,
          showProducts:        false,
          animateHeader,
          bgEntrance,
          onTypingStart:       () => setSignalPlaying(true),
          onAgentLook:         () => setMascotLooking(true),
          onCTATypingStart:    () => { setCtaVisible(true); setCtaTextPlaying(true); },
          onBeamStart:         () => { setBeamActive(true); setCtaActive(true); },
          onMascotGone:        () => setMascotGone(true),
          onTimelineComplete:  () => onTimelineCompleteRef.current(),
        },
      );

      // Expose a hook so handleSequenceDone can jump the GSAP timeline past the
      // long typingDuration wait to heroShrink immediately.
      heroShrinkCallbackRef.current = () => {
        if (!tlRef.current) return;
        // Seek to just before heroShrink so the shrink + CTA sequence plays live.
        // heroShrink label is at: typingStart + (secsReasoning + 1.0)
        // typingStart ≈ mascotIn+0.58 ≈ 1.35+0.58 = 1.93
        // secsReasoning = SEQUENCE_DURATION_MS/1000 = 19.8
        // So heroShrink ≈ 1.93 + 19.8 + 1.0 = 22.73s
        // We seek to heroShrink-0.05 to let GSAP pick up from there naturally.
        const typingStartSec = 1.35 + 0.58;
        const heroShrinkSec  = typingStartSec + SEQUENCE_DURATION_MS / 1000 + 1.0;
        tlRef.current.seek(heroShrinkSec - 0.05);
      };
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
      killColdStartL0Timeline(tlRef.current);
    };
  }, [item.id, alignment]); // eslint-disable-line react-hooks/exhaustive-deps

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

  useEffect(() => {
    if (!ctaTextPlaying || !ctaLabelClipRef.current || !ctaLabelRef.current) return;
    const fullWidth = ctaLabelRef.current.offsetWidth;
    gsap.fromTo(ctaLabelClipRef.current,
      { width: 0 },
      { width: fullWidth, duration: CTA_RESOLVE_MS / 1000, ease: 'power1.inOut' },
    );
  }, [ctaTextPlaying]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const ctaLabel = getConversationalCTA(item);

  const derivedMascotMode: AgentMode =
    mascotLooking  ? 'looking'  :
    signalPlaying  ? 'thinking' :
                     'idle';

  const BOTTOM = 'clamp(28px, 5vh, 56px)';
  const contentTransform = alignment === 'center' ? 'translateX(-50%)' : undefined;

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Persistent prev-image layer — fades out during crossdissolve */}
      <div ref={prevImageRef} style={{
        position: 'absolute', inset: 0,
        overflow: 'hidden',
        zIndex: 0,
      }}>
        <img src={prevImage} style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center 32%',
          willChange: 'transform',
          imageRendering: 'auto',
        }} />
      </div>

      {/* BG */}
      <div ref={bgRef} style={{
        position: 'absolute', inset: 0,
        overflow: 'hidden',
        willChange: 'transform, opacity',
        zIndex: 1,
      }}>
        <img src={item.image} style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center 32%',
          willChange: 'transform',
          imageRendering: 'auto',
        }} />
      </div>

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

      {/* HEADER */}
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

      {/* TAG + TITLE */}
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

      {/* CONTENT COLUMN — agent + signal sequence + CTA */}
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

        {/* CENTER TEMPLATE: mascot first, signals/reasoning below it */}
        {alignment === 'center' && (
          <>
            {/* Mascot — always on top, always the speaker */}
            <div ref={mascotSpacerRef} style={{ display: 'flex', justifyContent: 'center', flexShrink: 0, overflow: 'visible' }}>
              <div ref={mascotFloatRef} style={{
                display: 'flex', justifyContent: 'center',
                willChange: 'opacity, transform',
                pointerEvents: 'none',
                overflow: 'visible',
              }}>
                <AgentMascot agentMode={derivedMascotMode} size={MASCOT_HERO_SIZE} />
              </div>
            </div>

            {/* Signal stack + reasoning — below mascot, items shift upward past mascot */}
            <div ref={reasoningRef} style={{
              maxWidth: 'clamp(400px, 78vw, 1100px)',
              width: '100%',
              willChange: 'opacity, transform',
              alignSelf: 'center',
              marginTop: 'clamp(10px, 1.5vh, 18px)',
              marginBottom: 'clamp(18px, 2.8vh, 32px)',
              overflow: 'visible',
              transformOrigin: 'center top',
            }}>
              <CenterSignalDecisionReasoning
                playing={signalPlaying}
                onSequenceDone={handleSequenceDone}
                signal1={signalData.signal1}
                signal1Hls={signalData.signal1Hls}
                signal2={signalData.signal2}
                signal2Hls={signalData.signal2Hls}
                reasoning={signalData.reasoning}
                reasoningHls={signalData.reasoningHls}
                mascotClearancePx={MASCOT_HERO_SIZE + 18}
              />
            </div>
          </>
        )}

        {/* LEFT/RIGHT: mascot + signal/reasoning in a single row */}
        {alignment !== 'center' && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            flexDirection: alignment === 'right' ? 'row-reverse' : 'row',
            gap: !mascotGone ? 'clamp(8px,1.2vw,16px)' : 0,
            marginBottom: 'clamp(18px, 2.8vh, 32px)',
            overflow: 'visible',
          }}>
            <div ref={mascotFloatRef} style={{
              flexShrink: 0,
              width:  mascotGone ? 0 : MASCOT_HERO_SIZE,
              height: mascotGone ? 0 : MASCOT_HERO_SIZE,
              overflow: 'visible',
              willChange: 'opacity, transform, width',
              pointerEvents: 'none',
            }}>
              <AgentMascot agentMode={derivedMascotMode} size={MASCOT_HERO_SIZE} />
            </div>

            <div ref={reasoningRef} style={{
              flex: 1,
              willChange: 'opacity, transform',
              transformOrigin: alignment === 'right' ? 'right top' : 'left top',
            }}>
              <SignalDecisionReasoning
                playing={signalPlaying}
                onSequenceDone={handleSequenceDone}
                textAlign={geo.textAlign}
                signal1={signalData.signal1}
                signal1Hls={signalData.signal1Hls}
                signal2={signalData.signal2}
                signal2Hls={signalData.signal2Hls}
                reasoning={signalData.reasoning}
                reasoningHls={signalData.reasoningHls}
              />
            </div>
          </div>
        )}

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
                      onDone={() => {}}
                    />
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PAUSE INDICATOR */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, pointerEvents: 'none',
        opacity: paused ? 1 : 0,
        transition: 'opacity 0.2s ease',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 6, background: 'rgba(0,0,0,0.52)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          borderRadius: 999, padding: '10px 20px',
          border: '1px solid rgba(255,255,255,0.12)',
        }}>
          <svg width="16" height="18" viewBox="0 0 16 18" fill="none">
            <rect x="1" y="0" width="5" height="18" rx="2" fill="rgba(255,255,255,0.85)" />
            <rect x="10" y="0" width="5" height="18" rx="2" fill="rgba(255,255,255,0.85)" />
          </svg>
          <span style={{
            fontSize: 13, fontWeight: 600,
            color: 'rgba(255,255,255,0.80)',
            fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>Paused</span>
        </div>
      </div>
    </div>
  );
}
