# Setup Flow — Preference Collection Alignment

## Summary

The setup/onboarding flow has been refactored to use the same interaction model,
design language, and motion system as the L0 Preference Collection experience.
The onboarding now feels like a natural extension of mid-feed preference collection —
not a separate product.

---

## New Screen Flow

```
welcome → bangalore-confirm → q1-scenario → worlds → vibes → discovery-appetite → selfie → tuning → feed
```

**Five setup questions + one selfie step:**

| Screen | Question | Type | Options |
|---|---|---|---|
| `bangalore-confirm` | "I see you're in Bengaluru – that right?" | Single-select | 2 cards |
| `q1-scenario` | "What should your TV bring up first?" | Single-select | 4 cards (2×2 grid) |
| `worlds` | "What topics should your TV surface?" | Multi-select | 4 carousel cards |
| `vibes` | "What kind of world do you want Glance to take you to?" | Multi-select | 4 carousel cards |
| `discovery-appetite` | "How far should I take you?" | Single-select | 4 carousel cards |
| `selfie` | Selfie collection | Value prop + upload | — |

---

## Interaction Model Reused

All five setup questions use the same loop already in `BangaloreConfirm` and
`DiscoveryAppetite`:

1. **Mascot enters** — springs in from top (`back.out(1.4)`, 0.6s)
2. **Question reveals** — `CinematicText` blur→sharp character reveal (not typewriter)
3. **Subtitle + cards appear** — blur reveal with stagger
4. **User selects**
5. **Input bubble** — springs in, floats up to mascot (`power3.in`, 0.5s)
6. **Cards/UI fades** — question, subtitle, carousel dissolve
7. **Mascot pulse** — `scale 1 → 1.18 → 1.0` (agent acknowledges input)
8. **Agent responds** — blur reveal below mascot
9. **History stack** — selected choice shrinks to top-left ghost; ack text fades
10. **Container fades** → next screen

No cuts. No abrupt resets. One continuous conversation.

---

## Selection Flow

### Single-select (Q1Scenario, BangaloreConfirm, DiscoveryAppetite)

```
User selects card
  → Other cards fade/slide off (stagger, power3.in)
  → Subtitle + question fade (power2.in)
  → Selected card moves to center-hero (back.out(1.2), scale 1.1, y -60)
  → Mascot pulse (scale 1.18 → 1.0)
  → Multi-phrase ack appears (3 lines, each revealed in sequence)
  → Selected card floats up (power3.in, opacity 0, y -120)
  → History ghost appears top-left (bc-history-ghost)
  → Exit
```

### Multi-select (WorldsQuestion, VibesQuestion)

```
User toggles cards (radio indicators)
User presses Done
  → Input bubble: selected labels joined, floats up to mascot
  → Unselected cards fade (power3.in stagger)
  → Carousel/actions/question fade
  → Mascot pulse
  → Agent responds (single line)
  → History ghost: pill list of selected items (wq-history-ghost)
  → Exit
```

---

## Acknowledgement Flow

### Single-select (3-line multi-phrase — BangaloreConfirm pattern)

Each line reveals sequentially with a pause between:

```
Line 1: primary — large, confident (36px, weight 600)
           ↓ (380ms pause)
Line 2: secondary — conversational (32px, weight 400)
           ↓ (420ms pause)
Line 3: tertiary — soft aside (26px, weight 400, 54% opacity)
```

Implemented in `Q1Scenario.tsx` using `ACK_LINES` keyed by option ID.

Example responses:
- `'slow-morning'` → "A beautiful place." / "Great eye." / "Travel and scenics, tuned in."
- `'forest-trail'` → "A good meal." / "My kind of answer." / "We'll find you the best local finds."

### Multi-select (single line)

Dynamic response built from selected labels:
- 0 selected → "Got it. I'll build a balanced mix for you."
- 1 selected → "`{label}`. I'll make sure that shows up well."
- 2+ selected → "`{label1}` and `{label2}`. Great combination."

---

## Conversation History Behavior

After the acknowledgement completes:

- **Single-select**: A `bc-history-ghost` appears top-left showing the selected card
  as a small thumbnail (140×88px) with the option label and a ✓ badge.
- **Multi-select**: A `wq-history-ghost` appears top-left showing pill chips for each
  selected item stacked vertically, with a ✓ badge.

Both use `back.out(1.3)` spring entrance. The ghost reads as: "Glance heard that and
filed it away."

---

## Text Animation

All agent speech uses `CinematicText` — the shared blur→sharp character reveal:

- No cursor
- No typewriter insertion
- All characters exist in DOM at render (opacity 0, blur 12px)
- GSAP staggers each character to opacity 1 / blur 0
- Speed varies by line length: `speed: 0.028–0.055`, `duration: 0.35–0.45`

Question text uses the same component (`fg-q-title` class, 42px weight 500).

---

## Question Highlights

The `highlightPhrases` prop on `GlanceTextReveal` (used in interstitials) is available
for question text if needed. Currently not applied to setup questions — copy is short
enough that the full line carries equal weight.

---

## Files Changed

| File | Change |
|---|---|
| `src/logic/navigation.ts` | Added `q1-scenario` and `vibes` to `Screen` union and `SCREEN_ORDER` |
| `src/App.tsx` | Imported `Q1Scenario`, `VibesQuestion`; wired `q1-scenario` and `vibes` screens; updated `bangalore-confirm → q1-scenario`, `worlds → vibes → discovery-appetite` routing |
| `src/components/Calibration/Q1Scenario.tsx` | Full rewrite — BangaloreConfirm interaction model: 2×2 grid, 3-line ack, history ghost |
| `src/components/Calibration/WorldsQuestion.tsx` | Trimmed to 4 options; replaced multi-line response with dynamic label builder; added `wq-history-ghost` pill stack after ack; simplified action row to single Done/Skip pill; updated progress pips |
| `src/components/Calibration/VibesQuestion.tsx` | New screen — first 4 of `Q4_VIBE_OPTIONS`; full multi-select carousel pattern; applies vibe signals to profile; `wq-history-ghost` after ack |
| `src/components/Calibration/DiscoveryAppetite.tsx` | Added `historyRef` / `historyLblRef`; replaced instant fade exit with history ghost animation; updated progress pips to 5 |
| `src/styles/figma-onboarding.css` | Added `q1s-*` namespace (2×2 grid cards); added `wq-history-ghost` / `wq-history-pills` / `wq-history-pill` for multi-select history |

---

## What Was Not Changed

- `WelcomeScreen.tsx`
- `BangaloreConfirm.tsx`
- `SelfieScreen.tsx`
- `TuningTransition.tsx`
- `FeedScreen` and all L0/L1/L2 components
- `GlanceTextReveal.tsx`, `CinematicText.tsx`, `AgentMascot.tsx`
- `preferenceQuestions.ts` (interstitial pool unchanged)
- Any feed logic, ranking, or signal files
