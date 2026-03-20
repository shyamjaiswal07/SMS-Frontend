/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { apiEndpoint } from "../appConfig";
import apiClient from "./apiClient";

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

export const api = {
  login: async (email: string, password: string, tenantCode?: string, twoFactorCode?: string) => {
    const response = await axios.post<LoginResponse>(`${apiEndpoint.BaseUrl}/api/auth/token/`, {
      email,
      password,
      tenant_code: tenantCode ?? "",
      two_factor_code: twoFactorCode ?? "",
    });
    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await axios.post(`${apiEndpoint.BaseUrl}/api/auth/token/refresh/`, {
      refresh: refreshToken,
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
  lotDetails: async (formData: FormData) => {
    const response = await apiClient.post(`/api/upload/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
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

  students: {
    list: async (params?: { search?: string; page?: number; page_size?: number }) => {
      const response = await apiClient.get(`/api/students/students/`, { params });
      return response.data;
    },
    create: async (payload: Record<string, unknown>) => {
      const response = await apiClient.post(`/api/students/students/`, payload);
      return response.data;
    },
    transcript: async (studentPk: number) => {
      const response = await apiClient.get(`/api/students/students/${studentPk}/transcript/`);
      return response.data;
    },
    attendanceSummary: async (studentPk: number) => {
      const response = await apiClient.get(`/api/students/students/${studentPk}/attendance-summary/`);
      return response.data;
    },
    feeSummary: async (studentPk: number) => {
      const response = await apiClient.get(`/api/students/students/${studentPk}/fee-summary/`);
      return response.data;
    },

    admissions: {
      list: async (params?: { search?: string; page?: number; page_size?: number }) => {
        const response = await apiClient.get(`/api/students/admission-applications/`, { params });
        return response.data;
      },
      updateStatus: async (applicationPk: number, status: string) => {
        const response = await apiClient.patch(`/api/students/admission-applications/${applicationPk}/`, { status });
        return response.data;
      },
      submit: async (applicationPk: number) => {
        const response = await apiClient.post(`/api/students/admission-applications/${applicationPk}/submit/`, {});
        return response.data;
      },
      startReview: async (applicationPk: number, payload?: { notes?: string }) => {
        const response = await apiClient.post(`/api/students/admission-applications/${applicationPk}/start-review/`, payload ?? {});
        return response.data;
      },
      approve: async (applicationPk: number, payload?: { notes?: string }) => {
        const response = await apiClient.post(`/api/students/admission-applications/${applicationPk}/approve/`, payload ?? {});
        return response.data;
      },
      reject: async (applicationPk: number, payload: { reason: string }) => {
        const response = await apiClient.post(`/api/students/admission-applications/${applicationPk}/reject/`, payload);
        return response.data;
      },
      convert: async (
        applicationPk: number,
        payload?: { admission_number?: string; student_id?: string; metadata_json?: Record<string, unknown> },
      ) => {
        const response = await apiClient.post(`/api/students/admission-applications/${applicationPk}/convert/`, payload ?? {});
        return response.data;
      },
      workflowHistory: async (applicationPk: number) => {
        const response = await apiClient.get(`/api/students/admission-applications/${applicationPk}/workflow-history/`);
        return response.data;
      },
    },
    studentIdPolicies: {
      current: async () => {
        const response = await apiClient.get(`/api/students/student-id-policies/current/`);
        return response.data;
      },
      updateCurrent: async (payload: Record<string, unknown>) => {
        const response = await apiClient.patch(`/api/students/student-id-policies/current/`, payload);
        return response.data;
      },
    },

    guardians: {
      list: async (params?: { search?: string; page?: number; page_size?: number }) => {
        const response = await apiClient.get(`/api/students/guardians/`, { params });
        return response.data;
      },
    },
    studentGuardians: {
      list: async (params?: { search?: string; page?: number; page_size?: number }) => {
        const response = await apiClient.get(`/api/students/student-guardians/`, { params });
        return response.data;
      },
    },
    studentDocuments: {
      list: async (params?: { search?: string; page?: number; page_size?: number }) => {
        const response = await apiClient.get(`/api/students/student-documents/`, { params });
        return response.data;
      },
    },
    studentYearEnrollments: {
      list: async (params?: { search?: string; page?: number; page_size?: number }) => {
        const response = await apiClient.get(`/api/students/student-year-enrollments/`, { params });
        return response.data;
      },
    },
    disciplinaryRecords: {
      list: async (params?: { search?: string; page?: number; page_size?: number }) => {
        const response = await apiClient.get(`/api/students/disciplinary-records/`, { params });
        return response.data;
      },
    },
    studentAchievements: {
      list: async (params?: { search?: string; page?: number; page_size?: number }) => {
        const response = await apiClient.get(`/api/students/student-achievements/`, { params });
        return response.data;
      },
    },
  },

  accounts: {
    twoFactor: {
      status: async () => {
        const response = await apiClient.get(`/api/accounts/two-factor/`);
        return response.data;
      },
      enroll: async (payload?: { method?: string }) => {
        const response = await apiClient.post(`/api/accounts/two-factor/`, payload ?? {});
        return response.data;
      },
      verify: async (verification_code: string) => {
        const response = await apiClient.post(`/api/accounts/two-factor/verify/`, { verification_code });
        return response.data;
      },
      disable: async () => {
        const response = await apiClient.delete(`/api/accounts/two-factor/`);
        return response.data;
      },
    },
    users: {
      list: async (params?: { search?: string; page?: number; page_size?: number }) => {
        const response = await apiClient.get(`/api/accounts/users/`, { params });
        return response.data;
      },
      create: async (payload: Record<string, unknown>) => {
        const response = await apiClient.post(`/api/accounts/users/`, payload);
        return response.data;
      },
      update: async (id: number, payload: Record<string, unknown>) => {
        const response = await apiClient.patch(`/api/accounts/users/${id}/`, payload);
        return response.data;
      },
      remove: async (id: number) => {
        const response = await apiClient.delete(`/api/accounts/users/${id}/`);
        return response.data;
      },
      bulkImport: async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        const response = await apiClient.post(`/api/accounts/users/bulk-import/`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        return response.data;
      },
    },
    memberships: {
      list: async (params?: { search?: string; page?: number; page_size?: number }) => {
        const response = await apiClient.get(`/api/accounts/memberships/`, { params });
        return response.data;
      },
      create: async (payload: Record<string, unknown>) => {
        const response = await apiClient.post(`/api/accounts/memberships/`, payload);
        return response.data;
      },
      update: async (id: number, payload: Record<string, unknown>) => {
        const response = await apiClient.patch(`/api/accounts/memberships/${id}/`, payload);
        return response.data;
      },
      remove: async (id: number) => {
        const response = await apiClient.delete(`/api/accounts/memberships/${id}/`);
        return response.data;
      },
      myTenants: async () => {
        const response = await apiClient.get(`/api/accounts/users/my-tenants/`);
        return response.data;
      },
    },
    loginAudits: {
      list: async (params?: { search?: string; page?: number; page_size?: number }) => {
        const response = await apiClient.get(`/api/accounts/login-audits/`, { params });
        return response.data;
      },
    },
    passwordResetAudits: {
      list: async (params?: { search?: string; page?: number; page_size?: number }) => {
        const response = await apiClient.get(`/api/accounts/password-reset-audits/`, { params });
        return response.data;
      },
    },
    rolePermissions: {
      list: async (params?: { search?: string; page?: number; page_size?: number }) => {
        const response = await apiClient.get(`/api/accounts/role-permissions/`, { params });
        return response.data;
      },
      create: async (payload: Record<string, unknown>) => {
        const response = await apiClient.post(`/api/accounts/role-permissions/`, payload);
        return response.data;
      },
      update: async (id: number, payload: Record<string, unknown>) => {
        const response = await apiClient.patch(`/api/accounts/role-permissions/${id}/`, payload);
        return response.data;
      },
      remove: async (id: number) => {
        const response = await apiClient.delete(`/api/accounts/role-permissions/${id}/`);
        return response.data;
      },
    },
  },
  institutions: {
    schools: {
      list: async (params?: { search?: string; page?: number; page_size?: number }) => {
        const response = await apiClient.get(`/api/institutions/schools/`, { params });
        return response.data;
      },
      get: async (id: number) => {
        const response = await apiClient.get(`/api/institutions/schools/${id}/`);
        return response.data;
      },
      update: async (id: number, payload: Record<string, unknown>) => {
        const response = await apiClient.patch(`/api/institutions/schools/${id}/`, payload);
        return response.data;
      },
    },
  },
};



