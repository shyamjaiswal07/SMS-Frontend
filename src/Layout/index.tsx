import { Layout, Menu } from "antd";
import {
  BankOutlined,
  AuditOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  BellOutlined,
  BookOutlined,
  CarOutlined,
  DatabaseOutlined,
  DashboardOutlined,
  DollarOutlined,
  LogoutOutlined,
  ReadOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo } from "react";
import type { ReactNode } from "react";

const { Header, Sider, Content } = Layout;

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const role = useMemo(() => {
    try {
      const tenantStr = sessionStorage.getItem("tenant");
      return tenantStr ? (JSON.parse(tenantStr)?.role as string | undefined) : undefined;
    } catch {
      return undefined;
    }
  }, []);

  const selectedKey = useMemo(() => {
    if (location.pathname.startsWith("/transport")) return "transport";
    if (location.pathname.startsWith("/library")) return "library";
    if (location.pathname.startsWith("/institutions")) return "institutions";
    if (location.pathname.startsWith("/analytics")) return "analytics";
    if (location.pathname.startsWith("/modules")) return "modules";
    if (location.pathname.startsWith("/students")) return "students";
    if (location.pathname.startsWith("/hr")) return "hr";
    if (location.pathname.startsWith("/finance")) return "finance";
    if (location.pathname.startsWith("/communications")) return "communications";
    if (location.pathname.startsWith("/admin")) return "admin";
    if (location.pathname.startsWith("/database")) return "database";
    if (location.pathname.startsWith("/academics")) return "academics";
    if (location.pathname.startsWith("/dashboard")) return "dashboard";
    return "dashboard";
  }, [location.pathname]);

  const allowedKeys = useMemo(() => {
    switch (role) {
      case "STUDENT":
        return ["dashboard", "students", "academics", "communications"] as const;
      case "PARENT":
        return ["dashboard", "students", "communications"] as const;
      case "TEACHER":
        return ["dashboard", "students", "academics", "database", "communications", "analytics", "modules"] as const;
      case "ACCOUNTANT":
        return ["dashboard", "finance", "communications", "analytics", "modules"] as const;
      case "HR_MANAGER":
        return ["dashboard", "hr", "communications", "analytics", "modules"] as const;
      case "LIBRARIAN":
        return ["dashboard", "communications", "library", "analytics"] as const;
      case "TRANSPORT_COORDINATOR":
        return ["dashboard", "communications", "transport", "analytics"] as const;
      case "SCHOOL_ADMIN":
        return [
          "dashboard",
          "analytics",
          "institutions",
          "students",
          "database",
          "academics",
          "finance",
          "hr",
          "library",
          "transport",
          "communications",
          "admin",
          "modules",
        ] as const;
      case "SUPER_ADMIN":
        return [
          "dashboard",
          "analytics",
          "institutions",
          "students",
          "finance",
          "hr",
          "library",
          "transport",
          "communications",
          "admin",
          "modules",
        ] as const;
      default:
        return ["dashboard", "students", "academics", "communications"] as const;
    }
  }, [role]);

  const defaultAllowedPath = useMemo(() => {
    switch (role) {
      case "TEACHER":
        return "/academics";
      case "ACCOUNTANT":
        return "/finance";
      case "HR_MANAGER":
        return "/hr";
      case "LIBRARIAN":
        return "/library";
      case "TRANSPORT_COORDINATOR":
        return "/transport";
      case "SUPER_ADMIN":
        return "/admin";
      default:
        return "/dashboard?module=students";
    }
  }, [role]);

  useEffect(() => {
    if (!allowedKeys.includes(selectedKey as any)) {
      navigate(defaultAllowedPath, { replace: true });
    }
  }, [allowedKeys, selectedKey, defaultAllowedPath, navigate]);

  const menuItems = useMemo(() => {
    const base: Array<{ key: string; icon: ReactNode; label: string }> = [
      { key: "dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
      { key: "analytics", icon: <BarChartOutlined />, label: "Analytics" },
      { key: "institutions", icon: <BankOutlined />, label: "Institutions" },
      { key: "students", icon: <UserOutlined />, label: "Students" },
      { key: "database", icon: <DatabaseOutlined />, label: "Admissions" },
      { key: "academics", icon: <BookOutlined />, label: "Academics" },
      { key: "finance", icon: <DollarOutlined />, label: "Finance" },
      { key: "hr", icon: <TeamOutlined />, label: "HR" },
      { key: "library", icon: <ReadOutlined />, label: "Library" },
      { key: "transport", icon: <CarOutlined />, label: "Transport" },
      { key: "communications", icon: <BellOutlined />, label: "Communications" },
      { key: "modules", icon: <AppstoreOutlined />, label: "ERP Modules" },
      { key: "admin", icon: <AuditOutlined />, label: "Admin" },
    ];

    return base.filter((i) => allowedKeys.includes(i.key as any)).concat([{ key: "logout", icon: <LogoutOutlined />, label: "Logout" }]);
  }, [allowedKeys]);

  return (
    <Layout className="min-h-screen !bg-[var(--cv-bg)]">
      <Sider breakpoint="lg" collapsedWidth={64} className="!bg-[var(--cv-sider)] !border-r !border-white/10">
        <div className="h-12 flex items-center px-4 text-white font-semibold tracking-wide">Cognivoult</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={({ key }) => {
            if (key === "logout") {
              sessionStorage.removeItem("accessToken");
              sessionStorage.removeItem("refreshToken");
              navigate("/login");
              return;
            }
            if (key === "dashboard") {
              navigate("/dashboard?module=students");
              return;
            }
            navigate(`/${key}`);
          }}
          className="!bg-[var(--cv-sider)]"
          items={menuItems as any}
        />
      </Sider>
      <Layout className="min-w-0 !bg-[var(--cv-bg)]">
        <Header className="!bg-[var(--cv-header)] px-4 flex items-center justify-between border-b border-white/10">
          <div className="font-medium text-white/90">Welcome</div>
        </Header>
        <Content className="min-w-0 bg-[var(--cv-bg)] px-3 py-3 sm:px-4 sm:py-4 lg:px-5">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
