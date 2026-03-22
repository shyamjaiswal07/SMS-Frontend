export type Paginated<T> = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
};

export type QueryParams = {
  search?: string;
  page?: number;
  page_size?: number;
  start_date?: string;
  end_date?: string;
};

export type VehicleRow = {
  id: number;
  registration_number?: string;
  vehicle_type?: string;
  model_name?: string;
  capacity?: number;
  insurance_expiry?: string | null;
  fitness_expiry?: string | null;
  gps_device_id?: string;
};

export type StopRow = {
  id: number;
  name?: string;
  code?: string;
  latitude?: string | number | null;
  longitude?: string | number | null;
};

export type RouteRow = {
  id: number;
  name?: string;
  code?: string;
  vehicle?: number | null;
  driver_name?: string;
  driver_phone?: string;
  conductor_name?: string;
  conductor_phone?: string;
};

export type RouteStopRow = {
  id: number;
  route?: number;
  stop?: number;
  sequence?: number;
  pickup_time?: string | null;
  drop_time?: string | null;
};

export type StudentTransportAllocationRow = {
  id: number;
  student?: number;
  route?: number;
  stop?: number;
  pickup_required?: boolean;
  drop_required?: boolean;
  monthly_fee?: number | string;
  start_date?: string;
  end_date?: string | null;
  is_active?: boolean;
};

export type VehicleMaintenanceRow = {
  id: number;
  vehicle?: number;
  service_date?: string;
  odometer_reading?: number;
  service_type?: string;
  notes?: string;
  vendor?: string;
  cost?: number | string;
  next_service_due_on?: string | null;
};

export type OccupancyReport = {
  count?: number;
  results?: Array<Record<string, unknown>>;
};

export type UtilizationReport = {
  route_rows?: Array<Record<string, unknown>>;
  stop_rows?: Array<Record<string, unknown>>;
};

export type CostTrendReport = {
  start_date?: string;
  end_date?: string;
  monthly_trend?: Array<Record<string, unknown>>;
  vehicle_rows?: Array<Record<string, unknown>>;
  summary?: Record<string, unknown>;
};
