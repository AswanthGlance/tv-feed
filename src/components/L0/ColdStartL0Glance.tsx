/**
 * ColdStartL0Glance — demo_cold_start variant of L0Glance.
 *
 * Delegates to ColdStartCinematicL0 (fixed timeline) instead of CinematicL0.
 * Accepts onTimelineComplete which fires after the full sequence settles.
 */
import type { FeedItem, PreferenceProfile } from '../../data/types';
import { getGlanceConfig } from '../../config/glanceConfig';
import { getReasoning } from '../../logic/reasoningEngine';
import ColdStartCinematicL0 from './ColdStartCinematicL0';

type Props = {
  item:               FeedItem;
  profile:            PreferenceProfile;
  paused?:            boolean;
  onCTAClick:         () => void;
  onTimelineComplete: () => void;
};

export default function ColdStartL0Glance({ item, paused = false, onCTAClick, onTimelineComplete }: Props) {
  const config      = getGlanceConfig(item);
  const reasoning   = getReasoning(item);
  const alignment   = config.layout;
  const cardCount   = config.cardCount ?? 2;
  const showProducts = alignment !== 'right' && cardCount > 0;

  return (
    <ColdStartCinematicL0
      item={item}
      reasoning={reasoning}
      paused={paused}
      ctaFocused={false}
      onCTAClick={onCTAClick}
      alignment={alignment}
      showProducts={showProducts}
      onTimelineComplete={onTimelineComplete}
    />
  );
}
