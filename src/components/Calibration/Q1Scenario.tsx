/* ─────────────────────────────────────────────────────────────────────────────
   Q1Scenario — "What should your TV bring up first?"

   Uses the BangaloreConfirm interaction model:
   1. Mascot enters → question reveals (cinematic)
   2. Subtitle + 4 cards appear in a 2×2 grid
   3. USER SELECTS:
      a. Other cards fade/slide off
      b. Selected card moves to center-hero position
      c. Mascot pulse
      d. Multi-phrase acknowledgement reveals one line at a time
      e. Selected card floats up → becomes history ghost top-left
      f. Exit to next screen
   ───────────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import AgentMascot from '../Shared/AgentMascot';
import CinematicText from '../Shared/CinematicText';
import GlanceLogo from '../Shared/GlanceLogo';
import { Q1_SCENARIO_OPTIONS } from '../../data/onboardingQuestions';
import { applyOnboardingSignal } from '../../logic/signals';
import type { PreferenceProfile } from '../../data/types';

type Props = {
  profile: PreferenceProfile;
  onNext: (p: PreferenceProfile) => void;
  onSkip: () => void;
};

const ACK_LINES: Record<string, readonly [string, string, string]> = {
  'slow-morning': [
    'A beautiful place.',
    'Great eye.',
    'Travel and scenics, tuned in.',
  ],
  'forest-trail': [
    'A good meal.',
    'My kind of answer.',
    "We'll find you the best local finds.",
  ],
  'social-brunch': [
    'A fresh look.',
    'Style it is.',
    "I'll keep your feed sharp.",
  ],
  'city-lights': [
    'A calmer home.',
    'Nice.',
    "Spaces and interiors, coming up.",
  ],
};

type Phase =
  | 'entering'
  | 'question'
  | 'cards'
  | 'herozing'
  | 'ack1' | 'ack2' | 'ack3'
  | 'history'
  | 'exiting';

export default function Q1Scenario({ profile, onNext, onSkip }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const mascotRef     = useRef<HTMLDivElement>(null);
  const questionRef   = useRef<HTMLDivElement>(null);
  const subtitleRef   = useRef<HTMLDivElement>(null);
  const cardsRef      = useRef<HTMLDivElement>(null);
  const responseRef   = useRef<HTMLDivElement>(null);
  const historyRef    = useRef<HTMLDivElement>(null);
  const historyImgRef = useRef<HTMLImageElement>(null);
  const historyLblRef = useRef<HTMLDivElement>(null);

  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [phase, setPhase]           = useState<Phase>('entering');
  const [qPlaying, setQPlaying]     = useState(false);
  const [focusIdx, setFocusIdx]     = useState(0);
  const [selected, setSelected]     = useState<string | null>(null);

  const [ack1Playing, setAck1Playing] = useState(false);
  const [ack2Playing, setAck2Playing] = useState(false);
  const [ack3Playing, setAck3Playing] = useState(false);
  const ackLines  = useRef<readonly [string, string, string]>(['', '', '']);
  const ack1Ref   = useRef<HTMLDivElement>(null);
  const ack2Ref   = useRef<HTMLDivElement>(null);
  const ack3Ref   = useRef<HTMLDivElement>(null);

  const interactiveRef   = useRef(false);
  const selectedIdxRef   = useRef(0);

  /* ── Entrance ─────────────────────────────────────────────────────── */
  useEffect(() => {
    gsap.fromTo(mascotRef.current,
      { opacity: 0, y: -22, scale: 0.72 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.4)',
        onComplete: () => { setPhase('question'); setQPlaying(true); },
      }
    );
  }, []);

  /* ── Question done → subtitle + cards ──────────────────────────────── */
  function handleQuestionDone() {
    setTimeout(() => {
      gsap.to(subtitleRef.current, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' });
      gsap.fromTo(cardRefs.current,
        { opacity: 0, y: 54, scale: 0.92, filter: 'blur(8px)' },
        {
          opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
          duration: 0.72, stagger: 0.1, ease: 'power3.out',
          onComplete: () => { setPhase('cards'); interactiveRef.current = true; },
        }
      );
    }, 300);
  }

  /* ── Card selection ─────────────────────────────────────────────────── */
  function handleSelect(optId: string, idx: number) {
    if (!interactiveRef.current || selected !== null) return;
    interactiveRef.current = false;
    selectedIdxRef.current = idx;
    setSelected(optId);
    setPhase('herozing');

    const opt = Q1_SCENARIO_OPTIONS.find(o => o.id === optId)!;
    ackLines.current = ACK_LINES[optId] ?? ['Got it.', 'Nice choice.', 'Tuning your feed now.'];

    /* Set history card content */
    if (historyImgRef.current) historyImgRef.current.src = opt.image ?? '';
    if (historyLblRef.current) historyLblRef.current.textContent = opt.label;

    const chosenCard = cardRefs.current[idx];
    const otherCards = cardRefs.current.filter((_, i) => i !== idx);

    const tl = gsap.timeline();

    /* Other cards slide off + fade */
    tl.to(otherCards, {
      opacity: 0,
      scale: 0.80,
      y: 30,
      duration: 0.4,
      ease: 'power3.in',
      stagger: 0.06,
    }, 0)

    /* Subtitle + question fade */
    .to([questionRef.current, subtitleRef.current],
      { opacity: 0, y: -12, duration: 0.30, ease: 'power2.in' }, 0.05
    )

    /* Selected card moves to center-hero */
    .to(chosenCard, {
      x: 0, y: -60, scale: 1.1,
      duration: 0.68, ease: 'back.out(1.2)',
    }, 0.14)

    /* Mascot pulse */
    .to(mascotRef.current, { scale: 1.18, duration: 0.16, ease: 'power2.out' }, 0.72)
    .to(mascotRef.current, { scale: 1.0,  duration: 0.26, ease: 'back.out(2)' }, 0.88)

    /* Ack area fades in */
    .fromTo(responseRef.current,
      { opacity: 0, y: 8, filter: 'blur(4px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.38, ease: 'power2.out',
        onComplete: () => { setPhase('ack1'); setAck1Playing(true); },
      }, 1.05
    );
  }

  /* ── Ack line 1 done ─────────────────────────────────────────────── */
  function handleAck1Done() {
    setTimeout(() => {
      gsap.fromTo(ack2Ref.current,
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out',
          onComplete: () => { setPhase('ack2'); setAck2Playing(true); },
        }
      );
    }, 380);
  }

  /* ── Ack line 2 done ─────────────────────────────────────────────── */
  function handleAck2Done() {
    setTimeout(() => {
      gsap.fromTo(ack3Ref.current,
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out',
          onComplete: () => { setPhase('ack3'); setAck3Playing(true); },
        }
      );
    }, 420);
  }

  /* ── Ack line 3 done → history stack ─────────────────────────────── */
  function handleAck3Done() {
    const chosenCard = cardRefs.current[selectedIdxRef.current];
    setTimeout(() => {
      setPhase('history');
      const tl = gsap.timeline();

      tl.to([ack1Ref.current, ack2Ref.current, ack3Ref.current],
        { opacity: 0, y: -10, duration: 0.28, ease: 'power2.in', stagger: 0.06 }, 0
      )
      .to(chosenCard, {
        opacity: 0, y: -120, scale: 0.60,
        duration: 0.55, ease: 'power3.in',
      }, 0.1)
      .fromTo(historyRef.current,
        { opacity: 0, scale: 0.85, x: -20 },
        { opacity: 1, scale: 1, x: 0, duration: 0.45, ease: 'back.out(1.3)' },
        0.55
      )
      .to(mascotRef.current, { scale: 1.08, duration: 0.14, ease: 'power2.out' }, 0.6)
      .to(mascotRef.current, { scale: 1.0,  duration: 0.20, ease: 'back.out(2)' }, 0.74)
      .to(containerRef.current, {
        opacity: 0, duration: 0.42, ease: 'power2.in',
        onComplete: () => {
          const selectedOpt = Q1_SCENARIO_OPTIONS.find(o => o.id === selected)!;
          const p: PreferenceProfile = {
            ...profile,
            weights: { ...profile.weights },
            negativeWeights: { ...profile.negativeWeights },
            evidenceCounts: { ...profile.evidenceCounts },
            selectedQ1Scenario: selected!,
          };
          applyOnboardingSignal(p, selectedOpt.mappedAttributes, selectedOpt.label);
          onNext(p);
        },
      }, 1.4);
    }, 600);
  }

  /* ── TV remote ─────────────────────────────────────────────────────── */
  useEffect(() => {
    const count = Q1_SCENARIO_OPTIONS.length;
    const handler = (e: KeyboardEvent) => {
      if (phase !== 'cards' || !interactiveRef.current) return;
      if (e.key === 'ArrowLeft')  { e.preventDefault(); setFocusIdx(i => Math.max(0, i - 1)); }
      if (e.key === 'ArrowRight') { e.preventDefault(); setFocusIdx(i => Math.min(count - 1, i + 1)); }
      if (e.key === 'ArrowUp')    { e.preventDefault(); setFocusIdx(i => Math.max(0, i - 2)); }
      if (e.key === 'ArrowDown')  { e.preventDefault(); setFocusIdx(i => Math.min(count - 1, i + 2)); }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelect(Q1_SCENARIO_OPTIONS[focusIdx].id, focusIdx); }
      if (e.key === 'Escape' || e.key === 'Backspace') { e.preventDefault(); onSkip(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, focusIdx]);

  return (
    <div ref={containerRef} className="fg-screen" data-step="q1s">
      <div className="fg-bg-glow fg-bg-glow--q1" />
      <GlanceLogo />

      {/* History ghost — top-left */}
      <div ref={historyRef} className="bc-history-ghost" style={{ opacity: 0 }}>
        <div className="bc-history-card">
          <img ref={historyImgRef} src="" alt="" className="bc-history-img" />
          <div className="fg-card-overlay" />
          <div ref={historyLblRef} className="bc-history-label" />
        </div>
        <div className="bc-history-check">✓</div>
      </div>

      {/* Mascot */}
      <div ref={mascotRef} className="fg-q-mascot" style={{ opacity: 0 }}>
        <AgentMascot agentMode="looking" size={96} />
      </div>

      {/* Multi-phrase acknowledgement */}
      <div ref={responseRef} className="fg-q-response bc-ack-area" style={{ opacity: 0 }}>
        <div ref={ack1Ref} className="bc-ack-line bc-ack-line--primary" style={{ opacity: 0 }}>
          <CinematicText
            text={ackLines.current[0]}
            playing={ack1Playing}
            speed={0.055}
            duration={0.45}
            onDone={handleAck1Done}
            className="fg-response-text bc-ack-text--primary"
          />
        </div>
        <div ref={ack2Ref} className="bc-ack-line" style={{ opacity: 0 }}>
          <CinematicText
            text={ackLines.current[1]}
            playing={ack2Playing}
            speed={0.048}
            duration={0.38}
            onDone={handleAck2Done}
            className="fg-response-text"
          />
        </div>
        <div ref={ack3Ref} className="bc-ack-line bc-ack-line--tertiary" style={{ opacity: 0 }}>
          <CinematicText
            text={ackLines.current[2]}
            playing={ack3Playing}
            speed={0.038}
            duration={0.35}
            onDone={handleAck3Done}
            className="fg-response-text bc-ack-text--tertiary"
          />
        </div>
      </div>

      {/* Question */}
      <div ref={questionRef} className="fg-q-title" style={{ minHeight: 60 }}>
        {(phase === 'question' || phase === 'cards') && (
          <CinematicText
            text="What should your TV bring up first?"
            playing={qPlaying}
            speed={0.030}
            duration={0.42}
            onDone={handleQuestionDone}
          />
        )}
      </div>

      {/* Subtitle */}
      <div ref={subtitleRef} className="fg-q-subtitle" style={{ opacity: 0, transform: 'translateY(10px)' }}>
        Pick what feels most like you right now
      </div>

      {/* 2×2 card grid */}
      <div ref={cardsRef} className="q1s-grid">
        {Q1_SCENARIO_OPTIONS.map((opt, i) => {
          const isFocused  = focusIdx === i && phase === 'cards';
          const isSelected = selected === opt.id;
          return (
            <div
              key={opt.id}
              ref={el => { cardRefs.current[i] = el; }}
              className={[
                'q1s-card',
                isFocused  ? 'q1s-card--focused'  : '',
                isSelected ? 'q1s-card--selected' : '',
              ].filter(Boolean).join(' ')}
              style={{ opacity: 0 }}
              onClick={() => interactiveRef.current && phase === 'cards' && handleSelect(opt.id, i)}
            >
              <img src={opt.image} alt={opt.label}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div className="fg-card-overlay" />
              {isSelected && <div className="q1s-card-check">✓</div>}
              <div className="q1s-card-body">
                <div className="q1s-card-label">{opt.label}</div>
                <div className="q1s-card-sublabel">{opt.sublabel}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress */}
      <div className="fg-progress-bar">
        <div className="fg-pip fg-pip--active" />
        <div className="fg-pip" />
        <div className="fg-pip" />
        <div className="fg-pip" />
        <div className="fg-pip" />
      </div>
    </div>
  );
}
