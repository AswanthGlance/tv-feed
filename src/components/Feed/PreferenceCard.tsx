/**
 * PreferenceCard — a first-class feed item (not an overlay).
 *
 * Rendered in the unified feed just like an L0Glance.
 * Receives the previous L0 card's image as bgImage for the blurred background
 * so it feels like a natural continuation of the feed.
 *
 * Navigation:
 *   ← →   move between options
 *   ↓     move focus to buttons (multi-select)
 *   ↑     move focus back to options
 *   Enter  pick / confirm
 *   Esc / Back   skip
 */
import type { QuestionConfig, QuestionOptionConfig } from '../../data/preferenceQuestions';
import InterstitialQuestion from '../Polls/InterstitialQuestion';

type Props = {
  question:     QuestionConfig;
  prevImage?:   string;             /* blurred background — last L0 card's image */
  onAnswer:     (opt: QuestionOptionConfig) => void;
  onSkip:       () => void;
};

export default function PreferenceCard({ question, prevImage, onAnswer, onSkip }: Props) {
  return (
    <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <InterstitialQuestion
        question={question}
        currentL0Image={prevImage}
        onAnswer={onAnswer}
        onDismiss={onSkip}
      />
    </div>
  );
}
