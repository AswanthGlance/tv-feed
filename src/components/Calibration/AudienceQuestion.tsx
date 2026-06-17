/* ─────────────────────────────────────────────────────────────────────────────
   AudienceQuestion — "Who watches this TV?"
   Q2 of setup flow. Single-select. 4 options. FLIP center-stage acknowledgement.
   ───────────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import AgentMascot from '../Shared/AgentMascot';
import CinematicText from '../Shared/CinematicText';
import GlanceLogo from '../Shared/GlanceLogo';
import SetupStructuredReply from './SetupStructuredReply';
import { flipCenterStage } from './flipCenterStage';
import type { PreferenceProfile } from '../../data/types';

const OPTIONS = [
  { id: 'solo',   label: 'Mostly me',        image: '/images/setup/setup_q2_solo.jpg' },
  { id: 'couple', label: 'My partner and I', image: '/images/setup/setup_q2_pair.jpg' },
  { id: 'kids',   label: 'Kids watch it too', image: '/images/setup/setup_q2_kids.jpg' },
  { id: 'social', label: 'Friends & family', image: '/images/setup/setup_q2_friends.jpg' },
] as const;

type OptionId = typeof OPTIONS[number]['id'];
type Phase = 'entering' | 'question' | 'cards' | 'responding' | 'exiting';
type FocusArea = 'cards' | 'skip';

const REPLY_LINES: Record<OptionId, [string, string, string]> = {
  solo:   ['Mostly you.',       'Got it.',     "I'll tune this closely to your personal taste."],
  couple: ['You and partner.',  'Perfect.',    "I'll find content you'd both reach for."],
  kids:   ['Kids too.',         'Noted.',      "Family-friendly is built in from the start."],
  social: ['Friends & family.', 'Love it.',   "Great crowd-pleasing picks coming your way."],
};

type Props = {
  profile: PreferenceProfile;
  onNext: (p: PreferenceProfile) => void;
  onSkip: () => void;
  onBack?: () => void;
};

export default function AudienceQuestion({ profile, onNext, onSkip, onBack }: Props) {
  const rootRef       = useRef<HTMLDivElement>(null);
  const mascotRef     = useRef<HTMLDivElement>(null);
  const questionRef   = useRef<HTMLDivElement>(null);
  const subtitleRef   = useRef<HTMLDivElement>(null);
  const listRef       = useRef<HTMLDivElement>(null);
  const skipBtnRef    = useRef<HTMLButtonElement>(null);
  const flyLayerRef   = useRef<HTMLDivElement>(null);
  const celebAgentRef = useRef<HTMLDivElement>(null);
  const cardElsRef    = useRef<(HTMLDivElement | null)[]>([]);

  const [phase, setPhase]           = useState<Phase>('entering');
  const [qTyping, setQTyping]       = useState(false);
  const [selected, setSelected]     = useState<OptionId | null>(null);
  const [focusIdx, setFocusIdx]     = useState(0);
  const [focusArea, setFocusArea]   = useState<FocusArea>('cards');
  const [replyLines, setReplyLines] = useState<[string, string, string]>(['', '', '']);
  const [replyPlaying, setReplyPlaying] = useState(false);
  const [celebAgentTop, setCelebAgentTop] = useState(0);
  const interactiveRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    gsap.fromTo(mascotRef.current,
      { opacity: 0, y: -20, scale: 0.72 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.4)',
        onComplete: () => { setPhase('question'); setQTyping(true); },
      }
    );
  }, []);

  useEffect(() => () => { timersRef.current.forEach(clearTimeout); if (flyLayerRef.current) flyLayerRef.current.innerHTML = ''; }, []);

  function handleQuestionDone() {
    setTimeout(() => {
      gsap.to(subtitleRef.current, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
      gsap.fromTo(listRef.current, { opacity: 0, y: 36, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.65, ease: 'power3.out' });
      gsap.fromTo(skipBtnRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', delay: 0.18, onComplete: () => { setPhase('cards'); interactiveRef.current = true; } });
    }, 280);
  }

  function handleSelect(id: OptionId) {
    if (!interactiveRef.current || selected !== null) return;
    interactiveRef.current = false;
    setSelected(id);
    setPhase('responding');
    setReplyLines(REPLY_LINES[id]);

    const flyLayer = flyLayerRef.current;
    const root     = rootRef.current;
    if (!flyLayer || !root) return;

    const selectedCards = OPTIONS
      .map((opt, i) => ({ id: opt.id, label: opt.label, image: opt.image, el: cardElsRef.current[i]! }))
      .filter(c => c.el != null && c.id === id);

    const unselectedEls = OPTIONS
      .map((_, i) => cardElsRef.current[i])
      .filter((el, i) => el != null && OPTIONS[i].id !== id) as HTMLDivElement[];

    gsap.to(skipBtnRef.current, { opacity: 0, duration: 0.2, ease: 'power2.in' });

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
        gsap.fromTo(celebAgentRef.current, { opacity: 0, y: 18, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0)', duration: 0.48, ease: 'power3.out', onComplete: () => setReplyPlaying(true) });
      },
    });
  }

  const onReplyDone = useCallback(() => {
    const t = setTimeout(() => {
      setPhase('exiting');
      gsap.to(rootRef.current, { opacity: 0, duration: 0.5, ease: 'power2.in', onComplete: () => {
        if (flyLayerRef.current) flyLayerRef.current.innerHTML = '';
        onNext({ ...profile });
      }});
    }, 600);
    timersRef.current.push(t);
  }, [profile, onNext]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!interactiveRef.current || phase !== 'cards') return;
      if (focusArea === 'cards') {
        if (e.key === 'ArrowLeft')  { e.preventDefault(); setFocusIdx(n => Math.max(0, n - 1)); }
        if (e.key === 'ArrowRight') { e.preventDefault(); setFocusIdx(n => Math.min(OPTIONS.length - 1, n + 1)); }
        if (e.key === 'ArrowDown')  { e.preventDefault(); setFocusArea('skip'); }
        if (e.key === 'ArrowUp' && onBack) { e.preventDefault(); onBack(); }
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelect(OPTIONS[focusIdx].id); }
      } else {
        if (e.key === 'ArrowUp') { e.preventDefault(); setFocusArea('cards'); }
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSkip(); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, focusArea, focusIdx, selected, onBack]);

  return (
    <div ref={rootRef} className="fg-screen" data-step="audience">
      <div className="fg-bg-glow fg-bg-glow--q1" />
      <GlanceLogo />

      {/* Mascot */}
      <div ref={mascotRef} className="fg-q-mascot" style={{ opacity: 0 }}>
        <AgentMascot agentMode="looking" size={80} />
      </div>

      {/* Question area with inline progress */}
      <div ref={questionRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <div style={{ fontSize: 'clamp(10px,0.85vw,12px)', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(167,134,229,0.5)', fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', marginBottom: 10 }}>
          3 of 7
        </div>
        <div className="fg-q-title" style={{ margin: 0, marginBottom: 18 }}>
          {phase !== 'entering' && (
            <CinematicText text="Who watches this TV?" playing={qTyping} speed={0.042} duration={0.38} onDone={handleQuestionDone} />
          )}
        </div>
      </div>

      {/* Caption */}
      <div ref={subtitleRef} style={{ opacity: 0, transform: 'translateY(10px)', fontSize: 'clamp(12px,1.1vw,15px)', fontWeight: 400, letterSpacing: '0.01em', color: 'rgba(167,134,229,0.65)', fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', marginBottom: 'clamp(28px,4.5vh,48px)' }}>
        This helps me get the tone right from the start
      </div>

      {/* Cards row */}
      <div ref={listRef} style={{ width: 'clamp(360px,88vw,1380px)', display: 'flex', gap: 'clamp(10px,1.2vw,18px)', marginBottom: 'clamp(28px,4vh,40px)', alignItems: 'flex-start', opacity: 0 }}>
        {OPTIONS.map((opt, i) => {
          const isFocused  = focusArea === 'cards' && focusIdx === i && phase === 'cards';
          const isSelected = selected === opt.id;
          return (
            <div key={opt.id} ref={el => { cardElsRef.current[i] = el; }}
              onClick={() => interactiveRef.current && phase === 'cards' && handleSelect(opt.id)}
              onMouseEnter={() => phase === 'cards' && setFocusIdx(i)}
              style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(10px,1.4vh,16px)', cursor: phase === 'cards' ? 'pointer' : 'default', transform: isFocused ? 'scale(1.06)' : 'scale(0.94)', transition: 'transform 0.25s cubic-bezier(0.22,1,0.36,1)' }}
            >
              <div style={{ width: '100%', height: 'clamp(200px,26vh,320px)', borderRadius: 'clamp(14px,1.6vw,22px)', position: 'relative', overflow: 'hidden', border: (isFocused || isSelected) ? '2.5px solid rgba(255,255,255,0.9)' : '1.5px solid rgba(255,255,255,0.1)', boxShadow: isFocused ? '0 12px 48px rgba(0,0,0,0.6)' : '0 4px 20px rgba(0,0,0,0.35)', transition: 'border 0.2s, box-shadow 0.2s', background: '#0d0820' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${opt.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                {isSelected && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.05)' }} />}
                <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 3, width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSelected ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.3)', border: '2px solid rgba(255,255,255,0.75)', backdropFilter: 'blur(4px)', transition: 'all 0.18s ease', fontSize: 13, color: isSelected ? '#111' : 'transparent', fontWeight: 800 }}>{isSelected ? '✓' : ''}</div>
              </div>
              <div style={{ fontSize: 'clamp(14px,1.4vw,20px)', fontWeight: 700, color: '#fff', fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', letterSpacing: '-0.01em', textAlign: 'center' }}>{opt.label}</div>
            </div>
          );
        })}
      </div>

      {/* Skip */}
      <button ref={skipBtnRef}
        onClick={onSkip}
        style={{ opacity: 0, position: 'absolute', bottom: 'clamp(28px,4vh,48px)', left: '50%', transform: 'translateX(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'clamp(12px,1.1vw,16px)', fontWeight: 500, fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', color: focusArea === 'skip' ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.28)', padding: '6px 20px', outline: focusArea === 'skip' ? '2px solid rgba(255,255,255,0.35)' : 'none', outlineOffset: 3, borderRadius: 999, transition: 'color 0.18s ease, outline 0.18s ease', zIndex: 5, whiteSpace: 'nowrap' }}
      >
        Skip question
      </button>

      {/* FLY LAYER */}
      <div ref={flyLayerRef} style={{ position: 'absolute', inset: 0, zIndex: 40, pointerEvents: 'none' }} />

      {/* AGENT + REPLY */}
      <div ref={celebAgentRef} style={{ position: 'absolute', top: celebAgentTop, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(14px,2vh,24px)', zIndex: 42, pointerEvents: 'none', width: 'clamp(280px,50vw,680px)', opacity: 0 }}>
        <SetupStructuredReply lines={replyLines} playing={replyPlaying} onDone={onReplyDone} />
      </div>

      {/* Nav hint */}
      {phase === 'cards' && (
        <div style={{ position: 'absolute', bottom: 'clamp(8px,1.2vh,14px)', left: '50%', transform: 'translateX(-50%)', fontSize: 'clamp(10px,0.85vw,12px)', color: 'rgba(167,134,229,0.22)', fontFamily: 'system-ui', letterSpacing: '0.05em', whiteSpace: 'nowrap', zIndex: 5 }}>
          {focusArea === 'skip' ? '↑ cards · OK skip question' : '← → browse · ↓ skip · OK pick'}
        </div>
      )}

      <div className="fg-progress-bar">
        <div className="fg-pip fg-pip--done" />
        <div className="fg-pip fg-pip--done" />
        <div className="fg-pip fg-pip--active" />
        <div className="fg-pip" />
        <div className="fg-pip" />
        <div className="fg-pip" />
        <div className="fg-pip" />
      </div>
    </div>
  );
}
