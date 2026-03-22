import { EyeOutlined, FileSearchOutlined, FundProjectionScreenOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, Input, InputNumber, Modal, Row, Select, Space, Table, Tabs, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { financeApi } from "@/features/finance/financeApi";
import { fetchHtmlFromApi, formatDate, formatDateTime, openHtmlPreview, parseApiError, rowsOf } from "@/utils/platform";

type LedgerAccount = { id: number; code: string; name: string; account_type: string };
type StatementResponse = {
  snapshot_id: number;
  statement_type: string;
  period: { start_date: string; end_date: string };
  summary: Record<string, unknown>;
  lines: Record<string, Array<Record<string, unknown>>>;
};
type SnapshotRow = { id: number; statement_type: string; start_date: string; end_date: string; created_at?: string };
type DrilldownResponse = { account_id: number; entries: Array<Record<string, unknown>> };
type BudgetPlan = {
  id: number;
  name: string;
  fiscal_year: string;
  start_date: string;
  end_date: string;
  status: string;
  is_active: boolean;
};
type BudgetLine = { id: number; budget_plan: number; account: number; amount: string | number };
type BudgetApprovalHistory = { id: number; budget_plan: number; action: string; acted_by?: number | null; remark?: string; created_at?: string };
type Invoice = { id: number; invoice_no: string; issue_date?: string; due_date?: string; status?: string; student?: number };
type Payment = { id: number; payment_reference: string; status?: string; amount?: string | number };

type StatementForm = { statement_type: "PROFIT_LOSS" | "BALANCE_SHEET" | "CASH_FLOW"; start_date: string; end_date: string };
type BudgetPlanForm = { name: string; fiscal_year: string; start_date: string; end_date: string; status: string; is_active: boolean };
type BudgetLineForm = { budget_plan: number; account: number; amount: number };

function flattenLines(lines: Record<string, Array<Record<string, unknown>>> | undefined) {
  const flattened: Array<Record<string, unknown>> = [];
  for (const [section, values] of Object.entries(lines ?? {})) {
    for (const row of values) {
      flattened.push({ section, ...row });
    }
  }
  return flattened;
}

export default function FinanceAdvancedCenter() {
  const [statementForm] = Form.useForm<StatementForm>();
  const [budgetPlanForm] = Form.useForm<BudgetPlanForm>();
  const [budgetLineForm] = Form.useForm<BudgetLineForm>();
  const [loading, setLoading] = useState(false);
  const [statementLoading, setStatementLoading] = useState(false);
  const [statement, setStatement] = useState<StatementResponse | null>(null);
  const [drilldown, setDrilldown] = useState<DrilldownResponse | null>(null);
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [varianceOpen, setVarianceOpen] = useState(false);
  const [varianceRows, setVarianceRows] = useState<Array<Record<string, unknown>>>([]);
  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
  const [snapshots, setSnapshots] = useState<SnapshotRow[]>([]);
  const [budgetPlans, setBudgetPlans] = useState<BudgetPlan[]>([]);
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [budgetApprovalHistory, setBudgetApprovalHistory] = useState<BudgetApprovalHistory[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [planOpen, setPlanOpen] = useState(false);
  const [lineOpen, setLineOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const {
        ledgerAccountData,
        snapshotData,
        budgetPlanData,
        budgetLineData,
        approvalHistoryData,
        invoiceData,
        paymentData,
      } = await financeApi.loadAdvancedCenter();

      setAccounts(rowsOf(ledgerAccountData) as LedgerAccount[]);
      setSnapshots(rowsOf(snapshotData) as SnapshotRow[]);
      setBudgetPlans(rowsOf(budgetPlanData) as BudgetPlan[]);
      setBudgetLines(rowsOf(budgetLineData) as BudgetLine[]);
      setBudgetApprovalHistory(rowsOf(approvalHistoryData) as BudgetApprovalHistory[]);
      setInvoices(rowsOf(invoiceData) as Invoice[]);
      setPayments(rowsOf(paymentData) as Payment[]);
    } catch (error) {
      message.error(parseApiError(error, "Failed to load finance advanced workspace"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    statementForm.setFieldsValue({
      statement_type: "PROFIT_LOSS",
      start_date: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 10),
      end_date: new Date().toISOString().slice(0, 10),
    });
    void loadAll();
  }, []);

  const accountMap = useMemo(() => new Map(accounts.map((account) => [account.id, `${account.code} - ${account.name}`])), [accounts]);
  const flattenedStatementRows = useMemo(() => flattenLines(statement?.lines), [statement?.lines]);

  const statementColumns: ColumnsType<Record<string, unknown>> = [
    { title: "Section", dataIndex: "section", render: (value) => <Tag color="blue">{String(value).toUpperCase()}</Tag> },
    { title: "Account", key: "account", render: (_, row) => <span className="text-white/85">{String(row.account_code ?? "-")} - {String(row.account_name ?? "-")}</span> },
    { title: "Type", dataIndex: "account_type", render: (value) => <Tag>{String(value)}</Tag> },
    { title: "Net Amount", dataIndex: "net_amount", render: (value) => <span className="text-white/80">{String(value ?? "0")}</span> },
    {
      title: "Drilldown",
      key: "drilldown",
      render: (_, row) =>
        row.account_id ? (
          <Button
            size="small"
            icon={<FileSearchOutlined />}
            onClick={async () => {
              try {
                const period = statement?.period;
                if (!period) return;
                const response = await financeApi.getStatementDrilldown({
                  account_id: row.account_id,
                  start_date: period.start_date,
                  end_date: period.end_date,
                });
                setDrilldown(response as DrilldownResponse);
                setDrilldownOpen(true);
              } catch (error) {
                message.error(parseApiError(error, "Unable to load drilldown"));
              }
            }}
          >
            View Entries
          </Button>
        ) : null,
    },
  ];

  const budgetPlanColumns: ColumnsType<BudgetPlan> = [
    { title: "Name", dataIndex: "name", render: (value) => <span className="text-white/85">{value}</span> },
    { title: "Fiscal Year", dataIndex: "fiscal_year", render: (value) => <span className="text-white/70">{value}</span> },
    { title: "Status", dataIndex: "status", render: (value) => <Tag color={value === "APPROVED" ? "success" : value === "SUBMITTED" ? "processing" : value === "REJECTED" ? "error" : "default"}>{value}</Tag> },
    { title: "Window", key: "window", render: (_, row) => <span className="text-white/55">{formatDate(row.start_date)} - {formatDate(row.end_date)}</span> },
    {
      title: "Actions",
      key: "actions",
      render: (_, row) => (
        <Space wrap>
          <Button
            size="small"
            onClick={async () => {
              try {
                await financeApi.submitBudgetPlan(row.id);
                message.success("Budget submitted");
                await loadAll();
              } catch (error) {
                message.error(parseApiError(error, "Unable to submit budget"));
              }
            }}
          >
            Submit
          </Button>
          <Button
            size="small"
            onClick={async () => {
              try {
                await financeApi.approveBudgetPlan(row.id);
                message.success("Budget approved");
                await loadAll();
              } catch (error) {
                message.error(parseApiError(error, "Unable to approve budget"));
              }
            }}
          >
            Approve
          </Button>
          <Button
            size="small"
            danger
            onClick={async () => {
              try {
                await financeApi.rejectBudgetPlan(row.id);
                message.success("Budget rejected");
                await loadAll();
              } catch (error) {
                message.error(parseApiError(error, "Unable to reject budget"));
              }
            }}
          >
            Reject
          </Button>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={async () => {
              try {
                const response = await financeApi.getVarianceReport(row.id);
                setVarianceRows((((response as { lines?: Array<Record<string, unknown>> }).lines) ?? []));
                setVarianceOpen(true);
              } catch (error) {
                message.error(parseApiError(error, "Unable to load variance report"));
              }
            }}
          >
            Variance
          </Button>
        </Space>
      ),
    },
  ];

  const printInvoiceColumns: ColumnsType<Invoice> = [
    { title: "Invoice", dataIndex: "invoice_no", render: (value) => <span className="text-white/85">{value}</span> },
    { title: "Issue", dataIndex: "issue_date", render: (value) => <span className="text-white/55">{formatDate(value)}</span> },
    { title: "Due", dataIndex: "due_date", render: (value) => <span className="text-white/55">{formatDate(value)}</span> },
    { title: "Status", dataIndex: "status", render: (value) => <Tag>{value}</Tag> },
    {
      title: "Preview",
      key: "preview",
      render: (_, row) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={async () => {
            try {
              const html = await fetchHtmlFromApi(`/api/finance/invoices/${row.id}/print/`);
              openHtmlPreview(html, `Invoice ${row.invoice_no}`);
            } catch (error) {
              message.error(parseApiError(error, "Unable to open invoice preview"));
            }
          }}
        >
          View
        </Button>
      ),
    },
  ];

  const printPaymentColumns: ColumnsType<Payment> = [
    { title: "Reference", dataIndex: "payment_reference", render: (value) => <span className="text-white/85">{value}</span> },
    { title: "Status", dataIndex: "status", render: (value) => <Tag>{value}</Tag> },
    { title: "Amount", dataIndex: "amount", render: (value) => <span className="text-white/70">{String(value ?? "-")}</span> },
    {
      title: "Receipt",
      key: "preview",
      render: (_, row) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={async () => {
            try {
              const html = await fetchHtmlFromApi(`/api/finance/payments/${row.id}/print-receipt/`);
              openHtmlPreview(html, `Receipt ${row.payment_reference}`);
            } catch (error) {
              message.error(parseApiError(error, "Unable to open receipt preview"));
            }
          }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Typography.Title level={4} className="!mb-0 !text-white">
            Finance Intelligence
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-white/60">
            Sprint 3 and Sprint 5 frontend coverage for statements, drill-downs, budgets, and printable finance artifacts.
          </Typography.Paragraph>
        </div>
        <Button onClick={() => void loadAll()} loading={loading}>
          Refresh
        </Button>
      </div>

      <Tabs
        defaultActiveKey="statements"
        items={[
          {
            key: "statements",
            label: "Statements",
            children: (
              <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
                <Form<StatementForm>
                  form={statementForm}
                  layout="vertical"
                  requiredMark={false}
                  onFinish={async (values) => {
                    setStatementLoading(true);
                    try {
                      const response = await financeApi.generateFinancialStatement(values);
                      setStatement(response as StatementResponse);
                      await loadAll();
                    } catch (error) {
                      message.error(parseApiError(error, "Unable to generate statement"));
                    } finally {
                      setStatementLoading(false);
                    }
                  }}
                >
                  <Row gutter={12}>
                    <Col xs={24} md={8}><Form.Item name="statement_type" label="Statement Type" rules={[{ required: true }]}><Select options={[{ label: "Profit & Loss", value: "PROFIT_LOSS" }, { label: "Balance Sheet", value: "BALANCE_SHEET" }, { label: "Cash Flow", value: "CASH_FLOW" }]} /></Form.Item></Col>
                    <Col xs={24} md={8}><Form.Item name="start_date" label="Start Date" rules={[{ required: true }]}><Input type="date" /></Form.Item></Col>
                    <Col xs={24} md={8}><Form.Item name="end_date" label="End Date" rules={[{ required: true }]}><Input type="date" /></Form.Item></Col>
                  </Row>
                  <Button htmlType="submit" type="primary" loading={statementLoading} className="!rounded-2xl !bg-[var(--cv-accent)] !border-0" icon={<FundProjectionScreenOutlined />}>
                    Generate Statement
                  </Button>
                </Form>

                {statement ? (
                  <div className="mt-5 space-y-4">
                    <div className="grid gap-3 md:grid-cols-3">
                      {Object.entries(statement.summary ?? {}).map(([key, value]) => (
                        <div key={key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="text-white/45 text-xs uppercase tracking-wide">{key.replace(/_/g, " ")}</div>
                          <div className="mt-2 text-white font-semibold">{String(value)}</div>
                        </div>
                      ))}
                    </div>
                    <Table rowKey={(row) => `${row.section}-${row.account_id ?? row.account_code}`} dataSource={flattenedStatementRows} columns={statementColumns} pagination={{ pageSize: 8 }} />
                  </div>
                ) : null}

                <div className="mt-6 text-white font-medium mb-3">Saved Snapshots</div>
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={snapshots}
                  columns={[
                    { title: "ID", dataIndex: "id" },
                    { title: "Type", dataIndex: "statement_type", render: (value) => <Tag color="blue">{value}</Tag> },
                    { title: "Start", dataIndex: "start_date", render: (value) => formatDate(value) },
                    { title: "End", dataIndex: "end_date", render: (value) => formatDate(value) },
                    { title: "Created", dataIndex: "created_at", render: (value) => formatDateTime(value) },
                  ]}
                  pagination={{ pageSize: 5 }}
                />
              </Card>
            ),
          },
          {
            key: "budgets",
            label: "Budgets",
            children: (
              <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
                <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                  <div>
                    <div className="text-white font-medium">Budget Planning + Variance</div>
                    <div className="text-white/55 text-sm">Create plans and lines, move them through approval, and compare against actual ledger activity.</div>
                  </div>
                  <Space wrap>
                    <Button
                      onClick={() => {
                        budgetPlanForm.resetFields();
                        budgetPlanForm.setFieldsValue({ status: "DRAFT", is_active: true });
                        setPlanOpen(true);
                      }}
                    >
                      New Budget Plan
                    </Button>
                    <Button
                      type="primary"
                      className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
                      onClick={() => {
                        budgetLineForm.resetFields();
                        setLineOpen(true);
                      }}
                    >
                      Add Budget Line
                    </Button>
                  </Space>
                </div>
                <Table rowKey="id" loading={loading} dataSource={budgetPlans} columns={budgetPlanColumns} pagination={{ pageSize: 6 }} />

                <Row gutter={[16, 16]} className="mt-6">
                  <Col xs={24} xl={12}>
                    <Card className="!bg-white/5 !border-white/10 !rounded-3xl h-full">
                      <div className="text-white font-medium mb-3">Budget Lines</div>
                      <Table
                        rowKey="id"
                        dataSource={budgetLines}
                        columns={[
                          { title: "Plan", dataIndex: "budget_plan", render: (value) => <span className="text-white/70">#{value}</span> },
                          { title: "Account", dataIndex: "account", render: (value) => <span className="text-white/85">{accountMap.get(value) ?? `#${value}`}</span> },
                          { title: "Amount", dataIndex: "amount", render: (value) => <span className="text-white/70">{String(value)}</span> },
                        ]}
                        pagination={{ pageSize: 5 }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} xl={12}>
                    <Card className="!bg-white/5 !border-white/10 !rounded-3xl h-full">
                      <div className="text-white font-medium mb-3">Approval History</div>
                      <Table
                        rowKey="id"
                        dataSource={budgetApprovalHistory}
                        columns={[
                          { title: "Plan", dataIndex: "budget_plan", render: (value) => <span className="text-white/70">#{value}</span> },
                          { title: "Action", dataIndex: "action", render: (value) => <Tag>{value}</Tag> },
                          { title: "Actor", dataIndex: "acted_by", render: (value) => <span className="text-white/70">{value ? `User #${value}` : "-"}</span> },
                          { title: "Remark", dataIndex: "remark", render: (value) => <span className="text-white/55">{value || "-"}</span> },
                          { title: "When", dataIndex: "created_at", render: (value) => <span className="text-white/55">{formatDateTime(value)}</span> },
                        ]}
                        pagination={{ pageSize: 5 }}
                      />
                    </Card>
                  </Col>
                </Row>
              </Card>
            ),
          },
          {
            key: "print",
            label: "Invoice / Receipt Viewer",
            children: (
              <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
                <div className="grid gap-4 xl:grid-cols-2">
                  <Card className="!bg-white/5 !border-white/10 !rounded-3xl">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <div className="text-white font-medium">Printable Invoices</div>
                        <div className="text-white/55 text-sm">Open printer-friendly invoice HTML generated by the backend.</div>
                      </div>
                    </div>
                    <Table rowKey="id" dataSource={invoices} columns={printInvoiceColumns} pagination={{ pageSize: 5 }} />
                  </Card>

                  <Card className="!bg-white/5 !border-white/10 !rounded-3xl">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <div className="text-white font-medium">Printable Receipts</div>
                        <div className="text-white/55 text-sm">Preview payment receipts and use browser print/download actions.</div>
                      </div>
                    </div>
                    <Table rowKey="id" dataSource={payments} columns={printPaymentColumns} pagination={{ pageSize: 5 }} />
                  </Card>
                </div>
              </Card>
            ),
          },
        ]}
      />

      <Modal title="Statement Drilldown" open={drilldownOpen} footer={null} onCancel={() => setDrilldownOpen(false)} width={860}>
        <Table
          rowKey={(row) => String(row.id)}
          dataSource={drilldown?.entries ?? []}
          columns={[
            { title: "Date", dataIndex: "entry_date", render: (value) => formatDate(String(value)) },
            { title: "Reference Type", dataIndex: "reference_type" },
            { title: "Reference ID", dataIndex: "reference_id" },
            { title: "Narration", dataIndex: "narration" },
            { title: "Debit", dataIndex: "debit_amount" },
            { title: "Credit", dataIndex: "credit_amount" },
          ]}
          pagination={{ pageSize: 8 }}
        />
      </Modal>

      <Modal title="Variance Report" open={varianceOpen} footer={null} onCancel={() => setVarianceOpen(false)} width={920}>
        <Table
          rowKey={(row) => `${row.account_id}`}
          dataSource={varianceRows}
          columns={[
            { title: "Account", key: "account", render: (_, row) => <span>{String(row.account_code)} - {String(row.account_name)}</span> },
            { title: "Type", dataIndex: "account_type" },
            { title: "Budget", dataIndex: "budget_amount" },
            { title: "Actual", dataIndex: "actual_amount" },
            { title: "Variance", dataIndex: "variance_amount" },
            { title: "Variance %", dataIndex: "variance_pct" },
          ]}
          pagination={{ pageSize: 8 }}
        />
      </Modal>

      <Modal
        title="Create Budget Plan"
        open={planOpen}
        onCancel={() => setPlanOpen(false)}
        confirmLoading={submitting}
        onOk={() => {
          void budgetPlanForm.validateFields().then(async (values) => {
            setSubmitting(true);
            try {
              await financeApi.createBudgetPlan(values);
              message.success("Budget plan created");
              setPlanOpen(false);
              await loadAll();
            } catch (error) {
              message.error(parseApiError(error, "Unable to create budget plan"));
            } finally {
              setSubmitting(false);
            }
          });
        }}
      >
        <Form<BudgetPlanForm> form={budgetPlanForm} layout="vertical" requiredMark={false}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="fiscal_year" label="Fiscal Year" rules={[{ required: true }]}><Input placeholder="2026-27" /></Form.Item>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="start_date" label="Start Date" rules={[{ required: true }]}><Input type="date" /></Form.Item></Col>
            <Col span={12}><Form.Item name="end_date" label="End Date" rules={[{ required: true }]}><Input type="date" /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="status" label="Status" rules={[{ required: true }]}><Select options={[{ label: "Draft", value: "DRAFT" }, { label: "Submitted", value: "SUBMITTED" }, { label: "Approved", value: "APPROVED" }, { label: "Rejected", value: "REJECTED" }]} /></Form.Item></Col>
            <Col span={12}><Form.Item name="is_active" label="Enabled" rules={[{ required: true }]}><Select options={[{ label: "Enabled", value: true }, { label: "Disabled", value: false }]} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="Add Budget Line"
        open={lineOpen}
        onCancel={() => setLineOpen(false)}
        confirmLoading={submitting}
        onOk={() => {
          void budgetLineForm.validateFields().then(async (values) => {
            setSubmitting(true);
            try {
              await financeApi.createBudgetLine(values);
              message.success("Budget line created");
              setLineOpen(false);
              await loadAll();
            } catch (error) {
              message.error(parseApiError(error, "Unable to create budget line"));
            } finally {
              setSubmitting(false);
            }
          });
        }}
      >
        <Form<BudgetLineForm> form={budgetLineForm} layout="vertical" requiredMark={false}>
          <Form.Item name="budget_plan" label="Budget Plan" rules={[{ required: true }]}>
            <Select options={budgetPlans.map((plan) => ({ value: plan.id, label: `${plan.name} (${plan.fiscal_year})` }))} />
          </Form.Item>
          <Form.Item name="account" label="Ledger Account" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" options={accounts.map((account) => ({ value: account.id, label: accountMap.get(account.id) ?? account.name }))} />
          </Form.Item>
          <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
            <InputNumber className="!w-full" min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
