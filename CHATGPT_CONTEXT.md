# ChatGPT Context: Glance TV Feed — Reasoning Copy Task

## YOUR TASK

Write reasoning copy for 178 ambient TV feed cards for **Glance TV** — an AI-first TV screensaver for India.

For each card, write **4 reasoning lines**, one per profile:

1. `cold_reason` — L1 Cold Start (Bangalore context only, zero user data)
2. `warm_reason` — L2 Warm Start (early interaction signals + context)
3. `enriched_reason_e1` — L3 Enriched, Profile E1 (44F design entrepreneur, married, family)
4. `enriched_reason_e2` — L3 Enriched, Profile E2 (23F UX designer, indie/sustainable)

**Output format:** one row per card:
```
c001 | cold_reason | warm_reason | enriched_reason_e1 | enriched_reason_e2
```

---

## THE ONE PRINCIPLE

**The card title, subtitle, and image explain the WHAT. The reasoning explains the WHY.**

The user can already see "Rooftop sunrise yoga" on screen. Do not describe that back to them.

Every line must answer: *"Why is this card on my screen, right now, for me?"*

---

## INTERACTION SIGNAL MODEL — READ THIS CAREFULLY

Glance TV has exactly **two signals**:

1. **Scroll-past** — user kept scrolling. Repeated scroll-past = negative signal.
2. **Open (tapping L0 → L1)** — user tapped in to explore. Highest-intent positive signal.

**There is NO save. NO dwell. NO wishlist (except Fashion category only).**

Language to use:
- ✅ "you've opened", "you tend to open", "you explore", "you go deeper on", "cards like this get your attention", "you scroll into"
- ✅ Fashion only: "on your wishlist", "wishlisted"
- ❌ NEVER: "saved", "saves", "your saves", "dwell", "dwelled"
- ❌ NEVER: "clicked", "click history" — use "open" or "explore" instead

---

## SHARED CONTEXT (same for all 4 profiles)

- **Location:** Bangalore, India
- **Time:** Weekday morning
- **Weather:** 27°C, partly cloudy, pleasant and outdoor-friendly
- **Local signals:** South Indian breakfast culture, specialty coffee, Nandi Hills, Cubbon Park, Mysore silk, Bidriware craft, Indiranagar dining, premium restaurants, hybrid-work culture

---

---

## THE FOUR PROFILES

---

### PROFILE C — Cold Start
**Source file:** `cold-start_bangalore_location-only.json`

```json
{
  "name": null,
  "city": "Bangalore",
  "user_summary": "Cold-start user. Only location is known (from IP). No preferences collected yet \u2014 the feed should start from Bangalore local trends and current context (weather, time, day) and learn as the user watches.",
  "profession": null,
  "preferences": [],
  "fashion_palette": [],
  "fashion_brands": [],
  "venues": [],
  "hobbies": [],
  "occasions": [],
  "past_activity": [],
  "signals": {
    "timeOfDay": "evening",
    "weather": "rainy",
    "day": "Friday"
  },
  "location_context": {
    "city": "Bangalore",
    "region": "Karnataka, India",
    "source": "ip_geolocation",
    "local_trends": [
      "rainy-evening cosy food & coffee",
      "Bangalore cafe culture",
      "weekend getaways near Bangalore (Coorg, Nandi Hills)",
      "local cultural events",
      "rooftop & indoor city spots"
    ],
    "default_feed_strategy": "balanced, locally-relevant; weight toward current context (rainy Friday evening -> cosy food, coffee, calm indoor, light city culture); no personalization yet"
  },
  "data_quality": "cold"
}
```

**What we know:** City (Bangalore) and live context (time, weather) only. Zero user data.

**Rules:**
- NEVER use "you", "your", "history", "profile", "household", "preference", "signals"
- Explain why this card is timely or locally relevant for ANY Bangalore viewer right now
- Use weather, time of day, season, or a local cultural fact where it helps
- Complete sentence ending with `.` `!` or `?`
- 80–150 characters
- Formula: `[Why Bangalore/context makes this timely] — [what makes this the specific, non-generic version]`

**Good:**
- `Filter coffee is Bangalore's religion; these new roasters are quietly rewriting it.`
- `Coorg is greenest right after Bangalore's rains — locals book these weekends months out.`
- `Vinyl nights are the city's coolest small gigs — original pressings, no laptops, no algorithm.`

**Bad (do not write):**
- `A Bangalore favourite worth a look.` ← placeholder
- `Worth a look tonight.` ← says nothing
- `Good ambient content for Bangalore.` ← meta, not copy

---

### PROFILE W — Warm Start
**Source file:** `warm_collection-derived_bangalore_02_social-food-culture.json`

