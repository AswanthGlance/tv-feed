# Glance TV — Product Experience PRD
**Owner:** Veda Vaddi, PM, Glance TV
**Date:** June 2026
**Status:** v3 — design partnership + working prototype reference

> **v3 update:** A working, clickable prototype now exists at `Glance_TV_Project/Glance_TV_Prototype.html` — a 100+ card feed split into a new-user journey and a returning-user journey, with the agent mascot, agent-first copy, visual preference cards, AI-generated visuals (Nano Banana / Gemini), and the full interaction model live. Sections 17–19 document what's built and the perceived-intelligence narrative for stakeholders.

---

## 1. Executive summary

Glance TV is an AI-first ambient screensaver experience for the television. It transforms idle TV time into a personalized, visually premium, intelligent feed that users actively engage with. The product earns clicks by feeling beautiful, smart, personal, and **agentic** — not by interrupting attention but by attracting it and acting on the user's behalf.

The defining bet: **most feeds rank silently and hope you click; Glance makes its intelligence visible.** A single AI agent introduces each card, explains *why it's relevant to you*, reacts to your choices in real time, and offers to act on your behalf. Perceived intelligence — not a better ranking model — is the moat.

This document defines the end-to-end product experience: how a user encounters Glance TV for the first time, how the feed evolves over time, how the system signals its intelligence, how it expresses agency, and how users exercise control. Sections 17–19 reflect the built prototype.

**North-star objective:** drive clicks per session through an ambient, personalized, AI-native screensaver feed.

**Primary metric:** clicks per session (CTR per card)
**Secondary metrics:** DAU%, session length, click-through depth, repeat sessions, Send-to-Phone conversions, save rate

---

## 2. Product positioning

Glance TV is **not**:
- An ad surface
- A mobile lock screen on TV
- A curated content app the user opens

Glance TV **is**:
- An ambient, always-ready, AI-curated visual feed
- A discovery layer for the entire TV experience
- An **agent** that learns the household, acts on its preferences, and earns the click
- The first screen a user sees when they sit down — and the one they reach for the remote on

---

## 3. User context

| Dimension | Reality |
|---|---|
| **Surface** | Television, full-screen, 4K-capable |
| **Posture** | Lean-back, passive, often distracted |
| **Identity** | Shared household, no login at day zero |
| **Input** | 5-button remote (Up/Down/Left/Right/OK), Back, voice on premium TVs |
| **Trigger** | Auto-launches on idle or boot, per OEM integration |
| **Distance** | 8–12 feet from screen — visuals must read at distance |
| **Audio** | Ambient music allowed, no surprise audio jumps |

---

## 4. Day zero experience

### 4.1 First trigger
Glance TV launches automatically — pre-installed via OEM. The user did not opt in. The first impression must therefore be **earned in 10 seconds**.

### 4.2 First card
- Premium full-screen visual chosen from regional + temporal priors
- Subtle bottom-corner CTA: *"Press OK to explore"*
- Auto-advances after 8 seconds if no input
- No brand splash, no onboarding, no permissions ask

### 4.3 First-session feed mix (~5 cards)
Designed for fastest signal pickup with zero user data:

1. **Trending entertainment** — sports highlight, movie trailer, music — built for clicks
2. **Visually striking AI-art / ambient** — tests aesthetic taste
3. **Contextual utility** — weather, local news — proves usefulness
4. **Regional popularity** — "Top 10 in [region] this week" — proves relevance
5. **Interactive AI card** — trivia, "Ask Glance," story prompt — tests engagement appetite

### 4.4 Day-zero signals (zero user data required)
- Region (IP/OEM) → language, sports league, content bias
- Time of day → morning vs evening content profile
- Day of week → weekday vs weekend mix
- Device model + OEM → screen size, voice support
- Preceding app context → previous app the user was on
- Regional popularity priors → what clicks here, now

### 4.5 The three feelings to deliver in 30 seconds
1. **"This is beautiful"** — premium visual quality, never ad-banner energy
2. **"This is for me"** — at least one regionally or contextually relevant card
3. **"I can do something with this"** — clear, low-friction CTA on at least one card

