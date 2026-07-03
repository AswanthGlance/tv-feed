package com.glance.mascot

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/* ── Quick demo screen ── */
@Preview(showBackground = true, backgroundColor = 0xFF08080F)
@Composable
fun MascotDemoScreen() {
    var current by remember { mutableStateOf(MascotEmotion.IDLE) }

    val emotions = listOf(
        MascotEmotion.IDLE     to "Idle",
        MascotEmotion.THINKING to "Thinking",
        MascotEmotion.HAPPY    to "Happy",
        MascotEmotion.CONFUSED to "Confused",
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF08080F))
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(32.dp),
    ) {
        Text(
            "Glance Mascot",
            color = Color(0xFFE2E2EC),
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
        )

        GlanceMascot(
            emotion = current,
            modifier = Modifier.size(220.dp),
        )

        Text(
            current.name,
            color = Color(0xFFA78BFA),
            fontSize = 16.sp,
            fontWeight = FontWeight.SemiBold,
        )

        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            emotions.forEach { (emotion, label) ->
                val isActive = current == emotion
                Box(
                    modifier = Modifier
                        .background(
                            if (isActive) Color(0xFFA78BFA) else Color(0xFF1A1A2E),
                            RoundedCornerShape(10.dp),
                        )
                        .clickable { current = emotion }
                        .padding(horizontal = 16.dp, vertical = 10.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        label,
                        color = if (isActive) Color.Black else Color(0xFF666688),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium,
                    )
                }
            }
        }
    }
}

/* ── Minimal single-emotion usage example ── */
@Preview(showBackground = true, backgroundColor = 0xFF08080F)
@Composable
fun MascotHappyPreview() {
    GlanceMascot(
        emotion = MascotEmotion.HAPPY,
        modifier = Modifier.size(220.dp),
    )
}
