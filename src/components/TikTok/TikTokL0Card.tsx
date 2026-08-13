/**
 * TikTokL0Card — Ambient design system, TikTok as content provider.
 *
 * Reuses the same visual language as every other L0 glance:
 * full-bleed background, top-left eyebrow + title, bottom CTA row.
 * TikTok branding appears only as attribution metadata.
 *
 * Variants:
 *   single-video  → Watch / Explore more / Send to phone / Like
 *   collection    → Explore collection / Send to phone / Save
 *   creator-of-day (collection with creatorDisplayName) → Explore creator / Follow / Send to phone
 *   around-you (id tt-around-you) → Explore nearby / Save / Send to phone
 */

import React, { useEffect, useRef, useState } from 'react';
import type { TikTokCard } from '../../data/tiktokTypes';

const LOGO_SRC = '/glance-logo.png';

type Props = {
  card: TikTokCard;
  focused: boolean;
  onSelect: () => void;
  toast?: (msg: string) => void;
};

type CTAItem = { label: string; icon?: string; primary?: boolean };

function getCTAs(card: TikTokCard): CTAItem[] {
  if (card.variant === 'single-video') {
    return [
      { label: 'Watch', primary: true },
      { label: 'Explore more' },
      { label: 'Send to phone', icon: '↗' },
      { label: 'Like', icon: '♥' },
    ];
  }
  if (card.id === 'tt-creator-of-day') {
    return [
      { label: 'Explore creator', primary: true },
      { label: 'Follow' },
      { label: 'Send to phone', icon: '↗' },
    ];
  }
  if (card.id === 'tt-around-you') {
    return [
      { label: 'Explore nearby', primary: true },
      { label: 'Save' },
      { label: 'Send to phone', icon: '↗' },
    ];
  }
  return [
    { label: 'Explore collection', primary: true },
    { label: 'Send to phone', icon: '↗' },
    { label: 'Save' },
  ];
}

