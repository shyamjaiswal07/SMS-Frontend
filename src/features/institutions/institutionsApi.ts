import apiClient from "@/services/apiClient";

const institutionsResourceEndpoints = {
  schools: "/api/institutions/schools/",
  tenantDomains: "/api/institutions/tenant-domains/",
  subscriptionPlans: "/api/institutions/subscription-plans/",
  tenantSubscriptions: "/api/institutions/tenant-subscriptions/",
  academicYears: "/api/institutions/academic-years/",
  terms: "/api/institutions/terms/",
  departments: "/api/institutions/departments/",
  gradeLevels: "/api/institutions/grade-levels/",
  sections: "/api/institutions/sections/",
  subjects: "/api/institutions/subjects/",
  rooms: "/api/institutions/rooms/",
} as const;

export type InstitutionsResourceKey = keyof typeof institutionsResourceEndpoints;

export const institutionsApi = {
  async createRecord(resource: InstitutionsResourceKey, payload: Record<string, unknown>) {
    const response = await apiClient.post(institutionsResourceEndpoints[resource], payload);
    return response.data;
  },
};
