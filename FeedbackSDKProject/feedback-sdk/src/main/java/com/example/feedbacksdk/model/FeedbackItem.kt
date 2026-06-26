package com.example.feedbacksdk.model

data class FeedbackItem(
    val feedbackId: String,
    val userId: String?,
    val userEmail: String?,
    val answers: Map<String, Any?>,
    val metadata: Map<String, String>,
    val status: String,
    val createdAt: Long,
    val updatedAt: Long,
    val screenshotBase64: String? = null,
    val deviceInfo: DeviceInfo? = null,
    val appInfo: AppInfo? = null
)
