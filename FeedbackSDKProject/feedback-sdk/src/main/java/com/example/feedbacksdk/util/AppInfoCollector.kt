package com.example.feedbacksdk.util

import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import com.example.feedbacksdk.model.AppInfo

internal object AppInfoCollector {

    fun collectAppInfo(context: Context): AppInfo {
        val packageManager = context.packageManager
        val packageName = context.packageName
        val packageInfo = try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                packageManager.getPackageInfo(packageName, PackageManager.PackageInfoFlags.of(0))
            } else {
                @Suppress("DEPRECATION")
                packageManager.getPackageInfo(packageName, 0)
            }
        } catch (e: PackageManager.NameNotFoundException) {
            null
        }

        val versionName = packageInfo?.versionName ?: "unknown"
        val versionCode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            packageInfo?.longVersionCode ?: 0L
        } else {
            @Suppress("DEPRECATION")
            packageInfo?.versionCode?.toLong() ?: 0L
        }

        val appInfo = try {
            packageManager.getApplicationInfo(packageName, 0)
        } catch (e: PackageManager.NameNotFoundException) {
            null
        }
        val buildType = if (appInfo != null && (appInfo.flags and android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
            "debug"
        } else {
            "release"
        }

        return AppInfo(
            packageName = packageName,
            appVersionName = versionName,
            appVersionCode = versionCode,
            buildType = buildType
        )
    }
}
