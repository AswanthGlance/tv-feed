# Setup + Onboarding — Cinematic Reveal & Acknowledgement Pass

## Shared Text Animation System

### CinematicText (`src/components/Shared/CinematicText.tsx`)

The approved Glance agent text animation language. Replaces TypewriterText on all onboarding screens.

**How it works:**
- All characters exist in layout at render time (no ticker, no shifting layout)
- Each character starts at `opacity: 0, filter: blur(12px)`
- On `playing=true`, GSAP stagger resolves every char: `blur(12px) → blur(0px)`, `opacity 0 → 1`
- No cursor. No terminal/chatbot feel. Letters are always in their final position — they simply become visible.

**Props:**
| Prop | Default | Description |
|------|---------|-------------|
| `text` | — | String to reveal |
| `playing` | `true` | Trigger to start the reveal |
| `speed` | `0.028` | Stagger between chars (seconds) |
| `duration` | `0.40` | Per-char resolve duration (seconds) |
| `onDone` | — | Fires when last char finishes |
| `className` | `''` | Applied to outer `<span>` — inherits typography |
| `delay` | `0` | Seconds before first char starts |

**Usage pattern:**
```tsx
<CinematicText
  text="Hello, I'm Glance."
  playing={isActive}
  speed={0.038}
  duration={0.42}
  onDone={handleDone}
  className="fg-response-text"
/>
```

---

## Onboarding Screen Updates

All agent-spoken text now uses CinematicText. TypewriterText is retired from the onboarding flow.

| Screen | What changed |
|--------|-------------|
| `WelcomeScreen` | Agent response → CinematicText |
| `BangaloreConfirm` | Question + all ack lines → CinematicText |
| `WorldsQuestion` | Question + response → CinematicText |
| `DiscoveryAppetite` | Question + response → CinematicText |
| `TuningTransition` | Narration → CinematicText |

---

## Acknowledgement Flow — BangaloreConfirm

### Problem with old flow
- User selects → card shrinks/disappears → separate text appears elsewhere
- Felt disconnected: question → answer → next question without continuity

### New flow: Selection Hero + Multi-Phrase Acknowledgement

```
User selects card
    ↓
Other card slides off (left or right)
    ↓
Selected card moves to center-hero position (scale 1.08, slight y lift)
    ↓
Question + subtitle fade
    ↓
Mascot pulses (receives input)
    ↓
Ack area appears below mascot
    ↓
Line 1 reveals: "Bengaluru."          (large, 36px, prominent)
    ↓  (380ms pause)
Line 2 reveals: "Good choice."        (medium, 32px)
    ↓  (420ms pause)
Line 3 reveals: "The city's been buzzing lately."  (small, 26px, muted)
    ↓
Ack lines fade
    ↓
Hero card floats upward → shrinks → lands as history ghost (top-left)
    ↓
Screen exits → next question
```

### Contextual Responses

**Bengaluru selected:**
1. "Bengaluru."
2. "Good choice."
3. "The city's been buzzing lately."

**Not quite selected:**
1. "Got it."
2. "I'll start broad."
3. "We can tune it as you explore."

### History Ghost

After the hero card floats upward it reappears as a small thumbnail in the top-left corner:
- 140×88px card with the selected image + label
- Soft purple glow border
- Green check badge to the right
- Communicates "I understood what you told me" throughout the next screen

---

## Motion Quality

All transitions use GSAP timelines. No cuts, no instant replacements.

Key timing values:
- Card heroize: `0.65s back.out(1.2)` — card glides to center with spring overshoot
- Other card exit: `0.45s power3.in` — snaps away cleanly
- Mascot pulse: `0.16s / 0.26s` — quick in, bouncy out
- Ack area appear: `0.38s power2.out`
- Ack line stagger: 380ms / 420ms pauses between lines
- History ghost appear: `0.45s back.out(1.3)`
- Hero card departure: `0.55s power3.in` — accelerates upward

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/Shared/CinematicText.tsx` | **NEW** — shared cinematic reveal component |
| `src/components/Activation/WelcomeScreen.tsx` | TypewriterText → CinematicText for response |
| `src/components/Activation/BangaloreConfirm.tsx` | Full rewrite: hero card flow, multi-phrase ack, history ghost |
| `src/components/Calibration/WorldsQuestion.tsx` | TypewriterText → CinematicText for question + response |
| `src/components/Calibration/DiscoveryAppetite.tsx` | TypewriterText → CinematicText for question + response |
| `src/components/Calibration/TuningTransition.tsx` | TypewriterText → CinematicText for narration |
| `src/styles/figma-onboarding.css` | Added `cr-` and `bc-` CSS namespaces |

## TypeScript

Zero errors. Verified with `npx tsc --noEmit`.
