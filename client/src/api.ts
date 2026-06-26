import { getToken, logout } from "./auth";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export interface DeviceInfo {
  manufacturer?: string;
  model?: string;
  androidVersion?: string;
  locale?: string;
  screenSize?: string;
}

export interface AppInfo {
  packageName?: string;
  appVersionName?: string;
  appVersionCode?: number;
  buildType?: string;
}

export const FEEDBACK_STATUSES = ["pending", "in_progress", "resolved", "archived"] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export interface Feedback {
  feedbackId: string;
  userId: string | null;
  userEmail: string | null;
  answers: Record<string, unknown>;
  metadata: Record<string, string>;
  status: string;
  viewed: boolean;
  createdAt: number;
  updatedAt: number;
  screenshotUrl: string | null;
  deviceInfo: DeviceInfo | null;
  appInfo: AppInfo | null;
}

export type FieldType = "text" | "dropdown" | "rating";

export interface FormField {
  fieldId: string;
  type: FieldType;
  label: string;
  required: boolean;
  order: number;
  options: string[] | null;
  maxLength: number | null;
}

export interface Design {
  id: number;
  name: string;
  title: string;
  description: string | null;
  fields: FormField[];
  backgroundColor: string;
  cardColor: string;
  titleColor: string;
  buttonColor: string;
}

export type DesignInput = Omit<Design, "id">;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    if (response.status === 401) {
      logout();
      window.dispatchEvent(new Event("auth:expired"));
    }
    let detail = `${response.status} ${response.statusText}`;
    try {
      const body = await response.json();
      if (body?.detail) detail = body.detail;
    } catch {
      detail = `${response.status} ${response.statusText}`;
    }
    throw new Error(detail);
  }
  return response.json() as Promise<T>;
}

export function listFeedback(): Promise<Feedback[]> {
  return request<Feedback[]>("/feedback");
}

export function openFeedbackDetails(id: string): Promise<Feedback> {
  return request<Feedback>(`/feedback/${id}`);
}

export function updateFeedbackStatus(id: string, status: FeedbackStatus): Promise<Feedback> {
  return request<Feedback>(`/feedback/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export function markAsViewed(id: string): Promise<Feedback> {
  return request<Feedback>(`/feedback/${id}/viewed`, { method: "PATCH" });
}

export function screenshotUrl(feedback: Feedback): string | null {
  return feedback.screenshotUrl ? `${API_BASE_URL}${feedback.screenshotUrl}` : null;
}

export function listDesigns(): Promise<Design[]> {
  return request<Design[]>("/designs");
}

export function createDesign(design: DesignInput): Promise<Design> {
  return request<Design>("/designs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(design),
  });
}

export function updateDesign(id: number, design: DesignInput): Promise<Design> {
  return request<Design>(`/designs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(design),
  });
}

export function deleteDesign(id: number): Promise<{ deleted: number }> {
  return request<{ deleted: number }>(`/designs/${id}`, { method: "DELETE" });
}
