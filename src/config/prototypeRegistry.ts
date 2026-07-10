// ─────────────────────────────────────────────────────────────────────────────
// Prototype Registry
//
// THE canonical source of truth for all internal prototype routes.
//
// HOW TO ADD A NEW PAGE:
//   1. Wire the route in main.tsx as usual.
//   2. Add one entry here under the right category.
//   3. /index updates automatically — no other changes needed.
//
// CATEGORIES (add new ones freely):
//   'Main Demos' | 'Preference Strategy' | 'L0 Glances' | 'L1 Templates'
//   'L1 CTA Exploration' | 'Deeper Flows' | 'Standalone Pages' | 'Dev Tools'
//
// STATUS:
//   'Demo'  – complete, presentable
//   'Final' – shipped / frozen
//   'WIP'   – in progress, may be broken
//   'Archived' – kept for reference, not actively maintained
// ─────────────────────────────────────────────────────────────────────────────

export type PrototypeStatus = 'Demo' | 'Final' | 'WIP' | 'Archived';
export type PrototypeCategory =
  | 'Main Demos'
  | 'Preference Strategy'
  | 'L0 Glances'
  | 'L1 Templates'
  | 'L1 CTA Exploration'
  | 'Deeper Flows'
  | 'Standalone Pages'
  | 'Dev Tools'
  | string; // allow ad-hoc categories

export type PrototypeEntry = {
  title: string;
  description: string;
  url: string;
  category: PrototypeCategory;
  status: PrototypeStatus;
  tags?: string[];
  createdAt?: string;  // YYYY-MM-DD
  updatedAt?: string;  // YYYY-MM-DD
};

// ─── Registry ────────────────────────────────────────────────────────────────

