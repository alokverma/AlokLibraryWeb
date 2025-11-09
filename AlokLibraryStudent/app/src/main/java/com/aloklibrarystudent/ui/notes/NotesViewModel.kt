package com.aloklibrarystudent.ui.notes

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.aloklibrarystudent.data.model.NoteDto
import com.aloklibrarystudent.data.repository.NoteRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class NotesUiState(
    val isLoading: Boolean = false,
    val notes: List<NoteDto> = emptyList(),
    val errorMessage: String? = null,
    val isSubmitting: Boolean = false
)

class NotesViewModel(
    private val noteRepository: NoteRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(NotesUiState(isLoading = true))
    val uiState: StateFlow<NotesUiState> = _uiState.asStateFlow()

    init {
        loadNotes(force = true)
    }

    fun loadNotes(force: Boolean = false) {
        if (!force && _uiState.value.notes.isNotEmpty()) {
            return
        }
        viewModelScope.launch {
            fetchNotes(showLoading = true)
        }
    }

    fun refresh() {
        viewModelScope.launch {
            fetchNotes(showLoading = true)
        }
    }

    suspend fun createNote(title: String, content: String): Result<Unit> {
        _uiState.update { it.copy(isSubmitting = true, errorMessage = null) }
        return runCatching {
            noteRepository.createNote(title.trim(), content.trim())
            fetchNotes(showLoading = false)
        }.map { Unit }
            .onSuccess {
                _uiState.update { it.copy(isSubmitting = false) }
            }.onFailure { throwable ->
                _uiState.update {
                    it.copy(
                        isSubmitting = false,
                        errorMessage = throwable.message ?: "Failed to create note"
                    )
                }
            }
    }

    suspend fun updateNote(id: String, title: String, content: String): Result<Unit> {
        _uiState.update { it.copy(isSubmitting = true, errorMessage = null) }
        return runCatching {
            noteRepository.updateNote(id, title.trim(), content.trim())
            fetchNotes(showLoading = false)
        }.map { Unit }
            .onSuccess {
                _uiState.update { it.copy(isSubmitting = false) }
            }.onFailure { throwable ->
                _uiState.update {
                    it.copy(
                        isSubmitting = false,
                        errorMessage = throwable.message ?: "Failed to update note"
                    )
                }
            }
    }

    suspend fun deleteNote(id: String): Result<Unit> {
        _uiState.update { it.copy(isSubmitting = true, errorMessage = null) }
        return runCatching {
            noteRepository.deleteNote(id)
            fetchNotes(showLoading = false)
        }.map { Unit }
            .onSuccess {
                _uiState.update { it.copy(isSubmitting = false) }
            }.onFailure { throwable ->
                _uiState.update {
                    it.copy(
                        isSubmitting = false,
                        errorMessage = throwable.message ?: "Failed to delete note"
                    )
                }
            }
    }

    private suspend fun fetchNotes(showLoading: Boolean) {
        if (showLoading) {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
        }
        runCatching {
            noteRepository.fetchNotes()
        }.onSuccess { notes ->
            _uiState.update {
                it.copy(
                    isLoading = false,
                    notes = notes,
                    errorMessage = null,
                    isSubmitting = false
                )
            }
        }.onFailure { throwable ->
            _uiState.update {
                it.copy(
                    isLoading = false,
                    errorMessage = throwable.message ?: "Failed to load notes",
                    isSubmitting = false
                )
            }
        }
    }

    class Factory(
        private val noteRepository: NoteRepository
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            if (modelClass.isAssignableFrom(NotesViewModel::class.java)) {
                return NotesViewModel(noteRepository) as T
            }
            throw IllegalArgumentException("Unknown ViewModel class: ${modelClass.name}")
        }
    }
}

