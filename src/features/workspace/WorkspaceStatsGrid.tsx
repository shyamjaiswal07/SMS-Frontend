import { Card, Col, Row, Statistic } from "antd";
import type { WorkspaceStat } from "./workspaceTypes";

export default function WorkspaceStatsGrid({ stats }: { stats: WorkspaceStat[] }) {
  if (!stats.length) return null;

  return (
    <Row gutter={[16, 16]}>
      {stats.map((stat) => (
        <Col xs={24} md={12} xl={8} key={stat.key}>
          <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
            <Statistic
              title={<span className="text-white/60">{stat.label}</span>}
              value={stat.value}
              prefix={stat.icon}
              valueStyle={{ color: "#e5e7eb" }}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
}
