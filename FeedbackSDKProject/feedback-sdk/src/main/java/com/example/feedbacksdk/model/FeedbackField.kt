package com.example.feedbacksdk.model

data class FeedbackField(
    val fieldId: String,
    val type: String,
    val label: String,
    val required: Boolean,
    val order: Int,
    val options: List<String>?,
    val maxLength: Int?
)
