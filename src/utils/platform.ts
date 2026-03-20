import type { AxiosResponseHeaders, RawAxiosResponseHeaders } from "axios";
import axios from "axios";
import apiClient from "@/services/apiClient";

type Paginated<T> = { results?: T[] };

export function rowsOf<T>(data?: Paginated<T> | T[] | null): T[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export function currentTenant():
  | {
      id?: number;
      code?: string;
      name?: string;
      role?: string;
    }
  | null {
  try {
    const raw = sessionStorage.getItem("tenant");
    if (!raw) return null;
    return JSON.parse(raw) as { id?: number; code?: string; name?: string; role?: string };
  } catch {
    return null;
  }
}

export function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

export function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export function parseApiError(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;
  const detail = error.response?.data;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (detail && typeof detail === "object") {
    if (typeof (detail as { detail?: unknown }).detail === "string") {
      return String((detail as { detail?: unknown }).detail);
    }
    const first = Object.values(detail as Record<string, unknown>)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .find((value) => typeof value === "string" && value.trim());
    if (typeof first === "string") return first;
  }
  return fallback;
}

function filenameFromDisposition(
  headers?: AxiosResponseHeaders | Partial<RawAxiosResponseHeaders>,
  fallback = "download",
) {
  const disposition = headers?.["content-disposition"] ?? headers?.["Content-Disposition"];
  if (!disposition || typeof disposition !== "string") return fallback;
  const match = disposition.match(/filename="?([^"]+)"?/i);
  return match?.[1] ?? fallback;
}

export async function downloadFromApi(url: string, fallbackName: string) {
  const response = await apiClient.get<Blob>(url, { responseType: "blob" });
  const blob = new Blob([response.data], { type: response.data.type || "application/octet-stream" });
  const fileName = filenameFromDisposition(response.headers, fallbackName);
  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(objectUrl);
}

export async function downloadPostFromApi(url: string, payload: Record<string, unknown>, fallbackName: string) {
  const response = await apiClient.post<Blob>(url, payload, { responseType: "blob" });
  const blob = new Blob([response.data], { type: response.data.type || "application/octet-stream" });
  const fileName = filenameFromDisposition(response.headers, fallbackName);
  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(objectUrl);
}

export async function fetchHtmlFromApi(url: string) {
  const response = await apiClient.get<string>(url, { responseType: "text" as never });
  return response.data;
}

export function openHtmlPreview(html: string, title = "Preview") {
  const previewWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!previewWindow) return;
  previewWindow.document.open();
  previewWindow.document.write(html);
  previewWindow.document.title = title;
  previewWindow.document.close();
}
