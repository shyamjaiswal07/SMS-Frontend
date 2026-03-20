import { ApiOutlined, LinkOutlined, ReloadOutlined, RocketOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, Input, InputNumber, Modal, Popconfirm, Row, Select, Space, Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import apiClient from "@/services/apiClient";
import { formatDateTime, parseApiError, rowsOf } from "@/utils/platform";

type ConnectorRow = {
  id: number;
  name: string;
  category: "ACCOUNTING" | "EMAIL" | "SMS";
  provider_code: string;
  priority: number;
  is_primary: boolean;
  status: "ACTIVE" | "INACTIVE" | "ERROR";
  auth_config?: Record<string, unknown>;
  settings_json?: Record<string, unknown>;
  callback_token?: string;
  is_active: boolean;
  last_success_at?: string | null;
  last_error?: string;
};

type SyncRunRow = {
  id: number;
  connector: number;
  direction: string;
  status: string;
  records_total?: number;
  records_synced?: number;
  retry_count?: number;
  error_message?: string;
  created_at?: string;
};

type DispatchLogRow = {
  id: number;
  connector?: number | null;
  channel?: string;
  status?: string;
  provider_message_id?: string;
  callback_received_at?: string | null;
  error_message?: string;
  created_at?: string;
};

type WebhookRow = {
  id: number;
  name: string;
  target_url: string;
  subscribed_events?: string[];
  timeout_seconds?: number;
  max_retries?: number;
  is_active: boolean;
};

type DomainEventRow = {
  id: number;
  event_type: string;
  aggregate_label: string;
  aggregate_pk: string;
  status: string;
  attempt_count?: number;
  delivered_at?: string | null;
  created_at?: string;
};

type WebhookDeliveryRow = {
  id: number;
  event: number;
  endpoint: number;
  status: string;
  attempt_no?: number;
  response_status_code?: number | null;
  error_message?: string;
  next_retry_at?: string | null;
  delivered_at?: string | null;
  created_at?: string;
};

type ConnectorForm = {
  name: string;
  category: "ACCOUNTING" | "EMAIL" | "SMS";
  provider_code: string;
  priority: number;
  is_primary: boolean;
  status: "ACTIVE" | "INACTIVE" | "ERROR";
  auth_config_json?: string;
  settings_json?: string;
  is_active: boolean;
};

type WebhookForm = {
  name: string;
  target_url: string;
  subscribed_events?: string;
  signing_secret: string;
  timeout_seconds: number;
  max_retries: number;
  is_active: boolean;
};

export default function IntegrationsCenter() {
  const [connectors, setConnectors] = useState<ConnectorRow[]>([]);
  const [syncRuns, setSyncRuns] = useState<SyncRunRow[]>([]);
  const [dispatchLogs, setDispatchLogs] = useState<DispatchLogRow[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookRow[]>([]);
  const [events, setEvents] = useState<DomainEventRow[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDeliveryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [connectorOpen, setConnectorOpen] = useState(false);
  const [webhookOpen, setWebhookOpen] = useState(false);
  const [editingConnector, setEditingConnector] = useState<ConnectorRow | null>(null);
  const [editingWebhook, setEditingWebhook] = useState<WebhookRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [connectorForm] = Form.useForm<ConnectorForm>();
  const [webhookForm] = Form.useForm<WebhookForm>();

  const loadAll = async () => {
    setLoading(true);
    try {
      const [connectorResponse, syncResponse, dispatchResponse, webhookResponse, eventResponse, deliveryResponse] = await Promise.all([
        apiClient.get("/api/common/integration-connectors/", { params: { page: 1, page_size: 100 } }),
        apiClient.get("/api/common/integration-sync-runs/", { params: { page: 1, page_size: 100 } }),
        apiClient.get("/api/common/integration-dispatch-logs/", { params: { page: 1, page_size: 100 } }),
        apiClient.get("/api/common/webhook-endpoints/", { params: { page: 1, page_size: 100 } }),
        apiClient.get("/api/common/domain-events/", { params: { page: 1, page_size: 100 } }),
        apiClient.get("/api/common/webhook-deliveries/", { params: { page: 1, page_size: 100 } }),
      ]);
      setConnectors(rowsOf(connectorResponse.data) as ConnectorRow[]);
      setSyncRuns(rowsOf(syncResponse.data) as SyncRunRow[]);
      setDispatchLogs(rowsOf(dispatchResponse.data) as DispatchLogRow[]);
      setWebhooks(rowsOf(webhookResponse.data) as WebhookRow[]);
      setEvents(rowsOf(eventResponse.data) as DomainEventRow[]);
      setDeliveries(rowsOf(deliveryResponse.data) as WebhookDeliveryRow[]);
    } catch (error) {
      message.error(parseApiError(error, "Failed to load integrations center"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const connectorColumns: ColumnsType<ConnectorRow> = [
    { title: "Name", dataIndex: "name", render: (value) => <span className="text-white/85">{value}</span> },
    { title: "Category", dataIndex: "category", render: (value) => <Tag color="blue">{value}</Tag> },
    { title: "Provider", dataIndex: "provider_code", render: (value) => <Tag color="purple">{value}</Tag> },
    { title: "Priority", dataIndex: "priority" },
    { title: "Status", dataIndex: "status", render: (value) => <Tag color={value === "ACTIVE" ? "success" : value === "ERROR" ? "error" : "default"}>{value}</Tag> },
    { title: "Last Success", dataIndex: "last_success_at", render: (value) => <span className="text-white/55">{formatDateTime(value)}</span> },
    {
      title: "Actions",
      key: "actions",
      render: (_, row) => (
        <Space wrap>
          {row.category === "ACCOUNTING" ? (
            <Button
              size="small"
              icon={<RocketOutlined />}
              onClick={async () => {
                try {
                  await apiClient.post(`/api/common/integration-connectors/${row.id}/sync/`, { direction: "EXPORT" });
                  message.success("Sync queued");
                  await loadAll();
                } catch (error) {
                  message.error(parseApiError(error, "Unable to queue sync"));
                }
              }}
            >
              Sync
            </Button>
          ) : null}
          <Button
            size="small"
            onClick={() => {
              setEditingConnector(row);
              connectorForm.setFieldsValue({
                name: row.name,
                category: row.category,
                provider_code: row.provider_code,
                priority: row.priority,
                is_primary: row.is_primary,
                status: row.status,
                auth_config_json: JSON.stringify(row.auth_config ?? {}, null, 2),
                settings_json: JSON.stringify(row.settings_json ?? {}, null, 2),
                is_active: row.is_active,
              });
              setConnectorOpen(true);
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this connector?"
            onConfirm={async () => {
              try {
                await apiClient.delete(`/api/common/integration-connectors/${row.id}/`);
                message.success("Connector deleted");
                await loadAll();
              } catch (error) {
                message.error(parseApiError(error, "Unable to delete connector"));
              }
            }}
          >
            <Button size="small" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const syncColumns: ColumnsType<SyncRunRow> = [
    { title: "Run", dataIndex: "id", render: (value) => <span className="text-white/85">#{value}</span> },
    { title: "Connector", dataIndex: "connector", render: (value) => <span className="text-white/70">#{value}</span> },
    { title: "Direction", dataIndex: "direction", render: (value) => <Tag>{value}</Tag> },
    { title: "Status", dataIndex: "status", render: (value) => <Tag color={value === "SUCCESS" ? "success" : value === "FAILED" ? "error" : "processing"}>{value}</Tag> },
    { title: "Records", key: "records", render: (_, row) => <span className="text-white/70">{row.records_synced ?? 0} / {row.records_total ?? 0}</span> },
    { title: "Retries", dataIndex: "retry_count" },
    { title: "Created", dataIndex: "created_at", render: (value) => <span className="text-white/55">{formatDateTime(value)}</span> },
  ];

  const dispatchColumns: ColumnsType<DispatchLogRow> = [
    { title: "Channel", dataIndex: "channel", render: (value) => <Tag color="blue">{value}</Tag> },
    { title: "Connector", dataIndex: "connector", render: (value) => <span className="text-white/70">{value ? `#${value}` : "-"}</span> },
    { title: "Status", dataIndex: "status", render: (value) => <Tag color={value === "SENT" ? "success" : value === "FAILED" ? "error" : value === "CALLBACK_RECEIVED" ? "gold" : "processing"}>{value}</Tag> },
    { title: "Provider Message", dataIndex: "provider_message_id", render: (value) => <span className="text-white/70">{value || "-"}</span> },
    { title: "Callback", dataIndex: "callback_received_at", render: (value) => <span className="text-white/55">{formatDateTime(value)}</span> },
    { title: "Created", dataIndex: "created_at", render: (value) => <span className="text-white/55">{formatDateTime(value)}</span> },
  ];

  const webhookColumns: ColumnsType<WebhookRow> = [
    { title: "Name", dataIndex: "name", render: (value) => <span className="text-white/85">{value}</span> },
    { title: "Target URL", dataIndex: "target_url", render: (value) => <span className="text-white/65">{value}</span> },
    { title: "Events", dataIndex: "subscribed_events", render: (value) => <span className="text-white/65">{Array.isArray(value) && value.length ? value.join(", ") : "-"}</span> },
    { title: "Status", dataIndex: "is_active", render: (value) => <Tag color={value ? "success" : "default"}>{value ? "Active" : "Paused"}</Tag> },
    {
      title: "Actions",
      key: "actions",
      render: (_, row) => (
        <Space wrap>
          <Button
            size="small"
            onClick={() => {
              setEditingWebhook(row);
              webhookForm.setFieldsValue({
                name: row.name,
                target_url: row.target_url,
                subscribed_events: (row.subscribed_events ?? []).join(", "),
                signing_secret: "",
                timeout_seconds: row.timeout_seconds ?? 5,
                max_retries: row.max_retries ?? 3,
                is_active: row.is_active,
              });
              setWebhookOpen(true);
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this webhook endpoint?"
            onConfirm={async () => {
              try {
                await apiClient.delete(`/api/common/webhook-endpoints/${row.id}/`);
                message.success("Webhook deleted");
                await loadAll();
              } catch (error) {
                message.error(parseApiError(error, "Unable to delete webhook"));
              }
            }}
          >
            <Button size="small" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const eventColumns: ColumnsType<DomainEventRow> = [
    { title: "Event", dataIndex: "event_type", render: (value) => <span className="text-white/85">{value}</span> },
    { title: "Aggregate", key: "aggregate", render: (_, row) => <span className="text-white/65">{row.aggregate_label} #{row.aggregate_pk}</span> },
    { title: "Status", dataIndex: "status", render: (value) => <Tag color={value === "DELIVERED" ? "success" : value === "FAILED" ? "error" : value === "PARTIAL" ? "gold" : "processing"}>{value}</Tag> },
    { title: "Attempts", dataIndex: "attempt_count" },
    { title: "Delivered", dataIndex: "delivered_at", render: (value) => <span className="text-white/55">{formatDateTime(value)}</span> },
    { title: "Created", dataIndex: "created_at", render: (value) => <span className="text-white/55">{formatDateTime(value)}</span> },
  ];

  const deliveryColumns: ColumnsType<WebhookDeliveryRow> = [
    { title: "Event", dataIndex: "event", render: (value) => <span className="text-white/70">#{value}</span> },
    { title: "Endpoint", dataIndex: "endpoint", render: (value) => <span className="text-white/70">#{value}</span> },
    { title: "Status", dataIndex: "status", render: (value) => <Tag color={value === "SUCCESS" ? "success" : value === "FAILED" ? "error" : "processing"}>{value}</Tag> },
    { title: "Attempt", dataIndex: "attempt_no" },
    { title: "HTTP", dataIndex: "response_status_code", render: (value) => <span className="text-white/70">{value ?? "-"}</span> },
    { title: "Retry At", dataIndex: "next_retry_at", render: (value) => <span className="text-white/55">{formatDateTime(value)}</span> },
    { title: "Delivered", dataIndex: "delivered_at", render: (value) => <span className="text-white/55">{formatDateTime(value)}</span> },
    { title: "Error", dataIndex: "error_message", render: (value) => <span className="text-white/55">{value || "-"}</span> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Typography.Title level={4} className="!mb-0 !text-white">
            Integrations Console
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-white/60">
            Sprint 6 coverage for provider credentials, sync runs, fallback delivery logs, webhooks, and domain events.
          </Typography.Paragraph>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={() => void loadAll()} loading={loading}>
            Refresh
          </Button>
          <Button
            type="primary"
            className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
            icon={<ApiOutlined />}
            onClick={() => {
              setEditingConnector(null);
              connectorForm.resetFields();
              connectorForm.setFieldsValue({
                category: "ACCOUNTING",
                priority: 1,
                status: "ACTIVE",
                is_primary: false,
                is_active: true,
                auth_config_json: "{}",
                settings_json: "{}",
              });
              setConnectorOpen(true);
            }}
          >
            New Connector
          </Button>
          <Button
            icon={<LinkOutlined />}
            onClick={() => {
              setEditingWebhook(null);
              webhookForm.resetFields();
              webhookForm.setFieldsValue({ timeout_seconds: 5, max_retries: 3, is_active: true });
              setWebhookOpen(true);
            }}
          >
            New Webhook
          </Button>
        </Space>
      </div>

      <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
        <div className="text-white font-medium mb-3">Connectors</div>
        <Table rowKey="id" loading={loading} dataSource={connectors} columns={connectorColumns} pagination={{ pageSize: 6 }} />
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl h-full">
            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
              <div className="text-white font-medium">Sync Runs</div>
              <Button
                onClick={async () => {
                  try {
                    await apiClient.post("/api/common/integration-connectors/dispatch-pending-events/", {});
                    message.success("Pending events queued for dispatch");
                    await loadAll();
                  } catch (error) {
                    message.error(parseApiError(error, "Unable to queue event dispatch"));
                  }
                }}
              >
                Dispatch Pending Events
              </Button>
            </div>
            <Table rowKey="id" loading={loading} dataSource={syncRuns} columns={syncColumns} pagination={{ pageSize: 5 }} />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl h-full">
            <div className="text-white font-medium mb-3">Provider Dispatch Logs</div>
            <Table rowKey="id" loading={loading} dataSource={dispatchLogs} columns={dispatchColumns} pagination={{ pageSize: 5 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl h-full">
            <div className="text-white font-medium mb-3">Webhook Endpoints</div>
            <Table rowKey="id" loading={loading} dataSource={webhooks} columns={webhookColumns} pagination={{ pageSize: 5 }} />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl h-full">
            <div className="text-white font-medium mb-3">Domain Events</div>
            <Table rowKey="id" loading={loading} dataSource={events} columns={eventColumns} pagination={{ pageSize: 5 }} />
          </Card>
        </Col>
      </Row>

      <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
        <div className="text-white font-medium mb-3">Webhook Deliveries</div>
        <Table rowKey="id" loading={loading} dataSource={deliveries} columns={deliveryColumns} pagination={{ pageSize: 6 }} />
      </Card>

      <Modal
        title={editingConnector ? "Edit Connector" : "Create Connector"}
        open={connectorOpen}
        onCancel={() => setConnectorOpen(false)}
        confirmLoading={submitting}
        onOk={() => {
          void connectorForm.validateFields().then(async (values) => {
            setSubmitting(true);
            try {
              const payload = {
                name: values.name,
                category: values.category,
                provider_code: values.provider_code,
                priority: values.priority,
                is_primary: values.is_primary,
                status: values.status,
                auth_config: values.auth_config_json?.trim() ? JSON.parse(values.auth_config_json) : {},
                settings_json: values.settings_json?.trim() ? JSON.parse(values.settings_json) : {},
                is_active: values.is_active,
              };
              if (editingConnector) {
                await apiClient.patch(`/api/common/integration-connectors/${editingConnector.id}/`, payload);
              } else {
                await apiClient.post("/api/common/integration-connectors/", payload);
              }
              message.success(editingConnector ? "Connector updated" : "Connector created");
              setConnectorOpen(false);
              await loadAll();
            } catch (error) {
              const detail = error instanceof SyntaxError ? "Connector JSON fields must be valid JSON" : parseApiError(error, "Unable to save connector");
              message.error(detail);
            } finally {
              setSubmitting(false);
            }
          });
        }}
        width={760}
      >
        <Form<ConnectorForm> form={connectorForm} layout="vertical" requiredMark={false}>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="provider_code" label="Provider Code" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}><Form.Item name="category" label="Category" rules={[{ required: true }]}><Select options={[{ label: "Accounting", value: "ACCOUNTING" }, { label: "Email", value: "EMAIL" }, { label: "SMS", value: "SMS" }]} /></Form.Item></Col>
            <Col span={8}><Form.Item name="priority" label="Priority" rules={[{ required: true }]}><InputNumber className="!w-full" min={1} /></Form.Item></Col>
            <Col span={8}><Form.Item name="status" label="Status" rules={[{ required: true }]}><Select options={[{ label: "Active", value: "ACTIVE" }, { label: "Inactive", value: "INACTIVE" }, { label: "Error", value: "ERROR" }]} /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="is_primary" label="Primary" rules={[{ required: true }]}><Select options={[{ label: "Yes", value: true }, { label: "No", value: false }]} /></Form.Item></Col>
            <Col span={12}><Form.Item name="is_active" label="Enabled" rules={[{ required: true }]}><Select options={[{ label: "Enabled", value: true }, { label: "Disabled", value: false }]} /></Form.Item></Col>
          </Row>
          <Form.Item name="auth_config_json" label="Auth Config JSON"><Input.TextArea rows={4} placeholder='{"api_key":"demo-key"}' /></Form.Item>
          <Form.Item name="settings_json" label="Settings JSON"><Input.TextArea rows={4} placeholder='{"simulate_failure":false}' /></Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingWebhook ? "Edit Webhook" : "Create Webhook"}
        open={webhookOpen}
        onCancel={() => setWebhookOpen(false)}
        confirmLoading={submitting}
        onOk={() => {
          void webhookForm.validateFields().then(async (values) => {
            setSubmitting(true);
            try {
              const payload = {
                name: values.name,
                target_url: values.target_url,
                subscribed_events: (values.subscribed_events || "").split(",").map((item) => item.trim()).filter(Boolean),
                signing_secret: values.signing_secret || "top-secret-signing-key",
                timeout_seconds: values.timeout_seconds,
                max_retries: values.max_retries,
                is_active: values.is_active,
              };
              if (editingWebhook) {
                await apiClient.patch(`/api/common/webhook-endpoints/${editingWebhook.id}/`, payload);
              } else {
                await apiClient.post("/api/common/webhook-endpoints/", payload);
              }
              message.success(editingWebhook ? "Webhook updated" : "Webhook created");
              setWebhookOpen(false);
              await loadAll();
            } catch (error) {
              message.error(parseApiError(error, "Unable to save webhook"));
            } finally {
              setSubmitting(false);
            }
          });
        }}
      >
        <Form<WebhookForm> form={webhookForm} layout="vertical" requiredMark={false}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="target_url" label="Target URL" rules={[{ required: true }, { type: "url", message: "Enter a valid URL" }]}><Input /></Form.Item>
          <Form.Item name="subscribed_events" label="Subscribed Events"><Input.TextArea rows={2} placeholder="finance.feecategory.create, hr.*" /></Form.Item>
          <Form.Item name="signing_secret" label="Signing Secret" rules={[{ required: !editingWebhook }]}><Input.Password placeholder={editingWebhook ? "Leave blank to keep current value" : "top-secret-signing-key"} /></Form.Item>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="timeout_seconds" label="Timeout Seconds" rules={[{ required: true }]}><InputNumber className="!w-full" min={1} /></Form.Item></Col>
            <Col span={12}><Form.Item name="max_retries" label="Max Retries" rules={[{ required: true }]}><InputNumber className="!w-full" min={0} /></Form.Item></Col>
          </Row>
          <Form.Item name="is_active" label="Status" rules={[{ required: true }]}><Select options={[{ label: "Active", value: true }, { label: "Paused", value: false }]} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
