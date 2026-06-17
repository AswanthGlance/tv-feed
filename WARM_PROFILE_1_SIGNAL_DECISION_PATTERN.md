# Warm Profile 1 — Signal → Decision Animation Pattern

Applied to: `/warm_profile_1`, Card 1 (`ws-india-afg`) only.
All other cards, routes, and feeds are unchanged.

---

## Signal Sequence

Four signals appear one at a time. Each uses GlanceTextReveal (blur→sharp, same as all other Glance text). No cursor. No typewriter.

| # | Signal text | Timing |
|---|---|---|
| 1 | You've been on IPL highlights almost every other evening since late March. | Reveal 1.2s → hold 1s → fade 280ms |
| 2 | You liked three RCB cards this season. | Reveal 1.2s → hold 1s → fade 280ms |
| 3 | You bookmarked the Anil Kumble coaching long-read. | Reveal 1.2s → hold 1s → fade 280ms |
| 4 | In March, you asked me about T20 fantasy team construction, and I've been keeping that thread in mind. | Reveal 1.2s → hold 1s → fade 280ms |

Only one signal is visible at any time. Each fades out before the next appears (200ms gap between).

---

## Decision Moment

After signal 4 fades:

> **So I brought this forward**

Larger font (`clamp(22px, 2.8vw, 44px)`), bold weight, high contrast white with a faint purple glow. Same GlanceTextReveal reveal, 1.8s total. Holds for 1.5s to let it land.

---

## Recommendation Section

After the decision hold:

> India vs Afghanistan is at the Chinnaswamy tonight at 7 PM. It's the last group-stage fixture before the knockouts, and it felt like exactly the kind of match you'd want to know about early.

Smaller supporting size (`clamp(14px, 1.55vw, 24px)`). Stays visible — does not fade out. Two highlights pulse in purple: "Chinnaswamy tonight at 7 PM" and "last group-stage fixture before the knockouts".

---

## CTA Timing

After the recommendation appears (~600ms), `onSequenceDone` fires. This triggers `heroShrinkCallbackRef` in the parent, which seeks the GSAP timeline past its long wait to the `heroShrink` label. From there the standard CTA entrance plays:

1. Mascot shrinks from hero size to final size
2. Agent looks toward CTA
3. CTA pill slides in
4. Mascot arc-flips into CTA
5. CTA text reveals: **Set a reminder for first ball?**
6. CTA glow / beam activates
7. `onTimelineComplete` fires → 10s hold before auto-advance

---

## Full Sequence Summary

```
BG + title appear
↓
Mascot floats in (hero size)
↓
Signal 1 → blur→sharp → hold → fade
↓
Signal 2 → blur→sharp → hold → fade
↓
Signal 3 → blur→sharp → hold → fade
↓
Signal 4 → blur→sharp → hold → fade
↓
"So I brought this forward" (large, bold)
↓  holds 1.5s
Recommendation appears + stays
↓  ~600ms
onSequenceDone → GSAP seek to heroShrink
↓
Mascot + reasoning scale down
↓
Agent looks → CTA pill enters
↓
Mascot arc-flips into CTA
↓
CTA text reveals: "Set a reminder for first ball?"
↓
CTA glow activates
↓
10s hold → auto-advance
```

Total reasoning sequence: ~19–20s before CTA fires.

---

## Files Changed

| File | Change |
|---|---|
| `src/components/L0/SignalDecisionReasoning.tsx` | New component — manages signal/decision/recommendation phases internally via `setTimeout` chains + `GlanceTextReveal` |
| `src/components/L0/WarmProfile1CinematicL0.tsx` | New cinematic component — forks `ColdStartCinematicL0`, swaps `<p reasoning>` for `<SignalDecisionReasoning>`, wires `onSequenceDone` → GSAP timeline seek |
| `src/components/L0/WarmProfile1L0Glance.tsx` | New router — sends `ws-india-afg` to `WarmProfile1CinematicL0`, all other IDs to `ColdStartL0Glance` |
| `src/WarmProfile1App.tsx` | Import swapped from `ColdStartL0Glance` → `WarmProfile1L0Glance`; `renderL0` prop updated |

No changes to `demo_warm_start`, cold start, onboarding, main feed, T2, or T3.
