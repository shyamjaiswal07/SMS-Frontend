import { BookOutlined, CarOutlined, DollarOutlined, ReadOutlined, TeamOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Col, Form, Input, InputNumber, Row, Select, Space, Switch, Tabs, Typography, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { erpApi } from "@/features/erp/erpApi";

type RoleKey = "TEACHER" | "ACCOUNTANT" | "HR_MANAGER" | "LIBRARIAN" | "TRANSPORT_COORDINATOR" | "SCHOOL_ADMIN" | "SUPER_ADMIN";
type RefOption = { label: string; value: number | string };
type FieldConfig = {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "date" | "datetime" | "select" | "switch";
  required?: boolean;
  options?: Array<{ label: string; value: string | number | boolean }>;
  optionsKey?: string;
  placeholder?: string;
};
type OperationConfig = {
  key: string;
  roleKey: RoleKey | "ADMIN";
  title: string;
  description: string;
  endpoint: string;
  fields: FieldConfig[];
};

const normalize = (data: any): any[] => Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];

const referenceSources: Record<string, { endpoint: string; label: (item: any) => string }> = {
  courses: { endpoint: "/api/academics/courses/", label: (item) => `${item.title ?? "Course"} (${item.code ?? item.id})` },
  terms: { endpoint: "/api/institutions/terms/", label: (item) => item.name ?? `Term #${item.id}` },
  assessmentTypes: { endpoint: "/api/academics/assessment-types/", label: (item) => item.name ?? `Assessment Type #${item.id}` },
  enrollments: { endpoint: "/api/academics/course-enrollments/", label: (item) => `${item.student ?? "Student"} - ${item.course ?? item.id}` },
  schedules: { endpoint: "/api/academics/class-schedules/", label: (item) => `${item.course ?? "Course"} / ${item.section ?? "Section"} / ${item.day_of_week ?? "Day"}` },
  sessions: { endpoint: "/api/academics/attendance-sessions/", label: (item) => `${item.attendance_date ?? "Date"} / ${item.schedule ?? item.id}` },
  assessments: { endpoint: "/api/academics/assessments/", label: (item) => item.title ?? `Assessment #${item.id}` },
  students: { endpoint: "/api/students/students/", label: (item) => `${item.student_id ?? item.id} - ${item.first_name ?? ""} ${item.last_name ?? ""}`.trim() },
  academicYears: { endpoint: "/api/institutions/academic-years/", label: (item) => item.name ?? `Academic Year #${item.id}` },
  gradeLevels: { endpoint: "/api/institutions/grade-levels/", label: (item) => item.name ?? `Grade #${item.id}` },
  feeCategories: { endpoint: "/api/finance/fee-categories/", label: (item) => item.name ?? `Fee Category #${item.id}` },
  feeStructures: { endpoint: "/api/finance/fee-structures/", label: (item) => item.name ?? `Fee Structure #${item.id}` },
  scholarships: { endpoint: "/api/finance/scholarships/", label: (item) => item.name ?? `Scholarship #${item.id}` },
  invoices: { endpoint: "/api/finance/invoices/", label: (item) => item.invoice_no ?? `Invoice #${item.id}` },
  ledgerAccounts: { endpoint: "/api/finance/ledger-accounts/", label: (item) => `${item.code ?? item.id} - ${item.name ?? "Ledger Account"}` },
  departments: { endpoint: "/api/institutions/departments/", label: (item) => item.name ?? `Department #${item.id}` },
  staffProfiles: { endpoint: "/api/hr/staff-profiles/", label: (item) => `${item.employee_code ?? item.id} - ${item.first_name ?? ""} ${item.last_name ?? ""}`.trim() },
  leaveTypes: { endpoint: "/api/hr/leave-types/", label: (item) => item.name ?? `Leave Type #${item.id}` },
  bookCategories: { endpoint: "/api/library/book-categories/", label: (item) => item.name ?? `Category #${item.id}` },
  books: { endpoint: "/api/library/books/", label: (item) => item.title ?? `Book #${item.id}` },
  libraryMembers: { endpoint: "/api/library/library-members/", label: (item) => item.member_code ?? `Member #${item.id}` },
  vehicles: { endpoint: "/api/transport/vehicles/", label: (item) => item.registration_number ?? `Vehicle #${item.id}` },
  routes: { endpoint: "/api/transport/routes/", label: (item) => `${item.name ?? "Route"} (${item.code ?? item.id})` },
  stops: { endpoint: "/api/transport/stops/", label: (item) => item.name ?? `Stop #${item.id}` },
  users: { endpoint: "/api/accounts/users/", label: (item) => item.email ?? item.username ?? `User #${item.id}` },
  threads: { endpoint: "/api/communications/message-threads/", label: (item) => item.subject || `Thread #${item.id}` },
};

