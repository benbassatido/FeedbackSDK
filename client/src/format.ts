export function formatDate(epochMillis: number): string {
  if (!epochMillis) return "-";
  return new Date(epochMillis).toLocaleString();
}

export function stringify(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function previewText(value: unknown, max = 60): string {
  const text = stringify(value);
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
