import { api } from "@/services/api";
import type { Paginated, StudentRow } from "./studentTypes";

export const studentApi = {
  listStudents: async (params?: { search?: string; page?: number; page_size?: number }) => {
    const data = await api.students.list(params);
    return data as Paginated<StudentRow>;
  },
  transcript: async (studentPk: number) => api.students.transcript(studentPk),
  attendanceSummary: async (studentPk: number) => api.students.attendanceSummary(studentPk),
  feeSummary: async (studentPk: number) => api.students.feeSummary(studentPk),

  studentGuardians: async (params?: { search?: string; page?: number; page_size?: number }) => api.students.studentGuardians.list(params),
  studentDocuments: async (params?: { search?: string; page?: number; page_size?: number }) => api.students.studentDocuments.list(params),
  studentYearEnrollments: async (params?: { search?: string; page?: number; page_size?: number }) =>
    api.students.studentYearEnrollments.list(params),
  disciplinaryRecords: async (params?: { search?: string; page?: number; page_size?: number }) => api.students.disciplinaryRecords.list(params),
  studentAchievements: async (params?: { search?: string; page?: number; page_size?: number }) => api.students.studentAchievements.list(params),
};

