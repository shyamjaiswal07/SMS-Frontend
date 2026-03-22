import { LockOutlined, SafetyCertificateOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, Input, Modal, Row, Select, Space, Statistic, Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo, useState } from "react";
import { formatDateTime, parseApiError, rowsOf } from "@/utils/platform";
import { useGetLoginAuditsQuery } from "@/features/admin/adminApiSlice";
import {
  useGetPasswordResetAuditsQuery,
  useGetTwoFactorStatusQuery,
  useEnrollTwoFactorMutation,
  useDisableTwoFactorMutation,
  useVerifyTwoFactorMutation,
} from "@/features/auth/authApiSlice";

type LoginAuditRow = {
  id: number;
  user?: number | null;
  school?: number | null;
  event_type?: string;
  email_attempted: string;
  ip_address?: string | null;
  user_agent?: string;
  success: boolean;
  failure_reason?: string;
  created_at?: string;
};

type PasswordResetAuditRow = {
  id: number;
  user?: number | null;
  email_attempted: string;
  ip_address?: string | null;
  user_agent?: string;
  token_sent: boolean;
  reset_completed: boolean;
  failure_reason?: string;
  created_at?: string;
};

type TwoFactorStatus = {
  user?: number;
  method?: string;
  is_enabled?: boolean;
  is_verified?: boolean;
  last_verified_at?: string | null;
};

type VerificationForm = {
  verification_code: string;
};

const resultTag = (success?: boolean) => <Tag color={success ? "success" : "error"}>{success ? "Success" : "Failed"}</Tag>;

