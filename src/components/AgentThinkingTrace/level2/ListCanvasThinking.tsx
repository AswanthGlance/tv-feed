import { useLayoutEffect, useMemo, useRef } from 'react';
import ThinkingEntityTile from './ThinkingEntityTile';
import type { EntityPreviewPayload } from '../../../level2/types/pass';
import type { ThinkingRendererProps } from '../../../level2/types/renderer';
import type { ProgressiveItem } from '../../../types/progressiveValue';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — List-without-winner thinking canvas.

   The list archetype's answer is A SET TO EXPLORE, so this canvas does the
   opposite of the candidate canvas: items ACCUMULATE and stay equal. There is
   no considering/strong/receding hierarchy here, no shortlist, no promotion —
   ten equal tiles in a balanced grid, filling out.

   THREE GUARANTEES

   1. EVERY RESOLVED ITEM RENDERS. The plan builder derives the narration
      count and this canvas's items from the same array (see listPlan.ts); this
      file renders runtime.items in full, never a slice. If the agent said 10,
      ten tiles are here.

   2. NOTHING REMOUNTS ACROSS PASSES. The same keyed tiles persist from the
      "found" beat through theming to consolidation — grouping reorders the
      SAME children inside the SAME parent (React keeps the instances), and a
      FLIP pass turns the reflow into motion instead of a jump.

   3. THE GRID IS BALANCED, NEVER RAGGED. 10 → 5+5, 8 → 4+4, 6 → 3+3,
      5 → 3+2. Row breaks are explicit elements, not accidental flex-wrap.

   THEMED MODE (a pass carrying `payload.groups`): the same tiles regroup
   under the labels the items' own data carries. Tiles compact (their media
   collapses via CSS transition — the <img> stays mounted, nothing refetches)
   so up to three labelled rows fit the stage. Leaving nothing behind and
   eliminating nothing is the point: this reads as "organizing", never
   "narrowing".
   ───────────────────────────────────────────────────────────────────────────── */

/** Canvas geometry: .att-l2-canvas is 1920 − 2×72 gutters. */
const CANVAS_W = 1776;
const GAP = 24;
/** One-row sets breathe at candidate-canvas width; two-row sets compact so
 *  both rows fit the thinking stage (~436px tall). */
const TILE_MAX_W_SINGLE_ROW = 268;
const TILE_MAX_W_TWO_ROW = 208;
const TILE_MIN_W = 156;
/** Grouped mode is text-first (media collapsed), so tiles narrow further. */
const TILE_W_GROUPED = 200;

/** 5+5 / 4+4 / 3+3 / 3+2 — two centred rows once the set outgrows one row. */
export function balancedRows(n: number): number[] {
  if (n <= 0) return [];
  if (n <= 4) return [n];
  const rows = Math.max(2, Math.ceil(n / 5));
  const base = Math.floor(n / rows);
  const rem = n % rows;
  return Array.from({ length: rows }, (_, i) => base + (i < rem ? 1 : 0));
}

function solveTileWidth(rowCounts: number[]): number {
  const maxRow = Math.max(...rowCounts, 1);
  const cap = rowCounts.length > 1 ? TILE_MAX_W_TWO_ROW : TILE_MAX_W_SINGLE_ROW;
  const available = CANVAS_W - GAP * (maxRow - 1);
  return Math.max(TILE_MIN_W, Math.min(cap, Math.floor(available / maxRow)));
}

/** The one concise supporting signal a list tile shows: a real trend signal
 *  first ("Rising", "Popular" — see listPlan.ts trendSignalFor), else the
 *  strongest single fact the item carries. Never a placeholder. */
function listFact(item: ProgressiveItem): string | undefined {
  const meta = item.metadata ?? {};
  if (typeof meta.signal === 'string' && meta.signal) return meta.signal;
  if (meta.rating != null) return `${meta.rating}★`;
  if (typeof meta.priceLevel === 'string' && meta.priceLevel) return meta.priceLevel;
  if (typeof meta.availability === 'string' && meta.availability) return meta.availability.split('·')[0].trim().slice(0, 22);
  return undefined;
}

