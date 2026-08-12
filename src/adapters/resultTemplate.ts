/* Visual "skin" selection for the result page, derived from the trace's own
 * real turn.skills_selected — never a fixed, pre-authored use case. This is
 * chrome only (section-label wording, generic CTA text): every fact on the
 * page (title, image, rating, description) comes from the trace's real
 * evidence, never from here.
 *
 * Real skill values observed on aitv-mewtwo-harness (see phoenix-openapi.json
 * for the API that surfaces them, and turn.skills_selected on harness.turn
 * spans for the actual data): events, fashion, food, home_decor,
 * local_experiences, sports, travel, weather_planner, plus an "aigc_*"
 * family (aigc_food, aigc_travel, aigc_experiences) and multi-label combos
 * like "fashion, travel". Anything not explicitly mapped falls through to
 * 'general' rather than being forced into an ill-fitting bucket. */
export type ResultTemplateId = 'travel' | 'recipe' | 'sports' | 'entertainment' | 'fashion' | 'local' | 'general';

const SKILL_TO_TEMPLATE: Record<string, ResultTemplateId> = {
  travel: 'travel',
  aigc_travel: 'travel',
  food: 'recipe',
  aigc_food: 'recipe',
  fashion: 'fashion',
  sports: 'sports',
  events: 'entertainment',
  local_experiences: 'local',
  aigc_experiences: 'local',
};

/** turn.skills_selected is often multi-valued ("fashion, travel") — checks
 *  each label in order and uses the first one we have a mapping for. */
export function resolveResultTemplate(skillRaw: string | undefined): ResultTemplateId {
  if (!skillRaw) return 'general';
  const labels = skillRaw.split(',').map((s) => s.trim().toLowerCase());
  for (const label of labels) {
    if (SKILL_TO_TEMPLATE[label]) return SKILL_TO_TEMPLATE[label];
  }
  return 'general';
}

/** followUps is chrome too (generic per-category prompts, like eyebrow/
 *  ctaLabel) — never a claim about what this specific trace's evidence
 *  supports, just plausible next questions for a "we found you an X" result. */
export const RESULT_TEMPLATE_CHROME: Record<ResultTemplateId, { eyebrow: string; ctaLabel: string; followUps: string[] }> = {
  travel: {
    eyebrow: 'My first pick',
    ctaLabel: 'Check out',
    followUps: ['Show more nearby stays', "What's the weather like there?", 'Suggest a shorter drive'],
  },
  recipe: {
    eyebrow: 'My first pick',
    ctaLabel: 'Check out',
    followUps: ['Show me the ingredient list', 'Make this healthier', 'Suggest a side dish'],
  },
  sports: {
    eyebrow: 'My first pick',
    ctaLabel: 'Check out',
    followUps: ['Show the schedule', 'Any highlights from the last game?', 'Compare with another team'],
  },
  entertainment: {
    eyebrow: 'My first pick',
    ctaLabel: 'Check out',
    followUps: ["What else is on this week?", 'Any similar recommendations?', 'Show reviews'],
  },
  fashion: {
    eyebrow: 'My first pick',
    ctaLabel: 'Check out',
    followUps: ['Show similar styles', 'What about accessories?', 'Suggest a different color'],
  },
  local: {
    eyebrow: 'My first pick',
    ctaLabel: 'Check out',
    followUps: ['Show more nearby spots', 'Best time to visit?', 'Suggest something similar'],
  },
  general: {
    eyebrow: 'My first pick',
    ctaLabel: 'Check out',
    followUps: ['Tell me more', 'Show other options', 'Why did you pick this?'],
  },
};
