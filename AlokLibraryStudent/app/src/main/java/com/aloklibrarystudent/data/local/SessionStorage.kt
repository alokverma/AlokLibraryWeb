package com.aloklibrarystudent.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.map

private val Context.sessionDataStore: DataStore<Preferences> by preferencesDataStore(
    name = "student_app_session"
)

class SessionStorage(context: Context) {

    private val dataStore = context.sessionDataStore

    private val tokenKey = stringPreferencesKey("token")
    private val userJsonKey = stringPreferencesKey("user_json")

    val tokenFlow: Flow<String?> = dataStore.data.map { it[tokenKey] }
    val userJsonFlow: Flow<String?> = dataStore.data.map { it[userJsonKey] }

    suspend fun getToken(): String? = tokenFlow.firstOrNull()
    suspend fun getUserJson(): String? = userJsonFlow.firstOrNull()

    suspend fun persistSession(token: String, userJson: String) {
        dataStore.edit { prefs ->
            prefs[tokenKey] = token
            prefs[userJsonKey] = userJson
        }
    }

    suspend fun clear() {
        dataStore.edit { prefs ->
            prefs.clear()
        }
    }
}

