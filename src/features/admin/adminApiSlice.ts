import { apiSlice } from "@/app/apiSlice";
import type {
  AdminMembership,
  AdminUser,
  LoginAudit,
  Paginated,
  RolePermission,
  SchoolOption,
  TenantSummary,
} from "./adminTypes";

export const adminApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAdminUsers: builder.query<
      Paginated<AdminUser>,
      { search?: string; page?: number; page_size?: number }
    >({
      query: (params) => ({ url: `/api/accounts/users/`, params }),
      providesTags: (result) =>
        result?.results
          ? [
              ...result.results.map(({ id }) => ({ type: "AdminUsers" as const, id })),
              { type: "AdminUsers", id: "LIST" },
            ]
          : [{ type: "AdminUsers", id: "LIST" }],
    }),
    createAdminUser: builder.mutation<AdminUser, Record<string, unknown>>({
      query: (payload) => ({
        url: `/api/accounts/users/`,
        method: "POST",
        data: payload,
      }),
      invalidatesTags: [{ type: "AdminUsers", id: "LIST" }],
    }),
    updateAdminUser: builder.mutation<AdminUser, { id: number; payload: Record<string, unknown> }>({
      query: ({ id, payload }) => ({
        url: `/api/accounts/users/${id}/`,
        method: "PATCH",
        data: payload,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "AdminUsers", id }],
    }),
    deleteAdminUser: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/accounts/users/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "AdminUsers", id: "LIST" }],
    }),
    bulkImportAdminUsers: builder.mutation<{ created: number; skipped: number }, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: `/api/accounts/users/bulk-import/`,
          method: "POST",
          data: formData,
        };
      },
      invalidatesTags: [{ type: "AdminUsers", id: "LIST" }],
    }),

    getMemberships: builder.query<
      Paginated<AdminMembership>,
      { search?: string; page?: number; page_size?: number }
    >({
      query: (params) => ({ url: `/api/accounts/memberships/`, params }),
      providesTags: (result) =>
        result?.results
          ? [
              ...result.results.map(({ id }) => ({ type: "AdminMemberships" as const, id })),
              { type: "AdminMemberships", id: "LIST" },
            ]
          : [{ type: "AdminMemberships", id: "LIST" }],
    }),
    createMembership: builder.mutation<AdminMembership, Record<string, unknown>>({
      query: (payload) => ({
        url: `/api/accounts/memberships/`,
        method: "POST",
        data: payload,
      }),
      invalidatesTags: [{ type: "AdminMemberships", id: "LIST" }],
    }),
    updateMembership: builder.mutation<AdminMembership, { id: number; payload: Record<string, unknown> }>({
      query: ({ id, payload }) => ({
        url: `/api/accounts/memberships/${id}/`,
        method: "PATCH",
        data: payload,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "AdminMemberships", id }],
    }),
    deleteMembership: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/accounts/memberships/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "AdminMemberships", id: "LIST" }],
    }),
    getMyTenants: builder.query<TenantSummary[], void>({
      query: () => ({ url: `/api/accounts/memberships/my-tenants/` }),
      providesTags: ["AdminMemberships"],
    }),

    getLoginAudits: builder.query<Paginated<LoginAudit>, { search?: string; page?: number; page_size?: number }>({
      query: (params) => ({ url: `/api/accounts/login-audits/`, params }),
      providesTags: ["AdminAudits"],
    }),

    getRolePermissions: builder.query<
      Paginated<RolePermission>,
      { search?: string; page?: number; page_size?: number }
    >({
      query: (params) => ({ url: `/api/accounts/role-permissions/`, params }),
      providesTags: (result) =>
        result?.results
          ? [
              ...result.results.map(({ id }) => ({ type: "RolePermissions" as const, id })),
              { type: "RolePermissions", id: "LIST" },
            ]
          : [{ type: "RolePermissions", id: "LIST" }],
    }),
    createRolePermission: builder.mutation<RolePermission, Record<string, unknown>>({
      query: (payload) => ({
        url: `/api/accounts/role-permissions/`,
        method: "POST",
        data: payload,
      }),
      invalidatesTags: [{ type: "RolePermissions", id: "LIST" }],
    }),
    updateRolePermission: builder.mutation<RolePermission, { id: number; payload: Record<string, unknown> }>({
      query: ({ id, payload }) => ({
        url: `/api/accounts/role-permissions/${id}/`,
        method: "PATCH",
        data: payload,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "RolePermissions", id }],
    }),
    deleteRolePermission: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/accounts/role-permissions/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "RolePermissions", id: "LIST" }],
    }),

    getSchoolsOptions: builder.query<
      Paginated<SchoolOption>,
      { search?: string; page?: number; page_size?: number }
    >({
      query: (params) => ({ url: `/api/institutions/schools/`, params }),
      providesTags: ["Schools"],
    }),
  }),
});

export const {
  useGetAdminUsersQuery,
  useCreateAdminUserMutation,
  useUpdateAdminUserMutation,
  useDeleteAdminUserMutation,
  useBulkImportAdminUsersMutation,

  useGetMembershipsQuery,
  useCreateMembershipMutation,
  useUpdateMembershipMutation,
  useDeleteMembershipMutation,
  useGetMyTenantsQuery,

  useGetLoginAuditsQuery,

  useGetRolePermissionsQuery,
  useCreateRolePermissionMutation,
  useUpdateRolePermissionMutation,
  useDeleteRolePermissionMutation,

  useGetSchoolsOptionsQuery,
} = adminApiSlice;
