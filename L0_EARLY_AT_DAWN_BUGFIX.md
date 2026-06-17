# L0 "Eatly at dawn" — Bug Fix Pass

Preview: `http://localhost:5174/l0-preview.html`  ↺ Replay button top-right.

---

## 1. Title timing fix

**Root cause:** `onTypingStart` callback was simultaneously triggering `setTitleStage('small')` AND starting per-character typing timers. The title hadn't had time to shrink before reasoning appeared.

**Fix:** Added separate `onTitleShrink` callback in `L0TimelineOpts`. Timeline calls it at label `titleShrink` (≈4.4s mark). Mascot appears 1.05s later (giving CSS `font-size` transition 0.9s to complete). Reasoning starts 0.42s after mascot is visible.

**Sequence now:**
```
1.3s   → title word-stagger reveal (big: clamp(56px, 10.5vw, 148px))
4.4s   → onTitleShrink: React sets font-size to small (CSS transition 0.9s)
5.45s  → mascot fades in (opacity + scale, after title shrink completes)
5.87s  → reasoning fades in, typing starts
```

---

## 2. Title start size fix

Changed `TITLE_FONT_LARGE` from `clamp(42px, 6.8vw, 108px)` → `clamp(56px, 10.5vw, 148px)`.

At 1440px viewport: was 98px → now 151px (capped). More cinematic, fills screen.

`white-space: nowrap` preserved — title stays one line at all sizes.

---

## 3. Agent visibility fix

**Root cause:** `gsap.set(mascotFloat, { scale: 0 })` — Rive initialises its canvas by detecting when it has non-zero rendered size. At `scale:0` the canvas has no visual area and Rive never starts the animation state machine.

**Fix:** Initial state changed to `{ opacity: 0, scale: 0.75, y: 8 }`. Canvas is visible to Rive at 75% size, just invisible to the user via `opacity:0`. GSAP animates `opacity: 0→1, scale: 0.75→1, y: 8→0` to reveal it.

Mascot container explicitly sized: `width/height: clamp(40px, 4.8vw, 68px)` — gives Rive a known viewport.

---

## 4. Blink/idle animation

Rive canvas now initialises correctly (opacity fix above). The `AgentMascot` component's ambient `_am-breathe-idle` CSS animation + Rive state machine (`Idel _Eyeblink`) both run as expected once the canvas has a non-zero visual size.

No fake fallback needed. The Rive mascot animates naturally.

---

## 5. CTA transition fix

**Issue:** FLIP scale was 0.44 but mascot went invisible mid-transition because `opacity:0` was set immediately on `onComplete`. The CTA mascot slot appeared before the float mascot finished moving.

**Fix timeline:**
1. Float mascot FLIP: `x→dx, y→dy, scale→0.44, duration 0.52s, ease power3.inOut`
2. `onComplete`: `gsap.set(mascotFloat, { opacity: 0 })` then `width: 0` tween (collapses gap)
3. CTA slot: `opacity: 0→1, scale: 0.7→1` starts 20ms after float reaches destination

No fade-out/fade-in swap — float goes invisible only after it arrives at the CTA slot position.

---

## 6. CTA mascot blur fix

**Root cause:** `scale: 0.44` FLIP applied to the float mascot (Rive at 62px → 27px rendered) caused sub-pixel rendering blur. The CTA slot then rendered another Rive canvas at 32px — also slightly blurry from the residual transform state.

**Fix:** CTA mascot slot uses `size={32}` Rive canvas at exact 32px with no CSS transform applied to the parent. GSAP only animates `opacity` and `x` on reveal — no scaling. The CTA slot canvas renders at native resolution.

`width: 32, height: 32` (fixed pixels, not clamp) on the slot container ensures Rive always gets exact pixel sizing.

---

## 7. Bottom alignment fix

**Root cause:** Column had `bottom: clamp(60px, 16vh, 160px)` while card had `bottom: clamp(28px, 5vh, 60px)` — 11vh difference.

**Fix:** Single shared constant `BOTTOM = 'clamp(28px, 5vh, 56px)'` applied to both the column container and the product card container. CTA is the last flex item in the column — its bottom edge naturally aligns with the card bottom.

---

## 8. Logo aspect ratio fix

**Root cause:** `maxWidth: 100` combined with explicit height created width-constrained stretching when the SVG natural width exceeded 100px.

**Fix:** Removed `maxWidth`. Logo now uses `height: clamp(16px, 1.9vh, 28px)` with `width: auto`. The browser preserves the SVG's intrinsic aspect ratio. No `objectFit` needed (that's for replaced elements in explicit boxes — not needed here).

---

## 9. Beam animation fix

**Root cause 1:** Beam color was `rgba(167,134,229, 0.45)` (purple) on a white pill background — too light to see. Purple on white requires higher opacity or darker purple.

**Fix:** Changed beam gradient to `rgba(112,71,226, 0.55)` at the center peak — darker purple, clearly visible on white.

**Root cause 2:** Beam `<span>` was directly inside the `<button>` which has `overflow: hidden`. GSAP's `xPercent` tween was correct but the clip was cutting the beam before it was visible at the left edge.

**Fix:** Added an outer wrapper `<div>` with `borderRadius: 999, overflow: hidden` around the entire button. Beam sits as a child of this wrapper (not the button). This gives the beam the correct clip boundary at the pill border-radius without interfering with button events or z-index.

**Sweep logic:** `xPercent: -120 → 120` with `opacity: 0→1→0` fade in/out. Loops every 4.5s via `setInterval`. Opacity reaches peak of 1 at center of pill.

---

## Files changed

| File | Change |
|------|--------|
| `src/animations/l0Timeline.ts` | Added `onTitleShrink` callback; mascot init via `opacity:0` not `scale:0`; separate `titleShrink` label; corrected sequence gaps |
| `src/components/L0/CinematicL0.tsx` | Bigger title (`10.5vw`); shared `BOTTOM` constant; beam in overflow-hidden wrapper; CTA slot at exact 32px; logo `height` only; mascot container explicit size |