Hit all three → earn session 2. Miss any → screensaver feels like noise.

---

## 5. Feed composition (steady state)

10–20 cards per session, auto-advancing every 6–10 seconds. Default mix:

| Category | % | Role |
|---|---|---|
| Entertainment (sports, movies, music) | 40% | Click magnet |
| Ambient / AI-generated visuals | 20% | Aesthetic anchor, retention |
| News / utility | 15% | Daily reason to return |
| Interactive / AI-native cards | 15% | Engagement + "smart" perception |
| Commerce / sponsored (visually native) | 10% | Monetization, never aesthetic break |

Ratios shift dynamically based on user signal, time of day, and household profile.

---

## 6. Signals collected

### 6.1 Implicit (from day zero, zero user effort)
- Dwell time per card (full vs early skip)
- Skip events — explicit "next" press = strong negative
- Click events — opened, watched, tapped CTA
- Click depth — single click vs full consumption
- Session length — time before user switched to another app
- Time-of-day pattern
- Repeat-exposure decay — same category losing appeal
- Voice query patterns
- App-switch attribution — clicked movie card → opened Netflix

### 6.2 Explicit (low-friction, layered in over time)
- Thumbs up / down (Right / Left on remote)
- "More like this" / "Less like this" via hold-OK menu
- Optional onboarding prompt after session 3 — *"What do you like?"*
- Profile selection — *"Who's watching?"* for shared households
- Voice — *"Glance, show me more cricket"*

---

## 7. Feed evolution — 4 phases

### Phase 1 — Sessions 1–3 (cold start)
- Heavy reliance on regional + temporal priors
- Wide content mix to gather signal fast
- Pure exploration, no personalization yet
- **Goal:** earn first 2–3 clicks to bootstrap the model

### Phase 2 — Sessions 4–10 (early personalization)
- Implicit signals reshape the mix
- Bias toward winning categories
- Introduce explicit feedback prompts
- Test interactive AI cards once user has clicked at least once

### Phase 3 — Sessions 10+ (personalized)
- Fully personalized feed
- AI-generated cards tailored to taste — *"calm visuals like the ones you liked"*
- Profile-aware if household has set them up
- Active diversification to avoid filter bubble

### Phase 4 — Long-term retention
- Periodic novelty injection
- Seasonal / event-driven content (cricket finals, holidays, festivals)
- Cross-session memory — *"Continue where you left off"*
- Weekly *"Your week in 5 cards"* recap

---

## 8. Making the feed *feel* intelligent

Perceived intelligence ≠ actual model quality. A silent good recommendation feels like luck; one that names its reason feels like a mind-reader.

### 8.1 The "Because you…" label
Every card carries a tiny, elegant attribution line:
- *"Because you liked the IPL highlight"*
- *"Trending in Bangalore right now"*
- *"Calm visuals — like the ones you saved"*
- *"Your evening usually starts with this"*
- *"First time on Glance? Most-loved this week"*

**Design constraint:** one short line, low-opacity, bottom corner, never obscures visual. Premium type, never noisy.

### 8.2 Visible reaction to user actions
The biggest perceived-intelligence win: the feed changes in front of the user.
- Thumbs up → next card transitions in with *"More like that, coming up"*
- 3 quick skips → *"Switching gears"* + visibly different category
- Click → next session opens with *"Picking up where you left off"*
- Voice query → confirm intent on screen — *"Showing cricket highlights"*

Sub-second feedback = "it heard me." Latency = "this is dumb."

### 8.3 Time + context awareness, made obvious
- 7am → *"Good morning — here's your day"*
- Friday evening → *"Weekend's here — top picks"*
- Match day → *"India vs Australia starts in 2 hours"*
- Rainy weather → *"Cozy picks for a rainy evening"*

Cheapest, highest-impact intelligence cue.

### 8.4 Memory that surfaces itself
- *"You watched this trailer last week — here's the release date"*
- *"The artist you liked dropped a new track"*
- *"Continue the AI story you started yesterday"*
- *"Your top 3 categories this month: cricket, ambient art, Bollywood"*

