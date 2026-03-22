import { ReloadOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, Input, InputNumber, Row, Select, Space, Statistic, Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import FileAssetUploader from "@/features/files/FileAssetUploader";
import { hrApi } from "@/features/hr/hrApi";
import { useGetStaffProfilesQuery } from "@/features/hr/hrApiSlice";
import { formatDate, formatDateTime, parseApiError, rowsOf } from "@/utils/platform";

type Staff = { id: number; employee_code?: string; first_name?: string; last_name?: string };
type StaffAttendance = { id: number; staff: number; attendance_date?: string; status?: string; source?: string; worked_minutes?: number };
type AttendanceSummary = { count?: number; summary?: Record<string, number> };
type PerformanceCycle = { id: number; name: string; status: string; start_date?: string; end_date?: string };
type PerformanceGoal = { id: number; cycle: number; staff: number; title: string; weight?: string | number; manager_rating?: string | number; status?: string };
type PerformanceEvaluation = { id: number; cycle: number; staff: number; evaluator?: number; status?: string; overall_rating?: string | number; submitted_at?: string; approved_at?: string };
type StaffDocument = { id: number; staff: number; document_type?: string; file_url?: string; created_at?: string };

type AttendanceForm = { staff: number; attendance_date: string; status: string; worked_minutes?: number; source: string };
type CycleForm = { name: string; start_date: string; end_date: string; status: string; is_active: boolean };
type GoalForm = { cycle: number; staff: number; title: string; weight: number; manager_rating?: number; status: string };
type EvaluationForm = { cycle: number; staff: number; evaluator?: number; status: string };
type DocumentForm = { staff: number; document_type: string };

export default function HRWorkflowCenter() {
  const [attendanceForm] = Form.useForm<AttendanceForm>();
  const [cycleForm] = Form.useForm<CycleForm>();
  const [goalForm] = Form.useForm<GoalForm>();
  const [evaluationForm] = Form.useForm<EvaluationForm>();
  const [documentForm] = Form.useForm<DocumentForm>();
  const { data: staffData, isFetching: staffLoading, refetch: refetchStaff } = useGetStaffProfilesQuery({ page: 1, page_size: 200 });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [attendanceRows, setAttendanceRows] = useState<StaffAttendance[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [cycles, setCycles] = useState<PerformanceCycle[]>([]);
  const [goals, setGoals] = useState<PerformanceGoal[]>([]);
  const [evaluations, setEvaluations] = useState<PerformanceEvaluation[]>([]);
  const [documents, setDocuments] = useState<StaffDocument[]>([]);
  const [uploadedAssetId, setUploadedAssetId] = useState<number | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const { attendanceData, cycleData, goalData, evaluationData, documentData } = await hrApi.workflow.load();
      setAttendanceRows(rowsOf(attendanceData) as StaffAttendance[]);
      setCycles(rowsOf(cycleData) as PerformanceCycle[]);
      setGoals(rowsOf(goalData) as PerformanceGoal[]);
      setEvaluations(rowsOf(evaluationData) as PerformanceEvaluation[]);
      setDocuments(rowsOf(documentData) as StaffDocument[]);
    } catch (error) {
      message.error(parseApiError(error, "Failed to load HR workflow workspace"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    setStaff(rowsOf(staffData) as Staff[]);
  }, [staffData]);

  const pageLoading = loading || staffLoading;

  const refreshAll = async () => {
    await Promise.all([loadAll(), refetchStaff()]);
  };

  const staffMap = useMemo(() => new Map(staff.map((item) => [item.id, `${item.employee_code ?? item.id} - ${item.first_name ?? ""} ${item.last_name ?? ""}`.trim()])), [staff]);

  const attendanceColumns: ColumnsType<StaffAttendance> = [
    { title: "Staff", dataIndex: "staff", render: (value) => <span className="text-white/80">{staffMap.get(value) ?? `#${value}`}</span> },
    { title: "Date", dataIndex: "attendance_date", render: (value) => <span className="text-white/55">{formatDate(value)}</span> },
    { title: "Status", dataIndex: "status", render: (value) => <Tag color={value === "PRESENT" ? "success" : value === "ABSENT" ? "error" : "processing"}>{value}</Tag> },
    { title: "Source", dataIndex: "source" },
    { title: "Minutes", dataIndex: "worked_minutes" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Typography.Title level={4} className="!mb-0 !text-white">
            HR Workflow
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-white/60">
            Attendance summaries, staff document upload, performance cycles, goals, and approvals.
          </Typography.Paragraph>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => void refreshAll()} loading={pageLoading}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr,1.05fr]">
        <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
          <div className="text-white font-medium mb-3">Staff Attendance</div>
          <Form<AttendanceForm> form={attendanceForm} layout="vertical" requiredMark={false}>
            <Form.Item name="staff" label="Staff" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={staff.map((item) => ({ value: item.id, label: staffMap.get(item.id) ?? item.employee_code }))} /></Form.Item>
            <Row gutter={12}>
              <Col span={12}><Form.Item name="attendance_date" label="Date" rules={[{ required: true }]}><Input type="date" /></Form.Item></Col>
              <Col span={12}><Form.Item name="status" label="Status" rules={[{ required: true }]}><Select options={[{ label: "Present", value: "PRESENT" }, { label: "Absent", value: "ABSENT" }, { label: "Half Day", value: "HALF_DAY" }, { label: "On Leave", value: "ON_LEAVE" }]} /></Form.Item></Col>
            </Row>
            <Row gutter={12}>
              <Col span={12}><Form.Item name="worked_minutes" label="Worked Minutes"><InputNumber className="!w-full" min={0} /></Form.Item></Col>
              <Col span={12}><Form.Item name="source" label="Source" rules={[{ required: true }]}><Select options={[{ label: "Biometric", value: "BIOMETRIC" }, { label: "Manual", value: "MANUAL" }]} /></Form.Item></Col>
            </Row>
            <Space wrap>
              <Button
                type="primary"
                className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
                loading={submitting}
                onClick={async () => {
                  try {
                    const values = await attendanceForm.validateFields();
                    setSubmitting(true);
                    await hrApi.workflow.createAttendance(values);
                    const summary = await hrApi.workflow.getAttendanceSummary(values.staff);
                    setAttendanceSummary(summary as AttendanceSummary);
                    message.success("Attendance saved");
                    await loadAll();
                  } catch (error) {
                    message.error(parseApiError(error, "Unable to save attendance"));
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                Save Attendance
              </Button>
              <Button
                onClick={async () => {
                  try {
                    const values = await attendanceForm.validateFields(["staff"]);
                    const summary = await hrApi.workflow.getAttendanceSummary(values.staff);
                    setAttendanceSummary(summary as AttendanceSummary);
                  } catch (error) {
                    message.error(parseApiError(error, "Unable to load attendance summary"));
                  }
                }}
              >
                Load Summary
              </Button>
            </Space>
          </Form>

          {attendanceSummary ? (
            <Row gutter={[12, 12]} className="mt-5">
              {Object.entries(attendanceSummary.summary ?? {}).map(([key, value]) => (
                <Col span={12} key={key}>
                  <Card className="!bg-white/5 !border-white/10 !rounded-2xl">
                    <Statistic title={<span className="text-white/60">{key.replace(/_/g, " ")}</span>} value={value} valueStyle={{ color: "#e5e7eb" }} />
                  </Card>
                </Col>
              ))}
            </Row>
          ) : null}
        </Card>

        <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
          <div className="text-white font-medium mb-3">Staff Document Upload</div>
          <Form<DocumentForm> form={documentForm} layout="vertical" requiredMark={false}>
            <Form.Item name="staff" label="Staff" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={staff.map((item) => ({ value: item.id, label: staffMap.get(item.id) ?? item.employee_code }))} /></Form.Item>
            <Form.Item name="document_type" label="Document Type" rules={[{ required: true }]}><Input placeholder="PAN, Tax Form, Contract..." /></Form.Item>
          </Form>
          <FileAssetUploader purpose="STAFF_DOCUMENT" buttonLabel="Choose Staff File" onUploaded={(asset) => setUploadedAssetId(asset.id)} />
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-sm text-white/55">Uploaded asset: {uploadedAssetId ? `#${uploadedAssetId}` : "None yet"}</span>
            <Button
              type="primary"
              className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
              loading={submitting}
              onClick={async () => {
                try {
                  const values = await documentForm.validateFields();
                  if (!uploadedAssetId) {
                    message.warning("Upload a file first");
                    return;
                  }
                  setSubmitting(true);
                  await hrApi.workflow.createStaffDocument({ ...values, file_asset: uploadedAssetId });
                  message.success("Staff document linked");
                  documentForm.resetFields();
                  setUploadedAssetId(null);
                  await loadAll();
                } catch (error) {
                  message.error(parseApiError(error, "Unable to save staff document"));
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              Save Document
            </Button>
          </div>
          <div className="mt-5">
            <Table
              rowKey="id"
              dataSource={documents}
              columns={[
                { title: "Staff", dataIndex: "staff", render: (value) => <span className="text-white/80">{staffMap.get(value) ?? `#${value}`}</span> },
                { title: "Type", dataIndex: "document_type" },
                { title: "Preview", dataIndex: "file_url", render: (value) => value ? <a href={String(value)} target="_blank" rel="noreferrer" className="text-[var(--cv-accent)]">Open</a> : "-" },
                { title: "Created", dataIndex: "created_at", render: (value) => <span className="text-white/55">{formatDateTime(value)}</span> },
              ]}
              pagination={{ pageSize: 5 }}
            />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
          <div className="text-white font-medium mb-3">Performance Cycle</div>
          <Form<CycleForm> form={cycleForm} layout="vertical" requiredMark={false}>
            <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
            <Row gutter={12}>
              <Col span={12}><Form.Item name="start_date" label="Start" rules={[{ required: true }]}><Input type="date" /></Form.Item></Col>
              <Col span={12}><Form.Item name="end_date" label="End" rules={[{ required: true }]}><Input type="date" /></Form.Item></Col>
            </Row>
            <Row gutter={12}>
              <Col span={12}><Form.Item name="status" label="Status" rules={[{ required: true }]}><Select options={[{ label: "Draft", value: "DRAFT" }, { label: "Active", value: "ACTIVE" }, { label: "Closed", value: "CLOSED" }]} /></Form.Item></Col>
              <Col span={12}><Form.Item name="is_active" label="Enabled" rules={[{ required: true }]}><Select options={[{ label: "Enabled", value: true }, { label: "Disabled", value: false }]} /></Form.Item></Col>
            </Row>
            <Button
              type="primary"
              className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
              loading={submitting}
              onClick={async () => {
                try {
                  const values = await cycleForm.validateFields();
                  setSubmitting(true);
                  await hrApi.workflow.createPerformanceCycle(values);
                  message.success("Performance cycle created");
                  cycleForm.resetFields();
                  await loadAll();
                } catch (error) {
                  message.error(parseApiError(error, "Unable to create cycle"));
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              Save Cycle
            </Button>
          </Form>
        </Card>

        <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
          <div className="text-white font-medium mb-3">Performance Goal</div>
          <Form<GoalForm> form={goalForm} layout="vertical" requiredMark={false}>
            <Form.Item name="cycle" label="Cycle" rules={[{ required: true }]}><Select options={cycles.map((item) => ({ value: item.id, label: item.name }))} /></Form.Item>
            <Form.Item name="staff" label="Staff" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={staff.map((item) => ({ value: item.id, label: staffMap.get(item.id) ?? item.employee_code }))} /></Form.Item>
            <Form.Item name="title" label="Title" rules={[{ required: true }]}><Input /></Form.Item>
            <Row gutter={12}>
              <Col span={12}><Form.Item name="weight" label="Weight" rules={[{ required: true }]}><InputNumber className="!w-full" min={0} max={100} /></Form.Item></Col>
              <Col span={12}><Form.Item name="manager_rating" label="Manager Rating"><InputNumber className="!w-full" min={0} max={5} step={0.01} /></Form.Item></Col>
            </Row>
            <Form.Item name="status" label="Status" rules={[{ required: true }]}><Select options={[{ label: "Open", value: "OPEN" }, { label: "Completed", value: "COMPLETED" }]} /></Form.Item>
            <Button
              type="primary"
              className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
              loading={submitting}
              onClick={async () => {
                try {
                  const values = await goalForm.validateFields();
                  setSubmitting(true);
                  await hrApi.workflow.createPerformanceGoal(values);
                  message.success("Goal created");
                  goalForm.resetFields();
                  await loadAll();
                } catch (error) {
                  message.error(parseApiError(error, "Unable to create goal"));
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              Save Goal
            </Button>
          </Form>
        </Card>

        <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
          <div className="text-white font-medium mb-3">Evaluation</div>
          <Form<EvaluationForm> form={evaluationForm} layout="vertical" requiredMark={false}>
            <Form.Item name="cycle" label="Cycle" rules={[{ required: true }]}><Select options={cycles.map((item) => ({ value: item.id, label: item.name }))} /></Form.Item>
            <Form.Item name="staff" label="Staff" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={staff.map((item) => ({ value: item.id, label: staffMap.get(item.id) ?? item.employee_code }))} /></Form.Item>
            <Form.Item name="evaluator" label="Evaluator User ID"><InputNumber className="!w-full" min={1} /></Form.Item>
            <Form.Item name="status" label="Status" rules={[{ required: true }]}><Select options={[{ label: "Draft", value: "DRAFT" }, { label: "Submitted", value: "SUBMITTED" }, { label: "Approved", value: "APPROVED" }]} /></Form.Item>
            <Button
              type="primary"
              className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
              loading={submitting}
              onClick={async () => {
                try {
                  const values = await evaluationForm.validateFields();
                  setSubmitting(true);
                  await hrApi.workflow.createPerformanceEvaluation(values);
                  message.success("Evaluation created");
                  evaluationForm.resetFields();
                  await loadAll();
                } catch (error) {
                  message.error(parseApiError(error, "Unable to create evaluation"));
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              Save Evaluation
            </Button>
          </Form>
        </Card>
      </div>

      <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
        <div className="grid gap-4 xl:grid-cols-3">
          <div>
            <div className="text-white font-medium mb-3">Cycles</div>
            <Table rowKey="id" dataSource={cycles} columns={[
              { title: "Name", dataIndex: "name" },
              { title: "Status", dataIndex: "status", render: (value) => <Tag color={value === "ACTIVE" ? "success" : value === "CLOSED" ? "default" : "processing"}>{value}</Tag> },
              { title: "Actions", key: "actions", render: (_, row) => <Space wrap><Button size="small" onClick={async () => { try { await hrApi.workflow.activatePerformanceCycle(row.id); await loadAll(); } catch (error) { message.error(parseApiError(error, "Unable to activate cycle")); } }}>Activate</Button><Button size="small" onClick={async () => { try { await hrApi.workflow.closePerformanceCycle(row.id); await loadAll(); } catch (error) { message.error(parseApiError(error, "Unable to close cycle")); } }}>Close</Button></Space> },
            ]} pagination={{ pageSize: 5 }} /></div>
          <div>
            <div className="text-white font-medium mb-3">Goals</div>
            <Table rowKey="id" dataSource={goals} columns={[
              { title: "Staff", dataIndex: "staff", render: (value) => staffMap.get(value) ?? `#${value}` },
              { title: "Title", dataIndex: "title" },
              { title: "Weight", dataIndex: "weight" },
              { title: "Rating", dataIndex: "manager_rating" },
            ]} pagination={{ pageSize: 5 }} /></div>
          <div>
            <div className="text-white font-medium mb-3">Evaluations</div>
            <Table rowKey="id" dataSource={evaluations} columns={[
              { title: "Staff", dataIndex: "staff", render: (value) => staffMap.get(value) ?? `#${value}` },
              { title: "Status", dataIndex: "status", render: (value) => <Tag color={value === "APPROVED" ? "success" : value === "SUBMITTED" ? "processing" : "default"}>{value}</Tag> },
              { title: "Rating", dataIndex: "overall_rating" },
              { title: "Actions", key: "actions", render: (_, row) => <Space wrap><Button size="small" onClick={async () => { try { await hrApi.workflow.submitEvaluation(row.id); await loadAll(); } catch (error) { message.error(parseApiError(error, "Unable to submit evaluation")); } }}>Submit</Button><Button size="small" onClick={async () => { try { await hrApi.workflow.approveEvaluation(row.id); await loadAll(); } catch (error) { message.error(parseApiError(error, "Unable to approve evaluation")); } }}>Approve</Button></Space> },
            ]} pagination={{ pageSize: 5 }} /></div>
        </div>
      </Card>

      <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
        <div className="text-white font-medium mb-3">Attendance Records</div>
        <Table rowKey="id" loading={pageLoading} dataSource={attendanceRows} columns={attendanceColumns} pagination={{ pageSize: 8 }} />
      </Card>
    </div>
  );
}
