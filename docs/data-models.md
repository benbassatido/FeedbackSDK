# 🧬 Data Models

The same logical entities exist in three places — the **Android SDK** (Kotlin), the **backend** (Pydantic/SQLAlchemy), and the **web portal** (TypeScript). The wire format is JSON in **camelCase**.

---

## 📨 FeedbackItem

What the SDK builds and sends to `POST /feedback`.

**Kotlin** (`model/FeedbackItem.kt`)
```kotlin
data class FeedbackItem(
    val feedbackId: String,
    val userId: String?,
    val userEmail: String?,
    val answers: Map<String, Any?>,
    val metadata: Map<String, String>,
    val status: String,
    val createdAt: Long,
    val updatedAt: Long,
    val screenshotBase64: String? = null,
    val deviceInfo: DeviceInfo? = null,
    val appInfo: AppInfo? = null
)
```

| Field | Type | Notes |
|-------|------|-------|
| `feedbackId` | string | UUID; becomes the DB primary key |
| `userId` / `userEmail` | string? | from `setUser` |
| `answers` | map | fieldId → answer value |
| `metadata` | map | from `setMetadata` |
| `status` | string | starts as `pending` |
| `createdAt` / `updatedAt` | long | epoch ms |
| `screenshotBase64` | string? | only when the user opts in |
| `deviceInfo` / `appInfo` | object? | auto-collected context |

The API response (`FeedbackResponse`) adds `viewed: boolean` and `screenshotUrl: string?`, and omits `screenshotBase64`.

---

## 📱 DeviceInfo

```kotlin
data class DeviceInfo(
    val manufacturer: String,
    val model: String,
    val androidVersion: String,
    val locale: String,
    val screenSize: String
)
```

Collected by `util/DeviceInfoCollector`. Example: `{ "manufacturer": "Google", "model": "Pixel 7", "androidVersion": "14", "locale": "en_US", "screenSize": "1080x2400" }`.

---

## 📦 AppInfo

```kotlin
data class AppInfo(
    val packageName: String,
    val appVersionName: String,
    val appVersionCode: Long,
    val buildType: String
)
```

Collected by `util/AppInfoCollector`. Example: `{ "packageName": "com.example.demoapp", "appVersionName": "1.0", "appVersionCode": 1, "buildType": "debug" }`.

---

## 🎨 FeedbackDesign

A complete, named form fetched from the backend (`GET /designs/by-name/{name}`).

**Kotlin** (`model/FeedbackDesign.kt`)
```kotlin
data class FeedbackDesign(
    val name: String = "default",
    val title: String = "Send Feedback",
    val description: String? = null,
    val fields: List<FeedbackField> = emptyList(),
    val backgroundColor: String = "#F4F5FB",
    val cardColor: String = "#FFFFFF",
    val titleColor: String = "#15172B",
    val buttonColor: String = "#4F46E5"
)
```

The defaults above double as the **built-in fallback** when a design can't be fetched.

---

## 🧩 FeedbackField

```kotlin
data class FeedbackField(
    val fieldId: String,
    val type: String,        // "text" | "dropdown" | "rating"
    val label: String,
    val required: Boolean,
    val order: Int,
    val options: List<String>?,  // required for "dropdown"
    val maxLength: Int?          // honored by "text"
)
```

| `type` | Behavior |
|--------|----------|
| `text` | Multi-line input, optional `maxLength` |
| `dropdown` | Choose from `options` (must have ≥1) |
| `rating` | Star rating |

---

## 🗂️ Backend persistence (SQLAlchemy)

The wire models map onto three tables — see the [Architecture schema](./architecture.md#%EF%B8%8F-database-schema) for full column listings:

| Wire model | Table |
|------------|-------|
| Feedback | `feedbacks` |
| Design | `form_designs` |
| Account | `users` |

Notable storage details:
- `metadata` is stored in a column literally named `metadata` (mapped to `feedback_metadata` in the ORM to avoid clashing with SQLAlchemy internals).
- `answers`, `metadata`, `deviceInfo`, `appInfo`, and design `fields` are `JSONB`.
- The screenshot is stored twice-by-reference: raw bytes in `screenshot` (`LargeBinary`) and a URL in `screenshot_url`.

---

## 🌐 Portal types (TypeScript)

The portal mirrors these in `client/src/api.ts` — e.g. `Feedback`, `Design`, `FormField`, `DeviceInfo`, `AppInfo`, and:

```ts
export const FEEDBACK_STATUSES = ["pending", "in_progress", "resolved", "archived"] as const;
export type FieldType = "text" | "dropdown" | "rating";
```

Keeping these in sync with the backend's Pydantic schemas (`server/schemas.py`) ensures the camelCase contract holds end-to-end.
