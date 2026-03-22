import { buildColumns } from "@/features/workspace/workspaceUtils";
import WorkspaceResourceCard from "@/features/workspace/WorkspaceResourceCard";
import type { WorkspaceOption } from "@/features/workspace/workspaceTypes";
import type { TransportResourceKey } from "./transportApi";
import type { StudentTransportAllocationRow, VehicleMaintenanceRow } from "./transportTypes";

type Props = {
  loading: boolean;
  allocations: StudentTransportAllocationRow[];
  maintenance: VehicleMaintenanceRow[];
  studentMap: Map<number, string>;
  routeMap: Map<number, string>;
  stopMap: Map<number, string>;
  vehicleMap: Map<number, string>;
  studentOptions: WorkspaceOption[];
  routeOptions: WorkspaceOption[];
  stopOptions: WorkspaceOption[];
  vehicleOptions: WorkspaceOption[];
  onCreate: (resource: TransportResourceKey, payload: Record<string, unknown>) => Promise<void>;
};

export default function TransportAllocationsTab({
  loading,
  allocations,
  maintenance,
  studentMap,
  routeMap,
  stopMap,
  vehicleMap,
  studentOptions,
  routeOptions,
  stopOptions,
  vehicleOptions,
  onCreate,
}: Props) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <WorkspaceResourceCard
        title="Student Allocations"
        description="Assign learners to routes and stops in a focused transport allocation desk."
        endpoint="/api/transport/student-transport-allocations/"
        rows={allocations}
        loading={loading}
        columns={buildColumns<StudentTransportAllocationRow>([
          { key: "student", label: "Student", map: studentMap },
          { key: "route", label: "Route", map: routeMap },
          { key: "stop", label: "Stop", map: stopMap },
          { key: "pickup_required", label: "Pickup", kind: "boolean" },
          { key: "drop_required", label: "Drop", kind: "boolean" },
          { key: "monthly_fee", label: "Monthly Fee" },
          { key: "start_date", label: "Start Date", kind: "date" },
          { key: "is_active", label: "Active", kind: "boolean" },
        ])}
        createButtonLabel="Allocate Student"
        createInitialValues={{ pickup_required: true, drop_required: true, is_active: true, monthly_fee: 0 }}
        createFields={[
          { name: "student", label: "Student", type: "select", required: true, options: studentOptions },
          { name: "route", label: "Route", type: "select", required: true, options: routeOptions },
          { name: "stop", label: "Stop", type: "select", required: true, options: stopOptions },
          { name: "pickup_required", label: "Pickup Required", type: "switch" },
          { name: "drop_required", label: "Drop Required", type: "switch" },
          { name: "monthly_fee", label: "Monthly Fee", type: "number", required: true },
          { name: "start_date", label: "Start Date", type: "date", required: true },
          { name: "end_date", label: "End Date", type: "date" },
          { name: "is_active", label: "Active", type: "switch" },
        ]}
        onCreate={(payload) => onCreate("studentAllocations", payload)}
      />

      <WorkspaceResourceCard
        title="Maintenance Logs"
        description="Track servicing history and next due dates without opening the route planning tab."
        endpoint="/api/transport/vehicle-maintenance/"
        rows={maintenance}
        loading={loading}
        columns={buildColumns<VehicleMaintenanceRow>([
          { key: "vehicle", label: "Vehicle", map: vehicleMap },
          { key: "service_date", label: "Service Date", kind: "date" },
          { key: "service_type", label: "Service Type" },
          { key: "odometer_reading", label: "Odometer" },
          { key: "vendor", label: "Vendor" },
          { key: "cost", label: "Cost" },
          { key: "next_service_due_on", label: "Next Due", kind: "date" },
        ])}
        createButtonLabel="Log Maintenance"
        createInitialValues={{ cost: 0, odometer_reading: 0 }}
        createFields={[
          { name: "vehicle", label: "Vehicle", type: "select", required: true, options: vehicleOptions },
          { name: "service_date", label: "Service Date", type: "date", required: true },
          { name: "odometer_reading", label: "Odometer Reading", type: "number", required: true },
          { name: "service_type", label: "Service Type", type: "text", required: true },
          { name: "notes", label: "Notes", type: "textarea", colSpan: 24 },
          { name: "vendor", label: "Vendor", type: "text" },
          { name: "cost", label: "Cost", type: "number", required: true },
          { name: "next_service_due_on", label: "Next Service Due", type: "date" },
        ]}
        onCreate={(payload) => onCreate("vehicleMaintenance", payload)}
      />
    </div>
  );
}
