# 🔌 API Reference

Base URL (local): `http://localhost:8000`
The SDK uses `http://10.0.2.2:8000/` from the Android emulator.

All request/response bodies are JSON and use **camelCase** field names.

---

## 🔐 Authentication

The API has two auth schemes, depending on the caller:

| Scheme | Header | Used by | Endpoints |
|--------|--------|---------|-----------|
| API key | `X-Api-Key: fsdk_...` | Android SDK | `POST /feedback`, `GET /designs/by-name/{name}` |
| Bearer token | `Authorization: Bearer <token>` | Web portal | feedback listing/management, design CRUD |

- Tokens are returned by `/auth/register` and `/auth/login`, are **HMAC-SHA256 signed**, and expire after **7 days**.
- A `401` on any portal endpoint means the token is missing/expired — re-authenticate.

---

## ❤️ Health

### `GET /health`

No auth. Returns `{"status": "ok"}`.

---

## 👤 Auth endpoints

### `POST /auth/register` → `201`

Creates an account, auto-generates an API key, and seeds a `default` design.

**Request**
```json
{ "fullName": "Ada Lovelace", "email": "ada@example.com", "password": "secret123" }
```

**Response**
```json
{ "token": "…", "email": "ada@example.com", "fullName": "Ada Lovelace", "apiKey": "fsdk_…" }
```

**Errors:** `400` (missing name / invalid email / password < 6 chars), `409` (email already exists).

### `POST /auth/login` → `200`

```json
{ "email": "ada@example.com", "password": "secret123" }
```

Returns the same `AuthResponse` shape. **Errors:** `401` (invalid email or password).

---

## 💬 Feedback endpoints

### `POST /feedback` → `201` 🔑 *(API key)*

Called by the SDK. The owner is resolved from `X-Api-Key`. Uses upsert semantics (safe to retry with the same `feedbackId`).

**Request (abridged)**
```json
{
  "feedbackId": "uuid",
  "userId": "user_001",
  "userEmail": "user@example.com",
  "answers": { "rating": 5, "message": "Great!" },
  "metadata": { "source": "demo-app" },
  "status": "pending",
  "createdAt": 1719400000000,
  "updatedAt": 1719400000000,
  "screenshotBase64": "…optional…",
  "deviceInfo": { "manufacturer": "Google", "model": "Pixel 7", "androidVersion": "14", "locale": "en_US", "screenSize": "1080x2400" },
  "appInfo": { "packageName": "com.example.demoapp", "appVersionName": "1.0", "appVersionCode": 1, "buildType": "debug" }
}
```

**Response**
```json
{ "feedbackId": "uuid" }
```

> If `screenshotBase64` is present, the backend decodes it to JPEG bytes and exposes it at `screenshotUrl = /feedback/{id}/screenshot`.

**Errors:** `401` (missing/invalid API key).

### `GET /feedback` → `200` 🪪 *(Bearer)*

Lists the **authenticated account's** feedback, newest first, capped at 100. Returns an array of `FeedbackResponse`.

### `GET /feedback/{feedback_id}` → `200` 🪪 *(Bearer)*

Single feedback item (must belong to the caller). **Errors:** `404`.

### `GET /feedback/{feedback_id}/screenshot` → `200`

Returns the raw screenshot as `image/jpeg`. **No auth** (the URL acts as the capability). **Errors:** `404` (no screenshot).

### `PATCH /feedback/{feedback_id}/status` → `200` 🪪 *(Bearer)*

```json
{ "status": "in_progress" }
```

Allowed statuses: `pending`, `in_progress`, `resolved`, `archived`. **Errors:** `400` (invalid status), `404`.

### `PATCH /feedback/{feedback_id}/viewed` → `200` 🪪 *(Bearer)*

Marks the item as viewed (no body). **Errors:** `404`.

---

## 🎨 Design endpoints

### `GET /designs` → `200` 🪪 *(Bearer)*

Lists the account's designs (alphabetical by name). Returns `DesignResponse[]`.

### `GET /designs/by-name/{name}` → `200` 🔑 *(API key)*

Used by the SDK to fetch a design at runtime. Owner resolved from the API key. **Errors:** `404` (design not found → SDK falls back to its built-in default).

### `POST /designs` → `201` 🪪 *(Bearer)*

Creates a design for the account.

**Request**
```json
{
  "name": "game_over",
  "title": "How was your game?",
  "description": "Tell us what you thought.",
  "fields": [
    { "fieldId": "rating", "type": "rating", "label": "Rating", "required": true, "order": 0, "options": null, "maxLength": null },
    { "fieldId": "message", "type": "text", "label": "Message", "required": true, "order": 1, "options": null, "maxLength": 500 }
  ],
  "backgroundColor": "#101010",
  "cardColor": "#1E1E1E",
  "titleColor": "#FFFFFF",
  "buttonColor": "#E11D48"
}
```

**Validation (returns `400` with a message):**
- `name` and `title` must be non-empty.
- All four colors must be hex (`#RGB` or `#RRGGBB`).
- At least one field; every field needs a unique `fieldId` and a `label`.
- `type` ∈ `text` / `dropdown` / `rating`; a `dropdown` needs at least one option.

**Errors:** `400` (validation), `409` (name already used by this account).

### `PUT /designs/{design_id}` → `200` 🪪 *(Bearer)*

Same body as create. Updates an existing design owned by the caller. **Errors:** `400`, `404`, `409`.

### `DELETE /designs/{design_id}` → `200` 🪪 *(Bearer)*

```json
{ "deleted": 123 }
```

**Errors:** `404`.

---

## 📋 Status & error conventions

| Code | Meaning |
|------|---------|
| `200` / `201` | Success |
| `400` | Validation error (message in `detail`) |
| `401` | Not authenticated / bad credentials / expired token / bad API key |
| `404` | Resource not found (or not owned by caller) |
| `409` | Conflict (duplicate email or design name) |

Error responses follow FastAPI's shape:
```json
{ "detail": "A human-readable message." }
```

---

## 📑 Endpoint summary

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/health` | none | Liveness |
| POST | `/auth/register` | none | Create account |
| POST | `/auth/login` | none | Sign in |
| POST | `/feedback` | API key | Submit feedback |
| GET | `/feedback` | Bearer | List feedback |
| GET | `/feedback/{id}` | Bearer | Get one |
| GET | `/feedback/{id}/screenshot` | none | Screenshot image |
| PATCH | `/feedback/{id}/status` | Bearer | Change status |
| PATCH | `/feedback/{id}/viewed` | Bearer | Mark viewed |
| GET | `/designs` | Bearer | List designs |
| GET | `/designs/by-name/{name}` | API key | Fetch design (SDK) |
| POST | `/designs` | Bearer | Create design |
| PUT | `/designs/{id}` | Bearer | Update design |
| DELETE | `/designs/{id}` | Bearer | Delete design |

> 💡 FastAPI also serves interactive docs at `http://localhost:8000/docs` (Swagger UI) and `http://localhost:8000/redoc` while the server is running.
