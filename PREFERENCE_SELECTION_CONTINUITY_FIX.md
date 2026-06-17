# Preference Selection — Continuity Fix

## Core Approach: FLIP Without the F (dom-clone flight)

The problem with all previous attempts: React re-renders create a new card at a new position. The user sees a cut.

The fix: **capture `getBoundingClientRect` before any state changes, create absolute-positioned ghost clones at exact source coordinates, then animate ghosts to center target positions.** The original DOM never moves — ghosts are the illusion of movement.

```
User commits selection
  │
  ├── Capture selected card rects (before any DOM change)
  ├── Compute center-stage target positions (centered column)
  ├── Fade out question UI (opacity 0)
  ├── Fade out unselected cards (scale 0.82 + opacity 0)
  ├── Hide original selected cards (opacity 0 — ghost takes over)
  ├── Create ghost divs in flyLayer at exact source rects
  │     • same background-image, same border-radius, check badge, label
  │     • position:absolute, same width/height as source
  └── GSAP tween ghosts → target positions (same size, same shape)
        └── After flight: agent + reply fade in below
```

---

## Card Continuity

- Ghost copies the source card's: `backgroundImage`, `borderRadius` (from `getComputedStyle`), `width`, `height`
- No resize, no reshape — the card the user selected is the card that moves
- Border ring and check badge are reproduced on the ghost so selection state persists during flight
- `will-change: left, top, width, height` on ghost for compositor promotion

---

## Single-select flow

1. User taps a card
2. All other cards fade + scale back simultaneously
3. Selected card ghost flies from grid position → center of screen
4. Same dimensions, same image, same check badge
5. Ghost settles → agent fades in 28px below the card bottom

---

## Multi-select flow

1. User picks N cards, taps Done
2. All unselected cards fade + scale back
3. Selected card ghosts fly from their grid positions → vertically stacked column, horizontally centered
4. Same card proportions preserved — cards are NOT resized into chips or banners
5. Gap between stacked cards: 16px
6. If stacked height exceeds available space (unlikely at 2–3 cards), uniform `scale` applied to all cards equally
7. Ghosts stagger with 40ms delay between them for a cascading feel
8. After last ghost settles → agent fades in below the stack

---

## Non-selected Exit

```
opacity: 0
scale: 0.82
y: +10px
duration: 0.3s
ease: power2.in
stagger: 0.06s between cards
```

Exits start simultaneously with flight, so the viewer's eye follows the selected cards to center without distraction.

---

## Agent Acknowledgement Timing

`celebAgentTop` is computed as `lastTarget.top + lastTarget.height + 28` — always anchored exactly 28px below the bottom of the lowest settled card, regardless of how many cards or how tall the screen is.

Agent reveal fires at `FLIGHT_DURATION + 0.18s` — only after all ghosts have settled.

---

## Layout: Agent Below Cards

```
[Ghost card 1]   ← centered
[Ghost card 2]   ← centered, 16px below card 1
...
[Agent mascot]   ← 28px below last card
[Reply text]     ← below agent
```

No overlap. Agent is `position:absolute` with `top` set from JS — not from CSS flex/grid — so it always sits exactly where the cards land, not at a fixed offset.

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/Polls/InterstitialQuestion.tsx` | Full FLIP-clone implementation |

## Files Unchanged

- `src/data/preferenceQuestions.ts`
- `src/animations/l0Timeline.ts`
- `src/components/L0/CinematicL0.tsx`
- All onboarding screens
