# L0 Animation Lab — Agent Presence Update

Route: `/l0_experiment` (unchanged)

---

## Core change

The mascot is now present in all three modes during reasoning reveal.
Without it, Mode B read as a generic text animation with no agent identity.
The mascot provides authorship — the reasoning belongs to someone.

---

## Files changed

| File | Change |
|---|---|
| `src/L0AnimationLab/LabColumn.tsx` | Removed dead `mascotRef` prop; removed mascot rendering from shell (modes own it) |
| `src/L0AnimationLab/useCTASequence.ts` | New — shared CTA trigger used by all three modes |
| `src/L0AnimationLab/ModeA.tsx` | Added mascot left of reasoning; uses `triggerCTA` |
| `src/L0AnimationLab/ModeB.tsx` | Added mascot left of reasoning; `agentMode` starts as `thinking`; uses `triggerCTA` |
| `src/L0AnimationLab/ModeC.tsx` | No layout change (traveling mascot is the presence); uses `triggerCTA` |

---

## Mode A — Current Typing

**Added:** `AgentMascot` (38px) rendered left of the reasoning `<p>`, flexbox row, `gap: 14`.

Mode: `thinking` during typing → `looking` at end → `idle` in CTA.

The mascot is still, blinking, present. Reads as: the agent is speaking this sentence.

---

## Mode B — Cinematic Reveal

**Added:** same `AgentMascot` (38px) left of reasoning, identical layout to Mode A.

Mode: `thinking` during reveal → `looking` → `idle` in CTA.

The mascot does not drive the reveal — it simply watches while the text comes into focus. The contrast is intentional: same agent presence, different reveal behavior.

---

## Mode C — Agent Reveals Thought

No layout change. The traveling mascot is already the agent presence.

It physically moves through the text, which is a stronger form of presence than a static mascot. Adding a second static mascot beside the text would create confusion about which is authoritative.

---

## Unified CTA sequence

Extracted to `useCTASequence.ts` → `triggerCTA()`.

All three modes now run identical CTA timing:

```
reasoning completes
  → agentMode = 'looking'  (immediate)
  → 800ms pause
  → ctaVisible = true      (CTA slides in: opacity + translateY)
  → 450ms
  → mascotInCTA = true     (mascot enters pill)
  → agentMode = 'idle'
  → state = 'done'
```

Previously: Mode A used 900ms + 500ms, Mode B used 800ms + 500ms, Mode C used 800ms + 500ms.
Now: all three use 800ms + 450ms.

---

## What to evaluate

| | A | B | C |
|---|---|---|---|
| Agent present? | Yes — static, left | Yes — static, left | Yes — traveling through text |
| Feels like ChatGPT? | Yes (baseline) | No | No |
| Most premium? | Low | High | Highest |
| Most agentic? | Low | Medium | High |
| Most readable? | High | High | Medium |
