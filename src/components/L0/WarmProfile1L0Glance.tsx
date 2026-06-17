/**
 * WarmProfile1L0Glance — warm_profile_1 route only.
 *
 * Routes all 8 warm-start cards to WarmProfile1CinematicL0 (signal→decision pattern).
 * Any item not in WARM_CARD_SIGNAL_DATA falls through to ColdStartL0Glance.
 */
import type { FeedItem, PreferenceProfile } from '../../data/types';
import { getGlanceConfig } from '../../config/glanceConfig';
import ColdStartL0Glance from './ColdStartL0Glance';
import WarmProfile1CinematicL0 from './WarmProfile1CinematicL0';
import { WARM_CARD_SIGNAL_DATA } from './warmCardSignalData';

type Props = {
  item:               FeedItem;
  profile:            PreferenceProfile;
  paused?:            boolean;
  onCTAClick:         () => void;
  onTimelineComplete: () => void;
};

export default function WarmProfile1L0Glance({ item, profile, paused = false, onCTAClick, onTimelineComplete }: Props) {
  const signalData = WARM_CARD_SIGNAL_DATA[item.id];

  if (signalData) {
    const config    = getGlanceConfig(item);
    const alignment = config.layout;

    return (
      <WarmProfile1CinematicL0
        key={item.id}
        item={item}
        paused={paused}
        ctaFocused={false}
        onCTAClick={onCTAClick}
        alignment={alignment}
        onTimelineComplete={onTimelineComplete}
        signalData={signalData}
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
