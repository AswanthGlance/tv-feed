# Phase 1.1 Refinements

UX corrections applied to the completed Phase 1 implementation. All changes are higher priority than new features — they fix pacing, layout, and interaction model issues before Phase 2 continues.

---

## Files Changed

| File | Change |
|------|--------|
| `src/styles/tv.css` | Removed TV frame bezel |
| `src/components/RemoteOverlay.tsx` | Replaced with null render (no visible UI) |
| `src/styles/tokens.css` | Darkened all background gradients |
| `src/styles/globals.css` | Darkened body background to match |
| `src/styles/premium.css` | Button redesign, single-column layout classes, slowed stagger, hidden hint bar |
| `src/components/Activation/WelcomeScreen.tsx` | 4-step staged intro sequence |
| `src/components/Activation/BangaloreConfirm.tsx` | Single-column layout, staged entrance, no hint bar |
| `src/components/Calibration/WorldsQuestion.tsx` | Single-column 4-col grid, no hint bar, focused button system |
| `src/components/Calibration/DiscoveryAppetite.tsx` | Single-column layout, no hint bar, focused button system |
| `src/components/Shared/AgentMascot.tsx` | Ambient breathing + randomised gaze-shift scheduler |
| `src/components/Activation/SelfieScreen.tsx` | Architecture stub (visual held for Figma reference) |

---

## TV Frame

**Removed.** The `box-shadow` bezel, `border-radius 20px`, and purple `border` on `#stage` have been stripped from `tv.css`. The stage is now a plain `overflow: hidden` container. Content fills the viewport directly — no TV-inside-a-TV framing.

---

## Controls Overlay

**Removed.** `RemoteOverlay.tsx` now renders `null`. The D-pad widget, arrow buttons, OK/Back labels, and Restart button are gone from the visible UI.

Keyboard shortcuts remain fully functional via each screen's own `keydown` handler:

| Key | Action |
|-----|--------|
| Arrow Keys | Navigate between options |
| Enter / Space | Select / confirm |
| Escape / Backspace | Back |
| R | Restart (App-level) |

Nothing on screen advertises these.

---

## Animation Timing

### Stagger delays — slowed for TV reading distance

**Old delays:** 0 · 90 · 180 · 280 · 390ms (too fast, content appeared before it could be read)

**New welcome-screen delays (d0–d4):**

| Class | Delay | Element |
|-------|-------|---------|
| `d0` | 0ms | Mascot |
| `d1` | 600ms | First text (600ms pause after mascot) |
| `d2` | 1800ms | Second text (1200ms reading time) |
| `d3` | 3000ms | Third text (1200ms reading time) |
| `d4` | 3600ms | CTAs (600ms pause) |

**New question-screen delays (qs0–qs7):**

| Class | Delay |
|-------|-------|
| `qs0` | 0ms |
| `qs1` | 200ms |
| `qs2` | 420ms |
| `qs3` | 660ms |
| `qs4` | 920ms |
| `qs5` | 1180ms |
| `qs6` | 1460ms |
| `qs7` | 1740ms |

### WelcomeScreen — step-based timing

Uses a `step` integer (0–5) driven by `setTimeout` chains instead of CSS delay classes. Timing is explicit and cannot be accidentally re-triggered by re-renders.

Target pacing per spec:
```
Mascot appears       300ms
  — pause 600ms —
Greeting text        900ms
  — pause 1200ms —
Secondary text      2100ms
  — pause 1200ms —
Third text          3300ms
  — pause 600ms —
CTA appears         3900ms  ← interaction enabled
```

---

## Agent Introduction Flow

**Before:** Title + subtitle + agent line all appeared near-simultaneously via CSS stagger delays.

**After:** 4-step explicit sequence — nothing appears until the prior beat has settled:

```
Step 1  Agent mascot appears
Step 2  "Hello, I'm Glance."
Step 3  "I'd like to learn a little about you."
Step 4  "I'll ask a few quick questions."
Step 5  "Let's begin" CTA appears
```

Keyboard navigation is disabled until Step 5 to prevent accidental skips during the intro.

---

## Mascot Ambient Behavior

Two ambient layers added to `AgentMascot.tsx`, both CSS-only (no additional Rive states needed):

