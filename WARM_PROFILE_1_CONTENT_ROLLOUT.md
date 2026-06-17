# Warm Profile 1 — Content Rollout

**Route:** `/warm_profile_1`  
**Profile:** Akshay — Male 35–40, Bangalore (Indiranagar / HSR). Sports + travel + wellness + music. Works with partner.  
**Source:** `Warm Start Content/Glance_TV_Warm_Start_Akshay.docx`  
**Date:** 2026-06-17

All 8 cards updated. Template compliance verified for each.

---

## Cards Updated

### Card 1 — India vs Afghanistan, Tonight (`ws-india-afg`)

**Tag:** Sports · Live tonight  
**Title:** India vs Afghanistan, Tonight _(unchanged)_  
**CTA:** Set a reminder for first ball? _(unchanged)_

**Signals (in `SignalDecisionReasoning.tsx`):**

| # | Signal | Highlights | Source |
|---|---|---|---|
| 1 | You've been on IPL highlights almost every other evening since late March. | `IPL highlights`, `late March` | Engagement / viewing history |
| 2 | You liked three RCB cards this season. | `RCB cards` | Explicit action (likes) |

**Signal selection:** Doc lists 4 signals (IPL likes, RCB likes, Anil Kumble bookmark, T20 fantasy chat). Selected the 2 most direct engagement signals: IPL + RCB. Both are explicit, behavioral, and directly connect to the cricket recommendation.

**Reasoning (in `SignalDecisionReasoning.tsx`):**
> India vs Afghanistan is at the Chinnaswamy tonight, first ball at 7pm — last group-stage fixture before the knockouts. I'll set your reminder and surface a fantasy XI 30 minutes before lock.

**Reasoning compression:** Doc reasoning was 3 sentences. Compressed to 2 sentences. Removed "put the toss alert on your phone" — preserves intent, keeps within 2-line TV readability.

**Highlights:** `Chinnaswamy tonight`, `first ball at 7pm`

---

### Card 2 — The Nandi Hills Ride (`ws-nandi-hills`)

**Tag:** Sports · Local _(was: Nandi Hills, Bangalore)_  
**Title:** The Nandi Hills Ride _(unchanged)_  
**CTA:** Add me to Sunday? _(was: Map a route for tomorrow?)_

**Signals selected from doc (for future signal treatment):**

| # | Signal | Source |
|---|---|---|
| 1 | Triathlon next year — that was the conversation three weeks back. | Chat / intent signal |
| 2 | The Garmin Forerunner 265 and Lazer helmet are on your list; the Hebbal Sunday cycling group is saved. | Wishlist + bookmark |

**Signal selection:** Doc lists 3 signals. Selected the triathlon intent chat (strongest intent signal) and the specific Hebbal group bookmark (directly connects to the Sunday recommendation). Dropped the generic cycling routes signal.

**Reasoning (in `setProfileOverrides`):**
> The Hebbal group rolls out for the Nandi loop at 4:30am Sunday — 60km round-trip, ascent at sunrise, back by 9. I'll map your route and add you to their WhatsApp on your nod.

**Highlights:** `Nandi loop`, `4:30am Sunday`

---

### Card 3 — Om Beach at Sunrise (`ws-om-beach`)

**Tag:** Wellness · Travel _(was: Gokarna)_  
**Title:** Om Beach at Sunrise _(unchanged)_  
**CTA:** Plan the Gokarna weekend? _(unchanged)_

**Signals selected from doc:**

| # | Signal | Source |
|---|---|---|
| 1 | Non-touristy Goa — that was the ask back in February. | Chat / intent signal |
| 2 | The hidden Karnataka coast cards keep getting your likes, and Vihangama Cafe up that same stretch is saved. | Likes + bookmark |

**Signal selection:** Doc lists 2 signals. Both used. First grounds the pattern (coastal intent), second provides specific behavioral evidence connecting to the recommendation location.

**Reasoning (in `setProfileOverrides`):**
> Gokarna is 8 hours by road from Bangalore, or a 1-hour fly-and-drive via Hubli. Om Beach at 6am is the cleaner version of what you actually wanted in February. I'll plan the weekend — SwaSwara overnight, sunrise yoga, Vihangama on the way back.

**Compression:** Doc reasoning was 3 sentences. Kept as 3 — all sentences are load-bearing. This is within the 2–3 line max.

**Highlights:** `Om Beach at 6am`, `SwaSwara overnight`

---

### Card 4 — A Coffee Estate at First Light (`ws-coorg`)

**Tag:** Travel · Weekend _(was: Coorg)_  
**Title:** A Coffee Estate at First Light _(was: Coorg, At First Light)_  
**CTA:** Want me to shortlist estate stays? _(unchanged)_

**Signals selected from doc:**

