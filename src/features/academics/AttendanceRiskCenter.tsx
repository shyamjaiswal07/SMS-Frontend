import { AlertOutlined, DownloadOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, Input, InputNumber, Modal, Row, Select, Space, Statistic, Switch, Table, Tabs, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { useGetAdminUsersQuery } from "@/features/admin/adminApiSlice";
import { academicOperationsApi } from "@/features/academics/academicOperationsApi";
import { useGetGradeLevelsQuery, useGetSectionsQuery } from "@/features/institutions/institutionsApiSlice";
import { useGetStudentsQuery } from "@/features/students/studentsApiSlice";
import { downloadPostFromApi, formatDate, formatDateTime, parseApiError, rowsOf } from "@/utils/platform";

type Student = { id: number; student_id?: string; first_name?: string; last_name?: string };
type Section = { id: number; name?: string };
type GradeLevel = { id: number; name?: string };
type User = { id: number; email?: string; username?: string; first_name?: string; last_name?: string; role?: string };
type Flag = {
  id: number;
  student?: number;
  section?: number | null;
  evaluated_from?: string;
  evaluated_to?: string;
  total_records?: number;
  present_records?: number;
  attendance_percentage?: string | number;
  threshold_percentage?: string | number;
  risk_level?: string;
  status?: string;
  acknowledged_at?: string | null;
  escalated_at?: string | null;
  escalated_to?: number | null;
  resolved_at?: string | null;
  resolved_by?: number | null;
  note?: string;
  is_active?: boolean;
};
type ActionRow = {
  id: number;
  action_type?: string;
  from_status?: string;
  to_status?: string;
  performed_by_email?: string;
  reason?: string;
  created_at?: string;
};
type ReportPayload = {
  start_date?: string;
  end_date?: string;
  summary?: Record<string, unknown>;
  section_rows?: Array<Record<string, unknown>>;
  student_rows?: Array<Record<string, unknown>>;
};
type EvaluationSummary = {
  window_start?: string;
  window_end?: string;
  threshold_percentage?: string;
  min_records?: number;
  scanned_students?: number;
  created_flags?: number;
  updated_flags?: number;
  resolved_flags?: number;
  active_flag_ids?: number[];
};

type ReportFormValues = {
  start_date: string;
  end_date: string;
  section_id?: number;
  grade_level_id?: number;
  include_student_rows: boolean;
};
type EvaluationFormValues = {
  start_date?: string;
  end_date?: string;
  window_days?: number;
  section_id?: number;
  grade_level_id?: number;
  threshold_percentage: number;
  min_records: number;
  auto_resolve: boolean;
};
type TransitionFormValues = {
  reason?: string;
  escalated_to_user_id?: number;
};

function riskColor(level?: string) {
  if (level === "CRITICAL") return "red";
  if (level === "HIGH") return "orange";
  if (level === "MEDIUM") return "gold";
  return "blue";
}

function statusColor(status?: string) {
  if (status === "RESOLVED") return "success";
  if (status === "DISMISSED") return "default";
  if (status === "ESCALATED") return "red";
  if (status === "ACKNOWLEDGED") return "processing";
  return "orange";
}

export default function AttendanceRiskCenter() {
  const [reportForm] = Form.useForm<ReportFormValues>();
  const [evaluationForm] = Form.useForm<EvaluationFormValues>();
  const [transitionForm] = Form.useForm<TransitionFormValues>();
  const { data: studentsData, isFetching: studentsLoading, refetch: refetchStudents } = useGetStudentsQuery({ page: 1, page_size: 200 });
  const { data: sectionsData, isFetching: sectionsLoading, refetch: refetchSections } = useGetSectionsQuery({ page: 1, page_size: 200 });
  const { data: gradeLevelsData, isFetching: gradeLevelsLoading, refetch: refetchGradeLevels } = useGetGradeLevelsQuery({ page: 1, page_size: 200 });
  const { data: usersData, isFetching: usersLoading, refetch: refetchUsers } = useGetAdminUsersQuery({ page: 1, page_size: 200 });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [historyRows, setHistoryRows] = useState<ActionRow[]>([]);
  const [report, setReport] = useState<ReportPayload | null>(null);
  const [evaluationSummary, setEvaluationSummary] = useState<EvaluationSummary | null>(null);
  const [selectedFlagId, setSelectedFlagId] = useState<number | null>(null);
  const [transitionTarget, setTransitionTarget] = useState<{ id: number; action: "acknowledge" | "escalate" | "resolve" | "dismiss" | "reopen" } | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const { flagData } = await academicOperationsApi.attendanceRisk.load();
      const nextFlags = rowsOf(flagData) as Flag[];
      setFlags(nextFlags);
      if (!selectedFlagId && nextFlags.length) {
        setSelectedFlagId(nextFlags[0].id);
      }
    } catch (error) {
      message.error(parseApiError(error, "Failed to load attendance risk workspace"));
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (flagId: number) => {
    try {
      const response = await academicOperationsApi.attendanceRisk.getHistory(flagId);
      setHistoryRows(Array.isArray(response) ? (response as ActionRow[]) : []);
    } catch (error) {
      message.error(parseApiError(error, "Unable to load attendance risk history"));
    }
  };

  useEffect(() => {
    reportForm.setFieldsValue({ include_student_rows: true });
    evaluationForm.setFieldsValue({ threshold_percentage: 75, min_records: 5, auto_resolve: true, window_days: 30 });
    void loadAll();
  }, []);

  useEffect(() => {
    setStudents(rowsOf(studentsData) as Student[]);
  }, [studentsData]);

  useEffect(() => {
    setSections(rowsOf(sectionsData) as Section[]);
  }, [sectionsData]);

  useEffect(() => {
    setGradeLevels(rowsOf(gradeLevelsData) as GradeLevel[]);
  }, [gradeLevelsData]);

  useEffect(() => {
    setUsers(rowsOf(usersData) as User[]);
  }, [usersData]);

  const pageLoading = loading || studentsLoading || sectionsLoading || gradeLevelsLoading || usersLoading;

  const refreshAll = async () => {
    await Promise.all([loadAll(), refetchStudents(), refetchSections(), refetchGradeLevels(), refetchUsers()]);
  };

  useEffect(() => {
    if (selectedFlagId) {
      void loadHistory(selectedFlagId);
    } else {
      setHistoryRows([]);
    }
  }, [selectedFlagId]);

  const studentMap = useMemo(
    () => new Map(students.map((item) => [item.id, `${item.student_id ?? item.id} - ${item.first_name ?? ""} ${item.last_name ?? ""}`.trim()])),
    [students],
  );
  const sectionMap = useMemo(() => new Map(sections.map((item) => [item.id, item.name ?? `Section #${item.id}`])), [sections]);
  const gradeMap = useMemo(() => new Map(gradeLevels.map((item) => [item.id, item.name ?? `Grade #${item.id}`])), [gradeLevels]);
  const userMap = useMemo(
    () => new Map(users.map((item) => [item.id, `${item.first_name ?? ""} ${item.last_name ?? ""}`.trim() || item.email || item.username || `User #${item.id}`])),
    [users],
  );

  const selectedFlag = useMemo(() => flags.find((item) => item.id === selectedFlagId) ?? null, [flags, selectedFlagId]);

  const flagColumns: ColumnsType<Flag> = [
    { title: "Student", dataIndex: "student", render: (value) => <span className="text-white/80">{value ? studentMap.get(value) ?? `#${value}` : "-"}</span> },
    { title: "Section", dataIndex: "section", render: (value) => <span className="text-white/70">{value ? sectionMap.get(value) ?? `#${value}` : "-"}</span> },
    { title: "Risk", dataIndex: "risk_level", render: (value) => <Tag color={riskColor(value)}>{value}</Tag> },
    { title: "Status", dataIndex: "status", render: (value) => <Tag color={statusColor(value)}>{value}</Tag> },
    { title: "Attendance", key: "attendance", render: (_, row) => <span className="text-white/80">{String(row.attendance_percentage ?? "-")}% / {String(row.threshold_percentage ?? "-")}%</span> },
    {
      title: "Actions",
      key: "actions",
      render: (_, row) => (
        <Space wrap>
          <Button size="small" onClick={() => setSelectedFlagId(row.id)}>Inspect</Button>
          {row.status === "OPEN" ? <Button size="small" onClick={() => { transitionForm.resetFields(); setTransitionTarget({ id: row.id, action: "acknowledge" }); }}>Acknowledge</Button> : null}
          {row.status === "OPEN" || row.status === "ACKNOWLEDGED" ? <Button size="small" danger onClick={() => { transitionForm.resetFields(); setTransitionTarget({ id: row.id, action: "escalate" }); }}>Escalate</Button> : null}
          {row.status === "OPEN" || row.status === "ACKNOWLEDGED" || row.status === "ESCALATED" ? <Button size="small" onClick={() => { transitionForm.resetFields(); setTransitionTarget({ id: row.id, action: "resolve" }); }}>Resolve</Button> : null}
          {row.status === "OPEN" || row.status === "ACKNOWLEDGED" || row.status === "ESCALATED" ? <Button size="small" onClick={() => { transitionForm.resetFields(); setTransitionTarget({ id: row.id, action: "dismiss" }); }}>Dismiss</Button> : null}
          {row.status === "RESOLVED" || row.status === "DISMISSED" ? <Button size="small" loading={actionKey === `reopen-${row.id}`} onClick={async () => {
            setActionKey(`reopen-${row.id}`);
            try {
              await academicOperationsApi.attendanceRisk.reopenFlag(row.id);
              message.success("Flag reopened");
              await loadAll();
              setSelectedFlagId(row.id);
            } catch (error) {
              message.error(parseApiError(error, "Unable to reopen flag"));
            } finally {
              setActionKey(null);
            }
          }}>Reopen</Button> : null}
        </Space>
      ),
    },
  ];

  const historyColumns: ColumnsType<ActionRow> = [
    { title: "Action", dataIndex: "action_type", render: (value) => <Tag color="blue">{value}</Tag> },
    { title: "Transition", key: "transition", render: (_, row) => <span className="text-white/70">{row.from_status || "START"}{" -> "}{row.to_status}</span> },
    { title: "Reason", dataIndex: "reason", render: (value) => <span className="text-white/70">{value || "-"}</span> },
    { title: "By", dataIndex: "performed_by_email", render: (value) => <span className="text-white/60">{value || "System"}</span> },
    { title: "When", dataIndex: "created_at", render: (value) => <span className="text-white/55">{formatDateTime(value)}</span> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Typography.Title level={4} className="!mb-0 !text-white">
            Attendance Risk + Reports
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-white/60">
            Sprint 10 section attendance reporting, risk evaluation, escalation workflow, and audit history.
          </Typography.Paragraph>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => void refreshAll()} loading={pageLoading}>
          Refresh
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
            <Statistic title={<span className="text-white/60">Active Flags</span>} value={flags.filter((item) => item.is_active).length} prefix={<AlertOutlined className="text-[var(--cv-accent)]" />} valueStyle={{ color: "#e5e7eb" }} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
            <Statistic title={<span className="text-white/60">Resolved Flags</span>} value={flags.filter((item) => item.status === "RESOLVED").length} valueStyle={{ color: "#e5e7eb" }} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
            <Statistic title={<span className="text-white/60">Critical Flags</span>} value={flags.filter((item) => item.risk_level === "CRITICAL").length} valueStyle={{ color: "#e5e7eb" }} />
          </Card>
        </Col>
      </Row>

      <Tabs
        defaultActiveKey="report"
        items={[
          {
            key: "report",
            label: "Section Report",
            children: (
              <div className="grid gap-4 xl:grid-cols-[0.9fr,1.1fr]">
                <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
                  <div className="text-white font-medium mb-3">Run Attendance Report</div>
                  <Form<ReportFormValues> form={reportForm} layout="vertical" requiredMark={false}>
                    <Row gutter={12}>
                      <Col span={12}><Form.Item name="start_date" label="Start Date" rules={[{ required: true }]}><Input type="date" /></Form.Item></Col>
                      <Col span={12}><Form.Item name="end_date" label="End Date" rules={[{ required: true }]}><Input type="date" /></Form.Item></Col>
                    </Row>
                    <Row gutter={12}>
                      <Col span={12}><Form.Item name="section_id" label="Section"><Select allowClear options={sections.map((item) => ({ value: item.id, label: sectionMap.get(item.id) ?? item.name }))} /></Form.Item></Col>
                      <Col span={12}><Form.Item name="grade_level_id" label="Grade"><Select allowClear options={gradeLevels.map((item) => ({ value: item.id, label: gradeMap.get(item.id) ?? item.name }))} /></Form.Item></Col>
                    </Row>
                    <Form.Item name="include_student_rows" label="Include Student Rows" valuePropName="checked"><Switch /></Form.Item>
                    <Space wrap>
                      <Button
                        type="primary"
                        className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
                        loading={submitting}
                        onClick={async () => {
                          try {
                            const values = await reportForm.validateFields();
                            setSubmitting(true);
                            const response = await academicOperationsApi.attendanceRisk.runSectionReport({ ...values, export_format: "JSON" });
                            setReport(response as ReportPayload);
                            message.success("Attendance report loaded");
                          } catch (error) {
                            message.error(parseApiError(error, "Unable to run attendance report"));
                          } finally {
                            setSubmitting(false);
                          }
                        }}
                      >
                        Run JSON Report
                      </Button>
                      <Button
                        icon={<DownloadOutlined />}
                        onClick={async () => {
                          try {
                            const values = await reportForm.validateFields();
                            await downloadPostFromApi("/api/academics/attendance-records/section-report/", { ...values, export_format: "CSV" }, "attendance-section-report.csv");
                          } catch (error) {
                            message.error(parseApiError(error, "Unable to export CSV"));
                          }
                        }}
                      >
                        Export CSV
                      </Button>
                      <Button
                        icon={<DownloadOutlined />}
                        onClick={async () => {
                          try {
                            const values = await reportForm.validateFields();
                            await downloadPostFromApi("/api/academics/attendance-records/section-report/", { ...values, export_format: "XLSX" }, "attendance-section-report.xlsx");
                          } catch (error) {
                            message.error(parseApiError(error, "Unable to export XLSX"));
                          }
                        }}
                      >
                        Export XLSX
                      </Button>
                    </Space>
                  </Form>
                </Card>

                <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
                  <div className="text-white font-medium mb-3">Report Output</div>
                  {report?.summary ? (
                    <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 mb-4">
                      {Object.entries(report.summary).map(([key, value]) => (
                        <div key={key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="text-white/55 text-xs uppercase tracking-wider">{key.replace(/_/g, " ")}</div>
                          <div className="text-white font-medium mt-1">{String(value)}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-white/50 mb-4">Run the report to see attendance summary and row-level output.</div>
                  )}

                  <div className="text-white/80 font-medium mb-2">Section Rows</div>
                  <Table
                    rowKey={(row) => String(row.section_id ?? JSON.stringify(row))}
                    dataSource={(report?.section_rows ?? []) as Array<Record<string, unknown>>}
                    columns={Object.keys((report?.section_rows ?? [])[0] ?? {}).map((key) => ({
                      title: key.replace(/_/g, " "),
                      dataIndex: key,
                      key,
                      render: (value: unknown) => <span className="text-white/75">{String(value ?? "-")}</span>,
                    }))}
                    pagination={{ pageSize: 5 }}
                    scroll={{ x: true }}
                  />

                  <div className="text-white/80 font-medium mt-5 mb-2">Student Rows</div>
                  <Table
                    rowKey={(row) => `${String(row.student_id ?? row.student_code ?? JSON.stringify(row))}-${String(row.section_id ?? "")}`}
                    dataSource={(report?.student_rows ?? []) as Array<Record<string, unknown>>}
                    columns={Object.keys((report?.student_rows ?? [])[0] ?? {}).map((key) => ({
                      title: key.replace(/_/g, " "),
                      dataIndex: key,
                      key,
                      render: (value: unknown) => <span className="text-white/75">{String(value ?? "-")}</span>,
                    }))}
                    pagination={{ pageSize: 5 }}
                    scroll={{ x: true }}
                  />
                </Card>
              </div>
            ),
          },
          {
            key: "flags",
            label: "Risk Flags",
            children: (
              <div className="space-y-4">
                <div className="grid gap-4 xl:grid-cols-[0.92fr,1.08fr]">
                  <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
                    <div className="text-white font-medium mb-3">Evaluate Attendance Risk</div>
                    <Form<EvaluationFormValues> form={evaluationForm} layout="vertical" requiredMark={false}>
                      <Row gutter={12}>
                        <Col span={12}><Form.Item name="start_date" label="Start Date"><Input type="date" /></Form.Item></Col>
                        <Col span={12}><Form.Item name="end_date" label="End Date"><Input type="date" /></Form.Item></Col>
                      </Row>
                      <Row gutter={12}>
                        <Col span={12}><Form.Item name="window_days" label="Window Days"><InputNumber className="!w-full" min={1} max={365} /></Form.Item></Col>
                        <Col span={12}><Form.Item name="threshold_percentage" label="Threshold %" rules={[{ required: true }]}><InputNumber className="!w-full" min={1} max={100} /></Form.Item></Col>
                      </Row>
                      <Row gutter={12}>
                        <Col span={12}><Form.Item name="min_records" label="Min Records" rules={[{ required: true }]}><InputNumber className="!w-full" min={1} /></Form.Item></Col>
                        <Col span={12}><Form.Item name="section_id" label="Section"><Select allowClear options={sections.map((item) => ({ value: item.id, label: sectionMap.get(item.id) ?? item.name }))} /></Form.Item></Col>
                      </Row>
                      <Form.Item name="grade_level_id" label="Grade"><Select allowClear options={gradeLevels.map((item) => ({ value: item.id, label: gradeMap.get(item.id) ?? item.name }))} /></Form.Item>
                      <Form.Item name="auto_resolve" label="Auto Resolve Improved Cases" valuePropName="checked"><Switch /></Form.Item>
                      <Button
                        type="primary"
                        className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
                        loading={submitting}
                        onClick={async () => {
                          try {
                            const values = await evaluationForm.validateFields();
                            setSubmitting(true);
                            const payload = {
                              ...values,
                              window_days: values.start_date && values.end_date ? undefined : values.window_days,
                            };
                            const response = await academicOperationsApi.attendanceRisk.evaluateFlags(payload);
                            setEvaluationSummary(response as EvaluationSummary);
                            message.success("Attendance risk evaluation completed");
                            await loadAll();
                          } catch (error) {
                            message.error(parseApiError(error, "Unable to evaluate attendance risk"));
                          } finally {
                            setSubmitting(false);
                          }
                        }}
                      >
                        Evaluate Flags
                      </Button>
                    </Form>

                    {evaluationSummary ? (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="text-white font-medium mb-2">Latest Evaluation</div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="text-white/70">Window: {evaluationSummary.window_start} to {evaluationSummary.window_end}</div>
                          <div className="text-white/70">Threshold: {evaluationSummary.threshold_percentage}%</div>
                          <div className="text-white/70">Scanned: {evaluationSummary.scanned_students ?? 0}</div>
                          <div className="text-white/70">Created: {evaluationSummary.created_flags ?? 0}</div>
                          <div className="text-white/70">Updated: {evaluationSummary.updated_flags ?? 0}</div>
                          <div className="text-white/70">Resolved: {evaluationSummary.resolved_flags ?? 0}</div>
                        </div>
                      </div>
                    ) : null}
                  </Card>

                  <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
                    <div className="text-white font-medium mb-3">Attendance Risk Flags</div>
                    <Table rowKey="id" loading={pageLoading} dataSource={flags} columns={flagColumns} pagination={{ pageSize: 6 }} />
                  </Card>
                </div>

                <div className="grid gap-4 xl:grid-cols-[0.85fr,1.15fr]">
                  <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
                    <div className="text-white font-medium mb-3">Selected Flag</div>
                    {selectedFlag ? (
                      <div className="space-y-3">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="text-white font-medium">{selectedFlag.student ? studentMap.get(selectedFlag.student) ?? `Student #${selectedFlag.student}` : "Unknown student"}</div>
                          <div className="text-white/55 text-sm mt-1">Section: {selectedFlag.section ? sectionMap.get(selectedFlag.section) ?? `#${selectedFlag.section}` : "-"}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/70">Risk: <Tag color={riskColor(selectedFlag.risk_level)}>{selectedFlag.risk_level}</Tag></div>
                          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/70">Status: <Tag color={statusColor(selectedFlag.status)}>{selectedFlag.status}</Tag></div>
                          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/70">Attendance: {String(selectedFlag.attendance_percentage ?? "-")}%</div>
                          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/70">Threshold: {String(selectedFlag.threshold_percentage ?? "-")}%</div>
                          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/70">Records: {selectedFlag.present_records ?? 0}/{selectedFlag.total_records ?? 0}</div>
                          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/70">Resolved: {formatDateTime(selectedFlag.resolved_at)}</div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/65 text-sm">
                          Window: {formatDate(selectedFlag.evaluated_from)} to {formatDate(selectedFlag.evaluated_to)}
                          <br />
                          Escalated To: {selectedFlag.escalated_to ? userMap.get(selectedFlag.escalated_to) ?? `#${selectedFlag.escalated_to}` : "-"}
                          <br />
                          Note: {selectedFlag.note || "-"}
                        </div>
                      </div>
                    ) : (
                      <div className="text-white/50">Select a flag to inspect the full lifecycle.</div>
                    )}
                  </Card>

                  <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
                    <div className="text-white font-medium mb-3">Risk Action History</div>
                    <Table rowKey="id" dataSource={historyRows} columns={historyColumns} pagination={{ pageSize: 6 }} />
                  </Card>
                </div>
              </div>
            ),
          },
        ]}
      />

      <Modal
        title={transitionTarget ? `${transitionTarget.action.replace(/^\w/, (char) => char.toUpperCase())} Flag` : "Transition Flag"}
        open={!!transitionTarget}
        onCancel={() => setTransitionTarget(null)}
        confirmLoading={submitting}
        onOk={() => {
          void transitionForm.validateFields().then(async (values) => {
            if (!transitionTarget) return;
            setSubmitting(true);
            try {
              await academicOperationsApi.attendanceRisk.transitionFlag(transitionTarget.id, transitionTarget.action, values);
              message.success(
                transitionTarget.action === "dismiss"
                  ? "Flag dismissed"
                  : transitionTarget.action === "acknowledge"
                    ? "Flag acknowledged"
                    : transitionTarget.action === "resolve"
                      ? "Flag resolved"
                      : transitionTarget.action === "escalate"
                        ? "Flag escalated"
                        : "Flag reopened",
              );
              setTransitionTarget(null);
              await loadAll();
              setSelectedFlagId(transitionTarget.id);
            } catch (error) {
              message.error(parseApiError(error, `Unable to ${transitionTarget.action} flag`));
            } finally {
              setSubmitting(false);
            }
          });
        }}
      >
        <Form<TransitionFormValues> form={transitionForm} layout="vertical" requiredMark={false}>
          <Form.Item name="reason" label="Reason"><Input.TextArea rows={4} /></Form.Item>
          {transitionTarget?.action === "escalate" ? (
            <Form.Item name="escalated_to_user_id" label="Escalate To">
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                options={users.map((item) => ({ value: item.id, label: `${userMap.get(item.id) ?? item.email}${item.role ? ` (${item.role})` : ""}` }))}
              />
            </Form.Item>
          ) : null}
        </Form>
      </Modal>
    </div>
  );
}