### Breathing (container animation)
- **Idle:** 3.2s asymmetric cycle — `scale(1.000) → 1.028 → 0.994`. The slight undershoot breaks predictability.
- **Looking:** 1.8s tighter cycle — `scale(1.060) → 1.080 → 1.052`. Faster, more alert.

### Gaze shifts (randomised scheduler)
Fires only when `agentMode` prop is `'idle'`:
1. Picks a random interval 6–14s
2. Temporarily switches to `'looking'` (triggers Rive "Looking Around" state)
3. Holds 1.2–1.8s (also randomised)
4. Returns to `'idle'` and reschedules

When the parent explicitly sets `agentMode='looking'`, the scheduler defers without interfering. Variation in both fire interval and hold duration means the behavior never feels mechanical.

---

## Button System Redesign

### Uniform height
All buttons: `height: 72px`, `padding: 0 52px`. No size difference between variants. One consistent physical target across the entire onboarding flow.

### Default (unfocused) state
All button variants render as low-emphasis outlines when not focused:

| Variant | Background | Border |
|---------|-----------|--------|
| `--primary` | `rgba(255,255,255,0.08)` | `rgba(255,255,255,0.18)` |
| `--secondary` | `rgba(255,255,255,0.05)` | `rgba(255,255,255,0.12)` |
| `--ghost` | `transparent` | `rgba(255,255,255,0.07)` |

### Focused state
Any focused button becomes white-filled primary with dark text and a white ring — regardless of its variant class. Focus determines primacy, not the variant name.

```css
.ob-btn.focused {
  background: #ffffff;
  color: #0e0820;
  border-color: #ffffff;
  transform: scale(1.03);
  box-shadow:
    0 0 0 4px rgba(2,1,8,0.90),   /* dark gap */
    0 0 0 7px #ffffff,             /* white ring */
    0 24px 70px rgba(255,255,255,0.18);
}
```

### Focus transition
Only the focused button's state transitions (180ms). The previously focused button loses `.focused` and transitions back to its default low-emphasis state. Both transitions are 180ms — only one element changes visually at a time. This matches Apple TV's focus model.

---

## Question Layout

**Before:** Two-column split — agent panel left (500px), tile grid/option list right. Felt like a web form.

**After:** Single-column centered layout using `.ob-convo-layout`.

Per-screen structure (top to bottom, all centered):
```
Agent mascot
Question title (64px)
Description (24px, 60% opacity)
[Selection badge — appears after first pick]
Options / tile grid
Actions column
```

No horizontal boundary. Everything reads vertically at TV viewing distance.

### WorldsQuestion
Tile grid: **4-column**, full-width (`max-width: 1440px`), all 8 tiles visible at once. No "Show more" pagination. The 4-col layout fits the 1920px canvas at legible tile sizes.

### DiscoveryAppetite
Option rows: **single-column centered list** (`max-width: 920px`). Larger targets, full readable width.

---

## Background Refinement

All gradient layers reduced in opacity and base colors pushed darker:

**Example — welcome step:**
- `rgba(112,71,226,0.28)` → `rgba(100,62,200,0.20)`
- `rgba(60,20,120,0.22)` → `rgba(50,14,100,0.16)`  
- Base darkest: `#06020e` → `#030108`

Purple hue preserved — brand direction unchanged. Luminosity reduced so white text pops more and the mascot's glow reads clearly against the darker field.

Subtle gradient drift, ambient orb float, and film grain remain active.

---

## Selfie Screen

Visual held pending Figma reference. Component is a correctly structured stub with stable architecture:

- **Props:** `onNext()` / `onSkip()` — do not change
- **Focus model:** `'upload' | 'skip' | 'continue'`
- **Keyboard handler:** arrow nav, enter, escape — all wired
- **Staged entrance:** `step` integer, same pattern as all other screens
- **Layout:** uses `.ob-convo-layout` — fits the single-column system

To redesign: replace the JSX inside `<main>` only. The prop types, state machine, and keyboard handler structure are correct and should remain.

---

## What Was Not Changed

- Feed screen and all overlays (deep-dive, polls, interstitials, settings) — unchanged
- TuningTransition (Made For You reveal) — unchanged
- All data files, logic engine, ranking, signals — unchanged
- Phase 2 L0 Glance components — unchanged
