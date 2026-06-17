import { useEffect } from 'react';

const STEPS = [
  { num: 1, text: 'Open System Settings on your Apple TV.' },
  { num: 2, text: 'Choose  Screen Saver  from the panel.' },
  { num: 3, text: 'Select  Glance AI  from the list of screensavers.' },
];

export default function ScreensaverSetup({ onNext }: { onNext: () => void }) {
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
      {/* Background glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 50%, rgba(112,71,226,0.12) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* Glance logo */}
      <div style={{ position: 'absolute', top: 56, left: 72, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 34, background: 'linear-gradient(135deg, #A786E5, #7047E2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>✦</span>
        <span style={{ fontSize: 26, fontWeight: 700, color: '#F5F3F7' }}>Glance AI</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, maxWidth: 900 }}>
        {/* Progress pill */}
        <div style={{ fontSize: 18, color: '#A786E5', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 24, fontWeight: 600 }}>
          Step 2 of 3
        </div>

        <h1 style={{
          fontSize: 60,
          fontWeight: 800,
          color: '#F5F3F7',
          margin: '0 0 16px',
          textAlign: 'center',
          lineHeight: 1.1,
          letterSpacing: -0.5,
        }}>
          You're almost there!
        </h1>

        <p style={{ fontSize: 24, color: 'rgba(245,243,247,0.6)', marginBottom: 60, textAlign: 'center', lineHeight: 1.5 }}>
          Follow these quick steps to set Glance AI as your screensaver.
        </p>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', marginBottom: 64 }}>
          {STEPS.map((step) => (
            <div
              key={step.num}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 28,
                background: 'rgba(112,71,226,0.10)',
                border: '1px solid rgba(112,71,226,0.25)',
                borderRadius: 20,
                padding: '24px 36px',
              }}
            >
              <div style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #7047E2, #A786E5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                fontWeight: 800,
                color: '#fff',
                flexShrink: 0,
              }}>
                {step.num}
              </div>
              <span style={{ fontSize: 26, color: '#F5F3F7', fontWeight: 500, lineHeight: 1.4 }}>{step.text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          tabIndex={-1}
          onClick={onNext}
          style={{
            padding: '22px 64px',
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
          Set As Default Screen Saver
        </button>
      </div>
    </div>
  );
}
