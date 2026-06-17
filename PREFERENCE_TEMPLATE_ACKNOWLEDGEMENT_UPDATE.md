# Preference Template Acknowledgement Update

**Date:** June 2026
**Template version:** 1.0 → 1.1

---

## Summary

The Center-Stage Acknowledgement Sequence was present in the implementation but was
distributed across multiple sections of the template spec (Sections 5, 6, 7, 8)
without being named as a mandatory atomic unit.

This update gives the sequence its own dedicated section (Section 6), explicitly
marks it as non-optional, documents all 11 steps in order, and adds a mandatory
requirement to each supported use case in Section 12.

---

## Files Updated

| File | Change |
|---|---|
| `FEED_PREFERENCE_COLLECTION_TEMPLATE.md` | Version bumped to 1.1; Section 6 replaced; Section 8 expanded; Section 12 updated |

**No UI implementation was changed.** This update is documentation only.

---

## Section Added

### Section 6: Center-Stage Acknowledgement Sequence (replaced)

The former "Section 6: Center Stage Moment" documented only the FLIP card motion.
It did not describe the full sequence as an atomic unit, did not name it mandatory,
and did not include the agent position rule or multi-select stacking rule.

The new Section 6 replaces it entirely with:

1. **The mandatory declaration** — explicitly states this sequence is non-optional
   on every surface, with the emotional purpose stated up front
2. **The 11-step sequence** — the complete flow from selection to feed resume,
   numbered and in order
3. **Why the sequence is mandatory** — the three-part emotional logic:
   cards moved + agent named it + implication stated
4. **Card motion rule** — FLIP technique, same card, not a recreation,
   with the implementation rationale (vanilla DOM outside React lifecycle)
5. **Multi-select shape rule** — cards keep card form and stack as a physical deck;
   they do not become chips, pills, or a summary row; deck offsets documented
6. **Agent position rule** — agent appears below the settled deck, not above it;
   agent is secondary to the cards

---

## Section Updated

### Section 8: Memory Transition (expanded)

The former Section 8 described the exit fade correctly but did not clarify:

- What "cards move upward to become history" means in the current implementation
  vs. a future implementation with a persistent history UI
- Why the cards must remain visible during the first ~200ms of the exit fade
- What specific things to avoid and why each breaks the emotional arc

The updated Section 8 adds:

- Explicit clarification that "upward movement" is the emotional direction of exit,
  not a literal current animation — and what a literal upward animation would require
- Expanded "what to avoid" list with reasons for each anti-pattern, including:
  - Cards fading before the agent is done speaking (deck must stay while agent speaks)
  - Confirmation toasts after the reply (the agent's reply IS the confirmation)

### Section 12: Supported Use Cases (updated)

A mandatory rule block was added at the top of Section 12 before the individual
use case entries.

Each individual use case now includes an **Acknowledgement sequence:** line that
states the requirement and, for setup flow and content tone, includes a note on
why the acknowledgement is especially important in that context.

---

## Behavior Clarified

### Multi-select stacking
Selected cards fly to the same center point and settle into a **physical deck**
(rotation offsets, z-stacking, slight opacity reduction for back cards).
They do not reformat into a row, chips, or summary. The deck communicates
"I am holding your collection" — a physical container, not a list.

### Agent position
The agent appears **below** the deck, not centered above it and not beside it.
This keeps the cards as the visual subject and the agent as the commentator.
The agent speaks upward (toward the user's focus, which is on the cards).

### Mandatory on all surfaces
The sequence is not a "nice to have" for feed interstitials that can be skipped
on simpler surfaces like onboarding or setup. It is required on all surfaces because:

- In setup/onboarding: the acknowledgement is the user's **first experience** of
  Glance understanding them. Skipping it loses the most important moment in
  the entire cold-start relationship.
- In travel/shopping intent: the signal value of the collection depends on the
  user trusting that the system captured it correctly. The echo-back (Line 1 of
  the reply) is that trust signal.
- In content tuning: abstract vibes (calm, bold, deep) feel vague until an agent
  names them back. The acknowledgement makes the abstract concrete.

---

## Reuse Guidance Added

Added to Section 12:

> Any future flow using this template must include the center-stage acknowledgement
> sequence. Do not skip it. Do not abbreviate it. The `onAnswer` callback fires
> only after the full sequence completes — this is by design.

This means: if a future implementation needs to short-circuit the sequence (e.g.
for a very fast onboarding flow), that is an explicit product decision that requires
changing both the spec and the `InterstitialQuestion` component. It is not a default
shortcut.

---

## What Was Not Changed

- No UI code was modified
- The FLIP implementation in `InterstitialQuestion.tsx` was not changed
- The `StructuredReply` component and `REPLY_LINES` map were not changed
- The `QuestionConfig` schema was not changed
- Section numbers shifted by one after Section 6 (old 7 → new 7, etc.) but
  content within those sections was not changed except as noted above
- `FEED_PREFERENCE_COLLECTION_TEMPLATE_AUDIT.md` was not updated —
  the audit reflects implementation state, which did not change
