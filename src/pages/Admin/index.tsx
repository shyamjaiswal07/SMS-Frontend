import { AuditOutlined, LockOutlined, SafetyCertificateOutlined, TeamOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, Input, Modal, Row, Select, Space, Statistic, Switch, Table, Tabs, Tag, Typography, Upload, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { adminApi } from "@/features/admin/adminApi";
import type { AdminMembership, AdminUser, LoginAudit, Paginated, RolePermission, SchoolOption, UserRole } from "@/features/admin/adminTypes";

const roleOptions: Array<{ label: string; value: UserRole }> = [
  { label: "Super Admin", value: "SUPER_ADMIN" },
  { label: "School Admin", value: "SCHOOL_ADMIN" },
  { label: "Teacher", value: "TEACHER" },
  { label: "Student", value: "STUDENT" },
  { label: "Parent", value: "PARENT" },
  { label: "Accountant", value: "ACCOUNTANT" },
  { label: "Librarian", value: "LIBRARIAN" },
  { label: "Transport Coordinator", value: "TRANSPORT_COORDINATOR" },
  { label: "HR Manager", value: "HR_MANAGER" },
];

type UserForm = { email: string; username: string; role: UserRole; password: string; first_name?: string; last_name?: string; phone_number?: string; is_active: boolean; is_staff: boolean; preferred_language?: string; timezone?: string; is_email_verified: boolean; is_phone_verified: boolean };
type MembershipForm = { user: number; school: number; role: UserRole; is_active: boolean; is_default: boolean };

const rowsOf = <T,>(data?: Paginated<T> | T[]) => Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
const dt = (value?: string | null) => value ? new Date(value).toLocaleString() : "-";
const roleColor = (role?: string) => role === "SUPER_ADMIN" ? "gold" : role === "SCHOOL_ADMIN" ? "orange" : role === "TEACHER" ? "blue" : role === "STUDENT" ? "green" : "default";
const tenantRole = () => { try { const raw = sessionStorage.getItem("tenant"); return raw ? JSON.parse(raw)?.role as string | undefined : undefined; } catch { return undefined; } };

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [memberships, setMemberships] = useState<AdminMembership[]>([]);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [audits, setAudits] = useState<LoginAudit[]>([]);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [membershipOpen, setMembershipOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [userForm] = Form.useForm<UserForm>();
  const [membershipForm] = Form.useForm<MembershipForm>();
  const currentRole = useMemo(() => tenantRole(), []);
  const canWrite = currentRole === "SUPER_ADMIN" || currentRole === "SCHOOL_ADMIN";
  const canWritePermissions = currentRole === "SUPER_ADMIN";

  const loadAll = async () => {
    setLoading(true);
    try {
      const [userData, membershipData, permissionData, auditData, schoolData] = await Promise.all([
        adminApi.users.list({ page: 1, page_size: 100 }),
        adminApi.memberships.list({ page: 1, page_size: 100 }),
        adminApi.rolePermissions.list({ page: 1, page_size: 100 }),
        adminApi.loginAudits.list({ page: 1, page_size: 100 }),
        adminApi.schools.list({ page: 1, page_size: 100 }),
      ]);
      setUsers(rowsOf(userData));
      setMemberships(rowsOf(membershipData));
      setPermissions(rowsOf(permissionData));
      setAudits(rowsOf(auditData));
      setSchools(rowsOf(schoolData));
    } catch (error: any) {
      message.error(error?.response?.data?.detail ?? "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadAll(); }, []);

  const userOptions = users.map((user) => ({ label: `${user.email} - ${user.role}`, value: user.id }));
  const schoolOptions = schools.map((school) => ({ label: `${school.name} (${school.code})`, value: school.id }));
  const userLabel = (id: number) => users.find((user) => user.id === id)?.email ?? `User #${id}`;
  const schoolLabel = (id: number) => { const school = schools.find((item) => item.id === id); return school ? `${school.name} (${school.code})` : `School #${id}`; };

  const userColumns: ColumnsType<AdminUser> = [
    { title: "User", key: "user", render: (_, row) => <div><div className="text-white/90 font-medium">{row.first_name || row.last_name ? `${row.first_name || ""} ${row.last_name || ""}`.trim() : row.username}</div><div className="text-white/55 text-xs">{row.email}</div></div> },
    { title: "Role", dataIndex: "role", render: (value) => <Tag color={roleColor(value)}>{value}</Tag> },
    { title: "Status", key: "status", render: (_, row) => <Space><Tag color={row.is_active ? "success" : "default"}>{row.is_active ? "Active" : "Inactive"}</Tag>{row.is_staff ? <Tag color="blue">Staff</Tag> : null}</Space> },
    { title: "Last Login", dataIndex: "last_login", render: (value) => <span className="text-white/60">{dt(value)}</span> },
  ];

  const membershipColumns: ColumnsType<AdminMembership> = [
    { title: "Member", dataIndex: "user", render: (value) => userLabel(value) },
    { title: "School", dataIndex: "school", render: (value) => schoolLabel(value) },
    { title: "Role", dataIndex: "role", render: (value) => <Tag color={roleColor(value)}>{value}</Tag> },
    { title: "Flags", key: "flags", render: (_, row) => <Space><Tag color={row.is_active ? "success" : "default"}>{row.is_active ? "Active" : "Inactive"}</Tag>{row.is_default ? <Tag color="gold">Default</Tag> : null}</Space> },
  ];

  const permissionColumns: ColumnsType<RolePermission> = [
    { title: "Role", dataIndex: "role", render: (value) => <Tag color={roleColor(value)}>{value}</Tag> },
    { title: "Permission", dataIndex: "permission_code", render: (value) => <code className="text-[var(--cv-accent)]">{value}</code> },
    { title: "State", dataIndex: "is_allowed", render: (value) => <Tag color={value ? "success" : "default"}>{value ? "Allowed" : "Blocked"}</Tag> },
  ];

  const auditColumns: ColumnsType<LoginAudit> = [
    { title: "Attempt", dataIndex: "email_attempted" },
    { title: "Result", key: "result", render: (_, row) => <Tag color={row.success ? "success" : "error"}>{row.success ? "Success" : "Failed"}</Tag> },
    { title: "IP", dataIndex: "ip_address", render: (value) => value || "-" },
    { title: "Reason", dataIndex: "failure_reason", render: (value) => value || "-" },
    { title: "Time", dataIndex: "created_at", render: (value) => <span className="text-white/60">{dt(value)}</span> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Typography.Title level={3} className="!mb-0 text-white">
            Admin <span className="text-[var(--cv-accent)]">Workspace</span>
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-white/60">
            Accounts, memberships, permission rules, and login monitoring mapped to the SMS backend APIs.
          </Typography.Paragraph>
        </div>
        <Space wrap>
          <Button onClick={() => void loadAll()}>Refresh</Button>
          <Button
            type="primary"
            className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
            disabled={!canWrite}
            onClick={() => {
              userForm.resetFields();
              userForm.setFieldsValue({ role: "TEACHER", is_active: true, is_staff: false, is_email_verified: false, is_phone_verified: false, preferred_language: "en", timezone: "UTC", password: "" });
              setUserOpen(true);
            }}
          >
            Add User
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}><Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl"><Statistic title={<span className="text-white/60">Users</span>} value={users.length} prefix={<TeamOutlined className="text-[var(--cv-accent)]" />} valueStyle={{ color: "#e5e7eb" }} /></Card></Col>
        <Col xs={24} md={12} xl={6}><Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl"><Statistic title={<span className="text-white/60">Memberships</span>} value={memberships.length} prefix={<SafetyCertificateOutlined className="text-[var(--cv-accent)]" />} valueStyle={{ color: "#e5e7eb" }} /></Card></Col>
        <Col xs={24} md={12} xl={6}><Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl"><Statistic title={<span className="text-white/60">Permission Rules</span>} value={permissions.length} prefix={<LockOutlined className="text-[var(--cv-accent)]" />} valueStyle={{ color: "#e5e7eb" }} /></Card></Col>
        <Col xs={24} md={12} xl={6}><Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl"><Statistic title={<span className="text-white/60">Failed Logins</span>} value={audits.filter((item) => !item.success).length} prefix={<AuditOutlined className="text-[var(--cv-accent)]" />} valueStyle={{ color: "#e5e7eb" }} /></Card></Col>
      </Row>

      <Tabs
        defaultActiveKey="users"
        items={[
          {
            key: "users",
            label: "Users",
            children: (
              <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl space-y-4">
                <Table rowKey="id" loading={loading} dataSource={users} columns={userColumns} pagination={{ pageSize: 10 }} />
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                  <div className="text-white/80 font-medium">Bulk user import</div>
                  <Upload maxCount={1} beforeUpload={(file) => { setImportFile(file); return false; }} onRemove={() => { setImportFile(null); }} accept=".csv">
                    <Button icon={<UploadOutlined />}>Choose CSV</Button>
                  </Upload>
                  <div className="text-white/55 text-sm">Expected columns: email, username, first_name, last_name, phone_number, role, password.</div>
                  <Button
                    type="primary"
                    className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
                    disabled={!importFile || !canWrite}
                    loading={importing}
                    onClick={async () => {
                      if (!importFile) return;
                      setImporting(true);
                      try {
                        const result = await adminApi.users.bulkImport(importFile);
                        message.success(`Import complete: ${result.created ?? 0} created, ${result.skipped ?? 0} skipped`);
                        setImportFile(null);
                        await loadAll();
                      } catch (error: any) {
                        message.error(error?.response?.data?.detail ?? "Bulk import failed");
                      } finally {
                        setImporting(false);
                      }
                    }}
                  >
                    Upload and Import
                  </Button>
                </div>
              </Card>
            ),
          },
          {
            key: "memberships",
            label: "Memberships",
            children: (
              <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl space-y-4">
                <div className="flex justify-end">
                  <Button
                    type="primary"
                    className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
                    disabled={!canWrite}
                    onClick={() => {
                      membershipForm.resetFields();
                      membershipForm.setFieldsValue({ role: "TEACHER", is_active: true, is_default: false });
                      setMembershipOpen(true);
                    }}
                  >
                    Add Membership
                  </Button>
                </div>
                <Table rowKey="id" loading={loading} dataSource={memberships} columns={membershipColumns} pagination={{ pageSize: 10 }} />
              </Card>
            ),
          },
          {
            key: "access",
            label: "Access & Security",
            children: (
              <div className="grid gap-4 xl:grid-cols-2">
                <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
                  <div className="mb-3 text-white/80 font-medium">Role permissions</div>
                  <Table rowKey="id" loading={loading} dataSource={permissions} columns={permissionColumns} pagination={{ pageSize: 8 }} />
                  {!canWritePermissions ? <div className="mt-3 text-white/50 text-sm">Permission writes are reserved for super admins by the backend.</div> : null}
                </Card>
                <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
                  <div className="mb-3 text-white/80 font-medium">Login audits</div>
                  <Table rowKey="id" loading={loading} dataSource={audits} columns={auditColumns} pagination={{ pageSize: 8 }} />
                </Card>
              </div>
            ),
          },
        ]}
      />

      <Modal
        title="Create User"
        open={userOpen}
        onCancel={() => setUserOpen(false)}
        confirmLoading={submitting}
        onOk={() => {
          void userForm.validateFields().then(async (values) => {
            setSubmitting(true);
            try {
              await adminApi.users.create(values);
              message.success("User created");
              setUserOpen(false);
              userForm.resetFields();
              await loadAll();
            } catch (error: any) {
              message.error(error?.response?.data?.detail ?? "Unable to create user");
            } finally {
              setSubmitting(false);
            }
          });
        }}
      >
        <Form<UserForm> form={userForm} layout="vertical" requiredMark={false}>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="email" label="Email" rules={[{ required: true }, { type: "email" }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="username" label="Username" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="first_name" label="First Name"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="last_name" label="Last Name"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="phone_number" label="Phone"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="role" label="Role" rules={[{ required: true }]}><Select options={roleOptions} /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="preferred_language" label="Language"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="timezone" label="Timezone"><Input /></Form.Item></Col>
          </Row>
          <Form.Item name="password" label="Password" rules={[{ required: true }, { min: 10 }]}><Input.Password /></Form.Item>
          <Row gutter={12}>
            <Col span={6}><Form.Item name="is_active" label="Active" valuePropName="checked"><Switch /></Form.Item></Col>
            <Col span={6}><Form.Item name="is_staff" label="Staff" valuePropName="checked"><Switch /></Form.Item></Col>
            <Col span={6}><Form.Item name="is_email_verified" label="Email Verified" valuePropName="checked"><Switch /></Form.Item></Col>
            <Col span={6}><Form.Item name="is_phone_verified" label="Phone Verified" valuePropName="checked"><Switch /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="Create Membership"
        open={membershipOpen}
        onCancel={() => setMembershipOpen(false)}
        confirmLoading={submitting}
        onOk={() => {
          void membershipForm.validateFields().then(async (values) => {
            setSubmitting(true);
            try {
              await adminApi.memberships.create(values);
              message.success("Membership created");
              setMembershipOpen(false);
              membershipForm.resetFields();
              await loadAll();
            } catch (error: any) {
              message.error(error?.response?.data?.detail ?? "Unable to create membership");
            } finally {
              setSubmitting(false);
            }
          });
        }}
      >
        <Form<MembershipForm> form={membershipForm} layout="vertical" requiredMark={false}>
          <Form.Item name="user" label="User" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={userOptions} /></Form.Item>
          <Form.Item name="school" label="School" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={schoolOptions} /></Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}><Select options={roleOptions} /></Form.Item>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="is_active" label="Active" valuePropName="checked"><Switch /></Form.Item></Col>
            <Col span={12}><Form.Item name="is_default" label="Default Tenant" valuePropName="checked"><Switch /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
