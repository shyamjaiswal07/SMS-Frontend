import { CheckCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, Input, InputNumber, Modal, Row, Select, Space, Statistic, Switch, Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { useGetAdminUsersQuery } from "@/features/admin/adminApiSlice";
import FileAssetUploader from "@/features/files/FileAssetUploader";
import { hrApi } from "@/features/hr/hrApi";
import { useGetStaffProfilesQuery } from "@/features/hr/hrApiSlice";
import { formatDate, formatDateTime, parseApiError, rowsOf } from "@/utils/platform";

type Staff = { id: number; employee_code?: string; first_name?: string; last_name?: string };
type User = { id: number; email?: string; username?: string; first_name?: string; last_name?: string; role?: string };
type Workflow = {
  id: number;
  staff: number;
  workflow_type?: string;
  title?: string;
  status?: string;
  start_date?: string;
  target_date?: string | null;
  owner?: number | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  notes?: string;
};
type ChecklistItem = {
  id: number;
  workflow: number;
  code?: string | null;
  title?: string;
  description?: string;
  sequence?: number;
  is_required?: boolean;
  assigned_to?: number | null;
  due_date?: string | null;
  status?: string;
  completed_at?: string | null;
  completed_by?: number | null;
  evidence_file?: number | null;
  note?: string;
};
type WorkflowProgress = {
  workflow_id: number;
  status?: string;
  total_items?: number;
  completed_items?: number;
  required_total?: number;
  required_completed?: number;
  completion_pct?: number | string;
  required_completion_pct?: number | string;
};
type WorkflowHistoryRow = { id: number; from_status?: string; to_status?: string; action?: string; reason?: string; created_at?: string };
type ChecklistHistoryRow = { id: number; action?: string; from_status?: string; to_status?: string; note?: string; created_at?: string };

type WorkflowFormValues = {
  staff: number;
  workflow_type: "ONBOARDING" | "OFFBOARDING";
  title: string;
  start_date: string;
  target_date?: string;
  owner?: number;
  notes?: string;
};
type ChecklistFormValues = {
  workflow: number;
  code?: string;
  title: string;
  description?: string;
  sequence: number;
  is_required: boolean;
  assigned_to?: number;
  due_date?: string;
  note?: string;
};
type WorkflowTransitionFormValues = { reason?: string };
type ChecklistTransitionFormValues = { note?: string };
type WorkflowAction = "start" | "complete" | "cancel" | "reopen";
type ChecklistAction = "start" | "complete" | "skip" | "block" | "reopen";
type WorkflowActionTarget = { id: number; action: WorkflowAction; title: string };
type ChecklistActionTarget = { id: number; workflowId: number; action: ChecklistAction; title: string };

const workflowActionLabels: Record<WorkflowAction, string> = {
  start: "Start",
  complete: "Complete",
  cancel: "Cancel",
  reopen: "Reopen",
};

const workflowActionMessages: Record<WorkflowAction, string> = {
  start: "Workflow started",
  complete: "Workflow completed",
  cancel: "Workflow cancelled",
  reopen: "Workflow reopened",
};

const checklistActionLabels: Record<ChecklistAction, string> = {
  start: "Start",
  complete: "Complete",
  skip: "Skip",
  block: "Block",
  reopen: "Reopen",
};

const checklistActionMessages: Record<ChecklistAction, string> = {
  start: "Checklist item started",
  complete: "Checklist item completed",
  skip: "Checklist item skipped",
  block: "Checklist item blocked",
  reopen: "Checklist item reopened",
};

function workflowColor(status?: string) {
  if (status === "COMPLETED") return "success";
  if (status === "CANCELLED") return "red";
  if (status === "IN_PROGRESS") return "processing";
  return "blue";
}

function checklistColor(status?: string) {
  if (status === "COMPLETED") return "success";
  if (status === "BLOCKED") return "red";
  if (status === "SKIPPED") return "default";
  if (status === "IN_PROGRESS") return "processing";
  return "orange";
}

export default function HRLifecycleCenter() {
  const [workflowForm] = Form.useForm<WorkflowFormValues>();
  const [checklistForm] = Form.useForm<ChecklistFormValues>();
  const [workflowTransitionForm] = Form.useForm<WorkflowTransitionFormValues>();
  const [checklistTransitionForm] = Form.useForm<ChecklistTransitionFormValues>();
  const { data: staffData, isFetching: staffLoading, refetch: refetchStaff } = useGetStaffProfilesQuery({ page: 1, page_size: 200 });
  const { data: usersData, isFetching: usersLoading, refetch: refetchUsers } = useGetAdminUsersQuery({ page: 1, page_size: 200 });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [progress, setProgress] = useState<WorkflowProgress | null>(null);
  const [workflowHistory, setWorkflowHistory] = useState<WorkflowHistoryRow[]>([]);
  const [itemHistory, setItemHistory] = useState<ChecklistHistoryRow[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [uploadedEvidenceAssetId, setUploadedEvidenceAssetId] = useState<number | null>(null);
  const [workflowActionTarget, setWorkflowActionTarget] = useState<WorkflowActionTarget | null>(null);
  const [checklistActionTarget, setChecklistActionTarget] = useState<ChecklistActionTarget | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const { workflowData, checklistData } = await hrApi.lifecycle.load();
      const nextWorkflows = rowsOf(workflowData) as Workflow[];
      setWorkflows(nextWorkflows);
      setItems(rowsOf(checklistData) as ChecklistItem[]);
      if (!selectedWorkflowId && nextWorkflows.length) {
        setSelectedWorkflowId(nextWorkflows[0].id);
        checklistForm.setFieldValue("workflow", nextWorkflows[0].id);
      }
    } catch (error) {
      message.error(parseApiError(error, "Failed to load lifecycle workspace"));
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflowDetail = async (workflowId: number) => {
    try {
      const { progressData, historyData } = await hrApi.lifecycle.getWorkflowDetail(workflowId);
      setProgress(progressData as WorkflowProgress);
      setWorkflowHistory(Array.isArray(historyData) ? (historyData as WorkflowHistoryRow[]) : []);
    } catch (error) {
      message.error(parseApiError(error, "Unable to load workflow detail"));
    }
  };

  const loadItemHistory = async (itemId: number) => {
    try {
      const response = await hrApi.lifecycle.getChecklistHistory(itemId);
      setItemHistory(Array.isArray(response) ? (response as ChecklistHistoryRow[]) : []);
    } catch (error) {
      message.error(parseApiError(error, "Unable to load checklist history"));
    }
  };

  useEffect(() => {
    workflowForm.setFieldsValue({ workflow_type: "ONBOARDING" });
    checklistForm.setFieldsValue({ sequence: 1, is_required: true });
    void loadAll();
  }, []);

  useEffect(() => {
    setStaff(rowsOf(staffData) as Staff[]);
  }, [staffData]);

  useEffect(() => {
    setUsers(rowsOf(usersData) as User[]);
  }, [usersData]);

  const pageLoading = loading || staffLoading || usersLoading;

  const refreshAll = async () => {
    await Promise.all([loadAll(), refetchStaff(), refetchUsers()]);
  };

  useEffect(() => {
    if (selectedWorkflowId) {
      void loadWorkflowDetail(selectedWorkflowId);
      checklistForm.setFieldValue("workflow", selectedWorkflowId);
    } else {
      setProgress(null);
      setWorkflowHistory([]);
    }
  }, [selectedWorkflowId]);

  useEffect(() => {
    if (selectedItemId) {
      void loadItemHistory(selectedItemId);
    } else {
      setItemHistory([]);
    }
  }, [selectedItemId]);

  const staffMap = useMemo(
    () => new Map(staff.map((item) => [item.id, `${item.employee_code ?? item.id} - ${item.first_name ?? ""} ${item.last_name ?? ""}`.trim()])),
    [staff],
  );
  const userMap = useMemo(
    () => new Map(users.map((item) => [item.id, `${item.first_name ?? ""} ${item.last_name ?? ""}`.trim() || item.email || item.username || `User #${item.id}`])),
    [users],
  );

  const selectedWorkflow = useMemo(() => workflows.find((item) => item.id === selectedWorkflowId) ?? null, [selectedWorkflowId, workflows]);
  const visibleItems = useMemo(() => (selectedWorkflowId ? items.filter((item) => item.workflow === selectedWorkflowId) : items), [items, selectedWorkflowId]);

  const submitWorkflowTransition = async () => {
    if (!workflowActionTarget) return;
    const target = workflowActionTarget;

    try {
      const values = await workflowTransitionForm.validateFields();
      setActionKey(`workflow-${target.action}-${target.id}`);
      await hrApi.lifecycle.transitionWorkflow(target.id, target.action, values.reason);
      message.success(workflowActionMessages[target.action]);
      setSelectedWorkflowId(target.id);
      setWorkflowActionTarget(null);
      workflowTransitionForm.resetFields();
      await loadAll();
      await loadWorkflowDetail(target.id);
    } catch (error) {
      message.error(parseApiError(error, `Unable to ${target.action} workflow`));
    } finally {
      setActionKey(null);
    }
  };

  const submitChecklistTransition = async () => {
    if (!checklistActionTarget) return;
    const target = checklistActionTarget;

    try {
      const values = await checklistTransitionForm.validateFields();
      setActionKey(`checklist-${target.action}-${target.id}`);
      await hrApi.lifecycle.transitionChecklist(target.id, target.action, values.note);
      message.success(checklistActionMessages[target.action]);
      setSelectedWorkflowId(target.workflowId);
      setSelectedItemId(target.id);
      setChecklistActionTarget(null);
      checklistTransitionForm.resetFields();
      await loadAll();
      await loadWorkflowDetail(target.workflowId);
      await loadItemHistory(target.id);
    } catch (error) {
      message.error(parseApiError(error, `Unable to ${target.action} checklist item`));
    } finally {
      setActionKey(null);
    }
  };

  const workflowColumns: ColumnsType<Workflow> = [
    { title: "Title", dataIndex: "title", render: (value) => <span className="text-white/85">{value}</span> },
    { title: "Staff", dataIndex: "staff", render: (value) => <span className="text-white/70">{staffMap.get(value) ?? `#${value}`}</span> },
    { title: "Type", dataIndex: "workflow_type", render: (value) => <Tag color="blue">{value}</Tag> },
    { title: "Status", dataIndex: "status", render: (value) => <Tag color={workflowColor(value)}>{value}</Tag> },
    { title: "Target", dataIndex: "target_date", render: (value) => <span className="text-white/55">{formatDate(value)}</span> },
  ];

  const checklistColumns: ColumnsType<ChecklistItem> = [
    { title: "Seq", dataIndex: "sequence", render: (value) => <span className="text-white/70">{value ?? "-"}</span> },
    { title: "Title", dataIndex: "title", render: (value) => <span className="text-white/85">{value}</span> },
    { title: "Required", dataIndex: "is_required", render: (value) => <Tag color={value ? "red" : "default"}>{value ? "Required" : "Optional"}</Tag> },
    { title: "Owner", dataIndex: "assigned_to", render: (value) => <span className="text-white/70">{value ? userMap.get(value) ?? `#${value}` : "-"}</span> },
    { title: "Status", dataIndex: "status", render: (value) => <Tag color={checklistColor(value)}>{value}</Tag> },
    { title: "Due", dataIndex: "due_date", render: (value) => <span className="text-white/55">{formatDate(value)}</span> },
    {
      title: "Actions",
      key: "actions",
      render: (_, row) => (
        <Space wrap>
          <Button size="small" onClick={() => setSelectedItemId(row.id)}>History</Button>
          {row.status === "PENDING" ? <Button size="small" onClick={() => { checklistTransitionForm.resetFields(); setChecklistActionTarget({ id: row.id, workflowId: row.workflow, action: "start", title: row.title ?? `Checklist Item #${row.id}` }); }}>Start</Button> : null}
          {row.status !== "COMPLETED" && row.status !== "SKIPPED" ? <Button size="small" onClick={() => { checklistTransitionForm.resetFields(); setChecklistActionTarget({ id: row.id, workflowId: row.workflow, action: "complete", title: row.title ?? `Checklist Item #${row.id}` }); }}>Complete</Button> : null}
          {!row.is_required && row.status !== "SKIPPED" && row.status !== "COMPLETED" ? <Button size="small" onClick={() => { checklistTransitionForm.resetFields(); setChecklistActionTarget({ id: row.id, workflowId: row.workflow, action: "skip", title: row.title ?? `Checklist Item #${row.id}` }); }}>Skip</Button> : null}
          {row.status !== "COMPLETED" && row.status !== "SKIPPED" ? <Button size="small" danger onClick={() => { checklistTransitionForm.resetFields(); setChecklistActionTarget({ id: row.id, workflowId: row.workflow, action: "block", title: row.title ?? `Checklist Item #${row.id}` }); }}>Block</Button> : null}
          {row.status === "COMPLETED" || row.status === "SKIPPED" || row.status === "BLOCKED" ? <Button size="small" onClick={() => { checklistTransitionForm.resetFields(); setChecklistActionTarget({ id: row.id, workflowId: row.workflow, action: "reopen", title: row.title ?? `Checklist Item #${row.id}` }); }}>Reopen</Button> : null}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Typography.Title level={4} className="!mb-0 !text-white">
            Lifecycle Workflows
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-white/60">
            Sprint 10 onboarding and offboarding orchestration with checklist actions, progress, and transition history.
          </Typography.Paragraph>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => void refreshAll()} loading={pageLoading}>
          Refresh
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
            <Statistic title={<span className="text-white/60">Workflows</span>} value={workflows.length} prefix={<CheckCircleOutlined className="text-[var(--cv-accent)]" />} valueStyle={{ color: "#e5e7eb" }} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
            <Statistic title={<span className="text-white/60">Checklist Items</span>} value={items.length} valueStyle={{ color: "#e5e7eb" }} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
            <Statistic title={<span className="text-white/60">In Progress</span>} value={workflows.filter((item) => item.status === "IN_PROGRESS").length} valueStyle={{ color: "#e5e7eb" }} />
          </Card>
        </Col>
      </Row>

      <div className="grid gap-4 xl:grid-cols-[0.95fr,1.05fr]">
        <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
          <div className="text-white font-medium mb-3">Create Lifecycle Workflow</div>
          <Form<WorkflowFormValues> form={workflowForm} layout="vertical" requiredMark={false}>
            <Form.Item name="staff" label="Staff" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={staff.map((item) => ({ value: item.id, label: staffMap.get(item.id) ?? item.employee_code }))} /></Form.Item>
            <Row gutter={12}>
              <Col span={12}><Form.Item name="workflow_type" label="Type" rules={[{ required: true }]}><Select options={[{ label: "Onboarding", value: "ONBOARDING" }, { label: "Offboarding", value: "OFFBOARDING" }]} /></Form.Item></Col>
              <Col span={12}><Form.Item name="owner" label="Owner"><Select allowClear showSearch optionFilterProp="label" options={users.map((item) => ({ value: item.id, label: `${userMap.get(item.id) ?? item.email}${item.role ? ` (${item.role})` : ""}` }))} /></Form.Item></Col>
            </Row>
            <Form.Item name="title" label="Title" rules={[{ required: true }]}><Input /></Form.Item>
            <Row gutter={12}>
              <Col span={12}><Form.Item name="start_date" label="Start Date" rules={[{ required: true }]}><Input type="date" /></Form.Item></Col>
              <Col span={12}><Form.Item name="target_date" label="Target Date"><Input type="date" /></Form.Item></Col>
            </Row>
            <Form.Item name="notes" label="Notes"><Input.TextArea rows={4} /></Form.Item>
            <Button
              type="primary"
              className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
              loading={submitting}
              onClick={async () => {
                try {
                  const values = await workflowForm.validateFields();
                  setSubmitting(true);
                  await hrApi.lifecycle.createWorkflow(values);
                  message.success("Lifecycle workflow created");
                  workflowForm.resetFields();
                  workflowForm.setFieldsValue({ workflow_type: "ONBOARDING" });
                  await loadAll();
                } catch (error) {
                  message.error(parseApiError(error, "Unable to create lifecycle workflow"));
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              Save Workflow
            </Button>
          </Form>

          <div className="mt-6 text-white font-medium mb-3">Create Checklist Item</div>
          <Form<ChecklistFormValues> form={checklistForm} layout="vertical" requiredMark={false}>
            <Form.Item name="workflow" label="Workflow" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={workflows.map((item) => ({ value: item.id, label: item.title ?? `Workflow #${item.id}` }))} /></Form.Item>
            <Row gutter={12}>
              <Col span={8}><Form.Item name="sequence" label="Sequence" rules={[{ required: true }]}><InputNumber className="!w-full" min={1} /></Form.Item></Col>
              <Col span={16}><Form.Item name="code" label="Code"><Input /></Form.Item></Col>
            </Row>
            <Form.Item name="title" label="Title" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="description" label="Description"><Input.TextArea rows={3} /></Form.Item>
            <Row gutter={12}>
              <Col span={12}><Form.Item name="assigned_to" label="Assigned To"><Select allowClear showSearch optionFilterProp="label" options={users.map((item) => ({ value: item.id, label: `${userMap.get(item.id) ?? item.email}${item.role ? ` (${item.role})` : ""}` }))} /></Form.Item></Col>
              <Col span={12}><Form.Item name="due_date" label="Due Date"><Input type="date" /></Form.Item></Col>
            </Row>
            <Form.Item name="note" label="Note"><Input.TextArea rows={3} /></Form.Item>
            <Form.Item name="is_required" label="Required" valuePropName="checked"><Switch /></Form.Item>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-4">
              <div className="text-white font-medium mb-2">Optional Evidence File</div>
              <FileAssetUploader
                purpose="STAFF_LIFECYCLE_EVIDENCE"
                buttonLabel="Choose Evidence File"
                helperText={uploadedEvidenceAssetId ? `Attached asset #${uploadedEvidenceAssetId}` : "Upload a supporting file to attach while creating the checklist item."}
                onUploaded={(asset) => setUploadedEvidenceAssetId(asset.id)}
              />
            </div>
            <Button
              type="primary"
              className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
              loading={submitting}
              onClick={async () => {
                try {
                  const values = await checklistForm.validateFields();
                  setSubmitting(true);
                  const payload: Record<string, unknown> = { ...values };
                  if (uploadedEvidenceAssetId) payload.evidence_file = uploadedEvidenceAssetId;
                  await hrApi.lifecycle.createChecklistItem(payload);
                  message.success("Checklist item created");
                  setUploadedEvidenceAssetId(null);
                  checklistForm.resetFields();
                  checklistForm.setFieldsValue({ workflow: selectedWorkflowId ?? undefined, sequence: 1, is_required: true });
                  await loadAll();
                } catch (error) {
                  message.error(parseApiError(error, "Unable to create checklist item"));
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              Save Checklist Item
            </Button>
          </Form>
        </Card>

        <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
          <div className="text-white font-medium mb-3">Workflow Board</div>
          <Table
            rowKey="id"
            loading={pageLoading}
            dataSource={workflows}
            columns={[
              ...workflowColumns,
              {
                title: "Actions",
                key: "actions",
                render: (_, row: Workflow) => (
                  <Space wrap>
                    <Button size="small" onClick={() => setSelectedWorkflowId(row.id)}>Inspect</Button>
                    {row.status === "DRAFT" ? <Button size="small" onClick={() => { workflowTransitionForm.resetFields(); setWorkflowActionTarget({ id: row.id, action: "start", title: row.title ?? `Workflow #${row.id}` }); }}>Start</Button> : null}
                    {row.status === "IN_PROGRESS" ? <Button size="small" onClick={() => { workflowTransitionForm.resetFields(); setWorkflowActionTarget({ id: row.id, action: "complete", title: row.title ?? `Workflow #${row.id}` }); }}>Complete</Button> : null}
                    {row.status === "DRAFT" || row.status === "IN_PROGRESS" ? <Button size="small" danger onClick={() => { workflowTransitionForm.resetFields(); setWorkflowActionTarget({ id: row.id, action: "cancel", title: row.title ?? `Workflow #${row.id}` }); }}>Cancel</Button> : null}
                    {row.status === "COMPLETED" || row.status === "CANCELLED" ? <Button size="small" onClick={() => { workflowTransitionForm.resetFields(); setWorkflowActionTarget({ id: row.id, action: "reopen", title: row.title ?? `Workflow #${row.id}` }); }}>Reopen</Button> : null}
                  </Space>
                ),
              },
            ]}
            pagination={{ pageSize: 6 }}
          />

          {selectedWorkflow ? (
            <>
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-white font-medium">{selectedWorkflow.title ?? `Workflow #${selectedWorkflow.id}`}</div>
                <div className="text-white/55 text-sm mt-1">{selectedWorkflow.workflow_type} for {staffMap.get(selectedWorkflow.staff) ?? `#${selectedWorkflow.staff}`}</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-sm">
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-3 text-white/70">Status: <Tag color={workflowColor(selectedWorkflow.status)}>{selectedWorkflow.status}</Tag></div>
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-3 text-white/70">Owner: {selectedWorkflow.owner ? userMap.get(selectedWorkflow.owner) ?? `#${selectedWorkflow.owner}` : "-"}</div>
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-3 text-white/70">Start: {formatDate(selectedWorkflow.start_date)}</div>
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-3 text-white/70">Target: {formatDate(selectedWorkflow.target_date)}</div>
                </div>
              </div>

              {progress ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-white/55 text-xs uppercase tracking-wider">Total Items</div><div className="text-white font-medium mt-1">{progress.total_items ?? 0}</div></div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-white/55 text-xs uppercase tracking-wider">Completed</div><div className="text-white font-medium mt-1">{progress.completed_items ?? 0}</div></div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-white/55 text-xs uppercase tracking-wider">Completion %</div><div className="text-white font-medium mt-1">{String(progress.completion_pct ?? 0)}%</div></div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-white/55 text-xs uppercase tracking-wider">Required %</div><div className="text-white font-medium mt-1">{String(progress.required_completion_pct ?? 0)}%</div></div>
                </div>
              ) : null}

              <div className="mt-6 text-white font-medium mb-3">Checklist Items</div>
              <Table rowKey="id" dataSource={visibleItems} columns={checklistColumns} pagination={{ pageSize: 6 }} />

              <div className="mt-6 text-white font-medium mb-3">Workflow History</div>
              <Table
                rowKey="id"
                dataSource={workflowHistory}
                columns={[
                  { title: "Action", dataIndex: "action", render: (value) => <Tag color="blue">{value}</Tag> },
                  { title: "Transition", key: "transition", render: (_, row: WorkflowHistoryRow) => <span className="text-white/70">{row.from_status || "START"}{" -> "}{row.to_status}</span> },
                  { title: "Reason", dataIndex: "reason", render: (value) => <span className="text-white/70">{value || "-"}</span> },
                  { title: "When", dataIndex: "created_at", render: (value) => <span className="text-white/55">{formatDateTime(value)}</span> },
                ]}
                pagination={{ pageSize: 5 }}
              />

              <div className="mt-6 text-white font-medium mb-3">Selected Checklist History</div>
              <Table
                rowKey="id"
                dataSource={itemHistory}
                columns={[
                  { title: "Action", dataIndex: "action", render: (value) => <Tag color="blue">{value}</Tag> },
                  { title: "Transition", key: "transition", render: (_, row: ChecklistHistoryRow) => <span className="text-white/70">{row.from_status || "START"}{" -> "}{row.to_status}</span> },
                  { title: "Note", dataIndex: "note", render: (value) => <span className="text-white/70">{value || "-"}</span> },
                  { title: "When", dataIndex: "created_at", render: (value) => <span className="text-white/55">{formatDateTime(value)}</span> },
                ]}
                pagination={{ pageSize: 5 }}
              />
            </>
          ) : (
            <div className="text-white/50 mt-4">Select a workflow to inspect progress, checklist items, and history.</div>
          )}
        </Card>
      </div>
      <Modal
        title={workflowActionTarget ? `${workflowActionLabels[workflowActionTarget.action]} Workflow` : "Workflow Transition"}
        open={!!workflowActionTarget}
        onCancel={() => {
          setWorkflowActionTarget(null);
          workflowTransitionForm.resetFields();
        }}
        onOk={() => void submitWorkflowTransition()}
        confirmLoading={workflowActionTarget ? actionKey === `workflow-${workflowActionTarget.action}-${workflowActionTarget.id}` : false}
        okText={workflowActionTarget ? workflowActionLabels[workflowActionTarget.action] : "Save"}
      >
        <Typography.Paragraph className="!text-white/65">
          Add an optional operator reason so the transition history captures why this workflow changed state.
        </Typography.Paragraph>
        <Form<WorkflowTransitionFormValues> form={workflowTransitionForm} layout="vertical" requiredMark={false}>
          <Form.Item name="reason" label="Reason">
            <Input.TextArea rows={4} placeholder="Example: equipment returned and manager sign-off received" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={checklistActionTarget ? `${checklistActionLabels[checklistActionTarget.action]} Checklist Item` : "Checklist Transition"}
        open={!!checklistActionTarget}
        onCancel={() => {
          setChecklistActionTarget(null);
          checklistTransitionForm.resetFields();
        }}
        onOk={() => void submitChecklistTransition()}
        confirmLoading={checklistActionTarget ? actionKey === `checklist-${checklistActionTarget.action}-${checklistActionTarget.id}` : false}
        okText={checklistActionTarget ? checklistActionLabels[checklistActionTarget.action] : "Save"}
      >
        <Typography.Paragraph className="!text-white/65">
          Add an optional note for the assignee or reviewer. It will be stored in the checklist item history.
        </Typography.Paragraph>
        <Form<ChecklistTransitionFormValues> form={checklistTransitionForm} layout="vertical" requiredMark={false}>
          <Form.Item name="note" label="Note">
            <Input.TextArea rows={4} placeholder="Example: waiting on badge printing from facilities" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
