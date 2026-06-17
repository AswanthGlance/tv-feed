# Feed Preference Collection Template

**Version 1.1 — June 2026**

This document is the single source of truth for the Preference Collection interaction pattern
in Glance. It covers design language, visual structure, interaction flow, animation system,
and data schema.

A different agent should be able to read only this document and recreate the exact interaction
in a completely different context — setup flow, onboarding, shopping intent, travel, or any
future Glance surface.

---

## 1. Template Purpose

This template is used whenever Glance wants to learn something from the user while maintaining
a conversational, premium experience.

The goal is a four-beat interaction:

```
Learn → Acknowledge → Remember → Continue
```

**Learn:** Surface a visually rich question with image-backed option cards. Never a form.
Never a survey. The user should feel like they are choosing a direction, not filling in a field.

**Acknowledge:** After selection, the agent names what was chosen in natural language, confirms
it, and states the implication for the feed. Short. Conversational. Never robotic.

**Remember:** The selected cards physically move to a center stage position. They do not
disappear. They do not fade out and get replaced. The user watches the system capture and stack
their answer. The feeling is: *my answer was held, not discarded.*

**Continue:** The experience fades and the feed resumes — or the next step in a flow begins —
without a full-page transition or hard cut.

### When to use this template

- Feed tuning interstitials (current use)
- Cold-start onboarding preference collection
- Setup flow intent capture (travel, shopping, content tone)
- Personalization refinement after user actions
- Any agent question where the answer should feel consequential

### When NOT to use this template

- Binary yes/no confirmation dialogs
- Error or warning states
- Navigation choices without preference signal value
- Anything requiring more than 4 options visible simultaneously

---

## 2. Visual Structure

The screen has five distinct layers, rendered in z-order:

```
[ Layer 1 ] Background — full-bleed image, heavily blurred and darkened
[ Layer 2 ] Overlay — gradient scrim, dark-to-darker from edges to bottom
[ Layer 3 ] Header — logo left, clock/weather right — always present
[ Layer 4 ] Question UI — agent, headline, caption, option cards, action area
[ Layer 5 ] Fly Layer — ghost card clones during FLIP animation (phase 2 only)
[ Layer 6 ] Agent + Reply — appears below deck after cards settle (phase 2 only)
```

### Visual hierarchy within the Question UI (top to bottom, centered)

```
AgentMascot (looking mode, 80px)
↓
Question headline (large, conversational)
↓
Caption label ("Pick one" or "Pick a few" — small, uppercase, purple-tinted)
↓
Option Cards (horizontal row, equal width, full-bleed images)
↓
Action buttons (multi-select only: "Select All" + "Done")
↓
Nav hint (very small, bottom center, keyboard shortcuts)
```

The layout is vertically centered in the viewport with generous top padding
to account for the header bar.

### Background treatment

The background image is always the previous L0 card's image — not a new asset.
This creates visual continuity: the preference card feels like a pause within the
feed, not a redirect to a different surface.

Treatment: `filter: blur(36px) brightness(0.28) saturate(0.55)` with `scale(1.1)`
to prevent blur edges from showing.

If no previous image is available, the background falls back to a deep dark purple
(`#080416`) with the same overlay.

---

## 3. Question Design

### Schema

Every question is a `QuestionConfig` object:

```ts
type QuestionConfig = {
  id: string;                  // unique slug, e.g. 'food-picks'
  surface: 'setup' | 'interstitial' | 'interaction';
  template: 'scenario' | 'single-select' | 'multi-select' | 'follow-up';
  question: string;            // the headline text shown to the user
  highlightPhrases?: string[]; // substrings that receive purple glow treatment
  subtext?: string;            // optional subtitle (shown below headline)
  bgImage?: string;            // fallback background image path
  options: QuestionOptionConfig[];
  autoDismissMs: number;       // 0 = no auto-dismiss; >0 = progress bar countdown
  skipBehavior: 'no-signal' | 'session-only';
  gapAxis?: string;            // e.g. 'cat:food' — axis this question fills
  triggerAfterCards?: number;  // min L0 cards seen before this fires
  cooldownKey?: string;        // prevents re-asking same topic
  expectedSignalGain: number;  // 1–5 estimate
};
```

