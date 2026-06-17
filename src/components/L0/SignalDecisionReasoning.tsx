/**
 * SignalDecisionReasoning — warm_profile_1, all cards.
 *
 * Content is injected via props (signal1, signal2, reasoning + highlights).
 * All 8 warm-start cards use this component with different data.
 * See warmCardSignalData.ts for per-card content.
 *
 * Flow (v6 — final timing calibration):
 *   1. Signal 1 reveals (blur → sharp, slow cinematic)
 *   2. Dots appear — 5-second hold, nothing moves
 *   3. Dots hide; Signal 1 shifts upward; Signal 2 enters from Signal 1's original position
 *   4. Signal 2 reveals (same slow cinematic speed)
 *   5. Dots appear — 5-second hold, nothing moves
 *   6. Dots hide; Signal 1 fades out (sequential)
 *   7. Signal 2 fades out
 *   8. Reasoning reveals (very slow — 7000ms, prioritize readability)
 *   9. Reasoning fully complete → 5-second hold, nothing moves
 *  10. onSequenceDone fires → CTA sequence begins
 *
 * No overlap between any stage. Each phase completes before the next begins.
 *
 * Timing from playing=true:
 *       0ms   Signal 1 reveal starts (3200ms)
 *    3200ms   Signal 1 done → dots appear
 *    8200ms   5s hold ends → dots hide; Signal 1 shifts up; Signal 2 enters (3200ms)
 *   11400ms   Signal 2 done → dots appear
 *   16400ms   5s hold ends → dots hide; Signal 1 fades (700ms)
 *   17100ms   Signal 2 fades (700ms)
 *   17800ms   Both signals gone
 *   18200ms   Reasoning reveal starts (400ms gap, 7000ms spread)
 *   25200ms   Reasoning fully visible
 *   30200ms   onSequenceDone fires (5000ms hold after reasoning done)
 */

import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import GlanceTextReveal from '../Shared/GlanceTextReveal';

/* ── Timing constants ───────────────────────────────────────────────────────── */
const RESOLVE_MS_SIGNAL_1      = 3200;
const PAUSE_AFTER_SIGNAL_1     = 5000;
const SIGNAL_SHIFT_DURATION    = 500;
const RESOLVE_MS_SIGNAL_2      = 3200;
const PAUSE_AFTER_SIGNAL_2     = 5000;
const SIGNAL_FADE_MS           = 700;
const SIGNAL_GAP_PX            = 2;
const GAP_BEFORE_REASONING     = 400;
const RESOLVE_MS_REASONING     = 7000;
const PAUSE_AFTER_REASONING    = 5000;

// Computed
const SIGNAL_SHIFT_START_MS   = RESOLVE_MS_SIGNAL_1 + PAUSE_AFTER_SIGNAL_1;         // 8200ms
const SIGNAL_2_DONE_MS        = SIGNAL_SHIFT_START_MS + RESOLVE_MS_SIGNAL_2;        // 11400ms
const SIGNAL_1_FADE_START_MS  = SIGNAL_2_DONE_MS + PAUSE_AFTER_SIGNAL_2;            // 16400ms
const SIGNAL_2_FADE_START_MS  = SIGNAL_1_FADE_START_MS + SIGNAL_FADE_MS;            // 17100ms
const SIGNALS_DONE_MS         = SIGNAL_2_FADE_START_MS + SIGNAL_FADE_MS;            // 17800ms
const REASONING_START_MS      = SIGNALS_DONE_MS + GAP_BEFORE_REASONING;             // 18200ms

