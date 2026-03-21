import { Button, Col, Row, Space, Typography } from "antd";
import type { FC } from "react";
import { lazy, Suspense, useMemo, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppstoreOutlined, AuditOutlined, BellOutlined, BookOutlined, DollarOutlined, TeamOutlined, UserOutlined, SwapOutlined, ArrowRightOutlined } from "@ant-design/icons";

const Students = lazy(() => import("@/pages/StudentsSprint"));
const Admissions = lazy(() => import("@/pages/Database"));
const Academics = lazy(() => import("@/pages/AcademicsSprint"));

type ModuleKey = "students" | "academics" | "admissions" | "admin" | "modules" | "communications" | "finance" | "hr";

function getTenantRole(): string | undefined {
  try {
    const tenantStr = sessionStorage.getItem("tenant");
    if (!tenantStr) return undefined;
    return (JSON.parse(tenantStr)?.role as string | undefined) ?? undefined;
  } catch {
    return undefined;
  }
}

type ActionCard = { key: ModuleKey; title: string; desc: string; icon: JSX.Element };

const TiltCard = ({ a, isActive, onClick, hoverStyle }: { a: ActionCard, isActive: boolean, onClick: () => void, hoverStyle?: string }) => {
  const cardRef = useRef<HTMLButtonElement>(null);
  const [style, setStyle] = useState({});
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const rotateX = ((y / rect.height) - 0.5) * -15; // Inverted logic for natural tilt
    const rotateY = ((x / rect.width) - 0.5) * 15;

    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: 'none',
    });
    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.2, // Subtle white reflection
    });
  };

  const handleMouseLeave = () => {
    setStyle({
      transform: `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
      transition: 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
    });
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group relative overflow-hidden w-full text-left rounded-[2rem] p-6 cursor-pointer outline-none ${
        isActive 
          ? 'bg-gradient-to-br from-[var(--cv-accent)]/20 via-[var(--cv-accent)]/10 to-transparent border border-[var(--cv-accent)]/50 shadow-[0_10px_40px_rgba(var(--cv-accent-rgb),0.2)]' 
          : 'border border-white/5 bg-white/[0.02] backdrop-blur-md hover:border-white/10 hover:bg-white/5'
      } ${hoverStyle || ''}`}
      style={{
         ...style,
         transformStyle: 'preserve-3d',
      }}
    >
      {/* Responsive Glare Effect - Shines over the card as mouse moves */}
      <div 
        className="absolute inset-0 pointer-events-none rounded-[2rem] transition-opacity duration-300 z-20"
        style={{
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.8) 0%, transparent 60%)`,
          opacity: glare.opacity,
          mixBlendMode: 'overlay',
        }}
      />

      {/* Layer 1: Parallax Icon & Text Container */}
      <div className="relative z-10 flex flex-col h-full pointer-events-none transform-gpu transition-all duration-300 group-hover:translate-z-10" style={{ transform: style.hasOwnProperty('transform') ? 'translateZ(30px)' : 'translateZ(0px)' }}>
        <div className="flex items-start gap-4 mb-4">
           <div className={`h-14 w-14 shrink-0 rounded-2xl grid place-items-center text-2xl transition-all duration-500 ${
              isActive 
                ? 'bg-[var(--cv-accent)] text-white shadow-lg shadow-[var(--cv-accent)]/40 scale-105' 
                : 'bg-[var(--cv-accent)]/10 border border-[var(--cv-accent)]/20 text-[var(--cv-accent)] group-hover:bg-[var(--cv-accent)]/20 group-hover:scale-110'
           }`}>
             {a.icon}
           </div>
           <div className="flex-1 min-w-0 pt-1">
             <h3 className={`text-lg font-bold truncate transition-colors duration-300 ${isActive ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>
               {a.title}
             </h3>
           </div>
        </div>
        
        {/* Layer 2: Deeper Parallax for description */}
        <p className={`text-sm leading-relaxed mb-6 mt-2 transition-colors duration-300 h-[40px] transform-gpu ${isActive ? 'text-white/90' : 'text-white/50 group-hover:text-white/70'}`} style={{ transform: style.hasOwnProperty('transform') ? 'translateZ(20px)' : 'translateZ(0px)' }}>
           {a.desc}
        </p>

        {/* Layer 3: Elevated Action Bar */}
        <div className="flex items-center justify-between border-t border-white/10 pt-5 mt-auto transform-gpu transition-all duration-300" style={{ transform: style.hasOwnProperty('transform') ? 'translateZ(40px)' : 'translateZ(0px)' }}>
           <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${isActive ? 'text-[var(--cv-accent)]' : 'text-white/30 group-hover:text-white/60'}`}>
             {isActive ? "Actively Viewing" : "Press to Expand"}
           </span>
           <div className={`h-8 w-8 rounded-full border flex items-center justify-center transition-all duration-500 ${
             isActive ? 'border-[var(--cv-accent)] text-[var(--cv-accent)] bg-[var(--cv-accent)]/10 shadow-[0_0_15px_rgba(var(--cv-accent-rgb),0.3)]' : 'border-white/10 text-white/30 group-hover:border-[var(--cv-accent)]/50 group-hover:text-[var(--cv-accent)] group-hover:bg-[var(--cv-accent)]/5'
           }`}>
             <ArrowRightOutlined className={isActive ? "" : "-rotate-45 group-hover:rotate-0 transition-transform duration-500"} />
           </div>
        </div>
      </div>
    </button>
  );
};

const DashboardHome: FC = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const role = useMemo(() => getTenantRole(), []);

  const defaultModule: ModuleKey = role === "TEACHER" ? "academics" : role === "SUPER_ADMIN" ? "admin" : role === "ACCOUNTANT" ? "finance" : role === "HR_MANAGER" ? "hr" : role === "LIBRARIAN" || role === "TRANSPORT_COORDINATOR" ? "modules" : "students";
  const module = (params.get("module") as ModuleKey | null) ?? defaultModule;
  const setModule = (m: ModuleKey) => setParams({ module: m });

  const actions: ActionCard[] = useMemo(() => {
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
      case "TRANSPORT_COORDINATOR":
        return [
          { key: "communications", title: "Communications", desc: "Notifications and shared operational messaging", icon: <BellOutlined /> },
          { key: "modules", title: "ERP Modules", desc: "Operational APIs for your assigned domain", icon: <AppstoreOutlined /> },
        ];
      case "SCHOOL_ADMIN":
        return [
          { key: "students", title: "Students", desc: "Search and view student records", icon: <UserOutlined /> },
          { key: "admissions", title: "Admissions", desc: "Manage admission applications", icon: <AppstoreOutlined /> },
          { key: "academics", title: "Academics", desc: "Courses and class schedules", icon: <BookOutlined /> },
          { key: "finance", title: "Finance", desc: "Invoices, fee setup, and payment collections", icon: <DollarOutlined /> },
          { key: "hr", title: "HR", desc: "Staff records, leave workflows, and payroll runs", icon: <TeamOutlined /> },
          { key: "communications", title: "Communications", desc: "Announcements, notifications, and inbox workflows", icon: <BellOutlined /> },
          { key: "modules", title: "ERP Modules", desc: "Institution, finance, HR, comms, library, transport", icon: <AppstoreOutlined /> },
          { key: "admin", title: "Admin Controls", desc: "Users, memberships and security", icon: <AuditOutlined /> },
        ];
      case "SUPER_ADMIN":
        return [
          { key: "admin", title: "Admin Controls", desc: "Users, permissions, memberships and security", icon: <AuditOutlined /> },
          { key: "finance", title: "Finance", desc: "Fee structures, invoices, collections, and summaries", icon: <DollarOutlined /> },
          { key: "hr", title: "HR", desc: "Staff lifecycle, leave, payroll runs, and payslips", icon: <TeamOutlined /> },
          { key: "communications", title: "Communications", desc: "Cross-tenant announcement and notification oversight", icon: <BellOutlined /> },
          { key: "modules", title: "ERP Modules", desc: "Institution, finance, HR, comms, library, transport", icon: <AppstoreOutlined /> },
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

  return (
    <div className="space-y-8 relative min-h-screen">
      {/* 
        Dynamic Floating Animated Background Orbs 
        These provide a highly premium, moving atmospheric lighting to the whole dashboard 
      */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[var(--cv-accent)]/10 blur-[130px] rounded-full mix-blend-screen animate-[pulse_10s_ease-in-out_infinite_alternate]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[130px] rounded-full mix-blend-screen animate-[pulse_8s_ease-in-out_infinite_alternate_reverse]" />
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-2 border-b border-white/5">
        <div>
          <Typography.Title level={1} className="!mb-0 text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/50 tracking-tighter font-black drop-shadow-sm">
            Workspace
          </Typography.Title>
          <div className="flex items-center gap-3 mt-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--cv-accent)] opacity-50"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--cv-accent)]"></span>
            </span>
            <Typography.Text className="!text-white/60 font-medium">Logged in as</Typography.Text>
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 relative z-10" style={{ perspective: '2000px' }}>
        {actions.map((a) => (
          <TiltCard 
            key={a.key} 
            a={a} 
            isActive={module === a.key} 
            onClick={() => (a.key === "admin" || a.key === "modules" || a.key === "communications" || a.key === "finance" || a.key === "hr") ? navigate(`/${a.key}`) : setModule(a.key)} 
          />
        ))}
      </div>

      <div className="min-h-[400px] mt-8 bg-[var(--cv-card)]/50 border border-white/10 rounded-[2.5rem] shadow-2xl backdrop-blur-3xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
        <div className="relative z-10 p-6 md:p-8 transition-all duration-500 ease-out transform opacity-100 translate-y-0">
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center py-32 gap-6">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-t-2 border-[var(--cv-accent)] animate-spin" />
                <div className="absolute inset-2 rounded-full border-r-2 border-purple-400 animate-[spin_2s_linear_infinite_reverse]" />
              </div>
              <span className="text-white/50 font-medium tracking-widest uppercase text-xs">Loading Sub-Module</span>
            </div>
          }>
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