### Question headline copy rules

- Write in the first person from the agent, not as a survey prompt.
  - Good: *"Which trip are you taking?"*
  - Good: *"Let me sharpen your food feed — what are you into?"*
  - Bad: *"Please select your food preferences."*
- Keep it to a single sentence. No more than 12 words.
- One phrase — typically 1–3 words — should be marked as `highlightPhrases`.
  This phrase receives the purple glow treatment at rest (after typewriter completes).
- The question is delivered as a typewriter animation at 30ms/char with cursor.
  After the typewriter completes, the cursor disappears and highlight phrases light up.

### Caption label

Below the headline, in small uppercase purple-tinted text:
- `"Pick one"` for scenario / single-select templates
- `"Pick a few"` for multi-select templates

This label is the only instruction the user needs. It is not a label for a form.

### Option count

- Minimum: 2 options
- Maximum: 4 options visible simultaneously
- All options must be genuine preference signals — no utility shortcuts ("Explore more", "Skip")
- For multi-select: a "Done" button and "Select All" button appear below the cards

---

## 4. Option Card Design

### Schema

```ts
type QuestionOptionConfig = {
  id: string;
  label: string;              // primary label, shown below image
  sublabel?: string;          // secondary label (currently not rendered — reserved)
  image?: string;             // full-bleed background image path
  emoji?: string;             // reserved for future compact variant
  boosts: AttributeBoosts;    // ML signal payload
  confirmationText: string;   // copy for agent's first reply line
};
```

### Visual anatomy

```
┌─────────────────────────────┐
│                             │
│   [full-bleed image]        │  ← backgroundImage, cover, center
│                             │
│   [check badge top-right]   │  ← 28×28px circle, white bg, ✓
│                             │
│                             │
│   [gradient scrim bottom]   │  ← rgba(4,2,14,0.88)→transparent
│                             │
│   [Label text]              │  ← bottom-left, white, 700 weight
└─────────────────────────────┘
```

### Rules

- Text label is always **below** the image, inside a bottom gradient scrim.
  Never overlay white text on raw image without the scrim.
- Cards use `flex: 1` — they share the row width equally regardless of count.
- Card height: `clamp(240px, 32vh, 380px)` — consistent across all options.
- Border radius: `clamp(14px, 1.6vw, 22px)`.
- Background color fallback (if no image): `#0d0820`.

### Selection states

| State | Border | Transform | Shadow | Check badge |
|---|---|---|---|---|
| Default | `1.5px rgba(255,255,255,0.1)` | `scale(0.94)` | `0 4px 20px rgba(0,0,0,0.35)` | Dark circle, hidden ✓ |
| Focused (keyboard/hover) | `2.5px rgba(255,255,255,0.9)` | `scale(1.06)` | `0 12px 48px rgba(0,0,0,0.6)` | Dark circle, hidden ✓ |
| Selected | `2.5px rgba(255,255,255,0.9)` | `scale(1.06)` | `0 12px 48px rgba(0,0,0,0.6)` | White fill, `✓` visible |

All state transitions use `transition: 0.25s cubic-bezier(0.22,1,0.36,1)`.

The scale contrast (0.94 default, 1.06 focused) is intentional — it makes the focused
card obviously prominent on a 10-foot TV display where cursor precision is unavailable.

---

## 5. Selection Flow

The full sequence from user action to feed resume:

### Phase 1: Question (initial state)

Cards are visible. Agent is in `looking` mode. Headline has typewriter-typed. The user
browses with ← → arrows or mouse hover. Focus state tracks the active card visually.

### Phase 2: Commit (triggered by Enter/click for single-select, Done button for multi-select)

