package com.example.feedbacksdk.data

import com.example.feedbacksdk.model.FeedbackDesign
import com.example.feedbacksdk.model.FeedbackItem
import okhttp3.ResponseBody
import retrofit2.Call
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

internal interface FeedbackApi {

    @POST("feedback")
    fun postFeedback(@Body item: FeedbackItem): Call<ResponseBody>

    @GET("designs/by-name/{name}")
    fun getDesignByName(@Path("name") name: String): Call<FeedbackDesign>
}
