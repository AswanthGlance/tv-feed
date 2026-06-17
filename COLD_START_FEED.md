# Cold Start Feed

## Route

`/demo_cold_start` or `/demo-cold-start`

Both paths resolve to the same experience.

---

## What This Is

A standalone feed variant representing a user who skipped onboarding. Glance knows nothing about the user. The feed uses 11 curated starter cards anchored to:

- **City**: Bangalore
- **Weather**: Monsoon
- **Time**: Morning
- **User signal**: none (cold start)

---

## Content Source

`Cold Start Content/Glance_TV_Cold_Start_Content_v2.docx`

Subtext lines from the document are intentionally excluded per spec. The structure on each card is:

```
Tag
↓
Title
↓
Reasoning
↓
CTA
```

---

## Image Source

`Cold Start Content/` folder. Images are copied to:

`public/images/cold-start/`

---

## Card Mapping

| Position | Card ID               | Title                              | Image file                   | Layout  |
|----------|-----------------------|------------------------------------|------------------------------|---------|
| 1        | cs-balcony-escape     | The Balcony Escape                 | balcony-escape.webp          | left    |
| 2        | cs-gond-art           | A Morning at the Easel — Gond Art  | gond-art.webp                | center  |
| 3        | cs-gold-stack         | Layer a Gold Stack                 | layer-gold-stack.jpg         | right   |
| 4        | cs-monsoon-football   | Monsoon Football                   | monsoon-football.webp        | left    |
| 5        | cs-mysore-bonda       | The Mysore Bonda Morning           | mysore-bonda.webp            | center  |
| 6        | *(preference card)*   | *(placeholder — see below)*        | —                            | —       |
| 7        | cs-shivanasamudra     | The Roar of Shivanasamudra         | roar-sivanasamudra.webp      | right   |
| 8        | cs-vidhana-soudha     | Silence of Vidhana Soudha          | silence-vidhana-soudha.webp  | left    |
| 9        | cs-sunnys             | Breakfast at Sunny's               | sunnys-lavelle-road.jpg      | center  |
| 10       | cs-pour-over          | Taste Bangalore's Pour Over        | taste-pour-over.webp         | left    |
| 11       | cs-therpup            | A Morning at TherPUP               | therpup-cafe.webp            | right   |
| 12       | cs-vinyasa-cubbon     | A Vinyasa Flow in Cubbon           | vinyasa-flow.webp            | center  |

---

## Preference Card Insertion

The preference card is inserted at position 6 (after 5 L0 cards) by `composeFeedWithPreferences()` in `src/logic/feedComposer.ts`.

**Current placeholder**: `INTERSTITIAL_QUESTIONS[0]` from `src/data/preferenceQuestions.ts` (the "food picks" card). Replace this placeholder in `ColdStartApp.tsx` when the actual cold-start preference card content is provided.

```ts
// ColdStartApp.tsx — line to update when real content is ready
const COLD_START_PREFERENCE_QUESTIONS = [INTERSTITIAL_QUESTIONS[0]];
```

---

## Reasoning Text

All cold-start reasoning is registered in `src/logic/reasoningEngine.ts` under `itemOverrides` — keyed by card ID. The reasoning text comes directly from the content document (the "why now" column).

Each reasoning string contains exactly one `. ` so the two-line typewriter reveal splits correctly.

---

## Files Changed

| File | Change |
|------|--------|
| `src/main.tsx` | Added `isColdStart` route check + `ColdStartApp` import |
| `src/ColdStartApp.tsx` | **New** — standalone app for `/cold-start` |
| `src/data/coldStartFeedItems.ts` | **New** — 11 `FeedItem` objects |
| `src/config/glanceConfig.ts` | Added layout entries for all 11 `cs-*` card IDs |
| `src/logic/reasoningEngine.ts` | Added `itemOverrides` and `itemHighlights` for all 11 `cs-*` cards |
| `public/images/cold-start/` | **New folder** — 11 images from content folder |

---

## What Is Unchanged

- Existing L0 feed (`/`)
- Onboarding flow
- L0 preview (`?preview=...`)
- T2 (`/t2-fashion`)
- T3 (`/t3`)
- All animation, transition, typography, mascot, and CTA logic
