# L0 Eatly at Dawn — Polish Notes

## Preview Route

**URL:** `http://localhost:5174/l0-preview.html`

- New file: `l0-preview.html` — same Vite entry as `app.html` but sets `window.__L0_PREVIEW__ = 'eatly-dawn'` before mount
- New file: `src/L0PreviewApp.tsx` — mounts `L0Glance` directly with the eatly-dawn item, skips all onboarding
- `src/main.tsx` — checks `window.__L0_PREVIEW__` and renders `L0PreviewApp` instead of `App`
- **Replay button** in top-right corner (↺) remounts with a new `key` so the full sequence reruns on click

---

## Title Jerk Fix

**Root cause:** The previous approach switched `display: flex → block` and `position: relative → absolute` at `animStep 4`. CSS cannot interpolate layout properties — the browser commits the new layout in one frame, causing a visible snap/jump.

**Fix:** Two-layer crossfade using `opacity` and `transform` only.

| Layer | What it does |
|-------|-------------|
| Layer A (centred) | `opacity: 1 → 0`, `transform: scale(1) → scale(0.62) translateY(-48px)` over 700ms |
| Layer B (bottom-left column) | `opacity: 0 → 1`, `transform: translateY(28px) → translateY(0)` over 800ms |

Both layers are `position: absolute` from the start. No layout property changes during animation. The 100ms crossfade overlap ensures continuous motion.

---

## Overlap Fix

**Root cause:** The centred title (Layer A) and the bottom-left content zone (Layer B) were both visible simultaneously without enough timing separation.

**Fix:** 
- `animStep 2` → Layer A appears (centred, full-screen)  
- `animStep 4` → Layer A starts fading out; Layer B fades in simultaneously  
- CT_TITLE_MOVE delayed to 3200ms (was 2900ms) giving 2300ms of read time
- Layer B is a single `flexDirection: column` stack: Title → [Mascot + Reasoning] → CTA
- `gap: 0` between items, controlled by explicit `marginBottom` using `clamp()` for viewport-relative spacing
- Title and reasoning can never overlap because they are sequential siblings in the same flex column

---

## Agent-to-CTA Fix

**Mascot appears:** `animStep 5` (4400ms after image loads), size 72, `mascot-pop` keyframe  
**Mascot leaves:** When `ctaVisible = animStep >= 8`, the mascot div transitions `opacity: 1 → 0` in 450ms  
**Mascot in CTA:** `AgentCTA` receives `showMascotInside={true}` and renders `AgentMascot size={36}` inside the pill with a `mascot-slide-in` animation (translateX -20px → 0, scale 0.6 → 1)

The mascot is never invisible for more than one frame between the two positions — the fade-out of the standalone mascot and the slide-in inside the pill overlap by ~200ms.

---

## Product Card Count

**Changed:** `cardCount: 3 → 1` in `glanceConfig.ts` for `eatly-dawn`  
**Card shown:** `masala-dosa` (moved to index 0 in `subCategories`)  
**Display name:** "Masala Dosa" (via `LABEL_MAP` in `ProductRail.tsx`)  
**Position:** `bottom: clamp(40px, 7vh, 80px)`, `right: clamp(24px, 4vw, 72px)` — bottom-right, independent of the left column

---

## Background-First Loading

`L0Glance.tsx` now pre-loads the background image before starting the animation:

```
const img = new Image();
img.onload = img.onerror = () => setImgReady(true);
img.src = item.image;
// 1500ms fallback in case image is slow
```

The entire animation sequence (all `setTimeout` calls) fires **after** `imgReady = true`. The title never appears over a black screen.

---

## Background Image

**File:** `public/images/feed/eatly-dawn.jpg`  
**Source:** Copied from `gtv_prototype_ak/public/feed/feed_47-food-monsoon-chai-stall.jpg`  
**Description:** Steaming chai glasses on a counter, warm amber glow, moody blue background — close enough for "dawn food" mood. A proper South Indian dawn scene (golden light, idli/dosa setup) would improve it further.

**Scrim:** `linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.50) 28%, rgba(0,0,0,0.12) 52%, rgba(0,0,0,0.32) 100%)`  
Dark at bottom for text, lighter in the middle to show the food image, slight darkening at top for header readability. Viewport-relative values (`vw/vh`) used in FeedScreen for the non-food scrim.

---

## Files Changed

| File | Change |
|------|--------|
| `l0-preview.html` | New — direct QA preview route |
| `src/L0PreviewApp.tsx` | New — preview harness with Replay button |
| `src/main.tsx` | Check `window.__L0_PREVIEW__` → mount preview or full app |
| `src/components/L0/GlanceLayout.tsx` | Two-layer crossfade; single flex column (no overlap); `clamp()` sizing |
| `src/components/L0/L0Glance.tsx` | Background-first image pre-load; timing adjusted (CT_TITLE_MOVE 3200ms) |
| `src/components/L0/ProductRail.tsx` | Figma stacked-tile design; real label map; warm palette |
| `src/config/glanceConfig.ts` | `eatly-dawn` cardCount 3 → 1 |
| `src/data/feedItems.ts` | `masala-dosa` moved to subCategories[0] |
| `src/components/Feed/FeedScreen.tsx` | Gradient scrim uses `vw/vh` |
