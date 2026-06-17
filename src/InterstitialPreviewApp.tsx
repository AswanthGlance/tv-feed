/**
 * InterstitialPreviewApp — standalone preview for the interstitial question screens.
 * URL: http://localhost:5173/interstitial-preview.html
 * Use ← → buttons at top to cycle through all questions.
 */
import { useState } from 'react';
import { INTERSTITIAL_QUESTIONS } from './data/preferenceQuestions';
import InterstitialQuestion from './components/Polls/InterstitialQuestion';

export default function InterstitialPreviewApp() {
  const [idx, setIdx] = useState(0);
  const [key, setKey] = useState(0);
  const question = INTERSTITIAL_QUESTIONS[idx];

  function next() { setIdx(i => (i + 1) % INTERSTITIAL_QUESTIONS.length); setKey(k => k + 1); }
  function prev() { setIdx(i => (i - 1 + INTERSTITIAL_QUESTIONS.length) % INTERSTITIAL_QUESTIONS.length); setKey(k => k + 1); }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#080416' }}>
      <InterstitialQuestion
        key={key}
        question={question}
        currentL0Image={question.bgImage}
        onAnswer={() => { setTimeout(next, 300); }}
        onDismiss={next}
      />

      {/* Question nav — top center */}
      <div style={{
        position: 'fixed', top: 14, left: '50%', transform: 'translateX(-50%)',
        zIndex: 999, display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999,
        padding: '5px 16px',
        fontFamily: 'system-ui', fontSize: 12, color: 'rgba(255,255,255,0.55)',
        pointerEvents: 'auto',
      }}>
        <button onClick={prev} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: 15, padding: '0 2px' }}>←</button>
        <span>{idx + 1} / {INTERSTITIAL_QUESTIONS.length} — <span style={{ color: 'rgba(167,134,229,0.8)' }}>{question.id}</span></span>
        <button onClick={next} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: 15, padding: '0 2px' }}>→</button>
      </div>
    </div>
  );
}
