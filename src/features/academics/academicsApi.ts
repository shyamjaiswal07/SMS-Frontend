import apiClient from "@/services/apiClient";
import type {
  AssessmentResultRow,
  AssessmentRow,
  AttendanceRecordRow,
  AttendanceSessionRow,
  ClassScheduleRow,
  CoursePrerequisiteRow,
  CourseRow,
  Paginated,
  ProgramRow,
} from "./academicsTypes";

export const academicsApi = {
  programs: {
    list: async (params?: { search?: string; page?: number; page_size?: number }) => {
      const res = await apiClient.get<Paginated<ProgramRow>>(`/api/academics/programs/`, { params });
      return res.data;
    },
  },
  courses: {
    list: async (params?: { search?: string; page?: number; page_size?: number }) => {
      const res = await apiClient.get<Paginated<CourseRow>>(`/api/academics/courses/`, { params });
      return res.data;
    },
  },
  coursePrerequisites: {
    list: async (params?: { search?: string; page?: number; page_size?: number }) => {
      const res = await apiClient.get<Paginated<CoursePrerequisiteRow>>(`/api/academics/course-prerequisites/`, { params });
      return res.data;
    },
  },
  classSchedules: {
    list: async (params?: { search?: string; page?: number; page_size?: number }) => {
      const res = await apiClient.get<Paginated<ClassScheduleRow>>(`/api/academics/class-schedules/`, { params });
      return res.data;
    },
  },
  courseEnrollments: {
    list: async (params?: { search?: string; page?: number; page_size?: number }) => {
      const res = await apiClient.get(`/api/academics/course-enrollments/`, { params });
      return res.data;
    },
  },
  assessments: {
    list: async (params?: { search?: string; page?: number; page_size?: number }) => {
      const res = await apiClient.get<Paginated<AssessmentRow>>(`/api/academics/assessments/`, { params });
      return res.data;
    },
  },
  assessmentResults: {
    list: async (params?: { search?: string; page?: number; page_size?: number }) => {
      const res = await apiClient.get<Paginated<AssessmentResultRow>>(
        `/api/academics/assessment-results/`,
        { params }
      );
      return res.data;
    },
  },
  attendanceSessions: {
    list: async (params?: { search?: string; page?: number; page_size?: number }) => {
      const res = await apiClient.get<Paginated<AttendanceSessionRow>>(`/api/academics/attendance-sessions/`, { params });
      return res.data;
    },
  },
  attendanceRecords: {
    list: async (params?: { search?: string; page?: number; page_size?: number }) => {
      const res = await apiClient.get<Paginated<AttendanceRecordRow>>(`/api/academics/attendance-records/`, { params });
      return res.data;
    },
  },
};

