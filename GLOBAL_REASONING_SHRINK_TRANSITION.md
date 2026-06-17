# GLOBAL_REASONING_SHRINK_TRANSITION

## Transition Sequence

```
Reasoning reveals (hero size)
↓
Reasoning completes typing
↓
1.0s pause (deliberate read time)
↓
Agent + reasoning shrink simultaneously (0.85–0.9s, power2.inOut)
↓
Agent looks toward CTA (0.65s after shrink)
↓
CTA pill slides in
↓
Mascot FLIP arc into CTA
↓
CTA text reveals
↓
Beam / glow activates
```

## Scale Values

| Element   | Hero scale | Final scale | Duration | Easing       | Origin          |
|-----------|-----------|-------------|----------|--------------|-----------------|
| Mascot    | 1.0       | 0.65        | 0.85s    | power2.inOut | alignment edge  |
| Reasoning | 1.0       | 0.88        | 0.9s     | power2.inOut | top of alignment edge |

Mascot hero size: 80px → final: 52px (scale = 52/80 = 0.65).  
Reasoning final scale: 0.88 (12% reduction).

## Spacing

Both the mascot and reasoning are GSAP-owned after `heroShrink`. No CSS transitions are set on those elements — GSAP drives `transform` exclusively to avoid conflicts.

The `mascotSpacerRef` (center layout only) collapses from its natural height to 0 over 0.65s (`power2.inOut`) after `onMascotGone` fires, reclaiming the vertical gap cleanly.

## Animation Rule

The `heroShrink` GSAP label fires both tweens at the same position:

```ts
tl.to(reasoning,   { scale: 0.88, duration: 0.9,  ease: 'power2.inOut' }, 'heroShrink');
tl.to(mascotFloat, { scale: 0.65, duration: 0.85, ease: 'power2.inOut' }, 'heroShrink');
```

They start simultaneously. The 0.05s difference in duration is imperceptible — both feel like one motion.

## Templates Updated

| Template       | File                                   | Status  |
|----------------|----------------------------------------|---------|
| warm_profile_1 | `src/components/L0/WarmProfile1CinematicL0.tsx` | Updated |

## Files Changed

**`src/components/L0/WarmProfile1CinematicL0.tsx`**
- `reasoningFinalScale` changed from `1.0` → `0.88` in `buildColdStartL0Timeline` call
- Removed `textShrinking` state, `setTextShrinking` calls, and CSS `transform`/`transition` overrides on both the center and left/right `reasoningRef` containers
- GSAP now exclusively owns the reasoning `transform` — no competing CSS transitions

**`src/animations/coldStartL0Timeline.ts`** — no changes (already animates `reasoningFinalScale` correctly at `heroShrink` label)

**`src/animations/l0Timeline.ts`** — no changes (same `heroShrink` structure, used by standard feed cards)

## Root Cause

`WarmProfile1CinematicL0` was passing `reasoningFinalScale: 1.0` to the timeline (a no-op tween), while simultaneously setting a React state `textShrinking` to drive a CSS `scale(0.88)` transition on the same element.

GSAP owns `transform` on elements it tweens. Its `scale(1.0)` tween at `heroShrink` silently overrode the CSS transition, so the reasoning never visibly shrunk — only the mascot did. The fix removes the CSS layer entirely and passes the correct scale to GSAP.
