# Phase 1 Changelog — Glance TV Feed

## Summary

Complete redesign of the onboarding/setup experience and creation of a reusable motion system. The goal was to replace a static setup-screen flow with a guided conversation that feels calm, intelligent, and cinematic — in the tradition of Apple TV and visionOS, not a web app.

---

## Files Changed

### New Files

| File | Purpose |
|------|---------|
| `src/styles/motion.css` | Complete motion primitive system (see Motion System below) |

### Modified Files

| File | Nature of change |
|------|-----------------|
| `src/styles/tokens.css` | Added per-step background gradients, spacing scale, radius tokens, easing aliases |
| `src/styles/premium.css` | Full redesign of onboarding CSS; legacy `premium-*` classes preserved for feed screens |
| `src/components/Shared/Mascot.tsx` | New `listening` and `transitioning` states; `respondTrigger` prop for acknowledgement pulses; tighter idle breathing |
| `src/components/Activation/WelcomeScreen.tsx` | Cinematic centered welcome; removed "Question 0" framing; new hero title scale |
| `src/components/Activation/BangaloreConfirm.tsx` | Agent acknowledgement on "Not right now" answer; calm, non-judgmental dismiss |
| `src/components/Calibration/WorldsQuestion.tsx` | Agent responds to selection count with evolving typed lines; live selected-answer badge; `respondTrigger` wired |
| `src/components/Calibration/DiscoveryAppetite.tsx` | New `ob-option` card style (image + text row); agent acknowledges selection; white radio indicator |
| `src/components/Activation/SelfieScreen.tsx` | Explicit value proposition (3 benefit bullets); three-option CTA stack (Upload / Continue without / Maybe later); "Skip" reframed as non-negative |
| `src/components/Calibration/TuningTransition.tsx` | Three-phase reveal: generating → agent acknowledgement → cinematic reveal; ambient particle system; white flash transition |
| `src/main.tsx` | Added `motion.css` import after `tokens.css` |

---

## Components Created

### `ob-screen` system (premium.css)

The `.premium-screen` class has been supplemented (not replaced) by `.ob-screen`, which:

- Accepts a `data-step` attribute to evolve the background gradient across the conversation
- Has `--bg-welcome`, `--bg-q1`, `--bg-q2`, `--bg-q3`, `--bg-selfie`, `--bg-generation` token variants
- Carries a film-grain overlay and directional light leak for depth without shadows

### New CSS component classes

| Class | Description |
|-------|-------------|
| `.ob-topbar` / `.ob-brand` / `.ob-progress` | Top bar with brand and progress pip system |
| `.ob-step-pip` | Animated progress indicators (inactive / active / done states) |
| `.ob-welcome-layout` | Full-screen centered hero layout |
| `.ob-step-layout` | Two-column split layout (agent panel left, content right) |
| `.ob-agent-panel` | Left column: mascot + conversation + CTAs |
| `.ob-agent-utterance` | Chat-bubble–style agent message surface |
| `.ob-conversation` | Vertical stacking of utterances and history |
| `.ob-question-title` | Large question headline (52px, -0.05em tracking) |
| `.ob-agent-copy` | Supporting body copy (20px, 0.64 opacity) |
| `.ob-history-item` | Previous-question answer displayed as receding context |
| `.ob-answer-badge` | Inline chip showing selected answers in agent panel |
| `.ob-btn` system | Primary / secondary / ghost — all with white TV-ring focus state |
| `.ob-btn-stack` / `.ob-btn-row` | Flexible CTA containers |
| `.ob-tile-grid` / `.ob-tile` | 2×N image selection grid with white focus ring + check |
| `.ob-option-list` / `.ob-option` | Vertical image+text radio option rows |
| `.ob-selfie-layout` / `.ob-selfie-preview` | Selfie screen split layout with preview image |
| `.ob-benefit-list` / `.ob-benefit-item` | Dot-preceded feature benefit list |
| `.ob-qr-panel` | QR code + explanation surface |
| `.ob-generation-layout` / `.ob-generation-orb` | Centered generation reveal layout |
| `.ob-build-list` / `.ob-build-item` / `.ob-build-check` | Animated build checklist |
| `.ob-kicker` | Pill-shaped label chip |
| `.ob-hint` | Bottom navigation hint text |
| `.ob-orb` system | Ambient background orbs (`ob-orb--a/b/c`) |
| `.ob-stagger` + `.d0`–`.d7` | Stagger entrance animation helpers |

