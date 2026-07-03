# Glance Mascot — Rive Animation Spec (POC)
**4 core emotions · 1 variant each · for Android**

---

## 1. Artboard Setup

- **Canvas:** 220 × 220 px
- **Background:** transparent
- **Origin:** centre

---

## 2. Layer / Group Anatomy

Create these named groups in this stacking order (bottom → top):

| Layer name   | Type         | Shape                        | Notes                              |
|--------------|--------------|------------------------------|------------------------------------|
| `shadow`     | Ellipse      | 130 × 20 px, black radial    | Ground shadow, below body          |
| `glow`       | Ellipse      | 280 × 280 px, purple radial  | Behind body, centred               |
| `body`       | Ellipse      | 220 × 220 px                 | Purple gradient circle (see §2a)   |
| `eye_L`      | Group        | contains `eye_L_pill`        | Left eye pill, centred at (78, 95) |
| `eye_R`      | Group        | contains `eye_R_pill`        | Right eye pill, centred at (126, 95)|
| `brow_L`     | Arc / Path   | 22 × 10 px arc               | Above left eye, opacity 0 at rest  |
| `brow_R`     | Arc / Path   | 22 × 10 px arc               | Above right eye, opacity 0 at rest |
| `smile`      | Arc / Path   | 44 × 20 px arc, opens down   | Opacity 0 at rest                  |
| `cheek_L`    | Ellipse      | 26 × 14 px, pink blurred     | Opacity 0 at rest                  |
| `cheek_R`    | Ellipse      | 26 × 14 px, pink blurred     | Opacity 0 at rest                  |
| `float_q1`   | Text "?"     | 36 px, purple                | Opacity 0 at rest                  |
| `float_q2`   | Text "?"     | 48 px, purple                | Opacity 0 at rest, centred         |
| `float_q3`   | Text "?"     | 34 px, purple                | Opacity 0 at rest                  |

### 2a. Body gradient
Linear gradient top-right → bottom-left:
`#CB48C9` → `#A540DC` → `#863AEB` → `#7135F6` → `#6432FC` → `#6032FF`

### 2b. Eye pill
- Size: 19 × 45 px, border-radius 10 px
- Colour: white `#FFFFFF`
- The **group** (`eye_L` / `eye_R`) is the GSAP/Rive target — scale the group, not the pill directly

### 2c. Glow
Purple radial gradient: `#9333EA` at centre → transparent at edge, opacity 0.55 at rest

---

## 3. Rest / Base State

Every animation starts and ends here. This is the seamless loop point.

| Property            | Value        |
|---------------------|--------------|
| `body` scale        | 1.0 × 1.0    |
| `body` position     | 0, 0         |
| `body` rotation     | 0°           |
| `glow` scale        | 1.0          |
| `glow` opacity      | 0.55         |
| `shadow` scaleX     | 1.0          |
| `shadow` opacity    | 0.38         |
| `eye_L` scaleY      | 1.0          |
| `eye_L` scaleX      | 1.0          |
| `eye_L` x / y       | 0, 0         |
| `eye_R` scaleY      | 1.0          |
| `eye_R` scaleX      | 1.0          |
| `eye_R` x / y       | 0, 0         |
| `brow_L` opacity    | 0            |
| `brow_R` opacity    | 0            |
| `smile` opacity     | 0            |
| `cheek_L/R` opacity | 0            |
| `float_q*` opacity  | 0            |

---

## 4. Easing Glossary

| Name used below | Curve description                                      |
|-----------------|--------------------------------------------------------|
| `sine`          | Smooth S-curve — slow start, fast middle, slow end. **Use for all returns to rest.** |
| `power2.out`    | Fast start, decelerates — snappy settle               |
| `power3.out`    | Very fast start, sharp decelerate — eye darts          |
| `back.out`      | Overshoots slightly then settles — springy feel        |
| `elastic.out`   | Multiple oscillations before settling — bouncy land    |

---

