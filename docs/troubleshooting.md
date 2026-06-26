# 🛠️ Troubleshooting

Common problems across the backend, web portal, and Android app — with fixes.

---

## ⚙️ Backend

### `ModuleNotFoundError: No module named 'psycopg2'`

`uvicorn` is running with the system Python instead of the virtual environment.

```bash
cd server
source .venv/bin/activate
uvicorn main:app --reload --port 8000
# or run the venv binary directly:
./.venv/bin/uvicorn main:app --reload --port 8000
```

### `[Errno 48] Address already in use`

Port `8000` is taken by a previous run.

```bash
lsof -ti tcp:8000 | xargs kill -9
```

### Can't connect to the database

- Check `DATABASE_URL` in `server/.env` and that it ends with `?sslmode=require` (Neon requires SSL).
- Make sure the `.env` file is in the `server/` folder and the server was started from there.

### `localhost:8000` won't open

Confirm the server is actually running and listening, then hit the health check: [http://localhost:8000/health](http://localhost:8000/health) should return `{"status": "ok"}`. The interactive docs are at `/docs`.

---

## 🌐 Web portal

### A leftover `web-portal/` (or stray `.vite/`) folder

The portal now lives in `client/`. A leftover `web-portal/.vite` is just a stale Vite cache from before the rename and is safe to delete:

```bash
rm -rf web-portal
```

Vite regenerates its cache under `client/node_modules/.vite` on the next `npm run dev`.

### Calls fail with CORS or wrong host

Set `VITE_API_BASE_URL` if the backend isn't at `http://localhost:8000`. The backend allows all origins by default, so CORS shouldn't block local development.

### Logged out unexpectedly

Session tokens expire after 7 days. Any `401` triggers an automatic logout — just sign in again.

---

## 📱 Android

### The form is white/light when I expected my custom (e.g. dark) design

The SDK couldn't reach the backend and fell back to its **built-in default** design. Usually a base-URL problem:

- **Emulator:** use `http://10.0.2.2:8000/` (alias for your machine's localhost).
- **Physical device:** use your computer's **LAN IP** (e.g. `http://192.168.1.20:8000/`) and ensure both devices are on the same Wi-Fi. `10.0.2.2` only works on the emulator.
- Confirm the backend is running and reachable from the device's browser.

### The modal is white but the background is dark (or vice-versa)

Each design controls four separate colors — `backgroundColor`, `cardColor`, `titleColor`, `buttonColor`. Set them all in the portal's design editor so the screen and the card match.

### `AAPT: error: resource mipmap/ic_launcher not found`

The demo app references a launcher icon that doesn't exist. Either add the icon resource or remove the `android:icon` attribute from the demo app's `AndroidManifest.xml`.

### Cleartext HTTP blocked

Local development uses plain `http://`. The SDK ships with a network-security configuration allowing cleartext for development. In production, serve the backend over **HTTPS** and use an `https://` base URL.

### Feedback isn't showing up in the portal

1. Make sure the **API key** in `FeedbackSDK.init(...)` matches the one on your portal Dashboard — feedback is scoped to that account.
2. If the device was offline, the item is **queued** and will send when connectivity returns or on the next app launch (see [Offline Handling](./offline-handling.md)).
3. Check the backend logs / `POST /feedback` for a `401` (bad API key).

---

## 🔨 Build & environment

### Gradle can't find a Java runtime

Install JDK 17+ and point Android Studio (and `JAVA_HOME`) at it. Android Studio bundles a compatible JDK under **Settings → Build Tools → Gradle → Gradle JDK**.

### Where are the interactive API docs?

While the backend runs: Swagger UI at `http://localhost:8000/docs`, ReDoc at `http://localhost:8000/redoc`.

---

Still stuck? Re-check [Getting Started](./getting-started.md) end-to-end, and verify each layer in isolation: backend health → portal login → SDK submission.
