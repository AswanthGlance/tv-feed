# Glance TV — AI Ambient Feed Prototype

An AI-first ambient screensaver experience for the television. A single AI agent introduces each card, explains *why it's relevant to you*, reacts to your choices in real time, and offers to act on your behalf.

**The bet:** most feeds rank silently and hope you click — Glance makes its intelligence *visible*.

## What's in here

| File | What it is |
|---|---|
| `cold_start.html` | Cold-start user — intro + onboarding + context-only feed (Bangalore, weather, time). |
| `warm_start.html` | Warm user — recap of past behaviour, then a profile-driven feed. |
| `enriched.html` | Enriched user — deep profile + VTON on fashion cards. |
| `content/content_bank.csv` | **The single source of truth** — all content + per-user reasoning (see below). |
| `content/images/` | All content-bank visuals (1920×1080, generated via Nano Banana). |
| `profiles/` | The warm + enriched user profiles that drive personalization. |
| `assets/` | UI / chrome visuals (intro backgrounds, fashion looks, VTON placeholder). |
| `Glance_TV_Prototype.html` | The earlier all-in-one prototype (kept for reference). |
| `Glance_TV_Experience_PRD.md` | The full Product Experience PRD. |

## Running it

The three user-state feeds **read `content/content_bank.csv` directly in the browser**, so they must be served over HTTP (browsers block `fetch()` of local files via `file://`). One command, from this folder:

```
python3 -m http.server 8000
```

Then open **http://localhost:8000/cold_start.html** (or `warm_start.html` / `enriched.html`).

- **↑ / ↓** — browse the feed at your own pace
- Leave it idle — the agent auto-plays and types its reasoning
- Click a preference tile or a **Yes** CTA to advance and shape the feed

## Editing content — one file, no rebuild

`content/content_bank.csv` is the **only** thing to edit. The feeds parse it on every load, so:

1. Edit a row (or add one) in `content/content_bank.csv` — title, subtitle, image, and the three reasoning columns (`cold_reason`, `warm_reason`, `enriched_reason`).
2. Reload the page. Your change is live. **No JSON to regenerate, no build step.**

To put a new card into a feed, add its `id` to the feed's `GLANCE_FEED_IDS` list near the bottom of the relevant HTML file.

## The feed

100+ cards in two journeys, with a visible chapter divider:

- **New user (cards 1–30):** hero intro → location confirmation → visual preference cards (evening, your Bangalore, this week, cuisine, style, travel) → a signal-anchored feed where every card cites your picks + city + live weather.
- **Returning user (cards 31–100):** assumes history — clicks, saves, streaks, waitlists, price drops, calendar-aware nudges.

Content spans food, cafés, nightlife, culture, wellness, fitness, outdoors, heritage, home/tech, **fashion**, and **travel**.

## Interaction model

- **Agent-first reveal** — the agent types *why it's relevant* before the glance appears.
- **One mascot, always** — it types the line, then travels to the CTA and hands it over.
- **CTA = a yes/no the agent asks** — one **Yes** to accept and act.
- **Visual preference cards** — max 4 tiles, last is always "Explore more"; picks trigger a friendly acknowledgement and re-weave the feed.
- **Smart typing** — types during idle auto-play; instant on manual navigation.

## Regenerating visuals

Images are generated on Vertex AI (`glanceai-prod-5aea`, `gemini-2.5-flash-image`, `responseModalities:["IMAGE"]`, `aspectRatio:"16:9"`), upscaled to 1920×1080. See PRD §19.

## Contributing

This is internal Glance product work. Open a PR or branch for changes; keep the prototype a single self-contained HTML file so it stays double-click runnable.

---

## GTV Feed Intelligence — L1/L2/L3 Reasoning Prototype

A separate demo showing the progression from Cold Start → Warm Start → Enriched Start, with reasoning quality grounded in the Reasoning Copy Pack.

| File | What it is |
|---|---|
| `index.html` | Feed intelligence app shell |
| `css/styles.css` | Styles |
| `js/app.js` | Feed rendering, layer switching, signals panel |
| `js/validate.js` | 198 validation checks (runs on load, logs to console) |
| `data/cards.json` | 22 L0 cards with L1/L2/L3 reasoning copy |
| `data/profiles.json` | Mock L1/L2/L3 profiles with interaction + household data |

**Run:**
```bash
python3 -m http.server 8080
# open http://localhost:8080
```
Requires a local server (`fetch()` for JSON). Not `file://` runnable.

**Intelligence layers:** L1 = context only · L2 = interaction history · L3 = household fit. Card metadata is the what; reasoning is the why.