| # | Signal | Source |
|---|---|---|
| 1 | Ama Plantation Trails has been on your list since February — you didn't pull the trigger. | Wishlist (unconverted) |
| 2 | Two asks about Indian single-origins against Ethiopian, and a Third Wave pour-over liked. | Chat + explicit action |

**Signal selection:** Doc lists 3 signals. The wishlist add (intent without conversion) is the strongest signal — shows desire without action. The coffee asks signal establishes the coffee thread that makes the estate relevant. Dropped the generic travel signal.

**Reasoning (in `setProfileOverrides`):**
> Attikan won the Indian Coffee Board's specialty cup last season and runs estate stays through monsoon. Six hours from Bangalore, peak green this fortnight. I'll shortlist three for you — Ama, Attikan, and one more — two nights each.

**Compression:** Doc reasoning was 3 sentences. Kept all 3 — tight and specific. Within the 2–3 line max.

**Highlights:** `Attikan`, `peak green this fortnight`

---

### Card 5 — The Amalfi Edit (`ws-amalfi`)

**Tag:** Travel · Aspirational _(was: Amalfi Coast, Italy)_  
**Title:** The Amalfi Edit _(unchanged)_  
**CTA:** Save it for the longer trip? _(unchanged)_

**Signals selected from doc:**

| # | Signal | Source |
|---|---|---|
| 1 | Amalfi vs. the Greek Islands for late September — we've been on that one for a few weeks. | Chat signal |
| 2 | Four European-coastal likes this month, and you stopped twice on Aman and Belmond. | Likes + engagement |

**Signal selection:** Doc lists 2 signals. Both used. The chat signal establishes the explicit planning intent; the likes/engagement signal confirms the taste tier (premium coastal). Both are necessary.

**Reasoning (in `setProfileOverrides`):**
> September is shoulder season for the Coast — water still warm, crowds thinned. Le Sirenuse in Positano has a six-night September window open right now. I'll save it to your travel board for the longer trip with your partner.

**Compression:** Doc reasoning was 3 sentences. Kept all 3 — compact. The "longer trip with your partner" line is necessary (connects to context from warmStartFeedItems: couples-travel).

**Highlights:** `Le Sirenuse in Positano`, `six-night September window`

---

### Card 6 — Wind Down Together (`ws-wind-down`)

**Tag:** Wellness · Routine _(was: Bangalore)_  
**Title:** Wind Down Together _(unchanged)_  
**CTA:** Cue the wind-down for tonight? _(unchanged)_

**Signals selected from doc:**

| # | Signal | Source |
|---|---|---|
| 1 | Two weeks ago: late screen time was wrecking your sleep. | Chat signal |
| 2 | Last week: magnesium glycinate. The yoga nidra cards keep landing, and recovery-sleep windows for endurance was the question last month. | Chat + engagement |

**Signal selection:** Doc lists 2 signals. Both used. The screen time chat provides the acute problem context; the magnesium + yoga nidra signals show a pattern of active interest in the solution space.

**Reasoning (in `setProfileOverrides`):**
> Sleep is the one your body is being held back by. I've put together a 30-minute wind-down for you — lights down at 10:15, a yoga nidra track, screens off at 10:45. Want me to cue it for tonight?

**Compression:** Doc reasoning was 3 sentences. The last sentence duplicates the CTA. Kept it in reasoning as written — it reads as the agent closing the loop before the formal CTA interaction.

**Highlights:** `30-minute wind-down`, `yoga nidra track`

---

### Card 7 — Your Father's Records, Played Right (`ws-vinyl-ritual`)

**Tag:** Music · Format _(was: Bangalore)_  
**Title:** Your Father's Records, Played Right _(was: The Slow Listen)_  
**CTA:** Hold a Saturday seat? _(was: Pull up a starter list?)_

**Signals selected from doc:**

| # | Signal | Source |
|---|---|---|
| 1 | Two months back: how to clean and play your father's 50-year-old records, and where to find needles for the Garrard. | Chat signal |
| 2 | The Pro-Ject Debut Carbon EVO and the Schiit Mani phono preamp are now on your list. | Wishlist |

**Signal selection:** Doc lists 3 signals (records chat, HMV/EMI chat, Pro-Ject wishlist). Selected the foundational records chat (establishes the whole thread) and the wishlist add (shows intent but no purchase). Dropped the HMV/EMI chat — too narrow, doesn't connect to the Saturday night recommendation.

**Reasoning (in `setProfileOverrides`):**
> The Local in Indiranagar runs a Hindi film soundtracks night this Saturday. I'd have you start there before you commit to the turntable — hear the Aandhi reissue and the Rafi pressing on their setup first.

**Compression:** Doc reasoning was 3 sentences. Compressed to 2. Removed "Want me to hold a Saturday seat for you?" — that's the CTA. Kept the experiential recommendation logic.

**Highlights:** `Hindi film soundtracks night this Saturday`, `Aandhi reissue`

---

