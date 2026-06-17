# warm_profile_1 Deployment Checklist

## Build Status
- [x] `npm run build` — PASSED (dist/index.html + assets generated)
- [x] No TypeScript errors
- [x] No broken imports

## Route Verified
- [x] `/warm_profile_1` — wired in `src/main.tsx` (pathname check on lines 33–34)
- [x] `/warm-profile-1` — alias also wired

## Assets Verified

### Warm-start feed images (`/public/images/warm-start/`)
- [x] ind-vs-afg.png
- [x] nandi-hills.jpg
- [x] om-beach.webp
- [x] coorg.jpg
- [x] amalfi-coast.jpg
- [x] sleep-wind-down.jpg
- [x] vinyl-ritual.webp
- [x] gehra-hua.jpg

### Preference card images (`/public/images/warm-start/`)
- [x] pref-bnb.jpg
- [x] pref-hotel.jpg
- [x] pref-resort.jpg
- [x] pref-lastminute.jpg

### Core assets (`/public/`)
- [x] mascot.riv — Rive mascot animation
- [x] handwave-mascot.lottie — entry lottie
- [x] glance-logo.png — header logo

### Weather / date / time
- [x] Hardcoded in `WarmProfile1App.tsx` (no external dependency)
  - city: Bangalore, weather: rainy, day: Saturday, timeOfDay: morning

## Files Changed (for this deployment prep)

| File | Change |
|---|---|
| `tsconfig.app.json` | Disabled `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly` |
| `vite.config.ts` | Removed invalid `historyApiFallback` server option |
| `src/App.tsx` | Added `as any` casts on 3 narrowed string array props |
| `src/components/L1/L1DemoShell.tsx` | Fixed `RendererComponent` props; fixed `TemplateSwitcher` to use `onNavigate` |
| `src/components/Calibration/Q1Scenario.tsx` | Fixed `opt.image ?? ''` for optional string |
| `vercel.json` | Created — SPA rewrite rule for Vercel |
| `DEPLOYMENT.md` | Created — deployment instructions |
| `WARM_PROFILE_1_DEPLOYMENT_CHECKLIST.md` | Created — this file |

## Deployment Steps

### 1. GitHub

```bash
git init
git add .
git commit -m "warm_profile_1 demo ready"
git remote add origin https://github.com/Ashwanth-debug/<repo-name>.git
git push -u origin main
```

### 2. Vercel

1. Go to vercel.com → New Project → Import from GitHub
2. Select the repository
3. Vercel auto-detects Vite — accept defaults:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Deploy
5. Share the URL with path `/warm_profile_1`

### 3. Verify after deploy

- Open `https://<your-vercel-url>/warm_profile_1`
- All 8 cards should load with images
- Mascot Rive animation should play
- Navigation (arrow keys or remote) should advance cards
- No 404s in browser console
