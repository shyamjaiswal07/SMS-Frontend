import { Space, Typography } from "antd";
import type { FC } from "react";
import { lazy, Suspense, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SwapOutlined } from "@ant-design/icons";
import AdminAnalyticsWidget from "./AdminAnalyticsWidget";
import { TiltCard } from "./TiltCard";
import { getTenantRole, useDashboardActions, type ModuleKey } from "./utils";

const Students = lazy(() => import("@/pages/StudentsSprint"));
const Admissions = lazy(() => import("@/pages/Database"));
const Academics = lazy(() => import("@/pages/AcademicsSprint"));

const DashboardHome: FC = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const role = useMemo(() => getTenantRole(), []);
  const actions = useDashboardActions(role);

  const defaultModule: ModuleKey =
    role === "TEACHER"
      ? "academics"
      : role === "SUPER_ADMIN"
        ? "admin"
        : role === "ACCOUNTANT"
          ? "finance"
          : role === "HR_MANAGER"
            ? "hr"
            : role === "LIBRARIAN" || role === "TRANSPORT_COORDINATOR"
              ? "modules"
              : "students";
              
  const module = (params.get("module") as ModuleKey | null) ?? defaultModule;
  const setModule = (m: ModuleKey) => setParams({ module: m });

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
            onClick={() =>
              ["admin", "modules", "communications", "finance", "hr"].includes(a.key)
                ? navigate(`/${a.key}`)
                : setModule(a.key)
            }
          />
        ))}
      </div>

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
