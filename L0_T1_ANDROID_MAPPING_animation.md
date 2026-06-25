# L0 T1 — Android Jetpack Compose Implementation Guide

**Version:** 2.1  
**Companion doc:** `L0_T1_MOTION_SPEC.md`  
**Source of truth (timing):** `src/config/l0T1Config.ts`  
**Live reference:** `/l0_t1` route

This document maps every L0 T1 animation state to its Jetpack Compose equivalent. It assumes Compose 1.6+, Kotlin 1.9+, and `androidx.compose.animation:animation`.

---

## Canvas Setup

```kotlin
// TV canvas: 1920×1080 logical pixels
// Use a Box that fills the full screen at 1920×1080dp
@Composable
fun L0Stage(content: @Composable BoxScope.() -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF040208))
    ) {
        content()
    }
}

// Safe margin constants (match src/config/l0T1Config.ts LAYOUT)
object L0Layout {
    const val CONTENT_LEFT_DP  = 80f
    const val TITLE_TOP_DP     = 228f
    const val REASONING_TOP_DP = 808f
    const val CTA_BOTTOM_DP    = 72f
    const val CTA_HEIGHT_DP    = 72f
    const val FEEDBACK_LEFT_DP = 602f
    const val SHOP_LEFT_DP     = 1752f   // product images (stacked, no card)
    const val SHOP_SIZE_DP     = 80f
}
```

---

## State 1 — Title Reveal

### Background image (parallax zoom-out)

```kotlin
val bgAlpha by animateFloatAsState(
    targetValue = if (bgVisible) 1f else 0f,
    animationSpec = tween(durationMillis = 1000, easing = FastOutSlowInEasing)
)
val bgScale by animateFloatAsState(
    targetValue = if (bgVisible) 1f else 1.04f,
    animationSpec = tween(durationMillis = 2800, easing = LinearOutSlowInEasing)
)

AsyncImage(
    model = "coorg.jpg",
    contentDescription = null,
    modifier = Modifier
        .fillMaxSize()
        .graphicsLayer {
            alpha       = bgAlpha
            scaleX      = bgScale
            scaleY      = bgScale
            translationY = if (bgVisible) 0f else (-16).dp.toPx()
        },
    contentScale = ContentScale.Crop
)
```

**Easing mapping:**
- `power2.inOut` → `FastOutSlowInEasing`
- `power1.out`   → `LinearOutSlowInEasing`

### Dark overlay (3-layer)

```kotlin
// Compose does not support multi-gradient background natively.
// Use three stacked Box layers with individual Brush fills.
Box(modifier = Modifier.fillMaxSize().alpha(overlayAlpha)) {
    // Layer 1: bottom-to-top (text readability)
    Box(modifier = Modifier.fillMaxSize().background(
        brush = Brush.verticalGradient(
            0f    to Color(0xFF000000).copy(alpha = 0.92f),
            0.28f to Color(0xFF000000).copy(alpha = 0.55f),
            0.52f to Color(0xFF000000).copy(alpha = 0.08f),
            1f    to Color.Transparent,
            startY = Float.POSITIVE_INFINITY, endY = 0f
        )
    ))
    // Layer 2: top-to-bottom (header readability)
    Box(modifier = Modifier.fillMaxSize().background(
        brush = Brush.verticalGradient(
            0f    to Color(0xFF000000).copy(alpha = 0.65f),
            0.18f to Color(0xFF000000).copy(alpha = 0.25f),
            0.36f to Color.Transparent
        )
    ))
    // Layer 3: side gradient
    Box(modifier = Modifier.fillMaxSize().background(
        brush = Brush.horizontalGradient(
            0f    to Color(0xFF000000).copy(alpha = 0.50f),
            0.36f to Color(0xFF000000).copy(alpha = 0.18f),
            0.60f to Color.Transparent
        )
    ))
}
```

### Tag + Title word-by-word reveal

