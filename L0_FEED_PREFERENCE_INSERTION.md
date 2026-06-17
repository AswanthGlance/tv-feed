# L0 Feed + Preference Insertion

## Previous overlay behavior — removed

`OVERLAYS_ENABLED` in `FeedScreen.tsx` is now `false`. The old approach of showing
`InterstitialQuestion` as a blocking overlay on top of the L0 feed is disabled.
The code is preserved; flip the flag to re-enable if needed.

---

## Feed composer

**File:** `src/logic/feedComposer.ts`

```
composeFeedWithPreferences(l0Items, questions) → UnifiedFeedItem[]
```

Rules:
- Insert one preference card after every **5** L0 cards (`PREFERENCE_INTERVAL = 5`)
- Use at most **6** preference questions per session (`MAX_PREFERENCE_CARDS = 6`)
- Preserve original L0 order and template alignment
- First item is always an L0 glance (never a preference card)

---

## Unified feed item types

```ts
type GlanceFeedItem    = { type: 'glance';     id: string; item: FeedItem }
type PreferenceFeedItem = { type: 'preference'; id: string; question: QuestionConfig }
type UnifiedFeedItem   = GlanceFeedItem | PreferenceFeedItem
```

---

## Preference card component

**File:** `src/components/Feed/PreferenceCard.tsx`

Thin wrapper around `InterstitialQuestion`. Receives `prevImage` (the last L0
card's image) as the blurred background so it feels like part of the feed.
Not an overlay — mounted in the same slot as an L0Glance.

---

## Renderer (L0PreviewApp + FeedScreen)

Both renderers branch on `item.type`:

```
if type === 'glance'     → <L0Glance />
if type === 'preference' → <PreferenceCard />
```

`FeedScreen` receives `unifiedFeed?: UnifiedFeedItem[]` as a prop. When provided
it uses it for rendering; the `feed: FeedItem[]` prop is still used for signal
and dwell logic.

---

## Navigation

- `feedIdx` indexes the unified feed (not the raw L0 feed)
- `handleFeedNav` in `App.tsx` uses `unifiedFeed.length` as the loop boundary
- Preference card items are skipped in skip-fast signal logic
- `PreferenceCard` → `onAnswer` / `onSkip` both call `onNext(0)` → feed advances

---

## Personalization hook

When user answers a preference card:
1. `onAnswer(opt)` calls `onInterstitialAnswer(opt.label, opt.boosts, opt.confirmationText)`
2. This applies `applyThumbsUpSignal(p, boosts, label)` to the profile
3. `rerankTail` reorders upcoming feed items based on the updated weights
4. `composeFeedWithPreferences` recomposes the unified feed with the new ranked order

Future hook point: `feedComposer.ts` can accept a `usedQuestionIds` set to skip
already-answered questions and adapt which questions appear.

---

## Files changed

| File | Change |
|------|--------|
| `src/logic/feedComposer.ts` | New — `UnifiedFeedItem`, `composeFeedWithPreferences()` |
| `src/components/Feed/PreferenceCard.tsx` | New — first-class feed item wrapper |
| `src/L0PreviewApp.tsx` | Uses unified feed; ↑↓ navigates L0 + preference cards |
| `src/components/Feed/FeedScreen.tsx` | `OVERLAYS_ENABLED=false`; accepts `unifiedFeed`; renders `PreferenceCard` |
| `src/App.tsx` | `unifiedFeed` in AppState; composed in `enterFeed` + `handleReset` + `handleFeedNav` |