export default function SecurityCenter() {
  const { data: loginData, isFetching: loadingLogin, refetch: refetchLogin } = useGetLoginAuditsQuery({ page: 1, page_size: 200 });
  const { data: resetData, isFetching: loadingResets, refetch: refetchResets } = useGetPasswordResetAuditsQuery({ page: 1, page_size: 200 });
  const { data: twoFactorData, isFetching: loadingTwoFactor, refetch: refetchTwoFactor } = useGetTwoFactorStatusQuery();

  const [enrollTwoFactor] = useEnrollTwoFactorMutation();
  const [disableTwoFactor] = useDisableTwoFactorMutation();
  const [verifyTwoFactor] = useVerifyTwoFactorMutation();

  const loginAudits = (rowsOf(loginData) as LoginAuditRow[]) || [];
  const resetAudits = (rowsOf(resetData) as PasswordResetAuditRow[]) || [];
  const twoFactor = twoFactorData as TwoFactorStatus | null;

  const loading = loadingLogin || loadingResets || loadingTwoFactor;

  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verificationHint, setVerificationHint] = useState("");
  const [bootstrapSecret, setBootstrapSecret] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    eventType: "ALL",
    result: "ALL",
    dateWindow: "ALL",
  });
  const [verificationForm] = Form.useForm<VerificationForm>();

  const loadAll = () => {
    refetchLogin();
    refetchResets();
    refetchTwoFactor();
  };

  const filteredLoginAudits = useMemo(() => {
    const now = Date.now();
    return loginAudits.filter((row) => {
      const haystack = `${row.email_attempted} ${row.failure_reason ?? ""} ${row.ip_address ?? ""} ${row.event_type ?? ""}`.toLowerCase();
      if (filters.search && !haystack.includes(filters.search.toLowerCase())) return false;
      if (filters.eventType !== "ALL" && row.event_type !== filters.eventType) return false;
      if (filters.result === "SUCCESS" && !row.success) return false;
      if (filters.result === "FAILED" && row.success) return false;
      if (filters.dateWindow === "7D" && row.created_at) {
        if (now - new Date(row.created_at).getTime() > 7 * 24 * 60 * 60 * 1000) return false;
      }
      if (filters.dateWindow === "24H" && row.created_at) {
        if (now - new Date(row.created_at).getTime() > 24 * 60 * 60 * 1000) return false;
      }
      return true;
    });
  }, [filters, loginAudits]);

  const loginAuditColumns: ColumnsType<LoginAuditRow> = [
    { title: "Event", dataIndex: "event_type", render: (value) => <Tag color="blue">{value ?? "LOGIN"}</Tag> },
    { title: "Email", dataIndex: "email_attempted", render: (value) => <span className="text-white/85">{value}</span> },
    { title: "Result", key: "result", render: (_, row) => resultTag(row.success) },
    { title: "IP", dataIndex: "ip_address", render: (value) => value || "-" },
    { title: "Reason", dataIndex: "failure_reason", render: (value) => value || "-" },
    { title: "When", dataIndex: "created_at", render: (value) => <span className="text-white/55">{formatDateTime(value)}</span> },
  ];

  const resetColumns: ColumnsType<PasswordResetAuditRow> = [
    { title: "Email", dataIndex: "email_attempted", render: (value) => <span className="text-white/85">{value}</span> },
    { title: "Token Sent", dataIndex: "token_sent", render: (value) => <Tag color={value ? "success" : "default"}>{value ? "Yes" : "No"}</Tag> },
    { title: "Reset Completed", dataIndex: "reset_completed", render: (value) => <Tag color={value ? "success" : "default"}>{value ? "Yes" : "No"}</Tag> },
    { title: "IP", dataIndex: "ip_address", render: (value) => value || "-" },
    { title: "Failure", dataIndex: "failure_reason", render: (value) => value || "-" },
    { title: "When", dataIndex: "created_at", render: (value) => <span className="text-white/55">{formatDateTime(value)}</span> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Typography.Title level={4} className="!mb-0 !text-white">
            Security Center
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-white/60">
            Sprint 1 and Sprint 7 frontend coverage for auth logs, password reset audits, and optional 2FA enrollment.
          </Typography.Paragraph>
        </div>
        <Button onClick={() => void loadAll()} loading={loading}>
          Refresh
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
            <Statistic title={<span className="text-white/60">Auth Events</span>} value={loginAudits.length} valueStyle={{ color: "#e5e7eb" }} prefix={<LockOutlined className="text-[var(--cv-accent)]" />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
            <Statistic title={<span className="text-white/60">Failed Attempts</span>} value={loginAudits.filter((item) => !item.success).length} valueStyle={{ color: "#e5e7eb" }} prefix={<SearchOutlined className="text-[var(--cv-accent)]" />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
            <Statistic title={<span className="text-white/60">Reset Requests</span>} value={resetAudits.length} valueStyle={{ color: "#e5e7eb" }} prefix={<SafetyCertificateOutlined className="text-[var(--cv-accent)]" />} />
          </Card>
        </Col>
      </Row>

      <div className="grid gap-4 xl:grid-cols-[1.3fr,0.7fr]">
        <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
          <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-white font-medium">Authentication Logs</div>
              <div className="text-white/55 text-sm">Filter login, token refresh, and 2FA challenge events by user, status, and time window.</div>
            </div>
            <Space wrap>
              <Input
                allowClear
                placeholder="Search email, IP, reason..."
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                className="min-w-[220px]"
              />
              <Select
                value={filters.eventType}
                onChange={(value) => setFilters((current) => ({ ...current, eventType: value }))}
                options={[
                  { label: "All Events", value: "ALL" },
                  { label: "Login", value: "LOGIN" },
                  { label: "Token Refresh", value: "TOKEN_REFRESH" },
                  { label: "2FA Verify", value: "TWO_FACTOR_VERIFY" },
                  { label: "2FA Challenge", value: "TWO_FACTOR_CHALLENGE" },
                ]}
                className="min-w-[170px]"
              />
              <Select
                value={filters.result}
                onChange={(value) => setFilters((current) => ({ ...current, result: value }))}
                options={[
                  { label: "All Results", value: "ALL" },
                  { label: "Success", value: "SUCCESS" },
                  { label: "Failed", value: "FAILED" },
                ]}
                className="min-w-[150px]"
              />
              <Select
                value={filters.dateWindow}
                onChange={(value) => setFilters((current) => ({ ...current, dateWindow: value }))}
                options={[
                  { label: "All Time", value: "ALL" },
                  { label: "Last 24 Hours", value: "24H" },
                  { label: "Last 7 Days", value: "7D" },
                ]}
                className="min-w-[150px]"
              />
            </Space>
          </div>
          <Table rowKey="id" loading={loading} dataSource={filteredLoginAudits} columns={loginAuditColumns} pagination={{ pageSize: 8 }} />
        </Card>

        <div className="space-y-4">
          <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
            <div className="text-white font-medium">Optional 2FA</div>
            <div className="mt-2 text-sm text-white/60">
              Status:{" "}
              <span className="text-white/85">
                {twoFactor?.is_enabled ? "Enabled" : twoFactor?.is_verified ? "Verified but disabled" : "Not enrolled"}
              </span>
            </div>
            <div className="text-sm text-white/60">Method: {twoFactor?.method ?? "AUTH_APP"}</div>
            <div className="text-sm text-white/60">Last verified: {formatDateTime(twoFactor?.last_verified_at)}</div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="primary"
                className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
                loading={submitting}
                onClick={async () => {
                  setSubmitting(true);
                  try {
                    const result = await enrollTwoFactor({ method: "AUTH_APP" }).unwrap();
                    setBootstrapSecret(String(result.bootstrap_secret ?? ""));
                    setVerificationHint(String(result.verification_hint ?? ""));
                    setVerifyOpen(true);
                    message.success("2FA enrollment initialized");
                  } catch (error) {
                    message.error(parseApiError(error, "Unable to start 2FA enrollment"));
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                Start Enrollment
              </Button>
              <Button
                disabled={!twoFactor?.is_enabled}
                loading={submitting}
                onClick={async () => {
                  setSubmitting(true);
                  try {
                    await disableTwoFactor().unwrap();
                    message.success("2FA disabled");
                  } catch (error) {
                    message.error(parseApiError(error, "Unable to disable 2FA"));
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                Disable
              </Button>
            </div>
          </Card>

          <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
            <div className="text-white font-medium mb-3">Password Reset Audits</div>
            <Table rowKey="id" loading={loading} dataSource={resetAudits} columns={resetColumns} pagination={{ pageSize: 5 }} />
          </Card>
        </div>
      </div>

      <Modal
        title="Verify 2FA Enrollment"
        open={verifyOpen}
        onCancel={() => setVerifyOpen(false)}
        onOk={() => {
          void verificationForm.validateFields().then(async (values) => {
            setSubmitting(true);
            try {
              await verifyTwoFactor(values.verification_code).unwrap();
              message.success("2FA verified");
              setVerifyOpen(false);
              verificationForm.resetFields();
            } catch (error) {
              message.error(parseApiError(error, "Verification failed"));
            } finally {
              setSubmitting(false);
            }
          });
        }}
        confirmLoading={submitting}
      >
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/65">
          <div>Bootstrap secret: <span className="text-white/85">{bootstrapSecret || "Generated on enroll"}</span></div>
          <div className="mt-2">Verification hint: {verificationHint || "Submit the one-time code from your authenticator flow."}</div>
        </div>
        <Form<VerificationForm> form={verificationForm} layout="vertical" requiredMark={false}>
          <Form.Item name="verification_code" label="Verification Code" rules={[{ required: true, message: "Enter the one-time code" }]}>
            <Input placeholder="000000" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
