# Warm Profile 1 — Card 1 Signal Stack Refinement

Applied to: `/warm_profile_1`, Card 1 (`ws-india-afg`) only.

---

## Signal Stack Motion

Signals no longer stack by revealing one below the other.

New pattern — "precise stacked intelligence UI":

1. Signal 1 reveals at the baseline position
2. Signal 1 shifts upward (GSAP tween, 400ms, ease: power2.inOut)
3. Signal 2 fades in from Signal 1's original position and begins its reveal

Signal 1 moves **up** to make room. Signal 2 appears **from where Signal 1 was**.

This creates the feel of a live intelligence layer being built item by item.

---

## Keyword Highlights

Both signals now highlight key terms using `GlanceTextReveal`'s `highlights` prop
(bold weight + purple glow, same treatment as reasoning highlights).

| Signal | Highlighted terms |
|---|---|
| Signal 1 | `IPL highlights`, `late March` |
| Signal 2 | `RCB cards` |
| Reasoning | `Chinnaswamy tonight at 7 PM`, `last group-stage fixture before the knockouts` |

---

## Three-Dot Waiting Animation

A `WaitingDots` component renders three small pulsing dots below each signal's text.

| When | Dots behaviour |
|---|---|
| After Signal 1 fully reveals | Dots appear below Signal 1; pulse during the 800ms pause |
| Signal 1 starts shifting | Dots on Signal 1 disappear |
| After Signal 2 fully reveals | Dots appear below Signal 2; pulse during the 3500ms hold |
| Hold ends / exit begins | Dots on Signal 2 disappear |

The dots indicate "the agent is thinking / there is more coming." They do not appear during the reasoning phase.

---

## Exit Order

Signals exit **sequentially**, not simultaneously:

1. Signal 1 fades out (500ms)
2. Signal 2 fades out (500ms), after Signal 1 is gone
3. Reasoning reveal begins (300ms gap after Signal 2 gone)

---

## Full Timing

```
0ms      Signal 1 reveal starts (3200ms)
3200ms   Signal 1 fully visible — dots appear
4000ms   Dots hide; Signal 1 shifts upward (400ms); Signal 2 fades in + starts revealing (2800ms)
7200ms   Signal 2 fully visible — dots appear
10700ms  Hold ends → dots hide; Signal 1 fades (500ms)
11200ms  Signal 2 fades (500ms)
11700ms  Both signals gone
12000ms  Reasoning reveal starts (5500ms — very slow, cinematic)
17500ms  Reasoning fully revealed
18300ms  onSequenceDone fires (800ms pause)
```

Total before CTA: ~18.3s. `SEQUENCE_DURATION_MS` set to `21000` (ceiling).

---

## CTA Text Reveal

Slowed from standard 1400ms to **2800ms** — more deliberate, matches the pacing of the rest of the sequence.

---

## Files Changed

| File | Change |
|---|---|
| `src/components/L0/SignalDecisionReasoning.tsx` | Full rewrite v5: stack motion, highlights on all signals, WaitingDots component, sequential exit, slower reasoning |
| `src/components/L0/WarmProfile1CinematicL0.tsx` | `SEQUENCE_DURATION_MS` 18000 → 21000; `CTA_RESOLVE_MS` 1400 → 2800 |

---

## Unchanged

- Signal copy
- Reasoning copy
- Title, image, tag, layout
- CTA copy ("Set a reminder for first ball?")
- CTA entrance animation (mascot arc, pill expand, beam, complete callback)
- Cards 2–8 on `/warm_profile_1`
- `demo_warm_start`, cold start, main feed, onboarding
