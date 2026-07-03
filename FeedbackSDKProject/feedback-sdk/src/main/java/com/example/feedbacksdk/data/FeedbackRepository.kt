package com.example.feedbacksdk.data

import android.util.Log
import com.example.feedbacksdk.LOG_TAG
import com.example.feedbacksdk.model.FeedbackItem

internal object FeedbackRepository {

    fun sendFeedbackToServer(
        item: FeedbackItem,
        onSuccess: () -> Unit,
        onServerError: (Exception) -> Unit,
        onNetworkError: (Exception) -> Unit
    ) {
        Log.d(LOG_TAG, "Sending feedback ${item.feedbackId} to backend")
        ApiClient.feedbackApi().postFeedback(item).enqueueResult(
            onSuccess = { onSuccess() },
            onFailure = { code, error ->
                if (code != null && !httpErrorRetryable(code)) {
                    onServerError(error)
                } else {
                    onNetworkError(error)
                }
            }
        )
    }
}
