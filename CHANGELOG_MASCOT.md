# Mascot Changelog — Rive Integration

## Rive File

**Source:** `G_Moscot_State_Animations_test 2.riv` (root of repo)  
**Deployed to:** `public/mascot.riv` (served as a static asset at `/mascot.riv`)  
**Package:** `@rive-app/react-canvas` (added to dependencies)

---

## State Machine

**Machine name:** `G_Moscot_States`

| Rive state name | Maps to `agentMode` | When used |
|-----------------|---------------------|-----------|
| `Idel _Eyeblink` | `idle` | Resting, waiting, calm presence, post-action, skip actions |
| `Looking Around` | `looking` | Asking a question, confirming selection, agent reasoning, selfie explanation, generating feed, revealing L0 Glances |

The Boolean input `Looking` is used to switch between states at runtime. If absent, the component falls back to `rive.play(stateName)` directly.

> **Note on spelling:** The idle state in the Rive binary is spelled `Idel _Eyeblink` (not `Idle`). This exact string is used in the component. Do not correct the spelling without updating the Rive file — they must match.

---

## Files Changed

### New Files

| File | Purpose |
|------|---------|
| `src/components/Shared/AgentMascot.tsx` | Single Rive controller — all Rive logic lives here |
| `public/mascot.riv` | Rive animation file, served statically |

### Modified Files

| File | Change |
|------|--------|
| `package.json` | Added `@rive-app/react-canvas` dependency |
| `src/components/Activation/WelcomeScreen.tsx` | Replaced `<Mascot>` with `<AgentMascot agentMode="idle">` |
| `src/components/Activation/BangaloreConfirm.tsx` | Replaced `<Mascot>` — question: `looking`; acknowledged dismiss: `idle` |
| `src/components/Calibration/WorldsQuestion.tsx` | Replaced `<Mascot>` — always `looking` (question is live) |
| `src/components/Calibration/DiscoveryAppetite.tsx` | Replaced `<Mascot>` — always `looking` (question is live) |
| `src/components/Activation/SelfieScreen.tsx` | Replaced `<Mascot>` — `looking` (explaining a feature) |
| `src/components/Calibration/TuningTransition.tsx` | Replaced CSS `.ob-generation-orb` divs — generating/acknowledging: `looking`; reveal complete: `idle` |
| `src/components/Feed/FeedScreen.tsx` | Replaced static `✦` span in reasoning bubble — `looking` on card arrival, `idle` after 2.2s |

---

## `AgentMascot` Component

**Path:** `src/components/Shared/AgentMascot.tsx`

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `agentMode` | `'idle' \| 'looking'` | `'idle'` | Controls which Rive state is active |
| `size` | `number` | `96` | Canvas width and height in px |
| `className` | `string` | `''` | Extra class on the outer wrapper div |

### How it works

1. `useRive` loads `mascot.riv` with `stateMachines: 'G_Moscot_States'` and `autoplay: true`.
2. `useStateMachineInput` fetches the `Looking` Boolean input.
3. A `useEffect` fires when `agentMode` changes and sets `lookingInput.value = (agentMode === 'looking')`.
4. A fallback `useEffect` handles cases where the Boolean input is absent, calling `rive.play(stateName)` directly.
5. The outer `div` uses CSS `transform` and `filter: drop-shadow` to create emotional nuance that goes beyond the two Rive states (see Nuance section below).

### No Rive logic scattered in screens

All Rive imports, `useRive`, `useStateMachineInput`, state machine names, and state constants are **only** in `AgentMascot.tsx`. Screens import `AgentMascot` and pass `agentMode`. Nothing else.

---

## Behavior Map

### Onboarding

| Screen | `agentMode` | Rationale |
|--------|-------------|-----------|
| Welcome | `idle` | Agent is present, waiting — calm introduction |
| Bangalore Confirm — question | `looking` | Actively asking, drawing focus to the question |
| Bangalore Confirm — "Not right now" response | `idle` | Acknowledged, settled, moving on without judgment |
| Worlds Question | `looking` | Question is live the entire time — agent is orienting the user toward the tile grid |
| Discovery Appetite | `looking` | Question is live — agent is drawing focus toward the option list |
| Selfie Screen | `looking` | Explaining a feature — agent is pointing focus at the value proposition |
| Tuning — generating phase | `looking` | Actively working — preparing recommendations |
| Tuning — acknowledging phase | `looking` | Drawing attention to the result before the reveal |
| Tuning — reveal phase | `idle` | Reveal complete — agent settles back into calm presence |

### L0 Feed (FeedScreen)

| Moment | `agentMode` | Rationale |
|--------|-------------|-----------|
| New card arrives | `looking` | Card and content are revealing — agent is presenting |
| Agent reasoning bubble visible (~2.2s window) | `looking` | Mascot embedded in the reasoning bubble is actively showing its work |
| Resting state (after 2.2s) | `idle` | Content has landed — agent returns to ambient presence |

The 2.2s window is chosen to span the full `l0-sequence` stagger (last delay: 0.58s, duration 0.72s = ~1.3s total) plus a generous settle time.

---

## Emotional Nuance Beyond Two States

Since the Rive file only has two states, all additional emotional texture comes from the **wrapper container**:

| Effect | Idle | Looking |
|--------|------|---------|
| Scale | `1.0` | `1.06` — slightly more present |
| Glow color | `rgba(112,71,226,…)` — deep purple | `rgba(192,132,252,…)` — brighter lavender |
| Glow animation speed | `2.9s` — slow organic | `1.8s` — tighter, more alert |
| `drop-shadow` | `rgba(112,71,226,0.22)` at 12px | `rgba(192,132,252,0.35)` at 20px |
| Scale transition | `0.55s cubic-bezier(0.34,1.56,0.64,1)` — spring | ← same, bidirectional |
| Opacity transition | `0.4s ease` | ← same |

These transitions are implemented in pure CSS within `AgentMascot.tsx` using co-located `<style>` keyframes — no external dependencies, no animation libraries.

---

## What Was Removed

- `Mascot.tsx` is **preserved** — `TypedLine` and `useTypedText` are still imported by onboarding screens for the typed question text. Only the `<Mascot>` JSX element calls have been replaced.
- The `respondTrigger` prop on `Mascot` and its associated `useState`/`useEffect` have been removed from `WorldsQuestion.tsx` and `DiscoveryAppetite.tsx` since `AgentMascot` does not need external trigger signals.
- The CSS `.ob-generation-orb` divs in `TuningTransition.tsx` are replaced — the styled `<div>` orbs no longer appear on the generation/reveal screens.
