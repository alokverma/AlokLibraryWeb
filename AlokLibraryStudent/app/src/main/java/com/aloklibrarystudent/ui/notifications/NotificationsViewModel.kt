package com.aloklibrarystudent.ui.notifications

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.aloklibrarystudent.data.model.NotificationDto
import com.aloklibrarystudent.data.repository.NotificationRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class NotificationsUiState(
    val isLoading: Boolean = true,
    val notifications: List<NotificationDto> = emptyList(),
    val errorMessage: String? = null
)

class NotificationsViewModel(
    private val notificationRepository: NotificationRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(NotificationsUiState())
    val uiState: StateFlow<NotificationsUiState> = _uiState.asStateFlow()

    init {
        loadNotifications(force = true)
    }

    fun loadNotifications(force: Boolean = false) {
        if (!force && _uiState.value.notifications.isNotEmpty()) {
            return
        }
        viewModelScope.launch {
            fetchNotifications()
        }
    }

    fun refresh() {
        viewModelScope.launch {
            fetchNotifications()
        }
    }

    private suspend fun fetchNotifications() {
        _uiState.update { it.copy(isLoading = true, errorMessage = null) }
        runCatching {
            notificationRepository.fetchNotifications(activeOnly = true)
        }.onSuccess { notifications ->
            _uiState.update {
                it.copy(
                    isLoading = false,
                    notifications = notifications,
                    errorMessage = null
                )
            }
        }.onFailure { throwable ->
            _uiState.update {
                it.copy(
                    isLoading = false,
                    errorMessage = throwable.message ?: "Failed to load notifications"
                )
            }
        }
    }

    class Factory(
        private val notificationRepository: NotificationRepository
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            if (modelClass.isAssignableFrom(NotificationsViewModel::class.java)) {
                return NotificationsViewModel(notificationRepository) as T
            }
            throw IllegalArgumentException("Unknown ViewModel class: ${modelClass.name}")
        }
    }
}

