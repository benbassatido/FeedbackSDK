package com.example.feedbacksdk.model

data class FeedbackFormConfig(
    val title: String,
    val description: String?,
    val fields: List<FeedbackField>
)

data class FeedbackField(
    val fieldId: String,
    val type: String,
    val label: String,
    val required: Boolean,
    val order: Int,
    val options: List<String>?,
    val maxLength: Int?
)
