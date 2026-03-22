import { apiSlice } from "@/app/apiSlice";
import type { Paginated, StudentIdPolicy, StudentRow } from "./studentTypes";

export const studentsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getStudents: builder.query<
      Paginated<StudentRow>,
      { search?: string; page?: number; page_size?: number }
    >({
      query: (params) => ({ url: `/api/students/students/`, params }),
      providesTags: (result) =>
        result?.results
          ? [
              ...result.results.map(({ id }) => ({ type: "Students" as const, id })),
              { type: "Students", id: "LIST" },
            ]
          : [{ type: "Students", id: "LIST" }],
    }),
    createStudent: builder.mutation<StudentRow, Partial<StudentRow>>({
      query: (payload) => ({
        url: `/api/students/students/`,
        method: "POST",
        data: payload,
      }),
      invalidatesTags: [{ type: "Students", id: "LIST" }],
    }),
    getCurrentPolicy: builder.query<StudentIdPolicy, void>({
      query: () => ({ url: `/api/students/student-id-policies/current/` }),
      providesTags: ["StudentPolicy"],
    }),
    updateCurrentPolicy: builder.mutation<StudentIdPolicy, Partial<StudentIdPolicy>>({
      query: (payload) => ({
        url: `/api/students/student-id-policies/current/`,
        method: "PATCH",
        data: payload,
      }),
      invalidatesTags: ["StudentPolicy"],
    }),
    getStudentTranscript: builder.query<any, number>({
      query: (studentPk) => ({ url: `/api/students/students/${studentPk}/transcript/` }),
      providesTags: (result, error, id) => [{ type: "Students", id: `Transcript_${id}` }],
    }),
    getStudentAttendanceSummary: builder.query<any, number>({
      query: (studentPk) => ({ url: `/api/students/students/${studentPk}/attendance-summary/` }),
      providesTags: (result, error, id) => [{ type: "Students", id: `Attendance_${id}` }],
    }),
    getStudentFeeSummary: builder.query<any, number>({
      query: (studentPk) => ({ url: `/api/students/students/${studentPk}/fee-summary/` }),
      providesTags: (result, error, id) => [{ type: "Students", id: `Fee_${id}` }],
    }),
    getStudentGuardians: builder.query<Paginated<any>, { search?: string; page_size?: number }>({
      query: (params) => ({ url: `/api/students/student-guardians/`, params }),
      providesTags: ["Students"],
    }),
    getStudentDocuments: builder.query<Paginated<any>, { search?: string; page_size?: number }>({
      query: (params) => ({ url: `/api/students/student-documents/`, params }),
      providesTags: ["Students"],
    }),
    getStudentYearEnrollments: builder.query<Paginated<any>, { search?: string; page_size?: number }>({
      query: (params) => ({ url: `/api/students/student-year-enrollments/`, params }),
      providesTags: ["Students"],
    }),
    getDisciplinaryRecords: builder.query<Paginated<any>, { search?: string; page_size?: number }>({
      query: (params) => ({ url: `/api/students/disciplinary-records/`, params }),
      providesTags: ["Students"],
    }),
    getStudentAchievements: builder.query<Paginated<any>, { search?: string; page_size?: number }>({
      query: (params) => ({ url: `/api/students/student-achievements/`, params }),
      providesTags: ["Students"],
    }),
  }),
});

export const {
  useGetStudentsQuery,
  useCreateStudentMutation,
  useGetCurrentPolicyQuery,
  useUpdateCurrentPolicyMutation,
  useGetStudentTranscriptQuery,
  useGetStudentAttendanceSummaryQuery,
  useGetStudentFeeSummaryQuery,
  useGetStudentGuardiansQuery,
  useGetStudentDocumentsQuery,
  useGetStudentYearEnrollmentsQuery,
  useGetDisciplinaryRecordsQuery,
  useGetStudentAchievementsQuery,
} = studentsApiSlice;
