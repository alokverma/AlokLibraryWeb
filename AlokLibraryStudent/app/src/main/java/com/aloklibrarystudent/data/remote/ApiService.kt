package com.aloklibrarystudent.data.remote

import com.aloklibrarystudent.data.model.ApiMessageResponse
import com.aloklibrarystudent.data.model.AuthResponseDto
import com.aloklibrarystudent.data.model.LoginRequest
import com.aloklibrarystudent.data.model.NoteDto
import com.aloklibrarystudent.data.model.NoteMutationRequest
import com.aloklibrarystudent.data.model.NotificationDto
import com.aloklibrarystudent.data.model.StudentDto
import com.aloklibrarystudent.data.model.VerifyResponseDto
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

interface ApiService {

    @POST("auth/login")
    suspend fun login(
        @Body request: LoginRequest
    ): AuthResponseDto

    @GET("auth/verify")
    suspend fun verify(): VerifyResponseDto

    @GET("students")
    suspend fun getStudents(): List<StudentDto>

    @GET("students/{id}")
    suspend fun getStudentById(
        @Path("id") id: String
    ): StudentDto

    @GET("notes")
    suspend fun getNotes(): List<NoteDto>

    @POST("notes")
    suspend fun createNote(
        @Body request: NoteMutationRequest
    ): NoteDto

    @PUT("notes/{id}")
    suspend fun updateNote(
        @Path("id") id: String,
        @Body request: NoteMutationRequest
    ): NoteDto

    @DELETE("notes/{id}")
    suspend fun deleteNote(
        @Path("id") id: String
    ): ApiMessageResponse?

    @GET("notifications")
    suspend fun getNotifications(
        @Query("activeOnly") activeOnly: Boolean = false
    ): List<NotificationDto>
}