/* ── Waiting dots ───────────────────────────────────────────────────────────── */
function WaitingDots({ visible, textAlign }: { visible: boolean; textAlign: 'left' | 'center' | 'right' }) {
  const dot1 = useRef<HTMLSpanElement>(null);
  const dot2 = useRef<HTMLSpanElement>(null);
  const dot3 = useRef<HTMLSpanElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    tlRef.current?.kill();
    if (!visible) {
      [dot1, dot2, dot3].forEach(r => r.current && gsap.set(r.current, { opacity: 0 }));
      return;
    }

    [dot1, dot2, dot3].forEach(r => r.current && gsap.set(r.current, { opacity: 0.15 }));

    const tl = gsap.timeline({ repeat: -1 });
    [dot1, dot2, dot3].forEach((r, i) => {
      if (!r.current) return;
      tl.to(r.current, { opacity: 0.85, duration: 0.45, ease: 'power1.out' }, i * 0.28)
        .to(r.current, { opacity: 0.15, duration: 0.45, ease: 'power1.in'  }, i * 0.28 + 0.45);
    });

    tlRef.current = tl;
    return () => { tl.kill(); };
  }, [visible]);

  const dotStyle: React.CSSProperties = {
    display: 'inline-block',
    width: 4, height: 4,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.85)',
    margin: '0 2.5px',
    verticalAlign: 'middle',
    opacity: 0,
  };

  return (
    <div style={{
      display: visible ? 'flex' : 'none',
      alignItems: 'center',
      justifyContent:
        textAlign === 'right'  ? 'flex-end' :
        textAlign === 'center' ? 'center'   : 'flex-start',
      marginTop: 12,
      height: 16,
    }}>
      <span ref={dot1} style={dotStyle} />
      <span ref={dot2} style={dotStyle} />
      <span ref={dot3} style={dotStyle} />
    </div>
  );
}

/* ── Props ──────────────────────────────────────────────────────────────────── */
type Props = {
  playing:        boolean;
  onSequenceDone: () => void;
  textAlign:      'left' | 'center' | 'right';
  // Content — injected per card from warmCardSignalData.ts
  signal1:        string;
  signal1Hls:     string[];
  signal2:        string;
  signal2Hls:     string[];
  reasoning:      string;
  reasoningHls:   string[];
};

