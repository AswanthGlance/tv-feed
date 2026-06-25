# L0 T1 Animation Specification

**Version:** 1.0  
**Status:** Reference — Android TV Handoff  
**Source of truth:** `src/config/l0T1Config.ts`  
**Live reference:** `/l0_t1` route in this repo

---

## Overview

This document specifies the complete animation sequence for the L0 (Level-Zero) cinematic card — the full-bleed ambient content experience on Glance TV. It covers three layout templates, all timing, easing, state transitions, and final hold behavior.

A developer should be able to visit `/l0_t1` and observe the running system, then implement it on Android TV using this document as the specification.

---

## Templates

| Template | Alignment | Products | Representative Item |
|----------|-----------|----------|-------------------|
| Left     | Left      | 2 cards  | `eatly-dawn`      |
| Center   | Center    | None     | `feed-13`         |
| Right    | Right     | None     | `feed-08`         |

The layout affects:
- Position of the content column (agent + reasoning + CTA)
- Direction of the gradient overlay
- Transform origin for mascot and reasoning scale animations
- Whether product cards are shown (left + center only)

---

## State Machine

The animation proceeds through 12 sequential states. States do not branch or repeat. Each state begins when the previous one's defining animation completes.

```
State 0 → Loading / Idle
State 1 → BG Reveal
State 2 → Overlay Reveal
State 3 → Header + Title Reveal
State 4 → Agent Reveal (Hero size)
State 5 → Reasoning Reveal (begins)
State 6 → Reasoning Hold (completes)
State 7 → Hero Shrink
State 8 → CTA Reveal
State 9 → Mascot FLIP to CTA
State 10 → CTA Text Reveal
State 11 → Final Hold (with background drift)
```

---

## State Specifications

### State 1 — BG Reveal
**Begins:** t = 0 ms  
**Duration:** 1000 ms  
**Description:** The background image fades in from opacity 0 to 1.

| Property | From | To | Duration | Easing |
|----------|------|----|----------|--------|
| opacity  | 0    | 1  | 1000 ms  | power2.inOut |

**Parallax (simultaneous):**

| Property | From  | To   | Duration | Easing      |
|----------|-------|------|----------|-------------|
| scale    | 1.05  | 1.00 | 2800 ms  | power1.out  |
| yPercent | -1.8  | 0    | 2800 ms  | power1.out  |

The parallax runs longer than the fade — this creates a subtle "settling" feel as the image arrives.

---

### State 2 — Overlay Reveal
**Begins:** t = 400 ms  
**Duration:** 850 ms  
**Description:** Dark gradient overlay fades over the image to make text legible.

The overlay is a 3-layer gradient composite:
- Bottom-up dark gradient (text readability)
- Top-down dark gradient (header readability)
- Side gradient — direction depends on alignment:
  - Left/Center: left-to-right dark
  - Right: right-to-left dark

| Property | From | To | Duration | Easing      |
|----------|------|----|----------|-------------|
| opacity  | 0    | 1  | 850 ms   | power2.out  |

---

### State 3 — Header + Title Reveal
**Begins:** t = 900 ms (header), t = 1100 ms (title)  

**Header** (logo + time — first card only, subsequent cards skip):

| Property | From | To | Duration | Easing      |
|----------|------|----|----------|-------------|
| opacity  | 0    | 1  | 500 ms   | power2.out  |
| y        | -10  | 0  | 500 ms   | power2.out  |

**Tag badge:**

| Property | From | To | Duration | Easing      |
|----------|------|----|----------|-------------|
| opacity  | 0    | 1  | 400 ms   | power2.out  |
| y        | 6    | 0  | 400 ms   | power2.out  |

**Title (word-mask reveal):** Words are wrapped in clip containers. Each word's inner span slides up from behind the clip edge.

| Property | Technique        | Duration per word | Stagger | Easing      |
|----------|-----------------|-------------------|---------|-------------|
| y        | clip mask slide | 550 ms            | 70 ms   | power3.out  |

Title and tag position: always top-left regardless of alignment.

---

### State 4 — Agent Reveal (Hero)
**Begins:** t = 1350 ms  
**Duration:** 550 ms  
**Description:** Mascot floats in at HERO size (80 px). This is the moment the agent is introduced.

