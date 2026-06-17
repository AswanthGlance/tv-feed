# Preference Option Cleanup

Removed "Explore more" from all in-feed preference collection cards.
Replaced with genuine 4th preference options per card.

---

## What Changed

### Rule Enforced

Every option on a preference card must represent an interest, taste, or direction — not a navigation action.

"Explore more" was a utility shortcut that triggered `onDismiss()`. It has been removed.

---

## Files Changed

### `src/data/preferenceQuestions.ts`

All 6 interstitial questions previously had 3 options, which triggered the `showExplore` fallback in the UI. Each question now has 4 genuine preference options.

| Question | New 4th Option | Signal |
|---|---|---|
| `food-picks` | Street food | `subCategories: ['street-food', 'chai', 'local-food']` |
| `dinner-table` | Quick and healthy | `subCategories: ['healthy', 'plant-based', 'fresh']` |
| `which-trip` | A coastal escape | `subCategories: ['coast', 'goa', 'india-travel']` |
| `evening-feel` | Watching live sport | `subCategories: ['cricket', 'football', 'stadium-energy']` |
| `home-moment` | Curated and premium | `vibes: ['luxury', 'premium', 'minimal']` |
| `which-view` | Backwaters & coast | `subCategories: ['kerala', 'coast', 'india-travel']` |

### `src/components/Polls/InterstitialQuestion.tsx`

Removed:
- `showExplore` computed variable (`totalOpts <= 3`)
- `totalCols = showExplore ? totalOpts + 1 : totalOpts` → simplified to `totalCols = totalOpts`
- The `showExplore &&` JSX block (dashed card with "Explore more" / "Show me other options")
- Keyboard handler branch: `if (focusIdx === totalOpts) { onDismiss(); return; }`

---

## What Was NOT Changed

- Card design, sizing, spacing, typography
- Entrance and celebration animations (FLIP technique)
- Selection behavior
- Acknowledgement flow (agent reply, Done button)
- Multi-select mode
- Auto-dismiss behavior
- Onboarding, T2, T3, main L0 templates
