import { useMemo } from "react";
import {
  AppstoreOutlined,
  AuditOutlined,
  BankOutlined,
  BellOutlined,
  BookOutlined,
  CarOutlined,
  DollarOutlined,
  ReadOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";

export type ModuleKey =
  | "institutions"
  | "students"
  | "academics"
  | "admissions"
  | "admin"
  | "library"
  | "modules"
  | "communications"
  | "finance"
  | "hr"
  | "transport";

export type ActionCard = {
  key: ModuleKey;
  title: string;
  desc: string;
  icon: JSX.Element;
};

export function getTenantRole(): string | undefined {
  try {
    const tenantStr = sessionStorage.getItem("tenant");
    if (!tenantStr) return undefined;
    return (JSON.parse(tenantStr)?.role as string | undefined) ?? undefined;
  } catch {
    return undefined;
  }
}

export function useDashboardActions(role: string | undefined): ActionCard[] {
  return useMemo(() => {
    switch (role) {
      case "STUDENT":
        return [
          { key: "students", title: "My Learning", desc: "Transcript, attendance & fees", icon: <UserOutlined /> },
          { key: "academics", title: "Course Catalog", desc: "Programs, prerequisites & schedules", icon: <BookOutlined /> },
          { key: "communications", title: "Messages", desc: "Announcements and conversation threads", icon: <BellOutlined /> },
        ];
      case "PARENT":
        return [
          { key: "students", title: "Students", desc: "Track learner details and fee summaries", icon: <UserOutlined /> },
          { key: "communications", title: "Communications", desc: "Parent-school messaging and announcements", icon: <BellOutlined /> },
        ];
      case "TEACHER":
        return [
          { key: "academics", title: "Teaching Planner", desc: "Courses, prerequisites & schedules", icon: <BookOutlined /> },
          { key: "students", title: "Students Overview", desc: "Student summaries & details", icon: <UserOutlined /> },
          { key: "admissions", title: "Admissions", desc: "Review applications", icon: <AppstoreOutlined /> },
          { key: "communications", title: "Communications", desc: "Announcements, notifications, and messaging", icon: <BellOutlined /> },
          { key: "modules", title: "ERP Modules", desc: "Finance, HR, communication, library, transport", icon: <AppstoreOutlined /> },
        ];
      case "ACCOUNTANT":
        return [
          { key: "finance", title: "Finance", desc: "Invoices, payments, and fee setup", icon: <DollarOutlined /> },
          { key: "communications", title: "Communications", desc: "Notifications and shared operational messaging", icon: <BellOutlined /> },
          { key: "modules", title: "ERP Modules", desc: "Operational APIs for your assigned domain", icon: <AppstoreOutlined /> },
        ];
      case "HR_MANAGER":
        return [
          { key: "hr", title: "HR", desc: "Staff profiles, leave, payroll runs, and payslips", icon: <TeamOutlined /> },
          { key: "communications", title: "Communications", desc: "Notifications and shared operational messaging", icon: <BellOutlined /> },
          { key: "modules", title: "ERP Modules", desc: "Extended HR and ERP API coverage", icon: <AppstoreOutlined /> },
        ];
      case "LIBRARIAN":
        return [
          { key: "communications", title: "Communications", desc: "Notifications and shared operational messaging", icon: <BellOutlined /> },
          { key: "library", title: "Library", desc: "Catalog, circulation, and reporting in the dedicated module", icon: <ReadOutlined /> },
        ];
      case "TRANSPORT_COORDINATOR":
        return [
          { key: "communications", title: "Communications", desc: "Notifications and shared operational messaging", icon: <BellOutlined /> },
          { key: "transport", title: "Transport", desc: "Routes, allocations, and reporting in the dedicated module", icon: <CarOutlined /> },
        ];
      case "SCHOOL_ADMIN":
        return [
          { key: "institutions", title: "Institutions", desc: "Tenancy, academic setup, and facilities", icon: <BankOutlined /> },
          { key: "students", title: "Students", desc: "Search and view student records", icon: <UserOutlined /> },
          { key: "admissions", title: "Admissions", desc: "Manage admission applications", icon: <AppstoreOutlined /> },
          { key: "academics", title: "Academics", desc: "Courses and class schedules", icon: <BookOutlined /> },
          { key: "finance", title: "Finance", desc: "Invoices, fee setup, and payment collections", icon: <DollarOutlined /> },
          { key: "hr", title: "HR", desc: "Staff records, leave workflows, and payroll runs", icon: <TeamOutlined /> },
          { key: "communications", title: "Communications", desc: "Announcements, notifications, and inbox workflows", icon: <BellOutlined /> },
          { key: "admin", title: "Admin Controls", desc: "Users, memberships and security", icon: <AuditOutlined /> },
        ];
      case "SUPER_ADMIN":
        return [
          { key: "institutions", title: "Institutions", desc: "School tenancy, subscriptions, and setup records", icon: <BankOutlined /> },
          { key: "admin", title: "Admin Controls", desc: "Users, permissions, memberships and security", icon: <AuditOutlined /> },
          { key: "finance", title: "Finance", desc: "Fee structures, invoices, collections, and summaries", icon: <DollarOutlined /> },
          { key: "hr", title: "HR", desc: "Staff lifecycle, leave, payroll runs, and payslips", icon: <TeamOutlined /> },
          { key: "communications", title: "Communications", desc: "Cross-tenant announcement and notification oversight", icon: <BellOutlined /> },
          { key: "students", title: "Students", desc: "Search and view student records", icon: <UserOutlined /> },
          { key: "academics", title: "Academics", desc: "Courses and class schedules", icon: <BookOutlined /> },
        ];
      default:
        return [
          { key: "students", title: "Students", desc: "Search and view student records", icon: <UserOutlined /> },
          { key: "academics", title: "Academics", desc: "Courses and class schedules", icon: <BookOutlined /> },
          { key: "communications", title: "Communications", desc: "Announcements and notification center", icon: <BellOutlined /> },
        ];
    }
  }, [role]);
}
