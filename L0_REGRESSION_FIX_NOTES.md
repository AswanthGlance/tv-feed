# L0 Regression Fix Notes

Preview: `http://localhost:5174/l0-preview.html` — ↺ Replay to rerun.

---

## 1. Header restored

Logo is `<img height="clamp(16px, 1.9vh, 28px)" width="auto" flexShrink:0>`.  
`width:auto` + no `maxWidth` constraint = SVG renders at its natural aspect ratio.  
Layout: `justifyContent:space-between` — logo left, time/date/weather right. Unchanged from the Figma reference.

---

## 2. Tag + title as one group (Morning Pick stays attached)

**Root cause:** Tag was a separate flex sibling. When GSAP scaled the `<h1>`, the tag stayed at its original position — visually floating.

**Fix:** Both tag and `<h1>` are now inside a single `<div ref={titleGroupRef}>`. GSAP scales `titleGroupRef` (not `titleRef`), so tag and title shrink together as one unit with `transformOrigin: 'left bottom'`.

The `<h1>` ref is still passed separately for word-mask reveal (GSAP word spans).

---

## 3. CTA text only after mascot lands

**Root cause:** `onCTATypingStart` was called at a fixed timeline label (`ctaReveal+=0.42`). If the FLIP animation was slightly longer or shorter, typing would start before the mascot arrived.

**Fix:** `opts.onCTATypingStart()` is now called from inside the FLIP's `onComplete` callback — directly after `ctaMascotSlot` reveals. Typing is physically impossible to start before landing.

---

## 4. CTA left-aligned typing, width expands right

- Removed `minWidth: clamp(80px,10vw,160px)` — was forcing a wide pill before any text appeared.
- Added `justifyContent: 'flex-start'` on the button.
- `paddingRight` transitions from `10px` (mascot only) to full padding once text appears.
- `alignSelf: flex-start` on the wrapper keeps the left edge anchored.
- Result: pill starts as a small circle containing just the mascot, then grows rightward as text types.

---

## 5. CTA width expansion

The pill has no fixed width. `display:inline-flex` + `whiteSpace:nowrap` + `overflow:hidden` means the button is exactly as wide as its content. As `ctaDisplayed` grows one character at a time, the pill naturally expands right. Left edge stays fixed because `alignSelf:flex-start` and the column is `position:absolute` at a fixed `left` value.

---

## 6. Product count: 2

`glanceConfig.ts`: `cardCount: 3 → 2`.  
`cardLabels = item.subCategories.slice(0, 2)` — Masala Dosa + Filter Coffee.  
Removed `card2Ref`. Timeline only animates `cardEls[0]` and `cardEls[1]`.

---

## 7. Product collapse direction: right-anchored

**Root cause:** Cards were at `left:0` in a wide container. After stacking at `x:0,10,18`, all cards sat at the left edge of a 380px container — which placed them in the middle of the screen.

**Fix:**
- Container is right-anchored (`right:60px`) and sized to the stacked state only (`tile + 18px` wide).
- `card[0]` always stays at `x:0` — the rightmost / front card, at the anchor.
- `card[1]` spreads to `x:-(SPREAD_GAP)` = to the LEFT of card[0] during reveal.
- On stack: card[1] moves to `x:10, rotate:7°` — peeks behind card[0] toward the right.
- Result: all spread motion happens leftward, and the stack collapses back rightward. Right edge stays fixed throughout.

---

## Files changed

| File | Change |
|------|--------|
| `src/components/L0/CinematicL0.tsx` | `titleGroupRef` wraps tag+h1; `card2Ref` removed; no `minWidth` on CTA; logo height-only; 2 card refs |
| `src/animations/l0Timeline.ts` | Uses `titleGroupEl` for scale; `onCTATypingStart` in FLIP onComplete; cards spread LEFT, collapse right |
| `src/config/glanceConfig.ts` | `cardCount: 3 → 2` for eatly-dawn |
