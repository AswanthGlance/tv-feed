# Copy Changes Summary — Glance TV Reasoning Layer

**Scope:** 163 cards × 4 profiles = 652 reasoning lines, written from scratch.

---

## The biggest decisions

### 1. Reasoning explains WHY, never WHAT

The card title and image already show what the user is looking at. Every reasoning line was written to answer one question: *"Why is this on my screen now?"* Not what it is.

**Old:** "A 14-seat counter doing Tokyo-style ramen — your weeknight upgrade."
**New (L1):** "Bangalore's ramen scene is small and obsessive — a 14-seat counter that opens its book on Wednesdays and closes it within minutes."

### 2. The interaction model is open + scroll-past, not save/dwell/click

Across all 489 L2/E1/E2 lines, no use of `click`, `clicked`, `clicks`, `saved`, `saves`, `dwell`, `wishlist` (except Fashion). The vocabulary is `you opened`, `you return to`, `you spend more time with`, `you tend to prefer`, `you linger on`. This is the language users would actually understand if they read the reasoning aloud.

### 3. Each profile has a distinct, recognisable voice

- **L1 Cold Start:** A Bangalore local making a city observation. No "you". Anchored in time, weather, season, or a local cultural fact.
- **L2 Warm Start:** Speaks to behaviour observed in early sessions — opening festive courtyard cards, liking local market stories, choosing "restaurant night" as the dinner mood. Voice is "you opened X, here's the version of that you'd act on."
- **E1 (44F design entrepreneur):** Established taste. Vegetarian, Ayurvedic, premium Indian craft. Family considerations. Phrases like "your considered home", "your refined palate", "your design-led week".
- **E2 (23F UX designer, indie/sustainable):** Junior salary, flatmates, cat. Indie cafés, hostels, ₹500–2,000 price points. Phrases like "your rental flat", "your flatmates", "your grid", "your aesthetic", "your friends".

### 4. Zero raw enriched data exposure

E1/E2 never expose: TransUnion, income amounts, percentile bands, "predicted", "model says", segment IDs, "owns home", "kids ages". Instead the brief's safe consumer language: "your considered home", "a household used to slow weekends", "your hostel budget", "your designer's salary".

### 5. Bangalore is anchor, not crutch

The first draft put "Bangalore" in 64% of L1 lines. Cap was 50%. After targeted swaps (city/town/here/the city) the rate is 15% — Bangalore appears where it genuinely anchors a moment (rain, palace, climate) rather than as filler.

### 6. Differentiation between profiles for the same card

For every card, the four reasoning lines are visibly different — not just substituting words. Example for **c051 Rooftop sunrise yoga**:

- L1: about clear mornings being rare (city context)
- L2: about morning content the user already returns to (observed behaviour)
- E1: about boutique yoga being part of an established week (premium routine)
- E2: about doing yoga without a membership and getting on the grid (junior + indie)

A 4-gram overlap check across all 163 cards' 4-line groups found zero near-duplicates (>40% overlap).

---

## Hard-passed validation rules

- 0 banned words/phrases (extensive list incl. click, dwell, score, algorithm, surfaced, placement, generic visual, content quality, broad-interest, this card, earns placement)
- 0 lines with ellipses
- 0 truncated sentences
- 0 lines over 170 chars (max is 138)
- 0 L1 lines with you/your/yours
- 100% L2/E1/E2 lines with explicit personal connection
- Wishlist appears only on Fashion cards
- No 5-word opener used more than 3× within any single column
- 0 duplicate full lines within any column
- 0 use of "this card" anywhere
- 13 uses of "fits" (cap was 15)
- 0 uses of "generic"

---

## Patterns I avoided deliberately

- "Shown because…" / "Surfaces because…" — debug language
- "This card earns its placement…" — system-explainer language
- "Specific, not generic" / "passes both signals" — system-explainer
- "Without needing personal history" / "no personalisation needed" — describes the system, not the card
- "Worth a look" / "worth saving" / "your kind of" — hollow
- Repeating the card title or subtitle in the reasoning
- Using L2 phrasing in L1 (no "you/your" leak ever)
- Using E2-style budget references in E1 (different financial reality)
- Using E1-style "established taste" framing in E2 (different life stage)

---

## Where I made trade-offs

1. **Bangalore at 15%** is below the 50% cap but the L1 voice still feels city-rooted because of references to Cubbon Park, Indiranagar, Malleshwaram, Coorg, Chikmagalur, Karnataka, Lalbagh, etc. — the city is anchored without literal name-dropping every line.

2. **"Considered" appears across many E1 lines** as part of the voice signature (E1 = considered, established taste). I kept it because it's the right word for that profile, but spread varieties: "considered", "refined", "established", "polished", "intentional", "curated".

3. **₹ price points appear in many E2 lines.** This was deliberate — it's how a 23-year-old creative thinks about purchases, and it makes the reasoning feel real rather than aspirational. They're spread enough not to feel formulaic.

4. **Some cards (Productivity, Finance, Wellness) have softer differentiation between profiles** because the underlying activity (saving money, doing yoga) is genuinely similar across users. I leaned on framing — "considered habit" for E1, "junior salary" for E2 — to keep them apart.

---

## What's NOT in this output

- I did not modify the prototype UI (per user instruction)
- I did not touch the CTA columns (`cold_cta`, `warm_cta`, `enriched_cta`) — they were already written
- I did not invent new card IDs — all 163 cards from the source CSV are preserved with the same IDs

---

## Files

- `content_bank_with_reasoning.csv` — final CSV (163 rows, 22 columns)
- `validation_report.md` — full validation breakdown
- `copy_changes_summary.md` — this file
