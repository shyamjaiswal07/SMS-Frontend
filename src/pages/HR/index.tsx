import { CalendarOutlined, ProfileOutlined, SafetyCertificateOutlined, TeamOutlined } from "@ant-design/icons";
import { Button, Card, Col, Descriptions, Drawer, Form, Input, InputNumber, Modal, Popconfirm, Row, Select, Space, Statistic, Switch, Table, Tabs, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import apiClient from "@/services/apiClient";

type Role = "SUPER_ADMIN" | "SCHOOL_ADMIN" | "HR_MANAGER";
type Paginated<T> = { results?: T[] };
type User = { id: number; email?: string; username?: string };
type Department = { id: number; name?: string };
type Staff = { id: number; user?: number | null; employee_code: string; first_name: string; last_name?: string; department?: number | null; designation?: string; employment_status?: string; date_of_joining?: string };
type EmploymentHistory = { id: number; staff: number; title: string; department_name?: string; start_date?: string; end_date?: string | null; remarks?: string };
type Qualification = { id: number; staff: number; qualification_name: string; institute: string; completed_year: number; grade_or_score?: string };
type StaffDocument = { id: number; staff: number; document_type: string; file_url: string; valid_until?: string | null };
type LeaveType = { id: number; name: string; code: string; max_days_per_year?: number; is_paid?: boolean };
type LeaveRequest = { id: number; staff: number; leave_type: number; start_date?: string; end_date?: string; status?: string };
type PayrollStructure = { id: number; name: string; code: string; pay_frequency?: string; currency?: string };
type PayrollComponent = { id: number; payroll_structure: number; name: string; component_type?: string; calculation_type?: string; value?: number | string; order?: number };
type StaffPayrollAssignment = { id: number; staff: number; payroll_structure: number; effective_from?: string; effective_to?: string | null };
type PayrollRun = { id: number; run_year: number; run_month: number; status?: string; processed_at?: string | null };
type Payslip = { id: number; payroll_run: number; staff: number; gross_salary?: number | string; total_deductions?: number | string; net_salary?: number | string };

type StaffForm = { user?: number; employee_code: string; first_name: string; last_name?: string; department?: number; designation: string; employment_status: string; date_of_joining: string; phone_number?: string; emergency_contact?: string };
type HistoryForm = { staff: number; title: string; department_name?: string; start_date: string; end_date?: string; remarks?: string };
type QualificationForm = { staff: number; qualification_name: string; institute: string; completed_year: number; grade_or_score?: string };
type DocumentForm = { staff: number; document_type: string; file_url: string; valid_until?: string };
type LeaveTypeForm = { name: string; code: string; max_days_per_year: number; is_paid?: boolean };
type LeaveRequestForm = { staff: number; leave_type: number; start_date: string; end_date: string; status: string; reason?: string };
type StructureForm = { name: string; code: string; pay_frequency: string; currency: string };
type ComponentForm = { payroll_structure: number; name: string; component_type: string; calculation_type: string; value: number; order: number };
type AssignmentForm = { staff: number; payroll_structure: number; effective_from: string; effective_to?: string };
type RunForm = { run_year: number; run_month: number; status: string };

const rowsOf = <T,>(data?: Paginated<T> | T[]) => (Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : []);
const dt = (value?: string | null) => (value ? new Date(value).toLocaleDateString() : "-");

function getRole(): Role | undefined {
  try {
    const raw = sessionStorage.getItem("tenant");
    return raw ? (JSON.parse(raw)?.role as Role | undefined) : undefined;
  } catch {
    return undefined;
  }
}

export default function HRPage() {
  const role = useMemo(() => getRole(), []);
  const canWrite = role === "SUPER_ADMIN" || role === "SCHOOL_ADMIN" || role === "HR_MANAGER";
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [histories, setHistories] = useState<EmploymentHistory[]>([]);
  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [documents, setDocuments] = useState<StaffDocument[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [structures, setStructures] = useState<PayrollStructure[]>([]);
  const [components, setComponents] = useState<PayrollComponent[]>([]);
  const [assignments, setAssignments] = useState<StaffPayrollAssignment[]>([]);
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [staffDetailOpen, setStaffDetailOpen] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [qualificationOpen, setQualificationOpen] = useState(false);
  const [documentOpen, setDocumentOpen] = useState(false);
  const [leaveTypeOpen, setLeaveTypeOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [structureOpen, setStructureOpen] = useState(false);
  const [componentOpen, setComponentOpen] = useState(false);
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [runOpen, setRunOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<number | null>(null);
  const [editingHistoryId, setEditingHistoryId] = useState<number | null>(null);
  const [editingQualificationId, setEditingQualificationId] = useState<number | null>(null);
  const [editingDocumentId, setEditingDocumentId] = useState<number | null>(null);
  const [editingLeaveTypeId, setEditingLeaveTypeId] = useState<number | null>(null);
  const [editingLeaveRequestId, setEditingLeaveRequestId] = useState<number | null>(null);
  const [editingStructureId, setEditingStructureId] = useState<number | null>(null);
  const [editingComponentId, setEditingComponentId] = useState<number | null>(null);
  const [editingAssignmentId, setEditingAssignmentId] = useState<number | null>(null);
  const [editingRunId, setEditingRunId] = useState<number | null>(null);
  const [staffForm] = Form.useForm<StaffForm>();
  const [historyForm] = Form.useForm<HistoryForm>();
  const [qualificationForm] = Form.useForm<QualificationForm>();
  const [documentForm] = Form.useForm<DocumentForm>();
  const [leaveTypeForm] = Form.useForm<LeaveTypeForm>();
  const [leaveForm] = Form.useForm<LeaveRequestForm>();
  const [structureForm] = Form.useForm<StructureForm>();
  const [componentForm] = Form.useForm<ComponentForm>();
  const [assignmentForm] = Form.useForm<AssignmentForm>();
  const [runForm] = Form.useForm<RunForm>();

  const loadAll = async () => {
    setLoading(true);
    try {
      const settled = await Promise.allSettled([
        apiClient.get("/api/accounts/users/", { params: { page: 1, page_size: 200 } }),
        apiClient.get("/api/institutions/departments/", { params: { page: 1, page_size: 100 } }),
        apiClient.get("/api/hr/staff-profiles/", { params: { page: 1, page_size: 100 } }),
        apiClient.get("/api/hr/employment-histories/", { params: { page: 1, page_size: 200 } }),
        apiClient.get("/api/hr/qualifications/", { params: { page: 1, page_size: 200 } }),
        apiClient.get("/api/hr/staff-documents/", { params: { page: 1, page_size: 200 } }),
        apiClient.get("/api/hr/leave-types/", { params: { page: 1, page_size: 100 } }),
        apiClient.get("/api/hr/leave-requests/", { params: { page: 1, page_size: 100 } }),
        apiClient.get("/api/hr/payroll-structures/", { params: { page: 1, page_size: 100 } }),
        apiClient.get("/api/hr/payroll-components/", { params: { page: 1, page_size: 200 } }),
        apiClient.get("/api/hr/staff-payroll-assignments/", { params: { page: 1, page_size: 200 } }),
        apiClient.get("/api/hr/payroll-runs/", { params: { page: 1, page_size: 100 } }),
        apiClient.get("/api/hr/payslips/", { params: { page: 1, page_size: 200 } }),
      ]);
      const valueAt = <T,>(index: number, fallback: T) => (settled[index].status === "fulfilled" ? (settled[index] as PromiseFulfilledResult<{ data: T }>).value.data : fallback);
      setUsers(rowsOf<User>(valueAt(0, [] as User[])));
      setDepartments(rowsOf<Department>(valueAt(1, [] as Department[])));
      setStaff(rowsOf<Staff>(valueAt(2, [] as Staff[])));
      setHistories(rowsOf<EmploymentHistory>(valueAt(3, [] as EmploymentHistory[])));
      setQualifications(rowsOf<Qualification>(valueAt(4, [] as Qualification[])));
      setDocuments(rowsOf<StaffDocument>(valueAt(5, [] as StaffDocument[])));
      setLeaveTypes(rowsOf<LeaveType>(valueAt(6, [] as LeaveType[])));
      setLeaveRequests(rowsOf<LeaveRequest>(valueAt(7, [] as LeaveRequest[])));
      setStructures(rowsOf<PayrollStructure>(valueAt(8, [] as PayrollStructure[])));
      setComponents(rowsOf<PayrollComponent>(valueAt(9, [] as PayrollComponent[])));
      setAssignments(rowsOf<StaffPayrollAssignment>(valueAt(10, [] as StaffPayrollAssignment[])));
      setRuns(rowsOf<PayrollRun>(valueAt(11, [] as PayrollRun[])));
      setPayslips(rowsOf<Payslip>(valueAt(12, [] as Payslip[])));
    } catch (error: any) {
      message.error(error?.response?.data?.detail ?? "Failed to load HR workspace");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const userMap = useMemo(() => new Map(users.map((item) => [item.id, item.email ?? item.username ?? `User #${item.id}`])), [users]);
  const departmentMap = useMemo(() => new Map(departments.map((item) => [item.id, item.name ?? `Department #${item.id}`])), [departments]);
  const staffMap = useMemo(() => new Map(staff.map((item) => [item.id, `${item.employee_code} - ${item.first_name} ${item.last_name ?? ""}`.trim()])), [staff]);
  const leaveTypeMap = useMemo(() => new Map(leaveTypes.map((item) => [item.id, `${item.name} (${item.code})`])), [leaveTypes]);
  const structureMap = useMemo(() => new Map(structures.map((item) => [item.id, `${item.name} (${item.code})`])), [structures]);
  const runMap = useMemo(() => new Map(runs.map((item) => [item.id, `${item.run_month}/${item.run_year}`])), [runs]);
  const selectedStaff = useMemo(() => staff.find((item) => item.id === selectedStaffId) ?? null, [staff, selectedStaffId]);
  const selectedStaffHistory = useMemo(() => histories.filter((item) => item.staff === selectedStaffId), [histories, selectedStaffId]);
  const selectedStaffQualifications = useMemo(() => qualifications.filter((item) => item.staff === selectedStaffId), [qualifications, selectedStaffId]);
  const selectedStaffDocuments = useMemo(() => documents.filter((item) => item.staff === selectedStaffId), [documents, selectedStaffId]);
  const selectedStaffLeaves = useMemo(() => leaveRequests.filter((item) => item.staff === selectedStaffId), [leaveRequests, selectedStaffId]);
  const selectedStaffAssignments = useMemo(() => assignments.filter((item) => item.staff === selectedStaffId), [assignments, selectedStaffId]);
  const selectedStaffPayslips = useMemo(() => payslips.filter((item) => item.staff === selectedStaffId), [payslips, selectedStaffId]);

  const submitCreate = async (endpoint: string, values: Record<string, unknown>, onDone: () => void, successText: string, failureText: string) => {
    setSubmitting(true);
    try {
      await apiClient.post(endpoint, values);
      message.success(successText);
      onDone();
      await loadAll();
    } catch (error: any) {
      message.error(error?.response?.data?.detail ?? failureText);
    } finally {
      setSubmitting(false);
    }
  };

  const submitSave = async (
    endpoint: string,
    id: number | null,
    values: Record<string, unknown>,
    onDone: () => void,
    createText: string,
    updateText: string,
    failureText: string,
  ) => {
    setSubmitting(true);
    try {
      if (id) {
        await apiClient.patch(`${endpoint}${id}/`, values);
        message.success(updateText);
      } else {
        await apiClient.post(endpoint, values);
        message.success(createText);
      }
      onDone();
      await loadAll();
    } catch (error: any) {
      message.error(error?.response?.data?.detail ?? failureText);
    } finally {
      setSubmitting(false);
    }
  };

  const removeRecord = async (endpoint: string, id: number, successText: string, failureText: string) => {
    try {
      await apiClient.delete(`${endpoint}${id}/`);
      message.success(successText);
      await loadAll();
    } catch (error: any) {
      message.error(error?.response?.data?.detail ?? failureText);
    }
  };

  const updateStatus = async (endpoint: string, id: number, status: string, successText: string, failureText: string) => {
    try {
      await apiClient.patch(`${endpoint}${id}/`, { status });
      message.success(successText);
      await loadAll();
    } catch (error: any) {
      message.error(error?.response?.data?.detail ?? failureText);
    }
  };

  const staffColumns: ColumnsType<Staff> = [
    { title: "Employee", key: "employee", render: (_, row) => <div><div className="text-white/85">{row.first_name} {row.last_name ?? ""}</div><div className="text-white/50 text-xs">{row.employee_code}</div></div> },
    { title: "Department", dataIndex: "department", render: (value) => <span className="text-white/65">{value ? departmentMap.get(value) ?? `Department #${value}` : "-"}</span> },
    { title: "Designation", dataIndex: "designation", render: (value) => <span className="text-white/75">{value}</span> },
    { title: "Status", dataIndex: "employment_status", render: (value) => <Tag color={value === "ACTIVE" ? "green" : value === "ON_LEAVE" ? "orange" : "red"}>{value}</Tag> },
    {
      title: "Actions",
      key: "actions",
      render: (_, row) => (
        <Space wrap>
          <Button size="small" onClick={() => { setSelectedStaffId(row.id); setStaffDetailOpen(true); }}>View</Button>
          {canWrite ? <Button size="small" onClick={() => {
            setEditingStaffId(row.id);
            staffForm.setFieldsValue({
              user: row.user ?? undefined,
              employee_code: row.employee_code,
              first_name: row.first_name,
              last_name: row.last_name,
              department: row.department ?? undefined,
              designation: row.designation ?? "",
              employment_status: row.employment_status ?? "ACTIVE",
              date_of_joining: row.date_of_joining ?? "",
            });
            setStaffOpen(true);
          }}>Edit</Button> : null}
          {canWrite ? <Popconfirm title="Delete this staff profile?" onConfirm={() => void removeRecord("/api/hr/staff-profiles/", row.id, "Staff profile deleted", "Failed to delete staff profile")}><Button size="small" danger>Delete</Button></Popconfirm> : null}
        </Space>
      ),
    },
  ];
  const leaveTypeColumns: ColumnsType<LeaveType> = [
    { title: "Name", dataIndex: "name", render: (value) => <span className="text-white/85">{value}</span> },
    { title: "Code", dataIndex: "code", render: (value) => <code className="text-[var(--cv-accent)]">{value}</code> },
    { title: "Max Days", dataIndex: "max_days_per_year", render: (value) => <span className="text-white/65">{String(value ?? "-")}</span> },
    { title: "Paid", dataIndex: "is_paid", render: (value) => <Tag color={value ? "green" : "default"}>{value ? "Paid" : "Unpaid"}</Tag> },
    {
      title: "Actions",
      key: "actions",
      render: (_, row) => canWrite ? (
        <Space wrap>
          <Button size="small" onClick={() => {
            setEditingLeaveTypeId(row.id);
            leaveTypeForm.setFieldsValue({ name: row.name, code: row.code, max_days_per_year: row.max_days_per_year ?? 12, is_paid: row.is_paid ?? true });
            setLeaveTypeOpen(true);
          }}>Edit</Button>
          <Popconfirm title="Delete this leave type?" onConfirm={() => void removeRecord("/api/hr/leave-types/", row.id, "Leave type deleted", "Failed to delete leave type")}><Button size="small" danger>Delete</Button></Popconfirm>
        </Space>
      ) : null,
    },
  ];
  const leaveColumns: ColumnsType<LeaveRequest> = [
    { title: "Staff", dataIndex: "staff", render: (value) => <span className="text-white/65">{staffMap.get(value) ?? `Staff #${value}`}</span> },
    { title: "Leave Type", dataIndex: "leave_type", render: (value) => <span className="text-white/65">{leaveTypeMap.get(value) ?? `Leave Type #${value}`}</span> },
    { title: "Window", key: "window", render: (_, row) => <span className="text-white/65">{dt(row.start_date)} - {dt(row.end_date)}</span> },
    { title: "Status", dataIndex: "status", render: (value) => <Tag color={value === "APPROVED" ? "green" : value === "REJECTED" ? "red" : "orange"}>{value}</Tag> },
    {
      title: "Actions",
      key: "actions",
      render: (_, row) => canWrite ? (
        <Space wrap>
          {row.status !== "APPROVED" ? <Button size="small" onClick={() => void updateStatus("/api/hr/leave-requests/", row.id, "APPROVED", "Leave request approved", "Failed to approve leave request")}>Approve</Button> : null}
          {row.status !== "REJECTED" ? <Button size="small" danger onClick={() => void updateStatus("/api/hr/leave-requests/", row.id, "REJECTED", "Leave request rejected", "Failed to reject leave request")}>Reject</Button> : null}
          <Button size="small" onClick={() => {
            setEditingLeaveRequestId(row.id);
            leaveForm.setFieldsValue({
              staff: row.staff,
              leave_type: row.leave_type,
              start_date: row.start_date ?? "",
              end_date: row.end_date ?? "",
              status: row.status ?? "PENDING",
            });
            setLeaveOpen(true);
          }}>Edit</Button>
          <Popconfirm title="Delete this leave request?" onConfirm={() => void removeRecord("/api/hr/leave-requests/", row.id, "Leave request deleted", "Failed to delete leave request")}><Button size="small" danger>Delete</Button></Popconfirm>
        </Space>
      ) : null,
    },
  ];
  const historyColumns: ColumnsType<EmploymentHistory> = [
    { title: "Staff", dataIndex: "staff", render: (value) => <span className="text-white/65">{staffMap.get(value) ?? `Staff #${value}`}</span> },
    { title: "Title", dataIndex: "title", render: (value) => <span className="text-white/85">{value}</span> },
    { title: "Department", dataIndex: "department_name", render: (value) => <span className="text-white/65">{value || "-"}</span> },
    { title: "Period", key: "period", render: (_, row) => <span className="text-white/65">{dt(row.start_date)} - {dt(row.end_date)}</span> },
    {
      title: "Actions",
      key: "actions",
      render: (_, row) => canWrite ? (
        <Space wrap>
          <Button size="small" onClick={() => {
            setEditingHistoryId(row.id);
            historyForm.setFieldsValue({
              staff: row.staff,
              title: row.title,
              department_name: row.department_name ?? "",
              start_date: row.start_date ?? "",
              end_date: row.end_date ?? "",
              remarks: row.remarks ?? "",
            });
            setHistoryOpen(true);
          }}>Edit</Button>
          <Popconfirm title="Delete this employment history?" onConfirm={() => void removeRecord("/api/hr/employment-histories/", row.id, "Employment history deleted", "Failed to delete employment history")}><Button size="small" danger>Delete</Button></Popconfirm>
        </Space>
      ) : null,
    },
  ];
  const qualificationColumns: ColumnsType<Qualification> = [
    { title: "Staff", dataIndex: "staff", render: (value) => <span className="text-white/65">{staffMap.get(value) ?? `Staff #${value}`}</span> },
    { title: "Qualification", dataIndex: "qualification_name", render: (value) => <span className="text-white/85">{value}</span> },
    { title: "Institute", dataIndex: "institute", render: (value) => <span className="text-white/65">{value}</span> },
    { title: "Year", dataIndex: "completed_year", render: (value) => <span className="text-white/65">{String(value ?? "-")}</span> },
    {
      title: "Actions",
      key: "actions",
      render: (_, row) => canWrite ? (
        <Space wrap>
          <Button size="small" onClick={() => {
            setEditingQualificationId(row.id);
            qualificationForm.setFieldsValue({
              staff: row.staff,
              qualification_name: row.qualification_name,
              institute: row.institute,
              completed_year: row.completed_year,
              grade_or_score: row.grade_or_score ?? "",
            });
            setQualificationOpen(true);
          }}>Edit</Button>
          <Popconfirm title="Delete this qualification?" onConfirm={() => void removeRecord("/api/hr/qualifications/", row.id, "Qualification deleted", "Failed to delete qualification")}><Button size="small" danger>Delete</Button></Popconfirm>
        </Space>
      ) : null,
    },
  ];
  const documentColumns: ColumnsType<StaffDocument> = [
    { title: "Staff", dataIndex: "staff", render: (value) => <span className="text-white/65">{staffMap.get(value) ?? `Staff #${value}`}</span> },
    { title: "Document Type", dataIndex: "document_type", render: (value) => <span className="text-white/85">{value}</span> },
    { title: "File URL", dataIndex: "file_url", render: (value) => <a href={value} target="_blank" rel="noreferrer" className="text-[var(--cv-accent)]">Open</a> },
    { title: "Valid Until", dataIndex: "valid_until", render: (value) => <span className="text-white/55">{dt(value)}</span> },
    {
      title: "Actions",
      key: "actions",
      render: (_, row) => canWrite ? (
        <Space wrap>
          <Button size="small" onClick={() => {
            setEditingDocumentId(row.id);
            documentForm.setFieldsValue({
              staff: row.staff,
              document_type: row.document_type,
              file_url: row.file_url,
              valid_until: row.valid_until ?? "",
            });
            setDocumentOpen(true);
          }}>Edit</Button>
          <Popconfirm title="Delete this document?" onConfirm={() => void removeRecord("/api/hr/staff-documents/", row.id, "Document deleted", "Failed to delete document")}><Button size="small" danger>Delete</Button></Popconfirm>
        </Space>
      ) : null,
    },
  ];
  const structureColumns: ColumnsType<PayrollStructure> = [
    { title: "Structure", key: "structure", render: (_, row) => <div><div className="text-white/85">{row.name}</div><div className="text-white/50 text-xs">{row.code}</div></div> },
    { title: "Frequency", dataIndex: "pay_frequency", render: (value) => <Tag color="blue">{value}</Tag> },
    { title: "Currency", dataIndex: "currency", render: (value) => <span className="text-white/75">{value}</span> },
    {
      title: "Actions",
      key: "actions",
      render: (_, row) => canWrite ? (
        <Space wrap>
          <Button size="small" onClick={() => {
            setEditingStructureId(row.id);
            structureForm.setFieldsValue({ name: row.name, code: row.code, pay_frequency: row.pay_frequency ?? "MONTHLY", currency: row.currency ?? "INR" });
            setStructureOpen(true);
          }}>Edit</Button>
          <Popconfirm title="Delete this payroll structure?" onConfirm={() => void removeRecord("/api/hr/payroll-structures/", row.id, "Payroll structure deleted", "Failed to delete payroll structure")}><Button size="small" danger>Delete</Button></Popconfirm>
        </Space>
      ) : null,
    },
  ];
  const componentColumns: ColumnsType<PayrollComponent> = [
    { title: "Structure", dataIndex: "payroll_structure", render: (value) => <span className="text-white/65">{structureMap.get(value) ?? `Structure #${value}`}</span> },
    { title: "Component", dataIndex: "name", render: (value) => <span className="text-white/85">{value}</span> },
    { title: "Type", dataIndex: "component_type", render: (value) => <Tag color={value === "DEDUCTION" ? "red" : "green"}>{value}</Tag> },
    { title: "Calc", dataIndex: "calculation_type", render: (value) => <span className="text-white/65">{value}</span> },
    { title: "Value", dataIndex: "value", render: (value) => <span className="text-white/85">{String(value ?? "-")}</span> },
    {
      title: "Actions",
      key: "actions",
      render: (_, row) => canWrite ? (
        <Space wrap>
          <Button size="small" onClick={() => {
            setEditingComponentId(row.id);
            componentForm.setFieldsValue({
              payroll_structure: row.payroll_structure,
              name: row.name,
              component_type: row.component_type ?? "EARNING",
              calculation_type: row.calculation_type ?? "FIXED",
              value: Number(row.value ?? 0),
              order: row.order ?? 1,
            });
            setComponentOpen(true);
          }}>Edit</Button>
          <Popconfirm title="Delete this payroll component?" onConfirm={() => void removeRecord("/api/hr/payroll-components/", row.id, "Payroll component deleted", "Failed to delete payroll component")}><Button size="small" danger>Delete</Button></Popconfirm>
        </Space>
      ) : null,
    },
  ];
  const assignmentColumns: ColumnsType<StaffPayrollAssignment> = [
    { title: "Staff", dataIndex: "staff", render: (value) => <span className="text-white/65">{staffMap.get(value) ?? `Staff #${value}`}</span> },
    { title: "Structure", dataIndex: "payroll_structure", render: (value) => <span className="text-white/65">{structureMap.get(value) ?? `Structure #${value}`}</span> },
    { title: "Effective From", dataIndex: "effective_from", render: (value) => <span className="text-white/55">{dt(value)}</span> },
    { title: "Effective To", dataIndex: "effective_to", render: (value) => <span className="text-white/55">{dt(value)}</span> },
    {
      title: "Actions",
      key: "actions",
      render: (_, row) => canWrite ? (
        <Space wrap>
          <Button size="small" onClick={() => {
            setEditingAssignmentId(row.id);
            assignmentForm.setFieldsValue({
              staff: row.staff,
              payroll_structure: row.payroll_structure,
              effective_from: row.effective_from ?? "",
              effective_to: row.effective_to ?? "",
            });
            setAssignmentOpen(true);
          }}>Edit</Button>
          <Popconfirm title="Delete this payroll assignment?" onConfirm={() => void removeRecord("/api/hr/staff-payroll-assignments/", row.id, "Payroll assignment deleted", "Failed to delete payroll assignment")}><Button size="small" danger>Delete</Button></Popconfirm>
        </Space>
      ) : null,
    },
  ];
  const runColumns: ColumnsType<PayrollRun> = [
    { title: "Period", key: "period", render: (_, row) => <span className="text-white/85">{row.run_month}/{row.run_year}</span> },
    { title: "Status", dataIndex: "status", render: (value) => <Tag color={value === "PROCESSED" ? "green" : "orange"}>{value}</Tag> },
    { title: "Processed", dataIndex: "processed_at", render: (value) => <span className="text-white/55">{value ? new Date(value).toLocaleString() : "-"}</span> },
    {
      title: "Actions",
      key: "actions",
      render: (_, row) => canWrite ? (
        <Space wrap>
          <Button size="small" onClick={() => {
            setEditingRunId(row.id);
            runForm.setFieldsValue({ run_year: row.run_year, run_month: row.run_month, status: row.status ?? "DRAFT" });
            setRunOpen(true);
          }}>Edit</Button>
          <Popconfirm title="Delete this payroll run?" onConfirm={() => void removeRecord("/api/hr/payroll-runs/", row.id, "Payroll run deleted", "Failed to delete payroll run")}><Button size="small" danger>Delete</Button></Popconfirm>
        </Space>
      ) : null,
    },
  ];
  const payslipColumns: ColumnsType<Payslip> = [
    { title: "Run", dataIndex: "payroll_run", render: (value) => <span className="text-white/65">{runMap.get(value) ?? `Run #${value}`}</span> },
    { title: "Staff", dataIndex: "staff", render: (value) => <span className="text-white/65">{staffMap.get(value) ?? `Staff #${value}`}</span> },
    { title: "Gross", dataIndex: "gross_salary", render: (value) => <span className="text-white/85">{String(value ?? "-")}</span> },
    { title: "Deductions", dataIndex: "total_deductions", render: (value) => <span className="text-white/85">{String(value ?? "-")}</span> },
    { title: "Net", dataIndex: "net_salary", render: (value) => <span className="text-white/85">{String(value ?? "-")}</span> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Typography.Title level={3} className="!mb-0 text-white">
            HR <span className="text-[var(--cv-accent)]">Workspace</span>
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-white/60">
            Staff, leave, payroll runs, and payslip visibility using the SMS HR APIs.
          </Typography.Paragraph>
        </div>
        <Space wrap>
          <Tag color="purple">{role ?? "UNKNOWN"}</Tag>
          <Button onClick={() => void loadAll()} loading={loading}>Refresh</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}><Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl"><Statistic title={<span className="text-white/60">Staff Profiles</span>} value={staff.length} prefix={<TeamOutlined className="text-[var(--cv-accent)]" />} valueStyle={{ color: "#e5e7eb" }} /></Card></Col>
        <Col xs={24} md={12} xl={6}><Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl"><Statistic title={<span className="text-white/60">Leave Requests</span>} value={leaveRequests.length} prefix={<CalendarOutlined className="text-[var(--cv-accent)]" />} valueStyle={{ color: "#e5e7eb" }} /></Card></Col>
        <Col xs={24} md={12} xl={6}><Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl"><Statistic title={<span className="text-white/60">Payroll Runs</span>} value={runs.length} prefix={<ProfileOutlined className="text-[var(--cv-accent)]" />} valueStyle={{ color: "#e5e7eb" }} /></Card></Col>
        <Col xs={24} md={12} xl={6}><Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl"><Statistic title={<span className="text-white/60">Payslips</span>} value={payslips.length} prefix={<SafetyCertificateOutlined className="text-[var(--cv-accent)]" />} valueStyle={{ color: "#e5e7eb" }} /></Card></Col>
      </Row>

      <Tabs
        defaultActiveKey="staff"
        items={[
          {
            key: "staff",
            label: "Staff",
            children: (
              <div className="space-y-4">
                <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
                  <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                    <div><div className="text-white font-medium">Staff Profiles</div><div className="text-white/55 text-sm">Employee records, departments, and employment status.</div></div>
                    {canWrite ? <Button type="primary" className="!rounded-2xl !bg-[var(--cv-accent)] !border-0" onClick={() => { staffForm.resetFields(); staffForm.setFieldsValue({ employment_status: "ACTIVE" }); setStaffOpen(true); }}>Add Staff</Button> : null}
                  </div>
                  <Table rowKey="id" loading={loading} dataSource={staff} columns={staffColumns} pagination={{ pageSize: 8 }} />
                </Card>
                <Row gutter={[16, 16]}>
                  <Col xs={24} xl={8}>
                    <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl h-full">
                      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                        <div><div className="text-white font-medium">Employment History</div><div className="text-white/55 text-sm">Track role changes and prior positions.</div></div>
                        {canWrite ? <Button onClick={() => { historyForm.resetFields(); setHistoryOpen(true); }}>Add History</Button> : null}
                      </div>
                      <Table rowKey="id" loading={loading} dataSource={histories} columns={historyColumns} pagination={{ pageSize: 5 }} />
                    </Card>
                  </Col>
                  <Col xs={24} xl={8}>
                    <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl h-full">
                      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                        <div><div className="text-white font-medium">Qualifications</div><div className="text-white/55 text-sm">Academic and certification records for staff.</div></div>
                        {canWrite ? <Button onClick={() => { qualificationForm.resetFields(); setQualificationOpen(true); }}>Add Qualification</Button> : null}
                      </div>
                      <Table rowKey="id" loading={loading} dataSource={qualifications} columns={qualificationColumns} pagination={{ pageSize: 5 }} />
                    </Card>
                  </Col>
                  <Col xs={24} xl={8}>
                    <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl h-full">
                      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                        <div><div className="text-white font-medium">Staff Documents</div><div className="text-white/55 text-sm">Compliance and identity document links.</div></div>
                        {canWrite ? <Button onClick={() => { documentForm.resetFields(); setDocumentOpen(true); }}>Add Document</Button> : null}
                      </div>
                      <Table rowKey="id" loading={loading} dataSource={documents} columns={documentColumns} pagination={{ pageSize: 5 }} />
                    </Card>
                  </Col>
                </Row>
              </div>
            ),
          },
          {
            key: "leave",
            label: "Leave",
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} xl={10}>
                  <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl h-full">
                    <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                      <div><div className="text-white font-medium">Leave Types</div><div className="text-white/55 text-sm">Paid and unpaid leave policies.</div></div>
                      {canWrite ? <Button onClick={() => { leaveTypeForm.resetFields(); leaveTypeForm.setFieldsValue({ max_days_per_year: 12, is_paid: true }); setLeaveTypeOpen(true); }}>Add Leave Type</Button> : null}
                    </div>
                    <Table rowKey="id" loading={loading} dataSource={leaveTypes} columns={leaveTypeColumns} pagination={{ pageSize: 6 }} />
                  </Card>
                </Col>
                <Col xs={24} xl={14}>
                  <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl h-full">
                    <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                      <div><div className="text-white font-medium">Leave Requests</div><div className="text-white/55 text-sm">Request windows and approval states.</div></div>
                      {canWrite ? <Button onClick={() => { leaveForm.resetFields(); leaveForm.setFieldsValue({ status: "PENDING" }); setLeaveOpen(true); }}>Create Leave Request</Button> : null}
                    </div>
                    <Table rowKey="id" loading={loading} dataSource={leaveRequests} columns={leaveColumns} pagination={{ pageSize: 6 }} />
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: "payroll",
            label: "Payroll",
            children: (
              <div className="space-y-4">
                <Row gutter={[16, 16]}>
                  <Col xs={24} xl={12}>
                    <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl h-full">
                      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                        <div><div className="text-white font-medium">Payroll Structures</div><div className="text-white/55 text-sm">Base salary structures and payroll frequency.</div></div>
                        {canWrite ? <Button onClick={() => { structureForm.resetFields(); structureForm.setFieldsValue({ pay_frequency: "MONTHLY", currency: "INR" }); setStructureOpen(true); }}>Add Structure</Button> : null}
                      </div>
                      <Table rowKey="id" loading={loading} dataSource={structures} columns={structureColumns} pagination={{ pageSize: 5 }} />
                    </Card>
                  </Col>
                  <Col xs={24} xl={12}>
                    <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl h-full">
                      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                        <div><div className="text-white font-medium">Payroll Components</div><div className="text-white/55 text-sm">Earnings and deductions per structure.</div></div>
                        {canWrite ? <Button onClick={() => { componentForm.resetFields(); componentForm.setFieldsValue({ component_type: "EARNING", calculation_type: "FIXED", value: 0, order: 1 }); setComponentOpen(true); }}>Add Component</Button> : null}
                      </div>
                      <Table rowKey="id" loading={loading} dataSource={components} columns={componentColumns} pagination={{ pageSize: 5 }} />
                    </Card>
                  </Col>
                </Row>
                <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
                  <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                    <div><div className="text-white font-medium">Staff Payroll Assignments</div><div className="text-white/55 text-sm">Connect staff to payroll structures with effective dates.</div></div>
                    {canWrite ? <Button onClick={() => { assignmentForm.resetFields(); setAssignmentOpen(true); }}>Assign Structure</Button> : null}
                  </div>
                  <Table rowKey="id" loading={loading} dataSource={assignments} columns={assignmentColumns} pagination={{ pageSize: 6 }} />
                </Card>
                <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
                  <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                    <div><div className="text-white font-medium">Payroll Runs</div><div className="text-white/55 text-sm">Manage payroll execution periods.</div></div>
                    {canWrite ? <Button onClick={() => { runForm.resetFields(); runForm.setFieldsValue({ status: "DRAFT", run_year: new Date().getFullYear(), run_month: new Date().getMonth() + 1 }); setRunOpen(true); }}>Create Run</Button> : null}
                  </div>
                  <Table rowKey="id" loading={loading} dataSource={runs} columns={runColumns} pagination={{ pageSize: 6 }} />
                </Card>
                <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
                  <div className="text-white font-medium mb-3">Payslips</div>
                  <Table rowKey="id" loading={loading} dataSource={payslips} columns={payslipColumns} pagination={{ pageSize: 8 }} />
                </Card>
              </div>
            ),
          },
        ]}
      />

      <Modal title={editingStaffId ? "Edit Staff Profile" : "Create Staff Profile"} open={staffOpen} onCancel={() => { setStaffOpen(false); setEditingStaffId(null); }} onOk={() => void staffForm.validateFields().then((values) => submitSave("/api/hr/staff-profiles/", editingStaffId, values, () => { setStaffOpen(false); setEditingStaffId(null); }, "Staff profile created", "Staff profile updated", "Failed to save staff profile"))} confirmLoading={submitting} width={820}>
        <Form<StaffForm> form={staffForm} layout="vertical" requiredMark={false}>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="user" label="Linked User"><Select showSearch optionFilterProp="label" options={users.map((item) => ({ value: item.id, label: userMap.get(item.id) ?? `User #${item.id}` }))} allowClear /></Form.Item></Col>
            <Col span={12}><Form.Item name="employee_code" label="Employee Code" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="first_name" label="First Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="last_name" label="Last Name"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="department" label="Department"><Select showSearch optionFilterProp="label" options={departments.map((item) => ({ value: item.id, label: departmentMap.get(item.id) ?? `Department #${item.id}` }))} allowClear /></Form.Item></Col>
            <Col span={12}><Form.Item name="designation" label="Designation" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="employment_status" label="Employment Status" rules={[{ required: true }]}><Select options={[{ label: "Active", value: "ACTIVE" }, { label: "On Leave", value: "ON_LEAVE" }, { label: "Resigned", value: "RESIGNED" }, { label: "Terminated", value: "TERMINATED" }]} /></Form.Item></Col>
            <Col span={12}><Form.Item name="date_of_joining" label="Date of Joining" rules={[{ required: true }]}><Input type="date" /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="phone_number" label="Phone Number"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="emergency_contact" label="Emergency Contact"><Input /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      <Modal title={editingLeaveTypeId ? "Edit Leave Type" : "Create Leave Type"} open={leaveTypeOpen} onCancel={() => { setLeaveTypeOpen(false); setEditingLeaveTypeId(null); }} onOk={() => void leaveTypeForm.validateFields().then((values) => submitSave("/api/hr/leave-types/", editingLeaveTypeId, values, () => { setLeaveTypeOpen(false); setEditingLeaveTypeId(null); }, "Leave type created", "Leave type updated", "Failed to save leave type"))} confirmLoading={submitting}>
        <Form<LeaveTypeForm> form={leaveTypeForm} layout="vertical" requiredMark={false}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="code" label="Code" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="max_days_per_year" label="Max Days Per Year" rules={[{ required: true }]}><InputNumber className="!w-full" /></Form.Item>
          <Form.Item name="is_paid" label="Paid Leave" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>

      <Modal title={editingHistoryId ? "Edit Employment History" : "Add Employment History"} open={historyOpen} onCancel={() => { setHistoryOpen(false); setEditingHistoryId(null); }} onOk={() => void historyForm.validateFields().then((values) => submitSave("/api/hr/employment-histories/", editingHistoryId, values, () => { setHistoryOpen(false); setEditingHistoryId(null); }, "Employment history added", "Employment history updated", "Failed to save employment history"))} confirmLoading={submitting}>
        <Form<HistoryForm> form={historyForm} layout="vertical" requiredMark={false}>
          <Form.Item name="staff" label="Staff" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={staff.map((item) => ({ value: item.id, label: staffMap.get(item.id) ?? `Staff #${item.id}` }))} /></Form.Item>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="department_name" label="Department Name"><Input /></Form.Item>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="start_date" label="Start Date" rules={[{ required: true }]}><Input type="date" /></Form.Item></Col>
            <Col span={12}><Form.Item name="end_date" label="End Date"><Input type="date" /></Form.Item></Col>
          </Row>
          <Form.Item name="remarks" label="Remarks"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>

      <Modal title={editingQualificationId ? "Edit Qualification" : "Add Qualification"} open={qualificationOpen} onCancel={() => { setQualificationOpen(false); setEditingQualificationId(null); }} onOk={() => void qualificationForm.validateFields().then((values) => submitSave("/api/hr/qualifications/", editingQualificationId, values, () => { setQualificationOpen(false); setEditingQualificationId(null); }, "Qualification added", "Qualification updated", "Failed to save qualification"))} confirmLoading={submitting}>
        <Form<QualificationForm> form={qualificationForm} layout="vertical" requiredMark={false}>
          <Form.Item name="staff" label="Staff" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={staff.map((item) => ({ value: item.id, label: staffMap.get(item.id) ?? `Staff #${item.id}` }))} /></Form.Item>
          <Form.Item name="qualification_name" label="Qualification" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="institute" label="Institute" rules={[{ required: true }]}><Input /></Form.Item>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="completed_year" label="Completed Year" rules={[{ required: true }]}><InputNumber className="!w-full" /></Form.Item></Col>
            <Col span={12}><Form.Item name="grade_or_score" label="Grade / Score"><Input /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      <Modal title={editingDocumentId ? "Edit Staff Document" : "Add Staff Document"} open={documentOpen} onCancel={() => { setDocumentOpen(false); setEditingDocumentId(null); }} onOk={() => void documentForm.validateFields().then((values) => submitSave("/api/hr/staff-documents/", editingDocumentId, values, () => { setDocumentOpen(false); setEditingDocumentId(null); }, "Document added", "Document updated", "Failed to save document"))} confirmLoading={submitting}>
        <Form<DocumentForm> form={documentForm} layout="vertical" requiredMark={false}>
          <Form.Item name="staff" label="Staff" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={staff.map((item) => ({ value: item.id, label: staffMap.get(item.id) ?? `Staff #${item.id}` }))} /></Form.Item>
          <Form.Item name="document_type" label="Document Type" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="file_url" label="File URL" rules={[{ required: true }, { type: "url" }]}><Input /></Form.Item>
          <Form.Item name="valid_until" label="Valid Until"><Input type="date" /></Form.Item>
        </Form>
      </Modal>

      <Modal title={editingLeaveRequestId ? "Edit Leave Request" : "Create Leave Request"} open={leaveOpen} onCancel={() => { setLeaveOpen(false); setEditingLeaveRequestId(null); }} onOk={() => void leaveForm.validateFields().then((values) => submitSave("/api/hr/leave-requests/", editingLeaveRequestId, values, () => { setLeaveOpen(false); setEditingLeaveRequestId(null); }, "Leave request created", "Leave request updated", "Failed to save leave request"))} confirmLoading={submitting}>
        <Form<LeaveRequestForm> form={leaveForm} layout="vertical" requiredMark={false}>
          <Form.Item name="staff" label="Staff" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={staff.map((item) => ({ value: item.id, label: staffMap.get(item.id) ?? `Staff #${item.id}` }))} /></Form.Item>
          <Form.Item name="leave_type" label="Leave Type" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={leaveTypes.map((item) => ({ value: item.id, label: leaveTypeMap.get(item.id) ?? item.name }))} /></Form.Item>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="start_date" label="Start Date" rules={[{ required: true }]}><Input type="date" /></Form.Item></Col>
            <Col span={12}><Form.Item name="end_date" label="End Date" rules={[{ required: true }]}><Input type="date" /></Form.Item></Col>
          </Row>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}><Select options={[{ label: "Pending", value: "PENDING" }, { label: "Approved", value: "APPROVED" }, { label: "Rejected", value: "REJECTED" }]} /></Form.Item>
          <Form.Item name="reason" label="Reason"><Input.TextArea rows={4} /></Form.Item>
        </Form>
      </Modal>

      <Modal title={editingRunId ? "Edit Payroll Run" : "Create Payroll Run"} open={runOpen} onCancel={() => { setRunOpen(false); setEditingRunId(null); }} onOk={() => void runForm.validateFields().then((values) => submitSave("/api/hr/payroll-runs/", editingRunId, values, () => { setRunOpen(false); setEditingRunId(null); }, "Payroll run created", "Payroll run updated", "Failed to save payroll run"))} confirmLoading={submitting}>
        <Form<RunForm> form={runForm} layout="vertical" requiredMark={false}>
          <Row gutter={12}>
            <Col span={8}><Form.Item name="run_year" label="Run Year" rules={[{ required: true }]}><InputNumber className="!w-full" /></Form.Item></Col>
            <Col span={8}><Form.Item name="run_month" label="Run Month" rules={[{ required: true }]}><InputNumber className="!w-full" min={1} max={12} /></Form.Item></Col>
            <Col span={8}><Form.Item name="status" label="Status" rules={[{ required: true }]}><Select options={[{ label: "Draft", value: "DRAFT" }, { label: "Processed", value: "PROCESSED" }]} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      <Modal title={editingStructureId ? "Edit Payroll Structure" : "Create Payroll Structure"} open={structureOpen} onCancel={() => { setStructureOpen(false); setEditingStructureId(null); }} onOk={() => void structureForm.validateFields().then((values) => submitSave("/api/hr/payroll-structures/", editingStructureId, values, () => { setStructureOpen(false); setEditingStructureId(null); }, "Payroll structure created", "Payroll structure updated", "Failed to save payroll structure"))} confirmLoading={submitting}>
        <Form<StructureForm> form={structureForm} layout="vertical" requiredMark={false}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="code" label="Code" rules={[{ required: true }]}><Input /></Form.Item>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="pay_frequency" label="Pay Frequency" rules={[{ required: true }]}><Select options={[{ label: "Monthly", value: "MONTHLY" }, { label: "Bi Weekly", value: "BI_WEEKLY" }, { label: "Weekly", value: "WEEKLY" }]} /></Form.Item></Col>
            <Col span={12}><Form.Item name="currency" label="Currency" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      <Modal title={editingComponentId ? "Edit Payroll Component" : "Create Payroll Component"} open={componentOpen} onCancel={() => { setComponentOpen(false); setEditingComponentId(null); }} onOk={() => void componentForm.validateFields().then((values) => submitSave("/api/hr/payroll-components/", editingComponentId, values, () => { setComponentOpen(false); setEditingComponentId(null); }, "Payroll component created", "Payroll component updated", "Failed to save payroll component"))} confirmLoading={submitting}>
        <Form<ComponentForm> form={componentForm} layout="vertical" requiredMark={false}>
          <Form.Item name="payroll_structure" label="Payroll Structure" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={structures.map((item) => ({ value: item.id, label: structureMap.get(item.id) ?? item.name }))} /></Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="component_type" label="Component Type" rules={[{ required: true }]}><Select options={[{ label: "Earning", value: "EARNING" }, { label: "Deduction", value: "DEDUCTION" }]} /></Form.Item></Col>
            <Col span={12}><Form.Item name="calculation_type" label="Calculation Type" rules={[{ required: true }]}><Select options={[{ label: "Fixed", value: "FIXED" }, { label: "Percent", value: "PERCENT" }]} /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="value" label="Value" rules={[{ required: true }]}><InputNumber className="!w-full" /></Form.Item></Col>
            <Col span={12}><Form.Item name="order" label="Order" rules={[{ required: true }]}><InputNumber className="!w-full" /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      <Modal title={editingAssignmentId ? "Edit Payroll Assignment" : "Assign Payroll Structure"} open={assignmentOpen} onCancel={() => { setAssignmentOpen(false); setEditingAssignmentId(null); }} onOk={() => void assignmentForm.validateFields().then((values) => submitSave("/api/hr/staff-payroll-assignments/", editingAssignmentId, values, () => { setAssignmentOpen(false); setEditingAssignmentId(null); }, "Payroll assignment created", "Payroll assignment updated", "Failed to save payroll assignment"))} confirmLoading={submitting}>
        <Form<AssignmentForm> form={assignmentForm} layout="vertical" requiredMark={false}>
          <Form.Item name="staff" label="Staff" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={staff.map((item) => ({ value: item.id, label: staffMap.get(item.id) ?? `Staff #${item.id}` }))} /></Form.Item>
          <Form.Item name="payroll_structure" label="Payroll Structure" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={structures.map((item) => ({ value: item.id, label: structureMap.get(item.id) ?? item.name }))} /></Form.Item>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="effective_from" label="Effective From" rules={[{ required: true }]}><Input type="date" /></Form.Item></Col>
            <Col span={12}><Form.Item name="effective_to" label="Effective To"><Input type="date" /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      <Drawer title={selectedStaff ? `${selectedStaff.first_name} ${selectedStaff.last_name ?? ""}`.trim() : "Staff Details"} open={staffDetailOpen} onClose={() => setStaffDetailOpen(false)} width={760}>
        {selectedStaff ? (
          <div className="space-y-4">
            <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
              <Descriptions column={1} size="small" styles={{ label: { color: "rgba(255,255,255,0.55)" }, content: { color: "#e5e7eb" } }}>
                <Descriptions.Item label="Employee Code">{selectedStaff.employee_code}</Descriptions.Item>
                <Descriptions.Item label="Department">{selectedStaff.department ? departmentMap.get(selectedStaff.department) ?? `Department #${selectedStaff.department}` : "-"}</Descriptions.Item>
                <Descriptions.Item label="Designation">{selectedStaff.designation ?? "-"}</Descriptions.Item>
                <Descriptions.Item label="Status">{selectedStaff.employment_status ?? "-"}</Descriptions.Item>
                <Descriptions.Item label="Joined">{dt(selectedStaff.date_of_joining)}</Descriptions.Item>
                <Descriptions.Item label="Linked User">{selectedStaff.user ? userMap.get(selectedStaff.user) ?? `User #${selectedStaff.user}` : "-"}</Descriptions.Item>
              </Descriptions>
            </Card>
            <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl"><div className="text-white font-medium mb-3">Employment History</div><Table rowKey="id" pagination={false} dataSource={selectedStaffHistory} columns={historyColumns} /></Card>
            <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl"><div className="text-white font-medium mb-3">Qualifications</div><Table rowKey="id" pagination={false} dataSource={selectedStaffQualifications} columns={qualificationColumns} /></Card>
            <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl"><div className="text-white font-medium mb-3">Documents</div><Table rowKey="id" pagination={false} dataSource={selectedStaffDocuments} columns={documentColumns} /></Card>
            <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl"><div className="text-white font-medium mb-3">Leave Requests</div><Table rowKey="id" pagination={false} dataSource={selectedStaffLeaves} columns={leaveColumns} /></Card>
            <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl"><div className="text-white font-medium mb-3">Payroll Assignments</div><Table rowKey="id" pagination={false} dataSource={selectedStaffAssignments} columns={assignmentColumns} /></Card>
            <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl"><div className="text-white font-medium mb-3">Payslips</div><Table rowKey="id" pagination={false} dataSource={selectedStaffPayslips} columns={payslipColumns} /></Card>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
