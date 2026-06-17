/**
 * CenterSignalDecisionReasoning — center-aligned warm_profile_1 cards only.
 *
 * Center template signal stack behavior:
 *   - Mascot is the anchor above this container.
 *   - Signals and reasoning start BELOW the mascot (in this container).
 *   - After each hold, the active text shifts UPWARD past the mascot into "history" space.
 *   - Container uses overflow: visible so items can animate above the mascot boundary.
 *
 * Flow (v1 — center stack):
 *   1. Signal 1 reveals below mascot
 *   2. 5s hold → dots
 *   3. Signal 1 shifts UPWARD past mascot. Signal 2 enters below mascot.
 *   4. Signal 2 reveals below mascot
 *   5. 5s hold → dots
 *   6. Signal 2 shifts UPWARD past mascot (joins Signal 1 above)
 *   7. Signal 1 fades → Signal 2 fades
 *   8. Reasoning reveals below mascot
 *   9. 5s hold after reasoning done
 *  10. Reasoning shifts upward past mascot + fades (500ms)
 *  11. onSequenceDone fires
 *
 * mascotClearancePx: distance from the TOP of this container to the TOP of the mascot.
 *   Equals: MASCOT_HERO_SIZE + gap_between_mascot_row_and_this_container.
 *   Used to compute the Y shift needed for items to clear the mascot.
 *
 * Timing is identical to SignalDecisionReasoning — no timing changes per spec.
 */

import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import GlanceTextReveal from '../Shared/GlanceTextReveal';

/* ── Timing constants (identical to SignalDecisionReasoning) ───────────────── */
const RESOLVE_MS_SIGNAL_1      = 3200;
const PAUSE_AFTER_SIGNAL_1     = 5000;
const SIGNAL_SHIFT_DURATION    = 500;
const RESOLVE_MS_SIGNAL_2      = 3200;
const PAUSE_AFTER_SIGNAL_2     = 5000;
const SIGNAL_FADE_MS           = 700;
const GAP_BEFORE_REASONING     = 400;
const RESOLVE_MS_REASONING     = 7000;
const PAUSE_AFTER_REASONING    = 5000;
// Computed
const SIGNAL_SHIFT_START_MS  = RESOLVE_MS_SIGNAL_1 + PAUSE_AFTER_SIGNAL_1;          // 8200
const SIGNAL_2_DONE_MS       = SIGNAL_SHIFT_START_MS + RESOLVE_MS_SIGNAL_2;         // 11400
const SIGNAL_1_FADE_START_MS = SIGNAL_2_DONE_MS + PAUSE_AFTER_SIGNAL_2;             // 16400
const SIGNAL_2_FADE_START_MS = SIGNAL_1_FADE_START_MS + SIGNAL_FADE_MS;             // 17100
const SIGNALS_DONE_MS        = SIGNAL_2_FADE_START_MS + SIGNAL_FADE_MS;             // 17800
const REASONING_START_MS     = SIGNALS_DONE_MS + GAP_BEFORE_REASONING;              // 18200

/* ── Waiting dots ───────────────────────────────────────────────────────────── */
function WaitingDots({ visible }: { visible: boolean }) {
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
      justifyContent: 'center',
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
  playing:            boolean;
  onSequenceDone:     () => void;
  signal1:            string;
  signal1Hls:         string[];
  signal2:            string;
  signal2Hls:         string[];
  reasoning:          string;
  reasoningHls:       string[];
  mascotClearancePx:  number;
};

