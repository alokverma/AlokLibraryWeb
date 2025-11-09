package com.aloklibrarystudent.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.aloklibrarystudent.data.model.AuthSession
import com.aloklibrarystudent.data.repository.AuthRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class AuthUiState {
    data object Loading : AuthUiState()
    data class Authenticated(val session: AuthSession) : AuthUiState()
    data class Unauthenticated(
        val errorMessage: String? = null,
        val isProcessing: Boolean = false
    ) : AuthUiState()
}

class AuthViewModel(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState: MutableStateFlow<AuthUiState> =
        MutableStateFlow<AuthUiState>(AuthUiState.Loading)
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    private var observeSessionJob: Job? = null

    init {
        observeSession()
        viewModelScope.launch {
            val refreshed = authRepository.refreshSession()
            if (refreshed != null) {
                _uiState.value = AuthUiState.Authenticated(refreshed)
            } else {
                val current = _uiState.value
                if (current !is AuthUiState.Unauthenticated) {
                    _uiState.value = AuthUiState.Unauthenticated()
                }
            }
        }
    }

    private fun observeSession() {
        observeSessionJob?.cancel()
        observeSessionJob = viewModelScope.launch {
            authRepository.sessionFlow.collect { session ->
                val currentState = _uiState.value
                if (session != null) {
                    _uiState.value = AuthUiState.Authenticated(session)
                } else if (currentState !is AuthUiState.Unauthenticated || !currentState.isProcessing) {
                    _uiState.value = AuthUiState.Unauthenticated()
                }
            }
        }
    }

    fun login(username: String, password: String) {
        viewModelScope.launch {
            _uiState.value = AuthUiState.Unauthenticated(isProcessing = true)
            runCatching {
                authRepository.login(username.trim(), password)
            }.onSuccess { session ->
                _uiState.value = AuthUiState.Authenticated(session)
            }.onFailure { throwable ->
                _uiState.value = AuthUiState.Unauthenticated(
                    errorMessage = throwable.message ?: "Login failed",
                    isProcessing = false
                )
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
            _uiState.value = AuthUiState.Unauthenticated()
        }
    }

    class Factory(
        private val authRepository: AuthRepository
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            if (modelClass.isAssignableFrom(AuthViewModel::class.java)) {
                return AuthViewModel(authRepository) as T
            }
            throw IllegalArgumentException("Unknown ViewModel class: ${modelClass.name}")
        }
    }
}

