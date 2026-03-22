import {
  useGetBookCategoriesQuery,
  useGetBookIssuesQuery,
  useGetBookReservationsQuery,
  useGetBooksQuery,
  useGetLibraryMembersQuery,
} from "./libraryApiSlice";
import type { BookCategoryRow, BookIssueRow, BookReservationRow, BookRow, LibraryMemberRow } from "./libraryTypes";
import { rowsOf } from "@/utils/platform";

export function useLibraryWorkspace() {
  const categoriesQuery = useGetBookCategoriesQuery({ page: 1, page_size: 200 });
  const booksQuery = useGetBooksQuery({ page: 1, page_size: 200 });
  const membersQuery = useGetLibraryMembersQuery({ page: 1, page_size: 200 });
  const issuesQuery = useGetBookIssuesQuery({ page: 1, page_size: 200 });
  const reservationsQuery = useGetBookReservationsQuery({ page: 1, page_size: 200 });

  const loading = [categoriesQuery, booksQuery, membersQuery, issuesQuery, reservationsQuery].some((query) => query.isFetching);

  return {
    categories: rowsOf(categoriesQuery.data) as BookCategoryRow[],
    books: rowsOf(booksQuery.data) as BookRow[],
    members: rowsOf(membersQuery.data) as LibraryMemberRow[],
    issues: rowsOf(issuesQuery.data) as BookIssueRow[],
    reservations: rowsOf(reservationsQuery.data) as BookReservationRow[],
    loading,
    async refetchAll() {
      await Promise.all([
        categoriesQuery.refetch(),
        booksQuery.refetch(),
        membersQuery.refetch(),
        issuesQuery.refetch(),
        reservationsQuery.refetch(),
      ]);
    },
  };
}
