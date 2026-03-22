import { apiSlice } from "@/app/apiSlice";
import type { Paginated } from "@/features/admin/adminTypes";

type PasswordResetAudit = {
  id: number;
  user?: number | null;
  email_attempted: string;
  ip_address?: string | null;
  user_agent?: string;
  token_sent: boolean;
  reset_completed: boolean;
  failure_reason?: string;
  created_at?: string;
};

type TwoFactorStatus = {
  user?: number;
  method?: string;
  is_enabled?: boolean;
  is_verified?: boolean;
  last_verified_at?: string | null;
};

type TwoFactorEnrollmentPayload = {
  method?: string;
};

type TwoFactorEnrollmentResponse = {
  bootstrap_secret?: string;
  verification_hint?: string;
  method?: string;
  is_enabled?: boolean;
  is_verified?: boolean;
};

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPasswordResetAudits: builder.query<
      Paginated<PasswordResetAudit>,
      { search?: string; page?: number; page_size?: number }
    >({
      query: (params) => ({ url: "/api/accounts/password-reset-audits/", params }),
      providesTags: ["AuthSecurity"],
    }),
    getTwoFactorStatus: builder.query<TwoFactorStatus, void>({
      query: () => ({ url: "/api/accounts/two-factor/" }),
      providesTags: ["AuthSecurity"],
    }),
    enrollTwoFactor: builder.mutation<TwoFactorEnrollmentResponse, TwoFactorEnrollmentPayload | void>({
      query: (payload) => ({
        url: "/api/accounts/two-factor/",
        method: "POST",
        data: payload ?? {},
      }),
      invalidatesTags: ["AuthSecurity"],
    }),
    verifyTwoFactor: builder.mutation<Record<string, unknown>, string>({
      query: (verification_code) => ({
        url: "/api/accounts/two-factor/verify/",
        method: "POST",
        data: { verification_code },
      }),
      invalidatesTags: ["AuthSecurity"],
    }),
    disableTwoFactor: builder.mutation<Record<string, unknown>, void>({
      query: () => ({
        url: "/api/accounts/two-factor/",
        method: "DELETE",
      }),
      invalidatesTags: ["AuthSecurity"],
    }),
  }),
});

export const {
  useGetPasswordResetAuditsQuery,
  useGetTwoFactorStatusQuery,
  useEnrollTwoFactorMutation,
  useVerifyTwoFactorMutation,
  useDisableTwoFactorMutation,
} = authApiSlice;
