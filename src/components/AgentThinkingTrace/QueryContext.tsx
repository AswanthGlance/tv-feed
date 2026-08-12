/* Top-right context chip — reminds the viewer what the agent is responding
 * to. Deliberately low-emphasis: small text, translucent surface, no input
 * affordance. It is context, not the hero element. */
export default function QueryContext({ query }: { query?: string }) {
  if (!query) return null;
  return (
    <div className="att-query-context">
      <span className="att-query-context-prefix">You asked</span>
      <div className="att-query-context-pill">{query}</div>
    </div>
  );
}
