# Preference Selection Celebration — Refinement

## What Changed

Full rewrite of the celebration phase in `InterstitialQuestion.tsx`.

---

## 1. Selected Cards Move to Center

Previously: selected cards scaled in-place at their grid position.

Now: the **entire cards row slides up** (`y: -18vh`) after unselected cards exit and selected cards scale forward — this "promotes" the selection to the upper half of the screen, creating a true hero moment.

**GSAP sequence:**
1. Unselected cards: `scale 0.78, opacity 0, y: +12` — removed from attention (0.32s)
2. Selected cards: `scale 1.08` + bright white border ring + subtle purple halo (0.52s, delay 0.1s)
3. Entire `cardsRef` row: `y: -18vh` translate upward (0.62s, starts at 220ms)
4. Explore card (if present): fades out with unselected

---

## 2. No Overlap — Strict Vertical Layout

Previously: celebration panel was `position: absolute, top: 50%, left: 50%` — overlapped the card grid.

Now: the celebration panel is anchored to the **bottom** of the screen:

```
position: absolute
bottom: clamp(60px, 10vh, 110px)
left: 50%
transform: translateX(-50%)
```

This means:
- Cards lift up → occupy upper ~50–60% of screen
- Agent + reply text sit in the lower ~30–40% of screen
- **Zero overlap by construction** — no z-fighting

---

## 3. Celebration Panel Layout: Agent → Text

The panel is a `flex-direction: column, align-items: center` container:

```
[Agent mascot at 88px — thinking mode — with radial purple glow]
[Structured reply — three lines with pauses]
```

No additional header, caption, or decorative elements. The panel itself is minimal so the selected cards remain the visual hero.

---

## 4. Question Typography — Mixed Weight

Previously: entire question headline was `fontWeight: 800` (uniform heavy).

Now:
- Base: `fontWeight: 400`, `color: rgba(245,243,247,0.88)` — regular weight
- `highlightPhrases` from `QuestionConfig`: rendered via `HighlightText` with `fontWeight: 800` + premium purple glow (`textShadow: 0 0 18px rgba(192,132,252,0.7)`)
- During typing (TypewriterText): plain text — no mid-type highlighting
- After typing completes: `HighlightText` renderer swaps in — only the keyphrase pops

This matches the spec: "Let me sharpen your **food feed** — what are you into?" where only "food feed" gets the emphasis.

---

## 5. HighlightText Rendering — Identical to L0

Same style as L0 reasoning highlights:
- `fontWeight: 800`
- `color: rgba(255,255,255,0.98)`
- `textShadow: 0 0 18px rgba(192,132,252,0.7), 0 0 36px rgba(112,71,226,0.35)`

No neon, no color blocks. Premium white with purple atmosphere.

Used in:
- Question headline (phrases from `question.highlightPhrases`)
- Structured reply lines (shared keyword list in `REPLY_HIGHLIGHT_PHRASES`)

---

## 6. Structured Reply — Unchanged Timing

Three-line sequence remains:

| Line | Role | Pause after |
|------|------|-------------|
| 0 | Selection echo ("South Indian and Asian.") | 650ms |
| 1 | Ack ("Got it.") — largest, boldest | 500ms |
| 2 | Feed promise ("I'll tune your feed…") | 800ms → exit |

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/Polls/InterstitialQuestion.tsx` | Full rewrite: card lift animation, bottom-anchored celebration panel, mixed-weight headline |

## Files Unchanged

- `src/data/preferenceQuestions.ts` — `highlightPhrases` was already added in the previous session
- `src/animations/l0Timeline.ts` — untouched
- `src/components/L0/CinematicL0.tsx` — untouched
- All onboarding screens — untouched
