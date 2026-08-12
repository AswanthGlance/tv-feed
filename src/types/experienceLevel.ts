/* Leadership / design-comparison switch — NOT necessarily part of the final
 * consumer TV product. Lets one session flip between the three framework
 * levels (Visible Progress / Progressive Value / Collaborative Agent)
 * without losing the current scenario. See ExperienceLevelSwitcher.tsx. */
export type ExperienceLevel = 'level1' | 'level2' | 'level3';

const LEVEL_PARAM_VALUES: Record<string, ExperienceLevel> = {
  '1': 'level1',
  '2': 'level2',
  '3': 'level3',
  level1: 'level1',
  level2: 'level2',
  level3: 'level3',
};

export function readLevelFromUrl(): ExperienceLevel {
  if (typeof window === 'undefined') return 'level1';
  const raw = new URLSearchParams(window.location.search).get('level');
  if (!raw) return 'level1';
  return LEVEL_PARAM_VALUES[raw.toLowerCase()] ?? 'level1';
}

export function writeLevelToUrl(level: ExperienceLevel) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.set('level', level.replace('level', ''));
  window.history.replaceState(null, '', url);
}
