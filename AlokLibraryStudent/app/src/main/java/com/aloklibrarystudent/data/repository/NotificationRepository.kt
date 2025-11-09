package com.aloklibrarystudent.data.repository

import com.aloklibrarystudent.data.model.NotificationDto
import com.aloklibrarystudent.data.remote.ApiService

class NotificationRepository(
    private val apiService: ApiService
) {

    suspend fun fetchNotifications(activeOnly: Boolean = true): List<NotificationDto> =
        apiService.getNotifications(activeOnly)
}

