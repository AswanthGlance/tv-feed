import { useEffect, useState } from 'react';
import type { PreferenceProfile } from '../../data/types';
import { Q5_DISCOVERY_OPTIONS } from '../../data/onboardingQuestions';
import { setDiscoveryMode } from '../../logic/preferenceProfile';

type Props = {
  profile: PreferenceProfile;
  onNext: (p: PreferenceProfile) => void;
  onSkip: () => void;
};

export default function Q5Discovery({ profile, onNext, onSkip }: Props) {
  const total = Q5_DISCOVERY_OPTIONS.length;
  const [focusIdx, setFocusIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const showCta = selected !== null;
  const ctaIdx = total;
  const skipIdx = total + (showCta ? 1 : 0);
  const totalSlots = total + (showCta ? 1 : 0) + 1;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (focusIdx < total) {
        if (e.key === 'ArrowUp') { e.preventDefault(); setFocusIdx(i => Math.max(0, i - 1)); }
        if (e.key === 'ArrowDown') { e.preventDefault(); setFocusIdx(i => Math.min(total - 1, i + 1)); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); /* nothing, single column */ }
        if (e.key === 'ArrowRight') { e.preventDefault(); if (showCta) setFocusIdx(ctaIdx); }
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setSelected(Q5_DISCOVERY_OPTIONS[focusIdx].id);
        }
      } else {
        if (e.key === 'ArrowUp') { e.preventDefault(); setFocusIdx(i => Math.max(0, i - 1)); }
        if (e.key === 'ArrowDown') { e.preventDefault(); setFocusIdx(i => Math.min(totalSlots - 1, i + 1)); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); setFocusIdx(0); }
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (showCta && focusIdx === ctaIdx) { handleNext(); return; }
          if (focusIdx === skipIdx) { onSkip(); return; }
        }
      }
      if (e.key === 'Backspace' || e.key === 'Escape') { onSkip(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focusIdx, selected, totalSlots, showCta, onSkip]);

  const handleNext = () => {
    if (!selected) return;
    const p = setDiscoveryMode(profile, selected as any);
    onNext(p);
  };

  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        background: '#010101',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 40% 50%, rgba(112,71,226,0.12) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'absolute', top: 56, left: 72, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 30, background: 'linear-gradient(135deg, #A786E5, #7047E2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>✦</span>
        <span style={{ fontSize: 24, fontWeight: 700, color: '#F5F3F7' }}>Glance AI</span>
      </div>

      <div style={{ position: 'absolute', top: 60, right: 72, fontSize: 18, color: 'rgba(167,134,229,0.6)', fontWeight: 500 }}>
        3 of 3
      </div>

      {/* Left column — question + options */}
      <div style={{
        flex: 1,
        paddingTop: 140,
        paddingLeft: 144,
        paddingRight: 80,
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ fontSize: 20, color: '#A786E5', letterSpacing: 3, textTransform: 'uppercase', fontWeight: 600, marginBottom: 16 }}>
          Step 3 of 3
        </div>
        <h2 style={{ fontSize: 48, fontWeight: 800, color: '#F5F3F7', margin: '0 0 10px', letterSpacing: -0.5 }}>
          How adventurous should your feed feel?
        </h2>
        <p style={{ fontSize: 20, color: 'rgba(167,134,229,0.7)', margin: '0 0 40px' }}>
          Pick one — change anytime.
        </p>

        {/* Option rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Q5_DISCOVERY_OPTIONS.map((opt, i) => {
            const isSelected = selected === opt.id;
            const isFocused = focusIdx === i;
            return (
              <div
                key={opt.id}
                tabIndex={-1}
                onClick={() => { setFocusIdx(i); setSelected(opt.id); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 24,
                  padding: '20px 28px',
                  borderRadius: 20,
                  background: isSelected ? 'rgba(112,71,226,0.18)' : 'rgba(255,255,255,0.04)',
                  border: isSelected ? '1.5px solid rgba(112,71,226,0.55)' : isFocused ? '1.5px solid rgba(167,134,229,0.55)' : '1px solid rgba(255,255,255,0.07)',
                  cursor: 'pointer',
                  transition: 'background 0.2s, border 0.2s',
                  outline: 'none',
                }}
              >
                {/* Thumbnail */}
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: 14,
                  overflow: 'hidden',
                  flexShrink: 0,
                  background: 'radial-gradient(ellipse at 50% 50%, #2a1d4e, #0d0620)',
                }}>
                  <img
                    src={opt.image}
                    alt={opt.label}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                {/* Text */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 22, fontWeight: isSelected ? 700 : 600, color: '#F5F3F7', marginBottom: 4 }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: 16, color: 'rgba(245,243,247,0.6)', lineHeight: 1.4 }}>
                    {opt.description}
                  </div>
                </div>
                {/* Radio */}
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  border: isSelected ? '2px solid #7047E2' : '2px solid rgba(167,134,229,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {isSelected && <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#7047E2' }} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right column — CTAs */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        paddingRight: 144,
        gap: 20,
        zIndex: 1,
        flexShrink: 0,
      }}>
        {showCta && (
          <button
            tabIndex={-1}
            onClick={handleNext}
            style={{
              padding: '22px 52px',
              fontSize: 24,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #7047E2 0%, #A786E5 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 50,
              cursor: 'pointer',
              boxShadow: '0 4px 24px rgba(112,71,226,0.45)',
              outline: focusIdx === ctaIdx ? '3px solid #A786E5' : 'none',
              outlineOffset: 4,
              whiteSpace: 'nowrap',
            }}
          >
            Start my feed
          </button>
        )}
        <button
          tabIndex={-1}
          onClick={onSkip}
          style={{
            padding: '22px 40px',
            fontSize: 20,
            fontWeight: 500,
            background: 'transparent',
            color: 'rgba(167,134,229,0.7)',
            border: '1px solid rgba(167,134,229,0.3)',
            borderRadius: 50,
            cursor: 'pointer',
            outline: focusIdx === skipIdx ? '3px solid #A786E5' : 'none',
            outlineOffset: 4,
            whiteSpace: 'nowrap',
          }}
        >
          Skip for now
        </button>
      </div>
      <div style={{ marginTop: 10, fontSize: 15, color: 'rgba(167,134,229,0.4)', zIndex: 1 }}>
        Skip for now — Glance will keep learning as you watch.
      </div>
    </div>
  );
}