Each word slides up from behind a clip mask (`overflow: hidden` in CSS → `Modifier.clipToBounds()` + animated `translationY` in Compose). Tag words and title words each animate individually with stagger.

```kotlin
// Easing equivalent for power3.out
val power3Out = CubicBezierEasing(0f, 0f, 0.15f, 1f)

// Word stagger constants (match web implementation):
// Tag1 words:  480ms duration, 90ms stagger, 0ms delay
// Tag2 words:  480ms duration, 90ms stagger, 220ms delay
// Title words: 520ms duration, 80ms stagger, 180ms delay

@Composable
fun WordReveal(
    words: List<String>,
    fontSize: TextUnit,
    fontWeight: FontWeight,
    fontFamily: FontFamily,
    staggerMs: Int,
    durationMs: Int,
    delayMs: Int = 0,
    playing: Boolean,
    color: Color = Color.White,
) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(4.dp),
        verticalAlignment = Alignment.Bottom
    ) {
        words.forEachIndexed { i, word ->
            val offsetY = remember { Animatable(1.1f) }   // 110% down (normalized)
            val alpha   = remember { Animatable(0f) }

            LaunchedEffect(playing) {
                if (!playing) return@LaunchedEffect
                val startDelay = (delayMs + i * staggerMs).toLong()
                delay(startDelay)
                coroutineScope {
                    launch {
                        offsetY.animateTo(0f, tween(durationMs, easing = power3Out))
                    }
                    launch {
                        alpha.animateTo(1f, tween(durationMs, easing = power3Out))
                    }
                }
            }

            // Clip wrapper — word cannot escape upward
            Box(modifier = Modifier.clipToBounds()) {
                Text(
                    text = word,
                    fontSize = fontSize,
                    fontWeight = fontWeight,
                    fontFamily = fontFamily,
                    color = color.copy(alpha = alpha.value),
                    modifier = Modifier.graphicsLayer {
                        // offsetY=1.1 means translate down by full line height
                        translationY = offsetY.value * size.height
                    }
                )
            }
        }
    }
}

// Usage — tag + title block (starts at t=1100ms)
Column(
    modifier = Modifier
        .absoluteOffset(x = 80.dp, y = 228.dp)
        .width(480.dp),
    verticalArrangement = Arrangement.spacedBy(16.dp)
) {
    // Tag row
    Row(verticalAlignment = Alignment.CenterVertically) {
        // White vertical bar
        Box(Modifier.width(3.dp).height(32.dp).background(Color.White, RoundedCornerShape(4.dp)))
        Spacer(Modifier.width(16.dp))
        WordReveal(
            words = listOf("Weekend Escapes"),
            fontSize = 22.sp, fontWeight = FontWeight.Medium, fontFamily = InterFont,
            staggerMs = 90, durationMs = 480, delayMs = 0, playing = titlePlaying
        )
        Spacer(Modifier.width(12.dp))
        // Separator dash
        Box(Modifier.width(8.dp).height(3.dp).background(Color.White, RoundedCornerShape(10.dp)))
        Spacer(Modifier.width(12.dp))
        WordReveal(
            words = listOf("Travel"),
            fontSize = 22.sp, fontWeight = FontWeight.Medium, fontFamily = InterFont,
            staggerMs = 90, durationMs = 480, delayMs = 220, playing = titlePlaying
        )
    }

    // Title
    if (titlePlaying) {
        WordReveal(
            words = "A Coffee Estate at First Light".split(" "),
            fontSize = 28.sp, fontWeight = FontWeight.Bold, fontFamily = PlusJakartaSansFont,
            staggerMs = 80, durationMs = 520, delayMs = 180, playing = true
        )
    }
}
```

---

## State 2 — Agent Reveal (Hero)

