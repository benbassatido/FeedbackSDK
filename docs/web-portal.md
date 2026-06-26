# 🌐 Web Portal

The portal (`client/`) is a React + Vite + TypeScript single-page app for managing feedback and designing forms. Each account only ever sees **its own** data.

Run it with `npm run dev` (see [Getting Started](./getting-started.md)).

---

## 🔐 Accounts & sessions

- **Register** with full name, email, and password (min 6 chars). A `default` design is created for you automatically.
- **Login** returns a session token (stored client-side) and your **API key**.
- Sessions last **7 days**; when a token expires the app detects the `401`, logs you out, and prompts you to sign in again.

Your **API key** is shown on the Dashboard — copy it into the Android app's `FeedbackSDK.init(...)`.

---

## 📊 Dashboard

Gives an at-a-glance overview of your account:
- Your **API key** (for wiring up the SDK).
- Summary stats over your feedback.
- Entry points to the feedback list and design tools.

---

## 🗃️ Managing feedback

### Browse, search, filter

- **Search** matches across feedback id, user id/email, status, and all answer/metadata values.
- **Filters**:
  | Filter | Effect |
  |--------|--------|
  | Status | `pending` / `in_progress` / `resolved` / `archived` |
  | Type | by the `feedback_type` answer (auto-discovered from your data) |
  | Only unviewed | hide items already viewed |
  | Only with screenshot | hide items without an attached image |

### Inspect

Open an item to see its answers, metadata, captured **device & app info**, and the **screenshot** (if attached). Opening an item can mark it **viewed**.

### Act

- **Change status** (`pending → in_progress → resolved → archived`).
- **Export** the current list to **CSV** or **JSON** — the file is named `feedback-<timestamp>.csv|json`. CSV columns: `feedbackId, status, viewed, userId, userEmail, createdAt, updatedAt, answers, metadata, hasScreenshot`.

---

## 🎨 Designing forms

Designs are named forms the SDK fetches at runtime. Each design has:

- a **name** (unique per account; referenced from `showFeedbackDialog(activity, "name")`),
- a **title** and optional **description**,
- an ordered list of **fields**, and
- four **colors**: background, card, title, button.

### Field types

| Type | UI | Rules |
|------|----|-------|
| `text` | Multi-line input | optional `maxLength` |
| `dropdown` | Option list | needs at least one option |
| `rating` | Star rating | — |

### Live preview

The editor shows a live, survey-style preview so you can see exactly how the form will look on-device before saving.

### Create / edit / delete

- Validation runs both client-side and on the backend: non-empty name & title, valid hex colors, at least one field, unique `fieldId`s, and dropdowns with options.
- Design **names must be unique within your account** (a duplicate returns a `409`).
- Deleting a design is immediate.

> The starter `default` design is what `showFeedbackDialog(activity)` uses when no name is given. If the SDK requests a name that doesn't exist, it falls back to its built-in default form.

---

## 🔗 How it maps to the API

The portal is a thin client over the backend (`client/src/api.ts`). Highlights:

| Portal action | Endpoint |
|---------------|----------|
| Register / login | `POST /auth/register`, `POST /auth/login` |
| List / open feedback | `GET /feedback`, `GET /feedback/{id}` |
| Change status / mark viewed | `PATCH /feedback/{id}/status`, `PATCH /feedback/{id}/viewed` |
| Screenshot image | `GET /feedback/{id}/screenshot` |
| Design CRUD | `GET/POST/PUT/DELETE /designs` |

All portal calls send `Authorization: Bearer <token>`. See the [API Reference](./api-reference.md) for full details.

---

## 🎛️ Configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Backend URL used by the portal |