### 8.5 Anticipation, not just reaction
- *"You usually watch sports around now — IPL highlights ready"*
- *"Tomorrow's match: pre-saved for you"*
- *"Based on tonight's vibe, here's what's next"*

Prediction = the system has a model of you. Strongest intelligence signal possible.

### 8.6 AI-native cards that show generation
- *"Generated for you, just now"* badge
- Subtle 1-second generation reveal animation
- *"A scene inspired by your last visit"*
- *"A question we made for you"* — personalized AI trivia

### 8.7 Intelligent questions, sparingly
Once or twice per week, surface a thoughtful explicit-feedback card:
- *"We noticed you skipped 4 sports cards this week — show less sports?"*
- *"You loved the calm visuals on Sunday — make those a daily thing?"*
- *"Two paths for you — which feels right today?"* (with two visual options)

Systems that *ask* feel more intelligent than systems that *guess*.

### 8.8 Visible diversity + novelty
- *"Something new for you"* — explicit exploration card
- *"Outside your usual — trying this"*
- *"Discovery pick of the day"*

Labeled exploration says "the system is curious on your behalf."

### 8.9 The Glance personality layer
Subtle, consistent voice across all copy — labels, transitions, prompts. Witty, warm, never-cringe. Three-to-four word lines on transitions. Intelligence is partly read as *taste*.

### 8.10 The "smart reveal" — one signature moment per session
Once per session, a card demonstrates *non-obvious* intelligence:
- *"You watched 3 sports cards this week, but skipped tennis — only showing cricket now"*
- *"We noticed your evenings are calmer than mornings — adjusting"*
- Weekly *"Your week in 5 cards"* recap

One "wow, it noticed that" moment outweighs 50 mediocre recommendations.

### 8.11 What NOT to do
- Vague copy — *"Curated for you"* = meaningless
- Generic reasons — *"Because you're in India"*
- Asking for feedback the system doesn't visibly act on
- AI-generated badges on everything — dilutes the signal
- Chatbot UI breaking the ambient aesthetic

---

## 9. Making the feed *feel* agentic

Smart and agentic are not the same thing.
- **Smart feed** = "it picks well for me" (passive intelligence)
- **Agentic feed** = "it *did something* for me" (visible action)

For Glance to feel agentic, the user must *see* the agent doing — not just experience the polished result.

### 9.1 The three things a user must see to perceive agency
1. **The agent doing things — live** (action visible in the moment)
2. **The agent having done things — between sessions** (reports back on work done while away)
3. **The agent committing to do things — going forward** (standing tasks the agent owns)

If the user only sees outcome (a good card), it's a smart feed. If they see action, history, and forward commitment, it's agentic.

### 9.2 Live action moments
The agent visibly working, narrated in ambient grammar (no chatbot UI):
- *"Pulling last night's IPL highlights for you…"* — brief loading-state with intent narrated
- *"Generating something for your evening…"* — the 1-second AI reveal framed as agent action, not magic
- *"Checking the score…"* → *"India needs 24 runs"* — fetch + report, visible

Users see *work happening*, not just results appearing.

### 9.3 Between-session reports — *"while you were away"*
A dedicated card type that opens session 2, 3, 4…:
- *"While you were away, I saved 3 cricket clips you missed"*
- *"I found the trailer for the movie you liked — released today"*
- *"I've been watching for new calm visuals — 5 new ones ready"*

The agent existed *between* your sessions. That's what makes it feel alive.

### 9.4 Proactive offers — *"want me to do this?"*
Not recommendations — **offers to act**. The user accepts, agent commits.
- *"Want me to remind you when the match starts?"*
- *"Should I keep watching for new episodes of this show?"*
- *"Want me to find more like this every week?"*
- *"Send tomorrow's highlights to your phone automatically?"*

An agent is something you *delegate to*. Offering to take a task on is the most agentic gesture possible.

### 9.5 Standing watches
A small, always-available view of *what the agent is currently doing for you*:
- *"Watching: IPL final tickets, new episodes of [show], calm-visual updates"*
- *"Tracking 3 things for you"*

Memory + persistence + commitment in one glance.

