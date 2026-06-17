/**
 * L1Page — one clean mount per renderer.
 * Receives a single RendererConfig, owns the entire animation lifecycle.
 * Each route renders a fresh instance → no stale state, no animation bleed.
 *
 * Phase machine:
 *  BACKGROUND → AGENT → MESSAGE → PRIMARY_CONTENT → SECONDARY_CONTENT → PROMPTS → COMPLETE
 *
 * Content is gated: nothing in the renderer layer appears before MESSAGE phase.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import AgentMascot from '../Shared/AgentMascot';
import TemplateSwitcher from './TemplateSwitcher';
import { ThinkingLine, MicIcon } from './l1SharedComponents';
import {
  LEFT_PAD, AGENT_TOP, RENDERER_TOP, BOTTOM_H,
  FOCUS_BORDER, FOCUS_SHADOW, IDLE_BORDER, FOCUS_TRANSITION,
  ScreenPhase,
} from './l1Constants';
import type { RendererConfig } from './rendererRegistry';
import { RENDERERS } from './rendererRegistry';

import RecommendationRenderer  from './renderers/RecommendationRenderer';
import ComparisonRenderer      from './renderers/ComparisonRenderer';
import CollectionRenderer      from './renderers/CollectionRenderer';
import FactsRenderer           from './renderers/FactsRenderer';
import GuidedFlowRenderer      from './renderers/GuidedFlowRenderer';
import JourneyRenderer         from './renderers/JourneyRenderer';
import InsightsRenderer        from './renderers/InsightsRenderer';
import WhyThisRenderer         from './renderers/WhyThisRenderer';

const RENDERER_MAP = {
  'recommendation': RecommendationRenderer,
  'comparison':     ComparisonRenderer,
  'collection':     CollectionRenderer,
  'facts':          FactsRenderer,
  'guided-flow':    GuidedFlowRenderer,
  'journey':        JourneyRenderer,
  'insights':       InsightsRenderer,
  'why-this':       WhyThisRenderer,
} as const;

type Zone = 'middle' | 'bottom';

interface Props {
  config: RendererConfig;
  allRenderers: RendererConfig[];
}

export default function L1Page({ config, allRenderers }: Props) {
  /* ── TV nav ──────────────────────────────────────────────────────────────── */
  const [zone,   setZone]   = useState<Zone>('middle');
  const [midIdx, setMidIdx] = useState(0);
  const [botIdx, setBotIdx] = useState(-1);

  /* ── Animation phase state machine ──────────────────────────────────────── */
  const [phase, setPhase] = useState<ScreenPhase>(ScreenPhase.BACKGROUND);

  /* Agent sub-state — only used during AGENT / MESSAGE phases */
  const [agentSpeaking,   setAgentSpeaking]   = useState(false); // true while typewriting
  const [agentText,       setAgentText]        = useState('');
  const [cursorVisible,   setCursorVisible]    = useState(true);
  const [visibleSteps,    setVisibleSteps]     = useState(0);
  const [doneSteps,       setDoneSteps]        = useState<boolean[]>([]);
  const [typedTexts,      setTypedTexts]       = useState<string[]>([]);

  const BOT_MAX = config.prompts.length - 1;
  const currentIdx = allRenderers.findIndex(r => r.id === config.id);

  /* ── DOM refs ────────────────────────────────────────────────────────────── */
  const bgGlowRef      = useRef<HTMLDivElement>(null);
  const queryChipRef   = useRef<HTMLDivElement>(null);
  const mascotRowRef   = useRef<HTMLDivElement>(null);
  const thinkingBoxRef = useRef<HTMLDivElement>(null);
  const agentMsgRef    = useRef<HTMLDivElement>(null);
  const micRef         = useRef<HTMLButtonElement>(null);
  const chipRefs       = useRef<(HTMLDivElement | null)[]>([]);

  /* ── Phase machine driver ────────────────────────────────────────────────── */
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const push = (fn: () => void, ms: number) => { timers.push(setTimeout(fn, ms)); };

    /* Reset all initial states */
    setPhase(ScreenPhase.BACKGROUND);
    setAgentSpeaking(false);
    setAgentText('');
    setVisibleSteps(0);
    setDoneSteps([]);
    setTypedTexts(config.thinkingSteps.map(() => ''));

    /* Hard-set elements to invisible before animation begins */
    gsap.set([bgGlowRef.current, queryChipRef.current, mascotRowRef.current,
              thinkingBoxRef.current, agentMsgRef.current], { opacity: 0 });
    gsap.set(queryChipRef.current, { x: 20 });
    gsap.set(mascotRowRef.current, { scale: 0.9 });

    /* ── PHASE 1: Background ─────────────────── t=0 */
    gsap.to(bgGlowRef.current, { opacity: 1, duration: 0.9, ease: 'power2.inOut' });
    // Query chip slides in with background
    push(() => {
      gsap.to(queryChipRef.current, { opacity: 1, x: 0, duration: 0.5, ease: 'power3.out' });
    }, 80);

    /* ── PHASE 2: Agent appears ──────────────── t=300ms */
    push(() => {
      setPhase(ScreenPhase.AGENT);
      gsap.to(mascotRowRef.current, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.4)' });
      // Start showing thinking steps
      gsap.to(thinkingBoxRef.current, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
    }, 300);

    /* ── Thinking steps typewriter ───────────── t=600ms start */
    const STEP_INTERVAL = 1100;
    const CHAR_DELAY    = 22;
    const DONE_LAG      = 600;

    config.thinkingSteps.forEach((step, i) => {
      const stepStart = 600 + i * STEP_INTERVAL;
      push(() => setVisibleSteps(i + 1), stepStart);
      for (let c = 1; c <= step.length; c++) {
        const s = step.slice(0, c);
        push(() => setTypedTexts(prev => { const n = [...prev]; n[i] = s; return n; }),
             stepStart + c * CHAR_DELAY);
      }
      const finishAt = stepStart + step.length * CHAR_DELAY + DONE_LAG;
      push(() => setDoneSteps(prev => { const n = [...prev]; n[i] = true; return n; }), finishAt);
    });

    /* ── PHASE 3: Message ────────────────────── after last thinking step */
    const lastStepStart  = 600 + (config.thinkingSteps.length - 1) * STEP_INTERVAL;
    const lastTypingEnd  = lastStepStart + config.thinkingSteps[config.thinkingSteps.length - 1].length * CHAR_DELAY;
    const thinkingEnd    = lastTypingEnd + DONE_LAG + 400;

    push(() => {
      gsap.to(thinkingBoxRef.current, {
        opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0,
        duration: 0.28, ease: 'power2.in',
        onComplete: () => {
          setPhase(ScreenPhase.MESSAGE);
          setAgentSpeaking(true);
          gsap.set(agentMsgRef.current, { opacity: 0 });
          gsap.to(agentMsgRef.current, { opacity: 1, duration: 0.25, ease: 'power2.out' });
        },
      });
    }, thinkingEnd);

    /* ── Agent message typewriter ─────────────── */
    const msgStart = thinkingEnd + 320;
    const msg = config.agentMessage;
    const cursorInterval = setInterval(() => setCursorVisible(v => !v), 530);

    push(() => {
      let i = 0;
      const tick = () => {
        i++;
        setAgentText(msg.slice(0, i));
        if (i < msg.length) {
          timers.push(setTimeout(tick, 28));
        } else {
          clearInterval(cursorInterval);
          setAgentSpeaking(false);
          /* ── PHASE 4: Primary content ─────── */
          push(() => setPhase(ScreenPhase.PRIMARY_CONTENT), 180);
          /* ── PHASE 5: Secondary content ──── */
          push(() => setPhase(ScreenPhase.SECONDARY_CONTENT), 580);
          /* ── PHASE 6: Prompts ─────────────── */
          push(() => {
            setPhase(ScreenPhase.PROMPTS);
            if (micRef.current)
              gsap.fromTo(micRef.current, { opacity:0, y:16 }, { opacity:1, y:0, duration:0.3, ease:'power2.out' });
            chipRefs.current.forEach((el, idx) => {
              if (!el) return;
              gsap.fromTo(el, { opacity:0, y:16 }, { opacity:1, y:0, duration:0.3, ease:'power2.out', delay: 0.05 + idx * 0.09 });
            });
          }, 900);
          /* ── PHASE 7: Complete */
          push(() => setPhase(ScreenPhase.COMPLETE), 1300);
        }
      };
      tick();
    }, msgStart);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(cursorInterval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Keyboard navigation ─────────────────────────────────────────────────── */
  const navigate = useCallback((slug: string) => {
    window.location.pathname = `/L1_templates/${slug}`;
  }, []);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === 'ArrowRight') {
        e.preventDefault();
        const next = allRenderers[currentIdx + 1];
        if (next) navigate(next.id);
        return;
      }
      if (meta && e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = allRenderers[currentIdx - 1];
        if (prev) navigate(prev.id);
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (zone === 'middle') setMidIdx(i => Math.min(config.maxIdx, i + 1));
        else                   setBotIdx(i => Math.min(BOT_MAX, i + 1));
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (zone === 'middle') setMidIdx(i => Math.max(0, i - 1));
        else                   setBotIdx(i => Math.max(-1, i - 1));
      }
      if (e.key === 'ArrowDown' && zone === 'middle') { e.preventDefault(); setZone('bottom'); setBotIdx(0); }
      if (e.key === 'ArrowUp'   && zone === 'bottom') { e.preventDefault(); setZone('middle'); }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [zone, config.maxIdx, BOT_MAX, currentIdx, allRenderers, navigate]);

  /* ── Derived display state ───────────────────────────────────────────────── */
  const isThinking   = phase === ScreenPhase.AGENT;
  const isMicFoc     = zone === 'bottom' && botIdx === -1;
  const isBot        = (i: number) => zone === 'bottom' && botIdx === i;
  const RendererComp = RENDERER_MAP[config.id];
  const agentMode    = isThinking ? 'thinking' : agentSpeaking ? 'looking' : 'idle';

  return (
    <div style={{
      width: '100vw', height: '100vh',
      overflow: 'hidden', position: 'relative',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      background: '#07030d',
    }}>

      {/* ── Background layers ────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(162deg, #0e051e 0%, #13082a 40%, #0a0518 70%, #04020b 100%)',
      }} />
      <div ref={bgGlowRef} style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0,
        background: [
          'radial-gradient(ellipse 1400px 780px at 54% 28%, rgba(88,36,172,0.28), transparent 60%)',
          'radial-gradient(ellipse 720px 520px at 13% 20%, rgba(108,50,188,0.14), transparent 56%)',
        ].join(','),
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 320,
        pointerEvents: 'none', zIndex: 1,
        background: 'linear-gradient(to top, rgba(4,2,11,1) 0%, rgba(4,2,11,0.6) 44%, transparent 100%)',
      }} />

      {/* ── ROW 1: Top bar ────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `44px ${LEFT_PAD}px 0`,
      }}>
        <img src="/glance-logo.png" alt="glance"
          style={{ height: 30, objectFit: 'contain' }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />

        <div ref={queryChipRef} style={{
          background: 'rgba(255,255,255,0.09)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.13)',
          borderRadius: 999,
          padding: '12px 28px',
          fontSize: 20, fontWeight: 500,
          letterSpacing: '-0.01em', color: 'rgba(255,255,255,0.90)',
          opacity: 0,
        }}>
          {config.query}
        </div>
      </div>

      {/* ── ROW 2: Agent row ──────────────────────────────────────────────── */}
      <div ref={mascotRowRef} style={{
        position: 'absolute', top: AGENT_TOP, left: LEFT_PAD,
        display: 'flex', alignItems: 'flex-start', gap: 18,
        zIndex: 10, opacity: 0,
        /* Constrain agent message width so it never crowds the renderer */
        maxWidth: 820,
      }}>
        <div style={{ flexShrink: 0, width: 50, height: 50, marginTop: 3 }}>
          <AgentMascot agentMode={agentMode} size={50} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>

          {/* Thinking lines — always in DOM so ref is available for GSAP */}
          <div ref={thinkingBoxRef} style={{
            display: 'flex', flexDirection: 'column', gap: 11, opacity: 0,
            overflow: 'hidden',
          }}>
            {config.thinkingSteps.slice(0, visibleSteps).map((_, i) => (
              <ThinkingLine
                key={i}
                typedText={typedTexts[i] ?? ''}
                done={!!doneSteps[i]}
                isActive={i === visibleSteps - 1 && !doneSteps[i]}
              />
            ))}
          </div>

          {/* Agent message — always in DOM so ref is available for GSAP */}
          <div ref={agentMsgRef} style={{
            fontSize: 26, fontWeight: 600, color: '#fff',
            letterSpacing: '-0.015em', lineHeight: 1.32,
            opacity: 0,
          }}>
            {agentText}
            {agentSpeaking && (
              <span style={{
                display: 'inline-block', width: 2, height: '0.95em',
                background: 'rgba(255,255,255,0.8)',
                marginLeft: 3, verticalAlign: 'text-bottom',
                opacity: cursorVisible ? 1 : 0, transition: 'opacity 0.08s',
              }} />
            )}
          </div>
        </div>
      </div>

      {/* ── ROW 2 (renderer layer) — gated: nothing until PRIMARY_CONTENT ─── */}
      <RendererComp
        focusIdx={zone === 'middle' ? midIdx : -1}
        phase={phase}
      />

      {/* ── ROW 3: Prompt pivot row ───────────────────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: BOTTOM_H, zIndex: 10,
        display: 'flex', alignItems: 'center',
        padding: `0 ${LEFT_PAD}px`, gap: 14,
      }}>
        {/* Mic */}
        <button ref={micRef} style={{
          width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
          background: isMicFoc ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.07)',
          border: isMicFoc ? FOCUS_BORDER : IDLE_BORDER('0.15'),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', backdropFilter: 'blur(14px)',
          opacity: 0, /* animated in by phase machine */
          boxShadow: isMicFoc ? FOCUS_SHADOW : 'none',
          transform: isMicFoc ? 'scale(1.1)' : 'scale(1)',
          transition: FOCUS_TRANSITION,
        }}>
          <MicIcon />
        </button>

        {/* Prompt chips */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', overflow: 'visible' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            {config.prompts.map((chip, i) => {
              const focused = isBot(i);
              return (
                <div
                  key={i}
                  ref={el => { chipRefs.current[i] = el; }}
                  style={{
                    flex: '0 0 248px', height: 86,
                    background: focused ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.065)',
                    backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
                    border: focused ? FOCUS_BORDER : IDLE_BORDER('0.08'),
                    borderRadius: 16, padding: '0 18px',
                    display: 'flex', alignItems: 'center',
                    fontSize: 15, fontWeight: 500, lineHeight: 1.4,
                    color: focused ? '#fff' : 'rgba(255,255,255,0.65)',
                    cursor: 'pointer',
                    boxShadow: focused ? FOCUS_SHADOW : 'none',
                    transform: focused ? 'scale(1.04) translateY(-3px)' : 'scale(1)',
                    transition: FOCUS_TRANSITION,
                    opacity: 0, /* animated in by phase machine */
                  }}
                >
                  {chip}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Template switcher ─────────────────────────────────────────────── */}
      <TemplateSwitcher
        renderers={allRenderers}
        currentIdx={currentIdx}
        onNavigate={navigate}
      />
    </div>
  );
}
