import type { ThinkingPass } from '../../level2/types/pass';
import type { EntityPreviewPayload } from '../../level2/types/pass';

/* The kicker line above the narration — the checkpoint-2 pattern where each
 * beat names the TOOL ("Web sweep", "Location mapping") and the typed line
 * below says what the agent is doing with it. Real passes carry no raw tool
 * name by design (pass.ts forbids it), so the label is derived from what the
 * pass demonstrably did: its valueType, its canvas mutations, then narration
 * keywords as the last resort. */

export function deriveToolLabel(pass: ThinkingPass): string {
  const n = pass.narration.toLowerCase();

  if (pass.valueType === 'entity_preview') {
    const canvas = (pass.payload as EntityPreviewPayload | undefined)?.canvas ?? [];
    if (canvas.some((m) => m.type === 'SHORTLIST_ITEMS' || m.type === 'PROMOTE_ITEM')) return 'Comparing options';
    if (canvas.some((m) => m.type === 'NEGATE_ITEMS' || m.type === 'REMOVE_ITEMS')) return 'Narrowing down';
    return 'Web search';
  }
  if (pass.valueType === 'availability') return 'Availability check';
  if (pass.valueType === 'count') return 'Filtering results';
  if (pass.valueType === 'route') return 'Route mapping';
  if (pass.valueType === 'comparison_signal') return 'Comparing options';
  if (pass.valueType === 'timeline') return 'Timeline scan';
  if (pass.valueType === 'cluster') return 'Grouping results';

  if (/\bfound|search|fetch|scan|sweep|looking\b/.test(n)) return 'Web search';
  if (/\bopen|tonight|availab|booked\b/.test(n)) return 'Availability check';
  if (/\brating|review|price|cost|budget\b/.test(n)) return 'Rating & price scan';
  if (/\blocation|near|distance|route|map\b/.test(n)) return 'Location mapping';
  if (/\bcompar|stand out|shortlist|versus\b/.test(n)) return 'Comparing options';

  return 'Analyzing';
}
