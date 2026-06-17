# L0 Animation Lab — Option B Update

Route unchanged: `/l0_experiment`

---

## Changes made

### Mode A — label only
- `"Current Cursor"` → `"Current Typing"`
- No behavioral changes

---

### Mode B — full replacement: Cinematic Reveal

**Removed:** Agent as Cursor (mascot following text position)

**New behavior:**
- All characters exist in DOM from the start, initially `opacity: 0, filter: blur(12px)`
- GSAP timeline staggers each character's resolve: `blur(12px) → blur(0), opacity 0 → 0.72`
- No cursor. No mascot. No typing mechanics.
- Total sentence resolve time: ~2600ms
- Per-character duration: 0.75s with `power2.out` easing — organic, not mechanical
- Characters are staggered evenly across the total window so the sentence reads as it comes into focus, not all-at-once

**CTA sequence** (same as other modes):
- After timeline completes → 800ms pause → CTA slides up → mascot enters pill

**Files changed:** `src/L0AnimationLab/ModeB.tsx` (full rewrite)

---

### Mode C — Agent Reveals Thought (line-by-line fix + arc movement)

**Issues fixed:**

1. **Line 2 blurred chars visible while agent reveals Line 1**
   - Root: blurred chars were made visible for all lines at once
   - Fix: `beginReveal()` now only shows the active line's chars as blurred. Lines ahead stay `opacity: 0` until the mascot arrives at their start position.

2. **Mascot teleported between lines (snapped/jumped)**
   - Fix: `arcTo(tx, ty, onArrived)` function added — uses a GSAP keyframe with a calculated mid-point that arcs upward between the line end and line start. Two steps: `power1.in` to midpoint, `power2.out` to destination. Duration: ~440ms total.

3. **Mascot entrance**
   - First line: mascot fades in from `opacity: 0, scale: 0.7` to `opacity: 1, scale: 1` over 300ms before sweeping begins.

4. **Mascot exit**
   - Last line complete: mascot fades out `opacity: 0, scale: 0.7` over 350ms before `setMascotVisible(false)`.

**Sequence (new):**
```
mascot fades in at Line 1 start
→ sweeps Line 1 (blur→sharp per char)
→ Line 1 snaps fully sharp
→ 260ms pause
→ mascot arcs (curved GSAP path) to Line 2 start
→ Line 2 chars become blurred-visible on arrival
→ sweeps Line 2
→ Line 2 snaps fully sharp
→ mascot fades out
→ 800ms pause → CTA
```

**Files changed:** `src/L0AnimationLab/ModeC.tsx` (full rewrite)

---

### Lab page footer
Updated descriptions to match new mode names and behaviors.

**File changed:** `src/L0AnimationLab/L0AnimationLabPage.tsx`

---

## Evaluation frame

| | A | B | C |
|---|---|---|---|
| Feels like ChatGPT? | Yes — this is the baseline | No — no insertion mechanic | No — agent as actor, not printer |
| Most readable? | Highest — follows human reading rhythm | High — resolves left to right | Medium — requires following the agent |
| Most premium? | Low | High — fashion/editorial quality | Highest — cinematic, agentic |
| Most agentic? | Low | None — purely typographic | Highest |
