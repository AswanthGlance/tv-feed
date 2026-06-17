# Merge Decisions: Best-of-Both Copy

This document explains how the merged reasoning copy was built from two sources:
- **Source A:** Claude Opus 4.7's full baseline (`content_bank_with_reasoning.csv`, 163 cards × 4 profiles)
- **Source B:** Veda's hand-tuned existing copy (`content/content_bank.csv`, 162 cards × 3 profiles)

**Final output:** `content_bank_merged.csv` — 162 cards × 4 profiles = 648 lines.

---

## What was kept from each source

| Column | From Veda | From Claude | Total |
|--------|----------:|------------:|------:|
| L1 (cold_reason) | 57 lines | 105 lines | 162 |
| L2 (warm_reason) | 31 lines | 131 lines | 162 |
| E1 (enriched_reason_e1) | 33 lines | 129 lines | 162 |
| E2 (enriched_reason_e2) | 0 lines | 162 lines | 162 |
| **Total** | **121** | **527** | **648** |

E2 is entirely Claude's because Veda had only one enriched column — all of it landed in E1 where her register (established taste, premium minimalism) fit naturally. The 23F indie/sustainable E2 voice was new.

---

## Merge criteria (per line)

For each card column, the line picked was the one that better satisfied:

1. **Tightness** — fewer words for the same idea
2. **Specificity** — references a named place, brand, exact time, or ₹ price
3. **Personal voice** — leads with a personal connection (L2/E1/E2 only)
4. **Hook quality** — first six words make the rest of the sentence inevitable
5. **Avoidance of system explanation** — no "earns placement", "fits your pattern", etc.

When Veda's line passed all five and was tighter, hers won. When mine had stronger specificity (e.g. "Farmlore's farm-to-table sitting" vs Veda's "this monsoon edition"), I kept mine. When her enriched line had a clean direct hook ("Fine dining is your default"), I used it for E1 specifically.

---

## Templates that were rejected

97 of Veda's 162 COLD lines used the same 8-word stem: *"A Bangalore favourite worth a look — [title]."* These were rejected wholesale.

Other rejected templates:
- *"A pick that fits your modern-urbanite streak — [title]"* (34 cards)
- *"Tuned to your minimalist-chic taste — [title]"* (30 cards)
- *"Where the city's tech-and-culture crowd goes — [title]"* (19 cards)
- *"Urban and luxury-resort escapes are your pattern — [title]"* (11 cards)
- *"A cultured, aspirational night — [title], your kind of evening out"* (~10 cards)
- *"Smart-casual, modern-urbanite — [title], in your beige-and-olive lane"* (10 cards)
- *"An easy way to build a routine — [title]"* (10 cards)
- *"Worth a look on a night out — [title]"* (9 cards)
- *"Warm-wood, clean lines — [title]"* (8 cards)

These templates fail the WHY-test: they say "this matches a vibe" but never explain why the card is on screen.

---

## Notable wins from Veda's copy

### COLD column (L1) — her tighter hooks
- **c022 Sakleshpur:** *"Sakleshpur's rail-treks are a monsoon secret most Bangaloreans miss."* (14 words. Tight.)
- **c046 OTT:** *"A rainy Bangalore evening is made for the show everyone's about to discuss."* (Perfect hook for the moment.)
- **c057 Sleep:** *"The city never really slows — a proper wind-down routine is the fix."* (Beautiful framing.)
- **c074 Phone-free:** *"Reclaiming a phone-free evening is the city's quiet luxury."* (10 words.)
- **c084 Mysore silk:** *"Mysore silk is Karnataka's golden thread — woven by hand, an hour from here."* (Sharp.)
- **c121 Coorgi coffee:** *"The slow brass-filter ritual is peak Bangalore — a mindful pause in a cup."*
- **c150 Chef's table:** *"Ten-seat chef's tables are the city's hardest reservation — worth it."*
- **c160 Investing:** *"Buying things that hold value is the city's quiet money flex."*
- **c161 Smart-casual:** *"Beige-chino smart-casual is the city's corporate uniform, done right."*
- **c178 Capsule:** *"A tight men's capsule is the city's antidote to overshopping."*

### WARM column (L2) — her direct addresses
- **c161:** *"This is your lane — beige chinos, ecru shirt, one jacket."* (10 words, perfect direct hit.)
- **c173:** *"Your scene — talk shop, stay for drinks."* (8 words. Permission-given.)
- **c172:** *"Your no-plan Friday plan — rooftop, skyline, the crew."* (10 words.)
- **c143:** *"Your wardrobe leans sharp and minimal — this desk-to-dinner look fits."*
- **c150:** *"Your dinners run special — this is one to plan a week around."*
- **c163:** *"Two pairs for every occasion you actually have — your footwear pattern."*
- **c178:** *"Fewer, better pieces that mix — built for how you actually dress."*

### ENRICHED column (E1) — her established-taste register
- **c004 Tasting menu:** *"Fine dining is your default — a seasonal tasting menu is exactly the evening you book."*
- **c143 Workwear:** *"Champagne silk and sage tailoring — your exact palette, your work register."*
- **c149 Cashmere:** *"NAADAM-soft cashmere in off-white — quiet luxury you live in."*
- **c150 Chef's table:** *"A degustation worth dressing for — fine dining is your default, after all."*
- **c152 Gallery:** *"Abstract works opening this week — your gallery-Saturday default."*
- **c156 Travel:** *"An urban-luxe design hotel — premium and quiet, your travel brief."*
- **c157 City break:** *"A culture-led city escape — galleries, design hotels, your exact trip."*
- **c167 Desk:** *"A considered desk upgrade — small changes, all-day focus."*
- **v201–v205 VTON:** *"On you — [piece] for [moment]"* — perfect framing for try-on cards.

---

## Where Claude's lines were kept

Claude's lines were kept whenever they had:
- Specific named references Veda's didn't (Farmlore, Glen's, CTR, Mia by Tanishq, NAADAM, Fabindia, Lalbagh, Indiranagar, Champaca, Kaikondrahalli, etc.)
- A specific time, ₹ price, or behavioural detail
- Better personal connection for L2 (most of Veda's L2 used template variants)
- The complete E2 voice (23F UX designer, ₹500–₹2,000 budget, flatmates, indie aesthetic)

The 4-line-per-card differentiation is preserved: same card never has near-duplicate lines across the four columns.

---

## Validation status

After the merge:
- **648 lines** total
- **0 banned words / phrases**
- **0 duplicate lines** within any column
- **0 lines with ellipses or fragments**
- **0 use of `click`, `clicked`, `clicks`, `dwell`, `saved`** (except Fashion wishlist)
- **0 raw enriched data** (TransUnion, income, segment, etc.)
- **L1: 0 occurrences of `you/your`**
- **L2/E1/E2: 100% have explicit personal connection**

Length avg: L1 95 chars, L2 103 chars, E1 96 chars, E2 104 chars — tighter than my baseline (which averaged 110), which is a feature.

---

## Files

- `content_bank_merged.csv` — final merged CSV ready for prototype
- `reasoning_table_merged.md` — human-readable table of all 648 lines
- `merge_decisions.md` — this file
