# Setup Flow Export — Technical Report

## What was exported

All 8 screens of the Glance TV onboarding setup flow, translated from React+TypeScript to vanilla JS.

### Source → Export mapping

| React Component | Export equivalent |
|----------------|-------------------|
| `WelcomeScreen.tsx` | `initWelcome()` + `handleWelcomeCta()` in script.js |
| `BangaloreConfirm.tsx` | `initBangalore()` + `handleBangaloreSelect()` |
| `TVContentQuestion.tsx` | `initTVContent()` + `handleMultiSelectDone('tvc')` |
| `AudienceQuestion.tsx` | `initAudience()` + `handleSingleSelect('aud', idx)` |
| `ShowMoreQuestion.tsx` | `initShowMore()` + `expandShowMore()` |
| `WeekendQuestion.tsx` | `initWeekend()` + `handleMultiSelectDone('wkd')` |
| `StyleQuestion.tsx` | `initStyle()` + `handleMultiSelectDone('sty')` |
| `CinematicText.tsx` | `cinematicText(el, text, opts)` function |
| `SetupStructuredReply.tsx` | `setupStructuredReply(el, lines, onDone)` function |
| `flipCenterStage.ts` | `flipCenterStage(opts)` function |
| `figma-onboarding.css` | `styles.css` (full extraction) |

---

## Key technical decisions

### Mascot
The Rive mascot (`mascot.riv`) requires the `@rive-app/canvas` runtime which cannot run in a simple `<script>` tag without a bundler or module system. It was replaced with:
- **Welcome screen**: inline SVG owl with glow ring + pulse animation  
- **Question screens**: CSS animated dot with sparkle icon

The mascot shape, size, and positioning are preserved. If Rive CDN support is added later, swap out the `.mascot-placeholder` divs with `<canvas>` elements.

### CinematicText
Fully preserved. React's `useEffect` + GSAP timeline was converted to a plain `cinematicText(el, text, opts)` function. Character spans are rebuilt on each call. `onDone` callback fires when the last char resolves.

### flipCenterStage
Fully preserved. The FLIP logic reads `el.firstElementChild` (image container) for the rect and border-radius, exactly matching the React version. Ghost divs are created in the fly layer and animated from source rect to centered rect. Multi-select deck offsets are applied after flight.

### SetupStructuredReply
Fully preserved. 3-line reveal with CinematicText chained via `onDone` callbacks. Pause timings: 550ms after line 0, 450ms after line 1, 800ms before onDone fires.

### Screen state machine
React's `useState<Screen>` is replaced with a `currentScreen` string + `showScreen(name)` / `goToScreen(name)` functions. Each screen has an `initScreen(name)` hook that runs entrance animations and resets state.

### Multi-select state
A shared `MULTI_STATE` object keyed by screen prefix (`tvc`, `aud`, `sm`, `wkd`, `sty`) tracks selected card indices and interactive flag. Replaced React's `useState` + `useRef`.

### Stage scaling
A `scaleStage()` function reads `window.innerWidth/Height` and applies `transform: translate + scale` on the `#stage` div, preserving the 1920×1080 layout at any browser size. Runs on load and on `resize`.

---

## Known limitations

1. **Rive mascot** — replaced with SVG/CSS placeholder. Actual animated mascot not available without runtime.
2. **Lottie handwave** — Welcome screen handwave entry animation not included (requires `@lottiefiles/dotlottie-react`). Mascot starts directly in idle state.
3. **TV keyboard navigation** — Arrow key remote control nav not wired (click/mouse only in this export).
4. **Self-evaluation screen** (selfie / discovery-appetite / tuning) — excluded per spec. Done screen shown after Style question.
5. **GSAP CDN** — requires internet. Fully offline use requires local GSAP download.
6. **Google Fonts CDN** — requires internet for Plus Jakarta Sans / Instrument Sans. Falls back to system-ui if offline.
7. **Preference signals** — no actual `PreferenceProfile` weight tracking. Display only.

---

## How to make fully offline

1. Download GSAP 3 from https://gsap.com/docs/v3/Installation/  
   Replace in `index.html`:
   ```html
   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
   ```
   with:
   ```html
   <script src="assets/gsap.min.js"></script>
   ```

2. Download Plus Jakarta Sans + Instrument Sans from Google Fonts  
   Replace the `<link>` in `<head>` with `@font-face` declarations pointing to local font files.

---

## Test checklist

- [ ] Welcome: mascot enters, line 1 reveals, line 2 splits to 2 lines, CTA appears
- [ ] Welcome: click CTA → intro fades, mascot pulses, response text reveals → transitions to Bangalore
- [ ] Bangalore: question reveals, 2 cards appear, click card → FLIP animation → 3-line reply → transitions to TV Content
- [ ] TV Content: question reveals, 4 cards appear, click 1+ cards → Next activates → FLIP → reply → transitions
- [ ] Audience: single-select auto-commits on click → FLIP → reply
- [ ] Show More: 3 initial cards, click Explore More → 6 extra cards animate in, row becomes scrollable
- [ ] Weekend / Style: same as TV Content
- [ ] Done: mascot + text appears, Start Over returns to Welcome
- [ ] Scale: layout fits browser at various zoom levels without overflow
