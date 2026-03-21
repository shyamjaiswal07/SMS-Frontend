import {
  Badge,
  Button,
  Card,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/services/api";
import type {
  AdmissionWorkflowState,
  StudentStatus,
} from "@/features/students/studentTypes";
import { AdmissionDrawer } from "./AdmissionDrawer";
import {
  RejectApplicationModal,
  type RejectFormValues,
} from "./RejectApplicationModal";
import {
  ConvertStudentModal,
  type ConvertFormValues,
} from "./ConvertStudentModal";
import {
  type AdmissionApplicationRow,
  type AdmissionWorkflowTransitionRow,
  getTenantRole,
  statusOptions,
  statusTagColor,
  workflowOptions,
  workflowTagColor,
} from "./utils";

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

export default function Admissions() {
  const role = useMemo(() => getTenantRole(), []);
  const canWrite = role === "SUPER_ADMIN" || role === "SCHOOL_ADMIN";

  const [searchParams, setSearchParams] = useSearchParams();
  const urlApplicationId = searchParams.get("applicationId");

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<AdmissionApplicationRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [total, setTotal] = useState(0);

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | StudentStatus>(
    "ALL",
  );
  const [workflowFilter, setWorkflowFilter] = useState<
    "ALL" | AdmissionWorkflowState
  >("ALL");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selected, setSelected] = useState<AdmissionApplicationRow | null>(
    null,
  );
  const [workflowHistory, setWorkflowHistory] = useState<
    AdmissionWorkflowTransitionRow[]
  >([]);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.students.admissions.list({
        search: searchQuery || undefined,
        page,
        page_size: pageSize,
      });

      const paginated = data as Paginated<AdmissionApplicationRow>;
      const list = Array.isArray(paginated.results) ? paginated.results : [];
      setRows(list);
      setTotal(
        typeof paginated?.count === "number" ? paginated.count : list.length,
      );
      return list;
    } catch (error: any) {
      message.error(
        error?.response?.data?.detail ?? "Failed to load applications",
      );
      return [] as AdmissionApplicationRow[];
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflowHistory = async (applicationId: number) => {
    setDrawerLoading(true);
    try {
      const history =
        await api.students.admissions.workflowHistory(applicationId);
      setWorkflowHistory(Array.isArray(history) ? history : []);
    } catch (error: any) {
      message.error(
        error?.response?.data?.detail ?? "Failed to load workflow history",
      );
      setWorkflowHistory([]);
    } finally {
      setDrawerLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [page, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, workflowFilter]);

  // Deep Linking Syncing
  useEffect(() => {
    if (urlApplicationId && rows.length > 0 && !selected) {
      const row = rows.find((r) => r.id.toString() === urlApplicationId);
      if (row) {
        setSelected(row);
        setDrawerOpen(true);
        void loadWorkflowHistory(row.id);
      }
    }
  }, [urlApplicationId, rows, selected]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const statusMatches =
        statusFilter === "ALL" || row.status === statusFilter;
      const workflowMatches =
        workflowFilter === "ALL" || row.workflow_state === workflowFilter;
      return statusMatches && workflowMatches;
    });
  }, [rows, statusFilter, workflowFilter]);

  const openDrawer = async (row: AdmissionApplicationRow) => {
    setSearchParams((prev) => {
      prev.set("applicationId", row.id.toString());
      return prev;
    });
    setSelected(row);
    setDrawerOpen(true);
    await loadWorkflowHistory(row.id);
  };

  const closeDrawer = () => {
    setSearchParams((prev) => {
      prev.delete("applicationId");
      return prev;
    });
    setDrawerOpen(false);
    setTimeout(() => setSelected(null), 300); // clear after animation
  };

  const refreshSelectedState = async (
    admissionId: number,
    fallback?: Partial<AdmissionApplicationRow>,
  ) => {
    const latestRows = await load();
    const latestSelected = latestRows.find((row) => row.id === admissionId);
    if (latestSelected) {
      setSelected(latestSelected);
    } else if (fallback) {
      setSelected((current) =>
        current && current.id === admissionId
          ? { ...current, ...fallback }
          : current,
      );
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
      const admissionId =
        "id" in response ? response.id : response.admission_id;
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
      message.error(error?.response?.data?.detail ?? "Workflow action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const actionButtons = useMemo(() => {
    if (!selected) return null;

    const startReview = () =>
      runWorkflowAction(
        () => api.students.admissions.startReview(selected.id),
        "Application moved to review",
      );
    const approveAdmission = () =>
      runWorkflowAction(
        () => api.students.admissions.approve(selected.id),
        "Application approved",
      );
    const submitAdmission = () =>
      runWorkflowAction(
        () => api.students.admissions.submit(selected.id),
        "Application submitted",
      );

    switch (selected.workflow_state) {
      case "DRAFT":
        return (
          <Button
            type="primary"
            className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
            loading={actionLoading}
            onClick={() => void submitAdmission()}
          >
            Submit
          </Button>
        );
      case "SUBMITTED":
        return (
          <>
            <Button
              className="!rounded-2xl"
              loading={actionLoading}
              onClick={() => void startReview()}
            >
              Start Review
            </Button>
            <Button
              type="primary"
              className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
              loading={actionLoading}
              onClick={() => void approveAdmission()}
            >
              Approve
            </Button>
            <Button
              danger
              className="!rounded-2xl"
              loading={actionLoading}
              onClick={() => setRejectOpen(true)}
            >
              Reject
            </Button>
          </>
        );
      case "UNDER_REVIEW":
        return (
          <>
            <Button
              type="primary"
              className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
              loading={actionLoading}
              onClick={() => void approveAdmission()}
            >
              Approve
            </Button>
            <Button
              danger
              className="!rounded-2xl"
              loading={actionLoading}
              onClick={() => setRejectOpen(true)}
            >
              Reject
            </Button>
          </>
        );
      case "REJECTED":
      case "WAITLISTED":
        return (
          <Button
            className="!rounded-2xl"
            loading={actionLoading}
            onClick={() => void startReview()}
          >
            Re-open Review
          </Button>
        );
      case "APPROVED":
        return (
          <Button
            type="primary"
            className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
            loading={actionLoading}
            onClick={() => setConvertOpen(true)}
          >
            Convert To Student
          </Button>
        );
      default:
        return null;
    }
  }, [actionLoading, selected]);

  const rejectAdmission = async (values: RejectFormValues) => {
    if (!selected) return;
    await runWorkflowAction(
      () => api.students.admissions.reject(selected.id, values),
      "Application rejected",
    );
    setRejectOpen(false);
  };

  const convertAdmission = async (values: ConvertFormValues) => {
    if (!selected) return;
    await runWorkflowAction(
      () =>
        api.students.admissions.convert(selected.id, {
          ...values,
          metadata_json: { source: "frontend-admissions" },
        }),
      "Application converted to student",
      { workflow_state: "CONVERTED" },
    );
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
      render: (_, row) =>
        `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || "-",
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
      render: (value) => (
        <Tag color={statusTagColor(String(value ?? ""))}>
          {String(value ?? "-")}
        </Tag>
      ),
    },
    {
      title: "Workflow",
      dataIndex: "workflow_state",
      key: "workflow_state",
      render: (value) => (
        <Tag color={workflowTagColor(value)}>{value ?? "-"}</Tag>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Typography.Title level={3} className="!mb-0 text-white">
            Admissions
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-white/60">
            Sprint 8 workflow console for application review, approval,
            rejection, conversion, and timeline tracking.
          </Typography.Paragraph>
        </div>
        <Button
          className="!rounded-2xl"
          onClick={() => void load()}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
        <div className="mb-4 flex gap-3 items-center flex-wrap">
          <Select
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            options={statusOptions}
            className="min-w-[180px]"
          />
          <Select
            value={workflowFilter}
            onChange={(value) => setWorkflowFilter(value)}
            options={workflowOptions}
            className="min-w-[220px]"
          />
          <Input.Search
            allowClear
            placeholder="Search by application no, student name..."
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
              if (!event.target.value) {
                setSearchQuery("");
                setPage(1);
              }
            }}
            onSearch={(value) => {
              setSearchQuery(value);
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
            onClick: () => void openDrawer(record),
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

      <AdmissionDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        selected={selected}
        loading={drawerLoading}
        workflowHistory={workflowHistory}
        canWrite={canWrite}
        actionButtons={actionButtons}
      />

      <RejectApplicationModal
        open={rejectOpen}
        onCancel={() => setRejectOpen(false)}
        onReject={rejectAdmission}
        loading={actionLoading}
      />

      <ConvertStudentModal
        open={convertOpen}
        onCancel={() => setConvertOpen(false)}
        onConvert={convertAdmission}
        loading={actionLoading}
      />
    </div>
  );
}