This is the FLIP animation phase. **No card is recreated or replaced during this entire phase.**
The same DOM elements physically move.

```
Step 1 — Capture source rects
  getBoundingClientRect() on each selected card element
  Capture immediately, before any DOM mutation

Step 2 — Hide originals
  gsap.set(selectedEl, { opacity: 0 })
  Original cards become invisible — ghosts take their position

Step 3 — Create ghost clones
  For each selected card, a new <div> is appended to the fly layer (z-index 40)
  Ghost positioned absolutely at exactly the captured source rect
  Ghost carries: backgroundImage, gradient overlay, ✓ badge, label text
  Ghost has white glow border: box-shadow: 0 0 0 2px rgba(255,255,255,0.82),...

Step 4 — Exit question UI
  gsap.to(questionRef, { opacity: 0, duration: 0.28 })
  gsap.to(unselectedCards, { opacity: 0, scale: 0.82, y: 10, duration: 0.3, stagger: 0.06 })

Step 5 — Compute target position
  Center of screen, vertically in upper portion
  Available height = screen height − header (72px) − agent block (200px) − padding (32px)
  Cards scale down only if a single card height exceeds available space
  Target: horizontally centered, vertically centered in available space

Step 6 — Flight animation
  Each ghost animates: { left, top, width, height } → target rect
  Duration: 0.62s, ease: power3.inOut
  Back-of-deck cards (i > 0) start 0.06s later per card so front card leads

Step 7 — Settle into deck (multi-select only)
  After flight lands, each card applies deck offset:
    Card 0 (front): rotate -2°, x 0,  y 0,   scale 1.00, opacity 1.00
    Card 1 (mid):   rotate +5°, x 10, y 10,  scale 0.97, opacity 0.90
    Card 2 (back):  rotate -7°, x -8, y 18,  scale 0.94, opacity 0.75
  Duration: 0.38s, ease: back.out(1.3) — slight spring overshoot

Step 8 — Agent appears below the deck
  Position: top of deck + deck height + 32px
  Entrance: fromTo { opacity:0, y:18, filter:blur(8px) } → { opacity:1, y:0, blur(0) }
  Duration: 0.48s, ease: power3.out

Step 9 — Agent reply begins
  StructuredReply component starts playing (see Section 7)

Step 10 — Exit
  After reply completes (+ 600ms pause):
  Background, overlay, header, agent, fly layer → opacity 0 (0.5s, power2.in)
  Ghost divs removed from DOM
  onAnswer() callback fires → feed resumes or next step begins
```

### Timing summary

| Beat | Duration |
|---|---|
| Question UI exit | 0.28s |
| Unselected cards exit | 0.30s |
| Ghost flight | 0.62s |
| Deck settle | 0.38s |
| Agent entrance | 0.48s |
| Reply (3 lines) | ~4–6s |
| Post-reply pause | 0.60s |
| Full exit fade | 0.50s |

---

## 6. Center-Stage Acknowledgement Sequence

This section defines a mandatory atomic sequence that must be present in every
implementation of this template. It is not optional. It is not an enhancement.

It is the emotional confirmation moment — the beat where the user feels:

> *"I gave Glance input. Glance understood it. Glance will use it."*

Any future flow using this template — setup, onboarding, feed interstitial, travel
intent, shopping intent, or any other surface — must include this sequence exactly
as described. Do not skip it. Do not abbreviate it.

---

### The 11-step sequence