```kotlin
// AGENT_REVEAL_MS = 600ms, MASCOT_HERO_SIZE = 56dp
val mascotAlpha by animateFloatAsState(
    targetValue = if (agentVisible) 1f else 0f,
    animationSpec = tween(600, easing = FastOutSlowInEasing)  // power3.out
)
val mascotOffsetY by animateDpAsState(
    targetValue = if (agentVisible) 0.dp else 10.dp,
    animationSpec = tween(600, easing = FastOutSlowInEasing)
)

// Hero mascot position: left=80, top = REASONING_TOP - 56 - 20 = 732dp
RiveAnimationView(
    modifier = Modifier
        .size(56.dp)
        .absoluteOffset(x = 80.dp, y = 732.dp)
        .graphicsLayer { alpha = mascotAlpha; translationY = mascotOffsetY.toPx() },
    riveResource = R.raw.mascot,
    stateMachineName = "G_Moscot_States",
    autoplay = true,
)
// Trigger idle state: stateMachine.getBooleanInput("Looking").value = false
```

**Mascot mode mapping:**

| Compose/Android      | Rive state name       | When             |
|----------------------|-----------------------|------------------|
| `idle`               | `Idel _Eyeblink`      | States 1–2, 5–8  |
| `thinking`           | `Loading` (play)      | State 3 (reasoning reveal) |
| `looking`            | `Looking Around`      | State 4 end → State 5 start |

> ⚠️ "Idel _Eyeblink" has a typo — use exact string.

---

## State 3 — Reasoning Reveal

### Timing: `REASONING_REVEAL_MS = 4500 ms`

This is deliberately slow — the user needs time to absorb the reasoning. Spread the stagger across 4500 ms (not the old 2800 ms).

### Character-level blur + opacity stagger

Compose does not support per-character animation natively. Two approaches:

**Option A: Character Animatables (recommended for TV)**
```kotlin
data class CharToken(val char: String, val isHighlight: Boolean)

fun buildTokens(text: String, highlights: List<String>): List<CharToken> { ... }

@Composable
fun ReasoningReveal(tokens: List<CharToken>, playing: Boolean, resolveMs: Int = 4500) {
    val alphas = remember { tokens.map { Animatable(0f) } }

    LaunchedEffect(playing) {
        if (!playing) return@LaunchedEffect
        val staggerMs = resolveMs.toFloat() / tokens.size
        tokens.forEachIndexed { i, _ ->
            launch {
                delay((i * staggerMs).toLong())
                alphas[i].animateTo(0.8f, tween(200, easing = FastOutSlowInEasing))
            }
        }
    }

    FlowRow {
        tokens.forEachIndexed { i, token ->
            Text(
                text = token.char,
                color = if (token.isHighlight)
                    Color(0xFFCEC1FF).copy(alpha = alphas[i].value)
                else
                    Color.White.copy(alpha = alphas[i].value),
                fontWeight = if (token.isHighlight) FontWeight.SemiBold else FontWeight.Normal,
                fontSize = 32.sp,
            )
        }
    }
}
```

**Option B: AnimatedVisibility + fade (simpler but less precise)**
```kotlin
AnimatedVisibility(
    visible = reasoningVisible,
    enter = fadeIn(tween(350)) + slideInVertically { it / 4 }
) {
    Text(reasoningText, ...)
}
// Then fade in the full text — less character-precise but acceptable for MVP
```

**Blur approximation (Android):**  
Android does not support `filter: blur()` per character. Use a `BlurMaskFilter` on a `Canvas` draw, or skip blur and rely on opacity stagger alone — the timing impression is the key property.

```kotlin
// Blur approximation with Paint layer
val paint = Paint().apply {
    asFrameworkPaint().maskFilter = BlurMaskFilter(
        blurRadiusPx * (1f - revealProgress),
        BlurMaskFilter.Blur.NORMAL
    )
}
```

**Reasoning position:**
```kotlin
Text(
    modifier = Modifier
        .absoluteOffset(x = 80.dp, y = 808.dp)
        .width(960.dp),
    text = reasoningText,
    fontSize = 32.sp,
    fontWeight = FontWeight.Normal,
    color = Color.White.copy(alpha = 0.8f),
    lineHeight = 40.sp,
)
```

