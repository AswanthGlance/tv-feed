# Title Reveal Animation Notes — Likely Story Style

## Reference
`https://likely-story.co.uk/` — editorial typographic reveals where each word rises through a clipping boundary.

---

## Animation Approach

### The Technique: Clip-Mask Rise

The classic Likely Story / kinetic-typography / Apple editorial text reveal uses a two-layer structure:

```
<span class="word-mask"  style="overflow:hidden; display:inline-block">   ← clip boundary
  <span class="word-inner" style="display:inline-block">                  ← animated child
    Eatly
  </span>
</span>
```

The **mask** is `overflow: hidden` — it acts as a slot. The **inner** span starts at `yPercent: 105` (just below the clip edge) and rises to `yPercent: 0`. Because the mask clips everything outside, the word appears to "print up" through the slot — precise, architectural, not a generic fade.

Key differences from a simple fade-in:
- No opacity change on the words themselves (always 1)
- The clip creates a sharp, defined reveal boundary
- Result: words feel weighted, editorial, intentional

### Additional polish layers
1. **Container blur** — the whole `<h1>` starts at `filter: blur(7px)` and clears to `blur(0)` over the stagger duration. Adds cinematic depth without affecting the word precision.
2. **Stagger** — 0.1s between each word. Words feel sequential, not simultaneous.
3. **Ease** — `power4.out`: very fast entry, long deceleration tail. Gives the "slamming into place" quality.
4. **Title shrink** — after reveal + read pause, React state switches `font-size` from `clamp(56px, 10.5vw, 148px)` to `clamp(26px, 3.8vw, 58px)`. CSS `transition: font-size 0.9s cubic-bezier(0.4,0,0.2,1)` interpolates it. Mascot appears after the shrink completes.

---

## Reusable Utility

**File:** `src/animations/titleReveal.ts`

### Functions

```ts
resetTitle(titleEl)
```
Sets all `.word-inner` spans to `yPercent: 105` and the container to `opacity: 0`. Call before timeline plays.

```ts
revealTitle(titleEl, tl, at, options?)
```
Appends to a GSAP timeline at position `at`:
- Container `opacity: 0→1` (instant)
- Container blur `7px → 0` (over full stagger duration)
- Each `.word-inner` rises from `yPercent: 105 → 0`

Options:
| Key | Default | Description |
|-----|---------|-------------|
| `staggerEach` | `0.10` | Seconds between words |
| `duration` | `0.72` | Per-word tween duration |
| `ease` | `'power4.out'` | Easing curve |
| `containerBlur` | `true` | Whether to animate container blur |

```ts
shrinkTitle(onShrink, tl, at)
```
Calls `onShrink` callback at timeline position `at`. Used to trigger React's font-size state switch.

### DOM structure constants
```ts
export const MASK_CLASSNAME  = 'word-mask';   // overflow:hidden wrapper
export const INNER_CLASSNAME = 'word-inner';  // animated child
```

---

## GSAP Timeline Integration

In `l0Timeline.ts`:

```ts
import { revealTitle, shrinkTitle, resetTitle } from './titleReveal';

// In initial setup:
resetTitle(titleEl);

// Reveal at 1.3s mark:
tl.addLabel('titleIn', 1.3);
revealTitle(titleEl, tl, 'titleIn', {
  staggerEach:   0.10,
  duration:      0.75,
  ease:          'power4.out',
  containerBlur: true,
});

// Shrink after read pause (3.1s after titleIn):
tl.addLabel('titleShrink', 'titleIn+=3.1');
shrinkTitle(opts.onTitleShrink, tl, 'titleShrink');
```

The title section of `l0Timeline.ts` is now ~6 lines instead of ~12. All animation parameters live in `titleReveal.ts`.

---

## How to Use for Other L0s

Any L0 card that uses the `CinematicL0` path gets this animation automatically. For standard layouts (`GlanceLayout.tsx`), use the same utility:

```tsx
// In the component: replace <h1>{item.title}</h1> with:
<h1 ref={titleRef}>
  {item.title.split(' ').map((word, i, arr) => (
    <span key={i} className="word-mask"
      style={{ display: 'inline-block', overflow: 'hidden', paddingBottom: '0.08em', marginRight: i < arr.length-1 ? '0.26em' : 0 }}>
      <span className="word-inner" style={{ display: 'inline-block' }}>{word}</span>
    </span>
  ))}
</h1>

// In the timeline:
resetTitle(titleRef.current);
revealTitle(titleRef.current, tl, 'titleIn');
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/animations/titleReveal.ts` | **New** — reusable utility with `resetTitle`, `revealTitle`, `shrinkTitle` |
| `src/animations/l0Timeline.ts` | Uses `revealTitle` + `resetTitle` instead of inline word-span code. Removed `wordSpans()` helper. |
| `src/components/L0/CinematicL0.tsx` | `splitToWords()` now generates `word-mask / word-inner` structure instead of plain `word-span`. Imported `BorderBeam` for real CTA beam. CSS conic vars removed (replaced by BorderBeam). |
| `src/components/dev/BeamButtonPOC.tsx` | Updated by user to use installed `border-beam` package — dark + white variants, sm/line/md sizes |

---

## Easing Reference

| Ease | Use case |
|------|----------|
| `power4.out` | Title word rise — fast entry, long premium tail |
| `power2.out` | Container blur clear — softer, doesn't race the words |
| `power3.out` | Most other elements (mascot, CTA, card) |
| `power3.inOut` | FLIP mascot movement — symmetric, controlled |