```
Step 1  — User selects one or more preference cards
Step 2  — User confirms: single-select triggers immediately on click/Enter;
          multi-select triggers when user presses "Done"
Step 3  — Question UI exits: headline, caption, unselected cards fade and recede
Step 4  — Non-selected cards fade to opacity 0, scale 0.82, y +10 (0.30s)
Step 5  — Selected cards physically move to the center of the screen
          (the same cards — not recreations, not summary chips)
Step 6  — Selected cards settle at center: single card lands flat;
          multiple cards settle into a physical deck with rotation offsets
Step 7  — Agent appears directly below the settled cards
          (blurs in from opacity 0, y +18, blur(8px) → visible in 0.48s)
Step 8  — Agent speaks an acknowledgement:
            Line 1: Echo — names exactly what was selected
            Line 2: Affirm — one short warm word
            Line 3: Implication — states what changes in the feed
Step 9  — Agent acknowledgement text uses TypewriterText (character-by-character,
          with cursor, three separate lines with deliberate pauses between them)
Step 10 — After acknowledgement completes: background, overlay, header, agent,
          and cards all fade out together (0.5s, power2.in)
          Cards remain visible during the first ~200ms of this fade —
          the user watches their answer dissolve, not vanish
Step 11 — onAnswer() fires → feed resumes or next step in flow begins
```

---

### Why this sequence is mandatory

The sequence exists because acknowledgement without physical confirmation is
insufficient. Showing a text message alone ("Got it.") does not create the
feeling of being understood.

The emotional logic requires all three of:

1. **The cards moved** — the user sees the thing they chose go somewhere
2. **The agent named it** — the system played back what it heard
3. **The implication was stated** — the user knows what changes next

Remove any one of these and the interaction becomes a form submission, not a
conversation.

---

### Card motion rule: same card, not a recreation

The selected cards must not be recreated, replaced, or teleported.
**The same content physically flies from where it was to where it lands.**

This is the FLIP (First, Last, Invert, Play) technique applied to DOM elements.

The user's eye tracks the card they chose across the screen. If a new element
appears at the destination instead, the eye detects the discontinuity even if
the user cannot name it. The feeling shifts from "my choice was held" to
"the system made a summary."

**Implementation rule:** Ghost clones are created at the exact captured pixel
position of the original cards, carry the full original visual (image, gradient,
label, check badge), and GSAP animates them to center via `left`, `top`, `width`,
`height` — not transform. The fly layer (`z-index: 40`) is outside React's rendering
lifecycle so no layout recalculation interrupts the FLIP.

### Multi-select shape rule: keep card form, stack vertically

When multiple cards are selected:

- Each card **keeps its original card shape** — full-bleed image, rounded corners,
  label at bottom
- Cards **stack as a physical deck** at center — slight rotation and z-offset per card
- Cards do **not** convert to chips, pills, tags, or a summary row
- Cards do **not** resize into a new layout

The deck communicates "I am holding a collection of your choices" — a stack of
physical objects, not a list.

Deck offsets (settled state):
```
Card 0 (front): rotate -2°, x  0, y  0,  scale 1.00, opacity 1.00
Card 1 (mid):   rotate +5°, x 10, y 10,  scale 0.97, opacity 0.90
Card 2 (back):  rotate -7°, x -8, y 18,  scale 0.94, opacity 0.75
```

### Agent position during acknowledgement

The agent appears **below the settled card deck**, not above it.
Position: `top = (deck top position) + (deck height) + 32px`, horizontally centered.

The agent is in `thinking` mode (76px) with a purple radial glow.
It blurs in after the deck has fully settled — never before.

The agent speaks downward from the deck toward the user. The deck is prominent.
The agent is secondary. The user reads: "the cards are front and center, the agent
is commenting on them."

---

## 7. Agent Acknowledgement

After the cards land, the agent appears below the deck in `thinking` mode with a purple
radial glow and delivers a structured three-line reply.

### The three lines

```
Line 1 — Echo:        Names what was selected. Ends with a period.
Line 2 — Affirm:      Short. One or two words. Warmly confirms.
Line 3 — Implication: States what changes. Future tense.
```

**Examples (single selection):**

| Selection | Line 1 | Line 2 | Line 3 |
|---|---|---|---|
| South Indian | "South Indian food." | "Got it." | "I'll bring more South Indian to your feed." |
| Into nature, slowly | "Slow nature travel." | "Noted." | "Your feed is shifting around that." |
| Calm and winding down | "Slow and calm evenings." | "Noted." | "I'll tune your feed around that pace." |
| Something I haven't seen | "Something unexpected." | "Love that." | "On it." |

