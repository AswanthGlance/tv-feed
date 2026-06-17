/* ─────────────────────────────────────────────────────────────────────────────
   BangaloreConfirm — "I see you're in Bengaluru – that right?"
   Q1 of 7. Single-select, auto-commits on selection.
   Same FLIP center-stage pattern as all other setup questions.
   ───────────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import AgentMascot from '../Shared/AgentMascot';
import CinematicText from '../Shared/CinematicText';
import GlanceLogo from '../Shared/GlanceLogo';
import SetupStructuredReply from '../Calibration/SetupStructuredReply';
import { flipCenterStage } from '../Calibration/flipCenterStage';

type Phase = 'entering' | 'question' | 'cards' | 'responding' | 'exiting';
type FocusArea = 'cards' | 'skip';

type Option = { id: 'bengaluru' | 'notQuite'; label: string; image: string };

const OPTIONS: Option[] = [
  { id: 'bengaluru', label: 'Yes, Bengaluru', image: '/images/feed/feed_58-travel-mumbai-marine-drive-night.jpg' },
  { id: 'notQuite',  label: 'Not quite',      image: '/images/feed/feed_29-travel-goa-coastal-road.jpg' },
];

const REPLIES: Record<'bengaluru' | 'notQuite', [string, string, string]> = {
  bengaluru: ["Bengaluru.", "Good choice.", "The city's been buzzing lately."],
  notQuite:  ["Got it.", "I'll start broad.", "We can tune it as you explore."],
};

const CARD_W = 'clamp(220px,20vw,320px)';
const CARD_H = 'clamp(200px,26vh,300px)';
const CARD_BR = 'clamp(14px,1.6vw,22px)';

type Props = {
  onConfirm: () => void;
  onNotQuite: () => void;
  onBack?: () => void;
  fromWelcome?: boolean;
};

export default function BangaloreConfirm({ onConfirm, onNotQuite, onBack, fromWelcome = false }: Props) {
  const rootRef       = useRef<HTMLDivElement>(null);
  const mascotRef     = useRef<HTMLDivElement>(null);
  const questionRef   = useRef<HTMLDivElement>(null);
  const subtitleRef   = useRef<HTMLDivElement>(null);
  const cardsRowRef   = useRef<HTMLDivElement>(null);
  const flyLayerRef   = useRef<HTMLDivElement>(null);
  const celebAgentRef = useRef<HTMLDivElement>(null);
  const cardWrapperRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [phase, setPhase]           = useState<Phase>('entering');
  const [qTyping, setQTyping]       = useState(false);
  const [focusIdx, setFocusIdx]     = useState(0);
  const [focusArea, setFocusArea]   = useState<FocusArea>('cards');
  const [replyLines, setReplyLines] = useState<[string, string, string]>(['', '', '']);
  const [replyPlaying, setReplyPlaying] = useState(false);
  const [celebAgentTop, setCelebAgentTop] = useState(0);
  const selectedId = useRef<'bengaluru' | 'notQuite' | null>(null);
  const interactiveRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const entrance = fromWelcome
      ? (cb: () => void) => gsap.to(mascotRef.current, { opacity: 1, duration: 0.3, ease: 'power1.out', onComplete: cb })
      : (cb: () => void) => gsap.fromTo(mascotRef.current,
          { opacity: 0, y: -22, scale: 0.72 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.4)', onComplete: cb }
        );
    entrance(() => { setPhase('question'); setQTyping(true); });
  }, [fromWelcome]);

  useEffect(() => () => {
    timersRef.current.forEach(clearTimeout);
    if (flyLayerRef.current) flyLayerRef.current.innerHTML = '';
  }, []);

  function handleQuestionDone() {
    const t = setTimeout(() => {
      gsap.to(subtitleRef.current, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
      gsap.fromTo(cardsRowRef.current,
        { opacity: 0, y: 36, filter: 'blur(8px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.65, ease: 'power3.out',
          onComplete: () => { setPhase('cards'); interactiveRef.current = true; },
        }
      );
    }, 280);
    timersRef.current.push(t);
  }

  function handleSelect(idx: number) {
    if (!interactiveRef.current || phase !== 'cards') return;
    interactiveRef.current = false;
    const opt = OPTIONS[idx];
    selectedId.current = opt.id;
    setPhase('responding');
    setReplyLines(REPLIES[opt.id]);

    const flyLayer = flyLayerRef.current;
    const root     = rootRef.current;
    if (!flyLayer || !root) return;

    const selectedCards = [{ id: opt.id, label: opt.label, image: opt.image, el: cardWrapperRefs.current[idx]! }].filter(c => c.el != null);
    const unselectedEls = OPTIONS.map((_, i) => i === idx ? null : cardWrapperRefs.current[i]).filter((el): el is HTMLDivElement => el != null);

    flipCenterStage({
      selectedCards,
      unselectedEls,
      flyLayer,
      root,
      questionEl: questionRef.current,
      actionsEl: null,
      subtitleEl: subtitleRef.current,
      onAgentReady: (agentTop) => {
        setCelebAgentTop(agentTop);
        if (!celebAgentRef.current) return;
        gsap.fromTo(celebAgentRef.current,
          { opacity: 0, y: 18, filter: 'blur(8px)' },
          { opacity: 1, y: 0, filter: 'blur(0)', duration: 0.48, ease: 'power3.out',
            onComplete: () => setReplyPlaying(true) }
        );
      },
    });
  }

  const onReplyDone = useCallback(() => {
    const t = setTimeout(() => {
      setPhase('exiting');
      gsap.to(rootRef.current, {
        opacity: 0, duration: 0.5, ease: 'power2.in',
        onComplete: () => {
          if (flyLayerRef.current) flyLayerRef.current.innerHTML = '';
          if (selectedId.current === 'bengaluru') onConfirm();
          else onNotQuite();
        },
      });
    }, 600);
    timersRef.current.push(t);
  }, [onConfirm, onNotQuite]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!interactiveRef.current || phase !== 'cards') return;
      if (focusArea === 'cards') {
        if (e.key === 'ArrowLeft')  { e.preventDefault(); setFocusIdx(n => Math.max(0, n - 1)); }
        if (e.key === 'ArrowRight') { e.preventDefault(); setFocusIdx(n => Math.min(OPTIONS.length - 1, n + 1)); }
        if (e.key === 'ArrowDown')  { e.preventDefault(); setFocusArea('skip'); }
        if (e.key === 'ArrowUp' && onBack) { e.preventDefault(); onBack(); }
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelect(focusIdx); }
      } else {
        if (e.key === 'ArrowUp')   { e.preventDefault(); setFocusArea('cards'); }
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNotQuite(); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, focusArea, focusIdx, onBack]);

  return (
    <div ref={rootRef} className="fg-screen" data-step="bangalore-confirm">
      <div className="fg-bg-glow fg-bg-glow--q1" />
      <GlanceLogo />

      {/* Mascot */}
      <div ref={mascotRef} className="fg-q-mascot" style={{ opacity: 0 }}>
        <AgentMascot agentMode="looking" size={96} />
      </div>

      {/* Question with inline progress */}
      <div ref={questionRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <div style={{ fontSize: 'clamp(10px,0.85vw,12px)', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(167,134,229,0.5)', fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', marginBottom: 10 }}>
          1 of 7
        </div>
        <div className="fg-q-title" style={{ margin: 0, marginBottom: 18 }}>
          {phase !== 'entering' && (
            <CinematicText
              text="I see you're in Bangalore — that right?"
              playing={qTyping}
              speed={0.030}
              duration={0.42}
              onDone={handleQuestionDone}
            />
          )}
        </div>
      </div>

      {/* Subtitle */}
      <div ref={subtitleRef} className="fg-q-subtitle" style={{ opacity: 0, transform: 'translateY(10px)', marginBottom: 'clamp(28px,4.5vh,48px)' }}>
        It helps me get your feed spot on
      </div>

      {/* Cards row */}
      <div ref={cardsRowRef} style={{ opacity: 0, display: 'flex', gap: 'clamp(16px,2vw,28px)', justifyContent: 'center', alignItems: 'flex-start', paddingBottom: 'clamp(24px,3vh,40px)' }}>
        {OPTIONS.map((opt, i) => {
          const isFocused = focusArea === 'cards' && focusIdx === i && phase === 'cards';
          return (
            <div
              key={opt.id}
              ref={el => { cardWrapperRefs.current[i] = el; }}
              onClick={() => interactiveRef.current && phase === 'cards' && handleSelect(i)}
              onMouseEnter={() => phase === 'cards' && setFocusIdx(i)}
              style={{
                width: CARD_W,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 'clamp(10px,1.4vh,16px)',
                cursor: phase === 'cards' ? 'pointer' : 'default',
                transform: isFocused ? 'scale(1.06)' : 'scale(0.94)',
                transition: 'transform 0.25s cubic-bezier(0.22,1,0.36,1)',
              }}
            >
              {/* Image container — firstElementChild read by flipCenterStage */}
              <div style={{
                width: '100%',
                height: CARD_H,
                borderRadius: CARD_BR,
                position: 'relative',
                overflow: 'hidden',
                border: isFocused ? '2.5px solid rgba(255,255,255,0.9)' : '1.5px solid rgba(255,255,255,0.1)',
                boxShadow: isFocused ? '0 12px 48px rgba(0,0,0,0.6)' : '0 4px 20px rgba(0,0,0,0.35)',
                transition: 'border 0.2s, box-shadow 0.2s',
                background: '#0d0820',
                flexShrink: 0,
              }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${opt.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(4,2,14,0.55) 0%, transparent 55%)' }} />
              </div>
              {/* Label below image */}
              <div style={{ fontSize: 'clamp(14px,1.4vw,18px)', fontWeight: 700, color: '#fff', fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', letterSpacing: '-0.01em', textAlign: 'center' }}>
                {opt.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Skip hint — bottom text only, press down twice */}
      {phase === 'cards' && (
        <div style={{ marginTop: 'clamp(6px,1vh,12px)', textAlign: 'center' }}>
          <button
            onClick={onNotQuite}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'clamp(11px,1.0vw,14px)', fontWeight: 500, fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', color: focusArea === 'skip' ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.25)', padding: '6px 20px', outline: focusArea === 'skip' ? '2px solid rgba(255,255,255,0.3)' : 'none', outlineOffset: 3, borderRadius: 999, transition: 'color 0.18s ease, outline 0.18s ease' }}
          >
            Press down twice to skip this question
          </button>
        </div>
      )}

      {/* FLY LAYER */}
      <div ref={flyLayerRef} style={{ position: 'absolute', inset: 0, zIndex: 40, pointerEvents: 'none' }} />

      {/* AGENT + REPLY */}
      <div ref={celebAgentRef} style={{ position: 'absolute', top: celebAgentTop, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(14px,2vh,24px)', zIndex: 42, pointerEvents: 'none', width: 'clamp(280px,50vw,680px)', opacity: 0 }}>
        <SetupStructuredReply lines={replyLines} playing={replyPlaying} onDone={onReplyDone} />
      </div>

      <div className="fg-progress-bar">
        <div className="fg-pip fg-pip--active" />
        <div className="fg-pip" />
        <div className="fg-pip" />
        <div className="fg-pip" />
        <div className="fg-pip" />
        <div className="fg-pip" />
        <div className="fg-pip" />
      </div>
    </div>
  );
}
