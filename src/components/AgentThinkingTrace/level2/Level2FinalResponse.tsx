import { useMemo } from 'react';
import {
  CardsScenario,
  CardsTabsScenario,
  TextOnlyScenario,
  TextCarouselScenario,
  L1ScenarioStyles,
} from '../../L1/L1Scenarios';
import { adaptFinalResponseToL1, type AdaptedL1Response } from '../../../level2/finalResponse/adaptToL1';
import type { FinalResponseModel } from '../../../level2/types/finalResponse';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Final response = an existing L1 response template.

   This wrapper is deliberately thin: adapt the FinalResponseModel to the
   matching /l1-scenarios family and mount THAT component, full-stage, exactly
   as it renders on /l1-scenarios (same absolute 1920×1080 coordinates, same
   intro sequence: mascot -> agent line typing -> structure -> content ->
   prompts -> interactive). No Level 2-specific final layout exists.

   The wrapper fills the whole stage because the L1 components position
   themselves absolutely against the full canvas (mascot at 156/72, rail from
   the left edge, prompt row at 944).
   ───────────────────────────────────────────────────────────────────────────── */

export function resolveAdaptedResponse(response: FinalResponseModel): AdaptedL1Response {
  return adaptFinalResponseToL1(response);
}

export default function Level2FinalResponse({ response }: { response: FinalResponseModel }) {
  const adapted = useMemo(() => adaptFinalResponseToL1(response), [response]);

  return (
    <div
      className="att-l2-final-l1"
      style={{
        position: 'absolute',
        inset: 0,
        color: '#fff',
        fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
        // `--l1s-hairline` is deliberately NOT set here. useStageScale
        // writes it globally as 2/scale, exactly as /l1-scenarios' own
        // ScaleSync does, so the hairline lands at ~2 device px once the
        // stage is scaled. Pinning it locally made it wrong at every scale
        // other than 1.
      }}
    >
      <L1ScenarioStyles />
      {adapted.family === 'cards' && <CardsScenario data={adapted.data} />}
      {adapted.family === 'cards-tabs' && <CardsTabsScenario data={adapted.data} />}
      {adapted.family === 'text-only' && <TextOnlyScenario data={adapted.data} />}
      {adapted.family === 'text-carousel' && <TextCarouselScenario data={adapted.data} />}
    </div>
  );
}