**Examples (multi selection, 2 options):**

Constructed dynamically: `"[Label A] and [Label B]."` → `"Got it."` → `"I'll tune your feed in that direction."`

**Examples (multi selection, 3+ options):**

`"[Label A], [Label B], and [Label C]."` → `"Got it."` → `"I'll tune your feed in that direction."`

### Tone rules

- Line 1 mirrors the user's exact choice language. It does not editorialize.
- Line 2 is the warmest beat. Use: "Got it." / "Noted." / "Perfect." / "Love that."
  Vary by context. Avoid repeating the same affirmation across consecutive questions.
- Line 3 is forward-looking. Always starts with "I'll..." or names the feed directly.
  Never use passive voice ("Your preferences have been updated").
- Never use: "Great choice!", "Excellent!", "Amazing!", "Wonderful!"
- Never explain the ML. No "This will update your recommendation weights."

### Animation

Line 1, 2, 3 are revealed sequentially by `TypewriterText` at different speeds:
- Line 1: 40ms/char (slower — mirroring the echo back deliberately)
- Line 2: 55ms/char (faster — punchy short word)
- Line 3: 36ms/char (flowing — forward-looking statement)

After each line completes typewriter, the next line starts after:
- After Line 1: 650ms pause
- After Line 2: 500ms pause
- After Line 3: 800ms then `onDone` fires

Line 2 is rendered at a larger size (`clamp(24px, 2.6vw, 40px)`, weight 700) with
full white opacity — this is the emphatic beat. Lines 1 and 3 are smaller
(`clamp(17px, 1.8vw, 26px)`, weight 400) at 78% opacity.

Key phrases within the reply text receive the same purple glow highlight treatment
as the question headline.

---

## 8. Memory Transition

After the agent reply completes, the selected cards and the entire preference screen
dissolve together. This dissolve is the final beat of the sequence — the moment the
user watches their answer move from "chosen" to "remembered."

### The prescribed motion

The full exit is a uniform opacity fade:
- Background, overlay, header, agent column, and fly layer all fade together at 0.5s
- The ghost cards (still at center) remain visible during the first ~200ms of this fade
- The user's last view before the feed returns is their cards at center, dissolving

This is not a cut. It is a dissolve. The selected cards are the last thing visible.

### The upward movement intention

The description "cards move upward to become history" describes the emotional
meaning of this transition, not a literal upward GSAP animation. As the screen
fades out, the visual direction of exit is upward — the user's mental model is
that the choices have moved from "active decision" to "remembered context."

If a future implementation renders persistent memory/history UI above the feed
(e.g. a conversation history panel or a profile bar), the cards should be literally
animated upward into that target position before the feed resumes. In the current
implementation, the exit is a fade and the "upward" movement is implied.

### What the user should feel

- **"My answer was captured"** — the cards moved to center, settled, were acknowledged
- **"Glance heard me"** — the agent named the selection explicitly before anything changed
- **"Something will be different now"** — the implication was stated; the feed resumes
- **"The feed is resuming"** — the fade is unhurried but not slow

### What to avoid

- Hard cut after reply: the answer feels discarded, not remembered
- Cards disappearing before the reply: removes the "held" feeling — the deck must be
  visible while the agent is speaking
- Long loading state between reply and feed resume: breaks pacing
- Cards fading out while agent is still typing: the deck and agent exit together,
  after the reply is complete
- Confirmation screen or "preferences saved" toast: the agent already confirmed it —
  a second confirmation reads as system distrust of the user

---

## 9. Text Animation System

All agent text in this template uses one of two systems depending on context.

### TypewriterText (used for questions and agent replies)

`src/components/Shared/TypewriterText.tsx`

Characters insert one by one from left to right, each appearing with a blur-in
(`blur(8px)` → `blur(0px)`, 20ms, power2.out). A blinking cursor follows the
last revealed character. Cursor hides 500ms after completion.

