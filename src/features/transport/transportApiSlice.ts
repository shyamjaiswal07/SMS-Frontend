import { apiSlice } from "@/app/apiSlice";
import type {
  CostTrendReport,
  OccupancyReport,
  Paginated,
  QueryParams,
  RouteRow,
  RouteStopRow,
  StopRow,
  StudentTransportAllocationRow,
  UtilizationReport,
  VehicleMaintenanceRow,
  VehicleRow,
} from "./transportTypes";

export const transportApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getVehicles: builder.query<Paginated<VehicleRow>, QueryParams>({
      query: (params) => ({ url: "/api/transport/vehicles/", params }),
    }),
    getStops: builder.query<Paginated<StopRow>, QueryParams>({
      query: (params) => ({ url: "/api/transport/stops/", params }),
    }),
    getRoutes: builder.query<Paginated<RouteRow>, QueryParams>({
      query: (params) => ({ url: "/api/transport/routes/", params }),
    }),
    getRouteStops: builder.query<Paginated<RouteStopRow>, QueryParams>({
      query: (params) => ({ url: "/api/transport/route-stops/", params }),
    }),
    getStudentTransportAllocations: builder.query<Paginated<StudentTransportAllocationRow>, QueryParams>({
      query: (params) => ({ url: "/api/transport/student-transport-allocations/", params }),
    }),
    getVehicleMaintenance: builder.query<Paginated<VehicleMaintenanceRow>, QueryParams>({
      query: (params) => ({ url: "/api/transport/vehicle-maintenance/", params }),
    }),
    getRouteOccupancyReport: builder.query<OccupancyReport, void>({
      query: () => ({ url: "/api/transport/routes/occupancy-report/" }),
    }),
    getTransportUtilizationReport: builder.query<UtilizationReport, QueryParams>({
      query: (params) => ({ url: "/api/transport/student-transport-allocations/utilization-report/", params }),
    }),
    getVehicleCostTrend: builder.query<CostTrendReport, QueryParams>({
      query: (params) => ({ url: "/api/transport/vehicle-maintenance/cost-trend/", params }),
    }),
  }),
});

export const {
  useGetVehiclesQuery,
  useGetStopsQuery,
  useGetRoutesQuery,
  useGetRouteStopsQuery,
  useGetStudentTransportAllocationsQuery,
  useGetVehicleMaintenanceQuery,
  useGetRouteOccupancyReportQuery,
  useGetTransportUtilizationReportQuery,
  useGetVehicleCostTrendQuery,
} = transportApiSlice;
