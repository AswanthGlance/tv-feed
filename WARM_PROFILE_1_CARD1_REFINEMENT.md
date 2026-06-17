# Warm Profile 1 — Card 1 Reasoning Refinement

Applied to: `/warm_profile_1`, Card 1 (`ws-india-afg`) only.

---

## Removed: Decision Screen

"So I brought this forward" has been removed entirely.
No decision headline appears in the sequence.

---

## Signal Reduction: 4 → 2

Previous version showed 4 signals sequentially (each replacing the last).
Now only 2 signals are used — the strongest for this card:

| # | Signal |
|---|---|
| 1 | You've been on IPL highlights almost every other evening since late March. |
| 2 | You liked three RCB cards this season. |

Signals 3 and 4 (Anil Kumble long-read, fantasy team chat) removed.

---

## Signal Presentation: Sequential → Simultaneous

Previous: signals replaced each other one at a time.

New: both signals are visible together, stacked vertically.

Signal 1 reveals first. Signal 2 starts revealing 700ms later.
Neither fades until both are fully revealed and the hold expires.

---

## New Timing

```
0ms       Signal 1 reveal starts (2200ms spread — slow, readable)
700ms     Signal 2 reveal starts (2000ms spread — staggered start)
2700ms    Both fully revealed
5200ms    Hold ends (2500ms hold after both are revealed)
5600ms    Both signals faded away together (400ms fade)
5800ms    Reasoning reveal starts (200ms gap)
9800ms    Reasoning fully revealed (~4000ms spread)
10200ms   onSequenceDone fires → CTA entrance begins
```

Total sequence before CTA: ~10.2s (down from ~20s).

---

## Animation Notes

- Signals and reasoning all use `GlanceTextReveal` (blur→sharp character reveal)
- Signal reveal speed: 2200ms / 2000ms — intentionally slower than before for comfortable reading
- Signals fade simultaneously via a single GSAP opacity tween on their shared container
- Reasoning uses the standard `RESOLVE_MS_REASONING` (4000ms spread)
- The reasoning container uses an invisible spacer div so the layout height stays stable when switching from signals to reasoning

---

## Unchanged

- Title: "India vs Afghanistan, Tonight"
- Tag, image, card layout, design language
- CTA copy: "Set a reminder for first ball?"
- CTA animation (mascot arc, pill expand, text reveal, beam)
- Cards 2–8 on `/warm_profile_1`
- `demo_warm_start`, cold start, main feed, onboarding, T2, T3

---

## Files Changed

| File | Change |
|---|---|
| `src/components/L0/SignalDecisionReasoning.tsx` | Full rewrite: removed decision screen, reduced to 2 simultaneous signals, updated timing chain |
| `src/components/L0/WarmProfile1CinematicL0.tsx` | `SEQUENCE_DURATION_MS` updated from 19800 → 11000 to match new sequence length |
