import { useState } from "react";
import { login, register } from "../auth";
import "./Login.css";

interface Props {
  onLoggedIn: () => void;
}

type Mode = "signin" | "register";

export default function Login({ onLoggedIn }: Props) {
  const [mode, setMode] = useState<Mode>("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "register") {
        await register(fullName, email, password);
      } else {
        await login(email, password);
      }
      onLoggedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const isRegister = mode === "register";

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1 className="login-title">Feedback Portal</h1>
        <p className="login-subtitle">
          {isRegister ? "Create an account to get started" : "Sign in to manage feedback"}
        </p>

        {isRegister && (
          <>
            <label className="field-label" htmlFor="fullName">
              Full name
            </label>
            <input
              id="fullName"
              className="text-input"
              value={fullName}
              autoFocus
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
            />
          </>
        )}

        <label className="field-label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          className="text-input"
          type="email"
          value={email}
          autoFocus={!isRegister}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />

        <label className="field-label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          className="text-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={isRegister ? "At least 6 characters" : "••••••"}
        />

        {error && <p className="login-error">{error}</p>}

        <button className="login-btn" type="submit" disabled={busy}>
          {busy ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
        </button>

        <p className="login-switch">
          {isRegister ? (
            <>
              Already have an account?{" "}
              <button type="button" className="link-btn" onClick={() => switchMode("signin")}>
                Sign in
              </button>
            </>
          ) : (
            <>
              New here?{" "}
              <button type="button" className="link-btn" onClick={() => switchMode("register")}>
                Create an account
              </button>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