### 9.6 Acted-on-its-own moments
Agent took initiative on a standing preference, reports it as done:
- *"I noticed your Sundays are calmer — I queued calm content for tonight"*
- *"You usually skip news in evenings — I'll hold news till morning from now on"*
- *"You loved this artist — I added their new track to your queue"*

**Critical principle:** every agent action must trace back to an inferred *standing preference*, never an arbitrary action. This is the bias-toward-preferences-over-actions rule.

### 9.7 First-person voice
Tiny but huge. *"I"* makes the feed an actor.
- *"I think you'll like this"* — not *"Recommended for you"*
- *"Saved for you"* — not *"Saved"*
- *"I'll let you know"* — not *"You'll be notified"*

One pronoun shift and the feed has a self.

### 9.8 Visible cross-surface hand-offs
The agent moves things across surfaces on your behalf:
- *"Sent the recipe to your phone"* (with confirmation animation)
- *"Added the match to your calendar"*
- *"Queued for tomorrow morning"*

An agent that only acts on its own surface is a feature. An agent that acts *across* surfaces is a presence.

### 9.9 A presence
A subtle, persistent identity — small glyph, signature, or wordmark — that *is* the agent. Not a chatbot face, not a mascot. A premium, ambient referent so "the system" becomes "someone."

### 9.10 Smart feed vs Agentic feed — the distinction in practice

| Smart feed | Agentic feed |
|---|---|
| Outputs a label | Says *"I noticed X — switching to Y"* |
| Generates a card | Says *"I made this for your evening"* |
| Picks an order | Says *"I started with calm because it's late"* |
| Personalizes silently | Reports *"I learned you skip tennis — adjusting"* |
| Recommends content | Offers to *act* on your behalf, then does |
| Works invisibly | Has a presence — name, voice, persistence |

Same engine underneath. Different perception entirely.

### 9.11 Minimum viable agentic perception
Three changes carry the most weight:
1. **First-person voice** across all card copy — costs nothing, lifts perception immediately
2. **One "while you were away" card** opening every session after the first — proves the agent exists between sessions
3. **One proactive offer per session** — *"Want me to…?"* — proves the agent acts on the user's behalf

Ship those three and the feed crosses from smart to agentic without major new infrastructure.

### 9.12 What NOT to do
- Don't expose raw thinking — *"I considered 12 cards and ranked them by…"* ❌
- Don't fake "while you were away" reports — silence beats theater (hide empty sections)
- Don't act on arbitrary preferences — every "I did X" must trace back to inferred standing preference
- Don't use chatbot bubbles, thinking dots, or anthropomorphic faces
- Don't break the ambient aesthetic with conversational UI grammar

---

## 10. Agent voice & copy system

The agent speaks in a consistent voice across every surface. This section is the rulebook for design + content partners.

### 10.1 Voice attributes
- **Warm** — never robotic, never chirpy
- **Concise** — every line under 8 words where possible; transition lines 3–4 words
- **Confident, never boastful** — *"I think you'll like this"*, not *"You will love this!"*
- **Specific** — names the reason, the thing, the time. Generic copy is forbidden.
- **Calm** — no exclamation marks, no urgency theater
- **Premium** — vocabulary that fits a beautiful ambient surface, not a notification bar

### 10.2 The four agent speech modes

The agent only speaks in one of four modes. Every line must fit one.

**1. NOTICE — naming what the agent observed**
- *"You watched 3 IPL highlights this week"*
- *"Your evenings are calmer than mornings"*
- Use for: smart-reveal cards, "Because you…" labels, attribution

**2. DO — narrating live action**
- *"Pulling last night's highlights…"*
- *"Generating something for your evening"*
- Use for: loading states, AI generation reveals, fetch operations

**3. REPORT — past action, brought back to the user**
- *"I saved 3 cricket clips while you were away"*
- *"Sent the recipe to your phone"*
- Use for: "while you were away" cards, hand-off confirmations, acted-on-its-own moments

**4. OFFER — asking for delegation**
- *"Want me to remind you when the match starts?"*
- *"Should I keep watching for new episodes?"*
- Use for: proactive offers, standing-watch setup, preference confirmations

If a line doesn't fit one of these four modes, rewrite it.

