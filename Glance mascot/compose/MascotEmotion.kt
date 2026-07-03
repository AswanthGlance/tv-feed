package com.glance.mascot

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch

/* ─────────────────────────────────────────────────────────────────────────────
   Glance Mascot — 4 Core Emotions in Jetpack Compose
   Canvas size: 220 × 220 dp  (matches the web playground)
   ───────────────────────────────────────────────────────────────────────────── */

enum class MascotEmotion { IDLE, THINKING, HAPPY, CONFUSED }

/* ── Colours ── */
private val BodyGradientColors = listOf(
    Color(0xFFCB48C9),
    Color(0xFFA540DC),
    Color(0xFF863AEB),
    Color(0xFF7135F6),
    Color(0xFF6432FC),
    Color(0xFF6032FF),
)
private val GlowColor      = Color(0xFF9333EA)
private val EyeColor       = Color.White
private val BrowColor      = Color(0xCCFFFFFF)
private val FloatQColor    = Color(0xFFA78BFA)
private val ParticleColor  = Color(0xFFA78BFA)
private val ShadowColor    = Color(0x8C000000)

/* ── Rest state constants ── */
private const val REST_GLOW_ALPHA   = 0.55f
private const val REST_SHADOW_ALPHA = 0.38f

/* ─────────────────────────────────────────────────────────────────────────────
   State holder — one data class drives the Canvas draw
   ───────────────────────────────────────────────────────────────────────────── */
data class MascotState(
    val bodyScaleX:    Float = 1f,
    val bodyScaleY:    Float = 1f,
    val wrapY:         Float = 0f,
    val wrapRotation:  Float = 0f,
    val glowScale:     Float = 1f,
    val glowAlpha:     Float = REST_GLOW_ALPHA,
    val eyeScaleY:     Float = 1f,
    val eyeScaleX:     Float = 1f,
    val eyeX:          Float = 0f,
    val browAlpha:     Float = 0f,
    val browRotL:      Float = 0f,
    val browRotR:      Float = 0f,
    val smileAlpha:    Float = 0f,
    val cheekAlpha:    Float = 0f,
    val floatQ1Alpha:  Float = 0f,
    val floatQ1Y:      Float = 0f,
    val floatQ2Alpha:  Float = 0f,
    val floatQ2Y:      Float = 0f,
    val floatQ3Alpha:  Float = 0f,
    val floatQ3Y:      Float = 0f,
)

/* ─────────────────────────────────────────────────────────────────────────────
   Main composable
   ───────────────────────────────────────────────────────────────────────────── */
@Composable
fun GlanceMascot(
    emotion: MascotEmotion,
    modifier: Modifier = Modifier,
) {
    val state = when (emotion) {
        MascotEmotion.IDLE     -> rememberIdleState()
        MascotEmotion.THINKING -> rememberThinkingState()
        MascotEmotion.HAPPY    -> rememberHappyState()
        MascotEmotion.CONFUSED -> rememberConfusedState()
    }

    Box(
        modifier = modifier.size(220.dp),
        contentAlignment = Alignment.Center,
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val cx = size.width / 2f
            val cy = size.height / 2f

            // Shadow
            drawShadow(cx, cy, state)

            // Glow
            drawGlow(cx, cy, state)

            // Wrap transform: Y offset + rotation
            translate(left = 0f, top = state.wrapY.dp.toPx()) {
                rotate(degrees = state.wrapRotation, pivot = Offset(cx, cy)) {

                    // Body
                    drawBody(cx, cy, state)

                    // Eyes
                    drawEyes(cx, cy, state)

                    // Brows
                    if (state.browAlpha > 0f) drawBrows(cx, cy, state)

                    // Smile
                    if (state.smileAlpha > 0f) drawSmile(cx, cy, state)

                    // Cheeks
                    if (state.cheekAlpha > 0f) drawCheeks(cx, cy, state)
                }
            }

            // Floating ? marks (outside wrap so they float freely)
            if (state.floatQ2Alpha > 0f) {
                drawFloatQ(cx, cy - 20.dp.toPx() + state.floatQ2Y.dp.toPx(),
                    state.floatQ2Alpha, 48f)
            }
            if (state.floatQ1Alpha > 0f) {
                drawFloatQ(cx - 50.dp.toPx(), cy - 20.dp.toPx() + state.floatQ1Y.dp.toPx(),
                    state.floatQ1Alpha, 36f)
            }
            if (state.floatQ3Alpha > 0f) {
                drawFloatQ(cx + 50.dp.toPx(), cy - 20.dp.toPx() + state.floatQ3Y.dp.toPx(),
                    state.floatQ3Alpha, 34f)
            }
        }
    }
}

