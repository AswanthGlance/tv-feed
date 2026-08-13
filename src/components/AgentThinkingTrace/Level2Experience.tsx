import { useEffect, useMemo, useRef, useState } from 'react';
import AgentMascot from '../Shared/AgentMascot';
import QueryContext from './QueryContext';
import AgentNarrationLine from './AgentNarrationLine';
import Level2CandidateCard from './Level2CandidateCard';
import EmergingInsight from './EmergingInsight';
import { deriveCardImportance, extractRequestedFields } from '../../adapters/cardImportance';
import {
  ANALYSIS_GAP_BY_COUNT,
  CARD_STATE_WIDTH_WEIGHT,
  DEPRIORITIZED_WIDTH_WEIGHT,
  PROMOTED_EXTRA_GUTTER,
  TIER_MAX_WIDTH_BY_COUNT,
} from '../../adapters/level2Tokens';
import { useWinnerPromotionFlip } from './useWinnerPromotionFlip';
import type { ProgressiveExperienceState } from '../../hooks/useProgressiveExperience';
import type { ExperiencePhase } from '../../hooks/useExperiencePhase';
import type { AgentNarration } from '../../types/experiencePass';
import type { Level2DataSource } from '../../hooks/useLevel2TraceSource';
import type { ProgressiveItem } from '../../types/progressiveValue';

/** Suggested next queries for the bottom prompt row — only shown once the
 *  journey has crystallized (matches the real L1 templates' own bottom
 *  prompt row, e.g. TravelL1's FOLLOW_UPS). Chrome text, not wired to any
 *  navigation. Deliberately domain-neutral (no destination name baked in):
 *  this shell now renders whatever real trace was selected — see
 *  useLevel2TraceSource — which can be any domain (travel, food, local
 *  experiences, ...), not always a trip. */
const LEVEL2_FOLLOW_UPS = [
  'Tell me more about this',
  'Find similar options nearby',
  'What should I know before I go',
  'Compare the top two',
];

const DATA_SOURCE_TAG: Record<Level2DataSource, string> = {
  'phoenix-live': 'Level 2 — real Agent Harness trace, replayed from Phoenix',
  'phoenix-cached': 'Level 2 — cached real Agent Harness trace (Phoenix unavailable live)',
  fixture: 'Level 2 shell — presentation fixture, not live Phoenix output',
};

/** Small set of consumer-facing completion lines so every resolved journey
 *  doesn't read "<X> looks like your best fit" verbatim — picked
 *  deterministically off the winner's id (stable across re-renders, still
 *  varies scenario to scenario) rather than randomly, so dev/replay stays
 *  reproducible. Never claims a reason beyond the title itself — the real
 *  reason (if any) already lives in the card's own judgment/evidence. */
const RESOLVE_TEMPLATES = [
  (title: string) => `${title} looks like your best fit`,
  (title: string) => `${title} looks like your strongest option`,
  (title: string) => `I'd start with ${title}`,
  (title: string) => `${title} stands out for what you're looking for`,
];

function resolveLine(id: string, title: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return RESOLVE_TEMPLATES[hash % RESOLVE_TEMPLATES.length](title);
}

/** Honest completion copy for a trace that finished (phase reached 'result')
 *  without ever deriving a single winner — either no structured final
 *  response existed, or one existed but had no distinguishing badge/rating
 *  signal (see phoenixToMutations.ts's documented anti-hallucination skip).
 *  Never claims a single pick that doesn't exist; picked deterministically
 *  off the query text so replay stays reproducible, same pattern as
 *  resolveLine above. */
const NO_WINNER_TEMPLATES = [
  (n: number) => `Here are the ${n} strongest options I found`,
  () => 'A few strong options came out close together',
  () => 'These are the closest matches for what you asked',
  (n: number) => `${n} options stood out — take a look`,
];

function noWinnerLine(seed: string, count: number): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return NO_WINNER_TEMPLATES[hash % NO_WINNER_TEMPLATES.length](count);
}

/* ─────────────────────────────────────────────────────────────────────────────
   ADAPTIVE ANALYSIS LAYOUT — every candidate must fit inside the 1920×1080
   canvas with no cropping and no vertical scrolling (hard requirement).
   Rather than a handful of fixed breakpoints, this solves directly for a
   baseline (weight-1) card width that guarantees `count` cards + gaps fit
   the real available canvas width, capped at a "tier" ceiling so a 1-2
   candidate pool doesn't render absurdly oversized cards. Card HEIGHT is no
   longer computed here at all — see Level2CandidateCard, which derives it
   intrinsically from the fixed-aspect media frame plus its own (line-
   clamped, budgeted) content, so a card's height genuinely reflects what it
   renders instead of a single guessed constant. ─────────────────────────── */
