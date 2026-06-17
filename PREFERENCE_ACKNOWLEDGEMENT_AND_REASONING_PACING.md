# Preference Acknowledgement & Reasoning Pacing

## Part 1 — Reasoning Pause (L0 templates)

**File:** `src/animations/l0Timeline.ts`

The `heroShrink` label (which collapses the hero reasoning state and begins the CTA transition) previously fired 0.25s after typing finished. It now fires **1.0s after typing finishes**.

This gives the user a deliberate pause to absorb what Glance just told them before anything moves. The reasoning stays at full hero size — agent present, text fully visible — for one full second. The pause is intentional and applies to all three templates (left, center, right).

```
Before: heroShrink at typingStart += secsReasoning + 0.25
After:  heroShrink at typingStart += secsReasoning + 1.0
```

---

## Part 2 — Preference Question Keyword Highlights

**File:** `src/components/Polls/InterstitialQuestion.tsx`

Added `HighlightText` component — uses the same highlight style language as L0 reasoning:

- Keywords rendered with `fontWeight: 600`, `color: rgba(255,255,255,0.97)`, subtle `textShadow` with purple glow
- No neon, no color blocks — same premium emphasis used in L0
- Applied to the celebration reply text after the user confirms their selection

**Keyword list covers:** South Indian, Asian, Cafés, bakes, home-cooked, street food, fine dining, Heritage, Nature, City energy, mood/vibe words (Slow, calm, Lively, warm, cosy, Minimal, Green), and destination keywords (mountain, Nordic, Ancient).

Highlights are built by longest-match-first to avoid partial matches ("South Indian" before "Indian").

---

## Part 3 — Preference Acknowledgement Celebration

**File:** `src/components/Polls/InterstitialQuestion.tsx`

### Flow

```
User selects → Done / single pick
↓
Headline + caption + buttons exit (fade up, 0.28s)
↓
Selected cards scale forward (scale 1.05) + soft white border + purple glow ring
Unselected cards recede (opacity 0.28, scale 0.88)
↓
Mascot pulses (scale 1.18, yoyo) — recognises the action
Mascot fades from question area
↓
Celebration panel fades in center-screen (after 420ms)
↓
Structured reply types in (three lines with pauses)
↓
Exit fade → onAnswer fires → next feed item
```

### Structured Reply

Replaced the flat single-line `REPLY_MAP` with `REPLY_LINES` — a three-line structure:

| Line | Role | Style | Pause after |
|------|------|-------|-------------|
| 0 | Selection echo — names what was picked | `fontWeight: 500`, 18–28px | 600ms |
| 1 | Short acknowledgement — "Got it." / "Noted." | `fontWeight: 700`, 22–36px, brighter | 400ms |
| 2 | Feed action promise — "I'll tune your feed…" | `fontWeight: 500`, 18–28px | — |

Line 1 (the ack) is the largest and heaviest — this is the moment the system says it understood. Keywords in all lines receive the `HighlightText` treatment after they've fully typed.

### Selected Card Animation

Selected cards receive a GSAP tween (not a CSS transition) to avoid fighting with existing React inline transitions:
- `scale: 1.05`
- `boxShadow` includes: white border ring + deep shadow + subtle purple glow halo
- Fires 50ms after phase change (gives time for React state to settle)

Unselected cards recede to `opacity: 0.28`, `scale: 0.88`.

### Celebration Panel

Centered absolutely over the card grid. Contains:
- `AgentMascot` at 96px with a radial purple glow behind it (same glow technique as old reply phase)
- `StructuredReply` component — manages three-line sequencing with inter-line pause timers
- `opacity: 0` initially; GSAP fades it in with `y: 18 → 0` + `blur(6px) → 0`

### Phase Model

The old `'reply'` phase is replaced with `'celebration'`. The `'exit'` phase remains — fires after `StructuredReply` completes plus a 600ms hold.

```
'question' → 'celebration' → 'exit' → onAnswer()
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/animations/l0Timeline.ts` | Reasoning pause: `heroShrink` offset changed from `+0.25` to `+1.0` |
| `src/components/Polls/InterstitialQuestion.tsx` | Full celebration flow, `HighlightText`, `StructuredReply`, `REPLY_LINES`, selected card animation, phase renamed |
