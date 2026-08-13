/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — ThinkingEntityTile.

   The ONE reusable entity treatment for the thinking phase. Deliberately
   lightweight: image (when one genuinely exists), title, and the facts learned
   so far. No CTA, no description, no address, no recommendation copy — those
   belong to the final response, which is an existing L1 template, not a bigger
   version of this tile.

   STATE VOCABULARY — each state means one thing, and the motion says it:

     neutral      in play                          scale 1.00
     considering  being weighed right now          scale 1.03, border lifts
     strong       pulling ahead                    scale 1.10, border + glow
     receding     outweighed, still visible        scale 0.90, opacity down

   There is deliberately NO hero/promoted state. During thinking the agent is
   searching, learning, comparing and narrowing — the dramatic hierarchy
   belongs to the final L1 result, which owns the answer. A card that takes
   over the screen here would make the final response an anticlimax and would
   claim a decision the thinking phase has not made.

   Scale is applied to a wrapper that also owns real WIDTH, so a growing tile
   reflows its neighbours instead of painting over them — see the canvas.

   COMPARISON MODE is a fifth thing this tile can be doing, orthogonal to the
   four states above. It changes what the tile SHOWS, not what it means:

     the media frame stays exactly where it is and recedes (never re-cropped,
     never re-fetched, never unmounted — image identity has to be stable or
     the viewer loses track of which card is which)

     the title stays exactly where it is, at full strength

     the FACT PLANE — and only the fact plane — turns over, swapping the
     learned-metadata row for one dimension's label and value

   Both faces of the plane are mounted permanently and stacked in one grid
   cell, so the plane's height is the taller of the two and the card geometry
   never moves between modes. The turn is a shallow ~10° rotateY with the
   opacity crossfade timed to the midpoint, not a card flip: the point is
   "this surface is being turned over to show you something", not a reveal.
   ───────────────────────────────────────────────────────────────────────────── */

import ComparisonFace, { type ComparisonFaceModel } from './ComparisonFace';
import EnrichedImage from './EnrichedImage';

export type ThinkingTileState = 'neutral' | 'considering' | 'strong' | 'receding';

export interface ThinkingTileFact {
  /** Short label-free value: '4.8★', '₹450', 'Sat 7 PM'. */
  text: string;
  /** Facts that arrived at the enrichment pass animate in; the fact the tile
   *  was born with does not, so arrival and learning read differently. */
  isNew?: boolean;
}

export interface ThinkingTileModel {
  id: string;
  title: string;
  /** The trace's own image URL when it has one. Absent is the normal case —
   *  the resolver falls through to relevant imagery rather than leaving a
   *  hole, and the frame is reserved either way so nothing shifts on load. */
  image?: string;
  /** Google Places id, when the entity resolved to one — the highest tier of
   *  the image resolver and the only one that is the REAL venue's photo. */
  placeId?: string;
  /** The fact the tile carries from discovery — at most one. */
  fact?: string;
  /** Facts learned during enrichment. Rendered as a compact meta row. */
  enriched?: ThinkingTileFact[];
}

/** The single key fact a tile may carry at discovery, in priority order. */
export function tileFact(fields: { rating?: number; price?: string; travelTime?: string; distance?: string }): string | undefined {
  if (fields.rating != null) return `${fields.rating}★`;
  if (fields.price) return fields.price;
  if (fields.travelTime) return fields.travelTime;
  if (fields.distance) return fields.distance;
  return undefined;
}

