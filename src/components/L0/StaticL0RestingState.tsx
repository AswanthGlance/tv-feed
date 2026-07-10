/**
 * StaticL0RestingState
 *
 * Renders a left-aligned L0 card already at its final resting state.
 * No entrance animation plays — everything starts fully visible.
 * Used exclusively by the mascot-intro preview page.
 *
 * Final resting state of a left-aligned CinematicL0:
 *  - Background image fully visible with gradient overlays
 *  - Header visible (logo + clock)
 *  - Tag + title fully visible top-left
 *  - Reasoning text at scaled-down final size (scale 0.72), left column
 *  - Mascot gone from float position (it has moved into the CTA pill)
 *  - CTA pill fully revealed with mascot inside + label text visible
 *  - Border beam active on the CTA
 */

import React, { useState, useEffect } from 'react';
import type { FeedItem } from '../../data/types';
import AgentMascot from '../Shared/AgentMascot';

const LOGO_SRC = '/glance-logo.png';

const MASCOT_CTA_SIZE = 52;

const REASONING_FINAL_SCALE = 0.72;
const REASONING_HERO_FS = 'clamp(18px, 2.2vw, 32px)';

const CATEGORY_TAG: Record<string, string> = {
  food: 'Food Pick', fashion: 'Style Pick', travel: 'Travel Pick',
  wellness: 'Wellness Pick', home: 'Home Pick', sports: 'Sports Pick',
  entertainment: 'Entertainment', luxury: 'Luxury Pick',
  beauty: 'Beauty Pick', hobbies: 'Discover',
};
const s2l = (s: string) =>
  s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const getTagLabel = (item: FeedItem) =>
  item.locationLabel ?? CATEGORY_TAG[item.category] ?? s2l(item.category);

const BOTTOM = 'clamp(28px, 5vh, 56px)';
const CONTENT_LEFT = 'clamp(20px, 4.5vw, 88px)';
const CONTENT_WIDTH = 'clamp(240px, 62vw, 1060px)';

type Props = {
  item: FeedItem;
  reasoning: string;
  ctaLabel: string;
  onCTAClick: () => void;
};

