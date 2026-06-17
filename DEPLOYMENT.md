# Deployment

Repository: Ashwanth-debug/TV-Feed-main

Primary Route: /warm_profile_1

Build Command: npm run build

Output Folder: dist

Framework: Vite (React + TypeScript)

## Vercel Settings

- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

SPA routing is handled by `vercel.json` — all routes are rewritten to `index.html`.

## Routes

| Route | Description |
|---|---|
| `/warm_profile_1` | Warm profile feed for Akshay — the shared demo |

## Git

```bash
git init
git add .
git commit -m "warm_profile_1 demo ready"
git remote add origin https://github.com/Ashwanth-debug/<repo-name>.git
git push -u origin main
```
