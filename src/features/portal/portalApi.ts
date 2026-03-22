import apiClient from "@/services/apiClient";
import type { PortalDashboardData, PortalDocumentsData, PortalInvoice } from "./portalTypes";

type QueryParams = Record<string, unknown>;
type Paginated<T> = { results?: T[] };

async function get<T>(url: string, params?: QueryParams) {
  const response = await apiClient.get<T>(url, params ? { params } : undefined);
  return response.data;
}

export const portalApi = {
  async loadWorkspace(studentId?: number) {
    const params = studentId ? { student_id: studentId } : undefined;
    const settled = await Promise.allSettled([
      get<PortalDashboardData>("/api/students/portal/dashboard/", params),
      get<PortalDocumentsData>("/api/students/portal/documents/", params),
      get<Paginated<PortalInvoice>>("/api/finance/invoices/", { page: 1, page_size: 200 }),
    ]);

    const dashboardResult = settled[0];
    const documentsResult = settled[1];

    if (dashboardResult.status !== "fulfilled") {
      throw dashboardResult.reason;
    }
    if (documentsResult.status !== "fulfilled") {
      throw documentsResult.reason;
    }

    return {
      dashboardData: dashboardResult.value,
      documentsData: documentsResult.value,
      invoiceData:
        settled[2].status === "fulfilled"
          ? settled[2].value
          : ({ results: [] } as Paginated<PortalInvoice>),
    };
  },
};
