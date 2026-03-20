import { DownloadOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, Input, Row, Select, Space, Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import apiClient from "@/services/apiClient";
import { downloadFromApi, formatDateTime, parseApiError, rowsOf } from "@/utils/platform";

type AuditRow = {
  id: number;
  created_at?: string;
  source?: string;
  action?: string;
  app_label?: string;
  model_name?: string;
  object_pk?: string;
  actor?: number | null;
  request_id?: string;
  ip_address?: string;
};

type FilterForm = {
  app_label?: string;
  model_name?: string;
  action?: string;
  object_pk?: string;
  source?: string;
  start_date?: string;
  end_date?: string;
};

export default function ComplianceCenter() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<FilterForm>();

  const load = async (params?: Record<string, unknown>) => {
    setLoading(true);
    try {
      const response = await apiClient.get("/api/common/compliance-audit-logs/", {
        params: { page: 1, page_size: 100, ...params },
      });
      setRows(rowsOf(response.data) as AuditRow[]);
    } catch (error) {
      message.error(parseApiError(error, "Failed to load compliance logs"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const columns: ColumnsType<AuditRow> = [
    { title: "Time", dataIndex: "created_at", render: (value) => <span className="text-white/55">{formatDateTime(value)}</span> },
    { title: "Source", dataIndex: "source", render: (value) => <Tag color="blue">{value}</Tag> },
    { title: "Action", dataIndex: "action", render: (value) => <Tag color={value === "CREATE" ? "success" : value === "DELETE" ? "error" : "processing"}>{value}</Tag> },
    { title: "Model", key: "model", render: (_, row) => <span className="text-white/85">{row.app_label}.{row.model_name}</span> },
    { title: "Object", dataIndex: "object_pk", render: (value) => <span className="text-white/70">{value}</span> },
    { title: "Actor", dataIndex: "actor", render: (value) => <span className="text-white/70">{value ? `User #${value}` : "-"}</span> },
    { title: "Request ID", dataIndex: "request_id", render: (value) => <span className="text-white/50">{value || "-"}</span> },
    { title: "IP", dataIndex: "ip_address", render: (value) => <span className="text-white/50">{value || "-"}</span> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Typography.Title level={4} className="!mb-0 !text-white">
            Audit Explorer
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-white/60">
            Sprint 6 compliance audit browsing with filters and CSV export.
          </Typography.Paragraph>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={() => void load()} loading={loading}>
            Refresh
          </Button>
          <Button icon={<DownloadOutlined />} onClick={() => void downloadFromApi("/api/common/compliance-audit-logs/export/", "compliance-audit.csv")}>
            Export CSV
          </Button>
        </Space>
      </div>

      <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
        <Form<FilterForm>
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={async (values) => {
            await load(values);
          }}
        >
          <Row gutter={12}>
            <Col xs={24} md={6}><Form.Item name="app_label" label="App Label"><Input placeholder="finance" /></Form.Item></Col>
            <Col xs={24} md={6}><Form.Item name="model_name" label="Model Name"><Input placeholder="feecategory" /></Form.Item></Col>
            <Col xs={24} md={6}><Form.Item name="action" label="Action"><Select allowClear options={[{ label: "Create", value: "CREATE" }, { label: "Update", value: "UPDATE" }, { label: "Delete", value: "DELETE" }]} /></Form.Item></Col>
            <Col xs={24} md={6}><Form.Item name="source" label="Source"><Select allowClear options={[{ label: "API", value: "API" }, { label: "Admin", value: "ADMIN" }, { label: "Celery", value: "CELERY" }, { label: "System", value: "SYSTEM" }]} /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col xs={24} md={8}><Form.Item name="object_pk" label="Object PK"><Input placeholder="123" /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item name="start_date" label="Start Date"><Input type="date" /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item name="end_date" label="End Date"><Input type="date" /></Form.Item></Col>
          </Row>
          <Space wrap>
            <Button htmlType="submit" type="primary" className="!rounded-2xl !bg-[var(--cv-accent)] !border-0" icon={<SearchOutlined />}>
              Search
            </Button>
            <Button
              onClick={() => {
                form.resetFields();
                void load();
              }}
            >
              Clear
            </Button>
          </Space>
        </Form>

        <div className="mt-5">
          <Table rowKey="id" loading={loading} dataSource={rows} columns={columns} pagination={{ pageSize: 8 }} scroll={{ x: true }} />
        </div>
      </Card>
    </div>
  );
}
