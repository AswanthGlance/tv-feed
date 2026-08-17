/**
 * WarmProfile1CrisperL0Glance — warm_profile_1_crisper route only.
 *
 * Routes warm-start cards to WarmProfile1CrisperCinematicL0 (1-signal variant).
 * Any item not in WARM_CARD_CRISPER_DATA falls through to ColdStartL0Glance.
 */
import type { FeedItem, PreferenceProfile } from '../../data/types';
import { getGlanceConfig } from '../../config/glanceConfig';
import ColdStartL0Glance from './ColdStartL0Glance';
import WarmProfile1CrisperCinematicL0 from './WarmProfile1CrisperCinematicL0';
import { WARM_CARD_CRISPER_DATA } from './warmCardCrisperData';

type Props = {
  item:               FeedItem;
  profile:            PreferenceProfile;
  paused?:            boolean;
  onCTAClick:         () => void;
  onTimelineComplete: () => void;
  /** V6 Connected Hub: shift left-anchored L0 content right (bg stays full-bleed) */
  contentOffsetX?:    number;
};

export default function WarmProfile1CrisperL0Glance({ item, profile, paused = false, onCTAClick, onTimelineComplete, contentOffsetX = 0 }: Props) {
  const signalData = WARM_CARD_CRISPER_DATA[item.id];

  if (signalData) {
    const config    = getGlanceConfig(item);
    const alignment = config.layout;

    return (
      <WarmProfile1CrisperCinematicL0
        key={item.id}
        item={item}
        paused={paused}
        ctaFocused={false}
        onCTAClick={onCTAClick}
        alignment={alignment}
        onTimelineComplete={onTimelineComplete}
        signalData={signalData}
        contentOffsetX={contentOffsetX}
      />
    );
  }

  return (
    <ColdStartL0Glance
      key={item.id}
      item={item}
      profile={profile}
      paused={paused}
      onCTAClick={onCTAClick}
      onTimelineComplete={onTimelineComplete}
    />
  );
}