const operationConfigs: OperationConfig[] = [
  {
    key: "assessment-create",
    roleKey: "TEACHER",
    title: "Create Assessment",
    description: "Teachers can create assessments against courses and terms.",
    endpoint: "/api/academics/assessments/",
    fields: [
      { name: "course", label: "Course", type: "select", required: true, optionsKey: "courses" },
      { name: "term", label: "Term", type: "select", required: true, optionsKey: "terms" },
      { name: "assessment_type", label: "Assessment Type", type: "select", required: true, optionsKey: "assessmentTypes" },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "max_marks", label: "Max Marks", type: "number", required: true },
      { name: "due_date", label: "Due Date", type: "date" },
      { name: "weight", label: "Weight", type: "number", required: true },
    ],
  },
  {
    key: "assessment-result-create",
    roleKey: "TEACHER",
    title: "Record Assessment Result",
    description: "Teachers can submit marks and feedback for enrolled students.",
    endpoint: "/api/academics/assessment-results/",
    fields: [
      { name: "assessment", label: "Assessment", type: "select", required: true, optionsKey: "assessments" },
      { name: "enrollment", label: "Enrollment", type: "select", required: true, optionsKey: "enrollments" },
      { name: "marks_obtained", label: "Marks Obtained", type: "number", required: true },
      { name: "feedback", label: "Feedback", type: "textarea" },
    ],
  },
  {
    key: "attendance-session-create",
    roleKey: "TEACHER",
    title: "Create Attendance Session",
    description: "Open a class attendance session before recording students.",
    endpoint: "/api/academics/attendance-sessions/",
    fields: [
      { name: "schedule", label: "Class Schedule", type: "select", required: true, optionsKey: "schedules" },
      { name: "attendance_date", label: "Attendance Date", type: "date", required: true },
      { name: "period_number", label: "Period Number", type: "number", required: true },
    ],
  },
  {
    key: "attendance-record-create",
    roleKey: "TEACHER",
    title: "Record Attendance",
    description: "Mark a student present, absent, late, or on leave.",
    endpoint: "/api/academics/attendance-records/",
    fields: [
      { name: "session", label: "Session", type: "select", required: true, optionsKey: "sessions" },
      { name: "student", label: "Student", type: "select", required: true, optionsKey: "students" },
      { name: "status", label: "Status", type: "select", required: true, options: [
        { label: "Present", value: "PRESENT" }, { label: "Absent", value: "ABSENT" }, { label: "Late", value: "LATE" }, { label: "Leave", value: "LEAVE" },
      ] },
      { name: "remark", label: "Remark", type: "text" },
    ],
  },
  {
    key: "fee-category-create",
    roleKey: "ACCOUNTANT",
    title: "Create Fee Category",
    description: "Accountants can maintain fee heads for billing.",
    endpoint: "/api/finance/fee-categories/",
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "code", label: "Code", type: "text", required: true },
      { name: "is_recurring", label: "Recurring", type: "switch" },
    ],
  },
  {
    key: "invoice-create",
    roleKey: "ACCOUNTANT",
    title: "Create Invoice",
    description: "Generate a student invoice for an academic term.",
    endpoint: "/api/finance/invoices/",
    fields: [
      { name: "student", label: "Student", type: "select", required: true, optionsKey: "students" },
      { name: "academic_year", label: "Academic Year", type: "select", required: true, optionsKey: "academicYears" },
      { name: "term", label: "Term", type: "select", optionsKey: "terms" },
      { name: "invoice_no", label: "Invoice No", type: "text", required: true },
      { name: "issue_date", label: "Issue Date", type: "date", required: true },
      { name: "due_date", label: "Due Date", type: "date", required: true },
      { name: "status", label: "Status", type: "select", required: true, options: [
        { label: "Draft", value: "DRAFT" }, { label: "Issued", value: "ISSUED" }, { label: "Partial", value: "PARTIAL" }, { label: "Paid", value: "PAID" }, { label: "Overdue", value: "OVERDUE" }, { label: "Cancelled", value: "CANCELLED" },
      ] },
      { name: "subtotal_amount", label: "Subtotal", type: "number", required: true },
      { name: "discount_amount", label: "Discount", type: "number", required: true },
      { name: "tax_amount", label: "Tax", type: "number", required: true },
      { name: "total_amount", label: "Total", type: "number", required: true },
      { name: "due_amount", label: "Due Amount", type: "number", required: true },
    ],
  },
  {
    key: "payment-create",
    roleKey: "ACCOUNTANT",
    title: "Record Payment",
    description: "Capture a payment against an invoice.",
    endpoint: "/api/finance/payments/",
    fields: [
      { name: "invoice", label: "Invoice", type: "select", required: true, optionsKey: "invoices" },
      { name: "student", label: "Student", type: "select", required: true, optionsKey: "students" },
      { name: "payment_reference", label: "Payment Reference", type: "text", required: true },
      { name: "method", label: "Method", type: "select", required: true, options: [
        { label: "Cash", value: "CASH" }, { label: "Card", value: "CARD" }, { label: "Bank Transfer", value: "BANK_TRANSFER" }, { label: "UPI", value: "UPI" }, { label: "Online", value: "ONLINE" },
      ] },
      { name: "status", label: "Status", type: "select", required: true, options: [
        { label: "Initiated", value: "INITIATED" }, { label: "Success", value: "SUCCESS" }, { label: "Failed", value: "FAILED" }, { label: "Refunded", value: "REFUNDED" },
      ] },
      { name: "amount", label: "Amount", type: "number", required: true },
      { name: "paid_on", label: "Paid On", type: "datetime" },
    ],
  },
  {
    key: "fee-structure-create",
    roleKey: "ACCOUNTANT",
    title: "Create Fee Structure",
    description: "Define fee structure by academic year and grade level.",
    endpoint: "/api/finance/fee-structures/",
    fields: [
      { name: "academic_year", label: "Academic Year", type: "select", required: true, optionsKey: "academicYears" },
      { name: "grade_level", label: "Grade Level", type: "select", required: true, optionsKey: "gradeLevels" },
      { name: "name", label: "Name", type: "text", required: true },
      { name: "effective_from", label: "Effective From", type: "date", required: true },
      { name: "effective_to", label: "Effective To", type: "date" },
    ],
  },
  {
    key: "fee-structure-line-create",
    roleKey: "ACCOUNTANT",
    title: "Add Fee Structure Line",
    description: "Attach fee category amounts to a fee structure.",
    endpoint: "/api/finance/fee-structure-lines/",
    fields: [
      { name: "fee_structure", label: "Fee Structure", type: "select", required: true, optionsKey: "feeStructures" },
      { name: "category", label: "Fee Category", type: "select", required: true, optionsKey: "feeCategories" },
      { name: "amount", label: "Amount", type: "number", required: true },
      { name: "due_day", label: "Due Day", type: "number", required: true },
      { name: "is_optional", label: "Optional", type: "switch" },
    ],
  },
  {
    key: "scholarship-create",
    roleKey: "ACCOUNTANT",
    title: "Create Scholarship",
    description: "Manage scholarships and discount rules.",
    endpoint: "/api/finance/scholarships/",
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "code", label: "Code", type: "text", required: true },
      { name: "discount_type", label: "Discount Type", type: "select", required: true, options: [
        { label: "Percent", value: "PERCENT" }, { label: "Fixed", value: "FIXED" },
      ] },
      { name: "discount_value", label: "Discount Value", type: "number", required: true },
      { name: "max_discount_amount", label: "Max Discount Amount", type: "number" },
      { name: "eligibility_criteria", label: "Eligibility Criteria", type: "textarea" },
    ],
  },
  {
    key: "student-scholarship-create",
    roleKey: "ACCOUNTANT",
    title: "Assign Student Scholarship",
    description: "Allocate a scholarship to a student.",
    endpoint: "/api/finance/student-scholarships/",
    fields: [
      { name: "student", label: "Student", type: "select", required: true, optionsKey: "students" },
      { name: "scholarship", label: "Scholarship", type: "select", required: true, optionsKey: "scholarships" },
      { name: "start_date", label: "Start Date", type: "date", required: true },
      { name: "end_date", label: "End Date", type: "date" },
    ],
  },
  {
    key: "invoice-line-create",
    roleKey: "ACCOUNTANT",
    title: "Create Invoice Line",
    description: "Add a billing line item to an invoice.",
    endpoint: "/api/finance/invoice-lines/",
    fields: [
      { name: "invoice", label: "Invoice", type: "select", required: true, optionsKey: "invoices" },
      { name: "category", label: "Fee Category", type: "select", required: true, optionsKey: "feeCategories" },
      { name: "description", label: "Description", type: "text", required: true },
      { name: "quantity", label: "Quantity", type: "number", required: true },
      { name: "unit_amount", label: "Unit Amount", type: "number", required: true },
      { name: "line_total", label: "Line Total", type: "number", required: true },
    ],
  },
  {
    key: "ledger-account-create",
    roleKey: "ACCOUNTANT",
    title: "Create Ledger Account",
    description: "Maintain the chart of accounts.",
    endpoint: "/api/finance/ledger-accounts/",
    fields: [
      { name: "code", label: "Code", type: "text", required: true },
      { name: "name", label: "Name", type: "text", required: true },
      { name: "account_type", label: "Account Type", type: "select", required: true, options: [
        { label: "Asset", value: "ASSET" }, { label: "Liability", value: "LIABILITY" }, { label: "Equity", value: "EQUITY" }, { label: "Income", value: "INCOME" }, { label: "Expense", value: "EXPENSE" },
      ] },
      { name: "parent_account", label: "Parent Account", type: "select", optionsKey: "ledgerAccounts" },
    ],
  },
  {
    key: "ledger-entry-create",
    roleKey: "ACCOUNTANT",
    title: "Create Ledger Entry",
    description: "Post debit or credit accounting entries.",
    endpoint: "/api/finance/ledger-entries/",
    fields: [
      { name: "account", label: "Ledger Account", type: "select", required: true, optionsKey: "ledgerAccounts" },
      { name: "entry_date", label: "Entry Date", type: "date", required: true },
      { name: "reference_type", label: "Reference Type", type: "text" },
      { name: "reference_id", label: "Reference Id", type: "text" },
      { name: "narration", label: "Narration", type: "textarea" },
      { name: "debit_amount", label: "Debit Amount", type: "number" },
      { name: "credit_amount", label: "Credit Amount", type: "number" },
    ],
  },
  {
    key: "staff-profile-create",
    roleKey: "HR_MANAGER",
    title: "Create Staff Profile",
    description: "HR can onboard staff profiles and employee master records.",
    endpoint: "/api/hr/staff-profiles/",
    fields: [
      { name: "employee_code", label: "Employee Code", type: "text", required: true },
      { name: "first_name", label: "First Name", type: "text", required: true },
      { name: "last_name", label: "Last Name", type: "text" },
      { name: "department", label: "Department", type: "select", optionsKey: "departments" },
      { name: "designation", label: "Designation", type: "text", required: true },
      { name: "employment_status", label: "Employment Status", type: "select", required: true, options: [
        { label: "Active", value: "ACTIVE" }, { label: "On Leave", value: "ON_LEAVE" }, { label: "Resigned", value: "RESIGNED" }, { label: "Terminated", value: "TERMINATED" },
      ] },
      { name: "date_of_joining", label: "Date of Joining", type: "date", required: true },
      { name: "phone_number", label: "Phone", type: "text" },
      { name: "emergency_contact", label: "Emergency Contact", type: "text" },
    ],
  },
  {
    key: "leave-request-create",
    roleKey: "HR_MANAGER",
    title: "Create Leave Request",
    description: "HR can file or manage leave requests for staff.",
    endpoint: "/api/hr/leave-requests/",
    fields: [
      { name: "staff", label: "Staff", type: "select", required: true, optionsKey: "staffProfiles" },
      { name: "leave_type", label: "Leave Type", type: "select", required: true, optionsKey: "leaveTypes" },
      { name: "start_date", label: "Start Date", type: "date", required: true },
      { name: "end_date", label: "End Date", type: "date", required: true },
      { name: "reason", label: "Reason", type: "textarea" },
      { name: "status", label: "Status", type: "select", required: true, options: [
        { label: "Pending", value: "PENDING" }, { label: "Approved", value: "APPROVED" }, { label: "Rejected", value: "REJECTED" },
      ] },
    ],
  },
  {
    key: "payroll-run-create",
    roleKey: "HR_MANAGER",
    title: "Create Payroll Run",
    description: "Create a payroll cycle for a month and year.",
    endpoint: "/api/hr/payroll-runs/",
    fields: [
      { name: "run_year", label: "Run Year", type: "number", required: true },
      { name: "run_month", label: "Run Month", type: "number", required: true },
      { name: "status", label: "Status", type: "select", required: true, options: [
        { label: "Draft", value: "DRAFT" }, { label: "Processed", value: "PROCESSED" },
      ] },
    ],
  },
  {
    key: "book-create",
    roleKey: "LIBRARIAN",
    title: "Create Book",
    description: "Librarians can add books and maintain inventory.",
    endpoint: "/api/library/books/",
    fields: [
      { name: "category", label: "Category", type: "select", optionsKey: "bookCategories" },
      { name: "isbn", label: "ISBN", type: "text" },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "author", label: "Author", type: "text" },
      { name: "publisher", label: "Publisher", type: "text" },
      { name: "publish_year", label: "Publish Year", type: "number" },
      { name: "language", label: "Language", type: "text" },
      { name: "edition", label: "Edition", type: "text" },
      { name: "shelf_location", label: "Shelf Location", type: "text" },
      { name: "total_copies", label: "Total Copies", type: "number", required: true },
      { name: "available_copies", label: "Available Copies", type: "number", required: true },
    ],
  },
  {
    key: "book-issue-create",
    roleKey: "LIBRARIAN",
    title: "Issue Book",
    description: "Issue a book to a library member.",
    endpoint: "/api/library/book-issues/",
    fields: [
      { name: "book", label: "Book", type: "select", required: true, optionsKey: "books" },
      { name: "member", label: "Member", type: "select", required: true, optionsKey: "libraryMembers" },
      { name: "issue_date", label: "Issue Date", type: "date", required: true },
      { name: "due_date", label: "Due Date", type: "date", required: true },
      { name: "status", label: "Status", type: "select", required: true, options: [
        { label: "Issued", value: "ISSUED" }, { label: "Returned", value: "RETURNED" }, { label: "Overdue", value: "OVERDUE" }, { label: "Lost", value: "LOST" },
      ] },
      { name: "late_fee", label: "Late Fee", type: "number" },
    ],
  },
  {
    key: "reservation-create",
    roleKey: "LIBRARIAN",
    title: "Create Reservation",
    description: "Reserve a book for a library member.",
    endpoint: "/api/library/book-reservations/",
    fields: [
      { name: "book", label: "Book", type: "select", required: true, optionsKey: "books" },
      { name: "member", label: "Member", type: "select", required: true, optionsKey: "libraryMembers" },
      { name: "reserved_on", label: "Reserved On", type: "date", required: true },
      { name: "expires_on", label: "Expires On", type: "date", required: true },
      { name: "status", label: "Status", type: "select", required: true, options: [
        { label: "Active", value: "ACTIVE" }, { label: "Fulfilled", value: "FULFILLED" }, { label: "Cancelled", value: "CANCELLED" }, { label: "Expired", value: "EXPIRED" },
      ] },
    ],
  },
  {
    key: "vehicle-create",
    roleKey: "TRANSPORT_COORDINATOR",
    title: "Create Vehicle",
    description: "Register a school vehicle in the transport system.",
    endpoint: "/api/transport/vehicles/",
    fields: [
      { name: "registration_number", label: "Registration Number", type: "text", required: true },
      { name: "vehicle_type", label: "Vehicle Type", type: "text", required: true },
      { name: "model_name", label: "Model Name", type: "text" },
      { name: "capacity", label: "Capacity", type: "number", required: true },
      { name: "insurance_expiry", label: "Insurance Expiry", type: "date" },
      { name: "fitness_expiry", label: "Fitness Expiry", type: "date" },
      { name: "gps_device_id", label: "GPS Device Id", type: "text" },
    ],
  },
  {
    key: "route-create",
    roleKey: "TRANSPORT_COORDINATOR",
    title: "Create Route",
    description: "Create and assign a route for transport operations.",
    endpoint: "/api/transport/routes/",
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "code", label: "Code", type: "text", required: true },
      { name: "vehicle", label: "Vehicle", type: "select", optionsKey: "vehicles" },
      { name: "driver_name", label: "Driver Name", type: "text" },
      { name: "driver_phone", label: "Driver Phone", type: "text" },
      { name: "conductor_name", label: "Conductor Name", type: "text" },
      { name: "conductor_phone", label: "Conductor Phone", type: "text" },
    ],
  },
  {
    key: "transport-allocation-create",
    roleKey: "TRANSPORT_COORDINATOR",
    title: "Allocate Student Transport",
    description: "Assign a student to a route and stop.",
    endpoint: "/api/transport/student-transport-allocations/",
    fields: [
      { name: "student", label: "Student", type: "select", required: true, optionsKey: "students" },
      { name: "route", label: "Route", type: "select", required: true, optionsKey: "routes" },
      { name: "stop", label: "Stop", type: "select", required: true, optionsKey: "stops" },
      { name: "pickup_required", label: "Pickup Required", type: "switch" },
      { name: "drop_required", label: "Drop Required", type: "switch" },
      { name: "monthly_fee", label: "Monthly Fee", type: "number", required: true },
      { name: "start_date", label: "Start Date", type: "date", required: true },
      { name: "end_date", label: "End Date", type: "date" },
      { name: "is_active", label: "Active", type: "switch" },
    ],
  },
  {
    key: "maintenance-create",
    roleKey: "TRANSPORT_COORDINATOR",
    title: "Log Maintenance",
    description: "Record maintenance activity for a vehicle.",
    endpoint: "/api/transport/vehicle-maintenance/",
    fields: [
      { name: "vehicle", label: "Vehicle", type: "select", required: true, optionsKey: "vehicles" },
      { name: "service_date", label: "Service Date", type: "date", required: true },
      { name: "odometer_reading", label: "Odometer Reading", type: "number", required: true },
      { name: "service_type", label: "Service Type", type: "text", required: true },
      { name: "notes", label: "Notes", type: "textarea" },
      { name: "vendor", label: "Vendor", type: "text" },
      { name: "cost", label: "Cost", type: "number", required: true },
      { name: "next_service_due_on", label: "Next Service Due On", type: "date" },
    ],
  },
  {
    key: "school-create",
    roleKey: "SUPER_ADMIN",
    title: "Create School",
    description: "Provision a new school tenant.",
    endpoint: "/api/institutions/schools/",
    fields: [
      { name: "name", label: "School Name", type: "text", required: true },
      { name: "code", label: "School Code", type: "text", required: true },
      { name: "email", label: "Email", type: "text" },
      { name: "phone_number", label: "Phone", type: "text" },
      { name: "timezone", label: "Timezone", type: "text" },
      { name: "currency", label: "Currency", type: "text" },
      { name: "city", label: "City", type: "text" },
      { name: "state", label: "State", type: "text" },
      { name: "country", label: "Country", type: "text" },
    ],
  },
  {
    key: "academic-year-create",
    roleKey: "SCHOOL_ADMIN",
    title: "Create Academic Year",
    description: "Set up academic year windows for the school.",
    endpoint: "/api/institutions/academic-years/",
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "start_date", label: "Start Date", type: "date", required: true },
      { name: "end_date", label: "End Date", type: "date", required: true },
      { name: "is_current", label: "Current Year", type: "switch" },
    ],
  },
  {
    key: "term-create",
    roleKey: "SCHOOL_ADMIN",
    title: "Create Term",
    description: "Create academic terms for an academic year.",
    endpoint: "/api/institutions/terms/",
    fields: [
      { name: "academic_year", label: "Academic Year", type: "select", required: true, optionsKey: "academicYears" },
      { name: "name", label: "Name", type: "text", required: true },
      { name: "sequence", label: "Sequence", type: "number", required: true },
      { name: "start_date", label: "Start Date", type: "date", required: true },
      { name: "end_date", label: "End Date", type: "date", required: true },
    ],
  },
  {
    key: "department-create",
    roleKey: "SCHOOL_ADMIN",
    title: "Create Department",
    description: "Set up academic or administrative departments.",
    endpoint: "/api/institutions/departments/",
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "code", label: "Code", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
    ],
  },
  {
    key: "grade-level-create",
    roleKey: "SCHOOL_ADMIN",
    title: "Create Grade Level",
    description: "Define grade levels for admissions and academics.",
    endpoint: "/api/institutions/grade-levels/",
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "code", label: "Code", type: "text", required: true },
      { name: "sort_order", label: "Sort Order", type: "number", required: true },
    ],
  },
  {
    key: "section-create",
    roleKey: "SCHOOL_ADMIN",
    title: "Create Section",
    description: "Create sections and assign class teachers.",
    endpoint: "/api/institutions/sections/",
    fields: [
      { name: "grade_level", label: "Grade Level", type: "select", required: true, optionsKey: "gradeLevels" },
      { name: "name", label: "Section Name", type: "text", required: true },
      { name: "capacity", label: "Capacity", type: "number", required: true },
      { name: "class_teacher", label: "Class Teacher", type: "select", optionsKey: "users" },
    ],
  },
  {
    key: "subject-create",
    roleKey: "SCHOOL_ADMIN",
    title: "Create Subject",
    description: "Set up subjects and course masters.",
    endpoint: "/api/institutions/subjects/",
    fields: [
      { name: "department", label: "Department", type: "select", optionsKey: "departments" },
      { name: "name", label: "Name", type: "text", required: true },
      { name: "code", label: "Code", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "credit_hours", label: "Credit Hours", type: "number", required: true },
    ],
  },
  {
    key: "room-create",
    roleKey: "SCHOOL_ADMIN",
    title: "Create Room",
    description: "Manage classrooms and facility capacity.",
    endpoint: "/api/institutions/rooms/",
    fields: [
      { name: "name", label: "Room Name", type: "text", required: true },
      { name: "building", label: "Building", type: "text" },
      { name: "floor", label: "Floor", type: "text" },
      { name: "capacity", label: "Capacity", type: "number", required: true },
    ],
  },
  {
    key: "announcement-create",
    roleKey: "SCHOOL_ADMIN",
    title: "Create Announcement",
    description: "Publish notices to selected school roles.",
    endpoint: "/api/communications/announcements/",
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "body", label: "Body", type: "textarea", required: true },
      { name: "publish_at", label: "Publish At", type: "datetime" },
      { name: "expire_at", label: "Expire At", type: "datetime" },
      { name: "is_pinned", label: "Pinned", type: "switch" },
    ],
  },
  {
    key: "thread-create",
    roleKey: "TEACHER",
    title: "Create Message Thread",
    description: "Start a parent-teacher or staff communication thread.",
    endpoint: "/api/communications/message-threads/",
    fields: [
      { name: "subject", label: "Subject", type: "text" },
      { name: "is_group", label: "Group Thread", type: "switch" },
    ],
  },
  {
    key: "thread-participant-create",
    roleKey: "TEACHER",
    title: "Add Thread Participant",
    description: "Add participants to a communication thread.",
    endpoint: "/api/communications/message-participants/",
    fields: [
      { name: "thread", label: "Thread", type: "select", required: true, optionsKey: "threads" },
      { name: "user", label: "User", type: "select", required: true, optionsKey: "users" },
      { name: "is_muted", label: "Muted", type: "switch" },
    ],
  },
  {
    key: "message-create",
    roleKey: "TEACHER",
    title: "Send Message",
    description: "Post a message inside a thread.",
    endpoint: "/api/communications/messages/",
    fields: [
      { name: "thread", label: "Thread", type: "select", required: true, optionsKey: "threads" },
      { name: "body", label: "Message", type: "textarea", required: true },
      { name: "attachment_url", label: "Attachment URL", type: "text" },
      { name: "status", label: "Status", type: "select", required: true, options: [
        { label: "Pending", value: "PENDING" }, { label: "Sent", value: "SENT" }, { label: "Failed", value: "FAILED" }, { label: "Read", value: "READ" },
      ] },
    ],
  },
  {
    key: "notification-create",
    roleKey: "SCHOOL_ADMIN",
    title: "Create Notification",
    description: "Send in-app, email, SMS, or push notifications.",
    endpoint: "/api/communications/notifications/",
    fields: [
      { name: "user", label: "User", type: "select", required: true, optionsKey: "users" },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "body", label: "Body", type: "textarea" },
      { name: "channel", label: "Channel", type: "select", required: true, options: [
        { label: "In App", value: "IN_APP" }, { label: "Email", value: "EMAIL" }, { label: "SMS", value: "SMS" }, { label: "Push", value: "PUSH" },
      ] },
      { name: "status", label: "Status", type: "select", required: true, options: [
        { label: "Pending", value: "PENDING" }, { label: "Sent", value: "SENT" }, { label: "Failed", value: "FAILED" }, { label: "Read", value: "READ" },
      ] },
      { name: "scheduled_at", label: "Scheduled At", type: "datetime" },
    ],
  },
];

