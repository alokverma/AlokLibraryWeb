package com.aloklibrarystudent.data.repository

import com.aloklibrarystudent.data.model.StudentDto
import com.aloklibrarystudent.data.remote.ApiService

class StudentRepository(
    private val apiService: ApiService
) {

    suspend fun fetchSelf(studentId: String): StudentDto {
        return apiService.getStudentById(studentId)
    }
}

