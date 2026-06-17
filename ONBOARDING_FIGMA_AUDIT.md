# ONBOARDING FIGMA AUDIT
## Source: "Setup Flow for Ambient 26.mov" + Figma node 4000-7178

---

## TOTAL FRAMES: 4 distinct screen states (+ animated transitions between each)

---

## FRAME SEQUENCE

### Frame 1 — Welcome / Monologue (3 sub-states)

**Layout:** Full-screen centered. Dark navy-purple background.
**Brand:** "glance ✦" top-left, white text, small (~22px). Star icon inline.
**Mascot:** Rive mascot centered ~40% down from top. Small (~80px). Idle state initially.
**Progress indicator:** LEFT EDGE vertical bar — 4 small dashes/pips stacked vertically, leftmost edge of screen (x≈48px, y≈360–440px).

**Animation sequence (monologue — text swaps, mascot stays fixed):**
1. Mascot appears first (scales up from 0, center screen)
2. Line 1 fades in below mascot: **"Hello, I'm Glance"**
3. Line 1 fades out → Line 2 fades in: **"I'm your AI assistant – the screen that learns."**
4. Line 2 fades out → Line 3 fades in (2-line): **"I'll turn idle time into a living feed of your city, your taste, and the night ahead."**
5. CTA appears below text: **"Let's tune my TV's vibe!"** — white pill button, dark text

**Typography:**
- Monologue lines: ~36-40px, white, center-aligned, regular/medium weight
- CTA button: ~24px, white background, dark charcoal text, large pill shape (120px height approx)

**Background:** Very dark navy, radial purple glow center, subtle vignette.

---

### Frame 2 — Location Confirm (Bengaluru)

**Transition from Frame 1:** Mascot slides up to top-center (~80px size), previous text fades, new question fades in. The cards slide up from below simultaneously.

**Layout:** Mascot top-center. Question + subtitle center. Two image cards side-by-side below.
**Progress indicator:** Left edge vertical bar — 2 of 4 pips active/bright.

**Mascot:** Stays top-center, ~60-70px. Looking state.

**Question text (center, ~40px):** **"I see you're in Bengaluru – that right?"**
**Subtitle (~20px, dimmer):** **"Choose the vibe you'd love to see"**

**Cards (2-up, landscape):**
- Left card: Bengaluru city photo (night, Vidhan Soudha lit up with light trails). Label bottom-left: **"Yes, Bengaluru"** ~28px bold white. White border focus ring on left card (selected/focused state).
- Right card: Italian/European lakeside sunset photo. Label bottom-center: **"Not quite"** ~28px white.
- Cards are large: ~460px wide × ~280px tall each. Rounded corners ~20px. Bottom gradient overlay on each.
- Gap between cards: ~24px.
- Cards centered horizontally.

---

### Frame 3 — Confirmation Bridge (post-selection)

**Transition:** Selected card (Bengaluru) zooms up and snaps to behind/below the mascot as a small thumbnail, other card exits. Then text changes.

**State A:** 
- Small Bengaluru thumbnail visible near mascot
- Text fades: **"Perfect – Bengaluru it is. Let's make this feel like yours."**

**State B (text swaps):**
- **"Let me bring more of what feels like you"**

---

### Frame 4 — Interests / Topic Selection

**Transition from Frame 3:** Cards slide in from right as a horizontal strip/carousel.

**Layout:** Mascot top-center. Title + subtitle center. Horizontal carousel of image cards below.
**Progress indicator:** Left edge vertical bar — 3 of 4 pips active/bright.

**Mascot:** Top-center, ~60-70px.

**Question text (~40px):** **"Let me bring more of what feels like you"**
**Subtitle (~20px, dimmer):** **"Choose your interest of topics"**

**Cards — HORIZONTAL CAROUSEL (scrollable, 3 visible at once, first card focused):**
- Cards: ~460px wide × ~280px tall. Large rounded corners. Image fills card. Label bottom-left ~28px bold white.
- Visible cards shown: **Home Upgrades**, **Local Discoveries**, **Game-day & sport** (partially visible right edge)
- Each card has a circle radio button top-right (~28px). Unfilled white ring when unselected. White filled when selected.
- Cards slightly offset/peek from right edge — suggests more cards offscreen.
- Focused card: white border ring + scale(1.02)

