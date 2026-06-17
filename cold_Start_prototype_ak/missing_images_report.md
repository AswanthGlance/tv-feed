# Missing / weak images report — Cold Start

Generated as part of the §7.1 image↔title↔tag coherence pass. Every world,
appetite, selfie, and feed image was inspected **by content, not filename**
(the "forest-road-for-food" bug came from trusting filenames).

Run the live check any time: open the prototype, press **D**, click
**“Run image coherence QA”**. It lists every card with pass / warn / fail.

## Status summary

| Bucket | Count | Status |
|---|---|---|
| World tiles | 8 | 7 pass · **1 warn** |
| Discovery appetite | 4 | pass |
| Selfie monument | 1 | pass (Hampi at golden hour, distant figure, no face) |
| Sport feed images | 5 | pass (verified per row) |
| Other feed images | from existing bank | unchanged, previously shipped |

**No hard FAIL.** One WARN is an accepted product decision (below).

## WARN — Tech & gadgets world tile (accepted)

- **Path:** `content/images/worlds/tech_gadgets.jpg`
- **Source:** reused `generated/feed_39-tech-smart-living-room.jpg`
- **Issue:** depicts a smart *living room* (purple LED, city view, large TV).
  Reads closer to **Home** than to "new gear / smart things / gadgets."
- **Decision:** user opted to **reuse a feed tech image** for now rather than
  generate a new one. Tracked here honestly instead of being silently passed.
- **If replaced later**, generate to this prompt and drop the file at the same
  path, then re-run QA:

  > A clean overhead flatlay of modern consumer gadgets on a warm neutral
  > surface — wireless earbuds, a smartwatch, a compact camera, a folding
  > phone — soft directional light, shallow depth of field. Cinematic, warm,
  > calm, TV-safe, family-safe. No logos, no readable text, no identifiable
  > faces. Tall crop (4:5) for a setup tile.

## Coherence map (world → image → verified content)

| World | Image | Verified depicts |
|---|---|---|
| Food finds | food_finds.jpg | plated dish, warm restaurant ✓ |
| Style ideas | style_ideas.jpg | outfit flatlay (blazer, shirt, trousers) ✓ |
| Weekend escapes | weekend_escapes.jpg | scenic coastal cliff + road ✓ |
| Calm routines | calm_routines.jpg | yoga pose, calm sunlit courtyard ✓ |
| Home upgrades | home_upgrades.jpg | warm living room, sofa, interiors ✓ |
| Local discoveries | local_discoveries.jpg | festive courtyard, diyas, heritage ✓ |
| Game-day & sport | game_day_sport.jpg | floodlit cricket stadium ✓ (minor unreadable boundary text) |
| Tech & gadgets | tech_gadgets.jpg | **smart living room — WARN (see above)** |

## House style (for any regeneration)

cinematic · warm · calm · TV-safe · family-safe · vivid natural colour ·
no logos · no readable text · no identifiable faces ·
tall crop for setup tiles, 16:9 for feed cards.
