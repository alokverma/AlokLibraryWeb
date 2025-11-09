package com.aloklibrarystudent.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class UserRole {
    @SerialName("admin") ADMIN,
    @SerialName("teacher") TEACHER,
    @SerialName("student") STUDENT
}

@Serializable
data class UserDto(
    val id: String,
    val username: String,
    val role: UserRole,
    val name: String? = null
)

@Serializable
data class AuthResponseDto(
    val token: String,
    val user: UserDto
)

@Serializable
data class VerifyResponseDto(
    val user: UserDto
)

@Serializable
data class LoginRequest(
    val username: String,
    val password: String
)

data class AuthSession(
    val token: String,
    val user: UserDto
)

@Serializable
enum class SubscriptionStatus {
    @SerialName("active") ACTIVE,
    @SerialName("expired") EXPIRED
}

@Serializable
data class StudentDto(
    val id: String,
    val name: String,
    val phoneNumber: String,
    val address: String? = null,
    val aadharCard: String? = null,
    val startDate: String? = null,
    val expiryDate: String,
    val subscriptionMonths: Int? = null,
    val paymentAmount: Double? = null,
    val isPaymentDone: Boolean? = null,
    val profilePicture: String,
    val subscriptionStatus: SubscriptionStatus
)

@Serializable
enum class NotificationType {
    @SerialName("exam") EXAM,
    @SerialName("event") EVENT,
    @SerialName("library") LIBRARY,
    @SerialName("motivation") MOTIVATION,
    @SerialName("form") FORM,
    @SerialName("general") GENERAL
}

@Serializable
data class NotificationDto(
    val id: String,
    val title: String,
    val message: String,
    val type: NotificationType,
    val createdBy: String,
    val isActive: Boolean,
    val createdAt: String,
    val updatedAt: String
)

@Serializable
data class NoteDto(
    val id: String,
    val title: String,
    val content: String,
    val createdAt: String,
    val updatedAt: String
)

@Serializable
data class NoteMutationRequest(
    val title: String,
    val content: String
)

@Serializable
data class ApiMessageResponse(
    val message: String? = null
)

