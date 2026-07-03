package com.example.feedbacksdk.data

import android.content.Context
import android.graphics.Bitmap
import com.example.feedbacksdk.util.ScreenshotCache
import com.example.feedbacksdk.util.ScreenshotCapturer

internal object ScreenshotPreparer {

    fun prepareScreenshot(context: Context, bitmap: Bitmap?, feedbackId: String): String? {
        if (bitmap == null) return null
        val bytes = ScreenshotCapturer.compressScreenShot(bitmap)
        ScreenshotCache.saveTemp(context, bytes, feedbackId)
        return ScreenshotCapturer.toBase64(bytes)
    }
}
