/**
 * TikTokVideoExpanded — single-video L1.
 *
 * Three-column layout:
 *   Left  (0–440px)  — related products (≤3)
 *   Center (440–1460px) — video + creator info
 *   Right (1460–1920px) — actions
 *
 * Focus system:
 *   - panel: 'center' | 'left' | 'right'
 *   - Left from center → product column
 *   - Right from center → action column
 *   - Up/Down within active column
 *   - Back → return to L0 or exit panel
 *   - Global left nav is NOT activated from here.
 */

import React, { useEffect, useRef, useState } from 'react';
import type { TikTokSingleVideoCard, TikTokProduct } from '../../data/tiktokTypes';
import TikTokPDP from './TikTokPDP';

type Panel = 'center' | 'left' | 'right';

const ACTIONS = [
  { id: 'phone',  label: 'Continue on phone', icon: '↗' },
  { id: 'follow', label: 'Follow creator',    icon: '＋' },
  { id: 'save',   label: 'Save',              icon: '♡' },
  { id: 'more',   label: 'Explore more',      icon: '⊞' },
  { id: 'shop',   label: 'Shop on phone',     icon: '◻' },
  { id: 'ai',     label: 'Ask AI',            icon: '✦' },
];

type Props = {
  card: TikTokSingleVideoCard;
  onClose: () => void;
  onAskAI: () => void;
  toast: (msg: string) => void;
};

