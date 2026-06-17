# Project URLs

All routes run on `http://localhost:5175` (dev server).

## App Routes

| URL | Description | Alternate Forms |
|-----|-------------|-----------------|
| `http://localhost:5175/` | Main app — cold-start onboarding → feed | — |
| `http://localhost:5175/demo_cold_start` | Cold start demo | `/demo-cold-start` |
| `http://localhost:5175/demo_warm_start` | Warm start demo | `/demo-warm-start` |
| `http://localhost:5175/t2-fashion` | T2 fashion variant | `/?t2` or `/#t2-fashion` |
| `http://localhost:5175/t3` | T3 app | `/?t3` or `/#t3` |
| `http://localhost:5175/L1_templates` | L1 template gallery | `/L1_templates/*` (any sub-path) |
| `http://localhost:5175/l0_experiment` | L0 animation lab | `/?l0_experiment` |

## Special / Preview Routes

| URL | Description | How it activates |
|-----|-------------|-----------------|
| `http://localhost:5173/interstitial-preview.html` | Interstitial preview (separate HTML) | `window.__INTERSTITIAL_PREVIEW__` flag |
| `http://localhost:5175/l0-preview.html` | L0 card preview (separate HTML) | `window.__L0_PREVIEW__` flag |

## Notes

- Routes are matched via `window.location.pathname` in [src/main.tsx](src/main.tsx) — no router library is used.
- The default route (`/`) renders the full onboarding flow: `welcome → bangalore-confirm → worlds → discovery-appetite → selfie → tuning → feed`.
- `BeamButtonPOC` and `L0ExportApp` are activated via `window.__BEAM_POC__` and `window.__L0_EXPORT__` flags respectively (not URL-based routes).