### 10.3 First-person rules
- Use *"I"* in REPORT, OFFER, and DO modes
- Avoid *"I"* in NOTICE mode — the user is the subject (*"You watched…"*, not *"I noticed you watched…"* — the latter feels surveilled)
- Never *"we"* — Glance is one agent, not a team
- Never *"the system"*, *"our algorithm"*, *"AI" as a noun

### 10.4 Forbidden patterns
- *"Curated for you"* — vague
- *"Recommended"* — passive, anonymous
- *"Powered by AI"* — never name the mechanism
- *"You might like…"* — hedged; the agent has a point of view
- Exclamation marks
- Loading dots without narrated intent
- Anthropomorphic flourishes — *"I'm thinking…"*, *"Let me see…"*, emoji

### 10.5 Length budgets
- Card label (Because you…): max 8 words
- Card transition copy: 3–4 words
- "While you were away" headline: max 10 words
- Offer copy: one sentence, must end in `?`
- Smart-reveal copy: max 14 words

### 10.6 When the agent should NOT speak
- When there's nothing real to say (no preference inferred yet, no work done between sessions)
- On every single card — over-attribution feels surveilled. Roughly 40–60% of cards carry agent copy; the rest let the visual carry
- When the user is in fast-skip mode (3+ skips in a row) — back off, let the feed reset

### 10.7 Examples — same intent, four modes

| Mode | Bad | Good |
|---|---|---|
| NOTICE | *"Recommended for you"* | *"You watched 3 IPL highlights this week"* |
| DO | *"Loading…"* | *"Pulling last night's highlights"* |
| REPORT | *"New content available"* | *"I saved 3 clips while you were away"* |
| OFFER | *"Enable notifications?"* | *"Want me to remind you when the match starts?"* |

---

## 11. User agency — how users control the experience

### 11.1 Core principle: progressive agency
Start with one button doing one obvious thing. Reveal more controls only as the user shows engagement. Glance must never feel like an app the user has to *learn*.

### 11.2 Layer 1 — Zero-effort agency (works from card 1)

**OK button = universal "I want this"**
- One press → behavior depends on card type
- Trailer → plays full
- Product → opens detail
- AI art → saves to My Picks
- News → expands story
- Always reversible — Back returns to feed instantly

**Up / Down = navigate the feed**
- Down = skip (also strong "not interested" signal)
- Up = go back to the last card (huge UX win — users miss cards constantly on auto-advance)

**Left / Right = quick reactions (when card focused >2s)**
- Right = more like this / save
- Left = less like this / hide
- Subtle on-screen hint after 2s, fades by 4s

### 11.3 Layer 2 — Hold gestures
- **Hold OK (1s)** → card actions menu (Save, Share to phone, More like this, Hide category)
- **Hold Down (1s)** → pause auto-advance, dwell on a card

### 11.4 Layer 3 — Voice (premium TVs)
First-class agency unlock:
- *"Glance, show me cricket"*
- *"Glance, save this"*
- *"Glance, more calm visuals"*
- *"Glance, what is this?"*
- *"Glance, send to my phone"*
- *"Glance, skip ahead to news"*

Voice intent must be confirmed visibly on screen.

### 11.5 Layer 4 — Send to phone (highest-leverage feature)

The TV is great for ambient; the phone is great for action. Bridge the two:
- QR code overlay on hold-OK
- Or *"Glance, send to my phone"* → push notification with card link
- Or paired phone app receives a TV → Phone queue

**Use cases:**
- Save recipe to cook later
- Send product to buy on phone
- Save article to read in bed
- Share trailer to friend

This is the single biggest unlock for *click + downstream conversion*.

### 11.6 Layer 5 — My Picks (personal collection)
Every card OK'd, saved, or thumbed-up lands here.
- Accessible via dedicated remote button OR top-of-feed entry card (*"Your Saves — 12 new"*)
- Filterable by category, date, type
- Auto-organized: *"Sports highlights," "AI art you've liked," "Recipes"*
- Re-watch, re-share, remove

### 11.7 Layer 6 — Profile + identity (shared TVs)
- Quick *"Who's watching?"* on launch (Netflix model)
- Voice ID-based profile detection
- Time-based profile inference — 7am parents, 4pm kids, 9pm adults
- Guest mode — generic feed, no save

