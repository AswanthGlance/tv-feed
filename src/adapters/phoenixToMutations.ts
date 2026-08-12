import type { PhoenixSpan } from '../types/phoenix';
import type { AgentMutation } from '../types/progressiveValue';

/* ─────────────────────────────────────────────────────────────────────────────
   PHOENIX-READY LEVEL 2 ADAPTER — NOT YET IMPLEMENTED.

   Level 2 is currently driven by a hand-authored fixture
   (src/data/level2TravelFixture.ts). This is the seam where real Phoenix
   trace spans will eventually be turned into the same AgentMutation[] shape,
   so Level2Experience / useProgressiveExperience never need to know whether
   they're replaying a fixture or a real trace.

   Deliberately not implemented yet: the real mapping (which tool outputs
   become ADD_ITEMS vs ENRICH_ITEMS, what "shortlisting" looks like against
   real span data, which span marks a PROMOTE_ITEM) needs to be derived from
   inspecting real, rich Phoenix traces first — see
   src/adapters/evidenceExtractor.ts and CLAUDE_HANDOFF.md §4.8-4.9 for the
   known real span/tool-output shapes this will eventually read from. Do not
   invent a mapping ahead of that inspection.
   ───────────────────────────────────────────────────────────────────────────── */
export function phoenixSpansToMutations(_spans: PhoenixSpan[]): AgentMutation[] {
  throw new Error(
    'phoenixSpansToMutations() is not implemented yet — Level 2 currently uses the ' +
      'presentation fixture in src/data/level2TravelFixture.ts. See this file\'s header comment.'
  );
}
