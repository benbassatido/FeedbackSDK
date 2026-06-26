package com.example.feedbacksdk.core

import com.example.feedbacksdk.model.FeedbackDesign

internal object DefaultDesign {

    fun get(): FeedbackDesign {
        val form = DefaultFormConfig.get()
        return FeedbackDesign(
            name = "default",
            title = form.title,
            description = form.description,
            fields = form.fields,
            backgroundColor = "#F4F5FB",
            cardColor = "#FFFFFF",
            titleColor = "#15172B",
            buttonColor = "#4F46E5"
        )
    }
}
