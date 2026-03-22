import { Space, Typography } from "antd";
import type { FC } from "react";
import { lazy, Suspense, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SwapOutlined } from "@ant-design/icons";
import AdminAnalyticsWidget from "./AdminAnalyticsWidget";
import { TiltCard } from "./TiltCard";
import { getTenantRole, useDashboardActions, type ModuleKey } from "./utils";

const Students = lazy(() => import("@/pages/Students/Sprint"));
const Admissions = lazy(() => import("@/pages/Database"));
const Academics = lazy(() => import("@/pages/Academics/Sprint"));

type QuickLink = {
  key: string;
  label: string;
  description: string;
  path?: string;
  module?: ModuleKey;
};

const DashboardHome: FC = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const role = useMemo(() => getTenantRole(), []);
  const actions = useDashboardActions(role);

  const defaultModule: ModuleKey =
    role === "TEACHER"
      ? "academics"
      : role === "SUPER_ADMIN"
        ? "institutions"
        : role === "ACCOUNTANT"
          ? "finance"
          : role === "HR_MANAGER"
            ? "hr"
            : role === "LIBRARIAN"
              ? "library"
              : role === "TRANSPORT_COORDINATOR"
                ? "transport"
              : "students";
              
  const module = (params.get("module") as ModuleKey | null) ?? defaultModule;
  const setModule = (m: ModuleKey) => setParams({ module: m });

  const quickLinks = useMemo<QuickLink[]>(() => {
    switch (role) {
      case "TEACHER":
        return [
          { key: "teacher-analytics", label: "Analytics", description: "Open role-aware module KPIs for your current tenant", path: "/analytics" },
          { key: "teacher-workflow", label: "Assignment Workflow", description: "Calendar, publishing, submissions, and grading actions", path: "/academics?scope=advanced&tab=workflow" },
          { key: "teacher-risk", label: "Attendance Risk", description: "Review flagged attendance cases before escalation", path: "/academics?scope=advanced&tab=attendance-risk" },
          { key: "teacher-campaigns", label: "Campaigns", description: "Open bulk communications for parent and student outreach", path: "/communications?tab=campaigns" },
        ];
      case "HR_MANAGER":
        return [
          { key: "hr-analytics", label: "Analytics", description: "Review HR and communication KPI blocks", path: "/analytics" },
          { key: "hr-lifecycle", label: "Lifecycle Board", description: "Onboarding, offboarding, and checklist status transitions", path: "/hr?scope=advanced&tab=lifecycle" },
          { key: "hr-payroll", label: "Payroll Documents", description: "Payslips, tax documents, and payroll output review", path: "/hr?scope=advanced&tab=payroll" },
          { key: "hr-campaigns", label: "Campaigns", description: "Queue HR notices with immediate or scheduled delivery", path: "/communications?tab=campaigns" },
        ];
      case "LIBRARIAN":
        return [
          { key: "library-analytics", label: "Analytics", description: "Open role-aware library and communications KPI blocks", path: "/analytics" },
          { key: "library-reports", label: "Library Reports", description: "Overdue reports, analytics, and late-fee runs", path: "/library?tab=reports" },
          { key: "library-campaigns", label: "Campaigns", description: "Send overdue and membership communication batches", path: "/communications?tab=campaigns" },
        ];
      case "TRANSPORT_COORDINATOR":
        return [
          { key: "transport-analytics", label: "Analytics", description: "Open role-aware transport and communications KPI blocks", path: "/analytics" },
          { key: "transport-reports", label: "Transport Reports", description: "Occupancy, utilization, and cost-trend reporting", path: "/transport?tab=reports" },
          { key: "transport-campaigns", label: "Campaigns", description: "Open dispatch communications for route updates", path: "/communications?tab=campaigns" },
        ];
      case "SUPER_ADMIN":
      case "SCHOOL_ADMIN":
        return [
          { key: "admin-analytics", label: "Analytics", description: "Open the dedicated unified analytics workspace", path: "/analytics" },
          { key: "admin-institutions", label: "Institutions", description: "Open tenancy, plans, and academic setup in the new workspace", path: "/institutions?tab=tenancy" },
          { key: "admin-risk", label: "Attendance Risk", description: "Monitor at-risk learners from the academics workspace", path: "/academics?scope=advanced&tab=attendance-risk" },
          { key: "admin-lifecycle", label: "HR Lifecycle", description: "Jump directly into staff onboarding and offboarding controls", path: "/hr?scope=advanced&tab=lifecycle" },
          { key: "admin-campaigns", label: "Campaigns", description: "Run scheduled or immediate bulk messaging", path: "/communications?tab=campaigns" },
          { key: "admin-library", label: "Library Reports", description: "Open library overdue and analytics reporting", path: "/library?tab=reports" },
          { key: "admin-transport", label: "Transport Reports", description: "Open transport occupancy and cost analytics", path: "/transport?tab=reports" },
        ];
      case "ACCOUNTANT":
        return [
          { key: "finance-analytics", label: "Analytics", description: "Open finance and communications KPI blocks", path: "/analytics" },
          { key: "finance-home", label: "Finance Workspace", description: "Open invoicing, statements, and budget workflows", path: "/finance" },
          { key: "finance-campaigns", label: "Campaigns", description: "Queue collection reminders or scheduled finance broadcasts", path: "/communications?tab=campaigns" },
        ];
      default:
        return [
          { key: "messages", label: "Messages", description: "Open the communications workspace", path: "/communications?tab=inbox" },
        ];
    }
  }, [role]);

  const openModuleAction = (key: ModuleKey) => {
    if (role === "TEACHER" && key === "academics") {
      navigate("/academics?scope=advanced&tab=workflow");
      return;
    }
    if (role === "HR_MANAGER" && key === "hr") {
      navigate("/hr?scope=advanced&tab=lifecycle");
      return;
    }
    if (role === "LIBRARIAN" && key === "library") {
      navigate("/library");
      return;
    }
    if (role === "TRANSPORT_COORDINATOR" && key === "transport") {
      navigate("/transport");
      return;
    }

    if (["admin", "analytics", "modules", "communications", "finance", "hr", "institutions", "library", "transport"].includes(key)) {
      navigate(`/${key}`);
      return;
    }

    setModule(key);
  };

  const openQuickLink = (link: QuickLink) => {
    if (link.path) {
      navigate(link.path);
      return;
    }
    if (link.module) {
      setModule(link.module);
    }
  };

  return (
    <div className="space-y-8 relative min-h-screen">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-2 border-b border-white/5">
        <div>
          <Typography.Title
            level={1}
            className="!mb-0 text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/50 tracking-tighter font-black drop-shadow-sm"
          >
            Workspace
          </Typography.Title>
          <div className="flex items-center gap-3 mt-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--cv-accent)] opacity-50"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--cv-accent)]"></span>
            </span>
            <Typography.Text className="!text-white/60 font-medium">
              Logged in as
            </Typography.Text>
            <span className="text-[var(--cv-accent)] font-bold tracking-wider text-sm bg-[var(--cv-accent)]/10 px-3 py-1 rounded-lg border border-[var(--cv-accent)]/20 shadow-[0_0_15px_rgba(var(--cv-accent-rgb),0.1)]">
              {role?.replace(/_/g, " ") ?? "Unknown"}
            </span>
          </div>
        </div>
        <Space>
          <button
            onClick={() => navigate("/login")}
            className="group flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/[0.03] border border-white/10 text-white/80 font-medium hover:bg-white/10 hover:border-white/20 transition-all duration-300 active:scale-95 shadow-sm backdrop-blur-md"
          >
            <SwapOutlined className="transition-transform duration-500 group-hover:rotate-180 text-[var(--cv-accent)]" />
            Sign Out
          </button>
        </Space>
      </div>

      <div
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 relative z-10"
        style={{ perspective: "2000px" }}
      >
        {actions.map((a) => (
          <TiltCard
            key={a.key}
            a={a}
            isActive={module === a.key}
            onClick={() => openModuleAction(a.key)}
          />
        ))}
      </div>

      {quickLinks.length ? (
        <div className="rounded-[2rem] border border-white/10 bg-[var(--cv-card)]/70 shadow-2xl backdrop-blur-3xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
          <div className="relative z-10 p-6 md:p-8">
            <div className="mb-5">
              <Typography.Title level={4} className="!mb-1 !text-white">
                Priority Workflows
              </Typography.Title>
              <Typography.Paragraph className="!mb-0 !text-white/55">
                Direct links into the newest analytics, lifecycle, campaign, and operations flows for your role.
              </Typography.Paragraph>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {quickLinks.map((link) => (
                <button
                  key={link.key}
                  type="button"
                  onClick={() => openQuickLink(link)}
                  className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-left transition hover:border-[var(--cv-accent)]/40 hover:bg-white/[0.06]"
                >
                  <div className="text-white font-semibold">{link.label}</div>
                  <div className="text-white/55 text-sm mt-2 leading-relaxed">{link.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {["SUPER_ADMIN", "SCHOOL_ADMIN", "ACCOUNTANT"].includes(role ?? "") && (
        <div className="relative z-10 mt-10 transition-all duration-700 ease-out transform opacity-100 translate-y-0">
          <AdminAnalyticsWidget />
        </div>
      )}

      <div className="min-h-[400px] mt-10 bg-[var(--cv-card)]/50 border border-white/10 rounded-[2.5rem] shadow-2xl backdrop-blur-3xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
        <div className="relative z-10 p-6 md:p-8 transition-all duration-500 ease-out transform opacity-100 translate-y-0">
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center py-32 gap-6">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-t-2 border-[var(--cv-accent)] animate-spin" />
                  <div className="absolute inset-2 rounded-full border-r-2 border-purple-400 animate-[spin_2s_linear_infinite_reverse]" />
                </div>
                <span className="text-white/50 font-medium tracking-widest uppercase text-xs">
                  Loading Sub-Module
                </span>
              </div>
            }
          >
            {module === "students" ? <Students /> : null}
            {module === "academics" ? <Academics /> : null}
            {module === "admissions" ? <Admissions /> : null}
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