export default function TikTokVideoExpanded({ card, onClose, onAskAI, toast }: Props) {
  const [mounted, setMounted] = useState(false);
  const [panel, setPanel] = useState<Panel>('center');
  const [productIdx, setProductIdx] = useState(0);
  const [actionIdx, setActionIdx] = useState(0);
  const [pdpProduct, setPdpProduct] = useState<TikTokProduct | null>(null);
  const [handoffVisible, setHandoffVisible] = useState(false);
  const handoffTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { video } = card;
  const products = (video.products ?? []).slice(0, 3);
  const hasProducts = products.length > 0;
  const visibleActions = hasProducts ? ACTIONS : ACTIONS.filter(a => a.id !== 'shop');

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  function handleAction(id: string) {
    if (id === 'ai') { onAskAI(); return; }
    if (id === 'phone' || id === 'shop') {
      setHandoffVisible(true);
      toast('✓ Link sent to your phone');
      if (handoffTimer.current) clearTimeout(handoffTimer.current);
      handoffTimer.current = setTimeout(() => setHandoffVisible(false), 2400);
      return;
    }
    if (id === 'follow') { toast('✓ Following ' + video.creatorHandle); return; }
    if (id === 'save') { toast('✓ Saved for later'); return; }
    if (id === 'more') { toast('✦ Loading more from ' + video.creatorHandle); return; }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (pdpProduct) return; // PDP handles its own keys

      const key = e.key;
      if (key === 'Escape' || key === 'Backspace') {
        e.preventDefault();
        if (panel !== 'center') setPanel('center');
        else onClose();
        return;
      }

      if (panel === 'center') {
        if (key === 'ArrowLeft') {
          e.preventDefault();
          if (hasProducts) setPanel('left');
          return;
        }
        if (key === 'ArrowRight') { e.preventDefault(); setPanel('right'); return; }
      }

      if (panel === 'left') {
        if (key === 'ArrowUp')    { e.preventDefault(); setProductIdx(i => Math.max(0, i - 1)); return; }
        if (key === 'ArrowDown')  { e.preventDefault(); setProductIdx(i => Math.min(products.length - 1, i + 1)); return; }
        if (key === 'ArrowRight') { e.preventDefault(); setPanel('center'); return; }
        if (key === 'Enter' || key === ' ') {
          e.preventDefault();
          setPdpProduct(products[productIdx] ?? null);
          return;
        }
      }

      if (panel === 'right') {
        if (key === 'ArrowUp')   { e.preventDefault(); setActionIdx(i => Math.max(0, i - 1)); return; }
        if (key === 'ArrowDown') { e.preventDefault(); setActionIdx(i => Math.min(visibleActions.length - 1, i + 1)); return; }
        if (key === 'ArrowLeft') { e.preventDefault(); setPanel('center'); return; }
        if (key === 'Enter' || key === ' ') {
          e.preventDefault();
          handleAction(visibleActions[actionIdx].id);
          return;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [panel, productIdx, actionIdx, products, hasProducts, visibleActions, pdpProduct]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 50,
      background: 'rgba(4,2,10,0.97)',
      backdropFilter: 'blur(32px)',
      overflow: 'hidden',
      opacity: mounted ? 1 : 0,
      transition: 'opacity 0.3s ease',
    }}>
      {/* ── Back hint ──────────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        top: 32,
        left: 56,
        fontFamily: 'var(--sans)',
        fontSize: 13,
        color: 'rgba(255,255,255,0.3)',
        zIndex: 60,
        letterSpacing: '0.04em',
      }}>
        ← Back
      </div>

      {/* ── TikTok attribution ─────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        top: 28,
        right: 56,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        zIndex: 60,
      }}>
        <span style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#FF2D55',
          boxShadow: '0 0 6px 1px #FF2D55',
        }} />
        <span style={{ fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>
          TikTok
        </span>
      </div>

      {/* ── Left column — products ─────────────────────────────────────────── */}
      {hasProducts && (
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 440,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px 36px 80px 56px',
          gap: 14,
          borderRight: `1px solid ${panel === 'left' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'}`,
          transition: 'border-color 0.2s',
        }}>
          <div style={{
            fontFamily: 'var(--sans)',
            fontSize: 11,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.25)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}>
            From this video
          </div>

          {products.map((product, i) => {
            const isActive = panel === 'left' && productIdx === i;
            return (
              <div
                key={product.id}
                onClick={() => { setPanel('left'); setProductIdx(i); setPdpProduct(product); }}
                style={{
                  display: 'flex',
                  gap: 14,
                  padding: '14px 16px',
                  borderRadius: 16,
                  background: isActive ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${isActive ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.06)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  transform: isActive ? 'scale(1.02)' : 'scale(1)',
                }}
              >
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: 10,
                  overflow: 'hidden',
                  flexShrink: 0,
                  background: 'rgba(255,255,255,0.05)',
                }}>
                  {product.image && (
                    <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'var(--sans)',
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.3)',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    marginBottom: 4,
                  }}>
                    {product.brand}
                  </div>
                  <div style={{
                    fontFamily: 'var(--sans)',
                    fontSize: 14,
                    fontWeight: 600,
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                    lineHeight: 1.3,
                    marginBottom: 6,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical' as const,
                    overflow: 'hidden',
                  }}>
                    {product.name}
                  </div>
                  <div style={{ fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 700, color: isActive ? '#fff' : 'rgba(255,255,255,0.55)' }}>
                    {product.price}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Center column — video ──────────────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        left: hasProducts ? 440 : 0,
        top: 0,
        bottom: 0,
        right: 460,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 40px',
      }}>
        {/* Video frame */}
        <div style={{
          width: 380,
          height: 676,
          borderRadius: 24,
          overflow: 'hidden',
          flexShrink: 0,
          position: 'relative',
          boxShadow: panel === 'center'
            ? '0 0 0 2px rgba(255,255,255,0.18), 0 40px 100px rgba(0,0,0,0.7)'
            : '0 0 0 1px rgba(255,255,255,0.06), 0 32px 80px rgba(0,0,0,0.6)',
          transition: 'box-shadow 0.22s ease',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${video.thumbnail})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.85) saturate(1.05)',
          }} />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(0deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.2) 100%)',
          }} />

          <div style={{
            position: 'absolute',
            top: 14,
            right: 14,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            borderRadius: 8,
            padding: '5px 10px',
            fontFamily: 'var(--sans)',
            fontSize: 11,
            color: 'rgba(255,255,255,0.6)',
          }}>
            Muted
          </div>

          <div style={{ position: 'absolute', bottom: 18, left: 14, right: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(255,45,85,0.9), rgba(112,71,226,0.9))',
                border: '1.5px solid rgba(255,255,255,0.6)',
                flexShrink: 0,
              }} />
              <div>
                <div style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 13, color: '#fff' }}>{video.creator}</div>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>{video.creatorHandle}</div>
              </div>
            </div>
            <div style={{
              fontFamily: 'var(--sans)',
              fontSize: 12,
              color: 'rgba(255,255,255,0.72)',
              lineHeight: 1.45,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' as const,
              overflow: 'hidden',
            }}>
              {video.title}
            </div>
          </div>

          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.12)' }}>
            <div style={{ height: '100%', width: '38%', background: 'rgba(255,255,255,0.7)', borderRadius: 1 }} />
          </div>
        </div>

        {/* Reason chip */}
        <div style={{
          marginTop: 18,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '7px 18px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 999,
          maxWidth: 400,
        }}>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 1.4 }}>
            {card.reason}
          </span>
        </div>
      </div>

      {/* ── Right column — actions ─────────────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 460,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px 56px 80px 36px',
        gap: 10,
        borderLeft: `1px solid ${panel === 'right' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'}`,
        transition: 'border-color 0.2s',
      }}>
        {/* Creator header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 24,
          paddingBottom: 20,
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(255,45,85,0.8), rgba(112,71,226,0.8))',
            border: '2px solid rgba(255,255,255,0.5)',
            flexShrink: 0,
          }} />
          <div>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 17, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
              {video.creator}
            </div>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>
              {video.creatorDescriptor || video.creatorHandle}
            </div>
          </div>
        </div>

        {visibleActions.map((action, i) => {
          const isActive = panel === 'right' && actionIdx === i;
          return (
            <button
              key={action.id}
              tabIndex={-1}
              onClick={() => { setPanel('right'); setActionIdx(i); handleAction(action.id); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                height: 54,
                padding: '0 18px',
                borderRadius: 14,
                background: isActive ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.03)',
                border: `1.5px solid ${isActive ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.06)'}`,
                cursor: 'pointer',
                transition: 'all 0.16s ease',
                transform: isActive ? 'scale(1.02)' : 'scale(1)',
                fontFamily: 'var(--sans)',
                fontSize: 16,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                outline: 'none',
                textAlign: 'left',
              }}
            >
              <span style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: isActive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                flexShrink: 0,
              }}>
                {action.icon}
              </span>
              {action.label}
            </button>
          );
        })}
      </div>

      {/* Phone handoff chip */}
      {handoffVisible && (
        <div style={{
          position: 'absolute',
          bottom: 48,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(18,12,36,0.96)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 999,
          padding: '14px 28px',
          fontFamily: 'var(--sans)',
          fontSize: 15,
          fontWeight: 600,
          color: '#fff',
          zIndex: 70,
          whiteSpace: 'nowrap',
        }}>
          ✓ Link sent to your phone
        </div>
      )}

      {/* PDP overlay */}
      {pdpProduct && (
        <TikTokPDP
          product={pdpProduct}
          creatorHandle={video.creatorHandle}
          onClose={() => setPdpProduct(null)}
          toast={toast}
        />
      )}
    </div>
  );
}