- **Left/Right:** Mascot appears inline to the left or right of the reasoning block
- **Center:** Mascot appears centered above the reasoning block

| Property | From | To  | Duration | Easing      |
|----------|------|-----|----------|-------------|
| opacity  | 0    | 1   | 550 ms   | power3.out  |
| y        | 8    | 0   | 550 ms   | power3.out  |
| scale    | 1.0  | 1.0 | —        | (held at hero size) |

Mascot render size at this state: **80 px**  
Mascot mode: `idle`

---

### State 5 — Reasoning Reveal (begins)
**Begins:** t = 1730 ms (mascotIn + 380 ms offset)  
**Duration:** 4000 ms (spread across all characters)  
**Description:** The reasoning text resolves from blur into focus. This is the HERO MOMENT of the card.

The reasoning element appears at opacity 1 and hero scale (1.0). All characters start at `opacity: 0, blur: 12px`. GSAP staggers them to `opacity: 0.78, blur: 0` over 4000 ms.

| Property    | From      | To        | Duration | Easing      |
|-------------|-----------|-----------|----------|-------------|
| opacity (element) | 0  | 1         | 320 ms   | power2.out  |
| scale (element) | 1.0 | 1.0      | —        | (held at hero) |
| char opacity | 0        | 0.78      | staggered over 4000 ms | power2.out per char |
| char blur    | 12px     | 0px       | staggered over 4000 ms | power2.out per char |

Reasoning font size: `clamp(18px, 2.2vw, 32px)` — rendered at HERO scale 1.0  
Mascot mode switches to `thinking` when typing begins.

**Highlights:** Key phrases are rendered with purple glow:
- `font-weight: 700`
- `color: rgba(255,255,255,0.98)`
- `text-shadow: 0 0 12px rgba(192,132,252,0.9), 0 0 28px rgba(112,71,226,0.6)`

---

### State 6 — Reasoning Hold
**Begins:** Reasoning reveal completes (t ≈ 5730 ms)  
**Duration:** 1000 ms  
**Description:** A deliberate pause. Nothing moves. The user absorbs the reasoning.

No animation fires during this state. The 1000 ms hold is intentional — it creates a sense of the agent having finished speaking.

---

### State 7 — Hero Shrink
**Begins:** t ≈ 6730 ms  
**Duration:** 850–900 ms  
**Description:** Both the mascot and the reasoning element scale down simultaneously from hero to final resting size.

**Mascot shrink:**

| Property | From | To    | Duration | Easing       |
|----------|------|-------|----------|--------------|
| scale    | 1.0  | 0.65  | 850 ms   | power2.inOut |

Mascot visual: 80 px × 0.65 = **52 px** final visual size

**Reasoning shrink:**

| Property | From | To   | Duration | Easing       |
|----------|------|------|----------|--------------|
| scale    | 1.0  | 0.72 | 900 ms   | power2.inOut |

Reasoning visual after scale: approximately `clamp(13px, 1.35vw, 20px)`

Transform origins:
- Left: `left top` (mascot), `left center` (mascot float)
- Center: `center top` (reasoning), `center center` (mascot)
- Right: `right top` (reasoning), `right center` (mascot)

---

### State 8 — CTA Reveal
**Begins:** t ≈ 8080 ms (heroShrink + agentLook offset + ctaReveal delay)  

**Agent look (precedes CTA):** At `heroShrink + 850ms`, mascot mode switches to `looking`. The agent turns toward where the CTA will appear. 650 ms later the CTA slides in.

**CTA pill slide-in:**

| Property | From | To | Duration | Easing      |
|----------|------|----|----------|-------------|
| opacity  | 0    | 1  | 460 ms   | power3.out  |
| y        | 14   | 0  | 460 ms   | power3.out  |

The CTA pill is a white rounded rectangle:
- Height: `clamp(52px, 5.8vh, 68px)`
- Border-radius: 999
- Background: initially `transparent` (mascot occupies it); transitions to `rgba(255,255,255,0.95)` after mascot arrives

---

