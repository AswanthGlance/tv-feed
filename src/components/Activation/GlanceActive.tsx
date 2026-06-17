import { useEffect } from 'react';

const breatheKeyframes = `
@keyframes breathe {
  0%   { transform: scale(1);    opacity: 0.75; box-shadow: 0 0 60px 20px rgba(112,71,226,0.35); }
  50%  { transform: scale(1.12); opacity: 1;    box-shadow: 0 0 120px 50px rgba(112,71,226,0.55); }
  100% { transform: scale(1);    opacity: 0.75; box-shadow: 0 0 60px 20px rgba(112,71,226,0.35); }
}
`;

export default function GlanceActive({ onNext }: { onNext: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNext(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onNext]);

  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        background: '#010101',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{breatheKeyframes}</style>

      {/* Ambient background glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 55%, rgba(112,71,226,0.20) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* Glance logo */}
      <div style={{ position: 'absolute', top: 56, left: 72, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 34, background: 'linear-gradient(135deg, #A786E5, #7047E2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>✦</span>
        <span style={{ fontSize: 26, fontWeight: 700, color: '#F5F3F7' }}>Glance AI</span>
      </div>

      {/* Breathing orb */}
      <div style={{
        width: 200,
        height: 200,
        borderRadius: '50%',
        background: 'radial-gradient(circle, #A786E5 0%, #7047E2 50%, #3a1a7a 100%)',
        animation: 'breathe 2.8s ease infinite',
        marginBottom: 52,
        zIndex: 1,
      }} />

      {/* Text content */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, textAlign: 'center' }}>
        <h1 style={{
          fontSize: 64,
          fontWeight: 800,
          color: '#F5F3F7',
          margin: '0 0 20px',
          lineHeight: 1.1,
          letterSpacing: -0.5,
        }}>
          Glance is now active
        </h1>
        <p style={{
          fontSize: 26,
          color: 'rgba(245,243,247,0.65)',
          margin: '0 0 60px',
          maxWidth: 680,
          lineHeight: 1.5,
        }}>
          Your TV is ready. Now let's tune what shows up.
        </p>

        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <button
            tabIndex={-1}
            onClick={onNext}
            style={{
              padding: '22px 60px',
              fontSize: 26,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #7047E2 0%, #A786E5 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 56,
              cursor: 'pointer',
              boxShadow: '0 4px 32px rgba(112,71,226,0.45)',
              letterSpacing: 0.3,
            }}
          >
            Let's personalise
          </button>
          <button
            tabIndex={-1}
            onClick={onNext}
            style={{
              padding: '22px 40px',
              fontSize: 22,
              fontWeight: 500,
              background: 'transparent',
              color: '#A786E5',
              border: '1px solid rgba(167,134,229,0.4)',
              borderRadius: 56,
              cursor: 'pointer',
            }}
          >
            Skip setup
          </button>
        </div>
      </div>
    </div>
  );
}
