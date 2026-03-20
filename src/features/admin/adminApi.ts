import { api } from "@/services/api";
import type {
  AdminMembership,
  AdminUser,
  LoginAudit,
  Paginated,
  RolePermission,
  SchoolOption,
  TenantSummary,
} from "./adminTypes";

export const adminApi = {
  users: {
    list: async (params?: { search?: string; page?: number; page_size?: number }) => {
      return (await api.accounts.users.list(params)) as Paginated<AdminUser>;
    },
    create: async (payload: Record<string, unknown>) => {
      return (await api.accounts.users.create(payload)) as AdminUser;
    },
    update: async (id: number, payload: Record<string, unknown>) => {
      return (await api.accounts.users.update(id, payload)) as AdminUser;
    },
    remove: async (id: number) => api.accounts.users.remove(id),
    bulkImport: async (file: File) => api.accounts.users.bulkImport(file),
  },
  memberships: {
    list: async (params?: { search?: string; page?: number; page_size?: number }) => {
      return (await api.accounts.memberships.list(params)) as Paginated<AdminMembership>;
    },
    create: async (payload: Record<string, unknown>) => {
      return (await api.accounts.memberships.create(payload)) as AdminMembership;
    },
    update: async (id: number, payload: Record<string, unknown>) => {
      return (await api.accounts.memberships.update(id, payload)) as AdminMembership;
    },
    remove: async (id: number) => api.accounts.memberships.remove(id),
    myTenants: async () => {
      return (await api.accounts.memberships.myTenants()) as TenantSummary[];
    },
  },
  loginAudits: {
    list: async (params?: { search?: string; page?: number; page_size?: number }) => {
      return (await api.accounts.loginAudits.list(params)) as Paginated<LoginAudit>;
    },
  },
  rolePermissions: {
    list: async (params?: { search?: string; page?: number; page_size?: number }) => {
      return (await api.accounts.rolePermissions.list(params)) as Paginated<RolePermission>;
    },
    create: async (payload: Record<string, unknown>) => {
      return (await api.accounts.rolePermissions.create(payload)) as RolePermission;
    },
    update: async (id: number, payload: Record<string, unknown>) => {
      return (await api.accounts.rolePermissions.update(id, payload)) as RolePermission;
    },
    remove: async (id: number) => api.accounts.rolePermissions.remove(id),
  },
  schools: {
    list: async (params?: { search?: string; page?: number; page_size?: number }) => {
      return (await api.institutions.schools.list(params)) as Paginated<SchoolOption>;
    },
  },
};
