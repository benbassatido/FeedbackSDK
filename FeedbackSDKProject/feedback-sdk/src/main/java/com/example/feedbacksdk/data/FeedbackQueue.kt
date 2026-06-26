package com.example.feedbacksdk.data

import android.content.Context
import android.util.Log
import com.example.feedbacksdk.model.FeedbackItem
import com.example.feedbacksdk.util.NetworkUtil
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.io.File
import java.io.IOException
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

internal object FeedbackQueue {

    private const val TAG = "FeedbackSDK"
    private const val FILE_NAME = "feedback_sdk_queue.json"
    private const val MAX_ITEMS = 100

    private val gson = Gson()
    private val executor = Executors.newSingleThreadExecutor()
    private val flushing = AtomicBoolean(false)
    private val listType = object : TypeToken<MutableList<FeedbackItem>>() {}.type

    fun enqueue(context: Context, item: FeedbackItem) {
        val appContext = context.applicationContext
        executor.execute {
            val items = read(appContext)
            items.add(item)
            while (items.size > MAX_ITEMS) items.removeAt(0)
            write(appContext, items)
            Log.d(TAG, "Queued feedback ${item.feedbackId} for later (${items.size} pending)")
        }
    }

    fun flush(context: Context) {
        val appContext = context.applicationContext
        executor.execute {
            if (!flushing.compareAndSet(false, true)) return@execute
            try {
                if (!NetworkUtil.isOnline(appContext)) return@execute
                val items = read(appContext)
                if (items.isEmpty()) return@execute

                val remaining = mutableListOf<FeedbackItem>()
                var stop = false
                for (item in items) {
                    if (stop) {
                        remaining.add(item)
                        continue
                    }
                    when (val result = send(item)) {
                        SendResult.SUCCESS ->
                            Log.d(TAG, "Replayed queued feedback ${item.feedbackId}")
                        SendResult.DROP ->
                            Log.w(TAG, "Dropping unsendable feedback ${item.feedbackId}")
                        SendResult.RETRY -> {
                            remaining.add(item)
                            stop = true
                        }
                    }
                }
                write(appContext, remaining)
            } finally {
                flushing.set(false)
            }
        }
    }

    private fun send(item: FeedbackItem): SendResult {
        return try {
            val response = ApiClient.feedbackApi().postFeedback(item).execute()
            when {
                response.isSuccessful -> SendResult.SUCCESS
                response.code() in 400..499 -> SendResult.DROP
                else -> SendResult.RETRY
            }
        } catch (e: IOException) {
            Log.d(TAG, "Still offline; keeping ${item.feedbackId} queued", e)
            SendResult.RETRY
        }
    }

    private fun read(context: Context): MutableList<FeedbackItem> {
        val file = File(context.filesDir, FILE_NAME)
        if (!file.exists()) return mutableListOf()
        return runCatching {
            gson.fromJson<MutableList<FeedbackItem>>(file.readText(), listType) ?: mutableListOf()
        }.getOrElse {
            Log.w(TAG, "Failed to read feedback queue", it)
            mutableListOf()
        }
    }

    private fun write(context: Context, items: List<FeedbackItem>) {
        val file = File(context.filesDir, FILE_NAME)
        runCatching {
            if (items.isEmpty()) file.delete() else file.writeText(gson.toJson(items, listType))
        }.onFailure { Log.w(TAG, "Failed to write feedback queue", it) }
    }

    private enum class SendResult { SUCCESS, DROP, RETRY }
}
