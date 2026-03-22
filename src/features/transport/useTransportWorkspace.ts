import {
  useGetRouteStopsQuery,
  useGetRoutesQuery,
  useGetStopsQuery,
  useGetStudentTransportAllocationsQuery,
  useGetVehicleMaintenanceQuery,
  useGetVehiclesQuery,
} from "./transportApiSlice";
import type {
  RouteRow,
  RouteStopRow,
  StopRow,
  StudentTransportAllocationRow,
  VehicleMaintenanceRow,
  VehicleRow,
} from "./transportTypes";
import { rowsOf } from "@/utils/platform";

export function useTransportWorkspace() {
  const vehiclesQuery = useGetVehiclesQuery({ page: 1, page_size: 200 });
  const stopsQuery = useGetStopsQuery({ page: 1, page_size: 200 });
  const routesQuery = useGetRoutesQuery({ page: 1, page_size: 200 });
  const routeStopsQuery = useGetRouteStopsQuery({ page: 1, page_size: 200 });
  const allocationsQuery = useGetStudentTransportAllocationsQuery({ page: 1, page_size: 200 });
  const maintenanceQuery = useGetVehicleMaintenanceQuery({ page: 1, page_size: 200 });

  const loading = [vehiclesQuery, stopsQuery, routesQuery, routeStopsQuery, allocationsQuery, maintenanceQuery].some(
    (query) => query.isFetching,
  );

  return {
    vehicles: rowsOf(vehiclesQuery.data) as VehicleRow[],
    stops: rowsOf(stopsQuery.data) as StopRow[],
    routes: rowsOf(routesQuery.data) as RouteRow[],
    routeStops: rowsOf(routeStopsQuery.data) as RouteStopRow[],
    allocations: rowsOf(allocationsQuery.data) as StudentTransportAllocationRow[],
    maintenance: rowsOf(maintenanceQuery.data) as VehicleMaintenanceRow[],
    loading,
    async refetchAll() {
      await Promise.all([
        vehiclesQuery.refetch(),
        stopsQuery.refetch(),
        routesQuery.refetch(),
        routeStopsQuery.refetch(),
        allocationsQuery.refetch(),
        maintenanceQuery.refetch(),
      ]);
    },
  };
}
