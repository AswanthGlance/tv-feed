# Feed Preference Collection — Audit

**Version 1.0 — June 2026**

This document audits the current implementation against the template spec,
documents reusable rules, and records guidance for future usage.

---

## 1. Implementation Audit

### Current question inventory

6 questions in `src/data/preferenceQuestions.ts`, all `surface: 'interstitial'`.

| ID | Template | Trigger | Options | Auto-dismiss | Highlight phrases |
|---|---|---|---|---|---|
| `food-picks` | `multi-select` | after 4 cards | 4 | none | "food feed" |
| `dinner-table` | `scenario` | after 6 cards | 4 | 10s | "dinner table" |
| `which-trip` | `scenario` | after 8 cards | 4 | 10s | "trip" |
| `evening-feel` | `scenario` | after 12 cards | 4 | 10s | "evening" |
| `home-moment` | `scenario` | after 15 cards | 4 | 10s | "space" |
| `which-view` | `scenario` | after 20 cards | 4 | 10s | "view" |

All 6 questions have exactly 4 options. The "Explore more" utility slot has been
removed. Every option is a genuine preference signal with ML boosts.

### Feed composition

`composeFeedWithPreferences()` in `src/logic/feedComposer.ts`:

```
PREFERENCE_INTERVAL = 5   (one preference card every 5 L0 cards)
MAX_PREFERENCE_CARDS = 6  (matches current question count exactly)
```

With 36 L0 items and 6 questions, the unified feed is 42 items:
L0×5 → Pref → L0×5 → Pref → ... until questions exhausted, then remaining L0s.

### Component state machine

`InterstitialQuestion` manages three phases internally:

| Phase | Visible elements | Interaction active |
|---|---|---|
| `question` | Full question UI | Yes — cards, buttons, keyboard |
| `celebration` | Fly layer + agent + reply | No — read only |
| `exit` | Fading everything | No |

Phase transitions are one-way: `question` → `celebration` → `exit`. There is no back
navigation within the preference card. Back/Escape during `question` calls `onDismiss`.

### FLIP implementation

The ghost clone approach does not use the React FLIP library or Framer Motion.
It is vanilla DOM + GSAP:

1. `getBoundingClientRect()` on source elements — captured synchronously before any mutation
2. `document.createElement('div')` per ghost — appended to `flyLayerRef`
3. GSAP animates `left`, `top`, `width`, `height` on the ghost elements directly
4. `flyLayer.innerHTML = ''` on cleanup

This is intentional — React state updates during the FLIP would cause layout recalculation
between capture and play, breaking the animation. The fly layer is intentionally outside
React's rendering lifecycle.

### Reply system

`StructuredReply` uses `TypewriterText` per line, not `GlanceTextReveal`.
This is correct: agent replies are conversational — character insertion with cursor is
the right metaphor. `GlanceTextReveal` (stagger blur of pre-rendered text) is for
L0 content where layout stability matters.

`REPLY_LINES` is a hardcoded map from option `id` to `[string, string, string]`.
For multi-selection, lines are constructed dynamically from option labels.
Options without an entry in `REPLY_LINES` fall back to `"That. / Got it. / Updating your feed."`.

### Idle and auto-dismiss

Two separate timeout systems coexist:

- `idleMs` (default 12s): resets on any keyboard input; fires `onDismiss`
- `autoDismissMs` (per question, in data): visual progress bar countdown; fires `onDismiss`

`food-picks` has `autoDismissMs: 0` — no timer, because it is multi-select and the
user needs time to make multiple choices. All other questions use 10s.

---

## 2. Reusable Rules

Rules that MUST be preserved when adapting this template to other surfaces.

### Visual rules

**Rule V1 — Background must be blurred feed content, not a flat color or new asset.**
The preference card should feel like the feed pausing, not redirecting.
Exception: if no previous image exists (cold start), use `#080416` as fallback.

**Rule V2 — Text labels are always below card images, inside a gradient scrim.**
Never: white text overlaid directly on an unprotected image.
The gradient: `linear-gradient(to top, rgba(4,2,14,0.88) 0%, rgba(4,2,14,0.22) 50%, transparent 72%)`.

**Rule V3 — Focused card is scale(1.06). All other cards are scale(0.94).**
This contrast is essential on TV. A scale difference of 0.12 reads clearly at 10 feet.
Do not reduce this to 1.0 / 1.03 — it will be invisible on actual television hardware.

