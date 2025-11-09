package com.aloklibrarystudent.ui.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Article
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.aloklibrarystudent.R
import com.aloklibrarystudent.data.model.AuthSession
import com.aloklibrarystudent.data.model.NoteDto
import com.aloklibrarystudent.data.model.NotificationDto
import com.aloklibrarystudent.data.model.StudentDto
import com.aloklibrarystudent.data.model.SubscriptionStatus
import com.aloklibrarystudent.ui.notes.NotesUiState
import com.aloklibrarystudent.ui.notes.NotesViewModel
import com.aloklibrarystudent.ui.notifications.NotificationsUiState
import com.aloklibrarystudent.ui.notifications.NotificationsViewModel
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter

enum class HomeTab(
    val titleRes: Int,
    val icon: androidx.compose.ui.graphics.vector.ImageVector
) {
    OVERVIEW(R.string.tab_overview, Icons.Default.Home),
    NOTES(R.string.tab_notes, Icons.Default.Article),
    NOTIFICATIONS(R.string.tab_notifications, Icons.Default.Notifications)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentHomeScreen(
    session: AuthSession,
    profileViewModel: StudentProfileViewModel,
    notesViewModel: NotesViewModel,
    notificationsViewModel: NotificationsViewModel,
    onLogout: () -> Unit,
    modifier: Modifier = Modifier
) {
    val profileState by profileViewModel.uiState.collectAsStateWithLifecycle()
    val notesState by notesViewModel.uiState.collectAsStateWithLifecycle()
    val notificationsState by notificationsViewModel.uiState.collectAsStateWithLifecycle()

    var selectedTab by rememberSaveable { mutableStateOf(HomeTab.OVERVIEW) }
    val coroutineScope = rememberCoroutineScope()
    var isEditorVisible by remember { mutableStateOf(false) }
    var editingNote by remember { mutableStateOf<NoteDto?>(null) }
    var notePendingDeletion by remember { mutableStateOf<NoteDto?>(null) }

    LaunchedEffect(session.user.id) {
        profileViewModel.load(session.user.id, force = true)
        notesViewModel.loadNotes(force = true)
        notificationsViewModel.loadNotifications(force = true)
    }

    val isSubscriptionExpired = profileState.student?.subscriptionStatus == SubscriptionStatus.EXPIRED

    Scaffold(
        modifier = modifier.fillMaxSize(),
        topBar = {
            CenterAlignedTopAppBar(
                title = {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(text = "Hi, ${session.user.name ?: session.user.username}")
                        Text(
                            text = stringResource(id = R.string.tab_overview),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                actions = {
                    IconButton(onClick = {
                        profileViewModel.load(session.user.id, force = true)
                        notesViewModel.refresh()
                        notificationsViewModel.refresh()
                    }) {
                        Icon(imageVector = Icons.Default.Refresh, contentDescription = null)
                    }
                    IconButton(onClick = onLogout) {
                        Icon(imageVector = Icons.Default.Logout, contentDescription = null)
                    }
                }
            )
        },
        bottomBar = {
            NavigationBar {
                HomeTab.values().forEach { tab ->
                    NavigationBarItem(
                        selected = tab == selectedTab,
                        onClick = { selectedTab = tab },
                        icon = { Icon(imageVector = tab.icon, contentDescription = null) },
                        label = { Text(text = stringResource(id = tab.titleRes)) }
                    )
                }
            }
        }
    ) { innerPadding ->
        Surface(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when (selectedTab) {
                HomeTab.OVERVIEW -> OverviewTabContent(state = profileState, session = session)
                HomeTab.NOTES -> NotesTabContent(
                    uiState = notesState,
                    isSubscriptionExpired = isSubscriptionExpired,
                    onAddNote = {
                        editingNote = null
                        isEditorVisible = true
                    },
                    onEditNote = { note ->
                        editingNote = note
                        isEditorVisible = true
                    },
                    onDeleteNote = { note -> notePendingDeletion = note }
                )
                HomeTab.NOTIFICATIONS -> NotificationsTabContent(uiState = notificationsState)
            }
        }
    }

    if (isEditorVisible) {
        NoteEditorDialog(
            existingNote = editingNote,
            isSubmitting = notesState.isSubmitting,
            submitError = notesState.errorMessage,
            onDismiss = {
                editingNote = null
                isEditorVisible = false
            },
            onSubmit = { title, content ->
                coroutineScope.launch {
                    val result = if (editingNote == null) {
                        notesViewModel.createNote(title, content)
                    } else {
                        notesViewModel.updateNote(editingNote!!.id, title, content)
                    }
                    if (result.isSuccess) {
                        editingNote = null
                        isEditorVisible = false
                    }
                }
            }
        )
    }

    notePendingDeletion?.let { note ->
        ConfirmDeleteDialog(
            note = note,
            isDeleting = notesState.isSubmitting,
            onDismiss = { notePendingDeletion = null },
            onConfirm = {
                coroutineScope.launch {
                    if (notesViewModel.deleteNote(note.id).isSuccess) {
                        notePendingDeletion = null
                    }
                }
            }
        )
    }
}

@Composable
private fun OverviewTabContent(
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
                Text(text = state.errorMessage ?: stringResource(id = R.string.error_generic))
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
        Text(text = value, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f), textAlign = TextAlign.End)
    }
}

@Composable
private fun NotesTabContent(
    uiState: NotesUiState,
    isSubscriptionExpired: Boolean,
    onAddNote: () -> Unit,
    onEditNote: (NoteDto) -> Unit,
    onDeleteNote: (NoteDto) -> Unit
) {
    Column(modifier = Modifier.fillMaxSize()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                Text(text = stringResource(id = R.string.home_notes_title), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.SemiBold)
                Text(
                    text = stringResource(id = R.string.notes_section_description),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            FilledTonalButton(onClick = onAddNote) {
                Icon(imageVector = Icons.Default.Add, contentDescription = null)
                Text(text = stringResource(id = R.string.notes_add), modifier = Modifier.padding(start = 6.dp))
            }
        }

        when {
            uiState.isLoading && uiState.notes.isEmpty() -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }
            isSubscriptionExpired -> {
                SubscriptionExpiredMessage(modifier = Modifier.padding(16.dp))
            }
            uiState.notes.isEmpty() -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(text = stringResource(id = R.string.notes_empty_description), textAlign = TextAlign.Center)
                }
            }
            else -> {
                NotesList(
                    notes = uiState.notes,
                    isLoading = uiState.isLoading,
                    onEditNote = onEditNote,
                    onDeleteNote = onDeleteNote
                )
            }
        }
    }
}

