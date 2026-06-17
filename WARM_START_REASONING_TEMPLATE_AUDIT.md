# Warm Start Reasoning Template — Audit

**Audits against:** `WARM_START_REASONING_TEMPLATE.md` v1.0  
**Card audited:** Card 1 — `ws-india-afg` — India vs Afghanistan, Tonight  
**Route:** `/warm_profile_1`  
**Date:** 2026-06-17

This document verifies that Card 1's implementation matches the template exactly, and records every deliberate deviation.

---

## Section 2 — Content Structure

| Rule | Card 1 | Status |
|---|---|---|
| Exactly 2 signals | 2 | ✓ |
| Exactly 1 reasoning block | 1 | ✓ |
| Exactly 1 CTA | 1 | ✓ |
| Signals not shown simultaneously | Signal 1 shown, then Signal 2 appears after shift | ✓ |

---

## Section 3 — Signal Rules

### Signal 1
> "You've been on IPL highlights almost every other evening since late March."

| Rule | Assessment | Status |
|---|---|---|
| One sentence | Yes | ✓ |
| Personal — uses "you" | Yes | ✓ |
| Specific — names content and time frame | Names content (IPL highlights) and time window (late March) | ✓ |
| No jargon | Clean | ✓ |
| Highlights | `IPL highlights`, `late March` | ✓ |
| Source type | Viewing / engagement history | ✓ |

### Signal 2
> "You liked three RCB cards this season."

| Rule | Assessment | Status |
|---|---|---|
| One sentence | Yes | ✓ |
| Personal — uses "you" | Yes | ✓ |
| Specific — names content and quantity | Names content (RCB cards) and count (three) | ✓ |
| No jargon | Clean | ✓ |
| Highlights | `RCB cards` | ✓ |
| Varied structure from Signal 1 | Signal 1: "You've been on…", Signal 2: "You liked…" — different verbs | ✓ |
| Source type | Explicit action (like) | ✓ |

---

## Section 4 — Signal Animation

| Rule | Implementation | Status |
|---|---|---|
| Signal 1 reveal: blur → sharp | `GlanceTextReveal`, `resolveMs: 3200` | ✓ |
| Hold after Signal 1: 5 seconds | `PAUSE_AFTER_SIGNAL_1 = 5000` | ✓ |
| Signal 1 shifts upward | GSAP `y: -(s1El.offsetHeight + 18)`, 500ms, `power2.inOut` | ✓ |
| Signal 2 appears at Signal 1's original position | `position: absolute; top: 0` — starts where Signal 1 was | ✓ |
| Signal 2 fades in (opacity 0 → 1) | `gsap.to(s2El, { opacity: 1, duration: 0.30 })` | ✓ |
| Signal 2 reveal: blur → sharp | `GlanceTextReveal`, `resolveMs: 3200` | ✓ |
| Hold after Signal 2: 5 seconds | `PAUSE_AFTER_SIGNAL_2 = 5000` | ✓ |
| Signal 1 dims to 0.58 when Signal 2 enters | `opacity: 0.58` in shift tween | ✓ |
| Waiting dots after Signal 1 | `dotsAfterS1` state → `WaitingDots` component | ✓ |
| Waiting dots after Signal 2 | `dotsAfterS2` state → `WaitingDots` component | ✓ |
| Dots disappear before phase transition | `setDotsAfterS1(false)` / `setDotsAfterS2(false)` before GSAP tweens | ✓ |

---

## Section 5 — Signal Exit

| Rule | Implementation | Status |
|---|---|---|
| Signal 1 fades first | `SIGNAL_1_FADE_START_MS = 16400ms` | ✓ |
| Signal 2 fades after Signal 1 gone | `SIGNAL_2_FADE_START_MS = 17100ms` (= S1 fade start + 700ms) | ✓ |
| No simultaneous exit | Sequential `setTimeout` timers — no overlap | ✓ |
| 400ms gap before reasoning | `GAP_BEFORE_REASONING = 400` | ✓ |
| Fade duration per signal | `SIGNAL_FADE_MS = 700` | ✓ |

---

## Section 6 — Reasoning Rules

> "India vs Afghanistan is at the Chinnaswamy tonight at 7 PM. It's the last group-stage fixture before the knockouts, and it felt like exactly the kind of match you'd want to know about early."

| Rule | Assessment | Status |
|---|---|---|
| 1–2 sentences | 2 sentences | ✓ |
| Present-tense for the event | "is at the Chinnaswamy tonight" — present | ✓ |
| Does not repeat signals verbatim | No mention of "IPL highlights" or "RCB cards" | ✓ |
| Why now is clear | Tonight, 7 PM, last group-stage before knockouts | ✓ |
| Genuinely personal | "it felt like exactly the kind of match you'd want to know about early" — agent judgment | ✓ |
| Signals connect to reasoning | IPL engagement → India match recommendation — implicit but clear | ✓ |
| Highlights | `Chinnaswamy tonight at 7 PM`, `last group-stage fixture before the knockouts` | ✓ |
| 1–2 highlights | 2 | ✓ |
| Highlights are noun phrases, not single words | Both are multi-word phrases | ✓ |

---

## Section 7 — Reasoning Animation

