# Warm Profile 1 — Template Rollout

**Route:** `/warm_profile_1`  
**Date:** 2026-06-17  
**Task:** Extend Card 1's signal stack pattern to all 8 warm-start cards.

Card 1 (`ws-india-afg`) is the approved reference. Cards 2–8 now use the exact same component structure, timing, and animation.

---

## What Changed

### Architecture

Before rollout, only `ws-india-afg` used `WarmProfile1CinematicL0` + `SignalDecisionReasoning`. All other cards fell through to `ColdStartL0Glance`.

After rollout, all 8 warm cards use `WarmProfile1CinematicL0` + `SignalDecisionReasoning`. `ColdStartL0Glance` is the fallback only for items with no entry in `WARM_CARD_SIGNAL_DATA`.

---

## Files Changed

| File | Change |
|---|---|
| `src/components/L0/warmCardSignalData.ts` | **NEW.** Per-card signal/reasoning data for all 8 warm cards. Single record keyed by item ID. |
| `src/components/L0/SignalDecisionReasoning.tsx` | **Refactored.** Content is now injected via props instead of hardcoded. Added: `signal1`, `signal1Hls`, `signal2`, `signal2Hls`, `reasoning`, `reasoningHls`. All timing/animation logic unchanged. |
| `src/components/L0/WarmProfile1CinematicL0.tsx` | **Updated.** Added `signalData: WarmCardSignalEntry` prop; passes all 6 content fields to `<SignalDecisionReasoning>`. |
| `src/components/L0/WarmProfile1L0Glance.tsx` | **Updated.** Changed from hard `if (item.id === 'ws-india-afg')` check to lookup via `WARM_CARD_SIGNAL_DATA[item.id]`. All 8 warm cards now route through `WarmProfile1CinematicL0`. |

---

## Per-Card Signal Data

### Card 1 — ws-india-afg

**S1:** You've been on IPL highlights almost every other evening since late March.  
`Highlights:` IPL highlights · late March

**S2:** You liked three RCB cards this season.  
`Highlights:` RCB cards

**Reasoning:** India vs Afghanistan is at the Chinnaswamy tonight, first ball at 7pm — last group-stage fixture before the knockouts. I'll set your reminder and surface a fantasy XI 30 minutes before lock.  
`Highlights:` Chinnaswamy tonight · first ball at 7pm

---

### Card 2 — ws-nandi-hills

**S1:** You told me about the triathlon attempt three weeks ago.  
`Highlights:` triathlon attempt

**S2:** The Hebbal Sunday cycling group is saved, and the Garmin and Lazer helmet are on your list.  
`Highlights:` Hebbal Sunday cycling group · Garmin and Lazer helmet

**Reasoning:** The group rolls out for the Nandi loop at 4:30am Sunday — 60km round-trip, ascent at sunrise, back by 9. I kept coming back to this one. I'll map your route and add you to their WhatsApp on your nod.  
`Highlights:` Nandi loop at 4:30am Sunday · ascent at sunrise

---

### Card 3 — ws-om-beach

**S1:** You asked about a non-touristy Goa weekend back in February.  
`Highlights:` non-touristy Goa · February

**S2:** The hidden Karnataka coast cards keep getting your likes, and Vihangama Cafe is saved.  
`Highlights:` Karnataka coast · Vihangama Cafe

**Reasoning:** Gokarna sits 8 hours by road or a 1-hour fly-and-drive via Hubli. Om Beach at 6am is the cleaner version of what you actually wanted in February. I'll plan the weekend — SwaSwara overnight, sunrise yoga, Vihangama on the way back.  
`Highlights:` Om Beach at 6am · SwaSwara overnight

---

### Card 4 — ws-coorg

**S1:** Ama Plantation Trails has been on your list since February — you never pulled the trigger.  
`Highlights:` Ama Plantation Trails · February

**S2:** You've asked twice about Indian single-origins versus Ethiopian, and you liked the Third Wave pour-over.  
`Highlights:` Indian single-origins · Third Wave pour-over

**Reasoning:** Attikan won the Indian Coffee Board's specialty cup last season and runs estate stays through monsoon. Six hours from Bangalore, peak green this fortnight. I'll shortlist three for you — Ama, Attikan, and one more — two nights each.  
`Highlights:` Attikan · peak green this fortnight

---

### Card 5 — ws-amalfi

**S1:** Amalfi versus the Greek Islands for late September — we've had that one going for a few weeks now.  
`Highlights:` Amalfi versus the Greek Islands · late September

