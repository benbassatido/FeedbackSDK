package com.example.feedbacksdk.util

import android.app.Activity
import android.graphics.Bitmap
import android.graphics.Canvas
import android.util.Base64
import java.io.ByteArrayOutputStream

internal object ScreenshotCapturer {

    private const val MAX_WIDTH = 1080
    private const val JPEG_QUALITY = 70

    fun captureScreenShot(activity: Activity): Bitmap? = runCatching {
        val view = activity.window.decorView.rootView
        if (view.width == 0 || view.height == 0) return null
        val bitmap = Bitmap.createBitmap(view.width, view.height, Bitmap.Config.ARGB_8888)
        view.draw(Canvas(bitmap))
        bitmap
    }.getOrNull()

    fun compressScreenShot(bitmap: Bitmap): ByteArray {
        val scaled = downscale(bitmap)
        val stream = ByteArrayOutputStream()
        scaled.compress(Bitmap.CompressFormat.JPEG, JPEG_QUALITY, stream)
        return stream.toByteArray()
    }

    fun toBase64(bytes: ByteArray): String = Base64.encodeToString(bytes, Base64.NO_WRAP)

    private fun downscale(bitmap: Bitmap): Bitmap {
        if (bitmap.width <= MAX_WIDTH) return bitmap
        val ratio = MAX_WIDTH.toFloat() / bitmap.width
        val height = (bitmap.height * ratio).toInt()
        return Bitmap.createScaledBitmap(bitmap, MAX_WIDTH, height, true)
    }
}