export const PROTOTYPE_REGISTRY: PrototypeEntry[] = [

  // ── Main Demos ─────────────────────────────────────────────────────────────
  {
    title: 'Agent Hub',
    description: 'Living AI workspace — Pinned widgets, Top AI Agents, More entry points. Navigate from Warm Profile 1 Crisper via ←.',
    url: '/agent-hub',
    category: 'Main Demos',
    status: 'Demo',
    tags: ['agent-hub', 'workspace', 'widgets'],
    createdAt: '2026-07-08',
  },
  {
    title: 'Full Adaptive L0 Demo',
    description: 'Default feed with full onboarding, real-time preference engine, and ranked content.',
    url: '/',
    category: 'Main Demos',
    status: 'Demo',
    tags: ['feed', 'onboarding', 'ranking'],
    createdAt: '2024-01-01',
  },
  {
    title: 'Cold Start Demo',
    description: 'Full onboarding → feed flow for a brand-new user with no prior profile.',
    url: '/demo-cold-start',
    category: 'Main Demos',
    status: 'Demo',
    tags: ['cold-start', 'onboarding'],
  },
  {
    title: 'Warm Start Demo',
    description: "Warm-start feed for Abhinav — sports + travel + wellness profile, skips onboarding.",
    url: '/demo-warm-start',
    category: 'Main Demos',
    status: 'Demo',
    tags: ['warm-start', 'feed'],
  },
  {
    title: 'Ambient Passive Calibration Demo',
    description: 'Cold profile (Akshay) — single-signal CTA injection per card, no onboarding.',
    url: '/cold-profile-1',
    category: 'Main Demos',
    status: 'Demo',
    tags: ['cold-start', 'calibration', 'cta'],
  },
  {
    title: 'Remote Picked Up — Agentic Prompt',
    description: 'T3 Conversation Starter — agentic follow-up prompt triggered by remote pick-up.',
    url: '/t3',
    category: 'Main Demos',
    status: 'WIP',
    tags: ['agentic', 't3'],
  },

  // ── Preference Strategy ────────────────────────────────────────────────────
  {
    title: 'Preference Collection (Setup Flow)',
    description: 'Warm feed mode with full calibration onboarding: TV content, audience, show more, weekend, style.',
    url: '/setup',
    category: 'Preference Strategy',
    status: 'Demo',
    tags: ['onboarding', 'preference', 'calibration'],
  },
  {
    title: 'Calibration Glances — Warm Profile 1',
    description: "Akshay's profile. Standard reasoning variant with full signal injection.",
    url: '/warm-profile-1',
    category: 'Preference Strategy',
    status: 'Demo',
    tags: ['warm-start', 'calibration', 'profile'],
  },
  {
    title: 'Calibration Glances — Warm Profile 1 Crisp',
    description: 'Same as warm-profile-1 but with 50%-shorter compressed reasoning text.',
    url: '/warm-profile-1-crisp',
    category: 'Preference Strategy',
    status: 'Demo',
    tags: ['warm-start', 'calibration', 'crisp'],
  },
  {
    title: 'Agent Hub Exploration',
    description: 'Warm Profile L0 with the Agent Hub exploration (press ← to open). Tightest reasoning copy — crisper signal data variant.',
    url: '/agent_hub_exploration',
    category: 'Preference Strategy',
    status: 'Demo',
    tags: ['warm-start', 'calibration', 'agent-hub', 'crisp'],
  },
  {
    title: 'Calibration Glances — Warm Profile 2',
    description: 'Second warm profile, crisp variant with a different content set.',
    url: '/warm-profile-2-crisp',
    category: 'Preference Strategy',
    status: 'Demo',
    tags: ['warm-start', 'calibration', 'profile'],
  },

  // ── L0 Glances ─────────────────────────────────────────────────────────────
  {
    title: 'Fashion Glances (T2)',
    description: 'Immersive T2 fashion story — full-bleed cinematic glance flow.',
    url: '/t2-fashion',
    category: 'L0 Glances',
    status: 'Demo',
    tags: ['fashion', 't2', 'cinematic'],
  },
  {
    title: 'L0 T1 Motion Lab',
    description: 'Developer handoff for L0 T1 animation. Keys 1–8 jump states, Space replays, D opens inspector.',
    url: '/l0-t1',
    category: 'L0 Glances',
    status: 'Demo',
    tags: ['motion', 'animation', 'l0-t1', 'dev'],
  },
  {
    title: 'L0 Animation Lab',
    description: 'Experimental L0 animation sandbox.',
    url: '/l0_experiment',
    category: 'L0 Glances',
    status: 'WIP',
    tags: ['animation', 'experiment'],
  },
  {
    title: 'Travel Glances',
    description: 'Planned: travel-category dedicated glance feed.',
    url: '#',
    category: 'L0 Glances',
    status: 'WIP',
    tags: ['travel', 'planned'],
  },
  {
    title: 'Home Decor Glances',
    description: 'Planned: home decor category glance feed.',
    url: '#',
    category: 'L0 Glances',
    status: 'WIP',
    tags: ['home-decor', 'planned'],
  },
  {
    title: 'Food Glances',
    description: 'Planned: food category glance feed.',
    url: '#',
    category: 'L0 Glances',
    status: 'WIP',
    tags: ['food', 'planned'],
  },
  {
    title: 'Pets Glances',
    description: 'Planned: pets category glance feed.',
    url: '#',
    category: 'L0 Glances',
    status: 'WIP',
    tags: ['pets', 'planned'],
  },
  {
    title: 'Wellness / Lifestyle Glances',
    description: 'Planned: wellness and lifestyle category glance feed.',
    url: '#',
    category: 'L0 Glances',
    status: 'WIP',
    tags: ['wellness', 'planned'],
  },

  // ── L1 Templates ──────────────────────────────────────────────────────────
  {
    title: 'L1 Templates — Index',
    description: 'All L1 content renderers on one page. Use sidebar to switch between types.',
    url: '/L1_templates',
    category: 'L1 Templates',
    status: 'Demo',
    tags: ['l1', 'templates'],
  },
  {
    title: 'L1 Templates — Recommendation',
    description: 'Ranked item list with reasoning.',
    url: '/L1_templates/recommendation',
    category: 'L1 Templates',
    status: 'Demo',
    tags: ['l1', 'recommendation'],
  },
  {
    title: 'L1 Templates — Comparison',
    description: 'Side-by-side product/option comparison renderer.',
    url: '/L1_templates/comparison',
    category: 'L1 Templates',
    status: 'Demo',
    tags: ['l1', 'comparison'],
  },
  {
    title: 'L1 Templates — Collection',
    description: 'Curated collection renderer with grid layout.',
    url: '/L1_templates/collection',
    category: 'L1 Templates',
    status: 'Demo',
    tags: ['l1', 'collection'],
  },
  {
    title: 'L1 Templates — Facts',
    description: 'Fact / trivia card renderer.',
    url: '/L1_templates/facts',
    category: 'L1 Templates',
    status: 'Demo',
    tags: ['l1', 'facts'],
  },
  {
    title: 'L1 Templates — Guided Flow',
    description: 'Step-by-step guided flow renderer.',
    url: '/L1_templates/guided-flow',
    category: 'L1 Templates',
    status: 'Demo',
    tags: ['l1', 'guided-flow'],
  },
  {
    title: 'L1 Templates — Journey',
    description: 'Narrative journey / timeline renderer.',
    url: '/L1_templates/journey',
    category: 'L1 Templates',
    status: 'Demo',
    tags: ['l1', 'journey'],
  },
  {
    title: 'L1 Templates — Insights',
    description: 'Data insights and signal summary renderer.',
    url: '/L1_templates/insights',
    category: 'L1 Templates',
    status: 'Demo',
    tags: ['l1', 'insights'],
  },
  {
    title: 'L1 Templates — Why This',
    description: "Explainability renderer — why this card was shown.",
    url: '/L1_templates/why-this',
    category: 'L1 Templates',
    status: 'Demo',
    tags: ['l1', 'explainability'],
  },
  {
    title: 'L1 Text Table',
    description: 'Text-table renderer for structured comparison content in L1.',
    url: '/l1-text-table',
    category: 'L1 Templates',
    status: 'Demo',
    tags: ['l1', 'text-table'],
  },
  {
    title: 'L1 Final — Shopping Template',
    description: 'Final L1 shopping template with complete CTA and action flow.',
    url: '/l1-final',
    category: 'L1 Templates',
    status: 'Final',
    tags: ['l1', 'shopping', 'final'],
  },

  // ── L1 CTA Exploration ─────────────────────────────────────────────────────
  {
    title: 'CTA Exploration — Index',
    description: 'Side-by-side overview of all three CTA interaction models.',
    url: '/cta-exploration',
    category: 'L1 CTA Exploration',
    status: 'Demo',
    tags: ['cta', 'l1', 'interaction'],
  },
  {
    title: 'Option 1 — CTA Row Below Card',
    description: 'CTAs float below the focused card border. ENTER enters CTA strip, DOWN skips to prompts.',
    url: '/l1-embedded-cta',
    category: 'L1 CTA Exploration',
    status: 'Demo',
    tags: ['cta', 'l1', 'option-1'],
  },
  {
    title: 'Option 2 — Embedded CTA (Expanded Card)',
    description: 'Card auto-expands on focus; CTAs live inside the expanded area.',
    url: '/l1-expanded-card',
    category: 'L1 CTA Exploration',
    status: 'Demo',
    tags: ['cta', 'l1', 'option-2'],
  },
  {
    title: 'Option 3 — Continuous Primary CTA',
    description: 'No ENTER required — Buy Now always active. CTA order mirrors nav direction.',
    url: '/l1-continuous-cta',
    category: 'L1 CTA Exploration',
    status: 'Demo',
    tags: ['cta', 'l1', 'option-3'],
  },

  // ── Deeper Flows ───────────────────────────────────────────────────────────
  {
    title: 'Fashion Try-On Flow',
    description: 'Planned: deep fashion try-on experience triggered from L0 card.',
    url: '#',
    category: 'Deeper Flows',
    status: 'WIP',
    tags: ['fashion', 'try-on', 'planned'],
  },
  {
    title: 'Travel Moments Flow',
    description: 'Planned: travel destination deep-dive from L0 card.',
    url: '#',
    category: 'Deeper Flows',
    status: 'WIP',
    tags: ['travel', 'planned'],
  },
  {
    title: 'Product Exploration Flow',
    description: 'Planned: product discovery and purchase flow from L0 card.',
    url: '#',
    category: 'Deeper Flows',
    status: 'WIP',
    tags: ['product', 'shopping', 'planned'],
  },

  // ── Standalone Pages ───────────────────────────────────────────────────────
  {
    title: 'UX Operating Model',
    description: 'UX Operating Model document — Aswanthraj T.',
    url: '/ux-operating-model/',
    category: 'Standalone Pages',
    status: 'Final',
    tags: ['docs', 'ux'],
  },
  {
    title: 'Enriched Profile Switcher',
    description: 'E1 vs E2 enriched profile comparison switcher.',
    url: '/enriched.html',
    category: 'Standalone Pages',
    status: 'Demo',
    tags: ['profile', 'enriched'],
  },
  {
    title: 'Persona Feed',
    description: 'Multi-persona feed view with persona pill switcher.',
    url: '/personas.html',
    category: 'Standalone Pages',
    status: 'Demo',
    tags: ['persona', 'feed'],
  },
  {
    title: 'GTV Feed Intelligence — Bangalore L0',
    description: 'Static signals panel and context bar for Bangalore L0 content intelligence.',
    url: '/gtv-intelligence-static.html',
    category: 'Standalone Pages',
    status: 'Demo',
    tags: ['signals', 'bangalore', 'intelligence'],
  },
  {
    title: 'Glance TV — 100 Card Feed',
    description: 'Original 100-card feed prototype with preference acknowledgement overlay.',
    url: '/Glance_TV_Prototype.html',
    category: 'Standalone Pages',
    status: 'Archived',
    tags: ['legacy', 'feed'],
  },
  {
    title: 'Setup Flow (HTML)',
    description: 'Static HTML version of the setup / onboarding flow.',
    url: '/setupflowHTML/index.html',
    category: 'Standalone Pages',
    status: 'Archived',
    tags: ['onboarding', 'legacy'],
  },
  {
    title: 'GTV Prototype AK',
    description: 'Standalone glance-tv prototype (AK build).',
    url: '/gtv_prototype_ak/index.html',
    category: 'Standalone Pages',
    status: 'Archived',
    tags: ['legacy'],
  },
  {
    title: 'Cold Start Prototype AK',
    description: 'Standalone cold start prototype (AK build).',
    url: '/cold_Start_prototype_ak/cold_start.html',
    category: 'Standalone Pages',
    status: 'Archived',
    tags: ['cold-start', 'legacy'],
  },
  {
    title: 'TypeCraft — Typing Animation Studio',
    description: 'Typing animation lab for typewriter/text reveal effect exploration.',
    url: '/typewriter.html',
    category: 'Standalone Pages',
    status: 'Demo',
    tags: ['animation', 'typewriter'],
  },
  {
    title: 'Glance TV Phase 1',
    description: 'Original Phase 1 app entry point.',
    url: '/app.html',
    category: 'Standalone Pages',
    status: 'Archived',
    tags: ['legacy'],
  },

  // ── Dev Tools ──────────────────────────────────────────────────────────────
  {
    title: 'Mascot Playground',
    description: 'Interactive Rive mascot state machine explorer. Toggle idle / looking / thinking.',
    url: '/mascot-playground',
    category: 'Dev Tools',
    status: 'Demo',
    tags: ['mascot', 'rive', 'animation', 'dev'],
  },
  {
    title: 'Interstitial Preview',
    description: 'Preview mode for preference interstitial cards mid-feed.',
    url: '/interstitial-preview.html',
    category: 'Dev Tools',
    status: 'Demo',
    tags: ['interstitial', 'preview', 'dev'],
  },
  {
    title: 'Beam Button POC',
    description: 'Beam button proof-of-concept interaction exploration.',
    url: '/beam-poc.html',
    category: 'Dev Tools',
    status: 'Demo',
    tags: ['beam', 'cta', 'dev'],
  },
  {
    title: 'L0 Export — Final States',
    description: 'Export view of L0 card final animation states.',
    url: '/l0-export.html',
    category: 'Dev Tools',
    status: 'Demo',
    tags: ['l0', 'export', 'dev'],
  },
  {
    title: 'L0 Preview',
    description: 'Isolated single L0 card preview (boots with __L0_PREVIEW__ flag).',
    url: '/l0-preview.html',
    category: 'Dev Tools',
    status: 'Demo',
    tags: ['l0', 'preview', 'dev'],
  },
];

// ─── Canonical category order ─────────────────────────────────────────────────
// Controls the display order on /index. Unknown categories appear at the end.
export const CATEGORY_ORDER: PrototypeCategory[] = [
  'Main Demos',
  'Preference Strategy',
  'L0 Glances',
  'L1 Templates',
  'L1 CTA Exploration',
  'Deeper Flows',
  'Standalone Pages',
  'Dev Tools',
];
