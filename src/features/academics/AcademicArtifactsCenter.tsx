import { DownloadOutlined, ReloadOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, Input, Row, Select, Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { academicOperationsApi } from "@/features/academics/academicOperationsApi";
import { useGetAcademicYearsQuery, useGetTermsQuery } from "@/features/institutions/institutionsApiSlice";
import { useGetStudentsQuery } from "@/features/students/studentsApiSlice";
import { downloadFromApi, formatDate, parseApiError, rowsOf } from "@/utils/platform";

type Student = { id: number; student_id?: string; first_name?: string; last_name?: string };
type AcademicYear = { id: number; name?: string };
type Term = { id: number; name?: string };
type Artifact = { id: number; student?: number; artifact_type?: string; template_name?: string; template_version?: string; verification_code?: string; issued_on?: string };
type VerifyResponse = { verification_code?: string; is_valid?: boolean; artifact_type?: string; student_name?: string; template_name?: string; template_version?: string; issued_on?: string };

type ArtifactForm = { student_id: number; academic_year_id?: number; term_id?: number; artifact_type: "REPORT_CARD" | "CERTIFICATE" | "TRANSCRIPT"; template_name: string; template_version: string; metadata_json?: string };
type VerifyForm = { verification_code: string };

export default function AcademicArtifactsCenter() {
  const [artifactForm] = Form.useForm<ArtifactForm>();
  const [verifyForm] = Form.useForm<VerifyForm>();
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [verification, setVerification] = useState<VerifyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const {
    data: studentsData,
    isFetching: studentsLoading,
    refetch: refetchStudents,
  } = useGetStudentsQuery({ page: 1, page_size: 200 });
  const {
    data: yearsData,
    isFetching: yearsLoading,
    refetch: refetchYears,
  } = useGetAcademicYearsQuery({ page: 1, page_size: 100 });
  const {
    data: termsData,
    isFetching: termsLoading,
    refetch: refetchTerms,
  } = useGetTermsQuery({ page: 1, page_size: 100 });
  const students = rowsOf(studentsData) as Student[];
  const years = rowsOf(yearsData) as AcademicYear[];
  const terms = rowsOf(termsData) as Term[];

  const loadAll = async () => {
    setLoading(true);
    try {
      const { artifactData } = await academicOperationsApi.artifacts.load();
      setArtifacts(rowsOf(artifactData) as Artifact[]);
    } catch (error) {
      message.error(parseApiError(error, "Failed to load academic artifacts"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const studentMap = useMemo(() => new Map(students.map((item) => [item.id, `${item.student_id ?? item.id} - ${item.first_name ?? ""} ${item.last_name ?? ""}`.trim()])), [students]);
  const yearMap = useMemo(() => new Map(years.map((item) => [item.id, item.name ?? `Year #${item.id}`])), [years]);
  const termMap = useMemo(() => new Map(terms.map((item) => [item.id, item.name ?? `Term #${item.id}`])), [terms]);

  const columns: ColumnsType<Artifact> = [
    { title: "Student", dataIndex: "student", render: (value) => <span className="text-white/80">{value ? studentMap.get(value) ?? `#${value}` : "-"}</span> },
    { title: "Type", dataIndex: "artifact_type", render: (value) => <Tag color="blue">{value}</Tag> },
    { title: "Template", key: "template", render: (_, row) => <span className="text-white/70">{row.template_name} / {row.template_version}</span> },
    { title: "Verification", dataIndex: "verification_code", render: (value) => <span className="text-white/85">{value}</span> },
    { title: "Issued", dataIndex: "issued_on", render: (value) => <span className="text-white/55">{formatDate(value)}</span> },
    {
      title: "Download",
      key: "download",
      render: (_, row) => (
        <Button size="small" icon={<DownloadOutlined />} onClick={() => void downloadFromApi(`/api/academics/artifacts/${row.id}/download/`, `artifact-${row.id}.pdf`)}>
          PDF
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Typography.Title level={4} className="!mb-0 !text-white">
            Academic Artifacts
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-white/60">
            Generate report cards, certificates, transcripts, and verify documents by public verification code.
          </Typography.Paragraph>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => void Promise.all([loadAll(), refetchStudents(), refetchYears(), refetchTerms()])}
          loading={loading || studentsLoading || yearsLoading || termsLoading}
        >
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.85fr,1.15fr]">
        <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
          <div className="text-white font-medium mb-3">Generate Artifact</div>
          <Form<ArtifactForm> form={artifactForm} layout="vertical" requiredMark={false}>
            <Form.Item name="student_id" label="Student" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={students.map((item) => ({ value: item.id, label: studentMap.get(item.id) ?? item.student_id }))} /></Form.Item>
            <Row gutter={12}>
              <Col span={12}><Form.Item name="academic_year_id" label="Academic Year"><Select allowClear options={years.map((item) => ({ value: item.id, label: yearMap.get(item.id) ?? item.name }))} /></Form.Item></Col>
              <Col span={12}><Form.Item name="term_id" label="Term"><Select allowClear options={terms.map((item) => ({ value: item.id, label: termMap.get(item.id) ?? item.name }))} /></Form.Item></Col>
            </Row>
            <Row gutter={12}>
              <Col span={12}><Form.Item name="artifact_type" label="Type" rules={[{ required: true }]}><Select options={[{ label: "Report Card", value: "REPORT_CARD" }, { label: "Certificate", value: "CERTIFICATE" }, { label: "Transcript", value: "TRANSCRIPT" }]} /></Form.Item></Col>
              <Col span={12}><Form.Item name="template_name" label="Template" rules={[{ required: true }]}><Input /></Form.Item></Col>
            </Row>
            <Form.Item name="template_version" label="Template Version" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="metadata_json" label="Metadata JSON"><Input.TextArea rows={4} placeholder='{"certificate_name":"Completion Certificate"}' /></Form.Item>
            <Button
              type="primary"
              className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
              icon={<SafetyCertificateOutlined />}
              loading={submitting}
              onClick={async () => {
                try {
                  const values = await artifactForm.validateFields();
                  setSubmitting(true);
                  const endpoint =
                    values.artifact_type;
                  await academicOperationsApi.artifacts.generateArtifact(values.artifact_type, {
                    student_id: values.student_id,
                    academic_year_id: values.academic_year_id,
                    term_id: values.term_id,
                    template_name: values.template_name,
                    template_version: values.template_version,
                    metadata: values.metadata_json?.trim() ? JSON.parse(values.metadata_json) : {},
                  });
                  message.success(`${values.artifact_type.replace(/_/g, " ")} generated`);
                  artifactForm.resetFields();
                  await loadAll();
                } catch (error) {
                  const detail = error instanceof SyntaxError ? "Metadata JSON must be valid JSON" : parseApiError(error, "Unable to generate artifact");
                  message.error(detail);
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              Generate
            </Button>
          </Form>
        </Card>

        <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
          <div className="text-white font-medium mb-3">Verification</div>
          <Form<VerifyForm> form={verifyForm} layout="inline" onFinish={async (values) => {
            try {
              const response = await academicOperationsApi.artifacts.verifyArtifact(values);
              setVerification(response as VerifyResponse);
            } catch (error) {
              message.error(parseApiError(error, "Unable to verify artifact"));
            }
          }}>
            <Form.Item name="verification_code" rules={[{ required: true }]}><Input placeholder="Verification code" /></Form.Item>
            <Form.Item><Button htmlType="submit">Verify</Button></Form.Item>
          </Form>

          {verification ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
              <div className="text-white/80">Status: <Tag color={verification.is_valid ? "success" : "error"}>{verification.is_valid ? "Valid" : "Invalid"}</Tag></div>
              <div className="text-white/70">Student: {verification.student_name ?? "-"}</div>
              <div className="text-white/70">Artifact: {verification.artifact_type ?? "-"}</div>
              <div className="text-white/70">Template: {verification.template_name ?? "-"} / {verification.template_version ?? "-"}</div>
              <div className="text-white/70">Issued: {verification.issued_on ? formatDate(verification.issued_on) : "-"}</div>
            </div>
          ) : null}

          <div className="mt-6 text-white font-medium mb-3">Generated Artifacts</div>
          <Table rowKey="id" loading={loading || studentsLoading || yearsLoading || termsLoading} dataSource={artifacts} columns={columns} pagination={{ pageSize: 6 }} />
        </Card>
      </div>
    </div>
  );
}
