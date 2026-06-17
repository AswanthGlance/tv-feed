# T2 Image Alignment & Autoplay Fix

## Files Changed

| File | Change |
|------|--------|
| `src/components/T2/T2FashionStory.tsx` | Full rewrite — image fix, autoplay, L0 design language, alive mascot |
| `public/images/t2/t2-base.png` | Added — correct PNG from T2_template/base-desert.png |
| `public/images/t2/t2-dress.png` | Added — correct PNG from T2_template/dress-highlight.png |
| `public/images/t2/t2-bag.png` | Added — correct PNG from T2_template/bag-highlight.png |
| `public/images/t2/t2-shoes.png` | Added — correct PNG from T2_template/shoes-highlight.png |

---

## 1. Image Source Fix

**Before:** Component referenced `.jpg` paths which held placeholder fashion feed images.

**After:** Component now references `.png` paths (`t2-base.png`, `t2-dress.png`, `t2-bag.png`, `t2-shoes.png`) — exact copies of the files provided in `T2_template/`.

```
IMG_BASE  = '/images/t2/t2-base.png'   ← base-desert.png
IMG_DRESS = '/images/t2/t2-dress.png'  ← dress-highlight.png
IMG_BAG   = '/images/t2/t2-bag.png'    ← bag-highlight.png
IMG_SHOES = '/images/t2/t2-shoes.png'  ← shoes-highlight.png
```

The `.jpg` placeholder files remain in the folder (unused) and can be deleted.

---

## 2. Autoplay Implementation

**Before:** Story required keyboard input to advance. Nothing happened without pressing a key.

**After:** Story auto-advances completely without user input.

### How it works

Every narration line carries its own `holdMs` value. After the blur-to-sharp reveal, a timer fires to dissolve the text, then the next line begins. After all lines in a beat complete, a 700ms settle pause fires before the next beat starts.

```
beat lines → showNarratorLine(text, holdMs, onDone)
              ↓ holds for holdMs
              dissolveText → 300ms gap → next line
              ↓ last line done
              700ms settle → advanceBeat(idx + 1)
              ↓ all beats done
              phase → 'cta'
```

Timers are tracked in `timersRef.current[]` and cancelled on skip. `isSkippingRef` prevents timer callbacks from firing after a skip interruption.

### Pacing (per line)

| Beat | Line | Hold |
|------|------|------|
| open | "Some looks belong to a place." | 3400ms |
| open | "This one feels like both." | 4000ms |
| dress | "The landscape is doing most of the talking." | 3800ms |
| dress | "The dress knows when to stay quiet." | 4200ms |
| bag | "With it, the whole silhouette feels intentional." | 4200ms |
| shoes | "And these might be the easiest detail to miss." | 3800ms |
| finale | "And that's usually what makes them memorable." | 4800ms |

Short punchy lines: 2800–3400ms. Longer editorial lines: 3800–4800ms.

---

## 3. Mascot Behavior Improvements

**Before:** Mascot was static — `thinking` mode on genesis, then fixed mode throughout.

**After:** Mascot feels alive across the entire story.

### Mode schedule

| Moment | Mode | Behaviour |
|--------|------|-----------|
| Genesis start | `thinking` | Composing — active, alert |
| Genesis settle (4.4s) | `idle` | Relaxed after image forms |
| Each new beat starts | `looking` flash (1.2s) | Notices the shift — looks at new detail |
| During beat narration | Beat's `mascotMode` | `thinking` for detail beats, `idle` for finale |
| CTA phase | `idle` | Calm — story told |

### `pulseMascot()` function

On every `advanceBeat()` call:
1. Force `looking` immediately — mascot shifts gaze
2. After 1200ms, settle into the beat's assigned mode

This creates a natural "noticing something" micro-reaction between beats without being hyperactive.

### Beat mascot modes

| Beat | Mode | Rationale |
|------|------|-----------|
| `open` | `looking` | Introducing the scene |
| `dress` | `thinking` | Considering the fabric, construction |
| `bag` | `thinking` | Evaluating structural contribution |
| `shoes` | `thinking` | Analysing the subtle detail |
| `finale` | `idle` | Settled — reflection, not analysis |

---

## 4. Glance Design Language Alignment

Every visual property now mirrors `CinematicL0.tsx`:

| Element | CinematicL0 | T2 (before) | T2 (after) |
|---------|-------------|-------------|------------|
| Header padding | `clamp(20px, 4.5vw, 88px)` | `clamp(20px, 4.5vw, 88px)` ✓ | Same ✓ |
| Logo height | `clamp(26px, 3.2vh, 48px)` | `3.2vh` (no clamp) | `clamp(26px, 3.2vh, 48px)` ✓ |
| Header font size | `clamp(10px, 1.1vw, 18px)` | `clamp(12px, 1.1vw, 18px)` | `clamp(10px, 1.1vw, 18px)` ✓ |
| Time color | `#ffffff` | `rgba(255,255,255,1)` ✓ | `#fff` ✓ |
| Date/weather color | `rgba(255,255,255,0.45)` | Same ✓ | Same ✓ |
| Bottom scrim | `rgba(0,0,0,0.90) → transparent` | `rgba(4,3,2,0.75)` (lighter) | `rgba(0,0,0,0.90)` ✓ |
| Top scrim | `rgba(0,0,0,0.62) → transparent` | `rgba(4,3,2,0.4)` (lighter) | `rgba(0,0,0,0.62)` ✓ |
| Side scrim | Left-side gradient | None | Added (left-side) ✓ |
| Tag/label border | `rgba(255,255,255,0.16)` | `rgba(255,255,255,0.18)` | `rgba(255,255,255,0.16)` ✓ |
| Tag/label bg | `rgba(255,255,255,0.10)` | `rgba(255,255,255,0.06)` | `rgba(255,255,255,0.08)` ✓ |
| Label font | Plus Jakarta Sans, 700, uppercase | Same ✓ | Same ✓ |
| Mascot size | 62px inline | 72px centered | 72px bottom-left ✓ |
| Image position | `center 32%` | `center top` | `center 18%` (suits portrait fashion) |

---

## 5. Keyboard / Remote Controls

Unchanged — keyboard is **optional**. Story completes without any input.

| Key | Action |
|-----|--------|
| `→` / `Enter` | Skip to next beat (or skip genesis) |
| `←` | Go back one beat |
| `R` | Restart from genesis |
| `Escape` | Exit to main app |

---

## 6. Total Story Duration (autoplay)

| Phase | Duration |
|-------|---------|
| Genesis | ~5.85s |
| Beat: open (3 lines) | ~14s |
| Beat: dress (4 lines) | ~18s |
| Beat: bag (4 lines) | ~18s |
| Beat: shoes (4 lines) | ~17s |
| Beat: finale (4 lines) | ~20s |
| CTA reveal | ~1s |
| **Total** | **~94s** |

Comfortably within the 40–60s skeleton, extended naturally by pacing. Skippable at any point.
