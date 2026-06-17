/**
 * GlanceLayout — standard (non-cinematic) L0 layout.
 * Cinematic items are handled by CinematicL0.tsx.
 */
import type { FeedItem, PreferenceProfile } from '../../data/types';
import type { GlanceLayout as LayoutVariant } from '../../config/glanceConfig';
import { LAYOUT_GEOMETRY } from '../../config/glanceConfig';
import type { AgentMode } from '../Shared/AgentMascot';
import AgentReasoning from './AgentReasoning';
import AgentCTA from './AgentCTA';
import ProductRail from './ProductRail';

type Props = {
  item: FeedItem;
  profile: PreferenceProfile;
  layout: LayoutVariant;
  cardCount: number;
  reasoning: string;
  agentMode: AgentMode;
  animStep: number;
  cardRevealStep: number;
  ctaFocused: boolean;
  isCinematic: boolean; /* always false here — kept for compat */
  typedChars: number;
  onCTAClick: () => void;
};

export default function GlanceLayout({
  item, layout, cardCount, reasoning, agentMode,
  animStep, cardRevealStep, ctaFocused, onCTAClick,
}: Props) {
  const geo      = LAYOUT_GEOMETRY[layout];
  const isCenter = layout === 'center';
  const isRight  = layout === 'right';
  const textAlign = geo.textAlign;

  const productCards = item.subCategories
    .slice(0, cardCount)
    .map((sub, i) => ({ label: sub, index: i }));

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: geo.bottomInset,
    left:  isRight  ? undefined : isCenter ? '50%' : (geo.textLeft as number),
    right: isRight  ? 80 : undefined,
    transform: isCenter ? 'translateX(-50%)' : undefined,
    maxWidth: geo.maxWidth,
    width:  isCenter ? geo.maxWidth : undefined,
    zIndex: 10,
  };

  const stdTitleIn = animStep >= 2;
  const stdMascot  = animStep >= 3;
  const stdReason  = animStep >= 4;
  const stdCTA     = animStep >= 5;
  const stdCards   = animStep >= 6;

  return (
    <div style={containerStyle}>
      {item.locationLabel && stdMascot && (
        <div style={{ display: 'flex', justifyContent: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start', marginBottom: 14 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(112,71,226,0.28)', border: '1px solid rgba(112,71,226,0.4)', borderRadius: 999, padding: '6px 16px', fontSize: 15, color: 'rgba(245,243,247,0.9)' }}>
            <span style={{ fontSize: 12 }}>📍</span>{item.locationLabel}
          </div>
        </div>
      )}

      <div style={{ fontSize: 14, fontWeight: 700, color: '#A786E5', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 10, textAlign, opacity: stdMascot ? 1 : 0, transition: 'opacity 0.4s ease' }}>
        {item.category}
      </div>

      <h1 style={{
        fontSize: geo.titleSize, fontWeight: 800, color: '#F5F3F7',
        margin: '0 0 18px', lineHeight: 1.04, letterSpacing: -0.5,
        fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
        textShadow: '0 2px 24px rgba(0,0,0,0.55)', textAlign,
        opacity: stdTitleIn ? 1 : 0,
        transform: stdTitleIn ? 'translateY(0)' : 'translateY(20px)',
        filter: stdTitleIn ? 'blur(0)' : 'blur(8px)',
        transition: 'opacity 0.65s cubic-bezier(0.22,1,0.36,1), transform 0.65s, filter 0.65s',
      }}>
        {item.title}
      </h1>

      {!isCenter && (
        <p style={{
          fontSize: 21, color: 'rgba(245,243,247,0.72)', margin: '0 0 18px',
          lineHeight: 1.45, maxWidth: 600, marginLeft: isRight ? 'auto' : undefined,
          textAlign, fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
          opacity: stdTitleIn ? 1 : 0,
          transform: stdTitleIn ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.55s cubic-bezier(0.22,1,0.36,1) 0.08s, transform 0.55s 0.08s',
        }}>
          {item.subtitle}
        </p>
      )}

      <AgentReasoning reasoning={reasoning} agentMode={agentMode} layout={layout} animStep={stdReason ? 4 : 0} align={textAlign} />
      <ProductRail cards={productCards} animStep={stdCards ? 6 : 0} cardRevealStep={cardRevealStep} align={textAlign} />
      <AgentCTA label={item.ctaLabel} focused={ctaFocused} animStep={stdCTA ? 5 : 0} align={textAlign} onClick={onCTAClick} showMascotInside={false} agentMode={agentMode} />
    </div>
  );
}