**Rule V4 — Maximum 4 options visible at once.**
More than 4 options on a TV card row causes cards to be too narrow to read at viewing distance.
If more options are needed, split into two sequential questions.

**Rule V5 — Every option must be a genuine preference signal.**
No utility options ("Explore more", "None of these", "Skip"). These produce no signal and
undermine the conversational framing. If the user wants to skip, they use Back/Escape.

### Animation rules

**Rule A1 — Selected cards physically move. They are never recreated.**
The FLIP technique must be used. Fading out and fading in different DOM elements breaks
the "remembered" feeling — the user's eye tracks what happens to the thing they chose.

**Rule A2 — Front card leads the flight. Back-of-deck cards follow with delay.**
`flightDelay = (selEntries.length - 1 - i) * 0.06s`
Front card (i=0) gets the longest delay value, which means... actually:
`i=0` → delay = `(n-1)*0.06`, `i=n-1` → delay = 0.
Correction: back cards (higher index) fly first, front card last — so front card
arrives last and lands on top of the deck. This reads as "the thing you care about
most arrives last and stays front."

**Rule A3 — Agent appears AFTER the deck settles, not before.**
The deck settling completes at `FLIGHT + (n * stagger) + SETTLE` time.
Adding 180ms buffer before agent entrance: `totalFlightMs = (flight + stagger + settle + 0.18) * 1000`.
If the agent appears before the deck lands, the acknowledgement and the motion compete.

**Rule A4 — No easing changes without measuring on actual TV hardware.**
`power3.inOut` for flight, `back.out(1.3)` for settle. The `back.out` spring is
deliberately subtle — `back.out(2.0)` overshoots too much on large screens.

**Rule A5 — All GSAP animations must be killed on component unmount.**
Every timeline and every `setTimeout` must be tracked and cancelled.
`timersRef.current.forEach(clearTimeout)` in `useEffect` cleanup.
`tl.kill()` before creating a new timeline.

### Copy rules

**Rule C1 — Line 2 of the reply is the emphatic beat.**
It is larger, bolder, and rendered at near-full white opacity.
Keep it to 1–4 words. It is the moment of warmth.

**Rule C2 — Line 3 always begins with "I'll..." or names the feed directly.**
Active voice. First person. Never passive ("preferences updated", "feed has been adjusted").

**Rule C3 — Never use enthusiastic filler words.**
"Great!", "Excellent!", "Amazing!" reads as fake assistant energy.
The warmth comes from brevity and directness, not exclamation marks.

**Rule C4 — The highlight phrase in the question is 1–3 words max.**
It draws the eye to the core subject of the question.
Do not highlight an entire clause — it dilutes the effect.

### Data rules

**Rule D1 — confirmationText in each option is Line 1 of the agent reply.**
It must end with a period. It echoes back the option's subject matter.
Example: option `id: 'south-indian'`, `confirmationText: 'South Indian food.'`

**Rule D2 — boosts must include `categories` at minimum.**
Options without categories produce no signal. At minimum:
`boosts: { categories: ['food'] }`. Richer signals include `subCategories`, `vibes`,
`regionOrCulture`.

**Rule D3 — cooldownKey prevents re-asking the same topic.**
Use a shared `cooldownKey` across questions that cover the same axis
(e.g. two food questions should share `'food-*'` or use distinct keys that are
both checked by the scheduler).

---

## 3. Future Usage Guidance

### Adding a new question to the feed

1. Open `src/data/preferenceQuestions.ts`
2. Add a `QuestionConfig` entry to `INTERSTITIAL_QUESTIONS`
3. Set `surface: 'interstitial'`, `template: 'scenario'` or `'multi-select'`
4. Write exactly 4 options, each with `image`, `label`, `boosts`, `confirmationText`
5. Add a `REPLY_LINES` entry in `InterstitialQuestion.tsx` for each option `id`
   if the option needs a custom reply (otherwise fallback is used)
6. Done. No other changes needed.

### Adapting to a setup / onboarding flow

1. Set `surface: 'setup'`
2. Set `autoDismissMs: 0`
3. Set `bgImage` to a dedicated onboarding background asset
4. In the consuming component, pass `currentL0Image` as `undefined` — the `bgImage`
   from the question config will be used instead
5. Wire `onAnswer` to write to `GlanceProfileDraft` instead of `PreferenceProfile`
6. Consider warmer reply language for Line 3 in `REPLY_LINES` (first-time framing)

