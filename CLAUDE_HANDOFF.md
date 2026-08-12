# Agent Thinking / Agent Journey Prototype — Handoff

**Written:** 2026-08-12, at the end of a Claude Code session that built this feature from scratch.
**Purpose:** let a fresh Claude Code session (no memory of prior conversation) continue this work without re-deriving context or accidentally regressing what already works.

This document was written by inspecting the actual repository state (file contents, `git status`, `git diff --stat`, a live `tsc -b --noEmit` run, and a running dev server) at hand-off time — not from conversation memory. Treat it as ground truth over anything that contradicts it, but if in doubt, re-verify against the code.

---

## 1. Product context

This is the **Ambient TV "Agent Thinking" / "Agent Journey" prototype** — a leadership-demo-facing screen that visualizes an AI agent (the "Agent Harness," an internal Glance system instrumented with Arize Phoenix) working through a user's request in real time, then transitioning into a polished result screen.

The product idea: on a TV, when a user asks the ambient agent something ("Plan a weekend getaway," "What can I cook tonight?"), the screen shouldn't just show a spinner — it should narrate what the agent is doing (searching, comparing, checking constraints) using short, consumer-facing language, show evidence as it's discovered, and then settle into a clean "answer" screen that shares the same visual language as the rest of the product's L1 (content/recommendation) templates.

This prototype is **not scripted**. As of this session, it renders **real traces pulled live from the actual Phoenix instance** that the real Agent Harness reports to (project `aitv-mewtwo-harness`). The request shown, the "thinking" steps, the evidence, and the final result are all derived from real span data — nothing on screen is authored/fake content, with one narrow exception noted in §8 (empty-pool fallback).

Route: **`/agent_thinking_trace`** (also responds to `/agent-thinking-trace`).

---

## 2. Current architecture

### 2.1 Directory map (everything this feature touches)

```
TV-Feed-main/
├── phoenix-openapi.json          # Real OpenAPI spec from the live Phoenix deployment (source of truth for endpoints/schemas)
├── .env                          # Local env (gitignored) — VITE_PHOENIX_BASE_URL, VITE_PHOENIX_PROJECT, GOOGLE_PLACES_API_KEY
├── .env.example                  # Committed template for the above
├── vite.config.ts                # Dev-server proxies: /api/phoenix -> Phoenix, /api/places -> Google Places API
├── src/
│   ├── AgentThinkingTraceApp.tsx # Route entry component, imports the CSS, renders <AgentExperience/>
│   ├── main.tsx                  # Pathname-based routing (no router lib) — /agent_thinking_trace registered here
│   ├── styles/agentThinkingTrace.css  # All CSS for this feature (one file, ~600 lines, class prefix `att-`)
│   ├── types/
│   │   ├── phoenix.ts            # Raw Phoenix API types (PhoenixTrace, PhoenixSpan, ...)
│   │   └── thinking.ts           # Consumer-facing domain types (ThinkingScenario, ThinkingStep, ThinkingEvidence, DataSource)
│   ├── api/
│   │   ├── phoenixClient.ts      # Phoenix HTTP client (via the Vite proxy)
│   │   └── googlePlacesClient.ts # Google Places API client (via the Vite proxy)
│   ├── adapters/                 # Pure functions: raw Phoenix data -> domain types. No React, no fetch.
│   │   ├── spanTree.ts           # Reconstructs parent/child span tree from flat span list
│   │   ├── phoenixAdapter.ts     # Span tree -> ThinkingScenario; request/response/skill extraction; spanToPseudoTrace
│   │   ├── activityMapper.ts     # Groups raw spans into consumer-facing ThinkingSteps with human labels
│   │   ├── evidenceExtractor.ts  # Extracts ThinkingEvidence from tool outputs and the final place_card/card_template response
│   │   ├── resultTemplate.ts     # Maps a detected skill -> a result page "visual skin" (chrome text only)
│   │   └── resultContent.ts      # Evidence -> ResolvedResultContent for the result page (or undefined = empty state)
│   ├── hooks/
│   │   ├── useTraceExplorer.ts   # THE main orchestration hook — fetches/picks a random real trace, builds the scenario
│   │   ├── useTracePlayback.ts   # Pure timing engine (real/demo modes, play/pause/seek/speed)
│   │   ├── useExperiencePhase.ts # loading -> thinking -> resolving -> result state machine
│   │   └── useGooglePlaceEnrichment.ts # Per-card lazy Google Places photo/details fetch
│   ├── utils/
│   │   ├── safeJson.ts           # Defensive parsing helpers for Phoenix attribute values
│   │   ├── timing.ts             # ISO timestamp helpers, demo-duration normalization
│   │   └── traceCache.ts         # localStorage cache of the last successfully-loaded real trace (offline fallback)
│   └── components/AgentThinkingTrace/
│       ├── AgentExperience.tsx   # Top-level orchestrator: wires hooks together, owns keyboard shortcuts
│       ├── ThinkingExperience.tsx    # "Thinking" screen (mascot, status, timeline, connector, evidence)
│       ├── ResultExperience.tsx      # "Result" screen wrapper (header, query chip, ResultLayout or empty state)
│       ├── ResultLayout.tsx          # Shared hero+rail visual shell for ALL result templates (reuses L1 tokens)
│       ├── QueryContext.tsx          # Top-right "You asked" chip
│       ├── ThinkingTimeline.tsx / ThinkingStepItem.tsx  # Left-side vertical step timeline
│       ├── ActiveWorkConnector.tsx   # SVG elbow connector from active step to the evidence headline
│       ├── EvidenceCanvas.tsx        # Headline + evidence card grid (thinking screen, right side)
│       ├── EvidenceCard.tsx / EvidenceSkeleton.tsx
│       ├── DevInspector.tsx          # Hidden (D key) developer panel
│       ├── DemoController.tsx        # Hidden (D key) playback scrubber bar
│       ├── layoutConstants.ts        # Single source of truth for timeline/connector/evidence-column geometry
│       ├── resultTemplates.ts        # ⚠️ DELETED this session — see §8, do not recreate; use adapters/resultTemplate.ts
│       ├── ThinkingStatus.tsx        # ⚠️ DEAD CODE — no longer imported anywhere, see §8
│       └── icons.tsx                 # ⚠️ DEAD CODE — only used by the dead ThinkingStatus.tsx, see §8
```