**Action buttons row (below carousel, centered):**
- **"Select All"** — dark pill button (~230px wide)
- **"Done"** — dark pill button (~230px wide), dim/disabled initially

---

## BRAND TREATMENT

- "glance ✦" — lowercase, white, ~22px, top-left corner
- Star/sparkle character inline with word mark
- NO separate spark icon square (unlike current implementation)
- NO "Glance" capitalized

---

## PROGRESS INDICATOR

- **LEFT EDGE vertical bar** — not top-right horizontal pips like current
- 4 vertical dashes, ~4px wide × ~28px tall each
- Spaced ~12px apart
- Active steps: white/bright; inactive: very dim white/grey
- Position: x≈48px, y≈center-left area (~360–440px range)

---

## MASCOT

- Rive mascot used throughout
- Frame 1: center screen, ~80-100px, starts idle, shifts to looking after greeting
- Frames 2–4: top-center, ~60-70px (smaller, moves up)
- The mascot MOVES from center to top-center on transition between Frame 1 → Frame 2

---

## ANIMATION NOTES (from video)

### Frame 1 — Monologue pacing:
- Mascot appears: ~0.8s scale/fade in from center
- Line 1 ("Hello, I'm Glance"): appears ~1.2s after mascot
- Line 1 → Line 2 swap: ~1.5s display → crossfade ~0.5s
- Line 2 → Line 3 swap: ~1.5s display → crossfade ~0.5s
- CTA appears after Line 3: ~0.8s delay → fade up from below

### Frame 1 → Frame 2 transition:
- Content fades/slides up and out
- Mascot translates from center to top-center (y-axis move)
- New content (question + cards) rises up from below
- Duration: ~0.7s total

### Frame 2 — Card interaction:
- Left card (focused) has white border ring visible on load
- Arrow left/right to swap focus between cards

### Frame 2 → Frame 3 (Bengaluru selected):
- Selected card shrinks/zooms to thumbnail near mascot
- Other card fades out to right
- Confirmation text fades in below mascot
- Duration: ~0.6s

### Frame 3 → Frame 4 (topic question):
- Previous text fades/crossfades to new question
- Cards slide in from right as horizontal strip
- First card enters with slight spring
- Duration: ~0.7s

### Horizontal carousel:
- Focused card has white ring + slight scale up
- Navigating right: cards slide left (next card comes from right)
- Cards maintain peek on both left and right edges

---

## COLORS

| Element | Color |
|---|---|
| Background | Very dark navy `#080618` area with purple radial glow |
| Purple glow center | `rgba(80, 30, 160, 0.35)` |
| Text primary | `#FFFFFF` |
| Text secondary/dim | `rgba(255,255,255,0.55)` |
| CTA button bg | `#FFFFFF` |
| CTA button text | `#111111` dark |
| Card bg fallback | Dark purple |
| Progress pip active | `#FFFFFF` |
| Progress pip inactive | `rgba(255,255,255,0.18)` |
| Radio unchecked | `rgba(255,255,255,0.0)` fill, `rgba(255,255,255,0.7)` stroke |
| Radio checked | `#FFFFFF` fill |
| Card focus ring | `#FFFFFF` border |

---

## REUSABLE COMPONENTS

1. **GlanceBrand** — "glance ✦" top-left wordmark
2. **VerticalProgress** — left-edge 4-pip vertical progress bar
3. **MascotHeader** — mascot positioned top-center (used in Q screens)
4. **MonologueLine** — animated text that swaps via crossfade
5. **ImageCard** — image + gradient overlay + label, reused for location + topic tiles
6. **HorizontalCarousel** — scrolling strip of ImageCards
7. **CTAPill** — large rounded pill button

---

## KEY DIFFERENCES FROM CURRENT IMPLEMENTATION

| Current | Figma |
|---|---|
| WelcomeScreen: large 96px title | Monologue: sequential line swaps, ~36-40px |
| Progress: horizontal pips top-right | Progress: vertical bar LEFT edge |
| BangaloreConfirm: text buttons | 2 large image cards side-by-side |
| WorldsQuestion: 4×2 grid of tiles | Horizontal carousel, cards ~460px wide |
| Mascot: stays centered on welcome | Mascot moves from center → top on question screens |
| Brand: "✦ Glance" square spark + word | "glance ✦" lowercase inline |
| No "Select All" / "Done" buttons | "Select All" + "Done" pill buttons under carousel |
| Subtitle text different | Exact copy as documented above |
