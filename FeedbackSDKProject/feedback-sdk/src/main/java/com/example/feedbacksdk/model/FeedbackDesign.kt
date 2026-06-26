package com.example.feedbacksdk.model

/**
 * A complete, named feedback design fetched from the backend: its own form
 * (title + questions) plus the colors to render it with.
 */
data class FeedbackDesign(
    val name: String = "default",
    val title: String = "Send Feedback",
    val description: String? = null,
    val fields: List<FeedbackField> = emptyList(),
    val backgroundColor: String = "#F4F5FB",
    val cardColor: String = "#FFFFFF",
    val titleColor: String = "#15172B",
    val buttonColor: String = "#4F46E5"
)
