package com.aloklibrarystudent.data.repository

import com.aloklibrarystudent.data.local.SessionStorage
import com.aloklibrarystudent.data.model.AuthResponseDto
import com.aloklibrarystudent.data.model.AuthSession
import com.aloklibrarystudent.data.model.LoginRequest
import com.aloklibrarystudent.data.model.UserDto
import com.aloklibrarystudent.data.remote.ApiService
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

class AuthRepository(
    private val apiService: ApiService,
    private val sessionStorage: SessionStorage,
    private val json: Json
) {

    val sessionFlow: Flow<AuthSession?> = sessionStorage.tokenFlow
        .combine(sessionStorage.userJsonFlow) { token, userJson ->
            if (!token.isNullOrBlank() && !userJson.isNullOrBlank()) {
                runCatching {
                    val user = json.decodeFromString<UserDto>(userJson)
                    AuthSession(token = token, user = user)
                }.getOrNull()
            } else {
                null
            }
        }

    suspend fun currentSession(): AuthSession? = sessionFlow.firstOrNull()

    suspend fun login(username: String, password: String): AuthSession {
        val response = apiService.login(LoginRequest(username = username, password = password))
        persistSession(response)
        return AuthSession(token = response.token, user = response.user)
    }

    suspend fun refreshSession(): AuthSession? {
        val token = sessionStorage.getToken() ?: return null
        return runCatching {
            val verifyResponse = apiService.verify()
            val userJson = json.encodeToString(verifyResponse.user)
            sessionStorage.persistSession(token, userJson)
            AuthSession(token = token, user = verifyResponse.user)
        }.getOrElse {
            sessionStorage.clear()
            null
        }
    }

    suspend fun logout() {
        sessionStorage.clear()
    }

    private suspend fun persistSession(response: AuthResponseDto) {
        val userJson = json.encodeToString(response.user)
        sessionStorage.persistSession(response.token, userJson)
    }
}

