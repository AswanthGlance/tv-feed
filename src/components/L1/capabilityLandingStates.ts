/**
 * capabilityLandingStates — per-category content for the L1 "conversation
 * start" state shown immediately after a homepage capability is selected.
 *
 * This is pure content config, not new UI. CapabilityL1App reads it to
 * populate the existing L1Page shell (same layout, mascot, query area,
 * bottom prompt row, animation system) with category-specific copy — no
 * recommendation cards render until the user picks a suggested prompt.
 */

import type { RendererType } from './rendererRegistry';

export type CapabilityLandingId =
  | 'fashion'
  | 'travel'
  | 'food'
  | 'sports'
  | 'wellness'
  | 'homeDecor';

export interface CapabilityLandingState {
  agentMessage: string;
  inputPlaceholder: string;
  prompts: string[];
  /** Short "thinking" lines the shell types out before agentMessage — the
   * phase machine requires at least one. Kept to 2 short lines (vs the
   * usual 5 in rendererRegistry.ts) so the intro stays fast. */
  thinkingSteps: string[];
}

export const capabilityLandingStates: Record<CapabilityLandingId, CapabilityLandingState> = {
  fashion: {
    agentMessage: "Let’s find something you’ll actually enjoy wearing. What are you dressing for?",
    inputPlaceholder: 'Tell me the occasion, style, or product you need…',
    thinkingSteps: ['reading your style and the occasion…', 'getting outfit ideas ready…'],
    prompts: [
      'Build a wedding guest outfit',
      'Help me dress for work',
      'Find something for a vacation',
      'Compare two jackets',
      'Create a complete look',
    ],
  },
  travel: {
    agentMessage: "Whether it’s a weekend escape or a bigger vacation, I’ll help you plan it. Where are you thinking of going?",
    inputPlaceholder: 'Tell me a destination or the kind of trip you want…',
    thinkingSteps: ['thinking through trip ideas…', 'getting the planner ready…'],
    prompts: [
      'Plan a weekend getaway',
      'Find a romantic destination',
      'Build a family trip',
      'Suggest places within driving distance',
      'Plan a budget-friendly vacation',
    ],
  },
  food: {
    agentMessage: 'I can help you cook, order, or discover something new. What are you in the mood for?',
    inputPlaceholder: 'Tell me what you want to eat or cook…',
    thinkingSteps: ['thinking about what sounds good…', 'warming up the recipe box…'],
    prompts: [
      'Cook something with what I have',
      'Find a quick dinner recipe',
      'Suggest a healthy meal',
      'Find restaurants for date night',
      'Build a weekly meal plan',
    ],
  },
  sports: {
    agentMessage: 'I can help with matches, tickets, highlights, and stats. What would you like to follow?',
    inputPlaceholder: "Tell me the team, sport, or match you’re interested in…",
    thinkingSteps: ["checking today’s matches and scores…", 'getting your sports feed ready…'],
    prompts: [
      'What should I watch tonight?',
      'Find tickets for an upcoming match',
      "Show my team's next fixtures",
      'Plan my match day',
      'Compare two teams',
    ],
  },
  wellness: {
    agentMessage: "Let’s focus on your wellbeing. What would you like to improve today?",
    inputPlaceholder: 'Tell me your fitness, nutrition, sleep, or recovery goal…',
    thinkingSteps: ['checking in on your goals…', 'getting your wellness tools ready…'],
    prompts: [
      'Build a beginner workout',
      'Suggest a healthy meal plan',
      'Help improve my sleep',
      'Create a morning wellness routine',
      'Plan a recovery day',
    ],
  },
  homeDecor: {
    agentMessage: "Let’s make your space feel more like you. Which room would you like to work on?",
    inputPlaceholder: 'Tell me the room, style, or problem you want to solve…',
    thinkingSteps: ['taking a look at your space…', 'gathering decor ideas…'],
    prompts: [
      'Redesign my living room',
      'Find furniture for a small space',
      'Create a warm bedroom look',
      'Compare two sofa styles',
      'Suggest decor within my budget',
    ],
  },
};

/**
 * Which existing L1 renderer template each suggested prompt opens once
 * selected. Reuses the pre-built renderer demos in rendererRegistry.ts as
 * the "normal L1 agentic response flow" continuation — this prototype has
 * no free-text NLP dispatcher, so the mapping is a fixed, hand-picked best
 * fit per prompt rather than derived from the prompt text at runtime.
 * Index-aligned with `prompts` in capabilityLandingStates above.
 */
export const capabilityPromptRenderers: Record<CapabilityLandingId, RendererType[]> = {
  fashion:   ['recommendation', 'recommendation', 'collection', 'comparison', 'collection'],
  travel:    ['journey', 'recommendation', 'journey', 'recommendation', 'recommendation'],
  food:      ['guided-flow', 'guided-flow', 'facts', 'recommendation', 'guided-flow'],
  sports:    ['recommendation', 'comparison', 'journey', 'journey', 'comparison'],
  wellness:  ['guided-flow', 'facts', 'insights', 'guided-flow', 'insights'],
  homeDecor: ['collection', 'recommendation', 'collection', 'comparison', 'recommendation'],
};
