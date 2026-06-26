package com.example.feedbacksdk.data

import com.example.feedbacksdk.FeedbackSDK
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

internal object ApiClient {

    @Volatile
    private var retrofit: Retrofit? = null

    @Volatile
    private var cachedBaseUrl: String? = null

    fun feedbackApi(): FeedbackApi {
        val baseUrl = FeedbackSDK.getBaseUrl()
        val current = retrofit
        if (current != null && cachedBaseUrl == baseUrl) {
            return current.create(FeedbackApi::class.java)
        }

        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        val client = OkHttpClient.Builder()
            .addInterceptor(logging)
            .addInterceptor { chain ->
                val builder = chain.request().newBuilder()
                FeedbackSDK.getApiKey()?.let { builder.addHeader("X-Api-Key", it) }
                chain.proceed(builder.build())
            }
            .build()

        val built = Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        retrofit = built
        cachedBaseUrl = baseUrl
        return built.create(FeedbackApi::class.java)
    }
}
