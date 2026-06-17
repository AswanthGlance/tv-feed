/**
 * SetupStructuredReply — three-line cinematic acknowledgement for setup questions.
 * Uses CinematicText (blur→sharp reveal) — not TypewriterText.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import CinematicText from '../Shared/CinematicText';

type Props = {
  lines: [string, string, string];
  playing: boolean;
  onDone: () => void;
};

export default function SetupStructuredReply({ lines, playing, onDone }: Props) {
  const [lineIdx, setLineIdx]   = useState(-1);
  const [doneMask, setDoneMask] = useState([false, false, false]);
  const doneRef  = useRef(false);
  const timers   = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!playing) return;
    doneRef.current = false;
    setLineIdx(0);
    return () => timers.current.forEach(clearTimeout);
  }, [playing]);

  // Speed: line 0 dim = 0.032, line 1 bold = 0.040, line 2 dim = 0.032
  const SPEED = [0.032, 0.040, 0.032];
  const DURATION = [0.36, 0.42, 0.36];

  const onLineDone = useCallback((idx: number) => {
    setDoneMask(prev => { const n = [...prev]; n[idx] = true; return n as [boolean, boolean, boolean]; });
    const pauseMs = idx === 0 ? 550 : idx === 1 ? 450 : 0;
    if (idx < 2) {
      const t = setTimeout(() => setLineIdx(idx + 1), pauseMs);
      timers.current.push(t);
    } else if (!doneRef.current) {
      doneRef.current = true;
      const t = setTimeout(onDone, 800);
      timers.current.push(t);
    }
  }, [onDone]);

  return (
    <div style={{ textAlign: 'center', lineHeight: 1.55 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ overflow: 'hidden', maxHeight: lineIdx >= i ? '3em' : 0, opacity: lineIdx >= i ? 1 : 0, transition: 'max-height 0.38s ease, opacity 0.32s ease', marginBottom: i < 2 ? '8px' : 0 }}>
          <span style={{
            fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
            fontSize: i === 1 ? 'clamp(22px,2.4vw,36px)' : 'clamp(16px,1.6vw,24px)',
            fontWeight: i === 1 ? 700 : 400,
            color: i === 1 ? 'rgba(255,255,255,0.98)' : 'rgba(245,243,247,0.78)',
            letterSpacing: i === 1 ? '-0.025em' : 'normal',
          }}>
            {lineIdx >= i ? (
              doneMask[i]
                ? lines[i]
                : <CinematicText
                    text={lines[i]}
                    playing={lineIdx === i}
                    speed={SPEED[i]}
                    duration={DURATION[i]}
                    onDone={() => onLineDone(i)}
                  />
            ) : null}
          </span>
        </div>
      ))}
    </div>
  );
}
