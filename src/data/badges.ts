export type Badge = {
  id: string;
  label: string;
  description: string;
  triggerCondition: string;
};

export const BADGES: Badge[] = [
  { id: 'first-spark', label: 'First Spark', description: 'Answered your first preference moment', triggerCondition: 'onboarding-complete' },
  { id: 'explorer', label: 'Explorer', description: 'Travel + nature signals detected', triggerCondition: 'travel+nature-weight' },
  { id: 'foodie-radar', label: 'Foodie Radar', description: 'Strong food content affinity', triggerCondition: 'food-weight' },
  { id: 'culture-curator', label: 'Culture Curator', description: 'Entertainment and culture content affinity', triggerCondition: 'entertainment-weight' },
  { id: 'sports-insider', label: 'Sports Insider', description: 'Sports content affinity detected', triggerCondition: 'sports-weight' },
  { id: 'style-persona', label: 'Style Persona', description: 'Fashion and beauty affinity', triggerCondition: 'fashion+beauty-weight' },
  { id: 'chill-mode', label: 'Chill Mode', description: 'Calm, slow, cozy vibes dominate your feed', triggerCondition: 'calm+slow+cozy-vibes' },
  { id: 'always-evolving', label: 'Always Evolving', description: 'Continued feedback shaping your feed', triggerCondition: 'feedback-count' },
];

export function evaluateBadges(weights: Record<string, number>, feedbackCount: number, onboardingDone: boolean): string[] {
  const earned: string[] = [];
  if (onboardingDone) earned.push('first-spark');
  const travel = (weights['travel'] || 0) + (weights['nature-led'] || 0);
  if (travel >= 4) earned.push('explorer');
  if ((weights['food'] || 0) >= 4) earned.push('foodie-radar');
  if ((weights['entertainment'] || 0) >= 4) earned.push('culture-curator');
  if ((weights['sports'] || 0) >= 4) earned.push('sports-insider');
  const style = (weights['fashion'] || 0) + (weights['beauty'] || 0);
  if (style >= 4) earned.push('style-persona');
  const chill = (weights['calm'] || 0) + (weights['slow'] || 0) + (weights['cozy'] || 0);
  if (chill >= 5) earned.push('chill-mode');
  if (feedbackCount >= 3) earned.push('always-evolving');
  return earned;
}
