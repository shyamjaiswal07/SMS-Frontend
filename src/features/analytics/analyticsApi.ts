import apiClient from "@/services/apiClient";

type QueryParams = Record<string, string>;

export const analyticsApi = {
  async getOverview(params?: QueryParams) {
    const response = await apiClient.get("/api/common/analytics/overview/", { params });
    return response.data;
  },
  async getModuleDetail(moduleKey: string, params?: QueryParams) {
    const response = await apiClient.get(`/api/common/analytics/${moduleKey}/`, { params });
    return response.data;
  },
};
