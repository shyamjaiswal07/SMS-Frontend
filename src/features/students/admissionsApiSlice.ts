import { apiSlice } from "@/app/apiSlice";
import type { AdmissionWorkflowState } from "./studentTypes";
import type { AdmissionApplicationRow, AdmissionWorkflowTransitionRow } from "@/pages/Database/utils";

type Paginated<T> = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
};

export const admissionsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAdmissions: builder.query<
      Paginated<AdmissionApplicationRow>,
      { search?: string; page?: number; page_size?: number }
    >({
      query: (params) => ({ url: `/api/students/admission-applications/`, params }),
      providesTags: (result) =>
        result?.results
          ? [
              ...result.results.map(({ id }) => ({ type: "Admissions" as const, id })),
              { type: "Admissions", id: "LIST" },
            ]
          : [{ type: "Admissions", id: "LIST" }],
    }),
    getWorkflowHistory: builder.query<AdmissionWorkflowTransitionRow[], number>({
      query: (applicationPk) => ({
        url: `/api/students/admission-applications/${applicationPk}/workflow-history/`,
      }),
      providesTags: (result, error, applicationPk) => [{ type: "Admissions", id: `History_${applicationPk}` }],
    }),
    submitAdmission: builder.mutation<AdmissionApplicationRow, number>({
      query: (applicationPk) => ({
        url: `/api/students/admission-applications/${applicationPk}/submit/`,
        method: "POST",
      }),
      invalidatesTags: (result, error, applicationPk) => [
        { type: "Admissions", id: applicationPk },
        { type: "Admissions", id: `History_${applicationPk}` },
      ],
    }),
    startReview: builder.mutation<AdmissionApplicationRow, { id: number; notes?: string }>({
      query: ({ id, notes }) => ({
        url: `/api/students/admission-applications/${id}/start-review/`,
        method: "POST",
        data: { notes },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Admissions", id },
        { type: "Admissions", id: `History_${id}` },
      ],
    }),
    approveAdmission: builder.mutation<AdmissionApplicationRow, { id: number; notes?: string }>({
      query: ({ id, notes }) => ({
        url: `/api/students/admission-applications/${id}/approve/`,
        method: "POST",
        data: { notes },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Admissions", id },
        { type: "Admissions", id: `History_${id}` },
      ],
    }),
    rejectAdmission: builder.mutation<AdmissionApplicationRow, { id: number; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/api/students/admission-applications/${id}/reject/`,
        method: "POST",
        data: { reason },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Admissions", id },
        { type: "Admissions", id: `History_${id}` },
      ],
    }),
    convertAdmission: builder.mutation<
      {
        admission_id: number;
        student_id: string;
        student_pk: number;
        workflow_state: AdmissionWorkflowState;
        enrollment_created: boolean;
      },
      { id: number; admission_number?: string; student_id?: string; metadata_json?: Record<string, unknown> }
    >({
      query: ({ id, ...payload }) => ({
        url: `/api/students/admission-applications/${id}/convert/`,
        method: "POST",
        data: payload,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Admissions", id },
        { type: "Admissions", id: `History_${id}` },
      ],
    }),
  }),
});

export const {
  useGetAdmissionsQuery,
  useGetWorkflowHistoryQuery,
  useSubmitAdmissionMutation,
  useStartReviewMutation,
  useApproveAdmissionMutation,
  useRejectAdmissionMutation,
  useConvertAdmissionMutation,
} = admissionsApiSlice;
