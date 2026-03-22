import { apiSlice } from "@/app/apiSlice";
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

export const academicsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPrograms: builder.query<Paginated<ProgramRow>, { search?: string; page?: number; page_size?: number }>({
      query: (params) => ({ url: `/api/academics/programs/`, params }),
    }),
    getCourses: builder.query<Paginated<CourseRow>, { search?: string; page?: number; page_size?: number }>({
      query: (params) => ({ url: `/api/academics/courses/`, params }),
    }),
    getCoursePrerequisites: builder.query<Paginated<CoursePrerequisiteRow>, { search?: string; page?: number; page_size?: number }>({
      query: (params) => ({ url: `/api/academics/course-prerequisites/`, params }),
    }),
    getClassSchedules: builder.query<Paginated<ClassScheduleRow>, { search?: string; page?: number; page_size?: number }>({
      query: (params) => ({ url: `/api/academics/class-schedules/`, params }),
    }),
    getCourseEnrollments: builder.query<any, { search?: string; page?: number; page_size?: number }>({
      query: (params) => ({ url: `/api/academics/course-enrollments/`, params }),
    }),
    getAssessments: builder.query<Paginated<AssessmentRow>, { search?: string; page?: number; page_size?: number }>({
      query: (params) => ({ url: `/api/academics/assessments/`, params }),
    }),
    getAssessmentResults: builder.query<Paginated<AssessmentResultRow>, { search?: string; page?: number; page_size?: number }>({
      query: (params) => ({ url: `/api/academics/assessment-results/`, params }),
    }),
    getAttendanceSessions: builder.query<Paginated<AttendanceSessionRow>, { search?: string; page?: number; page_size?: number }>({
      query: (params) => ({ url: `/api/academics/attendance-sessions/`, params }),
    }),
    getAttendanceRecords: builder.query<Paginated<AttendanceRecordRow>, { search?: string; page?: number; page_size?: number }>({
      query: (params) => ({ url: `/api/academics/attendance-records/`, params }),
    }),
  }),
});

export const {
  useGetProgramsQuery,
  useGetCoursesQuery,
  useGetCoursePrerequisitesQuery,
  useGetClassSchedulesQuery,
  useGetCourseEnrollmentsQuery,
  useGetAssessmentsQuery,
  useGetAssessmentResultsQuery,
  useGetAttendanceSessionsQuery,
  useGetAttendanceRecordsQuery,
} = academicsApiSlice;
