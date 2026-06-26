# 📱 SDK Usage

How to integrate and use the **Feedback SDK** in an Android app.

---

## 📦 Adding the SDK

In this project the SDK is a local Gradle module. The demo app depends on it directly:

```kotlin
// demo-app/build.gradle.kts
dependencies {
    implementation(project(":feedback-sdk"))
}
```

To use it in another project, publish the `feedback-sdk` module (e.g. to a Maven repository or as an `.aar`) and depend on it the same way.

---

## 🔑 Initialize

Call `init` once, early in your app (e.g. in `Application.onCreate` or your launcher `Activity`):

```kotlin
FeedbackSDK.init(
    context = this,
    apiKey  = "fsdk_your_portal_api_key",
    baseUrl = "http://10.0.2.2:8000/"   // optional; this is the default
)
```

- `apiKey` — copy it from the **portal Dashboard**. It identifies the account that owns the feedback.
- `baseUrl` — your backend URL. `10.0.2.2` maps to your machine's `localhost` from the Android emulator; use your LAN IP on a physical device.

`init` also **starts the offline observer and flushes any queued feedback** from a previous offline session.

---

## 👤 Identify the user & add metadata (optional)

```kotlin
FeedbackSDK.setUser("user_001", "user@example.com")
FeedbackSDK.setMetadata("source", "settings_screen")
FeedbackSDK.setMetadata("plan", "pro")
```

Both are optional and can be called any time after `init`. Metadata is attached to every subsequent submission.

---

## 💬 Show the feedback form

```kotlin
// Default design for this account
FeedbackSDK.showFeedbackDialog(activity)

// A specific named design (created in the portal)
FeedbackSDK.showFeedbackDialog(activity, "game_over")
```

What happens under the hood:
1. The SDK captures a screenshot of the current screen (kept in memory until you opt in).
2. It opens `FeedbackActivity`.
3. It fetches the requested design from the backend (`GET /designs/by-name/{name}`). If the name is missing or the request fails, it falls back to a **built-in default form**.
4. The form is rendered dynamically from the design's fields and colors.

---

## 🧱 The public API

| Method | Signature | Description |
|--------|-----------|-------------|
| `init` | `init(context: Context, apiKey: String, baseUrl: String = "http://10.0.2.2:8000/")` | Validates the key, stores config, starts offline handling, flushes the queue. Throws `IllegalArgumentException` if `apiKey`/`baseUrl` is blank. |
| `showFeedbackDialog` | `showFeedbackDialog(activity: Activity, designName: String? = null)` | Captures a screenshot and opens the feedback screen. Shows a toast if the SDK isn't initialized. |
| `setUser` | `setUser(userId: String?, email: String?)` | Associates feedback with an end-user identity. |
| `setMetadata` | `setMetadata(key: String, value: String)` | Adds an arbitrary key/value to submissions. |

> `showFeedbackDialog` is annotated `@JvmOverloads`, so Java callers can use either `showFeedbackDialog(activity)` or `showFeedbackDialog(activity, name)`.

---

## 🎨 Dynamic forms (designs)

Forms are **not hard-coded** — they're authored in the web portal and fetched at runtime. A design carries:

- a **title** and optional **description**,
- an ordered list of **fields**, and
- four **colors**: background, card, title, button.

Supported field types:

| Type | Renders as | Notes |
|------|-----------|-------|
| `text` | Multi-line text input | Honors `maxLength` |
| `dropdown` | Selectable options | Requires at least one option |
| `rating` | Star rating | |

Each account always has a `default` design (created at signup). Create more in the portal and reference them by name from `showFeedbackDialog`.

See [Web Portal](./web-portal.md) for how to build designs.

---

## 📸 Screenshots

- A screenshot of the current screen is **auto-captured** when the dialog opens.
- The user **opts in** via a simple "Attach screenshot" checkbox.
- If included, it is compressed, **disk-cached** during the submission, encoded as Base64, and sent inside the feedback payload.
- After a successful upload (or after queueing offline), the **temporary cached file is cleared** to free device storage.

No camera or storage permissions are required — the capture is of the app's own window.

---

## 📴 Offline behavior

If there's no connection (or the request fails on the network):

- The feedback is **saved locally** and the user sees:
  *"No connection — your feedback was saved and will be sent automatically when you're back online."*
- It is **resent automatically** when connectivity returns, after the next successful submission, or on the next `FeedbackSDK.init()`.

Full details in [Offline Handling](./offline-handling.md).

---

## 🔒 Permissions

The SDK declares these in its own manifest (merged into the host app automatically):

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

| Permission | Why |
|------------|-----|
| `INTERNET` | Submit feedback and fetch designs |
| `ACCESS_NETWORK_STATE` | Detect connectivity for offline handling |

---

## 🧪 Full example (demo app)

```kotlin
class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        FeedbackSDK.init(this, "fsdk_your_api_key", "http://10.0.2.2:8000/")
        FeedbackSDK.setUser("user_001", "demo@example.com")
        FeedbackSDK.setMetadata("source", "demo-app")

        findViewById<MaterialButton>(R.id.btnFeedback1).setOnClickListener {
            FeedbackSDK.showFeedbackDialog(this)               // default design
        }
        findViewById<MaterialButton>(R.id.btnFeedback2).setOnClickListener {
            FeedbackSDK.showFeedbackDialog(this, "Feedback 2") // named design
        }
    }
}
```
