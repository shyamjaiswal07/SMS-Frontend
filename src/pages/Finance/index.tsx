import { DollarOutlined, FileTextOutlined, OrderedListOutlined, WalletOutlined } from "@ant-design/icons";
import { Button, Card, Col, Empty, Form, Input, InputNumber, Modal, Row, Select, Space, Statistic, Switch, Table, Tabs, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import apiClient from "@/services/apiClient";

type Role = "SUPER_ADMIN" | "SCHOOL_ADMIN" | "ACCOUNTANT" | "TEACHER" | "STUDENT" | "PARENT" | "HR_MANAGER" | "LIBRARIAN" | "TRANSPORT_COORDINATOR";
type Paginated<T> = { results?: T[] };
type Student = { id: number; student_id?: string; first_name?: string; last_name?: string };
type AcademicYear = { id: number; name?: string };
type Term = { id: number; name?: string };
type FeeCategory = { id: number; name: string; code: string; is_recurring?: boolean };
type Invoice = { id: number; invoice_no: string; student: number; academic_year: number; term?: number | null; status?: string; issue_date?: string; due_date?: string; total_amount?: number | string; due_amount?: number | string };
type InvoiceLine = { id: number; invoice: number; category: number; description: string; quantity?: number | string; unit_amount?: number | string; line_total?: number | string };
type Payment = { id: number; invoice: number; student: number; payment_reference: string; method?: string; status?: string; amount?: number | string; paid_on?: string | null };
type OutstandingSummary = { invoice_count: number; total_invoiced: number | string; total_due: number | string; total_paid: number | string };

type FeeCategoryForm = { name: string; code: string; is_recurring?: boolean };
type InvoiceForm = { student: number; academic_year: number; term?: number; invoice_no: string; issue_date: string; due_date: string; status: string; subtotal_amount: number; discount_amount: number; tax_amount: number; total_amount: number; due_amount: number };
type InvoiceLineForm = { invoice: number; category: number; description: string; quantity: number; unit_amount: number; line_total: number };
type PaymentForm = { invoice: number; student: number; payment_reference: string; method: string; status: string; amount: number; paid_on?: string };

const rowsOf = <T,>(data?: Paginated<T> | T[]) => (Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : []);
const dt = (value?: string | null) => (value ? new Date(value).toLocaleDateString() : "-");

function getRole(): Role | undefined {
  try {
    const raw = sessionStorage.getItem("tenant");
    return raw ? (JSON.parse(raw)?.role as Role | undefined) : undefined;
  } catch {
    return undefined;
  }
}

export default function FinancePage() {
  const role = useMemo(() => getRole(), []);
  const canWrite = role === "SUPER_ADMIN" || role === "SCHOOL_ADMIN" || role === "ACCOUNTANT";

  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<OutstandingSummary>({ invoice_count: 0, total_invoiced: 0, total_due: 0, total_paid: 0 });
  const [students, setStudents] = useState<Student[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [feeCategories, setFeeCategories] = useState<FeeCategory[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceLines, setInvoiceLines] = useState<InvoiceLine[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceLineOpen, setInvoiceLineOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [categoryForm] = Form.useForm<FeeCategoryForm>();
  const [invoiceForm] = Form.useForm<InvoiceForm>();
  const [invoiceLineForm] = Form.useForm<InvoiceLineForm>();
  const [paymentForm] = Form.useForm<PaymentForm>();

  const loadAll = async () => {
    setLoading(true);
    try {
      const settled = await Promise.allSettled([
        apiClient.get("/api/finance/invoices/outstanding-summary/"),
        apiClient.get("/api/students/students/", { params: { page: 1, page_size: 200 } }),
        apiClient.get("/api/institutions/academic-years/", { params: { page: 1, page_size: 100 } }),
        apiClient.get("/api/institutions/terms/", { params: { page: 1, page_size: 100 } }),
        apiClient.get("/api/finance/fee-categories/", { params: { page: 1, page_size: 100 } }),
        apiClient.get("/api/finance/invoices/", { params: { page: 1, page_size: 100 } }),
        apiClient.get("/api/finance/invoice-lines/", { params: { page: 1, page_size: 200 } }),
        apiClient.get("/api/finance/payments/", { params: { page: 1, page_size: 100 } }),
      ]);

      const valueAt = <T,>(index: number, fallback: T) => (settled[index].status === "fulfilled" ? (settled[index] as PromiseFulfilledResult<{ data: T }>).value.data : fallback);

      setSummary(valueAt(0, { invoice_count: 0, total_invoiced: 0, total_due: 0, total_paid: 0 }));
      setStudents(rowsOf<Student>(valueAt(1, [] as Student[])));
      setAcademicYears(rowsOf<AcademicYear>(valueAt(2, [] as AcademicYear[])));
      setTerms(rowsOf<Term>(valueAt(3, [] as Term[])));
      setFeeCategories(rowsOf<FeeCategory>(valueAt(4, [] as FeeCategory[])));
      setInvoices(rowsOf<Invoice>(valueAt(5, [] as Invoice[])));
      setInvoiceLines(rowsOf<InvoiceLine>(valueAt(6, [] as InvoiceLine[])));
      setPayments(rowsOf<Payment>(valueAt(7, [] as Payment[])));
    } catch (error: any) {
      message.error(error?.response?.data?.detail ?? "Failed to load finance workspace");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const studentMap = useMemo(
    () => new Map(students.map((item) => [item.id, `${item.student_id ?? item.id} - ${item.first_name ?? ""} ${item.last_name ?? ""}`.trim()])),
    [students],
  );
  const yearMap = useMemo(() => new Map(academicYears.map((item) => [item.id, item.name ?? `Year #${item.id}`])), [academicYears]);
  const termMap = useMemo(() => new Map(terms.map((item) => [item.id, item.name ?? `Term #${item.id}`])), [terms]);
  const categoryMap = useMemo(() => new Map(feeCategories.map((item) => [item.id, `${item.name} (${item.code})`])), [feeCategories]);
  const invoiceMap = useMemo(() => new Map(invoices.map((item) => [item.id, item.invoice_no])), [invoices]);

  const studentOptions = students.map((item) => ({ value: item.id, label: studentMap.get(item.id) ?? `Student #${item.id}` }));
  const yearOptions = academicYears.map((item) => ({ value: item.id, label: yearMap.get(item.id) ?? `Year #${item.id}` }));
  const termOptions = terms.map((item) => ({ value: item.id, label: termMap.get(item.id) ?? `Term #${item.id}` }));
  const categoryOptions = feeCategories.map((item) => ({ value: item.id, label: categoryMap.get(item.id) ?? item.name }));
  const invoiceOptions = invoices.map((item) => ({ value: item.id, label: item.invoice_no }));

  const invoiceColumns: ColumnsType<Invoice> = [
    { title: "Invoice", dataIndex: "invoice_no", render: (value) => <span className="text-white/85">{value}</span> },
    { title: "Student", dataIndex: "student", render: (value) => <span className="text-white/65">{studentMap.get(value) ?? `Student #${value}`}</span> },
    { title: "Academic Year", dataIndex: "academic_year", render: (value) => <span className="text-white/65">{yearMap.get(value) ?? `Year #${value}`}</span> },
    { title: "Status", dataIndex: "status", render: (value) => <Tag color={value === "PAID" ? "green" : value === "OVERDUE" ? "red" : "blue"}>{value}</Tag> },
    { title: "Issue Date", dataIndex: "issue_date", render: (value) => <span className="text-white/55">{dt(value)}</span> },
    { title: "Due", dataIndex: "due_amount", render: (value) => <span className="text-white/85">{String(value ?? "-")}</span> },
  ];

  const paymentColumns: ColumnsType<Payment> = [
    { title: "Reference", dataIndex: "payment_reference", render: (value) => <span className="text-white/85">{value}</span> },
    { title: "Invoice", dataIndex: "invoice", render: (value) => <span className="text-white/65">{invoiceMap.get(value) ?? `Invoice #${value}`}</span> },
    { title: "Student", dataIndex: "student", render: (value) => <span className="text-white/65">{studentMap.get(value) ?? `Student #${value}`}</span> },
    { title: "Method", dataIndex: "method", render: (value) => <Tag color="blue">{value}</Tag> },
    { title: "Status", dataIndex: "status", render: (value) => <Tag color={value === "SUCCESS" ? "green" : value === "FAILED" ? "red" : "orange"}>{value}</Tag> },
    { title: "Amount", dataIndex: "amount", render: (value) => <span className="text-white/85">{String(value ?? "-")}</span> },
  ];

  const categoryColumns: ColumnsType<FeeCategory> = [
    { title: "Name", dataIndex: "name", render: (value) => <span className="text-white/85">{value}</span> },
    { title: "Code", dataIndex: "code", render: (value) => <code className="text-[var(--cv-accent)]">{value}</code> },
    { title: "Recurring", dataIndex: "is_recurring", render: (value) => <Tag color={value ? "green" : "default"}>{value ? "Yes" : "No"}</Tag> },
  ];

  const invoiceLineColumns: ColumnsType<InvoiceLine> = [
    { title: "Invoice", dataIndex: "invoice", render: (value) => <span className="text-white/65">{invoiceMap.get(value) ?? `Invoice #${value}`}</span> },
    { title: "Category", dataIndex: "category", render: (value) => <span className="text-white/65">{categoryMap.get(value) ?? `Category #${value}`}</span> },
    { title: "Description", dataIndex: "description", render: (value) => <span className="text-white/85">{value}</span> },
    { title: "Qty", dataIndex: "quantity", render: (value) => <span className="text-white/65">{String(value ?? "-")}</span> },
    { title: "Line Total", dataIndex: "line_total", render: (value) => <span className="text-white/85">{String(value ?? "-")}</span> },
  ];

  const createCategory = async () => {
    const values = await categoryForm.validateFields();
    setSubmitting(true);
    try {
      await apiClient.post("/api/finance/fee-categories/", values);
      message.success("Fee category created");
      setCategoryOpen(false);
      categoryForm.resetFields();
      await loadAll();
    } catch (error: any) {
      message.error(error?.response?.data?.detail ?? "Failed to create fee category");
    } finally {
      setSubmitting(false);
    }
  };

  const createInvoice = async () => {
    const values = await invoiceForm.validateFields();
    setSubmitting(true);
    try {
      await apiClient.post("/api/finance/invoices/", values);
      message.success("Invoice created");
      setInvoiceOpen(false);
      invoiceForm.resetFields();
      invoiceForm.setFieldsValue({ status: "DRAFT", discount_amount: 0, tax_amount: 0, subtotal_amount: 0, total_amount: 0, due_amount: 0 });
      await loadAll();
    } catch (error: any) {
      message.error(error?.response?.data?.detail ?? "Failed to create invoice");
    } finally {
      setSubmitting(false);
    }
  };

  const createInvoiceLine = async () => {
    const values = await invoiceLineForm.validateFields();
    setSubmitting(true);
    try {
      await apiClient.post("/api/finance/invoice-lines/", values);
      message.success("Invoice line created");
      setInvoiceLineOpen(false);
      invoiceLineForm.resetFields();
      await loadAll();
    } catch (error: any) {
      message.error(error?.response?.data?.detail ?? "Failed to create invoice line");
    } finally {
      setSubmitting(false);
    }
  };

  const createPayment = async () => {
    const values = await paymentForm.validateFields();
    setSubmitting(true);
    try {
      await apiClient.post("/api/finance/payments/", values);
      message.success("Payment recorded");
      setPaymentOpen(false);
      paymentForm.resetFields();
      paymentForm.setFieldsValue({ status: "SUCCESS", method: "CASH" });
      await loadAll();
    } catch (error: any) {
      message.error(error?.response?.data?.detail ?? "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Typography.Title level={3} className="!mb-0 text-white">
            Finance <span className="text-[var(--cv-accent)]">Workspace</span>
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-white/60">
            Invoices, collections, fee categories, and outstanding summaries mapped directly to the finance APIs.
          </Typography.Paragraph>
        </div>
        <Space wrap>
          <Tag color="gold">{role ?? "UNKNOWN"}</Tag>
          <Button onClick={() => void loadAll()} loading={loading}>Refresh</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}><Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl"><Statistic title={<span className="text-white/60">Invoices</span>} value={summary.invoice_count} prefix={<FileTextOutlined className="text-[var(--cv-accent)]" />} valueStyle={{ color: "#e5e7eb" }} /></Card></Col>
        <Col xs={24} md={12} xl={6}><Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl"><Statistic title={<span className="text-white/60">Total Invoiced</span>} value={Number(summary.total_invoiced ?? 0)} prefix={<DollarOutlined className="text-[var(--cv-accent)]" />} valueStyle={{ color: "#e5e7eb" }} precision={2} /></Card></Col>
        <Col xs={24} md={12} xl={6}><Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl"><Statistic title={<span className="text-white/60">Outstanding</span>} value={Number(summary.total_due ?? 0)} prefix={<WalletOutlined className="text-[var(--cv-accent)]" />} valueStyle={{ color: "#e5e7eb" }} precision={2} /></Card></Col>
        <Col xs={24} md={12} xl={6}><Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl"><Statistic title={<span className="text-white/60">Collected</span>} value={Number(summary.total_paid ?? 0)} prefix={<OrderedListOutlined className="text-[var(--cv-accent)]" />} valueStyle={{ color: "#e5e7eb" }} precision={2} /></Card></Col>
      </Row>

      <Tabs
        defaultActiveKey="invoices"
        items={[
          {
            key: "invoices",
            label: "Invoices",
            children: (
              <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
                <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                  <div>
                    <div className="text-white font-medium">Invoice Register</div>
                    <div className="text-white/55 text-sm">Track tenant invoices, due balances, and term-level billing.</div>
                  </div>
                  {canWrite ? <Button type="primary" className="!rounded-2xl !bg-[var(--cv-accent)] !border-0" onClick={() => { invoiceForm.resetFields(); invoiceForm.setFieldsValue({ status: "DRAFT", discount_amount: 0, tax_amount: 0, subtotal_amount: 0, total_amount: 0, due_amount: 0 }); setInvoiceOpen(true); }}>New Invoice</Button> : null}
                </div>
                <Table rowKey="id" loading={loading} dataSource={invoices} columns={invoiceColumns} pagination={{ pageSize: 8 }} />
              </Card>
            ),
          },
          {
            key: "payments",
            label: "Payments",
            children: (
              <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
                <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                  <div>
                    <div className="text-white font-medium">Payment Log</div>
                    <div className="text-white/55 text-sm">Capture cash, card, bank transfer, and online collections.</div>
                  </div>
                  {canWrite ? <Button type="primary" className="!rounded-2xl !bg-[var(--cv-accent)] !border-0" onClick={() => { paymentForm.resetFields(); paymentForm.setFieldsValue({ method: "CASH", status: "SUCCESS" }); setPaymentOpen(true); }}>Record Payment</Button> : null}
                </div>
                <Table rowKey="id" loading={loading} dataSource={payments} columns={paymentColumns} pagination={{ pageSize: 8 }} />
              </Card>
            ),
          },
          {
            key: "setup",
            label: "Fee Setup",
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} xl={10}>
                  <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl h-full">
                    <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                      <div>
                        <div className="text-white font-medium">Fee Categories</div>
                        <div className="text-white/55 text-sm">Billing heads used by invoices and structures.</div>
                      </div>
                      {canWrite ? <Button onClick={() => { categoryForm.resetFields(); categoryForm.setFieldsValue({ is_recurring: true }); setCategoryOpen(true); }}>Add Category</Button> : null}
                    </div>
                    <Table rowKey="id" loading={loading} dataSource={feeCategories} columns={categoryColumns} pagination={{ pageSize: 6 }} />
                  </Card>
                </Col>
                <Col xs={24} xl={14}>
                  <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl h-full">
                    <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                      <div>
                        <div className="text-white font-medium">Invoice Lines</div>
                        <div className="text-white/55 text-sm">Break down each invoice into concrete billable items.</div>
                      </div>
                      {canWrite ? <Button onClick={() => { invoiceLineForm.resetFields(); invoiceLineForm.setFieldsValue({ quantity: 1, unit_amount: 0, line_total: 0 }); setInvoiceLineOpen(true); }}>Add Invoice Line</Button> : null}
                    </div>
                    {invoiceLines.length ? <Table rowKey="id" loading={loading} dataSource={invoiceLines} columns={invoiceLineColumns} pagination={{ pageSize: 6 }} /> : <Empty description={<span className="text-white/50">No invoice lines available</span>} />}
                  </Card>
                </Col>
              </Row>
            ),
          },
        ]}
      />

      <Modal title="Create Fee Category" open={categoryOpen} onCancel={() => setCategoryOpen(false)} onOk={() => void createCategory()} confirmLoading={submitting}>
        <Form<FeeCategoryForm> form={categoryForm} layout="vertical" requiredMark={false}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="code" label="Code" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="is_recurring" label="Recurring" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>

      <Modal title="Create Invoice" open={invoiceOpen} onCancel={() => setInvoiceOpen(false)} onOk={() => void createInvoice()} confirmLoading={submitting} width={820}>
        <Form<InvoiceForm> form={invoiceForm} layout="vertical" requiredMark={false}>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="student" label="Student" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={studentOptions} /></Form.Item></Col>
            <Col span={12}><Form.Item name="academic_year" label="Academic Year" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={yearOptions} /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="term" label="Term"><Select showSearch optionFilterProp="label" options={termOptions} allowClear /></Form.Item></Col>
            <Col span={12}><Form.Item name="invoice_no" label="Invoice No" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="issue_date" label="Issue Date" rules={[{ required: true }]}><Input type="date" /></Form.Item></Col>
            <Col span={12}><Form.Item name="due_date" label="Due Date" rules={[{ required: true }]}><Input type="date" /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="status" label="Status" rules={[{ required: true }]}><Select options={[{ label: "Draft", value: "DRAFT" }, { label: "Issued", value: "ISSUED" }, { label: "Partial", value: "PARTIAL" }, { label: "Paid", value: "PAID" }, { label: "Overdue", value: "OVERDUE" }, { label: "Cancelled", value: "CANCELLED" }]} /></Form.Item></Col>
            <Col span={12}><Form.Item name="subtotal_amount" label="Subtotal" rules={[{ required: true }]}><InputNumber className="!w-full" /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}><Form.Item name="discount_amount" label="Discount" rules={[{ required: true }]}><InputNumber className="!w-full" /></Form.Item></Col>
            <Col span={8}><Form.Item name="tax_amount" label="Tax" rules={[{ required: true }]}><InputNumber className="!w-full" /></Form.Item></Col>
            <Col span={8}><Form.Item name="total_amount" label="Total" rules={[{ required: true }]}><InputNumber className="!w-full" /></Form.Item></Col>
          </Row>
          <Form.Item name="due_amount" label="Due Amount" rules={[{ required: true }]}><InputNumber className="!w-full" /></Form.Item>
        </Form>
      </Modal>

      <Modal title="Create Invoice Line" open={invoiceLineOpen} onCancel={() => setInvoiceLineOpen(false)} onOk={() => void createInvoiceLine()} confirmLoading={submitting}>
        <Form<InvoiceLineForm> form={invoiceLineForm} layout="vertical" requiredMark={false}>
          <Form.Item name="invoice" label="Invoice" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={invoiceOptions} /></Form.Item>
          <Form.Item name="category" label="Fee Category" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={categoryOptions} /></Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}><Input /></Form.Item>
          <Row gutter={12}>
            <Col span={8}><Form.Item name="quantity" label="Quantity" rules={[{ required: true }]}><InputNumber className="!w-full" /></Form.Item></Col>
            <Col span={8}><Form.Item name="unit_amount" label="Unit Amount" rules={[{ required: true }]}><InputNumber className="!w-full" /></Form.Item></Col>
            <Col span={8}><Form.Item name="line_total" label="Line Total" rules={[{ required: true }]}><InputNumber className="!w-full" /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      <Modal title="Record Payment" open={paymentOpen} onCancel={() => setPaymentOpen(false)} onOk={() => void createPayment()} confirmLoading={submitting}>
        <Form<PaymentForm> form={paymentForm} layout="vertical" requiredMark={false}>
          <Form.Item name="invoice" label="Invoice" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={invoiceOptions} /></Form.Item>
          <Form.Item name="student" label="Student" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={studentOptions} /></Form.Item>
          <Form.Item name="payment_reference" label="Payment Reference" rules={[{ required: true }]}><Input /></Form.Item>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="method" label="Method" rules={[{ required: true }]}><Select options={[{ label: "Cash", value: "CASH" }, { label: "Card", value: "CARD" }, { label: "Bank Transfer", value: "BANK_TRANSFER" }, { label: "UPI", value: "UPI" }, { label: "Online", value: "ONLINE" }]} /></Form.Item></Col>
            <Col span={12}><Form.Item name="status" label="Status" rules={[{ required: true }]}><Select options={[{ label: "Initiated", value: "INITIATED" }, { label: "Success", value: "SUCCESS" }, { label: "Failed", value: "FAILED" }, { label: "Refunded", value: "REFUNDED" }]} /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="amount" label="Amount" rules={[{ required: true }]}><InputNumber className="!w-full" /></Form.Item></Col>
            <Col span={12}><Form.Item name="paid_on" label="Paid On"><Input type="datetime-local" /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
