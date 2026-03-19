import { Layout, Menu } from "antd";
import { BookOutlined, DatabaseOutlined, DashboardOutlined, LogoutOutlined } from "@ant-design/icons";
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
    if (location.pathname.startsWith("/database")) return "database";
    if (location.pathname.startsWith("/academics")) return "academics";
    if (location.pathname.startsWith("/dashboard")) return "dashboard";
    return "dashboard";
  }, [location.pathname]);

  const allowedKeys = useMemo(() => {
    switch (role) {
      case "STUDENT":
        return ["dashboard", "academics"] as const;
      case "TEACHER":
        return ["dashboard", "academics", "database"] as const;
      case "SCHOOL_ADMIN":
        return ["dashboard", "database", "academics"] as const;
      default:
        return ["dashboard", "academics"] as const;
    }
  }, [role]);

  const defaultAllowedPath = useMemo(() => {
    switch (role) {
      case "STUDENT":
        return "/dashboard?module=students";
      case "TEACHER":
        return "/academics";
      case "SCHOOL_ADMIN":
        return "/dashboard?module=students";
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
      { key: "dashboard", icon: <DashboardOutlined />, label: "Students" },
      { key: "database", icon: <DatabaseOutlined />, label: "Admissions" },
      { key: "academics", icon: <BookOutlined />, label: "Academics" },
    ];

    return base
      .filter((i) => allowedKeys.includes(i.key as any))
      .concat([{ key: "logout", icon: <LogoutOutlined />, label: "Logout" }]);
  }, [allowedKeys]);

  return (
    <Layout className="min-h-screen">
      <Sider breakpoint="lg" collapsedWidth={64} className="!bg-[var(--cv-sider)]">
        <div className="h-12 flex items-center px-4 text-white font-semibold tracking-wide">
          Cognivoult
        </div>
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
      <Layout>
        <Header className="!bg-[var(--cv-header)] px-4 flex items-center justify-between border-b border-white/10">
          <div className="font-medium text-white/90">Welcome</div>
        </Header>
        <Content className="p-4 bg-[var(--cv-bg)]">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

