export type Paginated<T> = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
};

export type QueryParams = {
  search?: string;
  page?: number;
  page_size?: number;
  due_before?: string;
};

export type BookCategoryRow = {
  id: number;
  name?: string;
  code?: string;
};

export type BookRow = {
  id: number;
  category?: number | null;
  isbn?: string;
  title?: string;
  author?: string;
  publisher?: string;
  publish_year?: number | null;
  language?: string;
  edition?: string;
  shelf_location?: string;
  total_copies?: number;
  available_copies?: number;
};

export type LibraryMemberRow = {
  id: number;
  user?: number | null;
  student?: number | null;
  staff?: number | null;
  member_code?: string;
  member_type?: string;
};

export type BookIssueRow = {
  id: number;
  book?: number;
  member?: number;
  issue_date?: string;
  due_date?: string;
  return_date?: string | null;
  status?: string;
  late_fee?: number | string;
};

export type BookReservationRow = {
  id: number;
  book?: number;
  member?: number;
  reserved_on?: string;
  expires_on?: string;
  status?: string;
};

export type LibraryAnalytics = {
  start_date?: string;
  end_date?: string;
  summary?: Record<string, unknown>;
  daily_trends?: Array<Record<string, unknown>>;
  top_books?: Array<Record<string, unknown>>;
  member_type_breakdown?: Array<Record<string, unknown>>;
};

export type OverdueReport = {
  count?: number;
  results?: Array<Record<string, unknown>>;
};
