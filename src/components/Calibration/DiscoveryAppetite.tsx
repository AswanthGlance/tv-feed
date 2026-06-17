import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import AgentMascot from '../Shared/AgentMascot';
import CinematicText from '../Shared/CinematicText';
import GlanceLogo from '../Shared/GlanceLogo';

/* ─────────────────────────────────────────────────────────────────────────────
   DiscoveryAppetite — "How far should I take you?"

   Redesigned as HORIZONTAL CAROUSEL (same visual system as WorldsQuestion),
   not a vertical list. Matches the premium quality of other onboarding screens.

   4 full-bleed image cards in a scrollable horizontal strip.
   Single-select. Focused card scales up with white glow ring.
   Selected card stays bigger with selected radio.
   Agentic flow: select → input bubble → mascot pulse → response types close to agent → exit.
   ───────────────────────────────────────────────────────────────────────────── */

const OPTIONS = [
  { id: 'familiar',    label: 'Keep it familiar',      desc: 'More of what feels right',        image: '/images/feed/feed_28-home-japandi-minimal-living.jpg' },
  { id: 'medium',      label: 'Mix in related ideas',  desc: 'Familiar with nearby discoveries', image: '/images/feed/feed_40-travel-wildlife-dawn-grassland.jpg' },
  { id: 'medium_high', label: 'Surprise me sometimes', desc: 'New worlds, regularly',             image: '/images/feed/feed_34-travel-nordic-winter-cabin.jpg' },
  { id: 'high',        label: 'Take me somewhere new', desc: 'Boldly fresh every time',          image: '/images/feed/feed_52-wellness-surf-morning.jpg' },
] as const;

type AppetiteId = typeof OPTIONS[number]['id'];
type Phase = 'entering' | 'question' | 'cards' | 'responding' | 'exiting';

const CARD_W   = 400;
const CARD_GAP = 24;
const STRIDE   = CARD_W + CARD_GAP;

type Props = { onNext: (appetite: AppetiteId) => void; onSkip: () => void };