export default function StaticL0RestingState({ item, reasoning, ctaLabel, onCTAClick }: Props) {
  const [clock, setClock] = useState(() =>
    new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      .replace(/\s?[AP]M/i, ''));
  const [ampm, setAmpm] = useState(() => new Date().getHours() < 12 ? 'AM' : 'PM');

  useEffect(() => {
    const t = setInterval(() => {
      const n = new Date();
      setClock(n.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/\s?[AP]M/i, ''));
      setAmpm(n.getHours() < 12 ? 'AM' : 'PM');
    }, 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>

      {/* BG */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${item.image})`,
        backgroundSize: 'cover', backgroundPosition: 'center 32%',
        zIndex: 1,
      }} />

      {/* Overlays — left gradient + top/bottom gradients */}
      <div style={{
        position: 'absolute', inset: 0,
        background: [
          'linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.50) 28%, rgba(0,0,0,0.06) 55%, transparent 70%)',
          'linear-gradient(to bottom, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.22) 18%, transparent 38%)',
          'linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 40%, transparent 65%)',
        ].join(', '),
        pointerEvents: 'none',
        zIndex: 2,
      }} />

      {/* HEADER */}
      <div style={{
        position: 'absolute',
        top: 'clamp(16px, 3vh, 48px)',
        left: CONTENT_LEFT,
        right: CONTENT_LEFT,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        zIndex: 30,
      }}>
        <img src={LOGO_SRC} alt="glance" style={{
          height: 'clamp(26px, 3.2vh, 48px)', width: 'auto', display: 'block',
          flexShrink: 0, objectFit: 'contain', objectPosition: 'left center',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(5px,0.7vw,10px)' }}>
          <span style={{ fontSize: 'clamp(10px,1.1vw,18px)', color: 'rgba(255,255,255,0.45)', fontFamily: 'system-ui', fontWeight: 500 }}>
            ☁ 65°
          </span>
          <span style={{ fontSize: 'clamp(10px,1.1vw,18px)', color: 'rgba(255,255,255,0.45)', fontFamily: 'system-ui', fontWeight: 500 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
          <span style={{ fontSize: 'clamp(10px,1.1vw,18px)', color: '#fff', fontFamily: 'system-ui', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
            {clock} {ampm}
          </span>
        </div>
      </div>

      {/* TAG + TITLE */}
      <div style={{
        position: 'absolute',
        top: 'clamp(80px, 12vh, 140px)',
        left: CONTENT_LEFT,
        zIndex: 20,
        display: 'flex', flexDirection: 'column',
        gap: 'clamp(6px, 0.8vh, 10px)',
        maxWidth: 'clamp(300px, 45vw, 700px)',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.10)',
          border: '1px solid rgba(255,255,255,0.16)',
          borderRadius: 999,
          padding: 'clamp(3px,0.4vh,5px) clamp(8px,1vw,13px)',
          backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          alignSelf: 'flex-start',
        }}>
          <span style={{
            fontSize: 'clamp(8px,0.8vw,11px)', fontWeight: 700,
            color: 'rgba(255,255,255,0.72)', letterSpacing: '0.11em',
            textTransform: 'uppercase', fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
          }}>{getTagLabel(item)}</span>
        </div>
        <h1 style={{
          margin: 0,
          fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
          fontWeight: 700,
          fontSize: 'clamp(18px, 2.2vw, 34px)',
          lineHeight: 1.15,
          letterSpacing: '-0.018em',
          color: 'rgba(255,255,255,0.88)',
          textShadow: '0 2px 16px rgba(0,0,0,0.55)',
          textAlign: 'left',
        }}>
          {item.title}
        </h1>
      </div>

      {/* CONTENT COLUMN — reasoning (scaled down) + CTA */}
      <div style={{
        position: 'absolute',
        left: CONTENT_LEFT,
        bottom: BOTTOM,
        width: CONTENT_WIDTH,
        zIndex: 20,
        display: 'flex', flexDirection: 'column', gap: 0,
      }}>
        {/* REASONING ROW — scaled to final resting size */}
        <div style={{
          display: 'flex', alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 0,
          marginBottom: 'clamp(18px, 2.8vh, 32px)',
        }}>
          {/* Mascot slot is empty in resting state — mascot is inside CTA pill */}
          <p style={{
            margin: 0, flex: 1,
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            fontWeight: 400,
            fontSize: REASONING_HERO_FS,
            lineHeight: 1.65,
            color: 'rgba(255,255,255,0.78)',
            textShadow: '0 1px 6px rgba(0,0,0,0.4), 0 0 20px rgba(192,132,252,0.18)',
            textAlign: 'left',
            transformOrigin: 'left top',
            transform: `scale(${REASONING_FINAL_SCALE})`,
          }}>
            {reasoning}
          </p>
        </div>

        {/* CTA pill — resting state: mascot inside + label fully visible */}
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <button
            tabIndex={-1}
            data-cta-pill="1"
            onClick={onCTAClick}
            style={{
              display: 'inline-flex', alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 0,
              height: 'clamp(52px,5.8vh,68px)',
              paddingLeft: 8,
              paddingRight: 'clamp(14px,1.8vw,24px)',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.95)',
              border: 'none',
              cursor: 'pointer',
              outline: 'none',
              boxShadow: '0 4px 24px rgba(0,0,0,0.14), 0 0 32px 8px rgba(112,71,226,0.38)',
              whiteSpace: 'nowrap',
            }}
          >
            {/* Mascot inside CTA */}
            <div style={{
              flexShrink: 0,
              width: MASCOT_CTA_SIZE, height: MASCOT_CTA_SIZE,
              marginRight: 10,
              position: 'relative',
            }}>
              <AgentMascot agentMode="looking" size={MASCOT_CTA_SIZE} />
            </div>

            {/* CTA label — fully visible */}
            <span style={{
              fontSize: 'clamp(13px,1.35vw,20px)',
              fontWeight: 600, color: '#111',
              fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
              whiteSpace: 'nowrap',
            }}>
              {ctaLabel}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
