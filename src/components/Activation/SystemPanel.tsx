import { useEffect } from 'react';

const OPTIONS = [
  { id: 'backdrop', label: 'Backdrop', note: 'Currently set' },
  { id: 'glance', label: 'Glance AI', note: 'Recommended' },
  { id: 'photos', label: 'Photos', note: '' },
];

export default function SystemPanel({ onNext }: { onNext: () => void }) {
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
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background blur/glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 50%, rgba(112,71,226,0.10) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      {/* Simulated macOS/tvOS System Panel */}
      <div style={{
        background: 'rgba(28,22,48,0.92)',
        backdropFilter: 'blur(32px)',
        border: '1px solid rgba(167,134,229,0.2)',
        borderRadius: 28,
        width: 780,
        padding: '48px 56px 56px',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        zIndex: 1,
      }}>
        {/* Panel header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, #7047E2, #A786E5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, color: '#fff',
          }}>
            🖥
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#F5F3F7' }}>Screen Saver</div>
            <div style={{ fontSize: 16, color: 'rgba(245,243,247,0.5)', marginTop: 2 }}>System Settings</div>
          </div>
        </div>

        {/* Options list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 40 }}>
          {OPTIONS.map((opt) => {
            const isGlance = opt.id === 'glance';
            return (
              <div
                key={opt.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '18px 24px',
                  borderRadius: 16,
                  background: isGlance
                    ? 'rgba(112,71,226,0.22)'
                    : 'rgba(255,255,255,0.04)',
                  border: isGlance
                    ? '1.5px solid rgba(112,71,226,0.6)'
                    : '1px solid rgba(255,255,255,0.07)',
                  cursor: 'default',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {/* Radio indicator */}
                  <div style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    border: isGlance ? '2px solid #7047E2' : '2px solid rgba(167,134,229,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {isGlance && (
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#7047E2' }} />
                    )}
                  </div>
                  <span style={{
                    fontSize: 22,
                    fontWeight: isGlance ? 700 : 400,
                    color: isGlance ? '#F5F3F7' : 'rgba(245,243,247,0.7)',
                  }}>
                    {opt.label}
                  </span>
                </div>
                {opt.note && (
                  <span style={{
                    fontSize: 14,
                    color: isGlance ? '#A786E5' : 'rgba(245,243,247,0.4)',
                    background: isGlance ? 'rgba(112,71,226,0.25)' : 'transparent',
                    padding: isGlance ? '4px 12px' : '0',
                    borderRadius: 20,
                    fontWeight: 500,
                  }}>
                    {opt.note}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <button
          tabIndex={-1}
          onClick={onNext}
          style={{
            padding: '20px 0',
            fontSize: 24,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #7047E2 0%, #A786E5 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 50,
            cursor: 'pointer',
            letterSpacing: 0.3,
            boxShadow: '0 4px 24px rgba(112,71,226,0.4)',
            width: '100%',
          }}
        >
          Start Glance
        </button>
      </div>
    </div>
  );
}
