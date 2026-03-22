import { buildColumns } from "@/features/workspace/workspaceUtils";
import WorkspaceResourceCard from "@/features/workspace/WorkspaceResourceCard";
import type { WorkspaceOption } from "@/features/workspace/workspaceTypes";
import type { TransportResourceKey } from "./transportApi";
import type { RouteRow, RouteStopRow, StopRow, VehicleRow } from "./transportTypes";

type Props = {
  loading: boolean;
  vehicles: VehicleRow[];
  stops: StopRow[];
  routes: RouteRow[];
  routeStops: RouteStopRow[];
  vehicleMap: Map<number, string>;
  routeMap: Map<number, string>;
  stopMap: Map<number, string>;
  vehicleOptions: WorkspaceOption[];
  routeOptions: WorkspaceOption[];
  stopOptions: WorkspaceOption[];
  onCreate: (resource: TransportResourceKey, payload: Record<string, unknown>) => Promise<void>;
};

export default function TransportNetworkTab({
  loading,
  vehicles,
  stops,
  routes,
  routeStops,
  vehicleMap,
  routeMap,
  stopMap,
  vehicleOptions,
  routeOptions,
  stopOptions,
  onCreate,
}: Props) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <WorkspaceResourceCard
        title="Vehicles"
        description="Register school vehicles with capacity and compliance dates ready for route planning."
        endpoint="/api/transport/vehicles/"
        rows={vehicles}
        loading={loading}
        columns={buildColumns<VehicleRow>([
          { key: "registration_number", label: "Registration" },
          { key: "vehicle_type", label: "Type" },
          { key: "model_name", label: "Model" },
          { key: "capacity", label: "Capacity" },
          { key: "insurance_expiry", label: "Insurance Expiry", kind: "date" },
          { key: "fitness_expiry", label: "Fitness Expiry", kind: "date" },
        ])}
        createButtonLabel="New Vehicle"
        createInitialValues={{ capacity: 40, vehicle_type: "BUS" }}
        createFields={[
          { name: "registration_number", label: "Registration Number", type: "text", required: true },
          { name: "vehicle_type", label: "Vehicle Type", type: "text", required: true },
          { name: "model_name", label: "Model Name", type: "text" },
          { name: "capacity", label: "Capacity", type: "number", required: true },
          { name: "insurance_expiry", label: "Insurance Expiry", type: "date" },
          { name: "fitness_expiry", label: "Fitness Expiry", type: "date" },
          { name: "gps_device_id", label: "GPS Device ID", type: "text" },
        ]}
        onCreate={(payload) => onCreate("vehicles", payload)}
      />

      <WorkspaceResourceCard
        title="Stops"
        description="Keep route stop masters separate from route sequencing so updates stay easy to manage."
        endpoint="/api/transport/stops/"
        rows={stops}
        loading={loading}
        columns={buildColumns<StopRow>([
          { key: "code", label: "Code" },
          { key: "name", label: "Name" },
          { key: "latitude", label: "Latitude" },
          { key: "longitude", label: "Longitude" },
        ])}
        createButtonLabel="New Stop"
        createFields={[
          { name: "name", label: "Stop Name", type: "text", required: true },
          { name: "code", label: "Stop Code", type: "text" },
          { name: "latitude", label: "Latitude", type: "number" },
          { name: "longitude", label: "Longitude", type: "number" },
        ]}
        onCreate={(payload) => onCreate("stops", payload)}
      />

      <WorkspaceResourceCard
        title="Routes"
        description="Manage route ownership, assigned vehicle, and crew details without mixing it into reports."
        endpoint="/api/transport/routes/"
        rows={routes}
        loading={loading}
        columns={buildColumns<RouteRow>([
          { key: "code", label: "Code" },
          { key: "name", label: "Name" },
          { key: "vehicle", label: "Vehicle", map: vehicleMap },
          { key: "driver_name", label: "Driver" },
          { key: "conductor_name", label: "Conductor" },
        ])}
        createButtonLabel="New Route"
        createFields={[
          { name: "name", label: "Route Name", type: "text", required: true },
          { name: "code", label: "Route Code", type: "text", required: true },
          { name: "vehicle", label: "Vehicle", type: "select", options: vehicleOptions },
          { name: "driver_name", label: "Driver Name", type: "text" },
          { name: "driver_phone", label: "Driver Phone", type: "text" },
          { name: "conductor_name", label: "Conductor Name", type: "text" },
          { name: "conductor_phone", label: "Conductor Phone", type: "text" },
        ]}
        onCreate={(payload) => onCreate("routes", payload)}
      />

      <WorkspaceResourceCard
        title="Route Stops"
        description="Sequence route stops with pickup and drop timing in a dedicated network planning view."
        endpoint="/api/transport/route-stops/"
        rows={routeStops}
        loading={loading}
        columns={buildColumns<RouteStopRow>([
          { key: "route", label: "Route", map: routeMap },
          { key: "stop", label: "Stop", map: stopMap },
          { key: "sequence", label: "Sequence" },
          { key: "pickup_time", label: "Pickup Time" },
          { key: "drop_time", label: "Drop Time" },
        ])}
        createButtonLabel="Add Route Stop"
        createInitialValues={{ sequence: 1 }}
        createFields={[
          { name: "route", label: "Route", type: "select", required: true, options: routeOptions },
          { name: "stop", label: "Stop", type: "select", required: true, options: stopOptions },
          { name: "sequence", label: "Sequence", type: "number", required: true },
          { name: "pickup_time", label: "Pickup Time", type: "time" },
          { name: "drop_time", label: "Drop Time", type: "time" },
        ]}
        onCreate={(payload) => onCreate("routeStops", payload)}
      />
    </div>
  );
}
