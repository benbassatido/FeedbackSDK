package com.example.feedbacksdk.util

import android.content.Context
import android.util.Log
import java.io.File

internal object ScreenshotCache {

    private const val TAG = "FeedbackSDK"
    private const val DIR_NAME = "feedback_sdk_screenshots"

    fun saveTemp(context: Context, bytes: ByteArray, feedbackId: String): File? = runCatching {
        val dir = File(context.cacheDir, DIR_NAME).apply { mkdirs() }
        val file = File(dir, "screenshot_$feedbackId.jpg")
        file.writeBytes(bytes)
        file
    }.onFailure { Log.w(TAG, "Failed to cache screenshot", it) }.getOrNull()

    fun clearTemporaryFiles(context: Context?) {
        if (context == null) return
        runCatching {
            val dir = File(context.cacheDir, DIR_NAME)
            if (dir.exists()) {
                val deleted = dir.deleteRecursively()
                Log.d(TAG, "Cleared temporary screenshots: $deleted")
            }
        }.onFailure { Log.w(TAG, "Failed to clear temporary screenshots", it) }
    }
}
