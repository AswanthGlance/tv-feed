/* ─────────────────────────────────────────────────────────────────────────────
   ShowMoreQuestion — "What should this TV show more of?"
   Q4 of setup flow. Multi-select. 3+6 options with Explore More expand.
   Expanded: horizontally scrollable row, gradient edge masks, focus scroll.
   ───────────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import AgentMascot from '../Shared/AgentMascot';
import CinematicText from '../Shared/CinematicText';
import GlanceLogo from '../Shared/GlanceLogo';
import SetupStructuredReply from './SetupStructuredReply';
import { flipCenterStage } from './flipCenterStage';
import { applyOnboardingSignal } from '../../logic/signals';
import type { PreferenceProfile } from '../../data/types';

type Option = { id: string; label: string; image: string; attrs: Record<string, string[]> };

const INITIAL_OPTIONS: Option[] = [
  { id: 'travel',   label: 'Travel & escapes',  image: '/images/setup/setup_q3_travel.jpg',  attrs: { categories: ['travel'] } },
  { id: 'wellness', label: 'Health & wellness', image: '/images/setup/setup_q3_fitness.jpg', attrs: { categories: ['wellness'] } },
  { id: 'sports',   label: 'Sports',            image: '/images/setup/setup_q3_sports.jpg',  attrs: { categories: ['sports'] } },
];

const EXTRA_OPTIONS: Option[] = [
  { id: 'music-perf', label: 'Music & performances', image: '/images/setup/setup_q3_music.jpg',   attrs: { categories: ['entertainment'], subCategories: ['music'] } },
  { id: 'fashion',    label: 'Fashion & style',       image: '/images/setup/setup_q3_fashion.jpg', attrs: { categories: ['fashion'] } },
  { id: 'home',       label: 'Home & interiors',      image: '/images/setup/setup_q3_home.jpg',    attrs: { categories: ['home'] } },
  { id: 'arts',       label: 'Arts & culture',        image: '/images/setup/setup_q3_arts.jpg',    attrs: { categories: ['entertainment'], subCategories: ['culture'] } },
  { id: 'tech',       label: 'Tech & new things',     image: '/images/setup/setup_q3_tech.jpg',    attrs: { categories: ['technology'] } },
  { id: 'food',       label: 'Food & dining',         image: '/images/setup/setup_q3_food.jpg',    attrs: { categories: ['food'] } },
];

const ALL_OPTIONS: Option[] = [...INITIAL_OPTIONS, ...EXTRA_OPTIONS];

type Phase = 'entering' | 'question' | 'cards' | 'responding' | 'exiting';
type FocusArea = 'cards' | 'done' | 'skip';

function getReplyLines(selected: string[]): [string, string, string] {
  if (selected.length === 0) return ["Got it.", "Noted.", "I'll keep the feed well-balanced for you."];
  if (selected.length === 1) {
    const opt = ALL_OPTIONS.find(o => o.id === selected[0]);
    return [opt?.label ?? 'That.', 'Noted.', `${opt?.label ?? 'That'} will feature prominently.`];
  }
  return ['Great choices.', 'Love it.', "I'll make sure all of those come through clearly."];
}

/* Card dimensions — same as all other setup questions */
const CARD_W = 'clamp(200px,18vw,300px)';
const CARD_H = 'clamp(200px,26vh,300px)';
const CARD_BR = 'clamp(14px,1.6vw,22px)';

type Props = {
  profile: PreferenceProfile;
  onNext: (p: PreferenceProfile) => void;
  onSkip: () => void;
  onBack?: () => void;
  initialSelected?: string[];
};