/* ─────────────────────────────────────────────────────────────────────────────
   Draw helpers
   ───────────────────────────────────────────────────────────────────────────── */

private fun DrawScope.drawShadow(cx: Float, cy: Float, s: MascotState) {
    val w = 130.dp.toPx()
    val h = 20.dp.toPx()
    val bottom = cy + 110.dp.toPx()
    drawOval(
        brush = Brush.radialGradient(
            colors = listOf(ShadowColor, Color.Transparent),
            center = Offset(cx, bottom),
            radius = w / 2f,
        ),
        topLeft = Offset(cx - w / 2f, bottom - h / 2f),
        size = Size(w, h),
    )
}

private fun DrawScope.drawGlow(cx: Float, cy: Float, s: MascotState) {
    val radius = (140.dp.toPx()) * s.glowScale
    drawCircle(
        brush = Brush.radialGradient(
            colors = listOf(
                GlowColor.copy(alpha = 0.33f * s.glowAlpha / REST_GLOW_ALPHA),
                GlowColor.copy(alpha = 0.1f  * s.glowAlpha / REST_GLOW_ALPHA),
                Color.Transparent,
            ),
            center = Offset(cx, cy),
            radius = radius,
        ),
        radius = radius,
        center = Offset(cx, cy),
    )
}

private fun DrawScope.drawBody(cx: Float, cy: Float, s: MascotState) {
    val r = 110.dp.toPx()
    scale(scaleX = s.bodyScaleX, scaleY = s.bodyScaleY, pivot = Offset(cx, cy)) {
        drawCircle(
            brush = Brush.linearGradient(
                colors = BodyGradientColors,
                start = Offset(cx + r, cy - r),
                end   = Offset(cx - r * 0.5f, cy + r),
            ),
            radius = r,
            center = Offset(cx, cy),
        )
    }
}

private fun DrawScope.drawEyes(cx: Float, cy: Float, s: MascotState) {
    // Eye centres relative to 220×220 body: left=(78,95), right=(126,95)
    val leftCx  = (cx - 110.dp.toPx()) + 78.dp.toPx()  + s.eyeX.dp.toPx()
    val rightCx = (cx - 110.dp.toPx()) + 126.dp.toPx() + s.eyeX.dp.toPx()
    val eyeCy   = (cy - 110.dp.toPx()) + 95.dp.toPx()

    val pillW = 19.dp.toPx()
    val pillH = 45.dp.toPx()

    listOf(leftCx, rightCx).forEach { ecx ->
        scale(scaleX = s.eyeScaleX, scaleY = s.eyeScaleY, pivot = Offset(ecx, eyeCy)) {
            drawRoundRect(
                color = EyeColor,
                topLeft = Offset(ecx - pillW / 2f, eyeCy - pillH / 2f),
                size = Size(pillW, pillH),
                cornerRadius = CornerRadius(10.dp.toPx()),
            )
        }
    }
}

private fun DrawScope.drawBrows(cx: Float, cy: Float, s: MascotState) {
    val leftCx  = (cx - 110.dp.toPx()) + 78.dp.toPx()
    val rightCx = (cx - 110.dp.toPx()) + 126.dp.toPx()
    val browCy  = (cy - 110.dp.toPx()) + 54.dp.toPx()
    val browW   = 22.dp.toPx()

    // Left brow
    rotate(s.browRotL, pivot = Offset(leftCx, browCy)) {
        drawArc(
            color = BrowColor.copy(alpha = s.browAlpha),
            startAngle = 180f,
            sweepAngle = 180f,
            useCenter = false,
            topLeft = Offset(leftCx - browW / 2f, browCy - 5.dp.toPx()),
            size = Size(browW, 10.dp.toPx()),
            style = androidx.compose.ui.graphics.drawscope.Stroke(width = 3.dp.toPx()),
        )
    }

    // Right brow
    rotate(s.browRotR, pivot = Offset(rightCx, browCy)) {
        drawArc(
            color = BrowColor.copy(alpha = s.browAlpha),
            startAngle = 180f,
            sweepAngle = 180f,
            useCenter = false,
            topLeft = Offset(rightCx - browW / 2f, browCy - 5.dp.toPx()),
            size = Size(browW, 10.dp.toPx()),
            style = androidx.compose.ui.graphics.drawscope.Stroke(width = 3.dp.toPx()),
        )
    }
}

