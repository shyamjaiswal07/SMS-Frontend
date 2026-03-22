import { apiSlice } from "@/app/apiSlice";

type Paginated<T> = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
};

type NamedOption = {
  id: number;
  name?: string;
};

type QueryParams = {
  search?: string;
  page?: number;
  page_size?: number;
};

export const institutionsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAcademicYears: builder.query<Paginated<NamedOption>, QueryParams>({
      query: (params) => ({ url: "/api/institutions/academic-years/", params }),
    }),
    getTerms: builder.query<Paginated<NamedOption>, QueryParams>({
      query: (params) => ({ url: "/api/institutions/terms/", params }),
    }),
    getDepartments: builder.query<Paginated<NamedOption>, QueryParams>({
      query: (params) => ({ url: "/api/institutions/departments/", params }),
    }),
    getSections: builder.query<Paginated<NamedOption>, QueryParams>({
      query: (params) => ({ url: "/api/institutions/sections/", params }),
    }),
    getGradeLevels: builder.query<Paginated<NamedOption>, QueryParams>({
      query: (params) => ({ url: "/api/institutions/grade-levels/", params }),
    }),
  }),
});

export const {
  useGetAcademicYearsQuery,
  useGetTermsQuery,
  useGetDepartmentsQuery,
  useGetSectionsQuery,
  useGetGradeLevelsQuery,
} = institutionsApiSlice;