const roleMeta: Record<RoleKey, { title: string; icon: JSX.Element; description: string }> = {
  TEACHER: { title: "Teacher Ops", icon: <BookOutlined />, description: "Attendance and assessment write workflows." },
  ACCOUNTANT: { title: "Finance Ops", icon: <DollarOutlined />, description: "Billing and payment write workflows." },
  HR_MANAGER: { title: "HR Ops", icon: <TeamOutlined />, description: "Staff, leave, and payroll workflows." },
  LIBRARIAN: { title: "Library Ops", icon: <ReadOutlined />, description: "Catalog and circulation workflows." },
  TRANSPORT_COORDINATOR: { title: "Transport Ops", icon: <CarOutlined />, description: "Vehicles, routes, and allocations." },
  SCHOOL_ADMIN: { title: "School Admin", icon: <TeamOutlined />, description: "Cross-module school operations." },
  SUPER_ADMIN: { title: "Super Admin", icon: <TeamOutlined />, description: "All operational workflows across tenants." },
};

function renderField(field: FieldConfig, options: RefOption[]) {
  if (field.type === "textarea") return <Input.TextArea rows={3} placeholder={field.placeholder} />;
  if (field.type === "number") return <InputNumber className="!w-full" placeholder={field.placeholder} />;
  if (field.type === "date") return <Input type="date" placeholder={field.placeholder} />;
  if (field.type === "datetime") return <Input type="datetime-local" placeholder={field.placeholder} />;
  if (field.type === "switch") return <Switch />;
  if (field.type === "select") return <Select showSearch optionFilterProp="label" options={field.options ?? options} placeholder={field.placeholder} />;
  return <Input placeholder={field.placeholder} />;
}

