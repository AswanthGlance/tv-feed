# L0 Header + Title Group Fix

Preview: `http://localhost:5174/l0-preview.html`

---

## 1. Morning Pick — translate only, never scales

**Before:** Tag was inside `titleGroupRef`. GSAP scaled the whole group including the tag.

**After:** Tag and `<h1>` are **siblings** in the flex column. No shared wrapper div.

- Tag (`tagRef`): GSAP animates `opacity` + `y` only. Font size is its final display size `clamp(9px, 0.9vw, 13px)`. Never scaled.
- Title (`titleRef`): GSAP scales `<h1>` in place with `transformOrigin: 'left bottom'`.

---

## 2. Tag follows title down (translate only)

When the title scale-down fires, GSAP simultaneously moves the tag **down** by the visual height the title gives up:

```ts
const heightLost = titleEl.offsetHeight * (1 - ratio);
gsap.to(tagEl, { y: heightLost, duration: 0.9, ease: 'power2.inOut' });
```

Both fire at label `'titleShrink'` — synchronous. The tag appears to move with the title because it physically translates to close the gap the shrinking title leaves. It stays visually attached, same left edge, no scale.

---

## 3. Header layout

Left: `<img src="/glance-logo.png">` — the actual logo asset.  
Right: weather, date, time.  
`justifyContent: space-between` — positions them at opposite edges.  
No change to the actual DOM order or content.

---

## 4. Glance logo source

**Asset:** `/public/glance-logo.png` — copied from `QBR_Apr_2026/glance-logo.png` which was extracted from the Figma MCP in a prior session (node `925:2678`).

The MCP logo SVG URL (`http://localhost:3845/assets/e0288041...`) fails when Figma isn't on the right document. Bundling the PNG in `/public` makes it always available, regardless of Figma state.

- `height: clamp(18px, 2.2vh, 32px)`, `width: auto` — preserves aspect ratio
- `objectFit: contain`, `flexShrink: 0` — no stretching

`LOGO_SRC` constant updated to `'/glance-logo.png'`.

---

## Files changed

| File | Change |
|------|--------|
| `src/components/L0/CinematicL0.tsx` | Removed `titleGroupRef`; tag is now direct column sibling; Morning Pick at final size; LOGO_SRC = `/glance-logo.png` |
| `src/animations/l0Timeline.ts` | `titleGroupEl` → `tagEl`; tag animated via `opacity+y` only; GSAP `tl.call` computes `heightLost` and translates tag synchronously with title scale |
| `public/glance-logo.png` | Added — bundled from QBR project (Figma MCP asset, node 925:2678) |
