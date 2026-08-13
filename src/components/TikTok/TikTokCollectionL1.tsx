/**
 * TikTokCollectionL1 — collection L1 with vertical stack animation.
 *
 * Three-column layout:
 *   Left  (0–440px)  — collection context + actions
 *   Center (440–1320px) — vertical video stack (active + peek above/below)
 *   Right (1320–1920px) — products for the active video
 *
 * Focus system:
 *   - panel: 'center' | 'left' | 'right'
 *   - Up/Down on center → animate to next/prev video
 *   - Left from center → action column
 *   - Right from center → product column
 *   - Back → exit panel or close
 */

import React, { useEffect, useRef, useState } from 'react';
import type { TikTokCollectionCard, TikTokProduct } from '../../data/tiktokTypes';
import TikTokPDP from './TikTokPDP';

type Panel = 'center' | 'left' | 'right';

const LEFT_ACTIONS = [
  { id: 'phone',  label: 'Continue on phone', icon: '↗' },
  { id: 'follow', label: 'Follow creator',    icon: '＋' },
  { id: 'save',   label: 'Save collection',   icon: '♡' },
  { id: 'ai',     label: 'Ask AI',            icon: '✦' },
];

type Props = {
  card: TikTokCollectionCard;
  onClose: () => void;
  onAskAI: () => void;
  toast: (msg: string) => void;
};

const CARD_H = 640;
const CARD_W = 360;

