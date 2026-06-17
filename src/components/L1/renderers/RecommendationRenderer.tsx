import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import {
  LEFT_PAD, COL_GAP, CARD_GAP, RENDERER_TOP,
  FOCUS_BORDER, FOCUS_SHADOW, IDLE_BORDER, FOCUS_TRANSITION,
  ScreenPhase,
} from '../l1Constants';
import { SectionLabel, FocusButton, HeartIcon, TryOnIcon, BagIcon } from '../l1SharedComponents';
import type { RendererProps } from '../l1Constants';

const LEFT_COL = 296;
const CTR_COL  = 400;
const CARD_W   = 320;
const CARD_H   = 352;
const CARD_GAP_LOCAL = 14;

const MAIN_PRODUCT = {
  title: 'Insulated Hooded Jacket',
  price: '179',
  tagline: 'Shields you from wind and unpredictable cold',
  description: 'Stay protected with insulated padding, wind resistance, and lightweight comfort.',
};

const TOP_PICKS = [
  { id: 1, title: 'Long Coat',        price: '$199', bg: ['#2e1810','#4a2418'] as [string,string] },
  { id: 2, title: 'Bomber Jacket',    price: '$88',  bg: ['#111e2e','#1a2d44'] as [string,string] },
  { id: 3, title: 'Running Jacket',   price: '$145', bg: ['#131e14','#1c2e1e'] as [string,string] },
  { id: 4, title: 'Puffer Vest',      price: '$59',  bg: ['#1c1218','#2e1a28'] as [string,string] },
  { id: 5, title: 'Fleece Pullover',  price: '$110', bg: ['#0e1c20','#162c34'] as [string,string] },
  { id: 6, title: 'Ultra Light Down', price: '$79',  bg: ['#1a1c10','#2a2c18'] as [string,string] },
  { id: 7, title: 'Nano Puff Jacket', price: '$229', bg: ['#1e1010','#321818'] as [string,string] },
  { id: 8, title: 'Beta Jacket',      price: '$549', bg: ['#0e1018','#181c2e'] as [string,string] },
];

