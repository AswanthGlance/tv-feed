# Warm Profile 1 — Template Consistency + Timeline Fix Pass

**Route:** `/warm_profile_1`  
**Date:** 2026-06-17  
**Content source:** `Warm Start Content/Glance_TV_Warm_Start_Akshay.docx` (latest version, 10 cards)

---

## 1. Mascot and Text Connected (Layout Fix)

**Problem:** The previous pass moved signals into a separate row above the mascot for all templates. This disconnected the mascot from the text it was "speaking." The mascot appeared below while the signal text animated above it — no visual relationship.

**Rule:** Wherever the mascot appears, active text is beside it. Mascot is the source of the thought.

- Left template: mascot on left, signal/reasoning text to its right. Grouped in one row.
- Center template: signals/reasoning above mascot (this was the explicit experiment requested). Mascot below.
- Right template: mascot on right, signal/reasoning text to its left. Grouped in one row.

**Fix:** `WarmProfile1CinematicL0.tsx` content column restructured. The "SIGNAL STACK above mascot" row that was applied to all templates has been removed from left/right. Left/right templates now use a single `AGENT + TEXT ROW` with mascot and `SignalDecisionReasoning` side by side. Center template retains the signals-above-mascot structure as intended.

---

## 2. Em Dash Removal

**Problem:** Em dashes ( — ) throughout signal and reasoning copy made the content feel AI-generated and over-punctuated.

**Rule:** No em dashes anywhere. Rewrite naturally. Sentences end with a period. Colons replace em dash + list patterns. A new sentence replaces em dash + continuation.

### Rewrites applied

| Before | After |
|---|---|
| first ball at 7pm — last group-stage fixture | first ball at 7pm. Last group-stage fixture |
| Nandi loop at 4:30am Sunday — 60km round-trip | Nandi loop at 4:30am Sunday. 60km round-trip |
| I'll plan the weekend — SwaSwara overnight | I'll plan the weekend: SwaSwara overnight |
| I'll shortlist three for you — Ama, Attikan | I'll shortlist three for you: Ama, Attikan |
| water still warm, crowds thinned | (kept as is, no dash was needed) |
| 30-minute wind-down for you — lights down | 30-minute wind-down: lights down |
| before you commit to the turntable — hear | before you commit to the turntable. Hear |
| most-played Hindi track — Anuv Jain | most-played Hindi track. Anuv Jain |

All em dashes removed from `warmCardSignalData.ts` and `WarmProfile1App.tsx` (`setProfileOverrides`).

---

## 3. Content Updated from Latest Doc

**Source:** `Glance_TV_Warm_Start_Akshay.docx` — re-read in full. 10 cards documented; 8 used in feed.

Signals were updated to match the doc's "What the agent says next" copy more closely. The doc provides both a first-signal paragraph and a reasoning paragraph; signals were extracted from the first paragraph and reasoning from the second.

### Updated signals per card

| Card | Signal 1 | Signal 2 |
|---|---|---|
| ws-india-afg | You've liked 12 IPL-themed cards across April and May. | In March we chatted about your T20 fantasy build. |
| ws-nandi-hills | Three weeks back, you chatted about your first triathlon. | The Garmin 265 and Lazer helmet are on your list. |
| ws-om-beach | In February, you asked me for a non-touristy Goa weekend. | Vihangama Cafe is bookmarked. |
| ws-coorg | Ama Plantation has been on your wishlist since February. | You asked me twice about Indian single-origins. |
| ws-amalfi | We've been chatting Amalfi vs. the Greek Islands for late September. | You've liked Aman and Belmond cards. |
| ws-wind-down | Two weeks back, you chatted about late screen time and your sleep. | Last week, you asked about magnesium glycinate. |
| ws-vinyl-ritual | Two months back, you asked me how to play your father's 50-year-old records. | The Pro-Ject turntable is on your list. |
| ws-gehra-hua | You've liked 3 Peter Cat cards and bookmarked The Local. | Aswekeepsearching and Tejas run through everything you've been saving. |

---

## 4. Reasoning Length — Max 3 Lines

Every reasoning block verified at max 3 lines. Each uses explicit `\n` line breaks for TV balance (no automatic wrapping dependency).

| Card | Lines | Balanced |
|---|---|---|
| ws-india-afg | 3 | ✓ |
| ws-nandi-hills | 3 | ✓ |
| ws-om-beach | 3 | ✓ |
| ws-coorg | 3 | ✓ |
| ws-amalfi | 3 | ✓ |
| ws-wind-down | 3 | ✓ |
| ws-vinyl-ritual | 3 | ✓ |
| ws-gehra-hua | 3 | ✓ |

---

## 5. Timeline — Premature Advance Fix

`SEQUENCE_DURATION_MS` was raised to `45000` (from `33000`) in the previous pass. This ensures the GSAP `heroShrink` label is placed at ~47.9s, well beyond the actual sequence duration of ~30.2s. GSAP never auto-fires heroShrink. `onSequenceDone` always triggers the seek manually.

Complete advance sequence (verified for all 8 cards):

```
Signal 1 reveal (3.2s)
5-second hold
Signal 1 shifts up + Signal 2 enters (3.2s)
5-second hold
Signal 1 exits (0.7s) then Signal 2 exits (0.7s)
Reasoning reveal (7s)
5-second hold after reasoning done
onSequenceDone fires
GSAP seeks to heroShrink label
Mascot shrinks, CTA slides in (~1.5s)
Mascot flips into CTA
CTA text reveals (3s)
Beam activates
onTimelineComplete fires
WarmProfile1App starts 10-second hold
Advance to next card
```

Total minimum per card: ~50s. No premature transitions.

---

## 6. Template Consistency Audit

All 8 cards verified:

| Card | Mascot grouped | 2 signals | No em dash | Reasoning 3 lines max | Timeline |
|---|---|---|---|---|---|
| ws-india-afg | ✓ | ✓ | ✓ | ✓ | ✓ |
| ws-nandi-hills | ✓ | ✓ | ✓ | ✓ | ✓ |
| ws-om-beach | ✓ | ✓ | ✓ | ✓ | ✓ |
| ws-coorg | ✓ | ✓ | ✓ | ✓ | ✓ |
| ws-amalfi | ✓ | ✓ | ✓ | ✓ | ✓ |
| ws-wind-down | ✓ | ✓ | ✓ | ✓ | ✓ |
| ws-vinyl-ritual | ✓ | ✓ | ✓ | ✓ | ✓ |
| ws-gehra-hua | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## Files Changed

| File | Change |
|---|---|
| `src/components/L0/WarmProfile1CinematicL0.tsx` | Content column restructured: left/right use single mascot+text row; center retains signals-above-mascot |
| `src/components/L0/warmCardSignalData.ts` | Signals updated from latest doc; all em dashes removed; reasoning rebalanced with `\n` breaks |
| `src/WarmProfile1App.tsx` | `setProfileOverrides` reasoning strings: all em dashes removed |

---

## What Was Not Changed

- Animation timing constants in `SignalDecisionReasoning.tsx`
- `SEQUENCE_DURATION_MS = 45000` ceiling (set in previous pass, correct)
- CTA copy, titles, images, feed item order
- `demo_warm_start`, cold start, main L0 feed, onboarding
- `GlanceTextReveal.tsx` newline rendering (set in previous pass, correct)
