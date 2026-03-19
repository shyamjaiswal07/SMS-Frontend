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

export const api = {
  login: async (email: string, password: string, tenantCode?: string) => {
    const response = await axios.post<LoginResponse>(`${apiEndpoint.BaseUrl}/api/auth/token/`, {
      email,
      password,
      tenant_code: tenantCode ?? "",
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
  forgotpassword: async (email: string) => {
    const response = await axios.post(`${apiEndpoint.BaseUrl}/forgot-password/`, {
      email,
    });
    return response.data;
  },

  students: {
    list: async (params?: { search?: string; page?: number; page_size?: number }) => {
      const response = await apiClient.get(`/api/students/students/`, { params });
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

};

