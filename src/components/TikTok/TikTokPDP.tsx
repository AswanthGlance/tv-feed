import React, { useEffect, useRef, useState } from 'react';
import type { TikTokProduct } from '../../data/tiktokTypes';

type Props = {
  product: TikTokProduct;
  creatorHandle: string;
  onClose: () => void;
  toast: (msg: string) => void;
};

type ActionIdx = 0 | 1; // 0 = Shop on Phone, 1 = Back to video

export default function TikTokPDP({ product, creatorHandle, onClose, toast }: Props) {
  const [mounted, setMounted] = useState(false);
  const [actionIdx, setActionIdx] = useState<ActionIdx>(0);
  const [handoffVisible, setHandoffVisible] = useState(false);
  const handoffTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  function handleShop() {
    setHandoffVisible(true);
    toast('✓ Shop link sent to your phone');
    if (handoffTimer.current) clearTimeout(handoffTimer.current);
    handoffTimer.current = setTimeout(() => setHandoffVisible(false), 2400);
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key;
      if (key === 'Escape' || key === 'Backspace') {
        e.preventDefault();
        onClose();
      } else if (key === 'ArrowDown' || key === 'ArrowUp') {
        e.preventDefault();
        setActionIdx(i => (i === 0 ? 1 : 0));
      } else if (key === 'Enter' || key === ' ') {
        e.preventDefault();
        if (actionIdx === 0) handleShop();
        else onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [actionIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 30,
      background: 'rgba(4,2,8,0.88)',
      backdropFilter: 'blur(24px)',
      overflow: 'hidden',
      opacity: mounted ? 1 : 0,
      transition: 'opacity 0.35s ease',
      display: 'flex',
      alignItems: 'center',
    }}>
      {/* Back label */}
      <div style={{
        position: 'absolute',
        top: 36,
        left: 56,
        fontFamily: 'var(--sans)',
        fontSize: 14,
        color: 'rgba(255,255,255,0.3)',
        letterSpacing: '0.1em',
      }}>
        ← Back to video
      </div>

      {/* ── Product image ── */}
      <div style={{
        position: 'absolute',
        left: 80,
        top: 80,
        bottom: 80,
        width: 520,
        borderRadius: 24,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${product.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.9) saturate(1.05)',
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(4,2,8,0.1) 60%, rgba(4,2,8,0.65) 100%)',
        }} />
      </div>

      {/* ── Product info ── */}
      <div style={{
        position: 'absolute',
        left: 660,
        top: 120,
        width: 660,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>
        {/* Brand */}
        <span style={{
          fontFamily: 'var(--sans)',
          fontSize: 12,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.35)',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
        }}>
          {product.brand}
        </span>

        {/* Name */}
        <h2 style={{
          fontFamily: 'var(--sans)',
          fontWeight: 800,
          fontSize: 44,
          lineHeight: 1.08,
          color: '#fff',
          margin: 0,
          letterSpacing: '-0.02em',
        }}>
          {product.name}
        </h2>

        {/* Price */}
        <div style={{
          fontFamily: 'var(--sans)',
          fontWeight: 700,
          fontSize: 30,
          color: '#fff',
          letterSpacing: '-0.01em',
        }}>
          {product.price}
        </div>

        {/* Variants */}
        {product.variants && product.variants.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {product.variants.map((v, i) => (
              <span key={v} style={{
                fontFamily: 'var(--sans)',
                fontSize: 13,
                fontWeight: 500,
                color: i === 0 ? '#fff' : 'rgba(255,255,255,0.55)',
                background: i === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${i === 0 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 999,
                padding: '5px 14px',
              }}>
                {v}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        <p style={{
          fontFamily: 'var(--sans)',
          fontSize: 17,
          color: 'rgba(255,255,255,0.55)',
          lineHeight: 1.6,
          margin: 0,
          maxWidth: 540,
          display: '-webkit-box',
          WebkitLineClamp: 4,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {product.description}
        </p>

        {/* Creator association */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 16px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          width: 'fit-content',
        }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FF2D55, #7047E2)',
            flexShrink: 0,
          }} />
          <span style={{
            fontFamily: 'var(--sans)',
            fontSize: 13,
            color: 'rgba(255,255,255,0.45)',
          }}>
            From the video by <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{creatorHandle}</span>
          </span>
        </div>
      </div>

      {/* ── Actions ── */}
      <div style={{
        position: 'absolute',
        right: 80,
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        width: 280,
      }}>
        {/* Shop on Phone */}
        <button
          onClick={handleShop}
          style={{
            background: actionIdx === 0 ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.08)',
            border: `1px solid ${actionIdx === 0 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 16,
            height: 64,
            fontFamily: 'var(--sans)',
            fontSize: 16,
            fontWeight: 700,
            color: actionIdx === 0 ? '#0a0608' : 'rgba(255,255,255,0.7)',
            cursor: 'pointer',
            transition: 'all 0.18s ease',
            transform: actionIdx === 0 ? 'scale(1.03)' : 'scale(1)',
            boxShadow: actionIdx === 0 ? '0 0 0 1px rgba(255,255,255,0.3), 0 0 24px 4px rgba(255,255,255,0.08)' : 'none',
          }}
        >
          📱  Shop on Phone
        </button>

        {/* Back to video */}
        <button
          onClick={onClose}
          style={{
            background: actionIdx === 1 ? 'rgba(255,255,255,0.08)' : 'transparent',
            border: `1px solid ${actionIdx === 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)'}`,
            borderRadius: 16,
            height: 64,
            fontFamily: 'var(--sans)',
            fontSize: 16,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
            transition: 'all 0.18s ease',
            transform: actionIdx === 1 ? 'scale(1.02)' : 'scale(1)',
          }}
        >
          Back to video
        </button>
      </div>

      {/* Phone handoff chip */}
      {handoffVisible && (
        <div style={{
          position: 'absolute',
          bottom: 52,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(20,14,46,0.92)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 999,
          padding: '14px 28px',
          fontFamily: 'var(--sans)',
          fontSize: 15,
          fontWeight: 600,
          color: '#fff',
          zIndex: 50,
          whiteSpace: 'nowrap',
        }}>
          ✓ Shop link sent to your phone
        </div>
      )}
    </div>
  );
}
