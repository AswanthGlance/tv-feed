import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import AgentMascot from '../Shared/AgentMascot';

/* ─── Figma-extracted design tokens (1920×1080 canvas) ──────────────────────
   All values sourced from node 1432-8419 "L1 Final"
   ─────────────────────────────────────────────────────────────────────────── */
const SAFE_L       = 184;   // left safe margin
const CARD_GAP     = 24;    // gap between content cards
const PRIMARY_W    = 746;   // primary card width
const PRIMARY_H    = 420;   // card height (all cards same)
const SECONDARY_W  = 336;   // secondary card width
const CARD_RADIUS  = 32;    // border-radius on cards

/* Scroll: each arrow-right beyond visible cards shifts by one secondary card */
const SCROLL_UNIT  = SECONDARY_W + CARD_GAP;

/* ─── Unified focus token ────────────────────────────────────────────────── */
const FOCUS_BORDER     = '2px solid rgba(255,255,255,0.88)';
const FOCUS_SHADOW     = '0 0 0 1px rgba(255,255,255,0.5), 0 0 18px 4px rgba(255,255,255,0.2), 0 0 48px 12px rgba(200,180,255,0.12)';
const FOCUS_TRANSITION = 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)';

/* ─── Static data ────────────────────────────────────────────────────────── */
const AGENT_MESSAGE = "Here's a solid homemade Miso Ramen recipe, broken down into broth, noodles, and toppings:";

const THINKING_STEPS: { text: string }[] = [
  { text: 'searching for the best miso ramen recipe…'         },
  { text: 'analyzing broth techniques and ingredients…'       },
  { text: 'loading user taste preferences and diet history…'  },
  { text: 'ranking steps by ease and flavour impact…'         },
  { text: 'composing a step-by-step breakdown…'               },
];

const TABS = ['Ingredients', 'Steps to Follow', 'Cookbook', 'Shop Ingredients'];
const ACTIVE_TAB = 1;

const STEPS = [
  {
    label: 'Step 1',
    title: 'Simmer broth with soy',
    image: '/l1/step1.jpg',
    bullets: [
      'Simmer stock with kombu and shiitake for 10 minutes, then remove the kombu.',
      'Add garlic, ginger, and sesame oil, then simmer for another 5 minutes.',
    ],
    isPrimary: true,
  },
  {
    label: 'Step 2',
    title: 'Cook noodles until just tender',
    image: '/l1/step2.jpg',
    isPrimary: false,
  },
  {
    label: 'Step 3',
    title: 'Assemble bowl with touch',
    image: '/l1/step34.jpg',
    isPrimary: false,
  },
  {
    label: 'Step 4',
    title: 'Assemble bowl with touch',
    image: '/l1/step34.jpg',
    isPrimary: false,
  },
  {
    label: 'Step 5',
    title: 'Garnish and serve hot',
    image: '/l1/step34.jpg',
    isPrimary: false,
  },
  {
    label: 'Step 6',
    title: 'Season to taste',
    image: '/l1/step34.jpg',
    isPrimary: false,
  },
];

const PROMPT_CHIPS = [
  'Show me the ingredient list',
  'Make this vegetarian',
  'What toppings work best?',
  'Suggest how to make chashu pork',
  'Suggest a quick version',
];

const ATTRIBUTION = 'While trends come and go, the Banarasi saree remains a constant anchor of tradition, making it truly timeless.';

