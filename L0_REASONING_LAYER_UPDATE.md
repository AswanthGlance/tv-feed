# L0 Reasoning Layer Update

## Files changed

`src/logic/reasoningEngine.ts` — full rewrite of all category banks + item overrides + highlight map.

---

## Reasoning patterns created

9 reusable signal-pair patterns, applied across all category banks:

| # | Pattern | Signals connected |
|---|---------|-------------------|
| 1 | Location + Cultural identity | city + subCategory/regionOrCulture |
| 2 | Weather + Comfort mood | weather + subCategory/vibe |
| 3 | Time of day + Occasion intent | timeOfDay + shared/social/routine |
| 4 | Upcoming context + Timely relevance | upcomingContext + category interest |
| 5 | Past engagement + Continuity | implicit engagement history + current content |
| 6 | Style preference + Editorial interest | subCategory + vibe aesthetic |
| 7 | Cultural depth + Regional identity | regionOrCulture + city + category |
| 8 | Slow-living signals + Creative intent | vibe:calm/slow + subCategory:craft/ritual |
| 9 | Aspirational taste + Context timing | vibe:luxury/premium + time or upcoming |

---

## Category banks updated

Every bank now has 4–5 patterns. Each pattern connects ≥2 signals.

| Category | Key signal pairs used |
|----------|-----------------------|
| food | city+culture, weather+comfort, evening+social, upcoming+occasion |
| fashion | upcoming+style, vibe+editorial, city+urban, evening+considered |
| travel | city+proximity, upcoming+escape, nature+weather, cultural+depth |
| wellness | morning+ritual, weather+slow, evening+calm, upcoming+rest |
| home | weather+cosy, upcoming+improvement, morning+domestic, city+aesthetic |
| sports | evening+energy, upcoming+competitive, city+sport, engagement+continuity |
| entertainment | evening+cultural, upcoming+event, city+culture, engagement+momentum |
| luxury | upcoming+aspirational, taste+quality, city+premium, evening+peak |
| beauty | morning+routine, weather+skin, city+ritual, engagement+self-care |
| hobbies | morning+hands-on, upcoming+creative, weather+indoor, slow-living+craft |

---

## Per-item overrides (cinematic L0s)

| Item | Key signals | Highlights |
|------|-------------|------------|
| eatly-dawn | Bangalore + South Indian culture + comfort-first picks | "South Indian breakfast culture", "comfort-first picks" |
| feed-03 | Chennai + morning food culture + regional picks | "regional picks", "morning food culture" |
| feed-04 | social dining + shared table + evening signals | "social dining", "shared, unhurried" |
| feed-05 | heritage travel interest + Rajasthan cultural depth | "heritage travel interest", "cultural depth" |
| feed-06 | calm/nature-led signals + Himalayan context | "nature-led signals", "Himalayas" |
| feed-21 | slow travel instincts + Kerala backwater calm | "slow travel instincts", "Kerala" |
| feed-22 | café culture interest + Seoul urban calm | "café culture interest", "Seoul" |
| feed-25 | India cricket culture + high-energy signals | "cricket culture", "high-energy signals" |
| feed-47 | rainy day + chai comfort signals | "chai comfort signals", "rainy day" |

---

## What changed in tone

**Before:** "Based on your preferences." / "Matching your food interest."
**After:** "Bangalore's South Indian breakfast culture matched your local, comfort-first picks. That's what surfaced this."

Every line now:
- Names something specific (a city, a subCategory, a vibe, a context)
- Explains the connection, not just the result
- Reads like the agent is speaking, not a recommendation system outputting text
