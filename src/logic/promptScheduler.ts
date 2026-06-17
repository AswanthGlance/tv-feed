import { GENQ } from '../data/generalQuestions';

export type PromptSchedulerState = {
  cardsViewed: number;
  cardsSincePrompt: number;
  promptGap: number;
  promptN: number;
  askedGenIds: Set<string>;
};

export function createScheduler(): PromptSchedulerState {
  return {
    cardsViewed: 0,
    cardsSincePrompt: 0,
    promptGap: 8,
    promptN: 0,
    askedGenIds: new Set(),
  };
}

export function onCardViewed(s: PromptSchedulerState): PromptSchedulerState {
  return { ...s, cardsViewed: s.cardsViewed + 1, cardsSincePrompt: s.cardsSincePrompt + 1 };
}

export function onPromptShown(s: PromptSchedulerState, genId?: string): PromptSchedulerState {
  const askedGenIds = new Set(s.askedGenIds);
  if (genId) askedGenIds.add(genId);
  return {
    ...s,
    cardsSincePrompt: 0,
    promptN: s.promptN + 1,
    promptGap: 8 + Math.floor(Math.random() * 3),
    askedGenIds,
  };
}

export function resetScheduler(): PromptSchedulerState {
  return createScheduler();
}

export type PromptKind = { type: 'gen'; genId: string } | { type: 'ctx' } | null;

// Decide what kind of prompt to show next, if any
export function shouldShowPrompt(
  s: PromptSchedulerState,
  hasContextualQuestion: boolean,
  overlayOpen: boolean,
): PromptKind {
  if (s.cardsViewed < 6) return null;
  if (s.cardsSincePrompt < s.promptGap) return null;
  if (overlayOpen) return null;

  const nextGen = GENQ.find(q => !s.askedGenIds.has(q.id));
  const genAvail = !!nextGen;

  // Alternate: even promptN → prefer gen, odd → prefer ctx
  if (genAvail && (s.promptN % 2 === 0 || !hasContextualQuestion)) {
    return { type: 'gen', genId: nextGen!.id };
  }
  if (hasContextualQuestion) {
    return { type: 'ctx' };
  }
  if (genAvail) {
    return { type: 'gen', genId: nextGen!.id };
  }
  return null;
}
