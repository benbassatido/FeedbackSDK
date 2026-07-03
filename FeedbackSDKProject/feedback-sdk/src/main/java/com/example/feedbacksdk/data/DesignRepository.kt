package com.example.feedbacksdk.data

import android.util.Log
import com.example.feedbacksdk.LOG_TAG
import com.example.feedbacksdk.core.DefaultDesign
import com.example.feedbacksdk.model.FeedbackDesign

internal object DesignRepository {

    fun fetchDesign(name: String, onResult: (FeedbackDesign) -> Unit) {
        ApiClient.feedbackApi().getDesignByName(name).enqueueResult(
            onSuccess = { body ->
                if (body != null) {
                    Log.d(LOG_TAG, "Loaded design '${body.name}' from backend")
                    onResult(body)
                } else {
                    Log.w(LOG_TAG, "Design '$name' returned empty body; using default")
                    onResult(DefaultDesign.get())
                }
            },
            onFailure = { code, error ->
                Log.w(LOG_TAG, "Design '$name' request failed (code=$code); using default", error)
                onResult(DefaultDesign.get())
            }
        )
    }
}