```json
{
  "name": null,
  "city": "Bangalore",
  "user_summary": "New Glance user who set a social, out-and-about tone and leaned into food and local culture. Early signals favour markets, dining and city energy.",
  "profession": null,
  "preferences": [
    "food",
    "culture",
    "social",
    "travel"
  ],
  "fashion_palette": [],
  "fashion_brands": [],
  "venues": [
    "Local markets",
    "Restaurants & dining",
    "Cultural spots"
  ],
  "hobbies": [
    "Food & dining",
    "Local culture",
    "Going out"
  ],
  "occasions": [
    "Out and social",
    "Brunch & day out",
    "Local cultural events"
  ],
  "discovery_appetite": "medium",
  "past_activity": [
    {
      "action": "liked",
      "topic": "a local vegetable market story",
      "category": "Food"
    },
    {
      "action": "explored",
      "topic": "a festive courtyard with lights (L1)",
      "category": "Culture"
    },
    {
      "action": "answered",
      "topic": "chose 'A restaurant night' dinner table",
      "category": "Food"
    }
  ],
  "signals": {
    "timeOfDay": "evening",
    "weather": "clear",
    "day": "Friday"
  },
  "data_quality": "sparse",
  "collected_inputs": {
    "source": "glance_preference_collection",
    "onboarding": {
      "q1_sunday_scenario": "Social Brunch",
      "q2_worlds": [
        "Local Markets & Street Life",
        "Food Stories & Kitchens"
      ],
      "q3_discovery_appetite": "Mix in related ideas"
    },
    "in_feed": {
      "l0_interactions": [
        {
          "card": "local vegetable market",
          "signal": "like"
        },
        {
          "card": "festive courtyard (opened L1)",
          "signal": "L1_explore"
        },
        {
          "card": "minimal home interior",
          "signal": "skip"
        }
      ],
      "interstitial_answers": [
        {
          "question": "Which dinner table is yours tonight?",
          "answer": "A restaurant night"
        },
        {
          "question": "L1 exit: would you like more of this?",
          "answer": "More Indian markets and street life"
        }
      ]
    },
    "derivation": {
      "preferences": "Social Brunch + Local Markets world -> food, culture, social; L1 explore on culture -> culture (strong, L1 is highest-intent); Markets world also implies local travel -> travel",
      "venues": "markets world + restaurant interstitial -> local markets, restaurants, cultural spots",
      "discovery_appetite": "Q3 'Mix in related ideas' -> medium",
      "vibe": "Social Brunch -> social/medium pace, out-and-about",
      "not_collected": "profession, fashion_brands, fashion_palette never asked -> null/empty"
    }
  }
}
```

**What we know:** Bangalore + live context + early interaction signals from onboarding and in-feed behaviour.

**Key signals to use in copy:**
- Opened a festive courtyard card to L1 (highest intent signal) → culture/local discovery
- Liked a local vegetable market story → Bangalore-specific local life, food
- Chose "A restaurant night" as dinner answer → dining out, social, specific venues
- Worlds chosen: "Local Markets & Street Life" + "Food Stories & Kitchens" → food-curious, social, out-and-about
- Discovery appetite: medium → mix in related ideas, not too experimental
- Scrolls past: minimal home interior → not a home/decor person

**Rules:**
- Lead with what you've *observed* this person open or explore — not abstract preference
- NEVER: "saved", "dwell", "clicked" — use "opened", "explored", "went deeper on"
- NEVER: generic phrases like "matches your vibe", "suits your taste"
- Complete sentence, ends with `.` `!` `?`
- 100–160 characters
- Formula: `[What you've noticed this person open/explore] + [why THIS card is the specific version of that pattern]`

**Good:**
- `You explored a local cultural card; this festive courtyard is the same kind of Bangalore discovery worth a second look.`
- `You tend to open Bangalore food stories; this is the kind of specific, named spot you go deeper on.`
- `You opened local market content; this street food lane is the walkable, eat-your-way-through version of that interest.`

**Bad:**
- `Worth a look on a night out.` ← template garbage
- `A card that suits your taste.` ← says nothing

---

### PROFILE E1 — Enriched: 44F Design Entrepreneur, Married with Teenagers
**Source file:** `enriched_bangalore_02_design-entrepreneur-female.json`

| Field | Value |
|-------|-------|
| Age | 44 |
| Gender | feminine |
| Profession | Founder, boutique design studio |
| Wealth tier | Affluent Entrepreneur / Established Professional |
| Relationship | married |
| Kids | True — ages [12, 15] |
| Pets | ['dog'] |
| Primary interests | Contemporary Indian & Fusion Wear, Fine & Statement Jewellery, Home Decor & Living |
| Secondary interests | Wellness & Skincare, Sarees (Handloom) |
| Top brands | Good Earth, Raw Mango, Anita Dongre, Forest Essentials, Amrapali |
| Fitness | ['yoga', 'pilates', 'walking'] · 3x/week · diet: ['vegetarian', 'ayurvedic', 'organic'] |
| Travel | ['heritage/cultural', 'luxury resorts', 'international'] · luxury · party: family · stays: ['heritage hotels', 'luxury resorts', 'boutique stays'] |
| Food | cuisines: ['fine dining', 'regional Indian', 'modern Indian', 'continental'] · restrictions: ['vegetarian'] · avg spend: high |
| Social | venues: ['art galleries', 'fine-dining restaurants', 'design exhibitions', 'private clubs'] · size: intimate gatherings |
| Hobbies | ['interior design', 'art collecting', 'textiles', 'yoga', 'gardening', 'fine dining'] |

**Copy lens:** Premium Indian craft and design sensibility. Married, two teenagers (12 & 15), a dog. Vegetarian and ayurvedic. Fine dining. Heritage hotels and boutique stays for family travel. Boutique yoga studio. Interior design and art collecting. The recommendation a design-aware 44-year-old finds genuinely useful — not patronising, not generic. Frame through established taste, family consideration, and investment in quality.


---

### PROFILE E2 — Enriched: 23F Creative/Sustainable UX Designer
**Source file:** `enriched_bangalore_03_creative-sustainable-female.json`

| Field | Value |
|-------|-------|
| Age | 23 |
| Gender | feminine |
| Profession | Junior UX Designer |
| Wealth tier | Early-Career Creative |
| Relationship | single, lives with flatmates |
| Kids | False — ages [] |
| Pets | ['cat'] |
| Primary interests | Thrift & Sustainable Fashion, Statement & Indie Apparel, Accessories & Trinkets |
| Secondary interests | Indie Beauty & Skincare, Vinyl & Music Merch |
| Top brands | The Souled Store, Suta, Doodlage, The Ordinary, Bewakoof |
| Fitness | ['dance', 'cycling', 'casual yoga'] · 1-2x/week · diet: ['vegetarian', 'trying vegan'] |
| Travel | ['backpacking', 'hill stations', 'indie/offbeat', 'budget travel'] · budget · party: friends group · stays: ['hostels', 'homestays'] |
| Food | cuisines: ['street food', 'cafe culture', 'pan-asian', 'experimental/indie cafes'] · restrictions: ['vegetarian'] · avg spend: low-medium |
| Social | venues: ['indie cafes', 'live-music venues', 'flea/thrift markets', 'art collectives'] · size: friends group |
| Hobbies | ['design/illustration', 'thrifting', 'indie music', 'photography', 'journaling', 'pottery'] |

