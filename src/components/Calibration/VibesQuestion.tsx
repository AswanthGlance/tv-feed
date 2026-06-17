/* ─────────────────────────────────────────────────────────────────────────────
   VibesQuestion — "What kind of world do you want Glance to take you to?"

   Multi-select carousel, 4 options (first 4 of Q4_VIBE_OPTIONS).
   Full Preference Collection interaction model:
     Select → Done → bubble floats → mascot pulse → agent responds →
     history ghost appears → exit to DiscoveryAppetite.
   ───────────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import AgentMascot from '../Shared/AgentMascot';
import CinematicText from '../Shared/CinematicText';
import GlanceLogo from '../Shared/GlanceLogo';
import { Q4_VIBE_OPTIONS } from '../../data/onboardingQuestions';
import { applyOnboardingSignal } from '../../logic/signals';
import type { PreferenceProfile } from '../../data/types';

/* Trim to 4 options */
const VIBE_OPTIONS = Q4_VIBE_OPTIONS.slice(0, 4);

const CARD_W   = 460;
const CARD_GAP = 24;
const STRIDE   = CARD_W + CARD_GAP;

type Props = {
  profile: PreferenceProfile;
  onNext: (p: PreferenceProfile) => void;
  onSkip: () => void;
};
type Phase = 'entering' | 'question' | 'cards' | 'responding' | 'exiting';

function buildResponse(selected: string[]): string {
  if (selected.length === 0) return "Got it. I'll keep things varied.";
  const labels = selected.map(id => VIBE_OPTIONS.find(o => o.id === id)?.label ?? '').filter(Boolean);
  if (labels.length === 1) return `${labels[0]}. I'll lean into that.`;
  return `${labels.join(' and ')}. I love the combination.`;
}

