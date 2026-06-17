# L0 Glance Correction Notes

## 1. Full-Screen Fix

**Problem:** The L0 was rendered inside a 1920×1080px canvas that was then scaled down via JS — producing an iPad/frame effect.

**Fix:**
- Removed the JS `doScale()` useEffect from `App.tsx` entirely
- `#scaler` in `tv.css`: changed from `position:absolute; top:50%; left:50%` (transform-scaled box) → `position:fixed; inset:0; width:100vw; height:100vh`
- `#stage` in `tv.css`: changed from `width:1920px; height:1080px` → `width:100%; height:100%`
- `FeedScreen.tsx` root div: changed from `width:1920; height:1080` → `width:100%; height:100%`
- `globals.css` body: removed `display:flex; align-items:center; justify-content:center` which was centering the fixed-size canvas

**Files changed:** `src/App.tsx`, `src/styles/tv.css`, `src/styles/globals.css`, `src/components/Feed/FeedScreen.tsx`

---

## 2. Title Transition Fix

**Problem:** Two separate `<h1>` elements (one centred, one bottom-left) swapped — causing a jump/snap.

**Fix:** Single `<h1>` inside a full-screen `position:absolute inset:0` wrapper.

- **Large mode (steps 2–3):** Wrapper is `display:flex; align-items:center; justify-content:center` → h1 is naturally centred with `position:relative`
- **Moved mode (step 4+):** Wrapper is `display:block` → h1 becomes `position:absolute; bottom:22%; left:5%`
- **CSS transition on:** `font-size`, `bottom`, `left`, `color`, `letter-spacing`, `opacity` — all in a single 1.1s `cubic-bezier(0.4,0,0.2,1)` curve
- Font family corrected to `Plus Jakarta Sans` (sans-serif only, no Playfair Display)

---

## 3. Typing Effect Implementation

**Implementation:** `L0Glance.tsx` tracks `typedChars` state (integer 0 → reasoning.length).

- Each character is scheduled as a separate `setTimeout` at `CT_TYPING_START + charIdx * 38ms`
- `38ms` per character = ~2.5 chars/second for a 65-char string → ~2.5s total
- `GlanceLayout.tsx` receives `typedChars` prop and renders `reasoning.slice(0, typedChars)`
- Blinking cursor (2px vertical bar) displayed while `typedChars < reasoning.length`
- Cursor disappears naturally when typing completes

**Timing:** Typing begins at `CT_MASCOT + 600ms = 4700ms`, finishes at `4700 + 65*38 ≈ 7170ms`

---

## 4. Mascot Behavior

- **During reasoning:** `AgentMascot` size **80** (was 36) — large, purple, prominent
- **Mascot animation:** `mascot-pop-in` keyframe (scale 0.5 → 1.12 → 1.0) on entry
- **Breathing glow:** existing `_am-breathe-idle` + glow Rive animation preserved
- **Mascot-to-CTA transition:** Mascot div at bottom-left fades out (`opacity: 0`) when `ctaVisible=true`. Simultaneously `AgentCTA` receives `showMascotInside=true` and renders the mascot inside the pill with a `mascot-slide-in` keyframe (translateX -20px → 0, scale 0.6 → 1)
- Mascot inside CTA uses size 36

---

## 5. CTA Behavior

- Single CTA only — no "Why this?" secondary button (removed in Phase 2)
- `AgentCTA` now accepts `showMascotInside: boolean` and `agentMode` props
- Pill: `height:64`, `border-radius:72`, `padding:0 28px`, white background
- CTA appears at `CT_TYPING_END + 500ms` (after typing finishes + pause)
- Font corrected to `Plus Jakarta Sans` semibold

---

## 6. Removed Bottom-Right Icons

**Removed:**
- 👍 Like button
- 👎 Not for me button
- 🔖 Save button
- The entire bottom-right action button `<div>` in `FeedScreen.tsx`

**Keyboard shortcuts preserved:** ArrowRight still opens the actions panel internally (state machine intact), but the buttons have no visual representation. This keeps the remote navigation logic working without showing the icons.

---

## 7. Product Card Changes

**Figma reference:** Node `925:3942` — "2x2 - Floor Lamp" pattern: two rounded image tiles (80×80px), white border (3px), box-shadow, front tile straight, back tile rotated +8°.

**Implemented:**
- `FigmaProductCard` component: stacked-tile design with gradient colour fills (warm food palette — amber/terracotta tones for "Eatly at dawn")
- Label text inside front tile (bottom gradient overlay)
- No "Pick 1 / Pick 2" labels
- Real names from subCategories: `filter-coffee → Filter Coffee`, `idli-vada → Idli & Vada`, `masala-dosa → Masala Dosa`
- Cards positioned bottom-right (`bottom:8%; right:4%`), vertical stack, stagger-in from right

---

## Files Changed

| File | Change |
|------|--------|
| `src/App.tsx` | Removed JS scaler useEffect |
| `src/styles/tv.css` | `#scaler` → fixed full-screen; `#stage` → 100% |
| `src/styles/globals.css` | Removed body flex-centering |
| `src/components/Feed/FeedScreen.tsx` | Stage dims 100%; removed like/dislike/save buttons |
| `src/components/L0/L0Glance.tsx` | Typing effect scheduler; `typedChars` state |
| `src/components/L0/GlanceLayout.tsx` | Single-element title transition; typing display; mascot-to-CTA |
| `src/components/L0/AgentCTA.tsx` | `showMascotInside` + `agentMode` props; mascot-slide-in animation |
| `src/components/L0/ProductRail.tsx` | Figma-style stacked image tiles; real names |

---

## What Still Needs Review

1. **Background image** — `eatly-dawn.jpg` is a chai stall image. A proper dawn South Indian food scene would be stronger.
2. **Title `bottom: 22%` / `left: 5%`** — percentages work well at 1080p/16:9. Needs visual QA at other viewport ratios.
3. **Typing speed** — 38ms/char feels right for a ~65-char string. Adjust `TYPING_CHAR_DELAY` in `L0Glance.tsx` if pacing feels off.
4. **Product card colours** — warm gradient fills are placeholders. Ideally replaced with actual food imagery thumbnails once a content pipeline exists.
5. **Weather card** — not touched; remains unchanged and functional.
6. **Standard L0 layouts** — unchanged. The cinematic path applies only to `cinematicTitle: true` items (currently just `eatly-dawn`).