## 5. Loop Rule (critical for seamless loops)

> **Every timeline must end at the exact rest state values with zero velocity.**
> Use `sine` easing for all return-to-rest keyframes — it has a flat curve at both ends,
> meaning the property arrives at its final value with zero velocity.
> The last 20% of every timeline should be a slow exhale back to rest.
> Rive's "loop" mode will then restart invisibly.

---

## 6. Animation Specs

---

### 6.1 IDLE — Breathing

**Duration:** 7.2 s | **Loop:** yes | **Feel:** calm, alive, present

The entire animation is a breathing sine wave. Nothing else moves.
The viewer should feel the mascot is gently alive and waiting.

| Time (s) | Layer       | Property | Value        | Easing |
|----------|-------------|----------|--------------|--------|
| 0.0      | `body`      | scaleX   | 1.0          | —      |
| 0.0      | `body`      | scaleY   | 1.0          | —      |
| 0.0      | `glow`      | scale    | 1.0          | —      |
| 0.0      | `glow`      | opacity  | 0.55         | —      |
| 0.0      | `eye_L/R`   | scaleY   | 1.0          | —      |
| 1.8      | `body`      | scaleX   | 1.022        | sine   |
| 1.8      | `body`      | scaleY   | 1.028        | sine   |
| 1.8      | `glow`      | scale    | 1.07         | sine   |
| 1.8      | `glow`      | opacity  | 0.68         | sine   |
| 1.8      | `eye_L/R`   | scaleY   | 1.05         | sine   |
| **1.80** | **BLINK**   | `eye_L/R` scaleY → 0 over 0.07 s (power2.in), back to 1.05 over 0.1 s (power2.out) | |
| 3.6      | `body`      | scaleX   | 1.0          | sine   |
| 3.6      | `body`      | scaleY   | 1.0          | sine   |
| 3.6      | `glow`      | scale    | 1.0          | sine   |
| 3.6      | `glow`      | opacity  | 0.55         | sine   |
| 3.6      | `eye_L/R`   | scaleY   | 1.0          | sine   |
| 4.5      | `body`      | scaleX   | 1.014        | sine   |
| 4.5      | `body`      | scaleY   | 1.018        | sine   |
| 4.5      | `glow`      | scale    | 1.04         | sine   |
| 5.9      | `body`      | scaleX   | 1.0          | sine   |
| 5.9      | `body`      | scaleY   | 1.0          | sine   |
| 5.9      | `glow`      | scale    | 1.0          | sine   |
| 5.9      | `glow`      | opacity  | 0.55         | sine   |
| 7.2      | ← **loop point — all values = rest** | | | |

---

### 6.2 THINKING — Processing

**Duration:** 7.1 s | **Loop:** yes | **Feel:** focused, searching, internally active

Head tilts, eyes narrow and scan left/right, brows furrow inward.
Everything returns to rest before looping.

