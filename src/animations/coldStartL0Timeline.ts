/**
 * coldStartL0Timeline.ts — fixed L0 timeline for demo_cold_start only.
 *
 * Root causes fixed vs l0Timeline.ts:
 *
 * 1. MASCOT VISIBILITY RACE
 *    Original: mascot fade-in runs 0.55s from t=1.35s (finishes t=1.90s).
 *              onTypingStart fired at mascotIn+=0.38 (t≈1.73s) — mascot still ~75% opaque.
 *    Fix: typingStart label moved to mascotIn+=0.58 — reasoning starts only after the
 *         mascot entrance tween completes (0.55s + 3-frame buffer at 60fps = 0.58s).
 *
 * 2. AUTOPLAY HOLD
 *    Original: FeedScreen's idle timer fires 12s after card shown, regardless of timeline state.
 *    Fix: onTimelineComplete callback fires after beam+CTA are settled. ColdStartApp wires
 *         a 10s hold timer to this callback rather than using the 12s flat idle timer.
 *
 * Animation order (all three alignment variants):
 *  1. BG + parallax
 *  2. Overlay
 *  3. Header (first card only)
 *  4. Tag + title
 *  5. Mascot floats in at hero size           ← entrance tween fully completes
 *  6. Reasoning appears + typing starts       ← only after mascot is fully visible
 *  7. Reasoning typing completes
 *  8. 1s pause (deliberate read time)
 *  9. Hero → final shrink
 * 10. Agent looks toward CTA
 * 11. CTA pill slides in
 * 12. Mascot FLIP arc into CTA
 * 13. CTA text reveals
 * 14. CTA glow/beam activates
 * 15. onTimelineComplete fires → ColdStartApp starts 10s hold
 */

import { gsap } from 'gsap';
import { revealTitle, resetTitle } from './titleReveal';
import type { GlanceLayout } from '../config/glanceConfig';

export interface L0Refs {
  bg:            HTMLElement | null;
  overlay:       HTMLElement | null;
  header:        HTMLElement | null;
  tagEl:         HTMLElement | null;
  titleEl:       HTMLElement | null;
  mascotFloat:   HTMLElement | null;
  reasoning:     HTMLElement | null;
  ctaWrap:       HTMLElement | null;
  ctaPill:       HTMLElement | null;
  ctaBeam:       HTMLElement | null;
  ctaMascotSlot: HTMLElement | null;
  card:          HTMLElement | null;
  cards:         (HTMLElement | null)[];
  container:     HTMLElement | null;
}

export interface L0TimelineOpts {
  typingDuration:    number;
  ctaRevealDuration: number;
  mascotHeroScale:   number;
  mascotFinalScale:  number;
  reasoningHeroScale:  number;
  reasoningFinalScale: number;
  alignment:         GlanceLayout;
  showProducts:      boolean;
  animateHeader:     boolean;
  onTypingStart:     () => void;
  onAgentLook:       () => void;
  onCTATypingStart:  () => void;
  onBeamStart:       () => void;
  onMascotGone:      () => void;
  /** Fires after beam activates — ColdStartApp starts 10s hold on this */
  onTimelineComplete: () => void;
}