export default function ShowMoreQuestion({ profile, onNext, onSkip, onBack, initialSelected }: Props) {
  const rootRef        = useRef<HTMLDivElement>(null);
  const mascotRef      = useRef<HTMLDivElement>(null);
  const questionRef    = useRef<HTMLDivElement>(null);
  const subtitleRef    = useRef<HTMLDivElement>(null);
  /* scrollWrapRef = outer container used for GSAP entrance + gradient overlays */
  const scrollWrapRef  = useRef<HTMLDivElement>(null);
  /* scrollInnerRef = actual overflow-x:auto scroll container */
  const scrollInnerRef = useRef<HTMLDivElement>(null);
  const actionsRef     = useRef<HTMLDivElement>(null);
  const flyLayerRef    = useRef<HTMLDivElement>(null);
  const celebAgentRef  = useRef<HTMLDivElement>(null);
  /* cardWrapperRefs — outer wrapper divs (flex column) — passed to flipCenterStage */
  const cardWrapperRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [phase, setPhase]           = useState<Phase>('entering');
  const [qTyping, setQTyping]       = useState(false);
  const [selected, setSelected]     = useState<string[]>(initialSelected ?? []);
  const [expanded, setExpanded]     = useState(false);
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

  useEffect(() => () => {
    timersRef.current.forEach(clearTimeout);
    if (flyLayerRef.current) flyLayerRef.current.innerHTML = '';
  }, []);

  function handleQuestionDone() {
    setTimeout(() => {
      gsap.to(subtitleRef.current, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
      if (scrollWrapRef.current) gsap.fromTo(scrollWrapRef.current, { opacity: 0, y: 36, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.65, ease: 'power3.out' });
      gsap.fromTo(actionsRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', delay: 0.18, onComplete: () => { setPhase('cards'); interactiveRef.current = true; } });
    }, 280);
  }

  function toggleSelect(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function handleExpand() {
    if (expanded) return;
    setExpanded(true);
    setFocusIdx(INITIAL_OPTIONS.length);
  }

  /* Scroll focused card into view when expanded.
     Use scrollTo({ behavior: 'smooth' }) so focus tracking is animated.
     Defer by one rAF so the DOM has fully laid out after expand before measuring. */
  useEffect(() => {
    if (!expanded || !scrollInnerRef.current) return;
    const sr = scrollInnerRef.current;
    const raf = requestAnimationFrame(() => {
      const targetEl = cardWrapperRefs.current[focusIdx];
      if (!targetEl) return;
      const srRect = sr.getBoundingClientRect();
      const erRect = targetEl.getBoundingClientRect();
      const PAD_RIGHT = 120;
      const PAD_LEFT  = 80;
      let delta = 0;
      if (erRect.right > srRect.right - PAD_RIGHT) {
        delta = erRect.right - srRect.right + PAD_RIGHT;
      } else if (erRect.left < srRect.left + PAD_LEFT) {
        delta = erRect.left - srRect.left - PAD_LEFT;
      }
      if (delta !== 0) {
        sr.scrollTo({ left: sr.scrollLeft + delta, behavior: 'smooth' });
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [focusIdx, expanded]);

  /* Animate extra cards in on expand.
     Do NOT animate `x` or any transform property here — the card wrappers already
     have React-controlled `transform: scale(...)` + CSS transition on them.
     Mixing GSAP transform writes with React inline transform causes the CSS
     transition to fire on GSAP's value instead of the scale, creating a hard snap.
     Animate only opacity + filter (paint properties) so scale transitions stay smooth. */
  useEffect(() => {
    if (!expanded) return;
    const els = EXTRA_OPTIONS.map((_, i) => cardWrapperRefs.current[INITIAL_OPTIONS.length + i]).filter(Boolean);
    gsap.fromTo(els, { opacity: 0, filter: 'blur(10px)' }, { opacity: 1, filter: 'blur(0px)', duration: 0.45, ease: 'power3.out', stagger: 0.07 });
  }, [expanded]);

  function handleDone() {
    if (!interactiveRef.current) return;
    interactiveRef.current = false;
    setPhase('responding');
    setReplyLines(getReplyLines(selected));

    const flyLayer = flyLayerRef.current;
    const root     = rootRef.current;
    if (!flyLayer || !root) return;

    const visibleCount = expanded ? ALL_OPTIONS.length : INITIAL_OPTIONS.length;
    const selectedCards = ALL_OPTIONS.slice(0, visibleCount)
      .map((opt, i) => ({ id: opt.id, label: opt.label, image: opt.image, el: cardWrapperRefs.current[i]! }))
      .filter(c => c.el != null && selected.includes(c.id));

    const unselectedEls = ALL_OPTIONS.slice(0, visibleCount)
      .map((opt, i) => selected.includes(opt.id) ? null : cardWrapperRefs.current[i])
      .filter((el): el is HTMLDivElement => el != null);

    if (!selectedCards.length) {
      gsap.to([actionsRef.current, scrollWrapRef.current, subtitleRef.current, questionRef.current], { opacity: 0, duration: 0.3, ease: 'power2.in' });
      setCelebAgentTop(root.offsetHeight * 0.35);
      const t = setTimeout(() => {
        if (!celebAgentRef.current) return;
        gsap.fromTo(celebAgentRef.current, { opacity: 0, y: 18, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0)', duration: 0.48, ease: 'power3.out', onComplete: () => setReplyPlaying(true) });
      }, 400);
      timersRef.current.push(t);
      return;
    }

    flipCenterStage({
      selectedCards,
      unselectedEls,
      flyLayer,
      root,
      questionEl: questionRef.current,
      actionsEl: actionsRef.current,
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
        let p: PreferenceProfile = { ...profile, weights: { ...profile.weights }, negativeWeights: { ...profile.negativeWeights }, evidenceCounts: { ...profile.evidenceCounts } };
        for (const id of selected) {
          const opt = ALL_OPTIONS.find(o => o.id === id);
          if (opt) applyOnboardingSignal(p, opt.attrs as any, opt.label);
        }
        onNext(p);
      }});
    }, 600);
    timersRef.current.push(t);
  }, [selected, profile, onNext]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!interactiveRef.current || phase !== 'cards') return;
      if (focusArea === 'cards') {
        if (e.key === 'ArrowLeft')  { e.preventDefault(); setFocusIdx(n => Math.max(0, n - 1)); }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          const maxIdx = expanded ? ALL_OPTIONS.length - 1 : INITIAL_OPTIONS.length;
          setFocusIdx(n => Math.min(maxIdx, n + 1));
        }
        if (e.key === 'ArrowDown')  { e.preventDefault(); setFocusArea('done'); }
        if (e.key === 'ArrowUp' && onBack) { e.preventDefault(); onBack(); }
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!expanded && focusIdx === INITIAL_OPTIONS.length) { handleExpand(); }
          else {
            const allVisible = expanded ? ALL_OPTIONS : INITIAL_OPTIONS;
            toggleSelect(allVisible[focusIdx]?.id ?? '');
          }
        }
      } else if (focusArea === 'done') {
        if (e.key === 'ArrowUp')   { e.preventDefault(); setFocusArea('cards'); }
        if (e.key === 'ArrowDown') { e.preventDefault(); setFocusArea('skip'); }
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleDone(); }
      } else {
        if (e.key === 'ArrowUp') { e.preventDefault(); setFocusArea('done'); }
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSkip(); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, focusArea, focusIdx, selected, expanded, onBack]);

  /* Helper to render a standard option card — identical to WeekendQuestion/StyleQuestion etc */
  function renderCard(opt: Option, globalIdx: number, extraStyle?: React.CSSProperties) {
    const isFocused  = focusArea === 'cards' && focusIdx === globalIdx && phase === 'cards';
    const isSelected = selected.includes(opt.id);
    return (
      <div
        key={opt.id}
        ref={el => { cardWrapperRefs.current[globalIdx] = el; }}
        onClick={() => interactiveRef.current && phase === 'cards' && toggleSelect(opt.id)}
        onMouseEnter={() => phase === 'cards' && setFocusIdx(globalIdx)}
        style={{
          width: CARD_W, flexShrink: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 'clamp(10px,1.4vh,16px)',
          cursor: phase === 'cards' ? 'pointer' : 'default',
          /* Scale on outer wrapper — clip-resistant */
          transform: isFocused ? 'scale(1.06)' : 'scale(0.94)',
          transition: 'transform 0.25s cubic-bezier(0.22,1,0.36,1)',
          ...extraStyle,
        }}
      >
        {/* Image container — this is what flipCenterStage reads via firstElementChild */}
        <div style={{
          width: '100%',
          height: CARD_H,
          borderRadius: CARD_BR,
          position: 'relative',
          overflow: 'hidden',
          border: (isFocused || isSelected) ? '2.5px solid rgba(255,255,255,0.9)' : '1.5px solid rgba(255,255,255,0.1)',
          boxShadow: isFocused ? '0 12px 48px rgba(0,0,0,0.6)' : '0 4px 20px rgba(0,0,0,0.35)',
          transition: 'border 0.2s, box-shadow 0.2s',
          background: '#0d0820',
          flexShrink: 0,
        }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${opt.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          {isSelected && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.05)' }} />}
          <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 3, width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSelected ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.3)', border: '2px solid rgba(255,255,255,0.75)', backdropFilter: 'blur(4px)', transition: 'all 0.18s ease', fontSize: 13, color: isSelected ? '#111' : 'transparent', fontWeight: 800 }}>{isSelected ? '✓' : ''}</div>
        </div>
        {/* Label below image */}
        <div style={{ fontSize: 'clamp(14px,1.4vw,18px)', fontWeight: 700, color: '#fff', fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', letterSpacing: '-0.01em', textAlign: 'center', flexShrink: 0 }}>
          {opt.label}
        </div>
      </div>
    );
  }

  const isExploreMoreFocused = focusArea === 'cards' && focusIdx === INITIAL_OPTIONS.length && phase === 'cards' && !expanded;

  return (
    <div ref={rootRef} className="fg-screen" data-step="show-more">
      <div className="fg-bg-glow fg-bg-glow--q2" />
      <GlanceLogo />

      {/* Mascot */}
      <div ref={mascotRef} className="fg-q-mascot" style={{ opacity: 0 }}>
        <AgentMascot agentMode="looking" size={80} />
      </div>

      {/* Question area with inline progress */}
      <div ref={questionRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <div style={{ fontSize: 'clamp(10px,0.85vw,12px)', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(167,134,229,0.5)', fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', marginBottom: 10 }}>
          4 of 7
        </div>
        <div className="fg-q-title" style={{ margin: 0, marginBottom: 18 }}>
          {phase !== 'entering' && (
            <CinematicText text="What should this TV show more of?" playing={qTyping} speed={0.034} duration={0.40} onDone={handleQuestionDone} />
          )}
        </div>
      </div>

      {/* Caption */}
      <div ref={subtitleRef} style={{ opacity: 0, transform: 'translateY(10px)', fontSize: 'clamp(12px,1.1vw,15px)', fontWeight: 400, letterSpacing: '0.01em', color: 'rgba(167,134,229,0.65)', fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', marginBottom: 'clamp(28px,4.5vh,48px)' }}>
        I'll make sure these show up more often
      </div>

      {/* ── Card scroll area ─────────────────────────────────────────────── */}
      {/* scrollWrapRef: outer positioning wrapper — opacity animated by GSAP */}
      <div
        ref={scrollWrapRef}
        style={{
          position: 'relative',
          width: '100%',
          /* Extra bottom padding so scaled-up focused cards don't clip */
          paddingBottom: 'clamp(24px,3vh,40px)',
          marginBottom: 'clamp(4px,0.8vh,8px)',
          opacity: 0,
        }}
      >
        {/* Gradient edge masks — only shown when expanded (scrollable) */}
        {expanded && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 'clamp(32px,4vw,64px)', zIndex: 6, pointerEvents: 'none', background: 'linear-gradient(to right,rgba(4,2,14,0.95) 0%,transparent 100%)' }} />}
        {expanded && <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 'clamp(48px,6vw,100px)', zIndex: 6, pointerEvents: 'none', background: 'linear-gradient(to left,rgba(4,2,14,0.95) 0%,rgba(4,2,14,0.5) 55%,transparent 100%)' }} />}

        {/* scrollInnerRef: the actual scroll container.
            overflowX:'auto' when expanded. overflowY MUST be 'visible' so scaled
            cards (scale 1.06) don't clip at the top/bottom.
            We achieve this by making the outer wrapper have enough paddingBottom. */}
        <div
          ref={scrollInnerRef}
          style={{
            overflowX: expanded ? 'auto' : 'visible',
            overflowY: 'visible',
            scrollbarWidth: 'none',
            scrollBehavior: 'smooth',
            width: '100%',
            paddingLeft: expanded ? 'clamp(32px,5vw,80px)' : 0,
            paddingRight: expanded ? 'clamp(48px,6vw,100px)' : 0,
            paddingTop: 'clamp(16px,2vh,24px)',
            paddingBottom: 'clamp(16px,2vh,24px)',
          }}
        >
          {/* Row — centered when collapsed, left-aligned when expanded for scroll */}
          <div style={{ display: 'flex', gap: 'clamp(8px,1.0vw,14px)', alignItems: 'flex-start', justifyContent: expanded ? 'flex-start' : 'center', minWidth: expanded ? 'max-content' : undefined }}>

            {/* ── Initial 3 options ── */}
            {INITIAL_OPTIONS.map((opt, i) => renderCard(opt, i))}

            {/* ── Explore More card — only shown when not expanded ── */}
            {!expanded && (
              <div
                onClick={() => interactiveRef.current && phase === 'cards' && handleExpand()}
                onMouseEnter={() => phase === 'cards' && setFocusIdx(INITIAL_OPTIONS.length)}
                style={{
                  width: CARD_W, flexShrink: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 'clamp(10px,1.4vh,16px)',
                  cursor: phase === 'cards' ? 'pointer' : 'default',
                  transform: isExploreMoreFocused ? 'scale(1.06)' : 'scale(0.94)',
                  transition: 'transform 0.25s cubic-bezier(0.22,1,0.36,1)',
                }}
              >
                <div style={{ width: '100%', height: CARD_H, borderRadius: CARD_BR, flexShrink: 0, border: isExploreMoreFocused ? '2.5px solid rgba(255,255,255,0.7)' : '1.5px dashed rgba(255,255,255,0.22)', boxShadow: isExploreMoreFocused ? '0 12px 48px rgba(0,0,0,0.6)' : '0 4px 20px rgba(0,0,0,0.25)', transition: 'border 0.2s, box-shadow 0.2s', background: 'rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <div style={{ fontSize: 28, opacity: 0.5, color: '#fff', lineHeight: 1 }}>+</div>
                  <div style={{ fontSize: 'clamp(11px,1.0vw,14px)', fontWeight: 600, color: 'rgba(255,255,255,0.45)', fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}>See more</div>
                </div>
                <div style={{ fontSize: 'clamp(14px,1.4vw,18px)', fontWeight: 700, color: 'rgba(255,255,255,0.6)', fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', textAlign: 'center', flexShrink: 0 }}>Explore More</div>
              </div>
            )}

            {/* ── Extra options — appended inline after expansion ── */}
            {/* No extraStyle opacity here — GSAP fromTo sets opacity:0 as the from value */}
            {expanded && EXTRA_OPTIONS.map((opt, i) => renderCard(opt, INITIAL_OPTIONS.length + i))}
          </div>
        </div>
      </div>

      {/* Actions — primary CTA only */}
      <div ref={actionsRef} style={{ opacity: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <button
          onClick={handleDone}
          style={{ padding: 'clamp(10px,1.4vh,14px) clamp(32px,4vw,56px)', fontSize: 'clamp(14px,1.3vw,18px)', fontWeight: 700, fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', background: focusArea === 'done' ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.28)', color: focusArea === 'done' ? '#111' : 'rgba(255,255,255,0.4)', border: 'none', borderRadius: 999, cursor: 'pointer', outline: focusArea === 'done' ? '2.5px solid rgba(255,255,255,0.7)' : 'none', outlineOffset: 3, transition: 'all 0.18s ease' }}
        >
          {'Next'}
        </button>
      </div>

      {/* Skip question — pinned to bottom, separate from actions */}
      {phase === 'cards' && (
        <button
          onClick={onSkip}
          style={{ position: 'absolute', bottom: 'clamp(28px,4vh,48px)', left: '50%', transform: 'translateX(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'clamp(12px,1.1vw,16px)', fontWeight: 500, fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', color: focusArea === 'skip' ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.28)', padding: '6px 20px', outline: focusArea === 'skip' ? '2px solid rgba(255,255,255,0.35)' : 'none', outlineOffset: 3, borderRadius: 999, transition: 'color 0.18s ease, outline 0.18s ease', zIndex: 5, whiteSpace: 'nowrap' }}
        >
          Skip question
        </button>
      )}

      {/* FLY LAYER */}
      <div ref={flyLayerRef} style={{ position: 'absolute', inset: 0, zIndex: 40, pointerEvents: 'none' }} />

      {/* AGENT + REPLY */}
      <div ref={celebAgentRef} style={{ position: 'absolute', top: celebAgentTop, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(14px,2vh,24px)', zIndex: 42, pointerEvents: 'none', width: 'clamp(280px,50vw,680px)', opacity: 0 }}>
        <SetupStructuredReply lines={replyLines} playing={replyPlaying} onDone={onReplyDone} />
      </div>

      {/* Nav hint */}
      {phase === 'cards' && (
        <div style={{ position: 'absolute', bottom: 'clamp(8px,1.2vh,14px)', left: '50%', transform: 'translateX(-50%)', fontSize: 'clamp(10px,0.85vw,12px)', color: 'rgba(167,134,229,0.22)', fontFamily: 'system-ui', letterSpacing: '0.05em', whiteSpace: 'nowrap', zIndex: 5 }}>
          {focusArea === 'done' ? '↑ cards · ↓ skip · OK confirm' : focusArea === 'skip' ? '↑ Done · OK skip question' : '← → browse · ↓ Done · OK pick'}
        </div>
      )}

      <div className="fg-progress-bar">
        <div className="fg-pip fg-pip--done" />
        <div className="fg-pip fg-pip--done" />
        <div className="fg-pip fg-pip--done" />
        <div className="fg-pip fg-pip--active" />
        <div className="fg-pip" />
        <div className="fg-pip" />
        <div className="fg-pip" />
      </div>
    </div>
  );
}
