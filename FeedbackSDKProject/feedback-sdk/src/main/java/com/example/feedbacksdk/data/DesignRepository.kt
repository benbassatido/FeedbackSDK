package com.example.feedbacksdk.data

import android.util.Log
import com.example.feedbacksdk.core.DefaultDesign
import com.example.feedbacksdk.model.FeedbackDesign
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

internal object DesignRepository {

    private const val TAG = "FeedbackSDK"

    fun fetchDesign(name: String, onResult: (FeedbackDesign) -> Unit) {
        ApiClient.feedbackApi().getDesignByName(name).enqueue(object : Callback<FeedbackDesign> {
            override fun onResponse(call: Call<FeedbackDesign>, response: Response<FeedbackDesign>) {
                val body = response.body()
                if (response.isSuccessful && body != null) {
                    Log.d(TAG, "Loaded design '${body.name}' from backend")
                    onResult(body)
                } else {
                    Log.w(TAG, "Design '$name' not found (HTTP ${response.code()}); using default")
                    onResult(DefaultDesign.get())
                }
            }

            override fun onFailure(call: Call<FeedbackDesign>, t: Throwable) {
                Log.w(TAG, "Design request error; using default", t)
                onResult(DefaultDesign.get())
            }
        })
    }
}
