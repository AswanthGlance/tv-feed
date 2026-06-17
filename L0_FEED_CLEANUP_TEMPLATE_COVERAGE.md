# L0 Feed Cleanup + Template Coverage

## Files Changed

| File | What changed |
|------|-------------|
| `src/components/L0/CinematicL0.tsx` | Home icon hidden; CTA glow moved to box-shadow (contained); title measurement re-runs per item |
| `src/components/Feed/FeedScreen.tsx` | Pager dots removed; idle auto-advance added (12s); tune-your-feed overlays gated behind `OVERLAYS_ENABLED` flag |
| `src/config/glanceConfig.ts` | `feed-02` → center+products; `feed-05` → right+no products; `eatly-dawn` cinematicTitle flag removed (now unified) |

---

## 1. Homepage icon hidden

Code preserved in `CinematicL0.tsx` inside `{false && (...)}`. Re-enable by changing `false` to `ctaActive`.

---

## 2. Right-side indicator removed

Pager dot bar (right edge, `position: absolute, right: 28`) fully removed from `FeedScreen.tsx`.

---

## 3. CTA glow containment fix

**Before:** An absolutely-positioned blurred div sat behind the CTA and leaked outside the pill shape.

**After:** Glow is expressed as `box-shadow` directly on the `<button>` element. Box-shadow respects the pill's `border-radius: 999` and can never escape the pill geometry. Value:

```
0 0 32px 8px rgba(112,71,226,0.38)   ← purple ambient, activates when beamActive
```

Transitions in smoothly at `0.5s ease` when `beamActive` fires. Works identically for all three alignment variants.

---

## 4. CTA glow alignment

Because the glow is `box-shadow`, it is always centered on the pill at its current rendered width — no hardcoded positioning, no stale width from a prior render. Naturally follows CTA width during typing.

---

## 5. Idle auto-advance

Timer: **12 seconds** of no keypress → calls `onNext()`.

- Resets on every keydown (any key).
- Resets on every card change (`feedIdx`).
- Does not fight user navigation — any key press cancels the pending advance.
- Implementation: `resetIdleTimer` / `idleTimer` ref in `FeedScreen.tsx`.
- To adjust the idle delay, change the `12000` constant in `FeedScreen.tsx`.

---

## 6. Tune-your-feed overlays hidden

Set `OVERLAYS_ENABLED = false` at the top of `FeedScreen.tsx`. This suppresses:
- Contextual question (`showContextual`)
- Interstitial question (`overlay === 'interstitial'`)
- General question (`overlay === 'general'`)

To re-enable all overlays: set `OVERLAYS_ENABLED = true`.

Thumbs-up/down, deep-dive, settings, and L1 exit follow-up are **not** affected.

---

## 7. Title big-to-small animation on all cards

`useLayoutEffect` in `CinematicL0` now re-runs on `[item.id, alignment]` instead of just `[alignment]`. This means `titleLargePxRef` and `titleSmallPxRef` are re-measured on every card change, so every card gets a fresh scale ratio and the cinematic shrink fires correctly.

---

## 8. Template coverage in feed

First three unique items cover all three templates:

| Item | Layout | Products | QA note |
|------|--------|----------|---------|
| `eatly-dawn` | left | 2 cards | Approved reference |
| `feed-02` | center | 2 cards | Center + products — now visible |
| `feed-05` | right | 0 (always) | Right + no products |

These appear in the first ~5 cards after onboarding. Browse with ↑↓ to see all three.

---

## 9. Shared timeline

All three templates use the identical `buildL0Timeline()` from `l0Timeline.ts`. The only alignment-sensitive values are:
- `transformOrigin` on title (`left/center/right bottom`)
- `transformOrigin` on reasoning (`left/center/right top`)
- Products gated by `showProducts` flag (passed from `L0Glance`)

---

## Preview route

`/l0-preview.html` is unchanged. It boots `L0PreviewApp` → `L0Glance('eatly-dawn')` → `CinematicL0(alignment='left', showProducts=true)`.
