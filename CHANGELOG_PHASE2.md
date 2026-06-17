# Phase 2 Changelog — L0 Glance Redesign

## Summary

Complete architectural redesign of the L0 Glance experience. The existing single-file implementation inside `FeedScreen.tsx` has been replaced by a shared component system that is configuration-driven, animation-sequenced, and built for Apple TV cinematic quality.

---

## Design Direction

Phase 2 follows the same principles established in Phase 1 (conversational, calm, cinematic) and extends them into the feed layer:

- **Purple as ambient layer** — backgrounds, glows, gradients
- **White as the attention layer** — focus rings, CTAs, primary interactive states
- **Agent as narrator** — the mascot reasons conversationally, never exposes signal keys
- **Choreography, not decoration** — every element has a timing role in a 7-step sequence

---

## New Files

| File | Purpose |
|------|---------|
| `src/logic/reasoningEngine.ts` | Generates conversational reasoning lines per feed item |
| `src/config/glanceConfig.ts` | Maps every item to layout variant + card configuration |
| `src/components/L0/L0Glance.tsx` | Master L0 component — owns animation sequence |
| `src/components/L0/GlanceLayout.tsx` | Layout orchestrator — left/center/right variants |
| `src/components/L0/MascotLayer.tsx` | Mascot placement (center variant floating) |
| `src/components/L0/AgentReasoning.tsx` | Reasoning bubble with inline mascot (left/right variants) |
| `src/components/L0/AgentCTA.tsx` | Primary CTA + Why this? secondary button |
| `src/components/L0/ProductRail.tsx` | Sequential product card reveal |
| `L0_AUDIT.md` | Full audit: 35 glances, layout assignments, pattern analysis |

---

## Modified Files

| File | Change |
|------|--------|
| `src/components/Feed/FeedScreen.tsx` | Replaced 150-line inline L0 block with `<L0Glance>` |
| `src/styles/motion.css` | Added L0-specific keyframes and TV focus classes |
| `src/App.tsx` | Suppressed pre-existing unused `sliders` variable warning |

---

## Architecture

### Shared Component Tree

```
FeedScreen
└── L0Glance               ← master, owns animation state
    └── GlanceLayout       ← variant (left | center | right)
        ├── MascotLayer    ← center variant: floating above title
        ├── AgentReasoning ← bubble with inline mascot (left/right)
        ├── AgentCTA       ← white primary + ghost secondary
        └── ProductRail    ← sequential card reveal
```

### Configuration System

`glanceConfig.ts` maps every feed item ID to:
- `layout`: `'left' | 'center' | 'right'`
- `cardCount`: 0–2 product cards
- Optional overrides for title size and CTA label

New items not in the map get a deterministic fallback based on ID hash.

### Reasoning Engine

`reasoningEngine.ts` provides `getReasoning(item: FeedItem): string`:
- 4 variants per category (11 categories covered)
- Reads from `window.GLANCE_CTX` (time, weather, city, upcoming context)
- Deterministic per item (hash-based variant selection)
- All copy is conversational — no raw signal keys, no category codes

---

## Animation Sequence

Every glance, on every card change, animates in this exact order:

| Step | Element | Timing |
|------|---------|--------|
| 1 | Background settles (gradient overlay) | 0ms |
| 2 | Mascot appears (spring drop) | 380ms |
| 3 | Title + subtitle appear (blur-to-sharp) | 680ms |
| 4 | Reasoning bubble appears (fade-up) | 1020ms |
| 5 | CTA appears (spring slide-up) | 1360ms |
| 6 | Product cards reveal, one by one | 1600ms + 160ms stagger |
| 7 | Focus ring activates on CTA | 2100ms |

CSS transitions drive the animation (no `animation:` on the JS-controlled elements) — step state is integer-driven, making it easy to modify timing without touching component code.

---

## Layout Variants

### Left (12 items)
- Text anchored bottom-left at 80px
- Max-width 820px
- Title 58px serif
- Agent reasoning: mascot inline left of bubble
- Product rail below reasoning, left-aligned

### Center (10 items)
- Text centered, translated from `left: 50%`
- Max-width 900px
- Title 68px serif
- Mascot floats above title at 72px
- No subtitle shown (title carries the weight)
- Product rail centered (if present)

### Right (13 items)
- Text anchored bottom-right at 80px
- Max-width 780px
- Title 52px serif (shorter, punchier titles)
- Agent reasoning: mascot inline right of bubble
- Product rail right-aligned

---

## Focus State Redesign

All interactive elements use the white-ring TV focus model from Phase 1:

| Element | Focus appearance |
|---------|-----------------|
| Primary CTA | White 3px ring + 4px offset + scale(1.04) |
| Product card | White border + scale(1.04) + `translateY(-2px)` lift |
| Nav item | White ring + purple fill 22% |

Focus is **never purple-filled on primary actions** — purple tint is reserved for secondary/ambient states.

---

## Reasoning Copy Model

Rules enforced in the engine:
1. Max 100 characters
2. References time/weather/city/upcomingContext when the context exists
3. Tone adapts to category — warmer for food/home/beauty, crisper for sports/fashion
4. Never says "your interest weight is" or exposes signal key names
5. Conversational, first-person agent voice

Example outputs:
- Fashion: "You've been gravitating toward street style lately — this felt like the right moment."
- Food: "On a rainy day, something warm like south indian makes a lot of sense."
- Travel: "Based on your location in Bangalore, heritage-travel came up as a perfect match."
- Sports: "Your kabaddi interest + this evening made this the obvious pick."

---

## Product Cards

- Minimum 0, maximum 2 per glance (configured per item)
- Cards show the first N `subCategories` from the item, humanized from slug
- Each card has a `✦/◈/◉` accent mark and "Pick 1/2" label
- Glass surface: `rgba(255,255,255,0.07)` + `blur(14px)`
- Sequential reveal: card 1 at step 6, card 2 at step 6 + 160ms

---

## Design Rationale

### Why configuration-driven instead of per-item components
35+ glances with minor layout variations would create 35 near-identical files. A single config map + 3 layout variants covers the full range with zero duplication.

### Why integer step state instead of CSS `animation:` with delays
Delay-based CSS animations cannot be cancelled mid-sequence when the user navigates to the next card. Integer step state lets `L0Glance` reset all steps instantly on `item.id` change, then schedule new timers — no ghost animations from previous cards bleeding through.

### Why the reasoning engine uses a deterministic hash
Random selection would cause the same item to show different reasoning lines across sessions, which would feel inconsistent if a user re-visits a card. Hash-based selection means the same item always reads the same — the agent "remembers" what it said.

### Why mascot placement differs by layout
- **Left/right**: mascot inline with reasoning bubble — contextually grounded, conversation-feel
- **Center**: mascot floating above title — presence-forward, the agent introduces the content from above rather than alongside it. Matches the centered layout's more cinematic, less editorial tone.

---

## What Was Not Changed

- The feed navigation system (arrow keys, dwell, scheduler)
- All overlay components (deep-dive, thumbs up/down, interstitials, settings)
- The `agentMode` logic in `FeedScreen` — still drives `looking → idle` timing
- `AgentMascot` component — Phase 1 work, unchanged
- All onboarding screens — Phase 1 work, unchanged
