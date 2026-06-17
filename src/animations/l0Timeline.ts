/**
 * l0Timeline.ts — GSAP timeline for the cinematic L0.
 *
 * Supports all three alignment variants (left / center / right) and
 * optional product cards (left + center only; right = no products).
 *
 * Animation order (HERO REASONING design):
 *  1. BG + parallax
 *  2. Overlay
 *  3. Header slide-in
 *  4. Tag + title fade in top-left (small, soft)
 *  5. Mascot floats in at HERO size
 *  6. Reasoning appears at HERO size — character blur reveal starts
 *  7. Reasoning completes typing
 *  8. Mascot + reasoning shrink to final resting sizes
 *  9. CTA pill appears → FLIP mascot → beam
 * 10. Product cards (left + center only)
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
  /** Duration of the CTA text stagger reveal in ms (pass 0 to skip, non-zero to sync beam) */
  ctaRevealDuration: number;
  /* Hero → final scale ratio for mascot */
  mascotHeroScale:   number;
  mascotFinalScale:  number;
  /* Hero → final scale ratio for reasoning */
  reasoningHeroScale:  number;
  reasoningFinalScale: number;
  alignment:         GlanceLayout;
  showProducts:      boolean;
  /** When false the header is shown instantly with no animation (already visible from prior card) */
  animateHeader:     boolean;
  onTypingStart:     () => void;
  /** Fires just before mascot FLIP — agent turns to look at CTA */
  onAgentLook:       () => void;
  /** Fires when mascot has arrived in the CTA slot and CTA text should start revealing */
  onCTATypingStart:  () => void;
  onBeamStart:       () => void;
  onMascotGone:      () => void;
}

export function buildL0Timeline(refs: L0Refs, opts: L0TimelineOpts): gsap.core.Timeline {
  const { bg, overlay, header, tagEl, titleEl, mascotFloat,
          reasoning, ctaWrap, ctaMascotSlot, card } = refs;

  const { alignment, showProducts, animateHeader } = opts;

  /* Transform-origin for mascot/reasoning hero scale — matches alignment edge */
  const mascotOrigin =
    alignment === 'center' ? 'center center' :
    alignment === 'right'  ? 'right center'  :
                             'left center';

  /* Reasoning scale origin — anchors to alignment edge */
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

  /* Tag: small y slide */
  if (tagEl) gsap.set(tagEl, { opacity: 0, y: 6 });
  /* Title: word-mask reveal (same technique as hero title, at metadata scale) */
  resetTitle(titleEl);

  /* CTA */
  if (ctaWrap)       gsap.set(ctaWrap,       { y: 14 });
  if (ctaMascotSlot) gsap.set(ctaMascotSlot, { opacity: 0, scale: 0.7, x: -6 });

  /* Mascot: starts at hero size, slightly above final position */
  if (mascotFloat) gsap.set(mascotFloat, {
    opacity: 0,
    y: entranceY,
    scale: opts.mascotHeroScale,
    transformOrigin: mascotOrigin,
  });

  /* Reasoning: starts at hero size */
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

  /* ── 3. Header — only on first card ────────────────────────────────── */
  if (animateHeader) {
    tl.to(header, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.9);
  }

  /* ── 4. Tag slides in; title does a quick word-mask reveal ─────────── */
  tl.addLabel('metaIn', 1.1);
  tl.to(tagEl, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 'metaIn');
  /* Word-mask reveal: words print up through clip at small metadata size */
  revealTitle(titleEl, tl, 'metaIn+=0.15', {
    staggerEach:   0.07,
    duration:      0.55,
    ease:          'power3.out',
    containerBlur: false,
    staggerFrom:   'start',
  });

  /* ── 5. Mascot floats in at hero size ───────────────────────────────── */
  tl.addLabel('mascotIn', 1.35);
  tl.to(mascotFloat, {
    opacity: 1, y: 0,
    /* keep at heroScale — no scale change on entrance */
    scale: opts.mascotHeroScale,
    duration: 0.55, ease: 'power3.out',
  }, 'mascotIn');

  /* ── 6. Reasoning appears + typing starts (HERO moment) ────────────── */
  tl.addLabel('typingStart', 'mascotIn+=0.38');
  tl.to(reasoning, { opacity: 1, duration: 0.32, ease: 'power2.out' }, 'typingStart');
  /* Hero scale is already set; animate from slightly above to confirm */
  tl.to(reasoning, { scale: opts.reasoningHeroScale, duration: 0.5, ease: 'power3.out' }, 'typingStart');
  tl.call(opts.onTypingStart, [], 'typingStart+=0.06');

  /* ── 7. Reasoning completes (driven by typingDuration, nothing to add) */

  /* ── 8. Hero → final shrink: intentional pause lets user absorb reasoning ─ */
  const secsReasoning = opts.typingDuration / 1000;
  /* 1.0s pause after typing finishes before anything moves — feels deliberate */
  tl.addLabel('heroShrink', `typingStart+=${secsReasoning + 1.0}`);

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

  /* ── 9. CTA sequence — deliberate, no overlaps ─────────────────────────
     heroShrink completes → 0.5s pause → agent looks → 0.65s pause →
     pill slides in → mascot FLIP arc (0.75s) → CTA text stagger → glow
  ──────────────────────────────────────────────────────────────────────── */

  /* Step A: agent looks toward where the CTA will appear */
  tl.addLabel('agentLook', 'heroShrink+=0.85');
  tl.call(opts.onAgentLook, [], 'agentLook');

  /* Step B: CTA pill slides in (agent has already turned) */
  tl.addLabel('ctaReveal', 'agentLook+=0.65');
  tl.to(ctaWrap, { opacity: 1, y: 0, duration: 0.46, ease: 'power3.out' }, 'ctaReveal');

  /* Step C: mascot FLIP arc — starts after pill is visible */
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
        /* mascot arrives: hide float, reveal slot */
        gsap.set(mascotFloat, { opacity: 0 });
        gsap.to(mascotFloat, {
          width: 0, duration: 0.22, ease: 'power2.in',
          onComplete: opts.onMascotGone,
        });
        if (ctaMascotSlot) {
          gsap.to(ctaMascotSlot, { opacity: 1, scale: 1, x: 0, duration: 0.22, ease: 'power2.out' });
        }
        /* Step D: bass pause — let mascot settle, then reveal text */
        gsap.delayedCall(0.38, opts.onCTATypingStart);
      },
    });
  }, [], 'ctaReveal+=0.40');

  /* Step E: glow fires after text reveal completes */
  const secsCTAReveal = opts.ctaRevealDuration / 1000;
  /* FLIP 0.75s + settle 0.22s + bass 0.38s + text reveal + margin */
  const beamAt = `ctaReveal+=${0.40 + 0.75 + 0.22 + 0.38 + secsCTAReveal + 0.15}`;
  tl.call(opts.onBeamStart, [], beamAt);

  /* ── 10. Product cards (left + center only, 2 cards) ────────────────── */
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

export function killL0Timeline(tl: gsap.core.Timeline | null, refs?: (HTMLElement | null)[]) {
  tl?.kill();
  if (refs?.length) {
    refs.forEach(el => { if (el) gsap.killTweensOf(el); });
  }
}
