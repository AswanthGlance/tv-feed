export type Screen =
  | 'welcome'
  | 'bangalore-confirm'
  | 'tv-content'
  | 'audience'
  | 'show-more'
  | 'weekend'
  | 'style'
  | 'selfie'
  | 'tuning'
  | 'feed';

export const SCREEN_ORDER: Screen[] = [
  'welcome',
  'bangalore-confirm',
  'tv-content',
  'audience',
  'show-more',
  'weekend',
  'style',
  'selfie',
  'tuning',
  'feed',
];

export function isForward(from: Screen, to: Screen): boolean {
  return SCREEN_ORDER.indexOf(to) > SCREEN_ORDER.indexOf(from);
}

export type FocusDirection = 'up' | 'down' | 'left' | 'right' | 'ok' | 'back';

export function getBackTarget(screen: Screen, _questionsStarted: boolean): Screen | null {
  const exits: Partial<Record<Screen, Screen | null>> = {
    welcome:           null,
    'bangalore-confirm': 'welcome',
    'tv-content':      'bangalore-confirm',
    'audience':        'tv-content',
    'show-more':       'audience',
    'weekend':         'show-more',
    'style':           'weekend',
    selfie:            'style',
    tuning:            null,
    feed:              null,
  };
  return exits[screen] ?? null;
}
