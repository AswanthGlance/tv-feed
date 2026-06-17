/**
 * GlanceTextReveal — shared cinematic text reveal for all Glance agent speech.
 *
 * Animation: all characters exist in the DOM at render, opacity 0 + blur(12px).
 * GSAP staggers them to their final opacity and blur(0) over `resolveMs`.
 * No cursor. No typewriter insertion. No layout shift. No word-by-word reveal.
 *
 * The thought comes into focus — it is not typed.
 *
 * Usage:
 *   <GlanceTextReveal
 *     text="Your personalised morning starts here."
 *     playing={isPlaying}
 *     onDone={() => setDone(true)}
 *   />
 *
 * With highlights:
 *   <GlanceTextReveal
 *     text="Because you love South Indian food."
 *     highlights={['South Indian food']}
 *     playing={isPlaying}
 *     onDone={() => {}}
 *   />
 */

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

/* ── Highlight style — matches the L0 reasoning highlight (purple glow) ───── */
export const GLANCE_HIGHLIGHT_STYLE: React.CSSProperties = {
  fontWeight: 700,
  color: 'rgba(255,255,255,0.98)',
  textShadow: '0 0 12px rgba(192,132,252,0.9), 0 0 28px rgba(112,71,226,0.6)',
};

/* ── Speed presets ─────────────────────────────────────────────────────────── */
/** Use for longer reasoning text (~40+ chars). 4 s total spread. */
export const RESOLVE_MS_REASONING = 4000;
/** Use for short CTA labels. 1.4 s total spread. */
export const RESOLVE_MS_CTA       = 1400;
/** Use for mid-length agent speech (onboarding, preference acks). 2.5 s. */
export const RESOLVE_MS_SPEECH    = 2500;

/* ── Internal constants ────────────────────────────────────────────────────── */
const CHAR_EASE                   = 'power2.out';
/** Per-char tween duration (seconds). Controls how sharp each char feels. */
const CHAR_DURATION_DEFAULT       = 1.0;
const CHAR_DURATION_CTA           = 0.65;

/* ── Types ─────────────────────────────────────────────────────────────────── */
type CharToken = { char: string; isHL: boolean };

export type GlanceTextRevealProps = {
  /** The text to reveal. */
  text: string;
  /** Substrings that should receive the purple highlight glow. */
  highlights?: string[];
  /**
   * When true, inserts a line break at the first '. ' in the text so the
   * sentence reads as two distinct lines (matching L0 reasoning layout).
   */
  twoLine?: boolean;
  /** Start/stop the animation. When set to true the reveal begins. */
  playing: boolean;
  /**
   * Final opacity for resolved characters.
   * - 0.78 for reasoning text (L0 default, slightly subdued over dark BG)
   * - 1.0  for CTA labels, onboarding copy on lighter BGs
   */
  resolvedOpacity?: number;
  /**
   * Total duration in ms over which all characters resolve.
   * Use RESOLVE_MS_* presets or pass a custom value.
   */
  resolveMs?: number;
  /**
   * Per-character tween duration in seconds.
   * Lower = crisper each char snap; higher = softer bloom.
   * Defaults to 1.0 for reasoning, or 0.65 for CTA-length text.
   */
  charDuration?: number;
  /** Fired once, when the last character has resolved. */
  onDone: () => void;
};

/* ── Helper: build per-char token array with highlight mask ─────────────────── */
export function buildCharTokens(text: string, highlights: string[]): CharToken[] {
  const chars = Array.from(text);
  if (!highlights.length) return chars.map(c => ({ char: c, isHL: false }));
  const mask = new Array(chars.length).fill(false);
  for (const hl of highlights) {
    const re = new RegExp(hl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      for (let k = m.index; k < m.index + m[0].length; k++) mask[k] = true;
    }
  }
  return chars.map((c, i) => ({ char: c, isHL: mask[i] }));
}

/* ── Component ─────────────────────────────────────────────────────────────── */
export default function GlanceTextReveal({
  text,
  highlights    = [],
  twoLine       = false,
  playing,
  resolvedOpacity = 0.78,
  resolveMs       = RESOLVE_MS_REASONING,
  charDuration,
  onDone,
}: GlanceTextRevealProps) {
  /* Auto-select charDuration based on resolveMs if not provided */
  const duration = charDuration ?? (resolveMs <= RESOLVE_MS_CTA ? CHAR_DURATION_CTA : CHAR_DURATION_DEFAULT);

  /* Split text at first '. ' when twoLine is requested */
  const breakIdx = twoLine ? text.indexOf('. ') : -1;
  const line1    = breakIdx !== -1 ? text.slice(0, breakIdx + 1) : text;
  const line2    = breakIdx !== -1 ? text.slice(breakIdx + 2)    : '';

  const tokens1   = buildCharTokens(line1, highlights);
  const tokens2   = line2 ? buildCharTokens(line2, highlights) : [];
  const allTokens = [...tokens1, ...tokens2];

  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const tlRef    = useRef<gsap.core.Timeline | null>(null);
  const doneRef  = useRef(false);

  /* Reset initial state whenever text changes */
  useEffect(() => {
    doneRef.current = false;
    charRefs.current.forEach(el => {
      if (el) gsap.set(el, { opacity: 0, filter: 'blur(12px)' });
    });
  }, [text]);

  /* Kick off the reveal when playing becomes true */
  useEffect(() => {
    if (!playing) return;

    tlRef.current?.kill();
    doneRef.current = false;

    const staggerEach = (resolveMs / 1000) / Math.max(1, allTokens.length - 1);

    const tl = gsap.timeline({
      onComplete() {
        if (!doneRef.current) { doneRef.current = true; onDone(); }
      },
    });

    charRefs.current.forEach((el, i) => {
      if (!el) return;
      tl.to(el, {
        opacity:  resolvedOpacity,
        filter:   'blur(0px)',
        duration: duration,
        ease:     CHAR_EASE,
      }, i * staggerEach);
    });

    tlRef.current = tl;
    return () => { tl.kill(); };
  }, [playing]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Render a line of tokens into individual <span> elements */
  function renderTokens(tokens: CharToken[], offset: number) {
    return tokens.map(({ char, isHL }, ci) => {
      if (char === '\n') {
        // Newline: invisible span that holds the ref slot + a br for layout
        return (
          <React.Fragment key={ci}>
            <span ref={el => { charRefs.current[offset + ci] = el; }} style={{ display: 'none' }} />
            <br />
          </React.Fragment>
        );
      }
      return (
        <span
          key={ci}
          ref={el => { charRefs.current[offset + ci] = el; }}
          style={{
            ...(isHL ? GLANCE_HIGHLIGHT_STYLE : {}),
            display:    'inline',
            whiteSpace: char === ' ' ? 'pre' : 'normal',
            opacity:    0,
            filter:     'blur(12px)',
            willChange: 'filter, opacity',
          }}
        >{char}</span>
      );
    });
  }

  return (
    <>
      <span style={{ display: twoLine ? 'block' : 'inline' }}>
        {renderTokens(tokens1, 0)}
      </span>
      {tokens2.length > 0 && (
        <span style={{ display: 'block' }}>
          {renderTokens(tokens2, tokens1.length)}
        </span>
      )}
    </>
  );
}
