# L0 CTA + Beam + Typing Fix

## Routes

- Preview: `http://localhost:5174/l0-preview.html` — full L0 (↺ Replay)
- Beam POC: `http://localhost:5174/beam-poc.html` — isolated beam proof of concept

---

## 1. Reasoning spacing fix

**Before:** Column used a single `gap: clamp(10px, 1.6vh, 18px)` for all children — too tight between reasoning and CTA.

**After:** Column `gap: 0`. Each child has its own explicit `marginBottom`:
- Tag: `clamp(8px, 1.2vh, 14px)`
- Title: `clamp(10px, 1.5vh, 18px)`
- Reasoning row: `clamp(18px, 2.8vh, 32px)` — **nearly double**, gives clear breathing room before CTA

---

## 2. Reasoning line break fix

**Before:** `{displayedReasoning}` as plain text — browser breaks wherever it wants.

**After:** `<ReasoningText>` component handles two modes:
- **While typing:** plain text + cursor (no break mid-type — avoids layout jump)
- **After typing complete:** splits at `. ` boundary, inserts `<br/>` between:
  - Line 1: `"Bangalore has a strong South Indian culture."`
  - Line 2: `"That's what surfaced this."`

`maxWidth: 420` on the reasoning `<p>` also prevents "this" from floating alone.

---

## 3. Left alignment fix after mascot moves

**Root cause:** Mascot float container used `width: clamp(40px, 4.8vw, 68px)`. GSAP cannot tween `clamp()` — the width tween did nothing, leaving a dead gap on the left.

**Fix:** Changed to `width: 62` (fixed `MASCOT_FLOAT_SIZE = 62` constant). GSAP tweens `width: 62 → 0` in 0.22s. The flex row collapses the gap, reasoning text reflows to the left edge.

The parent row also has `overflow: hidden` to contain the collapse animation.

---

## 4. CTA mascot blur fix

**Previous approach:** GSAP moved the 62px float mascot to the CTA slot (scale ~0.5 → ~31px rendered). CSS compositing at sub-pixel sizes caused blur.

**Current approach:** Two distinct mascots, instant handoff:
1. Float mascot (62px) translates toward CTA slot
2. On `onComplete`: float `opacity → 0`, CTA slot mascot (exact 36px, no transforms) fades in
3. CTA slot: `width: 36, height: 36` — exact pixel sizing, Rive renders at native resolution

The 36px slot mascot never has any CSS transform applied — it stays perfectly crisp.

---

## 5. BeamButtonPOC

**File:** `src/components/dev/BeamButtonPOC.tsx`  
**Route:** `http://localhost:5174/beam-poc.html`

Two modes (toggle buttons):
- **CSS**: `@property --beam-angle` + `conic-gradient` rotating via `@keyframes`. Proven approach from shadcn/magic-ui. No JS needed.
- **GSAP**: `xPercent: -110 → 110` sweep on a gradient span (inner glow approach).

**Result:** CSS variant is clearly visible, premium, continuously animated. Applied to the real CTA.

---

## 6. Real CTA beam implementation

**Technique:** CSS `@property` + `conic-gradient` rotating border.

```css
@property --l0-beam-angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}
@keyframes l0-beam-rotate {
  to { --l0-beam-angle: 360deg; }
}
```

The `ctaBeamOuterRef` div:
- `padding: 2px` when `beamActive` — creates the 2px border gap
- `background: conic-gradient(from var(--l0-beam-angle), #7047E2, #a78be5, #06b6d4, #f59e0b, ...)` — 4-color beam
- `animation: l0-beam-rotate 2s linear infinite`

`beamActive` is a React state set by `onBeamStart` callback — fires after CTA label finishes typing.

No overflow:hidden issues — the beam IS the border, not something clipped inside the button.

---

## 7. CTA text typing sequence

**New state:** `ctaTypedChars` — drives `item.ctaLabel.slice(0, ctaTypedChars)` display.  
**New callback:** `onCTATypingStart` in `L0TimelineOpts`.  
**Delay:** 48ms per character (slightly slower than reasoning's 40ms — more deliberate).  
**Dark cursor:** `background: '#333'` inside white pill (vs white cursor in reasoning).

**Full CTA sequence:**
```
ctaReveal    → mascot FLIP starts
+140ms       → CTA shell (pill) fades in, slides up
+280ms       → CTA label starts typing out
+typing done → 200ms pause
             → onBeamStart → beam activates
             → onCTAReady → CTA becomes clickable
+600ms       → product card slides in
```

---

## Files changed

| File | Change |
|------|--------|
| `src/components/L0/CinematicL0.tsx` | Explicit marginBottom per item; `ReasoningText` component with controlled line break; fixed `MASCOT_FLOAT_SIZE=62`; CSS conic beam via state; CTA label typing; `ctaTypedChars` state; `beamActive` state |
| `src/animations/l0Timeline.ts` | Added `ctaTypingDuration`, `onCTATypingStart`, `onBeamStart` to opts; `ctaTyping` and `beamStart` labels; removed GSAP beam sweep (now CSS) |
| `src/components/dev/BeamButtonPOC.tsx` | New — isolated POC with CSS and GSAP beam variants |
| `beam-poc.html` | New — standalone route for POC |
| `src/main.tsx` | Routes `__BEAM_POC__` flag to `BeamButtonPOC` |
