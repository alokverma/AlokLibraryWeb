package com.aloklibrarystudent.ui.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.aloklibrarystudent.R
import com.aloklibrarystudent.data.model.AuthSession
import com.aloklibrarystudent.data.model.NoteDto
import com.aloklibrarystudent.data.model.SubscriptionStatus
import com.aloklibrarystudent.ui.notes.NotesViewModel
import com.aloklibrarystudent.ui.notifications.NotificationsViewModel
import com.aloklibrarystudent.ui.home.StudentProfileViewModel
import kotlinx.coroutines.launch

enum class HomeTab(
    val titleRes: Int,
    val icon: ImageVector
) {
    OVERVIEW(R.string.tab_overview, Icons.Default.Home),
    NOTES(R.string.tab_notes, Icons.Default.Edit),
    NOTIFICATIONS(R.string.tab_notifications, Icons.Default.Notifications),
    TIMER(R.string.home_timer_title, Icons.Default.Schedule)
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
                HomeTab.TIMER -> TimerTabContent()
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