| Time (s) | Layer       | Property   | Value           | Easing      |
|----------|-------------|------------|-----------------|-------------|
| **ENTER (0 → 0.8)**                                                          |
| 0.0      | `body` wrap | rotation   | -10°            | power2.out  |
| 0.1      | `eye_L/R`   | scaleY     | 0.55            | power2.out  |
| 0.0      | `glow`      | scale      | 0.88            | power2.in   |
| 0.0      | `glow`      | opacity    | 0.38            | power2.in   |
| 0.1      | `brow_L`    | opacity    | 1, rotation +10° | power2.out |
| 0.1      | `brow_R`    | opacity    | 1, rotation -10° | power2.out |
| **SCAN LEFT (0.8 → 1.4)**                                                    |
| 0.8      | `eye_L/R`   | x          | -6 px           | sine        |
| 0.8      | `body` wrap | rotation   | -13°            | sine        |
| 0.8      | `brow_L`    | rotation   | +13°            | sine        |
| 0.8      | `brow_R`    | rotation   | -8°             | sine        |
| **SCAN RIGHT (1.4 → 2.3)**                                                   |
| 1.4      | `eye_L/R`   | x          | +5 px           | sine        |
| 1.4      | `body` wrap | rotation   | -7°             | sine        |
| 1.4      | `brow_L`    | rotation   | +8°             | sine        |
| 1.4      | `brow_R`    | rotation   | -13°            | sine        |
| **CENTRE + BLINK (2.3 → 2.9)**                                               |
| 2.3      | `eye_L/R`   | x          | 0               | back.out    |
| 2.3      | `body` wrap | rotation   | -10°            | sine        |
| 2.3      | `brow_L/R`  | rotation   | ±10°            | sine        |
| 2.8      | **BLINK**   | `eye_L/R` scaleY → 0 (0.08 s), back to 0.55 (0.12 s) | | |
| **GLOW PULSE (3.0 → 3.8)**                                                   |
| 3.0      | `glow`      | scale      | 1.08            | sine        |
| 3.0      | `glow`      | opacity    | 0.65            | sine        |
| 3.5      | `glow`      | scale      | 0.88            | sine        |
| 3.5      | `glow`      | opacity    | 0.38            | sine        |
| **RETURN TO REST (3.8 → 5.5) ← the seamless zone**                          |
| 3.8      | `eye_L/R`   | scaleY     | 1.0             | **sine**    |
| 3.8      | `eye_L/R`   | x          | 0               | **sine**    |
| 3.8      | `body` wrap | rotation   | 0°              | **sine**    |
| 3.8      | `body` wrap | y          | 0               | **sine**    |
| 3.9      | `glow`      | scale      | 1.0             | **sine**    |
| 3.9      | `glow`      | opacity    | 0.55            | **sine**    |
| 4.0      | `brow_L/R`  | opacity    | 0               | power2.out  |
| **IDLE BREATH (5.5 → 7.1) ← ensures zero velocity at loop**                 |
| 5.5      | `body`      | scaleX     | 1.02            | sine        |
| 5.5      | `body`      | scaleY     | 1.025           | sine        |
| 6.3      | `body`      | scaleX     | 1.0             | sine        |
| 6.3      | `body`      | scaleY     | 1.0             | sine        |
| 7.1      | ← **loop point — all values = rest** | | | |

---

### 6.3 HAPPY — Joyful

**Duration:** 7.2 s | **Loop:** yes | **Feel:** light, warm, bouncy

Anticipation squash → hop up → float and sway → land with overshoot → return to rest.
Eyes open slightly wider than normal (not exaggerated). Small particle burst at the jump peak.

