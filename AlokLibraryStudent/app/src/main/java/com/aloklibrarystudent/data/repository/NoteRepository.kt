package com.aloklibrarystudent.data.repository

import com.aloklibrarystudent.data.model.NoteDto
import com.aloklibrarystudent.data.model.NoteMutationRequest
import com.aloklibrarystudent.data.remote.ApiService

class NoteRepository(
    private val apiService: ApiService
) {

    suspend fun fetchNotes(): List<NoteDto> = apiService.getNotes()

    suspend fun createNote(title: String, content: String): NoteDto =
        apiService.createNote(NoteMutationRequest(title = title, content = content))

    suspend fun updateNote(id: String, title: String, content: String): NoteDto =
        apiService.updateNote(id, NoteMutationRequest(title = title, content = content))

    suspend fun deleteNote(id: String) {
        apiService.deleteNote(id)
    }
}