export default function TikTokL0Card({ card, focused, onSelect, toast }: Props) {
  const [mounted, setMounted] = useState(false);
  const [ctaIdx, setCtaIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const ctas = getCTAs(card);
  const video = card.variant === 'single-video' ? card.video : card.videos[0];
  const isCollection = card.variant === 'collection';
  const isCreatorOfDay = card.id === 'tt-creator-of-day';
  const isAroundYou = card.id === 'tt-around-you';

  /* background image */
  const bgImage = card.backgroundImage || video.thumbnail;

  /* creator info */
  const collectionCard = card.variant === 'collection' ? card : null;
  const creatorHandle = collectionCard
    ? (collectionCard.creator || collectionCard.creatorDisplayName || video.creatorHandle)
    : video.creatorHandle;
  const creatorName = isCreatorOfDay
    ? (collectionCard?.creatorDisplayName || video.creator)
    : video.creator;
  const creatorDescriptor = isCreatorOfDay
    ? collectionCard?.creatorDescriptor
    : video.creatorDescriptor;

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  /* keyboard navigation inside the card */
  useEffect(() => {
    if (!focused) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCtaIdx(i => Math.max(0, i - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCtaIdx(i => Math.min(ctas.length - 1, i + 1));
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (ctaIdx === 0) {
          onSelect();
        } else if (ctas[ctaIdx].label === 'Send to phone' || ctas[ctaIdx].icon === '↗') {
          toast?.('✓ Link sent to your phone');
        } else if (ctas[ctaIdx].label === 'Save') {
          toast?.('✓ Saved for later');
        } else if (ctas[ctaIdx].label === 'Like' || ctas[ctaIdx].icon === '♥') {
          toast?.('✓ Liked');
        } else if (ctas[ctaIdx].label === 'Follow') {
          toast?.('✓ Following');
        } else {
          onSelect();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focused, ctaIdx, ctas, onSelect, toast]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.5s cubic-bezier(0.22,1,0.36,1)',
      }}
    >
      {/* ── Full-bleed background ──────────────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'brightness(0.72) saturate(1.08) blur(18px)',
        transform: 'scale(1.04)', /* prevent blur edge bleed */
      }} />

      {/* Dark vignette — same as CinematicL0 */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, rgba(1,1,1,0.72) 0%, rgba(1,1,1,0.12) 55%, rgba(1,1,1,0.28) 100%)',
      }} />

      {/* Bottom-left gradient for CTA readability */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(0deg, rgba(1,1,1,0.82) 0%, rgba(1,1,1,0.28) 28%, transparent 55%)',
      }} />

      {/* ── Header — Glance logo + TikTok attribution ─────────────────────── */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 56px',
        zIndex: 20,
      }}>
        <img src={LOGO_SRC} alt="Glance" style={{ height: 28, opacity: 0.95 }} />

        {/* TikTok attribution — small, right-aligned */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 999,
          padding: '6px 16px 6px 12px',
        }}>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#FF2D55',
            boxShadow: '0 0 6px 1px #FF2D55',
            flexShrink: 0,
          }} />
          <span style={{
            fontFamily: 'var(--sans)',
            fontSize: 13,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.72)',
            letterSpacing: '0.04em',
          }}>
            TikTok
          </span>
        </div>
      </div>

      {/* ── Top-left content: eyebrow + title ─────────────────────────────── */}
      <div style={{
        position: 'absolute',
        top: 110,
        left: 56,
        maxWidth: 820,
        zIndex: 15,
      }}>
        {/* Eyebrow — ambient context label */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 20,
          padding: '6px 16px',
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 999,
        }}>
          <span style={{
            fontFamily: 'var(--sans)',
            fontSize: 12,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.55)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}>
            {card.ambientLabel}
          </span>
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: 'var(--sans)',
          fontWeight: 800,
          fontSize: isCreatorOfDay ? 80 : 72,
          lineHeight: 1.02,
          color: '#ffffff',
          margin: 0,
          letterSpacing: '-0.025em',
          textShadow: '0 2px 32px rgba(0,0,0,0.5)',
        }}>
          {card.title}
        </h1>

        {/* For Creator of Day: creator descriptor line */}
        {isCreatorOfDay && creatorDescriptor && (
          <div style={{
            marginTop: 16,
            fontFamily: 'var(--sans)',
            fontSize: 20,
            color: 'rgba(255,255,255,0.55)',
            fontWeight: 400,
          }}>
            {creatorDescriptor}
          </div>
        )}
      </div>

      {/* ── Right side: vertical video preview (single-video only) ────────── */}
      {!isCollection && (
        <div style={{
          position: 'absolute',
          right: 120,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 320,
          height: 568,
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.12), 0 32px 80px rgba(0,0,0,0.65)',
          zIndex: 10,
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${video.thumbnail})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.88) saturate(1.08)',
          }} />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(0deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 45%, rgba(0,0,0,0.25) 100%)',
          }} />

          {/* Video progress — cosmetic */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 2,
            background: 'rgba(255,255,255,0.15)',
          }}>
            <div style={{ height: '100%', width: '38%', background: 'rgba(255,255,255,0.8)', borderRadius: 1 }} />
          </div>

          {/* Creator inside the video frame */}
          <div style={{
            position: 'absolute',
            bottom: 16,
            left: 12,
            right: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(255,45,85,0.9), rgba(112,71,226,0.9))',
                border: '1.5px solid rgba(255,255,255,0.6)',
                flexShrink: 0,
              }} />
              <div>
                <div style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 12, color: '#fff', lineHeight: 1.2 }}>
                  {video.creator}
                </div>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 10, color: 'rgba(255,255,255,0.5)', lineHeight: 1 }}>
                  {video.creatorHandle}
                </div>
              </div>
            </div>
            <div style={{
              fontFamily: 'var(--sans)',
              fontSize: 11,
              color: 'rgba(255,255,255,0.75)',
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' as const,
              overflow: 'hidden',
            }}>
              {video.title}
            </div>
          </div>
        </div>
      )}

      {/* ── Collection: video stack preview ───────────────────────────────── */}
      {isCollection && (
        <div style={{
          position: 'absolute',
          right: 100,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 260,
          height: 540,
          zIndex: 10,
        }}>
          {/* Stack shadow cards behind */}
          {[2, 1].map(depth => (
            <div key={depth} style={{
              position: 'absolute',
              top: depth * 10,
              left: depth * 10,
              right: -(depth * 10),
              bottom: -(depth * 6),
              borderRadius: 20,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              transform: `scale(${1 - depth * 0.02})`,
              transformOrigin: 'top center',
            }} />
          ))}
          {/* Front card */}
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.12), 0 32px 64px rgba(0,0,0,0.6)',
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

            {/* Collection count badge */}
            <div style={{
              position: 'absolute',
              top: 14,
              right: 14,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
              borderRadius: 999,
              padding: '5px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <span style={{ fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                {card.videos.length}
              </span>
              <span style={{ fontFamily: 'var(--sans)', fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>videos</span>
            </div>

            <div style={{
              position: 'absolute',
              bottom: 14,
              left: 12,
              right: 12,
              fontFamily: 'var(--sans)',
              fontSize: 11,
              color: 'rgba(255,255,255,0.65)',
              fontWeight: 500,
            }}>
              {Math.round(card.sessionDurationSeconds / 60)} min session
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom content region: creator + reason + CTAs ─────────────────── */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '0 56px 48px',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>
        {/* Creator row (single video) */}
        {!isCollection && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(255,45,85,0.85), rgba(112,71,226,0.85))',
              border: '2px solid rgba(255,255,255,0.5)',
              flexShrink: 0,
            }} />
            <div>
              <div style={{
                fontFamily: 'var(--sans)',
                fontSize: 17,
                fontWeight: 700,
                color: '#fff',
                lineHeight: 1.2,
              }}>
                {video.creator}
              </div>
              <div style={{
                fontFamily: 'var(--sans)',
                fontSize: 13,
                color: 'rgba(255,255,255,0.5)',
                lineHeight: 1,
                marginTop: 2,
              }}>
                {video.creatorDescriptor || video.creatorHandle}
              </div>
            </div>
          </div>
        )}

        {/* Creator row (creator of day collection) */}
        {isCreatorOfDay && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(255,45,85,0.85), rgba(112,71,226,0.85))',
              border: '2px solid rgba(255,255,255,0.6)',
              flexShrink: 0,
            }} />
            <div>
              <div style={{ fontFamily: 'var(--sans)', fontSize: 19, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                {creatorName}
              </div>
              <div style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                {creatorHandle}
              </div>
            </div>
          </div>
        )}

        {/* Reason chip */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          width: 'fit-content',
          background: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 999,
          padding: '8px 18px',
          maxWidth: 680,
        }}>
          <span style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.55)',
            flexShrink: 0,
          }} />
          <span style={{
            fontFamily: 'var(--sans)',
            fontSize: 14,
            color: 'rgba(255,255,255,0.65)',
            fontWeight: 400,
            lineHeight: 1,
          }}>
            {card.reason}
          </span>
        </div>

        {/* CTA row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          {ctas.map((cta, i) => {
            const isFocused = focused && ctaIdx === i;
            const isPrimary = cta.primary;
            return (
              <button
                key={cta.label}
                tabIndex={-1}
                onClick={() => {
                  setCtaIdx(i);
                  if (i === 0) {
                    onSelect();
                  } else if (cta.label === 'Send to phone' || cta.icon === '↗') {
                    toast?.('✓ Link sent to your phone');
                  } else if (cta.label === 'Save') {
                    toast?.('✓ Saved for later');
                  } else if (cta.label === 'Like' || cta.icon === '♥') {
                    toast?.('✓ Liked');
                  } else if (cta.label === 'Follow') {
                    toast?.('✓ Following');
                  } else {
                    onSelect();
                  }
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  height: 52,
                  padding: '0 24px',
                  borderRadius: 999,
                  fontFamily: 'var(--sans)',
                  fontSize: 15,
                  fontWeight: isPrimary ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  border: isFocused
                    ? '2px solid rgba(255,255,255,0.9)'
                    : isPrimary
                      ? '2px solid transparent'
                      : '1.5px solid rgba(255,255,255,0.18)',
                  background: isFocused
                    ? '#ffffff'
                    : isPrimary
                      ? 'rgba(255,255,255,0.96)'
                      : 'rgba(255,255,255,0.06)',
                  color: isFocused
                    ? '#0a0608'
                    : isPrimary
                      ? '#0a0608'
                      : 'rgba(255,255,255,0.72)',
                  transform: isFocused ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: isFocused
                    ? '0 0 0 3px rgba(255,255,255,0.2), 0 8px 24px rgba(0,0,0,0.3)'
                    : isPrimary
                      ? '0 4px 20px rgba(0,0,0,0.25)'
                      : 'none',
                  outline: 'none',
                }}
              >
                {cta.icon && <span style={{ fontSize: 14, opacity: 0.85 }}>{cta.icon}</span>}
                {cta.label}
              </button>
            );
          })}

          {/* Page navigation hint */}
          <div style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            opacity: 0.28,
          }}>
            <span style={{ fontFamily: 'var(--sans)', fontSize: 11, color: '#fff', letterSpacing: '0.06em' }}>▲▼ browse</span>
          </div>
        </div>
      </div>
    </div>
  );
}
