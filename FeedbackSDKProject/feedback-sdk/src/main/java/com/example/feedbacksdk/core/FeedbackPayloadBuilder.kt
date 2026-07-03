package com.example.feedbacksdk.core

import android.content.Context
import com.example.feedbacksdk.FeedbackSDK
import com.example.feedbacksdk.model.FeedbackItem
import com.example.feedbacksdk.util.AppInfoCollector
import com.example.feedbacksdk.util.DeviceInfoCollector

internal object FeedbackPayloadBuilder {

    fun buildFeedbackPayload(
        context: Context,
        feedbackId: String,
        answers: Map<String, Any?>,
        screenshotBase64: String?
    ): FeedbackItem {
        val now = System.currentTimeMillis()
        return FeedbackItem(
            feedbackId = feedbackId,
            userId = FeedbackSDK.getUserId(),
            userEmail = FeedbackSDK.getUserEmail(),
            answers = answers,
            metadata = FeedbackSDK.getMetadata(),
            status = FeedbackStatuses.PENDING,
            createdAt = now,
            updatedAt = now,
            screenshotBase64 = screenshotBase64,
            deviceInfo = DeviceInfoCollector.collectDeviceInfo(context),
            appInfo = AppInfoCollector.collectAppInfo(context)
        )
    }
}
