import { ArrowRightOutlined } from "@ant-design/icons";
import { Button, Card, Col, Row, Typography } from "antd";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { analyticsModuleConfigs, moduleMetrics, roleVisibleAnalyticsModules } from "@/features/analytics/analyticsConfig";
import { useGetAnalyticsOverviewQuery } from "@/features/analytics/analyticsApiSlice";
import { analyticsMetricLabel, analyticsMetricValue, analyticsPreviewRows } from "@/features/analytics/analyticsUtils";
import { currentTenant } from "@/utils/platform";

export default function AdminAnalyticsWidget() {
  const navigate = useNavigate();
  const tenant = currentTenant();
  const { data, isFetching } = useGetAnalyticsOverviewQuery();

  const visibleModules = useMemo(() => {
    const visible = new Set(roleVisibleAnalyticsModules(tenant?.role));
    return analyticsModuleConfigs.filter((item) => visible.has(item.key)).slice(0, 3);
  }, [tenant?.role]);

  return (
    <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-[2.5rem]">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <Typography.Title level={4} className="!mb-1 !text-white">
            Analytics Snapshot
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-white/55">
            Real KPI blocks for {tenant?.name ?? "current tenant"} from the unified analytics service.
          </Typography.Paragraph>
        </div>
        <Button type="primary" className="!rounded-2xl !bg-[var(--cv-accent)] !border-0" onClick={() => navigate("/analytics")}>
          Open Analytics <ArrowRightOutlined />
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        {visibleModules.map((module) => {
          const metrics = moduleMetrics(data ?? {}, module.key);
          const previewRows = analyticsPreviewRows(metrics, 3);

          return (
            <Col xs={24} md={12} xl={8} key={module.key}>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-2xl bg-[var(--cv-accent)]/15 border border-[var(--cv-accent)]/20 grid place-items-center text-[var(--cv-accent)]">
                    {module.icon}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{module.title}</div>
                    <div className="text-white/45 text-xs">
                      {isFetching
                        ? "Refreshing..."
                        : `${data?.period?.start_date || "-"} to ${data?.period?.end_date || "-"}`}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {previewRows.length ? (
                    previewRows.map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-white/55">{analyticsMetricLabel(key)}</span>
                        <span className="text-white/85">{analyticsMetricValue(value)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-white/45 text-sm">No metrics available.</div>
                  )}
                </div>
              </div>
            </Col>
          );
        })}
      </Row>
    </Card>
  );
}