Reused (not modified) from the rest of the app:
- `src/components/L1/l1Constants.ts` — `LEFT_PAD`, `FOCUS_BORDER`, `FOCUS_SHADOW`, `IDLE_BORDER`, `FOCUS_TRANSITION`, `RENDERER_TOP`, `CARD_GAP`, etc.
- `src/components/L1/l1SharedComponents.tsx` — `SectionLabel`, `FocusButton` (used directly in `ResultLayout.tsx` and `EvidenceCanvas.tsx`).
- `src/components/Shared/AgentMascot.tsx` — the Rive mascot, used with `agentMode` `'looking' | 'thinking' | 'idle'`.
- `/public/images/feed/feed_29-travel-goa-coastal-road.jpg` — the local fallback image used when no real/Google photo resolves.
- `/public/glance-logo.png` — header logo.

### 2.2 React component hierarchy

```
AgentThinkingTraceApp (imports CSS)
└── AgentExperience                         (owns: useTraceExplorer, useTracePlayback, useExperiencePhase, devOpen state, keyboard listener)
    ├── ThinkingExperience                  (rendered when phase !== 'result')
    │   ├── QueryContext
    │   ├── AgentMascot + status text
    │   ├── ThinkingTimeline → ThinkingStepItem[]
    │   ├── ActiveWorkConnector
    │   └── EvidenceCanvas → EvidenceCard[] / EvidenceSkeleton[]
    ├── ResultExperience                    (rendered when phase === 'result')
    │   ├── QueryContext
    │   └── ResultLayout (or the inline empty-state div if no usable evidence)
    │       └── EnrichedImage (local, defined inside ResultLayout.tsx) × hero + supporting
    ├── DemoController                      (dev-only, shown when devOpen)
    └── DevInspector                        (dev-only, shown when devOpen)
```

### 2.3 State management / hooks

No global state library — everything is hook composition at the `AgentExperience` level:

- **`useTraceExplorer()`** — owns: the candidate root-span pool, the currently loaded trace/scenario, data source, skill, result template, warnings. Exposes `loadNew()` (bound to **N**).
- **`useTracePlayback(scenarioData)`** — pure playback clock. Takes the `ThinkingScenario` from the explorer and derives `activeStepIndex`, `stepStatuses`, `visibleEvidence`, `isComplete`, etc. Exposes `play/pause/restart/seek/nextStep/prevStep/setSpeed/toggleMode`.
- **`useExperiencePhase(isLoading, isPlaybackComplete, resetKey)`** — the `loading → thinking → resolving → result` state machine. `resetKey` is `explorer.matchedTrace?.trace_id ?? 'loading'`; changing it forces back to `'loading'`.
- Local `useState<boolean>` for `devOpen` in `AgentExperience`.
- `useGooglePlaceEnrichment(placeId)` — per-card, called from `EvidenceCard` and internally inside `ResultLayout`'s `EnrichedImage`.

There is **no Redux/Zustand/Context** — deliberate, matches the rest of this codebase's style (plain hooks throughout).

### 2.4 Scenario architecture (⚠️ this changed significantly this session — read carefully)

**There is no fixed scenario registry anymore.** An earlier version of this feature had a hand-authored `scenarioRegistry.ts` with 6 fixed use cases (travel/recipe/sports/entertainment/fashion/local) and a matching mechanism that tried to find a real Phoenix trace for each. **That entire system was deleted this session** per explicit user instruction ("do not stick to usecases based on L1 outputs... every time I refresh, come up with different types of scenarios").

