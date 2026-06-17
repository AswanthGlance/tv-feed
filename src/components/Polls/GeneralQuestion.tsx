import { useEffect, useRef, useState } from 'react';
import type { GenQuestion, GenOption } from '../../data/generalQuestions';

type Props = {
  question: GenQuestion;
  backgroundImage: string;
  onAnswer: (option: GenOption) => void;
  onDismiss: () => void;
};

const AUTO_DISMISS_MS = 10000;

export default function GeneralQuestion({ question, backgroundImage, onAnswer, onDismiss }: Props) {
  const [focusIdx, setFocusIdx] = useState(0);
  const [barWidth, setBarWidth] = useState(100);
  const barRef = useRef<HTMLDivElement>(null);

  // Progress bar countdown
  useEffect(() => {
    const start = Date.now();
    const raf = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / AUTO_DISMISS_MS) * 100);
      setBarWidth(pct);
      if (pct <= 0) {
        clearInterval(raf);
        onDismiss();
      }
    }, 100);
    return () => clearInterval(raf);
  }, [onDismiss]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); setFocusIdx(0); }
      if (e.key === 'ArrowRight') { e.preventDefault(); setFocusIdx(1); }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAnswer(question.options[focusIdx]); }
      if (e.key === 'Escape' || e.key === 'Backspace') { e.preventDefault(); onDismiss(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focusIdx, question, onAnswer, onDismiss]);

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 18,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      {/* Bg */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(5,3,14,0.96), rgba(5,3,14,0.72) 55%, rgba(19,12,44,0.55))',
      }} />

      {/* Card */}
      <div style={{
        position: 'relative', zIndex: 2,
        marginBottom: 140,
        background: 'rgba(19,12,44,0.92)',
        border: '1px solid rgba(167,134,229,0.16)',
        borderRadius: 20, padding: '36px 44px',
        maxWidth: 720, textAlign: 'center',
        boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(112,71,226,0.25)',
        width: '100%',
      }}>
        <div style={{
          fontFamily: 'var(--sans)', fontWeight: 600, fontSize: 32,
          letterSpacing: -0.5, lineHeight: 1.2, color: '#F5F3F7',
          marginBottom: 28,
        }}>
          {question.question}
        </div>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          {question.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => onAnswer(opt)}
              onMouseEnter={() => setFocusIdx(i)}
              style={{
                padding: '18px 32px', borderRadius: 999, fontSize: 21, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--sans)',
                background: focusIdx === i ? '#F4F2F7' : 'rgba(255,255,255,0.06)',
                color: focusIdx === i ? '#111' : '#F5F3F7',
                border: focusIdx === i ? 'none' : '1px solid rgba(255,255,255,0.18)',
                boxShadow: focusIdx === i ? '0 0 0 4px #0d0a1e, 0 0 0 7px #fff, 0 0 34px rgba(255,255,255,0.4)' : 'none',
                transform: focusIdx === i ? 'scale(1.05)' : 'none',
                transition: 'all 0.18s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 4,
          background: 'rgba(167,134,229,0.15)', borderRadius: '0 0 20px 20px', overflow: 'hidden',
        }}>
          <div ref={barRef} style={{
            height: '100%', width: `${barWidth}%`,
            background: '#A786E5',
            boxShadow: '0 0 12px #7047E2',
            transition: 'width 0.1s linear',
          }} />
        </div>
      </div>
    </div>
  );
}
