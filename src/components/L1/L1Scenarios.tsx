/**
 * L1 Scenarios — /l1-scenarios (internal leadership demo, NOT part of the product)
 *
 * This page must look and behave INDISTINGUISHABLE from a real L1 screen
 * (FoodL1Scenarios / TravelL1): same Glance logo, same query chip, same
 * agent mascot + response, same card/tab rendering, same bottom prompt row
 * with keyboard/mic icons, same D-pad focus graph (LEFT/RIGHT/UP/DOWN).
 *
 * The only thing that isn't "real product" is a small gear icon in the top
 * corner — mouse/click only, never wired into the keyboard handlers below —
 * that opens a 3-item debug menu (Cards / Cards + Tabs / Text Only) for
 * switching which mocked response is on screen. Selecting one increments
 * `runId`, which is folded into the active scenario's React `key`, forcing a
 * full unmount/remount so the entire intro sequence (mascot → typing →
 * structure → content → prompts → interactive) always replays from zero and
 * no interaction state leaks between scenarios.
 *
 * The typing reveal reuses GlanceTextReveal — the same shared component used
 * by the Warm User Profile experience — just with a slightly faster resolve
 * time. No new typing animation was built.
 */
import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import GlanceTextReveal from '../Shared/GlanceTextReveal';
// Cards + Tabs reuses TravelL1's own data and interaction model verbatim —
// same tabs, same 15 items, same CTA-mirroring/flyout/QR-modal navigation —
// so the demo is a faithful replay of the real /travel-l1 experience, not a
// re-approximation of it.
import {
  TABS as TravelTabs,
  TAB_ITEMS as TravelTabItems,
  type TravelItem,
  type NavDir as TravelNavDir,
  type CtaId as TravelCtaId,
  CTA_ORDER as TravelCtaOrder,
  PRIMARY_IDX as TravelPrimaryIdx,
  FLYOUT_ITEMS as TravelFlyoutItems,
  FOLLOW_UPS as TravelFollowUps,
  SECTION_GAP as TRAVEL_SECTION_GAP,
  DotsIcon,
  HeartIcon,
} from './TravelL1';
// Cards reuses FoodL1Scenarios' own data and interaction model verbatim —
// same 5 places, same CTA-mirroring/flyout/QR-modal navigation — for the
// same reason: a faithful replay of /food-l1, not a re-approximation of it.
import {
  PLACES as FoodPlaces,
  type Place,
  type NavDir as FoodNavDir,
  type CtaId as FoodCtaId,
  CTA_ORDER as FoodCtaOrder,
  PRIMARY_IDX as FoodPrimaryIdx,
  FLYOUT_ITEMS as FoodFlyoutItems,
  FOLLOW_UPS as FoodFollowUps,
} from './FoodL1Scenarios';

/* ─── debug-only scenario registry (never rendered as product UI) ──────── */
type ScenarioId = 'cards' | 'cards-tabs' | 'text-only' | 'text-carousel';

const DEBUG_SCENARIOS: { id: ScenarioId; label: string }[] = [
  { id: 'cards',          label: 'Cards' },
  { id: 'cards-tabs',     label: 'Cards + Tabs' },
  { id: 'text-only',      label: 'Text Only' },
  { id: 'text-carousel',  label: 'Text + Carousel' },
];

const QUERY_TEXT: Record<ScenarioId, ReactNode> = {
  'cards':          'Suggest places for a date night',
  'cards-tabs':     'Plan a trip to Coorg',
  'text-only':      <>Check out the Recipe of{' '}<span style={{ color: '#fff', fontWeight: 700 }}>Miso Ramen</span></>,
  'text-carousel':  <>Check out the Recipe of{' '}<span style={{ color: '#fff', fontWeight: 700 }}>Miso Ramen</span></>,
};

/* ─── Text Only content — approved copy from Figma (node 5137-30800 /
   5137-31506). Text Only has no equivalent existing L1 page to replay, so
   this is its own long-form content rather than a reused data source. The
   ingredient list intentionally repeats — that's the approved content, sized
   to demonstrate long-form scrolling, not a transcription error. ── */
const RAMEN_HEADING = "Here’s a solid homemade Miso Ramen recipe, broken down into broth, noodles, and toppings:";
const RAMEN_INTRO = 'Start by simmering kombu and shiitake mushrooms to build umami, then mix in miso paste, sesame oil, garlic, and ginger for depth. Cook the ramen noodles separately so they stay firm, then pour the hot broth over them. Finish with toppings like soft-boiled egg, corn, scallions, nori, mushrooms, and chili oil.';
const RAMEN_SUBHEADING = 'For the Ramen Broth & Meat Base';
const RAMEN_BULLETS = [
  '4 Cups Water (Or Veggie/Chicken Stock)',
  '1 Sheet Kombu (Dried Kelp)',
  '2 Tbsp Dried Shiitake Mushrooms (Or 2 Fresh)',
  '1 Tbsp Sesame Oil',
  '1 Sheet Kombu (Dried Kelp)',
  '2 Tbsp Dried Shiitake Mushrooms (Or 2 Fresh)',
  '4 Cups Water (Or Veggie/Chicken Stock)',
  '1 Sheet Kombu (Dried Kelp)',
  '2 Tbsp Dried Shiitake Mushrooms (Or 2 Fresh)',
  '1 Tbsp Sesame Oil',
  '1 Sheet Kombu (Dried Kelp)',
  '2 Tbsp Dried Shiitake Mushrooms (Or 2 Fresh)',
];
const RAMEN_CLOSING = 'Serve immediately while piping hot to keep the noodles from getting soggy.';

const RAMEN_POST_CAROUSEL = "Whichever style you go with, the core technique stays the same — build a flavorful base, cook the noodles separately so they don't turn mushy, and finish with fresh toppings right before serving.";

// Continues the conversation about this specific recipe — not the generic
// trip prompts used by Cards / Cards + Tabs.
const TEXT_PROMPTS = [
  'Show me the ingredient list',
  'Make this vegetarian',
  'What toppings work best?',
  'Suggest how to make chashu pork',
];

/* ─── external data contracts ─────────────────────────────────────────────
   The four scenario components below are the production-like final-response
   templates other experiences (Level 2 agent thinking) REUSE rather than
   re-approximate. Each takes an optional `data` prop; with no prop it renders
   exactly the hardcoded /l1-scenarios demo content, so this page's behavior
   is unchanged. Adapters live with the caller (see
   src/level2/finalResponse/adaptToL1.ts), never here. ── */

/** Same shape as FoodL1Scenarios' Place, with the numeric facts optional so
 *  adapted real-trace entities (which often lack a rating or price) remain
 *  valid. The default demo data satisfies it as-is. */
export type L1CardItem = Omit<Place, 'rating' | 'ratingCount' | 'price'> & {
  rating?: number;
  ratingCount?: string;
  price?: string;
};

export interface L1CardsData {
  agentLine: string;
  places: L1CardItem[];
  prompts: string[];
}

export interface L1CardsTabsData {
  agentLine: string;
  tabs: Array<{ id: string; label: string }>;
  tabItems: Record<string, TravelItem[]>;
  prompts: string[];
}

export type L1TextBlock = { kind: 'p' | 'sub' | 'bullet'; text: string };

export interface L1TextOnlyData {
  heading: string;
  blocks: L1TextBlock[];
  prompts: string[];
}

export type L1TextCarouselBlock = L1TextBlock | { kind: 'carousel' };

export interface L1TextCarouselData {
  heading: string;
  blocks: L1TextCarouselBlock[];
  places: L1CardItem[];
  prompts: string[];
}

/* The approved demo content, expressed through the same block sequence the
   data contract uses (intro → subheading → each bullet → closing). */
const DEFAULT_TEXT_BLOCKS: L1TextBlock[] = [
  { kind: 'p', text: RAMEN_INTRO },
  { kind: 'sub', text: RAMEN_SUBHEADING },
  ...RAMEN_BULLETS.map((b): L1TextBlock => ({ kind: 'bullet', text: b })),
  { kind: 'p', text: RAMEN_CLOSING },
];

const DEFAULT_TC_BLOCKS: L1TextCarouselBlock[] = [
  { kind: 'p', text: RAMEN_INTRO },
  { kind: 'sub', text: RAMEN_SUBHEADING },
  ...RAMEN_BULLETS.map((b): L1TextCarouselBlock => ({ kind: 'bullet', text: b })),
  { kind: 'carousel' },
  { kind: 'p', text: RAMEN_POST_CAROUSEL },
  { kind: 'p', text: RAMEN_CLOSING },
];

/* ─── layout — identical coordinates to FoodL1Scenarios / TravelL1 ─────── */
const W = 1920, H = 1080;
const L_PAD = 184;
const AGENT_TOP = 156;
const TABS_TOP = 244;
const CARD_TOP_NOTABS = 248; // Cards / Text Only (no tab row above)
const CARD_TOP_TABS   = 316; // Cards + Tabs (rail sits below the tab row)
const EXP_W = 880, EXP_H = 504;
const COL_W = 336, COL_H = 420;
const CARD_G = 24;
const PROMPT_TOP = 944;

/* ─── Text Only reading-surface layout ──────────────────────────────────
   A bordered card that grows with its content (not a bare text block, and
   not pre-sized) — matches the Figma long-form reading treatment.
   TEXT_CARD_MAX_HEIGHT is a cap, not a fixed size: the card's real height
   tracks its rendered content up to this cap, then locks and starts
   clipping/scrolling. ── */
const TEXT_CARD_TOP    = AGENT_TOP; // = 156, aligned with the mascot
const TEXT_CARD_LEFT   = L_PAD;
const TEXT_CARD_WIDTH  = 1300;
const TEXT_CARD_BOTTOM = PROMPT_TOP - 40; // = 904
const TEXT_CARD_MAX_HEIGHT = TEXT_CARD_BOTTOM - TEXT_CARD_TOP; // = 748 — cap the text grows toward before the reading surface locks in
const INTERACTION_DELAY_MS  = 450;  // settle pause after the full response finishes before focus/manual scroll unlock
const MANUAL_SCROLL_STEP_PX = 240;  // per UP/DOWN press once interactive
const CHROME_FADE_MS = 400;         // how long the container background/border take to fade in once the text hits the max height

/* ─── Text + Carousel — widened surface + carousel card layout ───────────
   The surface only ever widens (never narrows back) once the carousel is
   reached, same "locks in and stays" pattern as the height cap. Text stays
   pinned to TEXT_MEASURE_WIDTH regardless — only the carousel row (and the
   surface chrome itself) uses the extra width. ── */
const TEXT_CARD_WIDE_WIDTH = W - TEXT_CARD_LEFT - 40; // edge-to-edge (40px right margin) so the carousel has real room, not just a bit wider
const TEXT_MEASURE_WIDTH   = TEXT_CARD_WIDTH - 112; // matches the reading padding (48 + 64) so line length never changes
const WIDTH_GROW_MS   = 450;
const CAROUSEL_REVEAL_MS = 500; // not a text reveal — a fixed fade/slide-in beat before the closing line resumes

/* ─── Text + Carousel — the carousel itself is FoodPlaces, rendered and
   driven exactly like Cards (same collapsed COL_W/COL_H → expand-in-place
   EXP_W/EXP_H card, same railShift-style translateX, same CTA-mirroring +
   flyout + QR-modal interaction). It's reused wholesale, not re-approximated
   — only the viewport it's clipped to (edge-to-edge but still nested in the
   reading column rather than truly full-screen) is specific to this variant. ── */
const CAROUSEL_VIEWPORT_W = TEXT_CARD_WIDE_WIDTH - 112; // matches the reading padding, same reasoning as TEXT_MEASURE_WIDTH
const CAROUSEL_VIEWPORT_H = EXP_H; // tall enough for the expanded card; collapsed cards (COL_H) just sit flush at the top

/* ─── intro-sequence engine ──────────────────────────────────────────────
   0 typing → 1 structure (tabs/heading) → 2 content (cards/bullets, still
   compact & non-focused) → 3 prompt row → 4 interactive (D-pad + focus
   enabled, first target focused/expanded). Mirrors the required global
   sequence: mascot → response → structure → content → prompts → interactive. */
const PHASE = { TYPING: 0, STRUCTURE: 1, CONTENT: 2, PROMPTS: 3, INTERACTIVE: 4 } as const;
const ADVANCE_DELAY_MS: Record<number, number> = { 1: 320, 2: 380, 3: 320 };
const MASCOT_TO_TYPING_DELAY_MS = 220; // mascot pops in, then the response starts typing
const TYPING_RESOLVE_MS = 1900;        // "slightly faster" than RESOLVE_MS_SPEECH (2500), still readable

