# L0 "Eatly at dawn" — Cinematic Fix Notes

Preview: `http://localhost:5174/l0-preview.html` — click ↺ Replay to rerun.

---

## 1. One-line title fix

`white-space: nowrap` added to the single `<h1>`. Font-size is `clamp()` — scales
with viewport so the title never wraps at any 16:9 size.

---

## 2. Single title element fix

**Before:** Two `<h1>` elements — a "large" one and a "small" one, GSAP cross-faded between them. Felt like two events.

**After:** One `<h1>` for the entire lifecycle.

- Words are pre-split into `<span class="word-span">` children at render time.
- GSAP staggers them in (opacity + y + blur → sharp) for the cinematic reveal.
- After the reveal, a React state toggle (`titleStage: 'large' → 'small'`) fires,
  switching the CSS `font-size` value. The `h1` has `transition: font-size 0.9s cubic-bezier(0.4,0,0.2,1)` so the browser interpolates smoothly. No GSAP tween of font-size needed (GSAP cannot tween `clamp()` reliably across browsers).
- The title stays at the same `left` edge throughout — only size changes.

---

## 3. Cinematic text animation

Word stagger in `l0Timeline.ts` at label `titleIn` (1.35s mark):

```
gsap.to(words, {
  opacity: 1, y: 0, filter: 'blur(0px)',
  duration: 0.65,
  ease: 'expo.out',
  stagger: { each: 0.1, ease: 'power2.out' },
})
```

Each word reveals from `y:14, blur(5px)` to `y:0, blur(0)` with a 100ms stagger.
`expo.out` gives the fast-in-slow-out premium editorial feel.

---

## 4. Single agent instance fix

**Before:** Two separate agent renders — one `AgentMascot` beside reasoning, a second
static SVG icon inside the CTA pill.

**After:** One `AgentMascot` instance. It lives in the reasoning row (in-flow flex child).
A second `AgentMascot` is pre-rendered in the CTA slot but starts at `opacity:0,
scale:0.5` — it becomes visible only as the handoff destination.

The GSAP FLIP at `ctaReveal`:
1. Reads `getBoundingClientRect()` of the floating mascot and the CTA slot.
2. Computes `dx, dy` offset.
3. `gsap.to(mascotFloat, { x:dx, y:dy, scale:0.48 })` — physical translate.
4. `onComplete`: float mascot → `opacity:0, width:0` (collapses layout gap).
   CTA slot mascot → `opacity:1, scale:1`.

The 180ms overlap between float leaving and CTA appearing creates continuity.

---

## 5. Agent-to-CTA reasoning alignment fix

When the mascot finishes moving:
- Its `width` is tweened to `0` with `overflow:hidden` — the flex gap collapses.
- The reasoning `<p>` naturally reflows to the full column width.
- The CTA sits below the reasoning in the same column — left-aligned throughout.

Final left column order:
```
Morning Pick  (tag)
Eatly at dawn (h1, now small)
[reasoning text]
[CTA pill]
```

No centered reasoning. No leftover gap.

---

## 6. Header scale fix

All header values halved from previous implementation:

| Element | Before | After |
|---------|--------|-------|
| Logo height | `clamp(20px, 2.2vh, 34px)` | `clamp(16px, 1.8vh, 28px)` |
| Weather/date | `clamp(14px, 1.6vw, 28px)` | `clamp(11px, 1.2vw, 20px)` |
| Time | `clamp(16px, 2vw, 32px)` | `clamp(13px, 1.4vw, 24px)` |
| Header top | `clamp(24px, 4.5vh, 72px)` | `clamp(18px, 3.5vh, 56px)` |

Logo uses `width:auto, maxWidth:100, objectFit:contain` — no stretching.

---

## 7. Rive animation fix

**Root cause:** Previous code set `mascotFloat` to `opacity:0` via `gsap.set()` before Rive had initialized. Rive requires `opacity > 0` to start its render loop.

**Fix:** Initial state is `scale:0, y:10, opacity:1`. The mascot is visually hidden (scale:0) but Rive can render its internal canvas. GSAP animates `scale → 1` to reveal it.

---

## 8. Beam animation fix

**Root cause:** Previous beam used `x` in pixels which didn't match the pill width. Also `overflow:hidden` on the pill clipped GSAP's transform before it started.

**Fix:** Beam is a full-width `<span>` inside the pill (same `overflow:hidden`). GSAP tweens `xPercent` from `-120` to `+120` — always traverses the full pill regardless of width. A gradient `linear-gradient(105deg, transparent 20%, rgba(167,134,229,0.45) 50%, transparent 80%)` gives the Beam-style shimmer. Sweeps once on CTA entry, then loops via `setInterval(4500ms)`.

---

## Files changed

| File | Change |
|------|--------|
| `src/components/L0/CinematicL0.tsx` | Single title with word spans; mascot in-flow then FLIP; beam in pill; header scale fix |
| `src/animations/l0Timeline.ts` | Word stagger; no dummy font-size tween; FLIP in tl.call(); beam via xPercent; mascot width-collapse on complete |

---

## What still needs attention

1. **Background image** — chai stall works but dawn South Indian food scene would be stronger.
2. **Mascot size in CTA** — 32px Rive canvas inside a `clamp(40-58px)` pill. May need size tuning at larger viewports.
3. **Typing speed** — 38ms/char for 67-char string = ~2.5s. Adjust `TYPING_DELAY` in `CinematicL0.tsx` if it feels too fast or slow.
4. **Logo asset availability** — Logo uses MCP localhost URL. In production, bundle the SVG directly.
