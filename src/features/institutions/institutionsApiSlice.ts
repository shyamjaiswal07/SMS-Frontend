import { apiSlice } from "@/app/apiSlice";
import type {
  AcademicYearRow,
  DepartmentRow,
  GradeLevelRow,
  Paginated,
  QueryParams,
  RoomRow,
  SchoolRow,
  SectionRow,
  SubjectRow,
  SubscriptionPlanRow,
  TenantDomainRow,
  TenantSubscriptionRow,
  TermRow,
} from "./institutionsTypes";

export const institutionsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSchools: builder.query<Paginated<SchoolRow>, QueryParams>({
      query: (params) => ({ url: "/api/institutions/schools/", params }),
    }),
    getTenantDomains: builder.query<Paginated<TenantDomainRow>, QueryParams>({
      query: (params) => ({ url: "/api/institutions/tenant-domains/", params }),
    }),
    getSubscriptionPlans: builder.query<Paginated<SubscriptionPlanRow>, QueryParams>({
      query: (params) => ({ url: "/api/institutions/subscription-plans/", params }),
    }),
    getTenantSubscriptions: builder.query<Paginated<TenantSubscriptionRow>, QueryParams>({
      query: (params) => ({ url: "/api/institutions/tenant-subscriptions/", params }),
    }),
    getAcademicYears: builder.query<Paginated<AcademicYearRow>, QueryParams>({
      query: (params) => ({ url: "/api/institutions/academic-years/", params }),
    }),
    getTerms: builder.query<Paginated<TermRow>, QueryParams>({
      query: (params) => ({ url: "/api/institutions/terms/", params }),
    }),
    getDepartments: builder.query<Paginated<DepartmentRow>, QueryParams>({
      query: (params) => ({ url: "/api/institutions/departments/", params }),
    }),
    getSections: builder.query<Paginated<SectionRow>, QueryParams>({
      query: (params) => ({ url: "/api/institutions/sections/", params }),
    }),
    getGradeLevels: builder.query<Paginated<GradeLevelRow>, QueryParams>({
      query: (params) => ({ url: "/api/institutions/grade-levels/", params }),
    }),
    getSubjects: builder.query<Paginated<SubjectRow>, QueryParams>({
      query: (params) => ({ url: "/api/institutions/subjects/", params }),
    }),
    getRooms: builder.query<Paginated<RoomRow>, QueryParams>({
      query: (params) => ({ url: "/api/institutions/rooms/", params }),
    }),
  }),
});

export const {
  useGetSchoolsQuery,
  useGetTenantDomainsQuery,
  useGetSubscriptionPlansQuery,
  useGetTenantSubscriptionsQuery,
  useGetAcademicYearsQuery,
  useGetTermsQuery,
  useGetDepartmentsQuery,
  useGetSectionsQuery,
  useGetGradeLevelsQuery,
  useGetSubjectsQuery,
  useGetRoomsQuery,
} = institutionsApiSlice;