function getCurrentRole(): RoleKey | undefined {
  try {
    const raw = sessionStorage.getItem("tenant");
    return raw ? (JSON.parse(raw)?.role as RoleKey | undefined) : undefined;
  } catch {
    return undefined;
  }
}

function OperationsPanel() {
  const [referenceOptions, setReferenceOptions] = useState<Record<string, RefOption[]>>({});
  const [loadingRefs, setLoadingRefs] = useState(false);
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);
  const currentRole = useMemo(() => getCurrentRole(), []);
  const [formVersions, setFormVersions] = useState<Record<string, number>>({});

  const visibleOperations = useMemo(() => {
    if (currentRole === "SUPER_ADMIN" || currentRole === "SCHOOL_ADMIN") return operationConfigs;
    return operationConfigs.filter((config) => config.roleKey === currentRole);
  }, [currentRole]);

  const groupedOperations = useMemo(() => {
    const groups: Record<string, OperationConfig[]> = {};
    visibleOperations.forEach((config) => {
      const groupKey = currentRole === "SUPER_ADMIN" || currentRole === "SCHOOL_ADMIN" ? config.roleKey : currentRole ?? config.roleKey;
      groups[groupKey] = groups[groupKey] ?? [];
      groups[groupKey].push(config);
    });
    return groups;
  }, [visibleOperations, currentRole]);

  useEffect(() => {
    const loadReferences = async () => {
      setLoadingRefs(true);
      try {
        const entries = Object.entries(referenceSources);
        const loaded = await Promise.all(entries.map(async ([key, source]) => {
          try {
            const data = await erpApi.fetchOptions(source.endpoint, { page: 1, page_size: 200 });
            const rows = normalize(data);
            return [key, rows.map((item) => ({ label: source.label(item), value: item.id }))] as const;
          } catch {
            return [key, []] as const;
          }
        }));
        setReferenceOptions(Object.fromEntries(loaded));
      } finally {
        setLoadingRefs(false);
      }
    };

    void loadReferences();
  }, []);

  if (!visibleOperations.length) {
    return (
      <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
        <Typography.Title level={4} className="!mb-1 text-white">Operations</Typography.Title>
        <Typography.Paragraph className="!mb-0 !text-white/60">This role currently has no write workflows exposed in the frontend yet.</Typography.Paragraph>
      </Card>
    );
  }

  return (
    <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          <Typography.Title level={4} className="!mb-1 text-white">Operations</Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-white/60">Role-based create workflows for the high-value school-management operations that were previously missing.</Typography.Paragraph>
        </div>
        {loadingRefs ? <Alert type="info" showIcon message="Loading form references..." /> : null}
      </div>

      <Tabs items={Object.keys(groupedOperations).map((groupKey) => ({
        key: groupKey,
        label: roleMeta[groupKey as RoleKey]?.title ?? groupKey,
        children: (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/65 text-sm flex items-center gap-3">
              <span className="text-[var(--cv-accent)]">{roleMeta[groupKey as RoleKey]?.icon}</span>
              <span>{roleMeta[groupKey as RoleKey]?.description ?? "Operational workflows"}</span>
            </div>
            <Row gutter={[16, 16]}>
              {groupedOperations[groupKey].map((config) => (
                <Col xs={24} xl={12} key={config.key}>
                  <Card className="!bg-white/5 !border-white/10 !rounded-3xl h-full">
                    <div className="mb-4">
                      <div className="text-white font-medium">{config.title}</div>
                      <div className="text-white/55 text-sm">{config.description}</div>
                      <div className="text-white/40 text-xs mt-1">{config.endpoint}</div>
                    </div>
                    <Form
                      key={formVersions[config.key] ?? 0}
                      layout="vertical"
                      requiredMark={false}
                      initialValues={Object.fromEntries(config.fields.filter((field) => field.type === "switch").map((field) => [field.name, false]))}
                      onFinish={async (values) => {
                        setSubmittingKey(config.key);
                        try {
                          await erpApi.createRecord(config.endpoint, values);
                          message.success(`${config.title} completed`);
                          setFormVersions((prev) => ({ ...prev, [config.key]: (prev[config.key] ?? 0) + 1 }));
                        } catch (error: any) {
                          message.error(error?.response?.data?.detail ?? `Failed to submit ${config.title}`);
                        } finally {
                          setSubmittingKey(null);
                        }
                      }}
                    >
                      <Row gutter={12}>
                        {config.fields.map((field) => (
                          <Col xs={24} md={field.type === "textarea" ? 24 : 12} key={field.name}>
                            <Form.Item name={field.name} label={field.label} rules={field.required ? [{ required: true, message: `${field.label} is required` }] : undefined} valuePropName={field.type === "switch" ? "checked" : "value"}>
                              {renderField(field, field.optionsKey ? (referenceOptions[field.optionsKey] ?? []) : [])}
                            </Form.Item>
                          </Col>
                        ))}
                      </Row>
                      <Space>
                        <Button htmlType="submit" type="primary" className="!rounded-2xl !bg-[var(--cv-accent)] !border-0" loading={submittingKey === config.key}>Submit</Button>
                        <Button onClick={() => setFormVersions((prev) => ({ ...prev, [config.key]: (prev[config.key] ?? 0) + 1 }))}>Reset</Button>
                      </Space>
                    </Form>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        ),
      }))} />
    </Card>
  );
}

export { OperationsPanel };
export default OperationsPanel;

