import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

/* ─────────────────────────────────────────────────────────────────────────────
   CinematicText — approved Glance text animation language

   Characters exist in layout immediately (no typewriter ticker).
   Each char resolves: blur(12px) → blur(0), opacity 0 → 1
   Stagger sweeps left-to-right giving a "cinematic reveal" feel.

   No cursor. No terminal feel. Letters are always in their final position —
   they simply resolve from invisible to present.

   Props:
   · text       — string to display
   · playing    — trigger to start the reveal (false = chars stay hidden)
   · speed      — stagger between chars in seconds (default 0.028)
   · duration   — per-char resolve duration in seconds (default 0.40)
   · onDone     — fires when last char finishes resolving
   · className  — applied to the outer span (inherit typography from parent)
   · delay      — seconds before the first char starts
   ───────────────────────────────────────────────────────────────────────────── */

interface Props {
  text: string;
  playing?: boolean;
  speed?: number;
  duration?: number;
  onDone?: () => void;
  className?: string;
  delay?: number;
}

export default function CinematicText({
  text,
  playing = true,
  speed = 0.028,
  duration = 0.40,
  onDone,
  className = '',
  delay = 0,
}: Props) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const tlRef        = useRef<gsap.core.Timeline | null>(null);
  const doneRef      = useRef(false);

  /* Re-run whenever text or playing changes */
  useEffect(() => {
    if (!containerRef.current) return;

    /* Kill previous timeline */
    tlRef.current?.kill();
    doneRef.current = false;

    const chars = containerRef.current.querySelectorAll<HTMLSpanElement>('.cr-char');

    /* Reset all chars to hidden */
    gsap.set(chars, { opacity: 0, filter: 'blur(12px)' });

    if (!playing) return;

    const tl = gsap.timeline({
      delay,
      onComplete: () => {
        if (!doneRef.current) {
          doneRef.current = true;
          onDone?.();
        }
      },
    });

    tl.to(chars, {
      opacity: 1,
      filter: 'blur(0px)',
      duration,
      stagger: speed,
      ease: 'power2.out',
    });

    tlRef.current = tl;

    return () => { tl.kill(); };
  }, [text, playing, speed, duration, delay]);

  /* Build char spans — spaces as non-breaking so layout is stable */
  const chars = Array.from(text);

  return (
    <span ref={containerRef} className={`cr-text ${className}`} aria-label={text}>
      {chars.map((ch, i) => (
        <span
          key={i}
          className="cr-char"
          style={{
            display: 'inline',
            whiteSpace: ch === ' ' ? 'pre' : 'normal',
          }}
        >
          {ch}
        </span>
      ))}
    </span>
  );
}
