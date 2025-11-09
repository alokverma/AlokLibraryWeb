package com.aloklibrarystudent.data

import android.content.Context
import com.aloklibrarystudent.BuildConfig
import com.aloklibrarystudent.data.local.SessionStorage
import com.aloklibrarystudent.data.remote.ApiService
import com.aloklibrarystudent.data.remote.AuthInterceptor
import com.aloklibrarystudent.data.remote.TokenProvider
import com.aloklibrarystudent.data.repository.AuthRepository
import com.aloklibrarystudent.data.repository.NoteRepository
import com.aloklibrarystudent.data.repository.NotificationRepository
import com.aloklibrarystudent.data.repository.StudentRepository
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import retrofit2.create
import java.util.concurrent.TimeUnit

class AppContainer(context: Context) {

    private val appContext = context.applicationContext

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        coerceInputValues = true
    }

    private val sessionStorage = SessionStorage(appContext)
    private val tokenProvider = TokenProvider(sessionStorage)

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = if (BuildConfig.DEBUG) {
            HttpLoggingInterceptor.Level.BODY
        } else {
            HttpLoggingInterceptor.Level.NONE
        }
    }

    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .addInterceptor(AuthInterceptor(tokenProvider))
        .addInterceptor(loggingInterceptor)
        .build()

    private val retrofit = Retrofit.Builder()
        .baseUrl(BuildConfig.API_BASE_URL.ensureTrailingSlash())
        .client(okHttpClient)
        .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
        .build()

    val apiService: ApiService = retrofit.create()

    val authRepository = AuthRepository(apiService, sessionStorage, json)
    val studentRepository = StudentRepository(apiService)
    val noteRepository = NoteRepository(apiService)
    val notificationRepository = NotificationRepository(apiService)
}

private fun String.ensureTrailingSlash(): String =
    if (endsWith("/")) this else "$this/"