export default function ThinkingEntityTile({
  tile,
  state = 'neutral',
  index = 0,
  width,
  overhang = 0,
  scanKey,
  comparison,
  comparisonTurn,
}: {
  tile: ThinkingTileModel;
  state?: ThinkingTileState;
  /** Stagger slot for the arrival reveal. */
  index?: number;
  /** Real rendered width in px, solved by the canvas so the row always fits
   *  1920 without clipping. */
  width?: number;
  /** Per-side px this tile's state scale paints beyond its layout box, given
   *  back to layout as margin so the gap the canvas solved is the gap that
   *  shows. Negative for a receding tile. See tileOverhang in the canvas. */
  overhang?: number;
  /** Changes once per evaluating pass. Remounting ONLY the 1-element border
   *  overlay replays the outline sweep without touching the card, its text or
   *  its image — which is how "the agent is working on these again" is said
   *  without anything reloading. */
  scanKey?: string;
  /** Present ⇒ the tile is in comparison mode showing this dimension.
   *  Absent ⇒ it shows its identity face. Both faces stay mounted either way. */
  comparison?: ComparisonFaceModel;
  /** Monotonic turn counter supplied by the canvas — it increments on every
   *  face change, INCLUDING the return to the identity face. Its PARITY
   *  alternates the plane between two identical keyframe names, which is the
   *  only way to restart a CSS animation on an element that must persist
   *  (remounting the plane to replay it would be exactly the reload the whole
   *  design is avoiding). Undefined ⇒ no turn: the ordinary discovery and
   *  enrichment passes must not animate the plane. */
  comparisonTurn?: number;
}) {
  const comparing = !!comparison;
  const turn = comparisonTurn == null ? undefined : comparisonTurn % 2 === 0 ? 'a' : 'b';

  return (
    <div
      className={`att-l2t att-l2t--${state}${comparing ? ' att-l2t--comparing' : ''}${
        comparison?.isLeader ? ' att-l2t--leader' : ''
      }`}
      style={
        {
          '--i': index,
          ...(width ? { width: `${width}px` } : {}),
          marginInline: `${overhang}px`,
        } as React.CSSProperties
      }
    >
      {/* The outline sweep. Its own element so it can replay per evaluating
          pass (via scanKey) and otherwise sit inert — nothing glows forever. */}
      <span className="att-l2t-border" aria-hidden key={scanKey ?? 'border'} />

      {/* The media frame is ALWAYS rendered once a tile has any image source,
          and its aspect ratio is fixed, so nothing shifts when the photo
          finally arrives. The resolver is the project's existing four-tier
          integration — Google Places -> harness photo -> Pexels -> local — so
          a candidate always has relevant imagery and never a broken glyph. */}
      <div className="att-l2t-media">
        <EnrichedImage
          itemId={tile.id}
          itemTitle={tile.title}
          placeId={tile.placeId}
          fallbackSrc={tile.image}
        />
      </div>

      <div className="att-l2t-body">
        {/* Identity. Outside the turning plane on purpose — the candidate's
            name must stay legible and still through every dimension, so the
            viewer never has to re-find which card they were reading. In
            comparison mode CSS clamps it to one line so that every card's
            value sits on the SAME baseline and the row can be scanned
            horizontally, which is the whole job of the comparison. */}
        <div className="att-l2t-title">{tile.title}</div>

        {/* The fact plane. Both faces live in one grid cell (stacked, so the
            plane is as tall as the taller face and the card never resizes
            between modes) and both stay mounted — the swap is opacity, timed
            to the midpoint of the turn. */}
        <div className={`att-l2t-plane${turn ? ` att-l2t-plane--turn-${turn}` : ''}`}>
          <div className="att-l2t-face att-l2t-face--identity" aria-hidden={comparing}>
            {/* Boolean-coerced: `tile.enriched?.length` alone is 0 when the
                array is empty, and React renders that 0 as literal text. */}
            {!!(tile.fact || tile.enriched?.length) && (
              <div className="att-l2t-meta">
                {tile.fact && <span className="att-l2t-fact">{tile.fact}</span>}
                {tile.enriched?.map((f, i) => (
                  <span
                    key={i}
                    className={`att-l2t-fact${f.isNew ? ' att-l2t-fact--new' : ''}`}
                    style={{ '--fi': i } as React.CSSProperties}
                  >
                    {f.text}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="att-l2t-face att-l2t-face--comparison" aria-hidden={!comparing}>
            {comparison && <ComparisonFace face={comparison} />}
          </div>
        </div>
      </div>
    </div>
  );
}