| Time (s) | Layer       | Property   | Value           | Easing       |
|----------|-------------|------------|-----------------|--------------|
| **ANTICIPATION (0 → 0.25)** — slight pre-hop squash                         |
| 0.0      | `body`      | scaleX     | 1.03            | power2.in    |
| 0.0      | `body`      | scaleY     | 0.97            | power2.in    |
| 0.0      | `eye_L/R`   | scaleY     | 0.88            | power2.in    |
| **RISE (0.25 → 1.1)** — hop upward, eyes open wide                          |
| 0.25     | `body` wrap | y          | -9 px           | power2.out   |
| 0.25     | `body`      | scaleX     | 0.97            | power2.out   |
| 0.25     | `body`      | scaleY     | 1.04            | power2.out   |
| 0.30     | `eye_L/R`   | scaleY     | 1.08            | back.out     |
| 0.30     | `eye_L/R`   | scaleX     | 1.03            | back.out     |
| 0.25     | `glow`      | scale      | 1.18            | power2.out   |
| 0.25     | `glow`      | opacity    | 0.78            | power2.out   |
| 0.25     | **PARTICLES** burst — 5 small purple dots scatter outward, fade over 0.7 s  |
| **FLOAT SWAY (1.1 → 3.1)** — gentle side-to-side drift                      |
| 1.1      | `body` wrap | y          | -7 px           | sine         |
| 1.1      | `body` wrap | rotation   | +2°             | sine         |
| 2.0      | `body` wrap | y          | -5 px           | sine         |
| 2.0      | `body` wrap | rotation   | -2°             | sine         |
| **BLINK (2.8)**                                                              |
| 2.8      | **BLINK**   | scaleY → 0 (0.07 s), back to 1.08 (0.12 s) | | |
| **LAND (3.1 → 3.7)** — drop + squash + elastic recover                      |
| 3.1      | `body` wrap | y          | +2 px           | power2.in    |
| 3.4      | `body`      | scaleX     | 1.05            | power3.in    |
| 3.4      | `body`      | scaleY     | 0.96            | power3.in    |
| 3.58     | `body`      | scaleX     | 1.0             | back.out     |
| 3.58     | `body`      | scaleY     | 1.0             | back.out     |
| 3.5      | `body` wrap | y          | 0               | back.out     |
| **RETURN TO REST (3.8 → 5.5)**                                               |
| 3.8      | `eye_L/R`   | scaleY     | 1.0             | **sine**     |
| 3.8      | `eye_L/R`   | scaleX     | 1.0             | **sine**     |
| 3.8      | `glow`      | scale      | 1.0             | **sine**     |
| 3.8      | `glow`      | opacity    | 0.55            | **sine**     |
| 3.9      | `body` wrap | y          | 0               | **sine**     |
| 3.9      | `body` wrap | rotation   | 0°              | **sine**     |
| **IDLE BREATH (5.5 → 7.2)**                                                  |
| 5.5      | `body`      | scaleX     | 1.02            | sine         |
| 5.5      | `body`      | scaleY     | 1.025           | sine         |
| 6.35     | `body`      | scaleX     | 1.0             | sine         |
| 6.35     | `body`      | scaleY     | 1.0             | sine         |
| 7.2      | ← **loop point — all values = rest** | | | |

---

### 6.4 CONFUSED — Searching

**Duration:** 8.5 s | **Loop:** yes | **Feel:** actively looking, slightly lost, endearing

Head tilts, eyes narrow and dart right → centre → wiggle → dart left.
Three question marks float up at different sizes/timings.
Everything unwinds slowly back to rest.