Current model: **trace-first, not scenario-first.**

1. `useTraceExplorer` fetches a batch of up to 200 real `harness.turn` root spans in one call (`listRootTurnSpans`), each already carrying `input.value`, `output.value`, `turn.skills_selected` as span attributes.
2. Filters to "viable" ones (`isViableRoot`: has non-empty request + response + at least 1 token).
3. Picks one **genuinely at random**, avoiding immediate repeats via an in-memory `Set<traceId>` (`usedTraceIds`), until the pool is exhausted, then allows repeats again.
4. Fetches that one trace's full span set (`fetchSpansForTrace`), builds a `ThinkingScenario` via `buildThinkingScenario` — **no scenario-level overrides of request/headline** (that override mechanism was removed from `phoenixAdapter.ts` this session).
5. The visual "skin" (section-label wording only) is resolved from the *real* detected skill via `resolveResultTemplate` in `adapters/resultTemplate.ts` — see §7 for the mapping table.

**Files deleted this session** (do not recreate without being asked): `src/data/scenarioRegistry.ts`, `src/hooks/useScenarioSelection.ts`, `src/adapters/scenarioFallback.ts`, `src/types/scenario.ts`, `src/hooks/usePhoenixTracePool.ts` (superseded by the batched approach), `src/hooks/useAgentThinkingSession.ts` (superseded by `useTraceExplorer`), `src/hooks/usePhoenixTraces.ts`, `src/hooks/usePhoenixTrace.ts`.

### 2.5 Result / L1 template architecture

There are **not** 6 separate result page components. There is **one shared layout** (`ResultLayout.tsx`) that mirrors the existing L1 `RecommendationRenderer`'s DNA (hero image card left, editorial title/description center, supporting-item rail right), parameterized by:
- `content: ResolvedResultContent` (all real data — title, subtitle, description, images, supporting items) from `adapters/resultContent.ts`.
- `supportSectionLabel: string` (chrome text only) from `adapters/resultTemplate.ts`'s `RESULT_TEMPLATE_CHROME`.

`ResultTemplateId` is a 7-value union: `'travel' | 'recipe' | 'sports' | 'entertainment' | 'fashion' | 'local' | 'general'`. `'general'` is the catch-all for any detected skill that isn't explicitly mapped (see §7).

`deriveResultContent()` in `resultContent.ts` is the single place that turns a `ThinkingScenario`'s flattened evidence into page content. It returns `undefined` when there's no usable evidence at all, which `ResultExperience.tsx` renders as an explicit "No structured result in this trace" empty state (`.att-result-empty`) — **never** fabricated placeholder content.

### 2.6 Phoenix integration architecture

```
Browser
  │  fetch('/api/phoenix/v1/projects/aitv-mewtwo-harness/spans?...')
  ▼
Vite dev-server proxy (vite.config.ts)  ──rewrites /api/phoenix → strips prefix──▶  VITE_PHOENIX_BASE_URL (real internal host)
```

The browser **never** sees the internal Phoenix hostname or any credential — see §4 for full endpoint details.

---

## 3. Level 1 implementation — what currently works

All of the following is implemented and was manually verified via Playwright screenshots + `tsc -b --noEmit` during this session (see §10 for exact verification detail):

- ✅ **Thinking experience** — mascot + status text + vertical timeline + SVG elbow connector + evidence card grid, all built from real span data.
- ✅ **Phoenix integration** — live, verified against the real OpenAPI spec (`phoenix-openapi.json`), reading real traces from `aitv-mewtwo-harness`.
- ✅ **Trace selection** — genuinely random real trace per page load and per **N** press, sampled from a live-fetched batch of up to 200 candidates, non-repeating within a session until exhausted.
- ✅ **Span mapping** — `activityMapper.ts` groups raw spans (`harness.turn` children: `llm.call`, `memory.retrieval`, `tool.*`) into 1-5 consumer-facing steps via run-length-encoded categorization, with per-skill label banks.
- ✅ **Timeline** — continuous connecting line (flexbox-based, geometry from `layoutConstants.ts`), progressive reveal (only started steps render), active-step focus border matching L1's `FOCUS_BORDER`/`FOCUS_SHADOW`.
- ✅ **Evidence/results** — progressive evidence per step (real `PlaceSearch`/`GetRoute`/`WebSearch` tool outputs during thinking; the curated final `place_card`/`card_template`/plain-text response on the result page).
- ✅ **Final L1 transition** — `thinking → resolving (300ms delay + 850ms fade) → result`, driven by `useExperiencePhase`, no ad-hoc `setTimeout`s in visual components.
- ✅ **Scenario randomization** — see §2.4; verified across multiple real, distinct traces in one test run (Uzbekistan trip, Thailand resort, chicken-curry-vs-dal nutrition comparison — all different real skills/queries).
- ✅ **Replay (R)** — restarts playback of the **same** currently-loaded trace (does not refetch). Verified: trace ID identical before/after R press.
- ✅ **Keyboard controls** — D (dev panel), Space (play/pause), R (replay), N (new trace), ←/→ (prev/next step), 1/2/3/4 (0.5x/1x/1.5x/2x speed), T (real/demo timing toggle).
- ✅ **Developer panel** — connection status dots (Phoenix pool, Google Places), data-source badge, meta grid (skill, phase, trace id, template, pool size), 4 tabs (SESSION / RAW SPANS / MAPPED STEPS / EVIDENCE), 4 action buttons (Replay / New Scenario / Jump to Result / Back to Thinking).
- ✅ **Query placement** — top-right, small "You asked" label + low-emphasis translucent pill (`QueryContext.tsx`), shows the real detected `input.value` from the trace.
- ✅ **Caching/fallback** — `traceCache.ts` persists the last successfully-loaded real trace to `localStorage`; used automatically if a later Phoenix fetch fails, so the leadership screen never goes blank on a transient outage.

