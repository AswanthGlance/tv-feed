# L0 Feed System Implementation

## Summary

The cinematic L0 animation system (previously only active for `eatly-dawn`) now powers every card in the feed. All three layout templates share one component and one GSAP timeline.

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/L0/L0Glance.tsx` | Simplified to a thin router — resolves alignment + showProducts from config, delegates to CinematicL0 |
| `src/components/L0/CinematicL0.tsx` | Rewritten to support `alignment: left \| center \| right` and `showProducts: boolean` |
| `src/animations/l0Timeline.ts` | Added `alignment` + `showProducts` params; transform-origin and scale-origin are alignment-aware |
| `src/components/Feed/FeedScreen.tsx` | Removed duplicate header, background crossfade divs, and standalone clock state — all now owned by CinematicL0 |
| `src/components/L0/GlanceLayout.tsx` | No longer used in the feed path (kept as dead code; safe to delete later) |

---

## Architecture

```
FeedScreen
  └── L0Glance (resolves config)
        └── CinematicL0 (alignment, showProducts)
              ├── Header (logo left, time/date right)
              ├── BG + overlay (GSAP parallax)
              ├── TAG chip
              ├── TITLE (word-mask reveal → shrink)
              ├── MASCOT float → FLIP into CTA
              ├── REASONING (typing + highlights)
              ├── CTA pill (typing + purple glow)
              └── PRODUCT CARDS (left/center only)
```

---

## Template Rules

| Prop | left | center | right |
|------|------|--------|-------|
| `alignment` | `'left'` | `'center'` | `'right'` |
| `showProducts` | `cardCount > 0` | `cardCount > 0` | always `false` |
| Content position | bottom-left | bottom-center | bottom-right |
| Products | right edge | right edge | none |
| Overlay gradient | left-side scrim | left-side scrim | right-side scrim |
| Title transform-origin | `left bottom` | `center bottom` | `right bottom` |
| Reasoning transform-origin | `left top` | `center top` | `right top` |

---

## Animation Order (identical for all three templates)

1. BG fade-in + parallax scale
2. Dark overlay
3. Header slide down
4. Tag chip (opacity + y)
5. Title word-mask reveal (stagger per word)
6. Title scale-down + tag follows synchronously
7. Mascot float in
8. Reasoning fade-in + typing starts
9. Mascot FLIP into CTA slot → CTA label types
10. Purple glow activates behind CTA
11. Product cards (left + center only): spread → stack

---

## Config-driven product visibility

Defined in `src/config/glanceConfig.ts` per item:

```ts
'eatly-dawn': { layout: 'left', cardCount: 2, cinematicTitle: true }  // shows products
'feed-01':    { layout: 'left' }                                        // cardCount defaults to 2
'feed-02':    { layout: 'center', cardCount: 0 }                       // no products
'feed-05':    { layout: 'right' }                                       // right = never products
```

`L0Glance` resolves `showProducts = alignment !== 'right' && cardCount > 0`.

---

## Header

All feed L0s now use the CinematicL0 header:
- Left: Glance logo PNG (`/public/glance-logo.png`)
- Right: weather · date · `time AM/PM` (all same font size, full white for time)
- Animated by GSAP (slide down at step 3)

FeedScreen no longer renders its own header or background.

---

## Preview Route

`/l0-preview.html` is preserved unchanged. It boots `L0PreviewApp` → `L0Glance` with `eatly-dawn`, which now goes through the same unified CinematicL0. The preview continues to reflect production behavior exactly.

---

## Known Limitations

- `GlanceLayout.tsx`, `AgentReasoning.tsx`, `ProductRail.tsx`, and `MascotLayer.tsx` are no longer in the active render path. They can be deleted in a future cleanup pass.
- `cinematicTitle` flag in glanceConfig is now ignored (all items use CinematicL0). The field can be removed from the config type in a future pass.
- Right-aligned items with `cardCount > 0` in config will have their products suppressed silently (by design — right = no products rule).
