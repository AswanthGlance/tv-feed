# L0 Center Agent Gap Collapse Fix

## Cause

In the center template, the mascot was rendered as a standalone div with a fixed
`marginBottom`. When `mascotGone` fired (after the FLIP into the CTA), React's
`mascotGone` flag was only used by the left/right inline path to shrink
`width`/`height` to 0. The center wrapper had no collapse logic — its full
height + margin remained, leaving a visible gap where the mascot used to be.

## Fix

**File:** `src/components/L0/CinematicL0.tsx`

1. Added `mascotSpacerRef` — a new ref on the outer wrapper div that holds both
   the `marginBottom` and the `mascotFloatRef` inner div.

2. Added a `useEffect` that watches `[mascotGone, alignment]`. When `mascotGone`
   becomes `true` and `alignment === 'center'`:
   - Measures the spacer's current rendered height with `offsetHeight`
   - GSAP animates `height` from current → 0 and `marginBottom` → 0
   - Duration: `0.65s`, ease: `power2.inOut` — smooth, not abrupt
   - On complete: sets `overflow: hidden` to clean up

## Animation sequence

```
1. Mascot finishes reasoning
2. FLIP arc: mascot flies into CTA slot
3. mascotGone fires
4. useEffect detects mascotGone + center alignment
5. GSAP collapses spacer height + margin over 0.65s
6. Reasoning paragraph floats up naturally (flexbox reflow)
7. Title / reasoning / CTA form a tight centered stack
8. CTA beam activates
```

## Files changed

| File | Change |
|------|--------|
| `src/components/L0/CinematicL0.tsx` | `mascotSpacerRef` added; `useEffect` collapses spacer on mascotGone; center mascot wrapped in two-div structure |
