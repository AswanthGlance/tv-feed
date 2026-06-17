/**
 * L0FinalState — pixel-perfect final resting state of a CinematicL0 card.
 *
 * No GSAP, no animation. Shows exactly what CinematicL0 looks like at the
 * end of its animation sequence — ready for screenshot and Figma import.
 *
 * Final state per element (derived from l0Timeline.ts):
 *   - Background:    opacity 1, scale 1.04 (tiny Ken Burns end-state), no blur
 *   - Overlay:       opacity 1
 *   - Header:        opacity 1, y=0
 *   - Tag:           opacity 1, y=0
 *   - Title:         small font size (titleSmallFs), opacity 1, y=0
 *   - Mascot (float): gone (inside CTA pill)
 *   - Reasoning:     fully visible, opacity 1
 *   - CTA pill:      visible, mascot inside, label visible, beam glow active
 *   - Product cards: stacked (card0: x=0,y=0,rotate=0 / card1: x=10,y=-3,rotate=7,scale=0.96)
 */

import React from 'react';

export type TemplateData = {
  id: string;
  label: string;
  itemId: string;
  image: string;
  title: string;
  locationLabel?: string;
  category: string;
  tagLabel: string;
  subtitle: string;
  reasoning: string;
  highlights: string[];
  ctaLabel: string;
  alignment: 'left' | 'center' | 'right';
  showProducts: boolean;
  productLabels: string[];
};

const LOGO_SRC = '/glance-logo.png';

const GEO = {
  left: {
    contentLeft:  'clamp(20px, 4.5vw, 88px)',
    contentRight: undefined as string | undefined,
    contentWidth: 'clamp(240px, 52vw, 860px)',
    titleFont:    'clamp(26px, 3.8vw, 58px)',   /* small/final size */
    textAlign:    'left'  as const,
    ctaJustify:   'flex-start' as const,
    tagJustify:   'flex-start' as const,
  },
  center: {
    contentLeft:  '50%',
    contentRight: undefined as string | undefined,
    contentWidth: 'clamp(400px, 72vw, 1100px)',
    titleFont:    'clamp(22px, 3.0vw, 46px)',   /* small/final size */
    textAlign:    'center' as const,
    ctaJustify:   'center' as const,
    tagJustify:   'center' as const,
  },
  right: {
    contentLeft:  undefined as string | undefined,
    contentRight: 'clamp(20px, 4.5vw, 88px)',
    contentWidth: 'clamp(400px, 80vw, 1100px)',
    titleFont:    'clamp(20px, 2.8vw, 44px)',   /* small/final size */
    textAlign:    'right' as const,
    ctaJustify:   'flex-end' as const,
    tagJustify:   'flex-end' as const,
  },
};

const CARD_COLORS = [
  { front: 'linear-gradient(145deg,#c45e1a 0%,#e8863a 55%,#f0a060 100%)' },
  { front: 'linear-gradient(145deg,#1a6045 0%,#2a8f62 55%,#3db882 100%)' },
];

function HighlightedText({ text, highlights }: { text: string; highlights: string[] }) {
  if (!highlights.length) return <>{text}</>;

  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  // Split at first ". " for two-line display
  const breakIdx = remaining.indexOf('. ');
  const line1 = breakIdx !== -1 ? remaining.slice(0, breakIdx + 1) : remaining;
  const line2 = breakIdx !== -1 ? remaining.slice(breakIdx + 2) : '';

  function renderLine(line: string, lineKey: string) {
    const result: React.ReactNode[] = [];
    let rest = line;
    let ki = 0;
    while (rest.length > 0) {
      let earliest = -1;
      let earliestHL = '';
      for (const hl of highlights) {
        const idx = rest.toLowerCase().indexOf(hl.toLowerCase());
        if (idx !== -1 && (earliest === -1 || idx < earliest)) {
          earliest = idx;
          earliestHL = hl;
        }
      }
      if (earliest === -1) {
        result.push(<span key={`${lineKey}-${ki}`}>{rest}</span>);
        break;
      }
      if (earliest > 0) {
        result.push(<span key={`${lineKey}-${ki}-pre`}>{rest.slice(0, earliest)}</span>);
      }
      result.push(
        <span key={`${lineKey}-${ki}-hl`} style={{
          fontWeight: 700,
          color: 'rgba(255,255,255,0.98)',
          textShadow: '0 0 12px rgba(192,132,252,0.9), 0 0 28px rgba(112,71,226,0.6)',
        }}>
          {rest.slice(earliest, earliest + earliestHL.length)}
        </span>
      );
      rest = rest.slice(earliest + earliestHL.length);
      ki++;
    }
    return result;
  }

  return (
    <>
      <span style={{ display: 'block' }}>{renderLine(line1, 'l1')}</span>
      {line2 && <span style={{ display: 'block' }}>{renderLine(line2, 'l2')}</span>}
    </>
  );
}