**Copy lens:** 23-year-old energy. Thrift, indie, sustainable. A cat and flatmates. Budget-aware but aspirational. Indie cafes and live music. Flea markets and pottery. Photography and journaling. Vegetarian, trying vegan. Backpacking travel with friends. The recommendation that feels like it came from a cool older friend who knows Bangalore's indie scene — not an algorithm. Frame through sustainable/indie sensibility, early-career budget, creative city explorer.


---

## COPY RULES CHEAT SHEET

| Rule | Cold (C) | Warm (W) | Enriched E1 | Enriched E2 |
|------|---------|---------|-------------|-------------|
| Use "you/your" | ❌ NEVER | ✅ | ✅ | ✅ |
| Reference interaction | ❌ | ✅ opens/explores | ✅ opens/explores | ✅ opens/explores |
| Reference household | ❌ | ❌ | ✅ family/luxury | ✅ student/indie |
| "saved/saves/dwell/clicked" | ❌ NEVER | ❌ NEVER | ❌ NEVER | ❌ NEVER |
| Fashion wishlist OK | ❌ | ✅ fashion only | ✅ fashion only | ✅ fashion only |
| Expose raw data / income | ❌ | ❌ | ❌ NEVER | ❌ NEVER |

**Safe household language for L3:**
- E1: "family weekend plan", "vegetarian household", "established taste", "premium Indian craft", "a home that reflects your design eye"
- E2: "early-career budget", "sustainable-first sensibility", "rental flat", "indie aesthetic", "a student's Bangalore", "your flatmates"

**Never write:**
- Income amounts (₹ figures from the JSON, percentile bands)
- Provider names (TransUnion, etc.)
- Raw attribute names (confidence_score, engagement_ratio, etc.)
- "based on your data", "the algorithm", "your segment", "your tier"

---

## BAD PHRASES IN THE CURRENT CSV — REPLACE ALL OF THESE

The existing CSV has placeholder copy. These must all be replaced:
- `"A Bangalore favourite worth a look."` ← says nothing
- `"Worth a look on a night out — [card], somewhere the city's crowd rates."` ← template
- `"A considered, design-led plate — your kind of dining."` ← no signal
- `"Urban and luxury-resort escapes are your pattern"` ← exposes inference
- `"A pick that fits your modern-urbanite streak"` ← describes a variable
- `"Tuned to your minimalist-chic taste"` ← placeholder variable
- `"Smart-casual, modern-urbanite"` ← not copy
- `"A wood-accent café with fast wifi — the room you actually focus in"` ← describes room, not why

---

## WORKED EXAMPLES (quality bar)

**c001 — Naru Noodle Bar** (Food / New opening / evening / timely)
- cold: `Bangalore's ramen scene is tiny and obsessive — this 14-seater is the one people queue for.`
- warm: `You explored local dining finds; this 14-seat counter is the Bangalore-specific opening that earns a real visit, not just a scroll.`
- enriched_e1: `A small, design-led counter is the dinner format you tend to choose; this is the kind of Bangalore opening worth booking before it gets crowded.`
- enriched_e2: `This is the indie opening the city's food-curious crowd finds before it trends — fits a ₹500 solo dinner on a weeknight.`

**c005 — Third-wave filter coffee** (Food / Café / morning)
- cold: `Filter coffee is Bangalore's religion; these new roasters are quietly rewriting it.`
- warm: `You opened a local food story; the third-wave roasters are the specific, named version of the Bangalore coffee ritual you explored.`
- enriched_e1: `A considered morning ritual is already your habit; these roasters are the premium, single-origin upgrade on the filter coffee you grew up with.`
- enriched_e2: `Indie café culture is where your mornings go — this is the roaster-led version that costs ₹180 and has the aesthetic your grid deserves.`

**c033 — Monsoon corner reset** (Home / Decor / evening / rainy)
- cold: `A Bangalore monsoon evening calls for exactly this — the warm nook the rain deserves.`
- warm: `You skipped home interiors; this is the minimal, weather-specific version — less about décor, more about making a monsoon evening feel intentional.`
- enriched_e1: `A seasonal refresh is how a well-designed home stays alive; this is the kind of low-effort corner reset that makes a house feel considered again.`
- enriched_e2: `A rental flat doesn't stop you making a corner yours — this is the ₹1,500 version that photographs well and uses what you already have.`

**c051 — Rooftop sunrise yoga** (Wellness / Yoga / morning / clear)
- cold: `Clear Bangalore mornings are rare — rooftop sunrise yoga is the best use of the ones you get.`
- warm: `You explored a wellness card; this is the specific, outdoor, bookable version — the kind of morning ritual that actually happens when it's on the calendar.`
- enriched_e1: `Your boutique yoga studio is the weekday ritual; a rooftop sunrise class is the seasonal version worth booking before the monsoon comes back.`
- enriched_e2: `Casual yoga is already your thing; this is the version that doesn't need a membership and gets on the grid.`

**c083 — The lost art of Bidriware** (Culture / Craft)
- cold: `Bidriware is a 14th-century Persian-Indian craft that almost disappeared — this is where to see it still being made in Bangalore.`
- warm: `You went deeper on a local cultural card; Bidriware is the kind of specific Karnataka craft find that earns that same kind of long look.`
- enriched_e1: `You collect Indian craft with intention; Bidriware is the kind of object that belongs in a considered home — it appreciates in meaning, not just value.`
- enriched_e2: `Sustainable, handmade, and culturally specific — this is the find you'd share in your indie aesthetic feed before it trends.`

---

## THE 178 CARDS

