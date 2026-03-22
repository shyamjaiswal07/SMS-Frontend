import axios from "axios";
import { apiEndpoint } from "@/appConfig";

type TenantContext = {
  id: number;
  code: string;
  name: string;
  role: string;
};

type LoginResponse = {
  refresh: string;
  access: string;
  tenant?: TenantContext;
};

type PasswordResetConfirmPayload = {
  uid: string;
  token: string;
  new_password: string;
};

export const authApi = {
  login: async (email: string, password: string, tenantCode?: string, twoFactorCode?: string) => {
    const response = await axios.post<LoginResponse>(`${apiEndpoint.BaseUrl}/api/auth/token/`, {
      email,
      password,
      tenant_code: tenantCode ?? "",
      two_factor_code: twoFactorCode ?? "",
    });
    return response.data;
  },
  register: async (username: string, email: string, password: string) => {
    const response = await axios.post(`${apiEndpoint.BaseUrl}/register/`, {
      username,
      email,
      password,
    });
    return response.data;
  },
  passwordReset: {
    request: async (payload: { email: string; tenant_code?: string }) => {
      const response = await axios.post(`${apiEndpoint.BaseUrl}/api/auth/password-reset/request/`, payload);
      return response.data;
    },
    confirm: async (payload: PasswordResetConfirmPayload) => {
      const response = await axios.post(`${apiEndpoint.BaseUrl}/api/auth/password-reset/confirm/`, payload);
      return response.data;
    },
  },
};
