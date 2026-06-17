# Setup Q4 + Location + Agent Response Fix

## Overview

This pass fixed four areas: ShowMoreQuestion card architecture, BangaloreConfirm template alignment, agent response text animation, and duplicate agent elimination.

---

## 1. ShowMoreQuestion — Architecture Rewrite

**Problem:** `CardItem` was defined as a function inside the component body. React treats each render as a new component identity, causing unmount/remount flicker on focus changes. Additionally, refs were attached to a wrapper `<div>` around `<CardItem />`, meaning `flipCenterStage`'s `el.firstElementChild` traversal reached the wrong element (CardItem root div instead of the image container).

**Fix:** Removed `CardItem` inner function entirely. All card JSX is now inlined directly inside `renderCard()` — a plain function (not a component) called during render. The card column wrapper div receives the ref directly, so `el.firstElementChild` correctly resolves to the image container div.

**Overflow/clipping fix:** The outer `scrollWrapRef` div carries `paddingBottom: clamp(24px,3vh,40px)` so scale(1.06) transforms on focused cards don't get clipped. The inner `scrollInnerRef` div has `overflowX: auto` only when expanded, and `overflowY: visible` always — this combination allows horizontal scroll without clipping vertically scaled cards.

**Explore More expand:** Extra cards are appended inline into the same row. When expanded, `overflow-x: auto` on the inner row enables scroll. Cards animate in with stagger from `opacity:0, x:32, blur(6px)` → settled state.

---

## 2. BangaloreConfirm — Full Template Alignment

**Problem:** BangaloreConfirm used its own bespoke animation system: `bc-history-ghost`, a GSAP timeline with card hero-ing, separate three-line CinematicText ack sequence, and a progress label at the top-right (`sq-progress-label`). This diverged from the shared setup question template.

**Fix:** Fully rewrote BangaloreConfirm to use the same pattern as TVContentQuestion, AudienceQuestion, etc.:
- `flipCenterStage` for FLIP animation
- `SetupStructuredReply` for three-line cinematic acknowledgement
- `CinematicText` for the question reveal
- Inline progress "1 of 7" above the question title
- FocusArea state machine: `'cards' | 'skip'`
- Single-select auto-commits on selection (same as AudienceQuestion)

**Removed:** `bc-history-ghost`, `historyRef`, bubble timeline, separate ack1/ack2/ack3 refs, `responseRef`, `sq-progress-label`.

**Primary action:** "Yes, Bengaluru" card is clicked/focused directly — no Done button. This is the natural single-select pattern.

**Skip:** Removed as a visible button from the main row. Replaced with subtle bottom hint text: `"Press down twice to skip this question"`. The button is still keyboard-accessible (Down from cards → skip focus area) and clickable on hover.

---

## 3. Agent Response Text — CinematicText Everywhere

**Problem:** `SetupStructuredReply` was using `TypewriterText` (character-by-character reveal with cursor), which violates the Glance cinematic text standard.

**Fix:** Replaced all `TypewriterText` usage in `SetupStructuredReply` with `CinematicText`:
- Per-character stagger: `speed = [0.032, 0.040, 0.032]`
- Per-character duration: `duration = [0.36, 0.42, 0.36]`
- Pauses: 550ms after line 0, 450ms after line 1, 800ms before `onDone`
- No cursor, no typewriter character reveal — blur(12px)→blur(0) + opacity 0→1

---

## 4. Duplicate Agent Elimination

**Problem:** Some screens rendered a second mascot instance in the response area (below the `celebAgentRef` block), creating two agents on screen simultaneously.

**Fix:** All setup question screens now have exactly one agent: the `celebAgentRef` div (zIndex 42) that appears after FLIP completes. The `SetupStructuredReply` text renders below this single agent. No second mascot anywhere.

Response layout:
```
[Agent mascot — top, appears after FLIP]
[Three-line SetupStructuredReply — below agent]
[FLIP ghost card(s) — center of screen, below agent block]
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/Calibration/ShowMoreQuestion.tsx` | Full rewrite — inlined card JSX, fixed refs, overflow/padding model |
| `src/components/Activation/BangaloreConfirm.tsx` | Full rewrite — FLIP template, SetupStructuredReply, no history ghost |
| `src/components/Calibration/SetupStructuredReply.tsx` | TypewriterText → CinematicText |
| `src/components/Calibration/flipCenterStage.ts` | Uses `el.firstElementChild` for image container rect/borderRadius |

## Not Changed

- Question copy
- Option labels
- Mascot asset (`/public/mascot.riv`)
- Preference collection implementation (InterstitialQuestion)
- L0 feed
