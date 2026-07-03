# 📲 Feedback SDK

A lightweight **Android SDK** for collecting structured, in-app user feedback — backed by a **Python FastAPI + Neon PostgreSQL** service and a modern **React web portal** for managing it all.

The SDK focuses purely on **user feedback** (messages, ratings, feedback types, optional screenshots) — not crash or bug reporting — and ties every piece of feedback to a portal account through a per-user API key.

---

## 📖 Project Overview

Feedback SDK lets app developers drop a feedback form into any Android app with a few lines of Kotlin. Feedback forms are **fully configurable from the web portal** — each account can design its own named forms (questions + colors), and the SDK renders them dynamically at runtime.

The project is made of three cooperating parts:

| Component | Role |
|-----------|------|
| 🤖 **`feedback-sdk`** | Android library that captures and submits feedback |
| 🧪 **`demo-app`** | Sample Android app that integrates the SDK |
| ⚙️ **`server`** | FastAPI service storing data in Neon PostgreSQL |
| 🌐 **`client`** | React dashboard for designing forms and reviewing feedback |

Each registered portal user gets a unique **API key**. Feedback and designs are isolated per account, so different developers only ever see their own data.

---

## 🎥 Demo Video

▶️ [Watch the project demo on YouTube](https://youtu.be/d9nTsyu9k5M)

---

## ✨ Features

- 📝 **Structured feedback** — message, star rating, feedback type, and custom fields
- 🎨 **Dynamic forms** — form questions are fetched from the backend, not hard-coded
- 🖌️ **Named designs (themes)** — each account can build multiple forms with custom background, card, title, and button colors
- 📸 **Optional screenshots** — auto-captured, opt-in via a simple checkbox, disk-cached, and cleared after upload
- 📱 **Automatic context** — device info (model, OS, locale, screen size) and app info (package, version, build type)
- 👤 **User & metadata** — attach a user id/email and arbitrary key-value metadata
- 🔑 **Multi-tenant API keys** — feedback and designs are scoped per account
- 🔐 **Secure portal auth** — account registration with bcrypt-hashed passwords and signed session tokens
- 📊 **Management dashboard** — overview stats, search, filtering, status updates, and CSV/JSON export

---

## 🛠️ Technologies Used

**Android SDK & Demo App**
- 🟣 Kotlin
- 🤖 Android (Material Components)
- 🐘 Gradle (Kotlin DSL)
- 🌐 Retrofit · OkHttp · Gson

**Backend**
- 🐍 Python 3.12
- ⚡ FastAPI · Uvicorn
- 🗄️ SQLAlchemy · Pydantic
- 🐘 Neon PostgreSQL (`psycopg2`)
- 🔐 bcrypt · HMAC-signed tokens

**Web Portal**
- ⚛️ React 19
- ⚡ Vite
- 🔷 TypeScript

---

## 📦 Installation

> **Prerequisites:** Android Studio, Python 3.12+, Node.js 18+, and a free [Neon](https://neon.tech) PostgreSQL database.

### 1️⃣ Clone the repository

```bash
git clone <your-repo-url>
cd "Seminar"
```

### 2️⃣ Backend setup

```bash
cd server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file (copy from the example) and add your Neon connection string:

```bash
cp .env.example .env
```

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
AUTH_SECRET=change-me-to-a-long-random-string
# Comma-separated origins allowed to call the API from a browser (the web portal)
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

> On a **fresh** database the tables are created automatically on startup. If you are **upgrading** an existing database, run the one-shot migration first: `python migrate.py`.

### 3️⃣ Web portal setup

```bash
cd client
npm install
```

> Optional: set `VITE_API_BASE_URL` if your backend is not on `http://localhost:8000`.

### 4️⃣ Android setup

Open the **`FeedbackSDKProject`** folder in Android Studio and let Gradle sync.

---

## ▶️ How to Run

### 🚀 Start the backend

```bash
cd server
source .venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Check it's alive: open [http://localhost:8000/health](http://localhost:8000/health) → `{"status": "ok"}`

### 🌐 Start the web portal

```bash
cd client
npm run dev
```

Then open the printed URL (default [http://localhost:5173](http://localhost:5173)), **register an account**, and copy your **API key** from the Dashboard.

### 📱 Run the Android demo app

1. In `demo-app/src/main/java/com/example/demoapp/MainActivity.kt`, paste your portal API key:

```kotlin
FeedbackSDK.init(this, "PASTE_YOUR_PORTAL_API_KEY", "http://10.0.2.2:8000/")
```

2. Run the **`demo-app`** configuration on an emulator and tap **Send Feedback**.

> 💡 `10.0.2.2` is the Android emulator's alias for your machine's `localhost`. On a physical device, use your computer's LAN IP instead.

### 🧩 Using the SDK in your own app

```kotlin
// Initialize once (e.g. in onCreate)
FeedbackSDK.init(context, "YOUR_API_KEY", "https://your-backend-url/")
FeedbackSDK.setUser("user_001", "user@example.com")
FeedbackSDK.setMetadata("source", "settings_screen")

// Show the default form
FeedbackSDK.showFeedbackDialog(activity)

// Or show a specific named design
FeedbackSDK.showFeedbackDialog(activity, "game_over")
```

---

## 🗂️ Project Structure

```
Seminar/
├── 📱 FeedbackSDKProject/        # Android project (Gradle, Kotlin DSL)
│   ├── feedback-sdk/             # The SDK library module
│   │   └── src/main/java/com/example/feedbacksdk/
│   │       ├── FeedbackSDK.kt    # Public API: init / showFeedbackDialog / setUser / setMetadata
│   │       ├── core/             # Validation, payload building, defaults
│   │       ├── data/             # Retrofit API, repositories, screenshot upload
│   │       ├── model/            # Data models (FeedbackItem, FeedbackDesign, ...)
│   │       ├── ui/               # FeedbackActivity + form rendering
│   │       └── util/             # Device/app collectors, screenshot capture & cache
│   └── demo-app/                 # Sample app that integrates the SDK
│
├── ⚙️ server/                    # FastAPI + Neon PostgreSQL
│   ├── main.py                   # API endpoints (auth, feedback, designs)
│   ├── models.py                 # SQLAlchemy ORM models
│   ├── schemas.py                # Pydantic request/response schemas
│   ├── security.py               # Password hashing, tokens, API keys
│   ├── database.py               # DB engine & session
│   └── requirements.txt
│
└── 🌐 client/                    # React + Vite + TypeScript
    └── src/
        ├── App.tsx               # Layout, routing, state
        ├── api.ts                # Backend API client
        ├── auth.ts               # Session & auth handling
        └── components/           # Dashboard, FeedbackList, DesignEditor, ...
```

---

## 🔒 Permissions

The Android SDK requires a single permission, declared in its manifest:

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

- 🌐 **`INTERNET`** — required to submit feedback and fetch form designs from the backend.

No location, storage, or camera permissions are needed — screenshots are captured from the app's own window.

---

## 👤 Author

**Ido Ben Bassat**
Computer Science — Seminar Project

---

<p align="center">Made with ❤️ and Kotlin · Python · React</p>
