/**
 * titleReveal.ts — Reusable GSAP title reveal utility.
 *
 * TECHNIQUE (Likely Story / editorial cinema style):
 * ─────────────────────────────────────────────────
 * Each word is wrapped in an overflow:hidden mask div (`.word-mask`).
 * The word span inside (.word-inner) starts at y:110% and rises to y:0.
 * Because the mask clips the child, the word appears to "print up" through
 * a slot — no fade, no blur on the word itself. The result is a precise,
 * architectural text reveal (Kinetic Typography, Likely Story, Apple TV style).
 *
 * Additional polish layers on top:
 *  1. The whole title container has a subtle blur that clears as words settle.
 *  2. Words have a very small y offset (not 100%) so the motion is cinematic,
 *     not theatrical (avoids the "cheap slide-up" look).
 *  3. Stagger is word-level (not char-level) for readability.
 *
 * DOM STRUCTURE REQUIRED:
 *   <h1 ref={titleRef}>
 *     <span class="word-mask">        ← overflow:hidden clip
 *       <span class="word-inner">     ← animated child
 *         Eatly
 *       </span>
 *     </span>
 *     <span class="word-mask">
 *       <span class="word-inner">at</span>
 *     </span>
 *     ...
 *   </h1>
 *
 * Use the `splitTitleWords()` React helper below to build this structure.
 *
 * USAGE:
 *   import { revealTitle, shrinkTitle, resetTitle } from './titleReveal';
 *
 *   // In timeline:
 *   revealTitle(titleEl, tl, 'titleIn');        // stagger reveal
 *   shrinkTitle(titleEl, onShrinkStart, tl, 'titleShrink'); // scale down
 *   resetTitle(titleEl);                        // reset for replay
 */

import { gsap } from 'gsap';

/* ── Selectors ──────────────────────────────────────────────────────────── */
const INNER_SEL = '.word-inner';

function innerSpans(el: HTMLElement | null): HTMLElement[] {
  if (!el) return [];
  return Array.from(el.querySelectorAll<HTMLElement>(INNER_SEL));
}

/* ── Public API ─────────────────────────────────────────────────────────── */

/**
 * Set initial hidden state before reveal.
 * Call once at timeline setup (before the timeline plays).
 */
export function resetTitle(titleEl: HTMLElement | null): void {
  if (!titleEl) return;
  const inners = innerSpans(titleEl);
  gsap.set(inners, {
    yPercent: 105,   /* start below the mask — just enough to be hidden */
    opacity: 1,      /* opacity is always 1 — clip does the hiding */
  });
  /* Whole title container starts invisible until bg loads */
  gsap.set(titleEl, { opacity: 0 });
}

/**
 * Animate title words up through their mask clips.
 * Adds a subtle container-level blur that clears as the last word settles.
 *
 * @param titleEl   the <h1> (or any container with word-mask/word-inner children)
 * @param tl        the GSAP timeline to append to
 * @param at        GSAP position parameter (label string, '+=x', or absolute seconds)
 * @param options   optional overrides
 */
export function revealTitle(
  titleEl: HTMLElement | null,
  tl: gsap.core.Timeline,
  at: string | number = 0,
  options: {
    staggerEach?: number;
    duration?:    number;
    ease?:        string;
    containerBlur?: boolean;
    /** 'start' (default, left→right) or 'end' (right→last word first, for right-aligned) */
    staggerFrom?: 'start' | 'end';
  } = {},
): void {
  if (!titleEl) return;

  const {
    staggerEach   = 0.10,
    duration      = 0.72,
    ease          = 'power4.out',
    containerBlur = true,
    staggerFrom   = 'start',
  } = options;

  const inners = innerSpans(titleEl);
  if (!inners.length) return;

  const totalStagger = (inners.length - 1) * staggerEach;
  const totalDuration = duration + totalStagger;

  tl.to(titleEl, { opacity: 1, duration: 0.01 }, at);

  if (containerBlur) {
    tl.fromTo(
      titleEl,
      { filter: 'blur(7px)' },
      { filter: 'blur(0px)', duration: totalDuration * 0.85, ease: 'power2.out' },
      at,
    );
  }

  tl.to(inners, {
    yPercent: 0,
    duration,
    ease,
    stagger: {
      each: staggerEach,
      from: staggerFrom === 'end' ? 'end' : 'start',
      ease: 'power2.out',
    },
  }, at);
}

/**
 * Smoothly scale the title down to its final smaller size.
 * The font-size switch is handled by React state (CSS transition).
 * This call fires the React callback at the right moment.
 *
 * @param onShrink  React state toggle: () => setTitleStage('small')
 * @param tl        the GSAP timeline
 * @param at        position in timeline
 */
export function shrinkTitle(
  onShrink: () => void,
  tl: gsap.core.Timeline,
  at: string | number,
): void {
  tl.call(onShrink, [], at);
}

/**
 * Build the word-mask / word-inner React JSX structure.
 * Import this into components that render L0 titles.
 */
export const MASK_CLASSNAME  = 'word-mask';
export const INNER_CLASSNAME = 'word-inner';
