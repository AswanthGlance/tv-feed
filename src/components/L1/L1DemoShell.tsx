import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import AgentMascot from '../Shared/AgentMascot';
import TemplateSwitcher from './TemplateSwitcher';
import { RENDERERS } from './rendererRegistry';
import { ThinkingLine, MicIcon } from './l1SharedComponents';
import {
  LEFT_PAD, FOCUS_BORDER, FOCUS_SHADOW, IDLE_BORDER, FOCUS_TRANSITION,
  ScreenPhase,
} from './l1Constants';

import RecommendationRenderer from './renderers/RecommendationRenderer';
import ComparisonRenderer     from './renderers/ComparisonRenderer';
import CollectionRenderer     from './renderers/CollectionRenderer';
import FactsRenderer          from './renderers/FactsRenderer';
import GuidedFlowRenderer     from './renderers/GuidedFlowRenderer';
import JourneyRenderer        from './renderers/JourneyRenderer';
import InsightsRenderer       from './renderers/InsightsRenderer';
import WhyThisRenderer        from './renderers/WhyThisRenderer';

type Zone       = 'middle' | 'bottom';
type AgentPhase = 'thinking' | 'responding' | 'done';

const RENDERER_COMPONENTS = {
  'recommendation': RecommendationRenderer,
  'comparison':     ComparisonRenderer,
  'collection':     CollectionRenderer,
  'facts':          FactsRenderer,
  'guided-flow':    GuidedFlowRenderer,
  'journey':        JourneyRenderer,
  'insights':       InsightsRenderer,
  'why-this':       WhyThisRenderer,
} as const;

