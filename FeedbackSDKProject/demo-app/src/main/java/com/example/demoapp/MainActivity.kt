package com.example.demoapp

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.example.demoapp.BuildConfig
import com.example.feedbacksdk.FeedbackSDK
import com.google.android.material.button.MaterialButton

class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        FeedbackSDK.init(this, BuildConfig.PORTAL_API_KEY, "http://10.0.2.2:8000/")
        FeedbackSDK.setUser("user_001", "demo@example.com")
        FeedbackSDK.setMetadata("source", "demo-app")

        findViewById<MaterialButton>(R.id.btnFeedback1).setOnClickListener {
            FeedbackSDK.showFeedbackDialog(this)
        }
        findViewById<MaterialButton>(R.id.btnFeedback2).setOnClickListener {
            FeedbackSDK.showFeedbackDialog(this, "Feedback 2")
        }
        findViewById<MaterialButton>(R.id.btnFeedback3).setOnClickListener {
            FeedbackSDK.showFeedbackDialog(this, "Feedback 3")
        }
    }
}