| Rule | Implementation | Status |
|---|---|---|
| Uses `GlanceTextReveal` | Yes | ✓ |
| Blur → sharp, no cursor, no typewriter | GlanceTextReveal default behavior | ✓ |
| `resolveMs: 7000` | `RESOLVE_MS_REASONING = 7000` | ✓ |
| `resolvedOpacity: 0.82` | Passed to `GlanceTextReveal` | ✓ |
| `onDone` wired to callback | `onDone={handleReasoningDone}` — fires from last character | ✓ |
| No fixed timer offset from reveal start | `handleReasoningDone` only called by `GlanceTextReveal.onDone` | ✓ |

---

## Section 8 — Post-Reasoning Pause

| Rule | Implementation | Status |
|---|---|---|
| 5-second hold after reasoning | `PAUSE_AFTER_REASONING = 5000` | ✓ |
| No agent movement during hold | Agent state unchanged; GSAP timeline parked at `typingDuration` ceiling | ✓ |
| `onSequenceDone` fires after hold | `setTimeout(onSequenceDone, 5000)` inside `handleReasoningDone` | ✓ |

---

## Section 9 — CTA Transition

| Rule | Implementation | Status |
|---|---|---|
| Agent looks toward CTA | `onAgentLook` → `setMascotLooking(true)` | ✓ |
| CTA pill slides in | GSAP from `coldStartL0Timeline.ts` — `ctaReveal` label | ✓ |
| Mascot arc-flip | GSAP keyframe in `coldStartL0Timeline.ts` | ✓ |
| Mascot settles in CTA | 380ms delay after arc-flip | ✓ |
| CTA text reveals | `GlanceTextReveal` triggered by `onCTATypingStart` | ✓ |
| Beam/glow activates | `onBeamStart` fires after CTA text | ✓ |
| Sequence order preserved | `coldStartL0Timeline.ts` is not modified | ✓ |

---

## Section 10 — CTA Rules

> "Set a reminder for first ball?"

| Rule | Assessment | Status |
|---|---|---|
| Question format | Yes — ends with "?" | ✓ |
| Agent action, not navigation | "Set a reminder" — agent does this | ✓ |
| Relevant to the card | "first ball" maps to the cricket match | ✓ |
| `CTA_RESOLVE_MS = 3000` | Set in `WarmProfile1CinematicL0.tsx` | ✓ |

---

## Section 11 — Final Hold

| Rule | Implementation | Status |
|---|---|---|
| 10-second hold after CTA | `HOLD_AFTER_COMPLETE_MS = 10_000` in `WarmProfile1App.tsx` | ✓ |
| Card fully visible during hold | Background, title, reasoning, CTA all remain | ✓ |

---

## Section 12 — Design Language

| Rule | Implementation | Status |
|---|---|---|
| Font: Plus Jakarta Sans | All text elements | ✓ |
| Signal opacity: 0.92 | `resolvedOpacity={0.92}` in both `GlanceTextReveal` calls | ✓ |
| Reasoning opacity: 0.82 | `resolvedOpacity={0.82}` in reasoning `GlanceTextReveal` | ✓ |
| Highlights use `GLANCE_HIGHLIGHT_STYLE` | Applied via `highlights` prop (processed internally by `GlanceTextReveal`) | ✓ |
| Three-layer overlay | Present in `WarmProfile1CinematicL0.tsx` | ✓ |
| Mascot: thinking while signals play | `signalPlaying` state drives `derivedMascotMode: 'thinking'` | ✓ |
| Mascot: looking when CTA appears | `mascotLooking` state drives `'looking'` | ✓ |

---

## Section 13 — Alignment

Card 1 (`ws-india-afg`) uses **left alignment** based on `getGlanceConfig()`.

| Property | Expected (left) | Actual | Status |
|---|---|---|---|
| `contentLeft` | `clamp(20px, 4.5vw, 88px)` | Set in `GEO.left` | ✓ |
| `contentWidth` | `clamp(240px, 52vw, 860px)` | Set in `GEO.left` | ✓ |
| `textAlign` | `left` | `GEO.left.textAlign` | ✓ |
| `ctaJustify` | `flex-start` | `GEO.left.ctaJustify` | ✓ |
| Mascot inline left of reasoning | `alignment !== 'center'` branch | ✓ |

---

## Known Gaps / Open Items

| Item | Severity | Note |
|---|---|---|
| `SEQUENCE_DURATION_MS = 33000` is 2.8s above actual (~30.2s) | Low | Intentional ceiling. Ensures GSAP never auto-fires heroShrink. Safe as long as it exceeds actual sequence length. |
| `WaitingDots` animation uses `repeat: -1` — timeline never self-terminates | Low | GSAP timeline is killed in `useEffect` cleanup on visibility change. No leak. |
| Signal 2 dots appear at `SIGNAL_2_DONE_MS = 11400ms` — hardcoded offset | Low | GlanceTextReveal does not expose `onDone` on the signal wrappers (both pass `onDone: () => {}`). Dots timing is computed from `RESOLVE_MS_SIGNAL_2` constant, not actual reveal completion. If `resolveMs` is changed, `SIGNAL_2_DONE_MS` must be updated in sync. |
| Cards 2–8 still use `ColdStartL0Glance` / standard reasoning | Expected | Intentional. This template governs when warm card treatment is applied to future cards. |

---

## Template Compliance Summary

Card 1 is **fully compliant** with `WARM_START_REASONING_TEMPLATE.md` v1.0.

All 16 checklist items pass. No deviations from the template spec.

This card is the reference implementation. Future warm cards should match it exactly, with only content (signal copy, reasoning, CTA, highlights) and layout alignment varying per card.