export default function L1DemoShell() {
  const [templateIdx, setTemplateIdx] = useState(0);
  const config = RENDERERS[templateIdx];

  /* ── Nav state ──────────────────────────────────────────────────────────── */
  const [zone,   setZone]   = useState<Zone>('middle');
  const [midIdx, setMidIdx] = useState(0);
  const [botIdx, setBotIdx] = useState(-1);

  /* ── Agent state ────────────────────────────────────────────────────────── */
  const [agentPhase,      setAgentPhase]      = useState<AgentPhase>('thinking');
  const [visibleSteps,    setVisibleSteps]    = useState(0);
  const [doneSteps,       setDoneSteps]       = useState<boolean[]>([]);
  const [typedTexts,      setTypedTexts]      = useState<string[]>([]);
  const [agentText,       setAgentText]       = useState('');
  const [cursorVisible,   setCursorVisible]   = useState(true);
  const [contentVisible,  setContentVisible]  = useState(false);

  const BOT_MAX = config.prompts.length - 1;

  /* ── DOM refs ───────────────────────────────────────────────────────────── */
  const bgGlowRef      = useRef<HTMLDivElement>(null);
  const queryChipRef   = useRef<HTMLDivElement>(null);
  const mascotRowRef   = useRef<HTMLDivElement>(null);
  const thinkingBoxRef = useRef<HTMLDivElement>(null);
  const micRef         = useRef<HTMLButtonElement>(null);
  const chipRefs       = useRef<(HTMLDivElement | null)[]>([]);

  /* ── Animation sequence (fires on mount & templateIdx change) ───────────── */
  const runAnimation = useCallback((cfg: typeof config) => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const cursorInterval = setInterval(() => setCursorVisible(v => !v), 530);

    setAgentPhase('thinking');
    setVisibleSteps(0);
    setDoneSteps([]);
    setTypedTexts(cfg.thinkingSteps.map(() => ''));
    setAgentText('');
    setContentVisible(false);

    gsap.set(bgGlowRef.current,   { opacity: 0 });
    gsap.to(bgGlowRef.current,    { opacity: 1, duration: 1.6, ease: 'power2.inOut' });
    gsap.set(queryChipRef.current, { opacity: 0, x: 24 });
    gsap.to(queryChipRef.current,  { opacity: 1, x: 0, duration: 0.55, ease: 'power3.out', delay: 0.3 });

    gsap.set(mascotRowRef.current, { opacity: 0, scale: 0.88 });
    gsap.to(mascotRowRef.current,  { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.6)', delay: 0.75 });

    gsap.set(thinkingBoxRef.current, { opacity: 0, y: 8, height: 'auto' });
    gsap.to(thinkingBoxRef.current,  { opacity: 1, y: 0, duration: 0.38, ease: 'power2.out', delay: 1.1 });

    const STEP_INTERVAL = 1200;
    const CHAR_DELAY    = 26;
    const STEP_DONE_LAG = 700;

    cfg.thinkingSteps.forEach((step, i) => {
      const stepStart = 1300 + i * STEP_INTERVAL;
      timers.push(setTimeout(() => setVisibleSteps(i + 1), stepStart));
      for (let c = 1; c <= step.length; c++) {
        const slice = step.slice(0, c);
        timers.push(setTimeout(() => {
          setTypedTexts(prev => { const n = [...prev]; n[i] = slice; return n; });
        }, stepStart + c * CHAR_DELAY));
      }
      const typingDone = step.length * CHAR_DELAY;
      timers.push(setTimeout(() => setDoneSteps(prev => {
        const n = [...prev]; n[i] = true; return n;
      }), stepStart + typingDone + STEP_DONE_LAG));
    });

    const lastStart   = 1300 + (cfg.thinkingSteps.length - 1) * STEP_INTERVAL;
    const lastDone    = lastStart + cfg.thinkingSteps[cfg.thinkingSteps.length - 1].length * CHAR_DELAY;
    const thinkingEnd = lastDone + STEP_DONE_LAG + 500;

    timers.push(setTimeout(() => {
      gsap.to(thinkingBoxRef.current, {
        opacity: 0, y: -8, height: 0,
        paddingTop: 0, paddingBottom: 0, marginBottom: 0,
        duration: 0.32, ease: 'power2.in',
        onComplete: () => setAgentPhase('responding'),
      });
    }, thinkingEnd));

    const typeStart = thinkingEnd + 380;
    const msg = cfg.agentMessage;
    timers.push(setTimeout(() => {
      let i = 0;
      const tick = () => {
        i++;
        setAgentText(msg.slice(0, i));
        if (i < msg.length) {
          timers.push(setTimeout(tick, 29));
        } else {
          clearInterval(cursorInterval);
          setAgentPhase('done');
          timers.push(setTimeout(() => setContentVisible(true), 260));
        }
      };
      tick();
    }, typeStart));

    // Animate bottom chips once contentVisible (timer-based fallback)
    const botStart = typeStart + msg.length * 29 + 260 + 100;
    timers.push(setTimeout(() => {
      if (micRef.current) gsap.fromTo(micRef.current, { opacity:0, y:20 }, { opacity:1, y:0, duration:0.34, ease:'power2.out' });
      chipRefs.current.forEach((el, i) => {
        if (!el) return;
        gsap.fromTo(el, { opacity:0, y:20 }, { opacity:1, y:0, duration:0.34, ease:'power2.out', delay: 0.06 + i * 0.1 });
      });
    }, botStart));

    return () => { timers.forEach(clearTimeout); clearInterval(cursorInterval); };
  }, []);

  /* ── Run animation on mount ─────────────────────────────────────────────── */
  useEffect(() => {
    return runAnimation(config);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Template switch ────────────────────────────────────────────────────── */
  const switchTemplate = useCallback((newIdx: number) => {
    if (newIdx < 0 || newIdx >= RENDERERS.length) return;
    setTemplateIdx(newIdx);
    setZone('middle');
    setMidIdx(0);
    setBotIdx(-1);

    /* Hide existing bottom chips for re-animation */
    if (micRef.current)  gsap.set(micRef.current,  { opacity: 0 });
    chipRefs.current.forEach(el => { if (el) gsap.set(el, { opacity: 0 }); });

    setTimeout(() => runAnimation(RENDERERS[newIdx]), 50);
  }, [runAnimation]);

  /* ── Keyboard navigation ────────────────────────────────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;

      /* Template switcher: Cmd/Ctrl + Arrow */
      if (meta && e.key === 'ArrowRight') { e.preventDefault(); switchTemplate(templateIdx + 1); return; }
      if (meta && e.key === 'ArrowLeft')  { e.preventDefault(); switchTemplate(templateIdx - 1); return; }

      /* Normal TV navigation */
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
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [zone, config.maxIdx, BOT_MAX, templateIdx, switchTemplate]);

  /* ── Render ─────────────────────────────────────────────────────────────── */
  const isMicFoc = zone === 'bottom' && botIdx === -1;
  const isBot    = (i: number) => zone === 'bottom' && botIdx === i;
  const RendererComponent = RENDERER_COMPONENTS[config.id];

  return (
    <div style={{
      width: '100vw', height: '100vh',
      overflow: 'hidden', position: 'relative',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      background: '#07030d',
    }}>

      {/* Base gradient */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(162deg, #0e051e 0%, #13082a 40%, #0a0518 70%, #04020b 100%)',
      }} />

      {/* Purple glow */}
      <div ref={bgGlowRef} style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0,
        background: [
          'radial-gradient(ellipse 1300px 720px at 55% 26%, rgba(90,38,178,0.30), transparent 62%)',
          'radial-gradient(ellipse 700px 500px at 14% 18%, rgba(110,52,192,0.16), transparent 58%)',
        ].join(','),
      }} />

      {/* Bottom vignette */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 300,
        pointerEvents: 'none', zIndex: 1,
        background: 'linear-gradient(to top, rgba(4,2,11,1) 0%, rgba(4,2,11,0.65) 45%, transparent 100%)',
      }} />

      {/* ── TOP BAR ──────────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `44px ${LEFT_PAD}px 0`,
      }}>
        <img src="/glance-logo.png" alt="glance"
          style={{ height: 30, width: 'auto', objectFit: 'contain' }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        <div ref={queryChipRef} style={{
          background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999,
          padding: '13px 30px', fontSize: 21, fontWeight: 500,
          letterSpacing: '-0.01em', color: 'rgba(255,255,255,0.92)', opacity: 0,
        }}>
          {config.query}
        </div>
      </div>

      {/* ── AGENT ROW ────────────────────────────────────────────────────── */}
      <div ref={mascotRowRef} style={{
        position: 'absolute', top: 134, left: LEFT_PAD,
        display: 'flex', alignItems: 'flex-start', gap: 16,
        zIndex: 10, opacity: 0,
      }}>
        <div style={{ flexShrink: 0, width: 52, height: 52, marginTop: 4 }}>
          <AgentMascot
            agentMode={agentPhase === 'thinking' ? 'thinking' : agentPhase === 'responding' ? 'looking' : 'idle'}
            size={52}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {agentPhase === 'thinking' && (
            <div ref={thinkingBoxRef} style={{ display: 'flex', flexDirection: 'column', gap: 12, opacity: 0 }}>
              {config.thinkingSteps.slice(0, visibleSteps).map((_, i) => (
                <ThinkingLine
                  key={i}
                  typedText={typedTexts[i] ?? ''}
                  done={!!doneSteps[i]}
                  isActive={i === visibleSteps - 1 && !doneSteps[i]}
                />
              ))}
            </div>
          )}
          {(agentPhase === 'responding' || agentPhase === 'done') && (
            <div style={{
              fontSize: 27, fontWeight: 600, color: '#fff',
              letterSpacing: '-0.015em', lineHeight: 1.3,
            }}>
              {agentText}
              {agentPhase === 'responding' && (
                <span style={{
                  display: 'inline-block', width: 2, height: '1em',
                  background: 'rgba(255,255,255,0.85)',
                  marginLeft: 3, verticalAlign: 'text-bottom',
                  opacity: cursorVisible ? 1 : 0, transition: 'opacity 0.1s',
                }} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── RENDERER LAYER ───────────────────────────────────────────────── */}
      <RendererComponent
        focusIdx={zone === 'middle' ? midIdx : -1}
        phase={contentVisible ? ScreenPhase.COMPLETE : ScreenPhase.PRIMARY_CONTENT}
      />

      {/* ── BOTTOM ROW ───────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 160, zIndex: 10,
        display: 'flex', alignItems: 'center',
        padding: `0 ${LEFT_PAD}px`, gap: 14,
      }}>
        <button ref={micRef} style={{
          width: 58, height: 58, borderRadius: '50%', flexShrink: 0,
          background: isMicFoc ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)',
          border: isMicFoc ? FOCUS_BORDER : IDLE_BORDER('0.18'),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', backdropFilter: 'blur(14px)', opacity: 0,
          boxShadow: isMicFoc ? FOCUS_SHADOW : 'none',
          transform: isMicFoc ? 'scale(1.1)' : 'scale(1)',
          transition: FOCUS_TRANSITION,
        }}>
          <MicIcon />
        </button>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', overflow: 'visible' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            {config.prompts.map((chip, i) => {
              const focused = isBot(i);
              return (
                <div
                  key={i}
                  ref={el => { chipRefs.current[i] = el; }}
                  style={{
                    flex: '0 0 252px', height: 90,
                    background: focused ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.07)',
                    backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
                    border: focused ? FOCUS_BORDER : IDLE_BORDER('0.09'),
                    borderRadius: 18, padding: '0 20px',
                    display: 'flex', alignItems: 'center',
                    fontSize: 16, fontWeight: 500, lineHeight: 1.38,
                    color: focused ? '#fff' : 'rgba(255,255,255,0.7)',
                    cursor: 'pointer',
                    boxShadow: focused ? FOCUS_SHADOW : 'none',
                    transform: focused ? 'scale(1.04) translateY(-4px)' : 'scale(1)',
                    transition: FOCUS_TRANSITION,
                    opacity: 0,
                  }}
                >
                  {chip}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── TEMPLATE SWITCHER ────────────────────────────────────────────── */}
      <TemplateSwitcher
        renderers={RENDERERS}
        currentIdx={templateIdx}
        onNavigate={(slug) => {
          const idx = RENDERERS.findIndex(r => r.id === slug);
          if (idx >= 0) switchTemplate(idx);
        }}
      />
    </div>
  );
}
