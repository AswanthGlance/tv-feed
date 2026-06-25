# Glance Setup Flow — Standalone HTML Export

A self-contained HTML/CSS/JS prototype of the Glance TV setup onboarding flow.  
**No npm, no Vite, no React, no build tools required.**

---

## How to open

1. Unzip this folder anywhere on your computer
2. Open `index.html` in **Google Chrome** or **Firefox** (recommended)
3. For the best experience:
   - Put the browser in fullscreen (`F11` on Windows/Linux, or `Cmd+Ctrl+F` on Mac)
   - Or zoom out (`Cmd/Ctrl -`) until the layout fills your screen

> The prototype is built at a fixed **1920×1080** TV resolution and will auto-scale to fit your browser window. It looks best on a 1080p or 4K display.

---

## What's included

### Screens
| Screen | Description |
|--------|-------------|
| **Welcome** | Mascot entrance, 2-line cinematic text reveal, CTA → agent response → transition |
| **Bangalore Confirm** (Q1 of 7) | Single-select location card, FLIP center-stage animation |
| **TV Content** (Q2 of 7) | Multi-select, 4 options (Sports / Movies / Music / News) |
| **Audience** (Q3 of 7) | Single-select who watches (Solo / Couple / Kids / Social) |
| **Show More** (Q4 of 7) | Multi-select 3+6 options with Explore More expand |
| **Weekend** (Q5 of 7) | Multi-select weekend vibe (Home / Local / Night out / Travel) |
| **Style** (Q6 of 7) | Multi-select style preference (Casual / Classy / Trending / Bold) |
| **Done** | Completion screen with Start Over |

### Animations
- **Cinematic text reveal** — each character resolves blur→sharp left-to-right
- **FLIP center-stage** — selected cards fly to center, unselected fade out
- **SetupStructuredReply** — 3-line agent acknowledgement with timed pauses
- **Screen transitions** — GSAP fade in/out between screens

### Assets (relative paths, no network required for images)
- `assets/images/setup/` — 25 setup question card images
- `assets/images/feed/` — 2 Bangalore confirm card images  
- `assets/logo/` — Glance logo PNG

### CDN dependency (requires internet)
- **GSAP 3** — loaded from cdnjs.cloudflare.com for animations
- **Google Fonts** — Plus Jakarta Sans + Instrument Sans

> If you need to run this **fully offline**, replace the CDN script tag in `index.html` with a locally downloaded GSAP file, and replace the Google Fonts `<link>` with local font files.

---

## Interacting

| Action | How |
|--------|-----|
| Click card | Select / deselect |
| Click CTA / Next | Advance to next screen |
| Click Skip question | Skip to next screen |
| Hover card | Scale up (hover focus) |
| Start over (Done screen) | Restart flow from Welcome |

---

## What's NOT included

- Live feed / L0 card templates
- Warm profile routes (WarmProfile1, WarmProfile2)
- T2 / T3 templates
- Discovery appetite screen (selfie flow stub shows Done instead)
- Actual preference engine / signal weights (display only)
- Rive mascot animation (replaced with SVG placeholder — Rive requires special runtime)

---

## Files

```
setupflowHTML/
├── index.html          — Full screen flow, all HTML markup
├── styles.css          — All styles (extracted from figma-onboarding.css)
├── script.js           — All JS logic (CinematicText, flipCenterStage, screen state machine)
├── README.md           — This file
├── SETUP_FLOW_EXPORT_REPORT.md — Technical export notes
└── assets/
    ├── images/
    │   ├── setup/      — 25 setup question card images
    │   └── feed/       — 2 Bangalore confirm images
    └── logo/           — glance-logo.png
```
