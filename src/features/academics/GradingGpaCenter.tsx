import { ReloadOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, Input, InputNumber, Row, Select, Space, Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import apiClient from "@/services/apiClient";
import { formatDateTime, parseApiError, rowsOf } from "@/utils/platform";

type Student = { id: number; student_id?: string; first_name?: string; last_name?: string };
type Term = { id: number; name?: string };
type AcademicYear = { id: number; name?: string };
type Course = { id: number; code?: string; title?: string };
type AssessmentType = { id: number; name?: string };
type Scheme = { id: number; name: string; code: string };
type Policy = { id: number; course: number; term?: number | null };
type GPARecord = { id: number; student?: number; academic_year?: number | null; term?: number | null; mode?: string; gpa?: string | number; calculated_at?: string };

type SchemeForm = { name: string; code: string; pass_percentage: number; rounding_mode: string; is_default: boolean; is_active: boolean };
type BandForm = { grading_scheme: number; letter: string; min_score: number; max_score: number; grade_points: number; is_passing: boolean };
type PolicyForm = { course: number; term: number; grading_scheme: number; pass_percentage_override: number; normalize_weights: boolean; is_active: boolean };
type WeightForm = { policy: number; assessment_type: number; weight: number };
type RecalcForm = { student_id: number; academic_year_id?: number; term_id?: number };

export default function GradingGpaCenter() {
  const [schemeForm] = Form.useForm<SchemeForm>();
  const [bandForm] = Form.useForm<BandForm>();
  const [policyForm] = Form.useForm<PolicyForm>();
  const [weightForm] = Form.useForm<WeightForm>();
  const [recalcForm] = Form.useForm<RecalcForm>();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentType[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [gpaRecords, setGpaRecords] = useState<GPARecord[]>([]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const settled = await Promise.allSettled([
        apiClient.get("/api/students/students/", { params: { page: 1, page_size: 200 } }),
        apiClient.get("/api/institutions/academic-years/", { params: { page: 1, page_size: 100 } }),
        apiClient.get("/api/institutions/terms/", { params: { page: 1, page_size: 100 } }),
        apiClient.get("/api/academics/courses/", { params: { page: 1, page_size: 200 } }),
        apiClient.get("/api/academics/assessment-types/", { params: { page: 1, page_size: 100 } }),
        apiClient.get("/api/academics/grading-schemes/", { params: { page: 1, page_size: 100 } }),
        apiClient.get("/api/academics/course-grading-policies/", { params: { page: 1, page_size: 100 } }),
        apiClient.get("/api/academics/gpa-records/", { params: { page: 1, page_size: 200 } }),
      ]);

      const valueAt = <T,>(index: number, fallback: T) =>
        settled[index].status === "fulfilled" ? (settled[index] as PromiseFulfilledResult<{ data: T }>).value.data : fallback;

      setStudents(rowsOf(valueAt(0, [] as Student[])) as Student[]);
      setYears(rowsOf(valueAt(1, [] as AcademicYear[])) as AcademicYear[]);
      setTerms(rowsOf(valueAt(2, [] as Term[])) as Term[]);
      setCourses(rowsOf(valueAt(3, [] as Course[])) as Course[]);
      setAssessmentTypes(rowsOf(valueAt(4, [] as AssessmentType[])) as AssessmentType[]);
      setSchemes(rowsOf(valueAt(5, [] as Scheme[])) as Scheme[]);
      setPolicies(rowsOf(valueAt(6, [] as Policy[])) as Policy[]);
      setGpaRecords(rowsOf(valueAt(7, [] as GPARecord[])) as GPARecord[]);
    } catch (error) {
      message.error(parseApiError(error, "Failed to load grading workspace"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const studentMap = useMemo(() => new Map(students.map((item) => [item.id, `${item.student_id ?? item.id} - ${item.first_name ?? ""} ${item.last_name ?? ""}`.trim()])), [students]);
  const courseMap = useMemo(() => new Map(courses.map((item) => [item.id, `${item.code ?? item.id} - ${item.title ?? ""}`.trim()])), [courses]);
  const termMap = useMemo(() => new Map(terms.map((item) => [item.id, item.name ?? `Term #${item.id}`])), [terms]);
  const yearMap = useMemo(() => new Map(years.map((item) => [item.id, item.name ?? `Year #${item.id}`])), [years]);
  const schemeMap = useMemo(() => new Map(schemes.map((item) => [item.id, `${item.name} (${item.code})`])), [schemes]);

  const gpaColumns: ColumnsType<GPARecord> = [
    { title: "Student", dataIndex: "student", render: (value) => <span className="text-white/80">{studentMap.get(value) ?? `#${value}`}</span> },
    { title: "Mode", dataIndex: "mode", render: (value) => <Tag color="blue">{value}</Tag> },
    { title: "Year", dataIndex: "academic_year", render: (value) => <span className="text-white/70">{value ? yearMap.get(value) ?? `#${value}` : "-"}</span> },
    { title: "Term", dataIndex: "term", render: (value) => <span className="text-white/70">{value ? termMap.get(value) ?? `#${value}` : "-"}</span> },
    { title: "GPA", dataIndex: "gpa", render: (value) => <span className="text-white/85">{String(value ?? "-")}</span> },
    { title: "Calculated", dataIndex: "calculated_at", render: (value) => <span className="text-white/55">{formatDateTime(value)}</span> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Typography.Title level={4} className="!mb-0 !text-white">
            Grading + GPA
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-white/60">
            Configure grading policies and recalculate GPA records from the Sprint 4 backend APIs.
          </Typography.Paragraph>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => void loadAll()} loading={loading}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
          <div className="text-white font-medium mb-3">Grading Scheme</div>
          <Form<SchemeForm> form={schemeForm} layout="vertical" requiredMark={false}>
            <Row gutter={12}>
              <Col span={12}><Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="code" label="Code" rules={[{ required: true }]}><Input /></Form.Item></Col>
            </Row>
            <Row gutter={12}>
              <Col span={12}><Form.Item name="pass_percentage" label="Pass %" rules={[{ required: true }]}><InputNumber className="!w-full" min={0} max={100} /></Form.Item></Col>
              <Col span={12}><Form.Item name="rounding_mode" label="Rounding Mode" rules={[{ required: true }]}><Select options={[{ label: "Half Up", value: "HALF_UP" }, { label: "Floor", value: "FLOOR" }, { label: "Ceiling", value: "CEILING" }]} /></Form.Item></Col>
            </Row>
            <Row gutter={12}>
              <Col span={12}><Form.Item name="is_default" label="Default" rules={[{ required: true }]}><Select options={[{ label: "Yes", value: true }, { label: "No", value: false }]} /></Form.Item></Col>
              <Col span={12}><Form.Item name="is_active" label="Enabled" rules={[{ required: true }]}><Select options={[{ label: "Enabled", value: true }, { label: "Disabled", value: false }]} /></Form.Item></Col>
            </Row>
            <Button
              type="primary"
              className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
              loading={submitting}
              onClick={async () => {
                try {
                  const values = await schemeForm.validateFields();
                  setSubmitting(true);
                  await apiClient.post("/api/academics/grading-schemes/", values);
                  message.success("Grading scheme created");
                  schemeForm.resetFields();
                  await loadAll();
                } catch (error) {
                  message.error(parseApiError(error, "Unable to create grading scheme"));
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              Save Scheme
            </Button>
          </Form>
        </Card>

        <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
          <div className="text-white font-medium mb-3">Grade Band</div>
          <Form<BandForm> form={bandForm} layout="vertical" requiredMark={false}>
            <Form.Item name="grading_scheme" label="Scheme" rules={[{ required: true }]}><Select options={schemes.map((item) => ({ value: item.id, label: schemeMap.get(item.id) ?? item.name }))} /></Form.Item>
            <Row gutter={12}>
              <Col span={8}><Form.Item name="letter" label="Letter" rules={[{ required: true }]}><Input /></Form.Item></Col>
              <Col span={8}><Form.Item name="min_score" label="Min" rules={[{ required: true }]}><InputNumber className="!w-full" min={0} max={100} /></Form.Item></Col>
              <Col span={8}><Form.Item name="max_score" label="Max" rules={[{ required: true }]}><InputNumber className="!w-full" min={0} max={100} /></Form.Item></Col>
            </Row>
            <Row gutter={12}>
              <Col span={12}><Form.Item name="grade_points" label="Grade Points" rules={[{ required: true }]}><InputNumber className="!w-full" min={0} max={5} step={0.01} /></Form.Item></Col>
              <Col span={12}><Form.Item name="is_passing" label="Passing" rules={[{ required: true }]}><Select options={[{ label: "Yes", value: true }, { label: "No", value: false }]} /></Form.Item></Col>
            </Row>
            <Button
              type="primary"
              className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
              loading={submitting}
              onClick={async () => {
                try {
                  const values = await bandForm.validateFields();
                  setSubmitting(true);
                  await apiClient.post("/api/academics/grade-bands/", values);
                  message.success("Grade band created");
                  bandForm.resetFields();
                  await loadAll();
                } catch (error) {
                  message.error(parseApiError(error, "Unable to create grade band"));
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              Save Band
            </Button>
          </Form>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
          <div className="text-white font-medium mb-3">Course Grading Policy</div>
          <Form<PolicyForm> form={policyForm} layout="vertical" requiredMark={false}>
            <Form.Item name="course" label="Course" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={courses.map((course) => ({ value: course.id, label: courseMap.get(course.id) ?? course.title }))} /></Form.Item>
            <Row gutter={12}>
              <Col span={12}><Form.Item name="term" label="Term" rules={[{ required: true }]}><Select options={terms.map((term) => ({ value: term.id, label: termMap.get(term.id) ?? term.name }))} /></Form.Item></Col>
              <Col span={12}><Form.Item name="grading_scheme" label="Scheme" rules={[{ required: true }]}><Select options={schemes.map((item) => ({ value: item.id, label: schemeMap.get(item.id) ?? item.name }))} /></Form.Item></Col>
            </Row>
            <Row gutter={12}>
              <Col span={12}><Form.Item name="pass_percentage_override" label="Pass %" rules={[{ required: true }]}><InputNumber className="!w-full" min={0} max={100} /></Form.Item></Col>
              <Col span={12}><Form.Item name="normalize_weights" label="Normalize Weights" rules={[{ required: true }]}><Select options={[{ label: "Yes", value: true }, { label: "No", value: false }]} /></Form.Item></Col>
            </Row>
            <Form.Item name="is_active" label="Enabled" rules={[{ required: true }]}><Select options={[{ label: "Enabled", value: true }, { label: "Disabled", value: false }]} /></Form.Item>
            <Button
              type="primary"
              className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
              loading={submitting}
              onClick={async () => {
                try {
                  const values = await policyForm.validateFields();
                  setSubmitting(true);
                  await apiClient.post("/api/academics/course-grading-policies/", values);
                  message.success("Policy created");
                  policyForm.resetFields();
                  await loadAll();
                } catch (error) {
                  message.error(parseApiError(error, "Unable to create policy"));
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              Save Policy
            </Button>
          </Form>
        </Card>

        <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
          <div className="text-white font-medium mb-3">Assessment Weight Rule</div>
          <Form<WeightForm> form={weightForm} layout="vertical" requiredMark={false}>
            <Form.Item name="policy" label="Policy" rules={[{ required: true }]}><Select options={policies.map((policy) => ({ value: policy.id, label: `${courseMap.get(policy.course) ?? `Course #${policy.course}`} / ${termMap.get(policy.term ?? -1) ?? "-"}` }))} /></Form.Item>
            <Form.Item name="assessment_type" label="Assessment Type" rules={[{ required: true }]}><Select options={assessmentTypes.map((item) => ({ value: item.id, label: item.name ?? `Type #${item.id}` }))} /></Form.Item>
            <Form.Item name="weight" label="Weight %" rules={[{ required: true }]}><InputNumber className="!w-full" min={0} max={100} /></Form.Item>
            <Button
              type="primary"
              className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
              loading={submitting}
              onClick={async () => {
                try {
                  const values = await weightForm.validateFields();
                  setSubmitting(true);
                  await apiClient.post("/api/academics/assessment-weight-rules/", values);
                  message.success("Weight rule created");
                  weightForm.resetFields();
                  await loadAll();
                } catch (error) {
                  message.error(parseApiError(error, "Unable to create weight rule"));
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              Save Weight Rule
            </Button>
          </Form>
        </Card>
      </div>

      <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div>
            <div className="text-white font-medium">GPA Records</div>
            <div className="text-white/55 text-sm">Teacher and admin views for term and cumulative GPA trends.</div>
          </div>
          <Space wrap>
            <Form<RecalcForm> form={recalcForm} layout="inline">
              <Form.Item name="student_id" rules={[{ required: true }]}><Select placeholder="Student" style={{ minWidth: 220 }} options={students.map((student) => ({ value: student.id, label: studentMap.get(student.id) ?? student.student_id }))} /></Form.Item>
              <Form.Item name="academic_year_id"><Select allowClear placeholder="Year" style={{ minWidth: 160 }} options={years.map((year) => ({ value: year.id, label: yearMap.get(year.id) ?? year.name }))} /></Form.Item>
              <Form.Item name="term_id"><Select allowClear placeholder="Term" style={{ minWidth: 160 }} options={terms.map((term) => ({ value: term.id, label: termMap.get(term.id) ?? term.name }))} /></Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
                  loading={submitting}
                  onClick={async () => {
                    try {
                      const values = await recalcForm.validateFields();
                      setSubmitting(true);
                      await apiClient.post("/api/academics/gpa/recalculate/", values);
                      message.success("GPA recalculated");
                      await loadAll();
                    } catch (error) {
                      message.error(parseApiError(error, "Unable to recalculate GPA"));
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  Recalculate
                </Button>
              </Form.Item>
            </Form>
          </Space>
        </div>
        <Table rowKey="id" loading={loading} dataSource={gpaRecords} columns={gpaColumns} pagination={{ pageSize: 8 }} />
      </Card>
    </div>
  );
}
