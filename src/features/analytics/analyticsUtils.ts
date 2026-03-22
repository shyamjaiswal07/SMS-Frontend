export function analyticsMetricLabel(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function analyticsMetricValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }
  return JSON.stringify(value);
}

export function analyticsMetricRows(metrics?: Record<string, unknown>) {
  return Object.entries(metrics ?? {}).map(([key, value]) => ({
    key,
    label: analyticsMetricLabel(key),
    value,
  }));
}

export function analyticsPreviewRows(metrics?: Record<string, unknown>, count = 4) {
  return Object.entries(metrics ?? {}).slice(0, count);
}

export function analyticsProgressValue(metrics?: Record<string, unknown>) {
  const firstNumeric = Object.values(metrics ?? {}).find((value) => typeof value === "number");
  if (typeof firstNumeric !== "number") return undefined;
  return Math.max(0, Math.min(100, Number(firstNumeric)));
}
