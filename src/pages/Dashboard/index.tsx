import { Button, Card, Col, Row, Space, Typography } from "antd";
import type { FC } from "react";
import { lazy, Suspense, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppstoreOutlined, BookOutlined, UserOutlined } from "@ant-design/icons";

const Students = lazy(() => import("@/pages/Students"));
const Admissions = lazy(() => import("@/pages/Database"));
const Academics = lazy(() => import("@/pages/Academics"));

type ModuleKey = "students" | "academics" | "admissions";

function getTenantRole(): string | undefined {
  try {
    const tenantStr = sessionStorage.getItem("tenant");
    if (!tenantStr) return undefined;
    return (JSON.parse(tenantStr)?.role as string | undefined) ?? undefined;
  } catch {
    return undefined;
  }
}

type ActionCard = {
  key: ModuleKey;
  title: string;
  desc: string;
  icon: JSX.Element;
};

const DashboardHome: FC = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const role = useMemo(() => getTenantRole(), []);

  const defaultModule: ModuleKey = role === "TEACHER" ? "academics" : "students";
  const module = (params.get("module") as ModuleKey | null) ?? defaultModule;

  const setModule = (m: ModuleKey) => setParams({ module: m });

  const actions: ActionCard[] = useMemo(() => {
    switch (role) {
      case "STUDENT":
        return [
          {
            key: "students",
            title: "My Learning",
            desc: "Transcript, attendance & fees",
            icon: <UserOutlined />,
          },
          {
            key: "academics",
            title: "Course Catalog",
            desc: "Programs, prerequisites & schedules",
            icon: <BookOutlined />,
          },
        ];
      case "TEACHER":
        return [
          {
            key: "academics",
            title: "Teaching Planner",
            desc: "Courses, prerequisites & schedules",
            icon: <BookOutlined />,
          },
          {
            key: "students",
            title: "Students Overview",
            desc: "Student summaries & details",
            icon: <UserOutlined />,
          },
          {
            key: "admissions",
            title: "Admissions",
            desc: "Review applications",
            icon: <AppstoreOutlined />,
          },
        ];
      case "SCHOOL_ADMIN":
        return [
          {
            key: "students",
            title: "Students",
            desc: "Search and view student records",
            icon: <UserOutlined />,
          },
          {
            key: "admissions",
            title: "Admissions",
            desc: "Manage admission applications",
            icon: <AppstoreOutlined />,
          },
          {
            key: "academics",
            title: "Academics",
            desc: "Courses and class schedules",
            icon: <BookOutlined />,
          },
        ];
      default:
        return [
          {
            key: "students",
            title: "Students",
            desc: "Search and view student records",
            icon: <UserOutlined />,
          },
          {
            key: "academics",
            title: "Academics",
            desc: "Courses and class schedules",
            icon: <BookOutlined />,
          },
        ];
    }
  }, [role]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Typography.Title level={3} className="!mb-0 text-white">
            Dashboard
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-white/60">
            Role-based workspace:{" "}
            <span className="text-[var(--cv-accent)]">{role ?? "Unknown"}</span>
          </Typography.Paragraph>
        </div>

        <Space>
          <Button
            className="!rounded-2xl !bg-white/5 !border border-white/10 !text-white/80 hover:!bg-white/10"
            onClick={() => navigate("/login")}
          >
            Switch account
          </Button>
        </Space>
      </div>

      <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
        <Row gutter={[16, 16]}>
          {actions.map((a) => (
            <Col xs={24} md={8} key={a.key}>
              <button
                type="button"
                onClick={() => setModule(a.key)}
                className="w-full text-left border border-white/10 rounded-3xl p-4 bg-white/5 hover:bg-white/10 transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-[var(--cv-accent)]/15 border border-[var(--cv-accent)]/30 grid place-items-center text-[var(--cv-accent)]">
                    {a.icon}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{a.title}</div>
                    <div className="text-white/60 text-sm">{a.desc}</div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-white/40">
                  {module === a.key ? "Selected" : "Click to open"}
                </div>
              </button>
            </Col>
          ))}
        </Row>
      </Card>

      <Suspense fallback={<div className="py-10 text-white/60">Loading...</div>}>
        {module === "students" ? <Students /> : null}
        {module === "academics" ? <Academics /> : null}
        {module === "admissions" ? <Admissions /> : null}
      </Suspense>
    </div>
  );
};

export default DashboardHome;

