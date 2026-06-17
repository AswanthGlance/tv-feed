import { useEffect, useState } from 'react';
import type { FeedItem } from '../../data/types';
import { getDeepContent } from '../../data/deepContent';

type Props = {
  item: FeedItem;
  onClose: () => void;
  onSave: () => void;
};

export default function DeepDive({ item, onClose, onSave }: Props) {
  const content = getDeepContent(item.title, item.category);
  const [focusIdx, setFocusIdx] = useState(0);
  const totalFocusable = content.cards.length + 2; // cards + save + close

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); setFocusIdx(i => Math.min(totalFocusable - 1, i + 1)); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); setFocusIdx(i => Math.max(0, i - 1)); }
      if (e.key === 'Escape' || e.key === 'Backspace') { e.preventDefault(); onClose(); }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (focusIdx === content.cards.length) onSave();
        else if (focusIdx === content.cards.length + 1) onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focusIdx, content.cards.length, onClose, onSave, totalFocusable]);

  const focused = (idx: number) => focusIdx === idx;

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 20,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Blurred bg */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${item.image})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        transform: 'scale(1.08)',
        filter: 'blur(22px) brightness(0.42) saturate(1.15)',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(5,2,8,0.5), rgba(5,2,8,0.82))',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 2,
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '0 90px',
      }}>
        {/* Kicker */}
        <div style={{
          fontSize: 15, fontWeight: 700, letterSpacing: '0.24em',
          color: '#EBB6FF', textTransform: 'uppercase',
          textShadow: '0 0 18px rgba(194,77,194,0.5)',
          marginBottom: 14,
        }}>
          {content.kicker}
        </div>

        {/* Title */}
        <h2 style={{
          fontFamily: 'var(--serif)', fontWeight: 600, fontSize: 54,
          lineHeight: 1.04, letterSpacing: -0.3, color: '#fff',
          marginBottom: 12, textShadow: '0 2px 24px rgba(0,0,0,0.55)',
        }}>
          {item.title}
        </h2>

        {/* Lede */}
        <p style={{
          fontSize: 21, lineHeight: 1.45,
          color: 'rgba(245,243,247,0.82)',
          maxWidth: '60ch', marginBottom: 36,
        }}>
          {content.lede}
        </p>

        {/* Cards */}
        <div style={{ display: 'flex', gap: 22, alignItems: 'stretch', marginBottom: 34 }}>
          {content.cards.map((card, i) => (
            <div
              key={i}
              style={{
                flex: '1 1 0', maxWidth: 432,
                background: 'rgba(20,14,46,0.5)',
                backdropFilter: 'blur(16px)',
                border: focused(i) ? '1px solid #fff' : '1px solid rgba(167,134,229,0.22)',
                borderRadius: 22, padding: '28px 26px',
                transform: focused(i) ? 'translateY(-8px)' : 'none',
                boxShadow: focused(i) ? '0 0 0 2px rgba(2,1,8,0.6), 0 0 0 4px #fff, 0 26px 56px rgba(0,0,0,0.55)' : 'none',
                transition: 'transform 0.18s ease, border-color 0.18s, box-shadow 0.18s',
                cursor: 'pointer',
              }}
              onClick={() => setFocusIdx(i)}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg,#5B8CFF,#C24DFF 55%,#FF5DA2)',
                color: '#fff', fontSize: 17, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 18,
                boxShadow: '0 6px 18px rgba(194,77,194,0.42)',
              }}>
                {i + 1}
              </div>
              <div style={{ fontFamily: 'var(--serif)', fontWeight: 600, fontSize: 22, color: '#fff', marginBottom: 10, lineHeight: 1.2 }}>
                {card.h}
              </div>
              <div style={{ fontSize: 16, lineHeight: 1.5, color: 'rgba(245,243,247,0.78)' }}>
                {card.b}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <button
            onClick={onSave}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: focused(content.cards.length) ? '#F4F2F7' : 'rgba(244,242,247,0.12)',
              color: focused(content.cards.length) ? '#111' : '#fff',
              border: 'none', borderRadius: 999, padding: '15px 30px',
              fontSize: 18, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'var(--sans)',
              boxShadow: focused(content.cards.length) ? '0 0 0 3px rgba(2,1,8,0.65), 0 0 0 6px #fff, 0 0 26px rgba(255,255,255,0.5)' : '0 8px 24px rgba(0,0,0,0.4)',
              transform: focused(content.cards.length) ? 'scale(1.05)' : 'none',
              transition: 'all 0.16s',
            }}
          >
            ✦ Save for later
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', color: '#B7B3C0', fontSize: 18,
              fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)',
              border: '1px solid rgba(167,134,229,0.2)', borderRadius: 999,
              padding: '13px 28px',
              boxShadow: focused(content.cards.length + 1) ? '0 0 0 3px rgba(2,1,8,0.65), 0 0 0 6px #fff' : 'none',
              transform: focused(content.cards.length + 1) ? 'scale(1.04)' : 'none',
              transition: 'all 0.16s',
            }}
          >
            Back to feed
          </button>
        </div>

        {/* Hint */}
        <div style={{
          position: 'absolute', left: 90, bottom: 42,
          color: 'rgba(245,243,247,0.5)', fontSize: 15,
        }}>
          Left/Right to browse · OK to select · Back to feed
        </div>
      </div>
    </div>
  );
}
