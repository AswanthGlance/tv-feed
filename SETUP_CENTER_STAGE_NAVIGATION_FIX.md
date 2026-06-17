# Setup Flow — Center-Stage Acknowledgement + Navigation Fix

## Overview

This pass overhauled the setup/onboarding question flow with five changes:
FLIP center-stage acknowledgement, per-question skip, progress label placement,
navigation model, and Explore More horizontal scroll.

---

## 1. FLIP Center-Stage Acknowledgement (all 5 question screens)

**Source of truth:** `InterstitialQuestion.tsx` (preference collection) — copied technique exactly.

**New shared files:**
- `src/components/Calibration/flipCenterStage.ts` — reusable FLIP utility
- `src/components/Calibration/SetupStructuredReply.tsx` — three-line typewriter reply

**What happens on submit:**
1. Selected card(s) fly to center of screen via absolute ghost clones (FLIP technique)
2. Unselected cards fade + scale down simultaneously
3. Agent mascot + three-line typewriter reply appear below the landed card(s)
4. After reply completes, whole screen fades out → `onNext` called

**Ghost clones:** `div` elements with `backgroundImage`, gradient overlay, checkmark badge, label text — appended to a `flyLayerRef` div (zIndex 40) that sits above all content.

**Multi-select deck:** Up to 3 cards form a physical deck using `DECK_OFFSETS` (rotate, x, y, scale, opacity). Flight: 0.62s `power3.inOut`. Settle: 0.38s `back.out(1.3)`.

**Zero-selection path:** When user submits with nothing selected, cards fade, agent appears centered at ~35% screen height, reply types out directly.

**Screens updated:**
- `TVContentQuestion` — Q2, multi-select, 4 options
- `AudienceQuestion` — Q3, single-select (auto-commits on tap), 4 options
- `ShowMoreQuestion` — Q4, multi-select, 3+6 options (Explore More)
- `WeekendQuestion` — Q5, multi-select, 4 options
- `StyleQuestion` — Q6, multi-select, 4 options

**Removed from all screens:** history ghost div (`bc-history-ghost`/`wq-history-ghost`), bubble animation (`bubbleRef`), two-line CinematicText ack block, `sq-progress-label` at top-right.

---

## 2. Per-Question Skip

Each question has a "Skip question" ghost button below the Done button. It skips directly to `onSkip()` (moves to next screen without applying any signal weights).

**Navigation to Skip:** User must press `ArrowDown` twice — first Down goes from cards to Done, second Down goes to Skip. This prevents accidental skips.

**Visual:** Ghost button (no background), dims to `rgba(255,255,255,0.28)` normally, brightens with outline when focused/selected.

---

## 3. Progress Label Placement

Progress text ("X of 7") moved from `sq-progress-label` at top-right to **inline above the question title**, centered, attached to the question block.

Style: `11–12px`, `700` weight, `0.2em` letter-spacing, `uppercase`, purple-tinted (`rgba(167,134,229,0.5)`).

---

## 4. Navigation Model

### Multi-select questions (TVContent, ShowMore, Weekend, Style)

```
FocusArea: 'cards' | 'done' | 'skip'

ArrowLeft / ArrowRight  → navigate between cards
Enter / Space           → toggle selected card
ArrowDown               → 'cards' → 'done'
ArrowDown               → 'done' → 'skip'
ArrowUp                 → 'skip' → 'done'
ArrowUp                 → 'done' → 'cards' (or onBack if at top)
ArrowUp (from cards)    → calls onBack() to go to previous question
Enter (at 'done')       → commit + FLIP
Enter (at 'skip')       → onSkip()
```

### Single-select question (Audience)

```
FocusArea: 'cards' | 'skip'

Enter / Space           → select card → auto-commits (triggers FLIP immediately)
ArrowDown               → 'cards' → 'skip'
ArrowUp                 → 'skip' → 'cards'
ArrowUp (from cards)    → calls onBack()
Enter (at 'skip')       → onSkip()
```

### Back navigation

All question screens accept `onBack?: () => void`. Pressing `ArrowUp` from the cards focus area calls `onBack()`, returning to the previous screen.

Wired in `App.tsx`:
- tv-content → back to `bangalore-confirm`
- audience → back to `tv-content`
- show-more → back to `audience`
- weekend → back to `show-more`
- style → back to `weekend`

---

## 5. Welcome Screen Skip CTA

**Location:** "Skip this for now" is pinned absolutely at the bottom of the welcome screen (`bottom: clamp(28px,4.5vh,52px)`), visually separated from the primary CTA.

**Focus swap:** When focus moves to Skip (ArrowDown), Skip becomes the **primary pill** (solid white background, dark text) and "Let's personalise" becomes the **secondary** (ghost, dimmed). This makes the currently active action the visually dominant one.

Navigation: `ArrowDown` from primary CTA → Skip; `ArrowUp` → back to primary.

---

## 6. ShowMoreQuestion — Explore More Horizontal Scroll

**Expand behavior:** Clicking/pressing Explore More appends extra option cards inline (same row, same card style). The row becomes `overflow-x: auto` with `scrollbarWidth: none`.

**Scroll-to-focus:** When keyboard focus moves to a card that's partially off-screen, `scrollLeft` is adjusted to bring it into view with 64px padding.

**Gradient edge overlays:**
- Left edge: `linear-gradient(to right, rgba(4,2,14,0.95) 0%, transparent 100%)` — 32–64px wide. Keeps the carousel progress pips readable and prevents visual crashing.
- Right edge: `linear-gradient(to left, rgba(4,2,14,0.95) 0%, rgba(4,2,14,0.5) 55%, transparent 100%)` — 48–100px wide. Signals that content continues off-screen.

Both overlays are `position: absolute, zIndex: 6, pointerEvents: none` on the outer wrapper. The inner scroll div has `paddingLeft` and `paddingRight` to prevent cards from hiding under the gradients.

---

## 7. App.tsx Changes

- Added `setupSelections: { tvContent?, showMore?, weekend?, style? }` to `AppState`
- Added `initialSelected` prop pass-through to TVContent, ShowMore, Weekend, Style questions
- Added `onBack` wiring for all 5 question screens
- `WelcomeScreen` already had `onSkipAll={() => enterFeed(profile, profileDraft)}`

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/Calibration/flipCenterStage.ts` | NEW — reusable FLIP utility |
| `src/components/Calibration/SetupStructuredReply.tsx` | NEW — three-line typewriter reply |
| `src/components/Calibration/TVContentQuestion.tsx` | REWRITTEN — FLIP, nav model, progress |
| `src/components/Calibration/AudienceQuestion.tsx` | REWRITTEN — FLIP, nav model, progress |
| `src/components/Calibration/ShowMoreQuestion.tsx` | REWRITTEN — FLIP, scroll, gradients, nav |
| `src/components/Calibration/WeekendQuestion.tsx` | REWRITTEN — FLIP, nav model, progress |
| `src/components/Calibration/StyleQuestion.tsx` | REWRITTEN — FLIP, nav model, progress |
| `src/components/Activation/WelcomeScreen.tsx` | Skip CTA pinned to bottom, focus-swap styles |
| `src/App.tsx` | `setupSelections` state, `onBack`/`initialSelected` wiring |

## Not Changed

- Question copy
- Card design
- Mascot asset (`/public/mascot.riv`)
- Text reveal animation (CinematicText, TypewriterText)
- Preference collection implementation (InterstitialQuestion)
- L0 feed
