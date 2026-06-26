package com.example.feedbacksdk.ui

import android.content.Context
import android.content.res.ColorStateList
import android.graphics.Color
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.feedbacksdk.FeedbackSDK
import com.example.feedbacksdk.R
import com.example.feedbacksdk.core.FeedbackPayloadBuilder
import com.example.feedbacksdk.core.FeedbackValidator
import com.example.feedbacksdk.core.ScreenshotHolder
import com.example.feedbacksdk.data.DesignRepository
import com.example.feedbacksdk.data.FeedbackQueue
import com.example.feedbacksdk.data.FeedbackRepository
import com.example.feedbacksdk.data.ScreenshotUploader
import com.example.feedbacksdk.model.FeedbackDesign
import com.example.feedbacksdk.model.FeedbackField
import com.example.feedbacksdk.model.FeedbackItem
import com.example.feedbacksdk.util.NetworkUtil
import com.example.feedbacksdk.util.ScreenshotCache
import com.google.android.material.appbar.MaterialToolbar
import com.google.android.material.button.MaterialButton
import com.google.android.material.card.MaterialCardView
import com.google.android.material.checkbox.MaterialCheckBox
import java.util.UUID

internal class FeedbackActivity : AppCompatActivity() {

    private val fieldViews = mutableMapOf<FeedbackField, View>()
    private var includeScreenshot = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_feedback)

        setupToolbarNavigation()
        showLoading()

        val designName = intent.getStringExtra(EXTRA_DESIGN_NAME)?.takeIf { it.isNotBlank() }
            ?: DEFAULT_DESIGN_NAME
        DesignRepository.fetchDesign(designName) { design -> bindForm(design) }
    }

    private fun setupToolbarNavigation() {
        val toolbar = findViewById<MaterialToolbar>(R.id.toolbar)
        toolbar.setNavigationOnClickListener { finish() }
    }

    private fun showLoading() {
        findViewById<ProgressBar>(R.id.progressBar).visibility = View.VISIBLE
        findViewById<ScrollView>(R.id.scrollView).visibility = View.GONE
        findViewById<MaterialButton>(R.id.btnSubmit).visibility = View.GONE
    }

    private fun bindForm(design: FeedbackDesign) {
        findViewById<ProgressBar>(R.id.progressBar).visibility = View.GONE
        findViewById<ScrollView>(R.id.scrollView).visibility = View.VISIBLE
        findViewById<MaterialButton>(R.id.btnSubmit).visibility = View.VISIBLE

        findViewById<MaterialToolbar>(R.id.toolbar).title = design.title
        setupDescription(design.description)
        setupScreenshotToggle()
        renderFormFields(design.fields)
        setupSubmitButton(design.fields)
        applyColors(design)
    }

    private fun applyColors(design: FeedbackDesign) {
        runCatching {
            val backgroundColor = Color.parseColor(design.backgroundColor)
            val cardColor = Color.parseColor(design.cardColor)
            val titleColor = Color.parseColor(design.titleColor)
            val buttonColor = Color.parseColor(design.buttonColor)

            findViewById<View>(R.id.feedbackRoot).setBackgroundColor(backgroundColor)
            findViewById<MaterialToolbar>(R.id.toolbar).apply {
                setBackgroundColor(backgroundColor)
                setTitleTextColor(titleColor)
            }
            findViewById<MaterialCardView>(R.id.feedbackCard).setCardBackgroundColor(cardColor)
            findViewById<TextView>(R.id.tvDescription).setTextColor(titleColor)
            findViewById<MaterialButton>(R.id.btnSubmit).backgroundTintList =
                ColorStateList.valueOf(buttonColor)
            findViewById<ProgressBar>(R.id.progressBar).indeterminateTintList =
                ColorStateList.valueOf(buttonColor)
        }.onFailure { Log.w("FeedbackSDK", "Failed to apply design colors", it) }
    }

    private fun setupScreenshotToggle() {
        val checkbox = findViewById<MaterialCheckBox>(R.id.cbIncludeScreenshot)
        if (ScreenshotHolder.bitmap == null) {
            includeScreenshot = false
            checkbox.visibility = View.GONE
            return
        }

        checkbox.visibility = View.VISIBLE
        includeScreenshot = checkbox.isChecked
        checkbox.setOnCheckedChangeListener { _, isChecked ->
            includeScreenshot = isChecked
        }
    }

    private fun setupDescription(description: String?) {
        val tvDescription = findViewById<TextView>(R.id.tvDescription)
        if (description.isNullOrBlank()) {
            tvDescription.visibility = View.GONE
        } else {
            tvDescription.text = description
            tvDescription.visibility = View.VISIBLE
        }
    }

    private fun renderFormFields(fields: List<FeedbackField>) {
        val container = findViewById<LinearLayout>(R.id.fieldsContainer)
        val sortedFields = fields.sortedBy { it.order }

        for (field in sortedFields) {
            val view = FormFieldRenderer.renderField(this, field, container)
            fieldViews[field] = view
        }
    }

    private fun setupSubmitButton(fields: List<FeedbackField>) {
        val btnSubmit = findViewById<MaterialButton>(R.id.btnSubmit)
        btnSubmit.setOnClickListener {
            val answers = collectAnswers()
            if (!FeedbackValidator.validateFeedbackInput(fields, answers)) {
                Toast.makeText(this, R.string.feedback_sdk_error_required, Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            val context = FeedbackSDK.getAppContext() ?: applicationContext
            val feedbackId = UUID.randomUUID().toString()
            val bitmap = ScreenshotHolder.bitmap?.takeIf { includeScreenshot }
            val screenshotBase64 = ScreenshotUploader.uploadScreenShot(context, bitmap, feedbackId)
            val feedbackItem = FeedbackPayloadBuilder.buildFeedbackPayload(
                context = context,
                feedbackId = feedbackId,
                answers = answers,
                screenshotBase64 = screenshotBase64
            )

            if (!NetworkUtil.isOnline(context)) {
                saveForLater(context, feedbackItem)
                return@setOnClickListener
            }

            btnSubmit.isEnabled = false
            btnSubmit.text = getString(R.string.feedback_sdk_submitting)

            FeedbackRepository.sendFeedbackToServer(
                item = feedbackItem,
                onSuccess = {
                    Log.d("FeedbackSDK", "Feedback submitted to backend: ${feedbackItem.feedbackId}")
                    ScreenshotCache.clearTemporaryFiles(context)
                    FeedbackQueue.flush(context)
                    Toast.makeText(this, R.string.feedback_sdk_success, Toast.LENGTH_SHORT).show()
                    finish()
                },
                onNetworkError = { e ->
                    Log.w("FeedbackSDK", "Network error; saving feedback for later", e)
                    saveForLater(context, feedbackItem)
                },
                onServerError = { e ->
                    Log.e("FeedbackSDK", "Server rejected feedback", e)
                    btnSubmit.isEnabled = true
                    btnSubmit.text = getString(R.string.feedback_sdk_submit)
                    Toast.makeText(
                        this,
                        getString(R.string.feedback_sdk_error_submit, e.localizedMessage),
                        Toast.LENGTH_LONG
                    ).show()
                }
            )
        }
    }

    private fun saveForLater(context: Context, item: FeedbackItem) {
        FeedbackQueue.enqueue(context, item)
        ScreenshotCache.clearTemporaryFiles(context)
        Toast.makeText(this, R.string.feedback_sdk_saved_offline, Toast.LENGTH_LONG).show()
        finish()
    }

    private fun collectAnswers(): Map<String, Any?> {
        val answers = mutableMapOf<String, Any?>()
        for ((field, view) in fieldViews) {
            answers[field.fieldId] = FormFieldRenderer.getFieldValue(view, field.type)
        }
        return answers
    }

    override fun onDestroy() {
        super.onDestroy()
        ScreenshotHolder.bitmap = null
        ScreenshotCache.clearTemporaryFiles(FeedbackSDK.getAppContext() ?: applicationContext)
    }

    companion object {
        const val EXTRA_DESIGN_NAME = "com.example.feedbacksdk.DESIGN_NAME"
        private const val DEFAULT_DESIGN_NAME = "default"
    }
}