**S2:** You stopped twice on Aman and Belmond this month, and four European-coastal cards got your likes.  
`Highlights:` Aman and Belmond · European-coastal

**Reasoning:** September is shoulder season for the Coast — water still warm, crowds thinned. Le Sirenuse in Positano has a six-night window open right now. I'll save it to your travel board for the longer trip with your partner.  
`Highlights:` Le Sirenuse in Positano · six-night window

---

### Card 6 — ws-wind-down

**S1:** Two weeks ago you told me late screen time was wrecking your sleep.  
`Highlights:` late screen time · sleep

**S2:** Last week it was magnesium glycinate, and the yoga nidra cards have been landing consistently.  
`Highlights:` magnesium glycinate · yoga nidra

**Reasoning:** Sleep is the one your body is being held back by right now. I've put together a 30-minute wind-down — lights down at 10:15, a yoga nidra track, screens off at 10:45. Want me to cue it for tonight?  
`Highlights:` 30-minute wind-down · yoga nidra track

---

### Card 7 — ws-vinyl-ritual

**S1:** Two months ago you asked how to clean and play your father's 50-year-old records.  
`Highlights:` father's 50-year-old records

**S2:** The Pro-Ject Debut Carbon EVO and the Schiit Mani phono preamp are now on your list.  
`Highlights:` Pro-Ject Debut Carbon EVO · Schiit Mani

**Reasoning:** The Local in Indiranagar runs a Hindi film soundtracks night this Saturday. I'd have you start there before you commit to the turntable — hear the Aandhi reissue and the Rafi pressing on their setup first.  
`Highlights:` Hindi film soundtracks night this Saturday · Aandhi reissue

---

### Card 8 — ws-gehra-hua

**S1:** Three Peter Cat likes this month, and The Local is saved.  
`Highlights:` Peter Cat · The Local

**S2:** Aswekeepsearching and Tejas keep coming up in everything you've been saving.  
`Highlights:` Aswekeepsearching · Tejas

**Reasoning:** Gehra Hua is the most-played Hindi track in the country this week — Anuv Jain at the front, Bombay-indie production behind. I've built you a 14-track playlist: Gehra Hua, three Peter Cat picks, Aswekeepsearching, Tejas, and the rest of the week's chart.  
`Highlights:` most-played Hindi track · 14-track playlist

---

## Timing (Identical for All 8 Cards)

| Phase | Starts | Duration |
|---|---|---|
| S1 reveal | 0ms | 3200ms |
| S1 hold (dots) | 3200ms | 5000ms |
| S1 shifts up + S2 enters | 8200ms | 500ms |
| S2 reveal | 8200ms | 3200ms |
| S2 hold (dots) | 11400ms | 5000ms |
| S1 fade | 16400ms | 700ms |
| S2 fade | 17100ms | 700ms |
| Gap before reasoning | 17800ms | 400ms |
| Reasoning reveal | 18200ms | 7000ms |
| Reasoning hold | 25200ms | 5000ms |
| `onSequenceDone` fires | ~30200ms | — |
| CTA resolve | post-GSAP seek | 3000ms |
| Final hold | post-CTA | 10000ms |

---

## Alignment per Card

| Card | Layout |
|---|---|
| ws-india-afg | left |
| ws-nandi-hills | right |
| ws-om-beach | center |
| ws-coorg | left |
| ws-amalfi | right |
| ws-wind-down | center |
| ws-vinyl-ritual | left |
| ws-gehra-hua | right |

Alignment is sourced from `glanceConfig.ts` → `getGlanceConfig(item).layout`. No changes to glanceConfig.

---

## What Was Not Changed

- Card 1 (`ws-india-afg`) — reference implementation, unchanged
- Timing constants in `SignalDecisionReasoning.tsx`
- Animation logic (GSAP shift, fade, GSAP timeline seek)
- `SEQUENCE_DURATION_MS` ceiling in `WarmProfile1CinematicL0.tsx`
- `demo_warm_start` route — untouched
- `reasoningEngine.ts` `itemOverrides` — still serve `demo_warm_start`
- `setProfileOverrides` in `WarmProfile1App.tsx` — unchanged (serves as fallback reasoning)
- All other onboarding screens, cold start, main L0 feed

---

## Template Reference

See `WARM_START_REASONING_TEMPLATE.md` for the canonical spec.  
See `WARM_PROFILE_1_CONTENT_ROLLOUT.md` for the content decisions and signal selection rationale per card.
