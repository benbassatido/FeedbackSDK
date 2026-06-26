package com.example.feedbacksdk.core

import com.example.feedbacksdk.model.FeedbackField
import com.example.feedbacksdk.model.FeedbackFormConfig

internal object DefaultFormConfig {

    fun get(): FeedbackFormConfig = FeedbackFormConfig(
        title = "Send Feedback",
        description = "We'd love to hear from you. Please fill out the form below.",
        fields = listOf(
            FeedbackField(
                fieldId = "feedback_type",
                type = "dropdown",
                label = "Feedback Type",
                required = true,
                order = 1,
                options = listOf("Bug", "Feature Request", "General", "Other"),
                maxLength = null
            ),
            FeedbackField(
                fieldId = "rating",
                type = "rating",
                label = "Rating",
                required = true,
                order = 2,
                options = null,
                maxLength = null
            ),
            FeedbackField(
                fieldId = "message",
                type = "text",
                label = "Message",
                required = true,
                order = 3,
                options = null,
                maxLength = 500
            )
        )
    )
}
