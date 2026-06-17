# Glance TV — Sample User Profiles (index)

These 10 sample profiles represent the **cold → warm → enriched** maturity ladder that the Glance preference-collection product is designed to move users along. They are demo/seed data, all set in **Bangalore**.

**Important — there are two schemas here, on purpose.** Profile *completeness* is expressed two ways: by how filled a profile is, and (between tiers) by which schema shape it uses. This is intentional, not drift. The richer a user's profile, the deeper the schema it warrants. `data_quality` (`cold` / `sparse` / `rich`) tells you the tier in every file. When sharing any single file, mention its tier so its nature is clear.

---

## The files, by tier

### Cold start (1) — schema: flat warm shape · `data_quality: "cold"`
Only location is known (from IP). Almost everything is null; the feed leans on Bangalore local trends + live context (weather/time/day) until the user starts interacting.

- `cold-start_bangalore_location-only.json` — adds a `location_context` block (local trends + default feed strategy).

### Warm — collection-derived (3) — schema: flat warm shape · `data_quality: "sparse"`
Produced **purely by the Glance preference-collection product**: the user answered all 3 onboarding questions (Sunday scenario / worlds / discovery appetite), interacted with 2–3 L0 feed cards, and answered 1–2 in-feed questions. These are the proof that *our collection flow translates into profile inputs*.

- `warm_collection-derived_bangalore_01_calm-nature.json` — calm / nature / wellness lean.
- `warm_collection-derived_bangalore_02_social-food-culture.json` — social / food / culture lean.
- `warm_collection-derived_bangalore_03_home-style.json` — home / style lean (user skipped Q1, so the vibe signal is intentionally thin).

**These three carry two extra fields the others don't**, because they reflect what our product specifically captures:
- `discovery_appetite` — the Q3 answer.
- `collected_inputs` — a provenance block showing the raw onboarding + in-feed inputs and a `derivation` note mapping each input to the field it produced. This is the "preference collection → profile" demonstration. It also notes `not_collected`: fields like `profession`, `fashion_brands`, `fashion_palette` are deliberately null because the product never asks for them (taste, not taxonomy).

### Warm — sample-style (3) — schema: flat warm shape · `data_quality: "sparse"`
Modeled on the original warm sample JSON (richer warm: `profession`, `fashion_palette`, `fashion_brands` populated). These represent a warm profile assembled from blended/other sources, not purely from our flow — so they have no `collected_inputs` block.

- `warm_sample-style_bangalore_01_creative-minimalist.json`
- `warm_sample-style_bangalore_02_fitness-wellness.json`
- `warm_sample-style_bangalore_03_home-festive.json`

### Enriched (3) — schema: deep nested shape · `data_quality: "rich"`
The high-confidence end of the ladder: full demographics, category interests with confidence scores, shopping behavior, deep fashion preferences, lifestyle, chat preferences, and a `_metadata` block. Prices are in **INR** (Bangalore-local; the original enriched sample used USD with a null location).

- `enriched_bangalore_01_tech-streetwear-male.json` — 27, startup PM; sneakers + Apple ecosystem; rooftops, running, gaming.
- `enriched_bangalore_02_design-entrepreneur-female.json` — 44, design entrepreneur; handloom/fusion wear, fine jewellery, curated home; high loyalty, low discount sensitivity.
- `enriched_bangalore_03_creative-sustainable-female.json` — 23, UX designer; thrift/sustainable/eclectic; high exploration, high discount sensitivity, avoids fast fashion.

---

## The two schemas at a glance

| | Flat warm schema (cold + warm) | Deep enriched schema (enriched) |
|---|---|---|
| Top-level keys | `name, city, user_summary, profession, preferences, fashion_palette, fashion_brands, venues, hobbies, occasions, past_activity, signals, data_quality` (+ `discovery_appetite`/`collected_inputs` on collection-derived, + `location_context` on cold) | `demographics, category_interests, shopping_behavior, fashion_preferences, lifestyle_preferences, chat_preferences, _metadata` |
| Depth | flat, sparse, few/no confidence scores | nested, confidence scores, price bands, engagement ratios, interest evolution |
| `data_quality` | `cold` / `sparse` | `rich` |
| Currency (where priced) | — | INR |

## How the ladder reads
- **cold** → location only; feed runs on local trends + context.
- **sparse (warm)** → preferences/venues/hobbies inferred from a few taste choices + interactions; deep commerce detail not yet earned (null).
- **rich (enriched)** → full taxonomy with confidence; what the profile becomes after sustained signal.

Moving users *up* this ladder — cold → warm → enriched — is what the preference-collection product exists to do. The collection-derived warm files show the first rung of that climb actually happening from real captured inputs.
