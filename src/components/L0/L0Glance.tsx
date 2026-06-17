/**
 * L0Glance — entry point for the cinematic L0 experience.
 *
 * All items now use CinematicL0 (GSAP-driven, alignment-aware).
 * Layout/product rules are resolved from glanceConfig:
 *   left   → showProducts = cardCount > 0
 *   center → showProducts = cardCount > 0
 *   right  → showProducts = false (always)
 */
import type { FeedItem, PreferenceProfile } from '../../data/types';
import { getGlanceConfig } from '../../config/glanceConfig';
import { getReasoning } from '../../logic/reasoningEngine';
import CinematicL0 from './CinematicL0';

type Props = {
  item:       FeedItem;
  profile:    PreferenceProfile;
  paused?:    boolean;
  onCTAClick: () => void;
};

export default function L0Glance({ item, paused = false, onCTAClick }: Props) {
  const config      = getGlanceConfig(item);
  const reasoning   = getReasoning(item);
  const alignment   = config.layout;
  const cardCount   = config.cardCount ?? 2;
  const showProducts = alignment !== 'right' && cardCount > 0;

  return (
    <CinematicL0
      item={item}
      reasoning={reasoning}
      paused={paused}
      ctaFocused={false}
      onCTAClick={onCTAClick}
      alignment={alignment}
      showProducts={showProducts}
    />
  );
}
