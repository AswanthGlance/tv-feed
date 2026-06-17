# Setup Image Asset Mapping

## Source

All setup images copied from:
```
/Users/aswanth.raj/Work 2023/Work 2025/Vibe_coding/New feed L0/TV-Feed-main/setup_images/
```

Destination (served by Vite):
```
public/images/setup/
```

---

## Question-to-Image Mapping

### Q0 — BangaloreConfirm ("I see you're in Bengaluru – that right?")

No dedicated setup images provided. Uses existing feed images:

| Option | File |
|--------|------|
| Yes, Bengaluru | `/images/feed/feed_58-travel-mumbai-marine-drive-night.jpg` |
| Not quite | `/images/feed/feed_29-travel-goa-coastal-road.jpg` |

---

### Q1 — TVContentQuestion ("What's this TV usually playing?")

| Option | File |
|--------|------|
| Sports & big moments | `/images/setup/setup_q1_sports.jpg` |
| Movies & series | `/images/setup/setup_q1_movies.jpg` |
| Music & performances | `/images/setup/setup_q1_music.jpg` |
| News & infotainment | `/images/setup/setup_q1_news.jpg` |

---

### Q2 — AudienceQuestion ("Who watches this TV?")

| Option | File |
|--------|------|
| Mostly me | `/images/setup/setup_q2_solo.jpg` |
| My partner and I | `/images/setup/setup_q2_pair.jpg` |
| Kids watch it too | `/images/setup/setup_q2_kids.jpg` |
| Friends & family | `/images/setup/setup_q2_friends.jpg` |

---

### Q3 — ShowMoreQuestion ("What should this TV show more of?")

Initial 3 options:

| Option | File |
|--------|------|
| Travel & escapes | `/images/setup/setup_q3_travel.jpg` |
| Health & wellness | `/images/setup/setup_q3_fitness.jpg` |
| Sports | `/images/setup/setup_q3_sports.jpg` |

Explore More (6 extra options):

| Option | File |
|--------|------|
| Music & performances | `/images/setup/setup_q3_music.jpg` |
| Fashion & style | `/images/setup/setup_q3_fashion.jpg` |
| Home & interiors | `/images/setup/setup_q3_home.jpg` |
| Arts & culture | `/images/setup/setup_q3_arts.jpg` |
| Tech & new things | `/images/setup/setup_q3_tech.jpg` |
| Food & dining | `/images/setup/setup_q3_food.jpg` |

---

### Q4 — WeekendQuestion ("What's your kind of weekend?")

| Option | File |
|--------|------|
| Slow at home | `/images/setup/setup_q4_home.jpg` |
| Local experiences | `/images/setup/setup_q4_local.jpg` |
| A night out | `/images/setup/setup_q4_nightout.jpg` |
| Out of town | `/images/setup/setup_q4_outoftown.jpg` |

---

### Q5 — StyleQuestion ("What's your style?")

| Option | File |
|--------|------|
| Easy & casual | `/images/setup/setup_q5_casual.jpg` |
| Classy | `/images/setup/setup_q5_classy.jpg` |
| Trending | `/images/setup/setup_q5_trending.jpg` |
| Bold & statement | `/images/setup/setup_q5_bold.jpg` |

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/Calibration/TVContentQuestion.tsx` | Images updated to `setup_q1_*` |
| `src/components/Calibration/AudienceQuestion.tsx` | Images updated to `setup_q2_*` |
| `src/components/Calibration/ShowMoreQuestion.tsx` | Images updated to `setup_q3_*` |
| `src/components/Calibration/WeekendQuestion.tsx` | Images updated to `setup_q4_*` |
| `src/components/Calibration/StyleQuestion.tsx` | Images updated to `setup_q5_*` |

## Not Changed

- BangaloreConfirm — uses existing feed images (no setup_q0 images provided)
- Card layout (image + text below)
- Selection animation
- Center-stage acknowledgement
- Progress indicator
- Skip behavior