---

## State 4 — Hero Shrink

```kotlin
// HERO_SHRINK_MS = 500ms, scales both mascot and reasoning simultaneously

val shrinkProgress by animateFloatAsState(
    targetValue = if (heroShrunk) 1f else 0f,
    animationSpec = tween(500, easing = FastOutSlowInEasing)  // power2.inOut
)

val mascotScale    = lerp(1f, 0.714f, shrinkProgress)    // MASCOT_FINAL_SCALE = 40/56
val reasoningScale = lerp(1f, 0.78f, shrinkProgress)     // REASONING_FINAL_SCALE

// Apply to Mascot:
.graphicsLayer { scaleX = mascotScale; scaleY = mascotScale; transformOrigin = TransformOrigin(0f, 0.5f) }

// Apply to Reasoning:
.graphicsLayer { scaleX = reasoningScale; scaleY = reasoningScale; transformOrigin = TransformOrigin(0f, 0f) }
```

---

## State 5 — CTA Entry

```kotlin
// CTA_PILL_REVEAL_MS = 350ms
val ctaAlpha by animateFloatAsState(
    targetValue = if (ctaVisible) 1f else 0f,
    animationSpec = tween(350, easing = FastOutSlowInEasing)
)
val ctaOffsetY by animateDpAsState(
    targetValue = if (ctaVisible) 0.dp else 16.dp,
    animationSpec = tween(350, easing = FastOutSlowInEasing)
)

// CTA pill spec (Figma: left=80, top=928, h=72, radius=72)
Box(
    modifier = Modifier
        .absoluteOffset(x = 80.dp, y = (1080 - 72 - 72).dp)  // top=928
        .height(72.dp)
        .clip(RoundedCornerShape(72.dp))
        .background(Color.White.copy(alpha = 0.95f))
        .graphicsLayer { alpha = ctaAlpha; translationY = ctaOffsetY.toPx() }
        .padding(start = 8.dp, end = 28.dp),
    contentAlignment = Alignment.CenterStart
) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        // Mascot slot (empty until State 6)
        if (mascotInCta) {
            RiveAnimationView(modifier = Modifier.size(40.dp), ...)
            Spacer(Modifier.width(10.dp))
        }
        // CTA text clip-reveal (State 7)
        if (ctaTextPlaying) {
            AnimatedCTAText(text = "Want me to shortlist estate stays?")
        }
    }
}
```

> **Note:** Feedback pill and product images do NOT appear at State 5. They are deferred to State 8 after CTA text completes.

---

## State 6 — Mascot FLIP Arc

This is the most complex state. Use a custom `Animatable` path animation.

```kotlin
// Compute source (mascot float center) and target (CTA slot center) positions
// These are layout coordinates, available after first composition pass.

LaunchedEffect(beginFlip) {
    if (!beginFlip) return@LaunchedEffect

    val dx = ctaSlotCenter.x - mascotFloatCenter.x
    val dy = ctaSlotCenter.y - mascotFloatCenter.y
    val arcH = kotlin.math.abs(dy) * 0.45f + 32f

    // Two-keyframe arc using coroutines
    // Keyframe 1 (midpoint): 350ms, power2.out
    val midX = Animatable(mascotFloatCenter.x)
    val midY = Animatable(mascotFloatCenter.y)
    val midScale = Animatable(1f)

    coroutineScope {
        launch { midX.animateTo(mascotFloatCenter.x + dx * 0.5f, tween(350, easing = FastOutSlowInEasing)) }
        launch { midY.animateTo(mascotFloatCenter.y + dy * 0.5f - arcH, tween(350, easing = FastOutSlowInEasing)) }
        launch { midScale.animateTo(0.8f, tween(350)) }
    }

    // Keyframe 2 (landing): 350ms, power3.in (AccelerateInterpolator)
    coroutineScope {
        launch { midX.animateTo(ctaSlotCenter.x, tween(350, easing = LinearEasing)) }
        launch { midY.animateTo(ctaSlotCenter.y, tween(350, easing = LinearEasing)) }
        launch { midScale.animateTo(0.5f, tween(350)) }
    }

    // On landing
    mascotFloatVisible = false
    mascotInCta = true
    delay(CTA_SETTLE_MS.toLong())  // 380ms settle
    ctaTextPlaying = true
}
```

