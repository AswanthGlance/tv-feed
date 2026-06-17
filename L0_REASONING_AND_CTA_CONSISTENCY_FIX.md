# L0 Reasoning and CTA Consistency Fix

## File changed

`src/components/L0/CinematicL0.tsx`

---

## Shared animation utility: AgentTextReveal

`ReasoningReveal` renamed and extended to `AgentTextReveal`.

Single implementation, used for both reasoning and CTA:

```
AgentTextReveal props:
  text         — string to reveal
  highlights   — phrases marked bold+glow from frame 1
  twoLine      — splits at ". " into 2 display:block lines (reasoning only)
  playing      — starts the reveal
  speed        — ms per character (same constant for both)
  cursorColor  — white for reasoning, #444 for CTA (dark background)
  onDone       — fires when all chars visible
```

Both use: letter-by-letter reveal, blur(4px) → blur(0px) per char, 0.14s ease transition.

---

## CTA animation update

**Before:** `opacity 0→1 + translateX(-6px→0)` fade — different system from reasoning.

**After:** `AgentTextReveal` with `twoLine={false}`, `cursorColor="#444"`. Identical animation language. The CTA label types in letter-by-letter, matching the reasoning exactly.

`onCtaRevealDone` fires `setCtaActive(true) + setBeamActive(true)` when the last CTA character lands.

`TypewriterText` import removed — no longer used anywhere in CinematicL0.

---

## Two-line reasoning enforcement

Center template `maxWidth` reduced from `580px` to `480px`.  
This forces longer single-line reasonings to wrap to a second line.  
Left/right stay at `480px` and `520px` respectively.

All reasoning strings in `reasoningEngine.ts` already contain exactly one `. ` boundary,  
so `AgentTextReveal` with `twoLine={true}` always produces two `display:block` lines.

---

## Center template alignment fixes

- `<button>` inner `justifyContent` now `'flex-end'` for right alignment (was hardcoded `'flex-start'` for all)
- Center alignment: tag, title, reasoning, CTA all use `geo.textAlign = 'center'` and `geo.ctaJustify = 'center'` — unchanged but confirmed
- Reasoning `<p>` inherits `textAlign: geo.textAlign` for consistent axis

---

## Bharatanatyam card (feed-13) fix

feed-13 is `layout: center`. With the `maxWidth: 480px` tightening, the center template reasoning  
now wraps reliably. The `entertainment` bank produces strings with a `. ` boundary, so the  
two-line split fires correctly. Title uses `transformOrigin: center bottom` for scale-down — confirmed correct.

---

## Template consistency audit

| Feature | Left | Center | Right |
|---------|------|--------|-------|
| Reasoning animation | AgentTextReveal, twoLine | AgentTextReveal, twoLine | AgentTextReveal, twoLine |
| CTA animation | AgentTextReveal | AgentTextReveal | AgentTextReveal |
| CTA cursor color | #444 (dark) | #444 (dark) | #444 (dark) |
| Reasoning cursor color | white | white | white |
| Two-line enforcement | maxWidth 480px | maxWidth 480px | maxWidth 520px |
| Center axis | left edge | center | right edge |
