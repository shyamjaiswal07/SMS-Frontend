import { Space, Tag } from "antd";
import DashboardCore from "@/pages/Dashboard";
import AnalyticsOverviewPanel from "@/features/analytics/AnalyticsOverviewPanel";
import { currentTenant } from "@/utils/platform";

export default function DashboardSprintPage() {
  const tenant = currentTenant();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Space wrap>
          {tenant?.code ? <Tag color="gold">{tenant.code}</Tag> : null}
          {tenant?.role ? <Tag color="blue">{tenant.role}</Tag> : null}
        </Space>
      </div>
      {/* <AnalyticsOverviewPanel /> */}
      <DashboardCore />
    </div>
  );
}
