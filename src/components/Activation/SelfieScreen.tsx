import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import AgentMascot from '../Shared/AgentMascot';
import GlanceLogo from '../Shared/GlanceLogo';

/* ─────────────────────────────────────────────────────────────────────────────
   SelfieScreen — Figma 4065-6358 redesign

   Value proposition screen. Shows outcome before asking.
   Layout:
     [Logo]
     [Mascot] — presents the idea
     [Headline] — aspirational, no AI/selfie language
     [Three lifestyle cards fanned] — left bg card, centre hero card, right bg card
     [Selfie polaroid] with arrow → centre card (transformation story)
     [Skip]  [Upload Image]
     [Privacy note]

   GSAP sequence:
     1. bg settles (already on mount)
     2. mascot springs in
     3. headline word-stagger reveals
     4. left card slides in from left
     5. right card slides in from right
     6. centre hero card scales up from below
     7. selfie polaroid appears with float loop
     8. arrow draws in
     9. CTA row rises
   ───────────────────────────────────────────────────────────────────────────── */

/* Figma-exported images from /selfie folder */
const IMG_LEFT   = '/images/selfie/sv-left.png';    // woman surfing
const IMG_CENTRE = '/images/selfie/sv-centre.png';  // fashion street hero
const IMG_RIGHT  = '/images/selfie/sv-right.png';   // woman hiking at sunset
const IMG_SELFIE = '/images/selfie/sv-selfie.png';  // polaroid frame + label baked in

type Props = { onNext: () => void; onSkip: () => void };
type Phase = 'entering' | 'idle' | 'responding' | 'exiting';

