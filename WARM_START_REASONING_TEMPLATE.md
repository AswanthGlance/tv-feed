# Warm Start Reasoning Template

**Version:** 1.0  
**Source of truth for:** All warm-start L0 cards  
**Derived from:** Card 1 (`ws-india-afg`) — India vs Afghanistan, Tonight — fully calibrated  
**Status:** Canonical. Use this document to implement any future warm-start card.

---

## 1. Purpose

This template defines the reasoning experience shown on warm-start L0 cards.

The card's job is not to present information. It is to demonstrate that the agent **noticed**, **inferred**, and **is acting**.

The user should experience this as:

```
What I noticed about you
        ↓
What I inferred from that
        ↓
What I'm recommending as a result
        ↓
What I can do for you right now
```

Every element — signal, reasoning, CTA — must earn its place in that chain. If a signal does not connect to the reasoning, remove it. If the reasoning does not lead to the CTA, rewrite it.

---

## 2. Content Structure

A warm-start reasoning card has exactly four parts:

| Part | Count | Role |
|---|---|---|
| Signal | 2 | Evidence. What the agent observed. |
| Reasoning | 1 | Inference. Why this card is being shown now. |
| CTA | 1 | Action. What the agent can do next. |

**Hard limits:**
- Maximum 2 signals. Never 3.
- Maximum 1 reasoning block.
- Maximum 1 CTA.
- Do not show all signals simultaneously.
- Do not combine signals into a single paragraph.
- Do not show a reasoning block that is not grounded in the signals shown.

---

## 3. Signal Rules

### Sources

Signals may be sourced from any of the following:

- **Engagement:** dwell time on content categories, content replays
- **Explicit actions:** likes, bookmarks, thumbs-up, wishlist adds
- **Chat history:** questions asked, topics the user has explored with the agent
- **Onboarding preferences:** categories, discovery appetite, location
- **Viewing history:** how often, how recently, how deeply
- **Local context:** city, neighborhood, time of day, day of week
- **Calendar context:** upcoming weekend, holiday, season
- **Weather:** current or forecast conditions
- **Trending context:** live events, matches, releases, openings

### Writing rules

- **Short.** One sentence. Not a clause. Not a list.
- **Personal.** Use "you", not "users like you" or "based on your preferences."
- **Specific.** Name the content, the behavior, the time frame.
- **First-person agent voice** is optional in signals. "You did X" is preferred over "I noticed X."
- **Vary structure.** Do not start both signals the same way.
- **No jargon.** No "engagement signals", "profile data", "recommendation engine."

### Good examples

```
"You've been on IPL highlights almost every other evening since late March."
"You liked three RCB cards this season."
"You bookmarked two monsoon escape itineraries last weekend."
"You asked me about co-working spots in Indiranagar."
"You've opened the Restaurant Week card three times."
```

### Bad examples

```
"Based on your viewing history…"           ← generic, passive
"Your engagement with sports content…"     ← jargon
"We noticed you've been interested in…"    ← "we", not agent voice
"You like cricket."                        ← too vague, no specificity
```

---

## 4. Signal Animation

Each signal enters and exits independently. This is the **memory stack** pattern.

### Sequence

```
Signal 1 reveals (blur → sharp)
        ↓
5-second hold — Signal 1 is fully visible, nothing moves
        ↓
Signal 1 shifts upward
Signal 2 fades in at Signal 1's original position
Signal 2 reveals (blur → sharp)
        ↓
5-second hold — both signals are visible in stack, nothing moves
        ↓
Exit sequence begins
```

### Motion

**Signal 1 shift:**
- Direction: upward (negative Y)
- Distance: Signal 1's own rendered height + 18px gap
- Duration: 500ms
- Easing: `power2.inOut`
- Simultaneously: Signal 1 opacity drops to `0.58` (de-emphasised, still readable — "remembered signal")

