import { useMemo } from 'react';
import { comparisonFaceFor } from './ComparisonFace';
import ThinkingEntityTile, { type ThinkingTileFact, type ThinkingTileState } from './ThinkingEntityTile';
import type { EntityPreviewPayload } from '../../../level2/types/pass';
import type { ThinkingRendererProps } from '../../../level2/types/renderer';
import type { ProgressiveItem } from '../../../types/progressiveValue';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Candidate-ranking thinking canvas.

   ONE continuous canvas, folded from the runtime's item state rather than any
   single pass's payload — the same keyed tiles live across discovery,
   enrichment, comparison and narrowing, so the viewer watches one set evolve
   instead of four screens replacing each other.

   TWO THINGS THIS FILE GUARANTEES

   1. NOTHING EVER COLLIDES. Tile width is solved against the real canvas
      width for the current count and the current state mix, so a tile that
      grows takes width from the row and its neighbours genuinely move. Scale
      is only ever a small finishing transform on top of a real box — never a
      substitute for one, which is what causes overlap.

   2. NOTHING IS PROMOTED. The strongest state is a 1.10 lift, not a hero
      card. The final L1 result owns the answer's hierarchy.

   Emphasis comes from the CURRENT pass (`emphasisIds`) rather than from item
   state alone, which is what separates "being weighed right now" from "made
   the shortlist" (narrow) — the same tile, two different meanings, one pass
   apart.

   3. COMPARISON IS A MODE, NOT A SCREEN. A pass carrying `payload.comparison`
      puts the SAME tiles into comparison mode: every card holds its size and
      position, its image recedes, and only its fact plane turns over to show
      one dimension. Nothing is added, removed, remounted or re-fetched — which
      is why the viewer reads it as "the agent is now comparing these" rather
      than as a new view of a new set.
   ───────────────────────────────────────────────────────────────────────────── */

/** Canvas geometry: .att-l2-canvas is 1920 − 2×72 gutters. */
const CANVAS_W = 1776;
/** Comfortable reading width for a thinking tile on a 1080p TV. */
const TILE_MAX_W = 268;
const TILE_MIN_W = 168;
const GAP = 28; // brief: 24–32px minimum visible gap
/** Scale per state — matches the brief's controlled hierarchy exactly. */
const STATE_SCALE: Record<ThinkingTileState, number> = {
  neutral: 1,
  considering: 1.03,
  strong: 1.1,
  receding: 0.9,
};

function tileState(item: ProgressiveItem, emphasised: Set<string>, anyShortlisted: boolean): ThinkingTileState {
  const isShortlisted = item.state === 'shortlisted' || item.state === 'promoted';

  // Once a shortlist exists, the shortlist IS the hierarchy: members are
  // strong, everyone else recedes. Emphasis during the compare pass (before
  // any shortlist) is the lighter 'considering' step.
  if (anyShortlisted) return isShortlisted ? 'strong' : 'receding';
  if (item.state === 'negated') return 'receding';
  if (emphasised.has(item.id)) return 'considering';
  return 'neutral';
}

/** Solves a baseline tile width so `count` tiles plus gaps fit the canvas even
 *  after the largest state scale is applied. Weighted by each tile's scale so
 *  the row's real footprint is what gets fitted, not an average. */
function solveTileWidth(scales: number[]): number {
  const n = Math.max(scales.length, 1);
  const totalScale = scales.reduce((a, b) => a + b, 0) || n;
  const available = CANVAS_W - GAP * (n - 1);
  return Math.max(TILE_MIN_W, Math.min(TILE_MAX_W, Math.floor(available / totalScale)));
}

/** The horizontal space a scaled tile PAINTS beyond its layout box, per side.
 *
 *  A transform does not affect layout, so two neighbouring tiles at 1.10 each
 *  reach ~5% of their width into the gap between them and the 28px gap becomes
 *  about 3px — the row solves to the right total width while still looking
 *  collided. Handing that overhang back to the layout as margin is what makes
 *  the gap the solver computed the gap the viewer actually sees. It is
 *  negative for a receding tile, which is equally correct: a shrunken tile
 *  gives space back and the row recentres instead of leaving a hole where the
 *  outweighed candidate used to be. */
function tileOverhang(scale: number, width: number): number {
  return ((scale - 1) * width) / 2;
}

/** Trims a fact to the tile's width at a WORD boundary, with an ellipsis.
 *
 *  A hard character slice produced 'Starts 10:00 AM or 4:0' — a time cut
 *  mid-digit, which reads as a rendering bug rather than as a shortened
 *  string. Cutting at a space and marking the cut says "there is more here",
 *  which is both true and legible. */
