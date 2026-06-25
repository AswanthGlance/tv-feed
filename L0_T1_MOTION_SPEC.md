# L0 T1 Motion Spec

**Version:** 2.1  
**Status:** Final — Android TV + Web Handoff  
**Source of truth:** `src/config/l0T1Config.ts`  
**Live reference:** `/l0_t1` route in this repo  
**Content reference:** warm_profile_1 / ws-coorg card  
**Figma source:** frames 18-930 (Reasoning), 18-1010 (Final Hold), 19-5 (Shop Products)

---

## Canvas

| Property       | Value          |
|----------------|----------------|
| Size           | 1920 × 1080 px |
| Safe margin    | 80 px left / right |
| Content left   | 80 px          |
| Title top      | 228 px         |
| Reasoning top  | 808 px         |
| CTA bottom row | 72 px from bottom |

---

## State Machine — 8 states, linear, no branching

```
1 Title Reveal → 2 Agent Reveal → 3 Reasoning → 4 Hero Shrink
→ 5 CTA Entry → 6 CTA Expand → 7 CTA Text → 8 Final Hold
```

Total sequence before final hold: ~14 500 ms  
Final hold: 10 000 ms  
Background drift begins during State 8.

---

## State 1 — Title Reveal

**Cumulative start:** 0 ms

| Element       | Property | From        | To   | Duration   | Easing         | Delay from t=0 |
|---------------|----------|-------------|------|------------|----------------|----------------|
| BG image      | opacity  | 0           | 1    | 1000 ms    | power2.inOut   | 0              |
| BG image      | scale    | 1.04        | 1.0  | 2800 ms    | power1.out     | 0              |
| BG image      | yPercent | −1.5        | 0    | 2800 ms    | power1.out     | 0              |
| Dark overlay  | opacity  | 0           | 1    | 850 ms     | power2.out     | 400 ms         |
| Header row    | opacity  | 0           | 1    | 500 ms     | power2.out     | 900 ms         |
| Header row    | y        | −12         | 0    | 500 ms     | power2.out     | 900 ms         |
| Tag container | opacity  | 0           | 1    | 500 ms     | power3.out     | 1100 ms        |
| Tag container | y        | 10          | 0    | 500 ms     | power3.out     | 1100 ms        |

**Tag + title word reveal (starts at t = 1100 ms):**

Each word slides up from behind a clip mask — `overflow: hidden` wrapper, inner span animates `translateY(110% → 0)`.

| Element          | Duration / word | Stagger   | Delay      | Easing      |
|------------------|-----------------|-----------|------------|-------------|
| Tag1 words       | 480 ms          | 90 ms     | 0 ms       | power3.out  |
| Tag2 words       | 480 ms          | 90 ms     | 220 ms     | power3.out  |
| Title words      | 520 ms          | 80 ms     | 180 ms     | power3.out  |

Total title sequence (5 words × 80 ms stagger + 520 ms last word) ≈ **840 ms**  
All words enter in reading order left→right.

**Hold after title completes:** `TITLE_HOLD_MS` = 1000 ms  
State 2 begins at t ≈ 2100 ms

**Overlay spec (3-layer composite):**
```
bottom-up: rgba(0,0,0,0.92) 0% → rgba(0,0,0,0.55) 28% → rgba(0,0,0,0.08) 52% → transparent 68%
top-down:  rgba(0,0,0,0.65) 0% → rgba(0,0,0,0.25) 18% → transparent 36%
side:      rgba(0,0,0,0.50) 0% → rgba(0,0,0,0.18) 36% → transparent 60%  [left→right]
```

**Title layout (Figma: left=80, top=228):**
- Tag row: white vertical bar (3×32 px) + "Weekend Escapes" · "Travel", 22 px Inter Medium
- Title text: "A Coffee Estate at First Light", 28 px Plus Jakarta Sans SemiBold (7 words)
- Both tag and title words animate individually

---

## State 2 — Agent Reveal (Hero)

**Cumulative start:** ~2100 ms

| Element   | Property | From | To  | Duration             | Easing      |
|-----------|----------|------|-----|----------------------|-------------|
| Mascot    | opacity  | 0    | 1   | `AGENT_REVEAL_MS` = 600 ms | power3.out |
| Mascot    | y        | 10   | 0   | 600 ms               | power3.out  |
| Mascot    | scale    | 1.0  | 1.0 | held at hero         |             |

**Mascot position (hero):** left=72 px, bottom row anchored with reasoning  
**Mascot size:** 56 px (`MASCOT_HERO_SIZE`)  
**Mascot mode:** `idle` (Rive state: `Idel _Eyeblink`)  
**Purple glow bg:** `#733bf6`, blur 12 px, opacity 50%

