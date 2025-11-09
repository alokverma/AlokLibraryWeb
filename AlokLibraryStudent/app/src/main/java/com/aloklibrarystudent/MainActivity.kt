package com.aloklibrarystudent

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.aloklibrarystudent.data.model.UserRole
import com.aloklibrarystudent.ui.auth.AuthUiState
import com.aloklibrarystudent.ui.auth.AuthViewModel
import com.aloklibrarystudent.ui.auth.LoginScreen
import com.aloklibrarystudent.ui.home.StudentHomeScreen
import com.aloklibrarystudent.ui.home.StudentProfileViewModel
import com.aloklibrarystudent.ui.notes.NotesViewModel
import com.aloklibrarystudent.ui.notifications.NotificationsViewModel
import com.aloklibrarystudent.ui.portal.WebPortalScreen
import com.aloklibrarystudent.ui.theme.AlokLibraryStudentTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val appContainer = (application as StudentApp).container

        setContent {
            AlokLibraryStudentTheme {
                val authViewModel: AuthViewModel = viewModel(
                    factory = AuthViewModel.Factory(appContainer.authRepository)
                )
                val profileViewModel: StudentProfileViewModel = viewModel(
                    factory = StudentProfileViewModel.Factory(appContainer.studentRepository)
                )
                val notesViewModel: NotesViewModel = viewModel(
                    factory = NotesViewModel.Factory(appContainer.noteRepository)
                )
                val notificationsViewModel: NotificationsViewModel = viewModel(
                    factory = NotificationsViewModel.Factory(appContainer.notificationRepository)
                )

                val authState by authViewModel.uiState.collectAsStateWithLifecycle()

                StudentAppRoot(
                    authState = authState,
                    authViewModel = authViewModel,
                    profileViewModel = profileViewModel,
                    notesViewModel = notesViewModel,
                    notificationsViewModel = notificationsViewModel
                )
            }
        }
    }
}

@Composable
private fun StudentAppRoot(
    authState: AuthUiState,
    authViewModel: AuthViewModel,
    profileViewModel: StudentProfileViewModel,
    notesViewModel: NotesViewModel,
    notificationsViewModel: NotificationsViewModel
) {
    Surface(modifier = Modifier.fillMaxSize()) {
        when (authState) {
            is AuthUiState.Loading -> LoadingScreen()
            is AuthUiState.Unauthenticated -> LoginScreen(
                state = authState,
                onLogin = authViewModel::login
            )

            is AuthUiState.Authenticated -> {
                when (authState.session.user.role) {
                    UserRole.STUDENT -> StudentHomeScreen(
                        session = authState.session,
                        profileViewModel = profileViewModel,
                        notesViewModel = notesViewModel,
                        notificationsViewModel = notificationsViewModel,
                        onLogout = authViewModel::logout
                    )

                    UserRole.ADMIN, UserRole.TEACHER -> WebPortalScreen(
                        onLogout = authViewModel::logout
                    )
                }
            }
        }
    }
}

@Composable
private fun LoadingScreen() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
    }
}