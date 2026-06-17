# T2 Fashion Story Template

Experimental agentic fashion story prototype. Completely isolated from the main L0 feed.

---

## Route

Open the dev server (`npm run dev`) then navigate to:

```
http://localhost:5173?t2          ← query param (recommended)
http://localhost:5173#t2-fashion  ← hash route
```

No existing screen, feed, onboarding, or preference card is affected.

---

## Files Added

| File | Purpose |
|------|---------|
| `src/components/T2/T2FashionStory.tsx` | Main story component — all logic, GSAP, rendering |
| `src/T2FashionApp.tsx` | Thin wrapper; passes `onExit` callback |
| `public/images/t2/t2-base.jpg` | Base look image (drop in final asset) |
| `public/images/t2/t2-dress.jpg` | Dress highlight image |
| `public/images/t2/t2-bag.jpg` | Bag highlight image |
| `public/images/t2/t2-shoes.jpg` | Shoes highlight image |
| `T2_FASHION_STORY_TEMPLATE.md` | This file |

### Files Modified

| File | Change |
|------|--------|
| `src/main.tsx` | Added `isT2Fashion` detection + `<T2FashionApp />` branch |

---

## Drop In Final Images

Replace the placeholder images in `public/images/t2/` with the 4 provided assets:

```
t2-base.jpg   → base desert image (no highlight ring)
t2-dress.jpg  → dress highlighted (white circle on dress)
t2-bag.jpg    → bag highlighted (white circle on bag)
t2-shoes.jpg  → shoes highlighted (white circle on shoes)
```

Exact filenames matter — the component references these paths directly.

---

## Generation Effect

1. **Dark ambient background** — `#0a0806` base, subtle warm radial gradient
2. **Header fades in** — logo + time/date/weather (reuses same layout as L0)
3. **Mascot appears** — `back.out` spring entrance, `thinking` mode
4. **Agent text resolves** — `"I'm putting together a look."` — blur-to-sharp animation
5. **Palette fragments float in** — 5 color swatches with labels (warm light, sand, ivory, leather, gold dust)
6. **Image assembles** — `filter: blur(40px) brightness(0.3) saturate(0.2)` → `blur(0) brightness(1) saturate(1)` over 2.8s with scale 1.12→1.0. Feels like the scene is rendering.
7. **Fragments drift away** — opacity → 0, scale up, y-translate up
8. **Crossfade to story** — genesis overlay fades, story phase begins

Total genesis duration: ~6 seconds.

---

## Story Beats (GSAP Timeline)

| Beat | Image | Lines | Label |
|------|-------|-------|-------|
| `open` | t2-base | "Some looks belong to a place..." (3 lines) | — |
| `dress` | t2-dress | "The white keeps everything effortless..." (4 lines) | White Linen Dress |
| `bag` | t2-bag | "The bag is doing something different..." (4 lines) | Leather Tote |
| `shoes` | t2-shoes | "And these might be the easiest detail to miss..." (4 lines) | Minimal Leather Sandals |
| `finale` | t2-base | "The best looks rarely shout..." (4 lines) | — |

### Image Transitions

Each beat transition uses GSAP crossfade:
- `bgNextRef`: `opacity: 0, scale: 1.04` → `opacity: 1, scale: 1.0` over 1.8s (`power2.inOut`)
- `bgCurrentRef`: `scale: 1.03, opacity: 0` over 1.8s simultaneously

### Narrator Text Animation

Each line:
- `filter: blur(10px), opacity: 0, y: 6` → `blur(0), opacity: 1, y: 0` over 0.9s (`power2.out`)
- Holds for `3000ms` (short lines) or `4200ms` (longer lines)
- Exit: `blur(8px), opacity: 0, y: -4` over 0.4s (`power2.in`)
- Font: Playfair Display, 2.8vw, weight 300

### Product Labels

Appear bottom-left, frosted pill, uppercase letter-spacing:
- Entrance: `opacity: 0, x: -16, blur(6px)` → resolved over 0.8s
- Auto-dismisses after 3s

---

## Agent Behavior

| Phase | Mode | Behavior |
|-------|------|---------|
| Genesis | `thinking` | Rive "Loading" state — alert, composing |
| After genesis | `idle` → `looking` | Switches to looking as each beat starts |
| CTA phase | `idle` | Calm, breathing |

Agent uses existing `AgentMascot` component with no new Rive states.

---

## CTA

Uses existing `AgentCTA` component:

```
"Show me more looks like this"
```

- `showMascotInside={true}` — mascot appears inside the pill
- `align="center"`
- `animStep={5}` — always visible when rendered
- Full BorderBeam glow effect

---

## Keyboard Controls

| Key | Action |
|-----|--------|
| `→` or `Enter` | Skip to next beat / skip genesis |
| `←` | Go to previous beat |
| `R` | Restart story from genesis |
| `Escape` | Exit (calls `onExit`, reloads to main app) |

No visible key guide shown to user.

---

## Target Duration

~50–60 seconds at natural pace. Each narration line has full breathing room. Skippable via keyboard/remote.

---

## Known Limitations

- Images are placeholder fashion images until the 4 final assets are dropped into `public/images/t2/`
- Product labels are decorative text only — no shopping UI or deeplink
- No TV remote D-pad focus handling (future: add `onKeyDown` with direction mapping)
- The `onExit` callback does a full page reload — in a real integration this would call a navigation callback instead
- Genesis fragments are CSS positioned centered-bottom; exact positions could be tuned per brand guideline
