import {
  Badge,
  Button,
  Card,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Spin,
  Steps,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import type { AdmissionWorkflowState, StudentStatus } from "@/features/students/studentTypes";

type AdmissionApplicationRow = {
  id: number;
  application_no?: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  applying_for_year?: number | string;
  applying_for_grade?: number | string;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  status?: StudentStatus | string;
  workflow_state?: AdmissionWorkflowState;
  notes?: string;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string;
  converted_student?: number | null;
  converted_at?: string | null;
};

type AdmissionWorkflowTransitionRow = {
  id: number;
  from_state?: AdmissionWorkflowState | null;
  to_state: AdmissionWorkflowState;
  action: string;
  reason?: string;
  performed_by?: number | null;
  metadata_json?: Record<string, unknown>;
  created_at?: string;
};

type AdmissionConvertResponse = {
  admission_id: number;
  student_id: string;
  student_pk: number;
  workflow_state: AdmissionWorkflowState;
  enrollment_created: boolean;
};

type Paginated<T> = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
};

type RejectFormValues = {
  reason: string;
};

type ConvertFormValues = {
  student_id?: string;
  admission_number?: string;
};

const statusOptions: Array<{ label: string; value: "ALL" | StudentStatus }> = [
  { label: "All Statuses", value: "ALL" },
  { label: "Applicant", value: "APPLICANT" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Graduated", value: "GRADUATED" },
  { label: "Transferred", value: "TRANSFERRED" },
];

const workflowOptions: Array<{ label: string; value: "ALL" | AdmissionWorkflowState }> = [
  { label: "All Workflow States", value: "ALL" },
  { label: "Draft", value: "DRAFT" },
  { label: "Submitted", value: "SUBMITTED" },
  { label: "Under Review", value: "UNDER_REVIEW" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Waitlisted", value: "WAITLISTED" },
  { label: "Converted", value: "CONVERTED" },
];

const workflowSteps: AdmissionWorkflowState[] = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "CONVERTED"];

const statusTagColor = (status?: string) => {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "APPLICANT":
      return "processing";
    case "INACTIVE":
      return "default";
    case "GRADUATED":
      return "warning";
    case "TRANSFERRED":
      return "error";
    default:
      return "default";
  }
};

const workflowTagColor = (workflowState?: AdmissionWorkflowState) => {
  switch (workflowState) {
    case "DRAFT":
      return "default";
    case "SUBMITTED":
      return "processing";
    case "UNDER_REVIEW":
      return "blue";
    case "APPROVED":
      return "green";
    case "REJECTED":
      return "red";
    case "WAITLISTED":
      return "orange";
    case "CONVERTED":
      return "gold";
    default:
      return "default";
  }
};

const formatDateTime = (value?: string | null) => (value ? new Date(value).toLocaleString() : "-");

function getTenantRole(): string | undefined {
  try {
    return (JSON.parse(sessionStorage.getItem("tenant") || "null")?.role as string | undefined) ?? undefined;
  } catch {
    return undefined;
  }
}

function getWorkflowStepIndex(workflowState?: AdmissionWorkflowState) {
  switch (workflowState) {
    case "REJECTED":
    case "WAITLISTED":
      return 2;
    default:
      return Math.max(workflowSteps.indexOf(workflowState ?? "DRAFT"), 0);
  }
}

