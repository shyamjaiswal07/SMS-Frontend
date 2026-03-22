import { ReloadOutlined } from "@ant-design/icons";
import { Button, Card, Input, Space, Tabs, Typography } from "antd";
import { useMemo, useState } from "react";
import WorkspaceResourceCard from "@/features/workspace/WorkspaceResourceCard";
import WorkspaceSummaryGrid from "@/features/workspace/WorkspaceSummaryGrid";
import { buildDynamicColumns } from "@/features/workspace/workspaceUtils";
import {
  useGetRouteOccupancyReportQuery,
  useGetTransportUtilizationReportQuery,
  useGetVehicleCostTrendQuery,
} from "./transportApiSlice";

export default function TransportReportsPanel() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const reportParams = useMemo(
    () => ({
      ...(startDate ? { start_date: startDate } : {}),
      ...(endDate ? { end_date: endDate } : {}),
      page: 1,
      page_size: 200,
    }),
    [endDate, startDate],
  );

  const occupancyQuery = useGetRouteOccupancyReportQuery();
  const utilizationQuery = useGetTransportUtilizationReportQuery(reportParams);
  const costTrendQuery = useGetVehicleCostTrendQuery(reportParams);

  const loading = occupancyQuery.isFetching || utilizationQuery.isFetching || costTrendQuery.isFetching;
  const summary = useMemo(
    () => ({
      ...(costTrendQuery.data?.summary ?? {}),
      occupancy_rows: occupancyQuery.data?.count ?? 0,
      route_utilization_rows: utilizationQuery.data?.route_rows?.length ?? 0,
      vehicle_cost_rows: costTrendQuery.data?.vehicle_rows?.length ?? 0,
      window_start: costTrendQuery.data?.start_date || startDate || "-",
      window_end: costTrendQuery.data?.end_date || endDate || "-",
    }),
    [
      costTrendQuery.data?.end_date,
      costTrendQuery.data?.start_date,
      costTrendQuery.data?.summary,
      costTrendQuery.data?.vehicle_rows?.length,
      endDate,
      occupancyQuery.data?.count,
      startDate,
      utilizationQuery.data?.route_rows?.length,
    ],
  );

  const refresh = async () => {
    await Promise.all([occupancyQuery.refetch(), utilizationQuery.refetch(), costTrendQuery.refetch()]);
  };

  return (
    <div className="space-y-4">
      <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Typography.Title level={4} className="!mb-0 !text-white">
              Transport Reports
            </Typography.Title>
            <Typography.Paragraph className="!mb-0 !text-white/60">
              Track occupancy, utilization, and maintenance cost trends in a dedicated reporting panel.
            </Typography.Paragraph>
          </div>
          <Space wrap>
            <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            <Button icon={<ReloadOutlined />} onClick={() => void refresh()} loading={loading}>
              Refresh
            </Button>
          </Space>
        </div>
      </Card>

      <WorkspaceSummaryGrid summary={summary} />

      <Tabs
        defaultActiveKey="occupancy"
        items={[
          {
            key: "occupancy",
            label: "Occupancy",
            children: (
              <WorkspaceResourceCard
                title="Route Occupancy"
                description="Current occupancy by route for the active transport network."
                endpoint="/api/transport/routes/occupancy-report/"
                rows={occupancyQuery.data?.results ?? []}
                loading={loading}
                columns={buildDynamicColumns(occupancyQuery.data?.results ?? [])}
              />
            ),
          },
          {
            key: "route-utilization",
            label: "Route Utilization",
            children: (
              <WorkspaceResourceCard
                title="Utilization by Route"
                description="Utilization rows grouped at the route level for the selected window."
                endpoint="/api/transport/student-transport-allocations/utilization-report/"
                rows={utilizationQuery.data?.route_rows ?? []}
                loading={loading}
                columns={buildDynamicColumns(utilizationQuery.data?.route_rows ?? [])}
              />
            ),
          },
          {
            key: "stop-utilization",
            label: "Stop Utilization",
            children: (
              <WorkspaceResourceCard
                title="Utilization by Stop"
                description="Stop-level usage patterns for the selected transport window."
                endpoint="/api/transport/student-transport-allocations/utilization-report/"
                rows={utilizationQuery.data?.stop_rows ?? []}
                loading={loading}
                columns={buildDynamicColumns(utilizationQuery.data?.stop_rows ?? [])}
              />
            ),
          },
          {
            key: "monthly-trend",
            label: "Monthly Trend",
            children: (
              <WorkspaceResourceCard
                title="Monthly Maintenance Trend"
                description="Monthly maintenance spend movement for the selected time range."
                endpoint="/api/transport/vehicle-maintenance/cost-trend/"
                rows={costTrendQuery.data?.monthly_trend ?? []}
                loading={loading}
                columns={buildDynamicColumns(costTrendQuery.data?.monthly_trend ?? [])}
              />
            ),
          },
          {
            key: "vehicle-costs",
            label: "Vehicle Totals",
            children: (
              <WorkspaceResourceCard
                title="Vehicle Cost Totals"
                description="Maintenance totals rolled up per vehicle."
                endpoint="/api/transport/vehicle-maintenance/cost-trend/"
                rows={costTrendQuery.data?.vehicle_rows ?? []}
                loading={loading}
                columns={buildDynamicColumns(costTrendQuery.data?.vehicle_rows ?? [])}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
