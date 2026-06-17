# Glance TV redesign changes

## What changed

- Reworked the onboarding/setup flow into a more premium Apple TV-style visual system.
- Added a persistent 4-step setup indicator so the user knows how many questions remain.
- Kept the purple Glance brand as the background/mood color, while making primary CTAs and selected/focused states white for stronger TV readability.
- Rebuilt the first setup screens with agent-led copy, mascot presence, glass panels, soft purple spatial glow, and staggered entry motion.
- Updated the setup sequence:
  1. Location/context check.
  2. Preference-world selection.
  3. Discovery appetite.
  4. Optional selfie collection with clear explanation of why the selfie is useful.
- Made the selfie step explicitly optional and skippable.
- Redesigned the “Made for you everything” transition as an agentic build screen with progressive checklist animation.
- Improved L0 glance presentation with sequential reveal order:
  1. Title.
  2. Subtitle/context.
  3. Agent reasoning.
  4. Product/supporting cards.
  5. CTA with agent icon.
- Added automatic left / center / right content alignment variation for L0 cards based on card id, so the feed feels less repetitive.
- Updated L0 CTA styling to white with agent icon, matching the requested CTA/selection system.

## Files changed

- `src/styles/premium.css` — new shared premium visual and motion system.
- `src/main.tsx` — imports the new premium CSS.
- `src/components/Activation/WelcomeScreen.tsx` — redesigned intro screen.
- `src/components/Activation/BangaloreConfirm.tsx` — redesigned question 1.
- `src/components/Calibration/WorldsQuestion.tsx` — redesigned preference-world question.
- `src/components/Calibration/DiscoveryAppetite.tsx` — redesigned discovery appetite question.
- `src/components/Activation/SelfieScreen.tsx` — redesigned optional selfie explanation and QR section.
- `src/components/Calibration/TuningTransition.tsx` — redesigned “Made for you everything” transition.
- `src/components/Feed/FeedScreen.tsx` — improved L0 sequencing, agent reasoning, CTA, product cards, and alignment variation.
- `package.json` — added root Vite/React scripts so the repo can run directly from the root.

## Notes for implementation review

- The current repo has a root `src/` and Vite config but originally did not include a root `package.json`. I added one so the project can be run from the repo root.
- The actual mascot asset can replace the existing mascot component later without changing the flow structure.
- Product cards are currently generated from each feed item’s subcategory tags because the existing `FeedItem` type does not include real product-card data yet. When real product objects are added, replace that generated block in `FeedScreen.tsx`.
