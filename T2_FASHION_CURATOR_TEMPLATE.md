# T2 Fashion Curator Template

**Route:** `/t2-fashion` (also `?t2` or `#t2-fashion`)  
**Entry point:** `src/T2FashionApp.tsx` → `src/components/T2/T2FashionStory.tsx`  
**Isolated from:** existing L0 feed, onboarding, preference engine

---

## Overview

The agent acts as a Fashion Curator / Stylist / Fashion Editor — not a shopping assistant. Products are supporting evidence. The story builds a perspective, guides attention through the look, and earns the title reveal at the end.

---

## Phase Flow

```
genesis → open → dress → bag → shoes → finale → title → cta
```

| Phase     | Type    | Narration mode  | Agent position  |
|-----------|---------|-----------------|-----------------|
| genesis   | ambient | speech bubble   | default (5%, 77%)  |
| open      | beat    | ambient         | default         |
| dress     | beat    | bubble          | dress (26%, 22%)   |
| bag       | beat    | bubble          | bag (56%, 46%)     |
| shoes     | beat    | bubble          | shoes (36%, 70%)   |
| finale    | beat    | ambient         | finale (45%, 65%)  |
| title     | reveal  | none            | cta (49%, 84%)     |
| cta       | action  | none            | inside CTA pill    |

---

## Act 1 — Generation Phase (genesis)

**What happens:**

1. Dark `#08060a` ambient background, no image visible.
2. Header (Glance logo + date/weather/time) fades in at `t=0.4s`.
3. Mascot springs in at `t=0.9s` (`back.out(1.7)`, scale 0.72→1).
4. Genesis speech starts at `t=1.3s` — mascot speaks three lines via `CharReveal` in a speech bubble attached to the mascot.
5. Color palette fragments (`warm light`, `sand`, `ivory`, `leather`, `gold dust`) appear bottom-center, staggered at `t=1.7s`.
6. Base image blurs in over the fragments at `t=2.0s` — `blur(32px) brightness(0.18) saturate(0.12)` → `blur(0) brightness(1.0) saturate(1.0)` over `2.8s power3.inOut`.
7. Fragments scatter/fade at `t=3.6s`.
8. Genesis overlay fades out at `t=5.0s`.
9. Story phase begins at `t=5.8s`.

**Genesis speech lines:**
```
"I'm putting together a look."      (hold 2800ms)
"Not something loud."               (hold 2600ms)
"Something that feels effortless."  (hold 3200ms)
```

**Image assembly effect — key principle:**  
Color fragments appear first. The full image blurs in *over* them. The feeling is "Glance is composing this", not loading.

---

## Act 2 — Full Image Reveal (open beat)

Crossfade to base image completes. Agent speaks ambient narration (centred bottom, Playfair Display, `3vw`):

```
"Some looks belong to a place."
"Some looks belong to a feeling."
"This one feels like both."
```

No products shown. No highlights.

---

## Acts 3–5 — Object Moments (bubble beats)

Each product beat follows the same structure:

1. Agent moves to position (GSAP `power2.inOut`, `1.4s`).
2. Image crossfades to focus variant (dress/bag/shoes layer).
3. `SpatialBubble` appears near the object after `1.2s` agent move delay.
4. Bubble animates in: `scale 0.88→1, blur 10→0, back.out(1.4)`.
5. On appearance, bubble enters **speaking mode** (`t2-bubble-speaking` class):
   - `box-shadow` pulses with purple glow every `2.8s`.
   - `border-color` shifts from `rgba(255,255,255,0.18)` → `rgba(192,132,252,0.38)`.
   - Feels like the agent is actively communicating, not a static tooltip.
6. Lines run inside the bubble via `CharReveal` (`32ms/char`).
7. Bubble closes, next beat begins.

**Bubble structure:**
```
DRESS                     ← category label (uppercase, 0.7vw, dimmed)
─────────────────────
"The V-neck keeps         ← narration (Playfair Display, 1.4vw, weight 300)
the look open."
```

**Spatial bubble CSS:** glassmorphism — `backdrop-filter: blur(24px) saturate(1.6)`, `rgba(255,255,255,0.08)` background, `16px` border-radius.

**Focus technique (per spec):**  
Image layers use crossfade to the focus variant. No black overlays, no dimming of the full scene. Local emphasis only — the scene stays alive.

---

## Act 6 — Finale (ambient)

Agent moves to `finale` position. Returns to base image. Ambient narration:

```
"The best looks rarely shout."
"They simply feel right the moment you see them."
```

---

## Act 7 — Title Reveal

After finale narration, a new `'title'` phase begins:

1. Agent moves to `cta` position (`49%, 84%`) — near bottom center.
2. `titleVisible` state shows `t2-glance-title` DOM.
3. Each word of `GLANCE_TITLE_WORDS` (`['DESERT', 'MINIMALISM']`) animates in via GSAP stagger:
   - From: `opacity:0, y:40, blur:18px, letterSpacing:0.35em`
   - To: `opacity:1, y:0, blur:0, letterSpacing:0.12em`
   - Duration: `0.9s power3.out`, stagger `0.22s` per word.
