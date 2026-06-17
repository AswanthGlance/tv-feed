# Warm Profile 1 — Reasoning Layout and Timing Fix

**Route:** `/warm_profile_1`  
**Date:** 2026-06-17

Three fixes applied. No content, signal copy, CTA copy, titles, or images changed.

---

## Fix 1 — Reasoning Line Balance

**Problem:** Reasoning text wrapped at arbitrary points on TV. One line was much shorter than the other. Unbalanced hierarchy, hard to read at 10-foot distance.

**Rule applied:** Every reasoning block should be visually balanced across its lines. Target: each line carries roughly equal weight. No automatic wrapping — each card is manually balanced.

**Approach:** Added `\n` line-break characters directly in the reasoning strings in `warmCardSignalData.ts`. `GlanceTextReveal` was updated to render `\n` chars as `<br>` elements rather than invisible spans.

**`GlanceTextReveal.tsx` change:** In `renderTokens()`, when `char === '\n'`, render a `<React.Fragment>` with a `display: none` span (holds the ref/animation slot) and a `<br>` for the layout break. The GSAP timeline still animates through all character slots including newlines — timing is unaffected.

### Line breaks per card

| Card | Line 1 | Line 2 | Line 3 |
|---|---|---|---|
| ws-india-afg | India vs Afghanistan is at the Chinnaswamy tonight, first ball at 7pm — | last group-stage fixture before the knockouts. | I'll set your reminder and surface a fantasy XI 30 minutes before lock. |
| ws-nandi-hills | The group rolls out for the Nandi loop at 4:30am Sunday — | 60km round-trip, ascent at sunrise, back by 9. | I'll map your route and add you to their WhatsApp on your nod. |
| ws-om-beach | Gokarna sits 8 hours by road or a 1-hour fly-and-drive via Hubli. | Om Beach at 6am is the cleaner version of what you actually wanted in February. | I'll plan the weekend — SwaSwara overnight, sunrise yoga, Vihangama on the way back. |
| ws-coorg | Attikan won the Indian Coffee Board's specialty cup last season | and runs estate stays through monsoon. Six hours from Bangalore, peak green this fortnight. | I'll shortlist three for you — Ama, Attikan, and one more — two nights each. |
| ws-amalfi | September is shoulder season for the Coast — water still warm, crowds thinned. | Le Sirenuse in Positano has a six-night window open right now. | I'll save it to your travel board for the longer trip with your partner. |
| ws-wind-down | Sleep is the one your body is being held back by right now. | I've put together a 30-minute wind-down — lights down at 10:15, a yoga nidra track, screens off at 10:45. | Want me to cue it for tonight? |
| ws-vinyl-ritual | The Local in Indiranagar runs a Hindi film soundtracks night this Saturday. | I'd have you start there before you commit to the turntable — | hear the Aandhi reissue and the Rafi pressing on their setup first. |
| ws-gehra-hua | Gehra Hua is the most-played Hindi track in the country this week — | Anuv Jain at the front, Bombay-indie production behind. | I've built you a 14-track playlist: Gehra Hua, three Peter Cat picks, Aswekeepsearching, Tejas, and the rest of the week's chart. |

---

## Fix 2 — Signal Text Above Mascot

**Problem:** Signal text and mascot occupied the same vertical zone in the left/right layout. Signal text started at the same Y position as the mascot, creating visual overlap and clutter.

**Rule applied:** Signal 1 → Signal 2 → Agent → Reasoning (in that vertical order). Signals must sit above the mascot area at all times.

**Approach:** Restructured the content column in `WarmProfile1CinematicL0.tsx` into three distinct rows:

1. **SIGNAL STACK ROW** (left/right only) — contains a fixed-width mascot placeholder (width = `MASCOT_HERO_SIZE`, height = 0) to maintain column alignment, plus the `SignalDecisionReasoning` block. This row appears above the mascot.

2. **MASCOT ROW** — contains the inline mascot (left/right) or the collapsible mascot spacer (center). No signal content in this row.

3. **CTA** — unchanged.

For center-alignment cards, the layout is:
1. `SignalDecisionReasoning` block (centered)
2. Mascot (centered, collapsible)
3. CTA (centered)

The mascot placeholder in the signal row ensures the signal text column is indented to the same position as the reasoning text — no column width change, no layout shift.

---

## Fix 3 — Premature Card Advance

**Problem:** Some cards (observed on ws-gehra-hua, ws-wind-down, and other later cards) advanced to the next card before reasoning, CTA, and final hold had fully completed.

**Root cause:** `SEQUENCE_DURATION_MS` (the ceiling passed as `typingDuration` to the GSAP timeline) was `33000ms`. The `heroShrink` GSAP label is placed at `typingStart + SEQUENCE_DURATION_MS/1000 + 1.0s = ~35.93s` after the card starts. If `onSequenceDone` fired later than expected (e.g. due to longer reasoning text from line-break characters), GSAP could reach the `heroShrink` label on its own and trigger the CTA sequence and `onTimelineComplete` ahead of schedule.

**Fix:** Increased `SEQUENCE_DURATION_MS` from `33000` to `45000`. The `heroShrink` label is now placed at `~47.93s` — well beyond the actual sequence duration of ~30.2s. GSAP will never reach this label on its own. `onSequenceDone` (fired by `SignalDecisionReasoning` after the full sequence including 5s reasoning hold) always triggers the seek manually before GSAP gets there.

**Advance sequence (all 8 cards):**

```
Signal 1 reveals (3.2s)
↓ 5s hold
↓ Signal 1 shifts up + Signal 2 enters (3.2s)
↓ 5s hold
↓ Sequential exit (1.4s)
↓ Reasoning reveals (7s)
↓ 5s hold after reasoning done
↓ onSequenceDone fires → GSAP seeks to heroShrink
↓ Mascot shrinks + CTA slides in (~1.5s)
↓ Mascot flips into CTA + text reveals (3s CTA resolve)
↓ Beam activates
↓ onTimelineComplete fires → WarmProfile1App starts 10s hold
↓ Advance to next card
```

Total per card: ~50s minimum before advance.

---

## Files Changed

| File | Change |
|---|---|
| `src/components/Shared/GlanceTextReveal.tsx` | `renderTokens()` handles `\n` chars: invisible span + `<br>` for layout |
| `src/components/L0/warmCardSignalData.ts` | `reasoning` strings updated with `\n` line breaks for TV balance. Card comments added. |
| `src/components/L0/WarmProfile1CinematicL0.tsx` | Content column restructured into signal row + mascot row. `SEQUENCE_DURATION_MS` bumped from 33000 to 45000. |

---

## What Was Not Changed

- Signal copy, reasoning copy, CTA copy, titles, images
- Animation timing constants in `SignalDecisionReasoning.tsx`
- `demo_warm_start`, cold start, main L0 feed, onboarding
- Feed item order (unchanged: ws-india-afg → ws-nandi-hills → ws-om-beach → ws-coorg → ws-amalfi → ws-wind-down → ws-vinyl-ritual → ws-gehra-hua)