Use for:
- Question headline (30ms/char, cursor visible, cursor hides on done)
- Agent reply lines (speed varies per line, cursor visible per active line)

### GlanceTextReveal (used for L0 content — reference only)

`src/components/Shared/GlanceTextReveal.tsx`

All characters exist in the DOM from the first render at opacity 0 + blur(12px).
GSAP staggers them from blur to sharp over a total spread duration.
No cursor. No character insertion. No layout shift.

The thought comes into focus. It is not typed.

Use for:
- L0 reasoning text
- L0 CTA labels
- Any text that must not reflow or shift layout during reveal

### Which to use

| Context | Component | Why |
|---|---|---|
| Question headline | TypewriterText | Conversational — agent is asking |
| Agent reply lines | TypewriterText | Conversational — agent is responding |
| L0 reasoning | GlanceTextReveal | No layout shift — text block already positioned |
| L0 CTA label | GlanceTextReveal | Short, no cursor needed |

### Highlight treatment

Applied after TypewriterText completes, replacing the plain text with highlighted spans.
Applied from first render in GlanceTextReveal (no second pass).

```css
font-weight: 800;
color: rgba(255,255,255,0.98);
text-shadow: 0 0 18px rgba(192,132,252,0.7), 0 0 36px rgba(112,71,226,0.35);
```

This is the single Glance highlight style. Use it consistently across all surfaces.

---

## 10. Motion Language

### Principles

**No cuts.** Every transition is a physical animation. Elements move, scale, fade, blur.
Nothing pops in or out instantaneously.

**Physical continuity.** The selected cards are the same cards — they move, they don't
teleport. The background is the same background as the previous L0 card — blurred, not
replaced. The agent mascot persists between states — its mode changes, it does not disappear.

**Premium pacing.** Faster where the system is confirming ("Done" → cards fly in 0.62s).
Slower where the user needs to read and absorb (reply lines with deliberate pauses).

**GSAP for everything.** CSS transitions are used only for micro-interactions (card hover
state, check badge fill). All entrance, exit, and FLIP animations are GSAP timelines.
This ensures everything can be paused, reversed, or sequenced without fighting the browser.

### Specific timing rules

| Motion | Duration | Ease |
|---|---|---|
| Background fade in | 0.90s | power2.out |
| Overlay fade in | 0.70s | power2.out |
| Header fade in | 0.45s | power2.out |
| Question UI fade in | 0.50s | power2.out |
| Cards stagger in | 0.42s each, 0.1s stagger | power3.out |
| Question UI exit (on commit) | 0.28s | power2.in |
| Unselected cards exit | 0.30s | power2.in |
| Ghost flight to center | 0.62s | power3.inOut |
| Deck settle | 0.38s | back.out(1.3) |
| Agent entrance | 0.48s | power3.out |
| Full exit fade | 0.50s | power2.in |

### GSAP globalTimeline

All GSAP animations in Glance participate in `gsap.globalTimeline`.
This means a `gsap.globalTimeline.pause()` call pauses the preference card mid-animation
just as it pauses L0 feed animations. No special handling required.

---

## 11. Design Language

### Typography

All text uses `"Plus Jakarta Sans", system-ui, sans-serif`.

| Element | Size | Weight | Color | Notes |
|---|---|---|---|---|
| Question headline | `clamp(26px, 3.2vw, 48px)` | 400 | `rgba(245,243,247,0.88)` | `letterSpacing: -0.022em` |
| Caption ("Pick one") | `clamp(10px, 1.0vw, 13px)` | 700 | `rgba(167,134,229,0.65)` | Uppercase, `letterSpacing: 0.2em` |
| Card label | `clamp(15px, 1.5vw, 22px)` | 700 | `#fff` | `letterSpacing: -0.01em` |
| Reply line 1 / 3 | `clamp(17px, 1.8vw, 26px)` | 400 | `rgba(245,243,247,0.78)` | |
| Reply line 2 | `clamp(24px, 2.6vw, 40px)` | 700 | `rgba(255,255,255,0.98)` | `letterSpacing: -0.025em` — emphatic beat |
| Nav hint | `clamp(10px, 0.85vw, 12px)` | 400 | `rgba(167,134,229,0.22)` | Very dim, bottom center |

