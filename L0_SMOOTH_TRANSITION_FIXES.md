# L0 Smooth Transition Fixes

Preview: `http://localhost:5174/l0-preview.html`

---

## 1. Title jitter fix

**Root cause:** `transition: font-size 0.9s` on a `clamp()` value triggers layout recalculation on every animation frame. The browser has to reflow the flex column each frame — causing jitter.

**Fix:** Font-size is now **fixed permanently at the large value** (`clamp(56px, 10.5vw, 148px)`). GSAP tweens `transform: scale()` from `1` down to `smallPx/largePx` ratio.

- `transformOrigin: 'left bottom'` — title shrinks toward its bottom-left corner, stays visually left-aligned
- Zero layout reflow — GPU-composited transform only
- Ratio computed at runtime: `useLayoutEffect` measures both the large computed font-size and the small target font-size by temporarily applying the small `clamp()` to the element, then restoring it

```
titleLargePx = getComputedStyle(titleEl).fontSize  (~80–148px)
titleSmallPx  = measure clamp(26px, 3.8vw, 58px)   (~26–58px)
scaleRatio = titleSmallPx / titleLargePx
GSAP: { scale: scaleRatio, duration: 0.9, ease: 'power2.inOut' }
```

**Removed:** `titleStage` React state, `TITLE_FONT_SMALL` constant, `onTitleShrink` callback, CSS font-size transition.

---

## 2. Reasoning size animation

Reasoning `<p>` now starts at `scale: 1.12, transformOrigin: 'left top'` (set by GSAP at init) and settles to `scale: 1` over 1.4s with `ease: 'power3.out'`. This runs simultaneously with the typing — the text feels alive and cinematic, like the agent is "presenting" the thought as it types.

```
gsap.set(reasoning, { scale: 1.12, transformOrigin: 'left top' });
tl.to(reasoning, { scale: 1, duration: 1.4, ease: 'power3.out' }, 'typingStart+=0.05');
```

---

## 3. POC beam applied to real CTA

**POC config** (`BeamPillButtonWhite` in `BeamButtonPOC.tsx`):
```tsx
<BorderBeam size="sm" colorVariant="colorful" duration={1.96}
  brightness={1.5} saturation={2} strength={0.8}>
```

**Real CTA now matches exactly:**
```tsx
<BorderBeam size="sm" colorVariant="colorful" duration={1.96}
  brightness={1.5} saturation={2}
  strength={beamActive ? 0.8 : 0}>
```

`beamActive` starts false, set to true by `onBeamStart` callback after CTA label types out. The beam activates at the right moment with the correct intensity.

---

## 4. Product card merge transition

**Before:** React switched between `<FlatTile>` row and `<StackedTiles>` component — an instant DOM unmount/remount causing a visible cut.

**After:** All 3 card DOM elements stay mounted throughout. No React state switch.

**GSAP handles everything:**

Phase 1 — Spread:
- Cards start off-screen right at their individual spread x positions: `(x + 120px)`
- Each slides in: `x: spreadX` (0, 108, 216px) with 0.18s stagger
- Cards are visibly separated, readable as individual items

Phase 2 — Stack (1.4s after spread):
- All 3 cards animate simultaneously to stacked positions:
  - card[0]: `x:0, y:0, rotate:0` (front, reference)
  - card[1]: `x:10, y:-2, rotate:6°` (mid, peeks behind)
  - card[2]: `x:18, y:-4, rotate:11°` (back, deepest)
- Duration: 0.7s, `ease: 'power3.inOut'` — smooth deceleration

No React unmount. No instant swap. Continuous GSAP motion.

---

## Files changed

| File | Change |
|------|--------|
| `src/animations/l0Timeline.ts` | Title uses GSAP scale tween; reasoning scale init; cards: spread x positions + GSAP stack animation; removed `onTitleShrink`/`onCardsStack` callbacks |
| `src/components/L0/CinematicL0.tsx` | `useLayoutEffect` measures title font sizes; removed `titleStage`/`cardPhase` state; single `TITLE_FONT` constant; reasoning `willChange:transform`; cards: 3 absolute elements in single container, no conditional render; BorderBeam with `brightness:1.5,saturation:2,strength:0.8` |
