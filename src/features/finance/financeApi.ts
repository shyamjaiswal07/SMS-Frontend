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

const financePageEndpoints = {
  feeCategories: "/api/finance/fee-categories/",
  invoices: "/api/finance/invoices/",
  invoiceLines: "/api/finance/invoice-lines/",
  payments: "/api/finance/payments/",
} as const;

type FinancePageResource = keyof typeof financePageEndpoints;

export const financeApi = {
  async loadWorkspace() {
    const [summaryData, feeCategoryData, invoiceData, invoiceLineData, paymentData] = await Promise.all([
      get("/api/finance/invoices/outstanding-summary/"),
      get("/api/finance/fee-categories/", { page: 1, page_size: 100 }),
      get("/api/finance/invoices/", { page: 1, page_size: 100 }),
      get("/api/finance/invoice-lines/", { page: 1, page_size: 200 }),
      get("/api/finance/payments/", { page: 1, page_size: 100 }),
    ]);

    return { summaryData, feeCategoryData, invoiceData, invoiceLineData, paymentData };
  },
  createPageRecord(resource: FinancePageResource, payload: Record<string, unknown>) {
    return post(financePageEndpoints[resource], payload);
  },
  async loadAdvancedCenter() {
    const [
      ledgerAccountData,
      snapshotData,
      budgetPlanData,
      budgetLineData,
      approvalHistoryData,
      invoiceData,
      paymentData,
    ] = await Promise.all([
      get("/api/finance/ledger-accounts/", { page: 1, page_size: 200 }),
      get("/api/finance/financial-statement-snapshots/", { page: 1, page_size: 100 }),
      get("/api/finance/budget-plans/", { page: 1, page_size: 100 }),
      get("/api/finance/budget-lines/", { page: 1, page_size: 200 }),
      get("/api/finance/budget-approval-history/", { page: 1, page_size: 200 }),
      get("/api/finance/invoices/", { page: 1, page_size: 100 }),
      get("/api/finance/payments/", { page: 1, page_size: 100 }),
    ]);

    return {
      ledgerAccountData,
      snapshotData,
      budgetPlanData,
      budgetLineData,
      approvalHistoryData,
      invoiceData,
      paymentData,
    };
  },
  getStatementDrilldown(params: Record<string, unknown>) {
    return get("/api/finance/financial-statements/drilldown/", params);
  },
  submitBudgetPlan(id: number) {
    return post(`/api/finance/budget-plans/${id}/submit/`, {});
  },
  approveBudgetPlan(id: number) {
    return post(`/api/finance/budget-plans/${id}/approve/`, {});
  },
  rejectBudgetPlan(id: number) {
    return post(`/api/finance/budget-plans/${id}/reject/`, {});
  },
  getVarianceReport(id: number) {
    return get(`/api/finance/budget-plans/${id}/variance-report/`);
  },
  generateFinancialStatement(payload: Record<string, unknown>) {
    return post("/api/finance/financial-statements/generate/", payload);
  },
  createBudgetPlan(payload: Record<string, unknown>) {
    return post("/api/finance/budget-plans/", payload);
  },
  createBudgetLine(payload: Record<string, unknown>) {
    return post("/api/finance/budget-lines/", payload);
  },
};