---

## State 7 — CTA Text Reveal

```kotlin
// Clip-reveal: expand container width from 0 to full text width
// Combine with character opacity stagger

@Composable
fun AnimatedCTAText(text: String) {
    val clipWidth = remember { Animatable(0f) }
    val textWidth = remember { mutableStateOf(0f) }

    LaunchedEffect(Unit) {
        // Measure text width first (from onGloballyPositioned)
        // Then animate clip
        clipWidth.animateTo(
            targetValue = textWidth.value,
            animationSpec = tween(
                durationMillis = 1400,
                easing = LinearEasing  // power1.inOut
            )
        )
    }

    Box(modifier = Modifier.width(with(LocalDensity.current) { clipWidth.value.toDp() }).clip(RectangleShape)) {
        Text(
            text = text,
            fontSize = 24.sp,
            fontWeight = FontWeight.SemiBold,
            color = Color(0xFF111111),
            modifier = Modifier.onGloballyPositioned { coords ->
                textWidth.value = coords.size.width.toFloat()
            }
        )
    }
}
```

---

## State 8 — Final Hold + Staggered Entry

CTA text completes → feedback pill appears → product images appear. Background drift begins simultaneously.

### Staggered entry sequence

Spring easing equivalent: `CubicBezierEasing(0.16f, 1f, 0.3f, 1f)` — fast start, spring-like settle. Use this for both feedback and product entries.

```kotlin
val springEasing = CubicBezierEasing(0.16f, 1f, 0.3f, 1f)

// Feedback pill: beamAt + 400ms
val feedbackAlpha by animateFloatAsState(
    targetValue = if (feedbackVisible) 1f else 0f,
    animationSpec = tween(650, easing = springEasing)
)
val feedbackOffsetY by animateDpAsState(
    targetValue = if (feedbackVisible) 0.dp else 14.dp,
    animationSpec = tween(650, easing = springEasing)
)

// Product images: beamAt + 750ms
val productAlpha by animateFloatAsState(
    targetValue = if (productVisible) 1f else 0f,
    animationSpec = tween(700, easing = springEasing)
)
val productOffsetX by animateDpAsState(
    targetValue = if (productVisible) 0.dp else 28.dp,
    animationSpec = tween(700, easing = springEasing)
)

// Drive via coroutine in the state machine:
// after(beamAt + 400) { feedbackVisible = true }
// after(beamAt + 750) { productVisible = true; driftActive = true }
```

### Background drift

```kotlin
// Background drift: container-level scale + pan, sine.inOut, 14s, yoyo
// BACKGROUND_DRIFT_MS = 14000, BACKGROUND_DRIFT_SCALE = 1.025

val driftScale = remember { Animatable(1f) }
val driftX     = remember { Animatable(0f) }
val driftY     = remember { Animatable(0f) }

LaunchedEffect(driftActive) {
    if (!driftActive) return@LaunchedEffect
    while (true) {
        coroutineScope {
            launch { driftScale.animateTo(1.025f, tween(14_000, easing = CubicBezierEasing(0.445f, 0.05f, 0.55f, 0.95f))) }
            launch { driftX.animateTo(0.6f, tween(14_000, easing = CubicBezierEasing(0.445f, 0.05f, 0.55f, 0.95f))) }
            launch { driftY.animateTo(-0.3f, tween(14_000, easing = CubicBezierEasing(0.445f, 0.05f, 0.55f, 0.95f))) }
        }
        coroutineScope {
            launch { driftScale.animateTo(1f, tween(14_000, easing = CubicBezierEasing(0.445f, 0.05f, 0.55f, 0.95f))) }
            launch { driftX.animateTo(0f, tween(14_000, easing = CubicBezierEasing(0.445f, 0.05f, 0.55f, 0.95f))) }
            launch { driftY.animateTo(0f, tween(14_000, easing = CubicBezierEasing(0.445f, 0.05f, 0.55f, 0.95f))) }
        }
    }
}

// Apply to scene container (NOT the image alone — all elements drift together)
Box(
    modifier = Modifier
        .fillMaxSize()
        .graphicsLayer {
            scaleX       = driftScale.value
            scaleY       = driftScale.value
            translationX = driftX.value * size.width / 100f
            translationY = driftY.value * size.height / 100f
        }
) { /* all L0 content */ }
```