### Color palette

| Token | Value | Use |
|---|---|---|
| Background base | `#080416` | Fallback when no image |
| Card background | `#0d0820` | Fallback when no card image |
| Purple accent | `rgba(167,134,229,*)` | Caption, nav hint, progress bar, highlight glow |
| White primary | `rgba(255,255,255,0.97–0.98)` | Selected state, reply line 2 |
| White secondary | `rgba(245,243,247,0.78–0.88)` | Body text, question text |
| White ghost | `rgba(255,255,255,0.10–0.22)` | Unselected button states |

### Spacing

The layout uses `clamp()` for all spacing to scale between TV (1920px) and smaller displays.

| Zone | Value |
|---|---|
| Header top inset | `clamp(16px, 3vh, 48px)` |
| Header side inset | `clamp(20px, 4.5vw, 88px)` |
| Question top padding | `clamp(80px, 11vh, 120px)` |
| Below headline | `clamp(14px, 2vh, 24px)` |
| Below caption | `clamp(28px, 4.5vh, 48px)` |
| Card row gap | `clamp(10px, 1.2vw, 18px)` |
| Card row width | `clamp(360px, 88vw, 1380px)` |

### Header

The same header as all L0 feed cards: Glance logo left, clock + date + weather right.
Always present during the preference screen. This reinforces that the preference card
is part of the same feed experience, not a separate modal or settings page.

### Agent mascot states

| Phase | Mode | Size |
|---|---|---|
| Question phase | `looking` | 80px |
| Acknowledgement phase | `thinking` | 76px |

The mascot does not animate its entrance during the question phase — it fades in with
the rest of the question UI. During the acknowledgement phase, it blurs in separately
after the deck settles.

The purple radial glow around the mascot during acknowledgement:
```css
position: absolute;
inset: -30px;
border-radius: 50%;
background: radial-gradient(circle, rgba(112,71,226,0.28) 0%, transparent 70%);
filter: blur(18px);
```

---

## 12. Supported Use Cases

This template adapts across surfaces by changing the `QuestionConfig` data.
The visual layer and animation system remain identical.

> **Mandatory rule for all use cases:**
> Every implementation of this template must include the full
> Center-Stage Acknowledgement Sequence (Section 6). This means:
> selected cards physically move to center, the agent appears below them,
> the agent names what was selected, and the screen dissolves after the reply.
> Do not skip or abbreviate this sequence on any surface.

### Feed interstitial (current use)

- `surface: 'interstitial'`
- Appears every 5 L0 cards (configurable via `PREFERENCE_INTERVAL`)
- Up to 6 per session (configurable via `MAX_PREFERENCE_CARDS`)
- Background image: last L0 card seen
- Auto-dismiss optional (`autoDismissMs > 0` shows progress bar)
- Reply fires ML signal boosts into `PreferenceProfile` via `onAnswer` callback
- **Acknowledgement sequence:** required — center-stage FLIP + agent reply + dissolve

### Setup flow (cold start onboarding)

- `surface: 'setup'`
- Background image: dedicated asset per question or previous onboarding screen image
- `autoDismissMs: 0` (user must choose — no auto-dismiss in setup)
- Reply Line 3 can be warmer / more introductory: "I'll remember that."
- `onAnswer` writes to `GlanceProfileDraft` instead of live `PreferenceProfile`
- **Acknowledgement sequence:** required — center-stage FLIP + agent reply + dissolve
  The reply is the user's first experience of being heard by Glance. Do not skip it.

### Travel intent collection