---

## 4. Phoenix integration (detail)

### 4.1 Base URL / environment variables

Defined in `.env` (gitignored) and templated in `.env.example`:

```
VITE_PHOENIX_BASE_URL=https://phoenix.ailooks.internal.glance.com
VITE_PHOENIX_PROJECT=aitv-mewtwo-harness
GOOGLE_PLACES_API_KEY=            # currently blank — see §8
```

`VITE_PHOENIX_BASE_URL` is read in `vite.config.ts` (Node context, via `loadEnv`) to configure the dev-server proxy target. `VITE_PHOENIX_PROJECT` is read client-side in `phoenixClient.ts` via `import.meta.env.VITE_PHOENIX_PROJECT`.

**This is an internal-only hostname.** It requires the developer's machine to be on the corporate VPN. When VPN is down, `curl`/`fetch` to it fails with DNS `NXDOMAIN` — this happened mid-session and resolved itself once the user reconnected VPN. This is expected, not a bug.

### 4.2 Project name

`aitv-mewtwo-harness` — the real Agent Harness's Phoenix project.

### 4.3 Endpoints currently used

Verified against the real `phoenix-openapi.json` (52 total paths in the full spec; only these are used):

| Endpoint | Used for | Client function |
|---|---|---|
| `GET /v1/projects/{project_identifier}/spans?name=harness.turn&limit=200` | Batch-fetch root turn spans across many traces in one call — the discovery pool | `listRootTurnSpans()` in `phoenixClient.ts` |
| `GET /v1/projects/{project_identifier}/spans?trace_id={id}&limit=1000` | Fetch the full span tree for one selected trace | `fetchSpansForTrace()` |
| `GET /v1/projects/{project_identifier}/traces?...` | Defined (`listTraces()`) but **not currently called** by the main flow — kept for potential dev-panel use | `listTraces()` |

**Important, confirmed via the real spec:** there is **no `GET /v1/traces/{trace_id}`** endpoint (only `DELETE`). This is why `spanToPseudoTrace()` in `phoenixAdapter.ts` exists — it reconstructs a `PhoenixTrace`-shaped object directly from a root span's own fields (`start_time`, `end_time`, `llm.token_count.*` attributes) instead of making a second API call.

The `/spans` endpoint also supports (confirmed in spec, not all currently used): `attribute=key:value` filtering, `span_kind`, `status_code`, `parent_id` (use `"null"` for roots-only), `cursor` pagination. No `sort`/`order` param exists on `/spans` (unlike `/traces`, which does support `sort=start_time|latency_ms&order=asc|desc`) — live-tested: results come back roughly-recent-first but not strictly monotonic.

### 4.4 Trace fetching logic

See §2.4 step-by-step. Key function: `useTraceExplorer.selectFrom()` in `src/hooks/useTraceExplorer.ts`.

### 4.5 Span fetching logic

`fetchSpansForTrace(traceId)` → `listSpans({ traceId, limit: 1000 })` → `GET /v1/projects/aitv-mewtwo-harness/spans?trace_id={id}&limit=1000`.

Span tree reconstruction: `buildSpanTree()` in `adapters/spanTree.ts` — builds a `Map<span_id, SpanNode>`, links by `parent_id`, sorts children chronologically by `start_time` (does **not** trust API return order). `findPrimaryRoot()` prefers a `span_kind === 'CHAIN'` root (this is always `harness.turn` in real data).

### 4.6 Relevant Phoenix types

`src/types/phoenix.ts` — `PhoenixTrace`, `PhoenixSpan`, `PhoenixSpanContext`, `PhoenixSpanEvent`, list-response wrappers. These were verified field-for-field against the real `Span`/`TraceData` schemas in `phoenix-openapi.json` this session — they match exactly, no changes needed.

### 4.7 Adapters (raw → domain)

