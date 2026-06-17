# T2 Agentic Spatial Narration Fix

## Files Changed

| File | Change |
|------|--------|
| `src/components/T2/T2FashionStory.tsx` | Full rewrite — spatial narration, agent movement, glassmorphic bubble |

---

## Two Narration Modes

### A. Ambient (open + finale beats)

Same as before: narrator text sits centred near the bottom, Playfair Display, large, atmospheric. Agent stays in a fixed corner position.

### B. Spatial Bubble (dress, bag, shoes beats)

A glassmorphic bubble appears near the highlighted object in the scene. The agent moves toward that area of the frame. Narration lines are served one at a time inside the bubble via the same `CharReveal` component.

---

## Agent Movement

The mascot `<div>` is now positioned with inline `left`/`top` CSS properties. GSAP tweens these properties directly, creating a smooth curved path between positions as the story advances.

```ts
const AGENT_POS = {
  default: { left: '5%',  top: '77%' },   // genesis + ambient beats
  dress:   { left: '26%', top: '22%' },   // upper frame, near dress/shoulder
  bag:     { left: '56%', top: '46%' },   // mid-right, near carried bag
  shoes:   { left: '36%', top: '70%' },   // lower-centre, near sandals
  finale:  { left: '45%', top: '65%' },   // near-centre, settling
};
```

`moveAgent(posKey, duration = 1.4)` uses `gsap.to` with `power2.inOut`. The bubble appears ~1.2 s after the move starts so it reads as the agent "arriving" before speaking.

---

## Spatial Bubble Design

### Glassmorphic treatment

```css
background:          rgba(255, 255, 255, 0.08);
backdrop-filter:     blur(24px) saturate(1.6);
border:              1px solid rgba(255, 255, 255, 0.18);
border-radius:       16px;
box-shadow:          0 8px 40px rgba(0,0,0,0.50),
                     0 2px 12px rgba(0,0,0,0.30),
                     inset 0 1px 0 rgba(255,255,255,0.10);
```

### Label row

Category tag sits above the text in UPPERCASE with wide letter-spacing, muted white, separated by a hairline rule.

| Beat  | Label       |
|-------|-------------|
| Dress | DRESS       |
| Bag   | ACCESSORY   |
| Shoes | FOOTWEAR    |

### Typography inside bubble

Playfair Display, weight 300, `clamp(13px, 1.4vw, 24px)`. Same char-reveal animation (32 ms/char, blur(8px)→blur(0)) as ambient narration.

### Entrance animation

`gsap.fromTo` with `opacity:0, scale:0.88, y:10, blur(10px)` → resolved over `0.65s` `back.out(1.4)`. Feels like it pops into place from the scene, not from a UI layer.

---

## Bubble Positions

Tunable percentages on the 1920×1080 stage:

```ts
const BUBBLE_POS = {
  dress:  { left: '33%', top: '20%' },
  bag:    { left: '37%', top: '45%' },
  shoes:  { left: '43%', top: '68%' },
};
```

Adjust these to match actual object positions in the source images.

---

## Beat Structure

| Beat    | Mode    | Agent Pos | Bubble Label | Copy summary |
|---------|---------|-----------|--------------|--------------|
| open    | ambient | default   | —            | "Some looks belong to a place…" (3 lines) |
| dress   | bubble  | dress     | DRESS        | V-neck, flowing white silhouette (3 lines) |
| bag     | bubble  | bag       | ACCESSORY    | Structured leather, weight without noise (3 lines) |
| shoes   | bubble  | shoes     | FOOTWEAR     | Minimal sandals, they let it breathe (3 lines) |
| finale  | ambient | finale    | —            | "The best looks rarely shout…" (2 lines) |

---

## Timing

| Phase | Duration |
|-------|---------|
| Genesis | ~5.8s |
| open (ambient, 3 lines) | ~14s |
| dress (bubble, 3 lines) | ~13s |
| bag (bubble, 3 lines)   | ~15s |
| shoes (bubble, 3 lines) | ~11s |
| finale (ambient, 2 lines) | ~12s |
| CTA reveal | ~1s |
| **Total** | **~72s** |

---

## Autoplay

Fully automatic. No input required. `runBubbleLines` chains lines the same way `runLines` does — each line has a `holdMs`, fires a dissolve timer, then chains to the next. When the last line completes the bubble dismisses and `advanceBeat(idx + 1)` fires after 700 ms.

---

## Keyboard Controls

Unchanged.

| Key | Action |
|-----|--------|
| `→` / `Enter` | Skip to next beat |
| `←` | Previous beat |
| `R` | Restart from genesis |
| `Escape` | Exit |

On skip, `setBubbleVisible(false)` is called immediately alongside `setNarratorVisible(false)`.
