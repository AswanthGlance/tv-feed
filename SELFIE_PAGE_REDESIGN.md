# Selfie Screen Redesign

**Figma frame:** `4065-6358`
**Image reference:** Attached screenshot — three-card fan with selfie polaroid + transformation arrow

---

## What Changed

The old layout ("Help me understand your style" + QR/upload panels) was removed entirely and replaced with a value-proposition screen that shows outcomes before asking for anything.

---

## New Layout Structure

```
[Glance logo]
[Mascot — looking mode, presents the idea]
[Headline — "Imagine you discovering new experiences"]

[Card stage — 380px tall]
  Left card  (surf/active)   — tilted -8°, slightly behind
  Centre card (fashion hero) — upright, largest, z-index top
  Right card (travel)        — tilted +8°, slightly behind
  Selfie polaroid            — bottom-left of stage, floats
  Arrow                      — between selfie and centre card

[Skip]  [Upload Image]
[Privacy note]
```

---

## Animation Sequence (GSAP)

| Step | Element | Animation |
|------|---------|-----------|
| 1 | Mascot | Spring in: opacity, scale 0.6→1, blur, y |
| 2 | Headline words | Stagger word-by-word: opacity, y 24→0, blur |
| 3 | Left card | Slide from left: x -80→0, rotate to -8°, scale |
| 4 | Right card | Slide from right: x +80→0, rotate to +8°, scale (offset 80ms) |
| 5 | Centre card | Scale up from below: scale 0.82→1, y 40→0, blur |
| 6 | Selfie polaroid | Spring in: scale 0.7→1, rotate to -6°, then infinite float loop (y ±8px, 2.2s sine) |
| 7 | Arrow | Spring in: scale 0.4→1, x offset |
| 8 | CTA + privacy | Rise together: opacity, y 22→0, stagger 0.1s |

Total entrance duration: ~2.8s

---

## Assets Used

| Asset | Purpose |
|-------|---------|
| `/images/feed/feed_52-wellness-surf-morning.jpg` | Left background card (active/wellness) |
| `/images/feed/feed_31-fashion-streetwear-editorial.jpg` | Centre hero card (fashion, personalized result) |
| `/images/feed/feed_54-travel-kerala-backwaters-houseboat.jpg` | Right background card (travel) |
| `/images/feed/feed_36-beauty-vanity-glow.jpg` | Selfie polaroid placeholder (warm portrait) |
| `AgentMascot` (Rive) | `agentMode="looking"`, size 72 |

---

## CTA Behaviour

- **Upload Image** → triggers `<input type="file">`, on file select: updates centre card image + plays exit sequence → `onNext()`
- **Skip** → plays exit sequence → `onSkip()`
- TV remote: `ArrowLeft/Right` switches focus, `Enter` activates, `Escape` skips

---

## Removed

- `fg-selfie-top`, `fg-selfie-panels`, `fg-selfie-preview-card`, `fg-selfie-right`
- `fg-qr-block`, `fg-qr-popup`, `fg-selfie-actions`, `fg-selfie-response`
- QR code SVG component
- "Help me understand your style" copy
- "Upload from your phone / Scan QR" layout

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/Activation/SelfieScreen.tsx` | Full rewrite — new layout, GSAP sequence, no QR popup |
| `src/styles/figma-onboarding.css` | New `sv-` namespace classes appended; old selfie classes preserved but unused |
