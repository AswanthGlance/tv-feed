import type { PhoenixSpan } from '../types/phoenix';
import { safeSpanStart } from '../utils/timing';

export interface SpanNode {
  span: PhoenixSpan;
  children: SpanNode[];
}

/** Reconstructs parent/child structure from context.span_id / parent_id.
 *  Spans whose parent_id doesn't resolve to any span in the set (orphans,
 *  or the true root whose parent_id is null) become root nodes. Children
 *  are sorted chronologically, not by API return order. */
export function buildSpanTree(spans: PhoenixSpan[]): SpanNode[] {
  const byId = new Map<string, SpanNode>();
  for (const span of spans) {
    const id = span.context?.span_id;
    if (!id) continue;
    byId.set(id, { span, children: [] });
  }

  const roots: SpanNode[] = [];
  for (const node of byId.values()) {
    const parentId = node.span.parent_id;
    const parent = parentId ? byId.get(parentId) : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const byStart = (a: SpanNode, b: SpanNode) => safeSpanStart(a.span) - safeSpanStart(b.span);
  const sortRecursive = (nodes: SpanNode[]) => {
    nodes.sort(byStart);
    for (const n of nodes) sortRecursive(n.children);
  };
  sortRecursive(roots);

  return roots;
}

/** The primary root span for a trace: prefer an explicit harness.turn / CHAIN
 *  root (parent_id null); otherwise the earliest root by start time. Real
 *  traces in aitv-mewtwo-harness always have exactly one true root
 *  (harness.turn), but we don't assume that structurally. */
export function findPrimaryRoot(roots: SpanNode[]): SpanNode | undefined {
  if (roots.length === 0) return undefined;
  const chainRoot = roots.find((r) => r.span.span_kind === 'CHAIN');
  return chainRoot ?? roots[0];
}

export function flattenSpans(nodes: SpanNode[]): PhoenixSpan[] {
  const out: PhoenixSpan[] = [];
  const walk = (list: SpanNode[]) => {
    for (const n of list) {
      out.push(n.span);
      walk(n.children);
    }
  };
  walk(nodes);
  return out;
}

export function directChildren(node: SpanNode): PhoenixSpan[] {
  return node.children.map((c) => c.span);
}
