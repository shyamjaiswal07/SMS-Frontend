import apiClient from "@/services/apiClient";

const transportResourceEndpoints = {
  vehicles: "/api/transport/vehicles/",
  stops: "/api/transport/stops/",
  routes: "/api/transport/routes/",
  routeStops: "/api/transport/route-stops/",
  studentAllocations: "/api/transport/student-transport-allocations/",
  vehicleMaintenance: "/api/transport/vehicle-maintenance/",
} as const;

export type TransportResourceKey = keyof typeof transportResourceEndpoints;

export const transportApi = {
  async createRecord(resource: TransportResourceKey, payload: Record<string, unknown>) {
    const response = await apiClient.post(transportResourceEndpoints[resource], payload);
    return response.data;
  },
};
