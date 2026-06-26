package com.example.feedbacksdk.core

import com.example.feedbacksdk.model.FeedbackField

internal object FeedbackValidator {

    fun validateFeedbackInput(fields: List<FeedbackField>, answers: Map<String, Any?>): Boolean {
        for (field in fields) {
            val text = answers[field.fieldId]?.toString()?.trim().orEmpty()
            if (field.required && text.isEmpty()) return false
            if (field.type == "text" && field.maxLength != null && text.length > field.maxLength) {
                return false
            }
        }
        return true
    }
}
