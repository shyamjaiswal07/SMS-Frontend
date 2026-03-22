import apiClient from "@/services/apiClient";

type QueryParams = Record<string, unknown>;

async function get(url: string, params?: QueryParams) {
  const response = await apiClient.get(url, params ? { params } : undefined);
  return response.data;
}

async function post(url: string, payload?: unknown) {
  const response = await apiClient.post(url, payload ?? {});
  return response.data;
}

async function patch(url: string, payload: unknown) {
  const response = await apiClient.patch(url, payload);
  return response.data;
}

async function remove(url: string) {
  await apiClient.delete(url);
}

export const operationsApi = {
  automation: {
    async load(tenantId: number) {
      const [
        healthData,
        schoolData,
        academicYearData,
        termData,
        feeCategoryData,
        feeStructureData,
        notificationTemplateData,
      ] = await Promise.all([
        get("/health/worker/"),
        get(`/api/institutions/schools/${tenantId}/`),
        get("/api/institutions/academic-years/", { page: 1, page_size: 100 }),
        get("/api/institutions/terms/", { page: 1, page_size: 100 }),
        get("/api/finance/fee-categories/", { page: 1, page_size: 100 }),
        get("/api/finance/fee-structures/", { page: 1, page_size: 100 }),
        get("/api/communications/notification-templates/", { page: 1, page_size: 100 }),
      ]);

      return {
        healthData,
        schoolData,
        academicYearData,
        termData,
        feeCategoryData,
        feeStructureData,
        notificationTemplateData,
      };
    },
    updateSettings(tenantId: number, settings: Record<string, unknown>) {
      return patch(`/api/institutions/schools/${tenantId}/`, { settings_json: settings });
    },
    runTask(taskType: string) {
      return post("/api/common/automation/run/", { task_type: taskType });
    },
  },
  compliance: {
    listLogs(params?: QueryParams) {
      return get("/api/common/compliance-audit-logs/", { page: 1, page_size: 100, ...params });
    },
  },
  integrations: {
    async load() {
      const [
        connectorData,
        syncData,
        dispatchData,
        webhookData,
        eventData,
        deliveryData,
      ] = await Promise.all([
        get("/api/common/integration-connectors/", { page: 1, page_size: 100 }),
        get("/api/common/integration-sync-runs/", { page: 1, page_size: 100 }),
        get("/api/common/integration-dispatch-logs/", { page: 1, page_size: 100 }),
        get("/api/common/webhook-endpoints/", { page: 1, page_size: 100 }),
        get("/api/common/domain-events/", { page: 1, page_size: 100 }),
        get("/api/common/webhook-deliveries/", { page: 1, page_size: 100 }),
      ]);

      return { connectorData, syncData, dispatchData, webhookData, eventData, deliveryData };
    },
    queueConnectorSync(id: number) {
      return post(`/api/common/integration-connectors/${id}/sync/`, { direction: "EXPORT" });
    },
    deleteConnector(id: number) {
      return remove(`/api/common/integration-connectors/${id}/`);
    },
    dispatchPendingEvents() {
      return post("/api/common/integration-connectors/dispatch-pending-events/", {});
    },
    saveConnector(payload: Record<string, unknown>, id?: number) {
      return id
        ? patch(`/api/common/integration-connectors/${id}/`, payload)
        : post("/api/common/integration-connectors/", payload);
    },
    deleteWebhook(id: number) {
      return remove(`/api/common/webhook-endpoints/${id}/`);
    },
    saveWebhook(payload: Record<string, unknown>, id?: number) {
      return id
        ? patch(`/api/common/webhook-endpoints/${id}/`, payload)
        : post("/api/common/webhook-endpoints/", payload);
    },
  },
  reporting: {
    async load() {
      const [scheduleData, runData] = await Promise.all([
        get("/api/common/scheduled-reports/", { page: 1, page_size: 100 }),
        get("/api/common/scheduled-report-runs/", { page: 1, page_size: 100 }),
      ]);

      return { scheduleData, runData };
    },
    runScheduleNow(id: number) {
      return post(`/api/common/scheduled-reports/${id}/run-now/`, {});
    },
    deleteSchedule(id: number) {
      return remove(`/api/common/scheduled-reports/${id}/`);
    },
    queryReport(payload: Record<string, unknown>) {
      return post("/api/common/reports/query/", payload);
    },
    saveSchedule(payload: Record<string, unknown>, id?: number) {
      return id
        ? patch(`/api/common/scheduled-reports/${id}/`, payload)
        : post("/api/common/scheduled-reports/", payload);
    },
  },
};
