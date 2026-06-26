import type { Feedback } from "./api";

export interface FeedbackFilters {
  status: string;
  type: string;
  onlyUnviewed: boolean;
  onlyWithScreenshot: boolean;
}

export const EMPTY_FILTERS: FeedbackFilters = {
  status: "",
  type: "",
  onlyUnviewed: false,
  onlyWithScreenshot: false,
};

export function searchFeedback(items: Feedback[], query: string): Feedback[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => {
    const haystack = [
      item.feedbackId,
      item.userId ?? "",
      item.userEmail ?? "",
      item.status,
      ...Object.values(item.answers).map((v) => String(v ?? "")),
      ...Object.values(item.metadata).map((v) => String(v ?? "")),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function filterFeedback(items: Feedback[], filters: FeedbackFilters): Feedback[] {
  return items.filter((item) => {
    if (filters.status && item.status !== filters.status) return false;
    if (filters.type && String(item.answers["feedback_type"] ?? "") !== filters.type) return false;
    if (filters.onlyUnviewed && item.viewed) return false;
    if (filters.onlyWithScreenshot && !item.screenshotUrl) return false;
    return true;
  });
}

export function feedbackTypes(items: Feedback[]): string[] {
  const set = new Set<string>();
  for (const item of items) {
    const t = item.answers["feedback_type"];
    if (t != null && String(t).trim()) set.add(String(t));
  }
  return Array.from(set).sort();
}
