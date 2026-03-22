import { apiSlice } from "@/app/apiSlice";
import type {
  BookCategoryRow,
  BookIssueRow,
  BookReservationRow,
  BookRow,
  LibraryAnalytics,
  LibraryMemberRow,
  OverdueReport,
  Paginated,
  QueryParams,
} from "./libraryTypes";

export const libraryApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBookCategories: builder.query<Paginated<BookCategoryRow>, QueryParams>({
      query: (params) => ({ url: "/api/library/book-categories/", params }),
    }),
    getBooks: builder.query<Paginated<BookRow>, QueryParams>({
      query: (params) => ({ url: "/api/library/books/", params }),
    }),
    getLibraryMembers: builder.query<Paginated<LibraryMemberRow>, QueryParams>({
      query: (params) => ({ url: "/api/library/library-members/", params }),
    }),
    getBookIssues: builder.query<Paginated<BookIssueRow>, QueryParams>({
      query: (params) => ({ url: "/api/library/book-issues/", params }),
    }),
    getBookReservations: builder.query<Paginated<BookReservationRow>, QueryParams>({
      query: (params) => ({ url: "/api/library/book-reservations/", params }),
    }),
    getLibraryAnalytics: builder.query<LibraryAnalytics, void>({
      query: () => ({ url: "/api/library/book-issues/analytics/" }),
    }),
    getOverdueBookIssues: builder.query<OverdueReport, QueryParams>({
      query: (params) => ({ url: "/api/library/book-issues/overdue-report/", params }),
    }),
  }),
});

export const {
  useGetBookCategoriesQuery,
  useGetBooksQuery,
  useGetLibraryMembersQuery,
  useGetBookIssuesQuery,
  useGetBookReservationsQuery,
  useGetLibraryAnalyticsQuery,
  useGetOverdueBookIssuesQuery,
} = libraryApiSlice;
