# Building Your Feed — Redesign

**Figma frame:** QBR — Ambient (referenced prompt)
**Prior implementation:** data tiles + progress bar + "Your feed is ready" label — replaced entirely

---

## Concept

Not a loading screen. An agentic assembly moment.

The user reads what Glance is doing, in the agent's voice, with each step personalised to their onboarding answers. The sequence feels deliberate and intelligent — headline first, then the agent narrates, then each build step checks off one by one.

---

## Layout

Left-aligned column on a 1920×1080 dark purple stage:

```
[Glance logo]

"Made for your evening."          ← large editorial headline

  [Mascot]  "Reading your taste, pulling Bangalore lifestyle picks..."  ← agent narration

  ✓  Reading your evening signals
  ✓  Pulling Bangalore lifestyle picks
  ✓  Finding local food discoveries
  ✓  Keeping things close to what you know
  ✓  Building your first Glance
```

---

## GSAP Animation Sequence

| Step | Element | Animation |
|------|---------|-----------|
| 1 | Headline words | Stagger reveal: `opacity`, `y 32→0`, `blur 10px→0`, `0.65s`, `0.10s` per word |
| 2 | Mascot | Spring in: `scale 0.55→1`, `blur`, `y`, `back.out(1.5)` — fires 0.6s after headline starts |
| 3 | Narration area | Fade+rise in, then triggers TypewriterText (speed 22ms/char) |
| 4 | `narrationDone` callback | Fires when TypewriterText completes → triggers checklist timeline |
| 5–9 | Checklist items | Each item: `x -28→0`, `blur→0`, `0.45s`, staggered `0.55s` apart |
| 5–9 | Check icons | `scale 0→1`, `back.out(2)`, glow pulse (`box-shadow` yoyo) after each icon appears |
| Final | Container | `opacity 0`, `0.55s` after last check item → `onDone()` called |

No progress bar. No spinner. No flash overlay.

---

## Personalization Logic

Driven entirely by `GlanceProfileDraft` passed as prop:

| Data | Source | Usage |
|------|--------|-------|
| Location | `profileDraft.demographics.location.value` | Checklist item 2: "Pulling {city} lifestyle picks" + narration |
| Categories | `profileDraft.category_interests.primary_category_interests[].category` | Up to 2 category-specific checklist items via `CAT_COPY` map |
| Discovery appetite | `profileDraft.discovery_appetite` | 1 checklist item via `DISCOVERY_COPY` map |

Checklist is dynamically built: `[location signal, location picks, ...cat items, discovery item, final]` — capped at 5 items.

If no categories were selected, the generic "Calibrating your discovery range" item is used. Location defaults to `"your city"` if draft is empty.

---

## Checklist Behaviour

- Items are invisible on mount (`opacity: 0`, `x: -28`)
- Each item animates in left-to-right after the narration completes
- The check icon springs in with `back.out(2)` 250ms after the item
- A brief glow (`box-shadow` yoyo) fires on the icon to draw attention
- Items are not interactive — they are read-only assembly signals

---

## Feed Transition

After the last checklist item settles (1.2s pause), the entire container fades to opacity 0 over 0.55s, then `onDone()` is called — which triggers `enterFeed()` in `App.tsx`. No flash overlay. No hard cut.

---

## What Was Removed

- Data tiles (location/interests/discovery pills)
- Progress bar (`fg-tuning-progress-wrap` / `fg-tuning-progress-fill`)
- "Your feed is ready" / "Building your feed" copy
- White flash overlay transition
- Centered layout (`fg-tuning-layout`)

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/Calibration/TuningTransition.tsx` | Full rewrite — new layout, GSAP sequence, personalised checklist |
| `src/styles/figma-onboarding.css` | `bt-` namespace classes appended (screen, layout, headline, agent-row, narration, checklist, check-item, check-icon, check-text) |
