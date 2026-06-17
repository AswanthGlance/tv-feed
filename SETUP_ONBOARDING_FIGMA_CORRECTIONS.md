# SETUP / ONBOARDING — FIGMA CORRECTIONS PASS

---

## Figma Links Used

| Screen | Figma Node |
|---|---|
| Welcome / Q2 / Q3 flow | `4000-7178` |
| Q3 Topics (WorldsQuestion) | `4055-5197` |
| Q4 Selfie layout | `4065-6358` |
| Q4 QR popup | `4065-6517` |

---

## 1. Glance Logo

**Fix:** Replaced SVG square icon (`28×28`, `rx=7`, white fill, `✦` in dark) + lowercase `"glance"` text (`22px / 700`). Applied to all 4 onboarding screens (WelcomeScreen, BangaloreConfirm, WorldsQuestion, SelfieScreen).

**Was:** `✦ Glance` with separate spark box element.

---

## 2. Typewriter Cursor Fix

**Fix:** `TypewriterText` rewritten to only render **revealed characters** as DOM nodes. The cursor `<span class="tw-cursor">` is placed immediately after the last revealed character — so it moves letter-by-letter with the text. Previously all characters were rendered hidden and the cursor was always at the end.

**Was:** All chars rendered invisible, cursor statically at end of full string.

**File:** `src/components/Shared/TypewriterText.tsx`

---

## 3. Agent Response on CTA Tap (Welcome Screen)

**Fix:** Full agentic loop after "Let's tune my TV's vibe!":

1. CTA button morphs into input bubble and floats up toward mascot
2. Mascot receives it with a brief scale pulse
3. Agent response types: *"Perfect. Let me ask you a few things to shape your feed."*
4. After response finishes → mascot + response fade up and out → BangaloreConfirm mounts

**Was:** Mascot immediately moved to top on CTA press with no response phase.

**File:** `src/components/Activation/WelcomeScreen.tsx`

---

## 4. Typing Effect — All Setup Text

All question text, response text, and transition narration now uses `TypewriterText`:

| Screen | Typed text |
|---|---|
| WelcomeScreen | 3 intro lines + agent response |
| BangaloreConfirm | Question + both bridge/response lines |
| WorldsQuestion | Question + agent Done response |
| SelfieScreen | Question + agent response |

Speed: **30-32ms/char** (matches TypeCraft 35ms target, slightly faster for longer lines).
Cursor: blinking line, disappears 200-350ms after done.

---

## 5. Selection State Redesign

**Fix:** Cards now have:
- **Focused:** `scale(1.028)` + white 6px ring + soft purple outer glow (`rgba(160,100,255,0.28)`)
- **Selected:** `scale(1.015)` + white 90% border + whitish soft outer glow

Applied to both `.fg-img-card` (Q2) and `.fg-topic-card` (Q3 carousel).

**Was:** Generic white ring outline only, no glow, no scale difference.

---

## 6. User Input → Agent Flow

Every selection point now follows the agentic sequence:

1. User selects option
2. Selected input animates as **input bubble** (rounded speech-bubble shape, floats up toward mascot)
3. Mascot **receives** with scale pulse
4. Agent **responds** (typed)
5. Screen exits

Applies to: BangaloreConfirm (Yes/No), WorldsQuestion (Done), SelfieScreen (continue).

---

## 7. Third Layout (WorldsQuestion) Fix

**Fix:** WorldsQuestion now uses identical screen structure to BangaloreConfirm (Q2):
- Mascot top-center
- Question types via `TypewriterText`
- Subtitle fades in after question done
- Carousel slides in (same timing as cards in Q2)
- Action pills appear last
- Done → agentic bubble → response → exit

**Was:** Breaking because carousel viewport had incorrect overflow/padding causing layout shift.

Carousel fix: `fg-carousel-track` starts at `x: 0` (first card flush-left at 160px padding), GSAP `x` moves it left. Track width is `8 * STRIDE = 3872px` which doesn't overflow because `fg-carousel-viewport` has `overflow: hidden`.

---

## 8. Q4 Selfie Screen (New)

**Layout (Figma 4065-6358):**
- Mascot top-center + typed question
- Left panel: portrait preview card (`380×480`) with style-preview image, gradient overlay, "✦ Style match" tag, title
- Right panel: QR block (`200×200`) + "Upload selfie" button + descriptions

**QR Popup (Figma 4065-6517):**
- Appears on "Upload selfie" press
- Full-screen frosted overlay with centered card
- Decorative SVG QR pattern, close button
- Demo file input: selecting a local file replaces QR with uploaded photo preview

**Photo replace:** When file selected, `uploadedPhoto` state sets `src` of both the left preview card and the right panel. White ring + glow confirms selection.

---

## Files Changed

| File | Change |
|---|---|
| `src/components/Shared/TypewriterText.tsx` | Rewritten: revealed-only render, cursor tracks typing |
| `src/components/Activation/WelcomeScreen.tsx` | Added Phase B: input bubble + agent response + exit |
| `src/components/Activation/BangaloreConfirm.tsx` | Typed question, agentic flow, typed response/bridge |
| `src/components/Calibration/WorldsQuestion.tsx` | Typed question, same layout as Q2, Done→agentic |
| `src/components/Activation/SelfieScreen.tsx` | Full rewrite: Q4 Figma layout, QR popup, photo replace |
| `src/styles/figma-onboarding.css` | +input bubble, +response area, +selection glow, +selfie panels, +qr popup |
| `src/styles/globals.css` | Added Instrument Sans font import |

---

## Not Changed (as instructed)

- `src/components/L0/` — all L0 Glance work untouched
- `src/components/Feed/` — untouched
- `src/L0PreviewApp.tsx` — untouched
- All non-onboarding CSS

---

## Known Deviations from Figma

1. **QR code** is a decorative SVG pattern, not a real scannable QR. Real QR generation would need a library (qrcode.react) — can be added if needed.
2. **Selfie upload** uses a file input for demo. In production this would be a phone-side upload flow.
3. **Q4 layout proportions** are adapted for 1920×1080 TV stage; Figma dimensions were scaled proportionally.
