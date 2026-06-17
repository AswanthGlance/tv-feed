# SETUP / ONBOARDING — CLIENT CORRECTIONS PASS

Figma: https://www.figma.com/design/WWQZ2v5weLHehGyhE51wsR/QBR---Ambient?node-id=4065-6358
Screenshot reference: attached client screenshot (carousel with two cards visible)

---

## 1. Logo Update

**Component:** `src/components/Shared/GlanceLogo.tsx` (new shared component)

Replaced SVG box icon with correct Figma/video treatment:
- `glance` — lowercase, Instrument Sans, 22px/700, white
- `✦` — inline after word, 14px, 75% opacity, subtle drop-shadow glow
- No bounding box, no square icon background
- Applied via `<GlanceLogo />` in: WelcomeScreen, BangaloreConfirm, WorldsQuestion, DiscoveryAppetite, SelfieScreen, TuningTransition

---

## 2. Intro Text Hierarchy

**File:** `src/components/Activation/WelcomeScreen.tsx`

Changed from single sequential line swap to **two-line simultaneous group**:
- Line 1: `"Hello, I'm Glance."` — 52px/700, bright white (primary)
- Line 2: `"I'm your AI assistant."` — 34px/400, 62% opacity (secondary)
- Both appear together and stay on screen while line 3 types below
- Line 3 types separately: `"I'll turn idle time..."` — smaller, muted

CSS: `.fg-intro-line1`, `.fg-intro-line2`, `.fg-third-line-area` / `.fg-third-line-text`

---

## 3. Agent Response Position

**Files:** All question screens + WelcomeScreen

Response text now appears **immediately below the mascot** using new CSS classes:
- `.fg-welcome-response` — on WelcomeScreen, inside the stage column, `margin-top: -16px` to pull close
- `.fg-q-response` — on question screens, placed between mascot and question, `padding: 0 240px`

Removed `.fg-response-area` which placed response at 50% screen center (too far).

---

## 4. Bengaluru Card Selected State Fix

**File:** `src/styles/figma-onboarding.css`

Fixed double-outline by:
- Splitting focus + selected into separate rules using `:not()` selector
- `.fg-img-card--focused:not(.fg-img-card--selected)` — white ring only when focused but not selected
- `.fg-img-card--selected` — `scale(1.042) !important` + white border + single soft glow only (no multi-ring shadow)
- `.fg-img-card--selected img` — `scale(1.12)` — image grows inside selected card
- Removed old combined `fg-img-card--focused, fg-topic-card--focused` override block that was creating conflicting rules

---

## 5. Duplicate Copy Removal

**File:** `src/components/Activation/BangaloreConfirm.tsx`

Removed second bridge line `"Let me bring more of what feels like you"` — this was the exact same text as WorldsQuestion's question, making it repeat.

Now BangaloreConfirm response is single-line:
- Yes: `"Perfect – Bengaluru it is. Let's make this feel like yours."` → exit
- No: `"No problem – I'll start open and tune as you explore."` → exit

**File:** `src/components/Calibration/WorldsQuestion.tsx`

Question changed from `"Let me bring more of what feels like you"` (duplicate) to `"What topics should your TV surface?"` — distinct and non-repetitive.

---

## 6. Selection Tray Cropping Fix

**File:** `src/styles/figma-onboarding.css`

Fixed carousel card cropping:
- `.fg-carousel-viewport` — added `padding: 12px 0 16px` so focus ring is never clipped by overflow
- `.fg-carousel-track` — added `padding-right: 160px` (was 0), ensured `flex-wrap: nowrap`
- Cards remain visible at full size; no text or edge cutting

---

## 7. Selected Option Scale

All selection tray cards now:
- **Focused:** `scale(1.03)` + white ring (6px total via box-shadow)
- **Selected:** `scale(1.038–1.042)` — slightly larger than focused — + single white border + soft purple glow
- Non-selected: untouched opacity and scale
- Applies to: `.fg-img-card`, `.fg-topic-card`

---

## 8. DiscoveryAppetite Redesign

**File:** `src/components/Calibration/DiscoveryAppetite.tsx`

Completely redesigned from broken vertical list to **horizontal carousel** — same visual system as WorldsQuestion:
- 4 full-bleed image cards (`420×320`) in a scrollable horizontal strip
- Same mascot-top-center → typed question → subtitle → carousel entrance
- Cards show label + description at bottom-left
- Single-select; selection → agentic loop
- TV remote: ArrowLeft/Right to navigate, Enter to select
- Agent response types close to mascot, not at bottom

CSS: `.fg-disc-card`, `.fg-disc-card-body`, `.fg-disc-card-label`, `.fg-disc-card-desc`, `.fg-carousel-viewport--discovery`

---

## 9. SelfieScreen

**File:** `src/components/Activation/SelfieScreen.tsx`

- Agent response moved to TOP section (below question, near mascot) via `.fg-selfie-response`
- QR popup rebuilt with correct Figma 4065-6517 structure:
  - `✦ Quick upload` eyebrow chip
  - `"Scan QR code"` heading (34px/800)
  - Instruction subtitle
  - SVG QR pattern (pixel-grid, not decorative circles)
  - `"Or browse files instead"` secondary action
  - Close button top-right
- `GlanceLogo` component applied

---

## Files Changed

| File | Change |
|---|---|
| `src/components/Shared/GlanceLogo.tsx` | New shared logo component |
| `src/components/Activation/WelcomeScreen.tsx` | Two-line intro, response near agent |
| `src/components/Activation/BangaloreConfirm.tsx` | GlanceLogo, remove duplicate copy, response near agent |
| `src/components/Calibration/WorldsQuestion.tsx` | GlanceLogo, non-duplicate question, response near agent |
| `src/components/Calibration/DiscoveryAppetite.tsx` | Full horizontal carousel redesign |
| `src/components/Activation/SelfieScreen.tsx` | GlanceLogo, response near agent |
| `src/components/Calibration/TuningTransition.tsx` | GlanceLogo |
| `src/styles/figma-onboarding.css` | Logo styles, intro hierarchy, response proximity, card selection fix, carousel overflow, discovery cards |

---

## Not Changed

- L0 feed, L0 preview, product cards, CTA beam, feed templates