---

## Feedback Pill (single pill, both thumbs)

**Spec:** Single dark pill at left=602, top=928 containing both thumbs-up and thumbs-down as one icon unit.

```kotlin
// FeedbackPill — single pill, no separate focus per thumb
// Entry: opacity 0→1, translateY +14dp→0, 650ms, spring easing

@Composable
fun FeedbackPill(
    focused: Boolean,
    onClick: () -> Unit,
    alpha: Float,
    offsetY: Dp,
) {
    val borderAlpha by animateFloatAsState(if (focused) 1f else 0f, tween(180))

    Box(
        modifier = Modifier
            .absoluteOffset(x = 602.dp, y = (1080 - 72 - 72).dp)  // same bottom row as CTA
            .graphicsLayer { this.alpha = alpha; translationY = offsetY.toPx() }
            .clip(RoundedCornerShape(36.dp))
            .background(
                brush = Brush.verticalGradient(
                    listOf(
                        Color(0xFF141414).copy(alpha = 0.9f),
                        Color(0xFF000000).copy(alpha = 0.9f)
                    )
                )
            )
            .border(2.dp, Color.White.copy(alpha = borderAlpha + 0.0f), RoundedCornerShape(36.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 20.dp, vertical = 16.dp),
        contentAlignment = Alignment.Center
    ) {
        // Both thumbs as a single Canvas draw or SVG-equivalent vector
        // Thumb up: left half; Thumb down: right half
        // Total icon size: 66×40dp
        ThumbsIcon()
    }
}

@Composable
fun ThumbsIcon() {
    Canvas(modifier = Modifier.size(width = 66.dp, height = 40.dp)) {
        val iconColor = Color.White.copy(alpha = 0.72f)

        // Thumbs up (left side)
        drawPath(
            path = thumbsUpPath(size),
            color = iconColor,
        )
        // Thumbs down (right side, mirrored and offset)
        drawPath(
            path = thumbsDownPath(size),
            color = iconColor,
        )
    }
}
```

> **No separate focus per thumb.** The entire pill is one focusable element. Focus ring is the white border.

---

## Product Images (stacked, no text, no card)

**Spec:** Two stacked product images at left=1752, top=924, size=80×80. No text, no background card, no focus state — purely ambient.

```kotlin
// Entry: opacity 0→1, translateX +28dp→0, 700ms, spring easing

@Composable
fun ProductImages(
    alpha: Float,
    offsetX: Dp,
) {
    Box(
        modifier = Modifier
            .absoluteOffset(x = 1752.dp, y = 924.dp)
            .size(80.dp)
            .graphicsLayer { this.alpha = alpha; translationX = offsetX.toPx() }
    ) {
        // Back image: rotated 10°, offset right by 15dp, size=72dp
        Box(
            modifier = Modifier
                .offset(x = 15.dp, y = 0.dp)
                .size(72.dp)
                .rotate(10f)
                .clip(RoundedCornerShape(16.dp))
                .border(3.dp, Color.White, RoundedCornerShape(16.dp))
                .background(Color(0xFFC1B4A1))
        )
        // Front image: full size, no rotation
        Box(
            modifier = Modifier
                .size(80.dp)
                .clip(RoundedCornerShape(18.dp))
                .border(3.dp, Color.White, RoundedCornerShape(18.dp))
                .background(Color(0xFFE8DDD0))
        )
    }
}
```

