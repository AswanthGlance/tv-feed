import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';

/* ─────────────────────────────────────────────────────────────────────────────
   TypewriterText — blur-reveal letter-by-letter

   FIX: cursor is always positioned AFTER the last revealed character,
   not at the end of all characters (including hidden ones).

   Settings (TypeCraft screenshot):
   · Effect : Blur — each char blur(8px)→blur(0) as it appears
   · Speed  : 35ms/char
   · Cursor : Line — thin blinking vertical bar, moves with typing
   ───────────────────────────────────────────────────────────────────────────── */

interface Props {
  text: string;
  onDone?: () => void;
  playing?: boolean;
  speed?: number;
  className?: string;
  showCursor?: boolean;
  cursorHideDoneDelay?: number;
}

export default function TypewriterText({
  text,
  onDone,
  playing = true,
  speed = 35,
  className = '',
  showCursor = true,
  cursorHideDoneDelay = 500,
}: Props) {
  const [revealed, setRevealed] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(showCursor);
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneRef     = useRef(false);
  /* Track which indices have already received the blur-in animation */
  const animatedRef = useRef<Set<number>>(new Set());

  const chars = Array.from(text);

  /* Reset on text/playing change */
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    doneRef.current = false;
    animatedRef.current.clear();
    setRevealed(0);
    setCursorVisible(showCursor);
  }, [text]);  // deliberately only text, not playing

  /* Reveal ticker */
  useEffect(() => {
    if (!playing) return;
    if (revealed >= chars.length) {
      if (!doneRef.current) {
        doneRef.current = true;
        onDone?.();
        if (showCursor) {
          timerRef.current = setTimeout(() => setCursorVisible(false), cursorHideDoneDelay);
        }
      }
      return;
    }
    timerRef.current = setTimeout(() => setRevealed(r => r + 1), speed);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [revealed, playing, chars.length, speed, onDone, showCursor, cursorHideDoneDelay]);

  /* Blur-in animation — blur only, no scale, so font size is unaffected */
  const setCharRef = useCallback((i: number) => (el: HTMLSpanElement | null) => {
    if (!el || animatedRef.current.has(i)) return;
    animatedRef.current.add(i);
    gsap.fromTo(el,
      { opacity: 0, filter: 'blur(8px)' },
      { opacity: 1, filter: 'blur(0px)', duration: 0.20, ease: 'power2.out' }
    );
  }, []);

  return (
    <span className={`tw-text ${className}`} aria-label={text}>
      {/* Only render revealed chars — cursor sits AFTER them */}
      {chars.slice(0, revealed).map((ch, i) => (
        <span
          key={i}
          ref={setCharRef(i)}
          className="tw-char"
          style={{
            /* inline preserves font-size/line-height exactly — no layout shift */
            display: 'inline',
            whiteSpace: ch === ' ' ? 'pre' : 'normal',
          }}
        >
          {ch}
        </span>
      ))}

      {/* Cursor always immediately after last revealed char */}
      {showCursor && cursorVisible && (
        <span className="tw-cursor" aria-hidden="true" />
      )}
    </span>
  );
}
