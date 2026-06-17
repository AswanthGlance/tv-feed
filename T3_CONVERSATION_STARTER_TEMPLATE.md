# T3 Conversation Starter Template

## Route

| Method | Value |
|--------|-------|
| Pathname | `/t3` |
| Hash | `#t3` |
| Query param | `?t3` |

Access at: `http://localhost:5173/?t3`

---

## Purpose

T3 is **not a recommendation template** and **not a story template**.

It is a **conversation starter** — a moment where the agent creates genuine curiosity, surfaces contextual signals, then asks one meaningful question. If the user responds positively, the door opens to a deeper agentic planning flow.

---

## Files Changed

| File | Action |
|------|--------|
| `src/components/T3/T3ConversationStarter.tsx` | Created — main template component |
| `src/T3App.tsx` | Created — standalone route wrapper |
| `src/main.tsx` | Edited — added `isT3` route detection |

---

## Signals Used

T3 reads from `window.GLANCE_CTX` (same context stub used by L0):

| Signal | Key | Default |
|--------|-----|---------|
| City | `GLANCE_CTX.city` | `Bangalore` |
| Weather | `GLANCE_CTX.weather` | `sunny` |
| Long weekend | `GLANCE_CTX.upcomingContext === 'long_weekend'` | `true` |

Derived display values:
- `TEMP_LABEL` — e.g. `26° and Sunny`, `22° and Drizzly`
- `WEEKEND_LABEL` — `3 Day Weekend` or `Long Weekend`
- `TRIP_LABEL` — `2–4 day trip` or `quick getaway`

**Not used:** destination, bookings, travel plans, future events.

---

## Question Structure

The question is composed as a flat string segmented into highlighted and non-highlighted parts:

```ts
const QUESTION_SEGMENTS = [
  { text: 'Thinking about a ', highlight: false },
  { text: 'short escape',      highlight: true  },
  { text: ' this weekend?',    highlight: false },
];
```

Highlighted segments receive the same glow treatment as L0 reasoning highlights:
- `fontWeight: 700`
- `color: rgba(255,255,255,0.98)`
- `textShadow: 0 0 12px rgba(192,132,252,0.9), 0 0 28px rgba(112,71,226,0.6)`

---

## Highlight System

Uses `CharReveal` — the same character-by-character blur reveal as `AgentTextReveal` in `CinematicL0.tsx`:

- Each character is an inline `<span>`
- Unrevealed chars: `opacity: 0`, `filter: blur(4px)`
- Revealed chars: `opacity: 1`, `filter: blur(0px)`, transition `0.14s ease`
- Revealed counter increments every **28ms** (same rate as L0 reasoning)
- Highlight styling is applied at segment level, rendered per-char

---

## Animation Flow

| Time | Event |
|------|-------|
| 0.3s | Agent appears (thinking mode) |
| 1.2s | Intro line: *"I've been noticing something."* |
| 2.1s | Agent shifts to looking mode |
| 2.5s | Signal chip 1: **↗ 3 Day Weekend** (top-left) |
| 3.2s | Signal chip 2: **☀ 26° and Sunny** (bottom-left + bottom-right) |
| 3.9s | Signal chip 3: **◎ Bangalore** (top-right) |
| 4.8s | Bridge line: *"Which made me wonder..."* |
| 5.8s | Question char-reveal begins; agent shifts to idle |
| ~7.2s | CTAs appear |

Each signal chip animates in with `translateY(10px) scale(0.92)` → `translateY(0) scale(1)`.

---

## CTA Options

Two CTAs — conversational, not generic:

| CTA | Type | Behavior |
|-----|------|----------|
| `Yes, let's plan something` | Primary (white pill + BorderBeam) | calls `onYes` |
| `Not this time` | Secondary (ghost pill) | calls `onNo` |

TV remote navigation: `ArrowLeft` / `ArrowRight` to switch focus, `Enter` / `Space` to confirm.

---

## Design Language

All reused from the Glance family:

- `AgentMascot` — Rive mascot, same `agentMode` prop (`thinking → looking → idle`)
- `BorderBeam` — animated border on primary CTA
- Purple/magenta highlight glow: `rgba(192,132,252,0.9)` + `rgba(112,71,226,0.6)`
- Background: deep dark radial gradient `rgba(40,10,100,0.75)` → `rgba(5,2,16,0.98)`
- Typography: Plus Jakarta Sans, same sizes as L0
- Signal chips: `rgba(255,255,255,0.06)` glass with `rgba(255,255,255,0.12)` border

---

## Isolation

T3 shares **no state** with:
- L0 feed (`FeedScreen`, `CinematicL0`, `L0Glance`)
- T2 Fashion Story (`T2FashionStory`)
- Onboarding screens
- Preference collection

It reads `GLANCE_CTX` (same global as L0) but does not write to `PreferenceProfile` or `GlanceProfileDraft`.

---

## Autoplay Behavior

- Template animates through the sequence once
- After question appears: agent stays `idle`, ambient glow pulses, question remains
- No auto-advance, no auto-answer
- Waits for explicit user intent (`onYes` / `onNo` callbacks)
