import { EyeOutlined, ReloadOutlined, SendOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, Input, Modal, Row, Select, Space, Statistic, Switch, Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { useGetAdminUsersQuery } from "@/features/admin/adminApiSlice";
import { communicationsApi } from "@/features/communications/communicationsApi";
import { formatDateTime, parseApiError, rowsOf } from "@/utils/platform";

type User = { id: number; email?: string; username?: string; first_name?: string; last_name?: string; role?: string };
type Campaign = {
  id: number;
  name?: string;
  title?: string;
  body?: string;
  channel?: string;
  audience_type?: string;
  target_roles?: string[];
  target_user_ids?: number[];
  metadata?: Record<string, unknown>;
  status?: string;
  scheduled_at?: string | null;
  queued_at?: string | null;
  dispatched_at?: string | null;
  completed_at?: string | null;
  total_recipients?: number;
  pending_count?: number;
  sent_count?: number;
  read_count?: number;
  failed_count?: number;
  last_error?: string;
};
type Recipient = {
  id: number;
  user?: number;
  status?: string;
  retry_count?: number;
  last_attempted_at?: string | null;
  last_error?: string;
  user_email?: string;
  notification_status?: string;
};
type AudiencePreview = { campaign_id?: number; audience_type?: string; recipient_count?: number };
type CampaignStats = { campaign_id?: number; status?: string; total_recipients?: number; pending_count?: number; sent_count?: number; read_count?: number; failed_count?: number };

type CampaignFormValues = {
  name: string;
  title: string;
  body: string;
  channel: "IN_APP" | "EMAIL" | "SMS";
  audience_type: "ROLE_BASED" | "USER_LIST" | "ALL_ACTIVE_USERS";
  target_roles?: string[];
  target_user_ids?: number[];
  scheduled_at?: string;
  metadata_json?: string;
};
type DispatchFormValues = { dispatch_now: boolean };
type DispatchAction = "queue" | "retry";
type DispatchActionTarget = { id: number; action: DispatchAction; title: string };

const dispatchActionLabels: Record<DispatchAction, string> = {
  queue: "Queue",
  retry: "Retry Failed",
};

function statusColor(status?: string) {
  if (status === "COMPLETED") return "success";
  if (status === "FAILED" || status === "CANCELLED") return "red";
  if (status === "QUEUED" || status === "SCHEDULED" || status === "PARTIALLY_SENT") return "processing";
  return "blue";
}

const roleOptions = [
  { label: "Super Admin", value: "SUPER_ADMIN" },
  { label: "School Admin", value: "SCHOOL_ADMIN" },
  { label: "Teacher", value: "TEACHER" },
  { label: "Parent", value: "PARENT" },
  { label: "Student", value: "STUDENT" },
  { label: "Accountant", value: "ACCOUNTANT" },
  { label: "HR Manager", value: "HR_MANAGER" },
  { label: "Librarian", value: "LIBRARIAN" },
  { label: "Transport Coordinator", value: "TRANSPORT_COORDINATOR" },
];

export default function BulkCampaignCenter() {
  const [campaignForm] = Form.useForm<CampaignFormValues>();
  const [dispatchForm] = Form.useForm<DispatchFormValues>();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [preview, setPreview] = useState<AudiencePreview | null>(null);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [recipientModalOpen, setRecipientModalOpen] = useState(false);
  const [campaignDispatchTarget, setCampaignDispatchTarget] = useState<DispatchActionTarget | null>(null);
  const {
    data: usersData,
    isFetching: usersLoading,
    refetch: refetchUsers,
  } = useGetAdminUsersQuery({ page: 1, page_size: 200 });
  const users = rowsOf(usersData) as User[];

  const loadAll = async () => {
    setLoading(true);
    try {
      const nextCampaigns = rowsOf(await communicationsApi.loadBulkCampaigns()) as Campaign[];
      setCampaigns(nextCampaigns);
      if (!selectedCampaignId && nextCampaigns.length) {
        setSelectedCampaignId(nextCampaigns[0].id);
      }
    } catch (error) {
      message.error(parseApiError(error, "Failed to load bulk campaigns"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    campaignForm.setFieldsValue({ channel: "IN_APP", audience_type: "ROLE_BASED", target_roles: ["PARENT"], metadata_json: "{}" });
    void loadAll();
  }, []);

  const userMap = useMemo(
    () => new Map(users.map((item) => [item.id, `${item.first_name ?? ""} ${item.last_name ?? ""}`.trim() || item.email || item.username || `User #${item.id}`])),
    [users],
  );

  const selectedCampaign = useMemo(() => campaigns.find((item) => item.id === selectedCampaignId) ?? null, [campaigns, selectedCampaignId]);

  const submitDispatchAction = async () => {
    if (!campaignDispatchTarget) return;
    const target = campaignDispatchTarget;

    try {
      const values = await dispatchForm.validateFields();
      const endpoint = target.action === "queue" ? "queue" : "retry-failed";
      setActionKey(`${target.action}-${target.id}`);
      const response =
        endpoint === "queue"
          ? await communicationsApi.queueCampaign(target.id, values.dispatch_now)
          : await communicationsApi.retryFailedCampaign(target.id, values.dispatch_now);
      setStats(response as CampaignStats);
      setSelectedCampaignId(target.id);
      setCampaignDispatchTarget(null);
      dispatchForm.resetFields();
      message.success(
        values.dispatch_now
          ? target.action === "queue"
            ? "Campaign queued for immediate dispatch"
            : "Retry queued for immediate dispatch"
          : target.action === "queue"
            ? "Campaign queued for scheduled dispatch"
            : "Retry queued for scheduled dispatch",
      );
      await loadAll();
    } catch (error) {
      message.error(parseApiError(error, target.action === "queue" ? "Unable to queue campaign" : "Unable to retry failed recipients"));
    } finally {
      setActionKey(null);
    }
  };

  const recipientColumns: ColumnsType<Recipient> = [
    { title: "Recipient", dataIndex: "user", render: (value, row) => <span className="text-white/80">{row.user_email || userMap.get(Number(value)) || `#${value}`}</span> },
    { title: "Status", dataIndex: "status", render: (value) => <Tag color={statusColor(value)}>{value}</Tag> },
    { title: "Notification", dataIndex: "notification_status", render: (value) => <Tag color={value === "FAILED" ? "red" : value === "READ" ? "success" : "blue"}>{value || "-"}</Tag> },
    { title: "Retries", dataIndex: "retry_count", render: (value) => <span className="text-white/70">{value ?? 0}</span> },
    { title: "Attempted", dataIndex: "last_attempted_at", render: (value) => <span className="text-white/55">{formatDateTime(value)}</span> },
    { title: "Error", dataIndex: "last_error", render: (value) => <span className="text-white/60">{value || "-"}</span> },
  ];

  const campaignColumns: ColumnsType<Campaign> = [
    { title: "Name", dataIndex: "name", render: (value) => <span className="text-white/85">{value}</span> },
    { title: "Channel", dataIndex: "channel", render: (value) => <Tag color="blue">{value}</Tag> },
    { title: "Audience", dataIndex: "audience_type", render: (value) => <Tag color="purple">{value}</Tag> },
    { title: "Status", dataIndex: "status", render: (value) => <Tag color={statusColor(value)}>{value}</Tag> },
    { title: "Recipients", dataIndex: "total_recipients", render: (value) => <span className="text-white/70">{value ?? 0}</span> },
    {
      title: "Actions",
      key: "actions",
      render: (_, row) => (
        <Space wrap>
          <Button size="small" icon={<EyeOutlined />} loading={actionKey === `preview-${row.id}`} onClick={async () => {
            setActionKey(`preview-${row.id}`);
            try {
              const response = await communicationsApi.previewCampaignAudience(row.id);
              setPreview(response as AudiencePreview);
              setSelectedCampaignId(row.id);
            } catch (error) {
              message.error(parseApiError(error, "Unable to preview campaign audience"));
            } finally {
              setActionKey(null);
            }
          }}>
            Preview
          </Button>
          <Button size="small" icon={<SendOutlined />} onClick={() => {
            dispatchForm.setFieldsValue({ dispatch_now: !row.scheduled_at });
            setSelectedCampaignId(row.id);
            setCampaignDispatchTarget({ id: row.id, action: "queue", title: row.title ?? row.name ?? `Campaign #${row.id}` });
          }}>
            Queue
          </Button>
          <Button size="small" loading={actionKey === `refresh-${row.id}`} onClick={async () => {
            setActionKey(`refresh-${row.id}`);
            try {
              const response = await communicationsApi.refreshCampaignStatus(row.id);
              setStats(response as CampaignStats);
              setSelectedCampaignId(row.id);
              await loadAll();
            } catch (error) {
              message.error(parseApiError(error, "Unable to refresh campaign status"));
            } finally {
              setActionKey(null);
            }
          }}>
            Refresh
          </Button>
          <Button size="small" loading={actionKey === `stats-${row.id}`} onClick={async () => {
            setActionKey(`stats-${row.id}`);
            try {
              const response = await communicationsApi.getCampaignStats(row.id);
              setStats(response as CampaignStats);
              setSelectedCampaignId(row.id);
            } catch (error) {
              message.error(parseApiError(error, "Unable to load campaign stats"));
            } finally {
              setActionKey(null);
            }
          }}>
            Stats
          </Button>
          <Button size="small" loading={actionKey === `recipients-${row.id}`} onClick={async () => {
            setActionKey(`recipients-${row.id}`);
            try {
              const response = await communicationsApi.getCampaignRecipients(row.id);
              setRecipients(Array.isArray(response) ? (response as Recipient[]) : []);
              setSelectedCampaignId(row.id);
              setRecipientModalOpen(true);
            } catch (error) {
              message.error(parseApiError(error, "Unable to load campaign recipients"));
            } finally {
              setActionKey(null);
            }
          }}>
            Recipients
          </Button>
          <Button size="small" danger onClick={() => {
            dispatchForm.setFieldsValue({ dispatch_now: !row.scheduled_at });
            setSelectedCampaignId(row.id);
            setCampaignDispatchTarget({ id: row.id, action: "retry", title: row.title ?? row.name ?? `Campaign #${row.id}` });
          }}>
            Retry Failed
          </Button>
          {row.status !== "COMPLETED" ? (
            <Button size="small" danger loading={actionKey === `cancel-${row.id}`} onClick={async () => {
              setActionKey(`cancel-${row.id}`);
              try {
                const response = await communicationsApi.cancelCampaign(row.id);
                setStats(response as CampaignStats);
                setSelectedCampaignId(row.id);
                message.success("Campaign cancelled");
                await loadAll();
              } catch (error) {
                message.error(parseApiError(error, "Unable to cancel campaign"));
              } finally {
                setActionKey(null);
              }
            }}>
              Cancel
            </Button>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Typography.Title level={4} className="!mb-0 !text-white">
            Bulk Campaigns
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-white/60">
            Sprint 11 broadcast campaigns with audience preview, queueing, retries, delivery stats, and recipient inspection.
          </Typography.Paragraph>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => void Promise.all([loadAll(), refetchUsers()])}
          loading={loading || usersLoading}
        >
          Refresh
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}><Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl"><Statistic title={<span className="text-white/60">Campaigns</span>} value={campaigns.length} valueStyle={{ color: "#e5e7eb" }} /></Card></Col>
        <Col xs={24} md={8}><Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl"><Statistic title={<span className="text-white/60">Queued</span>} value={campaigns.filter((item) => item.status === "QUEUED").length} valueStyle={{ color: "#e5e7eb" }} /></Card></Col>
        <Col xs={24} md={8}><Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl"><Statistic title={<span className="text-white/60">Failed</span>} value={campaigns.filter((item) => item.failed_count).length} valueStyle={{ color: "#e5e7eb" }} /></Card></Col>
      </Row>

      <div className="grid gap-4 xl:grid-cols-[0.92fr,1.08fr]">
        <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
          <div className="text-white font-medium mb-3">Create Campaign</div>
          <Form<CampaignFormValues> form={campaignForm} layout="vertical" requiredMark={false}>
            <Row gutter={12}>
              <Col span={12}><Form.Item name="name" label="Internal Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="channel" label="Channel" rules={[{ required: true }]}><Select options={[{ label: "In App", value: "IN_APP" }, { label: "Email", value: "EMAIL" }, { label: "SMS", value: "SMS" }]} /></Form.Item></Col>
            </Row>
            <Form.Item name="title" label="Title" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="body" label="Body" rules={[{ required: true }]}><Input.TextArea rows={5} /></Form.Item>
            <Row gutter={12}>
              <Col span={12}><Form.Item name="audience_type" label="Audience Type" rules={[{ required: true }]}><Select options={[{ label: "Role Based", value: "ROLE_BASED" }, { label: "User List", value: "USER_LIST" }, { label: "All Active Users", value: "ALL_ACTIVE_USERS" }]} /></Form.Item></Col>
              <Col span={12}><Form.Item name="scheduled_at" label="Scheduled At"><Input type="datetime-local" /></Form.Item></Col>
            </Row>
            <Form.Item noStyle shouldUpdate={(prev, current) => prev.audience_type !== current.audience_type}>
              {({ getFieldValue }) =>
                getFieldValue("audience_type") === "ROLE_BASED" ? (
                  <Form.Item name="target_roles" label="Target Roles" rules={[{ required: true }]}>
                    <Select mode="multiple" options={roleOptions} />
                  </Form.Item>
                ) : null
              }
            </Form.Item>
            <Form.Item noStyle shouldUpdate={(prev, current) => prev.audience_type !== current.audience_type}>
              {({ getFieldValue }) =>
                getFieldValue("audience_type") === "USER_LIST" ? (
                  <Form.Item name="target_user_ids" label="Target Users" rules={[{ required: true }]}>
                    <Select mode="multiple" showSearch optionFilterProp="label" options={users.map((item) => ({ value: item.id, label: `${userMap.get(item.id) ?? item.email}${item.role ? ` (${item.role})` : ""}` }))} />
                  </Form.Item>
                ) : null
              }
            </Form.Item>
            <Form.Item name="metadata_json" label="Metadata JSON"><Input.TextArea rows={4} /></Form.Item>
            <Button
              type="primary"
              className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
              loading={submitting}
              onClick={async () => {
                try {
                  const values = await campaignForm.validateFields();
                  setSubmitting(true);
                  await communicationsApi.createCampaign({
                    name: values.name,
                    title: values.title,
                    body: values.body,
                    channel: values.channel,
                    audience_type: values.audience_type,
                    target_roles: values.audience_type === "ROLE_BASED" ? values.target_roles ?? [] : [],
                    target_user_ids: values.audience_type === "USER_LIST" ? values.target_user_ids ?? [] : [],
                    scheduled_at: values.scheduled_at || null,
                    metadata: values.metadata_json?.trim() ? JSON.parse(values.metadata_json) : {},
                  });
                  message.success("Campaign created");
                  campaignForm.resetFields();
                  campaignForm.setFieldsValue({ channel: "IN_APP", audience_type: "ROLE_BASED", target_roles: ["PARENT"], metadata_json: "{}" });
                  await loadAll();
                } catch (error) {
                  const detail = error instanceof SyntaxError ? "Metadata JSON must be valid JSON" : parseApiError(error, "Unable to create campaign");
                  message.error(detail);
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              Save Campaign
            </Button>
          </Form>
        </Card>

        <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
          <div className="text-white font-medium mb-3">Campaign Control Center</div>
          {selectedCampaign ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-white/55 text-xs uppercase tracking-wider">Selected</div><div className="text-white font-medium mt-1">{selectedCampaign.title ?? selectedCampaign.name}</div></div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-white/55 text-xs uppercase tracking-wider">Preview</div><div className="text-white font-medium mt-1">{preview?.campaign_id === selectedCampaign.id ? preview.recipient_count ?? "-" : "-"}</div></div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-white/55 text-xs uppercase tracking-wider">Sent</div><div className="text-white font-medium mt-1">{stats?.campaign_id === selectedCampaign.id ? stats.sent_count ?? selectedCampaign.sent_count ?? 0 : selectedCampaign.sent_count ?? 0}</div></div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-white/55 text-xs uppercase tracking-wider">Failed</div><div className="text-white font-medium mt-1">{stats?.campaign_id === selectedCampaign.id ? stats.failed_count ?? selectedCampaign.failed_count ?? 0 : selectedCampaign.failed_count ?? 0}</div></div>
            </div>
          ) : null}
          <Table rowKey="id" loading={loading} dataSource={campaigns} columns={campaignColumns} pagination={{ pageSize: 6 }} />
        </Card>
      </div>

      <Modal title="Campaign Recipients" open={recipientModalOpen} footer={null} onCancel={() => setRecipientModalOpen(false)} width={980}>
        <Table rowKey="id" dataSource={recipients} columns={recipientColumns} pagination={{ pageSize: 8 }} />
      </Modal>

      <Modal
        title={campaignDispatchTarget ? `${dispatchActionLabels[campaignDispatchTarget.action]} Campaign` : "Campaign Dispatch"}
        open={!!campaignDispatchTarget}
        onCancel={() => {
          setCampaignDispatchTarget(null);
          dispatchForm.resetFields();
        }}
        onOk={() => void submitDispatchAction()}
        confirmLoading={campaignDispatchTarget ? actionKey === `${campaignDispatchTarget.action}-${campaignDispatchTarget.id}` : false}
        okText={campaignDispatchTarget ? dispatchActionLabels[campaignDispatchTarget.action] : "Save"}
      >
        <Typography.Paragraph className="!text-white/65">
          Choose whether to dispatch immediately or keep the campaign in scheduled mode so backend timing controls delivery.
        </Typography.Paragraph>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-4">
          <div className="text-white font-medium">{campaignDispatchTarget?.title ?? "Selected Campaign"}</div>
          <div className="text-white/55 text-sm mt-1">
            Use scheduled mode when you want the existing `scheduled_at` window to drive the send rather than pushing recipients immediately.
          </div>
        </div>
        <Form<DispatchFormValues> form={dispatchForm} layout="vertical" requiredMark={false}>
          <Form.Item name="dispatch_now" label="Dispatch Now" valuePropName="checked">
            <Switch checkedChildren="Now" unCheckedChildren="Later" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
