export type Paginated<T> = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
};

export type UserRole =
  | "SUPER_ADMIN"
  | "SCHOOL_ADMIN"
  | "TEACHER"
  | "STUDENT"
  | "PARENT"
  | "ACCOUNTANT"
  | "LIBRARIAN"
  | "TRANSPORT_COORDINATOR"
  | "HR_MANAGER";

export type AdminUser = {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  role: UserRole;
  is_active: boolean;
  is_staff: boolean;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  preferred_language: string;
  timezone: string;
  last_login?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type AdminMembership = {
  id: number;
  user: number;
  school: number;
  role: UserRole;
  is_active: boolean;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
};

export type LoginAudit = {
  id: number;
  user?: number | null;
  email_attempted: string;
  ip_address?: string | null;
  user_agent: string;
  success: boolean;
  failure_reason: string;
  created_at?: string;
  updated_at?: string;
};

export type RolePermission = {
  id: number;
  role: UserRole;
  permission_code: string;
  is_allowed: boolean;
  created_at?: string;
  updated_at?: string;
};

export type SchoolOption = {
  id: number;
  name: string;
  code: string;
  email?: string;
  city?: string;
  state?: string;
};

export type TenantSummary = {
  school_id: number;
  school_code: string;
  school_name: string;
  role: UserRole;
  is_default: boolean;
};
