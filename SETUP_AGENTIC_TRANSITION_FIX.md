# Setup / Onboarding — Agentic Transition Fix

## Summary

Fixes across all setup and onboarding screens only. L0 feed, L0 preview, product cards, and preference insertion are untouched.

---

## 1. Intro Copy Update — WelcomeScreen

**Before:**
- "Hello, I am Glad." / "I am your AI assistant."
- Third typewriter line below both

**After:**
- Line 1: `"Hello, I'm Glance."` — large, primary (52px bold)
- Line 2: `"I'll help tune your TV around you."` — smaller, secondary (34px regular)
- Third line removed entirely

Two-line structure retained. Copy is tighter and purposeful.

---

## 2. GSAP Intro Text Animation — WelcomeScreen

Replaced basic opacity fade with a premium word-stagger reveal:

- Line 1 words animate in one-by-one: `opacity 0→1`, `y 22→0`, `blur 8px→0`, `rotateX -20→0`
- Stagger: `0.09s` per word — Apple TV pacing, not snappy
- Line 2 follows as a single smooth rise after the Rive mascot crossfades in
- CTA appears `0.55s` after line 2 settles

Word spans rendered via `wordSpans()` helper — each word wrapped in `<span class="wrd">` at render time, animated by GSAP selector inside a `tl.call()`.

---

## 3. CTA Copy Replacement — WelcomeScreen

**Before:** `"Let's tune my TV's vibe!"`
**After:** `"Let's personalise this TV"`

Chosen over "Start with my preferences" — shorter, more active, fits the pill width better at 26px font.

---

## 4. Agent Response Positioning Fix

### WelcomeScreen
- Response div moved **above the intro lines** in DOM order, immediately below the mascot wrapper
- `margin-top: -8px` closes gap so it reads as the mascot speaking
- Lines and CTA fade away on CTA press; response fades in right below the mascot

### Question screens (BangaloreConfirm, WorldsQuestion, DiscoveryAppetite)
- Response div moved **before the question title** in DOM order
- DOM order: mascot → response → question → subtitle → cards
- `margin-top: -12px` on `.fg-q-response` pulls it visually tight to the mascot
- Response only becomes visible after selection (GSAP `opacity: 0` initial state), so it doesn't displace question layout during the question phase

---

## 5. Bangalore Agent Size Fix — BangaloreConfirm

**Before:** `size={68}`
**After:** `size={96}`

Mascot is now clearly visible and emotionally present when asking and responding. Same change applied consistently to WorldsQuestion and DiscoveryAppetite.

| Screen | Before | After |
|--------|--------|-------|
| BangaloreConfirm | 68px | 96px |
| WorldsQuestion | 68px | 96px |
| DiscoveryAppetite | 68px | 96px |

---

## 6. Transition Sequencing

Each question screen follows the same GSAP timeline:

1. Mascot enters (spring in)
2. Question types in
3. Subtitle + cards/carousel slide in
4. User selects → other card dims → selected card collapses into bubble
5. Bubble floats to mascot (`y: -260, scale: 0.5, opacity: 0`)
6. Question/subtitle/cards fade out simultaneously
7. Mascot pulse (scale 1.16 → 1.0 with spring back)
8. Response fades in directly below mascot (`0.42s` after pulse)
9. Response types out (TypewriterText, speed 28)
10. Pause (900ms) → screen fades → next step

No abrupt resets. No hard screen cuts between steps.

---

## 7. Response + Next Question Timing

Response and next question never appear simultaneously. The GSAP timeline enforces:

- All question-area elements (`questionRef`, `subtitleRef`, `cardsRef`) fade to `opacity: 0` at `t=0.2s`
- Response appears at `t=1.22s` (after mascot pulse completes)
- Response `onDone` callback triggers a `setTimeout(900ms)` before the screen exit fade
- Next screen enters fresh — no overlap

---

## 8. Files Changed

| File | Change |
|------|--------|
| `src/components/Activation/WelcomeScreen.tsx` | Copy rewrite, removed third line, word-stagger GSAP, CTA copy, response repositioned above intro lines |
| `src/components/Activation/BangaloreConfirm.tsx` | Mascot 68→96, response moved before question in DOM, cleaned up two-line response logic |
| `src/components/Calibration/WorldsQuestion.tsx` | Mascot 68→96, response moved before question in DOM |
| `src/components/Calibration/DiscoveryAppetite.tsx` | Mascot 68→96, response moved before question in DOM |
| `src/styles/figma-onboarding.css` | `.fg-q-response` margin-top -8→-12, padding 240→280px; `.fg-welcome-response` margin-top tightened |

---

## 9. Not Changed

- L0 feed (`src/components/L0/`)
- L0 preview
- Product cards
- Preference insertion system
- Any calibration screens not listed above (Q1Scenario, Q2View, Q3Categories, Q4Vibes, Q5Discovery)