const CANVAS_W = 1776; // .att-l2-canvas: 1920 - 72*2

export function getAnalysisLayout(count: number) {
  const n = Math.max(count, 1);
  const gap = ANALYSIS_GAP_BY_COUNT(n);
  const tierMaxWidth = TIER_MAX_WIDTH_BY_COUNT(n);
  const fitWidth = (CANVAS_W - gap * (n - 1)) / n;
  const width = Math.max(96, Math.min(tierMaxWidth, Math.floor(fitWidth)));
  return { width, gap, compact: n >= 7 };
}

/* ── PER-CARD WIDTH — the fix for the analysis-grid collision bug. Every
   candidate state maps to a REAL width weight (see level2Tokens.ts), not a
   `scale` transform layered on top of a shared fixed box. Because the width
   is a real box property, flexbox reflows every neighbor automatically when
   one card grows or shrinks — a promoted card visibly makes room for itself
   instead of just painting over whoever was already there. The weighted sum
   is solved against the SAME canvas-fit width getAnalysisLayout() already
   guarantees, so "every candidate fits, no cropping" still holds at any mix
   of states, not just the uniform case. ─────────────────────────────────── */
export function getCardWidths(
  items: Array<{ id: string; state: ProgressiveItem['state']; deprioritized?: boolean }>,
  layout: { width: number; gap: number }
): Map<string, number> {
  const n = Math.max(items.length, 1);
  const weights = items.map((it) =>
    it.deprioritized ? DEPRIORITIZED_WIDTH_WEIGHT : (CARD_STATE_WIDTH_WEIGHT[it.state] ?? 1)
  );
  const totalWeight = weights.reduce((a, b) => a + b, 0) || n;
  const rawUnit = (CANVAS_W - layout.gap * (n - 1)) / totalWeight;
  const unit = Math.min(rawUnit, layout.width); // never let a baseline card exceed its tier ceiling
  const widths = new Map<string, number>();
  items.forEach((it, i) => widths.set(it.id, Math.max(72, Math.round(weights[i] * unit))));
  return widths;
}

/** Extra per-side margin for shortlisted/promoted cards, added on top of the
 *  row's base `gap` so a growing card gets visibly more breathing room from
 *  its neighbors, not just a bigger box pressed right up against them. */
/** Only `promoted` gets extra breathing room from its neighbors — same
 *  "no size/prominence variation before a strongest option is picked"
 *  principle as CARD_STATE_WIDTH_WEIGHT. */
export function getCardExtraGutter(state: ProgressiveItem['state']): number {
  if (state === 'promoted') return PROMOTED_EXTRA_GUTTER;
  return 0;
}

const RAIL_CARD_W = 390; // matches .att-l2-card--crystallized
const RAIL_CARD_H = 560; // matches .att-l2-card--crystallized
const RAIL_GAP = 24;
const RAIL_STEP = RAIL_CARD_W + RAIL_GAP;
const RAIL_VISIBLE_SLOTS = Math.max(1, Math.floor((CANVAS_W + RAIL_GAP) / RAIL_STEP));

/** LEVEL 2 — Progressive Value shell. The evolving candidate canvas is the
 *  hero; the agent-status area (mascot + one narration line) is
 *  deliberately small and secondary.
 *
 *  CRITICAL: this never swaps to a different component tree for "the
 *  result." There is no separate thinking-layer/result-layer pair here
 *  (unlike Level 1, which is untouched) — the SAME grid of
 *  Level2CandidateCards renders throughout the whole journey, same keyed
 *  DOM nodes. Once it crystallizes (phase === 'result'), the SAME container
 *  switches from a wrapped analysis grid to a single-row horizontal rail
 *  (winner reordered to position #1 — see `resultOrder` below), narration
 *  gets a distinct resolve treatment, and the promoted card gains a CTA row.
 *  The viewer should never perceive "leaving thinking and opening a result
 *  screen" — the working answer IS the final answer, just settled and
 *  reorganized into what the user should actually consume.
 *
 *  Driven entirely by useProgressiveExperience(journey) — see
 *  src/data/level2TravelFixture.ts for the (explicitly labelled)
 *  presentation-fixture pass timeline this renders, or
 *  src/hooks/useLevel2TraceSource.ts for the real-Phoenix-trace path. */
