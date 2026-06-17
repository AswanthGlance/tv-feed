# Warm Profile 1 — Center Template Signal Stack Fix

**Route:** `/warm_profile_1`
**Cards affected:** `ws-om-beach` (Card 3), `ws-wind-down` (Card 6)
**Date:** 2026-06-17

---

## Problem

Center template had signals and reasoning rendered **above** the mascot, in a separate block. The mascot sat below with no visible connection to the text. The user had to infer who was speaking. The mascot was not the anchor.

---

## Center Template Flow (fixed)

```
Agent (mascot) — always visible at top
      ↓
Signal 1 appears below mascot  →  hold  →  shifts upward past mascot (history)
Signal 2 appears below mascot  →  hold  →  shifts upward past mascot (joins history)
Signals exit (fade sequentially)
      ↓
Reasoning appears below mascot  →  hold  →  shifts upward + fades  →  onSequenceDone
      ↓
CTA
```

At every stage the mascot is the visual anchor. Active text is always below the mascot. Completed text floats above as memory.

---

## Signal Positioning Rules

| Stage | Active text position | Mascot position |
|---|---|---|
| S1 reveal | Below mascot | Above S1 |
| S1 hold (dots) | Below mascot | Above S1 |
| S1 → history | Shifts upward past mascot | Stays |
| S2 reveal | Below mascot (S1's original slot) | Above S2 |
| S2 hold (dots) | Below mascot | Above S2 |
| S2 → history | Shifts upward past mascot | Stays |
| Both exit | Fade at history position | Stays |
| Reasoning reveal | Below mascot | Above reasoning |
| Reasoning hold | Below mascot | Above reasoning |
| Reasoning → history | Shifts upward + fades | Stays |
| CTA | Below mascot | Mascot arcs into CTA |

---

## Mascot/Text Relationship Rules

- Mascot is always the speaker. The active text is always adjacent to (below) the mascot.
- Completed thoughts shift upward past the mascot — stored as memory above.
- The mascot never disappears behind text.
- `mascotClearancePx = MASCOT_HERO_SIZE + 18` — the Y shift amount needed to clear the mascot row. Items shift by `-(itemHeight + mascotClearancePx)`.

---

## Reasoning Positioning

- Reasoning appears in the same position as signals (below the mascot).
- After the full `PAUSE_AFTER_REASONING` hold, reasoning shifts upward past the mascot and fades over `500ms`.
- `onSequenceDone` fires when the shift completes — triggering the CTA sequence.

---

## Glow Fix

The mascot glow element uses `inset: -size * 0.15` to extend outside the mascot bounding box. Parent containers with `overflow: hidden` were clipping it into a visible square mask.

Fixed by setting `overflow: visible` on:
- `mascotSpacerRef` wrapper (center)
- `mascotFloatRef` wrapper (center)
- `mascotFloatRef` wrapper (left/right) — was `overflow: hidden`

---

## Font Size Reduction on Shrink

When `handleSequenceDone` fires (mascot begins its hero→final shrink), `textShrinking` state is set to `true`. The `reasoningRef` wrapper transitions:

```
transform: scale(1.0) → scale(0.88)
transition: 0.85s cubic-bezier(0.4,0,0.2,1)
```

Same duration as the GSAP mascot shrink (0.85s). `transformOrigin` is `center top` for center, `left top` / `right top` for left/right layouts. This makes the text feel like it's settling into a smaller reading mode alongside the mascot.

---

## Files Changed

| File | Change |
|---|---|
| `src/components/L0/CenterSignalDecisionReasoning.tsx` | NEW — center-only signal stack component with upward shift behavior |
| `src/components/L0/WarmProfile1CinematicL0.tsx` | Center DOM restructured: mascot first, signals below; glow overflow fixed; `textShrinking` state added for font scale transition |

## Files Not Changed

- `SignalDecisionReasoning.tsx` — left/right behavior unchanged
- `warmCardSignalData.ts` — content unchanged
- `WarmProfile1App.tsx` — no changes
- Timing constants — identical to left/right
- CTA copy, titles, images, card order