export default function Admissions() {
  const role = useMemo(() => getTenantRole(), []);
  const canWrite = role === "SUPER_ADMIN" || role === "SCHOOL_ADMIN";

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<AdmissionApplicationRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [total, setTotal] = useState(0);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | StudentStatus>("ALL");
  const [workflowFilter, setWorkflowFilter] = useState<"ALL" | AdmissionWorkflowState>("ALL");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selected, setSelected] = useState<AdmissionApplicationRow | null>(null);
  const [workflowHistory, setWorkflowHistory] = useState<AdmissionWorkflowTransitionRow[]>([]);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [rejectForm] = Form.useForm<RejectFormValues>();
  const [convertForm] = Form.useForm<ConvertFormValues>();

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.students.admissions.list({
        search: search || undefined,
        page,
        page_size: pageSize,
      });

      const paginated = data as Paginated<AdmissionApplicationRow>;
      const list = Array.isArray(paginated.results) ? paginated.results : [];
      setRows(list);
      setTotal(typeof paginated?.count === "number" ? paginated.count : list.length);
      return list;
    } catch (error: any) {
      message.error(error?.response?.data?.detail ?? "Failed to load admission applications");
      return [] as AdmissionApplicationRow[];
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflowHistory = async (applicationId: number) => {
    setDrawerLoading(true);
    try {
      const history = await api.students.admissions.workflowHistory(applicationId);
      setWorkflowHistory(Array.isArray(history) ? history : []);
    } catch (error: any) {
      message.error(error?.response?.data?.detail ?? "Failed to load workflow history");
      setWorkflowHistory([]);
    } finally {
      setDrawerLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [page, search]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, workflowFilter]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const statusMatches = statusFilter === "ALL" || row.status === statusFilter;
      const workflowMatches = workflowFilter === "ALL" || row.workflow_state === workflowFilter;
      return statusMatches && workflowMatches;
    });
  }, [rows, statusFilter, workflowFilter]);

  const openDrawer = async (row: AdmissionApplicationRow) => {
    setSelected(row);
    setDrawerOpen(true);
    await loadWorkflowHistory(row.id);
  };

  const refreshSelectedState = async (admissionId: number, fallback?: Partial<AdmissionApplicationRow>) => {
    const latestRows = await load();
    const latestSelected = latestRows.find((row) => row.id === admissionId);
    if (latestSelected) {
      setSelected(latestSelected);
    } else if (fallback) {
      setSelected((current) => (current && current.id === admissionId ? { ...current, ...fallback } : current));
    }
    await loadWorkflowHistory(admissionId);
  };

  const runWorkflowAction = async (
    request: () => Promise<AdmissionApplicationRow | AdmissionConvertResponse>,
    successMessage: string,
    fallback?: Partial<AdmissionApplicationRow>,
  ) => {
    if (!selected) return;
    setActionLoading(true);
    try {
      const response = await request();
      const admissionId = "id" in response ? response.id : response.admission_id;
      if ("id" in response) {
        setSelected(response);
      } else {
        setSelected((current) =>
          current && current.id === admissionId
            ? {
                ...current,
                workflow_state: response.workflow_state,
                converted_student: response.student_pk,
                status: "ACTIVE",
              }
            : current,
        );
      }
      message.success(successMessage);
      await refreshSelectedState(admissionId, fallback);
    } catch (error: any) {
      const detail = error?.response?.data;
      if (detail && typeof detail === "object") {
        const firstMessage = Object.values(detail).flat().find(Boolean);
        message.error(typeof firstMessage === "string" ? firstMessage : "Workflow action failed");
      } else {
        message.error(error?.response?.data?.detail ?? "Workflow action failed");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const submitAdmission = async () => {
    if (!selected) return;
    await runWorkflowAction(() => api.students.admissions.submit(selected.id), "Application submitted");
  };

  const startReview = async () => {
    if (!selected) return;
    await runWorkflowAction(() => api.students.admissions.startReview(selected.id), "Application moved to review");
  };

  const approveAdmission = async () => {
    if (!selected) return;
    await runWorkflowAction(() => api.students.admissions.approve(selected.id), "Application approved");
  };

  const rejectAdmission = async () => {
    if (!selected) return;
    const values = await rejectForm.validateFields();
    await runWorkflowAction(() => api.students.admissions.reject(selected.id, values), "Application rejected");
    rejectForm.resetFields();
    setRejectOpen(false);
  };

  const convertAdmission = async () => {
    if (!selected) return;
    const values = await convertForm.validateFields();
    await runWorkflowAction(
      () =>
        api.students.admissions.convert(selected.id, {
          ...values,
          metadata_json: { source: "frontend-admissions-console" },
        }),
      "Application converted to student",
      { workflow_state: "CONVERTED" },
    );
    convertForm.resetFields();
    setConvertOpen(false);
  };

  const columns: ColumnsType<AdmissionApplicationRow> = [
    {
      title: "App No",
      dataIndex: "application_no",
      key: "application_no",
      render: (value) => (
        <div className="flex items-center gap-2">
          <Badge color="orange" className="!bg-[var(--cv-accent)]" />
          <span>{value ?? "-"}</span>
        </div>
      ),
    },
    {
      title: "Student",
      key: "student",
      render: (_, row) => `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || "-",
    },
    {
      title: "Parent",
      key: "parent",
      render: (_, row) => row.parent_name ?? row.parent_phone ?? "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value) => <Tag color={statusTagColor(String(value ?? ""))}>{String(value ?? "-")}</Tag>,
    },
    {
      title: "Workflow",
      dataIndex: "workflow_state",
      key: "workflow_state",
      render: (value) => <Tag color={workflowTagColor(value)}>{value ?? "-"}</Tag>,
    },
  ];

  const actionButtons = useMemo(() => {
    if (!selected) return null;
    switch (selected.workflow_state) {
      case "DRAFT":
        return <Button type="primary" className="!rounded-2xl !bg-[var(--cv-accent)] !border-0" loading={actionLoading} onClick={() => void submitAdmission()}>Submit</Button>;
      case "SUBMITTED":
        return (
          <>
            <Button className="!rounded-2xl" loading={actionLoading} onClick={() => void startReview()}>Start Review</Button>
            <Button type="primary" className="!rounded-2xl !bg-[var(--cv-accent)] !border-0" loading={actionLoading} onClick={() => void approveAdmission()}>Approve</Button>
            <Button danger className="!rounded-2xl" loading={actionLoading} onClick={() => setRejectOpen(true)}>Reject</Button>
          </>
        );
      case "UNDER_REVIEW":
        return (
          <>
            <Button type="primary" className="!rounded-2xl !bg-[var(--cv-accent)] !border-0" loading={actionLoading} onClick={() => void approveAdmission()}>Approve</Button>
            <Button danger className="!rounded-2xl" loading={actionLoading} onClick={() => setRejectOpen(true)}>Reject</Button>
          </>
        );
      case "REJECTED":
      case "WAITLISTED":
        return <Button className="!rounded-2xl" loading={actionLoading} onClick={() => void startReview()}>Re-open Review</Button>;
      case "APPROVED":
        return <Button type="primary" className="!rounded-2xl !bg-[var(--cv-accent)] !border-0" loading={actionLoading} onClick={() => setConvertOpen(true)}>Convert To Student</Button>;
      default:
        return null;
    }
  }, [actionLoading, selected]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Typography.Title level={3} className="!mb-0 text-white">
            Admissions
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-white/60">
            Sprint 8 workflow console for application review, approval, rejection, conversion, and timeline tracking.
          </Typography.Paragraph>
        </div>
        <Button className="!rounded-2xl" onClick={() => void load()} loading={loading}>
          Refresh
        </Button>
      </div>

      <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
        <div className="mb-4 flex gap-3 items-center flex-wrap">
          <Select value={statusFilter} onChange={(value) => setStatusFilter(value)} options={statusOptions} className="min-w-[180px]" />
          <Select value={workflowFilter} onChange={(value) => setWorkflowFilter(value)} options={workflowOptions} className="min-w-[220px]" />
          <Input.Search
            allowClear
            placeholder="Search by application no, student name..."
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
              if (!event.target.value) {
                setSearch("");
                setPage(1);
              }
            }}
            onSearch={(value) => {
              setSearch(value);
              setPage(1);
            }}
            className="min-w-[320px]"
          />
        </div>

        <Table<AdmissionApplicationRow>
          rowKey="id"
          loading={loading}
          dataSource={filteredRows}
          columns={columns}
          onRow={(record) => ({
            onClick: () => {
              void openDrawer(record);
            },
            className: "cursor-pointer",
          })}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: false,
            onChange: (nextPage) => setPage(nextPage),
          }}
        />
      </Card>

      <Drawer
        title={
          selected ? (
            <div className="flex items-center justify-between gap-3 w-full flex-wrap">
              <div>
                <div className="text-white font-semibold">{selected.application_no ?? selected.id}</div>
                <div className="text-white/60 text-sm">
                  {`${selected.first_name ?? ""} ${selected.last_name ?? ""}`.trim() || "Applicant"}
                </div>
              </div>
              <Space wrap>
                <Tag color={statusTagColor(selected.status)}>{selected.status ?? "-"}</Tag>
                <Tag color={workflowTagColor(selected.workflow_state)}>{selected.workflow_state ?? "-"}</Tag>
              </Space>
            </div>
          ) : null
        }
        width={820}
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        destroyOnClose
      >
        {!selected ? null : drawerLoading ? (
          <div className="py-10 flex justify-center">
            <Spin />
          </div>
        ) : (
          <div className="space-y-4">
            <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
              <div className="text-white font-medium mb-4">Workflow Timeline</div>
              <Steps
                current={getWorkflowStepIndex(selected.workflow_state)}
                status={selected.workflow_state === "REJECTED" ? "error" : "process"}
                responsive
                items={workflowSteps.map((step) => ({ title: step.replace(/_/g, " ") }))}
              />
              {selected.workflow_state === "WAITLISTED" ? (
                <div className="mt-3 text-sm text-orange-300">This application is currently waitlisted and can be moved back into review.</div>
              ) : null}
              {selected.rejection_reason ? (
                <div className="mt-3 text-sm text-red-300">Rejection reason: {selected.rejection_reason}</div>
              ) : null}
            </Card>

            <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-white font-medium">Workflow Actions</div>
                  <div className="text-white/55 text-sm">Role-guarded actions are enabled only for school admins and super admins.</div>
                </div>
                <Space wrap>
                  {canWrite ? actionButtons : <Button disabled>No write permission</Button>}
                </Space>
              </div>
            </Card>

            <Descriptions
              column={1}
              size="small"
              styles={{ label: { color: "rgba(255,255,255,0.55)" }, content: { color: "#e5e7eb" } }}
              items={[
                { key: "dob", label: "Date of Birth", children: selected.date_of_birth ?? "-" },
                { key: "year", label: "Applying For Year", children: selected.applying_for_year ? String(selected.applying_for_year) : "-" },
                { key: "grade", label: "Applying For Grade", children: selected.applying_for_grade ? String(selected.applying_for_grade) : "-" },
                { key: "parent", label: "Parent / Guardian", children: selected.parent_name ?? "-" },
                { key: "phone", label: "Parent Phone", children: selected.parent_phone ?? "-" },
                { key: "email", label: "Parent Email", children: selected.parent_email ?? "-" },
                { key: "notes", label: "Notes", children: selected.notes ?? "-" },
                { key: "submitted", label: "Submitted At", children: formatDateTime(selected.submitted_at) },
                { key: "reviewed", label: "Reviewed At", children: formatDateTime(selected.reviewed_at) },
                { key: "approved", label: "Approved At", children: formatDateTime(selected.approved_at) },
                { key: "rejected", label: "Rejected At", children: formatDateTime(selected.rejected_at) },
                { key: "converted", label: "Converted At", children: formatDateTime(selected.converted_at) },
                { key: "converted_student", label: "Converted Student", children: selected.converted_student ? `Student #${selected.converted_student}` : "-" },
              ]}
            />

            <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
              <div className="text-white font-medium mb-3">Workflow History</div>
              {workflowHistory.length ? (
                <div className="space-y-3">
                  {workflowHistory.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <div className="text-white font-medium">{item.action.replace(/_/g, " ")}</div>
                          <div className="text-white/50 text-xs mt-1">
                            {item.from_state ?? "START"} to {item.to_state}
                          </div>
                        </div>
                        <div className="text-white/45 text-xs">{formatDateTime(item.created_at)}</div>
                      </div>
                      <div className="mt-3 text-white/70 text-sm">{item.reason || "No note provided."}</div>
                      {item.performed_by ? <div className="mt-2 text-white/45 text-xs">Actor: User #{item.performed_by}</div> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <Empty description={<span className="text-white/50">No workflow events yet</span>} />
              )}
            </Card>
          </div>
        )}
      </Drawer>

      <Modal
        title="Reject Application"
        open={rejectOpen}
        onCancel={() => setRejectOpen(false)}
        onOk={() => void rejectAdmission()}
        confirmLoading={actionLoading}
      >
        <Form<RejectFormValues> form={rejectForm} layout="vertical" requiredMark={false}>
          <Form.Item name="reason" label="Reason" rules={[{ required: true, message: "Rejection reason is required." }]}>
            <Input.TextArea rows={4} placeholder="Why is this application being rejected?" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Convert To Student"
        open={convertOpen}
        onCancel={() => setConvertOpen(false)}
        onOk={() => void convertAdmission()}
        confirmLoading={actionLoading}
      >
        <div className="mb-4 text-white/60 text-sm">
          Leave both fields blank to use the tenant’s auto-generated student and admission numbers.
        </div>
        <Form<ConvertFormValues> form={convertForm} layout="vertical" requiredMark={false}>
          <Form.Item name="student_id" label="Student ID Override">
            <Input placeholder="Optional manual student ID" />
          </Form.Item>
          <Form.Item name="admission_number" label="Admission Number Override">
            <Input placeholder="Optional admission number" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