function MascotCircle({ size, mode = 'idle' }: { size: number; mode?: string }) {
  // Simplified mascot placeholder — purple circle with eye icon since Rive can't
  // be captured statically. In Figma, replace with the actual mascot asset.
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'radial-gradient(circle at 38% 36%, #9B6EE8, #5A2EBB)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', flexShrink: 0,
      boxShadow: '0 0 18px rgba(112,71,226,0.45)',
    }}>
      {/* Eyes */}
      <svg width={size * 0.6} height={size * 0.4} viewBox="0 0 36 24" fill="none">
        <ellipse cx="10" cy="12" rx="5" ry="6" fill="white" />
        <ellipse cx="26" cy="12" rx="5" ry="6" fill="white" />
        <circle cx="11" cy="13" r="3" fill="#1a0a2e" />
        <circle cx="27" cy="13" r="3" fill="#1a0a2e" />
        <circle cx="12" cy="11.5" r="1" fill="white" />
        <circle cx="28" cy="11.5" r="1" fill="white" />
      </svg>
    </div>
  );
}

export default function L0FinalState({ template }: { template: TemplateData }) {
  const geo = GEO[template.alignment];
  const TILE    = 'clamp(68px, 8vw, 96px)';
  const TILE_BR = 'clamp(12px, 1.4vw, 18px)';
  const BOTTOM  = 'clamp(28px, 5vh, 56px)';

  const contentTransform = template.alignment === 'center' ? 'translateX(-50%)' : undefined;

  const overlayGradients = [
    'linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.50) 28%, rgba(0,0,0,0.06) 55%, transparent 70%)',
    'linear-gradient(to bottom, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.22) 18%, transparent 38%)',
    template.alignment === 'right'
      ? 'linear-gradient(to left, rgba(0,0,0,0.60) 0%, rgba(0,0,0,0.20) 40%, transparent 65%)'
      : 'linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 40%, transparent 65%)',
  ].join(', ');

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const timeMain = timeStr.replace(/\s?[AP]M/i, '');
  const ampm = now.getHours() < 12 ? 'AM' : 'PM';
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>

      {/* Background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${template.image})`,
        backgroundSize: 'cover', backgroundPosition: 'center 32%',
        transform: 'scale(1.04)',
        zIndex: 1,
      }} />

      {/* Overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: overlayGradients,
        zIndex: 2, pointerEvents: 'none',
      }} />

      {/* HEADER */}
      <div style={{
        position: 'absolute',
        top: 'clamp(16px, 3vh, 48px)',
        left: 'clamp(20px, 4.5vw, 88px)',
        right: 'clamp(20px, 4.5vw, 88px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        zIndex: 30,
      }}>
        <img
          src={LOGO_SRC}
          alt="glance"
          style={{ height: 'clamp(26px, 3.2vh, 48px)', width: 'auto', display: 'block', objectFit: 'contain', objectPosition: 'left center' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(5px,0.7vw,10px)' }}>
          <span style={{ fontSize: 'clamp(10px,1.1vw,18px)', color: 'rgba(255,255,255,0.45)', fontFamily: 'system-ui', fontWeight: 500 }}>
            ☁ 65°
          </span>
          <span style={{ fontSize: 'clamp(10px,1.1vw,18px)', color: 'rgba(255,255,255,0.45)', fontFamily: 'system-ui', fontWeight: 500 }}>
            {dateStr}
          </span>
          <span style={{ fontSize: 'clamp(10px,1.1vw,18px)', color: '#ffffff', fontFamily: 'system-ui', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
            {timeMain} {ampm}
          </span>
        </div>
      </div>

      {/* CONTENT COLUMN */}
      <div style={{
        position: 'absolute',
        left:   template.alignment === 'right' ? 0 : geo.contentLeft,
        right:  geo.contentRight,
        bottom: BOTTOM,
        width:  template.alignment === 'right' ? undefined : geo.contentWidth,
        transform: contentTransform,
        zIndex: 20,
        display: 'flex', flexDirection: 'column', gap: 0,
      }}>

        {/* TAG */}
        <div style={{ display: 'flex', justifyContent: geo.tagJustify, marginBottom: 'clamp(6px,1vh,12px)' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.10)',
            border: '1px solid rgba(255,255,255,0.16)',
            borderRadius: 999,
            padding: 'clamp(3px,0.45vh,6px) clamp(10px,1.2vw,16px)',
            backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          }}>
            <span style={{
              fontSize: 'clamp(9px,0.9vw,13px)', fontWeight: 700,
              color: 'rgba(255,255,255,0.78)', letterSpacing: '0.11em',
              textTransform: 'uppercase', fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
            }}>{template.tagLabel}</span>
          </div>
        </div>

        {/* TITLE — final small size */}
        <h1 style={{
          margin: 0,
          fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
          fontWeight: 800,
          fontSize: geo.titleFont,
          lineHeight: 1.03,
          letterSpacing: '-0.028em',
          color: 'rgba(255,255,255,0.95)',
          textShadow: '0 3px 40px rgba(0,0,0,0.6)',
          whiteSpace: 'nowrap',
          textAlign: geo.textAlign,
          marginBottom: 'clamp(10px,1.5vh,18px)',
          transformOrigin: template.alignment === 'center' ? 'center bottom'
                         : template.alignment === 'right' ? 'right bottom' : 'left bottom',
        }}>
          {template.title}
        </h1>

        {/* CENTER LAYOUT: mascot gap collapses to 0 in final state (mascot is inside CTA) */}

        {/* REASONING ROW */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          flexDirection: template.alignment === 'right' ? 'row-reverse' : 'row',
          justifyContent: template.alignment === 'center' ? 'center' : 'flex-start',
          gap: 0,  /* mascot gone — gap = 0 */
          marginBottom: 'clamp(18px,2.8vh,32px)',
          overflow: 'hidden',
        }}>
          <p style={{
            margin: 0,
            flex: template.alignment === 'center' ? undefined : 1,
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            fontWeight: 400,
            fontSize: 'clamp(13px,1.35vw,20px)',
            lineHeight: 1.75,
            color: 'rgba(255,255,255,0.78)',
            textShadow: '0 1px 6px rgba(0,0,0,0.4), 0 0 20px rgba(192,132,252,0.18)',
            maxWidth: template.alignment === 'center' ? 'clamp(400px, 50vw, 680px)' : 'none',
            width: '100%',
            textAlign: geo.textAlign,
          }}>
            <HighlightedText text={template.reasoning} highlights={template.highlights} />
          </p>
        </div>

        {/* CTA — final state: pill visible, mascot inside, label showing, beam glow */}
        <div style={{ display: 'flex', justifyContent: geo.ctaJustify }}>
          <div>
            {/* Beam glow outer — simulated via drop-shadow on the pill */}
            <button
              style={{
                display: 'inline-flex', alignItems: 'center',
                justifyContent: template.alignment === 'right' ? 'flex-end' : 'flex-start',
                gap: 0,
                height: 'clamp(52px,5.8vh,68px)',
                paddingLeft: 8,
                paddingRight: 'clamp(14px,1.8vw,24px)',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.95)',
                border: 'none',
                cursor: 'default',
                outline: 'none',
                boxShadow: '0 4px 24px rgba(0,0,0,0.14), 0 0 32px 8px rgba(112,71,226,0.38)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              {/* Mascot inside pill */}
              <div style={{
                flexShrink: 0, width: 52, height: 52,
                marginRight: 10,
                position: 'relative',
              }}>
                <MascotCircle size={48} mode="looking" />
              </div>

              {/* CTA label */}
              <span style={{
                fontSize: 'clamp(13px,1.35vw,20px)',
                fontWeight: 600, color: '#111',
                fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
                display: 'inline-block',
              }}>
                {template.ctaLabel}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* PRODUCT CARDS — right side, stacked final state */}
      {template.showProducts && (
        <div style={{
          position: 'absolute',
          bottom: BOTTOM,
          right: 'clamp(20px,3.5vw,60px)',
          zIndex: 20,
          width: `calc(${TILE} + 18px)`,
          height: TILE,
          overflow: 'visible',
        }}>
          {template.productLabels.slice(0, 2).map((label, i) => {
            const col = CARD_COLORS[i % CARD_COLORS.length];
            /* Final stacked state from timeline:
               card0: x=0, y=0, rotate=0, scale=1   → z-index 2
               card1: x=10, y=-3, rotate=7, scale=0.96 → z-index 1, behind */
            const cardTransform = i === 0
              ? 'none'
              : 'translate(10px, -3px) rotate(7deg) scale(0.96)';
            return (
              <div
                key={label}
                style={{
                  position: 'absolute',
                  top: 0, left: 0,
                  width: TILE, height: TILE,
                  borderRadius: TILE_BR,
                  border: `2.5px solid rgba(255,255,255,${i === 0 ? 0.96 : 0.85})`,
                  boxShadow: `0 ${4 + i * 2}px ${18 + i * 4}px rgba(0,0,0,0.42)`,
                  background: col.front,
                  overflow: 'hidden',
                  display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                  zIndex: 2 - i,
                  transform: cardTransform,
                }}
              >
                <div style={{
                  background: 'linear-gradient(to top,rgba(0,0,0,0.72) 0%,transparent 100%)',
                  padding: 'clamp(5px,0.7vh,9px) clamp(5px,0.6vw,7px)',
                  fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
                  fontSize: 'clamp(8px,0.85vw,11px)', fontWeight: 700,
                  color: 'rgba(255,255,255,0.94)', letterSpacing: 0.3,
                  lineHeight: 1.2, textTransform: 'uppercase',
                }}>
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
