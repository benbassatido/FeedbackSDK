package com.example.feedbacksdk.data

import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

internal fun httpErrorRetryable(code: Int): Boolean = code !in 400..499

internal fun <T> Call<T>.enqueueResult(
    onSuccess: (T?) -> Unit,
    onFailure: (statusCode: Int?, error: Exception) -> Unit,
) {
    enqueue(object : Callback<T> {
        override fun onResponse(call: Call<T>, response: Response<T>) {
            if (response.isSuccessful) {
                onSuccess(response.body())
            } else {
                onFailure(
                    response.code(),
                    Exception("HTTP ${response.code()}: ${response.message()}"),
                )
            }
        }

        override fun onFailure(call: Call<T>, t: Throwable) {
            onFailure(null, Exception(t.message ?: "Network error", t))
        }
    })
}
