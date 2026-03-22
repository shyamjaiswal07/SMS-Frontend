import { apiSlice } from "@/app/apiSlice";
import type {
  AnalyticsDateRangeParams,
  AnalyticsModuleKey,
  AnalyticsModuleResponse,
  AnalyticsOverviewResponse,
} from "./analyticsTypes";

export const analyticsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAnalyticsOverview: builder.query<AnalyticsOverviewResponse, AnalyticsDateRangeParams | void>({
      query: (params) => ({ url: "/api/common/analytics/overview/", params }),
      providesTags: ["Analytics"],
    }),
    getAnalyticsModule: builder.query<
      AnalyticsModuleResponse,
      { moduleKey: AnalyticsModuleKey; params?: AnalyticsDateRangeParams }
    >({
      query: ({ moduleKey, params }) => ({ url: `/api/common/analytics/${moduleKey}/`, params }),
      providesTags: (result, error, { moduleKey }) => [{ type: "Analytics", id: moduleKey }],
    }),
  }),
});

export const { useGetAnalyticsOverviewQuery, useGetAnalyticsModuleQuery } = analyticsApiSlice;
