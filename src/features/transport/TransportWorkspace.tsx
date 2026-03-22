import { CarOutlined, EnvironmentOutlined, ToolOutlined, UsergroupAddOutlined } from "@ant-design/icons";
import { Tabs } from "antd";
import { useMemo } from "react";
import { useGetStudentsQuery } from "@/features/students/studentsApiSlice";
import WorkspacePageHeader from "@/features/workspace/WorkspacePageHeader";
import WorkspaceStatsGrid from "@/features/workspace/WorkspaceStatsGrid";
import useWorkspaceTab from "@/features/workspace/useWorkspaceTab";
import { buildOptions } from "@/features/workspace/workspaceUtils";
import { transportApi, type TransportResourceKey } from "./transportApi";
import TransportAllocationsTab from "./TransportAllocationsTab";
import TransportNetworkTab from "./TransportNetworkTab";
import TransportReportsPanel from "./TransportReportsPanel";
import type { RouteRow, StopRow, VehicleRow } from "./transportTypes";
import { useTransportWorkspace } from "./useTransportWorkspace";
import { rowsOf } from "@/utils/platform";

function vehicleLabel(row: VehicleRow) {
  return row.registration_number ?? `Vehicle #${row.id}`;
}

function routeLabel(row: RouteRow) {
  return `${row.code ?? row.id} - ${row.name ?? "Route"}`.trim();
}

function stopLabel(row: StopRow) {
  return `${row.code ?? row.id} - ${row.name ?? "Stop"}`.trim();
}

export default function TransportWorkspace() {
  const { activeTab, setActiveTab } = useWorkspaceTab("network");
  const { vehicles, stops, routes, routeStops, allocations, maintenance, loading, refetchAll } = useTransportWorkspace();
  const studentsQuery = useGetStudentsQuery({ page: 1, page_size: 200 });
  const students = rowsOf(studentsQuery.data);

  const vehicleMap = useMemo(() => new Map(vehicles.map((row) => [row.id, vehicleLabel(row)])), [vehicles]);
  const routeMap = useMemo(() => new Map(routes.map((row) => [row.id, routeLabel(row)])), [routes]);
  const stopMap = useMemo(() => new Map(stops.map((row) => [row.id, stopLabel(row)])), [stops]);
  const studentMap = useMemo(
    () =>
      new Map(
        students.map((row) => [
          row.id,
          `${row.student_id ?? row.id} - ${row.first_name ?? ""} ${row.last_name ?? ""}`.trim(),
        ]),
      ),
    [students],
  );

  const vehicleOptions = useMemo(() => buildOptions(vehicles, vehicleLabel), [vehicles]);
  const routeOptions = useMemo(() => buildOptions(routes, routeLabel), [routes]);
  const stopOptions = useMemo(() => buildOptions(stops, stopLabel), [stops]);
  const studentOptions = useMemo(
    () =>
      buildOptions(
        students,
        (row) => `${row.student_id ?? row.id} - ${row.first_name ?? ""} ${row.last_name ?? ""}`.trim(),
      ),
    [students],
  );

  const stats = useMemo(
    () => [
      { key: "vehicles", label: "Vehicles", value: vehicles.length, icon: <CarOutlined className="text-[var(--cv-accent)]" /> },
      { key: "stops", label: "Stops", value: stops.length, icon: <EnvironmentOutlined className="text-[var(--cv-accent)]" /> },
      {
        key: "allocations",
        label: "Active Allocations",
        value: allocations.filter((row) => row.is_active).length,
        icon: <UsergroupAddOutlined className="text-[var(--cv-accent)]" />,
      },
      {
        key: "maintenance",
        label: "Maintenance Logs",
        value: maintenance.length,
        icon: <ToolOutlined className="text-[var(--cv-accent)]" />,
      },
    ],
    [allocations, maintenance.length, stops.length, vehicles.length],
  );

  const handleCreate = async (resource: TransportResourceKey, payload: Record<string, unknown>) => {
    await transportApi.createRecord(resource, payload);
    await refetchAll();
  };

  return (
    <div className="space-y-4">
      <WorkspacePageHeader
        title="Transport Workspace"
        description="Sprint 12 route planning, student allocations, maintenance, and reporting in a dedicated transport module."
        loading={loading || studentsQuery.isFetching}
        onRefresh={() => {
          void Promise.all([refetchAll(), studentsQuery.refetch()]);
        }}
      />

      <WorkspaceStatsGrid stats={stats} />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "network",
            label: "Network",
            children: (
              <TransportNetworkTab
                loading={loading}
                vehicles={vehicles}
                stops={stops}
                routes={routes}
                routeStops={routeStops}
                vehicleMap={vehicleMap}
                routeMap={routeMap}
                stopMap={stopMap}
                vehicleOptions={vehicleOptions}
                routeOptions={routeOptions}
                stopOptions={stopOptions}
                onCreate={handleCreate}
              />
            ),
          },
          {
            key: "allocations",
            label: "Allocations",
            children: (
              <TransportAllocationsTab
                loading={loading}
                allocations={allocations}
                maintenance={maintenance}
                studentMap={studentMap}
                routeMap={routeMap}
                stopMap={stopMap}
                vehicleMap={vehicleMap}
                studentOptions={studentOptions}
                routeOptions={routeOptions}
                stopOptions={stopOptions}
                vehicleOptions={vehicleOptions}
                onCreate={handleCreate}
              />
            ),
          },
          {
            key: "reports",
            label: "Reports",
            children: <TransportReportsPanel />,
          },
        ]}
      />
    </div>
  );
}