### Adapting to a travel intent modal

1. Create a new `QuestionConfig` with `gapAxis: 'cat:travel'`
2. Option images: destination/landscape photography
3. Boosts: heavy on `regionOrCulture` and `subCategories`
4. The FLIP animation, agent reply, and exit flow work identically
5. Trigger via a direct render in the consuming component (not via `composeFeedWithPreferences`)

### Changing the deck stacking to a side-by-side layout

The deck offsets are defined in `DECK_OFFSETS` in `InterstitialQuestion.tsx`:
```ts
const DECK_OFFSETS = [
  { rotate: -2, x:  0, y:  0,  scale: 1.00, opacity: 1.00 },  // front
  { rotate:  5, x: 10, y: 10,  scale: 0.97, opacity: 0.90 },  // middle
  { rotate: -7, x: -8, y: 18,  scale: 0.94, opacity: 0.75 },  // back
];
```
Replace these values to achieve a different layout after flight.
The flight itself (to center) remains unchanged — only the settle phase applies these offsets.

### Single-select vs. multi-select

- `template: 'scenario'` or `'single-select'` → first click commits immediately
  (`triggerCelebration(new Set([opt.id]))`)
- `template: 'multi-select'` → clicks toggle selection; Done button commits
  (`commitMulti()` → `triggerCelebration(selected)`)
- No other changes needed — the FLIP and reply system handle both modes

### Using in a non-feed context (modal, overlay)

`InterstitialQuestion` renders into `position: absolute, inset: 0`. It expects to fill
its parent container completely. The consuming component is responsible for providing
that container and handling `onAnswer` / `onDismiss`.

`PreferenceCard` in `src/components/Feed/PreferenceCard.tsx` is the reference wrapper:
```tsx
<div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
  <InterstitialQuestion ... />
</div>
```

---

## 4. Known Constraints

**No more than 4 options.** The card row uses `flex: 1` equal sizing.
5+ cards at 1920px wide produces cards ~330px wide, which is the minimum acceptable
card width. Below 4 items the cards are spaciously wide — this is fine.

**Reply copy must be pre-authored for single-select options.**
The `REPLY_LINES` map in `InterstitialQuestion.tsx` has hardcoded copy for each
known option `id`. Dynamically-generated questions (from backend or CMS) need a
fallback and ideally a way to pass `replyLines` via `QuestionConfig`.
Current fallback: `["That.", "Got it.", "Updating your feed."]` — generic but functional.

**Ghost cards use inline `backgroundImage`.**
If images are served from a CDN with aggressive CORS policies, the ghost background
images may fail silently (white fill with gradient). This has not been an issue with
the current `/images/feed/` static asset setup.

**Auto-dismiss and idle-dismiss are independent.**
`autoDismissMs` controls the visual progress bar. `idleMs` is a separate timeout
that fires on no keyboard interaction. Both call `onDismiss`. They are not synchronized.
If both are set, whichever fires first wins.

**The fly layer is not accessible.**
Ghost divs have `pointer-events: none` and no ARIA roles. They are purely visual.
The original card elements (now hidden) retain their DOM presence and any ARIA attributes.
Screen readers will not announce the FLIP animation — this is acceptable for a TV product
where screen reader use is not a primary concern.

---

## 5. Files Changed (session history)

| File | Change |
|---|---|
| `src/data/preferenceQuestions.ts` | Added 4th genuine option to all 6 questions |
| `src/components/Polls/InterstitialQuestion.tsx` | Removed `showExplore` slot and keyboard branch |
| `src/components/Feed/PreferenceCard.tsx` | Created — thin wrapper for feed usage |
| `src/logic/feedComposer.ts` | Created — `composeFeedWithPreferences()` |
| `FEED_PREFERENCE_COLLECTION_TEMPLATE.md` | Created — this template spec |
| `FEED_PREFERENCE_COLLECTION_TEMPLATE_AUDIT.md` | Created — this audit |

---

## 6. Related Documents

| Document | What it covers |
|---|---|
| `GLANCE_TEXT_REVEAL_SYSTEM.md` | `GlanceTextReveal` component API and speed presets |
| `PREFERENCE_OPTION_CLEANUP.md` | Record of the "Explore More" removal and 4th option additions |
| `CLAUDE.md` | Architecture overview, signal→ranking invariant, feed composition |