| Time (s) | Layer       | Property   | Value           | Easing      |
|----------|-------------|------------|-----------------|-------------|
| **ENTER (0 → 0.7)**                                                          |
| 0.0      | `body` wrap | rotation   | -6°             | back.out    |
| 0.0      | `eye_L/R`   | scaleY     | 0.52            | power2.out  |
| 0.0      | `glow`      | scale      | 0.86            | power2.in   |
| 0.0      | `glow`      | opacity    | 0.30            | power2.in   |
| 0.05     | `brow_L`    | opacity    | 1, rotation +10° | power2.out |
| 0.05     | `brow_R`    | opacity    | 1, rotation -10° | power2.out |
| **DART RIGHT (0.7 → 1.1)**                                                   |
| 0.7      | `eye_L/R`   | x          | +14 px          | power3.out  |
| 0.7      | `brow_L`    | rotation   | +8°             | power2.out  |
| 0.7      | `brow_R`    | rotation   | -13°            | power2.out  |
| 1.1      | `eye_L/R`   | x          | 0               | back.out    |
| 1.1      | `brow_L/R`  | rotation   | ±10°            | back.out    |
| **? MARK 1 — large centre (0.75 → 2.0)** `float_q2` (48 px)                 |
| 0.75     | `float_q2`  | opacity    | 1, y -14 px     | back.out    |
| 1.35     | `float_q2`  | opacity    | 0, y -38 px     | power2.in   |
| **HEAD WIGGLE (1.7 → 2.5)**                                                  |
| 1.70     | `body` wrap | x          | -7 px, rot -9°  | power3.out  |
| 1.81     | `body` wrap | x          | +7 px, rot +9°  | power2.inOut|
| 1.96     | `body` wrap | x          | -3 px, rot -5°  | power2.inOut|
| 2.22     | `body` wrap | x          | 0,    rot -6°   | back.out    |
| **? MARK 2 — left (1.85 → 2.98)** `float_q1` (36 px)                        |
| 1.85     | `float_q1`  | opacity    | 1, y -10 px     | back.out    |
| 2.43     | `float_q1`  | opacity    | 0, y -32 px     | power2.in   |
| **BLINK (2.7)**                                                              |
| 2.7      | **BLINK**   | scaleY → 0 (0.08 s), back to 0.52 (0.14 s) | | |
| **DART LEFT (3.0 → 3.7)**                                                    |
| 3.0      | `eye_L/R`   | x          | -14 px          | power3.out  |
| 3.0      | `brow_L`    | rotation   | +13°            | power2.out  |
| 3.0      | `brow_R`    | rotation   | -8°             | power2.out  |
| 3.42     | `eye_L/R`   | x          | 0               | back.out    |
| 3.42     | `brow_L/R`  | rotation   | ±10°            | back.out    |
| **? MARK 3 — right (3.1 → 4.23)** `float_q3` (34 px)                        |
| 3.1      | `float_q3`  | opacity    | 1, y -10 px     | back.out    |
| 3.65     | `float_q3`  | opacity    | 0, y -32 px     | power2.in   |
| **RETURN TO REST (4.0 → 6.5) ← the seamless zone**                          |
| 4.0      | `eye_L/R`   | scaleY     | 1.0             | **sine**    |
| 4.0      | `eye_L/R`   | x          | 0               | **sine**    |
| 4.0      | `body` wrap | rotation   | 0°              | **sine**    |
| 4.0      | `body` wrap | x          | 0               | **sine**    |
| 4.0      | `body` wrap | y          | 0               | **sine**    |
| 4.1      | `glow`      | scale      | 1.0             | **sine**    |
| 4.1      | `glow`      | opacity    | 0.55            | **sine**    |
| 4.2      | `brow_L/R`  | opacity    | 0               | power2.out  |
| **IDLE BREATH (6.5 → 8.5)**                                                  |
| 6.5      | `body`      | scaleX     | 1.02            | sine        |
| 6.5      | `body`      | scaleY     | 1.025           | sine        |
| 7.5      | `body`      | scaleX     | 1.0             | sine        |
| 7.5      | `body`      | scaleY     | 1.0             | sine        |
| 8.5      | ← **loop point — all values = rest** | | | |

---

## 7. State Machine (Rive)

```
Inputs:
  emotion  (Number)  0=Idle  1=Thinking  2=Happy  3=Confused

States:
  Idle      → plays animation "idle"      (loop)
  Thinking  → plays animation "thinking"  (loop)
  Happy     → plays animation "happy"     (loop)
  Confused  → plays animation "confused"  (loop)

Transitions (any → any):
  Condition:  emotion == N
  Blend time: 0.3 s  (cross-fade between states)
  Exit time:  0 (transition immediately on input change)
```

Android usage example:
```kotlin
riveAnimationView.setNumberState("emotion_machine", "emotion", 2f) // → Happy
```

---

## 8. Reference Colours

| Token         | Hex       | Used on              |
|---------------|-----------|----------------------|
| Body purple   | `#6032FF` | body gradient end    |
| Body magenta  | `#CB48C9` | body gradient start  |
| Eye white     | `#FFFFFF` | eye pill             |
| Glow purple   | `#9333EA` | glow halo            |
| Float purple  | `#A78BFA` | ? marks, particles   |
| Cheek pink    | `#FB7185` | cheek blush          |

---

## 9. Deliverable Checklist for Motion Designer

- [ ] `.riv` file with all 4 animations on separate timelines
- [ ] State machine named `emotion_machine` with `emotion` number input
- [ ] All timelines loop-clean (test: let each run 60 s, no visible seam)
- [ ] Artboard 220 × 220 px, transparent background
- [ ] Layers named exactly as in §2 (for Android binding)