| File | Responsibility |
|---|---|
| `spanTree.ts` | Flat span list → parent/child tree |
| `phoenixAdapter.ts` | Tree → `ThinkingScenario`; `extractUserRequest`/`extractFinalResponse`/`extractSkill`/`extractSkillRaw`; `spanToPseudoTrace` |
| `activityMapper.ts` | Root's children → grouped `ThinkingStep[]` with human labels (see §4.8 for the grouping logic) |
| `evidenceExtractor.ts` | Tool outputs + final response text → `ThinkingEvidence[]` |

### 4.8 Known span attributes (confirmed real, not guessed)

On the root `harness.turn` span (`span_kind: CHAIN`, `parent_id: null`):
`input.value`, `input.message`, `output.value`, `turn.skills_selected` (⚠️ **often multi-valued**, e.g. `"fashion, travel"` — see `extractSkillRaw` vs `extractSkill`), `turn.tool_call_count`, `turn.latency_ms`, `llm.token_count.prompt`, `llm.token_count.completion`, `llm.token_count.total`, `user.intent`, `session.id`, `model`, `system_prompt.content`.

On `TOOL` spans: `tool.name`, `tool.input` (JSON string), `tool.output` (JSON string or plain text), `tool.is_error`, `tool.duration_ms`.

Observed `span_kind` values in real data: **`CHAIN`, `LLM`, `RETRIEVER`, `TOOL`** only. `GUARDRAIL`/`RERANKER`/`EVALUATOR`/`EMBEDDING`/`AGENT` are handled defensively in `activityMapper.ts` (per the Phoenix docs' speculative list) but have never actually been observed.

Observed span **names**: `harness.turn`, `llm.call`, `memory.retrieval`, `tool.PlaceSearch`, `tool.NearbyPlaces`, `tool.PlaceDetails`, `tool.PlaceReviews`, `tool.GetRoute`, `tool.GetWeather`, `tool.WebSearch`, `tool.WebFetch`, `tool.VTONGenerate`, `visual.resolve` (a trailing `RETRIEVER`-kind span after the final `llm.call` — resolves photo references, **not** a memory lookup; a real bug was found and fixed this session where this was mislabeled "Recalling your preferences").

### 4.9 Known real tool output shapes

- `tool.PlaceSearch` / `tool.NearbyPlaces` output: `{ query, total_results, places: [{ place_id, name, formatted_address, rating, user_rating_count, price_display, open_now, phone, website, google_maps_uri, latitude, longitude, photo_url }] }`. `photo_url` is a **relative path** (`/api/photo?name=places%2F...`) — see §4.10.
- `tool.GetRoute` output: `{ origin, destination, distance_meters, distance_text, duration_seconds, duration_text, routes: [...] }`. `destination` is a **full address**, not just a place name (`evidenceExtractor.extractRouteEvidence` accounts for this).
- Final `output.value` on `harness.turn` contains one of: `<place_card>` blocks (curated, ranked, with `<badge>`/`<rating>`/`<why>`/`<visual place_id=.../>`), `<card_template>` (generic sections/points), `<product_ids>`, or plain text — always followed by a `<suggestions>` block that's stripped before display.

### 4.10 Known limitations

- **No absolute host for `photo_url`.** It's a relative path meant for the Agent Harness's own backend, not Phoenix. Images from it will essentially always 404 in this prototype. Handled with a 3-tier fallback chain everywhere (Google Places → harness `photo_url` → local static image) — see `EvidenceCard.tsx` and `ResultLayout.tsx`'s `EnrichedImage`.
- **No single-trace GET endpoint** — see §4.3.
- **`turn.skills_selected` is often multi-valued** and includes an `aigc_*` family (`aigc_food`, `aigc_travel`, `aigc_experiences`) not documented anywhere, discovered by live-sampling 200 real traces.
- Real skills observed with **no real trace data yet** in casual sampling: `sports`, `weather_planner`, `home_decor` (only ever seen combined with another skill, e.g. `"fashion, home_decor"`). These will still render correctly if/when real traces exist — the code doesn't special-case them — but haven't been visually verified against real content.

### 4.11 CORS / proxy setup

`vite.config.ts` registers two proxies:
- `/api/phoenix/*` → `VITE_PHOENIX_BASE_URL`, path-rewritten to strip the `/api/phoenix` prefix. Only registered if the env var is set.
- `/api/places/*` → `https://places.googleapis.com`, path-rewritten similarly, with a `configure` hook that injects `X-Goog-Api-Key` server-side on every proxied request (stripping any client-supplied header first) and is **always** registered (even with no key) so the client gets a clean error response instead of a dev-server 404.

### 4.12 Expected 403s / API failures

- **Google Places 403 (Forbidden)** on every card — **expected**, `GOOGLE_PLACES_API_KEY` is currently blank. This is not a bug; the fallback chain handles it silently. Confirmed via multiple smoke-test runs with only these 403s in console output.
- **Phoenix 502 (Bad Gateway) or DNS `NXDOMAIN`** — happens when Phoenix itself is having issues or VPN is down. Both were observed live during this session and the app degraded correctly (fell to cache, showed an honest error in the dev panel, never blanked the leadership screen).

---

## 5. Existing visual implementation

- **Canvas: fixed 1920×1080**, same convention as the rest of this app — absolute positioning, no CSS `transform: scale()`. Root wrapper reuses the app-wide `#scaler`/`#stage` IDs (see `tv.css`) for consistent full-bleed sizing.
- **Typography/spacing base:** reused from L1, not redefined — `LEFT_PAD = 72px` (side margins), `Plus Jakarta Sans` / `Inter` font stack (declared in `.att-stage`).
- **Key layout measurements** (all in `layoutConstants.ts`, the single source of truth — timeline, connector, and evidence column geometry are all derived from these constants so they cannot drift out of sync):
  - `TIMELINE_LEFT = 72`, `TIMELINE_TOP = 210`, `TIMELINE_WIDTH = 460`, `STEP_ROW_HEIGHT = 56`, `DOT_CENTER_OFFSET = 28`
  - `EVIDENCE_LEFT = 620`, `EVIDENCE_TOP = 220`, `HEADLINE_CONNECT_Y = 229`
- **Timeline:** flexbox column (`display: flex; flex-direction: column` on `.att-timeline`), **not** manually-positioned absolute rows — this was a deliberate fix this session (see §9) so row height changes can never desync the connecting line from the actual dot positions. Only steps that have started render (progressive reveal, no greyed-out placeholder future steps).
- **Connector:** a plain SVG right-angle elbow (`ActiveWorkConnector.tsx`), not a curve — an earlier bezier-curve version was deliberately replaced this session per explicit user feedback ("if this curve cannot be implemented cleanly, remove it... a clean straight/elbow connector is acceptable").
- **Cards:** `.att-evidence-card` (252×320px, 18px radius) and `.att-result-support-card` reuse L1's dark translucent card treatment (`rgba(20,12,40,0.8-0.7)` background + `backdrop-filter: blur(18px)`), `FOCUS_BORDER`/`FOCUS_SHADOW` on the highlighted/active card.
- **Gradients:** `.att-bg` (linear-gradient base) + `.att-bg-glow` (radial purple glow, matches L1's `RecommendationRenderer` background treatment) + `.att-bg-vignette` (bottom fade).
- **Focus states:** directly reuse `FOCUS_BORDER = '2px solid rgba(255,255,255,0.88)'` and `FOCUS_SHADOW` from `l1Constants.ts` — applied to the active timeline step and the highlighted (first) evidence/support card.
- **Animations:** CSS-only — `att-card-reveal` (evidence card fade/slide-in), `att-shimmer` (skeleton loading placeholder), `att-draw-line`/`.att-connector path` stroke-dasharray draw-in (defined but note: the connector's draw-in animation styling exists in CSS but the actual elbow path itself is redrawn fresh via React key-less re-render each step change — verify visually if revisiting).
- **Result transition:** `.att-thinking-layer--resolving` (opacity+translateY fade-out) → `.att-result-layer` (`att-result-in` keyframe fade+translateY-in). Timed by `useExperiencePhase`: 300ms pause after playback completes, then an 850ms resolving state, then result.

---

## 6. Current demo behavior (exact)

- **On initial load:** `useTraceExplorer`'s mount `useEffect` fires `fetchPool()` (batch spans call) → on success, `selectFrom(viable)` picks a random trace and fetches its full spans → `ThinkingScenario` built → phase machine moves `loading → thinking` → `useTracePlayback` starts auto-playing in **demo timing mode** (default `mode: 'demo'` in `useTracePlayback`) at **1x speed**.
- **On browser refresh:** identical to initial load — a completely fresh `fetchPool()` call, so a new random batch and a new random trace. (The in-memory `usedTraceIds` non-repeat set is also reset, since it lives in component state.)
- **Pressing R:** `playback.restart()` (elapsed → 0) + `backToThinking()` (phase → `'thinking'`). Does **not** refetch — replays the exact same currently-loaded trace. Verified: trace ID identical before/after.
- **Pressing N:** `explorer.loadNew()` — if the in-memory pool batch is non-empty, resamples from it (fast, no network call); only re-fetches the batch if it was ever empty. Picks a new random trace (excluding recently-used ones), triggers `useExperiencePhase`'s `resetKey` change (new `trace_id`) which forces phase back to `'loading'` then `'thinking'` once ready, and `useTracePlayback` hard-resets elapsed to 0 because the `traceId` changed.
- **Pressing D:** toggles `devOpen` local state — shows/hides `DemoController` (playback scrubber bar, bottom-left) and `DevInspector` (right-side panel, 560px wide, z-index 50 — covers whatever's underneath it, including the right portion of result-page support cards; this is expected/accepted, not a bug).
- **Scenario selection behavior:** fully described in §2.4 — random from a live batch, non-repeating within a session, no fixed category matching.
- **Phoenix trace selection behavior:** described in §4.4.

---

## 7. Existing result templates (not "scenarios" anymore — see §2.4)

There are no more fixed scenarios. There are **7 result template IDs**, each just a small chrome-text config (`RESULT_TEMPLATE_CHROME` in `adapters/resultTemplate.ts`) resolved from whatever real skill the loaded trace actually has:

| Template ID | Support label | Mapped from real skill(s) |
|---|---|---|
| `travel` | MORE NEARBY STAYS | `travel`, `aigc_travel` |
| `recipe` | MORE IDEAS | `food`, `aigc_food` |
| `sports` | MORE ON THIS | `sports` |
| `entertainment` | MORE TO EXPLORE | `events` |
| `fashion` | COMPLETE THE LOOK | `fashion` |
| `local` | MORE NEARBY | `local_experiences`, `aigc_experiences` |
| `general` | MORE OPTIONS | anything unmapped (`home_decor`, `weather_planner`, unknown skills, no skill) |

All 7 use the exact same `ResultLayout.tsx` component — there are no per-template React components. `resolveResultTemplate(skillRaw)` in `resultTemplate.ts` splits multi-valued skill strings on comma and matches the first known label.

---

## 8. Known issues / TODOs

1. **Dead code — safe to delete, not yet done:**
   - `src/components/AgentThinkingTrace/ThinkingStatus.tsx` — no longer imported anywhere (status text is now inlined directly in `ThinkingExperience.tsx`).
   - `src/components/AgentThinkingTrace/icons.tsx` — only consumed by the dead `ThinkingStatus.tsx` above.
   - Confirmed via `grep` at hand-off time — both files exist on disk but have zero live importers.
2. **`DataSource` type has a vestigial member.** `src/types/thinking.ts` still declares `'demo-presentation'` as a valid `DataSource` value, left over from the deleted scripted-fallback system. `useTraceExplorer` never produces this value anymore (only `'phoenix-live' | 'phoenix-cached' | 'unavailable'`). Not a bug, just an unused type option — clean up if convenient.
3. **Empty-pool fallback has no content, not scripted content.** If Phoenix is reachable but returns zero viable traces (`isViableRoot` filters everything out) AND there's no localStorage cache, `useTraceExplorer.loadFromCache()` sets `loadedStatus: 'error'` and `loaded: undefined` — the UI shows "Connecting..." forever (via `ThinkingExperience`'s `isLoading` fallback) rather than a distinct "nothing available" message. This is an edge case that has not been observed in practice (the real pool has consistently had 150-200 viable candidates) but is a real gap if it ever occurs.
4. **`GOOGLE_PLACES_API_KEY` was never provided.** All Google Places enrichment runs in "not configured" mode (confirmed 403s in every test run this session). The plumbing (proxy, client, hooks, fallback chain) is fully built and tested-as-far-as-possible without a real key — the moment a key is added to `.env`, it should work with zero code changes, but this has **not** been verified against a real key.
5. **`sports`/`weather_planner`/`home_decor` result templates are code-complete but visually unverified** — no real trace with these as the *primary* detected skill was observed during this session's testing (see §4.10).
6. **Connector draw-in animation** — CSS keyframes (`att-draw-line`) exist but weren't specifically re-verified visually after the elbow-connector rewrite; worth a visual check if touching `ActiveWorkConnector.tsx` again.
7. **`listTraces()` in `phoenixClient.ts` is currently unused** by the main flow (kept for potential future dev-panel "browse all traces" UI, or could be removed if truly dead).
8. **Pre-existing, unrelated uncommitted changes** exist in `src/App.tsx`, `src/components/Feed/FeedScreen.tsx`, `src/logic/feedComposer.ts` (108 lines changed total). These predate this session's work, were never touched by it, and are **not part of the Agent Thinking Trace feature** — do not assume they're related, and do not revert them as part of Agent Thinking Trace cleanup without checking with the user first.

---

## 9. Important implementation decisions — do not accidentally undo these

1. **No fixed scenario registry.** Do not reintroduce a hardcoded list of "the 6 supported use cases." The explicit product direction is: pick a real random trace, render whatever it actually contains, resolve the visual skin dynamically from the real detected skill. If asked to "add a new scenario," the right move is almost always extending `SKILL_TO_TEMPLATE`/`RESULT_TEMPLATE_CHROME` in `resultTemplate.ts`, not authoring new fake content.
2. **Never author placeholder/fake result content again.** `resultContent.ts` returns `undefined` rather than inventing content when there's no real evidence. This was a deliberate, explicit user requirement ("make sure this is the same response we will get in agent harness"). Do not add a "nice placeholder" fallback that isn't real trace data.
3. **`layoutConstants.ts` is the single source of truth for timeline/connector/evidence geometry.** The original bug this session was fixed by centralizing these numbers — do not reintroduce separate hardcoded pixel math in `ThinkingStepItem.tsx`, `ActiveWorkConnector.tsx`, and `EvidenceCanvas.tsx` independently.
4. **The connector is a straight elbow, not a curve.** This was an explicit user correction ("if this curve cannot be implemented cleanly, remove it"). Don't reintroduce a bezier without being asked.
5. **The timeline uses flexbox row stacking, not `position: absolute` with manually computed `top` offsets.** This was the actual root cause of an earlier "disconnected dots" bug. Don't revert to absolute positioning for step rows.
6. **API key handling: `GOOGLE_PLACES_API_KEY` must never get a `VITE_` prefix.** That would bundle it into client JS and expose it in the browser. It's injected server-side only, via the Vite proxy's `configure` hook in `vite.config.ts`. Same principle for any future secret.
7. **`phoenix-openapi.json` is the source of truth for Phoenix endpoints/schemas**, not public Phoenix documentation or assumptions. Re-download it (`curl -L https://phoenix.ailooks.internal.glance.com/openapi.json -o phoenix-openapi.json`) if the deployment might have changed, before making adapter changes.
8. **`extractSkillRaw` vs `extractSkill`** — `turn.skills_selected` is frequently multi-valued. `extractSkill` (singular) takes just the first label for internal step-labeling purposes; `extractSkillRaw` preserves the full string for display/template-resolution. Don't collapse these into one function.
9. **R (replay) must never refetch** — it must replay the exact same loaded trace. N (new) is the only action that samples a new one. Don't merge these behaviors.
10. **Every image has a 3-tier fallback (Google Places → harness-provided URL → local static asset), implemented via a tier-advancing index, not a simple boolean "failed" flag.** A naive 2-state (`failed: boolean`) fallback was a real bug found and fixed this session (`ResultLayout.tsx`'s `EnrichedImage` got stuck re-requesting the same broken URL). If touching image fallback logic, preserve the `renderedIndex`-based tier-advancement pattern.

---

## 10. Verification

**Typecheck status at hand-off:** ✅ clean. Verified live: `npx tsc -b --noEmit` exits `0` with no output.

**Commands to run:**
```bash
npm install
npm run dev          # Vite dev server — verified running on http://localhost:5178 at hand-off (may pick a different port; 5175-5177 were occupied by other sessions)
npx tsc -b --noEmit   # typecheck only, no build output
npm run build         # tsc -b && vite build
```

**Known console output (not warnings, expected):**
- `Failed to load resource: the server responded with a status of 403 (Forbidden)` — Google Places, expected with no API key configured.
- Occasional `502 (Bad Gateway)` or DNS failures against the Phoenix proxy — expected if Phoenix itself is degraded or VPN drops; the app degrades gracefully (see §8.3 for the one real gap).

**What has already been tested** (via a headless Playwright script driven through the Bash tool, screenshots visually inspected):
- Fresh page load → real trace loads → thinking timeline renders correctly → real evidence appears progressively.
- Dev panel (D) shows correct connection status, meta grid, and tab contents.
- Jump to Result → real result content renders (verified against several different real traces: a Uzbekistan trip, a Thailand resort booking, a chicken-curry-vs-dal nutrition comparison).
- New Scenario (N) cycled 5+ times in a row — confirmed genuinely different real traces/skills each time, no repeats, no console errors beyond the expected 403s.
- Replay (R) — confirmed same trace ID before/after, phase correctly resets to `'thinking'`.
- Result page with dev panel closed — confirmed no visual overflow/clipping (the earlier apparent overflow was the dev-panel overlay covering content, not a real layout bug).
- Hero/support image fallback chain — confirmed local fallback image renders when both Google Places (not configured) and the harness's broken `photo_url` fail.

**Not tested:** a real `GOOGLE_PLACES_API_KEY`; the `sports`/`entertainment`/`home_decor`/`weather_planner` result templates against a real trace where that's the primary skill; behavior when the trace pool is genuinely empty (see §8.3); production build output (`vite build`) was not run this session, only `tsc -b --noEmit`.

---

## 11. Next planned feature — Level 1 / Level 2 / Level 3

The forward plan (as communicated by the user) is a three-level framework:

- **Level 1 — Visible Progress.** This is **everything documented above** — the current implementation. It must **not regress** while building Level 2. Any future work should treat §1-§10 of this document as a regression baseline.
- **Level 2 — Progressive Value.** Not yet started. Not specified in detail as of this hand-off — get requirements from the user before implementing.
- **Level 3 — Collaborative Agent.** Should, for now, be **only a placeholder** — do not build real functionality for it until explicitly asked.

**Do not implement Level 2 or Level 3 logic in this hand-off.** This document's job is only to describe Level 1's current state accurately so the next session can safely build on top of it.
