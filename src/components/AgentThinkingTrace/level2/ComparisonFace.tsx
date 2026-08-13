import type { ComparisonFocus, ComparisonValue } from '../../../level2/types/pass';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — ComparisonFace.

   The reusable comparison primitive. One candidate's face while the agent is
   inspecting ONE dimension across the whole set.

   Deliberately simpler than the identity face: a dimension label and a value,
   nothing else. No image, no description, no CTA, no address, no second
   metadata row. The comparison reads because five cards show the SAME field in
   the SAME place at the SAME size — anything extra breaks the horizontal scan
   that is the entire point.

   HIERARCHY

     DIMENSION LABEL   small, tracked out, muted     'PRICE'
     VALUE             large, tabular figures        '₹850 for two'
     LEADER            tiny accent chip, optional    'LOWEST'

   The entity's NAME is not rendered here. It lives on the tile above this
   plane and never moves, so identity persists across every dimension instead
   of being re-stated (and re-animated) on each turn.

   ARCHETYPE-NEUTRAL. It knows about a label and a value, not about venues,
   prices or venues' prices — the standalone `comparison` archetype can mount
   the same component against the same ComparisonFocus.
   ───────────────────────────────────────────────────────────────────────────── */

export interface ComparisonFaceModel {
  /** Uppercased at render time via CSS, so the underlying string stays
   *  readable in diagnostics. */
  label: string;
  /** Undefined when this candidate genuinely has no value for the dimension.
   *  Rendered as an em dash — never filled in, never guessed. */
  value?: ComparisonValue;
  /** Column treatment — a figure gets the large tabular headline, free text a
   *  smaller one, since 'Mon–Sat 11am–11pm' at 24px is a wall, not a value. */
  scale: ComparisonFocus['scale'];
  /** True only when the dimension's own leader resolution named this id. */
  isLeader?: boolean;
  /** The claim being made: 'Lowest', 'Top rated'. */
  leaderLabel?: string;
}

/** Projects a ComparisonFocus onto ONE subject. The sparse `values` map is the
 *  single source of truth for presence: no entry means no value. */
export function comparisonFaceFor(id: string, focus: ComparisonFocus): ComparisonFaceModel {
  const isLeader = !!focus.leaderIds?.includes(id);
  return {
    label: focus.label,
    value: focus.values[id],
    scale: focus.scale,
    isLeader,
    leaderLabel: isLeader ? focus.leaderLabel : undefined,
  };
}

/** Projects a ComparisonFocus onto a whole candidate set, in the caller's own
 *  order. The map is keyed by candidate id — the stable key the canvas already
 *  renders by — so a comparison can never re-associate a value with the wrong
 *  card. */
export function comparisonFacesFor(ids: string[], focus: ComparisonFocus): Map<string, ComparisonFaceModel> {
  return new Map(ids.map((id) => [id, comparisonFaceFor(id, focus)]));
}

export default function ComparisonFace({ face }: { face: ComparisonFaceModel }) {
  const missing = !face.value;
  return (
    <div className={`att-l2c att-l2c--${face.scale}${missing ? ' att-l2c--missing' : ''}`}>
      {/* Label and leader chip share one row so the VALUE always sits on the
          same baseline whether or not a card leads — a chip on its own line
          would push one card's value out of the row's scan line. */}
      <div className="att-l2c-head">
        <span className="att-l2c-label">{face.label}</span>
        {face.isLeader && face.leaderLabel && <span className="att-l2c-leader">{face.leaderLabel}</span>}
      </div>
      {/* An em dash is the honest rendering of an absent field. The candidate
          stays in the comparison — a missing price is information about the
          candidate, not grounds to hide it.

          The qualifier ('per person', 'for two') sits below the figure rather
          than beside it, so the figures themselves start at the same left edge
          AND end without being pushed off the card by a long unit. */}
      <div className="att-l2c-value">{face.value?.display ?? '—'}</div>
      {/* Always rendered, even when empty. The qualifier line is RESERVED so
          that a dimension which has one (price) and a dimension which does not
          (rating) put their figures on exactly the same baseline — otherwise
          the whole row nudges by a few pixels on every dimension change. */}
      <div className="att-l2c-note">{face.value?.note ?? ''}</div>
    </div>
  );
}
