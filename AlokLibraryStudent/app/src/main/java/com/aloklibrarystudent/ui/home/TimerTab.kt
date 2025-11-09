package com.aloklibrarystudent.ui.home

import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import com.aloklibrarystudent.R

@Composable
internal fun TimerTabContent() {
    val focusDurationSeconds = 25 * 60
    val breakDurationSeconds = 5 * 60

    var isRunning by rememberSaveable { mutableStateOf(false) }
    var isFocusPhase by rememberSaveable { mutableStateOf(true) }
    var remainingSeconds by rememberSaveable { mutableStateOf(focusDurationSeconds) }
    var vibrationEnabled by rememberSaveable { mutableStateOf(true) }

    val context = LocalContext.current

    val totalSeconds = if (isFocusPhase) focusDurationSeconds else breakDurationSeconds
    val formattedTime = remember(remainingSeconds) {
        val minutes = remainingSeconds / 60
        val seconds = remainingSeconds % 60
        String.format("%02d:%02d", minutes, seconds)
    }
    val progress = 1f - (remainingSeconds.toFloat() / totalSeconds.toFloat())

    LaunchedEffect(isRunning, isFocusPhase, vibrationEnabled) {
        if (isRunning) {
            while (isRunning && remainingSeconds > 0) {
                delay(1000)
                if (!isRunning) break
                if (remainingSeconds > 0) remainingSeconds--
            }
            if (isRunning && remainingSeconds == 0) {
                if (vibrationEnabled) triggerVibration(context)
                if (isFocusPhase) {
                    isFocusPhase = false
                    remainingSeconds = breakDurationSeconds
                } else {
                    isFocusPhase = true
                    remainingSeconds = focusDurationSeconds
                }
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 24.dp, vertical = 24.dp),
        verticalArrangement = Arrangement.spacedBy(28.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = stringResource(id = R.string.home_timer_title),
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.SemiBold
        )
        Text(
            text = if (isFocusPhase) stringResource(id = R.string.home_timer_focus_label) else stringResource(id = R.string.home_timer_break_label),
            style = MaterialTheme.typography.bodyLarge,
            color = if (isFocusPhase) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.tertiary,
            fontWeight = FontWeight.Medium
        )

        Box(modifier = Modifier.size(250.dp), contentAlignment = Alignment.Center) {
            CircularTimer(progress = progress, isFocus = isFocusPhase)
            Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(text = formattedTime, style = MaterialTheme.typography.displaySmall, fontWeight = FontWeight.Bold)
                Text(
                    text = "${totalSeconds / 60} min cycle",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(text = stringResource(id = R.string.home_timer_vibration))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Switch(checked = vibrationEnabled, onCheckedChange = { vibrationEnabled = it })
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            FilledTonalButton(
                onClick = { isRunning = !isRunning },
                modifier = Modifier.weight(1f)
            ) {
                Text(text = if (isRunning) stringResource(id = R.string.home_timer_pause) else stringResource(id = R.string.home_timer_start))
            }
            OutlinedButton(
                onClick = {
                    isRunning = false
                    isFocusPhase = true
                    remainingSeconds = focusDurationSeconds
                },
                modifier = Modifier.weight(1f)
            ) {
                Text(text = stringResource(id = R.string.home_timer_reset))
            }
        }
    }
}

@Composable
internal fun CircularTimer(progress: Float, isFocus: Boolean) {
    val colors = if (isFocus) {
        listOf(Color(0xFF4A6CF7), Color(0xFF7F9BFF))
    } else {
        listOf(Color(0xFF2BB673), Color(0xFF72D7A7))
    }
    val backgroundColor = MaterialTheme.colorScheme.surfaceVariant

    Canvas(modifier = Modifier.fillMaxSize()) {
        val diameter = size.minDimension
        val arcSize = Size(diameter, diameter)
        val topLeft = Offset((size.width - diameter) / 2f, (size.height - diameter) / 2f)
        val strokeWidth = 24f

        drawArc(
            color = backgroundColor,
            startAngle = -90f,
            sweepAngle = 360f,
            useCenter = false,
            topLeft = topLeft,
            size = arcSize,
            style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
        )

        drawArc(
            brush = Brush.sweepGradient(colors, center = center),
            startAngle = -90f,
            sweepAngle = progress.coerceIn(0f, 1f) * 360f,
            useCenter = false,
            topLeft = topLeft,
            size = arcSize,
            style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
        )
    }
}

@Suppress("MissingPermission")
internal fun triggerVibration(context: android.content.Context) {
    val vibrator = context.getSystemService(Vibrator::class.java) ?: return
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        vibrator.vibrate(VibrationEffect.createOneShot(400, VibrationEffect.DEFAULT_AMPLITUDE))
    } else {
        @Suppress("DEPRECATION")
        vibrator.vibrate(400)
    }
}
