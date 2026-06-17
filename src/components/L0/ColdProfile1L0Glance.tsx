/**
 * ColdProfile1L0Glance — cold_profile_1 route only.
 *
 * Routes cold-start cards to WarmProfile1CrisperCinematicL0 (1-signal variant).
 * Any item not in COLD_PROFILE_1_DATA falls through to ColdStartL0Glance.
 */
import type { FeedItem, PreferenceProfile } from '../../data/types';
import { getGlanceConfig } from '../../config/glanceConfig';
import ColdStartL0Glance from './ColdStartL0Glance';
import WarmProfile1CrisperCinematicL0 from './WarmProfile1CrisperCinematicL0';
import { COLD_PROFILE_1_DATA } from './coldProfile1Data';

type Props = {
  item:               FeedItem;
  profile:            PreferenceProfile;
  paused?:            boolean;
  onCTAClick:         () => void;
  onTimelineComplete: () => void;
};

export default function ColdProfile1L0Glance({ item, profile, paused = false, onCTAClick, onTimelineComplete }: Props) {
  const signalData = COLD_PROFILE_1_DATA[item.id];

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
