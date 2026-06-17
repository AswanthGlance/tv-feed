/* ─────────────────────────────────────────────────────────────────────────────
   WorldsQuestion — "What topics should your TV surface?"

   Multi-select carousel, 4 visible options (trimmed from 8).
   Selection model: Done → selected cards center-stage → agent ack → history stack.

   Multi-select history: selected cards stack vertically, shrink, land top-left.
   ───────────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import AgentMascot from '../Shared/AgentMascot';
import CinematicText from '../Shared/CinematicText';
import GlanceLogo from '../Shared/GlanceLogo';

export interface WorldOption { id: string; title: string; image: string; }

export const WORLD_OPTIONS: WorldOption[] = [
  { id: 'food-finds',        title: 'Food Finds',         image: '/images/feed/feed_47-food-monsoon-chai-stall.jpg' },
  { id: 'weekend-escapes',   title: 'Weekend Escapes',    image: '/images/feed/feed_54-travel-kerala-backwaters-houseboat.jpg' },
  { id: 'calm-routines',     title: 'Calm Routines',      image: '/images/feed/feed_07-wellness-morning-ritual.jpg' },
  { id: 'home-upgrades',     title: 'Home Upgrades',      image: '/images/feed/feed_24-home-cozy-monsoon-living-room.jpg' },
];

const CARD_W   = 460;
const CARD_GAP = 24;
const STRIDE   = CARD_W + CARD_GAP;

type Props = { onNext: (ids: string[]) => void; onSkip: () => void };
type Phase = 'entering' | 'question' | 'cards' | 'responding' | 'exiting';

function buildResponse(selected: string[]): string {
  if (selected.length === 0) return 'Got it. I\'ll build a balanced mix for you.';
  const labels = selected.map(id => WORLD_OPTIONS.find(o => o.id === id)?.title ?? '').filter(Boolean);
  if (labels.length === 1) return `${labels[0]}. I'll make sure that shows up well.`;
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}. Great combination.`;
}

export default function WorldsQuestion({ onNext, onSkip }: Props) {
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
  const interactiveRef  = useRef(false);
  const count = WORLD_OPTIONS.length;

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
      ? selected.map(id => WORLD_OPTIONS.find(o => o.id === id)?.title).filter(Boolean).join(', ')
      : 'a balanced mix';

    const response = buildResponse(selected);
    setResponseText(response);

    if (bubbleRef.current) bubbleRef.current.textContent = labels;

    const tl = gsap.timeline();

    /* Selected cards move to center */
    const selectedCards = selected
      .map(id => cardRefs.current[WORLD_OPTIONS.findIndex(o => o.id === id)])
      .filter(Boolean) as HTMLDivElement[];
    const unselectedCards = cardRefs.current
      .filter((_, i) => !selected.includes(WORLD_OPTIONS[i].id))
      .filter(Boolean) as HTMLDivElement[];

    tl.to(unselectedCards, {
      opacity: 0, scale: 0.78, y: 20,
      duration: 0.38, ease: 'power3.in', stagger: 0.06,
    }, 0.05)

    /* Fade actions + subtitle + question */
    .to([actionsRef.current, subtitleRef.current, questionRef.current],
      { opacity: 0, duration: 0.32, ease: 'power2.in' }, 0.08
    )
    .to(carouselRef.current, { opacity: 0, duration: 0.32, ease: 'power2.in' }, 0.1)

    /* Bubble floats up */
    .fromTo(bubbleRef.current,
      { opacity: 0, scale: 0.85, y: 0 },
      { opacity: 1, scale: 1, duration: 0.25, ease: 'back.out(1.4)' }, 0
    )
    .to(bubbleRef.current, { y: -200, scale: 0.5, opacity: 0, duration: 0.55, ease: 'power3.in' }, 0.28)

    /* Mascot pulse */
    .to(mascotRef.current, { scale: 1.18, duration: 0.18, ease: 'power2.out' }, 0.75)
    .to(mascotRef.current, { scale: 1.0, duration: 0.28, ease: 'back.out(2)' }, 0.93)

    /* Response types */
    .fromTo(responseRef.current,
      { opacity: 0, y: 12, filter: 'blur(4px)' },
      {
        opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.45, ease: 'power2.out',
        onComplete: () => setResponseTyping(true),
      }, 1.1
    );

    void selectedCards;
  }

  function handleResponseDone() {
    setTimeout(() => {
      /* Response fades, then history ghost appears top-left */
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
        onComplete: () => onNext(selected),
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
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSelect(WORLD_OPTIONS[focusIdx].id); }
        if (e.key === 'Escape') { e.preventDefault(); onSkip(); }
      } else if (focusArea === 'done') {
        if (e.key === 'ArrowUp') { e.preventDefault(); setFocusArea('cards'); }
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleDone(); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, focusArea, focusIdx, selected, count]);

  /* Build history label */
  const historyLabel = selected.length > 0
    ? selected.map(id => WORLD_OPTIONS.find(o => o.id === id)?.title).filter(Boolean).join(', ')
    : '';

  return (
    <div ref={containerRef} className="fg-screen" data-step="worlds">
      <div className="fg-bg-glow fg-bg-glow--q2" />
      <GlanceLogo />

      {/* History ghost — top-left, shows selected topics after ack */}
      <div ref={historyRef} className="bc-history-ghost wq-history-ghost" style={{ opacity: 0 }}>
        <div className="wq-history-pills">
          {selected.map(id => {
            const opt = WORLD_OPTIONS.find(o => o.id === id);
            return opt ? (
              <div key={id} className="wq-history-pill">{opt.title}</div>
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
            speed={0.036}
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
            text="What topics should your TV surface?"
            playing={qTyping}
            speed={0.032}
            duration={0.42}
            onDone={handleQuestionDone}
          />
        )}
      </div>

      {/* Subtitle */}
      <div ref={subtitleRef} className="fg-q-subtitle" style={{ opacity: 0, transform: 'translateY(10px)' }}>
        Pick as many as you like
      </div>

      {/* Carousel */}
      <div ref={carouselRef} className="fg-carousel-viewport" style={{ opacity: 0 }}>
        <div ref={trackRef} className="fg-carousel-track">
          {WORLD_OPTIONS.map((opt, i) => {
            const isFocused  = focusArea === 'cards' && focusIdx === i && phase === 'cards';
            const isSelected = selected.includes(opt.id);
            return (
              <div
                key={opt.id}
                ref={el => { cardRefs.current[i] = el; }}
                className={['fg-topic-card', isFocused ? 'fg-topic-card--focused' : '', isSelected ? 'fg-topic-card--selected' : ''].filter(Boolean).join(' ')}
                onClick={() => interactiveRef.current && phase === 'cards' && toggleSelect(opt.id)}
              >
                <img src={opt.image} alt={opt.title}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <div className="fg-card-overlay" />
                <div className={`fg-radio${isSelected ? ' fg-radio--selected' : ''}`} />
                <div className="fg-card-label">{opt.title}</div>
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
        <div className="fg-pip fg-pip--active" />
        <div className="fg-pip" />
      </div>

      <div style={{ display: 'none' }}>{historyLabel}</div>
    </div>
  );
}