export default function Level2Experience({
  engine,
  phase,
  query,
  dataSource,
  onDevImageTierResolved,
}: {
  engine: ProgressiveExperienceState;
  phase: ExperiencePhase;
  query: string;
  dataSource: Level2DataSource;
  /** Dev-diagnostics hook (see DevInspector's Level2 tab): reports which
   *  image-fallback tier rendered for whichever card currently matters most
   *  (the promoted/resolved card, or the emerging pick during analysis).
   *  Undefined outside dev mode costs nothing extra. */
  onDevImageTierResolved?: (tier: number) => void;
}) {
  const promoted = engine.items.find((it) => it.id === engine.promotedId);
  // Guards against a truncated/edited journey that reaches isComplete
  // without ever emitting PROMOTE_ITEM — the narration/CTA crystallization
  // simply never triggers rather than referencing a candidate that doesn't
  // exist.
  const isResolved = phase === 'result' && !!promoted;

  // ── analysisOrder vs resultOrder ────────────────────────────────────────
  // During analysis: real discovery/trace order, negated items stay visible
  // (dimmed) until their own REMOVE_ITEMS mutation actually recedes them —
  // "show negation before removal" without keeping removed ghosts around
  // indefinitely. After resolve: a DERIVED presentation order — winner
  // first, everyone else keeps their relative analysis order (the best
  // available real signal short of an explicit rank Phoenix doesn't emit —
  // see LEVEL2_INSTRUMENTATION_GAPS.md #5). Never mutates engine.items
  // itself, never invents a ranking beyond "winner, then the rest as-is".
  const analysisOrder = engine.items.filter((it) => it.state !== 'removed');

  // Settled without a winner: the pass clock finished (phase === 'result')
  // but no PROMOTE_ITEM was ever derivable — either no structured
  // <place_card> final response existed at all, or one existed but had no
  // distinguishing badge/rating signal (both real, documented
  // anti-hallucination dead-ends in phoenixToMutations.ts). Previously the
  // canvas just stayed in analysis-grid mode forever in this case — the
  // mascot would go idle (driven by raw engine.isComplete) while the grid
  // and narration still read as "still working," which is exactly the
  // "looks stuck / looks finished but isn't" complaint. This gives it the
  // same crystallized-rail settle as a real resolution, just honest about
  // there being no single pick — every card stays at 'standard' importance,
  // no TOP PICK badge, order never reshuffled beyond real analysis order.
  const isSettledWithoutWinner = phase === 'result' && !promoted && analysisOrder.length > 0;
  const isSettled = isResolved || isSettledWithoutWinner;

  // While the pass clock is still mid-flight but has already entered the
  // RESOLVE pass, its own narration text ('Here is what I found' / 'Building
  // your recommendation around X' — phoenixToMutations.ts) reads as done
  // well before the grid actually crystallizes (that only happens once
  // useExperiencePhase's whole loading->resolving->result sequence
  // finishes). Suppressing it until isSettled keeps the copy and the visual
  // settle changing together instead of narration-first-then-settle-later.
  const narration: AgentNarration | undefined = isResolved
    ? { type: 'resolve', text: resolveLine(promoted!.id, promoted!.title) }
    : isSettledWithoutWinner
      ? { type: 'resolve', text: noWinnerLine(query || 'no-query', analysisOrder.length) }
      : engine.currentPass?.stage === 'resolve'
        ? { type: 'compare', text: 'Finalizing the shortlist' }
        : engine.narration;

  // Query-requested attribute priority (see cardImportance.ts) — computed
  // once per query, not per card/render.
  const requestedFields = useMemo(() => extractRequestedFields(query), [query]);

  const resultOrder = isResolved
    ? [promoted!, ...analysisOrder.filter((it) => it.id !== promoted!.id)]
    : analysisOrder;

  const layout = getAnalysisLayout(analysisOrder.length);
  // Per-card widths reflow with every state change (see getCardWidths) —
  // recomputed each render from the current resultOrder, cheap for the
  // candidate counts this ever runs at (≤10).
  const cardWidths = useMemo(
    () => getCardWidths(resultOrder.map((it) => ({ id: it.id, state: it.state, deprioritized: !!it.metadata?.deprioritized })), layout),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resultOrder, layout.width, layout.gap]
  );

  // ── Rail focus/navigation — active once settled (winner or not) ─────────
  const [focusedIndex, setFocusedIndex] = useState(0);
  useEffect(() => {
    if (isSettled) setFocusedIndex(0);
  }, [isSettled, engine.promotedId]);

  useEffect(() => {
    if (!isSettled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setFocusedIndex((i) => Math.min(i + 1, resultOrder.length - 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setFocusedIndex((i) => Math.max(i - 1, 0));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSettled, resultOrder.length]);

  const railShiftIndex = Math.max(0, Math.min(focusedIndex - RAIL_VISIBLE_SLOTS + 1, Math.max(resultOrder.length - RAIL_VISIBLE_SLOTS, 0)));

  const gridStyle = isSettled
    ? { transform: `translateX(${-railShiftIndex * RAIL_STEP}px)` }
    : ({ '--l2-gap': `${layout.gap}px` } as React.CSSProperties);

  // ── Winner promotion flight — the promoted card visibly flies to rail
  // position #1 instead of an instant reorder/layout-mode snap. Only fires
  // for a real winner (isResolved); isSettledWithoutWinner has no single
  // card to fly, so cards there just settle via the grid's existing CSS
  // transitions.
  const canvasRef = useRef<HTMLDivElement>(null);
  const flyLayerRef = useRef<HTMLDivElement>(null);
  const { registerCardNode } = useWinnerPromotionFlip({
    promotedId: engine.promotedId,
    isResolved,
    railCardWidth: RAIL_CARD_W,
    railCardHeight: RAIL_CARD_H,
    canvasRef,
    flyLayerRef,
  });

  return (
    <div className="att-l2-layer">
      <div className="att-header">
        <img
          className="att-logo"
          src="/glance-logo.png"
          alt="glance"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      </div>
      <QueryContext query={query} />

      <div className="att-l2-status-row">
        <div className="att-l2-mascot-wrap">
          <AgentMascot agentMode={engine.isComplete ? 'idle' : 'thinking'} size={36} />
        </div>
        <AgentNarrationLine narration={narration} isComplete={isSettled} />
      </div>

      <div className="att-l2-canvas" ref={canvasRef}>
        {engine.items.length === 0 ? (
          <div className="att-l2-skeleton-row">
            {[0, 1, 2].map((i) => (
              <div key={i} className="att-l2-skeleton-card" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        ) : (
          <div className={`att-l2-grid${isSettled ? ' att-l2-grid--resolved' : ''}`} style={gridStyle}>
            {resultOrder.map((item, i) => {
              const importance = deriveCardImportance({
                isResolvedPhase: isSettled,
                isPromotedItem: item.id === engine.promotedId,
                itemState: item.state,
                isCompactLayout: layout.compact,
              });
              // The dev-diagnostics image-tier hook only follows whichever
              // card currently matters most: the resolved winner, or (before
              // resolve) the emerging pick — never every card at once.
              const isDevTierTarget = isResolved ? item.id === engine.promotedId : item.state === 'promoted';
              // Rank-based recession for rail peers — ONLY when a real
              // winner exists (never during the honest isSettledWithoutWinner
              // settle, which has no real signal to base a rank on). `i` is
              // the card's position in resultOrder, which puts the winner at
              // 0 and everyone else in the agent's own real response order
              // (see resultOrder's comment above) — the first alternate
              // (i===1) stays full-weight, the next recedes a notch, anyone
              // further out recedes more.
              const railTier: 'secondary' | 'tertiary' | undefined = !isResolved || item.id === engine.promotedId
                ? undefined
                : i === 1
                  ? undefined
                  : i === 2
                    ? 'secondary'
                    : 'tertiary';
              return (
                <Level2CandidateCard
                  key={item.id}
                  item={item}
                  importance={importance}
                  crystallized={isSettled}
                  focused={isSettled && i === focusedIndex}
                  requestedFields={requestedFields}
                  cardWidth={isSettled ? undefined : cardWidths.get(item.id)}
                  extraGutter={isSettled ? 0 : getCardExtraGutter(item.state)}
                  railTier={railTier}
                  onImageTierResolved={isDevTierTarget ? onDevImageTierResolved : undefined}
                  cardRef={(el) => registerCardNode(item.id, el)}
                />
              );
            })}
          </div>
        )}
        <div ref={flyLayerRef} className="att-l2-fly-layer" aria-hidden />

        <EmergingInsight text={engine.insightText} />
      </div>

      {isSettled && (
        <div className="att-result-prompt-row att-l2-prompt-row-in">
          <div className="att-result-prompt-icons">
            <div className="att-result-prompt-icon-btn">
              <img src="/images/l1/keyboard.svg" alt="" />
            </div>
            <div className="att-result-prompt-icon-btn">
              <img src="/images/l1/mic.svg" alt="" />
            </div>
          </div>
          {LEVEL2_FOLLOW_UPS.map((prompt, i) => (
            <div className="att-result-prompt-pill" key={i}>{prompt}</div>
          ))}
        </div>
      )}

      <div className="att-l2-fixture-tag">{DATA_SOURCE_TAG[dataSource]}</div>
    </div>
  );
}