> **No focus state, no text, no white card background.** Products are ambient — they signal availability without demanding attention.

---

## Focus Navigation (D-pad)

Two focusable targets in State 8: CTA pill and Feedback pill. Products have no focus.

```kotlin
enum class FocusTarget { CTA, FEEDBACK }

// Toggle with D-pad up/down or left/right:
fun onFocusToggle(current: FocusTarget): FocusTarget = when (current) {
    FocusTarget.CTA      -> FocusTarget.FEEDBACK
    FocusTarget.FEEDBACK -> FocusTarget.CTA
}
```

---

## State Machine — Coroutine Driver

```kotlin
sealed class L0State {
    object TitleReveal : L0State()
    object AgentReveal : L0State()
    object Reasoning   : L0State()
    object HeroShrink  : L0State()
    object CTAEntry    : L0State()
    object CTAExpand   : L0State()
    object CTAText     : L0State()
    object FinalHold   : L0State()
}

// Drive state machine with a coroutine
suspend fun runL0Sequence(onStateChange: (L0State) -> Unit) {
    onStateChange(L0State.TitleReveal)
    delay(1100L + TITLE_HOLD_MS)

    onStateChange(L0State.AgentReveal)
    delay(AGENT_REVEAL_MS.toLong() + AGENT_HOLD_MS)

    onStateChange(L0State.Reasoning)
    delay(REASONING_REVEAL_MS.toLong() + REASONING_HOLD_MS)  // 4500 + 5000

    onStateChange(L0State.HeroShrink)
    delay(HERO_SHRINK_MS.toLong() + HERO_SHRINK_HOLD_MS + AGENT_LOOK_TO_CTA_MS)

    onStateChange(L0State.CTAEntry)
    delay(400L)

    onStateChange(L0State.CTAExpand)
    delay(MASCOT_FLIP_MS.toLong() + 220L + CTA_SETTLE_MS)

    onStateChange(L0State.CTAText)
    val beamAt = CTA_TEXT_REVEAL_MS.toLong() + BEAM_MARGIN_MS + 200L
    delay(beamAt + 400L)   // stagger start: feedback pill
    feedbackVisible = true
    delay(350L)            // 750ms after beamAt total: product images
    productVisible = true
    driftActive = true

    onStateChange(L0State.FinalHold)
    delay(FINAL_HOLD_MS.toLong())
}
```

---

## Timing Constants (from `src/config/l0T1Config.ts`)

```kotlin
object L0T1Timing {
    const val TITLE_HOLD_MS         = 1000
    const val AGENT_REVEAL_MS       = 600
    const val AGENT_HOLD_MS         = 1000
    const val REASONING_REVEAL_MS   = 4500   // was 2800 — deliberately slow for readability
    const val REASONING_HOLD_MS     = 5000
    const val HERO_SHRINK_MS        = 500
    const val HERO_SHRINK_HOLD_MS   = 500
    const val AGENT_LOOK_TO_CTA_MS  = 650
    const val CTA_PILL_REVEAL_MS    = 350
    const val MASCOT_FLIP_MS        = 700
    const val CTA_SETTLE_MS         = 380
    const val CTA_TEXT_REVEAL_MS    = 1400
    const val BEAM_MARGIN_MS        = 150
    const val FINAL_HOLD_MS         = 10_000
    const val BACKGROUND_DRIFT_MS   = 14_000

    const val MASCOT_HERO_SIZE_DP   = 56
    const val MASCOT_FINAL_SIZE_DP  = 40
    const val MASCOT_CTA_SIZE_DP    = 40
    const val MASCOT_FINAL_SCALE    = 0.714f   // 40/56
    const val REASONING_FINAL_SCALE = 0.78f

    // State 8 staggered entry (relative to beamAt)
    const val FEEDBACK_DELAY_MS     = 400      // beamAt + 400
    const val PRODUCT_DELAY_MS      = 750      // beamAt + 750
}
```

