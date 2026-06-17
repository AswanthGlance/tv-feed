# T2 L0 Preview Design Language Pass

## Files Changed

| File | Change |
|------|--------|
| `src/components/T2/T2FashionStory.tsx` | Full rewrite — L0 design language, new narration, char-reveal text |

---

## How `l0-preview.html` Was Used

`l0-preview.html` boots into `L0PreviewApp`, which renders `L0Glance → CinematicL0`. Every visual value in T2 was reconciled against `CinematicL0.tsx` and `l0Timeline.ts` — the two source-of-truth files for the Glance design system.

---

## Visual Language Changes

### Header

| Property | Before | After (matches CinematicL0) |
|----------|--------|------------------------------|
| Top offset | `28px` fixed | `clamp(16px, 3vh, 48px)` |
| Left/right padding | `clamp(20px,4.5vw,88px)` ✓ | Same ✓ |
| Logo height | `clamp(26px,3.2vh,48px)` ✓ | Same, added `objectPosition: left center` ✓ |
| Font size | `clamp(12px,1.1vw,18px)` | `clamp(10px,1.1vw,18px)` ✓ |
| Font family | `system-ui` ✓ | Same ✓ |
| Weather/date color | `rgba(255,255,255,0.45)` ✓ | Same ✓, extracted to `.t2-hdr-dim` |
| Time color | `#ffffff` ✓ | `#fff` ✓, extracted to `.t2-hdr-time` |
| `tabular-nums` | ✓ | `font-variant-numeric: tabular-nums` ✓ |

### Scrim

| Layer | Before | After (matches CinematicL0 overlay) |
|-------|--------|--------------------------------------|
| Bottom | `rgba(4,3,2,0.75) → transparent` | `rgba(0,0,0,0.90) 0% → rgba(0,0,0,0.50) 28% → 0.06 55% → transparent 70%` ✓ |
| Top | `rgba(4,3,2,0.4) → transparent` | `rgba(0,0,0,0.62) 0% → rgba(0,0,0,0.22) 18% → transparent 38%` ✓ |
| Side | None | `rgba(0,0,0,0.42) → transparent 62%` (left side) ✓ |

### Typography

| Element | Before | After |
|---------|--------|-------|
| Narrator font | Playfair Display, 2.8vw, weight 300 | Playfair Display, `clamp(26px, 3.0vw, 56px)`, weight 300 — clamped for TV |
| Narrator color | `rgba(255,255,255,0.92)` | `rgba(255,255,255,0.93)` |
| Narrator shadow | Single shadow | Double: `rgba(0,0,0,0.65)` depth + `rgba(0,0,0,0.30)` ambient glow |
| Narrator max-width | `clamp(540px,72vw,1060px)` | `clamp(520px,70vw,1020px)` (tighter for readability) |
| Genesis speech | `clamp(16px,1.6vw,26px)`, italic | `clamp(15px,1.35vw,22px)`, italic, Plus Jakarta Sans |
| Product label | `clamp(13px,1.2vw,20px)` | `clamp(10px,0.95vw,14px)` — matches L0 tag scale |
| Label letter-spacing | `0.08em` | `0.11em` — matches L0 tag `0.11em` |

### Background / Image

| Property | Before | After |
|----------|--------|-------|
| Stage bg | `#0a0806` | `#08060a` — matches CinematicL0 body |
| Image `object-position` | `center top` | `center 18%` — keeps subject centered for portrait fashion |
| Crossfade duration | `1.9s` | `1.8s` — matches CinematicL0 BG step (1.0s fade) |
| Crossfade scale | `1.04 → 1.0` | Same ✓ |

### Mascot

| Property | Before | After |
|----------|--------|-------|
| Size | 72px | 72px ✓ |
| Position | `bottom: clamp(120px,14vh,180px)` | `bottom: clamp(130px,16vh,200px)` — clears label chip |
| Left gutter | `clamp(20px,4.5vw,88px)` ✓ | Same ✓ — aligns with header logo |
| Mode schedule | `thinking → idle → pulseLooking` | Same logic, tuned timing |
| `pulseMascot` flash | 1200ms | 1100ms |

### Product Label Chip

| Property | Before | After |
|----------|--------|-------|
| Background | `rgba(255,255,255,0.08)` | `rgba(255,255,255,0.10)` — matches L0 tag bg |
| Border | `rgba(255,255,255,0.16)` ✓ | Same ✓ |
| Backdrop blur | `blur(10px)` ✓ | Same ✓ |
| Border radius | `40px` | `999px` — matches L0 tag pill |

### CTA

Uses existing `AgentCTA` component unchanged — it already carries the approved:
- `BorderBeam` with colorful variant
- Purple glow box-shadow `rgba(112,71,226,…)`
- White pill `rgba(255,255,255,0.95)`
- Mascot inside pill
- Scale(1.04) on focus

---

## Narration Text (Updated to Brief Script)

### Genesis (3 lines)
```
"I'm putting together a look."        2800ms hold
"Not something loud."                  2600ms hold
"Something that feels effortless."     3200ms hold
```

### Beat: open (3 lines)
```
"Some looks belong to a place."        3200ms
"Some looks belong to a feeling."      3200ms
"This one feels like both."            4000ms
```

### Beat: dress (3 lines)
```
"The white dress is where the look begins."  3600ms
"It keeps everything light."                 2800ms
"Nothing feels overworked."                  3400ms
```

### Beat: bag (3 lines)
```
"Now the bag changes the mood."                              3200ms
"It adds structure without stealing attention."              3800ms
"That balance is what makes the silhouette feel intentional." 4600ms
```

### Beat: shoes (3 lines)
```
"And the sandals keep it grounded."    3200ms
"They do not interrupt the look."      3000ms
"They let the whole outfit breathe."   3800ms
```

### Beat: finale (2 lines)
```
"The best looks rarely shout."                            3800ms
"They simply feel right the moment you see them."         5000ms
```

### CTA
```
"Show me more looks like this"
```

---

## Text Animation

Replaced GSAP blur-resolve on a single `<div>` with a React `CharReveal` component. Each character:
- Starts `opacity: 0, filter: blur(8px)`
- Resolves to `opacity: 1, filter: blur(0px)` with `transition: 0.14s ease`
- Staggered at **32ms per character** — matches `REASONING_SPEED = 38` in CinematicL0 (slightly faster for short poetic lines)
- No cursor, no typewriter artifact

The narrator wrapper itself GSAP-animates in: `opacity:0, y:10, blur(10px)` → resolved on each new line.

---

## Autoplay Timing

Total wall-clock (autoplay, no skips): **~80 seconds**

| Phase | Duration |
|-------|---------|
| Genesis | ~5.8s |
| Beat: open | ~14s |
| Beat: dress | ~13s |
| Beat: bag | ~16s |
| Beat: shoes | ~13s |
| Beat: finale | ~12s |
| CTA entrance | ~1s |

---

## Keyboard Controls (unchanged)

| Key | Action |
|-----|--------|
| `→` / `Enter` | Skip to next beat |
| `←` | Previous beat |
| `R` | Restart from genesis |
| `Escape` | Exit |
