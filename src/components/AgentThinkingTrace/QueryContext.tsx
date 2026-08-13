/* Top-right context chip — reminds the viewer what the agent is responding
 * to. Deliberately low-emphasis: small text, translucent surface, no input
 * affordance. It is context, not the hero element. */
export default function QueryContext({ query }: { query?: string }) {
  if (!query) return null;
  return (
    <div className="att-query-context">
      <span className="att-query-context-prefix">You asked</span>
      {/* Clamp lives on the inner span: -webkit-line-clamp on the padded pill
          itself lets a clipped third line peek through the bottom padding. */}
      <div className="att-query-context-pill">
        <span className="att-query-context-text">{query}</span>
      </div>
    </div>
  );
}
