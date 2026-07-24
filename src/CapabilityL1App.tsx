/**
 * CapabilityL1App — route wrapper for /l1-category/:id.
 *
 * Mounts the existing L1Page shell as the "conversation start" state for a
 * homepage capability — same layout, mascot, query area, bottom prompt row,
 * typography, background, focus behavior, and animation as every other L1
 * screen. Only the content is category-specific (capabilityLandingStates),
 * and no cards render until the user selects a suggested prompt, which
 * hands off into the existing renderer templates (same ones L1TemplatesApp
 * uses at /L1_templates/:slug).
 *
 * Routes:
 *   /l1-category/fashion
 *   /l1-category/travel
 *   /l1-category/food
 *   /l1-category/sports
 *   /l1-category/wellness
 *   /l1-category/homeDecor
 */
import L1Page from './components/L1/L1Page';
import { RENDERERS } from './components/L1/rendererRegistry';
import {
  capabilityLandingStates, capabilityPromptRenderers,
  type CapabilityLandingId,
} from './components/L1/capabilityLandingStates';

const LANDING_IDS = Object.keys(capabilityLandingStates) as CapabilityLandingId[];

function resolveId(): CapabilityLandingId {
  const parts = window.location.pathname.replace(/\/$/, '').split('/');
  const slug = parts[parts.length - 1];
  return (LANDING_IDS as string[]).includes(slug) ? (slug as CapabilityLandingId) : 'fashion';
}

export default function CapabilityL1App() {
  const id = resolveId();
  const state = capabilityLandingStates[id];

  const config = {
    id,
    label: id,
    query: state.inputPlaceholder,
    thinkingSteps: state.thinkingSteps,
    agentMessage: state.agentMessage,
    prompts: state.prompts,
    maxIdx: 0,
  };

  const handlePromptSelect = (idx: number) => {
    const renderer = capabilityPromptRenderers[id][idx];
    if (renderer) window.location.pathname = `/L1_templates/${renderer}`;
  };

  return (
    <L1Page
      key={id}
      config={config}
      allRenderers={RENDERERS}
      hideContent
      showTemplateSwitcher={false}
      queryIsPlaceholder
      onPromptSelect={handlePromptSelect}
    />
  );
}