---

## Motion System Created

**File:** `src/styles/motion.css`

### Easing tokens

| Token | Value | Use |
|-------|-------|-----|
| `--ease-out` | `cubic-bezier(0.16,1,0.3,1)` | Snap-to-rest, most UI motion |
| `--ease-in-out` | `cubic-bezier(0.45,0,0.15,1)` | Controlled arcs, exit motion |
| `--ease-spring` | `cubic-bezier(0.34,1.56,0.64,1)` | Gentle overshoot for interactive elements |
| `--ease-cinematic` | `cubic-bezier(0.22,1,0.36,1)` | Film-quality screen transitions |
| `--ease-gentle` | `cubic-bezier(0.4,0,0.2,1)` | Ambient, background motion |

### Duration tokens

| Token | Value | Use |
|-------|-------|-----|
| `--dur-confirm` | `200ms` | Button press, selection confirm |
| `--dur-ack` | `300ms` | Agent acknowledges |
| `--dur-transition` | `500ms` | Question-to-question transition |
| `--dur-reveal` | `700ms` | Cinematic entrance/reveal |
| `--dur-ambient` | `2800ms` | Agent breathing cycle |
| `--dur-slow-ambient` | `8000ms` | Background gradient evolution |

### Named keyframes (all reusable)

| Keyframe | Description |
|----------|-------------|
| `fadeUp` | Entrance from below — opacity + translateY + blur |
| `fadeIn` | Pure opacity |
| `fadeDown` | Exit upward — used for history items receding |
| `cardReveal` | Surface slides up and sharpens |
| `focusExpand` | Selection confirmation ring |
| `agentAppear` | Mascot drop-in with spring |
| `agentRespond` | Brief pulse on acknowledgement |
| `agentIdle` | Slow breathing (2.9s organic cycle) |
| `agentSpeak` | Accelerated breathing while speaking |
| `agentThinkDot` | Staggered thinking dots |
| `agentListen` | Ripple ring while listening |
| `staggerIn` | Generic stagger entrance |
| `backgroundShift` | Gradient layer opacity transition |
| `pulseRing` | Confirmation ring expanding outward |
| `shimmer` | Loading skeleton state |
| `floatOrb` / `float-orb` | Ambient orb drift (dual name for compatibility) |
| `progressFill` | Progress bar fill sweep |
| `selectionConfirm` | Check mark spring entrance |
| `revealWord` | Per-word cinematic text reveal |
| `particleFloat` | Ambient intelligence particles |
| `typedCursor` | Text insertion cursor blink |
| `revealFlash` | White flash for Made For You reveal |
| `fadeUp` | Global alias (also used in inline styles) |

### Utility classes

| Class | Description |
|-------|-------------|
| `.m-fade-up` | Entrance animation |
| `.m-fade-in` | Opacity fade |
| `.m-fade-down` | Exit to history |
| `.m-card-reveal` | Surface entrance |
| `.m-agent-appear` | Mascot entrance |
| `.m-d0`–`.m-d7` | Stagger delay steps |
| `.m-screen-enter` / `.m-screen-exit` | Screen transition classes |
| `.m-focus-ring` | TV remote focus state with white ring |
| `.m-selection-ring` | Post-selection pulse ring |

---

## Mascot Enhancements

### New states

| State | Behavior |
|-------|----------|
| `listening` | Gentle ripple ring; softer breathing |
| `transitioning` | Exit animation — scale down with blur |

### New prop

`respondTrigger: number` — increment this value to trigger a brief `agentRespond` pulse. Used in WorldsQuestion and DiscoveryAppetite to make the agent visibly react when the user makes a selection.

