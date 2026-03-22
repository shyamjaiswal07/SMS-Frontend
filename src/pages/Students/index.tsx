import { PlusOutlined, SettingOutlined } from "@ant-design/icons";
import { Badge, Button, Card, Col, Form, Input, InputNumber, Modal, Row, Select, Space, Switch, Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import type { Paginated, StudentIdPolicy, StudentRow, StudentStatus } from "@/features/students/studentTypes";
import {
  useGetStudentsQuery,
  useCreateStudentMutation,
  useGetCurrentPolicyQuery,
  useUpdateCurrentPolicyMutation,
} from "@/features/students/studentsApiSlice";
import StudentDrawer from "@/features/students/components/StudentDrawer";

type StudentCreateFormValues = {
  student_id?: string;
  admission_number?: string;
  first_name: string;
  last_name?: string;
  date_of_birth: string;
  gender?: string;
  email?: string;
  phone_number?: string;
  address?: string;
  status: StudentStatus;
  admitted_on?: string;
};

const statusTagColor = (s?: string) => {
  switch (s) {
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

const studentStatusOptions: Array<{ label: string; value: StudentStatus }> = [
  { label: "Applicant", value: "APPLICANT" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Graduated", value: "GRADUATED" },
  { label: "Transferred", value: "TRANSFERRED" },
];

function getTenantRole(): string | undefined {
  try {
    return (JSON.parse(sessionStorage.getItem("tenant") || "null")?.role as string | undefined) ?? undefined;
  } catch {
    return undefined;
  }
}

export default function StudentsPage() {
  const role = useMemo(() => getTenantRole(), []);
  const canManage = role === "SUPER_ADMIN" || role === "SCHOOL_ADMIN";

  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | StudentStatus>("ALL");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<StudentRow | null>(null);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const [policyForm] = Form.useForm<StudentIdPolicy>();
  const [createForm] = Form.useForm<StudentCreateFormValues>();

  const { data, isFetching: loading } = useGetStudentsQuery({
    page,
    page_size: pageSize,
    search: search || undefined,
  });
  const rows = data?.results || [];
  const total = data?.count || 0;

  const { data: currentPolicy, isFetching: policyLoading } = useGetCurrentPolicyQuery(undefined, {
    skip: !canManage,
  });
  const policy = currentPolicy || null;

  const [updateCurrentPolicy, { isLoading: policySaving }] = useUpdateCurrentPolicyMutation();
  const [createStudentMutation, { isLoading: createSaving }] = useCreateStudentMutation();

  useEffect(() => {
    setPage(1);
  }, [search]);

  const filteredRows = useMemo(() => {
    if (statusFilter === "ALL") return rows;
    return rows.filter((row) => row.status === statusFilter);
  }, [rows, statusFilter]);

  const columns: ColumnsType<StudentRow> = [
    {
      title: "Student ID",
      dataIndex: "student_id",
      key: "student_id",
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Badge color="orange" className="!bg-[var(--cv-accent)]" />
          <span>{value ?? row.id}</span>
        </div>
      ),
    },
    {
      title: "Name",
      key: "name",
      render: (_, row) => `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || "-",
    },
    {
      title: "Admission",
      dataIndex: "admission_number",
      key: "admission_number",
      render: (value) => value ?? "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value) => <Tag color={statusTagColor(String(value ?? ""))}>{String(value ?? "-")}</Tag>,
    },
    {
      title: "Contact",
      key: "contact",
      render: (_, row) => (
        <div className="text-white/70">
          {row.email ? <div>{row.email}</div> : null}
          {row.phone_number ? <div>{row.phone_number}</div> : null}
        </div>
      ),
    },
  ];

  const openPolicyEditor = () => {
    if (!policy) return;
    policyForm.setFieldsValue({
      prefix: policy.prefix,
      separator: policy.separator,
      include_year: policy.include_year,
      reset_cycle: policy.reset_cycle,
      sequence_padding: policy.sequence_padding,
      sequence_start: policy.sequence_start,
      allow_manual_override: policy.allow_manual_override,
      is_active: policy.is_active,
    } as StudentIdPolicy);
    setPolicyOpen(true);
  };

  const savePolicy = async () => {
    const values = await policyForm.validateFields();
    try {
      await updateCurrentPolicy({
        prefix: values.prefix,
        separator: values.separator,
        include_year: values.include_year,
        reset_cycle: values.reset_cycle,
        sequence_padding: values.sequence_padding,
        sequence_start: values.sequence_start,
        allow_manual_override: values.allow_manual_override,
        is_active: values.is_active,
      }).unwrap();
      setPolicyOpen(false);
      message.success("Student ID policy updated");
    } catch (error: any) {
      message.error(error?.data?.detail ?? "Failed to update student ID policy");
    }
  };

  const openCreateModal = () => {
    createForm.resetFields();
    createForm.setFieldsValue({ status: "ACTIVE" });
    setCreateOpen(true);
  };

  const createStudent = async () => {
    const values = await createForm.validateFields();
    try {
      const payload = Object.fromEntries(
        Object.entries(values).filter(
          ([, value]) => value !== undefined && value !== null && value !== "",
        ),
      );
      const created = await createStudentMutation(payload).unwrap();
      message.success(`Student ${created.student_id ?? created.id} created`);
      setCreateOpen(false);
      createForm.resetFields();
    } catch (error: any) {
      const detail = error?.data;
      if (detail && typeof detail === "object") {
        const firstMessage = Object.values(detail).flat().find(Boolean);
        message.error(
          typeof firstMessage === "string" ? firstMessage : "Failed to create student",
        );
      } else {
        message.error(error?.data?.detail ?? "Failed to create student");
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Typography.Title level={3} className="!mb-0 text-white">
            Students
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-white/60">
            Search students, review summaries, and manage the tenant student ID policy.
          </Typography.Paragraph>
        </div>

        <Space wrap>
          {canManage ? (
            <Button className="!rounded-2xl" icon={<SettingOutlined />} onClick={openPolicyEditor} disabled={!policy}>
              Edit ID Policy
            </Button>
          ) : null}
          {canManage ? (
            <Button type="primary" className="!rounded-2xl !bg-[var(--cv-accent)] !border-0" icon={<PlusOutlined />} onClick={openCreateModal}>
              Create Student
            </Button>
          ) : null}
        </Space>
      </div>

      {canManage ? (
        <Card loading={policyLoading} className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={10}>
              <div className="text-white font-semibold">Student ID Policy</div>
              <div className="text-white/60 mt-1">
                Auto-generation is {policy?.is_active ? "enabled" : "disabled"} for this tenant.
              </div>
              <div className="mt-4 rounded-2xl border border-[var(--cv-accent)]/20 bg-[var(--cv-accent)]/10 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.2em] text-white/45">Next Generated ID</div>
                <div className="mt-2 text-2xl font-semibold text-white">{policy?.preview_next_student_id ?? "-"}</div>
              </div>
            </Col>
            <Col xs={24} lg={14}>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-white/45 text-xs uppercase tracking-wide">Prefix</div>
                  <div className="mt-1 text-white">{policy?.prefix ?? "-"}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-white/45 text-xs uppercase tracking-wide">Reset Cycle</div>
                  <div className="mt-1 text-white">{policy?.reset_cycle ?? "-"}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-white/45 text-xs uppercase tracking-wide">Sequence</div>
                  <div className="mt-1 text-white">
                    Start {policy?.sequence_start ?? "-"} / Pad {policy?.sequence_padding ?? "-"}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-white/45 text-xs uppercase tracking-wide">Manual Override</div>
                  <div className="mt-1 text-white">{policy?.allow_manual_override ? "Allowed" : "Disabled"}</div>
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      ) : null}

      <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
        <div className="mb-4 flex gap-3 items-center flex-wrap">
          <Select
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            options={[{ label: "All", value: "ALL" }, ...studentStatusOptions]}
            className="min-w-[160px]"
          />
          <Input.Search
            allowClear
            placeholder="Search by student id, name..."
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
              if (!event.target.value) setSearch("");
            }}
            onSearch={(value) => setSearch(value)}
            className="min-w-[280px]"
          />
        </div>

        <Table<StudentRow>
          rowKey="id"
          loading={loading}
          dataSource={filteredRows}
          columns={columns}
          onRow={(record) => ({
            onClick: () => {
              setSelected(record);
              setDrawerOpen(true);
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

      <Modal
        title="Edit Student ID Policy"
        open={policyOpen}
        onCancel={() => setPolicyOpen(false)}
        onOk={() => void savePolicy()}
        confirmLoading={policySaving}
      >
        <Form<StudentIdPolicy> form={policyForm} layout="vertical" requiredMark={false}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="prefix" label="Prefix" rules={[{ required: true }]}>
                <Input placeholder="STD or {school_code}" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="separator" label="Separator" rules={[{ required: true }]}>
                <Input maxLength={4} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="reset_cycle" label="Reset Cycle" rules={[{ required: true }]}>
                <Select options={[{ label: "Never", value: "NEVER" }, { label: "Yearly", value: "YEARLY" }]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="include_year" label="Include Year" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="sequence_padding" label="Sequence Padding" rules={[{ required: true }]}>
                <InputNumber className="!w-full" min={2} max={12} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sequence_start" label="Sequence Start" rules={[{ required: true }]}>
                <InputNumber className="!w-full" min={1} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="allow_manual_override" label="Manual Override" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="is_active" label="Auto Generation Active" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="Create Student"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => void createStudent()}
        confirmLoading={createSaving}
        width={760}
      >
        <div className="mb-4 rounded-2xl border border-[var(--cv-accent)]/20 bg-[var(--cv-accent)]/10 px-4 py-3">
          <div className="text-white/50 text-xs uppercase tracking-[0.2em]">Auto ID Preview</div>
          <div className="mt-1 text-white font-semibold">{policy?.preview_next_student_id ?? "Unavailable"}</div>
          <div className="mt-1 text-white/60 text-sm">
            Leave `student_id` blank to use the tenant policy. Manual override is {policy?.allow_manual_override ? "enabled" : "disabled"}.
          </div>
        </div>

        <Form<StudentCreateFormValues> form={createForm} layout="vertical" requiredMark={false}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="first_name" label="First Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="last_name" label="Last Name">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="date_of_birth" label="Date of Birth" rules={[{ required: true }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                <Select options={studentStatusOptions} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="student_id" label="Student ID">
                <Input disabled={policy ? !policy.allow_manual_override : false} placeholder={policy?.preview_next_student_id ?? "Auto-generated"} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="admission_number" label="Admission Number">
                <Input placeholder="Optional override" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="gender" label="Gender">
                <Select allowClear options={[{ label: "Male", value: "MALE" }, { label: "Female", value: "FEMALE" }, { label: "Other", value: "OTHER" }]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="admitted_on" label="Admitted On">
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="email" label="Email">
                <Input type="email" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone_number" label="Phone Number">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="address" label="Address">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <StudentDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} student={selected} />
    </div>
  );
}
