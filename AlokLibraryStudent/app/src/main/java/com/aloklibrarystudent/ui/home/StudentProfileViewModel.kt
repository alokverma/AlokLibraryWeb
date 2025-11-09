package com.aloklibrarystudent.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.aloklibrarystudent.data.model.StudentDto
import com.aloklibrarystudent.data.repository.StudentRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class StudentProfileUiState(
    val isLoading: Boolean = true,
    val student: StudentDto? = null,
    val errorMessage: String? = null
)

class StudentProfileViewModel(
    private val studentRepository: StudentRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(StudentProfileUiState())
    val uiState: StateFlow<StudentProfileUiState> = _uiState.asStateFlow()

    private var currentStudentId: String? = null

    fun load(studentId: String, force: Boolean = false) {
        if (!force && studentId == currentStudentId && _uiState.value.student != null) {
            return
        }
        currentStudentId = studentId
        viewModelScope.launch {
            _uiState.value = StudentProfileUiState(isLoading = true)
            runCatching {
                studentRepository.fetchSelf(studentId)
            }.onSuccess { student ->
                _uiState.value = StudentProfileUiState(
                    isLoading = false,
                    student = student,
                    errorMessage = null
                )
            }.onFailure { throwable ->
                _uiState.value = StudentProfileUiState(
                    isLoading = false,
                    student = null,
                    errorMessage = throwable.message ?: "Failed to load profile"
                )
            }
        }
    }

    class Factory(
        private val studentRepository: StudentRepository
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            if (modelClass.isAssignableFrom(StudentProfileViewModel::class.java)) {
                return StudentProfileViewModel(studentRepository) as T
            }
            throw IllegalArgumentException("Unknown ViewModel class: ${modelClass.name}")
        }
    }
}