| id | category | subcategory | title | subtitle | timeOfDay | weather | season | urgency | intent |
|----|----|----|----|----|----|----|----|----|----|  
| c001 | Food | New opening | Naru Noodle Bar. | A 14-seat counter doing Tokyo-style ramen — your weeknight upgrade. | evening|night | any | any | timely | book |
| c002 | Food | Recipe | A one-pot bisi bele bath. | Comfort in a bowl — 35 minutes, pantry staples, deeply Bangalore. | evening | rainy|any | any | evergreen | learn |
| c003 | Food | Street food | The VV Puram food street. | A walk you eat your way through — chaat, dosa, holige, all of it. | evening|night | clear|any | any | evergreen | inspire |
| c004 | Food | Fine dining | A seasonal tasting menu. | Eight courses, monsoon edition — dinner as theatre. | evening|night | any | any | timely | book |
| c005 | Food | Café | Third-wave filter coffee. | The new roasters reinventing Bangalore's oldest ritual, one pour at a time. | morning | any | any | evergreen | inspire |
| c006 | Food | Breakfast | The dosa spot worth the queue. | Crisp, golden, gone in minutes — Sunday's first decision, sorted. | morning | any | any | evergreen | inspire |
| c007 | Food | Heritage | Lunch at Karavalli. | A coastal Karnataka feast — your weekend, lived right in the city. | afternoon|evening | any | any | evergreen | book |
| c008 | Food | Bakery | A fresh-bake morning. | Sourdough, cardamom buns, the smell that gets you out of bed. | morning | any | any | evergreen | inspire |
| c009 | Food | Cooking | Knife skills, in an hour. | One class that makes every dinner after it faster and calmer. | evening | any | any | evergreen | learn |
| c010 | Food | Drinks | A natural-wine evening. | Low-intervention bottles, a candlelit bar, no pretension. | evening|night | any | any | timely | book |
| c011 | Travel | Weekend escape | Coorg, after the rains. | Coffee-estate homestays, misty mornings, the South India you keep meaning to see. | any | any | monsoon | evergreen | plan |
| c012 | Travel | Heritage | Hampi, at golden hour. | Boulder temples and lost-empire ruins — a UNESCO wonder, an overnight away. | any | clear | any | evergreen | plan |
| c013 | Travel | Beach | A Goa long weekend. | Sand, sea breeze, and the reset only the coast delivers. | any | clear | any | timely | book |
| c014 | Travel | Nature stay | A Wayanad treehouse. | Wake up in the canopy, fall asleep to crickets — phone optional. | any | any | any | evergreen | book |
| c015 | Travel | Hills | The Chikmagalur drive. | Switchback roads, coffee country, a flask and a view. | morning | clear | any | evergreen | plan |
| c016 | Travel | City break | A Pondicherry weekend. | French quarters, sea-facing cafés, mustard-yellow walls. | any | clear | any | evergreen | plan |
| c017 | Travel | Wildlife | A Kabini safari. | Dawn jeep, riverbank, the chance of a leopard. | morning | clear | any | timely | book |
| c018 | Travel | Trek | The Kudremukh trail. | Green ridgelines, rolling mist, a climb that earns the view. | morning | clear|any | any | evergreen | plan |
| c019 | Travel | Flight deal | Bangalore to the coast, cheaper. | Fares dipped for the dates everyone wants — the window won't stay open. | any | any | any | expiring | book |
| c020 | Travel | Staycation | A heritage-hotel night in. | Stay in your own city, but make it a holiday. | evening | any | any | evergreen | book |
| c021 | Travel | Road trip | The Nandi Hills sunrise. | Forty-five minutes out, a sea of clouds, back by breakfast. | morning | clear | any | timely | plan |
| c022 | Travel | Offbeat | A Sakleshpur rail-trek weekend. | Tunnels, viaducts, and a green that doesn't photograph real. | any | clear|any | monsoon | evergreen | plan |
| c023 | Fashion | Festive edit | The festive handloom edit. | Hand-woven, jewel-toned, made the slow way — for the season of showing up. | any | any | festive | timely | buy |
| c024 | Fashion | Capsule | An easy linen capsule. | Effortless, breathable, endlessly mixable — the monsoon uniform. | any | rainy|any | monsoon | evergreen | buy |
| c025 | Fashion | Streetwear | The new drop is live. | Bolder than last season, and in your size — move before it's gone. | evening | any | any | timely | buy |
| c026 | Fashion | Footwear | The everyday white sneaker. | One pair that goes with everything you already own. | any | any | any | evergreen | buy |
| c027 | Fashion | Occasion | What to wear to a sangeet. | Dress codes decoded — show up looking like you meant it. | any | any | festive | timely | inspire |
| c028 | Fashion | Sustainable | A slow-fashion label worth it. | Fewer, better pieces — clothes with a conscience and a cut. | any | any | any | evergreen | inspire |
| c029 | Fashion | Accessories | The monsoon-proof bag. | Looks premium, shrugs off rain — function that doesn't apologise. | any | rainy | monsoon | evergreen | buy |
| c030 | Fashion | Grooming | A fresh seasonal haircut. | The change that costs little and shifts how the week feels. | any | any | any | evergreen | book |
| c031 | Fashion | Jewellery | Everyday gold, reimagined. | Pieces light enough to never take off. | any | any | festive | evergreen | buy |
| c032 | Fashion | Styling | Three ways to wear one kurta. | One piece, a week of looks — the math of a good wardrobe. | any | any | any | evergreen | learn |
| c033 | Home | Decor | A monsoon corner reset. | Warm lamp, a throw, a plant — the nook the rain deserves. | evening | rainy | monsoon | evergreen | inspire |
| c034 | Home | Plants | An indoor jungle, started right. | Five plants that survive you — and make a room breathe. | any | any | any | evergreen | learn |
| c035 | Home | Aquascape | Iwagumi, the living art. | A desk-sized underwater landscape that quiets the mind. | any | any | any | evergreen | inspire |
| c036 | Home | Organisation | The ten-minute reset. | A nightly ritual that makes mornings feel handled. | night | any | any | evergreen | learn |
| c037 | Home | Scent | Set the mood with scent. | Sandalwood, rain, citrus — the invisible upgrade to a room. | evening | any | any | evergreen | inspire |
| c038 | Home | Upgrade | A smarter good-night. | One tap dims the lights, locks up, starts the playlist. | night | any | any | evergreen | buy |
| c039 | Home | Cooking space | The kitchen that works. | Small tweaks that make cooking feel less like a chore. | any | any | any | evergreen | inspire |
| c040 | Home | Art | A wall worth looking up at. | Affordable prints from artists you'll want to brag about. | any | any | any | evergreen | buy |
| c041 | Entertainment | Live music | A vinyl-only night. | Three DJs, original pressings — jazz, Bollywood, '70s rock. | night | any | any | timely | book |
| c042 | Entertainment | Gig | An intimate indie gig. | The band from your most-played playlist, in a room of 80. | night | any | any | timely | book |
| c043 | Entertainment | Film | A restored classic, on screen. | Watch it the way it was meant to be seen — big and loud. | evening|night | any | any | timely | book |
| c044 | Entertainment | Comedy | A stand-up night out. | Two hours of laughing too hard at a small downtown club. | night | any | any | timely | book |
| c045 | Entertainment | Theatre | An English-language play. | Live theatre that reminds you screens aren't everything. | evening | any | any | timely | book |
| c046 | Entertainment | OTT | This week's binge, sorted. | The one show everyone's about to be talking about. | night | rainy|any | any | timely | inspire |
| c047 | Entertainment | Jazz | A late-night jazz set. | A saxophone, a nightcap, the city slowing down. | night | any | any | evergreen | book |
| c048 | Entertainment | Festival | A city arts festival. | A weekend of installations, music and food across town. | any | clear | any | timely | plan |
| c049 | Entertainment | Sports | Match night at a sports bar. | Big screen, big crowd, the game better with strangers. | night | any | any | timely | book |
| c050 | Entertainment | Quiz | Your team's quiz night. | Trivia, beer, and the chance to finally win. | night | any | any | evergreen | book |
| c051 | Wellness | Yoga | Rooftop sunrise yoga. | Forty minutes above the city, before the day asks anything of you. | morning | clear | any | evergreen | book |
| c052 | Wellness | Running | Keep the morning streak. | Tomorrow's route adds a lake loop you haven't tried. | morning | clear | any | timely | plan |
| c053 | Wellness | Cycling | A weekend group ride. | Forty kilometres, a fast crowd, breakfast as the prize. | morning | clear | any | timely | book |
| c054 | Wellness | Ayurveda | An Ayurvedic evening ritual. | Herbal salts, warm oils — an hour that resets the whole week. | evening | any | any | evergreen | book |
| c055 | Wellness | Strength | A four-week strength plan. | Built around the home setup you already own — no new kit. | any | any | any | evergreen | learn |
| c056 | Wellness | Recovery | The cold-plunge reset. | Three minutes of cold that resets a week's fatigue. | any | any | any | timely | book |
| c057 | Wellness | Sleep | Wind down, properly. | A 20-minute routine that makes mornings feel handled. | night | any | any | evergreen | learn |
| c058 | Wellness | Nutrition | Eat for the monsoon. | Warm, seasonal, immunity-friendly — food as medicine. | any | rainy | monsoon | evergreen | learn |
| c059 | Wellness | Mental | A guided breathing break. | Five minutes that pull you out of the spin. | afternoon|evening | any | any | evergreen | learn |
| c060 | Weekend | Day out | A Cubbon Park morning. | Dappled light, chess under the trees, the city's quietest hour. | morning | clear | any | evergreen | plan |
| c061 | Weekend | Brunch | The garden brunch you saved. | Bottomless filter coffee under the trees — your kind of slow Sunday. | morning|afternoon | clear | any | evergreen | book |
| c062 | Weekend | Market | The Sunday farmers market. | Heirloom produce, fresh flowers, the city before it wakes up. | morning | clear | any | timely | plan |
| c063 | Weekend | Getaway | Plan the perfect weekend. | Stays, a dinner, a drive — handled before Friday. | any | any | any | evergreen | plan |
| c064 | Weekend | Culture crawl | A gallery-hop afternoon. | Three shows, one neighbourhood, coffee in between. | afternoon | any | any | evergreen | plan |
| c065 | Weekend | Family | A day out with the kids. | Somewhere everyone actually enjoys — no negotiation needed. | morning|afternoon | clear | any | evergreen | plan |
| c066 | Weekend | Night out | A Friday in Indiranagar. | Three of your saved spots, walking distance apart. | night | any | any | timely | plan |
| c067 | Weekend | Solo | A solo reset day. | No plans, no people — just you and the city on easy mode. | any | any | any | evergreen | inspire |
| c068 | Productivity | Focus | The Pomodoro reset. | Twenty-five minutes of real focus, powered by sand not software. | morning|afternoon | any | any | evergreen | learn |
| c069 | Productivity | Habit | A 30-day habit, started today. | Small, daily, compounding — the only way change sticks. | morning | any | any | evergreen | learn |
| c070 | Productivity | Learning | Finish the course you started. | Twenty minutes a day gets you to the certificate. | evening | any | any | evergreen | learn |
| c071 | Productivity | Reading | Read more this month. | One chapter a night beats one big resolution. | night | any | any | evergreen | inspire |
| c072 | Productivity | Money | A 15-minute money check. | See where it goes, decide where it should — once a week. | evening | any | any | evergreen | learn |
| c073 | Productivity | Goals | Set the quarter's one big goal. | Not ten resolutions — one thing, done properly. | any | any | any | evergreen | inspire |
| c074 | Productivity | Digital | A phone-free evening. | Reclaim two hours — the most underrated upgrade there is. | evening|night | any | any | evergreen | inspire |
| c075 | Productivity | Career | A skill that pays off. | The one course your future self will thank you for. | any | any | any | evergreen | learn |
| c076 | Tech | EV | The EV you keep researching. | A weekend test drive is the obvious next move. | any | any | any | evergreen | book |
| c077 | Tech | Wearable | A smarter morning run. | The watch that turns training into data you'll act on. | morning | any | any | evergreen | buy |
| c078 | Tech | Audio | Noise-cancelling, finally worth it. | The headphones that make a noisy city disappear. | any | any | any | evergreen | buy |
| c079 | Tech | Reader | Think on a digital paper tablet. | The first screen that feels like writing on real paper. | evening | any | any | evergreen | buy |
| c080 | Tech | Smart home | A home that anticipates you. | Lights, locks, music — one system, zero thinking. | evening|night | any | any | evergreen | inspire |
| c081 | Tech | Photography | Shoot your city better. | A weekend workshop that levels up your phone photos. | any | clear | any | evergreen | learn |
| c082 | Tech | AI tools | Let AI run the boring bits. | Three tools that quietly give you an hour back each day. | any | any | any | evergreen | learn |
| c083 | Culture | Craft | The lost art of Bidriware. | A 14th-century craft that brings quiet character into a modern home. | any | any | any | evergreen | inspire |
| c084 | Culture | Textile | The art of Mysore silk. | Royal fabric, woven by hand, one golden thread at a time. | any | any | festive | evergreen | inspire |
| c085 | Culture | Architecture | The Bangalore Palace facade. | A corner of England, recreated in South India — best at golden hour. | afternoon | clear | any | evergreen | inspire |
| c086 | Culture | Temple | A heritage temple at dawn. | Carvings, incense, and a stillness the city forgot it had. | morning | clear | any | evergreen | inspire |
| c087 | Culture | Museum | A new museum show. | Two hours that make you see the city differently. | afternoon | any | any | timely | plan |
| c088 | Culture | Local history | The story under your street. | Bangalore's layers — cantonment, gardens, tech — in one walk. | morning|afternoon | clear | any | evergreen | learn |
| c089 | Culture | Language | Learn enough Kannada to matter. | The phrases that make this city feel like home. | any | any | any | evergreen | learn |
| c090 | Weather | Now | A rainy Bangalore evening. | Cool monsoon air, the city slowing down — made for staying in. | evening|night | rainy | monsoon | timely | inspire |
| c091 | Weather | Clear morning | A rare bright morning. | The rain breaks — a window for everything outdoors. | morning | clear | any | timely | plan |
| c092 | Weather | Hot afternoon | Beat the afternoon heat. | Cool rooms, cold coffee, the smart way to wait it out. | afternoon | clear | summer | timely | inspire |
| c093 | Weather | Pleasant | Bangalore at its best. | The weather this city is famous for — don't waste it indoors. | afternoon|evening | clear | any | timely | plan |
| c094 | Weather | Storm | A dramatic monsoon sky. | Big clouds rolling in — the city's free light show. | evening | rainy | monsoon | timely | inspire |
| c095 | Pets | Care | A weekend with your dog. | Cafés, parks and trails that actually want them there. | morning|afternoon | clear | any | evergreen | plan |
| c096 | Pets | Adoption | Meet an adoptable friend. | A weekend adoption drive — your next family member, maybe. | any | any | any | timely | inspire |
| c097 | Finance | Investing | Start investing, finally. | The 20-minute setup that future-you will be grateful for. | evening | any | any | evergreen | learn |
| c098 | Finance | Saving | A smarter way to save. | Automate it once, forget it, watch it grow. | any | any | any | evergreen | learn |
| c099 | Beauty | Skincare | A monsoon skincare reset. | What the humidity demands — simpler than you think. | any | rainy | monsoon | evergreen | learn |
| c100 | Beauty | Spa | A spa afternoon, earned. | Two hours that undo a hard week. | afternoon | any | any | evergreen | book |
| c101 | Social | Date night | A date night, planned. | Dinner, a walk, a view — the effort that gets noticed. | evening|night | clear|any | any | evergreen | plan |
| c102 | Social | Reconnect | Catch up with an old friend. | The coffee you keep meaning to schedule — do it this week. | afternoon|evening | any | any | evergreen | plan |
| c103 | Social | Host | Host a small dinner. | Six people, one good meal — the most underrated joy. | evening|night | any | any | evergreen | plan |
| c104 | Gaming | Retro | The perfect retro corner. | An arcade cabinet, pixel glow, the classics made new. | evening|night | any | any | evergreen | inspire |
| c105 | Gaming | Co-op | A game night in. | Couch co-op, snacks, and friendly trash talk. | night | rainy|any | any | evergreen | plan |
| c106 | Sustainability | Green living | A lower-waste week. | Five swaps that stick — small, doable, genuinely greener. | any | any | any | evergreen | learn |
| c107 | Sustainability | Community | A neighbourhood clean-up. | A Saturday morning that makes your patch of the city better. | morning | clear | any | timely | plan |
| c108 | Family | Kids | A rainy-day with the kids. | Indoor adventures that beat another hour of screens. | afternoon | rainy | monsoon | evergreen | plan |
| c109 | Family | Together | A screen-free family evening. | One board game, zero phones — the night everyone remembers. | evening | any | any | evergreen | inspire |
| c110 | Curiosity | Astronomy | A stargazing night drive. | Clear skies, a new moon — the universe, two hours out. | night | clear | any | timely | plan |
| c111 | Curiosity | Science | A planetarium evening. | Look up, feel small, leave a little wiser. | evening | any | any | evergreen | plan |
| c112 | Auto | Classic drive | A vintage coastal drive. | Just the engine and the waves — a weekend in another era. | morning | clear | any | evergreen | inspire |
| c113 | Auto | Care | Monsoon-ready your car. | The 20-minute check that saves a soggy breakdown. | any | rainy | monsoon | timely | learn |
| c114 | Books | Reading | An evening with a writer. | The novelist you follow, reading live at your local. | evening | any | any | timely | book |
| c115 | Books | Discovery | Your next great read. | The book three people whose taste you trust all loved. | night | rainy|any | any | evergreen | inspire |
| c116 | Music | Discovery | A playlist for the rain. | Sound matched to the weather, made for tonight. | evening|night | rainy | monsoon | evergreen | inspire |
| c117 | Music | Learn | Pick up an instrument. | The guitar in the corner deserves a Sunday. | afternoon|evening | any | any | evergreen | learn |
| c118 | Community | Give back | Volunteer a Saturday. | Two hours that matter more than the brunch you'd skip. | morning | clear|any | any | evergreen | plan |
| c119 | Gardening | Balcony | A balcony herb garden. | Fresh basil and mint, ten steps from the kitchen. | morning | any | any | evergreen | learn |
| c120 | Festival | Seasonal | The city dressed for festival. | Lights, markets, sweets — the season's at its peak. | evening|night | any | festive | timely | inspire |
| c121 | Culture | South Indian Culinary Traditions | The Coorgi Coffee Ritual | A slow drip method that turns a simple coffee break into a mindful pause | any | any | any | evergreen | inspire |
| c122 | Tech | Contemporary Indian Workspace Innovation | The Smart Desk, Seamless | Ergonomics and tech so integrated you don't even notice it's there | any | any | any | evergreen | inspire |
| c123 | Culinary | Modern Indian Culinary Technology | Your Smart Coffee Machine | It remembers how you like your coffee, even when you don't | any | any | any | evergreen | inspire |
| c124 | Hobbies | Biophilic Design & Urban Home Hobbies | Iwagumi, The Living Art | A minimalist underwater garden that brings a deep sense of calm to your desk | any | any | any | evergreen | inspire |
| c125 | Entertainment | Urban Indian Retro-Gaming Revival | The Perfect Retro Corner | A classic arcade cabinet in a stylish room, its screen glowing with pixel art in the afternoon light. | any | any | any | evergreen | inspire |
| c126 | Indian Artistic Heritage |  | The Lost Art Of Bidriware | This 14th-century Persian craft uses Indian soil to create its signature black | any | any | any | evergreen | inspire |
| c127 | Urban Retreats for Music Lovers |  | The Vinyl Collecting Ritual | It's not about the playlist, it's about the one record you can't find anywhere else | any | any | any | evergreen | inspire |
| c128 | Elevated Digital Reading & Personal Annotation |  | Think On The Kindle Scribe | The first digital reader that feels like writing on real paper | any | any | any | evergreen | inspire |
| c129 | Holistic Wellness & Ancient Indian Rituals | Wellness | An Ayurvedic Bath Ritual | Herbal salts in a copper bowl, a simple way to reset the afternoon | any | any | any | evergreen | inspire |
| c130 | Karnataka Cycling Escapades | Sports | Ride The Nandi Hills Ascent | The classic Bangalore weekend ride that tests your legs and rewards your eyes | any | any | any | evergreen | inspire |
| c131 | Restaurants | South Indian Culinary Heritage | Lunch At Karavalli | A taste of the coast, served right in the heart of Bangalore | any | any | any | evergreen | inspire |
| c132 | Architecture | Iconic Indian Royal Architecture | The Bangalore Palace Facade | A corner of England's Windsor Castle, recreated in the heart of South India | any | any | any | evergreen | inspire |
| c133 | Mindful Domestic Arts & Craftsmanship |  | Frame A Moment In Hoop Art | Turning a quiet afternoon into a small, beautiful piece of personal art | any | any | any | evergreen | inspire |
| c134 | Mindfulness & Strategic Leisure |  | A Cubbon Park Chess Game | The city fades away and only the next move matters | any | any | any | evergreen | inspire |
| c135 | Urban Biophilic Tech Innovations |  | A Smart Sensor For Plants | It tells you exactly when to water, so you never have to guess again | any | any | any | evergreen | inspire |
| c136 | Iconic South Indian Culinary Destinations |  | The MTR Rava Idli Ritual | The one dish that defines Bangalore's old-school tiffin culture | any | any | any | evergreen | inspire |
| c137 | Luxury | Indian Luxury Hospitality Interiors | Stay At The Paul, Bangalore | Where classic European architecture meets quiet Bangalore luxury | any | any | any | evergreen | inspire |
| c138 | Bangalore's Modern Culinary Excellence |  | Eat At Toast And Tonic | Where every plate is a work of art assembled right before your eyes | any | any | any | evergreen | inspire |
| c139 | Futuristic Urban Wellness in India |  | The Cryotherapy Upgrade | Frosted cryotherapy pod emitting cold vapor in a minimalist white spa. | any | any | any | evergreen | inspire |
| c140 | Indian Textile Heritage |  | The Art Of Mysore Silk | This royal fabric is still woven by hand, one golden thread at a time | any | any | any | evergreen | inspire |
| c141 | Productivity | Mindful Productivity in India's Tech Hubs | The Pomodoro Timer Edit | Twenty-five minutes of pure, uninterrupted focus, powered by sand, not software | any | any | any | evergreen | inspire |
| c142 | Auto | Coastal Grandeur: India's Classic Drives | The Konkan Vintage Drive | The only sound is the classic engine and the waves of the Arabian Sea | any | any | any | evergreen | inspire |
| c143 | Fashion | Workwear | The champagne-silk workday. | A champagne blouse and sage tailoring — desk to dinner, no change. | morning | any | any | timely | buy |
| c144 | Fashion | Outerwear | A trench that does the talking. | Tan faux-leather, sharp lines — the layer that makes monsoon intentional. | any | rainy | monsoon | evergreen | buy |
| c145 | Fashion | Evening | An off-white cocktail column. | Satin, sculpted, quietly commanding — for the openings and the dinners after. | evening | any | any | evergreen | buy |
| c146 | Fashion | Activewear | Studio-to-street, sculpted. | Nike pieces in sage and black that look as good leaving the mat as on it. | any | any | any | timely | buy |
| c147 | Fashion | Footwear | Metallic mules, everyday. | Silver and nude — the pair that lifts jeans and tailoring alike. | any | any | any | evergreen | buy |
| c148 | Fashion | Accessories | Gold and pearl, timeless. | Pieces light enough to never take off — classic, never loud. | any | any | any | evergreen | buy |
| c149 | Fashion | Knitwear | The cashmere edit. | NAADAM-soft layers in off-white and mocha — quiet luxury you live in. | any | any | winter | evergreen | buy |
| c150 | Food | Fine dining | A degustation worth dressing for. | A ten-seat chef's table — the dinner you plan a week around. | evening | any | any | timely | book |
| c151 | Food | Café | A design-led brunch. | Specialty coffee, natural light, the upscale slow morning you favour. | morning | any | any | evergreen | book |
| c152 | Culture | Gallery | A new contemporary show. | Abstract works opening this week — your kind of slow Saturday. | afternoon | any | any | evergreen | plan |
| c153 | Wellness | Yoga | A boutique sunrise flow. | A small-class studio that matches your morning rhythm. | morning | clear | any | evergreen | book |
| c154 | Wellness | Running | A scenic city run. | A lake-loop route for the mornings you'd rather move than scroll. | morning | clear | any | evergreen | plan |
| c155 | Lifestyle | Music | Pick the ukulele back up. | A bright corner, twenty minutes, the song you keep meaning to learn. | evening | any | any | evergreen | learn |
| c156 | Travel | Luxury | An urban-luxe weekend. | A design hotel two hours out — quiet, premium, no itinerary needed. | any | any | any | evergreen | book |
| c157 | Travel | City break | A culture-led city escape. | Galleries, design hotels, long lunches — a city, done your way. | any | any | any | evergreen | plan |
| c158 | Beauty | Skincare | A dewy-glow routine. | Built for warm undertones and the humidity — radiant, five steps. | any | rainy | monsoon | evergreen | learn |
| c159 | Home | Decor | Quiet-luxury at home. | Champagne tones, clean lines, considered objects — minimalism that warms. | any | any | any | evergreen | inspire |
| c160 | Finance | Investing | Buy pieces that hold value. | The investment mindset, applied to a wardrobe and beyond. | any | any | any | evergreen | learn |
| c161 | Fashion | Smart casual | The smart-casual capsule. | Beige chinos, an ecru shirt, one jacket — Monday to Friday, sorted. | morning | any | any | timely | buy |
| c162 | Fashion | Menswear | A Rare Rabbit drop. | Olive overshirt, contemporary cut — the urbanite's new staple. | any | any | any | timely | buy |
| c163 | Fashion | Footwear | White sneakers, brown boots. | Two pairs that cover every occasion you actually have. | any | any | any | evergreen | buy |
| c164 | Fashion | Knitwear | A textured knit polo. | Blackberrys-clean, breathable, smarter than a tee — for the in-between days. | any | any | any | evergreen | buy |
| c165 | Fashion | Outerwear | A khaki linen overshirt. | The layer for Bangalore's almost-cool evenings — light, easy, sharp. | evening | any | any | evergreen | buy |
| c166 | Fashion | Accessories | Minimalist leather goods. | A clean wallet and belt, bronze hardware — quiet detail that lasts. | any | any | any | evergreen | buy |
| c167 | Tech | Gadgets | The desk-setup upgrade. | A mechanical keyboard and monitor arm — small changes, all-day payoff. | any | any | any | timely | buy |
| c168 | Tech | Wearable | A watch for a corporate week. | Notifications, workouts, days of battery — flush with a shirt cuff. | any | any | any | evergreen | buy |
| c169 | Tech | Audio | Focus, on demand. | Noise-cancelling over-ears that turn an open office into a booth. | any | any | any | evergreen | buy |
| c170 | Tech | AI tools | Get an hour back, daily. | Three tools the city's tech crowd uses to kill the busywork. | any | any | any | evergreen | learn |
| c171 | Food | Work café | A wood-accent work café. | Fast wifi, a good flat white, the room you actually focus in. | morning | any | any | evergreen | book |
| c172 | Social | Rooftop | A rooftop after work. | Skyline, a cold one, the crew — the no-plan Friday plan. | evening | any | any | timely | book |
| c173 | Entertainment | Meetup | A product-and-design meetup. | Where the city's tech crowd actually talks shop — and stays for drinks. | evening | any | any | timely | book |
| c174 | Culture | Event | An urban cultural night. | A gig, a popup, a screening — the city after dark, done well. | evening | any | any | evergreen | plan |
| c175 | Culture | Festival | Rama Navami at the temple. | The city in celebration — lights, crowds, a moment worth showing up for. | any | any | festive | timely | plan |
| c176 | Home | WFH | A wood-accent WFH corner. | Warm tones, clean lines — a desk that makes the day feel handled. | any | any | any | evergreen | inspire |
| c177 | Productivity | Career | A skill that compounds. | The weekend course the corporate crowd is quietly taking to get ahead. | any | any | any | evergreen | learn |
| c178 | Fashion | Styling | Build a 10-piece capsule. | Fewer, better menswear pieces that mix into a month of looks. | any | any | any | evergreen | learn |


---

## OUTPUT FORMAT

Return all 178 rows as a pipe-separated table:

```
id | cold_reason | warm_reason | enriched_reason_e1 | enriched_reason_e2
```

Rules:
- Every cell filled — no blanks
- Complete sentences only — ends with `.` `!` or `?`
- No ellipses (`...`)
- 80–160 characters per cell
- No repeated openers across cards of the same column