export default function DiscoveryAppetite({ onNext, onSkip }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mascotRef    = useRef<HTMLDivElement>(null);
  const questionRef  = useRef<HTMLDivElement>(null);
  const subtitleRef  = useRef<HTMLDivElement>(null);
  const carouselRef  = useRef<HTMLDivElement>(null);
  const trackRef     = useRef<HTMLDivElement>(null);
  const bubbleRef    = useRef<HTMLDivElement>(null);
  const responseRef  = useRef<HTMLDivElement>(null);
  const historyRef   = useRef<HTMLDivElement>(null);
  const historyLblRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase]               = useState<Phase>('entering');
  const [qTyping, setQTyping]           = useState(false);
  const [focusIdx, setFocusIdx]         = useState(0);
  const [selected, setSelected]         = useState<AppetiteId | null>(null);
  const [responseTyping, setResponseTyping] = useState(false);
  const interactiveRef = useRef(false);

  /* ── Entrance ─────────────────────────────────────────────────────── */
  useEffect(() => {
    gsap.fromTo(mascotRef.current,
      { opacity: 0, y: -20, scale: 0.72 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.4)',
        onComplete: () => { setPhase('question'); setQTyping(true); },
      }
    );
  }, []);

  /* ── After question ─────────────────────────────────────────────────── */
  function handleQuestionDone() {
    setTimeout(() => {
      gsap.to(subtitleRef.current, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
      gsap.fromTo(carouselRef.current,
        { opacity: 0, y: 40, filter: 'blur(8px)' },
        {
          opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.68, ease: 'power3.out',
          onComplete: () => { setPhase('cards'); interactiveRef.current = true; },
        }
      );
    }, 300);
  }

  /* ── Slide carousel ─────────────────────────────────────────────────── */
  function slideTo(idx: number) {
    gsap.to(trackRef.current, { x: -idx * STRIDE, duration: 0.42, ease: 'power3.out' });
  }

  /* ── Selection ──────────────────────────────────────────────────────── */
  function handleSelect(id: AppetiteId, idx: number) {
    if (!interactiveRef.current || selected !== null) return;
    interactiveRef.current = false;
    setSelected(id);

    const opt = OPTIONS.find(o => o.id === id)!;
    if (bubbleRef.current) bubbleRef.current.textContent = opt.label;

    const tl = gsap.timeline();
    tl.fromTo(bubbleRef.current,
      { opacity: 0, scale: 0.85 },
      { opacity: 1, scale: 1, duration: 0.22, ease: 'back.out(1.4)' }, 0
    )
    .to(bubbleRef.current, { y: -200, scale: 0.5, opacity: 0, duration: 0.5, ease: 'power3.in' }, 0.25)
    .to([questionRef.current, subtitleRef.current, carouselRef.current],
      { opacity: 0, duration: 0.32, ease: 'power2.in' }, 0.08
    )
    .to(mascotRef.current, { scale: 1.18, duration: 0.15, ease: 'power2.out' }, 0.68)
    .to(mascotRef.current, { scale: 1.0, duration: 0.24, ease: 'back.out(2)' }, 0.83)
    .fromTo(responseRef.current,
      { opacity: 0, y: 8, filter: 'blur(4px)' },
      {
        opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.42, ease: 'power2.out',
        onComplete: () => { setPhase('responding'); setResponseTyping(true); },
      }, 1.0
    );

    void idx; // used implicitly for clarity
  }

  const RESPONSES: Record<AppetiteId, string> = {
    familiar:    "Got it — I'll keep things comfortably close.",
    medium:      "Nice. Familiar with interesting finds along the way.",
    medium_high: "Great — I'll mix in fresh perspectives regularly.",
    high:        "Adventurous. Your feed will keep surprising you.",
  };

  function handleResponseDone() {
    if (selected && historyLblRef.current) {
      const opt = OPTIONS.find(o => o.id === selected);
      historyLblRef.current.textContent = opt?.label ?? '';
    }
    setTimeout(() => {
      setPhase('exiting');
      const tl = gsap.timeline();
      tl.to(responseRef.current, { opacity: 0, y: -10, duration: 0.28, ease: 'power2.in' }, 0)
      .fromTo(historyRef.current,
        { opacity: 0, scale: 0.85, x: -20 },
        { opacity: 1, scale: 1, x: 0, duration: 0.45, ease: 'back.out(1.3)' },
        0.18
      )
      .to(mascotRef.current, { scale: 1.06, duration: 0.12, ease: 'power2.out' }, 0.24)
      .to(mascotRef.current, { scale: 1.0,  duration: 0.18, ease: 'back.out(2)' }, 0.36)
      .to(containerRef.current, {
        opacity: 0, duration: 0.42, ease: 'power2.in',
        onComplete: () => selected ? onNext(selected) : onSkip(),
      }, 0.82);
    }, 800);
  }

  /* ── TV remote ─────────────────────────────────────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!interactiveRef.current || phase !== 'cards') return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); const n = Math.max(0, focusIdx-1); setFocusIdx(n); slideTo(n); }
      if (e.key === 'ArrowRight') { e.preventDefault(); const n = Math.min(OPTIONS.length-1, focusIdx+1); setFocusIdx(n); slideTo(n); }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelect(OPTIONS[focusIdx].id, focusIdx); }
      if (e.key === 'Escape') { e.preventDefault(); onSkip(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, focusIdx]);

  return (
    <div ref={containerRef} className="fg-screen" data-step="q3">
      <div className="fg-bg-glow fg-bg-glow--q2" />
      <GlanceLogo />

      {/* History ghost — selected choice lingers top-left after ack */}
      <div ref={historyRef} className="bc-history-ghost" style={{ opacity: 0 }}>
        <div className="bc-history-card" style={{ width: 160, height: 100, borderRadius: 12 }}>
          {selected && (
            <img
              src={OPTIONS.find(o => o.id === selected)?.image ?? ''}
              alt=""
              className="bc-history-img"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <div className="fg-card-overlay" />
          <div ref={historyLblRef} className="bc-history-label" />
        </div>
        <div className="bc-history-check">✓</div>
      </div>

      {/* Mascot top-center — size 96 for emotional presence */}
      <div ref={mascotRef} className="fg-q-mascot" style={{ opacity: 0 }}>
        <AgentMascot agentMode="looking" size={96} />
      </div>

      {/* Response — directly below mascot, before question in DOM */}
      <div ref={responseRef} className="fg-q-response" style={{ opacity: 0 }}>
        {selected && (phase === 'responding' || phase === 'exiting') && (
          <CinematicText
            text={RESPONSES[selected]}
            playing={responseTyping}
            speed={0.038}
            duration={0.40}
            onDone={handleResponseDone}
            className="fg-response-text"
          />
        )}
      </div>

      <div ref={questionRef} className="fg-q-title" style={{ minHeight: 60 }}>
        {phase !== 'entering' && (
          <CinematicText
            text="How far should I take you?"
            playing={qTyping}
            speed={0.034}
            duration={0.42}
            onDone={handleQuestionDone}
          />
        )}
      </div>

      <div ref={subtitleRef} className="fg-q-subtitle" style={{ opacity: 0, transform: 'translateY(10px)' }}>
        Sets the balance between familiar and new
      </div>

      {/* Horizontal carousel — same system as WorldsQuestion */}
      <div ref={carouselRef} className="fg-carousel-viewport fg-carousel-viewport--discovery" style={{ opacity: 0 }}>
        <div ref={trackRef} className="fg-carousel-track">
          {OPTIONS.map((opt, i) => {
            const isFocused  = focusIdx === i && phase === 'cards';
            const isSelected = selected === opt.id;
            return (
              <div
                key={opt.id}
                className={[
                  'fg-topic-card', 'fg-disc-card',
                  isFocused  ? 'fg-topic-card--focused'  : '',
                  isSelected ? 'fg-topic-card--selected' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => interactiveRef.current && phase === 'cards' && handleSelect(opt.id, i)}
              >
                <img src={opt.image} alt={opt.label}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <div className="fg-card-overlay" />
                <div className={`fg-radio${isSelected ? ' fg-radio--selected' : ''}`} />
                {/* Longer label + desc */}
                <div className="fg-disc-card-body">
                  <div className="fg-disc-card-label">{opt.label}</div>
                  <div className="fg-disc-card-desc">{opt.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Input bubble */}
      <div ref={bubbleRef} className="fg-input-bubble" style={{ opacity: 0, position: 'absolute', top: '74%', left: '50%', transform: 'translateX(-50%)' }} />

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