---

## Easing Reference

| Web (GSAP / CSS)                      | Android Compose equivalent                              | Used for |
|---------------------------------------|----------------------------------------------------------|----------|
| `power1.out`                          | `LinearOutSlowInEasing`                                  | Parallax, background pan |
| `power2.out`                          | `FastOutSlowInEasing`                                    | Opacity + position reveals |
| `power2.inOut`                        | `FastOutSlowInEasing`                                    | Mascot shrink, reasoning shrink |
| `power3.out`                          | `CubicBezierEasing(0f, 0f, 0.15f, 1f)`                  | Word reveals, mascot entrance, CTA pill |
| `power3.in`                           | `LinearEasing` (approx; use custom cubic for precision)  | Mascot arc landing |
| `sine.inOut`                          | `CubicBezierEasing(0.445f, 0.05f, 0.55f, 0.95f)`        | Background drift |
| `cubic-bezier(0.16, 1, 0.3, 1)` (spring) | `CubicBezierEasing(0.16f, 1f, 0.3f, 1f)`            | Feedback pill + product images entry |

---

## Implementation Notes

1. **Character blur on Android** — `BlurMaskFilter` on a `Canvas` layer is the closest equivalent to CSS `filter: blur()`. For production, evaluate whether a simple alpha stagger without blur is acceptable — the temporal pattern matters more than the blur effect itself.

2. **Mascot FLIP arc** — the arc requires runtime layout coordinates. Use `onGloballyPositioned` to capture both the float mascot and CTA slot positions before triggering the arc animation. Store as `IntOffset` in a `SnapshotStateOf<IntOffset?>` and trigger `LaunchedEffect` when both become non-null.

3. **RiveAnimationView** — integrate via `io.rive-app:rive-android`. Load `/raw/mascot.riv`, bind to state machine `G_Moscot_States`. Use boolean input `Looking` for idle↔looking, call `controller.play("Loading")` for thinking state.

4. **Text clip-reveal** — Compose has no direct `overflow: clip` + animated width equivalent. Use `Box` with `Modifier.clip(RectangleShape)` and an animated `width` modifier. The `Animatable<Float>` driving the width must be converted to `Dp` via `LocalDensity`.

5. **Background drift** — apply to a single wrapping `Box` as a `graphicsLayer` transform. This ensures all layers (image, overlay, text, CTAs) move as one unit, preserving the composition.

6. **GPU layers** — add `Modifier.graphicsLayer {}` (even with identity values) on all animated elements to promote them to GPU layers ahead of time and avoid first-frame jank.

7. **D-pad focus** — on Android TV, override `dispatchKeyEvent` in the Activity or use `Modifier.onKeyEvent` in Compose to intercept `KEYCODE_DPAD_RIGHT`, `KEYCODE_DPAD_LEFT`, `KEYCODE_DPAD_UP`, `KEYCODE_DPAD_DOWN`, and `KEYCODE_DPAD_CENTER`. Disable Compose's built-in focus traversal for the bottom bar row to maintain manual focus control. Only CTA and Feedback pill are focusable — products have no focus.

8. **32-bit font rendering** — use `Plus Jakarta Sans` as the primary font (downloadable from Google Fonts). Add it as a custom font resource. `Inter` is used for the tag row and header weather/date text.

9. **Word reveal and feedback/product visibility are driven by React state (CSS transitions) in the web reference** — in Compose, mirror this with `animateFloatAsState` / `animateDpAsState` driven by Boolean flags updated by the coroutine driver. This avoids animation timing races.
