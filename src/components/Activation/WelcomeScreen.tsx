import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import AgentMascot from '../Shared/AgentMascot';
import HandwaveMascot from '../Shared/HandwaveMascot';
import CinematicText from '../Shared/CinematicText';
import GlanceLogo from '../Shared/GlanceLogo';

/* ─────────────────────────────────────────────────────────────────────────────
   WelcomeScreen

   Two-line intro with premium word-stagger reveal:
     Line 1: "Hello, I'm Glance."     — large, primary, staggered words
     Line 2: "I'll help tune your TV around you."  — smaller, secondary

   Mascot enters as hand-wave lottie, crossfades to Rive after line 1 lands.
   CTA appears below line 2.
   CTA press → input flies up → mascot pulse → response types near mascot.
   ───────────────────────────────────────────────────────────────────────────── */

const AGENT_RESPONSE = "Let me ask you a few things to shape your feed.";

type Phase = 'intro' | 'cta' | 'responding' | 'exiting';

type Props = { onNext: () => void; onSkip: () => void; onSkipAll: () => void };

export default function WelcomeScreen({ onNext, onSkip, onSkipAll }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const mascotWrapRef = useRef<HTMLDivElement>(null);
  const handwaveRef   = useRef<HTMLDivElement>(null);
  const riveRef       = useRef<HTMLDivElement>(null);
  const line1Ref      = useRef<HTMLDivElement>(null);
  const line2Ref      = useRef<HTMLDivElement>(null);
  const ctaRef        = useRef<HTMLDivElement>(null);
  const ctaBtnRef     = useRef<HTMLButtonElement>(null);
  const skipAllBtnRef = useRef<HTMLButtonElement>(null);
  const responseRef   = useRef<HTMLDivElement>(null);

  const [phase, setPhase]                   = useState<Phase>('intro');
  const [ctaVisible, setCtaVisible]         = useState(false);
  const [ctaReady, setCtaReady]             = useState(false);
  const [ctaFocus, setCtaFocus]             = useState<'primary' | 'skip'>('primary');
  const [line1Playing, setLine1Playing]     = useState(false);
  const [line2Playing, setLine2Playing]     = useState(false);
  const [line2bPlaying, setLine2bPlaying]   = useState(false);
  const [responsePlaying, setResponsePlaying] = useState(false);
  const exitingRef = useRef(false);

  /* ── Intro: mascot → line1 cinematic → crossfade → line2 cinematic → CTA ── */
  useEffect(() => {
    const tl = gsap.timeline();

    /* Mascot springs in with handwave */
    tl.fromTo(mascotWrapRef.current,
      { opacity: 0, scale: 0.55, filter: 'blur(14px)', y: 20 },
      { opacity: 1, scale: 1, filter: 'blur(0px)', y: 0, duration: 1.0, ease: 'back.out(1.5)' }
    )

    /* Line 1 — trigger CinematicText reveal */
    .call(() => setLine1Playing(true), [], '+=0.2')

    /* Crossfade handwave → Rive while line 1 is still reading */
    .to(handwaveRef.current,
      { opacity: 0, duration: 0.5, ease: 'power2.inOut' },
      '+=0.65'
    )
    .to(riveRef.current,
      { opacity: 1, duration: 0.5, ease: 'power2.inOut' },
      '<'
    )

    /* Line 2 — trigger CinematicText reveal */
    .call(() => setLine2Playing(true), [], '+=0.15')

    /* CTA appears after line 2 has had time to read */
    .call(() => {
      setCtaVisible(true);
      setPhase('cta');
      gsap.fromTo(ctaRef.current,
        { opacity: 0, y: 28, scale: 0.91, filter: 'blur(10px)' },
        {
          opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
          duration: 0.75, ease: 'back.out(1.3)',
          onComplete: () => setCtaReady(true),
        }
      );
      gsap.fromTo(skipAllBtnRef.current,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out', delay: 0.25 }
      );
    }, [], '+=2.2');

    return () => { tl.kill(); };
  }, []);

  /* ── CTA press ─────────────────────────────────────────────────────── */
  function handleCtaPress() {
    if (!ctaReady || exitingRef.current) return;
    exitingRef.current = true;
    setCtaReady(false);
    setPhase('responding');

    const tl = gsap.timeline();

    /* CTA dissolves up toward mascot */
    tl.to(ctaBtnRef.current, {
      background: 'rgba(255,255,255,0.10)',
      color: 'rgba(255,255,255,0.80)',
      borderRadius: '20px',
      boxShadow: 'none',
      duration: 0.2, ease: 'power2.inOut',
    }, 0)
    .to(ctaBtnRef.current, { y: -180, scale: 0.55, opacity: 0, duration: 0.5, ease: 'power3.in' }, 0.08)

    /* Intro lines fade */
    .to([line1Ref.current, line2Ref.current],
      { opacity: 0, y: -10, duration: 0.28, ease: 'power2.in' }, 0.04
    )

    /* Mascot pulse — receives input */
    .to(mascotWrapRef.current, { scale: 1.14, duration: 0.16, ease: 'power2.out' }, 0.48)
    .to(mascotWrapRef.current, { scale: 1.0, duration: 0.24, ease: 'back.out(2)' }, 0.64)

    /* Response appears directly below mascot */
    .fromTo(responseRef.current,
      { opacity: 0, y: 10, filter: 'blur(4px)' },
      {
        opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.4, ease: 'power2.out',
        onComplete: () => setResponsePlaying(true),
      }, 0.78
    );
  }

  function handleResponseDone() {
    setPhase('exiting');
    setTimeout(() => {
      const tl = gsap.timeline({ onComplete: onNext });
      tl.to([mascotWrapRef.current, responseRef.current],
        { opacity: 0, y: -28, scale: 0.8, duration: 0.44, ease: 'power3.in', stagger: 0.04 }, 0
      )
      .to(containerRef.current, { opacity: 0, duration: 0.3, ease: 'power1.in' }, 0.3);
    }, 500);
  }

  /* ── TV remote ─────────────────────────────────────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (phase !== 'cta') return;
      if (e.key === 'ArrowDown') { e.preventDefault(); setCtaFocus('skip'); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setCtaFocus('primary'); return; }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (ctaFocus === 'primary') handleCtaPress();
        else onSkipAll();
        return;
      }
      if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault(); onSkip();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [ctaReady, phase, ctaFocus, onSkip, onSkipAll]);

  return (
    <div ref={containerRef} className="fg-screen" data-step="welcome">
      <div className="fg-bg-glow" />
      <GlanceLogo />

      <div className="fg-welcome-stage">

        {/* Mascot — handwave lottie on entry, crossfades to Rive */}
        <div ref={mascotWrapRef} className="fg-welcome-mascot"
          style={{ opacity: 0, position: 'relative', width: 166, height: 160 }}>
          <div ref={handwaveRef} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HandwaveMascot scale={0.8} />
          </div>
          <div ref={riveRef} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0 }}>
            <AgentMascot agentMode="looking" size={140} />
          </div>
        </div>

        {/* Agent response — immediately below mascot, hidden until CTA pressed */}
        <div ref={responseRef} className="fg-welcome-response" style={{ opacity: 0 }}>
          {(phase === 'responding' || phase === 'exiting') && (
            <CinematicText
              text={AGENT_RESPONSE}
              playing={responsePlaying}
              speed={0.038}
              duration={0.42}
              onDone={handleResponseDone}
              className="fg-response-text"
            />
          )}
        </div>

        {/* Two-line intro — both use cinematic reveal */}
        <div className="fg-intro-lines" style={{ marginBottom: 52 }}>
          <div ref={line1Ref} className="fg-intro-line1">
            <CinematicText
              text="Hello, I'm Glance."
              playing={line1Playing}
              speed={0.055}
              duration={0.50}
            />
          </div>
          <div ref={line2Ref} className="fg-intro-line2" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div>
              <CinematicText
                text="I turn your screensaver into a feed"
                playing={line2Playing}
                speed={0.040}
                duration={0.42}
                onDone={() => setLine2bPlaying(true)}
              />
            </div>
            <div>
              <CinematicText
                text="that helps you discover something new every day."
                playing={line2bPlaying}
                speed={0.038}
                duration={0.42}
              />
            </div>
          </div>
        </div>

        {/* CTA */}
        <div ref={ctaRef} className="fg-cta-row"
          style={{ opacity: 0, pointerEvents: ctaVisible ? 'auto' : 'none', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <button
            ref={ctaBtnRef}
            className="fg-cta-pill"
            onClick={handleCtaPress}
            style={{
              background: ctaFocus === 'skip' ? 'rgba(255,255,255,0.12)' : undefined,
              color: ctaFocus === 'skip' ? 'rgba(255,255,255,0.45)' : undefined,
              outline: ctaFocus === 'primary' ? '2.5px solid rgba(255,255,255,0.85)' : 'none',
              outlineOffset: 3,
              transition: 'background 0.2s ease, color 0.2s ease',
            }}
          >
            First, let me get to know you
          </button>
        </div>

        {/* Skip — pinned to bottom of screen, becomes primary when focused */}
        <button
          ref={skipAllBtnRef}
          onClick={onSkipAll}
          style={{
            position: 'absolute',
            bottom: 'clamp(28px,4.5vh,52px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: ctaFocus === 'skip' ? 'rgba(255,255,255,0.92)' : 'none',
            border: ctaFocus === 'skip' ? 'none' : 'none',
            cursor: 'pointer',
            fontSize: 'clamp(13px, 1.2vw, 17px)', fontWeight: ctaFocus === 'skip' ? 700 : 500,
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            color: ctaFocus === 'skip' ? '#111' : 'rgba(255,255,255,0.3)',
            padding: ctaFocus === 'skip' ? 'clamp(10px,1.4vh,14px) clamp(28px,3.5vw,48px)' : '8px 24px',
            outline: ctaFocus === 'skip' ? '2.5px solid rgba(255,255,255,0.7)' : 'none',
            outlineOffset: 3, borderRadius: 999,
            transition: 'all 0.2s ease',
            opacity: 0,
            pointerEvents: ctaVisible ? 'auto' : 'none',
            zIndex: 10,
          }}
          onMouseEnter={() => setCtaFocus('skip')}
          onMouseLeave={() => setCtaFocus('primary')}
        >
          Skip this for now
        </button>

      </div>

    </div>
  );
}
