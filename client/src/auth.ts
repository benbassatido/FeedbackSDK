import { API_BASE_URL } from "./api";
import { parseErrorDetail } from "./http";

const AUTH_KEY = "feedback_portal_session";

export interface Session {
  token: string;
  email: string;
  fullName: string;
  apiKey: string;
}

interface AuthResponse {
  token: string;
  email: string;
  fullName: string;
  apiKey: string;
}

async function authRequest(path: string, body: unknown): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(await parseErrorDetail(response));
  }
  return response.json() as Promise<AuthResponse>;
}

function persist(user: AuthResponse): Session {
  const session: Session = {
    token: user.token,
    email: user.email,
    fullName: user.fullName,
    apiKey: user.apiKey,
  };
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));
  return session;
}

export async function register(
  fullName: string,
  email: string,
  password: string,
): Promise<Session> {
  const user = await authRequest("/auth/register", { fullName, email, password });
  return persist(user);
}

export async function login(email: string, password: string): Promise<Session> {
  const user = await authRequest("/auth/login", { email, password });
  return persist(user);
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY);
}

export function getSession(): Session | null {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return getSession()?.token ?? null;
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}