export function ListCanvasThinking({ pass, runtime }: ThinkingRendererProps<EntityPreviewPayload>) {
  const items = useMemo(() => runtime.items.filter((it) => it.state !== 'removed'), [runtime.items]);
  const payload = pass.payload as EntityPreviewPayload | undefined;
  const groups = payload?.groups;

  /* ── FLIP: turn the regroup reflow into motion ──────────────────────────
     Positions are captured on every commit; when the layout signature changes
     (flat → grouped, or the row split changes as items accumulate) each moved
     wrapper is inverted to its old position and released. The wrapper — not
     the tile — carries the transform, so the tile's own entrance/stagger
     animations are untouched. */
  const wrapRefs = useRef(new Map<string, HTMLDivElement>());
  const prevRects = useRef(new Map<string, DOMRect>());
  const layoutKey = groups
    ? `grouped:${groups.map((g) => `${g.label}=${g.ids.length}`).join('|')}`
    : `flat:${balancedRows(items.length).join('-')}`;
  const prevLayoutKey = useRef(layoutKey);

  useLayoutEffect(() => {
    const layoutChanged = prevLayoutKey.current !== layoutKey;
    prevLayoutKey.current = layoutKey;

    const moves: Array<{ el: HTMLDivElement; dx: number; dy: number }> = [];
    for (const [id, el] of wrapRefs.current) {
      const next = el.getBoundingClientRect();
      const prev = prevRects.current.get(id);
      if (layoutChanged && prev) {
        const dx = prev.left - next.left;
        const dy = prev.top - next.top;
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) moves.push({ el, dx, dy });
      }
      prevRects.current.set(id, next);
    }
    if (!moves.length) return;

    for (const { el, dx, dy } of moves) {
      el.style.transition = 'none';
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    }
    // Two frames: let the inverted transform paint before releasing it.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        for (const { el } of moves) {
          el.style.transition = 'transform 640ms cubic-bezier(0.22, 1, 0.36, 1)';
          el.style.transform = '';
        }
      })
    );
  }, [layoutKey, items.length]);

  if (!items.length) {
    return (
      <div className="att-l2-skeleton-row">
        {[0, 1, 2].map((i) => (
          <div key={i} className="att-l2-skeleton-card" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    );
  }

  const byId = new Map(items.map((it) => [it.id, it]));

  const tile = (item: ProgressiveItem, index: number, width: number) => (
    <div
      key={item.id}
      className="att-l2list-slot"
      ref={(el) => {
        if (el) wrapRefs.current.set(item.id, el);
        else wrapRefs.current.delete(item.id);
      }}
    >
      <ThinkingEntityTile
        index={index}
        state="neutral"
        width={width}
        tile={{
          id: item.id,
          title: item.title,
          image: item.image,
          placeId: typeof item.metadata?.placeId === 'string' ? item.metadata.placeId : undefined,
          fact: listFact(item),
        }}
      />
    </div>
  );

  /* ── Themed mode: label rows, same tiles, media compacted ─────────────── */
  if (groups?.length) {
    // ONE parent for labels and tiles alike — React keeps every tile instance
    // (keys match inside the same parent), so nothing remounts or refetches.
    const children: React.ReactNode[] = [];
    let index = 0;
    for (const group of groups) {
      children.push(
        <div key={`label-${group.label}`} className="att-l2list-theme">
          {group.label}
        </div>
      );
      for (const id of group.ids) {
        const item = byId.get(id);
        if (item) children.push(tile(item, index++, TILE_W_GROUPED));
      }
    }
    // Items the groups did not claim (defensive — the plan builder requires
    // full coverage) still render rather than silently disappearing.
    for (const item of items) {
      if (!groups.some((g) => g.ids.includes(item.id))) children.push(tile(item, index++, TILE_W_GROUPED));
    }
    return <div className="att-l2list att-l2list--grouped" style={{ '--l2list-gap': `${GAP}px` } as React.CSSProperties}>{children}</div>;
  }

  /* ── Flat mode: the balanced accumulating grid ────────────────────────── */
  const rowCounts = balancedRows(items.length);
  const width = solveTileWidth(rowCounts);

  const children: React.ReactNode[] = [];
  let cursor = 0;
  rowCounts.forEach((count, row) => {
    if (row > 0) children.push(<div key={`break-${row}`} className="att-l2list-break" aria-hidden />);
    for (let i = 0; i < count; i++) {
      const item = items[cursor];
      children.push(tile(item, cursor, width));
      cursor += 1;
    }
  });

  return (
    <div
      className={`att-l2list${rowCounts.length > 1 ? ' att-l2list--tworow' : ''}`}
      style={{ '--l2list-gap': `${GAP}px` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