### Card 8 — Gehra Hua and This Week's Hits (`ws-gehra-hua`)

**Tag:** Music · Trending _(was: Trending in India)_  
**Title:** Gehra Hua and This Week's Hits _(unchanged)_  
**CTA:** Queue this week's playlist? _(unchanged)_

**Signals selected from doc:**

| # | Signal | Source |
|---|---|---|
| 1 | Three Peter Cat likes, The Local saved. | Explicit actions |
| 2 | Aswekeepsearching, Tejas — the Bombay-indie thread runs through everything you've saved this month. | Engagement pattern |

**Signal selection:** Doc lists 2 signals. Both used. First is specific (named acts + venue save); second surfaces the pattern that connects individual actions into a coherent taste signal.

**Reasoning (in `setProfileOverrides`):**
> Gehra Hua is the most-played Hindi track in the country this week — Anuv Jain at the front, Bombay-indie production behind. I've built you a 14-track playlist: Gehra Hua, three Peter Cat picks, Aswekeepsearching, Tejas, and the rest of the week's chart.

**Compression:** Doc reasoning was 2 sentences. Kept both — they're the right length.

**Highlights:** `most-played Hindi track`, `14-track playlist`

---

## Tag Format Change (All Cards)

All `locationLabel` values updated from geographic/generic strings to the `Category · Context` format from the doc.

| Card | Before | After |
|---|---|---|
| India vs Afghanistan | Bangalore | Sports · Live tonight |
| Nandi Hills | Nandi Hills, Bangalore | Sports · Local |
| Om Beach | Gokarna | Wellness · Travel |
| Coffee Estate | Coorg | Travel · Weekend |
| Amalfi | Amalfi Coast, Italy | Travel · Aspirational |
| Wind Down | Bangalore | Wellness · Routine |
| Vinyl | Bangalore | Music · Format |
| Gehra Hua | Trending in India | Music · Trending |

No pin icon. No decorative elements. Plain text only. Rendered via `getTagLabel()` which returns `item.locationLabel` directly when set.

---

## Title Changes

| Card | Before | After |
|---|---|---|
| ws-coorg | Coorg, At First Light | A Coffee Estate at First Light |
| ws-vinyl-ritual | The Slow Listen | Your Father's Records, Played Right |

All other titles unchanged — existing titles already match the doc.

---

## CTA Changes

| Card | Before | After |
|---|---|---|
| ws-nandi-hills | Map a route for tomorrow? | Add me to Sunday? |
| ws-vinyl-ritual | Pull up a starter list? | Hold a Saturday seat? |

All other CTAs unchanged — already matched the doc.

---

## Files Changed

| File | Change |
|---|---|
| `src/data/warmStartFeedItems.ts` | `locationLabel` updated all 8 cards; titles updated for ws-coorg and ws-vinyl-ritual |
| `src/logic/ctaGenerator.ts` | `ITEM_CTA_OVERRIDES` updated: ws-nandi-hills, ws-vinyl-ritual |
| `src/WarmProfile1App.tsx` | `setProfileOverrides` expanded from 1 card to all 8; reasoning + highlights for every card |
| `src/components/L0/SignalDecisionReasoning.tsx` | Reasoning text updated to match doc; highlights updated to `Chinnaswamy tonight` + `first ball at 7pm` |

---

## What Was Not Changed

- Animation system
- Signal timing template (all cards 2–8 use standard ColdStartCinematicL0 — signal stack pattern remains Card 1 only until explicitly rolled out)
- Typography, spacing, design language
- Feed item categories, vibes, scoring weights
- `demo_warm_start` route — untouched
- `reasoningEngine.ts` `itemOverrides` — those still serve `demo_warm_start`

---

## Template Compliance

Every card was validated against `WARM_START_REASONING_TEMPLATE.md`:

| Card | 2 signals? | Reasoning ≤3 lines? | CTA is question? | Tag plain text? |
|---|---|---|---|---|
| ws-india-afg | ✓ | ✓ | ✓ | ✓ |
| ws-nandi-hills | ✓ | ✓ | ✓ | ✓ |
| ws-om-beach | ✓ | ✓ | ✓ | ✓ |
| ws-coorg | ✓ | ✓ | ✓ | ✓ |
| ws-amalfi | ✓ | ✓ | ✓ | ✓ |
| ws-wind-down | ✓ | ✓ | ✓ | ✓ |
| ws-vinyl-ritual | ✓ | ✓ | ✓ | ✓ |
| ws-gehra-hua | ✓ | ✓ | ✓ | ✓ |

Note: The signal stack animation (Signal 1 → shift → Signal 2 → reasoning) is currently only wired for Card 1 (`ws-india-afg`). Cards 2–8 render through `ColdStartCinematicL0` with standard single-block reasoning. When the signal stack pattern is extended to Cards 2–8, the signals documented above are the content to implement.