// Text Only reveal speeds — noticeably faster than the shared
// TYPING_RESOLVE_MS/AgentIntro pace (Cards / Cards+Tabs are untouched),
// since a long-form response reading faster start-to-finish matters more
// here than it does for a single short spoken line. Each block plays its
// character reveal only after the previous one finishes, so the whole
// response reads as continuously composing.
//
// GlanceTextReveal's actual on-screen duration is resolveMs + charDuration
// (the last character starts at resolveMs and then takes charDuration to
// finish) — so charDuration is overridden per block too, otherwise the
// shared default (0.65s–1.0s per char) dominates and every block still
// feels slow regardless of how small resolveMs is.
const TEXT_ONLY_HEADING_RESOLVE_MS = 750;
const TEXT_ONLY_HEADING_CHAR_MS    = 0.35;
const BODY_RESOLVE_MS      = { p: 1020, sub: 170, bullet: 60,   closing: 260  } as const;
const BODY_CHAR_DURATION   = { p: 0.28, sub: 0.28, bullet: 0.22, closing: 0.24 } as const;

function useIntroSequence() {
  const [typingStarted, setTypingStarted] = useState(false);
  const [phase, setPhase] = useState<number>(PHASE.TYPING);

  useEffect(() => {
    const t = setTimeout(() => setTypingStarted(true), MASCOT_TO_TYPING_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase === PHASE.TYPING || phase === PHASE.INTERACTIVE) return;
    const t = setTimeout(() => setPhase(p => Math.min(PHASE.INTERACTIVE, p + 1)), ADVANCE_DELAY_MS[phase]);
    return () => clearTimeout(t);
  }, [phase]);

  return {
    phase,
    typingStarted,
    onTypingDone: () => setPhase(PHASE.STRUCTURE),
    introDone: phase >= PHASE.INTERACTIVE,
  };
}

/* ─── shared "real L1" chrome pieces ─────────────────────────────────── */
function AgentIntro({ text, typingStarted, onDone, highlighted = false }: { text: string; typingStarted: boolean; onDone: () => void; highlighted?: boolean }) {
  return (
    <>
      <div style={{ position: 'absolute', top: AGENT_TOP, left: 72, width: 80, height: 80, zIndex: 5, animation: 'l1s-mascotIn 0.28s ease both' }}>
        <img src="/images/l1/mascot.png" alt="" style={{
          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
          width: 161, height: 163, maxWidth: 'none',
        }} />
      </div>
      <div style={{
        position: 'absolute', top: AGENT_TOP, left: L_PAD, height: 80, right: 120,
        display: 'flex', alignItems: 'center', zIndex: 5,
        borderRadius: 14, padding: '0 18px', marginLeft: -18,
        background: highlighted ? 'rgba(255,255,255,0.05)' : 'transparent',
        boxShadow: highlighted ? '0 0 0 1.5px rgba(255,255,255,0.2)' : 'none',
        transition: 'all 0.2s ease',
      }}>
        <p style={{ fontSize: 28, lineHeight: '40px', fontWeight: 500, color: '#fff', margin: 0 }}>
          <GlanceTextReveal text={text} playing={typingStarted} resolvedOpacity={0.95} resolveMs={TYPING_RESOLVE_MS} onDone={onDone} />
        </p>
      </div>
    </>
  );
}

