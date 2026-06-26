import type { Feedback } from "./api";

export type ExportFormat = "csv" | "json";

function triggerDownload(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function csvCell(value: unknown): string {
  const text = value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(items: Feedback[]): string {
  const headers = [
    "feedbackId",
    "status",
    "viewed",
    "userId",
    "userEmail",
    "createdAt",
    "updatedAt",
    "answers",
    "metadata",
    "hasScreenshot",
  ];
  const rows = items.map((item) =>
    [
      item.feedbackId,
      item.status,
      item.viewed,
      item.userId,
      item.userEmail,
      new Date(item.createdAt).toISOString(),
      new Date(item.updatedAt).toISOString(),
      item.answers,
      item.metadata,
      Boolean(item.screenshotUrl),
    ]
      .map(csvCell)
      .join(","),
  );
  return [headers.join(","), ...rows].join("\n");
}

export function exportFeedback(items: Feedback[], format: ExportFormat = "csv"): void {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  if (format === "json") {
    triggerDownload(JSON.stringify(items, null, 2), `feedback-${stamp}.json`, "application/json");
  } else {
    triggerDownload(toCsv(items), `feedback-${stamp}.csv`, "text/csv");
  }
}
