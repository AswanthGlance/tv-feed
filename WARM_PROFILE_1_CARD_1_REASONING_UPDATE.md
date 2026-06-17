# Warm Profile 1 — Card 1 Reasoning Update

## New Route

| | |
|---|---|
| Route | `/warm_profile_1` or `/warm-profile-1` |
| Source feed | `WARM_START_FEED_ITEMS` (same as `demo_warm_start`) |
| App component | `src/WarmProfile1App.tsx` |

The existing `demo_warm_start` / `WarmStartApp.tsx` is **unchanged**.

---

## How It Works

A new `setProfileOverrides()` function was added to `src/logic/reasoningEngine.ts`.

It accepts a `reasoning` map and optional `highlights` map, both keyed by item ID. These sit above all existing `itemOverrides` in the lookup chain:

```
profileOverrides → itemOverrides → category bank fallback
```

`WarmProfile1App.tsx` calls `setProfileOverrides()` at module load time, before the feed renders. Only `ws-india-afg` is overridden for this pass. Cards 2–8 fall through to the existing Abhinav warm-start reasoning unchanged.

---

## Reasoning Source Document

`Warm Start Content/Glance_TV_Warm_Start_Akshay.docx`

Profile anchor: Male 35–40, Bangalore (Indiranagar / HSR). Working professional, athletic build, lives with partner. Disposable income. Taste leans classy + trending. TV plays Sports + Movies/series with partner.

---

## Card 1 — India vs Afghanistan, Tonight

**Item ID:** `ws-india-afg`

**Original reasoning (Abhinav / demo_warm_start):**
> You told me sports matters. India vs Afghanistan is tonight's biggest fixture, first ball at 7pm.

**Updated reasoning (Akshay / warm_profile_1):**
> You've been on IPL highlights almost every evening since March, and you asked me about fantasy team construction back then. India vs Afghanistan is at the Chinnaswamy tonight — last group-stage fixture before the knockouts, first ball at 7pm. I'll set the reminder and surface a fantasy XI 30 minutes before lock.

**Reasoning structure applied:**

| Element | Content |
|---|---|
| Signal | Deeper engagement (IPL highlights every evening) + chat interaction (fantasy team ask) |
| Interpretation | User is an invested cricket follower, not a casual viewer |
| Decision | This fixture is high-stakes and personally relevant; the agent makes a specific offer (fantasy XI 30 min before lock) |

**Signal types used:**
- Deeper engagement: "You've been on IPL highlights almost every evening since March"
- Chat interaction: "you asked me about fantasy team construction back then"
- Time-sensitive context: "last group-stage fixture before the knockouts, first ball at 7pm"
- Agent action: "I'll set the reminder and surface a fantasy XI 30 minutes before lock"

**Highlights updated:**
- Original: `['biggest fixture', 'first ball at 7pm']`
- Updated: `['IPL highlights', 'Chinnaswamy tonight']`

---

## Cards Not Changed

Cards 2–8 (`ws-nandi-hills`, `ws-om-beach`, `ws-coorg`, `ws-amalfi`, `ws-wind-down`, `ws-vinyl-ritual`, `ws-gehra-hua`) retain the Abhinav reasoning from the previous rewrite. They will be updated in a subsequent pass once Card 1 direction is confirmed.

---

## Files Changed

| File | Change |
|---|---|
| `src/logic/reasoningEngine.ts` | Added `setProfileOverrides()` / `profileOverrides` / `profileHighlights`; updated `getReasoning()` and `getHighlights()` to check profile overrides first |
| `src/WarmProfile1App.tsx` | New file — clones WarmStartApp, calls `setProfileOverrides()` for Akshay Card 1 |
| `src/main.tsx` | Imported `WarmProfile1App`; added `isWarmProfile1` route check; wired into render tree |
