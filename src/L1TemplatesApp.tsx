/**
 * L1TemplatesApp — slug-based router.
 * Each renderer is a separate route so every template gets a clean mount.
 *
 * Routes:
 *   /L1_templates                → recommendation (default)
 *   /L1_templates/recommendation
 *   /L1_templates/comparison
 *   /L1_templates/collection
 *   /L1_templates/facts
 *   /L1_templates/guided-flow
 *   /L1_templates/journey
 *   /L1_templates/insights
 *   /L1_templates/why-this
 */
import L1Page from './components/L1/L1Page';
import { RENDERERS } from './components/L1/rendererRegistry';
import type { RendererType } from './components/L1/rendererRegistry';

function resolveSlug(): RendererType {
  const parts = window.location.pathname.replace(/\/$/, '').split('/');
  const slug  = parts[parts.length - 1] as RendererType;
  return RENDERERS.find(r => r.id === slug)?.id ?? 'recommendation';
}

export default function L1TemplatesApp() {
  const slug   = resolveSlug();
  const config = RENDERERS.find(r => r.id === slug) ?? RENDERERS[0];

  /*
   * key={slug} forces a full unmount+remount when the slug changes.
   * This guarantees a clean lifecycle — no stale state, no animation bleed.
   */
  return (
    <L1Page
      key={slug}
      config={config}
      allRenderers={RENDERERS}
    />
  );
}
