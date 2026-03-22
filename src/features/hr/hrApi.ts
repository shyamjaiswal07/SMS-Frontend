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

const hrPageEndpoints = {
  staffProfiles: "/api/hr/staff-profiles/",
  employmentHistories: "/api/hr/employment-histories/",
  qualifications: "/api/hr/qualifications/",
  staffDocuments: "/api/hr/staff-documents/",
  leaveTypes: "/api/hr/leave-types/",
  leaveRequests: "/api/hr/leave-requests/",
  payrollStructures: "/api/hr/payroll-structures/",
  payrollComponents: "/api/hr/payroll-components/",
  staffPayrollAssignments: "/api/hr/staff-payroll-assignments/",
  payrollRuns: "/api/hr/payroll-runs/",
} as const;

type HrPageResource = keyof typeof hrPageEndpoints;

export const hrApi = {
  page: {
    async loadWorkspace() {
      const [
        historyData,
        qualificationData,
        documentData,
        leaveTypeData,
        leaveRequestData,
        structureData,
        componentData,
        assignmentData,
        runData,
        payslipData,
      ] = await Promise.all([
        get("/api/hr/employment-histories/", { page: 1, page_size: 200 }),
        get("/api/hr/qualifications/", { page: 1, page_size: 200 }),
        get("/api/hr/staff-documents/", { page: 1, page_size: 200 }),
        get("/api/hr/leave-types/", { page: 1, page_size: 100 }),
        get("/api/hr/leave-requests/", { page: 1, page_size: 100 }),
        get("/api/hr/payroll-structures/", { page: 1, page_size: 100 }),
        get("/api/hr/payroll-components/", { page: 1, page_size: 200 }),
        get("/api/hr/staff-payroll-assignments/", { page: 1, page_size: 200 }),
        get("/api/hr/payroll-runs/", { page: 1, page_size: 100 }),
        get("/api/hr/payslips/", { page: 1, page_size: 200 }),
      ]);

      return {
        historyData,
        qualificationData,
        documentData,
        leaveTypeData,
        leaveRequestData,
        structureData,
        componentData,
        assignmentData,
        runData,
        payslipData,
      };
    },
    saveRecord(resource: HrPageResource, payload: Record<string, unknown>, id?: number | null) {
      return id
        ? patch(`${hrPageEndpoints[resource]}${id}/`, payload)
        : post(hrPageEndpoints[resource], payload);
    },
    deleteRecord(resource: HrPageResource, id: number) {
      return remove(`${hrPageEndpoints[resource]}${id}/`);
    },
    updateLeaveRequestStatus(id: number, status: string) {
      return patch(`/api/hr/leave-requests/${id}/`, { status });
    },
  },
  workflow: {
    async load() {
      const [attendanceData, cycleData, goalData, evaluationData, documentData] = await Promise.all([
        get("/api/hr/staff-attendance/", { page: 1, page_size: 200 }),
        get("/api/hr/performance-cycles/", { page: 1, page_size: 100 }),
        get("/api/hr/performance-goals/", { page: 1, page_size: 200 }),
        get("/api/hr/performance-evaluations/", { page: 1, page_size: 200 }),
        get("/api/hr/staff-documents/", { page: 1, page_size: 200 }),
      ]);

      return { attendanceData, cycleData, goalData, evaluationData, documentData };
    },
    createAttendance(payload: Record<string, unknown>) {
      return post("/api/hr/staff-attendance/", payload);
    },
    getAttendanceSummary(staffId: number) {
      return get("/api/hr/staff-attendance/summary/", { staff_id: staffId });
    },
    createStaffDocument(payload: Record<string, unknown>) {
      return post("/api/hr/staff-documents/", payload);
    },
    createPerformanceCycle(payload: Record<string, unknown>) {
      return post("/api/hr/performance-cycles/", payload);
    },
    createPerformanceGoal(payload: Record<string, unknown>) {
      return post("/api/hr/performance-goals/", payload);
    },
    createPerformanceEvaluation(payload: Record<string, unknown>) {
      return post("/api/hr/performance-evaluations/", payload);
    },
    activatePerformanceCycle(id: number) {
      return post(`/api/hr/performance-cycles/${id}/activate/`, {});
    },
    closePerformanceCycle(id: number) {
      return post(`/api/hr/performance-cycles/${id}/close/`, {});
    },
    submitEvaluation(id: number) {
      return post(`/api/hr/performance-evaluations/${id}/submit/`, {});
    },
    approveEvaluation(id: number) {
      return post(`/api/hr/performance-evaluations/${id}/approve/`, {});
    },
  },
  lifecycle: {
    async load() {
      const [workflowData, checklistData] = await Promise.all([
        get("/api/hr/lifecycle-workflows/", { page: 1, page_size: 200 }),
        get("/api/hr/lifecycle-checklist-items/", { page: 1, page_size: 500 }),
      ]);

      return { workflowData, checklistData };
    },
    getWorkflowDetail(id: number) {
      return Promise.all([
        get(`/api/hr/lifecycle-workflows/${id}/progress/`),
        get(`/api/hr/lifecycle-workflows/${id}/history/`),
      ]).then(([progressData, historyData]) => ({ progressData, historyData }));
    },
    getChecklistHistory(id: number) {
      return get(`/api/hr/lifecycle-checklist-items/${id}/history/`);
    },
    transitionWorkflow(id: number, action: "start" | "complete" | "cancel" | "reopen", reason?: string) {
      return post(
        `/api/hr/lifecycle-workflows/${id}/${action}/`,
        reason?.trim() ? { reason: reason.trim() } : {},
      );
    },
    transitionChecklist(
      id: number,
      action: "start" | "complete" | "skip" | "block" | "reopen",
      note?: string,
    ) {
      return post(
        `/api/hr/lifecycle-checklist-items/${id}/${action}/`,
        note?.trim() ? { note: note.trim() } : {},
      );
    },
    createWorkflow(payload: Record<string, unknown>) {
      return post("/api/hr/lifecycle-workflows/", payload);
    },
    createChecklistItem(payload: Record<string, unknown>) {
      return post("/api/hr/lifecycle-checklist-items/", payload);
    },
  },
  payroll: {
    async load() {
      const [ruleData, runData, payslipData, payslipLineData, taxDocumentData] = await Promise.all([
        get("/api/hr/payroll-tax-benefit-rules/", { page: 1, page_size: 200 }),
        get("/api/hr/payroll-runs/", { page: 1, page_size: 100 }),
        get("/api/hr/payslips/", { page: 1, page_size: 200 }),
        get("/api/hr/payslip-lines/", { page: 1, page_size: 500 }),
        get("/api/hr/payroll-tax-documents/", { page: 1, page_size: 200 }),
      ]);

      return { ruleData, runData, payslipData, payslipLineData, taxDocumentData };
    },
    deleteRule(id: number) {
      return remove(`/api/hr/payroll-tax-benefit-rules/${id}/`);
    },
    processRun(id: number) {
      return post(`/api/hr/payroll-runs/${id}/process/`, {});
    },
    generateTaxDocument(id: number) {
      return post(`/api/hr/payslips/${id}/generate-tax-document/`, {});
    },
    saveRule(payload: Record<string, unknown>, id?: number) {
      return id
        ? patch(`/api/hr/payroll-tax-benefit-rules/${id}/`, payload)
        : post("/api/hr/payroll-tax-benefit-rules/", payload);
    },
  },
};
