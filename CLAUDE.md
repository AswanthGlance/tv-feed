# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start Vite dev server (localhost:5173)
npm run build     # tsc + vite build → dist/
npm run preview   # preview the built dist/

# Run the single test file
npx vitest run src/logic/engine.test.ts
```

The app renders at a fixed **1920×1080** TV resolution. Open the dev server at full screen or use browser zoom to see the actual layout.

## Architecture

### What this is

A React/TypeScript **TV prototype** for Glance — an AI-curated ambient feed for smart TVs. It simulates a full cold-start onboarding flow followed by a live content feed, with a real-time preference engine that re-ranks content as the user interacts.

### Screen flow

`App.tsx` drives a flat state machine with a single `screen: Screen` string. Screens render conditionally inside `<TVStage>`. The flow is:

```
welcome → bangalore-confirm → worlds → discovery-appetite → selfie → tuning → feed
```

`src/logic/navigation.ts` defines the `Screen` union type and `SCREEN_ORDER`. `isForward()` determines slide direction for transitions.

### Two parallel data models

**`PreferenceProfile`** (`src/data/types.ts`, `src/logic/preferenceProfile.ts`) — the live ranking engine. Holds `weights`, `negativeWeights`, `evidenceCounts` keyed as namespaced strings (`cat:food`, `sub:ramen`, `vibe:cozy`). Never stored between sessions.

**`GlanceProfileDraft`** (`src/logic/profileDraft.ts`) — a structured enriched profile built during onboarding. Holds `demographics`, `category_interests`, `discovery_appetite`. Used by `TuningTransition` to display what was collected, then passed to `enterFeed()`.

### Signal → ranking invariant

**Signals write raw evidence; axis multipliers live only in `ranking.ts`.**

- `src/logic/signals.ts` — all signal functions (`applyThumbsUpSignal`, `applyPassiveDwell`, etc.) add to `profile.weights` using `TUNING` constants from `tuning.ts`
- `src/logic/ranking.ts` — `scoreItem()` applies axis multipliers (category, sub, vibe, region, format, pace) using log-saturation to prevent compounding
- `rerankTail()` is called after every interaction to re-sort the unseen portion of the feed

### Feed composition

`composeFeed()` in `ranking.ts` scores and sorts `FEED_ITEMS`. `composeFeedWithPreferences()` in `feedComposer.ts` interleaves preference question cards every 5 L0 items (max 6 per session). The result is a `UnifiedFeedItem[]` array mixing `{ type: 'glance', item }` and `{ type: 'preference', question }`.

### L0 card rendering

Each L0 card goes through:

1. `FeedScreen` → resolves current `UnifiedFeedItem`
2. `L0Glance` → gets layout config from `getGlanceConfig()` in `src/config/glanceConfig.ts`
3. `CinematicL0` (most cards) or `GlanceLayout` → renders the full-bleed image with text overlay
4. `AgentReasoning` — mascot + typewriter reasoning text
5. `AgentCTA` — the action pill with optional mascot inside
6. `MascotLayer` — renders `AgentMascot` for center-layout variants

`glanceConfig.ts` maps every feed item ID to its `layout` (`left | center | right`) and `cardCount`. `LAYOUT_GEOMETRY` defines per-layout text positions, title sizes, and mascot sizes.

### Mascot system

`src/components/Shared/AgentMascot.tsx` is the single source of truth for the Rive mascot (`/public/mascot.riv`).

- State machine: `G_Moscot_States`
- States: `Idel _Eyeblink` (idle), `Looking Around` (looking), `Loading` (thinking)
- Controlled via `agentMode: 'idle' | 'looking' | 'thinking'` prop
- Boolean input `Looking` switches idle↔looking; `thinking` calls `rive.play('Loading')` directly
- Note: Rive state name is literally `Idel _Eyeblink` (typo in the source file — do not correct without updating the .riv)

`HandwaveMascot.tsx` renders the entry lottie (`/public/handwave-mascot.lottie`) using `@lottiefiles/dotlottie-react`. Used only on WelcomeScreen during the handwave → Rive crossfade.

### Animation system

All screen-level transitions use **GSAP timelines** directly in component `useEffect`s — not a shared animation service. Each screen owns its entrance/exit sequence.

- `src/animations/l0Timeline.ts` — orchestrates the L0 card reveal sequence (background, title, reasoning, CTA appear in stages)
- `src/animations/titleReveal.ts` — title text animation helpers

### Onboarding CSS namespace

Onboarding screens use CSS classes namespaced by screen:
- `fg-*` — shared figma-onboarding classes (`figma-onboarding.css`)
- `sv-*` — SelfieScreen redesign classes (appended to end of `figma-onboarding.css`)

The `.fg-screen` class is the base for all onboarding screens. The stage is 1920×1080, no CSS scaling — `#scaler` fills `100vw/100vh` natively.

### Dev keyboard shortcuts (in-app)

| Key | Action |
|-----|--------|
| `D` | Toggle debug panel (live weights, profile draft) |
| `E` | Session data overlay |
| `S` | Signal log / data panel |
| `R` | Reset to cold start |
| `M` | Cycle market (india → us → global) |

### Static assets

- `/public/mascot.riv` — Rive mascot animation
- `/public/handwave-mascot.lottie` — entry handwave lottie (patched: `data:image/webp;base64` MIME)
- `/public/glance-logo.png` — used by `GlanceLogo` component and L0 header
- `/public/images/feed/` — all feed card images (`feed_01-...` through `feed_70-...`)

### Key data files

- `src/data/feedItems.ts` — `FEED_ITEMS` array, all 70 feed cards with `category`, `subCategories`, `vibes`, `boosts`, `decays`, `reasoning`, `highlights`
- `src/data/preferenceQuestions.ts` — `INTERSTITIAL_QUESTIONS` inserted into the feed
- `src/logic/tuning.ts` — all signal strength constants in one `TUNING` object
- `src/data/marketConfig.ts` — per-market axis weight multipliers
