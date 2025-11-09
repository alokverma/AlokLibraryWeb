package com.aloklibrarystudent.data.remote

import com.aloklibrarystudent.data.local.SessionStorage
import kotlinx.coroutines.runBlocking

class TokenProvider(private val sessionStorage: SessionStorage) {
    fun currentToken(): String? = runBlocking {
        sessionStorage.getToken()
    }
}

