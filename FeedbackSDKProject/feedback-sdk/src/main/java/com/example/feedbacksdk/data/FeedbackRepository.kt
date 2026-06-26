package com.example.feedbacksdk.data

import android.util.Log
import com.example.feedbacksdk.model.FeedbackItem
import okhttp3.ResponseBody
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

internal object FeedbackRepository {

    private const val TAG = "FeedbackSDK"

    fun sendFeedbackToServer(
        item: FeedbackItem,
        onSuccess: () -> Unit,
        onServerError: (Exception) -> Unit,
        onNetworkError: (Exception) -> Unit
    ) {
        Log.d(TAG, "Sending feedback ${item.feedbackId} to backend")
        ApiClient.feedbackApi().postFeedback(item).enqueue(object : Callback<ResponseBody> {
            override fun onResponse(call: Call<ResponseBody>, response: Response<ResponseBody>) {
                if (response.isSuccessful) {
                    onSuccess()
                } else {
                    onServerError(Exception("HTTP ${response.code()}: ${response.message()}"))
                }
            }

            override fun onFailure(call: Call<ResponseBody>, t: Throwable) {
                onNetworkError(Exception(t.message ?: "Network error", t))
            }
        })
    }
}
