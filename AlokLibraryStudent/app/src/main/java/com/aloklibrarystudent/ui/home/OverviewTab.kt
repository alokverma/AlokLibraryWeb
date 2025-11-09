package com.aloklibrarystudent.ui.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.aloklibrarystudent.R
import com.aloklibrarystudent.data.model.AuthSession
import com.aloklibrarystudent.data.model.StudentDto
import com.aloklibrarystudent.data.model.SubscriptionStatus
import androidx.compose.ui.res.stringResource

@Composable
internal fun OverviewTabContent(
    state: StudentProfileUiState,
    session: AuthSession
) {
    when {
        state.isLoading -> {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        }
        state.errorMessage != null -> {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text(text = state.errorMessage ?: stringResource(id = R.string.error_generic), textAlign = TextAlign.Center)
            }
        }
        state.student != null -> {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                item {
                    SubscriptionStatusCard(state.student.subscriptionStatus, state.student.expiryDate)
                }
                item {
                    StudentInfoCard(student = state.student, session = session)
                }
            }
        }
    }
}

@Composable
private fun SubscriptionStatusCard(
    status: SubscriptionStatus,
    expiryDate: String
) {
    val (title, containerColor, contentColor) = when (status) {
        SubscriptionStatus.ACTIVE -> Triple(
            stringResource(id = R.string.label_subscription_active),
            MaterialTheme.colorScheme.primaryContainer,
            MaterialTheme.colorScheme.onPrimaryContainer
        )
        SubscriptionStatus.EXPIRED -> Triple(
            stringResource(id = R.string.label_subscription_expired),
            MaterialTheme.colorScheme.errorContainer,
            MaterialTheme.colorScheme.onErrorContainer
        )
    }

    Card(colors = CardDefaults.cardColors(containerColor = containerColor)) {
        Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(text = stringResource(id = R.string.label_subscription_status), color = contentColor, fontWeight = FontWeight.SemiBold)
            Text(text = title, style = MaterialTheme.typography.headlineSmall, color = contentColor)
            Text(
                text = stringResource(id = R.string.label_expiry_date, formatDate(expiryDate)),
                style = MaterialTheme.typography.bodyMedium,
                color = contentColor.copy(alpha = 0.8f)
            )
        }
    }
}

@Composable
private fun StudentInfoCard(
    student: StudentDto,
    session: AuthSession
) {
    Card {
        Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(text = student.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            InfoRow(label = stringResource(id = R.string.label_username), value = session.user.username)
            InfoRow(label = stringResource(id = R.string.label_contact_number), value = student.phoneNumber)
            student.address?.takeIf { it.isNotBlank() }?.let {
                InfoRow(label = stringResource(id = R.string.label_address), value = it)
            }
        }
    }
}

@Composable
private fun InfoRow(label: String, value: String) {
    Row(modifier = Modifier.fillMaxWidth()) {
        Text(text = label, style = MaterialTheme.typography.bodySmall, modifier = Modifier.weight(1f))
        Text(text = value, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f), textAlign = TextAlign.End, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}