### Visual improvements

- Tighter idle at 1.10× max scale (was 1.12×) — more restrained
- Inner highlight rim using radial gradient for visionOS glass quality
- Star icon uses `linear-gradient(140deg, #fff, #ede2ff)` for depth
- Thinking dots now translate vertically (`-5px`) in addition to scaling

---

## Onboarding Improvements

### Welcome Screen
- Removed "Question 0 of 4 · Agent setup" framing — opens as a presence, not a form
- Title scaled to 96px for full cinematic weight
- CTAs renamed: "Let's begin" / "Go straight to feed" (warmer than "Start setup" / "Skip")
- Subtitle delivered as a TypedLine — agent is already speaking when you arrive

### Bangalore Confirm (Q1)
- Centered layout instead of top-heavy panel
- "Not right now" triggers a graceful agent acknowledgement sequence before navigating
- Removed hint note that referenced "Selections and CTAs use white focus states" (implementation note, not UX copy)

### Worlds Question (Q2)
- Agent line evolves with selection count: initial invite → "Nice. Anything else?" → "Getting a clearer picture." → "I'm ready when you are."
- `respondTrigger` wired — orb pulses every time a tile is toggled
- Selected answers shown as a live badge in the agent panel
- Tile grid uses new `.ob-tile` class with spring-scale focus + animated check

### Discovery Appetite (Q3)
- Options rebuilt as `.ob-option` rows: image + label + radio indicator
- Radio uses filled white center dot instead of checkmark — more appropriate for single select
- Agent panel pattern matches Q2 (consistent conversational structure)

### Selfie Screen (Q4)
- Headline changed to "Help me understand your style." — value-forward
- Three explicit benefit bullets added
- CTA redesigned as three-tier stack:
  1. **Upload selfie** (primary — white, action-positive)
  2. **Continue without photo** (secondary — neutral, not negative)
  3. **Maybe later** (ghost — genuinely light, no shame)
- Privacy note: "Your photo stays on-device and is never shared"

### Tuning Transition (Made For You)
- Three-phase experience:
  1. **Generating** — animated build checklist with staggered check-ins and ambient particles
  2. **Acknowledging** — agent says "I learned enough to start helping" before the reveal
  3. **Revealing** — white flash frame → "Your evening starts here." at 92px
- Ambient particle system (18 particles with staggered floatOrb animation) creates sense of intelligence at work
- Timing: 400ms lead + 540ms per item + 300ms pause + 800ms acknowledge + 1300ms reveal + 600ms hold

---

## Design Rationale

### Why white, not purple, as the accent
Purple is the brand's ambient layer — it lives in backgrounds, glows, and gradients. White is the attention layer — it marks focus states, selections, and CTAs. This separation creates visual hierarchy that works under TV viewing distances without confusion.

### Why centered welcome vs split layout
The welcome screen is not a form — it's an introduction. Centering the agent and title creates presence. The split layout only appears when there's a spatial relationship worth expressing: agent speaking + content responding.

### Why evolving backgrounds
Static backgrounds make each question feel like a separate screen. Shifting gradients (using `data-step` CSS attributes) create a sense that the same space is subtly changing as the conversation progresses — more "ambient intelligence", less "setup wizard".

### Why three CTAs on the selfie screen
"Skip" as a single escape option puts users in a binary: do the thing, or refuse. Three options — upload, continue without, maybe later — let users modulate their commitment. "Maybe later" is a deferral, not a refusal. This reduces the psychological cost of the screen.

### Why `respondTrigger` instead of state-derived pulses
The agent should react to user *actions*, not just state changes. A prop-based trigger gives parent components explicit control over when the mascot responds, preventing false positives from re-renders or state propagation timing.

### Why the three-phase Made For You reveal
"Setup complete" is a terminal statement. The three-phase reveal — build → acknowledgement → reveal — creates a narrative arc: the agent did work, recognized what it learned, and now presents the result. The white flash is borrowed from film: a moment of visual reset before something new begins.
