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
import type {
  AdmissionWorkflowState,
  StudentStatus,
} from "@/features/students/studentTypes";
import {
  useGetAdmissionsQuery,
  useGetWorkflowHistoryQuery,
  useSubmitAdmissionMutation,
  useStartReviewMutation,
  useApproveAdmissionMutation,
  useRejectAdmissionMutation,
  useConvertAdmissionMutation,
} from "@/features/students/admissionsApiSlice";
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

export default function Admissions() {
  const role = useMemo(() => getTenantRole(), []);
  const canWrite = role === "SUPER_ADMIN" || role === "SCHOOL_ADMIN";

  const [searchParams, setSearchParams] = useSearchParams();
  const urlApplicationId = searchParams.get("applicationId");

  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | StudentStatus>("ALL");
  const [workflowFilter, setWorkflowFilter] = useState<"ALL" | AdmissionWorkflowState>("ALL");

  const { data, isFetching: loading } = useGetAdmissionsQuery({
    page,
    page_size: pageSize,
    search: searchQuery || undefined,
  });
  const rows = data?.results || [];
  const total = data?.count || 0;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<AdmissionApplicationRow | null>(null);

  const { data: workflowHistoryData, isFetching: drawerLoading } = useGetWorkflowHistoryQuery(
    selected?.id ?? 0,
    { skip: !selected || !drawerOpen }
  );
  const workflowHistory = workflowHistoryData || [];

  const [rejectOpen, setRejectOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);

  const [submitAdmission, { isLoading: isSubmitting }] = useSubmitAdmissionMutation();
  const [startReview, { isLoading: isStartingReview }] = useStartReviewMutation();
  const [approveAdmission, { isLoading: isApproving }] = useApproveAdmissionMutation();
  const [rejectAdmissionMutation, { isLoading: isRejecting }] = useRejectAdmissionMutation();
  const [convertAdmissionMutation, { isLoading: isConverting }] = useConvertAdmissionMutation();

  const actionLoading = isSubmitting || isStartingReview || isApproving || isRejecting || isConverting;

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, workflowFilter]);

  // Deep Linking Syncing
  useEffect(() => {
    if (urlApplicationId && rows.length > 0) {
      const row = rows.find((r) => r.id.toString() === urlApplicationId);
      if (row) {
        setSelected(row);
        setDrawerOpen(true);
      }
    } else if (!urlApplicationId) {
      setDrawerOpen(false);
    }
  }, [urlApplicationId, rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const statusMatches =
        statusFilter === "ALL" || row.status === statusFilter;
      const workflowMatches =
        workflowFilter === "ALL" || row.workflow_state === workflowFilter;
      return statusMatches && workflowMatches;
    });
  }, [rows, statusFilter, workflowFilter]);

  const openDrawer = (row: AdmissionApplicationRow) => {
    setSearchParams((prev) => {
      prev.set("applicationId", row.id.toString());
      return prev;
    });
  };

  const closeDrawer = () => {
    setSearchParams((prev) => {
      prev.delete("applicationId");
      return prev;
    });
    setTimeout(() => setSelected(null), 300); // clear after animation
  };

  const handleMutation = async (
    mutationFn: () => Promise<unknown>,
    successMessage: string,
  ) => {
    if (!selected) return;
    try {
      await mutationFn();
      message.success(successMessage);
    } catch (error: any) {
      message.error(error?.data?.detail ?? "Workflow action failed");
    }
  };

  const actionButtons = useMemo(() => {
    if (!selected) return null;

    const handleStartReview = () =>
      handleMutation(
        () => startReview({ id: selected.id }).unwrap(),
        "Application moved to review",
      );
    const handleApprove = () =>
      handleMutation(
        () => approveAdmission({ id: selected.id }).unwrap(),
        "Application approved",
      );
    const handleSubmitAdmission = () =>
      handleMutation(
        () => submitAdmission(selected.id).unwrap(),
        "Application submitted",
      );

    switch (selected.workflow_state) {
      case "DRAFT":
        return (
          <Button
            type="primary"
            className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
            loading={actionLoading}
            onClick={() => void handleSubmitAdmission()}
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
              onClick={() => void handleStartReview()}
            >
              Start Review
            </Button>
            <Button
              type="primary"
              className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
              loading={actionLoading}
              onClick={() => void handleApprove()}
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
              onClick={() => void handleApprove()}
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
            onClick={() => void handleStartReview()}
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
    await handleMutation(
      () => rejectAdmissionMutation({ id: selected.id, reason: values.reason }).unwrap(),
      "Application rejected",
    );
    setRejectOpen(false);
  };

  const convertAdmission = async (values: ConvertFormValues) => {
    if (!selected) return;
    await handleMutation(
      () =>
        convertAdmissionMutation({
          id: selected.id,
          ...values,
          metadata_json: { source: "frontend-admissions" },
        }).unwrap(),
      "Application converted to student",
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
