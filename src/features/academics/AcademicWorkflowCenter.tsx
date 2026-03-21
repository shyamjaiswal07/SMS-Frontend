import {
  CalendarOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  ReloadOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { Button, Card, Col, Form, Input, InputNumber, Modal, Row, Select, Space, Statistic, Switch, Table, Tabs, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import FileAssetUploader from "@/features/files/FileAssetUploader";
import apiClient from "@/services/apiClient";
import { formatDateTime, parseApiError, rowsOf } from "@/utils/platform";

type Student = { id: number; student_id?: string; first_name?: string; last_name?: string };
type Term = { id: number; name?: string };
type Section = { id: number; name?: string };
type Course = { id: number; code?: string; title?: string };
type CalendarEvent = {
  id: number;
  term?: number | null;
  section?: number | null;
  course?: number | null;
  title?: string;
  description?: string;
  event_type?: string;
  starts_at?: string;
  ends_at?: string;
  is_all_day?: boolean;
  location?: string;
  color_hex?: string;
};
type Assignment = {
  id: number;
  term?: number | null;
  section?: number | null;
  course?: number;
  title?: string;
  description?: string;
  instructions?: string;
  max_marks?: string | number;
  due_at?: string;
  allow_late_submission?: boolean;
  late_due_at?: string | null;
  status?: string;
  published_at?: string | null;
  closed_at?: string | null;
};
type Submission = {
  id: number;
  assignment: number;
  student?: number;
  submitted_at?: string | null;
  submission_text?: string;
  file_asset?: number | null;
  status?: string;
  marks_obtained?: string | number | null;
  feedback?: string;
  graded_by?: number | null;
  graded_at?: string | null;
  is_resubmission?: boolean;
};

type CalendarFormValues = {
  term?: number;
  section?: number;
  course?: number;
  title: string;
  description?: string;
  event_type: string;
  starts_at: string;
  ends_at: string;
  is_all_day: boolean;
  location?: string;
  color_hex?: string;
};
type AssignmentFormValues = {
  term?: number;
  section?: number;
  course: number;
  title: string;
  description?: string;
  instructions?: string;
  max_marks: number;
  due_at: string;
  allow_late_submission: boolean;
  late_due_at?: string;
};
type SubmissionFormValues = {
  assignment_id: number;
  student_id?: number;
  submission_text?: string;
};
type GradeFormValues = {
  marks_obtained: number;
  feedback?: string;
};
type ExtendFormValues = {
  due_at?: string;
  allow_late_submission?: boolean;
  late_due_at?: string;
};

const eventTypeOptions = [
  { label: "Term Start", value: "TERM_START" },
  { label: "Term End", value: "TERM_END" },
  { label: "Exam", value: "EXAM" },
  { label: "Assignment", value: "ASSIGNMENT" },
  { label: "Holiday", value: "HOLIDAY" },
  { label: "Meeting", value: "MEETING" },
  { label: "Activity", value: "ACTIVITY" },
];

function assignmentStatusColor(status?: string) {
  if (status === "PUBLISHED") return "processing";
  if (status === "CLOSED") return "orange";
  if (status === "ARCHIVED") return "default";
  if (status === "CANCELLED") return "red";
  return "blue";
}

function submissionStatusColor(status?: string) {
  if (status === "GRADED") return "success";
  if (status === "LATE_SUBMITTED") return "orange";
  return "processing";
}

export default function AcademicWorkflowCenter() {
  const [calendarForm] = Form.useForm<CalendarFormValues>();
  const [assignmentForm] = Form.useForm<AssignmentFormValues>();
  const [submissionForm] = Form.useForm<SubmissionFormValues>();
  const [gradeForm] = Form.useForm<GradeFormValues>();
  const [extendForm] = Form.useForm<ExtendFormValues>();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);
  const [uploadedSubmissionAssetId, setUploadedSubmissionAssetId] = useState<number | null>(null);
  const [gradeTarget, setGradeTarget] = useState<Submission | null>(null);
  const [extendTarget, setExtendTarget] = useState<Assignment | null>(null);
  const [activeTab, setActiveTab] = useState("calendar");

  const loadAll = async () => {
    setLoading(true);
    try {
      const settled = await Promise.allSettled([
        apiClient.get("/api/students/students/", { params: { page: 1, page_size: 200 } }),
        apiClient.get("/api/institutions/terms/", { params: { page: 1, page_size: 100 } }),
        apiClient.get("/api/institutions/sections/", { params: { page: 1, page_size: 200 } }),
        apiClient.get("/api/academics/courses/", { params: { page: 1, page_size: 200 } }),
        apiClient.get("/api/academics/calendar-events/", { params: { page: 1, page_size: 200 } }),
        apiClient.get("/api/academics/assignments/", { params: { page: 1, page_size: 200 } }),
        apiClient.get("/api/academics/assignment-submissions/", { params: { page: 1, page_size: 500 } }),
      ]);

      const valueAt = <T,>(index: number, fallback: T) =>
        settled[index].status === "fulfilled" ? (settled[index] as PromiseFulfilledResult<{ data: T }>).value.data : fallback;

      setStudents(rowsOf(valueAt(0, [] as Student[])) as Student[]);
      setTerms(rowsOf(valueAt(1, [] as Term[])) as Term[]);
      setSections(rowsOf(valueAt(2, [] as Section[])) as Section[]);
      setCourses(rowsOf(valueAt(3, [] as Course[])) as Course[]);
      setEvents(rowsOf(valueAt(4, [] as CalendarEvent[])) as CalendarEvent[]);
      const nextAssignments = rowsOf(valueAt(5, [] as Assignment[])) as Assignment[];
      setAssignments(nextAssignments);
      setSubmissions(rowsOf(valueAt(6, [] as Submission[])) as Submission[]);
      if (!selectedAssignmentId && nextAssignments.length) {
        setSelectedAssignmentId(nextAssignments[0].id);
        submissionForm.setFieldValue("assignment_id", nextAssignments[0].id);
      }
    } catch (error) {
      message.error(parseApiError(error, "Failed to load academic workflow workspace"));
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
  const termMap = useMemo(() => new Map(terms.map((item) => [item.id, item.name ?? `Term #${item.id}`])), [terms]);
  const sectionMap = useMemo(() => new Map(sections.map((item) => [item.id, item.name ?? `Section #${item.id}`])), [sections]);
  const courseMap = useMemo(() => new Map(courses.map((item) => [item.id, `${item.code ?? item.id} - ${item.title ?? ""}`.trim()])), [courses]);

  const selectedAssignment = useMemo(
    () => assignments.find((item) => item.id === selectedAssignmentId) ?? null,
    [assignments, selectedAssignmentId],
  );
  const visibleSubmissions = useMemo(
    () => (selectedAssignmentId ? submissions.filter((item) => item.assignment === selectedAssignmentId) : submissions),
    [selectedAssignmentId, submissions],
  );

  const calendarColumns: ColumnsType<CalendarEvent> = [
    { title: "Title", dataIndex: "title", render: (value) => <span className="text-white/85">{value}</span> },
    { title: "Type", dataIndex: "event_type", render: (value) => <Tag color="blue">{value}</Tag> },
    { title: "Course", dataIndex: "course", render: (value) => <span className="text-white/70">{value ? courseMap.get(value) ?? `#${value}` : "-"}</span> },
    { title: "Section", dataIndex: "section", render: (value) => <span className="text-white/70">{value ? sectionMap.get(value) ?? `#${value}` : "-"}</span> },
    { title: "Starts", dataIndex: "starts_at", render: (value) => <span className="text-white/55">{formatDateTime(value)}</span> },
    { title: "Ends", dataIndex: "ends_at", render: (value) => <span className="text-white/55">{formatDateTime(value)}</span> },
  ];

  const assignmentColumns: ColumnsType<Assignment> = [
    { title: "Title", dataIndex: "title", render: (value) => <span className="text-white/85">{value}</span> },
    { title: "Course", dataIndex: "course", render: (value) => <span className="text-white/70">{value ? courseMap.get(value) ?? `#${value}` : "-"}</span> },
    { title: "Due", dataIndex: "due_at", render: (value) => <span className="text-white/55">{formatDateTime(value)}</span> },
    { title: "Status", dataIndex: "status", render: (value) => <Tag color={assignmentStatusColor(value)}>{value}</Tag> },
    {
      title: "Actions",
      key: "actions",
      render: (_, row) => (
        <Space wrap>
          <Button size="small" onClick={() => { setSelectedAssignmentId(row.id); submissionForm.setFieldValue("assignment_id", row.id); setActiveTab("submissions"); }}>
            Submissions
          </Button>
          {row.status === "DRAFT" ? (
            <Button size="small" loading={actionKey === `publish-${row.id}`} onClick={async () => {
              setActionKey(`publish-${row.id}`);
              try {
                await apiClient.post(`/api/academics/assignments/${row.id}/publish/`, {});
                message.success("Assignment published");
                await loadAll();
              } catch (error) {
                message.error(parseApiError(error, "Unable to publish assignment"));
              } finally {
                setActionKey(null);
              }
            }}>
              Publish
            </Button>
          ) : null}
          {row.status === "PUBLISHED" ? (
            <>
              <Button size="small" onClick={() => { setExtendTarget(row); extendForm.setFieldsValue({ due_at: row.due_at ?? undefined, allow_late_submission: row.allow_late_submission, late_due_at: row.late_due_at ?? undefined }); }}>
                Extend
              </Button>
              <Button size="small" loading={actionKey === `close-${row.id}`} onClick={async () => {
                setActionKey(`close-${row.id}`);
                try {
                  await apiClient.post(`/api/academics/assignments/${row.id}/close/`, {});
                  message.success("Assignment closed");
                  await loadAll();
                } catch (error) {
                  message.error(parseApiError(error, "Unable to close assignment"));
                } finally {
                  setActionKey(null);
                }
              }}>
                Close
              </Button>
            </>
          ) : null}
          {row.status !== "ARCHIVED" && row.status !== "CANCELLED" ? (
            <Button size="small" danger loading={actionKey === `cancel-${row.id}`} onClick={async () => {
              setActionKey(`cancel-${row.id}`);
              try {
                await apiClient.post(`/api/academics/assignments/${row.id}/cancel/`, {});
                message.success("Assignment cancelled");
                await loadAll();
              } catch (error) {
                message.error(parseApiError(error, "Unable to cancel assignment"));
              } finally {
                setActionKey(null);
              }
            }}>
              Cancel
            </Button>
          ) : null}
          {row.status === "CLOSED" || row.status === "CANCELLED" ? (
            <Button size="small" loading={actionKey === `archive-${row.id}`} onClick={async () => {
              setActionKey(`archive-${row.id}`);
              try {
                await apiClient.post(`/api/academics/assignments/${row.id}/archive/`, {});
                message.success("Assignment archived");
                await loadAll();
              } catch (error) {
                message.error(parseApiError(error, "Unable to archive assignment"));
              } finally {
                setActionKey(null);
              }
            }}>
              Archive
            </Button>
          ) : null}
        </Space>
      ),
    },
  ];

  const submissionColumns: ColumnsType<Submission> = [
    { title: "Student", dataIndex: "student", render: (value) => <span className="text-white/80">{value ? studentMap.get(value) ?? `#${value}` : "-"}</span> },
    { title: "Status", dataIndex: "status", render: (value) => <Tag color={submissionStatusColor(value)}>{value}</Tag> },
    { title: "Marks", dataIndex: "marks_obtained", render: (value) => <span className="text-white/80">{value ?? "-"}</span> },
    { title: "Submitted", dataIndex: "submitted_at", render: (value) => <span className="text-white/55">{formatDateTime(value)}</span> },
    { title: "Resubmission", dataIndex: "is_resubmission", render: (value) => <Tag color={value ? "orange" : "default"}>{value ? "Yes" : "No"}</Tag> },
    {
      title: "Actions",
      key: "actions",
      render: (_, row) => (
        <Space wrap>
          <Button size="small" onClick={() => { setGradeTarget(row); gradeForm.setFieldsValue({ marks_obtained: row.marks_obtained ? Number(row.marks_obtained) : undefined, feedback: row.feedback ?? "" }); }}>
            Grade
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Typography.Title level={4} className="!mb-0 !text-white">
            Calendar + Assignments
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-white/60">
            Sprint 9 academic calendar, assignment lifecycle, student submissions, and grading workflows.
          </Typography.Paragraph>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => void loadAll()} loading={loading}>
          Refresh
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
            <Statistic title={<span className="text-white/60">Calendar Events</span>} value={events.length} prefix={<CalendarOutlined className="text-[var(--cv-accent)]" />} valueStyle={{ color: "#e5e7eb" }} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
            <Statistic title={<span className="text-white/60">Assignments</span>} value={assignments.length} prefix={<FileTextOutlined className="text-[var(--cv-accent)]" />} valueStyle={{ color: "#e5e7eb" }} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
            <Statistic title={<span className="text-white/60">Submissions</span>} value={submissions.length} prefix={<CheckCircleOutlined className="text-[var(--cv-accent)]" />} valueStyle={{ color: "#e5e7eb" }} />
          </Card>
        </Col>
      </Row>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "calendar",
            label: "Calendar",
            children: (
              <div className="grid gap-4 xl:grid-cols-[0.9fr,1.1fr]">
                <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
                  <div className="text-white font-medium mb-3">Create Calendar Event</div>
                  <Form<CalendarFormValues> form={calendarForm} layout="vertical" requiredMark={false} initialValues={{ event_type: "ACTIVITY", is_all_day: false }}>
                    <Row gutter={12}>
                      <Col span={12}><Form.Item name="term" label="Term"><Select allowClear options={terms.map((item) => ({ value: item.id, label: termMap.get(item.id) ?? item.name }))} /></Form.Item></Col>
                      <Col span={12}><Form.Item name="section" label="Section"><Select allowClear options={sections.map((item) => ({ value: item.id, label: sectionMap.get(item.id) ?? item.name }))} /></Form.Item></Col>
                    </Row>
                    <Form.Item name="course" label="Course"><Select allowClear showSearch optionFilterProp="label" options={courses.map((item) => ({ value: item.id, label: courseMap.get(item.id) ?? item.title }))} /></Form.Item>
                    <Row gutter={12}>
                      <Col span={12}><Form.Item name="title" label="Title" rules={[{ required: true }]}><Input /></Form.Item></Col>
                      <Col span={12}><Form.Item name="event_type" label="Event Type" rules={[{ required: true }]}><Select options={eventTypeOptions} /></Form.Item></Col>
                    </Row>
                    <Form.Item name="description" label="Description"><Input.TextArea rows={3} /></Form.Item>
                    <Row gutter={12}>
                      <Col span={12}><Form.Item name="starts_at" label="Starts At" rules={[{ required: true }]}><Input type="datetime-local" /></Form.Item></Col>
                      <Col span={12}><Form.Item name="ends_at" label="Ends At" rules={[{ required: true }]}><Input type="datetime-local" /></Form.Item></Col>
                    </Row>
                    <Row gutter={12}>
                      <Col span={12}><Form.Item name="location" label="Location"><Input /></Form.Item></Col>
                      <Col span={12}><Form.Item name="color_hex" label="Color"><Input placeholder="#1D4ED8" /></Form.Item></Col>
                    </Row>
                    <Form.Item name="is_all_day" label="All Day" valuePropName="checked"><Switch /></Form.Item>
                    <Button
                      type="primary"
                      className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
                      loading={submitting}
                      onClick={async () => {
                        try {
                          const values = await calendarForm.validateFields();
                          setSubmitting(true);
                          await apiClient.post("/api/academics/calendar-events/", values);
                          message.success("Calendar event created");
                          calendarForm.resetFields();
                          calendarForm.setFieldsValue({ event_type: "ACTIVITY", is_all_day: false });
                          await loadAll();
                        } catch (error) {
                          message.error(parseApiError(error, "Unable to create calendar event"));
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                    >
                      Save Event
                    </Button>
                  </Form>
                </Card>

                <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
                  <div className="text-white font-medium mb-3">Academic Calendar</div>
                  <Table rowKey="id" loading={loading} dataSource={events} columns={calendarColumns} pagination={{ pageSize: 6 }} />
                </Card>
              </div>
            ),
          },
          {
            key: "assignments",
            label: "Assignments",
            children: (
              <div className="grid gap-4 xl:grid-cols-[0.95fr,1.05fr]">
                <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
                  <div className="text-white font-medium mb-3">Create Draft Assignment</div>
                  <Form<AssignmentFormValues> form={assignmentForm} layout="vertical" requiredMark={false} initialValues={{ max_marks: 100, allow_late_submission: false }}>
                    <Row gutter={12}>
                      <Col span={12}><Form.Item name="course" label="Course" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={courses.map((item) => ({ value: item.id, label: courseMap.get(item.id) ?? item.title }))} /></Form.Item></Col>
                      <Col span={12}><Form.Item name="term" label="Term"><Select allowClear options={terms.map((item) => ({ value: item.id, label: termMap.get(item.id) ?? item.name }))} /></Form.Item></Col>
                    </Row>
                    <Row gutter={12}>
                      <Col span={12}><Form.Item name="section" label="Section"><Select allowClear options={sections.map((item) => ({ value: item.id, label: sectionMap.get(item.id) ?? item.name }))} /></Form.Item></Col>
                      <Col span={12}><Form.Item name="max_marks" label="Max Marks" rules={[{ required: true }]}><InputNumber className="!w-full" min={1} /></Form.Item></Col>
                    </Row>
                    <Form.Item name="title" label="Title" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="description" label="Description"><Input.TextArea rows={3} /></Form.Item>
                    <Form.Item name="instructions" label="Instructions"><Input.TextArea rows={3} /></Form.Item>
                    <Row gutter={12}>
                      <Col span={12}><Form.Item name="due_at" label="Due At" rules={[{ required: true }]}><Input type="datetime-local" /></Form.Item></Col>
                      <Col span={12}><Form.Item name="late_due_at" label="Late Due At"><Input type="datetime-local" /></Form.Item></Col>
                    </Row>
                    <Form.Item name="allow_late_submission" label="Allow Late Submission" valuePropName="checked"><Switch /></Form.Item>
                    <Button
                      type="primary"
                      className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
                      loading={submitting}
                      onClick={async () => {
                        try {
                          const values = await assignmentForm.validateFields();
                          setSubmitting(true);
                          await apiClient.post("/api/academics/assignments/", {
                            ...values,
                            late_due_at: values.allow_late_submission ? values.late_due_at || null : null,
                          });
                          message.success("Draft assignment created");
                          assignmentForm.resetFields();
                          assignmentForm.setFieldsValue({ max_marks: 100, allow_late_submission: false });
                          await loadAll();
                        } catch (error) {
                          message.error(parseApiError(error, "Unable to create assignment"));
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                    >
                      Save Draft
                    </Button>
                  </Form>
                </Card>

                <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
                  <div className="text-white font-medium mb-3">Assignment Lifecycle</div>
                  <Table rowKey="id" loading={loading} dataSource={assignments} columns={assignmentColumns} pagination={{ pageSize: 6 }} />
                </Card>
              </div>
            ),
          },
          {
            key: "submissions",
            label: "Submission Desk",
            children: (
              <div className="space-y-4">
                <div className="grid gap-4 xl:grid-cols-[0.95fr,1.05fr]">
                  <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
                    <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                      <div>
                        <div className="text-white font-medium">Submit Assignment Work</div>
                        <div className="text-white/55 text-sm">Supports student text submissions and optional file assets.</div>
                      </div>
                      {selectedAssignment ? <Tag color={assignmentStatusColor(selectedAssignment.status)}>{selectedAssignment.status}</Tag> : null}
                    </div>
                    <Form<SubmissionFormValues> form={submissionForm} layout="vertical" requiredMark={false}>
                      <Form.Item name="assignment_id" label="Assignment" rules={[{ required: true }]}>
                        <Select
                          showSearch
                          optionFilterProp="label"
                          options={assignments.map((item) => ({ value: item.id, label: `${item.title ?? `Assignment #${item.id}`} (${item.status ?? "DRAFT"})` }))}
                          onChange={(value) => setSelectedAssignmentId(value)}
                        />
                      </Form.Item>
                      <Form.Item name="student_id" label="Student">
                        <Select allowClear showSearch optionFilterProp="label" options={students.map((item) => ({ value: item.id, label: studentMap.get(item.id) ?? item.student_id }))} />
                      </Form.Item>
                      <Form.Item name="submission_text" label="Submission Text"><Input.TextArea rows={5} /></Form.Item>

                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-4">
                        <div className="text-white font-medium mb-2">Optional File Upload</div>
                        <FileAssetUploader
                          purpose="ASSIGNMENT_SUBMISSION"
                          buttonLabel="Choose Submission File"
                          helperText={uploadedSubmissionAssetId ? `Attached asset #${uploadedSubmissionAssetId}` : "Upload a PDF, document, or image to attach to the submission."}
                          onUploaded={(asset) => setUploadedSubmissionAssetId(asset.id)}
                        />
                      </div>

                      <Button
                        type="primary"
                        className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
                        icon={<SendOutlined />}
                        loading={submitting}
                        onClick={async () => {
                          try {
                            const values = await submissionForm.validateFields();
                            setSubmitting(true);
                            const payload: Record<string, unknown> = {
                              submission_text: values.submission_text ?? "",
                            };
                            if (values.student_id) payload.student_id = values.student_id;
                            if (uploadedSubmissionAssetId) payload.file_asset_id = uploadedSubmissionAssetId;
                            await apiClient.post(`/api/academics/assignments/${values.assignment_id}/submit/`, payload);
                            message.success("Assignment submitted");
                            setUploadedSubmissionAssetId(null);
                            submissionForm.resetFields();
                            submissionForm.setFieldValue("assignment_id", values.assignment_id);
                            setSelectedAssignmentId(values.assignment_id);
                            await loadAll();
                          } catch (error) {
                            message.error(parseApiError(error, "Unable to submit assignment"));
                          } finally {
                            setSubmitting(false);
                          }
                        }}
                      >
                        Submit Work
                      </Button>
                    </Form>
                  </Card>

                  <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
                    <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                      <div>
                        <div className="text-white font-medium">Submission Queue</div>
                        <div className="text-white/55 text-sm">Review submissions, late work, grades, and resubmissions.</div>
                      </div>
                      <Select
                        allowClear
                        placeholder="Filter by assignment"
                        style={{ minWidth: 260 }}
                        value={selectedAssignmentId ?? undefined}
                        onChange={(value) => setSelectedAssignmentId(value ?? null)}
                        options={assignments.map((item) => ({ value: item.id, label: item.title ?? `Assignment #${item.id}` }))}
                      />
                    </div>
                    {selectedAssignment ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="text-white/55 text-xs uppercase tracking-wider">Focused Assignment</div>
                          <div className="text-white font-medium mt-1">{selectedAssignment.title ?? `Assignment #${selectedAssignment.id}`}</div>
                          <div className="text-white/50 text-xs mt-1">{formatDateTime(selectedAssignment.due_at)}</div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="text-white/55 text-xs uppercase tracking-wider">Submissions</div>
                          <div className="text-white font-medium mt-1">{visibleSubmissions.length}</div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="text-white/55 text-xs uppercase tracking-wider">Late Window</div>
                          <div className="text-white font-medium mt-1">{selectedAssignment.allow_late_submission ? formatDateTime(selectedAssignment.late_due_at) : "Disabled"}</div>
                        </div>
                      </div>
                    ) : null}
                    <Table rowKey="id" loading={loading} dataSource={visibleSubmissions} columns={submissionColumns} pagination={{ pageSize: 6 }} />
                  </Card>
                </div>
              </div>
            ),
          },
        ]}
      />

      <Modal
        title={extendTarget ? `Extend Deadline: ${extendTarget.title ?? `Assignment #${extendTarget.id}`}` : "Extend Deadline"}
        open={!!extendTarget}
        onCancel={() => setExtendTarget(null)}
        confirmLoading={submitting}
        onOk={() => {
          void extendForm.validateFields().then(async (values) => {
            if (!extendTarget) return;
            setSubmitting(true);
            try {
              const payload: Record<string, unknown> = {};
              if (values.due_at) payload.due_at = values.due_at;
              if (typeof values.allow_late_submission === "boolean") payload.allow_late_submission = values.allow_late_submission;
              if ("late_due_at" in values) payload.late_due_at = values.allow_late_submission ? values.late_due_at || null : null;
              await apiClient.post(`/api/academics/assignments/${extendTarget.id}/extend-deadline/`, payload);
              message.success("Deadline updated");
              setExtendTarget(null);
              await loadAll();
            } catch (error) {
              message.error(parseApiError(error, "Unable to extend assignment deadline"));
            } finally {
              setSubmitting(false);
            }
          });
        }}
      >
        <Form<ExtendFormValues> form={extendForm} layout="vertical" requiredMark={false}>
          <Form.Item name="due_at" label="New Due At"><Input type="datetime-local" /></Form.Item>
          <Form.Item name="allow_late_submission" label="Allow Late Submission" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item name="late_due_at" label="Late Due At"><Input type="datetime-local" /></Form.Item>
        </Form>
      </Modal>

      <Modal
        title={gradeTarget ? `Grade Submission #${gradeTarget.id}` : "Grade Submission"}
        open={!!gradeTarget}
        onCancel={() => setGradeTarget(null)}
        confirmLoading={submitting}
        onOk={() => {
          void gradeForm.validateFields().then(async (values) => {
            if (!gradeTarget) return;
            setSubmitting(true);
            try {
              await apiClient.post(`/api/academics/assignment-submissions/${gradeTarget.id}/grade/`, values);
              message.success("Submission graded");
              setGradeTarget(null);
              await loadAll();
            } catch (error) {
              message.error(parseApiError(error, "Unable to grade submission"));
            } finally {
              setSubmitting(false);
            }
          });
        }}
      >
        <Form<GradeFormValues> form={gradeForm} layout="vertical" requiredMark={false}>
          <Form.Item name="marks_obtained" label="Marks Obtained" rules={[{ required: true }]}>
            <InputNumber className="!w-full" min={0} />
          </Form.Item>
          <Form.Item name="feedback" label="Feedback"><Input.TextArea rows={4} /></Form.Item>
          {gradeTarget ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
              Assignment: <span className="text-white/80">{assignments.find((item) => item.id === gradeTarget.assignment)?.title ?? `#${gradeTarget.assignment}`}</span>
              <br />
              Student: <span className="text-white/80">{gradeTarget.student ? studentMap.get(gradeTarget.student) ?? `#${gradeTarget.student}` : "-"}</span>
              <br />
              Submitted: <span className="text-white/80">{formatDateTime(gradeTarget.submitted_at)}</span>
            </div>
          ) : null}
        </Form>
      </Modal>
    </div>
  );
}
