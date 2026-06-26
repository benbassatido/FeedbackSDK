package com.example.feedbacksdk

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.widget.Toast
import com.example.feedbacksdk.core.ScreenshotHolder
import com.example.feedbacksdk.data.ConnectivityObserver
import com.example.feedbacksdk.data.FeedbackQueue
import com.example.feedbacksdk.ui.FeedbackActivity
import com.example.feedbacksdk.util.ScreenshotCapturer

object FeedbackSDK {

    private const val DEFAULT_BASE_URL = "http://10.0.2.2:8000/"

    private var isInitialized: Boolean = false
    private var appContext: Context? = null
    private var apiKey: String? = null
    private var baseUrl: String = DEFAULT_BASE_URL
    private var userId: String? = null
    private var userEmail: String? = null
    private val metadata: MutableMap<String, String> = mutableMapOf()

    fun init(context: Context, apiKey: String, baseUrl: String = DEFAULT_BASE_URL) {
        require(apiKey.isNotBlank()) { "FeedbackSDK: apiKey must not be blank" }
        require(baseUrl.isNotBlank()) { "FeedbackSDK: baseUrl must not be blank" }

        this.appContext = context.applicationContext
        this.apiKey = apiKey
        this.baseUrl = if (baseUrl.endsWith("/")) baseUrl else "$baseUrl/"
        this.isInitialized = true

        appContext?.let { app ->
            ConnectivityObserver.start(app)
            FeedbackQueue.flush(app)
        }
    }

    // Shows feedback form
    @JvmOverloads
    fun showFeedbackDialog(activity: Activity, designName: String? = null) {
        if (!isInitialized) {
            Toast.makeText(
                activity,
                R.string.feedback_sdk_not_initialized,
                Toast.LENGTH_LONG
            ).show()
            return
        }

        ScreenshotHolder.bitmap = ScreenshotCapturer.captureScreenShot(activity)

        val intent = Intent(activity, FeedbackActivity::class.java)
        if (!designName.isNullOrBlank()) {
            intent.putExtra(FeedbackActivity.EXTRA_DESIGN_NAME, designName)
        }
        activity.startActivity(intent)
    }

    fun setUser(userId: String?, email: String?) {
        this.userId = userId
        this.userEmail = email
    }

    fun setMetadata(key: String, value: String) {
        metadata[key] = value
    }

    internal fun getUserId(): String? = userId

    internal fun getUserEmail(): String? = userEmail

    internal fun getMetadata(): Map<String, String> = metadata.toMap()

    internal fun getAppContext(): Context? = appContext

    internal fun getApiKey(): String? = apiKey

    internal fun getBaseUrl(): String = baseUrl
}
