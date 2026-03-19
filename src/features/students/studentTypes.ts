export type StudentStatus = "APPLICANT" | "ACTIVE" | "INACTIVE" | "GRADUATED" | "TRANSFERRED";

export type StudentRow = {
  id: number;
  student_id?: string;
  admission_number?: string;
  first_name?: string;
  last_name?: string;
  status?: StudentStatus | string;
  phone_number?: string;
  email?: string;
  date_of_birth?: string;
  admitted_on?: string | null;
};

export type Paginated<T> = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
};

export type StudentDrawerTabKey =
  | "transcript"
  | "attendance"
  | "fee"
  | "guardians"
  | "documents"
  | "enrollments"
  | "discipline"
  | "achievements";