### 11.8 Layer 7 — Glance Hub (explicit control center)
Dedicated entry point with full-screen control surface:
- Categories I love / don't want
- Schedule — *"More news in mornings, entertainment at night"*
- AI generation preferences
- Notification settings — *"Tell me when there's a new match"*
- **Standing watches** — visible list of what the agent is tracking for the user, with one-press cancel

Visible to the 20% who want control; invisible to the 80% who don't.

### 11.9 Layer 8 — Ask Glance (conversational agency)
Once per session, a card invites direct dialogue:
- *"Anything you want to see today?"*
- *"Tell Glance what mood you're in"*
- *"Ask Glance anything"*

Voice or text input. Glance responds with a curated mini-feed. **The AI-native signature feature.**

### 11.10 Layer 9 — Cross-session continuity
- *"Continue where you left off"* on next session
- *"You saved 3 things last night — want to revisit?"*
- *"Your Friday evening setup is ready"*

### 11.11 What NOT to do
- Settings menu on day one
- Login required for basic agency
- Save buried three clicks deep
- Fake voice on remotes without mics
- Checkbox-laden control panels — use full-screen visual control surfaces

---

## 12. Click design principles

Every card must answer: **"Why would someone reach for the remote right now?"**

- Visual hook in first 2 seconds
- Single dominant value prop (watch trailer, see highlight, learn more)
- One CTA — never two competing actions
- Reward the click — fast, beautiful, no buffering
- Easy back-out — one button returns to feed; never trap the user

### Connection between agency, agent, and clicks
Agency *and* agentic perception together drive clicks:
- **Send to Phone** → click that converts on a higher-engagement surface
- **My Picks** → re-engagement loop → repeat clicks across sessions
- **Voice queries** → high-intent click signals
- **Quick reactions** → every press feeds the model → higher CTR next session
- **Proactive offers** → each accepted offer is a click + a standing commitment
- **"While you were away" cards** → high-CTR re-engagement openers

---

## 13. Design priorities (for design partnership)

Ordered by impact-per-effort:

### Must-ship (v1)
1. Full-screen card visual system (premium typography, distance-readable)
2. **"Because you…"** label component
3. OK = primary action, with smart card-type dispatch
4. Up = back-a-card, Down = skip, Left/Right = quick reactions
5. Auto-advance with subtle progress indicator
6. Onboarding-free first card, with corner CTA
7. Visible reaction to thumbs up / skip
8. Time + context announcement cards
9. One "smart reveal" per session
10. **Agent voice system applied across all copy** (first-person, four-mode rule)
11. **"While you were away" card template** — opens session 2+
12. **Proactive offer card template** — *"Want me to…?"*

