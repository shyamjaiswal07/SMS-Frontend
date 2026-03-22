import { FileTextOutlined, ReloadOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, Input, InputNumber, Modal, Popconfirm, Row, Select, Space, Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { hrApi } from "@/features/hr/hrApi";
import { useGetStaffProfilesQuery } from "@/features/hr/hrApiSlice";
import { downloadFromApi, formatDate, formatDateTime, parseApiError, rowsOf } from "@/utils/platform";

type StaffRow = {
  id: number;
  employee_code?: string;
  first_name?: string;
  last_name?: string;
};

type PayrollRuleRow = {
  id: number;
  name: string;
  code: string;
  rule_type: "TAX" | "BENEFIT";
  calculation_type: "PERCENT" | "FIXED";
  value: string | number;
  max_amount?: string | number | null;
  applies_from?: string | null;
  applies_to?: string | null;
  is_pre_tax: boolean;
  is_active?: boolean;
};

type PayrollRunRow = {
  id: number;
  run_year: number;
  run_month: number;
  status?: string;
  processed_at?: string | null;
};

type PayslipRow = {
  id: number;
  payroll_run: number;
  staff: number;
  basic_salary?: string | number;
  gross_salary?: string | number;
  total_deductions?: string | number;
  net_salary?: string | number;
  generated_on?: string;
  paid_on?: string | null;
};

type PayslipLineRow = {
  id: number;
  payslip: number;
  line_type?: string;
  code?: string;
  name?: string;
  amount?: string | number;
};

type PayrollTaxDocumentRow = {
  id: number;
  payslip: number;
  file_asset?: number | null;
  document_no?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
};

type RuleForm = {
  name: string;
  code: string;
  rule_type: "TAX" | "BENEFIT";
  calculation_type: "PERCENT" | "FIXED";
  value: number;
  max_amount?: number;
  applies_from?: string;
  applies_to?: string;
  is_pre_tax: boolean;
  is_active: boolean;
};

function cleanPayload<T extends Record<string, unknown>>(values: T) {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );
}

