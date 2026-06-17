# L0 Option B Rollout

Decision: replace the typewriter cursor reveal with the Cinematic (blur→sharp stagger) reveal across all L0 feed templates.

---

## What changed

### `src/components/L0/CinematicL0.tsx`

**Reasoning reveal — before:**
- `AgentTextReveal` component: char-by-char via `setTimeout` state ticker, blinking cursor, timing driven by `reasoning.length * 38ms`

**Reasoning reveal — after:**
- `CinematicReveal` component: all chars in DOM from render, `opacity: 0, filter: blur(12px)`. GSAP timeline staggers them to `opacity: 0.78, filter: blur(0px)` over **2800ms** total. No cursor, no state-per-character.
- Highlight tokens (purple glow) are preserved — applied as initial inline styles, GSAP only animates opacity/filter.
- `twoLine` line-break at `. ` is preserved.

**CTA label reveal — before:**
- `AgentTextReveal` with cursor + CSS `max-width` transition
- `ctaTypingDuration` calculated from label length

**CTA label reveal — after:**
- `CinematicReveal` with `playing={ctaTextPlaying}` — same blur→sharp, 900ms total, `resolvedOpacity: 1`
- `max-width` transition synced to `CTA_RESOLVE_MS` (900ms) for pill expansion
- No cursor

**Mascot mode — before:**
- `agentMode` prop passed from `FeedScreen` via `L0Glance`, external state machine in `FeedScreen`

**Mascot mode — after:**
- Fully internal to `CinematicL0`. State machine:
  - `idle` (default, before reveal starts)
  - `thinking` (during blur→sharp reveal)
  - `looking` (after reasoning completes, before FLIP — `onAgentLook` fires)
  - CTA slot: always `looking`
- `agentMode` prop removed from `CinematicL0`, `L0Glance`, and the `FeedScreen` call site.

---

### `src/animations/l0Timeline.ts`

**CTA sequence — before (rushed):**
```
ctaReveal label
  → ctaWrap slides in
  → FLIP starts at ctaReveal+0.14
  → beam fires at fixed offset
```

**CTA sequence — after (deliberate):**
```
heroShrink completes
  → 0.85s → agentLook label → onAgentLook() fires  ← agent turns toward CTA
  → 0.65s → ctaReveal label → ctaWrap slides in    ← user sees where agent is looking
  → 0.40s → FLIP arc begins (0.75s)                ← mascot travels to pill
  → arc lands → onMascotGone + onCTATypingStart     ← text starts revealing
  → CTA_RESOLVE_MS later → onBeamStart              ← glow activates
```

**Interface changes:**
- `ctaTypingDuration` → `ctaRevealDuration` (same semantic, cleaner name)
- `onBeamStart` now also fires `setCtaActive(true)` (combined in callback)
- `onCTAReady` removed (no longer needed — ctaActive tied to beam)
- `onAgentLook` added

---

## What was NOT changed

- `AgentReasoning.tsx` — used by `GlanceLayout` (non-cinematic path), untouched
- `GlanceLayout.tsx` — untouched
- `T2FashionStory.tsx` — untouched
- `T3ConversationStarter.tsx` — untouched
- All onboarding screens — untouched
- The `/l0_experiment` animation lab — untouched (Mode B is the reference implementation)

---

## Timing reference

| Phase | Duration |
|---|---|
| Reasoning blur→sharp | 2800ms total stagger |
| Per-char transition | 0.7s GSAP ease |
| Pause after reasoning | 0.85s |
| Agent looks (holding beat) | 0.65s |
| CTA pill slides in | 0.46s |
| Pause before FLIP | 0.40s |
| Mascot FLIP arc | 0.75s |
| Mascot settle + slot reveal | 0.22s |
| CTA text blur→sharp | 900ms total stagger |
| Glow activates | after text completes + 0.15s |
