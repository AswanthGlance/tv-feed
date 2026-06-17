import { useEffect, useState } from 'react';

export default function CalibrationEntry({
  onTune,
  onSkip,
}: {
  onTune: () => void;
  onSkip: () => void;
}) {
  const [focusIdx, setFocusIdx] = useState(0);
  const actions = [onTune, onSkip];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); setFocusIdx(i => Math.max(0, i - 1)); }
      if (e.key === 'ArrowRight') { e.preventDefault(); setFocusIdx(i => Math.min(1, i + 1)); }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); actions[focusIdx](); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focusIdx, onTune, onSkip]);

  const btnStyle = (idx: number, primary: boolean): React.CSSProperties => ({
    padding: primary ? '24px 64px' : '24px 48px',
    fontSize: 26,
    fontWeight: primary ? 700 : 500,
    background: primary
      ? 'linear-gradient(135deg, #7047E2 0%, #A786E5 100%)'
      : 'transparent',
    color: primary ? '#fff' : '#A786E5',
    border: primary ? 'none' : '1.5px solid rgba(167,134,229,0.45)',
    borderRadius: 56,
    cursor: 'pointer',
    letterSpacing: 0.3,
    boxShadow: primary ? '0 4px 32px rgba(112,71,226,0.45)' : 'none',
    outline: focusIdx === idx ? '3px solid #A786E5' : 'none',
    outlineOffset: 4,
    transition: 'outline 0.1s',
  });

  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        background: '#010101',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 40% 50%, rgba(112,71,226,0.15) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      {/* Glance logo */}
      <div style={{ position: 'absolute', top: 56, left: 72, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 34, background: 'linear-gradient(135deg, #A786E5, #7047E2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>✦</span>
        <span style={{ fontSize: 26, fontWeight: 700, color: '#F5F3F7' }}>Glance AI</span>
      </div>

      {/* Left column */}
      <div style={{
        paddingLeft: 144,
        flex: 1,
        zIndex: 1,
        maxWidth: 900,
      }}>
        <div style={{ fontSize: 20, color: '#A786E5', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 24, fontWeight: 600 }}>
          Personalisation
        </div>
        <h1 style={{
          fontSize: 72,
          fontWeight: 800,
          color: '#F5F3F7',
          margin: '0 0 28px',
          lineHeight: 1.05,
          letterSpacing: -1,
        }}>
          Tune what shows up<br />on your TV
        </h1>
        <p style={{
          fontSize: 24,
          color: 'rgba(245,243,247,0.6)',
          lineHeight: 1.6,
          maxWidth: 680,
          margin: 0,
        }}>
          Pick a few quick things and we'll shape your first Glance feed around your taste. Skip for now and we'll keep learning as you watch.
        </p>
      </div>

      {/* Right column — CTAs */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        paddingRight: 144,
        zIndex: 1,
        flexShrink: 0,
      }}>
        <button tabIndex={-1} onClick={onTune} style={btnStyle(0, true)}>
          Tune my feed
        </button>
        <button tabIndex={-1} onClick={onSkip} style={btnStyle(1, false)}>
          Skip for now
        </button>
      </div>
    </div>
  );
}
