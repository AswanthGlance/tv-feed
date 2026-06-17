# T3 Long Weekend Refinement

## Files Changed

`src/components/T3/T3ConversationStarter.tsx` — all changes in this file only.

---

## Updated Copy

| Element | Text |
|---------|------|
| Intro line | "I've been noticing something." |
| Bridge line | "Which made me wonder..." |
| Question line 1 | Thinking about a **short escape** |
| Question line 2 | around **Aug 15–17**? |
| CTA primary | Yes, find something nearby |
| CTA secondary | Not this time |

---

## Date Signal

Top-left corner. Appears as a small card with two lines:

```
Aug 15–17
LONG WEEKEND
```

Rendered as `DateCard` — glass panel, bold date, uppercase muted label. The date is read from `GLANCE_CTX.weekendDates`, defaulting to `Aug 15–17`.

---

## Bangalore / 3-Hour Signals

Two `SignalChip` elements appear after the question:

- Bottom-left: `◈ From Bangalore` (reads `GLANCE_CTX.city`)
- Bottom-right: `⟳ Within 3 hours`

Both appear at `4.7s` together with `sigsVisible`. They are secondary — smaller, muted, do not compete with the question.

---

## Question Highlight Behavior

The question is split into two display lines, each composed of `Segment[]`:

Line 1: `Thinking about a ` + **`short escape`** (highlighted)
Line 2: `around ` + **`Aug 15–17`** (highlighted) + `?`

Highlighted segments use the same glow treatment as L0 reasoning:
- `fontWeight: 700`
- `color: rgba(255,255,255,0.98)`
- `textShadow: 0 0 12px rgba(192,132,252,0.9), 0 0 28px rgba(112,71,226,0.6)`

Char reveal runs across both lines in sequence — line 2 starts revealing only after line 1 completes (`revealedChars - LINE1_CHARS`).

---

## Animation Flow

| Time | Event |
|------|-------|
| 0.3s | Agent appears, thinking mode |
| 1.2s | "I've been noticing something." fades in |
| 2.0s | Agent shifts to looking |
| 2.4s | Date card appears top-left (Aug 15–17 / Long weekend) |
| 3.2s | "Which made me wonder..." fades in |
| 4.2s | Narration fades away; question char-reveal begins; agent returns to idle |
| 4.7s | Supporting signal chips appear (From Bangalore, Within 3 hours) |
| ~5.5s | CTAs appear (4.2s + total chars × 28ms + 0.4s buffer) |

Narration fade is driven by `narrationOpacity = s.introVisible && !s.questionActive ? 1 : 0`. A single CSS transition handles the fade — no separate state flag needed.

---

## Autoplay / Idle

Sequence runs once automatically. After CTAs appear the template holds — agent stays in idle breathing, ambient glow pulses, question remains. No auto-advance. Waits for `onYes` or `onNo`.

TV remote: `ArrowLeft` / `ArrowRight` to switch CTA focus, `Enter` / `Space` to confirm.

---

## Context Reads

| Signal | Source | Default |
|--------|--------|---------|
| City | `GLANCE_CTX.city` | `Bangalore` |
| Weekend dates | `GLANCE_CTX.weekendDates` | `Aug 15–17` |

No assumptions about destination, bookings, or existing plans.
