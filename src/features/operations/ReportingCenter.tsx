import { DownloadOutlined, EditOutlined, FileSearchOutlined, PlayCircleOutlined, ReloadOutlined, ScheduleOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, Input, InputNumber, Modal, Popconfirm, Row, Select, Space, Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import apiClient from "@/services/apiClient";
import { downloadFromApi, downloadPostFromApi, formatDateTime, parseApiError, rowsOf } from "@/utils/platform";

type ReportCode = "STUDENTS" | "FINANCE_INVOICES" | "ATTENDANCE" | "LIBRARY_ISSUES" | "TRANSPORT_ALLOCATIONS";
type ReportFormat = "CSV" | "XLSX";

type ReportQueryResult = {
  count?: number;
  page?: number;
  page_size?: number;
  results?: Array<Record<string, unknown>>;
};

type ScheduledReportRow = {
  id: number;
  name: string;
  report_code: ReportCode;
  report_format: ReportFormat;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  run_hour: number;
  run_minute: number;
  day_of_week?: number | null;
  day_of_month?: number | null;
  filters?: Record<string, unknown>;
  recipient_emails?: string[];
  last_run_at?: string | null;
  last_status?: string;
  last_error?: string;
  is_active: boolean;
};

type ScheduledRunRow = {
  id: number;
  schedule: number;
  status: string;
  output_asset?: number | null;
  output_asset_url?: string;
  generated_rows?: number;
  error_message?: string;
  created_at?: string;
};

type QueryForm = {
  report_code: ReportCode;
  search?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  is_active?: "true" | "false";
  page_size?: number;
};

type ScheduleForm = {
  name: string;
  report_code: ReportCode;
  report_format: ReportFormat;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  run_hour: number;
  run_minute: number;
  day_of_week?: number;
  day_of_month?: number;
  recipient_emails?: string;
  filters_json?: string;
  is_active: boolean;
};

function cleanFilters(values: QueryForm) {
  const filters: Record<string, unknown> = {};
  if (values.search?.trim()) filters.search = values.search.trim();
  if (values.status?.trim()) filters.status = values.status.trim();
  if (values.date_from) filters.date_from = values.date_from;
  if (values.date_to) filters.date_to = values.date_to;
  if (values.is_active === "true") filters.is_active = true;
  if (values.is_active === "false") filters.is_active = false;
  return filters;
}

function tableColumns(rows: Array<Record<string, unknown>>): ColumnsType<Record<string, unknown>> {
  const sample = rows[0];
  if (!sample) {
    return [{ title: "Data", key: "empty", render: () => <span className="text-white/50">Run a report to view data</span> }];
  }
  return Object.keys(sample).map((key) => ({
    title: key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
    dataIndex: key,
    key,
    render: (value: unknown) => <span className="text-white/80">{value === null || value === undefined || value === "" ? "-" : String(value)}</span>,
  }));
}

export default function ReportingCenter() {
  const [queryForm] = Form.useForm<QueryForm>();
  const [scheduleForm] = Form.useForm<ScheduleForm>();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReportQueryResult>({});
  const [schedules, setSchedules] = useState<ScheduledReportRow[]>([]);
  const [runs, setRuns] = useState<ScheduledRunRow[]>([]);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduledReportRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadSupportingData = async () => {
    setLoading(true);
    try {
      const [scheduleResponse, runResponse] = await Promise.all([
        apiClient.get("/api/common/scheduled-reports/", { params: { page: 1, page_size: 100 } }),
        apiClient.get("/api/common/scheduled-report-runs/", { params: { page: 1, page_size: 100 } }),
      ]);
      setSchedules(rowsOf(scheduleResponse.data) as ScheduledReportRow[]);
      setRuns(rowsOf(runResponse.data) as ScheduledRunRow[]);
    } catch (error) {
      message.error(parseApiError(error, "Failed to load reporting center"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queryForm.setFieldsValue({ report_code: "STUDENTS", page_size: 25 });
    void loadSupportingData();
  }, []);

  const resultColumns = useMemo(() => tableColumns((result.results ?? []) as Array<Record<string, unknown>>), [result.results]);

  const scheduleColumns: ColumnsType<ScheduledReportRow> = [
    { title: "Name", dataIndex: "name", render: (value) => <span className="text-white/85">{value}</span> },
    { title: "Report", dataIndex: "report_code", render: (value) => <Tag color="blue">{value}</Tag> },
    { title: "Frequency", dataIndex: "frequency", render: (value) => <Tag color="purple">{value}</Tag> },
    { title: "Last Status", dataIndex: "last_status", render: (value) => <Tag color={value === "SUCCESS" ? "success" : value === "FAILED" ? "error" : "default"}>{value || "Never run"}</Tag> },
    { title: "Last Run", dataIndex: "last_run_at", render: (value) => <span className="text-white/55">{formatDateTime(value)}</span> },
    {
      title: "Actions",
      key: "actions",
      render: (_, row) => (
        <Space wrap>
          <Button
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={async () => {
              try {
                await apiClient.post(`/api/common/scheduled-reports/${row.id}/run-now/`, {});
                message.success("Schedule queued");
                await loadSupportingData();
              } catch (error) {
                message.error(parseApiError(error, "Unable to run schedule"));
              }
            }}
          >
            Run Now
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditing(row);
              scheduleForm.setFieldsValue({
                name: row.name,
                report_code: row.report_code,
                report_format: row.report_format,
                frequency: row.frequency,
                run_hour: row.run_hour,
                run_minute: row.run_minute,
                day_of_week: row.day_of_week ?? undefined,
                day_of_month: row.day_of_month ?? undefined,
                is_active: row.is_active,
                recipient_emails: (row.recipient_emails ?? []).join(", "),
                filters_json: JSON.stringify(row.filters ?? {}, null, 2),
              });
              setScheduleOpen(true);
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this scheduled report?"
            onConfirm={async () => {
              try {
                await apiClient.delete(`/api/common/scheduled-reports/${row.id}/`);
                message.success("Schedule deleted");
                await loadSupportingData();
              } catch (error) {
                message.error(parseApiError(error, "Unable to delete schedule"));
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

  const runColumns: ColumnsType<ScheduledRunRow> = [
    { title: "Run ID", dataIndex: "id", render: (value) => <span className="text-white/85">#{value}</span> },
    { title: "Schedule", dataIndex: "schedule", render: (value) => <span className="text-white/70">#{value}</span> },
    { title: "Status", dataIndex: "status", render: (value) => <Tag color={value === "SUCCESS" ? "success" : value === "FAILED" ? "error" : "processing"}>{value}</Tag> },
    { title: "Rows", dataIndex: "generated_rows", render: (value) => <span className="text-white/70">{value ?? 0}</span> },
    { title: "Created", dataIndex: "created_at", render: (value) => <span className="text-white/55">{formatDateTime(value)}</span> },
    {
      title: "Output",
      key: "output",
      render: (_, row) =>
        row.output_asset ? (
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => void downloadFromApi(`/api/common/file-assets/${row.output_asset}/download/`, `scheduled-run-${row.id}.csv`)}
          >
            Download
          </Button>
        ) : (
          <span className="text-white/40">{row.error_message || "-"}</span>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Typography.Title level={4} className="!mb-0 !text-white">
            Reporting Workspace
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-white/60">
            Sprint 3 report query, export, schedule management, and export run history.
          </Typography.Paragraph>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => void loadSupportingData()} loading={loading}>
          Refresh
        </Button>
      </div>

      <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <div className="text-white font-medium">Report Query + Export</div>
            <div className="text-white/55 text-sm">Unified filters and table rendering for students, finance invoices, attendance, library issues, and transport allocations.</div>
          </div>
          <Space wrap>
            <Button
              icon={<DownloadOutlined />}
              onClick={async () => {
                try {
                  const values = await queryForm.validateFields();
                  await downloadPostFromApi("/api/common/reports/export/", {
                    report_code: values.report_code,
                    report_format: "CSV",
                    filters: cleanFilters(values),
                  }, `${values.report_code.toLowerCase()}.csv`);
                } catch (error) {
                  message.error(parseApiError(error, "Export failed"));
                }
              }}
            >
              Export CSV
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={async () => {
                try {
                  const values = await queryForm.validateFields();
                  await downloadPostFromApi("/api/common/reports/export/", {
                    report_code: values.report_code,
                    report_format: "XLSX",
                    filters: cleanFilters(values),
                  }, `${values.report_code.toLowerCase()}.xlsx`);
                } catch (error) {
                  message.error(parseApiError(error, "Export failed"));
                }
              }}
            >
              Export XLSX
            </Button>
          </Space>
        </div>

        <Form<QueryForm>
          form={queryForm}
          layout="vertical"
          requiredMark={false}
          onFinish={async (values) => {
            try {
              const response = await apiClient.post("/api/common/reports/query/", {
                report_code: values.report_code,
                page: 1,
                page_size: values.page_size || 25,
                filters: cleanFilters(values),
              });
              setResult(response.data as ReportQueryResult);
            } catch (error) {
              message.error(parseApiError(error, "Unable to query report"));
            }
          }}
        >
          <Row gutter={12}>
            <Col xs={24} md={8}>
              <Form.Item name="report_code" label="Report Code" rules={[{ required: true }]}>
                <Select
                  options={[
                    { label: "Students", value: "STUDENTS" },
                    { label: "Finance Invoices", value: "FINANCE_INVOICES" },
                    { label: "Attendance", value: "ATTENDANCE" },
                    { label: "Library Issues", value: "LIBRARY_ISSUES" },
                    { label: "Transport Allocations", value: "TRANSPORT_ALLOCATIONS" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="search" label="Search">
                <Input placeholder="Search term" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="status" label="Status">
                <Input placeholder="e.g. ACTIVE, OVERDUE, ISSUED" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col xs={24} md={6}>
              <Form.Item name="date_from" label="Date From">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="date_to" label="Date To">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="is_active" label="Is Active">
                <Select allowClear options={[{ label: "Active", value: "true" }, { label: "Inactive", value: "false" }]} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="page_size" label="Rows">
                <InputNumber className="!w-full" min={1} max={200} />
              </Form.Item>
            </Col>
          </Row>
          <Button htmlType="submit" type="primary" className="!rounded-2xl !bg-[var(--cv-accent)] !border-0" icon={<FileSearchOutlined />}>
            Run Report
          </Button>
        </Form>

        <div className="mt-5">
          <Table
            rowKey={(row) => JSON.stringify(row)}
            dataSource={result.results as Array<Record<string, unknown>>}
            columns={resultColumns}
            pagination={{ pageSize: 8 }}
            scroll={{ x: true }}
          />
        </div>
      </Card>

      <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div>
            <div className="text-white font-medium">Scheduled Reports</div>
            <div className="text-white/55 text-sm">Create, edit, pause, run now, and review schedule execution history.</div>
          </div>
          <Button
            type="primary"
            className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
            icon={<ScheduleOutlined />}
            onClick={() => {
              setEditing(null);
              scheduleForm.resetFields();
              scheduleForm.setFieldsValue({
                report_code: "STUDENTS",
                report_format: "CSV",
                frequency: "DAILY",
                run_hour: 8,
                run_minute: 0,
                is_active: true,
                filters_json: "{}",
              });
              setScheduleOpen(true);
            }}
          >
            New Schedule
          </Button>
        </div>

        <Table rowKey="id" loading={loading} dataSource={schedules} columns={scheduleColumns} pagination={{ pageSize: 6 }} />

        <div className="mt-6 text-white font-medium mb-3">Schedule Runs</div>
        <Table rowKey="id" loading={loading} dataSource={runs} columns={runColumns} pagination={{ pageSize: 6 }} />
      </Card>

      <Modal
        title={editing ? "Edit Scheduled Report" : "Create Scheduled Report"}
        open={scheduleOpen}
        onCancel={() => setScheduleOpen(false)}
        confirmLoading={submitting}
        onOk={() => {
          void scheduleForm.validateFields().then(async (values) => {
            setSubmitting(true);
            try {
              const payload = {
                name: values.name,
                report_code: values.report_code,
                report_format: values.report_format,
                frequency: values.frequency,
                run_hour: values.run_hour,
                run_minute: values.run_minute,
                day_of_week: values.frequency === "WEEKLY" ? values.day_of_week : null,
                day_of_month: values.frequency === "MONTHLY" ? values.day_of_month : null,
                recipient_emails: (values.recipient_emails || "")
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
                filters: values.filters_json?.trim() ? JSON.parse(values.filters_json) : {},
                is_active: values.is_active,
              };
              if (editing) {
                await apiClient.patch(`/api/common/scheduled-reports/${editing.id}/`, payload);
              } else {
                await apiClient.post("/api/common/scheduled-reports/", payload);
              }
              message.success(editing ? "Schedule updated" : "Schedule created");
              setScheduleOpen(false);
              setEditing(null);
              await loadSupportingData();
            } catch (error) {
              const detail =
                error instanceof SyntaxError
                  ? "Filters JSON must be valid JSON"
                  : parseApiError(error, "Unable to save schedule");
              message.error(detail);
            } finally {
              setSubmitting(false);
            }
          });
        }}
        width={760}
      >
        <Form<ScheduleForm> form={scheduleForm} layout="vertical" requiredMark={false}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="report_code" label="Report Code" rules={[{ required: true }]}>
                <Select options={[
                  { label: "Students", value: "STUDENTS" },
                  { label: "Finance Invoices", value: "FINANCE_INVOICES" },
                  { label: "Attendance", value: "ATTENDANCE" },
                  { label: "Library Issues", value: "LIBRARY_ISSUES" },
                  { label: "Transport Allocations", value: "TRANSPORT_ALLOCATIONS" },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="report_format" label="Format" rules={[{ required: true }]}>
                <Select options={[{ label: "CSV", value: "CSV" }, { label: "XLSX", value: "XLSX" }]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="frequency" label="Frequency" rules={[{ required: true }]}>
                <Select options={[{ label: "Daily", value: "DAILY" }, { label: "Weekly", value: "WEEKLY" }, { label: "Monthly", value: "MONTHLY" }]} />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="run_hour" label="Hour" rules={[{ required: true }]}>
                <InputNumber className="!w-full" min={0} max={23} />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="run_minute" label="Minute" rules={[{ required: true }]}>
                <InputNumber className="!w-full" min={0} max={59} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="day_of_week" label="Day Of Week">
                <InputNumber className="!w-full" min={1} max={7} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="day_of_month" label="Day Of Month">
                <InputNumber className="!w-full" min={1} max={31} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="recipient_emails" label="Recipient Emails">
            <Input.TextArea rows={2} placeholder="Comma-separated emails" />
          </Form.Item>
          <Form.Item name="filters_json" label="Filters JSON">
            <Input.TextArea rows={5} placeholder='{"status":"ACTIVE"}' />
          </Form.Item>
          <Form.Item name="is_active" label="Status" rules={[{ required: true }]}>
            <Select options={[{ label: "Active", value: true }, { label: "Paused", value: false }]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
