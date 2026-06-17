# L0 GSAP Polish — "Eatly at dawn"

## GSAP Architecture

### Core principle
All cinematic animation is controlled from one GSAP timeline. React state is minimal:
only `typedChars` (drives typing display) and `ctaActive` (unlocks button interaction).
No scattered CSS transitions, no animStep integer, no React re-renders for motion.

### Files

| File | Role |
|------|------|
| `src/animations/l0Timeline.ts` | Timeline factory — single source of truth for all beats |
| `src/components/L0/CinematicL0.tsx` | Ref-collecting component, wires refs into timeline |
| `src/components/L0/L0Glance.tsx` | Router — cinematic items → CinematicL0, standard → GlanceLayout |
| `src/components/L0/GlanceLayout.tsx` | Standard layout (CSS transitions, unchanged) |

### Why GSAP instead of CSS transitions
CSS transitions can't animate `position`, `display`, `bottom`, or `left` — the previous title jerk was caused by switching these. GSAP uses `transform: translate + scale` exclusively, which the GPU composites without layout reflow.

---

## Timeline Structure

```
0s      BG image fades in (power2.inOut, 1.2s) + parallax (scale 1.06→1.0, 2.4s)
0.5s    Overlay settles
1.0s    Header slides down (power2.out, 0.6s)
1.3s    Tag chip rises (power2.out, 0.5s)
1.55s   Large title fades/blurs in (expo.out, 0.85s)
+1.8s   READ PAUSE — "titleMove" label
        Large title fades + scales out (power2.in, 0.75s)
        Column fades in from translateY(20) (power3.out, 0.65s)
        Small title fades in (power2.out, 0.55s)
+0.85s  Mascot pops in (back.out(1.6), 0.5s)
+0.45s  Reasoning fades in; typing begins
+typing Typing completes
+0.6s   "ctaReveal" label
        Mascot fades out (power2.in, 0.4s)
        CTA slides up (power3.out, 0.55s)
        Mascot inside CTA slides in (back.out(1.4), 0.45s)
+0.56s  Beam sweep (power2.inOut, 0.9s) — then loops every 4s
+0.7s   Product card slides in from right (back.out(1.3), 0.6s)
```

---

## Title Alignment Changes

**Previous:** Title started centred, flew to bottom-left via position/layout switch (caused jerk).

**Now:** Title stays **left-aligned from the first frame**. The large title element and the final small title in the column share the same `left` edge — `clamp(24px, 5vw, 96px)`. The transition is a pure scale+opacity crossfade between two elements at the same x position.

- Large title: `font-size: clamp(44px, 7.5vw, 120px)` — appears first
- Small title in column: `font-size: clamp(28px, 4vw, 64px)` — fades in as large fades out
- No positional jump. No layout change. GPU-only compositing.

---

## Easing Decisions

| Beat | Easing | Why |
|------|--------|-----|
| Background | `power2.inOut` | Cinematic cross-dissolve feel |
| Parallax | `power2.out` | Organic settle, not springy |
| Header, tag | `power2.out` | Soft, directional |
| Title appear | `expo.out` | Fast in, long tail — premium reveal |
| Title scale-out | `power2.in` | Gentle acceleration into fade |
| Column in | `power3.out` | Confident, weighted |
| Mascot | `back.out(1.6)` | Single elastic overshoot — feels alive |
| CTA slide-up | `power3.out` | Strong, deliberate |
| Mascot in CTA | `back.out(1.4)` | Slight bounce — settles into pill |
| Product card | `back.out(1.3)` | Subtle character |
| Beam sweep | `power2.inOut` | Even entry and exit — not harsh |

---

## Mascot-to-CTA Implementation

The mascot never truly "moves" — GSAP uses a two-position crossfade that the eye reads as motion:

1. `mascotWrap` (beside reasoning): `opacity → 0, x: +12px, scale: 0.85` over 400ms with `power2.in`
2. `mascotInCTA` (inside pill): `opacity → 1, x: 0, scale: 1` over 450ms with `back.out(1.4)` starting 280ms after step 1

The 120ms overlap between fade-out and slide-in creates the illusion of a single motion. The mascot inside the pill uses the **Figma SVG asset** (not a second Rive instance) to avoid loading overhead.

---

## Beam CTA Implementation

Inspired by `beam.jakubantalik.com` — a subtle traveling light across the pill.

- Element: `<span>` absolutely positioned inside the pill, `width: 45%`, semi-transparent purple-white gradient
- Initial: `x: -110%, opacity: 0`
- First sweep: fires 550ms after CTA appears, sweeps to `x: 120%` in 900ms (`power2.inOut`)
- Repeat: resets to `x: -110%` and loops every 4.8s (3.8s delay + 1.0s sweep) at 40% opacity
- Color: `rgba(167,134,229, 0.35–0.40)` — purple tint, not white — keeps the "agent intelligence" brand

---

## Logo + Header

Source: Figma MCP node `925:2677` (Header frame).

- Logo SVG: `http://localhost:3845/assets/e0288041c6efa70a3a43bafb204eea4bff585b25.svg` — exact Figma asset
- Placement: `top: clamp(24px, 4.5vh, 72px)`, `left/right: clamp(24px, 5vw, 96px)` — mirrors Figma's `pt-72 px-96` in fluid form
- Right side: weather icon + date + clock (12h, no AM/PM inline) + AM/PM separate — matches Figma typography
- Header animates as one unit: `y: -8 → 0`, `opacity: 0 → 1` at 1.0s mark

---

## Product Card Changes

- Count: 1 (was 3)
- Label: `Masala Dosa` (subCategories[0])
- Design: Figma stacked-tile (two overlapping rounded squares, white border, warm gradient fill, label in bottom strip)
- Position: `bottom: clamp(32px, 6vh, 72px)`, `right: clamp(24px, 4vw, 72px)`
- Animation: GSAP `x: 40 → 0, scale: 0.92 → 1, opacity: 0 → 1` with `back.out(1.3)`

---

## Files Changed

| File | Change |
|------|--------|
| `src/animations/l0Timeline.ts` | **New** — complete GSAP timeline factory |
| `src/components/L0/CinematicL0.tsx` | **New** — self-contained GSAP component |
| `src/components/L0/L0Glance.tsx` | Routes cinematic → CinematicL0; standard path unchanged |
| `src/components/L0/GlanceLayout.tsx` | Cinematic branch removed (now in CinematicL0) |
| `package.json` / `package-lock.json` | `gsap@3.15.0` added |