private fun DrawScope.drawSmile(cx: Float, cy: Float, s: MascotState) {
    val smileW = 44.dp.toPx()
    val smileH = 20.dp.toPx()
    val smileCy = (cy - 110.dp.toPx()) + 122.dp.toPx()
    drawArc(
        color = EyeColor.copy(alpha = s.smileAlpha * 0.9f),
        startAngle = 0f,
        sweepAngle = 180f,
        useCenter = false,
        topLeft = Offset(cx - smileW / 2f, smileCy),
        size = Size(smileW, smileH),
        style = androidx.compose.ui.graphics.drawscope.Stroke(width = 4.dp.toPx()),
    )
}

private fun DrawScope.drawCheeks(cx: Float, cy: Float, s: MascotState) {
    val cheekCy = (cy - 110.dp.toPx()) + 110.dp.toPx()
    val cheekW  = 26.dp.toPx()
    val cheekH  = 14.dp.toPx()
    val cheekColor = Color(0xFFFB7185).copy(alpha = s.cheekAlpha * 0.45f)

    drawOval(cheekColor,
        topLeft = Offset((cx - 110.dp.toPx()) + 48.dp.toPx(), cheekCy),
        size = Size(cheekW, cheekH))
    drawOval(cheekColor,
        topLeft = Offset((cx - 110.dp.toPx()) + 220.dp.toPx() - 48.dp.toPx() - cheekW, cheekCy),
        size = Size(cheekW, cheekH))
}

private fun DrawScope.drawFloatQ(x: Float, y: Float, alpha: Float, sizeSp: Float) {
    // Drawn as a circle stand-in; replace with drawText once API is available in your target SDK
    val r = (sizeSp / 2f).dp.toPx()
    drawCircle(FloatQColor.copy(alpha = alpha * 0.8f), radius = r * 0.4f, center = Offset(x, y))
}

/* ─────────────────────────────────────────────────────────────────────────────
   IDLE — breathing sine wave, 7.2 s loop
   ───────────────────────────────────────────────────────────────────────────── */
@Composable
fun rememberIdleState(): MascotState {
    val inf = rememberInfiniteTransition(label = "idle")

    // Primary breath (0→1.8→3.6 s) — full inhale/exhale
    val breathFull by inf.animateFloat(
        initialValue = 0f, targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = keyframes {
                durationMillis = 7200
                0f   at 0       using LinearEasing
                1f   at 1800    using LinearEasing  // peak
                0f   at 3600    using LinearEasing  // exhale done
                0.6f at 4500    using LinearEasing  // shallower 2nd breath
                0f   at 5900    using LinearEasing  // 2nd exhale
                0f   at 7200    using LinearEasing  // hold at rest
            },
            repeatMode = RepeatMode.Restart,
        ),
        label = "idle_breath",
    )

    // Eye blink at 1.8 s
    val blinkT by inf.animateFloat(
        initialValue = 1f, targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = keyframes {
                durationMillis = 7200
                1f   at 0
                1f   at 1780
                0f   at 1800    // closed
                1f   at 1900    // open
                1f   at 7200
            },
            repeatMode = RepeatMode.Restart,
        ),
        label = "idle_blink",
    )

    // Interpolate breath → body scale / glow
    val bodyScaleX = lerp(1f,     1.022f, easeInOut(breathFull))
    val bodyScaleY = lerp(1f,     1.028f, easeInOut(breathFull))
    val glowScale  = lerp(1f,     1.07f,  easeInOut(breathFull))
    val glowAlpha  = lerp(0.55f,  0.68f,  easeInOut(breathFull))
    val eyeScaleY  = blinkT * lerp(1f, 1.05f, easeInOut(breathFull))

    return MascotState(
        bodyScaleX = bodyScaleX,
        bodyScaleY = bodyScaleY,
        glowScale  = glowScale,
        glowAlpha  = glowAlpha,
        eyeScaleY  = eyeScaleY,
    )
}

