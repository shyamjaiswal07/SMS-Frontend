import { ArrowRightOutlined, BellOutlined, BookOutlined, CarOutlined, DollarOutlined, EyeOutlined, ReadOutlined, TeamOutlined } from "@ant-design/icons";
import { Button, Card, Col, Input, Modal, Progress, Row, Space, Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "@/services/apiClient";
import { currentTenant, parseApiError } from "@/utils/platform";

type OverviewResponse = {
  period?: { start_date?: string; end_date?: string };
  academics?: Record<string, unknown>;
  finance?: Record<string, unknown>;
  hr?: Record<string, unknown>;
  library?: Record<string, unknown>;
  transport?: Record<string, unknown>;
  communications?: Record<string, unknown>;
};

type ModuleConfig = {
  key: keyof Omit<OverviewResponse, "period">;
  title: string;
  icon: JSX.Element;
  route: string;
};

type ModuleDetailResponse = {
  module: string;
  period?: { start_date?: string; end_date?: string };
  kpis?: Record<string, unknown>;
};

const moduleConfigs: ModuleConfig[] = [
  { key: "academics", title: "Academics", icon: <BookOutlined />, route: "/academics" },
  { key: "finance", title: "Finance", icon: <DollarOutlined />, route: "/finance" },
  { key: "hr", title: "HR", icon: <TeamOutlined />, route: "/hr" },
  { key: "library", title: "Library", icon: <ReadOutlined />, route: "/modules" },
  { key: "transport", title: "Transport", icon: <CarOutlined />, route: "/modules" },
  { key: "communications", title: "Communications", icon: <BellOutlined />, route: "/communications" },
];

function roleVisibleModules(role?: string) {
  switch (role) {
    case "TEACHER":
      return ["academics", "communications"] as const;
    case "ACCOUNTANT":
      return ["finance", "communications"] as const;
    case "HR_MANAGER":
      return ["hr", "communications"] as const;
    case "LIBRARIAN":
      return ["library", "communications"] as const;
    case "TRANSPORT_COORDINATOR":
      return ["transport", "communications"] as const;
    case "STUDENT":
    case "PARENT":
      return ["academics", "communications"] as const;
    default:
      return ["academics", "finance", "hr", "library", "transport", "communications"] as const;
  }
}

function metricRows(metrics: Record<string, unknown>) {
  return Object.entries(metrics).slice(0, 4);
}

function metricDetailRows(metrics: Record<string, unknown> | undefined) {
  return Object.entries(metrics ?? {}).map(([key, value]) => ({
    key,
    label: key.replace(/_/g, " "),
    value,
  }));
}

export default function AnalyticsOverviewPanel() {
  const navigate = useNavigate();
  const tenant = currentTenant();
  const [overview, setOverview] = useState<OverviewResponse>({});
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleConfig["key"] | null>(null);
  const [moduleDetail, setModuleDetail] = useState<ModuleDetailResponse | null>(null);

  const visibleKeys = useMemo(() => roleVisibleModules(tenant?.role), [tenant?.role]);
  const visibleKeySet = useMemo(() => new Set<string>(visibleKeys as readonly string[]), [visibleKeys]);
  const detailRows = useMemo(() => metricDetailRows(moduleDetail?.kpis), [moduleDetail?.kpis]);

  const detailColumns: ColumnsType<{ key: string; label: string; value: unknown }> = [
    { title: "Metric", dataIndex: "label", render: (value) => <span className="text-white/80">{value}</span> },
    {
      title: "Value",
      dataIndex: "value",
      render: (value) => {
        if (typeof value === "number") {
          return <Tag color="blue">{value}</Tag>;
        }
        if (Array.isArray(value)) {
          return <span className="text-white/70">{JSON.stringify(value)}</span>;
        }
        if (value && typeof value === "object") {
          return <span className="text-white/70">{JSON.stringify(value)}</span>;
        }
        return <span className="text-white/85">{String(value ?? "-")}</span>;
      },
    },
  ];

  const load = async (params?: Record<string, string>) => {
    setLoading(true);
    try {
      const response = await apiClient.get("/api/common/analytics/overview/", { params });
      setOverview(response.data as OverviewResponse);
    } catch (error) {
      message.error(parseApiError(error, "Failed to load analytics overview"));
    } finally {
      setLoading(false);
    }
  };

  const openModuleDetail = async (moduleKey: ModuleConfig["key"]) => {
    setDetailLoading(true);
    setActiveModule(moduleKey);
    setDetailOpen(true);
    try {
      const params: Record<string, string> = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const response = await apiClient.get(`/api/common/analytics/${moduleKey}/`, { params });
      setModuleDetail(response.data as ModuleDetailResponse);
    } catch (error) {
      message.error(parseApiError(error, "Failed to load module analytics"));
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
        <div>
          <Typography.Title level={4} className="!mb-0 !text-white">
            Unified Analytics
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-white/60">
            Sprint 6 role-aware KPI dashboard for {tenant?.name ?? "current tenant"}.
          </Typography.Paragraph>
        </div>
        <Space wrap>
          <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          <Button
            onClick={() => void load({ start_date: startDate || "", end_date: endDate || "" })}
            loading={loading}
          >
            Apply
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        {moduleConfigs
          .filter((item) => visibleKeySet.has(item.key))
          .map((config) => {
            const metrics = (overview[config.key] ?? {}) as Record<string, unknown>;
            const entries = metricRows(metrics);
            const firstNumeric = entries.find(([, value]) => typeof value === "number");
            const progressValue =
              typeof firstNumeric?.[1] === "number" ? Math.max(0, Math.min(100, Number(firstNumeric[1]))) : undefined;

            return (
              <Col xs={24} md={12} xl={8} key={config.key}>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 h-full">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="h-10 w-10 rounded-2xl bg-[var(--cv-accent)]/15 border border-[var(--cv-accent)]/20 grid place-items-center text-[var(--cv-accent)]">
                        {config.icon}
                      </div>
                      <div className="mt-3 text-white font-semibold">{config.title}</div>
                      <div className="text-white/45 text-xs mt-1">
                        {overview.period?.start_date || "-"} to {overview.period?.end_date || "-"}
                      </div>
                    </div>
                    <Space direction="vertical" size={0} align="end">
                      <Button type="link" className="px-0" onClick={() => navigate(config.route)}>
                        Open <ArrowRightOutlined />
                      </Button>
                      <Button type="link" className="px-0" icon={<EyeOutlined />} onClick={() => void openModuleDetail(config.key)}>
                        Details
                      </Button>
                    </Space>
                  </div>

                  {progressValue !== undefined ? (
                    <Progress
                      percent={progressValue}
                      showInfo={false}
                      strokeColor="#f97316"
                      trailColor="rgba(255,255,255,0.1)"
                      className="!mt-4 !mb-4"
                    />
                  ) : null}

                  <div className="space-y-2">
                    {entries.map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-white/55">{key.replace(/_/g, " ")}</span>
                        <span className="text-white/85">{Array.isArray(value) ? `${value.length} items` : String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Col>
            );
          })}
      </Row>

      <Modal
        title={activeModule ? `${String(activeModule).toUpperCase()} Analytics` : "Module Analytics"}
        open={detailOpen}
        footer={null}
        onCancel={() => setDetailOpen(false)}
        width={820}
      >
        <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-white/65">
            {moduleDetail?.period?.start_date || "-"} to {moduleDetail?.period?.end_date || "-"}
          </div>
          {moduleDetail?.module ? <Tag color="blue">{moduleDetail.module}</Tag> : null}
        </div>
        <Table rowKey="key" loading={detailLoading} dataSource={detailRows} columns={detailColumns} pagination={false} />
      </Modal>
    </Card>
  );
}
