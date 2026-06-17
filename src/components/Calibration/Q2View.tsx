// Q2 — World/vibe-led preference question.
// User picks visual worlds; system infers category + vibe + culture signals.
// User never sees category taxonomy words.

import { useEffect, useState } from 'react';
import type { PreferenceProfile } from '../../data/types';
import { Q2_WORLD_OPTIONS } from '../../data/onboardingQuestions';
import { applyOnboardingSignal } from '../../logic/signals';

const MAX_SELECT = 2;

type Props = {
  profile: PreferenceProfile;
  onNext: (p: PreferenceProfile) => void;
  onSkip: () => void;
};

export default function Q2View({ profile, onNext, onSkip }: Props) {
  const [focusIdx, setFocusIdx] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);

  const total = Q2_WORLD_OPTIONS.length;
  const COLS = 3;
  // Slots: tiles + (Next if any selected) + Skip
  const btnCount = (selected.length > 0 ? 1 : 0) + 1;
  const totalSlots = total + btnCount;
  const nextIdx = total;
  const skipIdx = total + (selected.length > 0 ? 1 : 0);

  const toggle = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id)
      : prev.length >= MAX_SELECT ? prev
      : [...prev, id]
    );
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (focusIdx < total) {
        if (e.key === 'ArrowRight') { e.preventDefault(); setFocusIdx(i => Math.min(total - 1, i + 1)); }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); setFocusIdx(i => Math.max(0, i - 1)); }
        if (e.key === 'ArrowDown')  { e.preventDefault(); const n = focusIdx + COLS; setFocusIdx(n < total ? n : nextIdx); }
        if (e.key === 'ArrowUp')    { e.preventDefault(); setFocusIdx(i => Math.max(0, i - COLS)); }
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(Q2_WORLD_OPTIONS[focusIdx].id); }
      } else {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp')   { e.preventDefault(); setFocusIdx(total - 1); }
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); setFocusIdx(i => Math.min(totalSlots - 1, i + 1)); }
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (selected.length > 0 && focusIdx === nextIdx) { handleDone(); return; }
          if (focusIdx === skipIdx) { onSkip(); return; }
        }
      }
      if (e.key === 'Backspace' || e.key === 'Escape') onSkip();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focusIdx, selected, totalSlots, nextIdx, skipIdx, onSkip]);

  const handleDone = () => {
    let p: PreferenceProfile = {
      ...profile,
      weights: { ...profile.weights },
      negativeWeights: { ...profile.negativeWeights },
      selectedQ2Worlds: selected,
    };
    for (const id of selected) {
      const opt = Q2_WORLD_OPTIONS.find(o => o.id === id)!;
      applyOnboardingSignal(p, opt.mappedAttributes, opt.label);
    }
    onNext(p);
  };

  // Confirmation text — user-facing world language, not taxonomy
  const confirmText = () => {
    const labels = selected.map(id => Q2_WORLD_OPTIONS.find(o => o.id === id)?.label || '');
    if (labels.length === 0) return '';
    if (labels.length === 1) return `✦ We'll start with more ${labels[0].toLowerCase()}.`;
    return `✦ We'll start with more ${labels[0].toLowerCase()} and ${labels[1].toLowerCase()}.`;
  };

  return (
    <div style={{
      width: 1920, height: 1080, background: '#010101',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(112,71,226,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />

      {/* Logo */}
      <div style={{ position: 'absolute', top: 56, left: 72, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 30, background: 'linear-gradient(135deg, #A786E5, #7047E2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>✦</span>
        <span style={{ fontSize: 24, fontWeight: 700, color: '#F5F3F7' }}>Glance AI</span>
      </div>
      <div style={{ position: 'absolute', top: 60, right: 72, fontSize: 18, color: 'rgba(167,134,229,0.6)', fontWeight: 500 }}>
        2 of 3
      </div>

      {/* Question header */}
      <div style={{ textAlign: 'center', marginBottom: 36, zIndex: 1 }}>
        <div style={{ fontSize: 18, color: '#A786E5', letterSpacing: 3, textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>
          Step 2 of 3
        </div>
        <h2 style={{ fontSize: 46, fontWeight: 800, color: '#F5F3F7', margin: '0 0 10px', letterSpacing: -0.5 }}>
          What else should Glance bring into your feed?
        </h2>
        <p style={{ fontSize: 20, color: '#B7B3C0', margin: 0 }}>
          Pick up to two. You can change this later.{' '}
          <span style={{ color: 'rgba(167,134,229,0.55)' }}>
            {selected.length > 0 ? `${selected.length} of 2 chosen` : 'Pick up to 2'}
          </span>
        </p>
      </div>

      {/* World cards — 3×2 grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 300px)',
        gap: 20, zIndex: 1, marginBottom: 32,
      }}>
        {Q2_WORLD_OPTIONS.map((opt, i) => {
          const isSelected = selected.includes(opt.id);
          const isFocused = focusIdx === i;
          const atMax = selected.length >= MAX_SELECT && !isSelected;
          return (
            <div
              key={opt.id}
              tabIndex={-1}
              onClick={() => { if (!atMax) { toggle(opt.id); setFocusIdx(i); } }}
              style={{
                height: 280, borderRadius: 22, overflow: 'hidden',
                position: 'relative', cursor: atMax ? 'default' : 'pointer',
                opacity: atMax ? 0.45 : 1,
                outline: isFocused ? '3px solid #A786E5' : isSelected ? '3px solid #c084fc' : '3px solid transparent',
                outlineOffset: 4,
                boxShadow: isSelected ? '0 0 0 4px rgba(192,132,252,0.5), 0 16px 48px rgba(0,0,0,0.6)' : '0 8px 32px rgba(0,0,0,0.5)',
                transition: 'opacity 0.2s, box-shadow 0.15s',
                background: 'radial-gradient(ellipse at 50% 30%, #2a1d4e, #0d0620)',
              }}
            >
              <img src={opt.image} alt={opt.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)' }} />
              {isSelected && (
                <div style={{
                  position: 'absolute', top: 14, right: 14,
                  width: 30, height: 30, borderRadius: '50%', background: '#7047E2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, color: '#fff', fontWeight: 700,
                }}>✓</div>
              )}
              <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#F5F3F7', marginBottom: 5 }}>{opt.label}</div>
                <div style={{ fontSize: 14, color: 'rgba(245,243,247,0.72)', lineHeight: 1.4 }}>{opt.sublabel}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation + CTAs */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, zIndex: 1 }}>
        {selected.length > 0 && (
          <div style={{ fontSize: 19, color: '#A786E5', fontWeight: 500, background: 'rgba(112,71,226,0.15)', border: '1px solid rgba(112,71,226,0.3)', borderRadius: 40, padding: '10px 28px' }}>
            {confirmText()}
          </div>
        )}
        <div style={{ display: 'flex', gap: 16 }}>
          {selected.length > 0 && (
            <button tabIndex={-1} onClick={handleDone} style={{
              padding: '18px 52px', fontSize: 22, fontWeight: 700,
              background: 'linear-gradient(135deg, #7047E2 0%, #A786E5 100%)',
              color: '#fff', border: 'none', borderRadius: 50, cursor: 'pointer',
              boxShadow: '0 4px 24px rgba(112,71,226,0.45)',
              outline: focusIdx === nextIdx ? '3px solid #A786E5' : 'none', outlineOffset: 4,
            }}>
              Bring these in

            </button>
          )}
          <button tabIndex={-1} onClick={onSkip} style={{
            padding: '18px 40px', fontSize: 20, fontWeight: 500,
            background: 'transparent', color: 'rgba(167,134,229,0.7)',
            border: '1px solid rgba(167,134,229,0.3)', borderRadius: 50, cursor: 'pointer',
            outline: focusIdx === skipIdx ? '3px solid #A786E5' : 'none', outlineOffset: 4,
          }}>
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
