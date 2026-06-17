# L0 Animation Lab

Experimental route for comparing agent-to-text animation systems.
**Does not touch production L0, onboarding, T2, T3, or any production templates.**

---

## Route

```
/l0_experiment
```

Also accessible via: `?l0_experiment` query param.

---

## Files Created

```
src/L0AnimationLab/
├── L0AnimationLabPage.tsx   — three-column layout + Replay All header
├── LabColumn.tsx            — shared shell (title, CTA, mascot, replay btn)
├── ModeA.tsx                — Current Cursor (production baseline)
├── ModeB.tsx                — Agent as Cursor
└── ModeC.tsx                — Agent Reveals Text

src/L0AnimationLabApp.tsx    — thin entry wrapper
```

`src/main.tsx` — added `isL0Lab` routing condition (single line, no production path changed).

---

## Content (identical across all three columns)

| Field | Value |
|---|---|
| Title | Idli at Dawn |
| Subtitle | Bangalore · Food Story |
| Reasoning | "Bangalore's breakfast culture matched your local-food picks, so I brought this forward." |
| CTA | "Show me what makes this special" |
| Mascot | `AgentMascot` (Rive, same `/public/mascot.riv`) |

---

## Mode A — Current Cursor

**Baseline.** Wraps the existing `TypewriterText` component unchanged.

- Chars revealed one-by-one, 38ms/char
- Blur-in per character (`blur(8px) → blur(0)`)
- Blinking line cursor follows last revealed character
- On done: mascot switches `thinking → looking`, pause 900ms, CTA slides up, mascot flips into CTA pill

No changes to `TypewriterText.tsx`.

---

## Mode B — Agent as Cursor

**Mascot replaces the cursor.**

- Same 38ms/char reveal, same blur-in per character
- No `|` cursor rendered
- A small `AgentMascot` (28px) sits at `position: absolute` over the text area
- After each character reveal, GSAP tracks the invisible cursor anchor span's `getBoundingClientRect()` and tweens the mascot to that position (`duration: 0.12, ease: power1.out`)
- When reveal completes: mascot fades, `looking` state, then CTA with mascot inside
- The mascot "speaks" — it moves through the sentence as the sentence appears

GSAP usage: `gsap.to(mascotRef, { x, y, duration: 0.12 })` on each character tick.

---

## Mode C — Agent Reveals Text

**Most cinematic. Least like a chatbot.**

- Full text is present in DOM from the start
- All characters start blurred (`blur(10px)`, `opacity: 0.3`)
- A 32px `AgentMascot` travels across the text, driven by a GSAP tween on a `{ progress: 0→1 }` proxy
- On each RAF tick: mascot position interpolates between character center positions
- Characters within `REVEAL_RADIUS` (28px) of the mascot center transition `blur → sharp, opacity → 1` (CSS transition `0.18s ease-out`)
- Characters already passed are fully revealed (tracked in `charReveal[]` array — values never decrease)
- A radial-gradient glow halo sits behind the mascot during travel
- Travel pace matches typewriter: `totalChars × 38ms` total duration, `ease: none`
- On complete: all chars forced to full reveal, mascot disappears, CTA sequence begins

GSAP usage:
```ts
gsap.to(proxy, {
  progress: 1,
  duration: totalChars * 0.038,
  ease: 'none',
  onUpdate: tick,   // updates mascotPos + charReveal[]
  onComplete: ...
})
```

---

## Controls

Each column has its own **↺ Replay** button (top-right of column).

The header has **↺ Replay All** — increments a React key on each mode, forcing full remount and re-run.

All modes auto-play on mount.

---

## CTA Behavior (identical across all modes)

1. Reasoning completes
2. Mascot switches to `looking`
3. 900ms pause
4. CTA pill slides up (`opacity 0→1, translateY 16→0`)
5. 500ms after CTA appears: mascot enters the pill (`mascotInCTA = true`)
6. Mascot switches to `idle`

---

## What to evaluate

| Question | What to look for |
|---|---|
| Most agentic? | Does it feel like something is *thinking*, not just printing? |
| Least like ChatGPT? | Mode A is closest to ChatGPT. B and C move away from it. |
| Most premium? | Mode C has no typing mechanics — it feels like revelation, not output. |
| Most readable? | Mode A is easiest to follow. Mode C requires tracking the mascot. |
