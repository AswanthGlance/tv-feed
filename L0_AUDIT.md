# L0 Glance Audit — Phase 2

## Summary

| Metric | Value |
|--------|-------|
| Total glances | 35 |
| Layout variants | 3 (left / center / right) |
| Categories | 11 |
| Items with location label | 13 |
| Items with contextual question | 9 |
| Markets covered | india, us, global |

---

## Layout Variants

The feed items currently use a single inline layout derived from a character-code hash on `item.id`. This produces an uncontrolled distribution. Phase 2 introduces three intentional layout variants:

| Variant | Description | Typical use |
|---------|-------------|-------------|
| `left` | Text left, image full-bleed behind | Editorial / fashion / travel with strong horizon |
| `center` | Text centered, wider max-width | Minimal / spiritual / cultural |
| `right` | Text right-anchored | Wide shots, sport, architecture |

---

## All 35 Glances

| # | ID | Title | Category | Layout | Cards |
|---|-----|-------|----------|--------|-------|
| 1 | feed-01 | Street Style Edit | fashion | left | street-style, editorial |
| 2 | feed-02 | The Accessories Edit | fashion | center | accessories, luxury-fashion |
| 3 | feed-03 | South Indian Morning | food | left | south-indian, breakfast |
| 4 | feed-04 | A Table Set for Friends | food | left | dinner-party, sharing |
| 5 | feed-05 | Rooftops at Blue Hour | travel | right | heritage-travel, india-travel |
| 6 | feed-06 | Into the Valley | travel | center | mountains, nature-travel |
| 7 | feed-07 | The Morning Ritual | wellness | left | morning-ritual, self-care |
| 8 | feed-08 | Run Your City | wellness | right | fitness, running |
| 9 | feed-09 | Kitchen at Golden Hour | home | left | kitchen, warm-interiors |
| 10 | feed-10 | The Reading Nook | home | right | reading-nook, cozy-interiors |
| 11 | feed-11 | Kabaddi — The Chase | sports | right | kabaddi, india-sports |
| 12 | feed-12 | The Long Game | sports | center | chess, strategy-sport |
| 13 | feed-13 | Bharatanatyam — The Language | entertainment | center | classical-dance, performing-arts |
| 14 | feed-14 | The Vinyl Hour | entertainment | left | music, vinyl |
| 15 | feed-15 | The Palace on Rails | luxury | center | luxury-travel, heritage |
| 16 | feed-16 | The Spa Ritual | luxury | left | spa, wellness-luxury |
| 17 | feed-17 | Skincare as a Ritual | beauty | left | skincare, beauty-routine |
| 18 | feed-18 | The Haldi Ritual | beauty | center | traditional-beauty, ayurvedic |
| 19 | feed-19 | Hands in the Clay | hobbies | left | pottery, craft |
| 20 | feed-20 | The Kitchen Garden | hobbies | right | gardening, home-garden |
| 21 | feed-21 | Tea Gardens — Munnar | travel | center | india-travel, nature-travel |
| 22 | feed-22 | Seoul After Rain | travel | left | korean-lifestyle, cafe-culture |
| 23 | feed-23 | Neon City Nights | food | right | night-market, street-food |
| 24 | feed-24 | Monsoon Living Room | home | center | cozy-interiors, monsoon-home |
| 25 | feed-25 | Under the Floodlights | sports | right | cricket, ipl |
| 26 | feed-26 | Rooftop at Dusk | luxury | right | luxury-stay, rooftop |
| 27 | feed-34 | Nordic Winter Cabin | travel | center | winter-travel, cabin-escape |
| 28 | feed-41 | Jaipur Blue Hour | travel | right | india-travel, heritage-travel |
| 29 | feed-42 | A Seat at the Ramen Counter | food | left | japanese-cuisine, ramen |
| 30 | feed-45 | Golden Hour Court | sports | left | basketball, nba |
| 31 | feed-47 | Chai at the Corner Stall | food | center | chai, street-food |
| 32 | feed-48 | Pacific Northwest Forest | travel | center | nature-travel, forest |
| 33 | feed-54 | Kerala Backwaters | travel | left | kerala, india-travel |
| 34 | feed-63 | Holi — The Festival of Colour | entertainment | center | holi, festival |
| 35 | feed-66 | Bangkok Floating Market | travel | right | southeast-asia, food-travel |

---

## Reusable Patterns Identified

### Pattern 1 — Left editorial (12 items)
- Large serif title bottom-left
- Agent reasoning bubble below title
- Product rail horizontal below reasoning
- CTA at bottom
- Mascot small (48px), inside reasoning bubble

### Pattern 2 — Center cinematic (10 items)
- Title centered, larger (68–76px)
- Agent line above or below title
- No product rail — single featured card instead
- CTA centered
- Mascot floating above title (72px)

### Pattern 3 — Right tension (13 items)
- Text right-anchored, image leading left
- Short punchy title (fewer words)
- Tighter reasoning (one line)
- Product rail below, right-aligned
- Mascot medium (56px), inline with title eyebrow

---

## Animation Sequence (all variants)

Every L0 glance follows this exact sequence:

1. **Background settles** — crossfade + gradient overlay fades in (0–400ms)
2. **Mascot appears** — `agentAppear` spring drop (400–700ms)
3. **Title appears** — `fadeUp` with blur clear (700–1000ms)
4. **Reasoning appears** — typed line fade-up (1000–1400ms)
5. **CTA appears** — slide-up with spring (1400–1600ms)
6. **Product cards reveal** — one by one, staggered 140ms each (1600–2000ms)
7. **Focus becomes active** — white ring pulse on primary CTA (2000ms+)

---

## Focus State Design

Previous focus states were purple-tinted. Phase 2 uses:

- **Primary CTA focus**: solid white ring, 2px, 4px offset — matches Apple TV system focus
- **Product card focus**: white ring + scale(1.04) + subtle lift shadow
- **Navigation item focus**: white ring + purple fill 22%
- **All focus transitions**: 150ms with `cubic-bezier(0.34,1.56,0.64,1)` spring

---

## Reasoning Copy Model

Reasoning must feel conversational, not mechanical. Each message:
- Max 2 lines at 20px
- Never exposes raw signal keys or category codes
- References context (time, location, weather) when available
- Adapts tone to category (warmer for food/home, crisper for sports/fashion)

See `src/logic/reasoningEngine.ts` for the full copy bank.

---

## Shared Component Architecture

```
FeedScreen
└── L0Glance (new)
    ├── GlanceLayout (variant: left|center|right)
    │   ├── MascotLayer
    │   ├── [eyebrow + location chip]
    │   ├── [title]
    │   ├── AgentReasoning
    │   ├── AgentCTA
    │   └── ProductRail
    └── [overlays — unchanged]
```

All components are configuration-driven via `glanceConfig.ts`.