@Composable
private fun NotesList(
    notes: List<NoteDto>,
    isLoading: Boolean,
    onEditNote: (NoteDto) -> Unit,
    onDeleteNote: (NoteDto) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        if (isLoading) {
            item { LinearProgressIndicator(modifier = Modifier.fillMaxWidth()) }
        }
        items(notes, key = { it.id }) { note ->
            NoteCard(note = note, onEdit = { onEditNote(note) }, onDelete = { onDeleteNote(note) })
        }
    }
}

@Composable
private fun NoteCard(
    note: NoteDto,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    Card {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(text = note.title, style = MaterialTheme.typography.titleMedium, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text(text = formatDateTime(note.updatedAt), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    IconButton(onClick = onEdit) {
                        Icon(imageVector = Icons.Default.Edit, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                    }
                    IconButton(onClick = onDelete) {
                        Icon(imageVector = Icons.Default.Delete, contentDescription = null, tint = MaterialTheme.colorScheme.error)
                    }
                }
            }
            Text(text = note.content, style = MaterialTheme.typography.bodyMedium)
            Text(
                text = "${note.content.length} / 1000",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.End,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

@Composable
private fun SubscriptionExpiredMessage(modifier: Modifier = Modifier) {
    Surface(
        color = MaterialTheme.colorScheme.errorContainer,
        tonalElevation = 2.dp,
        modifier = modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(text = stringResource(id = R.string.notes_subscription_expired_title), color = MaterialTheme.colorScheme.onErrorContainer)
            Text(text = stringResource(id = R.string.notes_subscription_expired_body), color = MaterialTheme.colorScheme.onErrorContainer)
        }
    }
}

@Composable
private fun NoteEditorDialog(
    existingNote: NoteDto?,
    isSubmitting: Boolean,
    submitError: String?,
    onDismiss: () -> Unit,
    onSubmit: (String, String) -> Unit
) {
    var title by rememberSaveable(existingNote?.id) { mutableStateOf(existingNote?.title ?: "") }
    var content by rememberSaveable(existingNote?.id) { mutableStateOf(existingNote?.content ?: "") }
    var titleError by remember { mutableStateOf<String?>(null) }
    var contentError by remember { mutableStateOf<String?>(null) }

    val titleRequired = stringResource(id = R.string.notes_validation_title)
    val contentRequired = stringResource(id = R.string.notes_validation_content)
    val contentLimit = stringResource(id = R.string.notes_limit_message)

    fun validate(): Boolean {
        titleError = null
        contentError = null
        if (title.isBlank()) {
            titleError = titleRequired
        }
        when {
            content.isBlank() -> contentError = contentRequired
            content.length > 1000 -> contentError = contentLimit
        }
        return titleError == null && contentError == null
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            Button(onClick = {
                if (validate()) {
                    onSubmit(title, content)
                }
            }, enabled = !isSubmitting) {
                Text(text = stringResource(id = R.string.notes_save))
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, enabled = !isSubmitting) {
                Text(text = stringResource(id = R.string.notes_cancel))
            }
        },
        title = {
            Text(
                text = if (existingNote == null) stringResource(id = R.string.notes_add) else stringResource(id = R.string.notes_edit)
            )
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text(text = stringResource(id = R.string.notes_field_title)) },
                    isError = titleError != null,
                    singleLine = true,
                    enabled = !isSubmitting,
                    modifier = Modifier.fillMaxWidth()
                )
                if (titleError != null) {
                    Text(text = titleError!!, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.error)
                }
                OutlinedTextField(
                    value = content,
                    onValueChange = { content = it },
                    label = { Text(text = stringResource(id = R.string.notes_field_content)) },
                    isError = contentError != null,
                    enabled = !isSubmitting,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(160.dp)
                )
                if (contentError != null) {
                    Text(text = contentError!!, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.error)
                }
                if (!submitError.isNullOrBlank()) {
                    Text(text = submitError, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.error)
                }
            }
        }
    )
}

