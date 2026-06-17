# L0 Reasoning Two-Line + Live Highlight Fix

## File changed

`src/components/L0/CinematicL0.tsx`

---

## Root cause of all issues

`TypewriterText` renders partial text by appending `display:inline` character spans. As characters appear, the paragraph's layout recalculates on every character — this caused:
- Lines to reflow mid-type (3-line flash before settling to 2)
- Highlights only applied *after* full text was visible (post-typing second pass)
- Layout jump when `HighlightedText` replaced `TypewriterText` on `reasoningDone`

---

## Fix: `ReasoningReveal` component

Replaced `TypewriterText + HighlightedText` with a new `ReasoningReveal` component.

### How it works

1. **Full text structure rendered from frame 1** — all words, both lines, all highlight spans are in the DOM immediately. Layout is stable before any reveal begins.

2. **Two-line split** — text is split at the first `. ` boundary into `line1` and `line2`, each rendered as `display: block` spans. No `<br />` insertion that could cause reflow.

3. **Word-by-word opacity reveal** — each word starts at `opacity: 0, filter: blur(4px)`. A `setTimeout` chain advances `revealedWords` count by 1 every `REASONING_SPEED` ms. Words fade in as their index is reached.

4. **Inline highlight from the start** — `splitIntoHighlightedWords()` detects highlight phrases before render and marks them. Highlighted words carry `fontWeight: 700` and `textShadow` glow from frame 1 — they don't change style after appearing.

5. **Cursor** appears after the last revealed word until typing completes.

### Result

- No layout shift during typing
- Highlights animate in with the word they belong to — no second pass
- Two-line structure is stable from frame 1

---

## Container width changes

| Alignment | Before | After |
|-----------|--------|-------|
| left | 420px | 480px |
| center | 480px | 580px |
| right | 420px | 520px |

Wider containers give longer reasoning lines room to sit in two lines rather than three. `lineHeight` also increased from `1.65` to `1.75` for slightly more breathing room between lines.

---

## Removed

- `renderWithHighlights()` helper
- `HighlightedText` component
- The `reasoningDone ? <HighlightedText> : <TypewriterText>` branch

`reasoningDone` state is preserved — it still drives `derivedMascotMode` switching from `thinking` to `idle`.
