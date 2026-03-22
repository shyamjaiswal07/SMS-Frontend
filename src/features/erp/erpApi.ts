import apiClient from "@/services/apiClient";

export type DataSetConfig = {
  key: string;
  title: string;
  endpoint: string;
  params?: Record<string, unknown>;
};

export type SummaryConfig = {
  key: string;
  title: string;
  endpoint: string;
};

const get = async (endpoint: string, params?: Record<string, unknown>) => {
  const response = await apiClient.get(endpoint, { params });
  return response.data;
};

const post = async (endpoint: string, payload: Record<string, unknown>) => {
  const response = await apiClient.post(endpoint, payload);
  return response.data;
};

export const erpApi = {
  fetchDataSet: (config: DataSetConfig) => get(config.endpoint, config.params),
  fetchSummary: (config: SummaryConfig) => get(config.endpoint),
  createRecord: (endpoint: string, payload: Record<string, unknown>) => post(endpoint, payload),
  fetchOptions: (endpoint: string, params?: Record<string, unknown>) => get(endpoint, params),
  reports: {
    async loadLibrary(dueBefore?: string) {
      const [analyticsData, overdueData] = await Promise.all([
        get("/api/library/book-issues/analytics/"),
        get("/api/library/book-issues/overdue-report/", dueBefore ? { due_before: dueBefore } : undefined),
      ]);

      return { analyticsData, overdueData };
    },
    async loadTransport(params?: Record<string, unknown>) {
      const [occupancyData, utilizationData, costTrendData] = await Promise.all([
        get("/api/transport/routes/occupancy-report/"),
        get("/api/transport/student-transport-allocations/utilization-report/", params),
        get("/api/transport/vehicle-maintenance/cost-trend/", params),
      ]);

      return { occupancyData, utilizationData, costTrendData };
    },
    runLibraryLateFees() {
      return post("/api/common/automation/run/", { task_type: "LIBRARY_LATE_FEES" });
    },
  },
};

export const erpModuleConfigs = {
  institutions: {
    dataSets: [
      { key: "schools", title: "Schools", endpoint: "/api/institutions/schools/" },
      { key: "tenant-domains", title: "Tenant Domains", endpoint: "/api/institutions/tenant-domains/" },
      { key: "tenant-subscriptions", title: "Tenant Subscriptions", endpoint: "/api/institutions/tenant-subscriptions/" },
      { key: "subscription-plans", title: "Subscription Plans", endpoint: "/api/institutions/subscription-plans/" },
      { key: "academic-years", title: "Academic Years", endpoint: "/api/institutions/academic-years/" },
      { key: "terms", title: "Terms", endpoint: "/api/institutions/terms/" },
      { key: "departments", title: "Departments", endpoint: "/api/institutions/departments/" },
      { key: "grade-levels", title: "Grade Levels", endpoint: "/api/institutions/grade-levels/" },
      { key: "sections", title: "Sections", endpoint: "/api/institutions/sections/" },
      { key: "subjects", title: "Subjects", endpoint: "/api/institutions/subjects/" },
      { key: "rooms", title: "Rooms", endpoint: "/api/institutions/rooms/" },
    ],
    summaries: [] as SummaryConfig[],
  },
  finance: {
    dataSets: [
      { key: "fee-categories", title: "Fee Categories", endpoint: "/api/finance/fee-categories/" },
      { key: "fee-structures", title: "Fee Structures", endpoint: "/api/finance/fee-structures/" },
      { key: "fee-structure-lines", title: "Fee Structure Lines", endpoint: "/api/finance/fee-structure-lines/" },
      { key: "scholarships", title: "Scholarships", endpoint: "/api/finance/scholarships/" },
      { key: "student-scholarships", title: "Student Scholarships", endpoint: "/api/finance/student-scholarships/" },
      { key: "invoices", title: "Invoices", endpoint: "/api/finance/invoices/" },
      { key: "invoice-lines", title: "Invoice Lines", endpoint: "/api/finance/invoice-lines/" },
      { key: "payments", title: "Payments", endpoint: "/api/finance/payments/" },
      { key: "ledger-accounts", title: "Ledger Accounts", endpoint: "/api/finance/ledger-accounts/" },
      { key: "ledger-entries", title: "Ledger Entries", endpoint: "/api/finance/ledger-entries/" },
    ],
    summaries: [
      { key: "outstanding-summary", title: "Outstanding Summary", endpoint: "/api/finance/invoices/outstanding-summary/" },
    ],
  },
  hr: {
    dataSets: [
      { key: "staff-profiles", title: "Staff Profiles", endpoint: "/api/hr/staff-profiles/" },
      { key: "employment-histories", title: "Employment Histories", endpoint: "/api/hr/employment-histories/" },
      { key: "qualifications", title: "Qualifications", endpoint: "/api/hr/qualifications/" },
      { key: "staff-documents", title: "Staff Documents", endpoint: "/api/hr/staff-documents/" },
      { key: "leave-types", title: "Leave Types", endpoint: "/api/hr/leave-types/" },
      { key: "leave-requests", title: "Leave Requests", endpoint: "/api/hr/leave-requests/" },
      { key: "payroll-structures", title: "Payroll Structures", endpoint: "/api/hr/payroll-structures/" },
      { key: "payroll-components", title: "Payroll Components", endpoint: "/api/hr/payroll-components/" },
      { key: "staff-payroll-assignments", title: "Staff Payroll Assignments", endpoint: "/api/hr/staff-payroll-assignments/" },
      { key: "payroll-runs", title: "Payroll Runs", endpoint: "/api/hr/payroll-runs/" },
      { key: "payslips", title: "Payslips", endpoint: "/api/hr/payslips/" },
    ],
    summaries: [] as SummaryConfig[],
  },
  communications: {
    dataSets: [
      { key: "announcements", title: "Announcements", endpoint: "/api/communications/announcements/" },
      { key: "message-threads", title: "Message Threads", endpoint: "/api/communications/message-threads/" },
      { key: "message-participants", title: "Message Participants", endpoint: "/api/communications/message-participants/" },
      { key: "messages", title: "Messages", endpoint: "/api/communications/messages/" },
      { key: "notifications", title: "Notifications", endpoint: "/api/communications/notifications/" },
    ],
    summaries: [
      { key: "unread-count", title: "Unread Count", endpoint: "/api/communications/notifications/unread-count/" },
    ],
  },
  library: {
    dataSets: [
      { key: "book-categories", title: "Book Categories", endpoint: "/api/library/book-categories/" },
      { key: "books", title: "Books", endpoint: "/api/library/books/" },
      { key: "library-members", title: "Library Members", endpoint: "/api/library/library-members/" },
      { key: "book-issues", title: "Book Issues", endpoint: "/api/library/book-issues/" },
      { key: "book-reservations", title: "Book Reservations", endpoint: "/api/library/book-reservations/" },
    ],
    summaries: [] as SummaryConfig[],
  },
  transport: {
    dataSets: [
      { key: "vehicles", title: "Vehicles", endpoint: "/api/transport/vehicles/" },
      { key: "stops", title: "Stops", endpoint: "/api/transport/stops/" },
      { key: "routes", title: "Routes", endpoint: "/api/transport/routes/" },
      { key: "route-stops", title: "Route Stops", endpoint: "/api/transport/route-stops/" },
      { key: "student-transport-allocations", title: "Student Transport Allocations", endpoint: "/api/transport/student-transport-allocations/" },
      { key: "vehicle-maintenance", title: "Vehicle Maintenance", endpoint: "/api/transport/vehicle-maintenance/" },
    ],
    summaries: [] as SummaryConfig[],
  },
} as const;