function shortenFact(raw: string, limit = 24): string {
  const text = raw.trim();
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > limit * 0.5 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** Enrichment facts, in the order they matter for a ranking question. Only
 *  what the item actually carries — never a placeholder. */
function enrichedFacts(item: ProgressiveItem, hasBaseFact: boolean): ThinkingTileFact[] {
  const meta = item.metadata ?? {};
  const out: ThinkingTileFact[] = [];
  if (!hasBaseFact && meta.rating != null) out.push({ text: `${meta.rating}★`, isNew: true });
  if (meta.priceLevel) out.push({ text: String(meta.priceLevel), isNew: true });
  if (typeof meta.availability === 'string' && meta.availability) {
    // Hours strings can be long; the tile shows the first segment only.
    out.push({ text: shortenFact(meta.availability.split('·')[0]), isNew: true });
  }
  if (meta.travelTime) out.push({ text: String(meta.travelTime), isNew: true });
  return out.slice(0, 2);
}

export function CandidateCanvasThinking({ pass, runtime }: ThinkingRendererProps<EntityPreviewPayload>) {
  const items = useMemo(() => runtime.items.filter((it) => it.state !== 'removed'), [runtime.items]);
  const payload = pass.payload as EntityPreviewPayload | undefined;
  const emphasised = useMemo(() => new Set(payload?.emphasisIds ?? []), [payload]);
  const anyShortlisted = items.some((it) => it.state === 'shortlisted' || it.state === 'promoted');

  /* COMPARISON MODE. While a dimension is being inspected every tile keeps the
     SAME size — a comparison is a horizontal scan of one field, and scaling
     some cards up mid-scan would say "these ones are winning" a beat before
     the agent has decided that. The dimension gets the emphasis; the leader
     gets a hairline accent and a tiny label, nothing more. */
  const comparison = payload?.comparison;

  /* The turn has to play on the way OUT of comparison too — the tiles owe the
     viewer the same gesture when they hand their fact plane back to identity
     at "3 stand out". Reading the PREVIOUS revealed pass is what makes that
     possible without a ref or a remount: this render can tell "just left
     comparison" from "never entered it", and an ordinary discovery or
     enrichment pass still gets no turn at all. */
  const previousComparison = useMemo(() => {
    const previous = runtime.revealedPasses[runtime.revealedPasses.length - 2];
    return (previous?.payload as EntityPreviewPayload | undefined)?.comparison;
  }, [runtime.revealedPasses]);

  const comparisonTurn = comparison
    ? comparison.step
    : previousComparison
      ? previousComparison.stepCount // one past the last dimension: the return turn
      : undefined;

  const states = items.map((item) =>
    comparison ? ('neutral' as ThinkingTileState) : tileState(item, emphasised, anyShortlisted)
  );
  const tileWidth = solveTileWidth(states.map((s) => STATE_SCALE[s]));

  if (!items.length) {
    return (
      <div className="att-l2-skeleton-row">
        {[0, 1, 2].map((i) => (
          <div key={i} className="att-l2-skeleton-card" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    );
  }

  return (
    <div className="att-l2t-grid" style={{ '--l2t-gap': `${GAP}px` } as React.CSSProperties}>
      {items.map((item, i) => {
        const baseFact = item.metadata?.rating != null ? `${item.metadata.rating}★` : undefined;
        const state = states[i];
        return (
          <ThinkingEntityTile
            key={item.id}
            index={i}
            state={state}
            width={tileWidth}
            overhang={tileOverhang(STATE_SCALE[state], tileWidth)}
            // One scan per evaluating pass — the tile itself never remounts.
            // Each comparison dimension is its own pass id, so the border scan
            // runs once per dimension: "the agent is inspecting these again".
            scanKey={`${pass.id}-${state}`}
            comparison={comparison ? comparisonFaceFor(item.id, comparison) : undefined}
            comparisonTurn={comparisonTurn}
            tile={{
              id: item.id,
              title: item.title,
              image: item.image,
              placeId: typeof item.metadata?.placeId === 'string' ? item.metadata.placeId : undefined,
              fact: baseFact,
              // A receding candidate sheds its secondary metadata — it is no
              // longer information the user needs to weigh.
              enriched: state === 'receding' ? undefined : enrichedFacts(item, !!baseFact),
            }}
          />
        );
      })}
    </div>
  );
}
