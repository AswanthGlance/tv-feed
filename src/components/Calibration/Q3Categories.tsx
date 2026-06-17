import { useEffect, useState } from 'react';
import type { PreferenceProfile } from '../../data/types';
import { Q3_CATEGORY_OPTIONS } from '../../data/onboardingQuestions';
import { applyOnboardingSignal } from '../../logic/signals';

const MAX_SELECT = 5;
const COLS = 4;
const INITIAL_SHOW = 4;

type Props = {
  profile: PreferenceProfile;
  onNext: (p: PreferenceProfile) => void;
  onSkip: () => void;
};

export default function Q3Categories({ profile, onNext, onSkip }: Props) {
  const [expanded, setExpanded] = useState(false);
  const visibleOptions = expanded ? Q3_CATEGORY_OPTIONS : Q3_CATEGORY_OPTIONS.slice(0, INITIAL_SHOW);
  const total = visibleOptions.length;
  const hasMore = !expanded;
  // Focus order: tiles, then See More (if not expanded), then Build (if selected), then Skip
  const [focusIdx, setFocusIdx] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);

  const seeMoreSlot = hasMore ? 1 : 0;
  const btnCount = seeMoreSlot + (selected.length > 0 ? 1 : 0) + 1; // See More + Build + Skip
  const totalSlots = total + btnCount;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (focusIdx < total) {
        // navigating tiles
        if (e.key === 'ArrowRight') { e.preventDefault(); setFocusIdx(i => Math.min(total - 1, i + 1)); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); setFocusIdx(i => Math.max(0, i - 1)); }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const next = focusIdx + COLS;
          setFocusIdx(next < total ? next : total); // move to Build btn row
        }
        if (e.key === 'ArrowUp') { e.preventDefault(); setFocusIdx(i => Math.max(0, i - COLS)); }
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const id = Q3_CATEGORY_OPTIONS[focusIdx].id;
          setSelected(prev => {
            if (prev.includes(id)) return prev.filter(x => x !== id);
            if (prev.length >= MAX_SELECT) return prev;
            return [...prev, id];
          });
        }
      } else {
        // navigating buttons
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); setFocusIdx(i => Math.max(0, i - 1)); }
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); setFocusIdx(i => Math.min(totalSlots - 1, i + 1)); }
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const seeMoreIdx = total;
          const buildIdx = total + seeMoreSlot;
          const skipIdx = total + seeMoreSlot + (selected.length > 0 ? 1 : 0);
          if (hasMore && focusIdx === seeMoreIdx) { setExpanded(true); setFocusIdx(0); return; }
          if (selected.length > 0 && focusIdx === buildIdx) { handleBuild(); return; }
          if (focusIdx === skipIdx) { onSkip(); return; }
        }
      }
      if (e.key === 'Backspace' || e.key === 'Escape') { onSkip(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focusIdx, selected, totalSlots, onSkip]);

  const handleBuild = () => {
    let p: PreferenceProfile = {
      ...profile,
      weights: { ...profile.weights },
      negativeWeights: { ...profile.negativeWeights },
      selectedQ3Categories: selected,
    };
    for (const id of selected) {
      const opt = Q3_CATEGORY_OPTIONS.find(o => o.id === id)!;
      applyOnboardingSignal(p, opt.mappedAttributes, opt.label);
    }
    onNext(p);
  };

  const seeMoreIdx = total;
  const buildIdx = total + seeMoreSlot;
  const skipIdx = total + seeMoreSlot + (selected.length > 0 ? 1 : 0);

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
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 50%, rgba(112,71,226,0.12) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'absolute', top: 56, left: 72, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 30, background: 'linear-gradient(135deg, #A786E5, #7047E2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>✦</span>
        <span style={{ fontSize: 24, fontWeight: 700, color: '#F5F3F7' }}>Glance AI</span>
      </div>

      <div style={{ position: 'absolute', top: 60, right: 72, fontSize: 18, color: 'rgba(167,134,229,0.6)', fontWeight: 500 }}>
        3 of 5
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 36, zIndex: 1 }}>
        <div style={{ fontSize: 20, color: '#A786E5', letterSpacing: 3, textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>
          Question 3
        </div>
        <h2 style={{ fontSize: 46, fontWeight: 800, color: '#F5F3F7', margin: '0 0 10px', letterSpacing: -0.5 }}>
          What excites you? We'll build your feed around it.
        </h2>
        <div style={{ fontSize: 18, color: 'rgba(167,134,229,0.7)' }}>
          Up to {MAX_SELECT} works best · {selected.length}/{MAX_SELECT} selected
        </div>
      </div>

      {/* Tile grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${COLS}, 220px)`,
        gap: 20,
        zIndex: 1,
        marginBottom: 36,
      }}>
        {visibleOptions.map((opt, i) => {
          const isSelected = selected.includes(opt.id);
          const isFocused = focusIdx === i;
          return (
            <div
              key={opt.id}
              tabIndex={-1}
              onClick={() => {
                setFocusIdx(i);
                setSelected(prev => {
                  if (prev.includes(opt.id)) return prev.filter(x => x !== opt.id);
                  if (prev.length >= MAX_SELECT) return prev;
                  return [...prev, opt.id];
                });
              }}
              style={{
                width: 220,
                height: 200,
                borderRadius: 18,
                overflow: 'hidden',
                position: 'relative',
                cursor: 'pointer',
                outline: isFocused ? '3px solid #A786E5' : isSelected ? '3px solid #c084fc' : '3px solid transparent',
                outlineOffset: 3,
                boxShadow: isSelected ? '0 0 0 3px rgba(192,132,252,0.4), 0 8px 24px rgba(0,0,0,0.5)' : '0 4px 16px rgba(0,0,0,0.4)',
                background: 'radial-gradient(ellipse at 50% 40%, #2a1d4e, #0d0620)',
                transition: 'opacity 0.2s',
                opacity: !isSelected && selected.length >= MAX_SELECT ? 0.5 : 1,
              }}
            >
              <img
                src={opt.image}
                alt={opt.label}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)',
              }} />
              {isSelected && (
                <div style={{
                  position: 'absolute', top: 10, right: 10,
                  width: 28, height: 28, borderRadius: '50%',
                  background: '#7047E2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, color: '#fff', fontWeight: 700,
                }}>✓</div>
              )}
              <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#F5F3F7', marginBottom: 2 }}>{opt.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(245,243,247,0.65)', lineHeight: 1.3 }}>{opt.micro}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 20, zIndex: 1, alignItems: 'center' }}>
        {hasMore && (
          <button
            tabIndex={-1}
            onClick={() => { setExpanded(true); setFocusIdx(0); }}
            style={{
              padding: '18px 44px', fontSize: 20, fontWeight: 600,
              background: 'rgba(112,71,226,0.15)',
              color: '#A786E5',
              border: '1px solid rgba(167,134,229,0.4)',
              borderRadius: 50, cursor: 'pointer',
              outline: focusIdx === seeMoreIdx ? '3px solid #A786E5' : 'none',
              outlineOffset: 4,
            }}
          >
            See {Q3_CATEGORY_OPTIONS.length - INITIAL_SHOW} more worlds ↓
          </button>
        )}
        {selected.length > 0 && (
          <button
            tabIndex={-1}
            onClick={handleBuild}
            style={{
              padding: '18px 52px', fontSize: 22, fontWeight: 700,
              background: 'linear-gradient(135deg, #7047E2 0%, #A786E5 100%)',
              color: '#fff', border: 'none', borderRadius: 50, cursor: 'pointer',
              boxShadow: '0 4px 24px rgba(112,71,226,0.45)',
              outline: focusIdx === buildIdx ? '3px solid #A786E5' : 'none',
              outlineOffset: 4,
            }}
          >
            Build my feed
          </button>
        )}
        <button
          tabIndex={-1}
          onClick={onSkip}
          style={{
            padding: '18px 40px', fontSize: 20, fontWeight: 500,
            background: 'transparent',
            color: 'rgba(167,134,229,0.5)',
            border: '1px solid rgba(167,134,229,0.2)',
            borderRadius: 50, cursor: 'pointer',
            outline: focusIdx === skipIdx ? '3px solid #A786E5' : 'none',
            outlineOffset: 4,
          }}
        >
          Skip for now
        </button>
      </div>
      <div style={{ marginTop: 10, fontSize: 15, color: 'rgba(167,134,229,0.4)', zIndex: 1 }}>
        You can skip — your feed sharpens as you watch, and you can set this up anytime.
      </div>
    </div>
  );
}