/* ─────────────────────────────────────────────────────────────────────────────
   THINKING — tilt + scan + brows, 7.1 s loop
   ───────────────────────────────────────────────────────────────────────────── */
@Composable
fun rememberThinkingState(): MascotState {
    val inf = rememberInfiniteTransition(label = "thinking")

    val t by inf.animateFloat(
        initialValue = 0f, targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(7100, easing = LinearEasing),
            repeatMode = RepeatMode.Restart,
        ),
        label = "thinking_t",
    )

    // Map timeline position (0-1) to seconds
    val sec = t * 7.1f

    // Rotation: -10 → -13 → -7 → -10 → 0 → 0
    val rotation = when {
        sec < 0.7f  -> lerp(0f,   -10f, easeOut(sec / 0.7f))
        sec < 1.4f  -> lerp(-10f, -13f, easeInOut((sec - 0.7f) / 0.7f))
        sec < 2.3f  -> lerp(-13f, -7f,  easeInOut((sec - 1.4f) / 0.9f))
        sec < 2.75f -> lerp(-7f,  -10f, easeInOut((sec - 2.3f) / 0.45f))
        sec < 3.8f  -> -10f
        sec < 5.5f  -> lerp(-10f, 0f,   easeInOut((sec - 3.8f) / 1.7f))
        else        -> 0f
    }

    // Eye X: 0 → -6 → +5 → 0
    val eyeX = when {
        sec < 0.8f  -> 0f
        sec < 1.4f  -> lerp(0f,  -6f, easeInOut((sec - 0.8f) / 0.6f))
        sec < 2.3f  -> lerp(-6f,  5f, easeInOut((sec - 1.4f) / 0.9f))
        sec < 2.75f -> lerp(5f,   0f, easeOut((sec - 2.3f) / 0.45f))
        sec < 3.8f  -> 0f
        sec < 5.5f  -> lerp(0f,   0f, 1f)
        else        -> 0f
    }

    // Eye scaleY: 1 → 0.55 → 0 (blink at 2.8) → 0.55 → 1
    val eyeScaleY = when {
        sec < 0.1f  -> lerp(1f,    0.55f, easeOut(sec / 0.1f))
        sec < 2.75f -> 0.55f
        sec < 2.88f -> if (sec < 2.8f) 0.55f else lerp(0.55f, 0f, (sec - 2.8f) / 0.08f)
        sec < 3.0f  -> lerp(0f,    0.55f, (sec - 2.88f) / 0.12f)
        sec < 3.8f  -> 0.55f
        sec < 5.5f  -> lerp(0.55f, 1f,    easeInOut((sec - 3.8f) / 1.7f))
        else        -> 1f
    }

    // Glow
    val glowScale = when {
        sec < 0.6f  -> lerp(1f,    0.88f, easeIn(sec / 0.6f))
        sec < 3.0f  -> 0.88f
        sec < 3.5f  -> lerp(0.88f, 1.08f, easeInOut((sec - 3.0f) / 0.5f))
        sec < 3.8f  -> lerp(1.08f, 0.88f, easeInOut((sec - 3.5f) / 0.3f))
        sec < 5.5f  -> lerp(0.88f, 1f,    easeInOut((sec - 3.8f) / 1.7f))
        else        -> 1f
    }
    val glowAlpha = when {
        sec < 0.6f  -> lerp(0.55f, 0.38f, easeIn(sec / 0.6f))
        sec < 3.8f  -> 0.38f
        sec < 5.5f  -> lerp(0.38f, 0.55f, easeInOut((sec - 3.8f) / 1.7f))
        else        -> 0.55f
    }

    // Brows
    val browAlpha = when {
        sec < 0.1f  -> lerp(0f, 1f, sec / 0.1f)
        sec < 4.0f  -> 1f
        sec < 5.0f  -> lerp(1f, 0f, easeOut((sec - 4.0f) / 1.0f))
        else        -> 0f
    }
    val browRotL = when {
        sec < 0.8f  -> 10f
        sec < 1.4f  -> lerp(10f, 13f, easeInOut((sec - 0.8f) / 0.6f))
        sec < 2.3f  -> lerp(13f,  8f, easeInOut((sec - 1.4f) / 0.9f))
        else        -> 10f
    }
    val browRotR = -browRotL

    // Body breath in rest zone (5.5→7.1)
    val bodyScaleX = when {
        sec < 5.5f  -> 1f
        sec < 6.3f  -> lerp(1f, 1.02f,  easeInOut((sec - 5.5f) / 0.8f))
        sec < 7.1f  -> lerp(1.02f, 1f,  easeInOut((sec - 6.3f) / 0.8f))
        else        -> 1f
    }

    return MascotState(
        wrapRotation = rotation,
        eyeX         = eyeX,
        eyeScaleY    = eyeScaleY,
        glowScale    = glowScale,
        glowAlpha    = glowAlpha,
        browAlpha    = browAlpha,
        browRotL     = browRotL,
        browRotR     = browRotR,
        bodyScaleX   = bodyScaleX,
        bodyScaleY   = bodyScaleX,
    )
}

