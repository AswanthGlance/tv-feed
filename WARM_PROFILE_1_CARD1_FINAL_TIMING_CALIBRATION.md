# Warm Profile 1 — Card 1 Final Timing Calibration

Applied to: `/warm_profile_1`, Card 1 (`ws-india-afg`) only.

---

## Objective

The card should feel deliberate, premium, cinematic.

The user must have time to read, process, and understand each stage before the next begins.

No stage overlaps any other. Every phase completes fully before the next starts.

---

## Signal Timing

### Signal 1

| Event | Time |
|---|---|
| Reveal starts | 0ms |
| Reveal completes (3200ms blur→sharp) | 3200ms |
| Dots appear (waiting indicator) | 3200ms |
| **5-second hold** | 3200ms – 8200ms |
| Dots hide, Signal 1 shifts up, Signal 2 enters | 8200ms |

### Signal 2

| Event | Time |
|---|---|
| Reveal starts (fade in + blur→sharp, 3200ms) | 8200ms |
| Reveal completes | 11400ms |
| Dots appear | 11400ms |
| **5-second hold** | 11400ms – 16400ms |
| Dots hide, exit sequence begins | 16400ms |

### Signal Exit (sequential, no overlap)

| Event | Time |
|---|---|
| Signal 1 fades out (700ms) | 16400ms – 17100ms |
| Signal 2 fades out (700ms) | 17100ms – 17800ms |
| Both signals gone | 17800ms |

---

## Reasoning Timing

| Event | Time |
|---|---|
| Gap after signals exit (400ms) | 17800ms – 18200ms |
| Reasoning reveal starts | 18200ms |
| Reveal duration (7000ms — very slow) | 18200ms – 25200ms |
| **5-second hold** after reasoning fully visible | 25200ms – 30200ms |
| `onSequenceDone` fires → CTA sequence begins | 30200ms |

The 5-second post-reasoning hold is silent. No animation. No agent movement. The user reads.

---

## CTA Timing

After `onSequenceDone` fires, the GSAP timeline seeks to `heroShrink` and the standard CTA sequence plays:

| Stage | Duration |
|---|---|
| Agent looks toward CTA | 0.65s |
| CTA pill slides in | 0.46s |
| Mascot arc-flip into CTA | 0.75s |
| Mascot settles, CTA text reveal starts | 0.38s delay |
| CTA text reveal | **3000ms** (slowed from 1400ms standard) |
| Beam/glow activates | 0.15s after text done |
| `onTimelineComplete` fires | 0.30s after beam |

---

## Final Hold

`HOLD_AFTER_COMPLETE_MS = 10_000` in `WarmProfile1App.tsx`.

After `onTimelineComplete` fires:
- Reasoning visible
- CTA visible  
- Agent inside CTA
- Everything settled
- 10-second hold before auto-advance to Card 2

No changes required — this was already correct.

---

## Total Card Duration (approximate)

```
Mascot entrance:      ~2.0s
Signal 1 + hold:      8.2s
Signal 2 + hold:      8.2s
Signal exit:          1.4s
Reasoning + hold:     12.0s
CTA sequence:         ~6.0s
Final hold:           10.0s
─────────────────────────────
Total:                ~47.8s
```

---

## Files Changed

| File | Change |
|---|---|
| `src/components/L0/SignalDecisionReasoning.tsx` | `PAUSE_AFTER_SIGNAL_1` 800→5000, `PAUSE_AFTER_SIGNAL_2` new 5000, `RESOLVE_MS_SIGNAL_2` 2800→3200, `SIGNAL_FADE_MS` 500→700, `RESOLVE_MS_REASONING` 5500→7000, `PAUSE_AFTER_REASONING` 800→5000 |
| `src/components/L0/WarmProfile1CinematicL0.tsx` | `SEQUENCE_DURATION_MS` 21000→33000; `CTA_RESOLVE_MS` 2800→3000 |

---

## Unchanged

- Signal copy and highlights
- Reasoning copy and highlights
- Waiting dots animation (pulse pattern)
- Signal stack motion (Signal 1 shifts up, Signal 2 enters from original position)
- CTA copy ("Set a reminder for first ball?")
- CTA entrance animation (mascot arc, pill expand, beam)
- Cards 2–8 on `/warm_profile_1`
- `demo_warm_start`, cold start, main L0 feed, onboarding
