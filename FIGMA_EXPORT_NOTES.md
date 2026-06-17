# Figma Export Notes — L0 Templates

## Deliverable

Three 1920×1080 screenshots of the final resting state of each L0 layout template, ready to paste into Figma as image fills. No animation states. No transitions. Pure end-state.

**Files:**
```
figma-export/
  01-left-template.png    — eatly-dawn, left layout, 2 product cards
  02-center-template.png  — feed-46, center layout, 2 product cards
  03-right-template.png   — feed-52, right layout, no products
```

---

## Frame Size

**1920 × 1080** — the native TV canvas used throughout the project. This matches the `#scaler` root at 100vw/100vh at full-screen 1080p.

> Note: The brief mentioned 3840×2160. The implementation runs at 1920×1080 (CSS pixel canvas with no scaling). Upscaling to 4K in Figma: set the frame to 3840×2160 and scale the image fill to fit. No visual data is lost — the content renders crisply because all sizing uses `clamp()` relative to vw/vh.

---

## Source Screens

| Frame | Item ID | Source Image | Layout |
|-------|---------|-------------|--------|
| 01 Left Template | `eatly-dawn` | `public/images/feed/eatly-dawn.jpg` | left |
| 02 Center Template | `feed-46` | `public/images/feed/feed_46-fashion-luxury-flatlay.jpg` | center |
| 03 Right Template | `feed-52` | `public/images/feed/feed_52-wellness-surf-morning.jpg` | right |

Items were chosen because their image files are present in `public/images/feed/` (not all 70 feed items have images committed — only ~35 do at this point).

---

## Content in Each Frame

### 01 Left Template — Eatly at Dawn
- **Tag:** BANGALORE (location chip, not category tag — item has `locationLabel`)
- **Title:** "Eatly at dawn" — final small size `clamp(26px, 3.8vw, 58px)`, weight 800
- **Reasoning:** "Bangalore's South Indian breakfast culture ran through your local, **comfort-first picks**. That's what surfaced this." (hardcoded item override from `reasoningEngine.ts`)
- **CTA:** "Show me what makes this special" (deterministic from food pool, hash of `eatly-dawn`)
- **Products:** 2 stacked cards — Masala Dosa (orange gradient) / Filter Coffee (green gradient). Final stacked state: card 0 upright, card 1 rotated 7°, offset (10, -3), scale 0.96
- **Overlay:** Left-side scrim `rgba(0,0,0,0.55→0.15)` + bottom `rgba(0,0,0,0.90→0)`

### 02 Center Template — Luxury Flatlay
- **Tag:** STYLE PICK (category tag, no location label)
- **Title:** "Luxury Flatlay" — final small size `clamp(22px, 3.0vw, 46px)`, weight 800, centered
- **Reasoning:** "Your recent style picks keep pointing toward **luxury fashion**. This edit caught that direction exactly." (from fashion reasoning pool, index 0)
- **CTA:** "Show me the full look" (deterministic from fashion pool, hash of `feed-46`)
- **Products:** 2 stacked cards — Luxury Fashion (orange) / Accessories (green). Same stacked positions as left.
- **Overlay:** Left-side scrim + bottom scrim (center uses left-direction side scrim)

### 03 Right Template — Surf Morning
- **Tag:** WELLNESS PICK (category tag)
- **Title:** "Surf Morning" — final small size `clamp(20px, 2.8vw, 44px)`, weight 800, right-aligned
- **Reasoning:** "Your **surf** and **outdoor wellness** interest came through clearly in your picks. This surfaced because the signals aligned well." (from wellness reasoning pool, index 1)
- **CTA:** "Tell me more about this" (deterministic from wellness pool, hash of `feed-52`)
- **Products:** None (right layout always `cardCount: 0`)
- **Overlay:** Right-side scrim `rgba(0,0,0,0.60→0.20)` + bottom scrim

---

## Assets Transferred

| Asset | Source | Notes |
|-------|--------|-------|
| Glance logo | `public/glance-logo.png` | Top-left header, height `clamp(26px, 3.2vh, 48px)` |
| Background photos | `public/images/feed/` | Cover-fill, `center 32%`, Ken Burns end-state scale(1.04) |
| Mascot | Simplified circle proxy | **Rive cannot be captured as a static frame.** In Figma, replace the purple circle CTA icon with the actual mascot PNG/SVG export from the Rive file at idle/looking state. Mascot source: `public/mascot.riv`, state machine `G_Moscot_States`, idle state `Idel _Eyeblink`. |
| Weather/clock/date | Live values at screenshot time | Hardcode to representative values in Figma (e.g. ☁ 65° · Tue, Jun 10 · 8:00 AM) |

---

## Typography

All text uses **Plus Jakarta Sans** (Google Font, loaded via `globals.css`).

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Title (final/small) | left: 58px · center: 46px · right: 44px (at 1920px) | 800 | rgba(255,255,255,0.95) |
| Category tag | 13px | 700 | rgba(255,255,255,0.78), uppercase, 0.11em spacing |
| Reasoning text | 20px (at 1920px) | 400 | rgba(255,255,255,0.78) |
| Reasoning highlights | same | 700 | rgba(255,255,255,0.98) + purple glow |
| CTA label | 20px (at 1920px) | 600 | #111 (dark, on white pill) |
| Header weather/date | 18px (at 1920px) | 500 | rgba(255,255,255,0.45) |
| Header time | 18px (at 1920px) | 500 | #ffffff |
| Product card labels | 11px | 700 | rgba(255,255,255,0.94), uppercase |

---

## Intentionally Omitted

| Item | Reason |
|------|--------|
| Rive mascot (animated) | Cannot be captured as a static frame. Use a static mascot export or placeholder circle in Figma. |
| Title large/cinematic state | Only the final resting state is exported, not the entrance animation where the title is full-bleed. |
| Typing cursor in reasoning | Animation artifact — not part of the final state. |
| Preference interstitial cards | Not an L0 template. |
| HUD nav bar (01/02/03 switcher) | Dev-only UI, excluded from Figma frames. Crop it out or screenshot the export page in fullscreen mode without the top bar. |

---

## How to Get Clean Figma-Ready Screenshots (No Nav Bar)

The `l0-export.html` page has a dev nav bar at the top (48px, semi-transparent). For a clean Figma frame:

**Option A — Screenshot with crop:**
The nav bar is 48px tall. In Figma, import the PNG and crop the top 48px, or set the frame to 1920×1032 (1080-48) and align the image to the bottom.

**Option B — Playwright with scroll offset:**
```bash
npx playwright screenshot --clip 0,48,1920,1080 ...
```

**Option C — Use the l0-export page fullscreen in the browser:**
Open `http://localhost:5175/l0-export.html`, hide the browser chrome (F11), press `2` or `3` to switch templates, then take a browser screenshot (Cmd+Shift+4 or similar).

---

## Files Changed

| File | Purpose |
|------|---------|
| `l0-export.html` | Vite entry point for the export app |
| `src/L0ExportApp.tsx` | Template data + navigation shell |
| `src/components/export/L0FinalState.tsx` | Pixel-accurate final-state renderer (no GSAP) |
| `src/main.tsx` | Added `__L0_EXPORT__` flag routing |
| `figma-export/01-left-template.png` | Left template screenshot, 1920×1080 |
| `figma-export/02-center-template.png` | Center template screenshot, 1920×1080 |
| `figma-export/03-right-template.png` | Right template screenshot, 1920×1080 |
| `FIGMA_EXPORT_NOTES.md` | This file |
