// ─────────────────────────────────────────────────────────────────────────────
// Category Resolver
//
// Infers a category from a URL path when no explicit category is provided.
// Used by the update:index script for auto-detected routes.
// ─────────────────────────────────────────────────────────────────────────────

import type { PrototypeCategory } from './prototypeRegistry';

type PatternRule = {
  pattern: RegExp;
  category: PrototypeCategory;
};

const RULES: PatternRule[] = [
  // Preference / calibration
  { pattern: /\/(preference|calibration|warm.profile|warm.start|setup)/i, category: 'Preference Strategy' },

  // L1 CTA variants (must come before generic l1)
  { pattern: /\/l1-(embedded|expanded|continuous)-cta|\/cta-exploration/i, category: 'L1 CTA Exploration' },

  // L1 templates
  { pattern: /\/[Ll]1.templates|\/l1-(text-table|final)|\/l1_final/i, category: 'L1 Templates' },

  // L0 / glances
  { pattern: /\/(l0|glances?|fashion|travel|food|pet|wellness|home.decor)/i, category: 'L0 Glances' },

  // Agentic / conversation
  { pattern: /\/(agentic|t3|conversation)/i, category: 'Main Demos' },

  // Cold/warm start → main demos
  { pattern: /\/(demo|cold.start|warm.start|cold.profile)/i, category: 'Main Demos' },

  // Debug / dev tools
  { pattern: /\/(debug|mascot|playground|preview|export|poc|beam|interstitial)/i, category: 'Dev Tools' },
];

export function resolveCategory(url: string): PrototypeCategory {
  for (const { pattern, category } of RULES) {
    if (pattern.test(url)) return category;
  }
  return 'Standalone Pages';
}

// Infer a human-readable title from a slug path like /l1-text-table
export function inferTitle(url: string): string {
  const slug = url.replace(/^\//, '').replace(/\/$/, '').split('/').pop() ?? url;
  return slug
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\bL(\d)/g, 'L$1')   // preserve L0, L1
    .replace(/\bT(\d)/g, 'T$1')   // preserve T2, T3
    || url;
}
