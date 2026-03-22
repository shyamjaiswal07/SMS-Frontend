import { Col, Row } from "antd";
import type { AnalyticsModuleConfig } from "./analyticsConfig";
import AnalyticsModuleCard from "./AnalyticsModuleCard";

type Props = {
  modules: AnalyticsModuleConfig[];
  periodLabel: string;
  metricsByModule: Record<string, Record<string, unknown>>;
  onOpenRoute: (route: string) => void;
  onOpenDetail: (moduleKey: AnalyticsModuleConfig["key"]) => void;
};

export default function AnalyticsModuleGrid({
  modules,
  periodLabel,
  metricsByModule,
  onOpenRoute,
  onOpenDetail,
}: Props) {
  return (
    <Row gutter={[16, 16]}>
      {modules.map((config) => (
        <Col xs={24} md={12} xl={8} key={config.key}>
          <AnalyticsModuleCard
            config={config}
            periodLabel={periodLabel}
            metrics={metricsByModule[config.key] ?? {}}
            onOpenRoute={() => onOpenRoute(config.route)}
            onOpenDetail={() => onOpenDetail(config.key)}
          />
        </Col>
      ))}
    </Row>
  );
}