function PromptRow({ prompts, visible, activeIdx }: { prompts: string[]; visible: boolean; activeIdx: number | null }) {
  if (!visible) return null;
  return (
    <div style={{
      position: 'absolute', top: PROMPT_TOP, left: L_PAD, right: 0, height: 72,
      display: 'flex', alignItems: 'center', gap: 32, zIndex: 13, overflow: 'hidden',
      animation: 'l1s-fadeUp 0.4s ease both',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div className="l1s-gborder" style={{ width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <img src="/images/l1/keyboard.svg" alt="" style={{ width: 40, height: 40 }} />
        </div>
        <div className="l1s-gborder" style={{ width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <img src="/images/l1/mic.svg" alt="" style={{ width: 40, height: 40 }} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {prompts.map((p, i) => {
          const on = activeIdx === i;
          return (
            <div key={i} className={on ? undefined : 'l1s-gborder'} style={{
              height: 72, padding: '0 32px', borderRadius: 999, boxSizing: 'border-box',
              display: 'flex', alignItems: 'center',
              fontSize: 22, lineHeight: '32px', fontWeight: 500, letterSpacing: '0.22px',
              color: on ? '#111' : 'rgba(255,255,255,0.6)',
              background: on ? 'rgba(255,255,255,0.95)' : 'transparent',
              boxShadow: on ? '0 6px 20px rgba(255,255,255,0.12)' : 'none',
              transform: on ? 'scale(1.03)' : 'scale(1)',
              transition: 'all 0.15s ease', whiteSpace: 'nowrap', flexShrink: 0,
            }}>{p}</div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Scenario 1 — Cards ───────────────────────────────────────────────
   A faithful replay of /food-l1 itself: same PLACES data (5 date-night
   spots), same CTA-mirroring/flyout/QR-modal navigation model, same
   expand-in-place card transition — imported directly from
   FoodL1Scenarios.tsx rather than re-approximated. The only addition is the
   `introDone` gate wrapping every interaction so nothing responds until the
   entrance sequence finishes. ── */
type FoodZone = 'intro' | 'cta' | 'inputs' | 'qrModal' | 'flyout';

export function CardsScenario({ data }: { data?: L1CardsData } = {}) {
  const places = data?.places ?? (FoodPlaces as L1CardItem[]);
  const prompts = data?.prompts ?? FoodFollowUps;
  const agentLine = data?.agentLine ?? 'Here are my top picks for a date in Pune, curated for that premium, intimate vibe.';

  const { phase, typingStarted, onTypingDone, introDone } = useIntroSequence();

  const [cardIdx, setCardIdx] = useState(0);
  const [zone, setZone] = useState<FoodZone>('cta');
  const [navDir, setNavDir] = useState<FoodNavDir>('right');
  const [ctaIdx, setCtaIdx] = useState(FoodPrimaryIdx.right);
  const [flyoutIdx, setFlyoutIdx] = useState(0);
  const [promptIdx, setPromptIdx] = useState(0);
  const [wishlisted, setWishlisted] = useState<Set<string>>(new Set());
  const [qrOpen, setQrOpen] = useState(false);
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const place = places[cardIdx];
  const railShift = L_PAD - cardIdx * (COL_W + CARD_G);

  const showToast = (msg: string) => {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast(msg);
    toastRef.current = setTimeout(() => setToast(null), 2200);
  };
  useEffect(() => () => { if (toastRef.current) clearTimeout(toastRef.current); }, []);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (!introDone) return; // locked until the entrance sequence finishes
      const k = e.key;

      if (qrOpen) { e.preventDefault(); setQrOpen(false); setZone('cta'); return; }

      if (flyoutOpen) {
        e.preventDefault();
        if (k === 'ArrowLeft')  setFlyoutIdx(i => Math.max(0, i - 1));
        if (k === 'ArrowRight') setFlyoutIdx(i => Math.min(FoodFlyoutItems.length - 1, i + 1));
        if (k === 'Enter') {
          const item = FoodFlyoutItems[flyoutIdx];
          if (item.id === 'like')     showToast('Liked ✓');
          if (item.id === 'dislike')  showToast('Got it — won\'t show similar');
          if (item.id === 'copyLink') showToast('Link copied ✓');
          if (item.id === 'report')   showToast('Reported — thanks');
          setFlyoutOpen(false); setZone('cta');
        }
        if (k === 'Escape' || k === 'Backspace' || k === 'ArrowDown') {
          setFlyoutOpen(false); setZone('cta');
        }
        return;
      }

      if (zone === 'intro') {
        e.preventDefault();
        if (k === 'ArrowDown') setZone('cta');
        return;
      }

      if (zone === 'cta') {
        if (k === 'ArrowRight') {
          e.preventDefault();
          if (ctaIdx < 2) {
            setCtaIdx(i => i + 1);
          } else if (cardIdx < places.length - 1) {
            setNavDir('right'); setCardIdx(i => i + 1); setCtaIdx(FoodPrimaryIdx.right);
          }
        }
        if (k === 'ArrowLeft') {
          e.preventDefault();
          if (ctaIdx > 0) {
            setCtaIdx(i => i - 1);
          } else if (cardIdx > 0) {
            setNavDir('left'); setCardIdx(i => i - 1); setCtaIdx(FoodPrimaryIdx.left);
          }
        }
        if (k === 'ArrowUp')   { e.preventDefault(); setZone('intro'); }
        if (k === 'ArrowDown') { e.preventDefault(); setZone('inputs'); setPromptIdx(0); }
        if (k === 'Enter') {
          e.preventDefault();
          const focusedCta = FoodCtaOrder[navDir][ctaIdx];
          if (focusedCta === 'checkout') { setQrOpen(true); setZone('qrModal'); }
          if (focusedCta === 'wishlist') {
            setWishlisted(s => { const n = new Set(s); n.has(place.id) ? n.delete(place.id) : n.add(place.id); return n; });
            showToast(wishlisted.has(place.id) ? 'Removed from wishlist' : 'Added to wishlist ♥');
          }
          if (focusedCta === 'more') { setFlyoutOpen(true); setFlyoutIdx(0); setZone('flyout'); }
        }
        return;
      }

      if (zone === 'inputs') {
        if (k === 'ArrowLeft')  { e.preventDefault(); setPromptIdx(i => Math.max(0, i - 1)); }
        if (k === 'ArrowRight') { e.preventDefault(); setPromptIdx(i => Math.min(prompts.length - 1, i + 1)); }
        if (k === 'ArrowUp')    { e.preventDefault(); setZone('cta'); }
        return;
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [introDone, zone, cardIdx, navDir, ctaIdx, flyoutIdx, flyoutOpen, qrOpen, promptIdx, place.id, wishlisted, places.length, prompts.length]);

  const ctaOrder     = FoodCtaOrder[navDir];
  const focusedCtaId = zone === 'cta' ? ctaOrder[ctaIdx] : null;
  const ctaFocused   = (id: FoodCtaId) => focusedCtaId === id;

  return (
    <>
      <AgentIntro
        text={agentLine}
        typingStarted={typingStarted} onDone={onTypingDone}
        highlighted={introDone && zone === 'intro'}
      />

      {phase >= PHASE.CONTENT && (
        <div style={{
          position: 'absolute', top: CARD_TOP_NOTABS, left: 0, height: EXP_H + 60,
          display: 'flex', alignItems: 'flex-start', gap: CARD_G,
          transform: `translateX(${railShift}px)`, transition: 'transform 0.65s cubic-bezier(0.16,1,0.3,1)', willChange: 'transform', zIndex: 5,
        }}>
          {places.map((p, i) => {
            const isFocused = introDone && cardIdx === i && (zone === 'cta' || zone === 'flyout' || zone === 'qrModal');

            if (isFocused) {
              return (
                <div key={p.id} style={{
                  width: EXP_W, height: EXP_H, flexShrink: 0, borderRadius: 32, overflow: 'hidden',
                  position: 'relative', background: '#1a1a1a',
                  border: zone === 'cta' || zone === 'flyout' ? '4px solid #fff' : '4px solid rgba(255,255,255,0.5)',
                  boxShadow: '0 30px 40px rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.3)',
                  transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.1)', borderRadius: 28, pointerEvents: 'none', zIndex: 1 }} />
                  <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 20px rgba(255,255,255,0.3)', borderRadius: 28, pointerEvents: 'none', zIndex: 2 }} />

                  <div style={{ position: 'absolute', top: 16, left: 15, width: 370, height: 463, borderRadius: 20, border: '1px solid rgba(255,255,255,0.2)', overflow: 'hidden', background: '#111' }}>
                    <img src={p.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>

                  <div style={{
                    position: 'absolute', top: 0, bottom: 0, left: 384, width: 492,
                    boxSizing: 'border-box', padding: '32px 24px',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    animation: 'l1s-fadeUp 0.4s ease both',
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img src="/images/l1/pin.svg" alt="" style={{ width: 32, height: 32 }} />
                        <span style={{ fontSize: 22, lineHeight: '28px', fontWeight: 500, fontFamily: 'Inter,sans-serif' }}>{p.agentLabel}</span>
                      </div>
                      <p style={{ fontSize: 24, lineHeight: '36px', fontWeight: 500, color: 'rgba(255,255,255,0.8)', margin: 0, fontFamily: 'Inter,sans-serif' }}>{p.agentNote}</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {p.rating != null && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ color: '#ffba71', fontSize: 20, lineHeight: '24px', fontWeight: 600, fontFamily: 'Inter,sans-serif', textTransform: 'uppercase' }}>{p.rating}</span>
                            <img src="/images/l1/star.svg" alt="" style={{ width: 24, height: 24 }} />
                            {p.ratingCount && <span style={{ color: '#ffba71', fontSize: 20, lineHeight: '24px', fontWeight: 600, fontFamily: 'Inter,sans-serif', textTransform: 'uppercase' }}>({p.ratingCount} reviews)</span>}
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <p style={{ fontSize: 32, fontWeight: 600, lineHeight: '44px', margin: 0, overflow: 'hidden' }}>{p.name}</p>
                          <p style={{ fontSize: 24, fontWeight: 600, lineHeight: '32px', margin: 0 }}>{p.price ?? p.area}</p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 11, height: 64 }}>
                        {ctaOrder.map((id) => {
                          const focused = ctaFocused(id);

                          if (id === 'more') return (
                            <div key="more" onClick={() => { setFlyoutOpen(true); setFlyoutIdx(0); setZone('flyout'); }}
                              style={{
                                width: 64, height: 64, borderRadius: 32, flexShrink: 0,
                                background: focused ? '#fff' : 'rgba(255,255,255,0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: focused ? '0 0 0 2.5px rgba(255,255,255,0.8)' : 'none',
                                transition: 'all 0.15s ease', cursor: 'pointer', position: 'relative',
                              }}>
                              <DotsIcon color={focused ? '#111' : '#fff'} />
                              {flyoutOpen && (
                                <div style={{
                                  position: 'absolute', bottom: 74,
                                  ...(navDir === 'right' ? { left: 0 } : { right: 0 }),
                                  background: 'rgba(16,16,16,0.97)', backdropFilter: 'blur(20px)',
                                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20,
                                  padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 4,
                                  boxShadow: '0 -12px 40px rgba(0,0,0,0.8)', animation: 'l1s-fadeDown 0.18s ease',
                                  minWidth: 210, zIndex: 20, pointerEvents: 'none',
                                }}>
                                  {FoodFlyoutItems.map((item, fi) => (
                                    <div key={item.id} style={{
                                      padding: '12px 20px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 12,
                                      fontSize: 17, fontWeight: 600,
                                      background: flyoutIdx === fi ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.06)',
                                      color: flyoutIdx === fi ? '#111' : '#ccc',
                                      transition: 'all 0.12s ease',
                                    }}>
                                      <span style={{ fontSize: 18 }}>{item.icon}</span>
                                      <span>{item.label}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );

                          if (id === 'wishlist') return (
                            <div key="wishlist" onClick={() => {
                              setWishlisted(s => { const n = new Set(s); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n; });
                              showToast(wishlisted.has(p.id) ? 'Removed from wishlist' : 'Added to wishlist ♥');
                            }} style={{
                              width: 64, height: 64, borderRadius: 32, flexShrink: 0,
                              background: focused ? '#fff' : 'rgba(255,255,255,0.15)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              boxShadow: focused ? '0 0 0 2.5px rgba(255,255,255,0.8)' : 'none',
                              transition: 'all 0.15s ease', cursor: 'pointer',
                            }}>
                              <HeartIcon stroke={wishlisted.has(p.id) ? '#f87' : (focused ? '#111' : '#fff')} fill="none" />
                            </div>
                          );

                          return (
                            <div key="checkout" onClick={() => { setQrOpen(true); setZone('qrModal'); }}
                              style={{
                                flex: 1, height: 64, borderRadius: 32,
                                background: focused ? '#ffffff' : 'rgba(255,255,255,0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 22, lineHeight: '32px',
                                fontWeight: focused ? 700 : 500, fontFamily: 'Inter,sans-serif',
                                color: focused ? '#000' : '#fff', letterSpacing: '0.22px',
                                boxShadow: focused
                                  ? '0 8px 20px rgba(0,0,0,0.12), 0 0 0 3px rgba(255,255,255,0.5)'
                                  : '0 8px 40px rgba(0,0,0,0.12)',
                                transition: 'all 0.15s ease', cursor: 'pointer',
                              }}>
                              Check out
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={p.id} onClick={introDone ? () => { setCardIdx(i); setZone('cta'); } : undefined} style={{
                width: COL_W, height: COL_H, flexShrink: 0, borderRadius: 32, overflow: 'hidden',
                position: 'relative', background: '#141414', boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)', cursor: introDone ? 'pointer' : 'default',
                animation: 'l1s-fadeUp 0.4s ease both', animationDelay: `${i * 90}ms`,
              }}>
                <img src={p.photo} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.1)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 104, background: 'linear-gradient(to bottom, rgba(20,20,20,0.5), transparent)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 242, background: 'linear-gradient(to bottom, rgba(20,20,20,0), #141414)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: 20, left: 20, right: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img src="/images/l1/pin.svg" alt="" style={{ width: 32, height: 32 }} />
                  <span style={{ fontSize: 22, lineHeight: '28px', fontWeight: 500, fontFamily: 'Inter,sans-serif' }}>{p.agentLabel}</span>
                </div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {p.rating != null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: '#ffba71', fontSize: 22, lineHeight: '24px', fontWeight: 600, fontFamily: 'Inter,sans-serif' }}>{p.rating}</span>
                      <img src="/images/l1/star.svg" alt="" style={{ width: 24, height: 24 }} />
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <p style={{ fontSize: 32, fontWeight: 500, lineHeight: '44px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                    <p style={{ fontSize: 24, fontWeight: 600, lineHeight: '32px', margin: 0, opacity: 0.7 }}>{p.price ?? p.area}</p>
                  </div>
                </div>
                <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 20px rgba(255,255,255,0.3)', borderRadius: 30, pointerEvents: 'none' }} />
              </div>
            );
          })}
          <div style={{ width: 80, flexShrink: 0 }} />
        </div>
      )}

      <PromptRow prompts={prompts} visible={phase >= PHASE.PROMPTS} activeIdx={introDone && zone === 'inputs' ? promptIdx : null} />

      {qrOpen && (
        <>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', zIndex: 60, animation: 'l1s-fadeIn 0.3s ease both' }} />
          <div style={{ position: 'absolute', inset: 0, zIndex: 61, animation: 'l1s-slideInRight 0.45s cubic-bezier(0.22,1,0.36,1) both', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', top: -102, right: -92, width: 1232, height: 1284, zIndex: 61 }}>
              <img src="/images/l1/qr-panel.svg" alt="" style={{ width: '100%', height: '100%', display: 'block' }} />
            </div>
            <div onClick={() => { setQrOpen(false); setZone('cta'); }} style={{
              position: 'absolute', left: 772, top: '50%', transform: 'translateY(-50%)',
              width: 80, height: 80, borderRadius: '50%', boxSizing: 'border-box',
              background: '#fff', border: '2px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 63, cursor: 'pointer', pointerEvents: 'auto',
            }}>
              <img src="/images/l1/close-x.svg" alt="close" style={{ width: 40, height: 40 }} />
            </div>
            <div style={{ position: 'absolute', left: 1095, top: 130, width: 623, zIndex: 62, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
              <p style={{ fontSize: 48, lineHeight: '64px', fontWeight: 600, color: '#fff', margin: 0 }}>Scan to Check Out</p>
              <p style={{ fontSize: 24, fontWeight: 500, color: 'rgba(255,255,255,0.8)', letterSpacing: '-0.24px', margin: 0, fontFamily: 'Inter,sans-serif' }}>
                You will be redirected to the brand&rsquo;s official page
              </p>
            </div>
            <div style={{ position: 'absolute', left: 1176, top: '50%', transform: 'translateY(-50%)', width: 460, height: 460, zIndex: 62 }}>
              <img src="/images/l1/qr-blob.svg" alt="" style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 557, height: 557, maxWidth: 'none' }} />
              <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>
                <QRCodeSVG value={place.mapsUrl} size={330} bgColor="transparent" fgColor="#111" level="H" imageSettings={{ src: '/images/l1/cp-logo.svg', width: 88, height: 88, excavate: true }} />
              </div>
            </div>
            <div style={{ position: 'absolute', left: 1211, top: 834, width: 390, zIndex: 62, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 120, height: 140, borderRadius: 16, flexShrink: 0, overflow: 'hidden', border: '1.4px solid rgba(255,255,255,0.2)', boxSizing: 'border-box' }}>
                <img src={place.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
                {place.rating != null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <img src="/images/l1/star.svg" alt="" style={{ width: 20, height: 20 }} />
                    <span style={{ color: '#ffba71', fontSize: 18, lineHeight: '20px', fontWeight: 600, fontFamily: 'Inter,sans-serif', textTransform: 'uppercase' }}>
                      {place.rating}{place.ratingCount ? ` (${place.ratingCount} reviews)` : ''}
                    </span>
                  </div>
                )}
                <p style={{ fontSize: 22, fontWeight: 500, color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.22px', margin: 0, fontFamily: "'Manrope','Plus Jakarta Sans',sans-serif" }}>{place.name}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {toast && (
        <div style={{
          position: 'absolute', bottom: 160, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(18,18,18,0.96)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999,
          padding: '12px 28px', fontSize: 16, fontWeight: 600, color: '#e8e8e8',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)', animation: 'l1s-toastIn 0.18s ease', zIndex: 70, whiteSpace: 'nowrap',
        }}>{toast}</div>
      )}
    </>
  );
}

/* ─── Scenario 2 — Cards + Tabs ──────────────────────────────────────────
   A faithful replay of /travel-l1 itself: same TABS/TAB_ITEMS data (5
   sections, 15 items), same CTA-mirroring/flyout/QR-modal navigation model,
   same section-gap nudge and expand-in-place card transition — imported
   directly from TravelL1.tsx rather than re-approximated. The only addition
   is the `introDone` gate wrapping every interaction so nothing responds
   until the entrance sequence finishes. ── */
type TravelZone = 'intro' | 'tabs' | 'cta' | 'inputs' | 'qrModal' | 'flyout';

export function CardsTabsScenario({ data }: { data?: L1CardsTabsData } = {}) {
  const tabs = data?.tabs ?? TravelTabs;
  const tabItems = data?.tabItems ?? (TravelTabItems as Record<string, TravelItem[]>);
  const prompts = data?.prompts ?? TravelFollowUps;
  const agentLine = data?.agentLine ?? 'Here’s your Coorg weekend escape — a lush, misty retreat for nature and coffee lovers alike.';

  const { phase, typingStarted, onTypingDone, introDone } = useIntroSequence();

  const [tabIdx, setTabIdx] = useState(0);
  const [cardIdx, setCardIdx] = useState(0);
  const [zone, setZone] = useState<TravelZone>('cta');
  const [navDir, setNavDir] = useState<TravelNavDir>('right');
  const [ctaIdx, setCtaIdx] = useState(TravelPrimaryIdx.right);
  const [flyoutIdx, setFlyoutIdx] = useState(0);
  const [promptIdx, setPromptIdx] = useState(0);
  const [wishlisted, setWishlisted] = useState<Set<string>>(new Set());
  const [qrOpen, setQrOpen] = useState(false);
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tab   = tabs[tabIdx];
  const items = tabItems[tab.id];
  const place = items[cardIdx];

  const offsetBefore = tabs.slice(0, tabIdx).reduce((acc, tb) => {
    const n = tabItems[tb.id].length;
    return acc + n * COL_W + (n - 1) * CARD_G + TRAVEL_SECTION_GAP;
  }, 0);
  const railShift = L_PAD - (offsetBefore + cardIdx * (COL_W + CARD_G));

  const hasNextSectionNudge = tabIdx < tabs.length - 1 && cardIdx >= items.length - 2;
  const nextSectionFirstItem = hasNextSectionNudge ? tabItems[tabs[tabIdx + 1].id][0] : null;

  const showToast = (msg: string) => {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast(msg);
    toastRef.current = setTimeout(() => setToast(null), 2200);
  };
  useEffect(() => () => { if (toastRef.current) clearTimeout(toastRef.current); }, []);

  const switchTab = (next: number) => {
    setTabIdx(next);
    setCardIdx(0);
    setNavDir('right');
    setCtaIdx(TravelPrimaryIdx.right);
  };

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (!introDone) return; // locked until the entrance sequence finishes
      const k = e.key;

      if (qrOpen) { e.preventDefault(); setQrOpen(false); setZone('cta'); return; }

      if (flyoutOpen) {
        e.preventDefault();
        if (k === 'ArrowLeft')  setFlyoutIdx(i => Math.max(0, i - 1));
        if (k === 'ArrowRight') setFlyoutIdx(i => Math.min(TravelFlyoutItems.length - 1, i + 1));
        if (k === 'Enter') {
          const item = TravelFlyoutItems[flyoutIdx];
          if (item.id === 'like')     showToast('Liked ✓');
          if (item.id === 'dislike')  showToast('Got it — won\'t show similar');
          if (item.id === 'copyLink') showToast('Link copied ✓');
          if (item.id === 'report')   showToast('Reported — thanks');
          setFlyoutOpen(false); setZone('cta');
        }
        if (k === 'Escape' || k === 'Backspace' || k === 'ArrowDown') {
          setFlyoutOpen(false); setZone('cta');
        }
        return;
      }

      if (zone === 'intro') {
        e.preventDefault();
        if (k === 'ArrowDown') setZone('tabs');
        return;
      }

      if (zone === 'tabs') {
        e.preventDefault();
        if (k === 'ArrowLeft'  && tabIdx > 0)               switchTab(tabIdx - 1);
        if (k === 'ArrowRight' && tabIdx < tabs.length - 1) switchTab(tabIdx + 1);
        if (k === 'ArrowUp')   setZone('intro');
        if (k === 'ArrowDown' || k === 'Enter') { setZone('cta'); setCtaIdx(TravelPrimaryIdx[navDir]); }
        return;
      }

      if (zone === 'cta') {
        if (k === 'ArrowRight') {
          e.preventDefault();
          if (ctaIdx < 2) {
            setCtaIdx(i => i + 1);
          } else if (cardIdx < items.length - 1) {
            setNavDir('right'); setCardIdx(i => i + 1); setCtaIdx(TravelPrimaryIdx.right);
          } else if (tabIdx < tabs.length - 1) {
            setTabIdx(tabIdx + 1); setCardIdx(0); setNavDir('right'); setCtaIdx(TravelPrimaryIdx.right);
          }
        }
        if (k === 'ArrowLeft') {
          e.preventDefault();
          if (ctaIdx > 0) {
            setCtaIdx(i => i - 1);
          } else if (cardIdx > 0) {
            setNavDir('left'); setCardIdx(i => i - 1); setCtaIdx(TravelPrimaryIdx.left);
          } else if (tabIdx > 0) {
            const prevItems = tabItems[tabs[tabIdx - 1].id];
            setTabIdx(tabIdx - 1); setCardIdx(prevItems.length - 1); setNavDir('left'); setCtaIdx(TravelPrimaryIdx.left);
          }
        }
        if (k === 'ArrowUp')   { e.preventDefault(); setZone('tabs'); }
        if (k === 'ArrowDown') { e.preventDefault(); setZone('inputs'); setPromptIdx(0); }
        if (k === 'Enter') {
          e.preventDefault();
          const focusedCta = TravelCtaOrder[navDir][ctaIdx];
          if (focusedCta === 'maps')     { setQrOpen(true); setZone('qrModal'); }
          if (focusedCta === 'wishlist') {
            setWishlisted(s => { const n = new Set(s); n.has(place.id) ? n.delete(place.id) : n.add(place.id); return n; });
            showToast(wishlisted.has(place.id) ? 'Removed from trip plan' : 'Saved to trip plan ♥');
          }
          if (focusedCta === 'more') { setFlyoutOpen(true); setFlyoutIdx(0); setZone('flyout'); }
        }
        return;
      }

      if (zone === 'inputs') {
        if (k === 'ArrowLeft')  { e.preventDefault(); setPromptIdx(i => Math.max(0, i - 1)); }
        if (k === 'ArrowRight') { e.preventDefault(); setPromptIdx(i => Math.min(prompts.length - 1, i + 1)); }
        if (k === 'ArrowUp')    { e.preventDefault(); setZone('cta'); }
        return;
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [introDone, zone, tabIdx, cardIdx, navDir, ctaIdx, flyoutIdx, flyoutOpen, qrOpen, promptIdx, place.id, wishlisted, items.length, tabs.length, prompts.length]);

  const ctaOrder     = TravelCtaOrder[navDir];
  const focusedCtaId = zone === 'cta' ? ctaOrder[ctaIdx] : null;
  const ctaFocused   = (id: TravelCtaId) => focusedCtaId === id;

  const renderCardBody = (p: TravelItem, dir: TravelNavDir, interactive: boolean) => {
    const order = TravelCtaOrder[dir];
    return (
      <>
        <div style={{ position: 'absolute', top: 16, left: 15, width: 370, height: EXP_H - 40, borderRadius: 20, border: '1px solid rgba(255,255,255,0.2)', overflow: 'hidden', background: '#111' }}>
          <img src={p.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 384, width: 492, boxSizing: 'border-box', padding: '32px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src="/images/l1/pin.svg" alt="" style={{ width: 32, height: 32 }} />
              <span style={{ fontSize: 22, lineHeight: '28px', fontWeight: 500, fontFamily: 'Inter,sans-serif' }}>{p.agentLabel}</span>
            </div>
            <p style={{ fontSize: 24, lineHeight: '36px', fontWeight: 500, color: 'rgba(255,255,255,0.8)', margin: 0, fontFamily: 'Inter,sans-serif' }}>{p.agentNote}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {p.rating != null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#ffba71', fontSize: 20, lineHeight: '24px', fontWeight: 600, fontFamily: 'Inter,sans-serif', textTransform: 'uppercase' }}>{p.rating}</span>
                  <img src="/images/l1/star.svg" alt="" style={{ width: 24, height: 24 }} />
                  {p.ratingCount && <span style={{ color: '#ffba71', fontSize: 20, lineHeight: '24px', fontWeight: 600, fontFamily: 'Inter,sans-serif', textTransform: 'uppercase' }}>({p.ratingCount} reviews)</span>}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ fontSize: 32, fontWeight: 600, lineHeight: '44px', margin: 0, overflow: 'hidden' }}>{p.name}</p>
                <p style={{ fontSize: 24, fontWeight: 600, lineHeight: '32px', margin: 0, opacity: p.price ? 1 : 0.7 }}>{p.price ?? p.area}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, height: 64, pointerEvents: interactive ? 'auto' : 'none' }}>
              {order.map((id) => {
                const focused = interactive && ctaFocused(id);

                if (id === 'more') return (
                  <div key="more" onClick={interactive ? () => { setFlyoutOpen(true); setFlyoutIdx(0); setZone('flyout'); } : undefined}
                    style={{
                      width: 64, height: 64, borderRadius: 32, flexShrink: 0,
                      background: focused ? '#fff' : 'rgba(255,255,255,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: focused ? '0 0 0 2.5px rgba(255,255,255,0.8)' : 'none',
                      transition: 'all 0.15s ease', cursor: interactive ? 'pointer' : 'default', position: 'relative',
                    }}>
                    <DotsIcon color={focused ? '#111' : '#fff'} />
                    {interactive && flyoutOpen && (
                      <div style={{
                        position: 'absolute', bottom: 74,
                        ...(dir === 'right' ? { left: 0 } : { right: 0 }),
                        background: 'rgba(16,16,16,0.97)', backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20,
                        padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 4,
                        boxShadow: '0 -12px 40px rgba(0,0,0,0.8)', animation: 'l1s-fadeDown 0.18s ease',
                        minWidth: 210, zIndex: 20, pointerEvents: 'none',
                      }}>
                        {TravelFlyoutItems.map((item, fi) => (
                          <div key={item.id} style={{
                            padding: '12px 20px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 12,
                            fontSize: 17, fontWeight: 600,
                            background: flyoutIdx === fi ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.06)',
                            color: flyoutIdx === fi ? '#111' : '#ccc',
                            transition: 'all 0.12s ease',
                          }}>
                            <span style={{ fontSize: 18 }}>{item.icon}</span>
                            <span>{item.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );

                if (id === 'wishlist') return (
                  <div key="wishlist" onClick={interactive ? () => {
                    setWishlisted(s => { const n = new Set(s); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n; });
                    showToast(wishlisted.has(p.id) ? 'Removed from trip plan' : 'Saved to trip plan ♥');
                  } : undefined} style={{
                    width: 64, height: 64, borderRadius: 32, flexShrink: 0,
                    background: focused ? '#fff' : 'rgba(255,255,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: focused ? '0 0 0 2.5px rgba(255,255,255,0.8)' : 'none',
                    transition: 'all 0.15s ease', cursor: interactive ? 'pointer' : 'default',
                  }}>
                    <HeartIcon
                      stroke={wishlisted.has(p.id) ? (focused ? '#e63' : '#f87') : (focused ? '#111' : '#fff')}
                      fill={wishlisted.has(p.id) ? (focused ? '#e63' : '#f87') : 'none'}
                    />
                  </div>
                );

                return (
                  <div key="maps" onClick={interactive ? () => { setQrOpen(true); setZone('qrModal'); } : undefined}
                    style={{
                      flex: 1, height: 64, borderRadius: 32,
                      background: focused ? '#ffffff' : 'rgba(255,255,255,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, lineHeight: '32px',
                      fontWeight: focused ? 700 : 500, fontFamily: 'Inter,sans-serif',
                      color: focused ? '#000' : '#fff', letterSpacing: '0.22px',
                      boxShadow: focused
                        ? '0 8px 20px rgba(0,0,0,0.12), 0 0 0 3px rgba(255,255,255,0.5)'
                        : '0 8px 40px rgba(0,0,0,0.12)',
                      transition: 'all 0.15s ease', cursor: interactive ? 'pointer' : 'default',
                    }}>
                    {p.ctaLabel}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderCollapsedCard = (p: TravelItem, opts: { dim?: boolean; onClick?: () => void } = {}) => (
    <div key={p.id} style={{
      width: COL_W, height: COL_H, flexShrink: 0, borderRadius: 32, overflow: 'hidden',
      position: 'relative', background: '#141414', boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
      opacity: opts.dim ? 0.5 : 1, transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.45s ease',
      cursor: opts.onClick ? 'pointer' : 'default',
    }} onClick={opts.onClick}>
      <img src={p.photo} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.1)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 104, background: 'linear-gradient(to bottom, rgba(20,20,20,0.5), transparent)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 242, background: 'linear-gradient(to bottom, rgba(20,20,20,0), #141414)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 20, left: 20, right: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <img src="/images/l1/pin.svg" alt="" style={{ width: 32, height: 32 }} />
        <span style={{ fontSize: 22, lineHeight: '28px', fontWeight: 500, fontFamily: 'Inter,sans-serif' }}>{p.agentLabel}</span>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {p.rating != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#ffba71', fontSize: 22, lineHeight: '24px', fontWeight: 600, fontFamily: 'Inter,sans-serif' }}>{p.rating}</span>
            <img src="/images/l1/star.svg" alt="" style={{ width: 24, height: 24 }} />
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 32, fontWeight: 500, lineHeight: '44px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
          <p style={{ fontSize: 24, fontWeight: 600, lineHeight: '32px', margin: 0, opacity: 0.7 }}>{p.price ?? p.area}</p>
        </div>
      </div>
      <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 20px rgba(255,255,255,0.3)', borderRadius: 30, pointerEvents: 'none' }} />
    </div>
  );

  return (
    <>
      <AgentIntro
        text={agentLine}
        typingStarted={typingStarted} onDone={onTypingDone}
        highlighted={introDone && zone === 'intro'}
      />

      {phase >= PHASE.STRUCTURE && (
        <div style={{ position: 'absolute', top: TABS_TOP, left: L_PAD - 28, right: 120, zIndex: 6, animation: 'l1s-fadeUp 0.35s ease both' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, background: 'rgba(255,255,255,0.14)' }} />
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, position: 'relative' }}>
            {tabs.map((t, i) => {
              const active  = tabIdx === i;
              const focused = introDone && zone === 'tabs' && active;
              return (
                <span key={t.id} onClick={introDone ? () => { switchTab(i); setZone('tabs'); } : undefined} style={{
                  position: 'relative', padding: '16px 28px',
                  borderRadius: active ? '18px 18px 0 0' : 0,
                  background: active ? 'rgba(255,255,255,0.14)' : 'transparent',
                  backdropFilter: active ? 'blur(20px)' : 'none',
                  boxShadow: focused ? 'inset 0 0 0 1.5px rgba(255,255,255,0.5)' : 'none',
                  fontSize: 26, lineHeight: '32px', fontWeight: active ? 600 : 400,
                  fontFamily: 'Inter,sans-serif', color: active ? '#fff' : 'rgba(255,255,255,0.45)',
                  whiteSpace: 'nowrap', cursor: introDone ? 'pointer' : 'default',
                  transition: 'all 0.25s ease',
                }}>{t.label}</span>
              );
            })}
          </div>
        </div>
      )}

      {phase >= PHASE.CONTENT && (
        <div style={{
          position: 'absolute', top: CARD_TOP_TABS, left: 0, height: EXP_H, display: 'flex', alignItems: 'center',
          transform: `translateX(${railShift}px)`, transition: 'transform 0.65s cubic-bezier(0.16,1,0.3,1)', willChange: 'transform', zIndex: 4,
        }}>
          {tabs.map((t, ti) => (
            <Fragment key={t.id}>
              {ti > 0 && <div style={{ width: TRAVEL_SECTION_GAP, flexShrink: 0 }} />}
              <div style={{ display: 'flex', alignItems: 'center', gap: CARD_G }}>
                {tabItems[t.id].map((p, i) => {
                  const isFocused = introDone && tabIdx === ti && cardIdx === i && (zone === 'cta' || zone === 'flyout' || zone === 'qrModal');
                  if (isFocused) {
                    return (
                      <div key={p.id} style={{
                        width: EXP_W, height: EXP_H, flexShrink: 0, borderRadius: 32, overflow: 'hidden',
                        position: 'relative', background: '#1a1a1a',
                        border: zone === 'cta' || zone === 'flyout' ? '4px solid #fff' : '4px solid rgba(255,255,255,0.5)',
                        boxShadow: '0 30px 40px rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.3)',
                        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                      }}>
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.1)', pointerEvents: 'none', zIndex: 1 }} />
                        <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 20px rgba(255,255,255,0.3)', pointerEvents: 'none', zIndex: 2 }} />
                        {renderCardBody(p, navDir, true)}
                      </div>
                    );
                  }
                  return renderCollapsedCard(p, {
                    dim: tabIdx !== ti,
                    onClick: introDone ? () => { setTabIdx(ti); setCardIdx(i); setZone('cta'); } : undefined,
                  });
                })}
              </div>
            </Fragment>
          ))}
        </div>
      )}

      {phase >= PHASE.CONTENT && nextSectionFirstItem && (
        <div style={{ position: 'absolute', top: CARD_TOP_TABS + (EXP_H - COL_H) / 2, left: W - COL_W / 2, zIndex: 4 }}>
          {renderCollapsedCard(nextSectionFirstItem, {
            dim: true,
            onClick: introDone ? () => { setTabIdx(tabIdx + 1); setCardIdx(0); setZone('cta'); } : undefined,
          })}
        </div>
      )}

      <PromptRow prompts={prompts} visible={phase >= PHASE.PROMPTS} activeIdx={introDone && zone === 'inputs' ? promptIdx : null} />

      {qrOpen && (
        <>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', zIndex: 60, animation: 'l1s-fadeIn 0.3s ease both' }} />
          <div style={{ position: 'absolute', inset: 0, zIndex: 61, animation: 'l1s-slideInRight 0.45s cubic-bezier(0.22,1,0.36,1) both', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', top: -102, right: -92, width: 1232, height: 1284, zIndex: 61 }}>
              <img src="/images/l1/qr-panel.svg" alt="" style={{ width: '100%', height: '100%', display: 'block' }} />
            </div>
            <div onClick={() => { setQrOpen(false); setZone('cta'); }} style={{
              position: 'absolute', left: 772, top: '50%', transform: 'translateY(-50%)',
              width: 80, height: 80, borderRadius: '50%', boxSizing: 'border-box',
              background: '#fff', border: '2px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 63, cursor: 'pointer', pointerEvents: 'auto',
            }}>
              <img src="/images/l1/close-x.svg" alt="close" style={{ width: 40, height: 40 }} />
            </div>
            <div style={{ position: 'absolute', left: 1095, top: 130, width: 623, zIndex: 62, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
              <p style={{ fontSize: 48, lineHeight: '64px', fontWeight: 600, color: '#fff', margin: 0 }}>{place.ctaModalTitle}</p>
              <p style={{ fontSize: 24, fontWeight: 500, color: 'rgba(255,255,255,0.8)', letterSpacing: '-0.24px', margin: 0, fontFamily: 'Inter,sans-serif' }}>{place.ctaModalSubtitle}</p>
            </div>
            <div style={{ position: 'absolute', left: 1176, top: '50%', transform: 'translateY(-50%)', width: 460, height: 460, zIndex: 62 }}>
              <img src="/images/l1/qr-blob.svg" alt="" style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 557, height: 557, maxWidth: 'none' }} />
              <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>
                <QRCodeSVG value={place.mapsUrl} size={330} bgColor="transparent" fgColor="#111" level="H" imageSettings={{ src: '/images/l1/cp-logo.svg', width: 88, height: 88, excavate: true }} />
              </div>
            </div>
            <div style={{ position: 'absolute', left: 1211, top: 834, width: 390, zIndex: 62, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 120, height: 140, borderRadius: 16, flexShrink: 0, overflow: 'hidden', border: '1.4px solid rgba(255,255,255,0.2)', boxSizing: 'border-box' }}>
                <img src={place.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
                {place.rating != null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <img src="/images/l1/star.svg" alt="" style={{ width: 20, height: 20 }} />
                    <span style={{ color: '#ffba71', fontSize: 18, lineHeight: '20px', fontWeight: 600, fontFamily: 'Inter,sans-serif', textTransform: 'uppercase' }}>
                      {place.rating}{place.ratingCount ? ` (${place.ratingCount} reviews)` : ''}
                    </span>
                  </div>
                )}
                <p style={{ fontSize: 22, fontWeight: 500, color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.22px', margin: 0, fontFamily: "'Manrope','Plus Jakarta Sans',sans-serif" }}>{place.name}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {toast && (
        <div style={{
          position: 'absolute', bottom: 160, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(18,18,18,0.96)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999,
          padding: '12px 28px', fontSize: 16, fontWeight: 600, color: '#e8e8e8',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)', animation: 'l1s-toastIn 0.18s ease', zIndex: 70, whiteSpace: 'nowrap',
        }}>{toast}</div>
      )}
    </>
  );
}

/* ─── Scenario 3 — Text Only ─────────────────────────────────────────────
   A long-form reading surface that composes in place, not a pre-sized card.
   The agent's spoken line IS the document's opening heading (typed next to
   the mascot) — once typing finishes, the rest of the recipe composes
   underneath it block by block (intro → subheading → each bullet →
   closing), each one resolving with the same character reveal as the
   heading. There is NO visible container while this fits within
   TEXT_CARD_MAX_HEIGHT — text just grows on the page. Only once the content
   hits that cap does a bordered/backed reading surface fade in around it;
   from that point the surface locks at max height, a scrollbar fades in,
   and it auto-follows the newest line so the still-generating text is never
   pushed out of view. Once the whole response has composed, the follow
   scroll simply stops where it is — no separate demo pass — and a beat
   later the reading-surface focus ring appears and manual UP/DOWN unlocks.
   Manual scroll hands focus back to the header / on to the prompt row only
   once the user has actually reached the top/bottom. ── */
type TextZone = 'intro' | 'reading' | 'inputs';

export function TextOnlyScenario({ data }: { data?: L1TextOnlyData } = {}) {
  const heading = data?.heading ?? RAMEN_HEADING;
  const blocks = data?.blocks ?? DEFAULT_TEXT_BLOCKS;
  const prompts = data?.prompts ?? TEXT_PROMPTS;

  const { typingStarted, onTypingDone } = useIntroSequence();

  // -1 = only the heading exists so far; 0..blocks.length-1 = that many
  // body blocks have started revealing; >= blocks.length = fully composed.
  const [bodyIdx, setBodyIdx] = useState(-1);
  // Flips once the content has grown to fill TEXT_CARD_MAX_HEIGHT — this is
  // what introduces the card chrome, the scrollbar, and the follow-scroll.
  const [capped, setCapped] = useState(false);
  const [interactionEnabled, setInteractionEnabled] = useState(false);
  const [zone, setZone] = useState<TextZone>('reading');
  const [promptIdx, setPromptIdx] = useState(0);
  const [scrollPct, setScrollPct] = useState(0);
  const [viewportRatio, setViewportRatio] = useState(1);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fullyComposed = bodyIdx >= blocks.length;

  const handleTypingDone = () => { setBodyIdx(0); onTypingDone(); };
  // Each block only advances the sequence once — guards against a block
  // whose onDone fires again after a later block has already taken over.
  const advanceBody = (i: number) => setBodyIdx(prev => (prev === i ? i + 1 : prev));

  // Detect the moment content reaches the max reading height. Before this,
  // the reading div is left at height:auto (see JSX) so it just grows with
  // the page — nothing here needs to size it. scrollHeight always reflects
  // full content regardless of the current overflow/height mode.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const contentH = el.scrollHeight;
    setViewportRatio(contentH > 0 ? Math.min(1, TEXT_CARD_MAX_HEIGHT / contentH) : 1);
    if (contentH >= TEXT_CARD_MAX_HEIGHT) setCapped(true);
  }, [bodyIdx]);

  // Once capped, keep the newest/active line in view as more blocks mount —
  // this runs again right as `capped` flips true (once the surface has
  // actually locked to its final height in the DOM), and again on every
  // later block while the response is still generating.
  useLayoutEffect(() => {
    if (!capped) return;
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    if (max <= 0) return;
    if (bodyIdx < blocks.length) {
      el.scrollTo({ top: max, behavior: 'smooth' });
    }
  }, [bodyIdx, capped, blocks.length]);

  // Fully composed → the follow-scroll above naturally stops (bodyIdx no
  // longer changes) → after a short settle beat, unlock focus + manual scroll.
  useEffect(() => {
    if (!fullyComposed) return;
    const t = setTimeout(() => setInteractionEnabled(true), INTERACTION_DELAY_MS);
    return () => clearTimeout(t);
  }, [fullyComposed]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setScrollPct(max > 0 ? el.scrollTop / max : 0);
  };

  // Manual navigation only unlocks once the response has fully composed and settled.
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (!interactionEnabled) return; // ignore all input while generating/auto-following
      const el = scrollRef.current;

      if (zone === 'intro') {
        if (e.key === 'ArrowDown') { e.preventDefault(); setZone('reading'); }
        return;
      }

      if (zone === 'reading') {
        if (!el) return;
        const max = el.scrollHeight - el.clientHeight;
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (el.scrollTop <= 0) { setZone('intro'); return; }
          el.scrollTop = Math.max(0, el.scrollTop - MANUAL_SCROLL_STEP_PX);
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (el.scrollTop >= max - 1) { setZone('inputs'); setPromptIdx(0); return; }
          el.scrollTop = Math.min(max, el.scrollTop + MANUAL_SCROLL_STEP_PX);
        }
        return;
      }

      // zone === 'inputs'
      if (e.key === 'ArrowRight') { e.preventDefault(); setPromptIdx(i => Math.min(prompts.length - 1, i + 1)); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); setPromptIdx(i => Math.max(0, i - 1)); }
      if (e.key === 'ArrowUp')    { e.preventDefault(); setZone('reading'); }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [interactionEnabled, zone, prompts.length]);

  const trackH  = TEXT_CARD_MAX_HEIGHT - 48;
  const thumbH  = Math.max(28, trackH * viewportRatio);
  const thumbTop = (trackH - thumbH) * scrollPct;
  const focused = interactionEnabled && zone === 'reading';

  return (
    <>
      <div style={{
        position: 'absolute', top: AGENT_TOP, left: 72, width: 80, height: 80, zIndex: 5, borderRadius: '50%',
        animation: 'l1s-mascotIn 0.28s ease both',
        boxShadow: zone === 'intro' ? '0 0 0 3px rgba(255,255,255,0.35)' : 'none',
        transition: 'box-shadow 0.2s ease',
      }}>
        <img src="/images/l1/mascot.png" alt="" style={{
          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
          width: 161, height: 163, maxWidth: 'none',
        }} />
      </div>

      {/* Reading surface — no chrome at all while growing (height:auto, text
         just sits on the page). Once content hits TEXT_CARD_MAX_HEIGHT the
         height locks immediately (no grow animation) and the background/
         border/shadow fade in around what's already there. Focus ring is
         deliberately louder than the rest of the chrome and only appears
         once the response has fully finished composing. */}
      <div style={{
        position: 'absolute', top: TEXT_CARD_TOP, left: TEXT_CARD_LEFT, width: TEXT_CARD_WIDTH,
        height: capped ? TEXT_CARD_MAX_HEIGHT : 'auto',
        zIndex: 5, borderRadius: 28, overflow: 'hidden',
        border: focused
          ? '3px solid rgba(255,255,255,0.95)'
          : capped ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
        background: focused ? 'rgba(255,255,255,0.06)' : capped ? 'rgba(255,255,255,0.045)' : 'transparent',
        backdropFilter: capped ? 'blur(20px)' : 'none',
        boxShadow: focused
          ? '0 0 0 2px rgba(255,255,255,0.55), 0 0 32px 8px rgba(255,255,255,0.22), 0 0 64px 20px rgba(200,180,255,0.16), 0 30px 60px rgba(0,0,0,0.4)'
          : capped ? '0 30px 60px rgba(0,0,0,0.35)' : 'none',
        transition: `background ${CHROME_FADE_MS}ms ease, border-color ${CHROME_FADE_MS}ms ease, backdrop-filter ${CHROME_FADE_MS}ms ease, box-shadow 0.2s ease`,
      }}>
        {/* custom scrollbar — track + thumb, synced to scroll position.
           Hidden entirely until the content actually reaches the cap, so it
           reads as a consequence of long content, not permanent chrome. */}
        <div style={{
          position: 'absolute', top: 24, bottom: 24, right: 18, width: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', zIndex: 2,
          opacity: capped ? 1 : 0, transition: 'opacity 0.35s ease',
        }} />
        <div style={{
          position: 'absolute', top: 24 + thumbTop, right: 18, width: 4, height: thumbH, borderRadius: 2,
          background: 'rgba(255,255,255,0.85)', zIndex: 3,
          opacity: capped ? 1 : 0,
          transition: 'top 0.12s linear, opacity 0.35s ease',
        }} />

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          onWheel={(e) => { if (!interactionEnabled) e.preventDefault(); }}
          className="l1s-noscrollbar"
          style={{
            height: capped ? '100%' : 'auto',
            padding: '40px 64px 40px 48px', boxSizing: 'border-box',
            overflowY: 'auto', scrollBehavior: 'smooth',
          }}
        >
          <p style={{ fontSize: 28, lineHeight: '40px', fontWeight: 600, color: '#fff', margin: '0 0 28px 0' }}>
            <GlanceTextReveal text={heading} playing={typingStarted} resolvedOpacity={0.98} resolveMs={TEXT_ONLY_HEADING_RESOLVE_MS} charDuration={TEXT_ONLY_HEADING_CHAR_MS} onDone={handleTypingDone} />
          </p>

          <TextBlockSequence blocks={blocks} bodyIdx={bodyIdx} advanceBody={advanceBody} />
        </div>
      </div>

      <PromptRow prompts={prompts} visible={fullyComposed} activeIdx={interactionEnabled && zone === 'inputs' ? promptIdx : null} />
    </>
  );
}

/** The block-by-block reveal sequence shared by Text Only and Text +
 *  Carousel. Same per-kind treatment the approved Figma content used: `p`
 *  paragraphs, `sub` subheadings, `bullet` runs grouped into one list. A `p`
 *  that directly follows a bullet run takes the closing-line treatment
 *  (top-margined, fast resolve) — that is exactly what the original closing
 *  line was. */
function TextBlockSequence({
  blocks,
  bodyIdx,
  advanceBody,
  maxWidth,
  renderCarousel,
}: {
  blocks: L1TextCarouselBlock[];
  bodyIdx: number;
  advanceBody: (i: number) => void;
  maxWidth?: number;
  /** Only supplied by Text + Carousel — renders the inline card rail for a
   *  `carousel` block. Text Only never passes one (and never has the block). */
  renderCarousel?: () => React.ReactNode;
}) {
  return (
    <>
      {blocks.map((blk, idx) => {
        if (bodyIdx < idx) return null;

        if (blk.kind === 'carousel') {
          return <Fragment key={idx}>{renderCarousel?.()}</Fragment>;
        }

        if (blk.kind === 'bullet') {
          // The whole contiguous bullet run renders as ONE list, emitted at
          // the run's first index; later bullets are rows inside it.
          if (idx > 0 && blocks[idx - 1].kind === 'bullet') return null;
          const run: Array<{ text: string; blockIdx: number }> = [];
          for (let j = idx; j < blocks.length && blocks[j].kind === 'bullet'; j++) {
            run.push({ text: (blocks[j] as L1TextBlock).text, blockIdx: j });
          }
          return (
            <ul key={idx} style={{ maxWidth, margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {run.map(({ text, blockIdx }) => {
                if (bodyIdx < blockIdx) return null;
                return (
                  <li key={blockIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, fontSize: 22, lineHeight: '32px', color: 'rgba(255,255,255,0.85)' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.5)', marginTop: 14, flexShrink: 0 }} />
                    <span><GlanceTextReveal text={text} playing resolvedOpacity={0.9} resolveMs={BODY_RESOLVE_MS.bullet} charDuration={BODY_CHAR_DURATION.bullet} onDone={() => advanceBody(blockIdx)} /></span>
                  </li>
                );
              })}
            </ul>
          );
        }

        if (blk.kind === 'sub') {
          return (
            <p key={idx} style={{ maxWidth, fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 20px 0' }}>
              <GlanceTextReveal text={blk.text} playing resolvedOpacity={0.98} resolveMs={BODY_RESOLVE_MS.sub} charDuration={BODY_CHAR_DURATION.sub} onDone={() => advanceBody(idx)} />
            </p>
          );
        }

        const followsBullets = idx > 0 && blocks[idx - 1].kind === 'bullet';
        return (
          <p key={idx} style={{ maxWidth, fontSize: 22, lineHeight: '34px', color: 'rgba(255,255,255,0.75)', margin: followsBullets ? '32px 0 0 0' : '0 0 32px 0' }}>
            <GlanceTextReveal
              text={blk.text}
              playing
              resolvedOpacity={0.85}
              resolveMs={followsBullets ? BODY_RESOLVE_MS.closing : BODY_RESOLVE_MS.p}
              charDuration={followsBullets ? BODY_CHAR_DURATION.closing : BODY_CHAR_DURATION.p}
              onDone={() => advanceBody(idx)}
            />
          </p>
        );
      })}
    </>
  );
}

/* ─── Scenario 4 — Text + Carousel ────────────────────────────────────────
   Identical reading-surface behavior to Text Only (no-chrome growth → chrome
   fades in at the height cap → follow-scroll while generating → focus after
   completion), plus the FoodPlaces carousel itself — same content, same
   collapsed/expand-in-place rail, same CTA-mirroring/flyout/QR-modal
   navigation as /food-l1 (reused via the same imports CardsScenario uses,
   not re-approximated) — living inline in the scroll between the
   ingredients and one more paragraph that resumes after it. Three things
   are unique to this variant:
   1. Width — the surface starts at the normal reading width and widens once
      (locks, doesn't animate back) the moment the carousel block starts
      revealing, to give the cards room. Paragraph/bullet text is pinned to
      TEXT_MEASURE_WIDTH throughout so the extra width never affects line
      length — only the carousel row (and the surface chrome) uses it.
   2. Focus — the carousel isn't reached via an explicit "enter" press. An
      IntersectionObserver on the carousel row (scoped to the reading
      surface as root) flips `carouselInView` on/off purely from scroll
      position, active only once `interactionEnabled`. While it's in view,
      the focused card/CTA gets the strong ring and the outer surface ring
      dims to a secondary state instead of turning off — and that check is
      re-evaluated against `zone` too, so the moment focus moves on to the
      prompt row the card ring actually clears instead of both being lit.
   3. UP/DOWN always keep scrolling the page, even mid-browse — leaving the
      carousel's visible range is what hands focus back to the surface, not
      a key. The qrOpen/flyoutOpen overlays are the only things that fully
      capture the keyboard, exactly like on /food-l1. ── */
export function TextCarouselScenario({ data }: { data?: L1TextCarouselData } = {}) {
  const heading = data?.heading ?? RAMEN_HEADING;
  const blocks = data?.blocks ?? DEFAULT_TC_BLOCKS;
  const places = data?.places ?? (FoodPlaces as L1CardItem[]);
  const prompts = data?.prompts ?? TEXT_PROMPTS;
  const carouselIdx = blocks.findIndex((b) => b.kind === 'carousel');

  const { typingStarted, onTypingDone } = useIntroSequence();

  const [bodyIdx, setBodyIdx] = useState(-1);
  const [capped, setCapped] = useState(false);
  const [widened, setWidened] = useState(false);
  const [interactionEnabled, setInteractionEnabled] = useState(false);
  const [zone, setZone] = useState<TextZone>('reading');
  const [promptIdx, setPromptIdx] = useState(0);
  const [scrollPct, setScrollPct] = useState(0);
  const [viewportRatio, setViewportRatio] = useState(1);
  const [carouselInView, setCarouselInView] = useState(false);

  // Same state shape as CardsScenario — this carousel IS the /food-l1 rail,
  // reused wholesale rather than re-approximated.
  const [carouselCardIdx, setCarouselCardIdx] = useState(0);
  const [navDir, setNavDir] = useState<FoodNavDir>('right');
  const [ctaIdx, setCtaIdx] = useState(FoodPrimaryIdx.right);
  const [flyoutIdx, setFlyoutIdx] = useState(0);
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [wishlisted, setWishlisted] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const fullyComposed = bodyIdx >= blocks.length;
  const place = places[carouselCardIdx];

  const handleTypingDone = () => { setBodyIdx(0); onTypingDone(); };
  const advanceBody = (i: number) => setBodyIdx(prev => (prev === i ? i + 1 : prev));

  const showToast = (msg: string) => {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast(msg);
    toastRef.current = setTimeout(() => setToast(null), 2200);
  };
  useEffect(() => () => { if (toastRef.current) clearTimeout(toastRef.current); }, []);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const contentH = el.scrollHeight;
    setViewportRatio(contentH > 0 ? Math.min(1, TEXT_CARD_MAX_HEIGHT / contentH) : 1);
    if (contentH >= TEXT_CARD_MAX_HEIGHT) setCapped(true);
  }, [bodyIdx]);

  // Widen the moment the carousel becomes the active block — locks in and
  // never narrows back, same "grows and stays" pattern as the height cap.
  useEffect(() => {
    if (carouselIdx >= 0 && bodyIdx >= carouselIdx) setWidened(true);
  }, [bodyIdx, carouselIdx]);

  // The carousel isn't text, so there's no GlanceTextReveal onDone to chain
  // off — it just holds the sequence for a fixed beat while it fades in.
  useEffect(() => {
    if (carouselIdx < 0 || bodyIdx !== carouselIdx) return;
    const t = setTimeout(() => advanceBody(carouselIdx), CAROUSEL_REVEAL_MS);
    return () => clearTimeout(t);
  }, [bodyIdx, carouselIdx]);

  useLayoutEffect(() => {
    if (!capped) return;
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    if (max <= 0) return;
    if (bodyIdx < blocks.length) {
      el.scrollTo({ top: max, behavior: 'smooth' });
    }
  }, [bodyIdx, capped, blocks.length]);

  useEffect(() => {
    if (!fullyComposed) return;
    const t = setTimeout(() => setInteractionEnabled(true), INTERACTION_DELAY_MS);
    return () => clearTimeout(t);
  }, [fullyComposed]);

  // Purely scroll-position-driven: whenever the carousel row is meaningfully
  // visible inside the reading surface, it becomes the focus target — no
  // explicit "enter" keypress. Only active once interaction has unlocked.
  // The threshold (0.4) just decides *when* focus hands over; it doesn't
  // guarantee the whole row is in view, so the same moment focus lands we
  // also nudge the scroll to bring the full row into frame — the carousel
  // should never sit half-cut-off inside the surface while it's focused.
  useEffect(() => {
    if (!interactionEnabled) return;
    const root = scrollRef.current;
    const target = carouselRef.current;
    if (!root || !target) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setCarouselInView(entry.isIntersecting);
        if (entry.isIntersecting) {
          setCarouselCardIdx(0); setNavDir('right'); setCtaIdx(FoodPrimaryIdx.right);
          if (entry.rootBounds) {
            const t = entry.boundingClientRect;
            const r = entry.rootBounds;
            let delta = 0;
            if (t.bottom > r.bottom) delta = t.bottom - r.bottom + 24;
            else if (t.top < r.top) delta = t.top - r.top - 24;
            if (delta !== 0) root.scrollTo({ top: root.scrollTop + delta, behavior: 'smooth' });
          }
        }
      },
      { root, threshold: 0.4 }
    );
    io.observe(target);
    return () => io.disconnect();
  }, [interactionEnabled]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setScrollPct(max > 0 ? el.scrollTop / max : 0);
  };

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (!interactionEnabled) return;
      const el = scrollRef.current;

      // QR modal and the "more" flyout fully capture the keyboard while
      // open — identical to /food-l1, nothing else responds until closed.
      if (qrOpen) { e.preventDefault(); setQrOpen(false); return; }

      if (flyoutOpen) {
        e.preventDefault();
        if (e.key === 'ArrowLeft')  setFlyoutIdx(i => Math.max(0, i - 1));
        if (e.key === 'ArrowRight') setFlyoutIdx(i => Math.min(FoodFlyoutItems.length - 1, i + 1));
        if (e.key === 'Enter') {
          const item = FoodFlyoutItems[flyoutIdx];
          if (item.id === 'like')     showToast('Liked ✓');
          if (item.id === 'dislike')  showToast('Got it — won\'t show similar');
          if (item.id === 'copyLink') showToast('Link copied ✓');
          if (item.id === 'report')   showToast('Reported — thanks');
          setFlyoutOpen(false);
        }
        if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'ArrowDown') {
          setFlyoutOpen(false);
        }
        return;
      }

      if (zone === 'intro') {
        if (e.key === 'ArrowDown') { e.preventDefault(); setZone('reading'); }
        return;
      }

      if (zone === 'reading') {
        if (!el) return;

        // The carousel owns LEFT/RIGHT/Enter while it's the visible focus
        // target — same CTA-mirroring model as Cards: LEFT/RIGHT walks the
        // CTA row first, and only crosses to the neighboring card once
        // you're already at its first/last CTA. UP/DOWN deliberately fall
        // through below — they keep scrolling the page even while browsing
        // cards, which is what carries the carousel out of view and hands
        // focus back to the surface.
        if (carouselInView) {
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            if (ctaIdx < 2) {
              setCtaIdx(i => i + 1);
            } else if (carouselCardIdx < places.length - 1) {
              setNavDir('right'); setCarouselCardIdx(i => i + 1); setCtaIdx(FoodPrimaryIdx.right);
            }
            return;
          }
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (ctaIdx > 0) {
              setCtaIdx(i => i - 1);
            } else if (carouselCardIdx > 0) {
              setNavDir('left'); setCarouselCardIdx(i => i - 1); setCtaIdx(FoodPrimaryIdx.left);
            }
            return;
          }
          if (e.key === 'Enter') {
            e.preventDefault();
            const focusedCta = FoodCtaOrder[navDir][ctaIdx];
            if (focusedCta === 'checkout') setQrOpen(true);
            if (focusedCta === 'wishlist') {
              setWishlisted(s => { const n = new Set(s); n.has(place.id) ? n.delete(place.id) : n.add(place.id); return n; });
              showToast(wishlisted.has(place.id) ? 'Removed from wishlist' : 'Added to wishlist ♥');
            }
            if (focusedCta === 'more') { setFlyoutOpen(true); setFlyoutIdx(0); }
            return;
          }
        }

        const max = el.scrollHeight - el.clientHeight;
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (el.scrollTop <= 0) { setZone('intro'); return; }
          el.scrollTop = Math.max(0, el.scrollTop - MANUAL_SCROLL_STEP_PX);
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (el.scrollTop >= max - 1) { setZone('inputs'); setPromptIdx(0); return; }
          el.scrollTop = Math.min(max, el.scrollTop + MANUAL_SCROLL_STEP_PX);
        }
        return;
      }

      // zone === 'inputs'
      if (e.key === 'ArrowRight') { e.preventDefault(); setPromptIdx(i => Math.min(prompts.length - 1, i + 1)); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); setPromptIdx(i => Math.max(0, i - 1)); }
      if (e.key === 'ArrowUp')    { e.preventDefault(); setZone('reading'); }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [interactionEnabled, zone, carouselInView, carouselCardIdx, navDir, ctaIdx, flyoutIdx, flyoutOpen, qrOpen, wishlisted, place.id, places.length, prompts.length]);

  const trackH  = TEXT_CARD_MAX_HEIGHT - 48;
  const thumbH  = Math.max(28, trackH * viewportRatio);
  const thumbTop = (trackH - thumbH) * scrollPct;

  // Only one focus target reads as "primary" at a time. Rather than dim the
  // surface's own chrome while the carousel holds focus, hide it outright —
  // border/background/blur all disappear, so nothing is left slicing across
  // a card at the edge and the carousel reads as the only highlighted thing
  // on screen. This only applies while the carousel is actually the thing
  // holding focus (zone === 'reading') — moving on to the prompt row still
  // has carouselInView true (scroll position hasn't changed), but the
  // surface should read as "still there" behind the prompts, not vanished,
  // so chrome comes back the moment zone leaves 'reading'.
  const carouselHasFocus   = zone === 'reading' && carouselInView;
  const containerFocused   = interactionEnabled && zone === 'reading';
  const containerFullFocus = containerFocused && !carouselHasFocus;
  const chromeVisible      = capped && !carouselHasFocus;

  const ctaOrder     = FoodCtaOrder[navDir];
  const focusedCtaId = carouselHasFocus ? ctaOrder[ctaIdx] : null;
  const ctaFocused   = (id: FoodCtaId) => focusedCtaId === id;

  return (
    <>
      <div style={{
        position: 'absolute', top: AGENT_TOP, left: 72, width: 80, height: 80, zIndex: 5, borderRadius: '50%',
        animation: 'l1s-mascotIn 0.28s ease both',
        boxShadow: zone === 'intro' ? '0 0 0 3px rgba(255,255,255,0.35)' : 'none',
        transition: 'box-shadow 0.2s ease',
      }}>
        <img src="/images/l1/mascot.png" alt="" style={{
          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
          width: 161, height: 163, maxWidth: 'none',
        }} />
      </div>

      <div style={{
        position: 'absolute', top: TEXT_CARD_TOP, left: TEXT_CARD_LEFT,
        width: widened ? TEXT_CARD_WIDE_WIDTH : TEXT_CARD_WIDTH,
        height: capped ? TEXT_CARD_MAX_HEIGHT : 'auto',
        zIndex: 5, borderRadius: 28, overflow: 'hidden',
        border: !chromeVisible
          ? '1px solid transparent'
          : containerFullFocus ? '3px solid rgba(255,255,255,0.95)' : '1px solid rgba(255,255,255,0.12)',
        background: !chromeVisible ? 'transparent' : containerFullFocus ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.045)',
        backdropFilter: chromeVisible ? 'blur(20px)' : 'none',
        boxShadow: !chromeVisible
          ? 'none'
          : containerFullFocus
          ? '0 0 0 2px rgba(255,255,255,0.55), 0 0 32px 8px rgba(255,255,255,0.22), 0 0 64px 20px rgba(200,180,255,0.16), 0 30px 60px rgba(0,0,0,0.4)'
          : '0 30px 60px rgba(0,0,0,0.35)',
        transition: `width ${WIDTH_GROW_MS}ms cubic-bezier(0.16,1,0.3,1), background ${CHROME_FADE_MS}ms ease, border-color ${CHROME_FADE_MS}ms ease, backdrop-filter ${CHROME_FADE_MS}ms ease, box-shadow 0.2s ease`,
      }}>
        <div style={{
          position: 'absolute', top: 24, bottom: 24, right: 18, width: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', zIndex: 2,
          opacity: capped ? 1 : 0, transition: 'opacity 0.35s ease',
        }} />
        <div style={{
          position: 'absolute', top: 24 + thumbTop, right: 18, width: 4, height: thumbH, borderRadius: 2,
          background: 'rgba(255,255,255,0.85)', zIndex: 3,
          opacity: capped ? 1 : 0,
          transition: 'top 0.12s linear, opacity 0.35s ease',
        }} />

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          onWheel={(e) => { if (!interactionEnabled) e.preventDefault(); }}
          className="l1s-noscrollbar"
          style={{
            height: capped ? '100%' : 'auto',
            padding: '40px 64px 40px 48px', boxSizing: 'border-box',
            overflowY: 'auto', scrollBehavior: 'smooth',
          }}
        >
          <p style={{ maxWidth: TEXT_MEASURE_WIDTH, fontSize: 28, lineHeight: '40px', fontWeight: 600, color: '#fff', margin: '0 0 28px 0' }}>
            <GlanceTextReveal text={heading} playing={typingStarted} resolvedOpacity={0.98} resolveMs={TEXT_ONLY_HEADING_RESOLVE_MS} charDuration={TEXT_ONLY_HEADING_CHAR_MS} onDone={handleTypingDone} />
          </p>

          <TextBlockSequence blocks={blocks} bodyIdx={bodyIdx} advanceBody={advanceBody} maxWidth={TEXT_MEASURE_WIDTH} renderCarousel={() => (
            <div style={{ margin: '8px 0 32px 0', animation: 'l1s-fadeUp 0.5s ease both' }}>
              {/* Viewport clips the rail — narrower than /food-l1's full-screen
                 rail since this one is nested in the reading column. The
                 IntersectionObserver watches this element. */}
              <div ref={carouselRef} style={{ width: CAROUSEL_VIEWPORT_W, height: CAROUSEL_VIEWPORT_H, overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: CARD_G, position: 'absolute', left: 0, top: 0,
                  transform: `translateX(${-(carouselCardIdx * (COL_W + CARD_G))}px)`,
                  transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1)',
                }}>
                  {places.map((p, i) => {
                    // Bug fix: the carousel must not keep showing card focus once
                    // the zone has moved on (e.g. to the prompt row) — carouselInView
                    // alone isn't enough since scroll position can still overlap it.
                    const isFocused = carouselHasFocus && carouselCardIdx === i;

                    if (isFocused) {
                      return (
                        <div key={p.id} style={{
                          width: EXP_W, height: EXP_H, flexShrink: 0, borderRadius: 32, overflow: 'hidden',
                          position: 'relative', background: '#1a1a1a',
                          border: '4px solid #fff',
                          boxShadow: '0 30px 40px rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.3)',
                          transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                        }}>
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.1)', borderRadius: 28, pointerEvents: 'none', zIndex: 1 }} />
                          <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 20px rgba(255,255,255,0.3)', borderRadius: 28, pointerEvents: 'none', zIndex: 2 }} />

                          <div style={{ position: 'absolute', top: 16, left: 15, width: 370, height: 463, borderRadius: 20, border: '1px solid rgba(255,255,255,0.2)', overflow: 'hidden', background: '#111' }}>
                            <img src={p.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          </div>

                          <div style={{
                            position: 'absolute', top: 0, bottom: 0, left: 384, width: 492,
                            boxSizing: 'border-box', padding: '32px 24px',
                            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                            animation: 'l1s-fadeUp 0.4s ease both',
                          }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <img src="/images/l1/pin.svg" alt="" style={{ width: 32, height: 32 }} />
                                <span style={{ fontSize: 22, lineHeight: '28px', fontWeight: 500, fontFamily: 'Inter,sans-serif' }}>{p.agentLabel}</span>
                              </div>
                              <p style={{ fontSize: 24, lineHeight: '36px', fontWeight: 500, color: 'rgba(255,255,255,0.8)', margin: 0, fontFamily: 'Inter,sans-serif' }}>{p.agentNote}</p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {p.rating != null && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ color: '#ffba71', fontSize: 20, lineHeight: '24px', fontWeight: 600, fontFamily: 'Inter,sans-serif', textTransform: 'uppercase' }}>{p.rating}</span>
                                    <img src="/images/l1/star.svg" alt="" style={{ width: 24, height: 24 }} />
                                    {p.ratingCount && <span style={{ color: '#ffba71', fontSize: 20, lineHeight: '24px', fontWeight: 600, fontFamily: 'Inter,sans-serif', textTransform: 'uppercase' }}>({p.ratingCount} reviews)</span>}
                                  </div>
                                )}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                  <p style={{ fontSize: 32, fontWeight: 600, lineHeight: '44px', margin: 0, overflow: 'hidden' }}>{p.name}</p>
                                  <p style={{ fontSize: 24, fontWeight: 600, lineHeight: '32px', margin: 0 }}>{p.price ?? p.area}</p>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 11, height: 64 }}>
                                {ctaOrder.map((id) => {
                                  const focused = ctaFocused(id);

                                  if (id === 'more') return (
                                    <div key="more" style={{
                                      width: 64, height: 64, borderRadius: 32, flexShrink: 0,
                                      background: focused ? '#fff' : 'rgba(255,255,255,0.15)',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      boxShadow: focused ? '0 0 0 2.5px rgba(255,255,255,0.8)' : 'none',
                                      transition: 'all 0.15s ease', position: 'relative',
                                    }}>
                                      <DotsIcon color={focused ? '#111' : '#fff'} />
                                      {flyoutOpen && (
                                        <div style={{
                                          position: 'absolute', bottom: 74,
                                          ...(navDir === 'right' ? { left: 0 } : { right: 0 }),
                                          background: 'rgba(16,16,16,0.97)', backdropFilter: 'blur(20px)',
                                          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20,
                                          padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 4,
                                          boxShadow: '0 -12px 40px rgba(0,0,0,0.8)', animation: 'l1s-fadeDown 0.18s ease',
                                          minWidth: 210, zIndex: 20, pointerEvents: 'none',
                                        }}>
                                          {FoodFlyoutItems.map((item, fi) => (
                                            <div key={item.id} style={{
                                              padding: '12px 20px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 12,
                                              fontSize: 17, fontWeight: 600,
                                              background: flyoutIdx === fi ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.06)',
                                              color: flyoutIdx === fi ? '#111' : '#ccc',
                                              transition: 'all 0.12s ease',
                                            }}>
                                              <span style={{ fontSize: 18 }}>{item.icon}</span>
                                              <span>{item.label}</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );

                                  if (id === 'wishlist') return (
                                    <div key="wishlist" style={{
                                      width: 64, height: 64, borderRadius: 32, flexShrink: 0,
                                      background: focused ? '#fff' : 'rgba(255,255,255,0.15)',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      boxShadow: focused ? '0 0 0 2.5px rgba(255,255,255,0.8)' : 'none',
                                      transition: 'all 0.15s ease',
                                    }}>
                                      <HeartIcon stroke={wishlisted.has(p.id) ? '#f87' : (focused ? '#111' : '#fff')} fill="none" />
                                    </div>
                                  );

                                  return (
                                    <div key="checkout" style={{
                                      flex: 1, height: 64, borderRadius: 32,
                                      background: focused ? '#ffffff' : 'rgba(255,255,255,0.15)',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      fontSize: 22, lineHeight: '32px',
                                      fontWeight: focused ? 700 : 500, fontFamily: 'Inter,sans-serif',
                                      color: focused ? '#000' : '#fff', letterSpacing: '0.22px',
                                      boxShadow: focused
                                        ? '0 8px 20px rgba(0,0,0,0.12), 0 0 0 3px rgba(255,255,255,0.5)'
                                        : '0 8px 40px rgba(0,0,0,0.12)',
                                      transition: 'all 0.15s ease',
                                    }}>
                                      Check out
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={p.id} onClick={() => { setCarouselCardIdx(i); setNavDir('right'); setCtaIdx(FoodPrimaryIdx.right); }} style={{
                        width: COL_W, height: COL_H, flexShrink: 0, borderRadius: 32, overflow: 'hidden',
                        position: 'relative', background: '#141414', boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)', cursor: 'pointer',
                      }}>
                        <img src={p.photo} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.1)', pointerEvents: 'none' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', pointerEvents: 'none' }} />
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 104, background: 'linear-gradient(to bottom, rgba(20,20,20,0.5), transparent)', pointerEvents: 'none' }} />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 242, background: 'linear-gradient(to bottom, rgba(20,20,20,0), #141414)', pointerEvents: 'none' }} />
                        <div style={{ position: 'absolute', top: 20, left: 20, right: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <img src="/images/l1/pin.svg" alt="" style={{ width: 32, height: 32 }} />
                          <span style={{ fontSize: 22, lineHeight: '28px', fontWeight: 500, fontFamily: 'Inter,sans-serif' }}>{p.agentLabel}</span>
                        </div>
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
                          {p.rating != null && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ color: '#ffba71', fontSize: 22, lineHeight: '24px', fontWeight: 600, fontFamily: 'Inter,sans-serif' }}>{p.rating}</span>
                              <img src="/images/l1/star.svg" alt="" style={{ width: 24, height: 24 }} />
                            </div>
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <p style={{ fontSize: 32, fontWeight: 500, lineHeight: '44px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                            <p style={{ fontSize: 24, fontWeight: 600, lineHeight: '32px', margin: 0, opacity: 0.7 }}>{p.price ?? p.area}</p>
                          </div>
                        </div>
                        <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 20px rgba(255,255,255,0.3)', borderRadius: 30, pointerEvents: 'none' }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )} />
        </div>
      </div>

      <PromptRow prompts={prompts} visible={fullyComposed} activeIdx={interactionEnabled && zone === 'inputs' ? promptIdx : null} />

      {qrOpen && (
        <>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', zIndex: 60, animation: 'l1s-fadeIn 0.3s ease both' }} />
          <div style={{ position: 'absolute', inset: 0, zIndex: 61, animation: 'l1s-slideInRight 0.45s cubic-bezier(0.22,1,0.36,1) both', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', top: -102, right: -92, width: 1232, height: 1284, zIndex: 61 }}>
              <img src="/images/l1/qr-panel.svg" alt="" style={{ width: '100%', height: '100%', display: 'block' }} />
            </div>
            <div onClick={() => setQrOpen(false)} style={{
              position: 'absolute', left: 772, top: '50%', transform: 'translateY(-50%)',
              width: 80, height: 80, borderRadius: '50%', boxSizing: 'border-box',
              background: '#fff', border: '2px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 63, cursor: 'pointer', pointerEvents: 'auto',
            }}>
              <img src="/images/l1/close-x.svg" alt="close" style={{ width: 40, height: 40 }} />
            </div>
            <div style={{ position: 'absolute', left: 1095, top: 130, width: 623, zIndex: 62, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
              <p style={{ fontSize: 48, lineHeight: '64px', fontWeight: 600, color: '#fff', margin: 0 }}>Scan to Check Out</p>
              <p style={{ fontSize: 24, fontWeight: 500, color: 'rgba(255,255,255,0.8)', letterSpacing: '-0.24px', margin: 0, fontFamily: 'Inter,sans-serif' }}>
                You will be redirected to the brand&rsquo;s official page
              </p>
            </div>
            <div style={{ position: 'absolute', left: 1176, top: '50%', transform: 'translateY(-50%)', width: 460, height: 460, zIndex: 62 }}>
              <img src="/images/l1/qr-blob.svg" alt="" style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 557, height: 557, maxWidth: 'none' }} />
              <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>
                <QRCodeSVG value={place.mapsUrl} size={330} bgColor="transparent" fgColor="#111" level="H" imageSettings={{ src: '/images/l1/cp-logo.svg', width: 88, height: 88, excavate: true }} />
              </div>
            </div>
            <div style={{ position: 'absolute', left: 1211, top: 834, width: 390, zIndex: 62, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 120, height: 140, borderRadius: 16, flexShrink: 0, overflow: 'hidden', border: '1.4px solid rgba(255,255,255,0.2)', boxSizing: 'border-box' }}>
                <img src={place.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
                {place.rating != null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <img src="/images/l1/star.svg" alt="" style={{ width: 20, height: 20 }} />
                    <span style={{ color: '#ffba71', fontSize: 18, lineHeight: '20px', fontWeight: 600, fontFamily: 'Inter,sans-serif', textTransform: 'uppercase' }}>
                      {place.rating}{place.ratingCount ? ` (${place.ratingCount} reviews)` : ''}
                    </span>
                  </div>
                )}
                <p style={{ fontSize: 22, fontWeight: 500, color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.22px', margin: 0, fontFamily: "'Manrope','Plus Jakarta Sans',sans-serif" }}>{place.name}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {toast && (
        <div style={{
          position: 'absolute', bottom: 160, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(18,18,18,0.96)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999,
          padding: '12px 28px', fontSize: 16, fontWeight: 600, color: '#e8e8e8',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)', animation: 'l1s-toastIn 0.18s ease', zIndex: 70, whiteSpace: 'nowrap',
        }}>{toast}</div>
      )}
    </>
  );
}

/** The animations + hairline-border classes every scenario component depends
 *  on. Exported so a host that mounts a scenario OUTSIDE this page (Level 2's
 *  final response) can bring the styles with it. Injecting it twice is
 *  harmless — the rules are identical. */
export function L1ScenarioStyles() {
  return (
    <style>{`
      @keyframes l1s-fadeUp  { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes l1s-fadeDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes l1s-mascotIn { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
      @keyframes l1s-fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes l1s-slideInRight { from { opacity: 0; transform: translateX(480px); } to { opacity: 1; transform: translateX(0); } }
      @keyframes l1s-toastIn { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
      .l1s-gborder { position: relative; }
      .l1s-gborder::before {
        content: ''; position: absolute; inset: 0; border-radius: inherit;
        padding: var(--l1s-hairline, 2px);
        background: linear-gradient(180deg, #ffffff, rgba(255,255,255,0.2));
        opacity: 0.15;
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        mask-composite: exclude;
        pointer-events: none;
      }
      /* Text Only renders its own scrollbar thumb — hide the native one. */
      .l1s-noscrollbar::-webkit-scrollbar { display: none; }
      .l1s-noscrollbar { scrollbar-width: none; -ms-overflow-style: none; }
    `}</style>
  );
}

/* ─── debug-only gear + menu — mouse/click only, never in the D-pad graph ─ */
function DebugGear({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-label="Internal scenario switcher"
      tabIndex={-1}
      style={{
        position: 'absolute', top: 18, right: 28, zIndex: 50,
        width: 32, height: 32, borderRadius: '50%', appearance: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: open ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.12)',
        color: 'rgba(255,255,255,0.4)', fontSize: 15, lineHeight: 1,
        cursor: 'pointer', transition: 'all 0.15s ease',
      }}
    >⚙</button>
  );
}

function DebugMenu({ active, onSelect, onClose }: { active: ScenarioId; onSelect: (id: ScenarioId) => void; onClose: () => void }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 48 }} />
      <div style={{
        position: 'absolute', top: 54, right: 28, zIndex: 49, minWidth: 176,
        background: 'rgba(14,14,18,0.97)', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 14, padding: 6, boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        display: 'flex', flexDirection: 'column', gap: 2,
      }}>
        {DEBUG_SCENARIOS.map(s => (
          <button key={s.id} tabIndex={-1} onClick={() => onSelect(s.id)} style={{
            appearance: 'none', border: 'none', textAlign: 'left', cursor: 'pointer',
            padding: '10px 14px', borderRadius: 10,
            fontSize: 14, fontWeight: 600, fontFamily: 'Inter,sans-serif',
            color: s.id === active ? '#fff' : 'rgba(255,255,255,0.55)',
            background: s.id === active ? 'rgba(255,255,255,0.1)' : 'transparent',
          }}>{s.label}</button>
        ))}
      </div>
    </>
  );
}

/* ─── page shell ──────────────────────────────────────────────────────── */
export default function L1Scenarios() {
  const [activeId, setActiveId] = useState<ScenarioId>(() => {
    const q = new URLSearchParams(window.location.search).get('scenario');
    return DEBUG_SCENARIOS.find(s => s.id === q)?.id ?? 'cards';
  });
  const [runId, setRunId] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { document.title = 'L1 Scenarios'; }, []);

  const selectScenario = (id: ScenarioId) => {
    setMenuOpen(false);
    setActiveId(id);
    setRunId(r => r + 1); // forces a full remount → cancels timers, clears focus, replays the intro
  };

  // Debug-only shortcut, deliberately isolated from every scenario's D-pad
  // handler above — it can only ever toggle the menu, nothing else.
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'g') setMenuOpen(o => !o);
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', overflow: 'hidden', position: 'relative' }}>
      <ScaleSync />
      <L1ScenarioStyles />

      <div style={{
        width: W, height: H, position: 'absolute', top: 0, left: 0, transformOrigin: 'top left',
        transform: 'scale(var(--l1s-scale,1)) translate(var(--l1s-tx,0px), var(--l1s-ty,0px))',
        overflow: 'hidden', color: '#fff', fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
      }}>
        {/* ── BG — same ambient treatment as the real L1 pages ── */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <img src="/images/l1/bg.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.27)' }} />
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#000 0%,rgba(0,0,0,0.8) 50%,rgba(0,0,0,0.5) 100%)', backdropFilter: 'blur(150px)' }} />

        {/* ── real product chrome ── */}
        <img src="/images/l1/glance-logo-white.svg" alt="glance" style={{ position: 'absolute', top: 56, left: 72, width: 120, height: 34, zIndex: 10 }} />
        <div style={{
          position: 'absolute', top: 56, right: 120, height: 80,
          background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(20px)',
          borderRadius: '40px 40px 0 40px', padding: '22px 32px',
          display: 'flex', alignItems: 'center',
          fontSize: 28, lineHeight: '36px', fontFamily: 'Inter,sans-serif', fontWeight: 400,
          opacity: 0.5, whiteSpace: 'nowrap', zIndex: 10,
        }}>{QUERY_TEXT[activeId]}</div>

        {/* ── active scenario — remounted on switch so the intro always replays cleanly ── */}
        <div key={`${activeId}-${runId}`} style={{ position: 'absolute', inset: 0 }}>
          {activeId === 'cards'      && <CardsScenario />}
          {activeId === 'cards-tabs' && <CardsTabsScenario />}
          {activeId === 'text-only'      && <TextOnlyScenario />}
          {activeId === 'text-carousel'  && <TextCarouselScenario />}
        </div>

        {/* ── internal-only debug switcher — click/shortcut only, excluded from the D-pad focus graph ── */}
        <DebugGear open={menuOpen} onToggle={() => setMenuOpen(o => !o)} />
        {menuOpen && <DebugMenu active={activeId} onSelect={selectScenario} onClose={() => setMenuOpen(false)} />}
      </div>
    </div>
  );
}

function ScaleSync() {
  useEffect(() => {
    const apply = () => {
      const s  = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
      const tx = (window.innerWidth  - 1920 * s) / 2 / s;
      const ty = (window.innerHeight - 1080 * s) / 2 / s;
      document.documentElement.style.setProperty('--l1s-scale', String(s));
      document.documentElement.style.setProperty('--l1s-tx', `${tx}px`);
      document.documentElement.style.setProperty('--l1s-ty', `${ty}px`);
      document.documentElement.style.setProperty('--l1s-hairline', `${2 / s}px`);
    };
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, []);
  return null;
}
