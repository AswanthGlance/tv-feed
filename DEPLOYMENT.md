# Deployment

## GitHub
- Repo: https://github.com/AswanthGlance/tv-feed
- Account: AswanthGlance
- Branch: main

## Vercel
- URL: https://tv-feed-sandy.vercel.app
- Team: glance-tv
- Account: aswanthraj-7384
- Token: vcp_4h7o7dlUS0I98jSwYc71NiqJSyITpmwPvTErjX1nWGQQAztmG91xqCbx

## Deploy command

```bash
# Switch to AswanthGlance GitHub account and push
gh auth switch --user AswanthGlance
TOKEN=$(gh auth token --hostname github.com)
git remote set-url origin "https://AswanthGlance:${TOKEN}@github.com/AswanthGlance/tv-feed.git"
git push origin main

# Deploy to Vercel
vercel --yes --prod --scope glance-tv --token vcp_4h7o7dlUS0I98jSwYc71NiqJSyITpmwPvTErjX1nWGQQAztmG91xqCbx
```

## Routes
| Local | Live |
|---|---|
| /warm_profile_1_crisp | https://tv-feed-sandy.vercel.app/warm_profile_1_crisp |
| /warm_profile_2_crisp | https://tv-feed-sandy.vercel.app/warm_profile_2_crisp |
| /cold_profile_1 | https://tv-feed-sandy.vercel.app/cold_profile_1 |
| /l0_t1 | https://tv-feed-sandy.vercel.app/l0_t1 |
| /l1-text-table | https://tv-feed-sandy.vercel.app/l1-text-table |
| /agent-hub-exploration | https://tv-feed-sandy.vercel.app/agent-hub-exploration |
| /l1-scenarios | https://tv-feed-sandy.vercel.app/l1-scenarios |
| /new-conversation | https://tv-feed-sandy.vercel.app/new-conversation |

## Build settings
- Framework: Vite (React + TypeScript)
- Build Command: `npm run build`
- Output Directory: `dist`
- SPA routing via `vercel.json` — all paths rewrite to `index.html`
