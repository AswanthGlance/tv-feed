import { useEffect, useRef, useState } from 'react';

export type MascotState = 'idle' | 'speaking' | 'thinking' | 'listening' | 'transitioning';

/* ─────────────────────────────────────────────────────────────────────────────
   Keyframes injected once — all states share this single style block
   ───────────────────────────────────────────────────────────────────────────── */
const KEYFRAMES = `
@keyframes _mascot-idle {
  0%, 100% {
    transform: scale(1);
    box-shadow:
      0 0 44px 14px rgba(112, 71, 226, 0.38),
      0 0 88px 30px rgba(112, 71, 226, 0.10);
    opacity: 0.84;
  }
  50% {
    transform: scale(1.10);
    box-shadow:
      0 0 82px 38px rgba(167, 134, 229, 0.62),
      0 0 160px 70px rgba(112, 71, 226, 0.16);
    opacity: 1;
  }
}

@keyframes _mascot-speak {
  0%   { transform: scale(1);    box-shadow: 0 0 60px 22px rgba(192, 132, 252, 0.55); }
  35%  { transform: scale(1.16); box-shadow: 0 0 112px 56px rgba(192, 132, 252, 0.82); }
  70%  { transform: scale(1.07); box-shadow: 0 0 82px 36px rgba(192, 132, 252, 0.64); }
  100% { transform: scale(1);    box-shadow: 0 0 60px 22px rgba(192, 132, 252, 0.55); }
}

@keyframes _mascot-listen {
  0%   { transform: scale(1);    box-shadow: 0 0 40px 12px rgba(112, 71, 226, 0.38), 0 0 0 0 rgba(167, 134, 229, 0); }
  50%  { transform: scale(1.04); box-shadow: 0 0 60px 18px rgba(167, 134, 229, 0.55), 0 0 0 28px rgba(167, 134, 229, 0.10); }
  100% { transform: scale(1);    box-shadow: 0 0 40px 12px rgba(112, 71, 226, 0.38), 0 0 0 52px rgba(167, 134, 229, 0); }
}

@keyframes _mascot-think-dot {
  0%, 80%, 100% { opacity: 0.16; transform: scale(0.72) translateY(0); }
  40%           { opacity: 1;    transform: scale(1.24) translateY(-5px); }
}

@keyframes _mascot-appear {
  from { opacity: 0; transform: scale(0.68) translateY(14px); filter: blur(16px); }
  to   { opacity: 1; transform: scale(1)    translateY(0);    filter: blur(0); }
}

@keyframes _mascot-respond {
  0%   { transform: scale(1); }
  28%  { transform: scale(1.16); }
  58%  { transform: scale(0.97); }
  100% { transform: scale(1); }
}

@keyframes _mascot-exit {
  from { opacity: 1; transform: scale(1)    translateY(0);    filter: blur(0); }
  to   { opacity: 0; transform: scale(0.80) translateY(-12px); filter: blur(10px); }
}

@keyframes _typed-cursor {
  0%, 48%  { opacity: 1; }
  52%, 100% { opacity: 0; }
}
`;

type Props = {
  state?: MascotState;
  size?: number;
  /** Trigger a brief "respond" pulse — flip the value to re-trigger */
  respondTrigger?: number;
};

export default function Mascot({ state = 'idle', size = 80, respondTrigger }: Props) {
  const [responding, setResponding] = useState(false);
  const prevTrigger = useRef(respondTrigger);

  useEffect(() => {
    if (respondTrigger !== prevTrigger.current && respondTrigger !== undefined) {
      prevTrigger.current = respondTrigger;
      setResponding(true);
      const t = setTimeout(() => setResponding(false), 700);
      return () => clearTimeout(t);
    }
  }, [respondTrigger]);

  const baseAnim = (() => {
    if (responding)            return `_mascot-respond 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards`;
    if (state === 'speaking')  return `_mascot-speak   1.7s ease-in-out infinite`;
    if (state === 'listening') return `_mascot-listen  2.4s ease-in-out infinite`;
    if (state === 'thinking')  return 'none';
    if (state === 'transitioning') return `_mascot-exit 0.5s cubic-bezier(0.45,0,0.15,1) forwards`;
    return `_mascot-idle 2.9s ease-in-out infinite`;
  })();

  const starSize   = size * 0.38;
  const dotSize    = Math.max(5, size * 0.07);
  const dotGap     = Math.max(4, size * 0.055);
  const dotOffset  = Math.max(16, size * 0.28);

  return (
    <>
      <style>{KEYFRAMES}</style>

      <div
        style={{
          position: 'relative',
          width: size,
          height: size,
          flexShrink: 0,
          animation: '_mascot-appear 0.92s cubic-bezier(0.34,1.56,0.64,1) both',
        }}
      >
        {/* Core orb */}
        <div
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 38% 36%, #d8b4fe 0%, #9b66f5 28%, #7047E2 58%, #3a1270 100%)',
            animation: baseAnim,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {/* Inner glow rim */}
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 28%, rgba(255,255,255,0.22), transparent 55%)',
            pointerEvents: 'none',
          }} />

          {/* Star icon */}
          <span
            style={{
              fontSize: starSize,
              background: 'linear-gradient(140deg, #ffffff 0%, #ede2ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 900,
              lineHeight: 1,
              position: 'relative',
              zIndex: 1,
            }}
          >
            ✦
          </span>
        </div>

        {/* Thinking dots */}
        {state === 'thinking' && (
          <div
            style={{
              position: 'absolute',
              bottom: -dotOffset,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: dotGap,
              alignItems: 'center',
            }}
          >
            {[0, 1, 2].map(i => (
              <div
                key={i}
                style={{
                  width: dotSize,
                  height: dotSize,
                  borderRadius: '50%',
                  background: 'rgba(167, 134, 229, 0.75)',
                  animation: `_mascot-think-dot 1.25s ease-in-out ${i * 0.22}s infinite`,
                }}
              />
            ))}
          </div>
        )}

        {/* Listening ring — decorative outer pulse */}
        {state === 'listening' && (
          <div
            style={{
              position: 'absolute',
              inset: -size * 0.14,
              borderRadius: '50%',
              border: '1.5px solid rgba(167, 134, 229, 0.22)',
              animation: '_mascot-listen 2.4s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   useTypedText hook
   ───────────────────────────────────────────────────────────────────────────── */

export function useTypedText(
  text: string,
  speedMs = 24,
): { typed: string; done: boolean } {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
  }, [text]);

  useEffect(() => {
    if (idx >= text.length) return;
    const t = setTimeout(() => setIdx(i => i + 1), speedMs);
    return () => clearTimeout(t);
  }, [idx, text, speedMs]);

  return { typed: text.slice(0, idx), done: idx >= text.length };
}

/* ─────────────────────────────────────────────────────────────────────────────
   TypedLine component
   ───────────────────────────────────────────────────────────────────────────── */

type TypedLineProps = {
  text: string;
  style?: React.CSSProperties;
  speedMs?: number;
  showCursor?: boolean;
};

export function TypedLine({
  text,
  style,
  speedMs = 24,
  showCursor = true,
}: TypedLineProps) {
  const { typed, done } = useTypedText(text, speedMs);

  return (
    <>
      <style>{`._typed-cur { animation: _typed-cursor 1s step-end infinite; }`}</style>
      <span style={style}>
        {typed}
        {showCursor && !done && (
          <span className="_typed-cur" style={{ color: 'rgba(167,134,229,0.7)' }}>|</span>
        )}
      </span>
    </>
  );
}
