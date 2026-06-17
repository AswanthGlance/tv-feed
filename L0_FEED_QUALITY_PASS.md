# L0 Feed Quality Pass

## Files changed

| File | Change |
|------|--------|
| `src/logic/reasoningEngine.ts` | Full rewrite — em dashes removed, all banks humanized, 2-line enforced |
| `src/logic/ctaGenerator.ts` | Em dashes removed, all copy reviewed and tightened |
| `src/data/feedItems.ts` | Em dashes removed from 13 titles/subtitles |
| `src/components/L0/CinematicL0.tsx` | ReasoningReveal switched to letter-by-letter reveal |

---

## Em dash removal

All `—` removed from reasoning, CTA, titles, and subtitles. Replaced naturally:

| Before | After |
|--------|-------|
| `Jaipur, the Pink City — best seen as the light turns blue.` | `Jaipur, the Pink City. Best seen as the light turns blue.` |
| `Before the day begins — a quiet 10 minutes for you.` | `Before the day begins, a quiet 10 minutes for you.` |
| `Kabaddi — The Chase` | `Kabaddi, The Chase` |
| `Chess — where patience is the greatest weapon.` | `Chess. Where patience is the greatest weapon.` |
| `Bharatanatyam — The Language` | `Bharatanatyam, The Language` |
| `Tea Gardens — Munnar` | `Tea Gardens of Munnar` |
| `The Pink City at dusk — rooftops, chai, silence.` | `The Pink City at dusk. Rooftops, chai, silence.` |
| `Holi — The Festival of Colour` | `Holi, The Festival of Colour` |
| `The calm beauty of less — Japanese meets Scandinavian.` | `The calm beauty of less. Japanese meets Scandinavian.` |
| `Oversized, layered, effortless — the drop you need.` | `Oversized, layered, effortless. The drop you need.` |

---

## Reasoning rewrite pass — Before vs After

**food (city + culture):**
- Before: `${city()} has a strong ${subLabel} culture — is what surfaced this.`
- After: `${city()}'s ${subLabel} culture ran deep in your local picks. That's what brought this forward.`

**travel (upcoming + intent):**
- Before: `Your interest in ${subLabel} + ${upcoming()} plans brought this here.`
- After: `With ${upcoming()}, your interest in ${subLabel} made this the most natural thing to surface right now. It fits the moment.`

**wellness (morning + ritual):**
- Before: `A morning pick that fits your ${subLabel} interest.`
- After: `You've shown a morning ritual instinct across your picks. ${subLabel} fits that quiet slot before the day fills up.`

**home (weather + mood):**
- Before: `A ${weather()} like today — perfect for ${subLabel} inspiration.`
- After: `${weather()} tends to sharpen your home instincts. ${subLabel} surfaced for exactly that reason today.`

**entertainment (evening + cultural):**
- Before: `Based on your cultural content interest — a strong match.`
- After: `Your evening picks lean cultural and immersive. ${subLabel} surfaced for exactly that tonight.`

---

## CTA rewrite pass — Before vs After

| Before | After |
|--------|-------|
| `Explore the look` | `Show me the full look` |
| `Learn the ritual` | `Take me through the ritual` |
| `Find your corner` | `Help me explore this style` |
| `Explore music` | `Show me something like this` |
| `Plan the hike` | `Show me where this leads` |

---

## Two-line enforcement

Every reasoning string in the banks now contains exactly one `. ` boundary.
`ReasoningReveal` splits at this boundary and renders two `display:block` spans.
Width values: left `480px`, center `580px`, right `520px` (unchanged from previous pass).

---

## Letter-by-letter reveal

`ReasoningReveal` switched from word-by-word to character-by-character reveal.
- `buildCharTokens()` creates a per-character highlight mask using regex matching
- Each `<span>` renders one character with `opacity/filter` transition at `0.14s`
- Layout is stable from frame 1 (all characters present in DOM, just invisible)
- Highlights appear during typing — no post-typing animation pass

---

## Template consistency audit

| Feature | Left | Center | Right |
|---------|------|--------|-------|
| Animation sequence | GSAP 10-step | GSAP 10-step | GSAP 10-step |
| Reasoning quality | 2-line, humanized | 2-line, humanized | 2-line, humanized |
| Em dashes | Removed | Removed | Removed |
| Letter-by-letter reveal | Yes | Yes | Yes |
| Highlight during typing | Yes | Yes | Yes |
| CTA copy | Conversational | Conversational | Conversational |
| Products | Right edge | Right edge | None |
