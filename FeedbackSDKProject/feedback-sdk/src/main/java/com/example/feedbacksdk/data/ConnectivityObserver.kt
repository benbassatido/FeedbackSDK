package com.example.feedbacksdk.data

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.util.Log
import java.util.concurrent.atomic.AtomicBoolean

internal object ConnectivityObserver {

    private const val TAG = "FeedbackSDK"
    private val registered = AtomicBoolean(false)

    fun start(context: Context) {
        if (!registered.compareAndSet(false, true)) return
        val appContext = context.applicationContext
        val manager = appContext.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
        if (manager == null) {
            registered.set(false)
            return
        }

        val callback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                FeedbackQueue.flush(appContext)
            }
        }

        runCatching { manager.registerDefaultNetworkCallback(callback) }
            .onFailure {
                registered.set(false)
                Log.w(TAG, "Failed to register network callback", it)
            }
    }
}
