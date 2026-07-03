package com.example.feedbacksdk.core

import com.example.feedbacksdk.model.FeedbackDesign
import com.example.feedbacksdk.model.FeedbackField

internal object DefaultDesign {

    fun get(): FeedbackDesign = FeedbackDesign(
        name = "default",
        title = "Send Feedback",
        description = "We'd love to hear from you. Please fill out the form below.",
        fields = listOf(
            FeedbackField(
                fieldId = "feedback_type",
                type = FieldTypes.DROPDOWN,
                label = "Feedback Type",
                required = true,
                order = 1,
                options = listOf("Bug", "Feature Request", "General", "Other"),
                maxLength = null
            ),
            FeedbackField(
                fieldId = "rating",
                type = FieldTypes.RATING,
                label = "Rating",
                required = true,
                order = 2,
                options = null,
                maxLength = null
            ),
            FeedbackField(
                fieldId = "message",
                type = FieldTypes.TEXT,
                label = "Message",
                required = true,
                order = 3,
                options = null,
                maxLength = 500
            )
        )
    )
}
