# L0 Phase 2 Correction

## Figma Reference

**File:** Apple-TV-Shop-Agent  
**Node:** 925:2589 (GTV Ambient — full 1920×1080 frame)  
**Accessed via:** Figma Dev Mode MCP Server at `http://127.0.0.1:3845/mcp`

### Key nodes inspected

| Node ID | Name | Details |
|---------|------|---------|
| 925:2677 | Header | 1920×106, pt-72 px-96 |
| 925:2678 | Layer_1 (logo) | 120×34, top-left |
| 925:2685 | d&T, weather | Weather · Date · Time, top-right |
| 925:2636 | Content frame | 880×318 at (96, 682) — bottom-left |
| 925:2648 | Title area | 880×136, "Mountain Fuji" at 64px SF Pro |
| 925:2651 | CTA pill | 315×64, border-radius 72, white bg, Glance mascot + label |
| 925:2655 | Glance Mascot (in CTA) | 32×28 SVG |
| 925:2592 | Background image | ChatGPT/Firefly upscaled food image |
| 925:2593 | Scrim | Bottom-to-top dark gradient (y=250, h=250) |

### Assets from MCP

- **Logo SVG:** `http://localhost:3845/assets/e0288041c6efa70a3a43bafb204eea4bff585b25.svg`
- **Mascot SVG (in CTA):** `http://localhost:3845/assets/0477cccf5a10c98aec8885ec28b43ae06dcfe0d4.svg`

---

## Files Changed

| File | What changed |
|------|-------------|
| `src/data/feedItems.ts` | Added `eatly-dawn` item at position 0 |
| `src/config/glanceConfig.ts` | Added `cinematicTitle?: boolean` flag; `eatly-dawn` → `{ layout: 'left', cardCount: 3, cinematicTitle: true }` |
| `src/logic/reasoningEngine.ts` | Added per-item override: `eatly-dawn` → Figma-specified reasoning string |
| `src/components/L0/L0Glance.tsx` | New cinematic animation sequence (10 steps vs 7 standard) |
| `src/components/L0/GlanceLayout.tsx` | Full rewrite: cinematic path + cleaned standard path |
| `src/components/L0/AgentCTA.tsx` | Figma-exact white pill, mascot icon, removed "Why this?" |
| `src/components/L0/AgentReasoning.tsx` | Free-floating text, no glass container |
| `src/components/L0/ProductRail.tsx` | Vertical orientation support; real subcategory names; no "Pick N" labels |
| `src/components/Feed/FeedScreen.tsx` | Header rewritten to match Figma (logo left, weather+time right); gradient updated per category |
| `public/images/feed/eatly-dawn.jpg` | Background image (monsoon chai stall — dawn warmth) |

---

## Final Animation Sequence (Cinematic)

| Step | Event | Timing |
|------|-------|--------|
| 1 | Background image crossfades in | 0ms |
| 2 | Large centred title fades in (148px) | 800ms |
| — | Read pause | 800–2900ms (2100ms) |
| 4 | Title migrates to bottom-left, shrinks to 64px | 2900ms |
| 5 | Agent mascot icon appears | 4100ms |
| 6 | Reasoning text fades in | 4600ms |
| — | Read pause | 4600–5800ms (1200ms) |
| 8 | CTA pill appears | 5800ms |
| 9 | Product cards stagger in (bottom-right) | 6400ms, +500ms each |
| 10 | CTA focus ring activates | 7500ms |

---

## Layout Decisions

### Cinematic left-L0 ("Eatly at dawn")

- **Large title centred (step 2):** 148px SF Pro Display, white, no box
- **Title final position (step 4):** bottom-left (x=96, y=bottom−80), 64px, rgba(255,255,255,0.9)
- **Reasoning:** free-floating 22px text next to mascot icon — no glass panel
- **CTA:** Figma-exact white pill (h=64, br=72) with Glance mascot SVG + label
- **Product cards:** stacked vertically at bottom-right corner, dark glass tiles
- **Background scrim:** bottom-focused linear gradient without purple tint for food category
- **Header:** logo (120×34) top-left; weather + date + 12h time (no separate clock) top-right

### What was removed

- `MascotLayer` component no longer imported in GlanceLayout (mascot now inline)
- "Why this?" secondary CTA button
- Glass panel wrapping all L0 content (`.glance-card` style container)
- "Pick 1 / Pick 2" labels on product cards
- Purple radial gradient tint for food-category items
- Eyebrow category label on cinematic path

---

## What still needs review before applying to all L0s

1. **Background image quality** — `eatly-dawn.jpg` is a placeholder (chai stall). A dawn South Indian food scene (dosa, filter coffee, golden morning light) would be more accurate.
2. **Animation on lower-end TV hardware** — 148px font + CSS keyframe animation should be tested on the actual GTV device at 1080p.
3. **Mascot SVG fallback** — the MCP asset URL (`localhost:3845`) only works when Figma Dev Mode is running. A bundled SVG should replace it for production.
4. **CTA label length** — "See the secret recipe" works at 24px semibold. Longer CTAs (> 30 chars) may overflow the pill at 64px height.
5. **3 product cards in vertical stack** — currently right-anchored at bottom-right. Needs visual review to confirm spacing doesn't clash with CTA at different screen ratios.
6. **Standard layouts unverified** — the cinematic path is Phase 2 only. Standard left/center/right layouts carry over Phase 1 structure with minor cleanup (no Why this, no container) and need separate QA pass.
7. **Location chip** — removed from cinematic path (not in Figma). Confirm whether it should appear after title migration or not at all.