**Hold after mascot:** `AGENT_HOLD_MS` = 1000 ms  
State 3 begins at t ≈ 3700 ms

---

## State 3 — Reasoning (Hero)

**Cumulative start:** ~3700 ms

| Element       | Property      | From      | To         | Duration                  | Easing         |
|---------------|---------------|-----------|------------|---------------------------|----------------|
| Reasoning div | opacity       | 0         | 1          | 350 ms                    | power2.out     |
| Reasoning div | scale         | 1.0       | 1.0        | held at hero              |                |
| Each character | opacity      | 0         | 0.8        | staggered over 4500 ms    | power2.out     |
| Each character | blur (filter)| 12 px     | 0 px       | staggered over 4500 ms    | power2.out     |

**Reveal duration:** `REASONING_REVEAL_MS` = 4500 ms  
**Mascot mode switches to:** `thinking` (Rive: `Loading`) on reveal start  

**Reasoning text (Figma: left=80, top=808, width=960, size=32 px):**
> "Attikan won the specialty cup and runs monsoon estate stays. It's six hours out, peak green this fortnight. I'll shortlist Ama and Attikan for two nights."

**Highlighted phrases** (Figma style):
- Color: `rgba(206,193,255,0.9)` — `rgba(255,255,255,0.98)` for highlight span
- Font weight: 600 (SemiBold)
- Text shadow: `0 0 12px rgba(192,132,252,0.9), 0 0 28px rgba(112,71,226,0.6)`
- Highlights: `['Attikan', 'peak green this fortnight']`

**Hold after reveal completes:** `REASONING_HOLD_MS` = 5000 ms  
State 4 begins at t ≈ 13 200 ms  *(updated: +1700 ms from longer reveal)*

---

## State 4 — Hero Shrink

**Cumulative start:** ~11 500 ms

Both mascot and reasoning scale down simultaneously:

| Element       | Property | From  | To                   | Duration             | Easing        |
|---------------|----------|-------|----------------------|----------------------|---------------|
| Mascot float  | scale    | 1.0   | 0.714 (40/56)        | `HERO_SHRINK_MS` = 500 ms | power2.inOut |
| Reasoning div | scale    | 1.0   | 0.78                 | 500 ms               | power2.inOut  |

**Transform origins:**
- Mascot: `left center`
- Reasoning: `left top`

**Hold after shrink:** `HERO_SHRINK_HOLD_MS` = 500 ms  
At shrink+500 ms: mascot mode → `looking` (Rive: `Looking Around`)  
`AGENT_LOOK_TO_CTA_MS` = 650 ms pause  
State 5 begins at t ≈ 13 150 ms

---

## State 5 — CTA Entry

**Cumulative start:** ~13 150 ms

| Element  | Property | From | To | Duration                    | Easing      |
|----------|----------|------|----|-----------------------------|-------------|
| CTA pill | opacity  | 0    | 1  | `CTA_PILL_REVEAL_MS` = 350 ms | power3.out |
| CTA pill | y        | 16   | 0  | 350 ms                      | power3.out  |

**Feedback and products do NOT appear at State 5** — they are deferred to State 8 after CTA text is done.

**CTA pill layout (Figma frame 18-1010):**
- Position: left=80, top=928, height=72, border-radius=72 px
- Background: `rgba(255,255,255,0.95)` (white)
- Contains: 40 px mascot slot (empty at this state) + label clip

---

## State 6 — CTA Expand (Mascot FLIP arc)

**Cumulative start:** CTA entry + 400 ms

The mascot travels from its float position to the CTA mascot slot via a parabolic arc.

**Arc calculation:**
```
dx = ctaSlot.centerX − mascotFloat.centerX
dy = ctaSlot.centerY − mascotFloat.centerY
arcH = abs(dy) × 0.45 + 32
```

| Keyframe | x     | y             | scale | Duration              | Easing      |
|----------|-------|---------------|-------|-----------------------|-------------|
| Midpoint | dx×0.5 | dy×0.5 − arcH | 0.8  | `MASCOT_FLIP_MS`×0.5 | power2.out  |
| Landing  | dx    | dy            | 0.5  | `MASCOT_FLIP_MS`×0.5 | power3.in   |

`MASCOT_FLIP_MS` = 700 ms total

**On landing:**
1. Float mascot opacity → 0 (immediate)
2. Float mascot width collapses: 0 over 200 ms, `power2.in`
3. CTA mascot slot: `opacity 0→1, scale 0.7→1, x -6→0` over 200 ms