### Should-ship (v1.5)
13. Send to phone (QR + push)
14. My Picks collection screen
15. Hold-OK card actions menu
16. Profile switcher (*Who's watching?*)
17. Voice query confirmation overlay
18. AI generation reveal animation + badge — framed as agent DO mode
19. **Agent presence glyph / signature**
20. **Live action narration** (loading states with intent — *"Pulling highlights…"*)

### Could-ship (v2)
21. Glance Hub control center — including **standing watches view**
22. Ask Glance conversational card
23. Weekly *"Your week in 5 cards"* recap
24. Cross-session continuity card
25. Cross-surface hand-off confirmations (*"Sent to your phone"*, *"Added to calendar"*)

---

## 14. Open questions

- **Shared identity** — voice ID vs profile select vs time-of-day inference?
- **Click attribution** — if a card opens Netflix outside Glance, do we count it?
- **Cold-start latency** — can we pre-fetch cards before screensaver triggers?
- **Ad blending threshold** — at what % does sponsored content erode trust?
- **Generative quality bar** — AI visuals must hit premium quality or cheapen the whole feed
- **Feedback friction** — is implicit signal enough, or do we need lightweight explicit?
- **Voice fallback** — what's the experience on remotes without mics?
- **Agent presence design** — glyph vs wordmark vs motif? Where does it appear?
- **Offer accept/decline UX** — how does the user respond to *"Want me to…?"* with a 5-button remote?
- **Standing watch surface** — embedded in Glance Hub vs always-visible mini-indicator?

---

## 15. 90-day success criteria

To be set with data team:
- Day-1 click rate ≥ X% of sessions
- Day-7 DAU% ≥ Y%
- Average clicks per session ≥ Z
- Average engaged session length ≥ N seconds
- Send-to-Phone conversion rate ≥ M%
- My Picks save rate ≥ K saves per active user per week
- **Proactive-offer accept rate ≥ P%** — proxy for agentic trust
- **"While you were away" card CTR ≥ Q%** — proxy for between-session salience
- **Survey: "Glance feels like it works for me"** — top-2 box ≥ R%

---

## 16. What we need from design

### Card system
- **Card visual system** — typography, layout, hierarchy, distance-readable at 10ft
- **"Because you…" label treatment** — premium, unobtrusive, consistent across card types
- **Smart reveal card template** — the signature intelligence moment
- **AI generation reveal** — the 1-second moment that says "made for you"

### Agentic surfaces
- **Agent presence glyph / signature** — the persistent referent
- **Agent voice system** — typographic & motion treatment for NOTICE / DO / REPORT / OFFER modes
- **"While you were away" card template** — opens sessions 2+
- **Proactive offer card template** — *"Want me to…?"* with accept/decline affordance on remote
- **Live action narration** — loading state language + motion grammar (*"Pulling highlights…"*)
- **Standing watches view** — visible list of agent commitments
- **Cross-surface hand-off confirmations** — *"Sent to your phone"* moments

### Interaction & control
- **Remote interaction affordances** — when do hints appear, how do they fade
- **Hold-OK action menu** — radial vs sidebar vs bottom sheet
- **Send-to-Phone moment** — QR placement, animation, confirmation
- **My Picks screen** — grid system, filters, empty state
- **Profile switcher** — visual identity per profile, switch flow
- **Glance Hub** — full-screen visual control surface (not a settings panel)
- **Voice confirmation overlay** — how heard intent is shown on screen

### System
- **Glance personality system** — voice/tone guidelines for all copy (this doc has the rules; design owns the visual expression)

---

## 17. Prototype as built (v3)

A working, self-contained prototype is live at `Glance_TV_Project/Glance_TV_Prototype.html` (single HTML file + local `images/`). It is the reference implementation of this PRD and the artifact used for stakeholder and design reviews.

### 17.1 Structure — two journeys, one feed
The prototype is a **100+ card feed** with a visible chapter split for presenting:

**New-user journey (cards 1–~30):**
1. **Hero intro** — agent front & center: *"Hello, I'm Glance. I'm your AI assistant…"*
2. **"Let me get to know you"** — sets up onboarding
3. **Location confirmation** — *"I see you're in Bangalore — that right?"* (Yes / I'm elsewhere). Establishing location is treated as load-bearing for relevance.
4. **Visual preference cards** — evening vibe, your Bangalore, this week's plate (each center-stage, image tiles)
5. **"Building your feed"** — progressive checklist
6. **Signal-anchored feed** — every card cites a pick + city + live weather (weather, a new restaurant opening, coffee ritual, AI-generated scene, fashion edit, travel escape, etc.)
7. **Mid-feed preference check-ins** — cuisine, style, travel style, tonight's plan, weekend vibe, weekend planning

**Chapter divider** — *"Chapter Two · Returning user"* (presentation aid).

**Returning-user journey (cards ~31–100):** assumes weeks of history — clicks, saves, streaks, waitlists, expiring packs, calendar-aware nudges (a friend's birthday, your anniversary, a price drop on dates you searched). Copy leads with the remembered signal: *"You rated their saison five stars,"* *"Twelve-day streak,"* *"You nearly booked this last month — the price just came down."*

### 17.2 Content categories covered
Food & dining, cafés, nightlife, culture, wellness & fitness, outdoors, heritage, home/tech, **fashion** (handloom, boutique, streetwear), and **travel** (road trips, beaches, nature stays, heritage towns) — each with matching preference tiles and AI-generated visuals.

### 17.3 Interaction model (built)
- **Agent-first reveal** — on each content card the agent types its *why-it's-relevant* reasoning first; the glance (title, subtitle, tag) reveals only after.
- **One mascot, always** — a single violet agent types the line, then physically travels to the CTA and "hands it over." Never two faces on screen.
- **CTA = a yes/no the agent asks** — italic question + a single **Yes** to accept and act.
- **Visual preference cards** — large image tiles, center stage. **Max 4 boxes; the last is always "Explore more."** Single-select auto-advances; multi-select confirms with a CTA.
- **Friendly acknowledgements** — every preference pick triggers a warm, specific reply ("Got it — slow, calm evenings are your thing, my kind of night too") before advancing. Applies everywhere a preference is given.
- **Mascot moods** — confident / proud / curious / hesitant / thinking, expressed through the agent's face per card.
- **Smart typing** — during idle auto-play the agent types; on manual ↑/↓ the content shows instantly (no waiting); after ~12s idle, auto-play with typing resumes.
- **Dynamic copy** — downstream cards interpolate the user's real picks via `{tokens}` (`{evening}`, `{bangalore}`, `{week}`, `{weekend}`), so the feed re-weaves around what was chosen.
- **No auto-scroll lock** — the user browses at their own pace; nothing advances against them.

### 17.4 Visual system (built)
- **Premium violet identity**, deep-indigo backgrounds, film-grain texture, Apple-grade easing (`cubic-bezier(0.32,0.72,0,1)`).
- **Every card has a real background image** — no bare cards. Lively generative backdrops on intro/concept cards.
- **Layout variance** — content cards rotate bottom-left / centered / bottom-right with varied vignettes so the feed never feels repetitive.
- **All imagery generated via Nano Banana (Gemini 2.5 Flash Image) at 16:9, 1920×1080** — see Section 19.

### 17.5 Known scope boundaries of the prototype
- Picks adapt copy **client-side** (no live LLM at runtime) — chosen so the demo opens anywhere, offline.
- "Send to phone," My Picks, profiles, voice, and the Glance Hub (Sections 9–11) are specified but not yet in the prototype.

---

## 18. Why it feels intelligent (the pitch)

For stakeholder and partner conversations. Most feeds rank content silently and hope you click; Glance does the opposite — **it shows its thinking**, and that is what makes it feel alive.

1. **It speaks before it shows.** The agent types *why this is for you* before the content appears. You're not scrolling a grid — a companion is walking you through your evening.
2. **It earns the right to recommend.** Day zero it asks three things and confirms your city; every card after visibly traces back to a signal you gave. Nothing feels random.
3. **It reacts in real time.** Pick "calm evenings" and it replies in kind, then re-weaves the feed around it. You see the system listen and change.
4. **It has a face and a point of view.** One violet agent walks each action over to the CTA — confident on strong picks, curious on a bet, proud of what it made for you. Body language reads as intelligence.
5. **It acts, not just suggests.** CTAs are offers to *do* — hold a table, plan the route, ping you Friday. An assistant, not a billboard.

**One-liner:** *"Every other feed makes you feel watched. Glance makes you feel understood — because it shows you the thinking, reacts to you live, and acts on your behalf."*

**Why it matters commercially:** perceived intelligence drives trust; trust drives clicks. The edge is making intelligence *visible* — cheaper and more defensible than competing on ranking models alone.

---

## 19. Content generation pipeline (built)

Feed visuals are generated with **Nano Banana (Gemini 2.5 Flash Image)** on Vertex AI:
- Project `glanceai-prod-5aea`, model `gemini-2.5-flash-image`, `responseModalities:["IMAGE"]`, `imageConfig.aspectRatio:"16:9"`.
- Output upscaled to **1920×1080** for crisp full-screen TV display; saved to local `images/`.
- House prompt style: *"Cinematic premium ambient widescreen photograph for a luxury TV screensaver, photorealistic, warm filmic color grade, no text, 16:9."*
- **Production implication:** this is the engine for "truly AI" generative content — cards (especially the "made for you, just now" scenes) can be generated on demand from a user's taste signals and live context (city, weather, time), not just curated.

---

*End of document.*
