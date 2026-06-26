# 🚀 Getting Started

This guide takes you from a fresh clone to a running system: backend, web portal, and the Android demo app.

---

## ✅ Prerequisites

| Tool | Version | Used by |
|------|---------|---------|
| Android Studio | Latest stable | SDK + demo app |
| JDK | 17+ | Gradle build |
| Python | 3.12+ | Backend |
| Node.js | 18+ | Web portal |
| Neon PostgreSQL | Free tier | Database |

You'll also need a [Neon](https://neon.tech) database and its connection string.

---

## 1️⃣ Clone

```bash
git clone <your-repo-url>
cd "Seminar"
```

The repository layout:

```
Seminar/
├── FeedbackSDKProject/   # Android (SDK + demo app)
├── server/               # FastAPI backend
├── client/               # React web portal
└── docs/                 # You are here
```

---

## 2️⃣ Backend (`server/`)

```bash
cd server
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `server/`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
AUTH_SECRET=change-me-to-a-long-random-string
```

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | ✅ | Neon PostgreSQL connection string |
| `AUTH_SECRET` | ✅ (recommended) | Secret used to sign portal session tokens. Defaults to an insecure dev value if unset. |

Run it:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

> ⚠️ Make sure the virtual environment is active, or `uvicorn` may use the system Python and fail with `ModuleNotFoundError: No module named 'psycopg2'`. You can also run it explicitly with `./.venv/bin/uvicorn ...`.

**Health check:** open [http://localhost:8000/health](http://localhost:8000/health) → `{"status": "ok"}`

On first start, the backend automatically creates tables and runs lightweight schema migrations (adding columns/constraints if missing).

---

## 3️⃣ Web portal (`client/`)

```bash
cd client
npm install
npm run dev
```

Open the printed URL (default [http://localhost:5173](http://localhost:5173)).

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_API_BASE_URL` | ❌ | Backend URL. Defaults to `http://localhost:8000`. |

Then:
1. **Register an account** (full name, email, password).
2. Copy your **API key** from the Dashboard — you'll paste it into the Android app.

A starter **`default`** form design is created automatically for every new account.

---

## 4️⃣ Android (`FeedbackSDKProject/`)

1. Open the `FeedbackSDKProject` folder in Android Studio and let Gradle sync.
2. In `demo-app/src/main/java/com/example/demoapp/MainActivity.kt`, paste your API key:

```kotlin
FeedbackSDK.init(this, "PASTE_YOUR_PORTAL_API_KEY", "http://10.0.2.2:8000/")
```

3. Run the **`demo-app`** configuration on an emulator and tap a **Feedback** button.

> 💡 `10.0.2.2` is the Android emulator's alias for your machine's `localhost`. On a **physical device**, replace it with your computer's LAN IP (e.g. `http://192.168.1.20:8000/`) and make sure both are on the same network.

---

## 🔁 The end-to-end loop

1. Register in the portal → get an API key.
2. Put the API key in the demo app and submit feedback.
3. Watch the feedback appear in the portal's dashboard.
4. (Optional) Create a named design in the portal and reference it from the app via `showFeedbackDialog(activity, "designName")`.

---

## ▶️ Quick start commands (after setup)

```bash
# Terminal 1 — backend
cd server && source .venv/bin/activate && uvicorn main:app --reload --port 8000

# Terminal 2 — portal
cd client && npm run dev
```

Then run the Android app from Android Studio.

Next: read the [Architecture](./architecture.md) or jump to [SDK Usage](./sdk-usage.md).
