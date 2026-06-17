import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import AgentMascot from '../Shared/AgentMascot';

/* ─── Layout constants (1920 × 1080 canvas) ─────────────────────────────────
   LEFT_PAD  = safe margin left
   LEFT_COL  = product image card width
   CTR_COL   = product details column width
   GAP       = gap between columns
   RIGHT_COL = 1920 - LEFT_PAD - LEFT_COL - GAP - CTR_COL - GAP  = 1056px
   CARD_W    = (RIGHT_COL - 2*CARD_GAP - PEEK) / 3  ≈ 330px  → shows 3 + peek
   ─────────────────────────────────────────────────────────────────────────── */
const LEFT_PAD  = 72;
const LEFT_COL  = 296;
const CTR_COL   = 400;
const COL_GAP   = 48;
const CARD_W    = 320;
const CARD_GAP  = 14;
const CARD_H    = 360;

/* ─── Unified focus token ────────────────────────────────────────────────────
   One border + one ring used everywhere: pick cards, chips, mic, heart, CTAs.
   ─────────────────────────────────────────────────────────────────────────── */
const FOCUS_BORDER = '2px solid rgba(255,255,255,0.88)';
const FOCUS_SHADOW = '0 0 0 1px rgba(255,255,255,0.5), 0 0 18px 4px rgba(255,255,255,0.2), 0 0 48px 12px rgba(200,180,255,0.12)';
const IDLE_BORDER  = (alpha = '0.08') => `1.5px solid rgba(255,255,255,${alpha})`;
const FOCUS_TRANSITION = 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)';

/* ─── Static data ────────────────────────────────────────────────────────── */

const AGENT_MESSAGE = "Here's my best picks for you. Which one would you prefer?";

/* Thinking steps — italic glowing phrases, no emojis */
const THINKING_STEPS: { text: string }[] = [
  { text: 'searching catalog for extreme cold jackets…'       },
  { text: 'filtering by thermal rating and wind resistance…'  },
  { text: 'loading user preferences and style history…'       },
  { text: 'ranking results by personal style match…'          },
  { text: 'composing final recommendations…'                  },
];

const MAIN_PRODUCT = {
  title: 'Insulated Hooded Jacket',
  price: '179',
  tagline: 'Shields you from wind and unpredictable cold',
  description: 'Stay protected with insulated padding, wind resistance, and lightweight comfort.',
};

const TOP_PICKS = [
  { id: 1, brand: 'ZARA',          title: 'Long Coat',        price: '$199', bg: ['#2e1810','#4a2418'] as [string,string] },
  { id: 2, brand: 'ZARA',          title: 'Bomber Jacket',    price: '$88',  bg: ['#111e2e','#1a2d44'] as [string,string] },
  { id: 3, brand: 'THE NORTH FACE', title: 'Running Jacket',  price: '$145', bg: ['#131e14','#1c2e1e'] as [string,string] },
  { id: 4, brand: 'H&M',           title: 'Puffer Vest',      price: '$59',  bg: ['#1c1218','#2e1a28'] as [string,string] },
  { id: 5, brand: 'COLUMBIA',      title: 'Fleece Pullover',  price: '$110', bg: ['#0e1c20','#162c34'] as [string,string] },
  { id: 6, brand: 'UNIQLO',        title: 'Ultra Light Down', price: '$79',  bg: ['#1a1c10','#2a2c18'] as [string,string] },
  { id: 7, brand: 'PATAGONIA',     title: 'Nano Puff Jacket', price: '$229', bg: ['#1e1010','#321818'] as [string,string] },
  { id: 8, brand: "ARC'TERYX",     title: 'Beta Jacket',      price: '$549', bg: ['#0e1018','#181c2e'] as [string,string] },
];

const PROMPT_CHIPS = [
  'Show me jackets for early morning walks',
  'Suggest outerwear for mountain getaways',
  'Recommend jackets for outdoor dinner plans',
  'Show me outerwear for ski holidays',
  'Find jackets for late night strolls',
];