- Same template, `gapAxis: 'cat:travel'`
- Questions: destination type, travel pace, accommodation preference
- Option images: landscape photography
- After collection, feed re-ranks travel content immediately
- **Acknowledgement sequence:** required — agent names the chosen destination/style,
  confirms, and states the feed implication before resuming

### Shopping intent collection

- Same template, `gapAxis: 'cat:fashion'` or `'cat:luxury'`
- Questions: style direction, price range, occasion
- Option images: product / lifestyle photography
- **Acknowledgement sequence:** required — agent echoes the style signal back to the
  user before the feed resumes

### Content tone tuning

- Same template, abstract vibes as options (e.g. calm vs. bold, deep vs. quick)
- Option images: tonal/atmospheric photography
- No product or location content
- **Acknowledgement sequence:** required — tonal choices feel abstract; the agent
  naming them back makes them feel concrete and held

### Future agent questions

Any time the Glance agent needs to ask a question with visual options:

1. Define a `QuestionConfig` with `surface`, `template`, `question`, `options`, `highlightPhrases`
2. Pass it to `<InterstitialQuestion>` with `onAnswer` and `onDismiss` callbacks
3. The entire visual flow, FLIP animation, and acknowledgement sequence are built in —
   no additional code needed
4. **Do not bypass the acknowledgement.** The `onAnswer` callback fires only after the
   full sequence completes. This is by design.

---

## 13. Implementation References

### Components

| Component | Path | Role |
|---|---|---|
| `InterstitialQuestion` | `src/components/Polls/InterstitialQuestion.tsx` | Full preference screen — question phase + FLIP + acknowledgement |
| `PreferenceCard` | `src/components/Feed/PreferenceCard.tsx` | Thin wrapper: places `InterstitialQuestion` in absolute-fill div |
| `AgentMascot` | `src/components/Shared/AgentMascot.tsx` | Rive mascot — `looking` / `thinking` modes |
| `TypewriterText` | `src/components/Shared/TypewriterText.tsx` | Character-by-character blur reveal with cursor |
| `GlanceTextReveal` | `src/components/Shared/GlanceTextReveal.tsx` | Simultaneous blur stagger reveal — no cursor, no insertion |

### Data files

| File | Role |
|---|---|
| `src/data/preferenceQuestions.ts` | All `QuestionConfig` objects — the only file to edit to add/change questions |
| `src/data/types.ts` | `AttributeBoosts`, `PreferenceProfile` type definitions |
| `src/logic/feedComposer.ts` | `composeFeedWithPreferences()` — interleaves L0 cards and preference cards |

### Animation utilities

| Utility | Path | Role |
|---|---|---|
| `gsap` | npm package | All GSAP timelines, tweens, stagger animations |
| FLIP technique | Inline in `InterstitialQuestion.tsx` | `getBoundingClientRect` → ghost clone → animate |

### Feed composition

```ts
import { composeFeedWithPreferences } from './logic/feedComposer';
import { INTERSTITIAL_QUESTIONS } from './data/preferenceQuestions';

// Produces UnifiedFeedItem[] mixing glance cards and preference cards
const feed = composeFeedWithPreferences(FEED_ITEMS, INTERSTITIAL_QUESTIONS);
```

### Props interface

```tsx
<InterstitialQuestion
  question={questionConfig}       // QuestionConfig object
  currentL0Image={lastImage}      // optional — string URL for blurred BG
  idleMs={12000}                  // optional — auto-dismiss on no interaction
  onAnswer={(opt) => { ... }}     // fires with selected QuestionOptionConfig
  onDismiss={() => { ... }}       // fires on skip, idle timeout, or Escape
/>
```

### Keyboard navigation

| Key | Action |
|---|---|
| `←` `→` | Move card focus |
| `↓` | Move focus to action buttons (multi-select) |
| `↑` | Move focus back to cards (multi-select) |
| `Enter` / `Space` | Pick focused card / confirm |
| `Escape` / `Backspace` | Dismiss (skip) |
