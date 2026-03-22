import { apiSlice } from "@/app/apiSlice";

type Paginated<T> = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
};

type QueryParams = {
  search?: string;
  page?: number;
  page_size?: number;
};

export type StaffProfileReference = {
  id: number;
  employee_code?: string;
  first_name?: string;
  last_name?: string;
};

export const hrApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getStaffProfiles: builder.query<Paginated<StaffProfileReference>, QueryParams>({
      query: (params) => ({ url: "/api/hr/staff-profiles/", params }),
    }),
  }),
});

export const { useGetStaffProfilesQuery } = hrApiSlice;