export default function SelfieScreen({ onNext, onSkip }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const mascotRef     = useRef<HTMLDivElement>(null);
  const headlineRef   = useRef<HTMLDivElement>(null);
  const cardLeftRef   = useRef<HTMLDivElement>(null);
  const cardRightRef  = useRef<HTMLDivElement>(null);
  const cardCentreRef = useRef<HTMLDivElement>(null);
  const selfieRef     = useRef<HTMLDivElement>(null);
  const arrowRef      = useRef<HTMLDivElement>(null);
  const ctaRef        = useRef<HTMLDivElement>(null);
  const privacyRef    = useRef<HTMLDivElement>(null);
  const bubbleRef     = useRef<HTMLDivElement>(null);
  const fileInputRef  = useRef<HTMLInputElement>(null);

  const [phase, setPhase]             = useState<Phase>('entering');
  const [focused, setFocused]         = useState<'upload' | 'skip'>('upload');
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const interactiveRef = useRef(false);

  /* ── Entrance sequence ────────────────────────────────────────────── */
  useEffect(() => {
    const tl = gsap.timeline();

    /* 1. Mascot springs in */
    tl.fromTo(mascotRef.current,
      { opacity: 0, scale: 0.6, filter: 'blur(12px)', y: 16 },
      { opacity: 1, scale: 1, filter: 'blur(0px)', y: 0, duration: 0.75, ease: 'back.out(1.5)' }
    )

    /* 2. Headline — word stagger */
    .call(() => {
      const words = headlineRef.current?.querySelectorAll<HTMLSpanElement>('.sv-wrd');
      if (!words) return;
      gsap.fromTo(words,
        { opacity: 0, y: 24, filter: 'blur(8px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.52, stagger: 0.07, ease: 'power3.out' }
      );
    }, [], '+=0.15')

    /* 3. Left card slides in */
    .fromTo(cardLeftRef.current,
      { opacity: 0, x: -80, rotate: -6, scale: 0.88 },
      { opacity: 1, x: 0, rotate: -8, scale: 1, duration: 0.65, ease: 'power3.out' },
      '+=0.3'
    )

    /* 4. Right card slides in */
    .fromTo(cardRightRef.current,
      { opacity: 0, x: 80, rotate: 6, scale: 0.88 },
      { opacity: 1, x: 0, rotate: 8, scale: 1, duration: 0.65, ease: 'power3.out' },
      '<+0.08'
    )

    /* 5. Centre hero card scales up */
    .fromTo(cardCentreRef.current,
      { opacity: 0, scale: 0.82, y: 40, filter: 'blur(10px)' },
      { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', duration: 0.72, ease: 'back.out(1.3)' },
      '<+0.1'
    )

    /* 6. Selfie polaroid appears */
    .fromTo(selfieRef.current,
      { opacity: 0, scale: 0.7, rotate: -4, y: 20 },
      { opacity: 1, scale: 1, rotate: -6, y: 0, duration: 0.55, ease: 'back.out(1.6)' },
      '<+0.3'
    )
    /* Selfie gentle float loop — starts after appear */
    .call(() => {
      gsap.to(selfieRef.current, {
        y: -8, duration: 2.2, ease: 'sine.inOut', yoyo: true, repeat: -1,
      });
    }, [], '+=0.1')

    /* 7. Arrow draws */
    .fromTo(arrowRef.current,
      { opacity: 0, scale: 0.4, x: -10 },
      { opacity: 1, scale: 1, x: 0, duration: 0.4, ease: 'back.out(2)' },
      '<'
    )

    /* 8. CTA + privacy */
    .fromTo([ctaRef.current, privacyRef.current],
      { opacity: 0, y: 22 },
      {
        opacity: 1, y: 0, duration: 0.55, stagger: 0.1, ease: 'power3.out',
        onComplete: () => { setPhase('idle'); interactiveRef.current = true; },
      },
      '+=0.2'
    );

    return () => { tl.kill(); };
  }, []);

  /* ── Upload handling ──────────────────────────────────────────────── */
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setUploadedPhoto(url);
    triggerContinue(true, url);
  }

  function handleUploadClick() {
    if (!interactiveRef.current) return;
    fileInputRef.current?.click();
  }

  /* ── Continue (skip or upload) ────────────────────────────────────── */
  function triggerContinue(withPhoto: boolean, _photoUrl?: string) {
    if (phase !== 'idle' && phase !== 'responding') return;
    interactiveRef.current = false;
    const label = withPhoto ? 'Upload Image' : 'Skip';
    if (bubbleRef.current) bubbleRef.current.textContent = label;

    const tl = gsap.timeline();
    tl.fromTo(bubbleRef.current,
      { opacity: 0, scale: 0.85 },
      { opacity: 1, scale: 1, duration: 0.2, ease: 'back.out(1.4)' }, 0
    )
    .to(bubbleRef.current, { y: -200, scale: 0.5, opacity: 0, duration: 0.48, ease: 'power3.in' }, 0.22)
    .to([cardLeftRef.current, cardRightRef.current, cardCentreRef.current, selfieRef.current, arrowRef.current, headlineRef.current],
      { opacity: 0, y: -16, duration: 0.3, ease: 'power2.in', stagger: 0.04 }, 0.06
    )
    .to(mascotRef.current, { scale: 1.15, duration: 0.15, ease: 'power2.out' }, 0.55)
    .to(mascotRef.current, { scale: 1.0, duration: 0.22, ease: 'back.out(2)' }, 0.7)
    .call(() => {
      setPhase('exiting');
      gsap.to(containerRef.current, {
        opacity: 0, duration: 0.4, ease: 'power2.in',
        onComplete: () => withPhoto ? onNext() : onSkip(),
      });
    }, [], 1.1);
  }

  /* ── TV remote ─────────────────────────────────────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!interactiveRef.current || phase !== 'idle') return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        setFocused(f => f === 'upload' ? 'skip' : 'upload');
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (focused === 'upload') handleUploadClick();
        else triggerContinue(false);
      }
      if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault(); onSkip();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, focused]);

  /* Split headline into word spans */
  function wordSpans(text: string) {
    return text.split(' ').map((w, i, arr) => (
      <span key={i} className="sv-wrd" style={{ display: 'inline-block', marginRight: i < arr.length - 1 ? '0.25em' : 0 }}>
        {w}
      </span>
    ));
  }

  return (
    <div ref={containerRef} className="fg-screen sv-screen" data-step="selfie">
      <div className="fg-bg-glow fg-bg-glow--selfie" />
      <GlanceLogo />

      {/* ── Mascot + Headline ── */}
      <div className="sv-top">
        <div ref={mascotRef} style={{ opacity: 0 }}>
          <AgentMascot agentMode="looking" size={72} />
        </div>
        <h2 ref={headlineRef} className="sv-headline">
          {wordSpans('Imagine you discovering new experiences')}
        </h2>
      </div>

      {/* ── Card stage — three lifestyle cards + selfie transformation ── */}
      <div className="sv-stage">

        {/* Left background card — tilted left */}
        <div ref={cardLeftRef} className="sv-card sv-card--left" style={{ opacity: 0 }}>
          <img src={IMG_LEFT} alt="" className="sv-card-img"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <div className="sv-card-scrim" />
        </div>

        {/* Centre hero card — upright, largest */}
        <div ref={cardCentreRef} className="sv-card sv-card--centre" style={{ opacity: 0 }}>
          <img src={uploadedPhoto || IMG_CENTRE} alt="" className="sv-card-img" />
          <div className="sv-card-scrim" />
          <div className="sv-card-badge">For you</div>
        </div>

        {/* Right background card — tilted right */}
        <div ref={cardRightRef} className="sv-card sv-card--right" style={{ opacity: 0 }}>
          <img src={IMG_RIGHT} alt="" className="sv-card-img"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <div className="sv-card-scrim" />
        </div>

        {/* Selfie polaroid — frame + label baked into the PNG */}
        <div ref={selfieRef} className="sv-selfie-card" style={{ opacity: 0 }}>
          <img src={uploadedPhoto ? uploadedPhoto : IMG_SELFIE} alt="Your selfie" className="sv-selfie-img" />
        </div>

        {/* Transformation arrow — single clean arrow */}
        <div ref={arrowRef} className="sv-arrow" style={{ opacity: 0 }}>
          <svg viewBox="0 0 52 20" fill="none" xmlns="http://www.w3.org/2000/svg" width="52" height="20">
            <path d="M2 10 H44 M37 3 L46 10 L37 17" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

      </div>

      {/* ── CTA row ── */}
      <div ref={ctaRef} className="sv-cta-row" style={{ opacity: 0 }}>
        <button
          className={`sv-btn sv-btn--ghost${focused === 'skip' && phase === 'idle' ? ' sv-btn--focused' : ''}`}
          onClick={() => triggerContinue(false)}
        >
          Skip
        </button>
        <button
          className={`sv-btn sv-btn--primary${focused === 'upload' && phase === 'idle' ? ' sv-btn--focused' : ''}`}
          onClick={handleUploadClick}
        >
          Upload Image
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
      </div>

      {/* ── Privacy note ── */}
      <div ref={privacyRef} className="sv-privacy" style={{ opacity: 0 }}>
        <span className="sv-privacy-icon">🔒</span>
        Your selfie stays private and will only be used to generate your looks
      </div>

      {/* Input bubble */}
      <div ref={bubbleRef} className="fg-input-bubble"
        style={{ opacity: 0, position: 'absolute', top: '60%', left: '50%', transform: 'translateX(-50%)' }} />

      {/* Progress */}
      <div className="fg-progress-bar">
        <div className="fg-pip fg-pip--done" />
        <div className="fg-pip fg-pip--done" />
        <div className="fg-pip fg-pip--done" />
        <div className="fg-pip fg-pip--done" />
        <div className="fg-pip fg-pip--done" />
        <div className="fg-pip fg-pip--done" />
        <div className="fg-pip fg-pip--active" />
      </div>
    </div>
  );
}