export function buildColdStartL0Timeline(refs: L0Refs, opts: L0TimelineOpts): gsap.core.Timeline {
  const { bg, overlay, header, tagEl, titleEl, mascotFloat,
          reasoning, ctaWrap, ctaMascotSlot, card } = refs;

  const { alignment, showProducts, animateHeader } = opts;

  const mascotOrigin =
    alignment === 'center' ? 'center center' :
    alignment === 'right'  ? 'right center'  :
                             'left center';

  const reasonOrigin =
    alignment === 'center' ? 'center top' :
    alignment === 'right'  ? 'right top'  :
                             'left top';

  const entranceY = 8;

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  /* ── 0. Initial states ──────────────────────────────────────────────── */
  gsap.set([bg, overlay, reasoning, ctaWrap, card].filter(Boolean), { opacity: 0 });

  if (animateHeader) {
    if (header) gsap.set(header, { opacity: 0, y: -10 });
  } else {
    if (header) gsap.set(header, { opacity: 1, y: 0 });
  }

  if (tagEl) gsap.set(tagEl, { opacity: 0, y: 6 });
  resetTitle(titleEl);

  if (ctaWrap)       gsap.set(ctaWrap,       { y: 14 });
  if (ctaMascotSlot) gsap.set(ctaMascotSlot, { opacity: 0, scale: 0.7, x: -6 });

  if (mascotFloat) gsap.set(mascotFloat, {
    opacity: 0,
    y: entranceY,
    scale: opts.mascotHeroScale,
    transformOrigin: mascotOrigin,
  });

  if (reasoning) gsap.set(reasoning, {
    scale: opts.reasoningHeroScale,
    transformOrigin: reasonOrigin,
  });

  const cardEls = (showProducts ? refs.cards : []).filter(Boolean) as HTMLElement[];

  /* ── 1. BG + parallax ──────────────────────────────────────────────── */
  tl.to(bg, { opacity: 1, duration: 1.0, ease: 'power2.inOut' }, 0);
  if (bg) tl.fromTo(bg,
    { scale: 1.05, yPercent: -1.8 },
    { scale: 1.00, yPercent: 0, duration: 2.8, ease: 'power1.out' },
  0);

  /* ── 2. Overlay ─────────────────────────────────────────────────────── */
  tl.to(overlay, { opacity: 1, duration: 0.85, ease: 'power2.out' }, 0.4);

  /* ── 3. Header ──────────────────────────────────────────────────────── */
  if (animateHeader) {
    tl.to(header, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.9);
  }

  /* ── 4. Tag + title ─────────────────────────────────────────────────── */
  tl.addLabel('metaIn', 1.1);
  tl.to(tagEl, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 'metaIn');
  revealTitle(titleEl, tl, 'metaIn+=0.15', {
    staggerEach:   0.07,
    duration:      0.55,
    ease:          'power3.out',
    containerBlur: false,
    staggerFrom:   'start',
  });

  /* ── 5. Mascot floats in at hero size ───────────────────────────────── */
  // Entrance tween: 0.55s. Fully complete before reasoning fires.
  tl.addLabel('mascotIn', 1.35);
  tl.to(mascotFloat, {
    opacity: 1, y: 0,
    scale: opts.mascotHeroScale,
    duration: 0.55, ease: 'power3.out',
  }, 'mascotIn');

  /* ── 6. Reasoning appears + typing starts ───────────────────────────────
     FIX: was mascotIn+=0.38 — fired while mascot was still fading in.
     Now mascotIn+=0.58 — 3-frame buffer after the 0.55s entrance completes.
  ──────────────────────────────────────────────────────────────────────── */
  tl.addLabel('typingStart', 'mascotIn+=0.58');
  tl.to(reasoning, { opacity: 1, duration: 0.32, ease: 'power2.out' }, 'typingStart');
  tl.to(reasoning, { scale: opts.reasoningHeroScale, duration: 0.5, ease: 'power3.out' }, 'typingStart');
  tl.call(opts.onTypingStart, [], 'typingStart+=0.06');

  /* ── 7+8. Reasoning completes, then 1s read pause ───────────────────── */
  const secsReasoning = opts.typingDuration / 1000;
  tl.addLabel('heroShrink', `typingStart+=${secsReasoning + 1.0}`);

  /* ── 9. Hero → final shrink ─────────────────────────────────────────── */
  tl.to(reasoning, {
    scale: opts.reasoningFinalScale,
    duration: 0.9,
    ease: 'power2.inOut',
  }, 'heroShrink');

  tl.to(mascotFloat, {
    scale: opts.mascotFinalScale,
    duration: 0.85,
    ease: 'power2.inOut',
  }, 'heroShrink');

  /* ── 10. Agent looks toward CTA ─────────────────────────────────────── */
  tl.addLabel('agentLook', 'heroShrink+=0.85');
  tl.call(opts.onAgentLook, [], 'agentLook');

  /* ── 11. CTA pill slides in ──────────────────────────────────────────── */
  tl.addLabel('ctaReveal', 'agentLook+=0.65');
  tl.to(ctaWrap, { opacity: 1, y: 0, duration: 0.46, ease: 'power3.out' }, 'ctaReveal');

  /* ── 12. Mascot FLIP arc into CTA ────────────────────────────────────── */
  tl.call(() => {
    if (!mascotFloat || !ctaMascotSlot) return;
    const fR = mascotFloat.getBoundingClientRect();
    const tR = ctaMascotSlot.getBoundingClientRect();
    const dx = (tR.left + tR.width  * 0.5) - (fR.left + fR.width  / 2);
    const dy = (tR.top  + tR.height * 0.5) - (fR.top  + fR.height / 2);
    const arcHeight = Math.abs(dy) * 0.45 + 40;

    gsap.to(mascotFloat, {
      duration: 0.75,
      ease: 'power2.inOut',
      keyframes: [
        { x: dx * 0.5, y: dy * 0.5 - arcHeight, scale: 0.75, duration: 0.38, ease: 'power2.out' },
        { x: dx,       y: dy,                    scale: 0.5,  duration: 0.37, ease: 'power3.in'  },
      ],
      onComplete() {
        gsap.set(mascotFloat, { opacity: 0 });
        gsap.to(mascotFloat, {
          width: 0, duration: 0.22, ease: 'power2.in',
          onComplete: opts.onMascotGone,
        });
        if (ctaMascotSlot) {
          gsap.to(ctaMascotSlot, { opacity: 1, scale: 1, x: 0, duration: 0.22, ease: 'power2.out' });
        }
        /* ── 13. CTA text reveal starts after mascot settles ── */
        gsap.delayedCall(0.38, opts.onCTATypingStart);
      },
    });
  }, [], 'ctaReveal+=0.40');

  /* ── 14. Glow/beam fires after text reveal completes ─────────────────── */
  const secsCTAReveal = opts.ctaRevealDuration / 1000;
  const beamAt = `ctaReveal+=${0.40 + 0.75 + 0.22 + 0.38 + secsCTAReveal + 0.15}`;
  tl.call(opts.onBeamStart, [], beamAt);

  /* ── 15. onTimelineComplete — triggers the 10s hold in ColdStartApp ──── */
  // Fires 0.3s after beam to allow glow to visually settle before hold starts.
  tl.call(opts.onTimelineComplete, [], `${beamAt}+=0.30`);

  /* ── 16. Product cards ───────────────────────────────────────────────── */
  if (cardEls.length) {
    const SPREAD_GAP = 108;

    cardEls.forEach((el, i) => {
      gsap.set(el, { opacity: 0, x: 120 + i * 60, scale: 0.9, rotate: 0 });
    });

    tl.addLabel('cardsIn', 'ctaReveal+=0.62');

    tl.to(cardEls[0], {
      opacity: 1, x: 0, scale: 1,
      duration: 0.46, ease: 'power3.out',
    }, 'cardsIn');

    if (cardEls[1]) {
      tl.to(cardEls[1], {
        opacity: 1, x: -SPREAD_GAP, scale: 1,
        duration: 0.46, ease: 'power3.out',
      }, 'cardsIn+=0.18');
    }

    const stackLabel = `cardsIn+=${0.18 + 0.46 + 1.4}`;
    tl.addLabel('cardsStack', stackLabel);

    tl.to(cardEls[0], {
      x: 0, y: 0, rotate: 0, scale: 1,
      duration: 0.7, ease: 'power3.inOut',
    }, 'cardsStack');

    if (cardEls[1]) {
      tl.to(cardEls[1], {
        x: 10, y: -3, rotate: 7, scale: 0.96,
        duration: 0.7, ease: 'power3.inOut',
      }, 'cardsStack');
    }
  }

  return tl;
}

export function killColdStartL0Timeline(tl: gsap.core.Timeline | null, refs?: (HTMLElement | null)[]) {
  tl?.kill();
  if (refs?.length) {
    refs.forEach(el => { if (el) gsap.killTweensOf(el); });
  }
}
