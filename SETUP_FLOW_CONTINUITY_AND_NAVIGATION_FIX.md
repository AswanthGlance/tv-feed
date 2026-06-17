# Setup Flow — Continuity & Navigation Fix Pass

## Changes in this pass

### 1. 7-step progress system (single source of truth)

All 7 setup screens now show the same 7 pips. The active pip index and the "Question X of 7" label are always in sync.

| Screen | Label | Active pip |
|--------|-------|------------|
| BangaloreConfirm (Q0) | Question 1 of 7 | pip 1 |
| TVContentQuestion (Q1) | Question 2 of 7 | pip 2 |
| AudienceQuestion (Q2) | Question 3 of 7 | pip 3 |
| ShowMoreQuestion (Q3) | Question 4 of 7 | pip 4 |
| WeekendQuestion (Q4) | Question 5 of 7 | pip 5 |
| StyleQuestion (Q5) | Question 6 of 7 | pip 6 |
| SelfieScreen (Q6) | — (no label, progress only) | pip 7 |

Previously: BangaloreConfirm had 4 pips and no label; Q1–Q5 had 6 pips and a mismatched label. Selfie had 4 pips.

### 2. Select All removed

Removed from: `TVContentQuestion`, `WeekendQuestion`, `StyleQuestion`.

No replacement. Users navigate between cards with ← → and select with OK/Enter. Done/Skip is reached via ↓.

### 3. Done button focus decoupled from selection state

**Before:** Done button turned white/active whenever `selected.length > 0`.

**After:** Done button is always visually neutral (dim) unless `focusArea === 'done'`. Only when the user explicitly navigates ↓ to Done does it receive the focused/lit state.

Pattern applied uniformly across `TVContentQuestion`, `ShowMoreQuestion`, `WeekendQuestion`, `StyleQuestion`:
```
background: focusArea === 'done' && phase === 'cards' ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.28)',
color: focusArea === 'done' && phase === 'cards' ? '#111' : 'rgba(255,255,255,0.4)',
```

### 4. Up navigation: Done → cards

When `focusArea === 'done'`, pressing ↑ returns focus to the card row (`setFocusArea('cards')`). Already present in most components; confirmed consistent across all multi-select questions.

### 5. ShowMoreQuestion — Explore More as 4th card (in-place expansion)

**Before:** `PAGE_A` (4 cards) → "Explore more" button in action row → page-swap slide to `PAGE_B` (4 different cards). The first 4 cards disappeared.

**After:**
- Initial row: `[Travel, Wellness, Sports, Explore More]` — Explore More is the 4th card, visually distinct (dashed border, `+` icon).
- Tapping Explore More: state flips to `expanded = true`. The initial 3-card row stays. A second row of 6 extra cards (`music-perf, fashion, home, arts, tech, food`) fades in below with GSAP.
- All 9 cards remain selectable simultaneously. No page swap. No navigation away.
- Extra options: Music & performances, Fashion & style, Home & interiors, Arts & culture, Tech & new things, Food & dining.

Keyboard: when focus is on the Explore More card slot (index 3) and user presses Enter, `handleExpand()` fires instead of `toggleSelect`.

### 6. What was NOT changed

- Question copy (exact text preserved on all screens)
- Highlight/border style on selected cards
- Mascot asset and agentMode values
- Cinematic text reveal (CinematicText component)
- L0 feed, T2, T3, Preference Collection (InterstitialQuestion.tsx untouched)
- BangaloreConfirm's 3-line acknowledgement model
- All signal writing logic (applyOnboardingSignal calls)

## Files modified

- `src/components/Activation/BangaloreConfirm.tsx` — added progress label + 7 pips
- `src/components/Activation/SelfieScreen.tsx` — 7 pips, active on last
- `src/components/Calibration/TVContentQuestion.tsx` — label/pips, removed Select All, fixed Done
- `src/components/Calibration/AudienceQuestion.tsx` — label/pips
- `src/components/Calibration/ShowMoreQuestion.tsx` — label/pips, Explore More in-place expansion, fixed Done
- `src/components/Calibration/WeekendQuestion.tsx` — label/pips, removed Select All, fixed Done
- `src/components/Calibration/StyleQuestion.tsx` — label/pips, removed Select All, fixed Done