/* ── Component ──────────────────────────────────────────────────────────────── */
export default function SignalDecisionReasoning({
  playing, onSequenceDone, textAlign,
  signal1, signal1Hls, signal2, signal2Hls, reasoning, reasoningHls,
}: Props) {
  const [signalsVisible,   setSignalsVisible]   = useState(false);
  const [signal1Playing,   setSignal1Playing]   = useState(false);
  const [signal2Playing,   setSignal2Playing]   = useState(false);
  const [dotsAfterS1,      setDotsAfterS1]      = useState(false);
  const [dotsAfterS2,      setDotsAfterS2]      = useState(false);
  const [reasoningVisible, setReasoningVisible] = useState(false);
  const [reasoningPlaying, setReasoningPlaying] = useState(false);

  const signal1WrapperRef = useRef<HTMLDivElement>(null);
  const signal2WrapperRef = useRef<HTMLDivElement>(null);
  const timersRef         = useRef<ReturnType<typeof setTimeout>[]>([]);
  const doneRef           = useRef(false);

  function addTimer(fn: () => void, ms: number) {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }

  useEffect(() => {
    if (!playing) return;
    doneRef.current = false;

    /* Phase 1 — Signal 1 reveals */
    setSignalsVisible(true);
    setSignal1Playing(true);

    /* Phase 2 — Signal 1 fully visible, dots appear for 5s */
    addTimer(() => setDotsAfterS1(true), RESOLVE_MS_SIGNAL_1);

    /* Phase 3 — 5s hold ends: dots hide, Signal 1 shifts up, Signal 2 enters */
    addTimer(() => {
      setDotsAfterS1(false);

      const s1El = signal1WrapperRef.current;
      const s2El = signal2WrapperRef.current;

      if (s1El) {
        const shiftY = -(s1El.offsetHeight + SIGNAL_GAP_PX);
        gsap.to(s1El, { y: shiftY, opacity: 0.58, duration: SIGNAL_SHIFT_DURATION / 1000, ease: 'power2.inOut' });
      }
      if (s2El) {
        gsap.to(s2El, { opacity: 1, duration: 0.30, ease: 'power1.out' });
      }
      setSignal2Playing(true);
    }, SIGNAL_SHIFT_START_MS);

    /* Phase 4 — Signal 2 fully visible, dots appear for 5s */
    addTimer(() => setDotsAfterS2(true), SIGNAL_2_DONE_MS);

    /* Phase 5 — 5s hold ends: dots hide, Signal 1 fades */
    addTimer(() => {
      setDotsAfterS2(false);
      const s1El = signal1WrapperRef.current;
      if (s1El) gsap.to(s1El, { opacity: 0, duration: SIGNAL_FADE_MS / 1000, ease: 'power2.in' });
    }, SIGNAL_1_FADE_START_MS);

    /* Phase 6 — Signal 2 fades after Signal 1 is gone */
    addTimer(() => {
      const s2El = signal2WrapperRef.current;
      if (s2El) {
        gsap.to(s2El, {
          opacity: 0, duration: SIGNAL_FADE_MS / 1000, ease: 'power2.in',
          onComplete: () => setSignalsVisible(false),
        });
      }
    }, SIGNAL_2_FADE_START_MS);

    /* Phase 7 — Reasoning reveals */
    addTimer(() => {
      setReasoningVisible(true);
      setReasoningPlaying(true);
    }, REASONING_START_MS);

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      doneRef.current = false;
    };
  }, [playing]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Fires only after every reasoning character has resolved */
  function handleReasoningDone() {
    addTimer(() => {
      if (!doneRef.current) { doneRef.current = true; onSequenceDone(); }
    }, PAUSE_AFTER_REASONING);
  }

  const signalStyle: React.CSSProperties = {
    margin: 0,
    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
    fontWeight: 400,
    fontSize: 'clamp(15px, 1.75vw, 26px)',
    lineHeight: 1.65,
    color: 'rgba(255,255,255,0.92)',
    textShadow: '0 1px 6px rgba(0,0,0,0.4)',
    textAlign,
    letterSpacing: 0.1,
    maxWidth: '100%',
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>

      {/* SIGNALS */}
      {signalsVisible && (
        <div style={{ position: 'absolute', inset: 0 }}>

          {/* Signal 1 — shifts upward to make room for Signal 2 */}
          <div ref={signal1WrapperRef} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
            <p style={signalStyle}>
              <GlanceTextReveal
                text={signal1}
                highlights={signal1Hls}
                twoLine={false}
                playing={signal1Playing}
                resolvedOpacity={0.92}
                resolveMs={RESOLVE_MS_SIGNAL_1}
                onDone={() => {}}
              />
            </p>
            <WaitingDots visible={dotsAfterS1} textAlign={textAlign} />
          </div>

          {/* Signal 2 — starts at Signal 1's original position, opacity 0 */}
          <div ref={signal2WrapperRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, opacity: 0 }}>
            <p style={signalStyle}>
              <GlanceTextReveal
                text={signal2}
                highlights={signal2Hls}
                twoLine={false}
                playing={signal2Playing}
                resolvedOpacity={0.92}
                resolveMs={RESOLVE_MS_SIGNAL_2}
                onDone={() => {}}
              />
            </p>
            <WaitingDots visible={dotsAfterS2} textAlign={textAlign} />
          </div>
        </div>
      )}

      {/* REASONING — appears only after both signals have exited */}
      {reasoningVisible && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <p style={{
            margin: 0,
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            fontWeight: 400,
            fontSize: 'clamp(14px, 1.55vw, 24px)',
            lineHeight: 1.65,
            color: 'rgba(255,255,255,0.82)',
            textShadow: '0 1px 6px rgba(0,0,0,0.4), 0 0 20px rgba(192,132,252,0.18)',
            textAlign,
            maxWidth: '100%',
          }}>
            <GlanceTextReveal
              text={reasoning}
              highlights={reasoningHls}
              twoLine={false}
              playing={reasoningPlaying}
              resolvedOpacity={0.82}
              resolveMs={RESOLVE_MS_REASONING}
              onDone={handleReasoningDone}
            />
          </p>
        </div>
      )}

      {/* Invisible spacer — holds container height stable throughout */}
      <div aria-hidden="true" style={{ visibility: 'hidden', pointerEvents: 'none' }}>
        <p style={{
          margin: 0,
          fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
          fontWeight: 400,
          fontSize: 'clamp(14px, 1.55vw, 24px)',
          lineHeight: 1.65,
          maxWidth: '100%',
          whiteSpace: 'pre-wrap',
        }}>
          {reasoning}
        </p>
      </div>

    </div>
  );
}
