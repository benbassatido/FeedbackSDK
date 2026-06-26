package com.example.feedbacksdk.ui

import android.content.Context
import android.content.res.ColorStateList
import android.text.InputFilter
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.LinearLayout
import android.widget.RatingBar
import android.widget.TextView
import androidx.core.content.ContextCompat
import com.example.feedbacksdk.R
import com.example.feedbacksdk.model.FeedbackField
import com.google.android.material.textfield.MaterialAutoCompleteTextView
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout

internal object FormFieldRenderer {

    fun renderField(context: Context, field: FeedbackField, container: ViewGroup): View {
        return when (field.type) {
            "dropdown" -> renderDropdown(context, field, container)
            "rating" -> renderRating(context, field, container)
            "text" -> renderText(context, field, container)
            else -> renderText(context, field, container)
        }
    }

    fun getFieldValue(view: View, fieldType: String): Any? {
        return when (fieldType) {
            "dropdown" -> {
                val textInput = view as TextInputLayout
                val autoComplete = textInput.editText as? MaterialAutoCompleteTextView
                autoComplete?.text?.toString()?.takeIf { it.isNotBlank() }
            }
            "rating" -> {
                val ratingBar = view.findViewWithTag<RatingBar>("rating_bar")
                ratingBar?.rating?.takeIf { it > 0f }
            }
            "text" -> {
                val textInput = view as TextInputLayout
                textInput.editText?.text?.toString()?.takeIf { it.isNotBlank() }
            }
            else -> null
        }
    }

    private fun renderDropdown(context: Context, field: FeedbackField, container: ViewGroup): View {
        val textInputLayout = TextInputLayout(
            context,
            null,
            com.google.android.material.R.attr.textInputOutlinedExposedDropdownMenuStyle
        ).apply {
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = dpToPx(context, 16)
            }
            hint = buildLabel(field)
            boxBackgroundMode = TextInputLayout.BOX_BACKGROUND_OUTLINE
        }

        val autoComplete = MaterialAutoCompleteTextView(textInputLayout.context).apply {
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
            val items = field.options ?: emptyList()
            setAdapter(ArrayAdapter(context, android.R.layout.simple_dropdown_item_1line, items))
            inputType = 0
            isFocusable = false
        }

        textInputLayout.addView(autoComplete)
        container.addView(textInputLayout)
        return textInputLayout
    }

    private fun renderRating(context: Context, field: FeedbackField, container: ViewGroup): View {
        val wrapper = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = dpToPx(context, 16)
            }
        }

        val label = TextView(context).apply {
            text = buildLabel(field)
            setTextAppearance(com.google.android.material.R.style.TextAppearance_MaterialComponents_Subtitle2)
            setTextColor(ContextCompat.getColor(context, R.color.fb_on_surface))
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = dpToPx(context, 10)
            }
        }

        val ratingBar = RatingBar(context, null, android.R.attr.ratingBarStyle).apply {
            tag = "rating_bar"
            numStars = 5
            stepSize = 1f
            rating = 0f
            progressTintList = ColorStateList.valueOf(
                ContextCompat.getColor(context, R.color.fb_rating)
            )
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        }

        wrapper.addView(label)
        wrapper.addView(ratingBar)
        container.addView(wrapper)
        return wrapper
    }

    private fun renderText(context: Context, field: FeedbackField, container: ViewGroup): View {
        val textInputLayout = TextInputLayout(
            context,
            null,
            com.google.android.material.R.attr.textInputOutlinedStyle
        ).apply {
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = dpToPx(context, 16)
            }
            hint = buildLabel(field)
            boxBackgroundMode = TextInputLayout.BOX_BACKGROUND_OUTLINE
            field.maxLength?.let { counterMaxLength = it; isCounterEnabled = true }
        }

        val editText = TextInputEditText(textInputLayout.context).apply {
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
            minLines = 3
            maxLines = 6
            inputType = android.text.InputType.TYPE_CLASS_TEXT or
                    android.text.InputType.TYPE_TEXT_FLAG_MULTI_LINE or
                    android.text.InputType.TYPE_TEXT_FLAG_CAP_SENTENCES
            field.maxLength?.let { filters = arrayOf(InputFilter.LengthFilter(it)) }
        }

        textInputLayout.addView(editText)
        container.addView(textInputLayout)
        return textInputLayout
    }

    private fun buildLabel(field: FeedbackField): String {
        return if (field.required) "${field.label} *" else field.label
    }

    private fun dpToPx(context: Context, dp: Int): Int {
        return (dp * context.resources.displayMetrics.density).toInt()
    }
}