### State 9 — Mascot FLIP to CTA
**Begins:** t ≈ CTA reveal + 400 ms  
**Duration:** 750 ms total (2-keyframe arc)  

The mascot travels from its float position (in or above the reasoning block) to its slot inside the CTA pill via an arc animation.

**Arc keyframes:**

| Keyframe | x offset    | y offset          | scale | Duration | Easing      |
|----------|-------------|-------------------|-------|----------|-------------|
| Midpoint | dx × 0.5    | dy × 0.5 − arcH   | 0.75  | 380 ms   | power2.out  |
| Landing  | dx (target) | dy (target)       | 0.5   | 370 ms   | power3.in   |

Where `arcH = abs(dy) × 0.45 + 40` — the arc height scales with travel distance.

**On landing:**
1. Float mascot hides (opacity → 0)
2. Float mascot width collapses to 0 over 220 ms (`power2.in`) — triggers `onMascotGone`
3. CTA mascot slot fades in: `opacity → 1, scale 0.7 → 1, x -6 → 0` over 220 ms

**After settle (380 ms pause):** CTA text reveal begins.

---

### State 10 — CTA Text Reveal
**Begins:** After mascot settles in CTA slot (380 ms bass pause after landing)  
**Duration:** 1400 ms  
**Description:** CTA label text resolves from blur into focus (same technique as reasoning reveal, shorter duration). Simultaneously a clip container expands from width 0 to full text width.

**Text reveal (character blur resolution):**

| Property    | From  | To  | Duration | Easing      |
|-------------|-------|-----|----------|-------------|
| char opacity | 0    | 1.0 | staggered over 1400 ms | power2.out per char |
| char blur    | 12px | 0px | staggered over 1400 ms | power2.out per char |

**Clip container expand:**

| Property | From | To (natural text width) | Duration | Easing       |
|----------|------|------------------------|----------|--------------|
| width    | 0    | full text width        | 1400 ms  | power1.inOut |

CTA text color: `#111` (dark on white pill)  
CTA font: `Plus Jakarta Sans, 600 weight, clamp(13px, 1.35vw, 20px)`

**After text completes + 150 ms margin:** Border beam / glow fires.

**Border beam:** Animated colorful gradient border traces the pill perimeter.  
**Glow:** `box-shadow: 0 0 32px 8px rgba(112,71,226,0.38)`

---

### State 11 — Final Hold
**Begins:** After beam fires (≈ t + 200 ms grace)  
**Duration:** 10 000 ms  
**Description:** Everything is static. The agent sits in the CTA. The card rests at its final composition.

During the hold, a **subtle background drift** is applied to the scene container:

| Property | From     | To            | Duration    | Easing      | Repeat |
|----------|----------|---------------|-------------|-------------|--------|
| scale    | 1.0      | 1.03          | 12 000 ms   | sine.inOut  | yoyo   |
| xPercent | 0        | 0.8           | 12 000 ms   | sine.inOut  | yoyo   |
| yPercent | 0        | −0.4          | 12 000 ms   | sine.inOut  | yoyo   |

The drift is applied to the outer container — this means all elements (image, overlay, text) move together, preserving composition. The scale and pan are imperceptible at rest but create a sense of life when viewed for 10 seconds.

**Design constraint:** The drift must never be visible as a jump or snap. If a viewer cannot tell the image is moving, the timing is correct.

After 10 000 ms, the system advances to the next template and the sequence restarts from State 0.

---

## Easing Reference

| Name          | Description                        | Used for                              |
|---------------|------------------------------------|---------------------------------------|
| power1.out    | Gentle deceleration                | Parallax, background pan              |
| power2.out    | Medium deceleration                | Most opacity + position reveals       |
| power2.inOut  | Symmetrical ease                   | Mascot shrink, reasoning shrink, clip |
| power3.out    | Sharp deceleration                 | Mascot entrance, CTA pill, title words |
| power3.in     | Sharp acceleration                 | Mascot arc landing                    |
| sine.inOut    | Smooth, organic                    | Background drift                      |

---

## Mascot State Reference

