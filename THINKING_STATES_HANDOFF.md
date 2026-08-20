# Agent Thinking States — Engineering Handoff

This is the entry point for anyone picking up the Agent Thinking States system — most importantly, the Android team building the production TV experience.

## What this system is

While the agent works (8–35 seconds in the real captures this was built from), the TV should never show a blank spinner. Instead, it progressively communicates real, useful progress — what it understood, where it's looking, what it's finding — derived entirely from real Agent Harness events. Nothing shown is fabricated to fill time.

**Thinking state is not a loader. It is progressive, useful output.**

## Where things live

| What | Where |
|---|---|
| **Documentation site** (the real entry point — start here) | https://claude.ai/code/artifact/08f1205f-3106-47b9-bcad-1d087cff1c28 |
| **Reference prototype** (live) | https://tv-feed-sandy.vercel.app/agent_thinking_trace?level=2 — press `D` for dev chrome, `R` to replay, `N` for the next example |
| **Deep link a specific real capture** | `?level=2&source=harness_stream&scenario=q03` (any `q01`–`q10`) |
| **Exportable data snapshot** | `thinking-states-contract.json` (repo root) |
| **Standalone deployable copy of the docs site** | `docs-site/thinking-states-guide/` — see that folder's own note for the Vercel deploy command |

## Where an Android engineer should start

1. Open the documentation site above.
2. Read **§2 (Product Contract vs. Reference Implementation)** first — the web prototype is a reference, not a spec. Do not port React/CSS/GSAP.
3. Read **§16 (Android Implementation Guide)** — the recommended architecture, state shape, and Compose motion mapping.
4. Read **§5 (Thinking Pass Specification)** and **§7 (Scenario Archetypes)** for the actual behavior contract, pass by pass.
5. Walk through **§18 (Real Harness Examples)** — all 10 real captures with interactive timelines, cross-referenced to the prototype via deep links.

## Architecture, in one line

```
Agent Harness → Transport Adapter → SemanticAgentEvent[] → Classification (→ Archetype)
  → Pass Builder (→ ThinkingPass[]) → Runtime/Scheduler → Visual Renderer → Final Response
```

Android reproduces every layer's *behavior* — classification rules, pass-grouping logic, timing math, fallback rules — but rebuilds the renderer natively in Jetpack Compose. See the documentation site's Architecture section for what's platform-neutral vs. reference-implementation-only.

## Top implementation rules (the ones that matter most)

- **Raw `reasoning` tokens are never consumer-facing.** Diagnostics only, full stop.
- **Narration and canvas count must never disagree** — both read from the same resolved entity array.
- **Never fabricate**: no invented sources, no fabricated routes, no fake progress percentage, no spinner, no early-revealed final content.
- **Stable identity everywhere** — key persistent objects (candidates, sources, map elements) by `id`/`place_id`/`domain`, never by index, timestamp, or pass order.
- **Active hold, not dead air** — a long real gap keeps the current state subtly alive (§8), it never invents new semantic work.
- **Demo Timing is the default everywhere**, including real Harness captures. Real Timing is an explicit, preserved toggle for QA/dev use.

## Ownership

_(assign before wider distribution)_

## Version

Prototype v1.0 · Documentation v1.0 · Last updated 2026-08-20