/* ── Component ──────────────────────────────────────────────────────────────── */
export default function CenterSignalDecisionReasoning({
  playing, onSequenceDone,
  signal1, signal1Hls, signal2, signal2Hls, reasoning, reasoningHls,
  mascotClearancePx,
}: Props) {
  const [signalsVisible,   setSignalsVisible]   = useState(false);
  const [signal1Playing,   setSignal1Playing]   = useState(false);
  const [signal2Playing,   setSignal2Playing]   = useState(false);
  const [dotsAfterS1,      setDotsAfterS1]      = useState(false);
  const [dotsAfterS2,      setDotsAfterS2]      = useState(false);
  const [reasoningVisible, setReasoningVisible] = useState(false);
  const [reasoningPlaying, setReasoningPlaying] = useState(false);

  const signal1WrapperRef  = useRef<HTMLDivElement>(null);
  const signal2WrapperRef  = useRef<HTMLDivElement>(null);
  const timersRef          = useRef<ReturnType<typeof setTimeout>[]>([]);
  const doneRef            = useRef(false);

  function addTimer(fn: () => void, ms: number) {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }

  useEffect(() => {
    if (!playing) return;
    doneRef.current = false;

    /* Phase 1 — Signal 1 appears below mascot */
    setSignalsVisible(true);
    setSignal1Playing(true);

    /* Phase 2 — dots after S1 fully revealed */
    addTimer(() => setDotsAfterS1(true), RESOLVE_MS_SIGNAL_1);

    /* Phase 3 — S1 shifts UPWARD past mascot; S2 enters below mascot */
    addTimer(() => {
      setDotsAfterS1(false);

      const s1El = signal1WrapperRef.current;
      const s2El = signal2WrapperRef.current;

      if (s1El) {
        // Shift S1 far enough to clear the mascot (which is mascotClearancePx above this container)
        const shiftY = -(s1El.offsetHeight + mascotClearancePx);
        gsap.to(s1El, {
          y: shiftY,
          opacity: 0.45,
          duration: SIGNAL_SHIFT_DURATION / 1000,
          ease: 'power2.inOut',
        });
      }
      if (s2El) {
        gsap.to(s2El, { opacity: 1, duration: 0.30, ease: 'power1.out' });
      }
      setSignal2Playing(true);
    }, SIGNAL_SHIFT_START_MS);

    /* Phase 4 — dots after S2 fully revealed */
    addTimer(() => setDotsAfterS2(true), SIGNAL_2_DONE_MS);

    /* Phase 5 — S2 shifts UPWARD past mascot (joins S1 in history above) */
    addTimer(() => {
      setDotsAfterS2(false);
      const s2El = signal2WrapperRef.current;
      if (s2El) {
        const shiftY = -(s2El.offsetHeight + mascotClearancePx);
        gsap.to(s2El, {
          y: shiftY,
          opacity: 0.45,
          duration: SIGNAL_SHIFT_DURATION / 1000,
          ease: 'power2.inOut',
        });
      }
    }, SIGNAL_2_DONE_MS + PAUSE_AFTER_SIGNAL_2);

    /* Phase 6 — signals exit: S1 fades, then S2 fades */
    addTimer(() => {
      const s1El = signal1WrapperRef.current;
      if (s1El) gsap.to(s1El, { opacity: 0, duration: SIGNAL_FADE_MS / 1000, ease: 'power2.in' });
    }, SIGNAL_1_FADE_START_MS);

    addTimer(() => {
      const s2El = signal2WrapperRef.current;
      if (s2El) {
        gsap.to(s2El, {
          opacity: 0,
          duration: SIGNAL_FADE_MS / 1000,
          ease: 'power2.in',
          onComplete: () => setSignalsVisible(false),
        });
      }
    }, SIGNAL_2_FADE_START_MS);

    /* Phase 7 — reasoning appears below mascot */
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

  /* After reasoning text fully resolves: 5s hold, then fire done.
     Reasoning stays in place — mascot arcs into CTA independently. */
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
    textAlign: 'center',
    letterSpacing: 0.1,
    maxWidth: '100%',
  };

  return (
    // overflow: visible allows shifted items to appear above the mascot boundary
    <div style={{ position: 'relative', width: '100%', overflow: 'visible' }}>

      {/* SIGNALS */}
      {signalsVisible && (
        <div style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>

          {/* Signal 1 — starts at container top, shifts upward past mascot */}
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
            <WaitingDots visible={dotsAfterS1} />
          </div>

          {/* Signal 2 — starts in same position as S1 (below mascot), opacity 0 */}
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
            <WaitingDots visible={dotsAfterS2} />
          </div>
        </div>
      )}

      {/* REASONING — appears below mascot after both signals exit */}
      {reasoningVisible && (
        <div style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <p style={{
            margin: 0,
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            fontWeight: 400,
            fontSize: 'clamp(14px, 1.55vw, 24px)',
            lineHeight: 1.65,
            color: 'rgba(255,255,255,0.82)',
            textShadow: '0 1px 6px rgba(0,0,0,0.4), 0 0 20px rgba(192,132,252,0.18)',
            textAlign: 'center',
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

      {/* Invisible spacer — holds container height stable. Uses reasoning (longest text). */}
      <div aria-hidden="true" style={{ visibility: 'hidden', pointerEvents: 'none' }}>
        <p style={{
          margin: 0,
          fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
          fontWeight: 400,
          fontSize: 'clamp(14px, 1.55vw, 24px)',
          lineHeight: 1.65,
          maxWidth: '100%',
          whiteSpace: 'pre-wrap',
          textAlign: 'center',
        }}>
          {reasoning}
        </p>
      </div>

    </div>
  );
}