export default function RecommendationRenderer({ focusIdx, phase, onScrollRequest }: RendererProps) {
  const isMid = (idx: number) => focusIdx === idx;
  const tryOnPrimary  = focusIdx === 0;
  const buyNowPrimary = focusIdx === 1;

  const aboutLabelRef    = useRef<HTMLDivElement>(null);
  const productCardRef   = useRef<HTMLDivElement>(null);
  const titleRef         = useRef<HTMLDivElement>(null);
  const priceRef         = useRef<HTMLDivElement>(null);
  const taglineRef       = useRef<HTMLDivElement>(null);
  const descRef          = useRef<HTMLDivElement>(null);
  const ctaRowRef        = useRef<HTMLDivElement>(null);
  const topPicksLabelRef = useRef<HTMLDivElement>(null);
  const pickCardRefs     = useRef<(HTMLDivElement | null)[]>([]);
  const midRowRef        = useRef<HTMLDivElement>(null);

  /* Scroll whole row when pick focus moves right */
  useEffect(() => {
    if (!midRowRef.current) return;
    const cardFocusIdx = focusIdx - 3;
    const scrollSteps  = Math.max(0, cardFocusIdx - 2);
    const offset       = scrollSteps * (CARD_W + CARD_GAP_LOCAL);
    midRowRef.current.style.transform = `translateX(-${offset}px)`;
    onScrollRequest?.(offset);
  }, [focusIdx]);

  /* PRIMARY_CONTENT: product card + details + CTAs */
  useEffect(() => {
    if (phase !== ScreenPhase.PRIMARY_CONTENT) return;
    const primary = [
      aboutLabelRef.current, productCardRef.current,
      titleRef.current, priceRef.current, taglineRef.current,
      descRef.current, ctaRowRef.current,
    ].filter(Boolean) as HTMLElement[];
    gsap.set(primary, { opacity: 0 });

    const tl = gsap.timeline();
    tl.fromTo(aboutLabelRef.current,  { opacity:0, y:10  }, { opacity:1, y:0, duration:0.38, ease:'power2.out' }, 0);
    tl.fromTo(productCardRef.current, { opacity:0, x:-20 }, { opacity:1, x:0, duration:0.48, ease:'power3.out' }, 0.06);
    [titleRef, priceRef, taglineRef, descRef, ctaRowRef].forEach((r, i) =>
      tl.fromTo(r.current, { opacity:0, y:10 }, { opacity:1, y:0, duration:0.32, ease:'power2.out' }, 0.12 + i * 0.09));
  }, [phase === ScreenPhase.PRIMARY_CONTENT]);

  /* SECONDARY_CONTENT: pick cards */
  useEffect(() => {
    if (phase !== ScreenPhase.SECONDARY_CONTENT) return;
    const secondary = [topPicksLabelRef.current, ...pickCardRefs.current].filter(Boolean) as HTMLElement[];
    gsap.set(secondary, { opacity: 0 });

    const tl = gsap.timeline();
    tl.fromTo(topPicksLabelRef.current, { opacity:0, y:8 }, { opacity:1, y:0, duration:0.32, ease:'power2.out' }, 0);
    pickCardRefs.current.forEach((el, i) => {
      if (!el) return;
      tl.fromTo(el, { opacity:0, x:32 }, { opacity:1, x:0, duration:0.38, ease:'power3.out' }, 0.08 + i * 0.08);
    });
  }, [phase === ScreenPhase.SECONDARY_CONTENT]);

  return (
    <div
      ref={midRowRef}
      style={{
        position: 'absolute',
        top: RENDERER_TOP, left: LEFT_PAD, right: 0, bottom: 148,
        display: 'flex', gap: COL_GAP, alignItems: 'flex-start',
        zIndex: 5,
        transition: 'transform 0.42s cubic-bezier(0.4,0,0.2,1)',
        willChange: 'transform',
      }}
    >
      {/* LEFT — product image */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flexShrink: 0 }}>
        <div ref={aboutLabelRef} style={{ opacity: 0 }}>
          <SectionLabel>ABOUT THE PRODUCT</SectionLabel>
        </div>
        <div ref={productCardRef} style={{
          width: LEFT_COL, height: 400,
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
            width: 40, height: 40, borderRadius: '50%', background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 14px rgba(0,0,0,0.16)',
          }}>
            <AdidasLogo />
          </div>
          <JacketIllustration />
        </div>
      </div>

      {/* CENTER — details + CTAs */}
      <div style={{ display: 'flex', flexDirection: 'column', paddingTop: 40, flexShrink: 0, width: CTR_COL }}>
        <div ref={titleRef} style={{ opacity: 0, marginBottom: 12 }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.022em' }}>
            {MAIN_PRODUCT.title}
          </div>
        </div>
        <div ref={priceRef} style={{ opacity: 0, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>$</span>
            <span style={{ fontSize: 40, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
              {MAIN_PRODUCT.price}
            </span>
          </div>
        </div>
        <div ref={taglineRef} style={{ opacity: 0, marginBottom: 12 }}>
          <div style={{ fontSize: 18, fontStyle: 'italic', fontWeight: 500, color: 'rgba(245,243,247,0.78)', lineHeight: 1.45 }}>
            {MAIN_PRODUCT.tagline}
          </div>
        </div>
        <div ref={descRef} style={{ opacity: 0, marginBottom: 34 }}>
          <div style={{ fontSize: 16, color: 'rgba(245,243,247,0.50)', lineHeight: 1.65, maxWidth: '34ch' }}>
            {MAIN_PRODUCT.description}
          </div>
        </div>
        <div ref={ctaRowRef} style={{ display: 'flex', gap: 12, alignItems: 'center', opacity: 0 }}>
          <FocusButton focused={isMid(0)} variant={tryOnPrimary ? 'white' : 'dark'} icon={<TryOnIcon dark={tryOnPrimary} />}>
            Try On
          </FocusButton>
          <FocusButton focused={isMid(1)} variant={buyNowPrimary ? 'white' : 'dark'} icon={<BagIcon dark={buyNowPrimary} />}>
            Buy Now
          </FocusButton>
          <button style={{
            width: 50, height: 50, borderRadius: '50%', flexShrink: 0,
            background: isMid(2) ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)',
            border: isMid(2) ? FOCUS_BORDER : IDLE_BORDER('0.18'),
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            boxShadow: isMid(2) ? FOCUS_SHADOW : 'none',
            transform: isMid(2) ? 'scale(1.1)' : 'scale(1)',
            transition: FOCUS_TRANSITION,
          }}>
            <HeartIcon />
          </button>
        </div>
      </div>

      {/* RIGHT — pick rail */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        <div ref={topPicksLabelRef} style={{ opacity: 0, paddingRight: LEFT_PAD, marginBottom: 18, position: 'relative', zIndex: 4 }}>
          <SectionLabel>TOP PICKS FOR YOU</SectionLabel>
        </div>
        <div style={{ position: 'relative', overflow: 'visible', paddingTop: 10, marginTop: -10 }}>
          <div style={{ display: 'flex', gap: CARD_GAP }}>
            {TOP_PICKS.map((pick, i) => {
              const focused = isMid(3 + i);
              return (
                <div
                  key={pick.id}
                  ref={el => { pickCardRefs.current[i] = el; }}
                  style={{
                    flex: `0 0 ${CARD_W}px`, height: CARD_H,
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
                  <div style={{
                    width: '100%', height: '72%',
                    background: `linear-gradient(145deg, ${pick.bg[0]} 0%, ${pick.bg[1]} 100%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <PickIllustration index={i} />
                  </div>
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'rgba(8,4,20,0.9)', backdropFilter: 'blur(10px)',
                    padding: '11px 14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 8 }}>
                      {pick.title}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.45)', flexShrink: 0 }}>
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
  );
}

function AdidasLogo() {
  return (
    <svg viewBox="0 0 40 40" width="26" height="26" fill="none">
      <path d="M7 30L15 12L22 30H7Z"   fill="#111" opacity="0.9"/>
      <path d="M14 30L21 16L28 30H14Z" fill="#111" opacity="0.7"/>
      <path d="M21 30L27 18L33 30H21Z" fill="#111" opacity="0.5"/>
    </svg>
  );
}

function JacketIllustration() {
  return (
    <svg viewBox="0 0 240 300" width="175" height="230" fill="none">
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
    </svg>
  );
}

function PickIllustration({ index }: { index: number }) {
  const v = index % 4;
  const s = { fill: 'rgba(255,255,255,0.09)', stroke: 'rgba(255,255,255,0.04)' };
  const line = { stroke: 'rgba(255,255,255,0.12)', strokeWidth: '1.5' };
  if (v === 0) return (
    <svg viewBox="0 0 100 160" width={CARD_W * 0.36} height={CARD_H * 0.40} fill="none">
      <path d="M28 28 Q50 8 72 28 L78 46 L70 148 L30 148 L22 46 Z" {...s}/>
      <line x1="50" y1="46" x2="50" y2="146" {...line}/>
    </svg>
  );
  if (v === 1) return (
    <svg viewBox="0 0 100 110" width={CARD_W * 0.36} height={CARD_H * 0.33} fill="none">
      <path d="M28 30 Q50 12 72 30 L80 50 L76 98 L24 98 L20 50 Z" {...s}/>
      <line x1="50" y1="30" x2="50" y2="96" {...line}/>
    </svg>
  );
  if (v === 2) return (
    <svg viewBox="0 0 100 110" width={CARD_W * 0.36} height={CARD_H * 0.33} fill="none">
      <path d="M30 22 Q50 8 70 22 L78 46 L74 98 L26 98 L22 46 Z" {...s}/>
      <line x1="50" y1="22" x2="50" y2="96" {...line}/>
    </svg>
  );
  return (
    <svg viewBox="0 0 100 110" width={CARD_W * 0.36} height={CARD_H * 0.33} fill="none">
      <path d="M32 18 Q50 6 68 18 L72 36 L70 98 L30 98 L28 36 Z" {...s}/>
      <line x1="50" y1="18" x2="50" y2="96" {...line}/>
    </svg>
  );
}