export default function VibesQuestion({ profile, onNext, onSkip }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const mascotRef     = useRef<HTMLDivElement>(null);
  const questionRef   = useRef<HTMLDivElement>(null);
  const subtitleRef   = useRef<HTMLDivElement>(null);
  const carouselRef   = useRef<HTMLDivElement>(null);
  const trackRef      = useRef<HTMLDivElement>(null);
  const actionsRef    = useRef<HTMLDivElement>(null);
  const bubbleRef     = useRef<HTMLDivElement>(null);
  const responseRef   = useRef<HTMLDivElement>(null);
  const historyRef    = useRef<HTMLDivElement>(null);

  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [phase, setPhase]               = useState<Phase>('entering');
  const [qTyping, setQTyping]           = useState(false);
  const [selected, setSelected]         = useState<string[]>([]);
  const [focusIdx, setFocusIdx]         = useState(0);
  const [focusArea, setFocusArea]       = useState<'cards' | 'done'>('cards');
  const [responseTyping, setResponseTyping] = useState(false);
  const [responseText, setResponseText]     = useState('');
  const interactiveRef = useRef(false);
  const count = VIBE_OPTIONS.length;

  /* ── Entrance ─────────────────────────────────────────────────────── */
  useEffect(() => {
    gsap.fromTo(mascotRef.current,
      { opacity: 0, y: -20, scale: 0.72 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.4)',
        onComplete: () => { setPhase('question'); setQTyping(true); },
      }
    );
  }, []);

  /* ── After question types ─────────────────────────────────────────── */
  function handleQuestionDone() {
    setTimeout(() => {
      gsap.to(subtitleRef.current, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
      gsap.fromTo(carouselRef.current,
        { opacity: 0, y: 44, filter: 'blur(8px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.7, ease: 'power3.out' }
      );
      gsap.fromTo(actionsRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.2,
          onComplete: () => { setPhase('cards'); interactiveRef.current = true; },
        }
      );
    }, 300);
  }

  /* ── Carousel slide ────────────────────────────────────────────────── */
  function slideTo(idx: number) {
    gsap.to(trackRef.current, { x: -idx * STRIDE, duration: 0.42, ease: 'power3.out' });
  }

  function toggleSelect(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  /* ── Done pressed ─────────────────────────────────────────────────── */
  function handleDone() {
    if (!interactiveRef.current) return;
    interactiveRef.current = false;
    setPhase('responding');

    const labels = selected.length > 0
      ? selected.map(id => VIBE_OPTIONS.find(o => o.id === id)?.label).filter(Boolean).join(', ')
      : 'a balanced mix';

    const response = buildResponse(selected);
    setResponseText(response);

    if (bubbleRef.current) bubbleRef.current.textContent = labels;

    const tl = gsap.timeline();

    tl.fromTo(bubbleRef.current,
      { opacity: 0, scale: 0.85, y: 0 },
      { opacity: 1, scale: 1, duration: 0.25, ease: 'back.out(1.4)' }, 0
    )
    .to(bubbleRef.current, { y: -200, scale: 0.5, opacity: 0, duration: 0.55, ease: 'power3.in' }, 0.28)
    .to([actionsRef.current, carouselRef.current, subtitleRef.current, questionRef.current],
      { opacity: 0, duration: 0.35, ease: 'power2.in' }, 0.1
    )
    .to(mascotRef.current, { scale: 1.18, duration: 0.18, ease: 'power2.out' }, 0.75)
    .to(mascotRef.current, { scale: 1.0, duration: 0.28, ease: 'back.out(2)' }, 0.93)
    .fromTo(responseRef.current,
      { opacity: 0, y: 12, filter: 'blur(4px)' },
      {
        opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.45, ease: 'power2.out',
        onComplete: () => setResponseTyping(true),
      }, 1.1
    );
  }

  function handleResponseDone() {
    setTimeout(() => {
      const tl = gsap.timeline();
      tl.to(responseRef.current, { opacity: 0, y: -10, duration: 0.28, ease: 'power2.in' }, 0)
      .fromTo(historyRef.current,
        { opacity: 0, scale: 0.85, x: -20 },
        { opacity: 1, scale: 1, x: 0, duration: 0.45, ease: 'back.out(1.3)' },
        0.2
      )
      .to(mascotRef.current, { scale: 1.06, duration: 0.12, ease: 'power2.out' }, 0.25)
      .to(mascotRef.current, { scale: 1.0,  duration: 0.18, ease: 'back.out(2)' }, 0.37)
      .to(containerRef.current, {
        opacity: 0, duration: 0.42, ease: 'power2.in',
        onComplete: () => {
          /* Apply vibe signals to profile */
          let p: PreferenceProfile = {
            ...profile,
            weights: { ...profile.weights },
            negativeWeights: { ...profile.negativeWeights },
            evidenceCounts: { ...profile.evidenceCounts },
          };
          for (const id of selected) {
            const opt = VIBE_OPTIONS.find(o => o.id === id);
            if (opt) applyOnboardingSignal(p, opt.mappedAttributes, opt.label);
          }
          onNext(p);
        },
      }, 0.85);
    }, 700);
  }

  /* ── TV remote ─────────────────────────────────────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!interactiveRef.current || phase !== 'cards') return;

      if (focusArea === 'cards') {
        if (e.key === 'ArrowLeft') { e.preventDefault(); const n = Math.max(0, focusIdx - 1); setFocusIdx(n); slideTo(n); }
        if (e.key === 'ArrowRight') { e.preventDefault(); const n = Math.min(count-1, focusIdx+1); setFocusIdx(n); slideTo(n); }
        if (e.key === 'ArrowDown') { e.preventDefault(); setFocusArea('done'); }
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSelect(VIBE_OPTIONS[focusIdx].id); }
        if (e.key === 'Escape') { e.preventDefault(); onSkip(); }
      } else if (focusArea === 'done') {
        if (e.key === 'ArrowUp') { e.preventDefault(); setFocusArea('cards'); }
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleDone(); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, focusArea, focusIdx, selected, count]);

  return (
    <div ref={containerRef} className="fg-screen" data-step="vibes">
      <div className="fg-bg-glow fg-bg-glow--q2" />
      <GlanceLogo />

      {/* History ghost — top-left */}
      <div ref={historyRef} className="bc-history-ghost wq-history-ghost" style={{ opacity: 0 }}>
        <div className="wq-history-pills">
          {selected.map(id => {
            const opt = VIBE_OPTIONS.find(o => o.id === id);
            return opt ? (
              <div key={id} className="wq-history-pill">{opt.label}</div>
            ) : null;
          })}
        </div>
        <div className="bc-history-check">✓</div>
      </div>

      {/* Mascot */}
      <div ref={mascotRef} className="fg-q-mascot" style={{ opacity: 0 }}>
        <AgentMascot agentMode="looking" size={96} />
      </div>

      {/* Response */}
      <div ref={responseRef} className="fg-q-response" style={{ opacity: 0 }}>
        {phase === 'responding' || phase === 'exiting' ? (
          <CinematicText
            text={responseText}
            playing={responseTyping}
            speed={0.038}
            duration={0.40}
            onDone={handleResponseDone}
            className="fg-response-text"
          />
        ) : null}
      </div>

      {/* Question */}
      <div ref={questionRef} className="fg-q-title" style={{ minHeight: 60 }}>
        {(phase === 'question' || phase === 'cards' || phase === 'responding') && (
          <CinematicText
            text="What kind of world do you want Glance to take you to?"
            playing={qTyping}
            speed={0.028}
            duration={0.42}
            onDone={handleQuestionDone}
          />
        )}
      </div>

      {/* Subtitle */}
      <div ref={subtitleRef} className="fg-q-subtitle" style={{ opacity: 0, transform: 'translateY(10px)' }}>
        Pick the vibes that feel most like you
      </div>

      {/* Carousel */}
      <div ref={carouselRef} className="fg-carousel-viewport" style={{ opacity: 0 }}>
        <div ref={trackRef} className="fg-carousel-track">
          {VIBE_OPTIONS.map((opt, i) => {
            const isFocused  = focusArea === 'cards' && focusIdx === i && phase === 'cards';
            const isSelected = selected.includes(opt.id);
            return (
              <div
                key={opt.id}
                ref={el => { cardRefs.current[i] = el; }}
                className={['fg-topic-card', isFocused ? 'fg-topic-card--focused' : '', isSelected ? 'fg-topic-card--selected' : ''].filter(Boolean).join(' ')}
                onClick={() => interactiveRef.current && phase === 'cards' && toggleSelect(opt.id)}
              >
                <img src={opt.image} alt={opt.label}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <div className="fg-card-overlay" />
                <div className={`fg-radio${isSelected ? ' fg-radio--selected' : ''}`} />
                <div className="fg-card-label">{opt.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action pills */}
      <div ref={actionsRef} className="fg-pill-row" style={{ opacity: 0 }}>
        <button
          className={`fg-pill-btn${focusArea === 'done' && phase === 'cards' ? ' fg-pill-btn--focused' : ''}`}
          onClick={handleDone}
        >
          {selected.length === 0 ? 'Skip' : 'Done'}
        </button>
      </div>

      {/* Input bubble */}
      <div ref={bubbleRef} className="fg-input-bubble" style={{ opacity: 0, position: 'absolute', top: '72%', left: '50%', transform: 'translateX(-50%)' }} />

      {/* Progress */}
      <div className="fg-progress-bar">
        <div className="fg-pip fg-pip--done" />
        <div className="fg-pip fg-pip--done" />
        <div className="fg-pip fg-pip--done" />
        <div className="fg-pip fg-pip--done" />
        <div className="fg-pip fg-pip--active" />
      </div>
    </div>
  );
}