/* ─────────────────────────────────────────────────────────────────────────────
   HAPPY — squash → hop → float → land → rest, 7.2 s loop
   ───────────────────────────────────────────────────────────────────────────── */
@Composable
fun rememberHappyState(): MascotState {
    val inf = rememberInfiniteTransition(label = "happy")

    val t by inf.animateFloat(
        initialValue = 0f, targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(7200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart,
        ),
        label = "happy_t",
    )

    val sec = t * 7.2f

    // Wrap Y
    val wrapY = when {
        sec < 0.25f -> 0f
        sec < 0.8f  -> lerp(0f,   -9f, easeOut((sec - 0.25f) / 0.55f))
        sec < 1.1f  -> -9f
        sec < 2.0f  -> lerp(-9f,  -7f, easeInOut((sec - 1.1f) / 0.9f))
        sec < 3.1f  -> lerp(-7f,  -5f, easeInOut((sec - 2.0f) / 1.1f))
        sec < 3.4f  -> lerp(-5f,   2f, easeIn((sec - 3.1f) / 0.3f))
        sec < 3.7f  -> lerp(2f,    0f, easeOut((sec - 3.4f) / 0.3f))
        sec < 5.5f  -> lerp(0f,    0f, 1f)
        else        -> 0f
    }

    // Body scaleX/Y — squash and stretch
    val bodyScaleX = when {
        sec < 0.25f -> lerp(1f,    1.03f, easeIn(sec / 0.25f))
        sec < 0.7f  -> lerp(1.03f, 0.97f, easeOut((sec - 0.25f) / 0.45f))
        sec < 3.4f  -> lerp(0.97f, 1f,   easeOut((sec - 0.7f) / 2.7f))
        sec < 3.58f -> lerp(1f,    1.05f, easeIn((sec - 3.4f) / 0.18f))
        sec < 3.8f  -> lerp(1.05f, 1f,   easeOut((sec - 3.58f) / 0.22f))
        else        -> 1f
    }
    val bodyScaleY = when {
        sec < 0.25f -> lerp(1f,    0.97f, easeIn(sec / 0.25f))
        sec < 0.7f  -> lerp(0.97f, 1.04f, easeOut((sec - 0.25f) / 0.45f))
        sec < 3.4f  -> lerp(1.04f, 1f,   easeOut((sec - 0.7f) / 2.7f))
        sec < 3.58f -> lerp(1f,    0.96f, easeIn((sec - 3.4f) / 0.18f))
        sec < 3.8f  -> lerp(0.96f, 1f,   easeOut((sec - 3.58f) / 0.22f))
        else        -> 1f
    }

    // Eye scaleY
    val eyeScaleY = when {
        sec < 0.25f -> lerp(1f,    0.88f, easeIn(sec / 0.25f))
        sec < 0.7f  -> lerp(0.88f, 1.08f, easeOut((sec - 0.25f) / 0.45f))
        sec < 2.8f  -> 1.08f
        sec < 2.87f -> lerp(1.08f, 0f,   (sec - 2.8f) / 0.07f) // blink close
        sec < 3.0f  -> lerp(0f,   1.08f, (sec - 2.87f) / 0.13f) // blink open
        sec < 3.8f  -> 1.08f
        sec < 5.2f  -> lerp(1.08f, 1f,   easeInOut((sec - 3.8f) / 1.4f))
        else        -> 1f
    }

    // Glow
    val glowScale = when {
        sec < 0.25f -> 1f
        sec < 0.75f -> lerp(1f,    1.18f, easeOut((sec - 0.25f) / 0.5f))
        sec < 3.8f  -> lerp(1.18f, 1.08f, easeInOut((sec - 0.75f) / 3.05f))
        sec < 5.5f  -> lerp(1.08f, 1f,   easeInOut((sec - 3.8f) / 1.7f))
        else        -> 1f
    }
    val glowAlpha = when {
        sec < 0.25f -> 0.55f
        sec < 0.75f -> lerp(0.55f, 0.78f, easeOut((sec - 0.25f) / 0.5f))
        sec < 3.8f  -> lerp(0.78f, 0.68f, easeInOut((sec - 0.75f) / 3.05f))
        sec < 5.5f  -> lerp(0.68f, 0.55f, easeInOut((sec - 3.8f) / 1.7f))
        else        -> 0.55f
    }

    // Breath at rest (5.5 → 7.2)
    val breathScale = when {
        sec < 5.5f  -> 1f
        sec < 6.35f -> lerp(1f,    1.025f, easeInOut((sec - 5.5f) / 0.85f))
        sec < 7.2f  -> lerp(1.025f, 1f,   easeInOut((sec - 6.35f) / 0.85f))
        else        -> 1f
    }

    return MascotState(
        wrapY      = wrapY,
        bodyScaleX = bodyScaleX * breathScale,
        bodyScaleY = bodyScaleY * breathScale,
        eyeScaleY  = eyeScaleY,
        glowScale  = glowScale,
        glowAlpha  = glowAlpha,
    )
}

