/** Uses the otherwise-empty lower canvas for short "editorial intelligence"
 *  — a synthesized read a viewer wouldn't get from scanning the cards alone
 *  — NOT an analytics dashboard, NOT a permanent explanatory subtitle. Only
 *  rendered once the current pass's insight has actually reached its delay
 *  offset (see useProgressiveExperience's `insightText`), so it appears
 *  partway through a hold — DISCOVERED, not shown from the pass's start.
 *  A single sentence, no eyebrow/header — the narration line already owns
 *  "what's happening"; this only ever adds NEW value on top of that. */
export default function EmergingInsight({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <div className="att-l2-insight" key={text}>
      {text}
    </div>
  );
}
