/* LEVEL 3 — Collaborative Agent. Placeholder only, per explicit instruction
 * not to build real functionality yet — communicates the future direction
 * (the user can influence intermediate results while the agent still
 * works) without implementing any interaction. Reuses the same three
 * travel candidates as the Level 2 fixture purely as an illustrative
 * mini-visual, not a functioning selection UI. */
const PREVIEW_CANDIDATES = ['Coorg', 'Chikmagalur', 'Kabini'];

export default function Level3Placeholder() {
  return (
    <div className="att-l3-placeholder">
      <div className="att-l3-eyebrow">LEVEL 3 · COMING NEXT</div>
      <div className="att-l3-title">Collaborative Agent</div>
      <div className="att-l3-desc">Influence the journey while the agent is still working.</div>

      <div className="att-l3-mini-visual">
        <div className="att-l3-mini-chips">
          {PREVIEW_CANDIDATES.map((c) => (
            <span key={c} className="att-l3-mini-chip">{c}</span>
          ))}
        </div>
        <div className="att-l3-mini-feedback">
          <span className="att-l3-mini-feedback-label">Focus</span>
          <span className="att-l3-mini-feedback-option att-l3-mini-feedback-option--negative">Not Coorg</span>
          <span className="att-l3-mini-feedback-option att-l3-mini-feedback-option--positive">More like this</span>
        </div>
        <div className="att-l3-mini-adapt">Agent adapts…</div>
      </div>
    </div>
  );
}