export default function TikTokCollectionL1({ card, onClose, onAskAI, toast }: Props) {
  const [mounted, setMounted] = useState(false);
  const [panel, setPanel] = useState<Panel>('center');
  const [videoIdx, setVideoIdx] = useState(0);
  const [leftIdx, setLeftIdx] = useState(0);
  const [productIdx, setProductIdx] = useState(0);
  const [pdpProduct, setPdpProduct] = useState<TikTokProduct | null>(null);
  const [handoffVisible, setHandoffVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const handoffTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { videos } = card;
  const activeVideo = videos[videoIdx];
  const activeProducts = (activeVideo.products ?? []).slice(0, 3);
  const hasProducts = activeProducts.length > 0;
  const totalDurationMin = Math.round(card.sessionDurationSeconds / 60);
  const elapsedMin = Math.round((videoIdx / videos.length) * card.sessionDurationSeconds / 60);
  const remainingMin = Math.max(0, totalDurationMin - elapsedMin);

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  function goToVideo(dir: 'next' | 'prev') {
    if (isAnimating) return;
    const nextIdx = dir === 'next'
      ? Math.min(videos.length - 1, videoIdx + 1)
      : Math.max(0, videoIdx - 1);
    if (nextIdx === videoIdx) return;
    setIsAnimating(true);
    setVideoIdx(nextIdx);
    setProductIdx(0);
    setTimeout(() => setIsAnimating(false), 380);
  }

  function handleLeftAction(id: string) {
    if (id === 'ai') { onAskAI(); return; }
    if (id === 'phone') {
      setHandoffVisible(true);
      toast('✓ Link sent to your phone');
      if (handoffTimer.current) clearTimeout(handoffTimer.current);
      handoffTimer.current = setTimeout(() => setHandoffVisible(false), 2400);
      return;
    }
    if (id === 'follow') { toast('✓ Following'); return; }
    if (id === 'save') { toast('✓ Collection saved'); return; }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (pdpProduct) return;
      const key = e.key;

      if (key === 'Escape' || key === 'Backspace') {
        e.preventDefault();
        if (panel !== 'center') setPanel('center');
        else onClose();
        return;
      }

      if (panel === 'center') {
        if (key === 'ArrowDown')  { e.preventDefault(); goToVideo('next'); return; }
        if (key === 'ArrowUp')    { e.preventDefault(); goToVideo('prev'); return; }
        if (key === 'ArrowLeft')  { e.preventDefault(); setPanel('left');  return; }
        if (key === 'ArrowRight') { e.preventDefault(); if (hasProducts) setPanel('right'); return; }
      }

      if (panel === 'left') {
        if (key === 'ArrowUp')    { e.preventDefault(); setLeftIdx(i => Math.max(0, i - 1)); return; }
        if (key === 'ArrowDown')  { e.preventDefault(); setLeftIdx(i => Math.min(LEFT_ACTIONS.length - 1, i + 1)); return; }
        if (key === 'ArrowRight') { e.preventDefault(); setPanel('center'); return; }
        if (key === 'Enter' || key === ' ') {
          e.preventDefault();
          handleLeftAction(LEFT_ACTIONS[leftIdx].id);
          return;
        }
      }

      if (panel === 'right') {
        if (key === 'ArrowUp')   { e.preventDefault(); setProductIdx(i => Math.max(0, i - 1)); return; }
        if (key === 'ArrowDown') { e.preventDefault(); setProductIdx(i => Math.min(activeProducts.length - 1, i + 1)); return; }
        if (key === 'ArrowLeft') { e.preventDefault(); setPanel('center'); return; }
        if (key === 'Enter' || key === ' ') {
          e.preventDefault();
          setPdpProduct(activeProducts[productIdx] ?? null);
          return;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [panel, videoIdx, leftIdx, productIdx, activeProducts, hasProducts, pdpProduct, isAnimating]); // eslint-disable-line react-hooks/exhaustive-deps

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
      {/* Back hint */}
      <div style={{
        position: 'absolute', top: 32, left: 56,
        fontFamily: 'var(--sans)', fontSize: 13, color: 'rgba(255,255,255,0.3)', zIndex: 60,
      }}>
        ← Back
      </div>

      {/* TikTok attribution */}
      <div style={{
        position: 'absolute', top: 28, right: 56,
        display: 'flex', alignItems: 'center', gap: 8, zIndex: 60,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF2D55', boxShadow: '0 0 6px 1px #FF2D55' }} />
        <span style={{ fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>TikTok</span>
      </div>

      {/* ── Left column ──────────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 440,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '80px 36px 80px 56px', gap: 0,
        borderRight: `1px solid ${panel === 'left' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'}`,
        transition: 'border-color 0.2s',
      }}>
        {/* Collection info */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 700,
            color: 'rgba(255,255,255,0.25)', letterSpacing: '0.2em',
            textTransform: 'uppercase', marginBottom: 10,
          }}>
            {card.ambientLabel}
          </div>
          <div style={{
            fontFamily: 'var(--sans)', fontSize: 22, fontWeight: 700,
            color: '#fff', lineHeight: 1.25, marginBottom: 8,
          }}>
            {card.title}
          </div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'rgba(255,255,255,0.42)', lineHeight: 1.5 }}>
            {card.subtitle}
          </div>
        </div>

        {/* Progress */}
        <div style={{
          padding: '14px 16px', background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, marginBottom: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'rgba(255,255,255,0.42)' }}>
              Video {videoIdx + 1} of {videos.length}
            </span>
            <span style={{ fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.52)' }}>
              {remainingMin} min left
            </span>
          </div>
          <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
            <div style={{
              height: '100%',
              width: `${((videoIdx + 1) / videos.length) * 100}%`,
              background: 'rgba(255,255,255,0.5)',
              borderRadius: 2,
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>

        {/* Reason */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 8,
          padding: '10px 14px', background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, marginBottom: 24,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.28)', flexShrink: 0, marginTop: 5 }} />
          <span style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'rgba(255,255,255,0.42)', lineHeight: 1.5 }}>
            {card.reason}
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {LEFT_ACTIONS.map((action, i) => {
            const isActive = panel === 'left' && leftIdx === i;
            return (
              <button
                key={action.id}
                tabIndex={-1}
                onClick={() => { setPanel('left'); setLeftIdx(i); handleLeftAction(action.id); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  height: 50, padding: '0 16px', borderRadius: 12,
                  background: isActive ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${isActive ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.05)'}`,
                  cursor: 'pointer', transition: 'all 0.16s ease',
                  transform: isActive ? 'scale(1.02)' : 'scale(1)',
                  fontFamily: 'var(--sans)', fontSize: 15,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.58)',
                  outline: 'none', textAlign: 'left',
                }}
              >
                <span style={{
                  width: 26, height: 26, borderRadius: 7,
                  background: isActive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, flexShrink: 0,
                }}>
                  {action.icon}
                </span>
                {action.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Center column — vertical video stack ─────────────────────────────── */}
      <div style={{
        position: 'absolute', left: 440, top: 0, bottom: 0, right: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}>
        {/* Navigation arrows */}
        {videoIdx > 0 && (
          <div style={{
            position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
            fontFamily: 'var(--sans)', fontSize: 13, color: 'rgba(255,255,255,0.28)',
            zIndex: 5, userSelect: 'none',
          }}>▲</div>
        )}
        {videoIdx < videos.length - 1 && (
          <div style={{
            position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
            fontFamily: 'var(--sans)', fontSize: 13, color: 'rgba(255,255,255,0.28)',
            zIndex: 5, userSelect: 'none',
          }}>▼</div>
        )}

        <div style={{ position: 'relative', width: CARD_W, height: CARD_H + 80, overflow: 'hidden' }}>
          {videos.map((video, i) => {
            const offset = (i - videoIdx) * (CARD_H + 20);
            const isActive = i === videoIdx;
            const isVisible = Math.abs(i - videoIdx) <= 1;
            if (!isVisible) return null;

            return (
              <div
                key={video.id}
                style={{
                  position: 'absolute', left: 0, width: CARD_W, height: CARD_H,
                  top: '50%', marginTop: -CARD_H / 2,
                  transform: `translateY(${offset}px) scale(${isActive ? 1 : 0.9})`,
                  transition: 'transform 0.36s cubic-bezier(0.22,1,0.36,1)',
                  borderRadius: 20, overflow: 'hidden',
                  boxShadow: isActive
                    ? (panel === 'center'
                      ? '0 0 0 2px rgba(255,255,255,0.18), 0 32px 80px rgba(0,0,0,0.7)'
                      : '0 0 0 1px rgba(255,255,255,0.08), 0 24px 60px rgba(0,0,0,0.6)')
                    : '0 8px 24px rgba(0,0,0,0.4)',
                  opacity: isActive ? 1 : 0.32,
                }}
              >
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: `url(${video.thumbnail})`,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  filter: `brightness(${isActive ? 0.85 : 0.62}) saturate(${isActive ? 1.05 : 0.75})`,
                  transition: 'filter 0.3s ease',
                }} />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(0deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.06) 50%, rgba(0,0,0,0.18) 100%)',
                }} />

                {isActive && (
                  <>
                    <div style={{
                      position: 'absolute', top: 14, right: 14,
                      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
                      borderRadius: 8, padding: '5px 10px',
                      fontFamily: 'var(--sans)', fontSize: 11, color: 'rgba(255,255,255,0.6)',
                    }}>
                      Muted
                    </div>

                    <div style={{ position: 'absolute', bottom: 18, left: 14, right: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%',
                          background: 'linear-gradient(135deg, rgba(255,45,85,0.9), rgba(112,71,226,0.9))',
                          border: '1.5px solid rgba(255,255,255,0.6)', flexShrink: 0,
                        }} />
                        <div>
                          <div style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 13, color: '#fff' }}>{video.creator}</div>
                          <div style={{ fontFamily: 'var(--sans)', fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>{video.creatorHandle}</div>
                        </div>
                      </div>
                      <div style={{
                        fontFamily: 'var(--sans)', fontSize: 12, color: 'rgba(255,255,255,0.72)',
                        lineHeight: 1.4,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
                      }}>
                        {video.title}
                      </div>
                    </div>

                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.12)' }}>
                      <div style={{ height: '100%', width: '38%', background: 'rgba(255,255,255,0.7)', borderRadius: 1 }} />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Right column — products ───────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 600,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '80px 56px 80px 36px', gap: 0,
        borderLeft: `1px solid ${panel === 'right' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'}`,
        transition: 'border-color 0.2s',
      }}>
        {hasProducts ? (
          <>
            <div style={{
              fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 700,
              color: 'rgba(255,255,255,0.25)', letterSpacing: '0.2em',
              textTransform: 'uppercase', marginBottom: 14,
            }}>
              From this video
            </div>

            {/* Primary product */}
            {activeProducts[0] && (() => {
              const product = activeProducts[0];
              const isActive = panel === 'right' && productIdx === 0;
              return (
                <div
                  key={`${product.id}-${videoIdx}`}
                  onClick={() => { setPanel('right'); setProductIdx(0); setPdpProduct(product); }}
                  style={{
                    display: 'flex', gap: 16, padding: '18px',
                    borderRadius: 18, marginBottom: 12,
                    background: isActive ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${isActive ? 'rgba(255,255,255,0.24)' : 'rgba(255,255,255,0.07)'}`,
                    cursor: 'pointer', transition: 'all 0.18s ease',
                    transform: isActive ? 'scale(1.02)' : 'scale(1)',
                  }}
                >
                  <div style={{
                    width: 80, height: 80, borderRadius: 12, overflow: 'hidden',
                    flexShrink: 0, background: 'rgba(255,255,255,0.05)',
                  }}>
                    {product.image && (
                      <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: 'var(--sans)', fontSize: 10, fontWeight: 700,
                      color: 'rgba(255,255,255,0.3)', letterSpacing: '0.14em',
                      textTransform: 'uppercase', marginBottom: 6,
                    }}>
                      {product.brand}
                    </div>
                    <div style={{
                      fontFamily: 'var(--sans)', fontSize: 16, fontWeight: 700,
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.75)',
                      lineHeight: 1.3, marginBottom: 8,
                    }}>
                      {product.name}
                    </div>
                    <div style={{
                      fontFamily: 'var(--sans)', fontSize: 16, fontWeight: 700,
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.52)',
                    }}>
                      {product.price}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Secondary products */}
            {activeProducts.slice(1).map((product, i) => {
              const idx = i + 1;
              const isActive = panel === 'right' && productIdx === idx;
              return (
                <div
                  key={`${product.id}-${videoIdx}`}
                  onClick={() => { setPanel('right'); setProductIdx(idx); setPdpProduct(product); }}
                  style={{
                    display: 'flex', gap: 12, padding: '12px 14px',
                    borderRadius: 14, marginBottom: 8,
                    background: isActive ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                    border: `1.5px solid ${isActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)'}`,
                    cursor: 'pointer', transition: 'all 0.16s ease',
                    transform: isActive ? 'scale(1.02)' : 'scale(1)',
                  }}
                >
                  <div style={{
                    width: 52, height: 52, borderRadius: 10, overflow: 'hidden',
                    flexShrink: 0, background: 'rgba(255,255,255,0.05)',
                  }}>
                    {product.image && (
                      <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{
                      fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600,
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.65)', lineHeight: 1.3,
                    }}>
                      {product.name}
                    </div>
                    <div style={{
                      fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 700,
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.45)', marginTop: 3,
                    }}>
                      {product.price}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <div style={{
            fontFamily: 'var(--sans)', fontSize: 14,
            color: 'rgba(255,255,255,0.2)', textAlign: 'center',
          }}>
            No products in this video
          </div>
        )}
      </div>

      {/* Phone handoff chip */}
      {handoffVisible && (
        <div style={{
          position: 'absolute', bottom: 48, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(18,12,36,0.96)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999,
          padding: '14px 28px', fontFamily: 'var(--sans)', fontSize: 15,
          fontWeight: 600, color: '#fff', zIndex: 70, whiteSpace: 'nowrap',
        }}>
          ✓ Link sent to your phone
        </div>
      )}

      {/* PDP overlay */}
      {pdpProduct && (
        <TikTokPDP
          product={pdpProduct}
          creatorHandle={activeVideo.creatorHandle}
          onClose={() => setPdpProduct(null)}
          toast={toast}
        />
      )}
    </div>
  );
}
