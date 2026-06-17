# Warm Profile 1 — Card 1 Timing Refinement

Applied to: `/warm_profile_1`, Card 1 (`ws-india-afg`) only.

---

## Design Intent

> Memory → Memory → Reflection → Recommendation → Action

Each phase completes fully before the next begins. Nothing overlaps.

---

## New Signal Sequence

```
0ms      Signal 1 reveal starts (2800ms spread — slow, deliberate)
2800ms   Signal 1 fully visible — pause
4000ms   Signal 2 reveal starts (2400ms); Signal 1 stays, dims slightly (0.88 → 0.72 wrapper opacity)
6400ms   Signal 2 fully visible — both held together
9900ms   Hold ends → both fade away together (600ms fade)
10500ms  Signals gone
10800ms  Reasoning reveal starts (300ms gap)
15800ms  Reasoning fully revealed (~5000ms spread — slower than standard)
16500ms  onSequenceDone fires (700ms pause after reasoning done)
```

Total sequence before CTA: ~16.5s.

---

## Key Changes vs v2

| Dimension | v2 | v3 |
|---|---|---|
| Signal presentation | Both start nearly simultaneously (700ms stagger while revealing) | Signal 1 fully reveals first, pause, then Signal 2 appears below |
| Signal 1 when Signal 2 appears | Full opacity (both at same level) | Slightly dimmed (wrapper: 0.72 opacity) — "remembered signal" |
| Hold after both visible | 2500ms | 3500ms |
| Fade duration | 400ms | 600ms |
| Reasoning spread | 4000ms (standard) | 5000ms (slower) |
| `onSequenceDone` timing | 400ms after reasoning **starts** (bug: fired 3600ms early) | After reasoning **fully completes** + 700ms pause |
| Signal text opacity | 0.62 | 0.88 (more readable) |

---

## onSequenceDone Fix

Previous `DONE_AFTER_REASONING = 400` fired the callback 400ms after reasoning **started** —
meaning CTA entrance began 3600ms before reasoning text finished revealing.

Fix: `GlanceTextReveal.onDone` now fires `onSequenceDone` via `handleReasoningDone`, which
adds a 700ms pause AFTER the last character resolves. No timer races, no overlap.

---

## SEQUENCE_DURATION_MS

Updated in `WarmProfile1CinematicL0.tsx`: `11000 → 18000` to match the new ~16.5s sequence.
This is a ceiling passed to GSAP as `typingDuration`; `heroShrink` is still triggered manually
via `onSequenceDone → heroShrinkCallbackRef`.

---

## Unchanged

- Signal text copy
- Reasoning text copy and highlights
- Title, image, tag, CTA copy, layout
- CTA animation (mascot arc, pill expand, beam, complete callback)
- Cards 2–8 on `/warm_profile_1`
- `demo_warm_start`, cold start, main feed, onboarding

---

## Files Changed

| File | Change |
|---|---|
| `src/components/L0/SignalDecisionReasoning.tsx` | Full rewrite v3: sequential signals, Signal 1 de-emphasis, longer holds, reasoning `onDone` hook, higher opacity |
| `src/components/L0/WarmProfile1CinematicL0.tsx` | `SEQUENCE_DURATION_MS` 11000 → 18000 |
