/* Shared CTA sequence used by all three modes.
   After reasoning completes:
     1. agent → 'looking'  (immediate)
     2. 800ms pause
     3. ctaVisible = true  (CTA slides in)
     4. 450ms
     5. mascotInCTA = true + agent → 'idle' + state = 'done'
*/

import type { Dispatch, SetStateAction } from 'react';
import type { AgentMode } from '../components/Shared/AgentMascot';
import type { ColumnState } from './LabColumn';

type Setters = {
  setAgentMode:   Dispatch<SetStateAction<AgentMode>>;
  setCtaVisible:  Dispatch<SetStateAction<boolean>>;
  setMascotInCTA: Dispatch<SetStateAction<boolean>>;
  setState:       Dispatch<SetStateAction<ColumnState>>;
};

export function triggerCTA({ setAgentMode, setCtaVisible, setMascotInCTA, setState }: Setters) {
  setAgentMode('looking');
  setTimeout(() => {
    setCtaVisible(true);
    setTimeout(() => {
      setMascotInCTA(true);
      setAgentMode('idle');
      setState('done');
    }, 450);
  }, 800);
}
