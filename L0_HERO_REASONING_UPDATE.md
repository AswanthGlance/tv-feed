# L0 Hero Reasoning Update

## Summary

The title is no longer the hero. The agent reasoning is now the primary storytelling moment. Tag and title become small contextual metadata anchored to the top-left on all three templates.

---

## What Changed

### Title + Tag: Contextual Metadata

**Before:** Tag and title were the opening hero — large font, dramatic word-mask reveal animation, followed by a slow scale-down.

**After:** Tag and title are placed in an absolute top-left block, always at a small fixed size (`clamp(18px, 2.2vw, 34px)` for title, `clamp(8px, 0.8vw, 11px)` for tag label). They fade in softly together with no scale animation. This applies identically to all three templates.

The word-mask reveal and title shrink animation have been removed entirely.

---

### Hero Agent State

The mascot enters at a larger hero size (`80px`) rather than its previous `62px` float size. It is rendered at full scale (`scale: 1.0`) during the reasoning phase. This makes the agent feel prominent and present during the storytelling moment.

---

### Hero Reasoning State

The reasoning text is rendered at a larger font size (`clamp(18px, 2.2vw, 32px)`) during the hero phase, up from the previous `clamp(13px, 1.35vw, 20px)`. GSAP sets `scale: 1.0` at entrance, making the larger font the dominant visual element while the agent speaks.

The character blur reveal (approved animation language) is preserved — letters appear one at a time with a blur-to-sharp transition, highlights in bold/glow.

---

### Reasoning Shrink Transition

After reasoning completes typing, GSAP smoothly scales the reasoning element down to `0.72` of its hero size (visually approximating the old final font size) over `0.9s` with `power2.inOut`. No layout jump, no duplicate elements, no font-size swap — one element, one GSAP tween.

Simultaneously, the mascot scales from hero scale (`1.0`) to final scale (`0.65`, which renders it at ~52px) over `0.85s` with `power2.inOut`.

The layout settles, then the mascot moves into the CTA as before.

---

### Template-Specific Alignment

All three templates share the same top-left metadata block. The content column (agent + reasoning + CTA) follows template-specific alignment:

| Template | Agent + Reasoning | CTA | Products |
|----------|------------------|-----|----------|
| Left     | Left-aligned, inline mascot left of reasoning | Left-anchored | Right side |
| Center   | Centered, mascot above reasoning | Center-anchored | Right side |
| Right    | Right-aligned, inline mascot right of reasoning (row-reverse) | Right-anchored | None |

---

### Animation Sequence (New)

```
0.0s   BG + parallax zoom begins
0.4s   Overlay fades in
0.9s   Header slides in (first card only)
1.1s   Tag fades in top-left (soft, 0.55s)
1.2s   Title fades in top-left (soft, 0.65s)
1.35s  Mascot floats in at hero size
1.73s  Reasoning fades in at hero size; typing starts
       [typing runs at 38ms/char]
+0.25s after typing done: hero shrink begins
       → Reasoning scales to 0.72 over 0.9s
       → Mascot scales to 0.65 over 0.85s
+0.85s CTA pill appears; mascot FLIP arc to CTA
       → CTA label types in; beam activates
+0.62s Product cards spread in from right (left + center only)
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/animations/l0Timeline.ts` | Removed: tag y-entrance, title word-mask reveal (steps 5–6), title shrink + tag follow (step 6). Added: hero mascot scale param, hero reasoning scale param, `heroShrink` label that scales both mascot and reasoning to final size before CTA reveal. Updated `L0TimelineOpts` interface. |
| `src/components/L0/CinematicL0.tsx` | Removed: `splitToWords()` helper, `useLayoutEffect` for font measurement, title size refs, title large/small font constants. Added: absolute top-left tag+title block, `MASCOT_HERO_SIZE`/`MASCOT_FINAL_SIZE`/`MASCOT_CTA_SIZE` constants, `REASONING_HERO_FS`/`REASONING_HERO_SCALE`/`REASONING_FINAL_SCALE` constants. Updated `buildL0Timeline` call to pass new scale params. |

## Not Changed

- Reasoning copy and CTA copy
- Mascot asset (`/public/mascot.riv`)
- Beam effect (`borderBeam`)
- Product card design and animation
- Glance header (logo, weather, date, time)
- Character blur reveal animation language
- CTA pill design and mascot-to-CTA FLIP arc
