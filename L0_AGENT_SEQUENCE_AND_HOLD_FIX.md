# L0 Agent Sequence + Screen Hold Fix

## Scope

Applied to: `demo_cold_start` route only (`/demo_cold_start`, `/demo-cold-start`).

Not applied to: main L0 feed, L0 preview, T2, T3, onboarding, production feed.

---

## Root Cause: Missing / Jumping Agent

### The timing race

In the original `l0Timeline.ts`, the mascot entrance tween and the reasoning typing start overlapped:

```
t = 1.35s  mascotIn label
t = 1.35s  mascot fade-in tween starts (duration 0.55s → completes at t=1.90s)
t = 1.73s  typingStart fires (mascotIn+=0.38) ← reasoning begins while mascot ~75% opaque
```

At 60fps, the frame at t=1.73s renders the mascot at roughly 70% opacity. The reasoning text begins revealing before the mascot is fully visible. On slower hardware (or during initial Rive canvas load), the mascot could still be at near-zero opacity when the first reasoning character appeared — making it look absent or as if it jumped directly into the CTA.

### The Bangalore card

The Bangalore card (`cs-balcony-escape`) is the first card in the cold-start feed. On the first card:

- The Rive mascot canvas must mount, load the `.riv` file, and initialize the state machine
- This adds ~50–120ms of real-world overhead vs subsequent cards
- Combined with the race above, the mascot was consistently invisible or just appearing when reasoning started

### The CTA jump

Because the mascot was not visually settled, the audience perceived it as: reasoning text appears → agent materializes inside the CTA. The FLIP arc was executing correctly, but without a visible pre-flight mascot the arc was invisible — it appeared as a direct jump.

---

## Fix: `coldStartL0Timeline.ts`

**File:** `src/animations/coldStartL0Timeline.ts`

Single change to the label offset:

```
Before: tl.addLabel('typingStart', 'mascotIn+=0.38')
After:  tl.addLabel('typingStart', 'mascotIn+=0.58')
```

`0.58s = 0.55s entrance duration + 3 frames at 60fps (0.05s) buffer`

Reasoning now starts only after the mascot entrance tween has fully completed. The mascot is fully opaque, fully positioned, and the Rive canvas has had at least one rendered frame before the first reasoning character appears.

---

## Confirmed Sequence (all three templates)

| Step | What happens | When |
|------|-------------|------|
| 1 | BG fades in + parallax | t=0 |
| 2 | Overlay fades in | t=0.4s |
| 3 | Header slides in (first card only) | t=0.9s |
| 4 | Tag fades up, title word-mask reveals | t=1.1s |
| 5 | **Mascot floats in at hero size** | t=1.35s |
| 6 | **Mascot entrance tween completes** | t=1.90s |
| 7 | **Reasoning appears + typing starts** | t=1.93s ← fixed |
| 8 | Reasoning typing completes | t=1.93s + 4.0s = 5.93s |
| 9 | 1s read pause | t=6.93s |
| 10 | Hero → final shrink | t=6.93s–7.83s |
| 11 | Agent looks toward CTA | t=7.68s |
| 12 | CTA pill slides in | t=8.33s |
| 13 | **Mascot FLIP arc into CTA** | t=8.73s–9.48s |
| 14 | Mascot settles in CTA slot | t=9.48s–9.70s |
| 15 | **CTA text reveals** | t=10.08s ← after mascot settled |
| 16 | CTA glow/beam activates | t=11.63s |
| 17 | `onTimelineComplete` fires | t=11.93s |
| 18 | **10s hold begins** | t=11.93s |
| 19 | Auto-advance to next card | t=21.93s |

---

## Template Audit

All three templates use the same `buildColdStartL0Timeline` function. The fix applies uniformly.

| Template | Mascot position | Fixed |
|----------|----------------|-------|
| `left` | Inline, left of reasoning text | Yes |
| `center` | Standalone above reasoning | Yes |
| `right` | Inline, right of reasoning text | Yes |

The center template additionally has a spacer collapse when the mascot leaves — this is unchanged and working correctly.

---

## 10-Second Hold Implementation

### Original behaviour

`FeedScreen` had a flat 12-second idle timer starting when the card mounted. This fired regardless of whether the animation had completed or was still running.

### New behaviour for `demo_cold_start`

1. `FeedScreen` gains two optional props:
   - `renderL0` — render override replacing `<L0Glance>` with any component
   - `idleMs` — configurable idle ceiling (defaults to 12000 for all other routes)

2. `ColdStartApp` passes:
   - `renderL0` → renders `ColdStartL0Glance` which fires `onTimelineComplete`
   - `idleMs={99999}` — effectively disables the flat timer

3. `ColdStartApp.handleTimelineComplete` starts a 10-second `setTimeout` when called. After 10 seconds with no user interaction, it calls `onNext`.

4. Any user interaction (`thumbsUp`, `thumbsDown`, `contextualYes`, `l1Exit`, `interstitialAnswer`, `feedNav`) calls `cancelHold()` which clears the timer.

The flat idle timer in FeedScreen is still present as a ceiling guard — it just never fires in practice because 99,999ms is far beyond any session.

---

## Files Changed

| File | Type | Change |
|------|------|--------|
| `src/animations/coldStartL0Timeline.ts` | New | Fixed timeline with `typingStart` at `mascotIn+=0.58`, `onTimelineComplete` callback |
| `src/components/L0/ColdStartCinematicL0.tsx` | New | Clone of CinematicL0 using `buildColdStartL0Timeline`, accepts `onTimelineComplete` prop |
| `src/components/L0/ColdStartL0Glance.tsx` | New | Entry-point wrapper, delegates to `ColdStartCinematicL0` |
| `src/ColdStartApp.tsx` | Modified | Wires `renderL0`, `idleMs=99999`, `handleTimelineComplete` (10s hold) |
| `src/components/Feed/FeedScreen.tsx` | Modified | Adds optional `renderL0` render prop + `idleMs` prop (defaults to 12000, no behaviour change for other routes) |

---

## What Was Not Changed

- `src/animations/l0Timeline.ts` — main feed timeline unchanged
- `src/components/L0/CinematicL0.tsx` — main feed component unchanged
- `src/components/L0/L0Glance.tsx` — main feed entry point unchanged
- Copy, images, layout, typography, CTA styling, reasoning animation style, product cards
- T2, T3, onboarding, L0 preview, all other routes
