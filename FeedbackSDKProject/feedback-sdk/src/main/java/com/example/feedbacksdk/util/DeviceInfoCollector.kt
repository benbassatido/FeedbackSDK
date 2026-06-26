package com.example.feedbacksdk.util

import android.content.Context
import android.os.Build
import android.util.DisplayMetrics
import android.view.WindowManager
import com.example.feedbacksdk.model.DeviceInfo
import java.util.Locale

internal object DeviceInfoCollector {

    fun collectDeviceInfo(context: Context): DeviceInfo {
        return DeviceInfo(
            manufacturer = Build.MANUFACTURER,
            model = Build.MODEL,
            androidVersion = Build.VERSION.RELEASE,
            locale = Locale.getDefault().toString(),
            screenSize = getScreenSize(context)
        )
    }

    private fun getScreenSize(context: Context): String {
        val wm = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
        val metrics = DisplayMetrics()
        @Suppress("DEPRECATION")
        wm.defaultDisplay.getMetrics(metrics)
        return "${metrics.widthPixels}x${metrics.heightPixels}"
    }
}
