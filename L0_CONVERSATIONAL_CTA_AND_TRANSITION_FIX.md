# L0 Conversational CTA + Transition Fix

## Files changed

| File | Change |
|------|--------|
| `src/logic/ctaGenerator.ts` | New — `getConversationalCTA(item)` |
| `src/components/L0/CinematicL0.tsx` | CTA generator wired; typing removed; fade-in; center agent fixed; flicker fix |
| `src/animations/l0Timeline.ts` | `killL0Timeline` no longer calls `gsap.killTweensOf('*')` |

---

## CTA generation system

**File:** `src/logic/ctaGenerator.ts`

`getConversationalCTA(item: FeedItem): string`

- 10 category pools, 5–6 options each
- Deterministic index via `id` character hash — same item always gets same CTA
- Falls back to a generic pool if category is unmapped

Examples by category:
- food → "Show me what makes this special" / "Take me to the recipe"
- travel → "Take me there" / "Show me where this leads"
- fashion → "Show me the full look" / "Help me explore this style"
- wellness → "Take me through the ritual"
- entertainment → "Show me something like this"

---

## CTA animation — no more typewriter

**Before:** TypewriterText inside the CTA label → mechanical char-by-char expansion.

**After:** CTA label fades in with `opacity: 0→1` + subtle `translateX(-6px→0)` over `0.5s cubic-bezier(0.22,1,0.36,1)`. The mascot slot's `margin-right` transitions smoothly at `0.3s ease`. The pill expands naturally as the label appears.

`ctaTypingDuration` is set to `0` so the FLIP fires immediately and the beam activates right after.

---

## Flicker fix

**Root cause:** `gsap.killTweensOf('*')` on card change wiped ALL GSAP state globally, including the new card's initial hidden state, causing a single-frame flash of the large title.

**Fix:** `killL0Timeline` now accepts `refs?: HTMLElement[]` and only kills tweens on those specific elements. The global `gsap.killTweensOf('*')` is removed.

---

## Center-aligned agent structure

**Before:** Mascot was inside the reasoning row flex container — it moved with the text.

**After:** For `alignment === 'center'`, the mascot renders as a standalone centered block between the title and the reasoning paragraph. It has its own `ref={mascotFloatRef}` wrapper so the FLIP still works correctly.

```
Title (large → shrinks)
          ↓
    [Mascot — centered, fixed]
          ↓
  Reasoning text (fades in, types)
          ↓
    [CTA pill]
```

For left/right: mascot remains inline with the reasoning (unchanged).

---

## Spacing transition

The center mascot wrapper collapses to `width: 0, height: 0` via the existing `mascotGone` flag after the FLIP — same as left/right. The reasoning row then reflows upward naturally via flexbox, no abrupt layout jump.
