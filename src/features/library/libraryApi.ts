import apiClient from "@/services/apiClient";
import { downloadFromApi } from "@/utils/platform";

const libraryResourceEndpoints = {
  bookCategories: "/api/library/book-categories/",
  books: "/api/library/books/",
  libraryMembers: "/api/library/library-members/",
  bookIssues: "/api/library/book-issues/",
  bookReservations: "/api/library/book-reservations/",
} as const;

export type LibraryResourceKey = keyof typeof libraryResourceEndpoints;

export const libraryApi = {
  async createRecord(resource: LibraryResourceKey, payload: Record<string, unknown>) {
    const response = await apiClient.post(libraryResourceEndpoints[resource], payload);
    return response.data;
  },
  runLateFees() {
    return apiClient.post("/api/common/automation/run/", { task_type: "LIBRARY_LATE_FEES" });
  },
  async downloadOverdueReport(dueBefore: string | undefined, format: "CSV" | "XLSX") {
    const query = dueBefore ? `?due_before=${encodeURIComponent(dueBefore)}&export_format=${format}` : `?export_format=${format}`;
    await downloadFromApi(`/api/library/book-issues/overdue-report/${query}`, `library-overdue-report.${format.toLowerCase()}`);
  },
};
