# Warm Start Reasoning Rewrite

**File changed:** `src/logic/reasoningEngine.ts` — `itemOverrides` and `itemHighlights` sections.

No feed items, titles, tags, CTAs, layouts, or images were changed.

---

## Cards Updated

### ws-india-afg — India vs Afghanistan, Tonight

**Original:**
> Sports and big moments are what this TV plays. India vs Afghanistan is tonight's biggest fixture — first ball at 7pm.

**Rewritten:**
> You told me sports matters. India vs Afghanistan is tonight's biggest fixture, first ball at 7pm.

**Signal type:** Preference collection ("you told me")
**Change:** Replaced generic product description with direct first-person signal reference. The second line is unchanged — it carries the factual hook.

---

### ws-nandi-hills — The Nandi Hills Ride

**Original:**
> Sports and local experiences both showed up in your picks. The Nandi loop is the cleanest ride out of Bangalore — pre-dawn is when serious riders go.

**Rewritten:**
> You picked sports and local rides. The Nandi loop is Bangalore's cleanest pre-dawn route, and the window opens tomorrow morning.

**Signal type:** Preference collection ("you picked")
**Change:** Replaced passive "showed up" with direct "you picked." Swapped the anonymous "serious riders" framing for a time-sensitive personal hook ("tomorrow morning").

---

### ws-om-beach — Om Beach at Sunrise

**Original:**
> Wellness and travel both made the cut for you. Om Beach is the cleanest version of both — a sunrise yoga session three hours from Goa.

**Rewritten:**
> You chose both wellness and travel. Om Beach sits at that exact overlap, a sunrise yoga session three hours from Goa.

**Signal type:** Preference collection ("you chose")
**Change:** "Made the cut for you" felt passive and system-like. "You chose both" is direct and personal. "Sits at that exact overlap" gives the agent the interpretive voice the brief asks for.

---

### ws-coorg — Coorg, At First Light

**Original:**
> Travel and local weekends are both what you marked. Coorg sits in that overlap — six hours from Bangalore, peak green this fortnight.

**Rewritten:**
> You marked travel and local weekends. Coorg sits right in that overlap, six hours from Bangalore and peak green this fortnight.

**Signal type:** Preference collection ("you marked")
**Change:** Minimal structural change — moved the subject to first-person ("you marked") and smoothed the punctuation. The reasoning logic and facts are preserved.

---

### ws-amalfi — The Amalfi Edit

**Original:**
> Not this weekend, but for the bigger trip with your partner — Amalfi is the most-asked-about international destination for couples travelling from India this year.

**Rewritten:**
> You said you travel with your partner. Amalfi is the most-asked-about destination for Indian couples this year, so I kept it close.

**Signal type:** Preference collection ("you said") + agent action ("I kept it close")
**Change:** Opening was a caveat ("not this weekend, but...") which undermines the card before it lands. Replaced with a clear signal reference and ended with first-person agent decision-making.

---

### ws-wind-down — Wind Down Together

**Original:**
> You watch this TV with your partner, and wellness was something you wanted more of. The 30-minute wind-down before sleep is the easiest place for both to start.

**Rewritten:**
> You wanted more wellness, and you watch this with your partner. I brought the wind-down forward, it's the easiest routine for two people to start tonight.

**Signal type:** Preference collection ("you wanted") + agent action ("I brought forward")
**Change:** Re-ordered to lead with the user signal, then the agent decision. Added "tonight" for time-sensitive relevance. "I brought it forward" makes the curation feel intentional, not accidental.

---

### ws-vinyl-ritual — The Slow Listen

**Original:**
> Music made it onto your shortlist. Slow-listening on vinyl is the format that's quietly returning — most listened to in the late evening hour.

**Rewritten:**
> You added music to your picks. I brought vinyl forward because slow-listening is quietly making a comeback, and evenings are when it fits best.

**Signal type:** Preference collection ("you added") + agent action ("I brought forward") + time context (evenings)
**Change:** "Made it onto your shortlist" is passive. "You added music to your picks" is direct. "I brought vinyl forward because..." makes the agent's decision explicit and explains the reasoning chain.

---

### ws-gehra-hua — Gehra Hua and This Week's Hits

**Original:**
> Gehra Hua is the most-played Hindi track in India this week. Trending and music are both what you marked — the rest of the playlist follows from there.

**Rewritten:**
> You marked trending music and Hindi hits. Gehra Hua is the most-played track in India this week, so I've queued the rest of the playlist from here.

**Signal type:** Preference collection ("you marked") + trending/local popularity + agent action ("I've queued")
**Change:** Original led with the content fact before establishing relevance. Rewrite leads with the user signal, then delivers the fact, then closes with an agentic action ("I've queued"). Flow now matches the reasoning structure: signal → fact → decision.

---

## Cards Not Changed

None — all 8 warm start cards were rewritten.

---

## Summary

- All 8 warm start `itemOverrides` updated in `reasoningEngine.ts`
- All 8 warm start `itemHighlights` updated to match new copy
- No cold start overrides modified
- No feed items, titles, CTAs, layouts, or data structures changed
