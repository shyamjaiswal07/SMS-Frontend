import { ReloadOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, Input, InputNumber, Row, Select, Space, Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { useGetCoursesQuery } from "@/features/academics/academicsApiSlice";
import { academicOperationsApi } from "@/features/academics/academicOperationsApi";
import { useGetAcademicYearsQuery, useGetTermsQuery } from "@/features/institutions/institutionsApiSlice";
import { formatDateTime, parseApiError, rowsOf } from "@/utils/platform";

type AcademicYear = { id: number; name?: string };
type Term = { id: number; name?: string };
type Course = { id: number; code?: string; title?: string };
type CurriculumVersion = { id: number; name: string; version_number: number; academic_year?: number | null; status: string; published_at?: string | null; is_active?: boolean };
type CurriculumCourse = { id: number; curriculum_version: number; course: number; term?: number | null; sequence?: number; is_mandatory?: boolean; credits_override?: string | number };

type CurriculumForm = { name: string; version_number: number; academic_year?: number; status: string; notes?: string; is_active: boolean };
type MappingForm = { curriculum_version: number; course: number; term?: number; sequence: number; is_mandatory: boolean; credits_override?: number };

export default function CurriculumCenter() {
  const [curriculumForm] = Form.useForm<CurriculumForm>();
  const [mappingForm] = Form.useForm<MappingForm>();
  const { data: yearsData, isFetching: yearsLoading, refetch: refetchYears } = useGetAcademicYearsQuery({ page: 1, page_size: 100 });
  const { data: termsData, isFetching: termsLoading, refetch: refetchTerms } = useGetTermsQuery({ page: 1, page_size: 100 });
  const { data: coursesData, isFetching: coursesLoading, refetch: refetchCourses } = useGetCoursesQuery({ page: 1, page_size: 200 });
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [curriculums, setCurriculums] = useState<CurriculumVersion[]>([]);
  const [mappings, setMappings] = useState<CurriculumCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const { curriculumData, mappingData } = await academicOperationsApi.curriculum.load();
      setCurriculums(rowsOf(curriculumData) as CurriculumVersion[]);
      setMappings(rowsOf(mappingData) as CurriculumCourse[]);
    } catch (error) {
      message.error(parseApiError(error, "Failed to load curriculum workspace"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    setYears(rowsOf(yearsData) as AcademicYear[]);
  }, [yearsData]);

  useEffect(() => {
    setTerms(rowsOf(termsData) as Term[]);
  }, [termsData]);

  useEffect(() => {
    setCourses(rowsOf(coursesData) as Course[]);
  }, [coursesData]);

  const pageLoading = loading || yearsLoading || termsLoading || coursesLoading;

  const refreshAll = async () => {
    await Promise.all([loadAll(), refetchYears(), refetchTerms(), refetchCourses()]);
  };

  const yearMap = useMemo(() => new Map(years.map((item) => [item.id, item.name ?? `Year #${item.id}`])), [years]);
  const termMap = useMemo(() => new Map(terms.map((item) => [item.id, item.name ?? `Term #${item.id}`])), [terms]);
  const courseMap = useMemo(() => new Map(courses.map((item) => [item.id, `${item.code ?? item.id} - ${item.title ?? ""}`.trim()])), [courses]);
  const curriculumMap = useMemo(() => new Map(curriculums.map((item) => [item.id, `${item.name} v${item.version_number}`])), [curriculums]);

  const curriculumColumns: ColumnsType<CurriculumVersion> = [
    { title: "Name", dataIndex: "name", render: (value) => <span className="text-white/85">{value}</span> },
    { title: "Version", dataIndex: "version_number" },
    { title: "Year", dataIndex: "academic_year", render: (value) => <span className="text-white/70">{value ? yearMap.get(value) ?? `#${value}` : "-"}</span> },
    { title: "Status", dataIndex: "status", render: (value) => <Tag color={value === "PUBLISHED" ? "success" : "default"}>{value}</Tag> },
    { title: "Published", dataIndex: "published_at", render: (value) => <span className="text-white/55">{formatDateTime(value)}</span> },
    {
      title: "Actions",
      key: "actions",
      render: (_, row) => (
        <Space wrap>
          <Button
            size="small"
            onClick={async () => {
              try {
                await academicOperationsApi.curriculum.publishCurriculum(row.id);
                message.success("Curriculum published");
                await loadAll();
              } catch (error) {
                message.error(parseApiError(error, "Unable to publish curriculum"));
              }
            }}
          >
            Publish
          </Button>
          <Button
            size="small"
            onClick={async () => {
              try {
                await academicOperationsApi.curriculum.cloneCurriculum(row.id);
                message.success("Curriculum cloned");
                await loadAll();
              } catch (error) {
                message.error(parseApiError(error, "Unable to clone curriculum"));
              }
            }}
          >
            Clone
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
            Curriculum Versioning
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-white/60">
            Manage draft and published curricula, then map courses by term and sequence.
          </Typography.Paragraph>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => void refreshAll()} loading={pageLoading}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
          <div className="text-white font-medium mb-3">Curriculum Version</div>
          <Form<CurriculumForm> form={curriculumForm} layout="vertical" requiredMark={false}>
            <Row gutter={12}>
              <Col span={16}><Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
              <Col span={8}><Form.Item name="version_number" label="Version" rules={[{ required: true }]}><InputNumber className="!w-full" min={1} /></Form.Item></Col>
            </Row>
            <Form.Item name="academic_year" label="Academic Year"><Select allowClear options={years.map((item) => ({ value: item.id, label: yearMap.get(item.id) ?? item.name }))} /></Form.Item>
            <Form.Item name="status" label="Status" rules={[{ required: true }]}><Select options={[{ label: "Draft", value: "DRAFT" }, { label: "Published", value: "PUBLISHED" }]} /></Form.Item>
            <Form.Item name="notes" label="Notes"><Input.TextArea rows={3} /></Form.Item>
            <Form.Item name="is_active" label="Enabled" rules={[{ required: true }]}><Select options={[{ label: "Enabled", value: true }, { label: "Disabled", value: false }]} /></Form.Item>
            <Button
              type="primary"
              className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
              loading={submitting}
              onClick={async () => {
                try {
                  const values = await curriculumForm.validateFields();
                  setSubmitting(true);
                  await academicOperationsApi.curriculum.createCurriculum(values);
                  message.success("Curriculum version created");
                  curriculumForm.resetFields();
                  await loadAll();
                } catch (error) {
                  message.error(parseApiError(error, "Unable to create curriculum version"));
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              Save Curriculum
            </Button>
          </Form>
        </Card>

        <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
          <div className="text-white font-medium mb-3">Course Mapping</div>
          <Form<MappingForm> form={mappingForm} layout="vertical" requiredMark={false}>
            <Form.Item name="curriculum_version" label="Curriculum Version" rules={[{ required: true }]}><Select options={curriculums.map((item) => ({ value: item.id, label: curriculumMap.get(item.id) ?? item.name }))} /></Form.Item>
            <Form.Item name="course" label="Course" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={courses.map((item) => ({ value: item.id, label: courseMap.get(item.id) ?? item.title }))} /></Form.Item>
            <Row gutter={12}>
              <Col span={8}><Form.Item name="term" label="Term"><Select allowClear options={terms.map((item) => ({ value: item.id, label: termMap.get(item.id) ?? item.name }))} /></Form.Item></Col>
              <Col span={8}><Form.Item name="sequence" label="Sequence" rules={[{ required: true }]}><InputNumber className="!w-full" min={1} /></Form.Item></Col>
              <Col span={8}><Form.Item name="credits_override" label="Credits"><InputNumber className="!w-full" min={0} step={0.5} /></Form.Item></Col>
            </Row>
            <Form.Item name="is_mandatory" label="Mandatory" rules={[{ required: true }]}><Select options={[{ label: "Yes", value: true }, { label: "No", value: false }]} /></Form.Item>
            <Button
              type="primary"
              className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
              loading={submitting}
              onClick={async () => {
                try {
                  const values = await mappingForm.validateFields();
                  setSubmitting(true);
                  await academicOperationsApi.curriculum.createCurriculumMapping(values);
                  message.success("Course mapped");
                  mappingForm.resetFields();
                  await loadAll();
                } catch (error) {
                  message.error(parseApiError(error, "Unable to map course"));
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              Save Mapping
            </Button>
          </Form>
        </Card>
      </div>

      <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
        <div className="text-white font-medium mb-3">Curriculum Versions</div>
        <Table rowKey="id" loading={pageLoading} dataSource={curriculums} columns={curriculumColumns} pagination={{ pageSize: 6 }} />

        <div className="mt-6 text-white font-medium mb-3">Curriculum Map</div>
        <Table
          rowKey="id"
          dataSource={mappings}
          columns={[
            { title: "Curriculum", dataIndex: "curriculum_version", render: (value) => <span className="text-white/80">{curriculumMap.get(value) ?? `#${value}`}</span> },
            { title: "Course", dataIndex: "course", render: (value) => <span className="text-white/80">{courseMap.get(value) ?? `#${value}`}</span> },
            { title: "Term", dataIndex: "term", render: (value) => <span className="text-white/70">{value ? termMap.get(value) ?? `#${value}` : "-"}</span> },
            { title: "Sequence", dataIndex: "sequence" },
            { title: "Mandatory", dataIndex: "is_mandatory", render: (value) => <Tag color={value ? "success" : "default"}>{value ? "Yes" : "No"}</Tag> },
          ]}
          pagination={{ pageSize: 6 }}
        />
      </Card>
    </div>
  );
}