| Mode      | Rive State           | When active                                 |
|-----------|----------------------|---------------------------------------------|
| `idle`    | `Idel _Eyeblink`     | Before reasoning starts; CTA resting        |
| `thinking`| `Loading`            | During reasoning reveal (States 5–6)        |
| `looking` | `Looking Around`     | After heroShrink, looking toward CTA (State 8) |

Note: The Rive state name is literally `Idel _Eyeblink` (typo in source .riv file — do not correct).

---

## Typography

| Element        | Font                | Weight | Size                        | Color                    |
|----------------|---------------------|--------|-----------------------------|--------------------------|
| Tag badge      | Plus Jakarta Sans   | 700    | `clamp(8px, 0.8vw, 11px)`  | `rgba(255,255,255,0.72)` |
| Title          | Plus Jakarta Sans   | 700    | `clamp(18px, 2.2vw, 34px)` | `rgba(255,255,255,0.88)` |
| Reasoning (hero)| Plus Jakarta Sans  | 400    | `clamp(18px, 2.2vw, 32px)` | `rgba(255,255,255,0.78)` |
| Reasoning (final)| (scale: 0.72)     | 400    | visual ≈ 20px               | same                     |
| CTA label      | Plus Jakarta Sans   | 600    | `clamp(13px, 1.35vw, 20px)`| `#111`                   |

---

## Layout Geometry

| Alignment | Content left           | Content right          | Content width              | Text align |
|-----------|------------------------|------------------------|----------------------------|------------|
| Left      | `clamp(20px,4.5vw,88px)` | —                    | `clamp(240px,52vw,860px)`  | left       |
| Center    | `50%` (translateX -50%) | —                   | `clamp(400px,72vw,1100px)` | center     |
| Right     | 0                      | `clamp(20px,4.5vw,88px)` | `clamp(400px,80vw,1100px)` | right     |

Tag and title are always positioned top-left regardless of alignment:
- Top: `clamp(80px, 12vh, 140px)`
- Left: `clamp(20px, 4.5vw, 88px)`

---

## Files Changed

| File | Purpose |
|------|---------|
| `src/config/l0T1Config.ts` | **All timing constants** — single source of truth |
| `src/L0T1Lab.tsx` | Main lab component — state tracker, dev overlay, template cycling |
| `src/L0T1App.tsx` | App wrapper for the route |
| `src/main.tsx` | Added `/l0_t1` and `/l0-t1` route detection + render |

**Files not modified:**
- `src/animations/l0Timeline.ts` — production unchanged
- `src/components/L0/CinematicL0.tsx` — production unchanged
- `src/App.tsx` — production unchanged
- All warm/cold profile routes — untouched
- All onboarding screens — untouched

---

## Dev Lab Usage

Navigate to `/l0_t1` in the dev server.

| Control | Action |
|---------|--------|
| `D` | Toggle developer overlay |
| `→` | Advance to next template |
| `←` | Go to previous template |
| `Space` | Replay current template from State 0 |

The developer overlay shows:
- Current state number and name
- Elapsed time since start
- Elapsed time within current state
- Expected cumulative start time for current state
- Full state timeline with dots indicating progress

---

## Implementation Notes for Android TV

1. **All durations are in milliseconds** — convert to the animation framework's native unit.
2. **GSAP `power2.out`** maps to a cubic-bezier approximately `(0.0, 0.0, 0.4, 1.0)`.
3. **GSAP `power3.out`** maps approximately to `(0.0, 0.0, 0.15, 1.0)`.
4. **GSAP `sine.inOut`** maps approximately to `(0.445, 0.05, 0.55, 0.95)`.
5. The **mascot FLIP arc** (State 9) requires computing the pixel distance between the float position and the CTA slot at runtime — this is a layout-dependent calculation. The arc height formula is `arcH = abs(dy) * 0.45 + 40` where `dy` is the vertical pixel distance.
6. The **character blur reveal** (States 5 and 10) can be approximated on Android TV using an alpha stagger animation if blur is not available. The key property is the stagger timing across characters, not the blur itself.
7. The **word-mask title reveal** (State 3) clips each word via overflow:hidden on a wrapper; the inner word element slides up from below the clip edge.
8. The **background drift** (State 11) is applied as a transform on the container element — not directly on the image — so it moves the entire composition uniformly.