/* ─────────────────────────────────────────────────────────────────────────────
   CONFUSED — tilt + darts + 3 question marks, 8.5 s loop
   ───────────────────────────────────────────────────────────────────────────── */
@Composable
fun rememberConfusedState(): MascotState {
    val inf = rememberInfiniteTransition(label = "confused")

    val t by inf.animateFloat(
        initialValue = 0f, targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(8500, easing = LinearEasing),
            repeatMode = RepeatMode.Restart,
        ),
        label = "confused_t",
    )

    val sec = t * 8.5f

    // Rotation + X wiggle
    val rotation = when {
        sec < 0.48f -> lerp(0f,  -6f, easeOut(sec / 0.48f))
        sec < 1.70f -> -6f
        sec < 1.81f -> lerp(-6f, -9f, easeOut((sec - 1.70f) / 0.11f))
        sec < 1.96f -> lerp(-9f,  9f, easeInOut((sec - 1.81f) / 0.15f))
        sec < 2.22f -> lerp(9f,  -5f, easeInOut((sec - 1.96f) / 0.26f))
        sec < 4.0f  -> lerp(-5f, -6f, easeInOut((sec - 2.22f) / 1.78f))
        sec < 5.9f  -> lerp(-6f,  0f, easeInOut((sec - 4.0f) / 1.9f))
        else        -> 0f
    }

    // Eye X: right dart → return → left dart → return
    val eyeX = when {
        sec < 0.7f  -> 0f
        sec < 0.87f -> lerp(0f,   14f, easeOut((sec - 0.7f) / 0.17f))  // dart right
        sec < 1.1f  -> lerp(14f,   0f, easeOut((sec - 0.87f) / 0.23f)) // return
        sec < 3.0f  -> 0f
        sec < 3.17f -> lerp(0f,  -14f, easeOut((sec - 3.0f) / 0.17f))  // dart left
        sec < 3.42f -> lerp(-14f,  0f, easeOut((sec - 3.17f) / 0.25f)) // return
        else        -> 0f
    }

    // Eye scaleY
    val eyeScaleY = when {
        sec < 0.32f -> lerp(1f, 0.52f, easeOut(sec / 0.32f))
        sec < 2.7f  -> 0.52f
        sec < 2.78f -> lerp(0.52f, 0f, (sec - 2.7f) / 0.08f)   // blink close
        sec < 2.92f -> lerp(0f, 0.52f, (sec - 2.78f) / 0.14f)  // blink open
        sec < 4.0f  -> 0.52f
        sec < 5.7f  -> lerp(0.52f, 1f, easeInOut((sec - 4.0f) / 1.7f))
        else        -> 1f
    }

    // Glow
    val glowScale = when {
        sec < 0.55f -> lerp(1f,    0.86f, easeIn(sec / 0.55f))
        sec < 4.0f  -> 0.86f
        sec < 5.8f  -> lerp(0.86f, 1f,   easeInOut((sec - 4.0f) / 1.8f))
        else        -> 1f
    }
    val glowAlpha = when {
        sec < 0.55f -> lerp(0.55f, 0.30f, easeIn(sec / 0.55f))
        sec < 4.0f  -> 0.30f
        sec < 5.8f  -> lerp(0.30f, 0.55f, easeInOut((sec - 4.0f) / 1.8f))
        else        -> 0.55f
    }

    // Brows
    val browAlpha = when {
        sec < 0.05f -> lerp(0f, 1f, sec / 0.05f)
        sec < 4.2f  -> 1f
        sec < 5.4f  -> lerp(1f, 0f, easeOut((sec - 4.2f) / 1.2f))
        else        -> 0f
    }

    // ? Q2 (centre large) — appears at 0.75, gone by 2.0
    val floatQ2Alpha = when {
        sec < 0.75f -> 0f
        sec < 1.13f -> lerp(0f, 1f, easeOut((sec - 0.75f) / 0.38f))
        sec < 1.35f -> 1f
        sec < 2.0f  -> lerp(1f, 0f, easeIn((sec - 1.35f) / 0.65f))
        else        -> 0f
    }
    val floatQ2Y = when {
        sec < 0.75f -> 0f
        sec < 2.0f  -> lerp(0f, -38f, (sec - 0.75f) / 1.25f)
        else        -> 0f
    }

    // ? Q1 (left) — appears at 1.85
    val floatQ1Alpha = when {
        sec < 1.85f -> 0f
        sec < 2.17f -> lerp(0f, 1f, easeOut((sec - 1.85f) / 0.32f))
        sec < 2.43f -> 1f
        sec < 2.98f -> lerp(1f, 0f, easeIn((sec - 2.43f) / 0.55f))
        else        -> 0f
    }
    val floatQ1Y = when {
        sec < 1.85f -> 0f
        sec < 2.98f -> lerp(0f, -32f, (sec - 1.85f) / 1.13f)
        else        -> 0f
    }

    // ? Q3 (right) — appears at 3.1
    val floatQ3Alpha = when {
        sec < 3.1f  -> 0f
        sec < 3.43f -> lerp(0f, 1f, easeOut((sec - 3.1f) / 0.33f))
        sec < 3.65f -> 1f
        sec < 4.23f -> lerp(1f, 0f, easeIn((sec - 3.65f) / 0.58f))
        else        -> 0f
    }
    val floatQ3Y = when {
        sec < 3.1f  -> 0f
        sec < 4.23f -> lerp(0f, -32f, (sec - 3.1f) / 1.13f)
        else        -> 0f
    }

    // Breath in rest zone
    val breathScale = when {
        sec < 6.5f  -> 1f
        sec < 7.5f  -> lerp(1f,    1.025f, easeInOut((sec - 6.5f) / 1.0f))
        sec < 8.5f  -> lerp(1.025f, 1f,   easeInOut((sec - 7.5f) / 1.0f))
        else        -> 1f
    }

    return MascotState(
        wrapRotation = rotation,
        eyeX         = eyeX,
        eyeScaleY    = eyeScaleY,
        glowScale    = glowScale,
        glowAlpha    = glowAlpha,
        browAlpha    = browAlpha,
        bodyScaleX   = breathScale,
        bodyScaleY   = breathScale,
        floatQ1Alpha = floatQ1Alpha,
        floatQ1Y     = floatQ1Y,
        floatQ2Alpha = floatQ2Alpha,
        floatQ2Y     = floatQ2Y,
        floatQ3Alpha = floatQ3Alpha,
        floatQ3Y     = floatQ3Y,
    )
}

/* ─────────────────────────────────────────────────────────────────────────────
   Easing helpers — mirrors the GSAP easing names
   ───────────────────────────────────────────────────────────────────────────── */
private fun easeInOut(t: Float): Float {
    val c = t.coerceIn(0f, 1f)
    return c * c * (3f - 2f * c) // smoothstep = sine approximation
}

private fun easeIn(t: Float): Float {
    val c = t.coerceIn(0f, 1f)
    return c * c
}

private fun easeOut(t: Float): Float {
    val c = t.coerceIn(0f, 1f)
    return 1f - (1f - c) * (1f - c)
}

private fun lerp(a: Float, b: Float, t: Float): Float =
    a + (b - a) * t.coerceIn(0f, 1f)