@Composable
private fun ConfirmDeleteDialog(
    note: NoteDto,
    isDeleting: Boolean,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            Button(onClick = onConfirm, enabled = !isDeleting) {
                Text(text = stringResource(id = R.string.notes_delete))
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, enabled = !isDeleting) {
                Text(text = stringResource(id = R.string.notes_cancel))
            }
        },
        title = { Text(text = stringResource(id = R.string.notes_delete)) },
        text = {
            Column {
                Text(text = stringResource(id = R.string.notes_delete_confirm))
                if (isDeleting) {
                    Spacer(modifier = Modifier.height(12.dp))
                    LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
                }
            }
        }
    )
}

private fun formatDate(isoString: String): String {
    return runCatching {
        LocalDate.parse(isoString)
            .format(DateTimeFormatter.ofPattern("dd MMM yyyy"))
    }.getOrElse { isoString }
}

private fun formatDateTime(isoString: String): String {
    return runCatching {
        Instant.parse(isoString)
            .atZone(ZoneId.systemDefault())
            .format(DateTimeFormatter.ofPattern("MMMM d, yyyy 'at' hh:mm a"))
    }.getOrElse { isoString }
}

@Composable
private fun NotificationsTabContent(uiState: NotificationsUiState) {
    when {
        uiState.isLoading && uiState.notifications.isEmpty() -> {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        }
        uiState.notifications.isEmpty() -> {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text(
                    text = stringResource(id = R.string.notifications_empty_description),
                    textAlign = TextAlign.Center,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(horizontal = 32.dp)
                )
            }
        }
        else -> {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                if (uiState.isLoading) {
                    item { LinearProgressIndicator(modifier = Modifier.fillMaxWidth()) }
                }
                items(uiState.notifications, key = { it.id }) { notification ->
                    NotificationCard(notification)
                }
            }
        }
    }
}

@Composable
private fun NotificationCard(notification: NotificationDto) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(text = notification.title, style = MaterialTheme.typography.titleMedium)
            Text(text = notification.message, style = MaterialTheme.typography.bodyMedium)
            Text(
                text = formatDateTime(notification.createdAt),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}


