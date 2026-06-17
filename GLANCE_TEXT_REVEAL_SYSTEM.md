# Glance Text Reveal System

Single source of truth for all Glance agent text animation.

---

## Source of Truth

Extracted from the approved L0 feed implementation in `CinematicL0.tsx`.
The `CinematicReveal` local component has been promoted to a shared utility.

---

## Component

**File:** `src/components/Shared/GlanceTextReveal.tsx`

**Named exports:**
- `default` — the `GlanceTextReveal` component
- `GLANCE_HIGHLIGHT_STYLE` — the purple glow style object (reuse on custom highlight spans)
- `RESOLVE_MS_REASONING` — `4000` ms, for agent reasoning text
- `RESOLVE_MS_CTA`       — `1400` ms, for short CTA labels
- `RESOLVE_MS_SPEECH`    — `2500` ms, for mid-length onboarding / preference speech
- `buildCharTokens(text, highlights)` — utility if you need to render tokens manually

---

## Animation Behaviour

All characters exist in the DOM from the first render at `opacity: 0, filter: blur(12px)`.

When `playing` becomes `true`, GSAP staggers each character from:
```
{ opacity: 0, filter: blur(12px) }
→
{ opacity: resolvedOpacity, filter: blur(0px) }
```

**This is not a typewriter.** Text does not insert character by character.
Layout is fully stable before animation begins — no wrapping changes, no reflow.

The feeling: **the thought comes into focus.**

---

## Props / API

```tsx
<GlanceTextReveal
  text="Because you love South Indian food."
  highlights={['South Indian food']}    // purple glow on these substrings
  twoLine={false}                        // break at first '. ' into two lines
  playing={isPlaying}                    // false = frozen, true = reveal starts
  resolvedOpacity={0.78}                 // 0.78 for dark-BG reasoning, 1.0 for CTA/light
  resolveMs={RESOLVE_MS_REASONING}       // total spread duration in ms
  charDuration={1.0}                     // per-char tween duration in seconds
  onDone={() => setRevealDone(true)}     // fires once, when last char resolves
/>
```

| Prop | Type | Default | Notes |
|---|---|---|---|
| `text` | `string` | required | The text to reveal |
| `highlights` | `string[]` | `[]` | Substrings that receive purple glow |
| `twoLine` | `boolean` | `false` | Breaks at first `. ` into two `<span>` blocks |
| `playing` | `boolean` | required | Controls animation start |
| `resolvedOpacity` | `number` | `0.78` | Final opacity of resolved chars |
| `resolveMs` | `number` | `4000` | Total spread across all characters |
| `charDuration` | `number` | auto | Per-char tween seconds. Auto-selects 0.65 for CTA-length, 1.0 for longer |
| `onDone` | `() => void` | required | Called once when animation completes |

---

## Speed Presets

```ts
import {
  RESOLVE_MS_REASONING,  // 4000 ms — long reasoning (~50 chars)
  RESOLVE_MS_CTA,        // 1400 ms — short CTA labels (~15 chars)
  RESOLVE_MS_SPEECH,     // 2500 ms — onboarding / preference acks (~30 chars)
} from '../Shared/GlanceTextReveal';
```

For very short text (<10 chars), pass `resolveMs={800}` directly.

---

## Highlight Support

Pass substrings in the `highlights` array. Matched regions receive:
```css
font-weight: 700;
color: rgba(255,255,255,0.98);
text-shadow: 0 0 12px rgba(192,132,252,0.9), 0 0 28px rgba(112,71,226,0.6);
```

This is the existing L0 reasoning highlight style — the purple glow on key words.
Highlights are baked into the initial render. They do not animate separately.
No second pass. No layout shift.

---

## Multiline Support

Set `twoLine={true}` to split at the first `. ` in the text.
Each segment renders as a separate `<span style="display:block">`.

For more than two lines, nest multiple `<GlanceTextReveal>` instances in a parent
flex column, staggering their `playing` props with small delays.

---

## Alignment

`GlanceTextReveal` renders inline — it inherits the text alignment of its parent container.
Set `textAlign` on the wrapping `<p>` or `<div>`:

```tsx
<p style={{ textAlign: 'center' }}>
  <GlanceTextReveal text="..." playing={p} onDone={fn} />
</p>
```

All three variants (left / center / right) work without any prop on the component.

---

## Pausing

To pause all active reveals (e.g. Space bar pause on the feed):
```ts
gsap.globalTimeline.pause();   // pauses GlanceTextReveal and all other GSAP tweens
gsap.globalTimeline.resume();
```

Individual timeline control is internal to the component.

---

## Examples

### L0 reasoning (current usage)

```tsx
<GlanceTextReveal
  text={reasoning}
  highlights={getHighlights(item, reasoning)}
  twoLine
  playing={reasoningPlaying}
  resolvedOpacity={0.78}
  resolveMs={RESOLVE_MS_REASONING}
  onDone={onReasoningDone}
/>
```

### CTA label (current usage)

```tsx
<GlanceTextReveal
  text={ctaLabel}
  playing={ctaTextPlaying}
  resolvedOpacity={1}
  resolveMs={RESOLVE_MS_CTA}
  onDone={onCtaRevealDone}
/>
```

### Onboarding agent speech (future usage)

```tsx
<GlanceTextReveal
  text="Good morning. I'm Glance — I'll surface things worth your attention."
  highlights={['worth your attention']}
  twoLine
  playing={agentSpeaking}
  resolvedOpacity={0.88}
  resolveMs={RESOLVE_MS_SPEECH}
  onDone={() => setOnboardingStep('next')}
/>
```

### Preference card acknowledgement (future usage)

```tsx
<GlanceTextReveal
  text="More South Indian food coming up."
  playing={ackPlaying}
  resolvedOpacity={1}
  resolveMs={1200}
  onDone={onAckDone}
/>
```

---

## Files Changed

| File | Change |
|---|---|
| `src/components/Shared/GlanceTextReveal.tsx` | **Created** — shared utility |
| `src/components/L0/CinematicL0.tsx` | Removed local `CinematicReveal` + `buildCharTokens`; imports `GlanceTextReveal` and `RESOLVE_MS_*` constants instead |

---

## What Was NOT Changed

- L0 visual output — identical before and after refactor
- `CinematicL0.tsx` animation timing — all constants preserved via `RESOLVE_MS_*` aliases
- Onboarding screens
- Preference collection cards
- T2 Fashion Story
- T3 Conversation Starter
