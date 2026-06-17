/**
 * T2FashionStory — Glance agentic fashion story template.
 *
 * Design language source of truth: l0-preview.html → CinematicL0.tsx
 * Narration: two modes — ambient (centre-bottom) and spatial bubble (near object)
 * Agent moves between scene positions via GSAP curved tweens.
 *
 * Story format:
 *   genesis → open (ambient) → dress (bubble) → bag (bubble)
 *          → shoes (bubble) → finale (ambient) → title reveal → CTA
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import AgentMascot from '../Shared/AgentMascot';
import AgentCTA from '../L0/AgentCTA';
import type { AgentMode } from '../Shared/AgentMascot';

// ── Assets ────────────────────────────────────────────────────────────────────
const IMG_BASE  = '/images/t2/t2-base.png';
const IMG_DRESS = '/images/t2/t2-dress.png';
const IMG_BAG   = '/images/t2/t2-bag.png';
const IMG_SHOES = '/images/t2/t2-shoes.png';

// ── Agent spatial positions (% of 1920×1080 stage) ───────────────────────────
// Tune these to match where objects appear in the actual images.
type AgentPosKey = 'default' | 'dress' | 'bag' | 'shoes' | 'finale' | 'cta';

const AGENT_POS: Record<AgentPosKey, { left: string; top: string }> = {
  default: { left: '5%',  top: '77%' },   // bottom-left, matches header gutter
  dress:   { left: '26%', top: '22%' },   // upper area, near dress/shoulder
  bag:     { left: '56%', top: '46%' },   // center-right, near carried bag
  shoes:   { left: '36%', top: '70%' },   // lower center, near sandals
  finale:  { left: '45%', top: '65%' },   // near-center, settling down
  cta:     { left: '49%', top: '84%' },   // near-center bottom, moves into CTA slot
};

// Spatial bubble positions — offset from agent toward the object
const BUBBLE_POS: Record<'dress' | 'bag' | 'shoes', { left: string; top: string }> = {
  dress:  { left: '33%', top: '20%' },
  bag:    { left: '37%', top: '45%' },
  shoes:  { left: '43%', top: '68%' },
};

// ── Character-by-character blur reveal ───────────────────────────────────────
const CHAR_SPEED_MS = 32;

function useCharReveal(text: string, playing: boolean, onDone?: () => void) {
  const [count, setCount] = useState(0);
  const doneRef  = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setCount(0); doneRef.current = false; }, [text]);

  useEffect(() => {
    if (!playing) return;
    const chars = Array.from(text);
    if (count >= chars.length) {
      if (!doneRef.current) { doneRef.current = true; onDone?.(); }
      return;
    }
    timerRef.current = setTimeout(() => setCount(n => n + 1), CHAR_SPEED_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [playing, count, text, onDone]);

  return count;
}

type CharRevealProps = {
  text: string;
  playing: boolean;
  onDone?: () => void;
  style?: React.CSSProperties;
};

function CharReveal({ text, playing, onDone, style }: CharRevealProps) {
  const chars = Array.from(text);
  const count = useCharReveal(text, playing, onDone);
  return (
    <span style={style}>
      {chars.map((ch, i) => (
        <span
          key={i}
          style={{
            display:    'inline',
            whiteSpace: ch === ' ' ? 'pre' : 'normal',
            opacity:    i < count ? 1 : 0,
            filter:     i < count ? 'blur(0px)' : 'blur(8px)',
            transition: i < count ? 'opacity 0.14s ease, filter 0.14s ease' : 'none',
          }}
        >
          {ch}
        </span>
      ))}
    </span>
  );
}

// ── Spatial bubble component ──────────────────────────────────────────────────
type SpatialBubbleProps = {
  label: string;
  text: string;
  textKey: number;
  pos: { left: string; top: string };
  visible: boolean;
};

function SpatialBubble({ label, text, textKey, pos, visible }: SpatialBubbleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !visible) return;
    setSpeaking(false);
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, scale: 0.88, y: 10, filter: 'blur(10px)' },
      {
        opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', duration: 0.65, ease: 'back.out(1.4)',
        onComplete: () => setSpeaking(true),
      }
    );
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      className={`t2-spatial-bubble${speaking ? ' t2-bubble-speaking' : ''}`}
      style={{ left: pos.left, top: pos.top, opacity: 0 }}
    >
      <div className="t2-bubble-label">{label}</div>
      <div className="t2-bubble-text">
        <CharReveal key={textKey} text={text} playing style={{ display: 'block' }} />
      </div>
    </div>
  );
}

// ── Story structure ───────────────────────────────────────────────────────────
type Line = { text: string; holdMs: number };

type Beat = {
  id: string;
  image: string;
  mascotMode: AgentMode;
  agentPos: AgentPosKey;
  narrationMode: 'ambient' | 'bubble';
  lines: Line[];
  bubbleLabel?: string;
  label?: string;
};

const GENESIS_LINES: Line[] = [
  { text: "I'm putting together a look.",       holdMs: 2800 },
  { text: "Not something loud.",                holdMs: 2600 },
  { text: "Something that feels effortless.",   holdMs: 3200 },
];

const BEATS: Beat[] = [
  {
    id: 'open',
    image: IMG_BASE,
    mascotMode: 'looking',
    agentPos: 'default',
    narrationMode: 'ambient',
    lines: [
      { text: 'Some looks belong to a place.',    holdMs: 3200 },
      { text: 'Some looks belong to a feeling.',  holdMs: 3200 },
      { text: 'This one feels like both.',         holdMs: 4000 },
    ],
  },
  {
    id: 'dress',
    image: IMG_DRESS,
    mascotMode: 'thinking',
    agentPos: 'dress',
    narrationMode: 'bubble',
    bubbleLabel: 'DRESS',
    lines: [
      { text: 'The V-neck keeps the look open.',                  holdMs: 3200 },
      { text: 'The flowing white silhouette keeps it light.',     holdMs: 3600 },
      { text: 'Nothing feels overworked.',                        holdMs: 3000 },
    ],
  },
  {
    id: 'bag',
    image: IMG_BAG,
    mascotMode: 'thinking',
    agentPos: 'bag',
    narrationMode: 'bubble',
    bubbleLabel: 'ACCESSORY',
    lines: [
      { text: 'The structured leather grounds the whole look.',   holdMs: 3400 },
      { text: 'It adds weight without adding noise.',             holdMs: 3200 },
      { text: 'The kind of bag that makes everything around it feel more intentional.', holdMs: 4800 },
    ],
  },
  {
    id: 'shoes',
    image: IMG_SHOES,
    mascotMode: 'thinking',
    agentPos: 'shoes',
    narrationMode: 'bubble',
    bubbleLabel: 'FOOTWEAR',
    lines: [
      { text: 'Minimal leather sandals.',              holdMs: 2600 },
      { text: 'They do not compete.',                  holdMs: 2800 },
      { text: 'They let the whole outfit breathe.',    holdMs: 3800 },
    ],
  },
  {
    id: 'finale',
    image: IMG_BASE,
    mascotMode: 'idle',
    agentPos: 'finale',
    narrationMode: 'ambient',
    lines: [
      { text: 'The best looks rarely shout.',                     holdMs: 3800 },
      { text: 'They simply feel right the moment you see them.',  holdMs: 5000 },
    ],
  },
];

const GLANCE_TITLE_WORDS = ['DESERT', 'MINIMALISM'];

const PALETTE = [
  { color: '#D4956A', label: 'warm light' },
  { color: '#C8A882', label: 'sand' },
  { color: '#F0EBE0', label: 'ivory' },
  { color: '#8B7355', label: 'leather' },
  { color: '#E2D0A8', label: 'gold dust' },
];

type Phase = 'genesis' | 'story' | 'title' | 'cta';

function NarratorLine({ text, onDone }: { text: string; onDone: () => void }) {
  return <CharReveal text={text} playing onDone={onDone} style={{ display: 'block' }} />;
}

function GenesisSpeech({ lineIdx, onLineDone }: { lineIdx: number; onLineDone: () => void }) {
  const line = GENESIS_LINES[lineIdx];
  if (!line) return null;
  return <CharReveal text={line.text} playing onDone={onLineDone} style={{ display: 'block' }} />;
}

interface Props { onExit?: () => void; }

export default function T2FashionStory({ onExit }: Props) {
  const [phase,           setPhase]           = useState<Phase>('genesis');
  const [beatIdx,         setBeatIdx]         = useState(0);
  const [agentMode,       setAgentMode]       = useState<AgentMode>('thinking');
  const [showGenesis,     setShowGenesis]     = useState(true);
  const [genesisLineIdx,  setGenesisLineIdx]  = useState(0);
  const [genesisPlaying,  setGenesisPlaying]  = useState(false);
  const [narratorText,    setNarratorText]    = useState('');
  const [narratorKey,     setNarratorKey]     = useState(0);
  const [narratorVisible, setNarratorVisible] = useState(false);
  const [bubbleVisible,   setBubbleVisible]   = useState(false);
  const [bubbleText,      setBubbleText]      = useState('');
  const [bubbleTextKey,   setBubbleTextKey]   = useState(0);
  const [bubbleLabel,     setBubbleLabel]     = useState('');
  const [bubblePos,       setBubblePos]       = useState<{ left: string; top: string }>({ left: '33%', top: '20%' });
  const [titleVisible,    setTitleVisible]    = useState(false);
  const [ctaVisible,      setCtaVisible]      = useState(false);
  const [ctaFocused,      setCtaFocused]      = useState(false);
  const [currentImg,      setCurrentImg]      = useState(IMG_BASE);
  const [nextImg,         setNextImg]         = useState<string | null>(null);
  const [clock,           setClock]           = useState(() =>
    new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  );

  const headerRef       = useRef<HTMLDivElement>(null);
  const genesisRef      = useRef<HTMLDivElement>(null);
  const bgCurrentRef    = useRef<HTMLDivElement>(null);
  const bgNextRef       = useRef<HTMLDivElement>(null);
  const mascotWrapRef   = useRef<HTMLDivElement>(null);
  const narratorWrapRef = useRef<HTMLDivElement>(null);
  const labelRef        = useRef<HTMLDivElement>(null);
  const titleWrapRef    = useRef<HTMLDivElement>(null);
  const ctaRef          = useRef<HTMLDivElement>(null);
  const fragmentsRef    = useRef<(HTMLDivElement | null)[]>([]);
  const timersRef       = useRef<ReturnType<typeof setTimeout>[]>([]);
  const skippingRef     = useRef(false);

  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  useEffect(() => {
    const t = setInterval(() =>
      setClock(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }))
    , 30_000);
    return () => clearInterval(t);
  }, []);

  // ── Timer management ────────────────────────────────────────────────────
  const addTimer = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  // ── Agent position GSAP move ────────────────────────────────────────────
  const moveAgent = useCallback((posKey: AgentPosKey, duration = 1.4) => {
    if (!mascotWrapRef.current) return;
    const pos = AGENT_POS[posKey];
    gsap.to(mascotWrapRef.current, {
      left: pos.left,
      top: pos.top,
      duration,
      ease: 'power2.inOut',
    });
  }, []);

  // ── Image crossfade ─────────────────────────────────────────────────────
  const crossfadeTo = useCallback((src: string, onDone?: () => void) => {
    if (src === currentImg) { onDone?.(); return; }
    setNextImg(src);
    requestAnimationFrame(() => {
      if (!bgNextRef.current) { onDone?.(); return; }
      gsap.fromTo(bgNextRef.current,
        { opacity: 0, scale: 1.04 },
        {
          opacity: 1, scale: 1.0, duration: 1.8, ease: 'power2.inOut',
          onComplete: () => { setCurrentImg(src); setNextImg(null); onDone?.(); },
        }
      );
      if (bgCurrentRef.current) {
        gsap.to(bgCurrentRef.current, { scale: 1.03, opacity: 0, duration: 1.8, ease: 'power2.inOut' });
      }
    });
  }, [currentImg]);

  // ── Ambient narrator: show one line, hold, dismiss ──────────────────────
  const showNarratorLine = useCallback((line: Line, onDone: () => void) => {
    if (skippingRef.current) return;
    setNarratorText(line.text);
    setNarratorKey(k => k + 1);
    setNarratorVisible(true);
    const revealDuration = Array.from(line.text).length * CHAR_SPEED_MS;
    addTimer(() => {
      if (skippingRef.current) return;
      if (narratorWrapRef.current) {
        gsap.to(narratorWrapRef.current, {
          opacity: 0, y: -6, filter: 'blur(6px)',
          duration: 0.45, ease: 'power2.in',
          onComplete: () => {
            setNarratorVisible(false);
            if (narratorWrapRef.current) gsap.set(narratorWrapRef.current, { opacity: 1, y: 0, filter: 'blur(0px)' });
            addTimer(onDone, 320);
          },
        });
      } else { addTimer(onDone, 320); }
    }, revealDuration + line.holdMs);
  }, [addTimer]);

  const runLines = useCallback((lines: Line[], onDone: () => void) => {
    let i = 0;
    const next = () => {
      if (skippingRef.current || i >= lines.length) { if (i >= lines.length) onDone(); return; }
      addTimer(() => showNarratorLine(lines[i++], next), i === 0 ? 500 : 350);
    };
    next();
  }, [addTimer, showNarratorLine]);

  // ── Spatial bubble: show one line inside bubble, hold, advance ──────────
  const runBubbleLines = useCallback((lines: Line[], onDone: () => void) => {
    let i = 0;
    const next = () => {
      if (skippingRef.current || i >= lines.length) { if (i >= lines.length) onDone(); return; }
      const line = lines[i++];
      setBubbleText(line.text);
      setBubbleTextKey(k => k + 1);
      const revealDuration = Array.from(line.text).length * CHAR_SPEED_MS;
      addTimer(() => {
        if (skippingRef.current) return;
        addTimer(next, 320);
      }, revealDuration + line.holdMs);
    };
    addTimer(next, 300);
  }, [addTimer]);

  // ── Pulse mascot — brief 'looking' flash when beat changes ──────────────
  const pulseMascot = useCallback((target: AgentMode) => {
    setAgentMode('looking');
    addTimer(() => setAgentMode(target), 1100);
  }, [addTimer]);

  // ── Act 7: title reveal ──────────────────────────────────────────────────

  const runTitleReveal = useCallback((onDone: () => void) => {
    setPhase('title');
    setTitleVisible(true);
    setAgentMode('idle');
    moveAgent('cta');

    addTimer(() => {
      if (!titleWrapRef.current) { onDone(); return; }
      const words = titleWrapRef.current.querySelectorAll<HTMLSpanElement>('.t2-title-word');
      const tl = gsap.timeline({ onComplete: onDone });
      words.forEach((w, i) => {
        tl.fromTo(
          w,
          { opacity: 0, y: 40, filter: 'blur(18px)', letterSpacing: '0.35em' },
          { opacity: 1, y: 0, filter: 'blur(0px)', letterSpacing: '0.12em',
            duration: 0.9, ease: 'power3.out' },
          i * 0.22
        );
      });
      // Hold, then fade out
      tl.to(titleWrapRef.current, { opacity: 0, y: -16, filter: 'blur(8px)', duration: 0.65, ease: 'power2.in' }, '+=2.2');
    }, 300);
  }, [addTimer, moveAgent]);

  // ── Advance to beat idx ──────────────────────────────────────────────────
  const advanceBeat = useCallback((idx: number) => {
    skippingRef.current = false;
    const beat = BEATS[idx];
    if (!beat) {
      // Title reveal before CTA
      runTitleReveal(() => {
        setTitleVisible(false);
        setPhase('cta');
        setCtaVisible(true);
        addTimer(() => {
          if (ctaRef.current) {
            gsap.fromTo(ctaRef.current,
              { opacity: 0, y: 28, filter: 'blur(8px)' },
              { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.0, ease: 'power3.out' }
            );
          }
        }, 120);
      });
      return;
    }

    setBeatIdx(idx);
    pulseMascot(beat.mascotMode);
    moveAgent(beat.agentPos);

    if (beat.label && labelRef.current) {
      labelRef.current.textContent = beat.label;
      gsap.fromTo(labelRef.current,
        { opacity: 0, x: -12, filter: 'blur(6px)' },
        { opacity: 1, x: 0, filter: 'blur(0px)', duration: 0.8, delay: 0.5, ease: 'power2.out' }
      );
      addTimer(() => {
        if (labelRef.current) gsap.to(labelRef.current, { opacity: 0, duration: 0.55 });
      }, 3500);
    } else if (labelRef.current) {
      gsap.to(labelRef.current, { opacity: 0, duration: 0.3 });
    }

    if (beat.narrationMode === 'bubble') {
      // Start image crossfade immediately
      crossfadeTo(beat.image);

      // Show bubble after agent arrives (~1.2s into move)
      addTimer(() => {
        if (skippingRef.current) return;
        const posKey = beat.agentPos as 'dress' | 'bag' | 'shoes';
        setBubbleLabel(beat.bubbleLabel ?? '');
        setBubblePos(BUBBLE_POS[posKey]);
        setBubbleVisible(true);

        runBubbleLines(beat.lines, () => {
          setBubbleVisible(false);
          addTimer(() => advanceBeat(idx + 1), 700);
        });
      }, 1200);
    } else {
      // Ambient beat
      setBubbleVisible(false);
      crossfadeTo(beat.image, () => {
        runLines(beat.lines, () => addTimer(() => advanceBeat(idx + 1), 650));
      });
    }
  }, [pulseMascot, moveAgent, crossfadeTo, runLines, runBubbleLines, addTimer, runTitleReveal]);

  // ── Genesis line sequencer ───────────────────────────────────────────────
  const onGenesisLineDone = useCallback(() => {
    if (skippingRef.current) return;
    const next = genesisLineIdx + 1;
    if (next < GENESIS_LINES.length) {
      addTimer(() => setGenesisLineIdx(next), 350);
    }
  }, [genesisLineIdx, addTimer]);

  // ── Genesis GSAP sequence ────────────────────────────────────────────────
  const runGenesis = useCallback(() => {
    skippingRef.current = false;
    const tl = gsap.timeline();

    tl.fromTo(headerRef.current,
      { opacity: 0, y: -10 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
      0.4
    );

    tl.fromTo(mascotWrapRef.current,
      { opacity: 0, scale: 0.72, y: 16 },
      { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'back.out(1.7)' },
      0.9
    );

    tl.call(() => { setGenesisPlaying(true); }, [], 1.3);

    const fragX = [-120, -60, 0, 60, 120];
    fragmentsRef.current.forEach((el, i) => {
      if (!el) return;
      tl.fromTo(el,
        { opacity: 0, scale: 0.5, x: fragX[i] * 0.25, y: 18 },
        { opacity: 0.9, scale: 1, x: 0, y: 0, duration: 0.5, ease: 'back.out(1.5)' },
        1.7 + i * 0.13
      );
    });

    const genesisImg = genesisRef.current?.querySelector('.t2-genesis-img') as HTMLElement | null;
    if (genesisImg) {
      tl.fromTo(genesisImg,
        { filter: 'blur(32px) brightness(0.18) saturate(0.12)', scale: 1.10, opacity: 0 },
        { filter: 'blur(0px) brightness(1.0) saturate(1.0)', scale: 1.0, opacity: 1,
          duration: 2.8, ease: 'power3.inOut' },
        2.0
      );
    }

    fragmentsRef.current.forEach((el, i) => {
      if (!el) return;
      tl.to(el, { opacity: 0, scale: 1.35, y: -14, duration: 0.4, ease: 'power2.in' }, 3.6 + i * 0.08);
    });

    tl.call(() => setAgentMode('idle'), [], 4.3);
    tl.to(genesisRef.current, { opacity: 0, duration: 0.8, ease: 'power2.inOut' }, 5.0);
    tl.call(() => {
      setShowGenesis(false);
      setGenesisPlaying(false);
      setPhase('story');
      advanceBeat(0);
    }, [], 5.8);
  }, [advanceBeat]);

  useEffect(() => {
    runGenesis();
    return () => clearAllTimers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Narrator entrance GSAP
  useEffect(() => {
    if (!narratorVisible || !narratorWrapRef.current) return;
    gsap.fromTo(narratorWrapRef.current,
      { opacity: 0, y: 10, filter: 'blur(10px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.75, ease: 'power2.out' }
    );
  }, [narratorKey, narratorVisible]);

  // ── Skip forward ─────────────────────────────────────────────────────────
  const skipForward = useCallback(() => {
    skippingRef.current = true;
    clearAllTimers();
    setNarratorVisible(false);
    setBubbleVisible(false);

    if (phase === 'genesis') {
      if (genesisRef.current) {
        gsap.to(genesisRef.current, {
          opacity: 0, duration: 0.3,
          onComplete: () => {
            setShowGenesis(false);
            setGenesisPlaying(false);
            setPhase('story');
            advanceBeat(0);
          },
        });
      }
      return;
    }
    if (phase === 'title') {
      if (titleWrapRef.current) gsap.killTweensOf(titleWrapRef.current);
      setTitleVisible(false);
      setPhase('cta');
      setCtaVisible(true);
      setAgentMode('idle');
      if (ctaRef.current) gsap.fromTo(ctaRef.current, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8 });
      return;
    }
    if (phase === 'story') {
      const next = beatIdx + 1;
      if (next >= BEATS.length) {
        advanceBeat(BEATS.length); // triggers title reveal
      } else {
        advanceBeat(next);
      }
    }
  }, [phase, beatIdx, clearAllTimers, advanceBeat]);

  const skipBack = useCallback(() => {
    if (phase !== 'story') return;
    skippingRef.current = true;
    clearAllTimers();
    setNarratorVisible(false);
    setBubbleVisible(false);
    advanceBeat(Math.max(0, beatIdx - 1));
  }, [phase, beatIdx, clearAllTimers, advanceBeat]);

  const restart = useCallback(() => {
    skippingRef.current = true;
    clearAllTimers();
    gsap.killTweensOf([
      bgCurrentRef.current, bgNextRef.current,
      headerRef.current, mascotWrapRef.current,
      genesisRef.current, narratorWrapRef.current,
    ].filter(Boolean));
    setPhase('genesis');
    setShowGenesis(true);
    setBeatIdx(0);
    setAgentMode('thinking');
    setGenesisLineIdx(0);
    setGenesisPlaying(false);
    setNarratorVisible(false);
    setBubbleVisible(false);
    setTitleVisible(false);
    setCtaVisible(false);
    setCurrentImg(IMG_BASE);
    setNextImg(null);
    // Reset mascot to default position
    if (mascotWrapRef.current) {
      gsap.set(mascotWrapRef.current, {
        left: AGENT_POS.default.left,
        top: AGENT_POS.default.top,
        opacity: 0,
      });
    }
    if (headerRef.current) gsap.set(headerRef.current, { opacity: 0, y: -10 });
    if (genesisRef.current) gsap.set(genesisRef.current, { opacity: 1 });
    setTimeout(() => runGenesis(), 60);
  }, [clearAllTimers, runGenesis]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); skipForward(); }
      if (e.key === 'ArrowLeft')                        { e.preventDefault(); skipBack(); }
      if (e.key === 'r' || e.key === 'R')               { e.preventDefault(); restart(); }
      if (e.key === 'Escape')                            { e.preventDefault(); onExit?.(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [skipForward, skipBack, restart, onExit]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#08060a', overflow: 'hidden' }}>
      <style>{STYLES}</style>

      {/* BG: current */}
      <div ref={bgCurrentRef} className="t2-bg">
        <img src={currentImg} alt="" className="t2-bg-img" />
        <div className="t2-scrim" />
      </div>

      {/* BG: next (crossfade) */}
      {nextImg && (
        <div ref={bgNextRef} className="t2-bg t2-bg-next" style={{ opacity: 0 }}>
          <img src={nextImg} alt="" className="t2-bg-img" />
          <div className="t2-scrim" />
        </div>
      )}

      {/* Genesis overlay */}
      {showGenesis && (
        <div ref={genesisRef} className="t2-genesis">
          <div className="t2-genesis-ambient" />
          <img src={IMG_BASE} alt="" className="t2-bg-img t2-genesis-img" style={{ opacity: 0, zIndex: 1 }} />
          <div className="t2-scrim" style={{ zIndex: 2 }} />
          <div className="t2-frags" style={{ zIndex: 10 }}>
            {PALETTE.map((p, i) => (
              <div
                key={p.label}
                ref={el => { fragmentsRef.current[i] = el; }}
                className="t2-frag"
                style={{ background: p.color, opacity: 0 }}
              >
                {p.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HEADER */}
      <div ref={headerRef} className="t2-header" style={{ opacity: 0 }}>
        <img
          src="/glance-logo.png"
          alt="glance"
          style={{
            height: 'clamp(26px, 3.2vh, 48px)',
            width: 'auto',
            display: 'block',
            objectFit: 'contain',
            objectPosition: 'left center',
            flexShrink: 0,
          }}
        />
        <div className="t2-hdr-right">
          <span className="t2-hdr-dim">☁ 28°</span>
          <span className="t2-hdr-dim">{dateStr}</span>
          <span className="t2-hdr-time">{clock}</span>
        </div>
      </div>

      {/* MASCOT — moves around scene via GSAP tweening left/top */}
      <div
        ref={mascotWrapRef}
        className="t2-mascot-wrap"
        style={{
          left: AGENT_POS.default.left,
          top: AGENT_POS.default.top,
          opacity: 0,
        }}
      >
        <AgentMascot agentMode={agentMode} size={72} />
        {showGenesis && genesisPlaying && (
          <div className="t2-genesis-speech">
            <GenesisSpeech lineIdx={genesisLineIdx} onLineDone={onGenesisLineDone} />
          </div>
        )}
      </div>

      {/* SPATIAL BUBBLE — appears near highlighted object */}
      <SpatialBubble
        label={bubbleLabel}
        text={bubbleText}
        textKey={bubbleTextKey}
        pos={bubblePos}
        visible={bubbleVisible}
      />

      {/* AMBIENT NARRATOR — centred bottom, story beats only */}
      {narratorVisible && (
        <div ref={narratorWrapRef} className="t2-narrator" style={{ opacity: 0 }}>
          <NarratorLine
            key={narratorKey}
            text={narratorText}
            onDone={() => { /* handled by timer */ }}
          />
        </div>
      )}

      {/* GLANCE TITLE — Act 7: revealed after finale, before CTA */}
      {titleVisible && (
        <div ref={titleWrapRef} className="t2-glance-title" style={{ opacity: 0 }}>
          {GLANCE_TITLE_WORDS.map(w => (
            <span key={w} className="t2-title-word">{w}</span>
          ))}
        </div>
      )}

      {/* PRODUCT LABEL */}
      <div ref={labelRef} className="t2-label" style={{ opacity: 0 }} />

      {/* CTA */}
      {ctaVisible && (
        <div ref={ctaRef} className="t2-cta" style={{ opacity: 0 }}>
          <AgentCTA
            label="Show me more looks like this"
            focused={ctaFocused}
            animStep={5}
            align="center"
            onClick={() => {}}
            showMascotInside
            agentMode="idle"
          />
        </div>
      )}
      {ctaVisible && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 4 }}
          onMouseEnter={() => setCtaFocused(true)}
          onMouseLeave={() => setCtaFocused(false)}
        />
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const STYLES = `
  .t2-bg {
    position: absolute; inset: 0; z-index: 0;
    will-change: transform, opacity;
  }
  .t2-bg-next { z-index: 1; }
  .t2-bg-img {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    object-fit: cover;
    object-position: center 18%;
  }

  .t2-scrim {
    position: absolute; inset: 0;
    background:
      linear-gradient(to top,    rgba(0,0,0,0.90) 0%,  rgba(0,0,0,0.50) 28%, rgba(0,0,0,0.06) 55%, transparent 70%),
      linear-gradient(to bottom, rgba(0,0,0,0.62) 0%,  rgba(0,0,0,0.22) 18%, transparent 38%),
      linear-gradient(to right,  rgba(0,0,0,0.42) 0%,  rgba(0,0,0,0.12) 35%, transparent 62%);
    pointer-events: none;
  }

  .t2-genesis {
    position: absolute; inset: 0; z-index: 20;
  }
  .t2-genesis-ambient {
    position: absolute; inset: 0; z-index: 0;
    background: radial-gradient(ellipse at 50% 62%,
      rgba(110,72,36,0.16) 0%, rgba(8,6,10,0.97) 66%);
  }
  .t2-frags {
    position: absolute; bottom: 42%; left: 50%;
    transform: translateX(-50%);
    display: flex; gap: 12px; align-items: center;
  }
  .t2-frag {
    padding: 8px 18px; border-radius: 40px;
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.07em; color: rgba(0,0,0,0.62);
    font-family: "Plus Jakarta Sans", system-ui, sans-serif;
    box-shadow: 0 3px 16px rgba(0,0,0,0.20);
    white-space: nowrap;
  }

  .t2-header {
    position: fixed;
    top:   clamp(16px, 3vh, 48px);
    left:  clamp(20px, 4.5vw, 88px);
    right: clamp(20px, 4.5vw, 88px);
    display: flex; align-items: center; justify-content: space-between;
    z-index: 30;
    will-change: opacity, transform;
  }
  .t2-hdr-right {
    display: flex; align-items: center;
    gap: clamp(5px, 0.7vw, 10px);
    font-size: clamp(10px, 1.1vw, 18px);
    font-weight: 500;
    font-family: system-ui;
  }
  .t2-hdr-dim  { color: rgba(255,255,255,0.45); }
  .t2-hdr-time { color: #fff; font-variant-numeric: tabular-nums; }

  /* Mascot — positioned via inline left/top, moves via GSAP */
  .t2-mascot-wrap {
    position: fixed;
    z-index: 25;
    display: flex; align-items: center; gap: 18px;
    will-change: opacity, transform, left, top;
  }

  .t2-genesis-speech {
    font-size: clamp(15px, 1.35vw, 22px);
    font-weight: 400;
    font-style: italic;
    font-family: "Plus Jakarta Sans", system-ui, sans-serif;
    color: rgba(255,255,255,0.78);
    letter-spacing: 0.01em;
    text-shadow: 0 2px 14px rgba(0,0,0,0.60);
    max-width: 380px;
    line-height: 1.45;
  }

  /* Spatial bubble — glassmorphic, fixed position near highlighted object */
  .t2-spatial-bubble {
    position: fixed;
    z-index: 26;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(24px) saturate(1.6);
    -webkit-backdrop-filter: blur(24px) saturate(1.6);
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 16px;
    padding: clamp(12px, 1.4vh, 20px) clamp(16px, 1.6vw, 26px);
    max-width: clamp(240px, 22vw, 360px);
    box-shadow:
      0 8px 40px rgba(0, 0, 0, 0.50),
      0 2px 12px rgba(0, 0, 0, 0.30),
      0 0 0 1px rgba(192, 132, 252, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.10);
    will-change: opacity, transform, filter;
  }
  .t2-bubble-label {
    font-size: clamp(8px, 0.7vw, 11px);
    font-weight: 700;
    font-family: "Plus Jakarta Sans", system-ui, sans-serif;
    color: rgba(255, 255, 255, 0.50);
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.10);
  }
  .t2-bubble-text {
    font-size: clamp(13px, 1.4vw, 24px);
    font-weight: 300;
    font-family: "Playfair Display", Georgia, serif;
    color: rgba(255, 255, 255, 0.90);
    line-height: 1.4;
    letter-spacing: -0.01em;
    min-height: 2.4em;
  }

  /* Ambient narrator — centred bottom */
  .t2-narrator {
    position: fixed;
    bottom: 13%;
    left: 50%;
    transform: translateX(-50%);
    z-index: 25;
    font-size: clamp(26px, 3.0vw, 56px);
    font-weight: 300;
    font-family: "Playfair Display", Georgia, serif;
    color: rgba(255,255,255,0.93);
    text-align: center;
    letter-spacing: -0.01em;
    line-height: 1.20;
    text-shadow:
      0 4px 32px rgba(0,0,0,0.65),
      0 0  60px rgba(0,0,0,0.30);
    max-width: clamp(520px, 70vw, 1020px);
    will-change: opacity, transform, filter;
  }

  .t2-label {
    position: fixed;
    bottom: clamp(68px, 8.5vh, 108px);
    left:   clamp(20px, 4.5vw, 88px);
    z-index: 25;
    font-size: clamp(10px, 0.95vw, 14px);
    font-weight: 700;
    font-family: "Plus Jakarta Sans", system-ui, sans-serif;
    color: rgba(255,255,255,0.78);
    letter-spacing: 0.11em;
    text-transform: uppercase;
    padding: 7px 18px;
    border: 1px solid rgba(255,255,255,0.16);
    border-radius: 999px;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    background: rgba(255,255,255,0.10);
    will-change: opacity, transform, filter;
  }

  .t2-cta {
    position: fixed;
    bottom: clamp(36px, 5.5vh, 68px);
    left: 50%;
    transform: translateX(-50%);
    z-index: 30;
    will-change: opacity, transform, filter;
  }

  /* ── Animated bubble glow — agent-speaking feedback ── */
  @keyframes t2-bubble-glow {
    0%   { box-shadow:
              0 8px 40px rgba(0,0,0,0.50),
              0 2px 12px rgba(0,0,0,0.30),
              0 0 0 1px rgba(192,132,252,0.06),
              inset 0 1px 0 rgba(255,255,255,0.10); }
    50%  { box-shadow:
              0 8px 40px rgba(0,0,0,0.50),
              0 2px 12px rgba(0,0,0,0.30),
              0 0 0 1px rgba(192,132,252,0.22),
              0 0 28px rgba(160,100,255,0.14),
              inset 0 1px 0 rgba(255,255,255,0.16); }
    100% { box-shadow:
              0 8px 40px rgba(0,0,0,0.50),
              0 2px 12px rgba(0,0,0,0.30),
              0 0 0 1px rgba(192,132,252,0.06),
              inset 0 1px 0 rgba(255,255,255,0.10); }
  }
  @keyframes t2-bubble-border-shift {
    0%   { border-color: rgba(255,255,255,0.18); }
    50%  { border-color: rgba(192,132,252,0.38); }
    100% { border-color: rgba(255,255,255,0.18); }
  }
  .t2-bubble-speaking {
    animation:
      t2-bubble-glow        2.8s ease-in-out infinite,
      t2-bubble-border-shift 2.8s ease-in-out infinite;
  }

  /* ── Act 7: glance title reveal ── */
  .t2-glance-title {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 28;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(4px, 0.6vh, 10px);
    pointer-events: none;
    will-change: opacity, transform, filter;
  }
  .t2-title-word {
    display: block;
    font-size: clamp(72px, 9.5vw, 160px);
    font-weight: 800;
    font-family: "Plus Jakarta Sans", system-ui, sans-serif;
    color: rgba(255,255,255,0.96);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    line-height: 0.95;
    text-shadow:
      0 4px 48px rgba(0,0,0,0.55),
      0 0 80px rgba(160,100,255,0.18);
    opacity: 0;
  }
`;

