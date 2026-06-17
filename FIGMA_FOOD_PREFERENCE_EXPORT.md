# Figma Food Preference Export

## Figma File
[V4 Ambient — 2026](https://www.figma.com/design/ILH4IQ8QklXOmF4DfsPR5y/V4-Ambient---2026)  
Page: **Preference Collection**

---

## Frames Created

### Frame 01 — Food Preference — Question State (node 4612:2)
Final resting state of the food preference question after all entrance animations complete.

### Frame 02 — Food Preference — Collected State (node 4629:2)
Final resting state after user selected South Indian + Asian and acknowledgement animation completed.

---

## Source Screen
- Component: `src/components/Polls/InterstitialQuestion.tsx`
- Question ID: `food-picks` (from `src/data/preferenceQuestions.ts`)
- Wrapper: `src/components/Feed/PreferenceCard.tsx`
- Canvas size: 1920×1080 (TV resolution, no CSS scaling)

---

## Question Copy
`Let me sharpen your food feed — what are you into?`  
Highlight treatment applied to: **food feed**

## Highlight Style
- Font weight: 800 (Extra Bold)
- Color: `rgba(255,255,255,0.98)`
- Text shadow: `0 0 18px rgba(192,132,252,0.7), 0 0 36px rgba(112,71,226,0.35)`

---

## Option Cards

| Card | Label | Source Image |
|------|-------|--------------|
| 1 | South Indian | `/public/images/feed/eatly-dawn.jpg` |
| 2 | Asian | `/public/images/feed/feed_42-food-japanese-ramen-counter.jpg` |
| 3 | Cafés & bakes | `/public/images/feed/feed_47-food-monsoon-chai-stall.jpg` |

Background image: `/public/images/feed/feed_47-food-monsoon-chai-stall.jpg`

---

## CTA Buttons (Frame 01)
- **Select All** — `rgba(255,255,255,0.1)` fill, `rgba(255,255,255,0.2)` border, blur(8px)
- **Done** — `rgba(255,255,255,0.28)` fill (inactive state — no selection made)

---

## Collected State Copy (Frame 02)
Selected: South Indian + Asian

| Line | Text | Style |
|------|------|-------|
| 1 | South Indian and Asian food. | Regular 26px, opacity 0.78 |
| 2 | Got it. | Bold 40px, opacity 0.98 |
| 3 | I'll tune your feed in that direction. | Regular 26px, opacity 0.78 |

---

## Typography

| Usage | Font | Weight | Size |
|-------|------|--------|------|
| Headline | Plus Jakarta Sans | Regular (400) | 48px |
| Highlight | Plus Jakarta Sans | Extra Bold (800) | 48px |
| Pick a few caption | Plus Jakarta Sans | Bold (700) | 13px / letterspacing +20% |
| Card label | Plus Jakarta Sans | Bold (700) | 22px |
| Reply line 1 & 3 | Plus Jakarta Sans | Regular (400) | 26px |
| Reply line 2 | Plus Jakarta Sans | Bold (700) | 40px |
| Header date/time/weather | Plus Jakarta Sans | Medium (500) | 18px |

---

## Colors

| Token | Value |
|-------|-------|
| Background | `#080416` |
| Purple | `#7047E2` |
| Lavender | `#A786E5` |
| Text primary | `rgba(245,243,247,0.88)` |
| Text secondary | `rgba(245,243,247,0.78)` |
| Card dark base | `#0D0820` |
| Card gradient | `rgba(4,2,14,0.88)` → transparent |

---

## Card Styling
- Size: 380×340px (Frame 01) / 380×320px (Frame 02)
- Border radius: 22px
- Unselected border: `1.5px solid rgba(255,255,255,0.1)`
- Selected border: `2.5px solid rgba(255,255,255,0.9)`
- Shadow unselected: `0 4px 20px rgba(0,0,0,0.35)`
- Shadow selected: `0 12px 48px rgba(0,0,0,0.6)`
- Gradient overlay: `linear-gradient(to top, rgba(4,2,14,0.88) 0%, rgba(4,2,14,0.22) 50%, transparent 72%)`

## Selection Badge
- Size: 28×28px, border-radius: 50%
- Unselected: `rgba(0,0,0,0.3)` fill, `rgba(255,255,255,0.75)` border
- Selected: `rgba(255,255,255,0.95)` fill, checkmark `✓` in `#111`

---

## Mascot
- Component: `src/components/Shared/AgentMascot.tsx`
- Rive file: `/public/mascot.riv`
- Frame 01 state: `looking` (80px)
- Frame 02 state: `thinking` (76px)
- Glow: `radial-gradient rgba(112,71,226,0.28)`, blur 18px, 140×140px

---

## Frame Sizes
Both frames: **1920 × 1080px**

---

## Assets Transferred

| Asset | Source Path | Used In |
|-------|-------------|---------|
| BG / Cafés card image | `/public/images/feed/feed_47-food-monsoon-chai-stall.jpg` | Both frames |
| South Indian card | `/public/images/feed/eatly-dawn.jpg` | Frame 01 + 02 |
| Asian card | `/public/images/feed/feed_42-food-japanese-ramen-counter.jpg` | Frame 01 + 02 |
| Glance logo | `/public/glance-logo.png` | Both frames |