**Settle pause:** `CTA_SETTLE_MS` = 380 ms  
State 7 begins after settle

---

## State 7 — CTA Text Reveal

**Cumulative start:** ~CTA entry + 400 + MASCOT_FLIP_MS + 220 + CTA_SETTLE_MS

| Element     | Property      | From  | To  | Duration                  | Easing       |
|-------------|---------------|-------|-----|---------------------------|--------------|
| CTA clip    | width         | 0     | full text width | `CTA_TEXT_REVEAL_MS` = 1400 ms | power1.inOut |
| Each character | opacity    | 0     | 1.0 | staggered over 1400 ms    | power2.out   |
| Each character | blur       | 12 px | 0 px | staggered over 1400 ms  | power2.out   |

**CTA text (Figma: 24 px Plus Jakarta Sans SemiBold, color: #111):**
> "Want me to shortlist estate stays?"

**After text + `BEAM_MARGIN_MS` (150 ms):**
- Border glow activates: `box-shadow: 0 0 32px 8px rgba(112,71,226,0.38)`
- CTA pill receives focus ring: `0 0 0 3px rgba(255,255,255,0.3)` when focused

State 8 begins at ~200 ms after beam fires

---

## State 8 — Final Hold

**Cumulative start:** ~14 500 ms  
**Duration:** `FINAL_HOLD_MS` = 10 000 ms

CTA text completes → feedback pill → products, staggered. Background drift begins.

**Staggered entry sequence (all CSS transitions, spring easing):**

| Element        | Trigger              | Easing                          | Duration | Motion           |
|----------------|----------------------|---------------------------------|----------|------------------|
| Feedback pill  | beamAt + 400 ms      | `cubic-bezier(0.16,1,0.3,1)`   | 650 ms   | y +14px → 0      |
| Product images | beamAt + 750 ms      | `cubic-bezier(0.16,1,0.3,1)`   | 700 ms   | x +28px → 0      |

`cubic-bezier(0.16, 1, 0.3, 1)` — spring-like: fast start, smooth deceleration into rest. No harsh pop.

**Final layout (Figma frame 18-1010):**
- Reasoning text: left=80, top=808, width=960, size=32 px (scaled via 0.78 from hero 40 px ≈ 32 px)
- Mascot: 40 px, inside CTA pill
- CTA pill: left=80, top=928, white bg, height=72, border-radius=72 px
- Feedback pill: left=602, top=928 — **single dark pill** containing both thumbs icons
- Product images: left=1752, top=924, size=80×80 px — **stacked images only, no text, no border**

**Background drift (applied to scene container):**

| Property | From  | To     | Duration              | Easing      | Repeat |
|----------|-------|--------|-----------------------|-------------|--------|
| scale    | 1.0   | 1.025  | `BACKGROUND_DRIFT_MS` = 14 000 ms | sine.inOut | yoyo |
| xPercent | 0     | 0.6    | 14 000 ms             | sine.inOut  | yoyo   |
| yPercent | 0     | −0.3   | 14 000 ms             | sine.inOut  | yoyo   |

Drift is imperceptible but prevents a static frozen feeling. Container-level (all elements move together).

---

## Interaction States (State 8 only)

### Focus targets

↓/↑ toggles focus between CTA and feedback pill:  
`CTA ↔ Feedback`

| State           | Focus indicator                                              |
|-----------------|--------------------------------------------------------------|
| CTA focused     | `box-shadow: 0 0 0 3px rgba(255,255,255,0.3)` + scale(1.03) |
| Feedback focused| No visual focus indicator in current spec (informational only) |

### Feedback pill (Figma node 385:1226)

**Spec:**
- Single pill containing both thumbs-up and thumbs-down icons as one SVG (66×40 px)
- Background: `linear-gradient(180deg, rgba(20,20,20,0.9), rgba(0,0,0,0.9))`
- Backdrop blur: 16.875 px
- Border: 2 px solid white
- Border-radius: 36 px
- Padding: 16 px 20 px

### Product images (Figma node 18:1049)

**Spec:**
- Position: left=1752, top=924, size=80×80 px
- Two stacked images: back image rotated 10°, offset left=15 px, size=72×72, radius=16, border=3 px white; front image size=80×80, radius=18, border=3 px white
- **No text, no card background, no border, no focus state**
- Purely ambient — indicates available products without demanding attention

---

## Text Reveal System

### Character-level blur resolution

Used for both Reasoning (State 3) and CTA label (State 7):

1. Text is split into individual character spans
2. Highlight phrases get `isHL: true` token — renders with purple style
3. GSAP staggers all characters from `{opacity: 0, filter: 'blur(12px)'}` to `{opacity: resolvedOpacity, filter: 'blur(0)'}`
4. Stagger each = `resolveMs / numChars` seconds

**Duration difference:**
- Reasoning: `REASONING_REVEAL_MS` = 4500 ms → slow, deliberate, reader has time to absorb
- CTA label: `CTA_TEXT_REVEAL_MS` = 1400 ms → snappier, action-oriented

**Clip-reveal (CTA only):**
- A wrapper `div` starts at `width: 0` and expands to natural text width over `CTA_TEXT_REVEAL_MS`
- Easing: `power1.inOut` (linear feel — clip expands at constant rate)
- Character reveal runs inside this clip simultaneously

---

## Mascot States Reference

| State | Rive state name    | When             | Trigger               |
|-------|--------------------|------------------|-----------------------|
| `idle`    | `Idel _Eyeblink` | Before reasoning | — (default)           |
| `thinking`| `Loading`        | Reasoning reveal | `rive.play('Loading')`|
| `looking` | `Looking Around` | After hero shrink| Boolean `Looking=true` |

> Note: Rive state name is literally `Idel _Eyeblink` — typo in source `.riv`. Do not correct.

---

## Typography Reference

| Element             | Font                | Weight | Size  | Color                        |
|---------------------|---------------------|--------|-------|------------------------------|
| Category tags       | Inter               | 500    | 22 px | `rgba(255,255,255,1.0)`      |
| Title               | Plus Jakarta Sans   | 700    | 28 px | `rgba(255,255,255,1.0)`      |
| Reasoning (hero)    | Plus Jakarta Sans   | 400    | 32 px | `rgba(255,255,255,0.8)`      |
| Reasoning highlight | Plus Jakarta Sans   | 600    | 32 px | `rgba(206,193,255,0.9)`      |
| CTA label           | Plus Jakarta Sans   | 600    | 24 px | `#111` (dark on white pill)  |
| Header time         | Plus Jakarta Sans   | 400    | 32 px | `#fff`                       |
| Header weather/date | Inter               | 500    | 26 px | `rgba(255,255,255,0.5)`      |

---

## Easing Reference

| Name                    | CSS cubic-bezier             | Character | Used for |
|-------------------------|------------------------------|-----------|----------|
| power1.out              | `(0.0, 0.0, 0.6, 1.0)`       | Gentle deceleration | Parallax, background pan |
| power2.out              | `(0.0, 0.0, 0.4, 1.0)`       | Standard deceleration | Opacity + position reveals |
| power2.inOut            | `(0.9, 0.0, 0.1, 1.0)`       | Symmetric ease | Mascot shrink, reasoning shrink |
| power3.out              | `(0.0, 0.0, 0.15, 1.0)`      | Sharp deceleration | Word reveals, mascot entrance, CTA pill |
| power3.in               | `(0.85, 0.0, 1.0, 1.0)`      | Sharp acceleration | Mascot arc landing |
| sine.inOut              | `(0.445, 0.05, 0.55, 0.95)`  | Organic, breathing | Background drift |
| spring `(0.16,1,0.3,1)` | `cubic-bezier(0.16,1,0.3,1)` | Fast start, spring settle | Feedback pill + product images entry |

---

## Dev Lab Keyboard Controls

| Key    | Action                                 |
|--------|----------------------------------------|
| `1–8`  | Jump directly to that state            |
| `←`    | Previous state                         |
| `→`    | Next state                             |
| `Space`| Replay current state                   |
| `R`    | Restart from State 1                   |
| `D`    | Toggle state inspector overlay         |
| `↓/↑`  | Cycle focus (State 8 only)             |
| `Enter`| Activate focused element               |

---

## Files

| File                        | Purpose                                         |
|-----------------------------|-------------------------------------------------|
| `src/config/l0T1Config.ts`  | All timing constants — single source of truth   |
| `src/L0T1Lab.tsx`           | Full motion lab implementation                   |
| `src/L0T1App.tsx`           | Route wrapper                                    |
| `L0_T1_MOTION_SPEC.md`      | This document                                   |
| `L0_T1_ANDROID_MAPPING.md`  | Android Jetpack Compose implementation guide     |

**Production files not modified by this lab:**
- `src/animations/l0Timeline.ts`
- `src/components/L0/CinematicL0.tsx`
- All warm/cold profile routes
- All onboarding screens