4. Title holds for `2.2s`, then fades out: `y:-16, blur:8px, 0.65s power2.in`.
5. `titleVisible` clears, CTA phase begins.

**Title typography:**  
`8–10vw` (clamps 72px–160px), `font-weight: 800`, `Plus Jakarta Sans`, `letter-spacing: 0.12em`, uppercase, centered. Text shadow includes subtle purple glow (`rgba(160,100,255,0.18)`).

**Design intent:** The title is the conclusion of the story, not the beginning. It feels earned.

---

## Act 8 — CTA

1. `AgentCTA` fades in: `opacity:0, y:28, blur:8px → clear`, `1.0s power3.out`.
2. Mascot is inside the pill (`showMascotInside=true`, `animStep=5`).
3. `BorderBeam` provides colorful animated border glow.
4. Default CTA text: `"Show me more looks like this"`.

---

## GSAP Timeline Summary

| Timestamp | Action |
|-----------|--------|
| `0.0`     | Start |
| `0.4s`    | Header slide in |
| `0.9s`    | Mascot spring in |
| `1.3s`    | Genesis speech begins |
| `1.7s`    | Color fragments appear (staggered) |
| `2.0s`    | Base image blurs in |
| `3.6s`    | Fragments scatter out |
| `4.3s`    | Agent mode → idle |
| `5.0s`    | Genesis overlay fades |
| `5.8s`    | Story phase: open beat begins |
| `+1.4s`   | Per beat: agent moves (power2.inOut) |
| `+1.2s`   | Per bubble beat: bubble appears |
| variable  | Each line: `charCount × 32ms + holdMs` |
| end       | Title reveal (0.9s × 2 words + 2.2s hold) |
| +0.12s    | CTA fades in |

---

## Agent Movement

Movement uses `gsap.to(mascotWrapRef, { left, top, duration: 1.4, ease: 'power2.inOut' })`. The mascot is `position: fixed`, so `left/top` are viewport percentages. GSAP tweens these directly — curved implicit path via easing.

**Agent mode transitions:**
- Genesis: `thinking` → `idle` at genesis end
- Each beat: brief `looking` flash (`1.1s`) before settling to beat's target mode
- Bubble beats: `thinking` (active curation)
- Finale: `idle` (settled, reflective)
- Title + CTA: `idle`

---

## Bubble Design

```css
.t2-spatial-bubble {
  glassmorphism: backdrop-filter blur(24px) saturate(1.6)
  background: rgba(255,255,255,0.08)
  border: 1px solid rgba(255,255,255,0.18)
  border-radius: 16px
  box-shadow: 0 8px 40px rgba(0,0,0,0.50) + purple accent glow
}

.t2-bubble-speaking {
  animation: t2-bubble-glow 2.8s ease-in-out infinite    /* box-shadow pulse */
           + t2-bubble-border-shift 2.8s ease-in-out infinite  /* border purple shift */
}
```

**Typography inside bubble:**
- Label: `Plus Jakarta Sans`, 0.7vw, `font-weight: 700`, uppercase, `letter-spacing: 0.15em`
- Text: `Playfair Display`, 1.4vw, `font-weight: 300`, `line-height: 1.4`

---

## Thumbnail + Price Logic

The current implementation renders narration-only bubbles. To add product thumbnails and prices:

1. Extend the `Beat` type with `product?: { name: string; price: string; thumb: string }`.
2. Add to `SpatialBubble` props and render conditionally inside the bubble:
   ```tsx
   {product && (
     <>
       <img src={product.thumb} className="t2-bubble-thumb" />
       <div className="t2-bubble-price">{product.price}</div>
     </>
   )}
   ```
3. If `product` is absent, bubble shows narration only (current behavior).

---

## Remote / Keyboard Controls

| Key          | Action                   |
|--------------|--------------------------|
| `→` / Enter  | Skip forward one beat    |
| `←`          | Step back one beat       |
| `R`          | Restart from genesis     |
| `Esc`        | Exit T2 → main app       |

Autoplay is default — no interaction required.

---

## Files Changed / Created

| File | Change |
|------|--------|
| `src/components/T2/T2FashionStory.tsx` | Full implementation — genesis, story beats, bubble system, title reveal, CTA |
| `src/T2FashionApp.tsx` | Thin wrapper, routes exit to main app |
| `src/main.tsx` | Routes `/t2-fashion`, `?t2`, `#t2-fashion` to `T2FashionApp` |
| `public/images/t2/t2-base.{png,jpg}` | Full look base image |
| `public/images/t2/t2-dress.{png,jpg}` | Dress focus layer |
| `public/images/t2/t2-bag.{png,jpg}` | Bag focus layer |
| `public/images/t2/t2-shoes.{png,jpg}` | Shoes focus layer |
| `T2_FASHION_CURATOR_TEMPLATE.md` | This document |

**Not modified:**
- `src/App.tsx` (main feed)
- `src/logic/` (preference engine)
- `src/components/L0/` (existing L0 templates)
- `src/components/Calibration/` (onboarding)
