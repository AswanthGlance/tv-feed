/**
 * feedComposer.ts — builds a unified feed mixing L0 glances and preference cards.
 *
 * Rules:
 *   · Insert one preference card after every PREFERENCE_INTERVAL L0 cards
 *   · Use at most MAX_PREFERENCE_CARDS preference questions in a session
 *   · Preserve original L0 order and template alignment
 *   · Preference cards are first-class feed items, not overlays
 */

import type { FeedItem } from '../data/types';
import type { QuestionConfig } from '../data/preferenceQuestions';

export const PREFERENCE_INTERVAL    = 5;  /* one preference card every N L0s */
export const MAX_PREFERENCE_CARDS   = 6;  /* cap total preference cards in feed */

export type GlanceFeedItem = {
  type: 'glance';
  id:   string;
  item: FeedItem;
};

export type PreferenceFeedItem = {
  type:     'preference';
  id:       string;
  question: QuestionConfig;
};

export type UnifiedFeedItem = GlanceFeedItem | PreferenceFeedItem;

/**
 * Compose a unified feed from L0 cards and preference questions.
 * Inserts preference cards at regular intervals; never at position 0.
 */
export function composeFeedWithPreferences(
  l0Items:   FeedItem[],
  questions: QuestionConfig[],
): UnifiedFeedItem[] {
  const result: UnifiedFeedItem[] = [];
  const prefPool = questions.slice(0, MAX_PREFERENCE_CARDS);
  let prefIdx = 0;
  let l0Count = 0;

  for (const item of l0Items) {
    result.push({ type: 'glance', id: item.id, item });
    l0Count++;

    if (l0Count % PREFERENCE_INTERVAL === 0 && prefIdx < prefPool.length) {
      const q = prefPool[prefIdx++];
      result.push({ type: 'preference', id: `pref-${q.id}`, question: q });
    }
  }

  return result;
}