/* ─── Types ──────────────────────────────────────────────────────────────── */
type Zone       = 'middle' | 'bottom';
type AgentPhase = 'thinking' | 'responding' | 'done';

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function L1ShoppingTemplate() {
  const [zone, setZone]     = useState<Zone>('middle');
  const [midIdx, setMidIdx] = useState(0);   // 0..STEPS.length-1
  const [botIdx, setBotIdx] = useState(0);   // -1=keyboard, 0=mic, 1..N=chips

  const [agentPhase, setAgentPhase]        = useState<AgentPhase>('thinking');
  const [visibleSteps, setVisibleSteps]    = useState(0);
  const [doneSteps, setDoneSteps]          = useState<boolean[]>([]);
  const [typedTexts, setTypedTexts]        = useState<string[]>(THINKING_STEPS.map(() => ''));
  const [agentText, setAgentText]          = useState('');
  const [cursorVisible, setCursorVisible]  = useState(true);
  const [contentVisible, setContentVisible]= useState(false);

  const STEPS_MAX = STEPS.length - 1;
  const BOT_MAX   = PROMPT_CHIPS.length;  // -1=keyboard, 0=mic, 1..N=chips

  /* DOM refs */
  const bgRef          = useRef<HTMLDivElement>(null);
  const queryChipRef   = useRef<HTMLDivElement>(null);
  const mascotRowRef   = useRef<HTMLDivElement>(null);
  const thinkingBoxRef = useRef<HTMLDivElement>(null);
  const contentRef     = useRef<HTMLDivElement>(null);
  const midRowRef      = useRef<HTMLDivElement | null>(null);
  const micRef         = useRef<HTMLButtonElement>(null);
  const chipRefs       = useRef<(HTMLDivElement | null)[]>([]);

  /* ── Navigation ───────────────────────────────────────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (zone === 'middle') setMidIdx(i => Math.min(STEPS_MAX, i + 1));
        else                   setBotIdx(i => Math.min(BOT_MAX, i + 1));
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (zone === 'middle') setMidIdx(i => Math.max(0, i - 1));
        else                   setBotIdx(i => Math.max(-1, i - 1));
      }
      if (e.key === 'ArrowDown' && zone === 'middle') { e.preventDefault(); setZone('bottom'); setBotIdx(1); }
      if (e.key === 'ArrowUp'   && zone === 'bottom') { e.preventDefault(); setZone('middle'); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [zone, STEPS_MAX, BOT_MAX]);

  /* ── Scroll middle row as focus moves right ───────────────────────────── */
  useEffect(() => {
    if (!midRowRef.current) return;
    // Steps 0-2 visible without scroll; each step beyond scrolls by SCROLL_UNIT
    const scrollSteps = Math.max(0, midIdx - 2);
    midRowRef.current.style.transform = `translateX(-${scrollSteps * SCROLL_UNIT}px)`;
  }, [midIdx]);

  /* ── Main animation sequence ──────────────────────────────────────────── */
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const cursorInterval = setInterval(() => setCursorVisible(v => !v), 530);

    gsap.set(bgRef.current,        { opacity: 0 });
    gsap.to(bgRef.current,         { opacity: 1, duration: 1.6, ease: 'power2.inOut' });
    gsap.set(queryChipRef.current,  { opacity: 0, x: 24 });
    gsap.to(queryChipRef.current,   { opacity: 1, x: 0, duration: 0.55, ease: 'power3.out', delay: 0.3 });
    gsap.set(mascotRowRef.current,  { opacity: 0, scale: 0.88 });
    gsap.to(mascotRowRef.current,   { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.6)', delay: 0.75 });
    gsap.set(thinkingBoxRef.current, { opacity: 0, y: 8 });
    gsap.to(thinkingBoxRef.current,  { opacity: 1, y: 0, duration: 0.38, ease: 'power2.out', delay: 1.1 });

    const STEP_INTERVAL = 1200;
    const CHAR_DELAY    = 26;
    const STEP_DONE_LAG = 700;

    THINKING_STEPS.forEach((step, i) => {
      const stepStartMs = 1300 + i * STEP_INTERVAL;
      timers.push(setTimeout(() => setVisibleSteps(i + 1), stepStartMs));
      const fullText = step.text;
      for (let c = 1; c <= fullText.length; c++) {
        const charSlice = fullText.slice(0, c);
        timers.push(setTimeout(() => {
          setTypedTexts(prev => { const next = [...prev]; next[i] = charSlice; return next; });
        }, stepStartMs + c * CHAR_DELAY));
      }
      const typingDuration = fullText.length * CHAR_DELAY;
      timers.push(setTimeout(() => setDoneSteps(prev => {
        const next = [...prev]; next[i] = true; return next;
      }), stepStartMs + typingDuration + STEP_DONE_LAG));
    });

    const lastStepStart  = 1300 + (THINKING_STEPS.length - 1) * STEP_INTERVAL;
    const lastTypingDone = lastStepStart + THINKING_STEPS[THINKING_STEPS.length - 1].text.length * CHAR_DELAY;
    const thinkingEnd    = lastTypingDone + STEP_DONE_LAG + 500;

    timers.push(setTimeout(() => {
      gsap.to(thinkingBoxRef.current, {
        opacity: 0, y: -8, height: 0,
        paddingTop: 0, paddingBottom: 0, marginBottom: 0,
        duration: 0.32, ease: 'power2.in',
        onComplete: () => setAgentPhase('responding'),
      });
    }, thinkingEnd));

    const typeStart = thinkingEnd + 380;
    timers.push(setTimeout(() => {
      let i = 0;
      const tick = () => {
        i++;
        setAgentText(AGENT_MESSAGE.slice(0, i));
        if (i < AGENT_MESSAGE.length) {
          timers.push(setTimeout(tick, 29));
        } else {
          clearInterval(cursorInterval);
          setAgentPhase('done');
          timers.push(setTimeout(() => setContentVisible(true), 260));
        }
      };
      tick();
    }, typeStart));

    return () => { timers.forEach(t => clearTimeout(t)); clearInterval(cursorInterval); };
  }, []);

  /* ── Content reveal ───────────────────────────────────────────────────── */
  useEffect(() => {
    if (!contentVisible || !contentRef.current) return;
    gsap.fromTo(contentRef.current,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
    );
    chipRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.fromTo(el,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.34, ease: 'power2.out', delay: 0.1 + i * 0.07 }
      );
    });
    if (micRef.current) {
      gsap.fromTo(micRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.34, ease: 'power2.out' }
      );
    }
  }, [contentVisible]);

  /* ── Helpers ──────────────────────────────────────────────────────────── */
  const isMidFoc  = (idx: number) => zone === 'middle' && midIdx === idx;
  const isKeyFoc  = zone === 'bottom' && botIdx === -1;
  const isMicFoc  = zone === 'bottom' && botIdx === 0;
  const isChipFoc = (idx: number) => zone === 'bottom' && botIdx === idx + 1;

  /* ── Render ─────────────────────────────────────────────────────────────*/
  return (
    <div style={{
      width: '100vw', height: '100vh',
      overflow: 'hidden', position: 'relative',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      background: '#000',
    }}>
      {/* ── Full-bleed background image ────────────────────────────────── */}
      <div ref={bgRef} style={{
        position: 'absolute', inset: 0, opacity: 0,
      }}>
        <img src="/l1/bg.jpg" alt=""
          style={{ position: 'absolute', width: '127%', height: '139%', top: '-23%', left: '-13%', objectFit: 'cover' }}
        />
        {/* Dark overlay: matches Figma backdrop-blur + gradient */}
        <div style={{
          position: 'absolute', inset: 0,
          backdropFilter: 'blur(80px)',
          WebkitBackdropFilter: 'blur(80px)',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.82) 50%, rgba(0,0,0,0.6) 100%)',
        }} />
      </div>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `56px 120px 0 ${SAFE_L}px`,
      }}>
        {/* Logo */}
        <img src="/glance-logo.png" alt="glance"
          style={{ height: 34, width: 120, objectFit: 'contain' }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        {/* Query chip — Figma: px-32 py-22 rounded-[48px] text-28 Inter opacity-50 */}
        <div ref={queryChipRef} style={{
          background: 'rgba(255,255,255,0.15)',
          border: '0px solid rgba(255,255,255,0.2)',
          borderRadius: 48,
          padding: '22px 32px',
          fontSize: 28,
          fontFamily: "'Inter', sans-serif",
          fontWeight: 400,
          color: '#fff',
          opacity: 0,
          whiteSpace: 'nowrap',
          display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <span style={{ opacity: 0.5 }}>Check out the Recipe of </span>
          <span style={{ fontWeight: 600, opacity: 0.5 }}>Miso Ramen</span>
        </div>
      </div>

      {/* ── MASCOT + AGENT MESSAGE ─────────────────────────────────────── */}
      <div ref={mascotRowRef} style={{
        position: 'absolute', top: 156, left: SAFE_L - 80,
        display: 'flex', alignItems: 'flex-start', gap: 16,
        zIndex: 10, opacity: 0,
      }}>
        {/* Mascot 80×80 */}
        <div style={{ flexShrink: 0, width: 80, height: 80, marginTop: 8 }}>
          <AgentMascot
            agentMode={agentPhase === 'thinking' ? 'thinking' : agentPhase === 'responding' ? 'looking' : 'idle'}
            size={80}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Thinking lines */}
          {agentPhase === 'thinking' && (
            <div ref={thinkingBoxRef} style={{ display: 'flex', flexDirection: 'column', gap: 12, opacity: 0 }}>
              {THINKING_STEPS.slice(0, visibleSteps).map((step, i) => (
                <ThinkingLine
                  key={i}
                  typedText={typedTexts[i]}
                  done={!!doneSteps[i]}
                  isActive={i === visibleSteps - 1 && !doneSteps[i]}
                />
              ))}
            </div>
          )}

          {/* Agent response — Figma: Plus Jakarta Sans Medium 32px leading-40 w-932 */}
          {(agentPhase === 'responding' || agentPhase === 'done') && (
            <div style={{
              fontSize: 32,
              fontWeight: 500,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: '#fff',
              lineHeight: '40px',
              maxWidth: 932,
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

      {/* ── TABS — Figma: top-268, text-24, Plus Jakarta Sans ─────────── */}
      <div style={{
        position: 'absolute', top: 268, left: SAFE_L, right: 0,
        display: contentVisible ? 'flex' : 'none',
        alignItems: 'flex-end', gap: 0,
        zIndex: 10,
      }}>
        {TABS.map((tab, i) => {
          const active = i === ACTIVE_TAB;
          return (
            <div key={tab} style={{
              padding: '20px 28px',
              borderRadius: '28px 28px 0 0',
              background: active ? 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 100%)' : 'transparent',
              border: active ? '2px solid rgba(255,255,255,0.15)' : 'none',
              borderBottom: 'none',
              fontSize: 24,
              fontWeight: active ? 600 : 500,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: '#fff',
              opacity: active ? 1 : 0.6,
              letterSpacing: '0.24px',
              lineHeight: '24px',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}>
              {tab}
            </div>
          );
        })}
        {/* Tab underline */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(to right, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.05) 40%, transparent 100%)',
        }} />
      </div>

      {/* ── CONTENT AREA: thumbs + cards row ──────────────────────────── */}
      <div ref={contentRef} style={{
        position: 'absolute', top: 364, left: 0, right: 0,
        opacity: contentVisible ? undefined : 0,
        zIndex: 5,
      }}>
        {/* Thumbs — Figma: left-84, top offset from cards top, 56×56, rounded-28 */}
        <div style={{
          position: 'absolute', left: 84, top: 0,
          display: 'flex', flexDirection: 'column', gap: 16,
          zIndex: 6,
        }}>
          {['/l1/thumbs-up.png', '/l1/thumbs-down.png'].map((src, i) => (
            <div key={i} style={{
              width: 56, height: 56,
              borderRadius: 28,
              border: '1.556px solid #fff',
              backdropFilter: 'blur(13px)',
              WebkitBackdropFilter: 'blur(13px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <img src={src} alt="" style={{ width: 32, height: 32, objectFit: 'contain', opacity: 0.7 }} />
            </div>
          ))}
        </div>

        {/* Cards row — scrollable via midRowRef */}
        <div style={{ overflow: 'visible', position: 'relative' }}>
          <div
            ref={el => { (midRowRef as React.MutableRefObject<HTMLDivElement | null>).current = el; }}
            style={{
              display: 'flex', gap: CARD_GAP,
              paddingLeft: SAFE_L,
              transition: 'transform 0.42s cubic-bezier(0.4,0,0.2,1)',
              willChange: 'transform',
            }}
          >
            {STEPS.map((step, i) => {
              const focused = isMidFoc(i);
              if (step.isPrimary) {
                return <PrimaryCard key={i} step={step} focused={focused} />;
              }
              return <SecondaryCard key={i} step={step} focused={focused} />;
            })}
          </div>
        </div>
      </div>

      {/* ── ATTRIBUTION LINE — Figma: left-184 top-816, italic text-24 ── */}
      {contentVisible && (
        <div style={{
          position: 'absolute', top: 816, left: SAFE_L, right: SAFE_L,
          display: 'flex', alignItems: 'center', gap: 16,
          zIndex: 10,
        }}>
          <img src="/l1/location-pin.png" alt="" style={{ width: 32, height: 32, flexShrink: 0, opacity: 0.8 }} />
          <p style={{
            fontSize: 24,
            fontStyle: 'italic',
            fontWeight: 400,
            color: '#fff',
            lineHeight: '32px',
            letterSpacing: '0.24px',
            margin: 0,
            whiteSpace: 'nowrap',
          }}>
            {ATTRIBUTION}
          </p>
        </div>
      )}

      {/* ── BOTTOM ROW — Figma: vertically centered at top=calc(50%+440px)=980
          left-184, gap-32 between icon group and chip group ─────────── */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: 120,
        display: 'flex', alignItems: 'center',
        paddingLeft: SAFE_L,
        gap: 32,
        zIndex: 20,
      }}>
        {/* Icon buttons group: keyboard + mic */}
        <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
          {/* Keyboard */}
          <button style={{
            width: 72, height: 72, borderRadius: 36,
            border: isKeyFoc ? FOCUS_BORDER : '2px solid rgba(255,255,255,0.5)',
            background: isKeyFoc ? 'rgba(255,255,255,0.18)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', overflow: 'hidden',
            boxShadow: isKeyFoc ? FOCUS_SHADOW : 'none',
            transform: isKeyFoc ? 'scale(1.08)' : 'scale(1)',
            transition: FOCUS_TRANSITION,
          }}>
            <img src="/l1/keyboard.png" alt="keyboard" style={{ width: 40, height: 40, objectFit: 'contain' }} />
          </button>
          {/* Mic */}
          <button ref={micRef} style={{
            width: 72, height: 72, borderRadius: 36,
            border: isMicFoc ? FOCUS_BORDER : '2px solid rgba(255,255,255,0.5)',
            background: isMicFoc ? 'rgba(255,255,255,0.18)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', overflow: 'hidden',
            boxShadow: isMicFoc ? FOCUS_SHADOW : 'none',
            transform: isMicFoc ? 'scale(1.08)' : 'scale(1)',
            transition: FOCUS_TRANSITION,
            opacity: 0,
          }}>
            <img src="/l1/mic.png" alt="mic" style={{ width: 40, height: 40, objectFit: 'contain' }} />
          </button>
        </div>

        {/* Prompt chips — Figma: px-32 py-20, rounded-36, border-2 white, text-22 Plus Jakarta Medium */}
        <div style={{ display: 'flex', gap: 12, overflow: 'visible' }}>
          {PROMPT_CHIPS.map((chip, i) => {
            const focused = isChipFoc(i);
            return (
              <div
                key={i}
                ref={el => { chipRefs.current[i] = el; }}
                style={{
                  flexShrink: 0,
                  padding: '20px 32px',
                  borderRadius: 36,
                  border: focused ? FOCUS_BORDER : '2px solid rgba(255,255,255,0.45)',
                  background: focused ? 'rgba(255,255,255,0.14)' : 'transparent',
                  fontSize: 22,
                  fontWeight: 500,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  color: '#fff',
                  lineHeight: '32px',
                  letterSpacing: '0.22px',
                  whiteSpace: 'nowrap',
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
  );
}

/* ─── PrimaryCard ─────────────────────────────────────────────────────────── */
function PrimaryCard({ step, focused }: { step: typeof STEPS[0]; focused: boolean }) {
  return (
    <div style={{
      flexShrink: 0,
      width: PRIMARY_W, height: PRIMARY_H,
      borderRadius: CARD_RADIUS,
      border: focused ? FOCUS_BORDER : '4px solid rgba(255,255,255,0.9)',
      background: 'rgba(255,255,255,0.1)',
      position: 'relative', overflow: 'hidden',
      boxShadow: focused ? FOCUS_SHADOW : '0 4px 8px rgba(0,0,0,0.3)',
      transform: focused ? 'scale(1.02) translateY(-6px)' : 'scale(1)',
      transition: FOCUS_TRANSITION,
      cursor: 'pointer',
    }}>
      {/* Left photo: 290×380 at 18px inset */}
      <div style={{
        position: 'absolute', left: 18, top: 18,
        width: 290, height: 380,
        borderRadius: 20, overflow: 'hidden',
      }}>
        <img src={step.image} alt={step.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* Right text: px-24 py-32, starts at ~308px */}
      <div style={{
        position: 'absolute',
        left: 308, top: 0, right: 0, bottom: 0,
        padding: '32px 24px',
        display: 'flex', flexDirection: 'column', gap: 28,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 22, fontWeight: 600, fontStyle: 'normal',
            color: '#fff', opacity: 0.6,
            letterSpacing: '2.2px', textTransform: 'uppercase',
            margin: 0,
          }}>
            {step.label}
          </p>
          <p style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 30, fontWeight: 600,
            color: '#fff', lineHeight: '40px', margin: 0,
          }}>
            {step.title}
          </p>
        </div>
        <ul style={{ margin: 0, paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {step.bullets?.map((b, i) => (
            <li key={i} style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 20, fontWeight: 500, fontStyle: 'normal',
              color: 'rgba(255,255,255,0.8)', lineHeight: '32px',
            }}>
              {b}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ─── SecondaryCard ───────────────────────────────────────────────────────── */
function SecondaryCard({ step, focused }: { step: typeof STEPS[0]; focused: boolean }) {
  return (
    <div style={{
      flexShrink: 0,
      width: SECONDARY_W, height: PRIMARY_H,
      borderRadius: CARD_RADIUS,
      border: focused ? FOCUS_BORDER : '1.615px solid rgba(255,255,255,0.1)',
      position: 'relative', overflow: 'hidden',
      boxShadow: focused ? FOCUS_SHADOW : '0 4px 8px rgba(0,0,0,0.3)',
      transform: focused ? 'scale(1.04) translateY(-8px)' : 'scale(1)',
      transition: FOCUS_TRANSITION,
      cursor: 'pointer',
    }}>
      {/* Full bleed image */}
      <img src={step.image} alt={step.title}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />

      {/* Top fade */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 103,
        background: 'linear-gradient(180deg, rgba(20,20,20,0.7) 0%, rgba(20,20,20,0) 100%)',
      }} />

      {/* Bottom fade */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 242,
        background: 'linear-gradient(180deg, rgba(20,20,20,0) 0%, #141414 100%)',
      }} />

      {/* Step label top-left */}
      <p style={{
        position: 'absolute', top: 22, left: 22,
        fontFamily: "'Inter', sans-serif",
        fontSize: 22, fontWeight: 600, fontStyle: 'normal',
        color: '#fff', opacity: 0.6,
        letterSpacing: '2.2px', textTransform: 'uppercase',
        margin: 0, whiteSpace: 'nowrap',
      }}>
        {step.label}
      </p>

      {/* Title bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: 24,
      }}>
        <p style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 24, fontWeight: 600,
          color: '#fff', lineHeight: '36px', margin: 0,
        }}>
          {step.title}
        </p>
      </div>
    </div>
  );
}

/* ─── ThinkingLine ─────────────────────────────────────────────────────────── */
function ThinkingLine({ typedText, done, isActive }: {
  typedText: string;
  done: boolean;
  isActive: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, animation: 'l1StepIn 0.5s cubic-bezier(0.22,1,0.36,1)' }}>
      <style>{`
        @keyframes l1StepIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
        @keyframes l1Spin { to { transform: rotate(360deg); } }
        @keyframes l1GlowPulse {
          0%,100% { text-shadow: 0 0 8px rgba(180,140,255,0.5), 0 0 22px rgba(140,90,255,0.22); }
          50%      { text-shadow: 0 0 14px rgba(205,165,255,0.78), 0 0 36px rgba(160,110,255,0.42); }
        }
        @keyframes l1CursorBlink { 0%,100% { opacity:1; } 50% { opacity:0; } }
      `}</style>
      <div style={{ flexShrink: 0, width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {done ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="rgba(160,220,170,0.35)" strokeWidth="1.2"/>
            <path d="M4 7l2 2 4-4" stroke="rgba(160,220,170,0.55)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: 'l1Spin 1.4s linear infinite' }}>
            <circle cx="7" cy="7" r="5" stroke="rgba(165,130,255,0.15)" strokeWidth="1.5"/>
            <path d="M7 2 A5 5 0 0 1 12 7" stroke="rgba(180,145,255,0.85)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        )}
      </div>
      <span style={{
        fontSize: 18, fontStyle: 'italic', fontWeight: 400,
        letterSpacing: '0.005em', lineHeight: 1.4,
        color: done ? 'rgba(200,185,235,0.4)' : 'rgba(215,195,255,0.9)',
        textShadow: done ? 'none' : '0 0 10px rgba(180,140,255,0.58), 0 0 26px rgba(140,90,255,0.28)',
        animation: isActive ? 'l1GlowPulse 2.4s ease-in-out infinite' : 'none',
        transition: 'color 0.55s ease, text-shadow 0.55s ease',
      }}>
        {typedText}
        {isActive && (
          <span style={{
            display: 'inline-block', width: 1.5, height: '0.85em',
            background: 'rgba(200,170,255,0.75)',
            marginLeft: 2, verticalAlign: 'text-bottom', borderRadius: 1,
            animation: 'l1CursorBlink 0.9s ease-in-out infinite',
            boxShadow: '0 0 6px rgba(180,140,255,0.7)',
          }} />
        )}
      </span>
    </div>
  );
}