**Signal 2 entrance:**
- Starts at `opacity: 0`, positioned absolutely at `top: 0` (Signal 1's original slot)
- Fades in over `300ms` as Signal 1 begins shifting
- Immediately begins blur→sharp reveal

**Waiting dots (between reveal and next phase):**
- Three dots pulse below the fully-revealed signal text
- Purpose: indicate the agent is recalling — "there is more"
- Pulse cycle: each dot rises from `opacity: 0.15` to `0.85` and back, staggered 280ms per dot, on a `repeat: -1` loop
- Disappear instantly (GSAP `opacity: 0`) when the phase transitions

### Timing constants

```
RESOLVE_MS_SIGNAL_1   = 3200ms   // Signal 1 blur → sharp
PAUSE_AFTER_SIGNAL_1  = 5000ms   // Hold after Signal 1 fully visible
SIGNAL_SHIFT_DURATION =  500ms   // Signal 1 upward shift
RESOLVE_MS_SIGNAL_2   = 3200ms   // Signal 2 blur → sharp
PAUSE_AFTER_SIGNAL_2  = 5000ms   // Hold after Signal 2 fully visible
SIGNAL_GAP_PX         =   18px   // Visual gap between stacked signals
```

---

## 5. Signal Exit

Signals exit **sequentially**. Never simultaneously.

```
Hold ends
        ↓
Signal 1 fades to opacity: 0 (700ms, power2.in)
        ↓
Signal 2 fades to opacity: 0 (700ms, power2.in)
        ↓
400ms gap (breath)
        ↓
Reasoning begins
```

The user should clearly see the evidence disappear before the conclusion arrives. This is intentional. The agent is moving from recall to synthesis.

### Timing constants

```
SIGNAL_FADE_MS        = 700ms    // Each signal independently
GAP_BEFORE_REASONING  = 400ms    // After both signals are gone
```

---

## 6. Reasoning Rules

Reasoning is the **conclusion**, not a third signal.

It must answer: **Why am I showing this card right now?**

### Structure

- 1–2 sentences. No more.
- Present-tense when referencing the event ("the match is tonight", not "there is a match").
- Connect the signals explicitly or implicitly — the reasoning should feel earned by the signals.
- Use "you" throughout. May use "I" when the agent is expressing judgment ("it felt like exactly the kind of thing…").

### Writing rules

- Do not repeat the signals verbatim.
- Do not explain what a signal is.
- Do not include a data attribution ("because you watched X").
- The **why now** must be clear: time, place, occasion, or relevance window.
- At least one phrase should be genuinely personal — not something a generic algorithm would say.

### Good examples

```
"India vs Afghanistan is at the Chinnaswamy tonight at 7 PM. It's the last group-stage
fixture before the knockouts, and it felt like exactly the kind of match you'd want to
know about early."

"The Restaurant Week pop-up opens this Friday and closes Sunday. Given how quickly these
fill up, I wanted to get this in front of you first."

"The flight fares for Goa look unusually low this weekend — monsoon pricing usually
reverses by Thursday. Felt worth flagging."
```

### Highlights

Highlight 1–2 key phrases within the reasoning using the purple glow treatment.

Highlight rules:
- Highlight the **when** (time, occasion) or the **why it matters** phrase
- Do not highlight generic words ("tonight", "match", "trip")
- Highlight noun phrases, not individual words
- Maximum 2 highlight spans per reasoning block

---

## 7. Reasoning Animation

Use `GlanceTextReveal` with these parameters:

```
resolveMs:       7000ms    // Very slow — prioritize readability
resolvedOpacity: 0.82      // Slightly subdued over dark BG
twoLine:         false     // Do not force line breaks
highlights:      [...]     // 1–2 key phrases
```

**Blur → sharp character reveal.** No cursor. No typewriter. The thought comes into focus — it is not typed.

`onDone` fires after the **last character** has resolved. Do not use a fixed timer offset from when the reveal starts. Wire `onDone` to a callback that starts the post-reasoning hold.

---

## 8. Post-Reasoning Pause

After `GlanceTextReveal.onDone` fires:

```
Hold: 5000ms
```

Do nothing. Do not move the agent. Do not animate. Do not prepare CTA.

The user is reading. The agent is waiting.

After the hold: fire `onSequenceDone` → CTA sequence begins.

```
PAUSE_AFTER_REASONING = 5000ms
```

---

## 9. CTA Transition

After `onSequenceDone` fires, the GSAP timeline seeks to `heroShrink` and the standard sequence plays. This sequence is managed by `buildColdStartL0Timeline` and must not be modified.

```
Agent looks toward CTA                   (~0.65s)
        ↓
CTA pill slides in                       (~0.46s)
        ↓
Mascot arc-flip from hero position       (~0.75s)
        ↓
Mascot settles inside CTA               (~0.38s delay)
        ↓
CTA text reveals (blur → sharp)          (3000ms)
        ↓
CTA glow / beam activates               (~0.15s after text)
        ↓
onTimelineComplete fires                 (~0.30s after beam)
```

This sequence is **fixed**. Do not change the order. Do not skip steps. Do not add steps.

---

## 10. CTA Rules

The CTA represents **an action the agent can take on the user's behalf.**

It is not a navigation label. It is not a "Learn more" button. It is an offer.

### Format

```
"[Verb phrase]?"
```

Always a question. The agent is asking permission, not issuing a command.

### Good examples

```
"Set a reminder for first ball?"
"Want me to shortlist a few stays?"
"Queue it up for tonight?"
"Find tickets near Indiranagar?"
"Remind me before it sells out?"
```

### Bad examples

```
"View now"              ← command, not agentic
"Explore more"          ← generic
"Sports Pick"           ← category label, not action
"Tell me more"          ← vague
```

### CTA reveal speed

```
CTA_RESOLVE_MS = 3000ms   // Slower than standard (1400ms) — deliberate, settled
```

---

## 11. Final Hold

After `onTimelineComplete` fires:

```
Hold: 10 seconds
```

The full card is visible:
- Background image
- Title + tag
- Reasoning (fully revealed)
- CTA with mascot inside, glow active

Then auto-advance to the next card.

```
HOLD_AFTER_COMPLETE_MS = 10_000   // in WarmProfile1App.tsx (and future warm app files)
```

---

## 12. Design Language

### Typography

| Element | Font | Weight | Size | Opacity |
|---|---|---|---|---|
| Category tag | Plus Jakarta Sans | 700 | `clamp(8px, 0.8vw, 11px)` | `0.72` |
| Card title | Plus Jakarta Sans | 700 | `clamp(18px, 2.2vw, 34px)` | `0.88` |
| Signal text | Plus Jakarta Sans | 400 | `clamp(15px, 1.75vw, 26px)` | `0.92` |
| Reasoning text | Plus Jakarta Sans | 400 | `clamp(14px, 1.55vw, 24px)` | `0.82` |
| CTA label | Plus Jakarta Sans | 600 | `clamp(13px, 1.35vw, 20px)` | `1.0` (on white pill) |

### Highlight treatment

Purple glow. Applied to key phrases in both signals and reasoning.

```css
font-weight: 700;
color: rgba(255, 255, 255, 0.98);
text-shadow:
  0 0 12px rgba(192, 132, 252, 0.9),
  0 0 28px rgba(112,  71, 226, 0.6);
```

Source: `GLANCE_HIGHLIGHT_STYLE` in `src/components/Shared/GlanceTextReveal.tsx`.

### Signal spacing

- Gap between stacked signals: **18px**
- Signal line-height: **1.65**
- Signal letter-spacing: **0.1**

### Reasoning spacing

- Below signals / between reasoning and CTA: `clamp(18px, 2.8vh, 32px)` margin-bottom
- Reasoning line-height: **1.65**

### Overlay

Three-layer gradient behind all content:

```css
background:
  linear-gradient(to top,   rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.50) 28%, rgba(0,0,0,0.06) 55%, transparent 70%),
  linear-gradient(to bottom, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.22) 18%, transparent 38%),
  linear-gradient(to right,  rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 40%, transparent 65%);
/* For right-aligned cards, replace the third layer with `to left` direction */
```

### Agent / mascot

| State | When |
|---|---|
| `thinking` | While signal sequence is running |
| `looking` | After `onAgentLook` fires (transition to CTA) |
| `idle` | All other times |

Hero size: **80px**. Final/CTA size: **52px**.

---

## 13. Supported Alignments

The reasoning structure, timing, and all copy rules are **identical** across alignments. Only geometric layout changes.

| Property | Left | Center | Right |
|---|---|---|---|
| `contentLeft` | `clamp(20px, 4.5vw, 88px)` | `50%` | — |
| `contentRight` | — | — | `clamp(20px, 4.5vw, 88px)` |
| `contentWidth` | `clamp(240px, 52vw, 860px)` | `clamp(400px, 72vw, 1100px)` | `clamp(400px, 80vw, 1100px)` |
| `textAlign` | `left` | `center` | `right` |
| `ctaJustify` | `flex-start` | `center` | `flex-end` |
| Mascot position | Inline left of reasoning | Centered above reasoning | Inline right of reasoning |
| Content `transform` | none | `translateX(-50%)` | none |
| Overlay gradient direction | `to right` | `to right` | `to left` |
| Waiting dots justify | `flex-start` | `center` | `flex-end` |

---

## 14. Complete Timing Reference

```
t=0ms       BG + parallax starts
t≈400ms     Overlay fades in
t≈900ms     Header appears (first card only)
t≈1100ms    Tag + title reveal
t=1350ms    Mascot floats in (hero size, 550ms entrance)
t=1930ms    Reasoning container appears; signal sequence starts (onTypingStart)
            └─ t=0ms (relative)   Signal 1 reveal starts          (3200ms)
            └─ t=3200ms           Signal 1 done → dots appear
            └─ t=8200ms           5s hold ends; S1 shifts up; S2 enters (3200ms)
            └─ t=11400ms          Signal 2 done → dots appear
            └─ t=16400ms          5s hold ends; S1 fades          (700ms)
            └─ t=17100ms          S2 fades                        (700ms)
            └─ t=17800ms          Both signals gone
            └─ t=18200ms          Reasoning reveal starts         (7000ms)
            └─ t=25200ms          Reasoning fully visible
            └─ t=30200ms          5s hold ends → onSequenceDone fires

t=onSequenceDone  GSAP seeks to heroShrink label
            └─ Agent looks toward CTA                            (~650ms)
            └─ CTA pill slides in                                (~460ms)
            └─ Mascot arc-flip                                   (~750ms)
            └─ Mascot settles                                    (380ms delay)
            └─ CTA text reveal                                   (3000ms)
            └─ Beam / glow activates                            (~150ms)
            └─ onTimelineComplete fires                         (~300ms)

t=onTimelineComplete  10-second hold → auto-advance
```

**Total card duration (approximate): ~47–50 seconds**

---

## 15. Implementation References

### Core components

| Component | Path | Role |
|---|---|---|
| `SignalDecisionReasoning` | `src/components/L0/SignalDecisionReasoning.tsx` | Manages signal + reasoning sequence for Card 1. Copy this as the base for future warm cards. |
| `WarmProfile1CinematicL0` | `src/components/L0/WarmProfile1CinematicL0.tsx` | Full card renderer. Forks `ColdStartCinematicL0`. Handles GSAP timeline, mascot, CTA. |
| `WarmProfile1L0Glance` | `src/components/L0/WarmProfile1L0Glance.tsx` | Router: directs Card 1 to `WarmProfile1CinematicL0`, all others to `ColdStartL0Glance`. |
| `GlanceTextReveal` | `src/components/Shared/GlanceTextReveal.tsx` | Shared blur→sharp reveal. Use for all signal, reasoning, and CTA text. |
| `AgentMascot` | `src/components/Shared/AgentMascot.tsx` | Rive mascot. Pass `agentMode: 'thinking' | 'looking' | 'idle'`. |

### Animation utilities

| Utility | Path | Role |
|---|---|---|
| `buildColdStartL0Timeline` | `src/animations/coldStartL0Timeline.ts` | Builds the GSAP timeline for the full card. Pass `typingDuration: SEQUENCE_DURATION_MS` as ceiling. |
| `killColdStartL0Timeline` | `src/animations/coldStartL0Timeline.ts` | Cleans up on unmount. |

### Key constants to set per card

```typescript
// In the cinematic component (WarmProfile1CinematicL0 equivalent):
const SEQUENCE_DURATION_MS = 33000;  // Ceiling. Must be > total sequence time.
const CTA_RESOLVE_MS       = 3000;   // CTA text reveal duration.

// In SignalDecisionReasoning (or equivalent):
const RESOLVE_MS_SIGNAL_1     = 3200;
const PAUSE_AFTER_SIGNAL_1    = 5000;
const SIGNAL_SHIFT_DURATION   =  500;
const RESOLVE_MS_SIGNAL_2     = 3200;
const PAUSE_AFTER_SIGNAL_2    = 5000;
const SIGNAL_FADE_MS          =  700;
const SIGNAL_GAP_PX           =   18;
const GAP_BEFORE_REASONING    =  400;
const RESOLVE_MS_REASONING    = 7000;
const PAUSE_AFTER_REASONING   = 5000;
```

### Profile overrides

Card-specific reasoning and highlights are injected via `setProfileOverrides()` in `src/logic/reasoningEngine.ts`.

```typescript
setProfileOverrides(
  { 'item-id': "Reasoning text here." },
  { 'item-id': ['Highlight phrase 1', 'Highlight phrase 2'] },
);
```

Call this once at module load in the app file (e.g., `WarmProfile1App.tsx`).

### heroShrink interop pattern

The GSAP timeline has a fixed `heroShrink` label. Because the signal sequence is React-driven (not GSAP), the timeline cannot know when it ends. The pattern:

1. Pass an oversize `typingDuration` ceiling so GSAP never auto-fires `heroShrink`
2. When `onSequenceDone` fires, compute `heroShrinkSec = 1.93 + SEQUENCE_DURATION_MS/1000 + 1.0`
3. Call `tlRef.current.seek(heroShrinkSec - 0.05)` to jump the timeline to that label
4. GSAP continues naturally from there: mascot shrink → CTA entrance → beam → complete

---

## 16. Checklist for New Warm Cards

Use this before marking a warm card as done.

**Content**
- [ ] Exactly 2 signals, each one sentence
- [ ] Signals are personal, specific, first-person "you"
- [ ] Signals have keyword highlights (1–2 terms each)
- [ ] Reasoning is 1–2 sentences, answers "why now"
- [ ] Reasoning has 1–2 highlights
- [ ] Reasoning does not repeat signal text verbatim
- [ ] CTA is a question, represents an agent action

**Timing**
- [ ] Signal 1 hold is 5 seconds
- [ ] Signal 2 hold is 5 seconds
- [ ] Signals exit sequentially (not simultaneously)
- [ ] Reasoning reveal is 7000ms or slower
- [ ] Post-reasoning hold is 5 seconds before CTA
- [ ] Final hold is 10 seconds after CTA reveal
- [ ] `SEQUENCE_DURATION_MS` ceiling is at least 3s above actual sequence end time

**Animation**
- [ ] Signal 1 shifts upward when Signal 2 enters
- [ ] Signal 2 enters at Signal 1's original position
- [ ] Waiting dots appear after each signal reveal
- [ ] No two animation phases overlap
- [ ] `onSequenceDone` fires from `GlanceTextReveal.onDone`, not a fixed timer

**Design**
- [ ] Font is Plus Jakarta Sans
- [ ] Signal opacity: `0.92`
- [ ] Reasoning opacity: `0.82`
- [ ] Highlights use `GLANCE_HIGHLIGHT_STYLE`
- [ ] Alignment geometry matches `GEO` table in Section 13
