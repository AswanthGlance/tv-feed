/**
 * InterstitialQuestion — cinematic mid-feed preference screen.
 *
 * SELECTION FLOW (FLIP technique — no cuts):
 *  1. Capture selected card rects (getBoundingClientRect) immediately on commit
 *  2. Ghost clones created at exact source positions (position:absolute)
 *  3. Original cards + unselected cards + question UI fade/exit
 *  4. Ghosts animate from source → center-stacked target (same size, same shape)
 *  5. After ghosts settle, agent + reply reveal below
 *  6. Exit → onAnswer
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import type { QuestionConfig, QuestionOptionConfig } from '../../data/preferenceQuestions';
import AgentMascot from '../Shared/AgentMascot';
import TypewriterText from '../Shared/TypewriterText';
import CinematicText from '../Shared/CinematicText';

const LOGO_SRC = '/glance-logo.png';

/* ── Highlight ─────────────────────────────────────────────────────────── */
const HL_STYLE: React.CSSProperties = {
  fontWeight: 800,
  color: 'rgba(255,255,255,0.98)',
  textShadow: '0 0 18px rgba(192,132,252,0.7), 0 0 36px rgba(112,71,226,0.35)',
};

function highlightSegments(text: string, phrases: string[]): Array<{ text: string; isHL: boolean }> {
  if (!phrases.length) return [{ text, isHL: false }];
  const sorted = [...phrases].sort((a, b) => b.length - a.length);
  type Seg = { text: string; isHL: boolean };
  const segs: Seg[] = [{ text, isHL: false }];
  for (const ph of sorted) {
    const re = new RegExp(ph.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const next: Seg[] = [];
    for (const seg of segs) {
      if (seg.isHL) { next.push(seg); continue; }
      let last = 0; let m: RegExpExecArray | null; re.lastIndex = 0;
      while ((m = re.exec(seg.text)) !== null) {
        if (m.index > last) next.push({ text: seg.text.slice(last, m.index), isHL: false });
        next.push({ text: m[0], isHL: true });
        last = m.index + m[0].length;
      }
      if (last < seg.text.length) next.push({ text: seg.text.slice(last), isHL: false });
    }
    segs.length = 0; segs.push(...next);
  }
  return segs;
}

function HighlightText({ text, phrases }: { text: string; phrases: string[] }) {
  if (!text) return null;
  return (
    <>
      {highlightSegments(text, phrases).map((seg, i) =>
        seg.isHL
          ? <span key={i} style={HL_STYLE}>{seg.text}</span>
          : <span key={i}>{seg.text}</span>
      )}
    </>
  );
}

/* ── Reply copy ─────────────────────────────────────────────────────────── */
const REPLY_LINES: Record<string, [string, string, string]> = {
  'south-indian':       ['South Indian food.', 'Got it.', "I'll bring more South Indian to your feed."],
  'asian':              ['Asian flavours.', 'Noted.', "Moving them higher in your feed now."],
  'cafes-bakes':        ['Cafés and bakes.', 'Perfect.', "Your feed just got a lot warmer."],
  'home-table':         ['Home-cooked meals.', 'Got it.', "I'll keep that warmth coming."],
  'street-stall':       ['Street food and chai.', 'Noted.', "Adjusting your feed around that."],
  'restaurant-counter': ['Fine dining energy.', 'Got it.', "Your feed will reflect it."],
  'heritage-escape':    ['Heritage and history.', 'Deep cuts.', "More of that coming your way."],
  'nature-slow':        ['Slow nature travel.', 'Noted.', "Your feed is shifting around that."],
  'city-energy':        ['City energy.', 'Got it.', "Streets, buzz — the whole thing."],
  'calm-evening':       ['Slow and calm evenings.', 'Noted.', "I'll tune your feed around that pace."],
  'social-evening':     ['Lively evenings.', 'Got it.', "Your feed is already shifting."],
  'discovery-evening':  ['Something unexpected.', 'Love that.', "On it."],
  'cozy-home':          ['Warm and cosy spaces.', 'Noted.', "Your feed will feel like home."],
  'minimal-home':       ['Minimal and clean.', 'Got it.', "Editing your feed now."],
  'outdoor-home':       ['Green and open living.', 'Noted.', "Updating your feed around that."],
  'heritage-route':     ['Ancient routes.', 'Noted.', "More history coming your way."],
  'nordic-cabin':       ['Nordic cabin vibes.', 'Got it.', "Slow, quiet, cosy — noted."],
  'mountain-road':      ['Mountain roads and open sky.', 'Noted.', "Your feed is shifting."],
};

const REPLY_HIGHLIGHT_PHRASES = [
  'South Indian', 'Asian', 'Cafés', 'bakes', 'home-cooked', 'street food', 'chai',
  'fine dining', 'Heritage', 'history', 'Nature', 'City energy',
  'Slow', 'calm', 'Lively', 'warm', 'cosy', 'Minimal', 'Green',
  'mountain', 'Nordic', 'Ancient', 'food', 'feed',
];

function getReplyLines(ids: Set<string>, opts: QuestionOptionConfig[]): [string, string, string] {
  if (ids.size === 1) {
    const id = [...ids][0];
    return REPLY_LINES[id] ?? [`${opts.find(o => o.id === id)?.label ?? 'That'}.`, 'Got it.', "Updating your feed."];
  }
  const labels = opts.filter(o => ids.has(o.id)).map(o => o.label);
  const nameStr = labels.length === 2
    ? `${labels[0]} and ${labels[1]}.`
    : `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}.`;
  return [nameStr, 'Got it.', "I'll tune your feed in that direction."];
}

/* ── StructuredReply ─────────────────────────────────────────────────────── */
type StructuredReplyProps = {
  lines: [string, string, string];
  playing: boolean;
  onDone: () => void;
};

function StructuredReply({ lines, playing, onDone }: StructuredReplyProps) {
  const [lineIdx,  setLineIdx]  = useState(-1);
  const [doneMask, setDoneMask] = useState([false, false, false]);
  const doneRef = useRef(false);
  const timers  = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!playing) return;
    setLineIdx(0);
    return () => timers.current.forEach(clearTimeout);
  }, [playing]);

  const onLineDone = useCallback((idx: number) => {
    setDoneMask(prev => { const n = [...prev]; n[idx] = true; return n as [boolean, boolean, boolean]; });
    const pauseMs = idx === 0 ? 650 : idx === 1 ? 500 : 0;
    if (idx < 2) {
      const t = setTimeout(() => setLineIdx(idx + 1), pauseMs);
      timers.current.push(t);
    } else if (!doneRef.current) {
      doneRef.current = true;
      const t = setTimeout(onDone, 800);
      timers.current.push(t);
    }
  }, [onDone]);

  const SPEED = [40, 55, 36];

  return (
    <div style={{ textAlign: 'center', lineHeight: 1.55 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          overflow: 'hidden',
          maxHeight: lineIdx >= i ? '3em' : 0,
          opacity: lineIdx >= i ? 1 : 0,
          transition: 'max-height 0.38s ease, opacity 0.32s ease',
          marginBottom: i < 2 ? 'clamp(4px, 0.8vh, 10px)' : 0,
        }}>
          <span style={{
            fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
            fontSize: i === 1 ? 'clamp(24px, 2.6vw, 40px)' : 'clamp(17px, 1.8vw, 26px)',
            fontWeight: i === 1 ? 700 : 400,
            color: i === 1 ? 'rgba(255,255,255,0.98)' : 'rgba(245,243,247,0.78)',
            letterSpacing: i === 1 ? '-0.025em' : 'normal',
          }}>
            {lineIdx >= i ? (
              doneMask[i]
                ? <HighlightText text={lines[i]} phrases={REPLY_HIGHLIGHT_PHRASES} />
                : <TypewriterText text={lines[i]} playing={lineIdx === i} speed={SPEED[i]}
                    showCursor={lineIdx === i} onDone={() => onLineDone(i)} />
            ) : null}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Types ───────────────────────────────────────────────────────────────── */
type Phase     = 'question' | 'celebration' | 'exit';
type FocusArea = 'cards' | 'buttons';

type Props = {
  question:        QuestionConfig;
  currentL0Image?: string;
  idleMs?:         number;
  onAnswer:  (option: QuestionOptionConfig) => void;
  onDismiss: () => void;
};

/* ── Component ───────────────────────────────────────────────────────────── */
export default function InterstitialQuestion({
  question, currentL0Image, idleMs = 12000, onAnswer, onDismiss,
}: Props) {
  const bgSrc = currentL0Image ?? question.bgImage;

  const [phase,        setPhase]        = useState<Phase>('question');
  const [headlinePlay, setHeadlinePlay] = useState(false);
  const [headlineDone, setHeadlineDone] = useState(false);
  const [replyPlaying, setReplyPlaying] = useState(false);
  const [focusArea,    setFocusArea]    = useState<FocusArea>('cards');
  const [focusIdx,     setFocusIdx]     = useState(0);
  const [btnFocusIdx,  setBtnFocusIdx]  = useState(1);
  const [selected,     setSelected]     = useState<Set<string>>(new Set());
  const [replyLines,   setReplyLines]   = useState<[string, string, string]>(['', '', '']);
  const [barWidth,     setBarWidth]     = useState(100);
  const [celebAgentTop, setCelebAgentTop] = useState(0);
  const [clock, setClock] = useState(() =>
    new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/\s?[AP]M/i, ''));
  const [ampm, setAmpm] = useState(() => new Date().getHours() < 12 ? 'AM' : 'PM');

  /* refs */
  const rootRef        = useRef<HTMLDivElement>(null);
  const bgRef          = useRef<HTMLDivElement>(null);
  const overlayRef     = useRef<HTMLDivElement>(null);
  const headerRef      = useRef<HTMLDivElement>(null);
  const questionRef    = useRef<HTMLDivElement>(null);
  const flyLayerRef    = useRef<HTMLDivElement>(null);
  const celebAgentRef  = useRef<HTMLDivElement>(null);
  const cardElsRef     = useRef<(HTMLDivElement | null)[]>([]);
  const startRef       = useRef(Date.now());
  const timersRef      = useRef<ReturnType<typeof setTimeout>[]>([]);
  const idleTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isMulti     = question.template === 'multi-select';
  const totalOpts   = question.options.length;
  const totalCols   = totalOpts;
  const hlPhrases   = question.highlightPhrases ?? [];

  /* Clock */
  useEffect(() => {
    const t = setInterval(() => {
      const n = new Date();
      setClock(n.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/\s?[AP]M/i, ''));
      setAmpm(n.getHours() < 12 ? 'AM' : 'PM');
    }, 30_000);
    return () => clearInterval(t);
  }, []);

  /* ── Entrance ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    gsap.set([bgRef.current, overlayRef.current, headerRef.current].filter(Boolean), { opacity: 0 });
    if (questionRef.current) gsap.set(questionRef.current, { opacity: 0 });
    if (celebAgentRef.current) gsap.set(celebAgentRef.current, { opacity: 0 });

    const tl = gsap.timeline();
    tl.to(bgRef.current,      { opacity: 1, duration: 0.9, ease: 'power2.out' }, 0);
    tl.to(overlayRef.current, { opacity: 1, duration: 0.7, ease: 'power2.out' }, 0.15);
    tl.to(headerRef.current,  { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }, 0.5);
    tl.to(questionRef.current,{ opacity: 1, duration: 0.5, ease: 'power2.out' }, 0.65);

    const cards = cardElsRef.current.filter(Boolean) as HTMLElement[];
    cards.forEach(el => gsap.set(el, { opacity: 0, y: 22, scale: 0.96 }));
    cards.forEach((el, i) =>
      tl.to(el, { opacity: 1, y: 0, scale: 1, duration: 0.42, ease: 'power3.out' }, 1.05 + i * 0.1)
    );
    tl.call(() => setHeadlinePlay(true), [], 0.8);

    return () => { tl.kill(); };
  }, []); // eslint-disable-line

  /* ── Auto-dismiss bar ────────────────────────────────────────────────── */
  useEffect(() => {
    if (!question.autoDismissMs || phase !== 'question') return;
    const iv = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.max(0, 100 - (elapsed / question.autoDismissMs) * 100);
      setBarWidth(pct);
      if (pct <= 0) { clearInterval(iv); onDismiss(); }
    }, 80);
    return () => clearInterval(iv);
  }, [question.autoDismissMs, phase, onDismiss]);

  /* ── Idle ─────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (phase !== 'question') return;
    idleTimer.current = setTimeout(onDismiss, idleMs);
    return () => { if (idleTimer.current) clearTimeout(idleTimer.current); };
  }, [phase, idleMs, onDismiss]);

  /* ── Keyboard ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (phase !== 'question') return;
    const handler = (e: KeyboardEvent) => {
      if (idleTimer.current) { clearTimeout(idleTimer.current); idleTimer.current = setTimeout(onDismiss, idleMs); }
      if (focusArea === 'cards') {
        if (e.key === 'ArrowLeft')  { e.preventDefault(); setFocusIdx(i => Math.max(0, i - 1)); return; }
        if (e.key === 'ArrowRight') { e.preventDefault(); setFocusIdx(i => Math.min(totalCols - 1, i + 1)); return; }
        if (e.key === 'ArrowDown' && isMulti) { e.preventDefault(); setFocusArea('buttons'); setBtnFocusIdx(1); return; }
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handlePick(question.options[focusIdx]); return;
        }
      } else {
        if (e.key === 'ArrowLeft')  { e.preventDefault(); setBtnFocusIdx(0); return; }
        if (e.key === 'ArrowRight') { e.preventDefault(); setBtnFocusIdx(1); return; }
        if (e.key === 'ArrowUp')    { e.preventDefault(); setFocusArea('cards'); return; }
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (btnFocusIdx === 0) setSelected(new Set(question.options.map(o => o.id)));
          else commitMulti(); return;
        }
      }
      if (e.key === 'Escape' || e.key === 'Backspace') { e.preventDefault(); onDismiss(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, focusArea, focusIdx, btnFocusIdx, selected, isMulti, totalCols, totalOpts]); // eslint-disable-line

  /* ── Handlers ─────────────────────────────────────────────────────────── */
  function handlePick(opt: QuestionOptionConfig) {
    if (isMulti) {
      setSelected(prev => { const n = new Set(prev); n.has(opt.id) ? n.delete(opt.id) : n.add(opt.id); return n; });
    } else {
      triggerCelebration(new Set([opt.id]));
    }
  }

  function commitMulti() {
    if (selected.size === 0) return;
    triggerCelebration(selected);
  }

  /* ── FLIP celebration ─────────────────────────────────────────────────── */
  function triggerCelebration(ids: Set<string>) {
    setPhase('celebration');
    setReplyLines(getReplyLines(ids, question.options));
    setSelected(ids);

    const flyLayer = flyLayerRef.current;
    const root     = rootRef.current;
    if (!flyLayer || !root) return;

    /* -- Collect selected entries & capture rects BEFORE any DOM changes -- */
    const selEntries = question.options
      .map((opt, i) => ({ opt, el: cardElsRef.current[i]!, idx: i }))
      .filter(e => e.el != null && ids.has(e.opt.id));

    const unselEls = question.options
      .map((_, i) => cardElsRef.current[i])
      .filter((el, i) => el != null && !ids.has(question.options[i].id)) as HTMLDivElement[];

    if (!selEntries.length) return;

    /* Root bounds — ghosts are positioned relative to root */
    const rootRect = root.getBoundingClientRect();

    const srcRects = selEntries.map(e => {
      const r = e.el.getBoundingClientRect();
      return {
        left:   r.left   - rootRect.left,
        top:    r.top    - rootRect.top,
        width:  r.width,
        height: r.height,
      };
    });

    const cardW = srcRects[0].width;
    const cardH = srcRects[0].height;

    /* -- Compute target: physical deck at screen center -------------------- */
    const SW   = root.offsetWidth;
    const SH   = root.offsetHeight;
    /* Space reserved below deck for agent + reply */
    const AGENT_BLOCK = 200;
    const HEADER_H    = 72;
    const available   = SH - HEADER_H - AGENT_BLOCK - 32;
    /* Scale cards only if a single card already overflows the available space */
    const scale = cardH > available ? available / cardH : 1.0;
    const tW    = cardW * scale;
    const tH    = cardH * scale;
    /* Deck sits in upper portion — vertically centered in available space */
    const tTop  = HEADER_H + Math.max(24, (available - tH) / 2);
    const tLeft = (SW - tW) / 2;

    /*
     * Physical deck offsets — cards render back-to-front (last card is bottom of stack).
     * Each card behind the top is peeking out: slight rotate + translate so the user
     * reads "stack" without needing to see each card.
     *
     * Front card (i === 0): very slight tilt, full opacity.
     * Cards behind (i > 0): increasing tilt + peek offset, reduced opacity.
     */
    const DECK_OFFSETS = [
      { rotate: -2,  x:  0,  y:  0,   scale: 1.00, opacity: 1.00, zIndex: 53 },  // top / front
      { rotate:  5,  x: 10,  y: 10,   scale: 0.97, opacity: 0.90, zIndex: 52 },  // middle
      { rotate: -7,  x: -8,  y: 18,   scale: 0.94, opacity: 0.75, zIndex: 51 },  // bottom
    ];

    const targets = selEntries.map((_, i) => {
      /* Back-of-deck cards animate to the same top/left as front card;
         their visual offset is applied via GSAP rotation/translate AFTER flight */
      return { left: tLeft, top: tTop, width: tW, height: tH };
    });

    /* -- Exit question UI -------------------------------------------------- */
    gsap.to(questionRef.current, { opacity: 0, duration: 0.28, ease: 'power2.in' });

    /* -- Unselected: fade + slide back ------------------------------------ */
    gsap.to(unselEls, {
      opacity: 0, scale: 0.82, y: 10,
      duration: 0.3, ease: 'power2.in', stagger: 0.06,
    });

    /* -- Hide originals (ghosts take their place) -------------------------- */
    selEntries.forEach(e => gsap.set(e.el, { opacity: 0 }));

    /* -- Create ghost clones at source positions --------------------------- */
    /* Render back-to-front so front card ends on top in the DOM */
    const renderOrder = selEntries.map((_, i) => i).reverse(); // [2,1,0] for 3 cards
    const ghosts: HTMLDivElement[] = [];

    for (const i of renderOrder) {
      const entry  = selEntries[i];
      const src    = srcRects[i];
      const deck   = DECK_OFFSETS[Math.min(i, DECK_OFFSETS.length - 1)];
      const ghost  = document.createElement('div');
      const br     = getComputedStyle(entry.el).borderRadius;

      ghost.style.cssText = [
        'position:absolute',
        `left:${src.left}px`, `top:${src.top}px`,
        `width:${src.width}px`, `height:${src.height}px`,
        `border-radius:${br}`,
        'overflow:hidden',
        `z-index:${deck.zIndex}`,
        'pointer-events:none',
        'background:#0d0820',
        'box-shadow:0 0 0 2px rgba(255,255,255,0.82),0 20px 60px rgba(0,0,0,0.65),0 0 48px 4px rgba(140,100,240,0.15)',
        'transform-origin:center center',
        'will-change:transform,left,top,opacity',
      ].join(';');

      /* Background image */
      if (entry.opt.image) {
        ghost.style.backgroundImage  = `url(${entry.opt.image})`;
        ghost.style.backgroundSize   = 'cover';
        ghost.style.backgroundPosition = 'center';
      }

      /* Gradient overlay */
      const grad = document.createElement('div');
      grad.style.cssText = 'position:absolute;inset:0;background:linear-gradient(to top,rgba(4,2,14,0.85) 0%,rgba(4,2,14,0.2) 55%,transparent 75%)';
      ghost.appendChild(grad);

      /* Check badge */
      const badge = document.createElement('div');
      badge.style.cssText = 'position:absolute;top:12px;right:12px;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.95);border:2px solid rgba(255,255,255,0.9);font-size:13px;font-weight:800;color:#111;z-index:3';
      badge.textContent = '✓';
      ghost.appendChild(badge);

      /* Label */
      const label = document.createElement('div');
      label.style.cssText = 'position:absolute;bottom:16px;left:18px;right:18px;z-index:2;font-size:18px;font-weight:700;color:#fff;font-family:"Plus Jakarta Sans",system-ui,sans-serif;letter-spacing:-0.01em;text-shadow:0 1px 8px rgba(0,0,0,0.8)';
      label.textContent = entry.opt.label;
      ghost.appendChild(label);

      flyLayer.appendChild(ghost);
      /* Store in selEntries order (not renderOrder) so targets[i] aligns */
      ghosts[i] = ghost;
    }

    /* -- Animate ghosts to center (flight phase) --------------------------- */
    const FLIGHT       = 0.62;
    const EASE_FLIGHT  = 'power3.inOut';
    /* Deck settle: short spring after landing */
    const SETTLE       = 0.38;
    const EASE_SETTLE  = 'back.out(1.3)';
    /* Single-select: no deck tilt — card lands flat */
    const isMultiSel   = selEntries.length > 1;

    selEntries.forEach((_, i) => {
      const ghost = ghosts[i];
      const tgt   = targets[i];
      const deck  = DECK_OFFSETS[Math.min(i, DECK_OFFSETS.length - 1)];

      /*
       * Two-phase tween:
       *  Phase 1 — flight: all cards fly to same center position, no rotation yet
       *  Phase 2 — settle: deck offsets snap in after landing
       *
       * Back-of-deck cards (i > 0) start flying slightly later so the front
       * card always leads and the deck "fans out" as they arrive.
       */
      const flightDelay = isMultiSel ? (selEntries.length - 1 - i) * 0.06 : 0;

      gsap.to(ghost, {
        left: tgt.left, top: tgt.top, width: tgt.width, height: tgt.height,
        duration: FLIGHT, ease: EASE_FLIGHT, delay: flightDelay,
        onComplete: () => {
          if (!isMultiSel) return; /* single card — no deck settle needed */
          /* Settle into deck position */
          gsap.to(ghost, {
            x:       deck.x,
            y:       deck.y,
            rotate:  deck.rotate,
            scale:   deck.scale,
            opacity: deck.opacity,
            duration: SETTLE, ease: EASE_SETTLE,
          });
        },
      });
    });

    /* -- Agent appears below the deck ------------------------------------- */
    const agentTop = tTop + tH + 32;
    setCelebAgentTop(agentTop);

    const totalFlightMs = (FLIGHT + Math.max(0, (selEntries.length - 1) * 0.06) + (isMultiSel ? SETTLE : 0) + 0.18) * 1000;
    const t1 = setTimeout(() => {
      if (!celebAgentRef.current) return;
      gsap.fromTo(celebAgentRef.current,
        { opacity: 0, y: 18, filter: 'blur(8px)' },
        { opacity: 1, y: 0,  filter: 'blur(0)',  duration: 0.48, ease: 'power3.out',
          onComplete: () => setReplyPlaying(true) }
      );
    }, totalFlightMs);
    timersRef.current.push(t1);
  }

  /* ── Exit ─────────────────────────────────────────────────────────────── */
  const onReplyDone = useCallback(() => {
    const t = setTimeout(() => {
      setPhase('exit');
      const flyLayer = flyLayerRef.current;
      const els = [bgRef.current, overlayRef.current, headerRef.current,
                   celebAgentRef.current, flyLayer].filter(Boolean);
      gsap.to(els, {
        opacity: 0, duration: 0.5, ease: 'power2.in',
        onComplete: () => {
          /* Clean up ghost divs */
          if (flyLayer) flyLayer.innerHTML = '';
          const first = question.options.find(o => selected.has(o.id));
          if (first) onAnswer(first);
        },
      });
    }, 600);
    timersRef.current.push(t);
  }, [selected, question.options, onAnswer]);

  useEffect(() => () => {
    timersRef.current.forEach(clearTimeout);
    if (flyLayerRef.current) flyLayerRef.current.innerHTML = '';
  }, []);

  const onHeadlineDone = useCallback(() => setHeadlineDone(true), []);

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div ref={rootRef} style={{ position: 'absolute', inset: 0, zIndex: 18, overflow: 'hidden' }}>

      {/* BG */}
      <div ref={bgRef} style={{
        position: 'absolute', inset: 0,
        backgroundImage: bgSrc ? `url(${bgSrc})` : 'none',
        backgroundColor: '#080416',
        backgroundSize: 'cover', backgroundPosition: 'center',
        filter: bgSrc ? 'blur(36px) brightness(0.28) saturate(0.55)' : 'none',
        transform: 'scale(1.1)',
      }} />

      {/* Overlay */}
      <div ref={overlayRef} style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom,rgba(4,2,14,0.55) 0%,rgba(4,2,14,0.28) 40%,rgba(4,2,14,0.72) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div ref={headerRef} style={{
        position: 'absolute',
        top: 'clamp(16px,3vh,48px)', left: 'clamp(20px,4.5vw,88px)', right: 'clamp(20px,4.5vw,88px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        zIndex: 30,
      }}>
        <img src={LOGO_SRC} alt="glance" style={{ height: 'clamp(26px,3.2vh,48px)', objectFit: 'contain', flexShrink: 0 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(5px,0.7vw,10px)' }}>
          <span style={{ fontSize: 'clamp(10px,1.1vw,18px)', color: 'rgba(255,255,255,0.45)', fontFamily: 'system-ui', fontWeight: 500 }}>☁ 65°</span>
          <span style={{ fontSize: 'clamp(10px,1.1vw,18px)', color: 'rgba(255,255,255,0.45)', fontFamily: 'system-ui', fontWeight: 500 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
          <span style={{ fontSize: 'clamp(10px,1.1vw,18px)', color: '#fff', fontFamily: 'system-ui', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
            {clock} {ampm}
          </span>
        </div>
      </div>

      {/* ── QUESTION UI ─────────────────────────────────────────────────── */}
      <div ref={questionRef} style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        paddingTop: 'clamp(80px,11vh,120px)',
        paddingBottom: 'clamp(16px,2.5vh,28px)',
        zIndex: 20,
        pointerEvents: phase === 'question' ? 'auto' : 'none',
      }}>

        {/* Mascot */}
        <div style={{ marginBottom: 'clamp(10px,1.8vh,20px)' }}>
          <AgentMascot agentMode="looking" size={80} />
        </div>

        {/* Headline */}
        <div style={{ width: 'clamp(360px,68vw,960px)', textAlign: 'center', marginBottom: 'clamp(14px,2vh,24px)' }}>
          <h2 style={{
            fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
            fontWeight: 400,
            fontSize: 'clamp(26px,3.2vw,48px)',
            color: 'rgba(245,243,247,0.88)',
            margin: 0, letterSpacing: '-0.022em', lineHeight: 1.15,
            textShadow: '0 2px 24px rgba(0,0,0,0.5)',
            whiteSpace: 'nowrap',
          }}>
            {headlineDone
              ? <HighlightText text={question.question} phrases={hlPhrases} />
              : <CinematicText text={question.question} playing={headlinePlay} speed={0.038} duration={0.55} onDone={onHeadlineDone} />
            }
          </h2>
        </div>

        {/* Caption */}
        <div style={{
          fontSize: 'clamp(11px,1.05vw,14px)', fontWeight: 500, letterSpacing: '0.04em',
          color: 'rgba(167,134,229,0.65)',
          fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', whiteSpace: 'nowrap',
          marginBottom: 'clamp(28px,4.5vh,48px)',
        }}>
          {question.subtext ?? (isMulti ? 'Pick a few that resonate' : 'Pick the one that fits')}
        </div>

        {/* Cards row */}
        <div style={{
          width: 'clamp(360px,88vw,1380px)',
          display: 'flex', gap: 'clamp(10px,1.2vw,18px)',
          marginBottom: 'clamp(28px,4vh,40px)', alignItems: 'center',
        }}>
          {question.options.map((opt, i) => {
            const focused = focusArea === 'cards' && focusIdx === i && phase === 'question';
            const sel     = selected.has(opt.id);
            return (
              <div
                key={opt.id}
                ref={el => { cardElsRef.current[i] = el; }}
                onClick={() => { if (phase !== 'question') return; setFocusIdx(i); setFocusArea('cards'); handlePick(opt); }}
                onMouseEnter={() => { if (phase !== 'question') return; setFocusIdx(i); setFocusArea('cards'); }}
                style={{
                  flex: 1, minWidth: 0,
                  height: 'clamp(240px,32vh,380px)',
                  borderRadius: 'clamp(14px,1.6vw,22px)',
                  position: 'relative', cursor: phase === 'question' ? 'pointer' : 'default',
                  overflow: 'hidden',
                  border: focused || sel ? '2.5px solid rgba(255,255,255,0.9)' : '1.5px solid rgba(255,255,255,0.1)',
                  boxShadow: focused ? '0 12px 48px rgba(0,0,0,0.6)' : '0 4px 20px rgba(0,0,0,0.35)',
                  transform: focused ? 'scale(1.06)' : 'scale(0.94)',
                  transition: 'transform 0.25s cubic-bezier(0.22,1,0.36,1), border 0.2s, box-shadow 0.2s',
                  background: '#0d0820',
                }}
              >
                {opt.image && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `url(${opt.image})`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                  }} />
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(4,2,14,0.88) 0%,rgba(4,2,14,0.22) 50%,transparent 72%)' }} />
                {sel && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.05)' }} />}
                <div style={{
                  position: 'absolute', top: 12, right: 12, zIndex: 3,
                  width: 28, height: 28, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: sel ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.3)',
                  border: '2px solid rgba(255,255,255,0.75)', backdropFilter: 'blur(4px)',
                  transition: 'all 0.18s ease',
                  fontSize: 13, color: sel ? '#111' : 'transparent', fontWeight: 800,
                }}>
                  {sel ? '✓' : ''}
                </div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 'clamp(14px,2.2vh,24px) clamp(16px,1.6vw,22px)', zIndex: 2 }}>
                  <div style={{
                    fontSize: 'clamp(15px,1.5vw,22px)', fontWeight: 700, color: '#fff',
                    fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
                    letterSpacing: '-0.01em', textShadow: '0 1px 8px rgba(0,0,0,0.8)',
                  }}>{opt.label}</div>
                </div>
              </div>
            );
          })}

        </div>

        {/* Multi-select buttons */}
        {isMulti && phase === 'question' && (
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <button
              onClick={() => setSelected(new Set(question.options.map(o => o.id)))}
              style={{
                padding: 'clamp(10px,1.4vh,14px) clamp(28px,3.5vw,48px)',
                fontSize: 'clamp(14px,1.3vw,18px)', fontWeight: 600,
                fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
                background: focusArea === 'buttons' && btnFocusIdx === 0 ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.88)',
                border: focusArea === 'buttons' && btnFocusIdx === 0 ? '2px solid rgba(255,255,255,0.7)' : '1.5px solid rgba(255,255,255,0.2)',
                borderRadius: 999, cursor: 'pointer', backdropFilter: 'blur(8px)', transition: 'all 0.18s ease',
              }}
            >Select All</button>
            <button
              onClick={commitMulti}
              style={{
                padding: 'clamp(10px,1.4vh,14px) clamp(32px,4vw,56px)',
                fontSize: 'clamp(14px,1.3vw,18px)', fontWeight: 700,
                fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
                background: selected.size > 0 ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.28)',
                color: selected.size > 0 ? '#111' : 'rgba(255,255,255,0.4)',
                outline: focusArea === 'buttons' && btnFocusIdx === 1 ? '2.5px solid rgba(255,255,255,0.85)' : 'none',
                outlineOffset: 3, border: 'none', borderRadius: 999,
                cursor: selected.size > 0 ? 'pointer' : 'default',
                boxShadow: selected.size > 0 ? '0 4px 24px rgba(0,0,0,0.22)' : 'none',
                transition: 'all 0.18s ease',
              }}
            >Done</button>
          </div>
        )}
      </div>

      {/* ── FLY LAYER — ghost card clones live here during flight ─────────── */}
      <div ref={flyLayerRef} style={{
        position: 'absolute', inset: 0,
        zIndex: 40, pointerEvents: 'none',
      }} />

      {/* ── AGENT + REPLY — appears below settled cards ───────────────────── */}
      <div ref={celebAgentRef} style={{
        position: 'absolute',
        top: celebAgentTop,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 'clamp(14px,2vh,24px)',
        zIndex: 42, pointerEvents: 'none',
        width: 'clamp(280px,50vw,680px)',
        opacity: 0,
      }}>
        {/* Mascot with glow */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            position: 'absolute', inset: '-30px', borderRadius: '50%',
            background: 'radial-gradient(circle,rgba(112,71,226,0.28) 0%,transparent 70%)',
            filter: 'blur(18px)', pointerEvents: 'none',
          }} />
          <AgentMascot agentMode="thinking" size={76} />
        </div>

        {/* Structured reply */}
        <StructuredReply lines={replyLines} playing={replyPlaying} onDone={onReplyDone} />
      </div>

      {/* Nav hint */}
      {phase === 'question' && (
        <div style={{
          position: 'absolute', bottom: 'clamp(8px,1.2vh,14px)',
          left: '50%', transform: 'translateX(-50%)',
          fontSize: 'clamp(10px,0.85vw,12px)', color: 'rgba(167,134,229,0.22)',
          fontFamily: 'system-ui', letterSpacing: '0.05em', whiteSpace: 'nowrap', zIndex: 5,
        }}>
          {focusArea === 'buttons'
            ? '← → between buttons · ↑ back to cards · OK to confirm'
            : '← → to browse · ↓ to buttons · OK to pick · Back to dismiss'}
        </div>
      )}

      {/* Progress bar */}
      {question.autoDismissMs > 0 && phase === 'question' && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'rgba(167,134,229,0.1)', zIndex: 20 }}>
          <div style={{ height: '100%', width: `${barWidth}%`, background: 'linear-gradient(90deg,#7047E2,#A786E5)', transition: 'width 0.08s linear' }} />
        </div>
      )}
    </div>
  );
}
