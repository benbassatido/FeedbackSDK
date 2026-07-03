import { getToken, logout } from "./auth";

export function authHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return headers;
}

export function handleUnauthorized(response: Response): void {
  if (response.status === 401) {
    logout();
    window.dispatchEvent(new Event("auth:expired"));
  }
}

export async function parseErrorDetail(response: Response): Promise<string> {
  const fallback = `${response.status} ${response.statusText}`;
  try {
    const body = await response.json();
    return typeof body?.detail === "string" ? body.detail : fallback;
  } catch {
    return fallback;
  }
}
