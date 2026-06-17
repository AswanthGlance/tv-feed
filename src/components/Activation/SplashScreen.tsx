import { useEffect, useRef } from 'react';

const HERO_IMAGES = [
  '/images/feed/feed_21-travel-tea-gardens-munnar.jpg',
  '/images/feed/feed_09-travel-rajasthan-forts.jpg',
  '/images/feed/feed_25-travel-kerala-backwaters.jpg',
];

const GRADIENT_FALLBACKS = [
  'radial-gradient(ellipse at 60% 40%, #3b1d6e 0%, #0d0620 100%)',
  'radial-gradient(ellipse at 30% 70%, #1a3a2a 0%, #0a1a10 100%)',
  'radial-gradient(ellipse at 70% 30%, #4a1a2a 0%, #0d0620 100%)',
];

export default function SplashScreen({ onNext }: { onNext: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNext(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onNext]);

  return (
    <div
      ref={ref}
      tabIndex={0}
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
        outline: 'none',
      }}
    >
      {/* Background ambient glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 60%, rgba(112,71,226,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Glance logo top-left */}
      <div style={{
        position: 'absolute', top: 56, left: 72,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{
          fontSize: 38,
          background: 'linear-gradient(135deg, #A786E5 0%, #7047E2 50%, #c084fc 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 800,
        }}>✦</span>
        <span style={{
          fontSize: 30,
          fontWeight: 700,
          color: '#F5F3F7',
          letterSpacing: 0.5,
        }}>Glance</span>
      </div>

      {/* Center content */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, zIndex: 1 }}>
        {/* Eyebrow */}
        <div style={{
          fontSize: 22,
          fontWeight: 600,
          color: '#A786E5',
          letterSpacing: 4,
          textTransform: 'uppercase',
          marginBottom: 20,
        }}>Make your TV feel more like you.</div>

        {/* Headline — COPY-DECISION: full rewrite, 'smart screen' replaces 'screensaver' */}
        <h1 style={{
          fontSize: 68,
          fontWeight: 800,
          color: '#F5F3F7',
          textAlign: 'center',
          margin: 0,
          lineHeight: 1.1,
          letterSpacing: -1,
          maxWidth: 900,
        }}>
          A few quick choices help Glance bring you{' '}
          <span style={{
            background: 'linear-gradient(90deg, #A786E5 0%, #7047E2 60%, #c084fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>moments that feel closer</span>
          {' '}to your taste.
        </h1>

        {/* Hero card stack */}
        <div style={{
          position: 'relative',
          width: 520,
          height: 220,
          margin: '52px 0 44px',
        }}>
          {HERO_IMAGES.map((src, i) => {
            const offsets = [
              { left: 0, top: 20, rotate: -6, zIndex: 1 },
              { left: 150, top: 0, rotate: 0, zIndex: 2 },
              { left: 300, top: 16, rotate: 5, zIndex: 1 },
            ];
            const o = offsets[i];
            return (
              <div
                key={src}
                style={{
                  position: 'absolute',
                  left: o.left,
                  top: o.top,
                  width: 180,
                  height: 200,
                  borderRadius: 16,
                  overflow: 'hidden',
                  transform: `rotate(${o.rotate}deg)`,
                  zIndex: o.zIndex,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                  border: '2px solid rgba(167,134,229,0.25)',
                  background: GRADIENT_FALLBACKS[i],
                }}
              >
                <img
                  src={src}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            );
          })}
        </div>

        {/* CTAs */}
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
              letterSpacing: 0.3,
              boxShadow: '0 4px 32px rgba(112,71,226,0.45)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.04)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
          >
            Start
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
              letterSpacing: 0.2,
            }}
          >
            Skip for now
          </button>
        </div>
      </div>

      {/* Legal text */}
      <div style={{
        position: 'absolute',
        bottom: 48,
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: 18,
        color: 'rgba(167,134,229,0.55)',
        textAlign: 'center',
        maxWidth: 760,
        lineHeight: 1.5,
      }}>
        Your choices help Glance tune what appears on this TV. You can manage this anytime in settings.
      </div>
    </div>
  );
}