export default function PayrollDocumentCenter() {
  const [ruleForm] = Form.useForm<RuleForm>();
  const { data: staffData, isFetching: staffLoading, refetch: refetchStaff } = useGetStaffProfilesQuery({ page: 1, page_size: 200 });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ruleOpen, setRuleOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PayrollRuleRow | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<number | undefined>();
  const [selectedPayslipId, setSelectedPayslipId] = useState<number | undefined>();
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [rules, setRules] = useState<PayrollRuleRow[]>([]);
  const [runs, setRuns] = useState<PayrollRunRow[]>([]);
  const [payslips, setPayslips] = useState<PayslipRow[]>([]);
  const [payslipLines, setPayslipLines] = useState<PayslipLineRow[]>([]);
  const [taxDocuments, setTaxDocuments] = useState<PayrollTaxDocumentRow[]>([]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const { ruleData, runData, payslipData, payslipLineData, taxDocumentData } = await hrApi.payroll.load();
      setRules(rowsOf(ruleData) as PayrollRuleRow[]);
      setRuns(rowsOf(runData) as PayrollRunRow[]);
      setPayslips(rowsOf(payslipData) as PayslipRow[]);
      setPayslipLines(rowsOf(payslipLineData) as PayslipLineRow[]);
      setTaxDocuments(rowsOf(taxDocumentData) as PayrollTaxDocumentRow[]);
    } catch (error) {
      message.error(parseApiError(error, "Failed to load payroll workspace"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    setStaff(rowsOf(staffData) as StaffRow[]);
  }, [staffData]);

  const pageLoading = loading || staffLoading;

  const refreshAll = async () => {
    await Promise.all([loadAll(), refetchStaff()]);
  };

  const staffMap = useMemo(
    () =>
      new Map(
        staff.map((item) => [
          item.id,
          `${item.employee_code ?? item.id} - ${item.first_name ?? ""} ${item.last_name ?? ""}`.trim(),
        ]),
      ),
    [staff],
  );
  const runMap = useMemo(
    () =>
      new Map(
        runs.map((item) => [
          item.id,
          `${String(item.run_month).padStart(2, "0")}/${item.run_year}`,
        ]),
      ),
    [runs],
  );

  const visiblePayslips = useMemo(
    () => (selectedRunId ? payslips.filter((item) => item.payroll_run === selectedRunId) : payslips),
    [payslips, selectedRunId],
  );

  const visiblePayslipLines = useMemo(
    () => (selectedPayslipId ? payslipLines.filter((item) => item.payslip === selectedPayslipId) : payslipLines),
    [payslipLines, selectedPayslipId],
  );

  const visibleTaxDocs = useMemo(
    () => (selectedPayslipId ? taxDocuments.filter((item) => item.payslip === selectedPayslipId) : taxDocuments),
    [selectedPayslipId, taxDocuments],
  );

  const ruleColumns: ColumnsType<PayrollRuleRow> = [
    { title: "Rule", key: "rule", render: (_, row) => <span className="text-white/85">{row.name} <span className="text-white/45">({row.code})</span></span> },
    { title: "Type", dataIndex: "rule_type", render: (value) => <Tag color={value === "TAX" ? "error" : "success"}>{value}</Tag> },
    { title: "Calculation", dataIndex: "calculation_type", render: (value) => <Tag>{value}</Tag> },
    { title: "Value", dataIndex: "value", render: (value) => <span className="text-white/75">{String(value)}</span> },
    { title: "Cap", dataIndex: "max_amount", render: (value) => <span className="text-white/55">{value ?? "-"}</span> },
    { title: "Window", key: "window", render: (_, row) => <span className="text-white/55">{formatDate(row.applies_from)} - {formatDate(row.applies_to)}</span> },
    { title: "Pre Tax", dataIndex: "is_pre_tax", render: (value) => <Tag color={value ? "blue" : "default"}>{value ? "Yes" : "No"}</Tag> },
    { title: "Active", dataIndex: "is_active", render: (value) => <Tag color={value ? "success" : "default"}>{value ? "Enabled" : "Disabled"}</Tag> },
    {
      title: "Actions",
      key: "actions",
      render: (_, row) => (
        <Space wrap>
          <Button
            size="small"
            onClick={() => {
              setEditingRule(row);
              ruleForm.setFieldsValue({
                name: row.name,
                code: row.code,
                rule_type: row.rule_type,
                calculation_type: row.calculation_type,
                value: Number(row.value ?? 0),
                max_amount: row.max_amount === null || row.max_amount === undefined ? undefined : Number(row.max_amount),
                applies_from: row.applies_from ?? undefined,
                applies_to: row.applies_to ?? undefined,
                is_pre_tax: row.is_pre_tax,
                is_active: row.is_active ?? true,
              });
              setRuleOpen(true);
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this tax / benefit rule?"
            onConfirm={async () => {
              try {
                await hrApi.payroll.deleteRule(row.id);
                message.success("Rule deleted");
                await loadAll();
              } catch (error) {
                message.error(parseApiError(error, "Unable to delete payroll rule"));
              }
            }}
          >
            <Button size="small" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const runColumns: ColumnsType<PayrollRunRow> = [
    { title: "Period", key: "period", render: (_, row) => <span className="text-white/85">{runMap.get(row.id)}</span> },
    { title: "Status", dataIndex: "status", render: (value) => <Tag color={value === "PROCESSED" ? "success" : "processing"}>{value}</Tag> },
    { title: "Processed At", dataIndex: "processed_at", render: (value) => <span className="text-white/55">{formatDateTime(value)}</span> },
    {
      title: "Actions",
      key: "actions",
      render: (_, row) => (
        <Space wrap>
          <Button
            size="small"
            onClick={() => {
              setSelectedRunId(row.id);
              setSelectedPayslipId(undefined);
            }}
          >
            Focus Payslips
          </Button>
          <Button
            size="small"
            type="primary"
            className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
            onClick={async () => {
              try {
                const response = await hrApi.payroll.processRun(row.id);
                message.success(`Payroll processed for ${(response as { processed?: number }).processed ?? 0} staff`);
                setSelectedRunId(row.id);
                await loadAll();
              } catch (error) {
                message.error(parseApiError(error, "Unable to process payroll run"));
              }
            }}
          >
            Process Run
          </Button>
        </Space>
      ),
    },
  ];

  const payslipColumns: ColumnsType<PayslipRow> = [
    { title: "Run", dataIndex: "payroll_run", render: (value) => <span className="text-white/70">{runMap.get(value) ?? `#${value}`}</span> },
    { title: "Staff", dataIndex: "staff", render: (value) => <span className="text-white/85">{staffMap.get(value) ?? `#${value}`}</span> },
    { title: "Gross", dataIndex: "gross_salary", render: (value) => <span className="text-white/70">{String(value ?? "-")}</span> },
    { title: "Deductions", dataIndex: "total_deductions", render: (value) => <span className="text-white/70">{String(value ?? "-")}</span> },
    { title: "Net", dataIndex: "net_salary", render: (value) => <span className="text-white/85">{String(value ?? "-")}</span> },
    { title: "Generated", dataIndex: "generated_on", render: (value) => <span className="text-white/55">{formatDate(value)}</span> },
    {
      title: "Actions",
      key: "actions",
      render: (_, row) => (
        <Space wrap>
          <Button
            size="small"
            onClick={() => setSelectedPayslipId(row.id)}
          >
            Inspect Lines
          </Button>
          <Button
            size="small"
            icon={<SafetyCertificateOutlined />}
            onClick={async () => {
              try {
                const response = await hrApi.payroll.generateTaxDocument(row.id);
                message.success(`Tax document ${(response as { document_no?: string }).document_no ?? ""} generated`);
                setSelectedPayslipId(row.id);
                await loadAll();
              } catch (error) {
                message.error(parseApiError(error, "Unable to generate tax document"));
              }
            }}
          >
            Generate Tax Doc
          </Button>
        </Space>
      ),
    },
  ];

  const payslipLineColumns: ColumnsType<PayslipLineRow> = [
    { title: "Payslip", dataIndex: "payslip", render: (value) => <span className="text-white/70">#{value}</span> },
    { title: "Type", dataIndex: "line_type", render: (value) => <Tag color={value === "TAX" ? "error" : value === "BENEFIT" ? "blue" : value === "DEDUCTION" ? "gold" : "success"}>{value}</Tag> },
    { title: "Code", dataIndex: "code", render: (value) => <span className="text-white/60">{value || "-"}</span> },
    { title: "Name", dataIndex: "name", render: (value) => <span className="text-white/85">{value}</span> },
    { title: "Amount", dataIndex: "amount", render: (value) => <span className="text-white/75">{String(value ?? "-")}</span> },
  ];

  const taxDocColumns: ColumnsType<PayrollTaxDocumentRow> = [
    { title: "Document No", dataIndex: "document_no", render: (value) => <span className="text-white/85">{value || "-"}</span> },
    { title: "Payslip", dataIndex: "payslip", render: (value) => <span className="text-white/70">#{value}</span> },
    { title: "File Asset", dataIndex: "file_asset", render: (value) => <span className="text-white/70">{value ? `#${value}` : "-"}</span> },
    { title: "Created", dataIndex: "created_at", render: (value) => <span className="text-white/55">{formatDateTime(value)}</span> },
    {
      title: "Download",
      key: "download",
      render: (_, row) =>
        row.file_asset ? (
          <Button
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => {
              void downloadFromApi(`/api/common/file-assets/${row.file_asset}/download/`, `payroll-tax-document-${row.id}.pdf`).catch((error) => {
                message.error(parseApiError(error, "Unable to download payroll tax document"));
              });
            }}
          >
            Download
          </Button>
        ) : (
          "-"
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Typography.Title level={4} className="!mb-0 !text-white">
            Payroll, Rules, and Tax Documents
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-white/60">
            Sprint 5 payroll completeness: tax-benefit rules, payroll processing, itemized payslip lines, and generated tax documents.
          </Typography.Paragraph>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={() => void refreshAll()} loading={pageLoading}>
            Refresh
          </Button>
          <Button
            type="primary"
            className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
            onClick={() => {
              setEditingRule(null);
              ruleForm.resetFields();
              ruleForm.setFieldsValue({
                rule_type: "TAX",
                calculation_type: "PERCENT",
                value: 0,
                is_pre_tax: true,
                is_active: true,
              });
              setRuleOpen(true);
            }}
          >
            New Tax / Benefit Rule
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl h-full">
            <div className="text-white font-medium mb-3">Payroll Tax & Benefit Rules</div>
            <Table rowKey="id" loading={pageLoading} dataSource={rules} columns={ruleColumns} pagination={{ pageSize: 5 }} />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl h-full">
            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
              <div className="text-white font-medium">Payroll Runs</div>
              <Select
                allowClear
                value={selectedRunId}
                onChange={(value) => {
                  setSelectedRunId(value);
                  setSelectedPayslipId(undefined);
                }}
                placeholder="Filter payslips by run"
                className="min-w-[220px]"
                options={runs.map((item) => ({ value: item.id, label: runMap.get(item.id) ?? `Run #${item.id}` }))}
              />
            </div>
            <Table rowKey="id" loading={pageLoading} dataSource={runs} columns={runColumns} pagination={{ pageSize: 5 }} />
          </Card>
        </Col>
      </Row>

      <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div>
            <div className="text-white font-medium">Generated Payslips</div>
            <div className="text-white/55 text-sm">Process runs above, then inspect resulting payslips and generate tax documents per staff member.</div>
          </div>
          <Select
            allowClear
            value={selectedPayslipId}
            onChange={(value) => setSelectedPayslipId(value)}
            placeholder="Focus a payslip"
            className="min-w-[220px]"
            options={visiblePayslips.map((item) => ({
              value: item.id,
              label: `${staffMap.get(item.staff) ?? `#${item.staff}`} (${runMap.get(item.payroll_run) ?? item.payroll_run})`,
            }))}
          />
        </div>
        <Table rowKey="id" loading={pageLoading} dataSource={visiblePayslips} columns={payslipColumns} pagination={{ pageSize: 6 }} />
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl h-full">
            <div className="text-white font-medium mb-3">Payslip Lines</div>
            <Table rowKey="id" loading={pageLoading} dataSource={visiblePayslipLines} columns={payslipLineColumns} pagination={{ pageSize: 6 }} />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl h-full">
            <div className="text-white font-medium mb-3">Payroll Tax Documents</div>
            <Table rowKey="id" loading={pageLoading} dataSource={visibleTaxDocs} columns={taxDocColumns} pagination={{ pageSize: 6 }} />
          </Card>
        </Col>
      </Row>

      <Modal
        title={editingRule ? "Edit Payroll Rule" : "Create Payroll Rule"}
        open={ruleOpen}
        onCancel={() => setRuleOpen(false)}
        confirmLoading={submitting}
        onOk={() => {
          void ruleForm.validateFields().then(async (values) => {
            setSubmitting(true);
            try {
              const payload = cleanPayload(values);
              await hrApi.payroll.saveRule(payload, editingRule?.id);
              message.success(editingRule ? "Payroll rule updated" : "Payroll rule created");
              setRuleOpen(false);
              await loadAll();
            } catch (error) {
              message.error(parseApiError(error, "Unable to save payroll rule"));
            } finally {
              setSubmitting(false);
            }
          });
        }}
        width={760}
      >
        <Form<RuleForm> form={ruleForm} layout="vertical" requiredMark={false}>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="name" label="Rule Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="code" label="Rule Code" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="rule_type" label="Rule Type" rules={[{ required: true }]}><Select options={[{ label: "Tax", value: "TAX" }, { label: "Benefit", value: "BENEFIT" }]} /></Form.Item></Col>
            <Col span={12}><Form.Item name="calculation_type" label="Calculation Type" rules={[{ required: true }]}><Select options={[{ label: "Percent", value: "PERCENT" }, { label: "Fixed", value: "FIXED" }]} /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="value" label="Value" rules={[{ required: true }]}><InputNumber className="!w-full" min={0} step={0.01} /></Form.Item></Col>
            <Col span={12}><Form.Item name="max_amount" label="Max Amount"><InputNumber className="!w-full" min={0} step={0.01} /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="applies_from" label="Applies From"><Input type="date" /></Form.Item></Col>
            <Col span={12}><Form.Item name="applies_to" label="Applies To"><Input type="date" /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="is_pre_tax" label="Pre Tax" rules={[{ required: true }]}><Select options={[{ label: "Yes", value: true }, { label: "No", value: false }]} /></Form.Item></Col>
            <Col span={12}><Form.Item name="is_active" label="Enabled" rules={[{ required: true }]}><Select options={[{ label: "Enabled", value: true }, { label: "Disabled", value: false }]} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