/* ─── Types ──────────────────────────────────────────────────────────────── */

type Zone       = 'middle' | 'bottom';
type AgentPhase = 'thinking' | 'responding' | 'done';

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function L1ShoppingTemplate() {
  const [zone, setZone]     = useState<Zone>('middle');
  const [midIdx, setMidIdx] = useState(0);
  const [botIdx, setBotIdx] = useState(-1); // -1 = mic, 0..N-1 = chips

  const [agentPhase, setAgentPhase]        = useState<AgentPhase>('thinking');
  const [visibleSteps, setVisibleSteps]    = useState(0);
  const [doneSteps, setDoneSteps]          = useState<boolean[]>([]);
  const [typedTexts, setTypedTexts]        = useState<string[]>(THINKING_STEPS.map(() => ''));
  const [agentText, setAgentText]          = useState('');
  const [cursorVisible, setCursorVisible]  = useState(true);
  const [contentVisible, setContentVisible]= useState(false);

  const MID_MAX = 2 + TOP_PICKS.length - 1;
  const BOT_MAX = PROMPT_CHIPS.length - 1;

  /* DOM refs */
  const bgGlowRef        = useRef<HTMLDivElement>(null);
  const queryChipRef     = useRef<HTMLDivElement>(null);
  const mascotRowRef     = useRef<HTMLDivElement>(null);
  const thinkingBoxRef   = useRef<HTMLDivElement>(null);
  const aboutLabelRef    = useRef<HTMLDivElement>(null);
  const productCardRef   = useRef<HTMLDivElement>(null);
  const titleRef         = useRef<HTMLDivElement>(null);
  const priceRef         = useRef<HTMLDivElement>(null);
  const taglineRef       = useRef<HTMLDivElement>(null);
  const descRef          = useRef<HTMLDivElement>(null);
  const ctaRowRef        = useRef<HTMLDivElement>(null);
  const topPicksLabelRef = useRef<HTMLDivElement>(null);
  const pickCardRefs     = useRef<(HTMLDivElement | null)[]>([]);
  const pickTrackRef     = useRef<HTMLDivElement | null>(null);
  const midRowRef        = useRef<HTMLDivElement | null>(null);
  const micRef           = useRef<HTMLButtonElement>(null);
  const chipRefs         = useRef<(HTMLDivElement | null)[]>([]);

  /* ── Navigation ───────────────────────────────────────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (zone === 'middle') setMidIdx(i => Math.min(MID_MAX, i + 1));
        else                   setBotIdx(i => Math.min(BOT_MAX, i + 1)); // -1→0→1…
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (zone === 'middle') setMidIdx(i => Math.max(0, i - 1));
        else                   setBotIdx(i => Math.max(-1, i - 1)); // 0→-1 = back to mic
      }
      if (e.key === 'ArrowDown' && zone === 'middle') { e.preventDefault(); setZone('bottom'); setBotIdx(0); }
      if (e.key === 'ArrowUp'   && zone === 'bottom') { e.preventDefault(); setZone('middle'); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [zone, MID_MAX, BOT_MAX]);

  /* ── Scroll whole middle row when focus moves beyond the 3rd pick card ── */
  useEffect(() => {
    if (!midRowRef.current) return;
    // midIdx 0-2: CTAs — no scroll
    // midIdx 3-5: first 3 pick cards — no scroll (they already start visible)
    // midIdx 6+: each step scrolls one card width to keep focused card in view
    const cardFocusIdx = midIdx - 3; // 0-based within picks; negative = CTAs
    const scrollSteps  = Math.max(0, cardFocusIdx - 2); // cards 0-2 visible without scroll
    const offset       = scrollSteps * (CARD_W + CARD_GAP);
    midRowRef.current.style.transform = `translateX(-${offset}px)`;
  }, [midIdx]);

  /* ── Main animation sequence ──────────────────────────────────────────── */
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const cursorInterval = setInterval(() => setCursorVisible(v => !v), 530);

    /* bg + query chip */
    gsap.set(bgGlowRef.current,   { opacity: 0 });
    gsap.to(bgGlowRef.current,    { opacity: 1, duration: 1.6, ease: 'power2.inOut' });
    gsap.set(queryChipRef.current, { opacity: 0, x: 24 });
    gsap.to(queryChipRef.current,  { opacity: 1, x: 0, duration: 0.55, ease: 'power3.out', delay: 0.3 });

    /* mascot */
    gsap.set(mascotRowRef.current, { opacity: 0, scale: 0.88 });
    gsap.to(mascotRowRef.current,  { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.6)', delay: 0.75 });

    /* thinking box */
    gsap.set(thinkingBoxRef.current, { opacity: 0, y: 8 });
    gsap.to(thinkingBoxRef.current,  { opacity: 1, y: 0, duration: 0.38, ease: 'power2.out', delay: 1.1 });

    /* stream steps — each step appears with typewriter, then fades to done */
    const STEP_INTERVAL = 1200;    // gap between steps
    const CHAR_DELAY    = 26;      // ms per character while typing
    const STEP_DONE_LAG = 700;     // step turns ✓ this many ms after typing finishes

    THINKING_STEPS.forEach((step, i) => {
      const stepStartMs = 1300 + i * STEP_INTERVAL;

      /* 1 — make the row visible (empty text yet) */
      timers.push(setTimeout(() => setVisibleSteps(i + 1), stepStartMs));

      /* 2 — type each character */
      const fullText = step.text;
      for (let c = 1; c <= fullText.length; c++) {
        const charSlice = fullText.slice(0, c);
        timers.push(setTimeout(() => {
          setTypedTexts(prev => {
            const next = [...prev];
            next[i] = charSlice;
            return next;
          });
        }, stepStartMs + c * CHAR_DELAY));
      }

      /* 3 — mark done after typing finishes + reading lag */
      const typingDuration = fullText.length * CHAR_DELAY;
      timers.push(setTimeout(() => setDoneSteps(prev => {
        const next = [...prev]; next[i] = true; return next;
      }), stepStartMs + typingDuration + STEP_DONE_LAG));
    });

    /* collapse thinking → typewriter — wait for last step to finish typing + done lag */
    const lastStepStart   = 1300 + (THINKING_STEPS.length - 1) * STEP_INTERVAL;
    const lastTypingDone  = lastStepStart + THINKING_STEPS[THINKING_STEPS.length - 1].text.length * CHAR_DELAY;
    const thinkingEnd     = lastTypingDone + STEP_DONE_LAG + 500;
    timers.push(setTimeout(() => {
      gsap.to(thinkingBoxRef.current, {
        opacity: 0, y: -8, height: 0,
        paddingTop: 0, paddingBottom: 0, marginBottom: 0,
        duration: 0.32, ease: 'power2.in',
        onComplete: () => setAgentPhase('responding'),
      });
    }, thinkingEnd));

    /* typewriter */
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
    if (!contentVisible) return;

    const all = [
      aboutLabelRef.current, productCardRef.current,
      titleRef.current, priceRef.current, taglineRef.current,
      descRef.current, ctaRowRef.current, topPicksLabelRef.current,
      ...pickCardRefs.current, micRef.current, ...chipRefs.current,
    ].filter(Boolean) as HTMLElement[];
    gsap.set(all, { opacity: 0 });

    const tl = gsap.timeline();
    tl.fromTo(aboutLabelRef.current,   { opacity:0, y:8  }, { opacity:1, y:0, duration:0.36, ease:'power2.out' }, 0);
    tl.fromTo(productCardRef.current,  { opacity:0, x:-24}, { opacity:1, x:0, duration:0.5,  ease:'power3.out' }, 0.06);
    [titleRef, priceRef, taglineRef, descRef, ctaRowRef].forEach((ref, i) =>
      tl.fromTo(ref.current, { opacity:0, y:12 }, { opacity:1, y:0, duration:0.34, ease:'power2.out' }, 0.14 + i * 0.1));
    tl.fromTo(topPicksLabelRef.current, { opacity:0, y:8 }, { opacity:1, y:0, duration:0.34, ease:'power2.out' }, 0.16);
    pickCardRefs.current.forEach((el, i) => {
      if (!el) return;
      tl.fromTo(el, { opacity:0, x:36 }, { opacity:1, x:0, duration:0.4, ease:'power3.out' }, 0.22 + i * 0.09);
    });
    const botStart = 0.22 + TOP_PICKS.length * 0.09 + 0.1;
    tl.fromTo(micRef.current,  { opacity:0, y:20 }, { opacity:1, y:0, duration:0.34, ease:'power2.out' }, botStart);
    chipRefs.current.forEach((el, i) => {
      if (!el) return;
      tl.fromTo(el, { opacity:0, y:20 }, { opacity:1, y:0, duration:0.34, ease:'power2.out' }, botStart + 0.06 + i * 0.1);
    });
  }, [contentVisible]);

  /* ── Helpers ──────────────────────────────────────────────────────────── */
  const isMid    = (idx: number) => zone === 'middle' && midIdx === idx;
  const isBot    = (idx: number) => zone === 'bottom'  && botIdx === idx;
  const isMicFoc = zone === 'bottom' && botIdx === -1;

  /* Primary button = white only when that specific button is focused.
     Heart & pick cards do NOT make either CTA primary. */
  const tryOnPrimary  = zone === 'middle' && midIdx === 0;
  const buyNowPrimary = zone === 'middle' && midIdx === 1;

  /* ── Render ───────────────────────────────────────────────────────────── */
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

      {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
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
          Suggest jackets for extreme cold
        </div>
      </div>

      {/* ── AGENT ROW ───────────────────────────────────────────────────── */}
      <div ref={mascotRowRef} style={{
        position: 'absolute', top: 134, left: LEFT_PAD,
        display: 'flex', alignItems: 'flex-start', gap: 16,
        zIndex: 10, opacity: 0,
      }}>
        {/* Raw Rive mascot — no background */}
        <div style={{ flexShrink: 0, width: 52, height: 52, marginTop: 4 }}>
          <AgentMascot
            agentMode={agentPhase === 'thinking' ? 'thinking' : agentPhase === 'responding' ? 'looking' : 'idle'}
            size={52}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* ── Thinking lines ───────────────────────────────────────────── */}
          {agentPhase === 'thinking' && (
            <div ref={thinkingBoxRef} style={{
              display: 'flex', flexDirection: 'column', gap: 12,
              opacity: 0,
            }}>
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

          {/* ── Typewriter response ──────────────────────────────────────── */}
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

      {/* ── MIDDLE ROW — slides left as a whole when focus reaches far-right picks ── */}
      <div
        ref={el => { (midRowRef as React.MutableRefObject<HTMLDivElement | null>).current = el; }}
        style={{
          position: 'absolute',
          top: 228, left: LEFT_PAD, right: 0, bottom: 172,
          display: 'flex', gap: COL_GAP, alignItems: 'flex-start',
          zIndex: 5,
          transition: 'transform 0.42s cubic-bezier(0.4,0,0.2,1)',
          willChange: 'transform',
        }}
      >

        {/* LEFT column: product image */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
          <div ref={aboutLabelRef} style={{ opacity: 0 }}>
            <SectionLabel>ABOUT THE PRODUCT</SectionLabel>
          </div>
          <div ref={productCardRef} style={{
            width: LEFT_COL, height: 420,
            background: 'linear-gradient(155deg, #f0ebe5 0%, #e4dcd5 100%)',
            borderRadius: 20, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
            boxShadow: '0 20px 64px rgba(0,0,0,0.6)', opacity: 0,
          }}>
            <div style={{
              position: 'absolute', left: 0, top: '18%', bottom: '18%',
              width: 4, borderRadius: '0 4px 4px 0',
              background: 'rgba(80,40,160,0.35)',
            }} />
            <div style={{
              position: 'absolute', top: 14, left: 14, zIndex: 2,
              width: 42, height: 42, borderRadius: '50%', background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 14px rgba(0,0,0,0.16)',
            }}>
              <AdidasLogo />
            </div>
            <JacketIllustration />
          </div>
        </div>

        {/* CENTER column: product details + CTAs */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          paddingTop: 44, flexShrink: 0, width: CTR_COL,
        }}>
          <div ref={titleRef} style={{ opacity: 0, marginBottom: 10 }}>
            <div style={{ fontSize: 38, fontWeight: 700, color: '#fff', lineHeight: 1.08, letterSpacing: '-0.022em' }}>
              {MAIN_PRODUCT.title}
            </div>
          </div>
          <div ref={priceRef} style={{ opacity: 0, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>$</span>
              <span style={{ fontSize: 40, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>179</span>
            </div>
          </div>
          <div ref={taglineRef} style={{ opacity: 0, marginBottom: 10 }}>
            <div style={{ fontSize: 19, fontStyle: 'italic', fontWeight: 500, color: 'rgba(245,243,247,0.82)', lineHeight: 1.42 }}>
              {MAIN_PRODUCT.tagline}
            </div>
          </div>
          <div ref={descRef} style={{ opacity: 0, marginBottom: 32 }}>
            <div style={{ fontSize: 17, color: 'rgba(245,243,247,0.55)', lineHeight: 1.6, maxWidth: '34ch' }}>
              {MAIN_PRODUCT.description}
            </div>
          </div>

          {/* CTA row */}
          <div ref={ctaRowRef} style={{ display: 'flex', gap: 12, alignItems: 'center', opacity: 0 }}>
            {/* Try On — primary (white) only when idx=0 is focused */}
            <FocusButton
              focused={isMid(0)}
              variant={tryOnPrimary ? 'white' : 'dark'}
              icon={<TryOnIcon dark={tryOnPrimary} />}
            >
              Try On
            </FocusButton>

            {/* Buy Now — primary (white) only when idx=1 is focused */}
            <FocusButton
              focused={isMid(1)}
              variant={buyNowPrimary ? 'white' : 'dark'}
              icon={<BagIcon dark={buyNowPrimary} />}
            >
              Buy Now
            </FocusButton>

            {/* Heart — always secondary */}
            <button style={{
              width: 50, height: 50, borderRadius: '50%', flexShrink: 0,
              background: isMid(2) ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)',
              border: isMid(2) ? FOCUS_BORDER : IDLE_BORDER('0.18'),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: isMid(2) ? FOCUS_SHADOW : 'none',
              transform: isMid(2) ? 'scale(1.1)' : 'scale(1)',
              transition: FOCUS_TRANSITION,
            }}>
              <HeartIcon />
            </button>
          </div>
        </div>

        {/* RIGHT column: top picks — extends to screen right edge */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          {/* Label sits above the card track with high z-index so focused scale doesn't cover it */}
          <div ref={topPicksLabelRef} style={{ opacity: 0, paddingRight: LEFT_PAD, marginBottom: 16, position: 'relative', zIndex: 4 }}>
            <SectionLabel>TOP PICKS FOR YOU</SectionLabel>
          </div>

          {/* Card track — overflow visible so focus glow/scale isn't clipped */}
          <div style={{ position: 'relative', overflow: 'visible', paddingTop: 12, marginTop: -12 }}>
            <div style={{ display: 'flex', gap: CARD_GAP }}>

              {TOP_PICKS.map((pick, i) => {
                const focused = isMid(3 + i);
                return (
                  <div
                    key={pick.id}
                    ref={el => { pickCardRefs.current[i] = el; }}
                    style={{
                      flex: `0 0 ${CARD_W}px`,
                      height: CARD_H,
                      background: 'rgba(20,12,40,0.8)',
                      backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
                      borderRadius: 18, overflow: 'hidden', position: 'relative',
                      border: focused ? FOCUS_BORDER : IDLE_BORDER('0.08'),
                      boxShadow: focused ? FOCUS_SHADOW : '0 8px 32px rgba(0,0,0,0.5)',
                      transform: focused ? 'scale(1.04) translateY(-8px)' : 'scale(1)',
                      transition: FOCUS_TRANSITION,
                      cursor: 'pointer', opacity: 0,
                    }}
                  >
                    {/* Brand badge */}
                    <div style={{
                      position: 'absolute', top: 10, left: 10, zIndex: 2,
                      background: 'rgba(255,255,255,0.92)',
                      borderRadius: 6, padding: '3px 9px',
                      fontSize: 11, fontWeight: 800, color: '#111',
                      letterSpacing: '0.04em', maxWidth: CARD_W - 24,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {pick.brand}
                    </div>

                    {/* Image area */}
                    <div style={{
                      width: '100%', height: '72%',
                      background: `linear-gradient(145deg, ${pick.bg[0]} 0%, ${pick.bg[1]} 100%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <PickIllustration index={i} />
                    </div>

                    {/* Label bar */}
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      background: 'rgba(8,4,20,0.9)', backdropFilter: 'blur(10px)',
                      padding: '11px 14px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <span style={{
                        fontSize: 15, fontWeight: 600, color: '#fff',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        flex: 1, marginRight: 8,
                      }}>
                        {pick.title}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>
                        {pick.price}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW — edge to edge ────────────────────────────────────── */}
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

        {/* Chips strip — overflow visible so focused scale/glow isn't clipped */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', overflow: 'visible' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            {PROMPT_CHIPS.map((chip, i) => {
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
                    borderRadius: 18,
                    padding: '0 20px',
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
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      animation: 'l1StepIn 0.5s cubic-bezier(0.22,1,0.36,1)',
    }}>
      <style>{`
        @keyframes l1StepIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes l1Spin { to { transform: rotate(360deg); } }
        @keyframes l1GlowPulse {
          0%, 100% { text-shadow: 0 0 8px rgba(180,140,255,0.5), 0 0 22px rgba(140,90,255,0.22); }
          50%       { text-shadow: 0 0 14px rgba(205,165,255,0.78), 0 0 36px rgba(160,110,255,0.42), 0 0 58px rgba(120,70,220,0.18); }
        }
        @keyframes l1CursorBlink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>

      {/* Status indicator */}
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

      {/* Italic glowing text + inline cursor while typing */}
      <span style={{
        fontSize: 18,
        fontStyle: 'italic',
        fontWeight: 400,
        letterSpacing: '0.005em',
        lineHeight: 1.4,
        color: done ? 'rgba(200,185,235,0.4)' : 'rgba(215,195,255,0.9)',
        textShadow: done
          ? 'none'
          : '0 0 10px rgba(180,140,255,0.58), 0 0 26px rgba(140,90,255,0.28)',
        animation: isActive ? 'l1GlowPulse 2.4s ease-in-out infinite' : 'none',
        transition: 'color 0.55s ease, text-shadow 0.55s ease',
      }}>
        {typedText}
        {/* Blinking cursor — visible only while this line is actively typing */}
        {isActive && (
          <span style={{
            display: 'inline-block',
            width: 1.5,
            height: '0.85em',
            background: 'rgba(200,170,255,0.75)',
            marginLeft: 2,
            verticalAlign: 'text-bottom',
            borderRadius: 1,
            animation: 'l1CursorBlink 0.9s ease-in-out infinite',
            boxShadow: '0 0 6px rgba(180,140,255,0.7)',
          }} />
        )}
      </span>

    </div>
  );
}

/* ─── SectionLabel ─────────────────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      fontSize: 16, fontWeight: 700, letterSpacing: '0.18em',
      color: 'rgba(255,255,255,0.42)', textTransform: 'uppercase',
    }}>
      {children}
      <div style={{ flex: 1, height: 1, maxWidth: 90, background: 'linear-gradient(to right, rgba(255,255,255,0.16), transparent)' }} />
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
        <path d="M6 0.5L7.3 4.7L11.5 6L7.3 7.3L6 11.5L4.7 7.3L0.5 6L4.7 4.7L6 0.5Z" fill="rgba(190,140,255,0.6)"/>
      </svg>
    </div>
  );
}

/* ─── FocusButton ──────────────────────────────────────────────────────────── */
function FocusButton({ focused, variant, icon, children }: {
  focused: boolean; variant: 'white' | 'dark'; icon: React.ReactNode; children: React.ReactNode;
}) {
  const isWhite = variant === 'white';
  return (
    <button style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      background: isWhite
        ? (focused ? '#fff' : 'rgba(255,255,255,0.94)')
        : (focused ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)'),
      color: isWhite ? '#111' : '#fff',
      border: isWhite ? 'none' : (focused ? FOCUS_BORDER : IDLE_BORDER('0.18')),
      borderRadius: 999, padding: '14px 26px',
      fontSize: 18, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
      backdropFilter: isWhite ? 'none' : 'blur(14px)',
      boxShadow: focused
        ? isWhite
          ? `0 0 0 3px rgba(0,0,0,0.25), 0 0 0 5px #fff, ${FOCUS_SHADOW}`
          : FOCUS_SHADOW
        : isWhite ? '0 4px 18px rgba(0,0,0,0.3)' : 'none',
      transform: focused ? 'scale(1.06)' : 'scale(1)',
      transition: FOCUS_TRANSITION,
    }}>
      {icon}{children}
    </button>
  );
}

/* ─── Illustrations & Icons ────────────────────────────────────────────────── */
function AdidasLogo() {
  return (
    <svg viewBox="0 0 40 40" width="28" height="28" fill="none">
      <path d="M7 30L15 12L22 30H7Z"   fill="#111" opacity="0.9"/>
      <path d="M14 30L21 16L28 30H14Z" fill="#111" opacity="0.7"/>
      <path d="M21 30L27 18L33 30H21Z" fill="#111" opacity="0.5"/>
    </svg>
  );
}

function JacketIllustration() {
  return (
    <svg viewBox="0 0 240 300" width="180" height="240" fill="none">
      <path d="M90 56 Q120 18 150 56 L162 84 Q120 66 78 84 Z" fill="#3a1628"/>
      <path d="M56 84 L80 84 L75 198 L38 208 Z"              fill="#47203a"/>
      <path d="M160 84 L184 84 L202 208 L165 198 Z"          fill="#47203a"/>
      <path d="M80 84 L160 84 L165 198 L75 198 Z"            fill="#5a2840"/>
      <line x1="120" y1="84"  x2="120" y2="196" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5"/>
      <rect x="82"  y="148" width="32" height="26" rx="4" fill="rgba(0,0,0,0.18)" stroke="rgba(255,255,255,0.09)" strokeWidth="1"/>
      <rect x="126" y="148" width="32" height="26" rx="4" fill="rgba(0,0,0,0.18)" stroke="rgba(255,255,255,0.09)" strokeWidth="1"/>
      <path d="M38 208 L75 198 L120 208 L165 198 L202 208 L202 226 L38 226 Z" fill="#3a1628"/>
      <rect x="28"  y="198" width="24" height="16" rx="6" fill="#3a1628"/>
      <rect x="188" y="198" width="24" height="16" rx="6" fill="#3a1628"/>
      <line x1="80"  y1="112" x2="160" y2="112" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5"/>
      <line x1="78"  y1="132" x2="162" y2="132" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5"/>
    </svg>
  );
}

function PickIllustration({ index }: { index: number }) {
  const v = index % 4;
  const s = { fill: 'rgba(255,255,255,0.09)', stroke: 'rgba(255,255,255,0.04)' };
  const line = { stroke: 'rgba(255,255,255,0.12)', strokeWidth: '1.5' };
  if (v === 0) return (
    <svg viewBox="0 0 100 160" width={CARD_W * 0.38} height={CARD_H * 0.42} fill="none">
      <path d="M28 28 Q50 8 72 28 L78 46 L70 148 L30 148 L22 46 Z" {...s}/>
      <path d="M18 46 L28 46 L24 148 L10 152 Z" fill="rgba(255,255,255,0.06)"/>
      <path d="M72 46 L82 46 L90 152 L76 148 Z" fill="rgba(255,255,255,0.06)"/>
      <line x1="50" y1="46" x2="50" y2="146" {...line}/>
    </svg>
  );
  if (v === 1) return (
    <svg viewBox="0 0 100 110" width={CARD_W * 0.38} height={CARD_H * 0.35} fill="none">
      <path d="M28 30 Q50 12 72 30 L80 50 L76 98 L24 98 L20 50 Z" {...s}/>
      <path d="M14 50 L24 50 L20 98 L8 100 Z" fill="rgba(255,255,255,0.06)"/>
      <path d="M76 50 L86 50 L92 100 L80 98 Z" fill="rgba(255,255,255,0.06)"/>
      <rect x="22" y="94" width="56" height="10" rx="5" fill="rgba(255,255,255,0.07)"/>
      <line x1="50" y1="30" x2="50" y2="96" {...line}/>
    </svg>
  );
  if (v === 2) return (
    <svg viewBox="0 0 100 110" width={CARD_W * 0.38} height={CARD_H * 0.35} fill="none">
      <path d="M30 22 Q50 8 70 22 L78 46 L74 98 L26 98 L22 46 Z" {...s}/>
      <path d="M14 46 L24 46 L20 98 L8 100 Z" fill="rgba(255,255,255,0.06)"/>
      <path d="M76 46 L86 46 L92 100 L80 98 Z" fill="rgba(255,255,255,0.06)"/>
      <line x1="50" y1="22" x2="50" y2="96" {...line}/>
      <line x1="34" y1="58" x2="66" y2="58" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      <line x1="32" y1="72" x2="68" y2="72" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
    </svg>
  );
  return (
    <svg viewBox="0 0 100 110" width={CARD_W * 0.38} height={CARD_H * 0.35} fill="none">
      <path d="M32 18 Q50 6 68 18 L72 36 L70 98 L30 98 L28 36 Z" {...s}/>
      <path d="M20 36 L30 36 L28 98 L14 100 Z" fill="rgba(255,255,255,0.05)"/>
      <path d="M70 36 L80 36 L86 100 L72 98 Z" fill="rgba(255,255,255,0.05)"/>
      <line x1="50" y1="18" x2="50" y2="96" {...line}/>
      <line x1="30" y1="48" x2="70" y2="48" stroke="rgba(255,255,255,0.09)" strokeWidth="1.5"/>
      <line x1="30" y1="62" x2="70" y2="62" stroke="rgba(255,255,255,0.09)" strokeWidth="1.5"/>
      <line x1="30" y1="76" x2="70" y2="76" stroke="rgba(255,255,255,0.09)" strokeWidth="1.5"/>
    </svg>
  );
}

function TryOnIcon({ dark }: { dark: boolean }) {
  const c = dark ? '#111' : '#fff';
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3.5" stroke={c} strokeWidth="2"/>
      <path d="M6 21C6 17.134 8.686 14 12 14s6 3.134 6 7" stroke={c} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function BagIcon({ dark }: { dark: boolean }) {
  const c = dark ? '#111' : '#fff';
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke={c} strokeWidth="2"/>
      <line x1="3" y1="6" x2="21" y2="6" stroke={c} strokeWidth="2"/>
      <path d="M16 10a4 4 0 01-8 0" stroke={c} strokeWidth="2"/>
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
        stroke="rgba(255,255,255,0.62)" strokeWidth="2"/>
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" stroke="rgba(255,255,255,0.62)" strokeWidth="2"/>
      <path d="M19 10v2a7 7 0 01-14 0v-2" stroke="rgba(255,255,255,0.62)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="12" y1="19" x2="12" y2="23" stroke="rgba(255,255,255,0.62)" strokeWidth="2"/>
      <line x1="8"  y1="23" x2="16" y2="23" stroke="rgba(255,255,255,0.62)" strokeWidth="2"/>
    </svg>
  );
}
