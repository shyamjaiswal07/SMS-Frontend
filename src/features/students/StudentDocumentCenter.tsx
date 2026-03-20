import { FileTextOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, Select, Space, Table, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import FileAssetUploader from "@/features/files/FileAssetUploader";
import apiClient from "@/services/apiClient";
import { parseApiError, rowsOf } from "@/utils/platform";

type StudentRow = {
  id: number;
  student_id?: string;
  first_name?: string;
  last_name?: string;
};

type StudentDocumentRow = {
  id: number;
  student: number;
  document_type?: string;
  document_number?: string;
  file_url?: string;
  file_asset?: number | null;
  created_at?: string;
};

type DocumentForm = {
  student: number;
  document_type: string;
  document_number?: string;
};

export default function StudentDocumentCenter() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [documents, setDocuments] = useState<StudentDocumentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadedAssetId, setUploadedAssetId] = useState<number | null>(null);
  const [form] = Form.useForm<DocumentForm>();

  const loadAll = async () => {
    setLoading(true);
    try {
      const [studentResponse, documentResponse] = await Promise.all([
        apiClient.get("/api/students/students/", { params: { page: 1, page_size: 200 } }),
        apiClient.get("/api/students/student-documents/", { params: { page: 1, page_size: 200 } }),
      ]);
      setStudents(rowsOf(studentResponse.data) as StudentRow[]);
      setDocuments(rowsOf(documentResponse.data) as StudentDocumentRow[]);
    } catch (error) {
      message.error(parseApiError(error, "Failed to load student documents"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const studentLabelMap = useMemo(
    () =>
      new Map(
        students.map((student) => [
          student.id,
          `${student.student_id ?? student.id} - ${student.first_name ?? ""} ${student.last_name ?? ""}`.trim(),
        ]),
      ),
    [students],
  );

  const columns: ColumnsType<StudentDocumentRow> = [
    { title: "Student", dataIndex: "student", render: (value) => <span className="text-white/80">{studentLabelMap.get(value) ?? `Student #${value}`}</span> },
    { title: "Type", dataIndex: "document_type", render: (value) => <span className="text-white/80">{value || "-"}</span> },
    { title: "Number", dataIndex: "document_number", render: (value) => <span className="text-white/70">{value || "-"}</span> },
    {
      title: "Preview",
      dataIndex: "file_url",
      render: (value) =>
        value ? (
          <a className="text-[var(--cv-accent)]" href={String(value)} target="_blank" rel="noreferrer">
            Open file
          </a>
        ) : (
          "-"
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <Typography.Title level={4} className="!mb-0 !text-white">
              Student Document Upload
            </Typography.Title>
            <Typography.Paragraph className="!mb-0 !text-white/60">
              Sprint 2 upload flow with validation, progress, and preview links for student records.
            </Typography.Paragraph>
          </div>
          <Button onClick={() => void loadAll()} loading={loading}>
            Refresh
          </Button>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.9fr,1.1fr]">
          <Card className="!bg-white/5 !border-white/10 !rounded-3xl">
            <Form<DocumentForm> form={form} layout="vertical" requiredMark={false}>
              <Form.Item name="student" label="Student" rules={[{ required: true }]}>
                <Select
                  showSearch
                  optionFilterProp="label"
                  options={students.map((student) => ({
                    value: student.id,
                    label: studentLabelMap.get(student.id) ?? `Student #${student.id}`,
                  }))}
                />
              </Form.Item>
              <Form.Item name="document_type" label="Document Type" rules={[{ required: true }]}>
                <Input placeholder="Aadhaar, Transfer Certificate, Passport..." />
              </Form.Item>
              <Form.Item name="document_number" label="Document Number">
                <Input placeholder="Optional reference number" />
              </Form.Item>
            </Form>

            <FileAssetUploader
              purpose="STUDENT_DOCUMENT"
              buttonLabel="Choose Student File"
              helperText="Allowed types follow backend validation. Upload first, then attach to the selected student."
              onUploaded={(asset) => setUploadedAssetId(asset.id)}
            />

            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-sm text-white/55">Uploaded asset: {uploadedAssetId ? `#${uploadedAssetId}` : "None yet"}</span>
              <Button
                type="primary"
                className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
                icon={<FileTextOutlined />}
                loading={submitting}
                onClick={async () => {
                  try {
                    const values = await form.validateFields();
                    if (!uploadedAssetId) {
                      message.warning("Upload a file asset first");
                      return;
                    }
                    setSubmitting(true);
                    await apiClient.post("/api/students/student-documents/", {
                      ...values,
                      file_asset: uploadedAssetId,
                    });
                    message.success("Student document linked");
                    form.resetFields();
                    setUploadedAssetId(null);
                    await loadAll();
                  } catch (error) {
                    message.error(parseApiError(error, "Unable to save student document"));
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                Save Document
              </Button>
            </div>
          </Card>

          <Card className="!bg-white/5 !border-white/10 !rounded-3xl">
            <div className="text-white font-medium mb-3">Uploaded Student Documents</div>
            <Table rowKey="id" loading={loading} dataSource={documents} columns={columns} pagination={{ pageSize: 6 }} />
          </Card>
        </div>
      </Card>
    </div>
  );
}
