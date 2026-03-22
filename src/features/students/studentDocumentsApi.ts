import apiClient from "@/services/apiClient";

export const studentDocumentsApi = {
  async createDocument(payload: Record<string, unknown>) {
    const response = await apiClient.post("/api/students/student-documents/", payload);
    return response.data;
  },
};
