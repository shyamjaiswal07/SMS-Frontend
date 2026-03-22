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
};

export type SchoolRow = {
  id: number;
  name?: string;
  code?: string;
  email?: string;
  city?: string;
  state?: string;
  timezone?: string;
  currency?: string;
};

export type TenantDomainRow = {
  id: number;
  school?: number;
  domain?: string;
  is_primary?: boolean;
  is_verified?: boolean;
};

export type SubscriptionPlanRow = {
  id: number;
  name?: string;
  code?: string;
  monthly_price?: number | string;
  max_students?: number;
  max_staff?: number;
  features?: Record<string, unknown>;
};

export type TenantSubscriptionRow = {
  id: number;
  school?: number;
  plan?: number;
  billing_cycle?: string;
  start_date?: string;
  end_date?: string | null;
  status?: string;
  auto_renew?: boolean;
};

export type AcademicYearRow = {
  id: number;
  name?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
};

export type TermRow = {
  id: number;
  academic_year?: number;
  name?: string;
  sequence?: number;
  start_date?: string;
  end_date?: string;
};

export type DepartmentRow = {
  id: number;
  name?: string;
  code?: string;
  description?: string;
};

export type GradeLevelRow = {
  id: number;
  name?: string;
  code?: string;
  sort_order?: number;
};

export type SectionRow = {
  id: number;
  grade_level?: number;
  name?: string;
  capacity?: number;
  class_teacher?: number | null;
};

export type SubjectRow = {
  id: number;
  department?: number | null;
  name?: string;
  code?: string;
  description?: string;
  credit_hours?: number | string;
};

export type RoomRow = {
  id: number;
  name?: string;
  building?: string;
  floor?: string;
  capacity?: number;
};
